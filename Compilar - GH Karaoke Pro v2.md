 Guia Definitivo de Compilação - GH Karaokê Pro (Versão Atualizada)

Este documento detalha o processo final, validado e adaptado para a versão atual do projeto **GH Karaokê Pro** (com suporte a Banco de Dados SQLite, Autenticação JWT, Downloads Customizados do YouTube/SoundCloud e Limpeza Automática). O objetivo é transformar o Frontend (React Native/Expo) e o Backend (Python/Flask) em um aplicativo desktop nativo, portátil e totalmente autônomo para Windows.

---

## 🎯 Resumo da Arquitetura Desktop
O aplicativo funciona executando um servidor Flask "invisível" em segundo plano. Esse servidor entrega a interface do React Native (compilada para Web estática) e processa as requisições de API localmente.

Para garantir uma experiência de aplicativo desktop real, implementamos as seguintes soluções:
1. **Sistema de Heartbeat (Batimento Cardíaco):** O frontend avisa o servidor a cada 2 segundos que a aba está ativa. Se o usuário fechar o navegador, o servidor detecta a ausência do sinal e se desliga automaticamente após 6 segundos, evitando processos zumbis.
2. **Ocultação do Terminal:** Uso da flag `--noconsole` do PyInstaller para remover janelas pretas de prompt.
3. **Persistência Local:** O banco de dados SQLite (`banco_karaoke.db`) e os logs são gerados na mesma pasta do executável, garantindo portabilidade total.
4. **Isolamento de Binários (FFmpeg):** O mapeamento do FFmpeg é feito localmente na pasta do app, eliminando a necessidade de o cliente instalar softwares globais no Windows.

---

## 🛠️ Passo 1: Preparar e Exportar o Frontend

Com as atualizações do Expo SDK 54, o processo de exportação web foi simplificado.

1. Abra o terminal na pasta raiz do frontend (`app-karaoke`).
2. Certifique-se de que a configuração de saída web está ativa no seu `app.json` (propriedade `"bundler": "metro"` sob a chave `"web"`).
3. Execute o comando de exportação oficial:

3. Isso vai gerar uma pasta chamada `dist` contendo os arquivos HTML/JS/CSS do app.
4. Copie essa pasta `dist` inteira e cole dentro da pasta raiz do seu servidor Flask (`servidor-karaoke`).

📦 Passo 2: Compilando com PyInstaller

# ==========================================================
# THREADS DE CONTROLE DESKTOP (VIGIA DO APP E FAXINEIRO)
# ==========================================================
# ... (mantenha as funções vigia_do_navegador e faxineiro_de_arquivos que já estão no guia)

if __name__ == '__main__':
    porta = int(os.environ.get("PORT", 5000))
    
    # Inicializa as threads em segundo plano como Daemons
    threading.Thread(target=vigia_do_navegador, daemon=True).start()
    threading.Thread(target=faxineiro_de_arquivos, daemon=True).start()
    
    # --- LÓGICA BLINDADA PARA ABRIR O NAVEGADOR PADRÃO ---
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
    
    # Roda o servidor Flask suprimindo logs excessivos no terminal
    logging.getLogger('werkzeug').setLevel(logging.ERROR)
    app.run(host='127.0.0.1', port=porta, debug=False)


Agora que o backend gerencia o banco sqlite e as dependências estáticas do Front, o comando do PyInstaller precisa declarar de forma explícita alguns imports ocultos (hidden-imports) essenciais.

Navegue até a pasta servidor-karaoke.

Certifique-se de deletar qualquer pasta antiga de build anterior (build ou dist).

Execute o comando de compilação completo no terminal:

Bash
pyinstaller --name "GHKaraokePro" --onedir --noconsole --add-data "dist;dist" --copy-metadata replicate --hidden-import="yt_dlp" --hidden-import="sqlite3" --hidden-import="jwt" --hidden-import="soundfile" --icon="icon.ico" servidor_desktop.py
O que cada argumento faz?
--onedir: Consolida tudo em uma pasta limpa e organizada (essencial para persistência de downloads locais).

--noconsole: Impede o aparecimento da janela preta do prompt do Windows (o app roda silencioso até o navegador abrir).

--add-data "dist;dist": Incorpora o frontend em HTML/JS compilado para dentro do pacote final do executável.

--copy-metadata replicate: Evita que a biblioteca Replicate sofra crash por falta de arquivos internos de versão.

--hidden-import="...": Força o PyInstaller a incluir os módulos dinâmicos necessários para downloads, tokens e banco de dados que não são detectados estaticamente.

🚀 Passo 3: Estrutura Pós-Compilação (O Toque de Mestre)
A pasta final gerada pelo compilador estará em dist/GHKaraokePro. Para que o sistema funcione 100% em qualquer computador Windows sem requisições de setups prévios, adicione obrigatoriamente estes componentes na pasta do executável:

Arquivo .env: Crie um arquivo texto contendo as chaves configuradas do seu projeto:

Snippet de código
FADR_API_KEY=sua_chave_fadr_aqui
REPLICATE_API_TOKEN=seu_token_replicate_aqui
SECRET_KEY=sua_chave_secreta_jwt_customizada
Executáveis do FFmpeg: Baixe os binários estáticos para Windows e cole os arquivos ffmpeg.exe e ffprobe.exe diretamente na pasta raiz do aplicativo compilado (junto do GHKaraokePro.exe).

✨ Comportamento Esperado na Execução:
Ao dar dois cliques em GHKaraokePro.exe, o backend sobe invisível, cria automaticamente o arquivo banco_karaoke.db de persistência, e abre o navegador padrão direto na tela de login.

O arquivo log_gh_karaoke_pro.txt será criado na pasta caso precise rastrear erros.

Ao fechar a janela do navegador, o processo em segundo plano encerra-se automaticamente após 6 segundos!
