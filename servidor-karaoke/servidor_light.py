from flask.cli import load_dotenv
import subprocess, os, yt_dlp, time, threading, requests, urllib.parse, re, replicate, soundfile as sf
from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
from werkzeug.utils import secure_filename
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
CORS(app)

FADR_API_KEY = os.environ["FADR_API_KEY"]
REPLICATE_API_TOKEN = os.getenv("REPLICATE_API_TOKEN")
if not REPLICATE_API_TOKEN:
    raise ValueError("⚠️ ERRO CRÍTICO: REPLICATE_API_TOKEN não encontrado no arquivo .env!")
os.environ["REPLICATE_API_TOKEN"] = REPLICATE_API_TOKEN

# Pastas de trabalho
DOWNLOAD_FOLDER = 'downloads'
os.makedirs(DOWNLOAD_FOLDER, exist_ok=True)

def salvar_com_soundfile(wav, path, *args, **kwargs):
    samplerate = args[0] if args else kwargs.get('samplerate', 44100)
    audio_np = wav.cpu().numpy().T
    sf.write(str(path), audio_np, samplerate)


@app.route('/separar_replicate', methods=['POST'])
def separar_replicate():
    if 'audio' not in request.files:
        return jsonify({'sucesso': False, 'erro': 'Nenhum arquivo enviado'}), 400

    file = request.files['audio']
    nome_base = os.path.splitext(secure_filename(file.filename))[0]
    nome_limpo = f"{nome_base}_{int(time.time())}.mp3"
    
    os.makedirs('downloads', exist_ok=True)
    caminho_local = os.path.join('downloads', nome_limpo)
    file.save(caminho_local)

    try:
        print("Passo 1: Iniciando processamento assíncrono na Replicate...")
        # Usa .create() em vez de .run() para NÃO bloquear o servidor
        prediction = replicate.predictions.create(
            version="5a7041cc9b82e5a558fea6b3d7b12dea89625e89da33f0447bd727c2d0ab9e77",
            input={
                "audio": open(caminho_local, "rb"),
                "model": "htdemucs_ft",
                "output_format": "mp3",
                "stem": "vocals"
            }
        )
        
        # Retorna imediatamente o ID da tarefa para o frontend
        return jsonify({
            'sucesso': True, 
            'job_id': prediction.id,
            'mensagem': 'Processamento iniciado. Consulte o status usando o job_id.',
            'nome_base': nome_base
        })

    except Exception as e:
        print(f"❌ Erro ao iniciar Replicate: {e}")
        return jsonify({'sucesso': False, 'erro': str(e)}), 500
    
@app.route('/status_replicate/<job_id>', methods=['GET'])
def status_replicate(job_id):
    try:
        # Pega o nome_base enviado via query param (opcional, para manter o padrão de nomes)
        nome_base = request.args.get('nome_base', 'musica')
        id_unico = str(int(time.time()))
        
        # Consulta a Replicate para saber como está o trabalho
        prediction = replicate.predictions.get(job_id)
        
        if prediction.status == "starting" or prediction.status == "processing":
            return jsonify({'sucesso': True, 'status': 'processando'})
            
        elif prediction.status == "succeeded":
            print("✅ Separação concluída na nuvem! Baixando resultados...")
            output = prediction.output
            
            url_voz_nuvem = output.get('vocals')
            url_inst_nuvem = output.get('no_vocals')
            
            nome_inst = f"Inst_REP_{nome_base}_{id_unico}.mp3"
            nome_voz = f"Voz_REP_{nome_base}_{id_unico}.mp3"
            
            # Função interna para baixar (você já tem algo parecido no seu código)
            def baixar_da_nuvem(url_externa, nome_destino):
                if url_externa:
                    r = requests.get(url_externa, stream=True)
                    if r.status_code == 200:
                        caminho = os.path.join('downloads', nome_destino)
                        with open(caminho, 'wb') as f:
                            for chunk in r.iter_content(chunk_size=8192):
                                f.write(chunk)
                        return True
                return False

            baixar_da_nuvem(url_inst_nuvem, nome_inst)
            baixar_da_nuvem(url_voz_nuvem, nome_voz)
            
            return jsonify({
                'sucesso': True,
                'status': 'concluido',
                'url': f"{request.host_url}download_arquivo/downloads/{nome_inst}",
                'url_voz': f"{request.host_url}download_arquivo/downloads/{nome_voz}"
            })
            
        elif prediction.status == "failed":
            return jsonify({'sucesso': False, 'status': 'erro', 'erro': prediction.error})
            
        elif prediction.status == "canceled":
            return jsonify({'sucesso': False, 'status': 'erro', 'erro': 'Processamento cancelado.'})

    except Exception as e:
        print(f"❌ Erro ao checar status: {e}")
        return jsonify({'sucesso': False, 'status': 'erro', 'erro': str(e)}), 500
    
    
@app.route('/separar_fadr', methods=['POST'])
def separar_fadr():
    if 'audio' not in request.files:
        return jsonify({'sucesso': False, 'erro': 'Nenhum áudio enviado.'})

    file = request.files['audio']
    nome_arquivo = file.filename
    
    # --- FILTRO DE LIMPEZA DO NOME ---
    # 1. Transforma "%20" de volta em espaços e "%C3%AD" em letras normais
    nome_limpo = urllib.parse.unquote(nome_arquivo)
    # 2. Remove acentos pesados e símbolos, mantendo só letras, números, espaços e hífen
    nome_limpo = re.sub(r'[^\w\s\.-]', '', nome_limpo) 
    # ---------------------------------
    
    os.makedirs('downloads', exist_ok=True)
    caminho_local = os.path.join('downloads', nome_limpo) 
    file.save(caminho_local)

    # --- REFORÇO NO CRACHÁ (HEADERS) ---
    headers = {
        "Authorization": f"Bearer {os.getenv('FADR_API_KEY')}",
        "Content-Type": "application/json",
        "User-Agent": "GHKaraokePro/1.0" # Diz à FADR quem está fazendo o pedido
    }

    try:
        print(f"🚀 Iniciando separação VIP FADR para: {nome_limpo}")

        # 1. URL Pré-assinada
        print("Passo 1/5: Solicitando permissão de upload ao FADR...")
        res_upload = requests.post("https://api.fadr.com/assets/upload", headers=headers, json={"name": nome_limpo})
        
        if not res_upload.ok:
            print(f"❌ O FADR RECUSOU A ENTRADA! Código HTTP: {res_upload.status_code}")
            print(f"Mensagem do FADR: {res_upload.text}")
            return jsonify({'sucesso': False, 'erro': 'A chave da API pode estar expirada ou sem créditos. Verifique o terminal.'})

        dados_upload = res_upload.json()
        
        
        # A API devolve para onde devemos mandar o arquivo e o ID provisório dele
        upload_url = dados_upload['url']
        asset_id = dados_upload['asset']['_id'] 

        # 2. Upload (Enviando para a AWS do FADR)
        print("Passo 2/5: Enviando áudio de alta qualidade para a nuvem...")
        with open(caminho_local, 'rb') as f:
            # Envia para o S3
            res_s3 = requests.put(upload_url, data=f)
            
            # --- NOVA TRAVA DE SEGURANÇA ---
            if not res_s3.ok:
                print(f"❌ Erro ao enviar para a nuvem! HTTP: {res_s3.status_code}")
                return jsonify({'sucesso': False, 'erro': 'Falha no upload para a nuvem do FADR.'})

        # --- NOVO RESPIRO ---
        print("Aguardando 3 segundos para o FADR registrar o arquivo...")
        time.sleep(3)

        # 3 e 4. Iniciar Task (A Ordem de Separação)
        print("Passo 3/5: Iniciando a Inteligência Artificial...")
        res_task = requests.post("https://api.fadr.com/tasks/stem", headers=headers, json={
            "asset": asset_id,
            "stemType": "main" # MÁGICA: Extrai Voz, Bateria, Baixo e Instrumental!
        })
        dados_task = res_task.json()
        
        # Verifica se a task foi criada com sucesso antes de pegar o ID
        if 'task' not in dados_task:
            print("❌ Erro ao iniciar a task:", dados_task)
            return jsonify({'sucesso': False, 'erro': 'O FADR não conseguiu iniciar a separação.'})
            
        task_id = dados_task['task']['_id']

        # 5. Polling (Esperando a Mágica Acontecer)
        print("Passo 4/5: Aguardando a IA processar (Leva de 15 a 30 segundos)...")
        while True:
            res_status = requests.get(f"https://api.fadr.com/tasks/{task_id}", headers=headers)
            dados_status = res_status.json()
            status = dados_status['task']['status']

            if status == 'complete':
                print("✅ Separação FADR finalizada com perfeição!")
                
                # --- BUSCA INTELIGENTE DOS LINKS ---
                stems = dados_status['task'].get('group', {})
                url_voz = stems.get('vocals', '')
                url_instrumental = stems.get('accompaniment', stems.get('instrumental', stems.get('other', ''))) 
                
                break
            elif status == 'failed':
                print("❌ Erro reportado pelo FADR:", dados_status)
                return jsonify({'sucesso': False, 'erro': 'A IA do FADR encontrou um erro durante o processamento.'})

            # Espera 5 segundos antes de perguntar ao FADR novamente
            time.sleep(5) 

        # ==========================================================
        # NOVO PASSO 5: BAIXAR PARA O SERVIDOR LOCAL (TORNAR PERMANENTE)
        # ==========================================================
        print("Passo 5/6: Baixando as faixas da AWS para o servidor local...")
        
        # Vamos usar a pasta 'downloads' que já existe e já é limpa pelo faxineiro!
        pasta_fadr = os.path.join(os.getcwd(), "downloads") 
        
        # Gerar nomes únicos baseados no nome original da música
        id_unico = int(time.time())
        nome_base = os.path.splitext(nome_limpo)[0]
        
        nome_inst = f"Inst_FADR_{nome_base}_{id_unico}.wav"
        nome_voz = f"Voz_FADR_{nome_base}_{id_unico}.wav"

        # Função auxiliar para fazer o download rapidamente
        def baixar_da_nuvem(url_aws, nome_destino):
            if url_aws:
                try:
                    res_download = requests.get(url_aws, stream=True)
                    if res_download.status_code == 200:
                        with open(os.path.join(pasta_fadr, nome_destino), 'wb') as f:
                            for chunk in res_download.iter_content(chunk_size=8192): 
                                f.write(chunk)
                except Exception as e:
                    print(f"⚠️ Erro ao baixar arquivo da AWS: {e}")

        # Baixa as duas faixas
        baixar_da_nuvem(url_instrumental, nome_inst)
        baixar_da_nuvem(url_voz, nome_voz)

        print("Passo 6/6: Devolvendo os links locais blindados para o aplicativo!")

        # Agora devolvemos a rota interna do Flask (download_arquivo), igual fazemos no YouTube
        return jsonify({
            'sucesso': True,
            'url': f"{request.host_url}download_arquivo/downloads/{nome_inst}", 
            'url_voz': f"{request.host_url}download_arquivo/downloads/{nome_voz}"       
        })

    except Exception as e:
        print("❌ Erro na API do FADR:", e)
        return jsonify({'sucesso': False, 'erro': str(e)})

@app.route('/playback/<pasta_unica>/<nome_arquivo>')
def tocar_playback(pasta_unica, nome_arquivo):
    return send_file(os.path.join(os.getcwd(), "separated", "htdemucs", pasta_unica, nome_arquivo))

@app.route('/extrair', methods=['POST'])
def extrair_audio():
    if 'file' not in request.files: return jsonify({"erro": "Nenhum arquivo"}), 400
    arquivo = request.files['file']
    
    # --- SOLUÇÃO PRO: GERANDO UM NOME ÚNICO ---
    id_unico = int(time.time())
    nome_video = f"video_{id_unico}.mp4"
    nome_audio = f"audio_extraido_{id_unico}.wav"
    # ------------------------------------------
    
    caminho_entrada = os.path.join(os.getcwd(), nome_video)
    arquivo.save(caminho_entrada)
    
    pasta_saida = os.path.join(os.getcwd(), "extraidos")
    os.makedirs(pasta_saida, exist_ok=True)
    caminho_saida = os.path.join(pasta_saida, nome_audio)
    
    try:
        subprocess.run(["ffmpeg", "-y", "-i", caminho_entrada, "-vn", "-acodec", "pcm_s16le", "-ar", "44100", "-ac", "2", caminho_saida], check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        return jsonify({"sucesso": True, "url": f"{request.host_url}download_arquivo/extraidos/{nome_audio}"})
    except Exception as e:
        return jsonify({"erro": str(e)}), 500

@app.route('/buscar_youtube', methods=['POST'])
def buscar_youtube():
    query = request.json.get('query', '')
    if not query: return jsonify({"erro": "Busca vazia"}), 400
    print(f"🔍 Buscando no YouTube: {query}")
    try:
        ydl_opts = {'extract_flat': True, 'quiet': True}
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            resultado = ydl.extract_info(f"ytsearch30:{query}", download=False)
            videos = []
            for entry in resultado.get('entries', []):
                videos.append({
                    "id": entry.get('id'),
                    "titulo": entry.get('title'),
                    "thumb": entry.get('thumbnails', [{}])[-1].get('url') if entry.get('thumbnails') else None
                })
        return jsonify({"sucesso": True, "resultados": videos})
    except Exception as e:
        return jsonify({"erro": str(e)}), 500

# === NOVA LÓGICA DE DOWNLOAD (Com Escolha de Qualidade) ===
@app.route('/baixar_youtube', methods=['POST'])
def baixar_youtube():
    video_id = request.json.get('id')
    formato = request.json.get('formato', 'video') 
    resolucao = request.json.get('resolucao', '720') # Ex: 1080, 720, 320, 128
    extensao_audio = request.json.get('extensao', 'wav') # Ex: wav ou mp3
    
    print(f"⬇️ YouTube (ID: {video_id} | Tipo: {formato} | Res/Qual: {resolucao} | Ext: {extensao_audio})...")
    
    pasta_saida = os.path.join(os.getcwd(), "youtube_downloads")
    os.makedirs(pasta_saida, exist_ok=True)
    
    try:
        if formato == 'audio':
            codec = 'mp3' if extensao_audio == 'mp3' else 'wav'
            pp_opts = {'key': 'FFmpegExtractAudio', 'preferredcodec': codec}
            
            # Se for MP3, usamos a "resolução" como bitrate (ex: 320 ou 128)
            if codec == 'mp3':
                pp_opts['preferredquality'] = resolucao
                
            ydl_opts = {
                'format': 'bestaudio/best',
                'outtmpl': os.path.join(pasta_saida, f'{video_id}.%(ext)s'),
                'postprocessors': [pp_opts],
                'quiet': True
            }
            extensao = codec
        else:
            # Baixa o vídeo com limite máximo na resolução escolhida pelo usuário
            format_str = f'bestvideo[height<={resolucao}][ext=mp4]+bestaudio[ext=m4a]/best[height<={resolucao}][ext=mp4]/best'
            ydl_opts = {
                'format': format_str,
                'merge_output_format': 'mp4',
                'outtmpl': os.path.join(pasta_saida, f'{video_id}.%(ext)s'),
                'quiet': True
            }
            extensao = 'mp4'
            
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            ydl.download([f"https://www.youtube.com/watch?v={video_id}"])
        
        link = f"{request.host_url}download_arquivo/youtube_downloads/{video_id}.{extensao}"
        print(f"✅ Download pronto: {link}")
        return jsonify({"sucesso": True, "url": link, "nome": f"YouTube_{video_id}.{extensao}"})
    except Exception as e:
        print(f"❌ Erro: {e}")
        return jsonify({"erro": str(e)}), 500
    
# ==========================================
# ROTAS DO SOUNDCLOUD
# ==========================================
@app.route('/buscar_soundcloud', methods=['POST'])
def buscar_soundcloud():
    query = request.json.get('query', '')
    if not query: return jsonify({"erro": "Busca vazia"}), 400
    print(f"☁️ Buscando no SoundCloud: {query}")
    try:
        ydl_opts = {'extract_flat': True, 'quiet': True}
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            # scsearch15: busca os 30 primeiros resultados no SoundCloud
            resultado = ydl.extract_info(f"scsearch30:{query}", download=False)
            musicas = []
            for entry in resultado.get('entries', []):
                musicas.append({
                    # CORREÇÃO AQUI: Pegamos o 'webpage_url' (Página pública) como prioridade!
                    "id": entry.get('webpage_url') or entry.get('url') or str(entry.get('id')),
                    "titulo": entry.get('title'),
                    "thumb": entry.get('thumbnails', [{}])[-1].get('url') if entry.get('thumbnails') else None
                })
        return jsonify({"sucesso": True, "resultados": musicas})
    except Exception as e:
        return jsonify({"erro": str(e)}), 500

@app.route('/baixar_soundcloud', methods=['POST'])
def baixar_soundcloud():
    track_url = request.json.get('id') # O ID vindo do front é a URL completa do SoundCloud
    resolucao = request.json.get('resolucao', '320')
    extensao_audio = request.json.get('extensao', 'mp3')
    
    print(f"⬇️ Baixando do SoundCloud: {track_url} | Ext: {extensao_audio}...")
    
    pasta_saida = os.path.join(os.getcwd(), "soundcloud_downloads")
    os.makedirs(pasta_saida, exist_ok=True)
    
    try:
        # Como o SoundCloud é só áudio, forçamos a extração independentemente do que o front enviou
        codec = 'mp3' if extensao_audio == 'mp3' else 'wav'
        pp_opts = {'key': 'FFmpegExtractAudio', 'preferredcodec': codec}
        
        if codec == 'mp3':
            pp_opts['preferredquality'] = resolucao
            
        # Gera um ID único para evitar erros de caracteres no nome do arquivo salvando no Windows/Linux
        id_unico = int(time.time())
        nome_arquivo_base = f"SC_{id_unico}"
        
        ydl_opts = {
            'format': 'bestaudio/best',
            'outtmpl': os.path.join(pasta_saida, f'{nome_arquivo_base}.%(ext)s'),
            'postprocessors': [pp_opts],
            'quiet': True
        }
        
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            ydl.download([track_url])
        
        # Aproveitamos a rota genérica que você já tem no Flask para servir o arquivo
        link = f"{request.host_url}download_arquivo/soundcloud_downloads/{nome_arquivo_base}.{codec}"
        print(f"✅ Download SoundCloud pronto: {link}")
        
        return jsonify({"sucesso": True, "url": link, "nome": f"{nome_arquivo_base}.{codec}"})
    except Exception as e:
        print(f"❌ Erro no SoundCloud: {e}")
        return jsonify({"erro": str(e)}), 500

@app.route('/download_arquivo/<pasta>/<nome_arquivo>')
def servir_arquivo(pasta, nome_arquivo):
    return send_file(os.path.join(os.getcwd(), pasta, nome_arquivo))

@app.route('/extrair_letra', methods=['POST'])
def extrair_letra_cloud():
    """Usa o Replicate para transcrever áudio sem gastar RAM local"""
    if 'audio' not in request.files:
        return jsonify({"sucesso": False, "erro": "Nenhum áudio enviado."}), 400
    
    arquivo = request.files['audio']
    nome_limpo = secure_filename(arquivo.filename)
    caminho_local = os.path.join(DOWNLOAD_FOLDER, f"transcreve_{int(time.time())}_{nome_limpo}")
    arquivo.save(caminho_local)

    try:
        print(f"🎧 Enviando para Whisper Cloud (Replicate)...")
        # Roda o modelo oficial da OpenAI hospedado no Replicate
        output = replicate.run(
            "openai/whisper:8099696689d249cf8b122d833c36ac3f75505c666a395ca40ef26f68e7d3d16e",
            input={
                "audio": open(caminho_local, "rb"),
                "model": "small",
                "transcription": "vtt" # Retorna formato de legenda com tempo
            }
        )
        
        # O Replicate retorna um dicionário com o texto e segmentos
        return jsonify({"sucesso": True, "lrc": output.get("transcription", "Erro na transcrição")})
        
    except Exception as e:
        return jsonify({"sucesso": False, "erro": str(e)}), 500
    finally:
        if os.path.exists(caminho_local): os.remove(caminho_local)
    
@app.route('/arquivos_prontos', methods=['GET'])
def arquivos_prontos():
    """Lista todos os arquivos de mídia que estão esperando para serem baixados"""
    arquivos_validos = ('.mp3', '.wav', '.m4a')
    arquivos_encontrados = []
    
    # O servidor vai vasculhar na raiz e na pasta onde o Karaokê salva os playbacks!
    pastas_para_olhar = [
        './', 
        './separated/htdemucs/musica_recebida/'
    ]
    
    for pasta in pastas_para_olhar:
        if os.path.exists(pasta):
            for arquivo in os.listdir(pasta):
                if arquivo.lower().endswith(arquivos_validos):
                    caminho_completo = os.path.join(pasta, arquivo)
                    if os.path.isfile(caminho_completo):
                        tamanho_mb = os.path.getsize(caminho_completo) / (1024 * 1024)
                        nome_exibicao = f"Karaoke_{arquivo}" if "separated" in pasta else arquivo
                        arquivos_encontrados.append({"nome": nome_exibicao, "tamanho_mb": round(tamanho_mb, 2)})
            
    return jsonify({"sucesso": True, "arquivos": arquivos_encontrados})
    
def faxineiro_de_arquivos():
    """
    Roda em segundo plano e apaga arquivos de mídia mais velhos que 2 horas de TODAS as pastas.
    """
    extensoes_alvo = ('.mp3', '.mp4', '.wav', '.m4a', '.webm', '.lrc')
    tempo_limite = 2 * 3600 # 2 horas
    
    # LISTA DE TODAS AS PASTAS QUE O SERVIDOR USA
    pastas_alvo = [
        './',
        './downloads',
        './youtube_downloads',
        './soundcloud_downloads',
        './extraidos',
        './separated/htdemucs/musica_recebida'
    ]

    while True:
        try:
            agora = time.time()
            
            for pasta in pastas_alvo:
                # Verifica se a pasta já existe antes de tentar limpar
                if os.path.exists(pasta):
                    for nome_arquivo in os.listdir(pasta):
                        if nome_arquivo.lower().endswith(extensoes_alvo):
                            caminho_completo = os.path.join(pasta, nome_arquivo)
                            
                            if os.path.isfile(caminho_completo):
                                tempo_modificacao = os.path.getmtime(caminho_completo)
                                
                                if (agora - tempo_modificacao) > tempo_limite:
                                    os.remove(caminho_completo)
                                    print(f"🧹 [FAXINEIRO] Ficheiro antigo apagado: {pasta}/{nome_arquivo}")
                            
        except Exception as e:
            print(f"⚠️ [FAXINEIRO] Erro ao limpar ficheiros: {e}")
            
        # Dorme por 1 hora e repete
        time.sleep(3600)

# ==========================================================
# LIGANDO O FAXINEIRO JUNTO COM O SERVIDOR
# O daemon=True faz a thread morrer sozinha quando você desligar o servidor
thread_limpeza = threading.Thread(target=faxineiro_de_arquivos, daemon=True)
thread_limpeza.start()
# ==========================================================

if __name__ == '__main__':
    # Pega a porta que o Cloud Run mandar, ou usa a 5000 se rodar no seu PC
    porta = int(os.environ.get("PORT", 5000)) 
    print(f"🔥 Servidor GH Karaokê Pro ONLINE na porta {porta}!")
    app.run(host='0.0.0.0', port=porta, debug=True)