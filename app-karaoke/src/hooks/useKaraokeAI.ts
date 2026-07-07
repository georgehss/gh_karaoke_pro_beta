import { useState } from 'react';
import { Platform } from 'react-native';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import { URL_SERVIDOR } from '../utils/indexUtils';

interface ExtrairLetraCallbacks {
  setNomeLetra: (nome: string) => void;
  setLetras: (letras: any[]) => void;
  setLinhasSync: (linhas: any[]) => void;
  setIndiceCriador: (idx: number) => void;
  setIsModoCriador: (val: boolean) => void;
  setTelaAtiva: (tela: any) => void;
  processarLRC: (conteudo: string) => any[];
}

export function useKaraokeAI(arquivoAudio: any, modeloIA: 'fadr' | 'replicate' | 'local', setAudioUri: (uri: string) => void) {
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [isExtractingLyrics, setIsExtractingLyrics] = useState<boolean>(false);
  const [karaokePronto, setKaraokePronto] = useState<boolean>(false);
  const [urlPlayback, setUrlPlayback] = useState<string | null>(null);
  const [urlVoz, setUrlVoz] = useState<string | null>(null);

  const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

  const processarKaraoke = async () => {
    if (!arquivoAudio) return;
    setIsProcessing(true);
    try {
      if (Platform.OS !== 'web') await activateKeepAwakeAsync();
      const formData = new FormData();
      if (Platform.OS === 'web') {
        if (arquivoAudio.file) formData.append('audio', arquivoAudio.file, arquivoAudio.name);
        else {
          const res = await fetch(arquivoAudio.uri);
          formData.append('audio', await res.blob(), arquivoAudio.name);
        }
      } else {
        formData.append('audio', { uri: arquivoAudio.uri, name: arquivoAudio.name, type: arquivoAudio.mimeType || 'audio/mpeg' } as any);
      }

      if (modeloIA === 'replicate') {
        const initResponse = await fetch(`${URL_SERVIDOR}/separar_replicate`, { method: 'POST', body: formData });
        if (!initResponse.ok) throw new Error('Falha no servidor');
        const initData = await initResponse.json();
        if (!initData.sucesso || !initData.job_id) {
          alert("❌ Erro: " + (initData.erro || "Falha ao iniciar"));
          return;
        }

        const jobId = initData.job_id;
        const nomeBase = initData.nome_base || 'musica';
        let processando = true; let tentativas = 0;

        while (processando && tentativas < 100) {
          await delay(3000); tentativas++;
          const statusRes = await fetch(`${URL_SERVIDOR}/status_replicate/${jobId}?nome_base=${encodeURIComponent(nomeBase)}`);
          const statusData = await statusRes.json();
          if (statusData.status === 'concluido') {
            processando = false;
            setAudioUri(statusData.url); setKaraokePronto(true); setUrlPlayback(statusData.url); setUrlVoz(statusData.url_voz);
          } else if (statusData.status === 'erro') {
            processando = false; alert("❌ Erro na Replicate"); return;
          }
        }
      } else {
        const rota = modeloIA === 'local' ? '/separar' : '/separar_fadr';
        const res = await fetch(`${URL_SERVIDOR}${rota}`, { method: 'POST', body: formData });
        const dados = await res.json();
        if (!dados.sucesso) return alert("❌ Erro: " + dados.erro);
        setAudioUri(dados.url); setKaraokePronto(true); setUrlPlayback(dados.url); setUrlVoz(dados.url_voz);
      }
    } catch (e) { alert("Erro de conexão."); } finally {
      setIsProcessing(false); if (Platform.OS !== 'web') await deactivateKeepAwake();
    }
  };

  const extrairLetraComIA = async (callbacks: ExtrairLetraCallbacks) => {
    if (!arquivoAudio) return alert("Selecione uma música primeiro!");
    setIsExtractingLyrics(true);
    try {
      if (Platform.OS !== 'web') await activateKeepAwakeAsync();
      const formData = new FormData();
      if (Platform.OS === 'web') {
        if (arquivoAudio.file) formData.append('audio', arquivoAudio.file, arquivoAudio.name);
        else {
          const r = await fetch(arquivoAudio.uri);
          formData.append('audio', await r.blob(), arquivoAudio.name);
        }
      } else {
        formData.append('audio', { uri: arquivoAudio.uri, name: arquivoAudio.name, type: arquivoAudio.mimeType || 'audio/mpeg' } as any);
      }

      const resposta = await fetch(`${URL_SERVIDOR}/extrair_letra`, { method: 'POST', body: formData });
      const dados = await resposta.json();

      if (dados.sucesso && dados.lrc) {
        callbacks.setNomeLetra(`[IA] ${arquivoAudio.name}`);
        let conteudoFinal = dados.lrc;

        if (conteudoFinal.includes('-->')) {
          const linhas = conteudoFinal.split('\n');
          let lrcConvertido = "";
          const vttRegex = /(?:(\d{2,}):)?(\d{2}):(\d{2})[.,](\d{3})\s*-->/;
          for (let i = 0; i < linhas.length; i++) {
            const match = vttRegex.exec(linhas[i].trim());
            if (match) {
              const horas = match[1] ? parseInt(match[1], 10) : 0;
              const min = parseInt(match[2], 10) + (horas * 60);
              let texto = ""; let j = i + 1;
              while (j < linhas.length && linhas[j].trim() !== "" && !linhas[j].includes('-->')) {
                texto += linhas[j].trim() + " "; j++;
              }
              lrcConvertido += `[${min.toString().padStart(2, '0')}:${match[3]}.${match[4]}] ${texto.trim()}\n`;
            }
          }
          conteudoFinal = lrcConvertido;
        }

        const processado = callbacks.processarLRC(conteudoFinal);
        callbacks.setLetras(processado);
        callbacks.setLinhasSync(processado.map((l: any) => ({ tempo: l.tempo, texto: l.texto })));
        callbacks.setIndiceCriador(processado.length);
        callbacks.setTelaAtiva('principal');
        callbacks.setIsModoCriador(true);
        alert("✅ Letra extraída com sucesso!");
      } else { alert("Erro da IA: " + dados.erro); }
    } catch (e) { alert("Erro de conexão."); } finally {
      setIsExtractingLyrics(false); if (Platform.OS !== 'web') await deactivateKeepAwake();
    }
  };

  return { isProcessing, isExtractingLyrics, karaokePronto, urlPlayback, urlVoz, processarKaraoke, extrairLetraComIA, setKaraokePronto, setUrlPlayback, setUrlVoz };
}
