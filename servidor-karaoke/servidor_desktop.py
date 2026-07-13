import yt_dlp, logging, datetime, jwt, sqlite3, replicate, re, urllib.parse, requests, os, time, threading, webbrowser, sys, traceback, soundfile as sf
from dotenv import load_dotenv
from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
from werkzeug.utils import secure_filename
from werkzeug.security import generate_password_hash, check_password_hash
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
CORS(app)

# --- SISTEMA DE DEBUG GLOBAL DO EXECUTÁVEL ---
pasta_atual = os.getcwd()
caminho_log = os.path.join(pasta_atual, "log_gh_karaoke_pro.txt")

try:
    log_file = open(caminho_log, 'a', encoding='utf-8')
    log_file.write(f"\\n\\n=========================================\\n")
    log_file.write(f"🚀 TENTATIVA DE INÍCIO DESKTOP: {datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\\n")
    log_file.write(f"=========================================\\n")
    sys.stdout = log_file
    sys.stderr = log_file
except Exception:
    pass

# Variáveis Globais de Controle
SECRET_KEY = os.getenv("SECRET_KEY")
ultimo_ping = time.time()
DOWNLOAD_FOLDER = 'downloads'
os.makedirs(DOWNLOAD_FOLDER, exist_ok=True)

# Inicialização do Banco de Dados Local
def init_db():
    conn = sqlite3.connect('banco_karaoke.db')
    c = conn.cursor()
    c.execute('''
        CREATE TABLE IF NOT EXISTS usuarios (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            is_pro BOOLEAN NOT NULL CHECK (is_pro IN (0, 1))
        )
    ''')
    c.execute("SELECT * FROM usuarios WHERE username='georgehss'")
    if not c.fetchone():
        senha_criptografada = generate_password_hash('19191919')
        c.execute("INSERT INTO usuarios (username, password, is_pro) VALUES (?, ?, ?)", ('georgehss', senha_criptografada, 1))
        print("✅ Usuário administrador 'georgehss' inicializado localmente!")
    conn.commit()
    conn.close()

init_db()

# Configuração de tokens de APIs externas
FADR_API_KEY = os.getenv("FADR_API_KEY")
REPLICATE_API_TOKEN = os.getenv("REPLICATE_API_TOKEN")
if REPLICATE_API_TOKEN:
    os.environ["REPLICATE_API_TOKEN"] = REPLICATE_API_TOKEN

# ==========================================================
# ROTAS DE SERVIÇO DO FRONTEND E HEARTBEAT
# ==========================================================
@app.route('/heartbeat')
def heartbeat():
    global ultimo_ping
    ultimo_ping = time.time()
    return "ok", 200

@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def servir_frontend(path):
    # Verifica se o arquivo solicitado existe na pasta dist
    if path != "" and os.path.exists(os.path.join(app.root_path, 'dist', path)):
        return send_file(os.path.join(app.root_path, 'dist', path))
    
    # Entrega o index.html e injeta dinamicamente o script de Heartbeat
    index_path = os.path.join(app.root_path, 'dist', 'index.html')
    if os.path.exists(index_path):
        with open(index_path, 'r', encoding='utf-8') as f:
            conteudo = f.read()
        
        script_heartbeat = '''
        <script>
            setInterval(function() { fetch('/heartbeat').catch(function() {}); }, 2000);
        </script>
        '''
        conteudo = conteudo.replace('</body>', script_heartbeat + '</body>')
        return conteudo
        
    return "Pasta do frontend ('dist') não encontrada. Certifique-se de exportar o Expo.", 404

# ==========================================================
# ROTAS DE AUTENTICAÇÃO E API (PROJETO ATUAL)
# ==========================================================
@app.route('/api/register', methods=['POST'])
def registrar_usuario():
    dados = request.json
    username = dados.get('username')
    password = dados.get('password')
    is_pro = dados.get('is_pro', 1)

    if not username or not password:
        return jsonify({'erro': 'Usuário e senha são obrigatórios!'}), 400

    senha_hash = generate_password_hash(password)
    try:
        conn = sqlite3.connect('banco_karaoke.db')
        c = conn.cursor()
        c.execute("INSERT INTO usuarios (username, password, is_pro) VALUES (?, ?, ?)", (username, senha_hash, is_pro))
        conn.commit()
        conn.close()
        return jsonify({'sucesso': True, 'mensagem': f'Usuário {username} criado com sucesso!'})
    except sqlite3.IntegrityError:
        return jsonify({'erro': 'Este nome de usuário já existe.'}), 409

@app.route('/api/login', methods=['POST'])
def login():
    dados = request.json
    username = dados.get('username')
    password = dados.get('password')

    conn = sqlite3.connect('banco_karaoke.db')
    c = conn.cursor()
    c.execute("SELECT id, username, password, is_pro FROM usuarios WHERE username=?", (username,))
    user = c.fetchone()
    conn.close()

    if user and check_password_hash(user[2], password):
        token = jwt.encode({
            'id': user[0],
            'username': user[1],
            'exp': datetime.datetime.utcnow() + datetime.timedelta(days=7)
        }, SECRET_KEY, algorithm="HS256")

        return jsonify({
            'sucesso': True,
            'token': token,
            'user': {'id': str(user[0]), 'username': user[1], 'isPro': bool(user[3])}
        })
    return jsonify({'erro': 'Usuário ou senha inválidos!'}), 401

@app.route('/separar_replicate', methods=['POST'])
def separar_replicate():
    if 'audio' not in request.files:
        return jsonify({'sucesso': False, 'erro': 'Nenhum arquivo enviado'}), 400

    file = request.files['audio']
    nome_base = os.path.splitext(secure_filename(file.filename))[0]
    nome_limpo = f"{nome_base}_{int(time.time())}.mp3"
    
    caminho_local = os.path.join(DOWNLOAD_FOLDER, nome_limpo)
    file.save(caminho_local)

    try:
        prediction = replicate.predictions.create(
            version="5a7041cc9b82e5a558fea6b3d7b12dea89625e89da33f0447bd727c2d0ab9e77",
            input={
                "audio": open(caminho_local, "rb"),
                "model": "htdemucs_ft",
                "output_format": "mp3",
                "stem": "vocals"
            }
        )
        return jsonify({
            'sucesso': True, 
            'job_id': prediction.id,
            'mensagem': 'Processamento iniciado na nuvem.',
            'nome_base': nome_base
        })
    except Exception as e:
        return jsonify({'sucesso': False, 'erro': str(e)}), 500

@app.route('/status_replicate/<job_id>', methods=['GET'])
def status_replicate(job_id):
    try:
        nome_base = request.args.get('nome_base', 'musica')
        id_unico = str(int(time.time()))
        prediction = replicate.predictions.get(job_id)
        
        if prediction.status in ["starting", "processing"]:
            return jsonify({'sucesso': True, 'status': 'processando'})
            
        elif prediction.status == "succeeded":
            output = prediction.output
            url_voz_nuvem = output.get('vocals')
            url_inst_nuvem = output.get('no_vocals')
            
            nome_inst = f"Inst_REP_{nome_base}_{id_unico}.mp3"
            nome_voz = f"Voz_REP_{nome_base}_{id_unico}.mp3"
            
            def baixar_da_nuvem(url, nome):
                if url:
                    r = requests.get(url, stream=True)
                    if r.status_code == 200:
                        with open(os.path.join(DOWNLOAD_FOLDER, nome), 'wb') as f:
                            for chunk in r.iter_content(chunk_size=8192):
                                f.write(chunk)
            
            baixar_da_nuvem(url_inst_nuvem, nome_inst)
            baixar_da_nuvem(url_voz_nuvem, nome_voz)
            
            return jsonify({
                'sucesso': True,
                'status': 'concluido',
                'url': f"{request.host_url}download_arquivo/downloads/{nome_inst}",
                'url_voz': f"{request.host_url}download_arquivo/downloads/{nome_voz}"
            })
        return jsonify({'sucesso': False, 'status': 'erro', 'erro': prediction.error or 'Falhou'})
    except Exception as e:
        return jsonify({'sucesso': False, 'status': 'erro', 'erro': str(e)}), 500

@app.route('/separar_fadr', methods=['POST'])
def separar_fadr():
    if 'audio' not in request.files:
        return jsonify({'sucesso': False, 'erro': 'Nenhum áudio enviado.'})

    file = request.files['audio']
    nome_limpo = urllib.parse.unquote(file.filename)
    nome_limpo = re.sub(r'[^\\w\\s\\.-]', '', nome_limpo)
    
    caminho_local = os.path.join(DOWNLOAD_FOLDER, nome_limpo) 
    file.save(caminho_local)

    headers = {
        "Authorization": f"Bearer {os.getenv('FADR_API_KEY')}",
        "Content-Type": "application/json",
        "User-Agent": "GHKaraokePro/1.0"
    }

    try:
        res_upload = requests.post("[https://api.fadr.com/assets/upload](https://api.fadr.com/assets/upload)", headers=headers, json={"name": nome_limpo})
        if not res_upload.ok:
            return jsonify({'sucesso': False, 'erro': 'Erro de autenticação ou créditos na API FADR.'})

        dados_upload = res_upload.json()
        upload_url = dados_upload['url']
        asset_id = dados_upload['asset']['_id'] 

        with open(caminho_local, 'rb') as f:
            requests.put(upload_url, data=f)

        time.sleep(3)
        res_task = requests.post("[https://api.fadr.com/tasks/stem](https://api.fadr.com/tasks/stem)", headers=headers, json={"asset": asset_id, "stemType": "main"})
        task_id = res_task.json()['task']['_id']

        while True:
            res_status = requests.get(f"[https://api.fadr.com/tasks/](https://api.fadr.com/tasks/){task_id}", headers=headers)
            dados_status = res_status.json()
            status = dados_status['task']['status']

            if status == 'complete':
                stems = dados_status['task'].get('group', {})
                url_voz = stems.get('vocals', '')
                url_instrumental = stems.get('accompaniment', stems.get('instrumental', stems.get('other', ''))) 
                break
            elif status == 'failed':
                return jsonify({'sucesso': False, 'erro': 'A IA do FADR falhou.'})
            time.sleep(5) 

        id_unico = int(time.time())
        nome_base = os.path.splitext(nome_limpo)[0]
        nome_inst = f"Inst_FADR_{nome_base}_{id_unico}.wav"
        nome_voz = f"Voz_FADR_{nome_base}_{id_unico}.wav"

        def baixar(url, nome):
            if url:
                r = requests.get(url, stream=True)
                if r.status_code == 200:
                    with open(os.path.join(DOWNLOAD_FOLDER, nome), 'wb') as f:
                        for chunk in r.iter_content(chunk_size=8192): f.write(chunk)

        baixar(url_instrumental, nome_inst)
        baixar(url_voz, nome_voz)

        return jsonify({
            'sucesso': True,
            'url': f"{request.host_url}download_arquivo/downloads/{nome_inst}", 
            'url_voz': f"{request.host_url}download_arquivo/downloads/{nome_voz}"       
        })
    except Exception as e:
        return jsonify({'sucesso': False, 'erro': str(e)})

@app.route('/buscar_youtube', methods=['POST'])
def buscar_youtube():
    query = request.json.get('query', '')
    if not query: return jsonify({"erro": "Busca vazia"}), 400
    try:
        ydl_opts = {'extract_flat': True, 'quiet': True}
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            resultado = ydl.extract_info(f"ytsearch30:{query}", download=False)
            videos = []
            for entry in resultado.get('entries', []):
                if entry:
                    videos.append({
                        "id": entry.get('id'),
                        "titulo": entry.get('title'),
                        "thumb": entry.get('thumbnails', [{}])[-1].get('url') if entry.get('thumbnails') else None
                    })
        return jsonify({"sucesso": True, "resultados": videos})
    except Exception as e:
        return jsonify({"erro": str(e)}), 500

@app.route('/baixar_youtube', methods=['POST'])
def baixar_youtube():
    video_id = request.json.get('id')
    formato = request.json.get('formato', 'video') 
    resolucao = request.json.get('resolucao', '720')
    extensao_audio = request.json.get('extensao', 'wav')
    
    pasta_saida = os.path.join(os.getcwd(), "youtube_downloads")
    os.makedirs(pasta_saida, exist_ok=True)
    
    try:
        if formato == 'audio':
            codec = 'mp3' if extensao_audio == 'mp3' else 'wav'
            pp_opts = {'key': 'FFmpegExtractAudio', 'preferredcodec': codec}
            if codec == 'mp3': pp_opts['preferredquality'] = resolucao
                
            ydl_opts = {
                'format': 'bestaudio/best',
                'outtmpl': os.path.join(pasta_saida, f'{video_id}.%(ext)s'),
                'postprocessors': [pp_opts], 'quiet': True
            }
            extensao = codec
        else:
            format_str = f'bestvideo[height<={resolucao}][ext=mp4]+bestaudio[ext=m4a]/best[height<={resolucao}][ext=mp4]/best'
            ydl_opts = {
                'format': format_str, 'merge_output_format': 'mp4',
                'outtmpl': os.path.join(pasta_saida, f'{video_id}.%(ext)s'), 'quiet': True
            }
            extensao = 'mp4'
            
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            ydl.download([f"[https://www.youtube.com/watch?v=](https://www.youtube.com/watch?v=){video_id}"])
        
        return jsonify({"sucesso": True, "url": f"{request.host_url}download_arquivo/youtube_downloads/{video_id}.{extensao}", "nome": f"YouTube_{video_id}.{extensao}"})
    except Exception as e:
        return jsonify({"erro": str(e)}), 500

@app.route('/buscar_soundcloud', methods=['POST'])
def buscar_soundcloud():
    query = request.json.get('query', '')
    if not query: return jsonify({"erro": "Busca vazia"}), 400
    try:
        ydl_opts = {'extract_flat': True, 'quiet': True}
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            resultado = ydl.extract_info(f"scsearch30:{query}", download=False)
            musicas = []
            for entry in resultado.get('entries', []):
                if entry:
                    musicas.append({
                        "id": entry.get('webpage_url') or entry.get('url') or str(entry.get('id')),
                        "titulo": entry.get('title'),
                        "thumb": entry.get('thumbnails', [{}])[-1].get('url') if entry.get('thumbnails') else None
                    })
        return jsonify({"sucesso": True, "resultados": musicas})
    except Exception as e:
        return jsonify({"erro": str(e)}), 500

@app.route('/baixar_soundcloud', methods=['POST'])
def baixar_soundcloud():
    track_url = request.json.get('id')
    resolucao = request.json.get('resolucao', '320')
    extensao_audio = request.json.get('extensao', 'mp3')
    
    pasta_saida = os.path.join(os.getcwd(), "soundcloud_downloads")
    os.makedirs(pasta_saida, exist_ok=True)
    
    try:
        codec = 'mp3' if extensao_audio == 'mp3' else 'wav'
        pp_opts = {'key': 'FFmpegExtractAudio', 'preferredcodec': codec}
        if codec == 'mp3': pp_opts['preferredquality'] = resolucao
            
        id_unico = int(time.time())
        nome_arquivo_base = f"SC_{id_unico}"
        
        ydl_opts = {
            'format': 'bestaudio/best',
            'outtmpl': os.path.join(pasta_saida, f'{nome_arquivo_base}.%(ext)s'),
            'postprocessors': [pp_opts], 'quiet': True
        }
        with yt_dlp.YoutubeDL(ydl_opts) as ydl: ydl.download([track_url])
        
        return jsonify({"sucesso": True, "url": f"{request.host_url}download_arquivo/soundcloud_downloads/{nome_arquivo_base}.{codec}", "nome": f"{nome_arquivo_base}.{codec}"})
    except Exception as e:
        return jsonify({"erro": str(e)}), 500

@app.route('/download_arquivo/<pasta>/<nome_arquivo>')
def servir_arquivo(pasta, nome_arquivo):
    return send_file(os.path.join(os.getcwd(), pasta, nome_arquivo))

@app.route('/extrair_letra', methods=['POST'])
def extrair_letra_cloud():
    if 'audio' not in request.files: return jsonify({"sucesso": False, "erro": "Sem áudio"}), 400
    arquivo = request.files['audio']
    caminho = os.path.join(DOWNLOAD_FOLDER, f"transcreve_{int(time.time())}_{secure_filename(arquivo.filename)}")
    arquivo.save(caminho)
    try:
        output = replicate.run(
            "openai/whisper:8099696689d249cf8b122d833c36ac3f75505c666a395ca40ef26f68e7d3d16e",
            input={"audio": open(caminho, "rb"), "model": "small", "transcription": "vtt"}
        )
        return jsonify({"sucesso": True, "lrc": output.get("transcription", "Erro na transcrição")})
    except Exception as e:
        return jsonify({"sucesso": False, "erro": str(e)}), 500
    finally:
        if os.path.exists(caminho): os.remove(caminho)

@app.route('/arquivos_prontos', methods=['GET'])
def arquivos_prontos():
    arquivos_validos = ('.mp3', '.wav', '.m4a')
    arquivos_encontrados = []
    pastas = ['./', './separated/htdemucs/musica_recebida/']
    for pasta in pastas:
        if os.path.exists(pasta):
            for arquivo in os.listdir(pasta):
                if arquivo.lower().endswith(arquivos_validos):
                    caminho = os.path.join(pasta, arquivo)
                    if os.path.isfile(caminho):
                        mb = os.path.getsize(caminho) / (1024 * 1024)
                        arquivos_encontrados.append({"nome": arquivo, "tamanho_mb": round(mb, 2)})
    return jsonify({"sucesso": True, "arquivos": arquivos_encontrados})

# ==========================================================
# THREADS DE CONTROLE DESKTOP (VIGIA DO APP E FAXINEIRO)
# ==========================================================
def vigia_do_navegador():
    global ultimo_ping
    time.sleep(15) # Tolerância inicial para o navegador abrir
    while True:
        # Se ficar mais de 6 segundos sem receber o ping do Front, desliga o app!
        if (time.time() - ultimo_ping) > 6:
            print("🛑 Aba do navegador fechada! Encerrando GH Karaokê Pro...")
            os._exit(0)
        time.sleep(2)

def faxineiro_de_arquivos():
    extensoes = ('.mp3', '.mp4', '.wav', '.m4a', '.webm', '.lrc')
    tempo_limite = 2 * 3600 # 2 horas
    pastas = ['./', './downloads', './youtube_downloads', './soundcloud_downloads', './extraidos']
    while True:
        try:
            agora = time.time()
            for pasta in pastas:
                if os.path.exists(pasta):
                    for arquivo in os.listdir(pasta):
                        if arquivo.lower().endswith(extensoes):
                            caminho = os.path.join(pasta, arquivo)
                            if os.path.isfile(caminho) and (agora - os.path.getmtime(caminho)) > tempo_limite:
                                os.remove(caminho)
                                print(f"🧹 [FAXINEIRO] Arquivo temporário removido: {arquivo}")
        except Exception as e:
            print(f"⚠️ Erro no Faxineiro: {e}")
        time.sleep(3600)

if __name__ == '__main__':
    porta = int(os.environ.get("PORT", 5000))
    
    # Inicializa as threads em segundo plano como Daemons
    threading.Thread(target=vigia_do_navegador, daemon=True).start()
    threading.Thread(target=faxineiro_de_arquivos, daemon=True).start()
    
    # --- NOVA LÓGICA BLINDADA PARA ABRIR O NAVEGADOR PADRÃO ---
    url_local = f"http://127.0.0.1:{porta}"
    
    def abrir_navegador_nativo(url):
        try:
            # Força o Windows a usar o aplicativo padrão real para links de internet
            if sys.platform == 'win32':
                os.startfile(url)
            else:
                import webbrowser
                webbrowser.open(url)
        except Exception as e:
            print(f"Erro ao abrir navegador: {e}")
            
    threading.Timer(1.5, lambda: abrir_navegador_nativo(url_local)).start()
    # ----------------------------------------------------------
    
    # Roda o servidor Flask suprimindo logs excessivos no arquivo de debugar
    logging.getLogger('werkzeug').setLevel(logging.ERROR)
    app.run(host='127.0.0.1', port=porta, debug=False)