```python
import os

content = """# Guia Definitivo de Compilação - GH Karaokê Pro

Este documento detalha o processo final e validado para transformar o projeto GH Karaokê Pro (Frontend em React Native/Expo e Backend em Python/Flask) em um aplicativo desktop nativo e portátil.

## 🎯 Resumo da Arquitetura (O que deu certo)
O aplicativo funciona rodando um servidor Flask "invisível" em segundo plano que entrega a interface do React (compilada para Web) no navegador padrão do usuário. 
Para evitar que o servidor fique rodando infinitamente como um "zumbi", implementamos um sistema de **"Heartbeat" (Batimento Cardíaco)**: o navegador avisa o servidor a cada 2 segundos que está aberto. Ao fechar a aba do navegador, o servidor detecta a ausência do sinal e desliga-se completamente após 6 segundos.

Outros sucessos cruciais resolvidos nesta arquitetura:
* **Ocultação do Terminal:** Uso do parâmetro `--noconsole` para evitar telas pretas.
* **Correção do Replicate:** Uso de `--copy-metadata` para garantir que a biblioteca ache suas próprias dependências de versão.
* **FFmpeg Local:** Mapeamento local para não depender de instalações globais nos computadores dos clientes.

---

## 🛠️ Passo 1: Preparar o Frontend
1. Abra o terminal na pasta `app-karaoke`.
2. Compile o aplicativo para a web executando:

```

```text
[file-tag: Instrucoes_Compilacao_GHKaraokePro.md]

```bash
   npx expo export --platform web

```

3. Isso vai gerar uma pasta chamada `dist` contendo os arquivos HTML/JS/CSS do app.
4. Copie essa pasta `dist` inteira e cole dentro da pasta raiz do seu servidor Flask (`servidor-karaoke`).

## ⚙️ Passo 2: O Código do Servidor (`servidor_light.py`)

Certifique-se de que o seu servidor possua a lógica do Heartbeat e de Inicialização integradas.

### 1. Importações e Variáveis Globais (No topo)

```python
import sys, os, traceback, webbrowser, time, threading
from datetime import datetime
# ... continuam os seus imports originais (flask, yt_dlp, etc)

# Variável do Heartbeat
ultimo_ping = time.time()

```

### 2. Rota do Heartbeat e Interface Frontend

```python
@app.route('/heartbeat')
def heartbeat():
    global ultimo_ping
    ultimo_ping = time.time()
    return "ok", 200

@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def servir_frontend(path):
    if path != "" and os.path.exists(os.path.join(app.root_path, 'dist', path)):
        return send_file(os.path.join(app.root_path, 'dist', path))
    
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
        
    return "Pasta do app não encontrada.", 404

```

### 3. O Vigia de Desligamento e Auto-Run (No final do arquivo)

```python
def vigia_do_navegador():
    global ultimo_ping
    time.sleep(15) # Tempo de tolerância para o navegador iniciar
    
    while True:
        # Se passar mais de 6 segundos sem ouvir o navegador, fecha tudo!
        if (time.time() - ultimo_ping) > 6:
            print("🛑 Aba fechada! Desligando...")
            os._exit(0)
        time.sleep(2)

if __name__ == '__main__':
    porta = int(os.environ.get("PORT", 5000))
    
    # Inicia o Vigia em segundo plano
    threading.Thread(target=vigia_do_navegador, daemon=True).start()
    
    # Abre o navegador automaticamente
    url_local = f"[http://127.0.0.1](http://127.0.0.1):{porta}"
    threading.Timer(1.2, lambda: webbrowser.open(url_local)).start()
    
    # Roda o Flask sem poluir o log local
    import logging
    logging.getLogger('werkzeug').setLevel(logging.ERROR)
    app.run(host='127.0.0.1', port=porta, debug=False)

```

## 📦 Passo 3: Compilando com PyInstaller

Na pasta `servidor-karaoke`, apague pastas `build` e `dist` de compilações passadas (se houver). Em seguida, rode no terminal:

```bash
pyinstaller --name "GHKaraokePro" --onedir --noconsole --add-data "dist;dist" --copy-metadata replicate --icon="icon.ico" servidor_light.py

```

*Explicação das Flags:*

* `--onedir`: Cria uma pasta final (ideal para lidar com downloads e arquivos pesados do FFmpeg).
* `--noconsole`: Esconde a tela do terminal do Python, deixando o app invisível no sistema até o navegador abrir.
* `--add-data "dist;dist"`: Anexa o seu frontend dentro do compilado. *(Linux/Mac: usar `:` em vez de `;`)*.
* `--copy-metadata replicate`: Evita o crash da biblioteca Replicate, forçando o empacotamento da versão dela.

## 🚀 Passo 4: Pós-Compilação (O Toque Final)

O PyInstaller criará o resultado na pasta `dist/GHKaraokePro`. Antes de enviar ou abrir o executável `GHKaraokePro.exe`, você **obrigatoriamente** precisa adicionar arquivos externos fundamentais para dentro desta mesma pasta:

1. **Arquivo `.env`:** Com as chaves `FADR_API_KEY` e `REPLICATE_API_TOKEN`.
2. **Executáveis do FFmpeg:** Os arquivos nativos `ffmpeg.exe` e `ffprobe.exe`.

Feito isso, a pasta pode ser zipada, renomeada ou enviada para qualquer outro computador Windows, sem exigir instalação prévia de Python ou Node.js!
"""