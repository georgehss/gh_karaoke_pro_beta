import { useState, useEffect, useRef } from 'react';
import { Platform, Keyboard, Alert } from 'react-native';
import { useAudioPlayer, setAudioModeAsync } from 'expo-audio';
import { useVideoPlayer } from 'expo-video';
import * as FileSystem from 'expo-file-system/legacy';
import { URL_SERVIDOR, LIBRARY_DIR } from '../utils/indexUtils';
import type { PlaylistItem } from '../utils/indexUtils';

export function useAudioEngine(
  motorBusca: 'externo' | 'interno',
  pastasVirtuaisWeb: any,
  pastasVirtuaisLrcWeb: any
) {
  // 1. ATIVAR ÁUDIO EM SEGUNDO PLANO
  useEffect(() => {
    const configurarAudioBackground = async () => {
      if (Platform.OS !== 'web') {
        try { await setAudioModeAsync({ shouldPlayInBackground: true, playsInSilentMode: true }); } 
        catch (e) { console.log("Erro áudio background:", e); }
      }
    };
    configurarAudioBackground();
  }, []);

  // 2. ESTADOS: ESTÚDIO (IA)
  const [arquivoAudio, setArquivoAudio] = useState<any>(null);
  const [audioUri, setAudioUri] = useState<string | null>(null);
  const audioPlayer = useAudioPlayer(audioUri);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [tempoAtual, setTempoAtual] = useState<number>(0);
  const [duracaoTotal, setDuracaoTotal] = useState<number>(0);

  const tocarOuPausar = () => {
    if (!audioUri) return;
    if (isPlaying) { audioPlayer.pause(); setIsPlaying(false); } 
    else { audioPlayer.play(); setIsPlaying(true); }
  };
  const retrocederAudio = () => { if(audioPlayer) audioPlayer.seekTo(Math.max(0, tempoAtual - 5)); };
  const avancarAudio = () => { if(audioPlayer) audioPlayer.seekTo(Math.min(duracaoTotal, tempoAtual + 5)); };

  useEffect(() => {
    let intervalo: any;
    if (isPlaying && audioPlayer) {
      intervalo = setInterval(() => {
        const curr = audioPlayer.currentTime || 0; const dur = audioPlayer.duration || 0;
        setTempoAtual(curr); setDuracaoTotal(dur);
        if (dur > 0 && curr >= dur - 0.5) { setIsPlaying(false); audioPlayer.pause(); audioPlayer.seekTo(0); }
      }, 150);
    }
    return () => clearInterval(intervalo);
  }, [isPlaying, audioPlayer]);

  // 3. REPRODUTOR PRINCIPAL E FILA
  const [playlist, setPlaylist] = useState<PlaylistItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(-1);
  const [reproducaoTemp, setReproducaoTemp] = useState<{uri: string, name: string, isInterno?: boolean} | null>(null);
  const [isPlaylistVisible, setIsPlaylistVisible] = useState<boolean>(Platform.OS === 'web');
  const [isExtracting, setIsExtracting] = useState<boolean>(false);
  const [urlAudioExtraido, setUrlAudioExtraido] = useState<string | null>(null);

  const arquivoPro = reproducaoTemp || (currentIndex >= 0 && currentIndex < playlist.length ? playlist[currentIndex] : null);

  const player = useVideoPlayer(arquivoPro ? arquivoPro.uri : null, (p) => {
    if (!p) return; p.loop = false; p.play(); p.staysActiveInBackground = true; p.showNowPlayingNotification = true;
  });

  useEffect(() => { if (arquivoPro && player) player.play(); }, [arquivoPro]);

  useEffect(() => {
    if (!player) return;
    const sub = player.addListener('playToEnd', () => {
      if (reproducaoTemp) { setReproducaoTemp(null); setCurrentIndex(-1); } 
      else if (currentIndex >= 0 && currentIndex < playlist.length - 1) { setCurrentIndex(currentIndex + 1); setUrlAudioExtraido(null); } 
      else if (currentIndex === playlist.length - 1) { setCurrentIndex(-1); }
    });
    return () => sub.remove();
  }, [player, currentIndex, playlist.length, reproducaoTemp]);

  const adicionarNaPlaylist = (uri: string, name: string, isInterno: boolean = false) => {
    const novoItem = { id: Date.now().toString(), uri, name, isInterno };
    setPlaylist((prev) => [...prev, novoItem]);
  };

  const tocarProxima = () => { setReproducaoTemp(null); if (currentIndex < playlist.length - 1) { setCurrentIndex(currentIndex + 1); setUrlAudioExtraido(null); } };
  const tocarAnterior = () => { setReproducaoTemp(null); if (currentIndex > 0) { setCurrentIndex(currentIndex - 1); setUrlAudioExtraido(null); } };
  
  const removerDaPlaylist = (index: number) => {
    const novaLista = [...playlist]; novaLista.splice(index, 1); setPlaylist(novaLista);
    if (novaLista.length === 0) setCurrentIndex(-1);
    else if (index < currentIndex) setCurrentIndex(currentIndex - 1);
    else if (index === currentIndex) setCurrentIndex(-1);
  };
  
  const limparPlaylist = () => { setPlaylist([]); setCurrentIndex(-1); setReproducaoTemp(null); };

  const confirmarLimparPlaylist = () => {
    if (playlist.length === 0) return;
    if (Platform.OS === 'web') {
      if ((window as any).confirm("Tem certeza que deseja apagar todas as músicas da lista de reprodução?")) limparPlaylist();
    } else {
      Alert.alert("Limpar Fila", "Tem certeza que deseja apagar todas as músicas da lista de reprodução?", [{ text: "Cancelar", style: "cancel" }, { text: "Sim, Limpar", onPress: limparPlaylist }]);
    }
  };

  const moverItemFila = (index: number, direcao: 'up' | 'down') => {
    if (direcao === 'up' && index === 0) return;
    if (direcao === 'down' && index === playlist.length - 1) return;
    const novaLista = [...playlist];
    const swapIndex = direcao === 'up' ? index - 1 : index + 1;
    if (currentIndex === index) setCurrentIndex(swapIndex);
    else if (currentIndex === swapIndex) setCurrentIndex(index);
    const temp = novaLista[index]; novaLista[index] = novaLista[swapIndex]; novaLista[swapIndex] = temp;
    setPlaylist(novaLista);
  };

  const repararLinksDaFila = (filaLida: any[]) => {
    if (Platform.OS !== 'web') return filaLida;
    const todasAsMidiasVivas: {nome: string, uri: string}[] = [];
    Object.values(pastasVirtuaisWeb).forEach((arr: any) => todasAsMidiasVivas.push(...arr));
    return filaLida.map(item => {
      if (item.uri && !item.uri.startsWith('http')) {
        const midiaNova = todasAsMidiasVivas.find(m => m.nome === item.name);
        if (midiaNova) return { ...item, uri: midiaNova.uri };
      }
      return item;
    });
  };

  const extrairAudioDoVideo = async () => {
    if (!arquivoPro) return;
    setIsExtracting(true); setUrlAudioExtraido(null);
    try {
      const formData = new FormData();
      if (Platform.OS === 'web') {
        const response = await fetch(arquivoPro.uri);
        const blob = await response.blob();
        formData.append('file', blob, arquivoPro.name);
      } else {
        const ext = arquivoPro.name.split('.').pop()?.toLowerCase() || 'mp4';
        formData.append('file', { uri: arquivoPro.uri, name: arquivoPro.name, type: `video/${ext}` } as any);
      }
      const resposta = await fetch(`${URL_SERVIDOR}/extrair`, { method: 'POST', body: formData });
      const dados = await resposta.json();
      setUrlAudioExtraido(dados.url); setIsExtracting(false);
    } catch (erro) { setIsExtracting(false); alert("Erro na extração."); }
  };

  // 4. BUSCA YOUTUBE / SOUNDCLOUD
  const [fonteBusca, setFonteBusca] = useState<'youtube' | 'soundcloud'>('youtube');
  const [buscaYoutube, setBuscaYoutube] = useState<string>('');
  const [resultadosYoutube, setResultadosYoutube] = useState<any[]>([]);
  const [isBuscandoYt, setIsBuscandoYt] = useState<boolean>(false);
  const [isBaixandoYt, setIsBaixandoYt] = useState<boolean>(false);
  const [idBaixando, setIdBaixando] = useState<string | null>(null);

  const limparBusca = () => { setBuscaYoutube(''); setResultadosYoutube([]); Keyboard.dismiss(); };

  const fazerBuscaYoutube = async () => {
    if (!buscaYoutube.trim()) return;
    Keyboard.dismiss(); setIsBuscandoYt(true); setResultadosYoutube([]);
    try {
      let resultadosLocais: any[] = [];
      const termoBusca = buscaYoutube.toLowerCase();

      if (Platform.OS === 'web') {
        Object.values(pastasVirtuaisWeb).forEach((arquivos: any) => {
          arquivos.forEach((arq: any) => {
            if (arq.nome.toLowerCase().includes(termoBusca)) resultadosLocais.push({ id: arq.uri, titulo: `[PC] ${arq.nome}`, isLocal: true, thumb: null, source: 'local' });
          });
        });
        Object.values(pastasVirtuaisLrcWeb).forEach((arquivos: any) => {
          arquivos.forEach((arq: any) => {
            if (arq.nome.toLowerCase().includes(termoBusca)) resultadosLocais.push({ id: arq.audioUri, titulo: `[LRC PC] ${arq.nome}`, isLocal: true, thumb: null, source: 'local' });
          });
        });
      }

      if (Platform.OS !== 'web') {
        try {
          const dirInfo = await FileSystem.getInfoAsync(LIBRARY_DIR);
          if (dirInfo.exists) {
            const pastasLidas = await FileSystem.readDirectoryAsync(LIBRARY_DIR);
            for (const pasta of pastasLidas) {
              if (!pasta.includes('.')) { 
                const caminhoPasta = `${LIBRARY_DIR}${pasta}`;
                const arquivos = await FileSystem.readDirectoryAsync(caminhoPasta);
                for (const arq of arquivos) {
                  if (arq.toLowerCase().includes(termoBusca)) resultadosLocais.push({ id: `${caminhoPasta}/${arq}`, titulo: arq, isLocal: true, thumb: null, source: 'local' });
                }
              }
            }
          }
        } catch (erroLocal) { console.log("Erro busca local", erroLocal); }
      }

      if (resultadosLocais.length > 0) {
        resultadosLocais.sort((a: any, b: any) => a.titulo.localeCompare(b.titulo));
        setResultadosYoutube(resultadosLocais);
        setIsBuscandoYt(false);
        return; 
      }

      if (motorBusca === 'externo') {
        const endpoint = fonteBusca === 'soundcloud' ? '/buscar_soundcloud' : '/buscar_youtube';
        const resposta = await fetch(`${URL_SERVIDOR}${endpoint}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ query: buscaYoutube }) });
        const dados = await resposta.json();
        if (dados.sucesso) {
          const resultadosComFonte = dados.resultados.map((item: any) => ({ ...item, source: fonteBusca }));
          setResultadosYoutube(resultadosComFonte);
        }
      } else {
        const YOUTUBE_API_KEY = 'AIzaSyBsTCanvwC87oHqR4wODQ1dFztlh0kLo0s'; 
        const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=20&q=${encodeURIComponent(buscaYoutube)}&type=video&key=${YOUTUBE_API_KEY}`;
        const resposta = await fetch(url);
        const dados = await resposta.json();
        if (dados.items) {
          const resultadosFormatados = dados.items.map((item: any) => ({ id: item.id.videoId, titulo: item.snippet.title, thumb: item.snippet.thumbnails.high.url, isInterno: true, source: 'youtube' }));
          setResultadosYoutube(resultadosFormatados);
        }
      }
    } catch (erro) { alert("Erro na busca. Verifique no MENU qual dos modos está ativado, servidor externo ou servidor interno. Tente mudar o servidor atual."); }
    setIsBuscandoYt(false);
  };

  const iniciarTocarYoutube = async (id: string, formato: string, titulo: string, resolucao: string, extensao: string, acao: string, source: string) => {
    setIsBaixandoYt(true); setIdBaixando(id);
    let resultado = null;
    try {
      const endpoint = source === 'soundcloud' ? '/baixar_soundcloud' : '/baixar_youtube';
      const resposta = await fetch(`${URL_SERVIDOR}${endpoint}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, formato, resolucao, extensao }) });
      const dados = await resposta.json();
      
      if (dados.sucesso) {
        // Limpa o nome do arquivo para não corromper o salvamento no Windows/Android
        const nomeLimpo = titulo.replace(/[\\/\\\\?%*:|"<>]/g, '').trim() || 'Media';
        
        if (acao === 'tocar') {
          setReproducaoTemp({ uri: dados.url, name: `[Tocando Agora] ${nomeLimpo}.${extensao}` });
          setUrlAudioExtraido(null); setIsPlaylistVisible(false);
        } else if (acao === 'fila') {
          adicionarNaPlaylist(dados.url, `${nomeLimpo}.${extensao}`);
          alert("Adicionado à Lista de Reprodução!");
        }
        
        // MÁGICA: Retorna a URL para o index.tsx usar na tela de Destino do Download
        resultado = { url: dados.url, nomeFinal: `${nomeLimpo}.${extensao}` };
      } else { alert("Erro no servidor."); }
    } catch (erro) { alert("Falha na conexão com o servidor."); }
    setIsBaixandoYt(false); setIdBaixando(null);
    return resultado;
  };

  // 5. RASTREADOR YOUTUBE
  const youtubePlayerRef = useRef<any>(null);
  const youtubeTimeRef = useRef<number>(0);
  useEffect(() => { if (arquivoPro) youtubeTimeRef.current = 0; }, [arquivoPro?.uri]);
  useEffect(() => {
      const interval = setInterval(() => {
          if (arquivoPro?.isInterno) {
              if (Platform.OS === 'web') youtubeTimeRef.current += 0.5;
              else if (youtubePlayerRef.current) youtubePlayerRef.current.getCurrentTime().then((time: number) => { youtubeTimeRef.current = time; }).catch(() => {});
          }
      }, 500);
      return () => clearInterval(interval);
  }, [arquivoPro]);

  // 6. REPRODUTOR LRC
  const [lrcAudioUri, setLrcAudioUri] = useState<string | null>(null);
  const lrcAudioPlayer = useAudioPlayer(lrcAudioUri);
  const [isLrcPlaying, setIsLrcPlaying] = useState<boolean>(false);
  const [lrcTempoAtual, setLrcTempoAtual] = useState<number>(0);
  const [lrcDuracaoTotal, setLrcDuracaoTotal] = useState<number>(0);

  const tocarOuPausarLrc = () => {
    if (!lrcAudioUri) return;
    if (isLrcPlaying) { lrcAudioPlayer.pause(); setIsLrcPlaying(false); } 
    else { lrcAudioPlayer.play(); setIsLrcPlaying(true); }
  };

  return {
    arquivoAudio, setArquivoAudio, audioUri, setAudioUri, audioPlayer, isPlaying, setIsPlaying, tempoAtual, setTempoAtual, duracaoTotal, setDuracaoTotal, tocarOuPausar, retrocederAudio, avancarAudio,
    playlist, setPlaylist, currentIndex, setCurrentIndex, reproducaoTemp, setReproducaoTemp, isPlaylistVisible, setIsPlaylistVisible, urlAudioExtraido, setUrlAudioExtraido, isExtracting, extrairAudioDoVideo, arquivoPro, player, tocarProxima, tocarAnterior, removerDaPlaylist, limparPlaylist, confirmarLimparPlaylist, adicionarNaPlaylist, moverItemFila, repararLinksDaFila,
    fonteBusca, setFonteBusca, buscaYoutube, setBuscaYoutube, resultadosYoutube, setResultadosYoutube, isBuscandoYt, setIsBuscandoYt, isBaixandoYt, setIsBaixandoYt, idBaixando, setIdBaixando, limparBusca, fazerBuscaYoutube, iniciarTocarYoutube,
    youtubePlayerRef, youtubeTimeRef,
    lrcAudioUri, setLrcAudioUri, lrcAudioPlayer, isLrcPlaying, setIsLrcPlaying, lrcTempoAtual, setLrcTempoAtual, lrcDuracaoTotal, setLrcDuracaoTotal, tocarOuPausarLrc
  };
}