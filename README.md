George Harrison — Open Source Project

GH KARAOKE PRO

Sistema inteligente de separação de faixas e player de karaokê de alta performance

01 de julho de 2026

---

## 1. Descrição do Projeto

O **GH Karaoke Pro** é uma solução full-stack avançada projetada para transformar a experiência de karaokê através de Inteligência Artificial. O sistema permite a conversão de qualquer música disponível em plataformas de streaming (YouTube e SoundCloud) em faixas de karaokê profissionais, realizando a separação em tempo real de vocais e instrumentais.

Através de uma arquitetura distribuída, o projeto utiliza modelos de ponta para processamento de áudio, garantindo que o usuário tenha controle total sobre o balanço entre a voz original e o acompanhamento musical.

## 2. Funcionalidades Principais

*   **Busca Multiplataforma:** Integração nativa para busca e extração de áudio do YouTube e SoundCloud diretamente pela interface do aplicativo.
*   **Separação de Faixas via IA:** Suporte a múltiplos motores de processamento, incluindo **Demucs** (via Replicate), **Fadr API** e processamento local para isolamento de vocais e instrumentos.
*   **Player de Karaokê Integrado:** Interface de reprodução otimizada com controles independentes de volume para a faixa instrumental e a faixa vocal.
*   **Sincronização e Transcrição:** Utilização de modelos Whisper para potencializar a precisão rítmica e futura implementação de letras dinâmicas.
*   **Gestão de Biblioteca:** Organização de músicas em pastas virtuais e playlists personalizadas para acesso offline após o processamento.

## 3. Tecnologias Utilizadas

### Frontend (Mobile)
*   **React Native & Expo:** Framework para desenvolvimento cross-platform.
*   **TypeScript:** Garantia de tipagem e robustez no desenvolvimento da lógica de interface.
*   **Expo Audio:** Gerenciamento de múltiplas trilhas de áudio simultâneas.

### Backend (Servidor de Processamento)
*   **Python & Flask:** API REST para orquestração de downloads e processamento de IA.
*   **yt-dlp:** Motor de extração de mídia de alta eficiência.
*   **OpenAI Whisper:** Ferramenta de transcrição e análise de áudio.
*   **Replicate API:** Integração com modelos de nuvem para processamento pesado de Demucs.

## 4. Estrutura do Repositório

O projeto está organizado de forma a separar as responsabilidades de interface e processamento pesado:

*   **/app-karaoke**: Contém o código-fonte do aplicativo móvel, incluindo componentes de UI, lógica de polling para o servidor e gerenciamento de estado local.
*   **/servidor-karaoke**: Contém o backend em Python, scripts de processamento de áudio (`servidor_light.py`) e definições de dependências para o ambiente de IA.

## 5. Pré-requisitos

Para rodar o projeto localmente, você precisará de:

1.  **Node.js (v18 ou superior)** e gerenciador de pacotes (npm ou yarn).
2.  **Python (3.10 ou superior)**.
3.  **FFmpeg**: Essencial para a manipulação de arquivos de áudio e funcionamento do `yt-dlp`.
4.  **Expo Go**: Instalado em seu dispositivo móvel para testes.

## 6. Instalação e Execução

### 6.1. Configuração do Servidor (Backend)

Navegue até a pasta do servidor e instale as dependências:

```bash
cd servidor-karaoke
pip install -r requirements.txt
python servidor_light.py
```


Nota: O servidor iniciará por padrão na porta 5000. Certifique-se de que o firewall permite conexões se estiver testando em rede local.


### 6.2. Configuração do Aplicativo (Frontend)

Em um novo terminal, navegue até a pasta do app e inicie o Expo:

```bash
cd app-karaoke
npm install
npx expo start
```

Use o QR Code gerado no terminal para abrir o aplicativo no **Expo Go**.

## 7. Configuração de APIs

O projeto requer chaves de acesso para funcionalidades externas. Atualmente, estas devem ser configuradas nos arquivos de ambiente ou diretamente nos arquivos de configuração (recomenda-se a migração para `.env`):

*   **YouTube Data API v3**: Necessária para a funcionalidade de busca de vídeos.
*   **Replicate API Token**: Necessário para utilizar o modelo Demucs na nuvem.
*   **Fadr API Key**: Opcional, para motores alternativos de separação.

## 8. Contribuição e Licença

Contribuições são bem-vindas. Para alterações maiores, abra uma *issue* primeiro para discutir o que você gostaria de mudar.

**Licença:** Este projeto está sob a licença MIT. Consulte o arquivo `LICENSE` para mais detalhes.

---

Documento gerado para o repositório gh_karaoke_pro em 01 de julho de 2026.
