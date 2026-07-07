import React, { useState, useEffect, useRef } from 'react';
import { Text, View, TouchableOpacity, ActivityIndicator, Platform, FlatList, Modal, TextInput, Image, Keyboard, ScrollView, useWindowDimensions, Linking, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context'; 
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import Slider from '@react-native-community/slider';
import { Ionicons } from '@expo/vector-icons';
import ModalConfiguracoes from '../../src/components/modals/ModalConfiguracoes';
import ModalQualidadeYoutube from '../../src/components/modals/ModalQualidadeYoutube';
import ModalMixer from '../../src/components/modals/ModalMixer';
import FilaReproducao from '../../src/components/FilaReproducao';
import PainelBiblioteca from '../../src/components/PainelBiblioteca';
import MenuLateral from '../../src/components/modals/MenuLateral';
import { ModalNovaPasta, ModalOrdem, ModalRenomearBib, ModalAcaoArquivo } from '../../src/components/modals/ModaisBiblioteca';
import { useLibraryManager } from '../../src/hooks/useLibraryManager';
import { useAudioEngine } from '../../src/hooks/useAudioEngine';
import { useWebAudioEffects } from '../../src/hooks/useWebAudioEffects';
import { useKaraokeAI } from '../../src/hooks/useKaraokeAI';
import { gerarHtmlMonitorExterno } from '../../src/utils/monitorTemplate';
import TelaEstudioIA from '../../src/screens/TelaEstudioIA';
import TelaReprodutorYoutube from '../../src/screens/TelaReprodutorYoutube';
import TelaReprodutorLRC from '../../src/screens/TelaReprodutorLRC';
import ModalDestinoDownload from '../../src/components/modals_extra/ModalDestinoDownload';
import ModalBuscaLetra from '../../src/components/modals_extra/ModalBuscaLetra';


// Quando colocar na nuvem ou ngrok, é só trocar este link inteiro!
import { styles } from '../../src/styles/indexStyles';
import { URL_SERVIDOR, LIBRARY_DIR, LRC_LIBRARY_DIR, PLAYLISTS_DIR, processarLRC, formatarTempo, delay } from '../../src/utils/indexUtils';
import type { PlaylistItem } from '../../src/utils/indexUtils';

export default function IndexScreen() {
  // Pegamos as dimensões iniciais da TELA INTEIRA (ignorando o teclado)
  const [isLandscape, setIsLandscape] = useState(
    Dimensions.get('screen').width > Dimensions.get('screen').height
  );

  useEffect(() => {
    // Atualiza a orientação apenas quando o usuário realmente girar a tela
    const updateOrientation = () => {
      const screen = Dimensions.get('screen');
      setIsLandscape(screen.width > screen.height);
    };

    const subscription = Dimensions.addEventListener('change', updateOrientation);
  
  return () => subscription?.remove();
  }, []);

  // --- BLOQUEIO DE CLIQUE NO CORPO DO VÍDEO (WEB) ---
  useEffect(() => {
    if (Platform.OS !== 'web') return;

    const interceptarCliqueVideo = (e: any) => {
      // Busca a tag de vídeo em si na tela
      const videoElement = document.querySelector('video');
      if (!videoElement) return;

      const rect = videoElement.getBoundingClientRect();
      
      // Verifica se o clique ocorreu fisicamente DENTRO da área que o vídeo ocupa na tela
      // Isso burla qualquer <div> transparente que o expo-video coloque por cima!
      const isDentroDoContainer = 
        e.clientX >= rect.left && 
        e.clientX <= rect.right && 
        e.clientY >= rect.top && 
        e.clientY <= rect.bottom;

      if (isDentroDoContainer) {
        // Os controles originais do player (play/pause, volume, fullscreen) ficam na base (~60px)
        const clickNoCorpoDoVideo = (rect.bottom - e.clientY) > 60;
        
        if (clickNoCorpoDoVideo) {
          // Mata a ação do navegador e a propagação pro React/Expo
          e.preventDefault(); 
          e.stopPropagation(); 
        }
      }
    };

    // Bibliotecas modernas usam pointerdown/pointerup em vez de click para evitar delay
    window.addEventListener('pointerdown', interceptarCliqueVideo, true);
    window.addEventListener('pointerup', interceptarCliqueVideo, true);
    window.addEventListener('click', interceptarCliqueVideo, true);

    return () => {
      window.removeEventListener('pointerdown', interceptarCliqueVideo, true);
      window.removeEventListener('pointerup', interceptarCliqueVideo, true);
      window.removeEventListener('click', interceptarCliqueVideo, true);
    };
  }, []);

  const { width, height } = useWindowDimensions(); // Mantenha isso se usar para outras coisas
  const [telaAtiva, setTelaAtiva] = useState<'principal' | 'reprodutor' | 'reprodutor_lrc' | 'biblioteca' | 'biblioteca_lrc'>('principal');
  const [motorBusca, setMotorBusca] = useState<'externo' | 'interno'>('externo');

  // --- NOVOS ESTADOS: CONFIGURAÇÕES E IA ---
  const [modalConfigAberto, setModalConfigAberto] = useState<boolean>(false);
  const [modeloIA, setModeloIA] = useState<'fadr' | 'replicate' | 'local'>('replicate');

  // ... HOOK DE GERENCIAMENTO DE ARQUIVOS EXTERNO ...
  const {
    pastas, pastaAtual, arquivosPasta, modalNovaPasta, setModalNovaPasta, nomeNovaPasta, setNomeNovaPasta,
    modalAcaoArquivo, setModalAcaoArquivo, modoSelecaoBib, selecionadosBib, pastasVirtuaisWeb, pastasVirtuaisLrcWeb,
    modalRenomearBib, setModalRenomearBib, novoNomeBib, setNovoNomeBib, modoVisao, setModoVisao, infoPastas, infoPastasLrc,
    modalOrdem, setModalOrdem, criterioOrdem, pastasLrc, pastaAtualLrc, arquivosPastaLrc, modalNovaPastaLrc, setModalNovaPastaLrc, nomeNovaPastaLrc, setNomeNovaPastaLrc,
    iniciarModoSelecao, cancelarSelecao, toggleSelecaoArquivo, apagarSelecionados, exportarSelecionados,
    mudarOrdem, formatarTamanhoBytes, inicializarBiblioteca, criarNovaPasta, entrarNaPasta, voltarParaPastas,
    linkarPastaPCWeb, restaurarPastasSalvasPC, importarArquivos, apagarItem,
    inicializarBibliotecaLrc, criarNovaPastaLrc, entrarNaPastaLrc, voltarParaPastasLrc,
    importarArquivosLrc, apagarItemLrc, exportarArquivoBib, abrirRenomearBib, confirmarRenomearBib, apagarPeloModalOpcoes
  } = useLibraryManager(telaAtiva);

    // ... HOOK DE REPRODUÇÃO DE ÁUDIO E VÍDEO ...
  const audioEngine = useAudioEngine(motorBusca, pastasVirtuaisWeb, pastasVirtuaisLrcWeb);
  const {
    arquivoAudio, setArquivoAudio, audioUri, setAudioUri, audioPlayer, isPlaying, setIsPlaying, tempoAtual, setTempoAtual, duracaoTotal, setDuracaoTotal, tocarOuPausar, retrocederAudio, avancarAudio,
    playlist, setPlaylist, currentIndex, setCurrentIndex, reproducaoTemp, setReproducaoTemp, isPlaylistVisible, setIsPlaylistVisible, urlAudioExtraido, setUrlAudioExtraido, isExtracting, extrairAudioDoVideo, arquivoPro, player, tocarProxima, tocarAnterior, removerDaPlaylist, limparPlaylist, confirmarLimparPlaylist, adicionarNaPlaylist, moverItemFila, repararLinksDaFila,
    fonteBusca, setFonteBusca, buscaYoutube, setBuscaYoutube, resultadosYoutube, setResultadosYoutube, isBuscandoYt, setIsBuscandoYt, isBaixandoYt, setIsBaixandoYt, idBaixando, setIdBaixando, limparBusca, fazerBuscaYoutube, iniciarTocarYoutube,
    youtubePlayerRef, youtubeTimeRef,
    lrcAudioUri, setLrcAudioUri, lrcAudioPlayer, isLrcPlaying, setIsLrcPlaying, lrcTempoAtual, setLrcTempoAtual, lrcDuracaoTotal, setLrcDuracaoTotal, tocarOuPausarLrc
  } = audioEngine;

    // ... HOOK DE EQUALIZAÇÃO E MIXER ...
  const webAudio = useWebAudioEffects(arquivoPro, lrcAudioUri);
  const {
    micAtivo, volMic, setVolMic, graveNivel, setGraveNivel, medioNivel, setMedioNivel, agudoNivel, setAgudoNivel,
    echoNivel, setEchoNivel, echoTempo, setEchoTempo, echoFeedback, setEchoFeedback, reverbNivel, setReverbNivel, reverbTempo, setReverbTempo,
    micDevices, selectedMicId, setSelectedMicId, mostrarInterfaces, setMostrarInterfaces, carregarDispositivosDeAudio, alternarMicrofone,
    eqPlaybackAtivo, setEqPlaybackAtivo, eqPlaybackExpandido, setEqPlaybackExpandido, eqGrave, setEqGrave, eqMedio, setEqMedio, eqAgudo, setEqAgudo, eqGanho, setEqGanho
  } = webAudio;

  // ... HOOK DE INTELIGÊNCIA ARTIFICIAL ...
  const karaokeAI = useKaraokeAI(arquivoAudio, modeloIA, setAudioUri);
  const {
    isProcessing, isExtractingLyrics, karaokePronto, urlPlayback, urlVoz,
    processarKaraoke, setKaraokePronto, setUrlPlayback, setUrlVoz
  } = karaokeAI;
  
  // Ponte de comunicação para o Hook de IA
  const extrairLetraComIA = () => karaokeAI.extrairLetraComIA({
      setNomeLetra, setLetras, setLinhasSync, setIndiceCriador, setIsModoCriador, setTelaAtiva, processarLRC
  });

  // =========================================================================
  // FUNÇÕES DE PONTE (BIBLIOTECA E YOUTUBE)
  // =========================================================================
  const tocarParCasadoLrc = (nomeLrc: string) => {
    const nomeBase = nomeLrc.replace('.lrc', '');
    if (pastaAtualLrc) {
      construirPlaylistLrcDaPasta(pastaAtualLrc, nomeBase);
    }
    navegarPara('reprodutor_lrc');
  };

  const acaoBibliotecaTocar = (modo: 'agora' | 'fila') => {
    if (!modalAcaoArquivo) return;
    const { nome, uri, isLrc } = modalAcaoArquivo;
    if (isLrc) {
      tocarParCasadoLrc(nome);
    } else {
      if (modo === 'agora') {
        setReproducaoTemp({ uri, name: nome });
        setIsPlaylistVisible(false);
        navegarPara('reprodutor');
      } else {
        adicionarNaPlaylist(uri, nome);
      }
    }
    setModalAcaoArquivo(null);
  };

  const escolherQualidade = async (resolucao: string, extensao: string) => {
    if (!modalQualidadeYt) return;
    const req = modalQualidadeYt;
    setModalQualidadeYt(null); // Limpa o modal de resolução para avançar

    // Pede ao backend a URL direta de download e fica esperando
    const resultado = await iniciarTocarYoutube(
      req.id, req.formato, req.titulo, resolucao, extensao, req.acao, req.source
    );

    // Se o usuário clicou em Baixar e o backend respondeu com sucesso, abre a tela de "Onde salvar"
    if (req.acao === 'baixar' && resultado) {
      setModalDestinoDownload({
        url: resultado.url,
        nomeFinal: resultado.nomeFinal,
        titulo: req.titulo
      });
    }
  };


  // =========================================================================
  // ESTADOS RESTAURADOS DA INTERFACE E MÁQUINA DE ESTADO (IA E REPRODUTOR)
  // =========================================================================
  
  const [nomeLetra, setNomeLetra] = useState<string | null>(null);
  const [letras, setLetras] = useState<any[]>([]);
  const [lrcLetras, setLrcLetras] = useState<any[]>([]);
  const [modalAcaoYoutube, setModalAcaoYoutube] = useState<any>(null);
  const [modalQualidadeYt, setModalQualidadeYt] = useState<any>(null);
  const [modalDestinoDownload, setModalDestinoDownload] = useState<any>(null);
  const [modoMonitorExterno, setModoMonitorExterno] = useState<boolean>(false);
  const janelaExternaRef = useRef<any>(null);
  const videoViewRef = useRef<any>(null);

  const alternarMonitorExterno = () => {
    if (Platform.OS !== 'web') {
      alert("O Monitor Externo (Dual Screen) é uma funcionalidade exclusiva da versão Web!");
      return;
    }

    if (modoMonitorExterno) {
      setModoMonitorExterno(false);
      if (janelaExternaRef.current && !janelaExternaRef.current.closed) {
        janelaExternaRef.current.close();
      }
    } else {
      setModoMonitorExterno(true);
      
      const isInterno = arquivoPro ? !!arquivoPro.isInterno : false;
      const tempoAtual = isInterno ? youtubeTimeRef.current : (player ? player.currentTime || 0 : 0);
      const uriInicial = arquivoPro ? arquivoPro.uri : '';
      const nomeInicial = arquivoPro ? arquivoPro.name : 'Aguardando música da fila...';

      if (player) player.pause();

      const novaJanela = window.open('', 'PlayerKaraokeExterno', 'width=1280,height=720,toolbar=no,menubar=no,scrollbars=no,location=no,status=no');
      janelaExternaRef.current = novaJanela;

      if (novaJanela) {
        // Puxa o HTML limpo importado do seu utilitário
        const htmlCompleto = gerarHtmlMonitorExterno(nomeInicial, uriInicial, isInterno, tempoAtual);
        
        novaJanela.document.write(htmlCompleto);
        novaJanela.document.close();

        novaJanela.onbeforeunload = () => {
          setModoMonitorExterno(false);
          window.postMessage({ type: 'janela_externa_fechada' }, '*');
        };
      }
    }
  };

  // --- ESTADOS E FUNÇÕES DA FILA DE REPRODUÇÃO (MODAIS E SALVAMENTO) ---
  const [modalPastasPro, setModalPastasPro] = useState<boolean>(false);
  const [modalRenomearFila, setModalRenomearFila] = useState<{id: string, name: string} | null>(null);
  const [modalSalvarFila, setModalSalvarFila] = useState<boolean>(false);
  const [nomeFilaSalva, setNomeFilaSalva] = useState<string>('');
  const [modalCarregarFila, setModalCarregarFila] = useState<boolean>(false);
  const [listasSalvas, setListasSalvas] = useState<string[]>([]);

  const carregarListasSalvas = async () => {
    try {
      const dirInfo = await FileSystem.getInfoAsync(PLAYLISTS_DIR);
      if (!dirInfo.exists) await FileSystem.makeDirectoryAsync(PLAYLISTS_DIR, { intermediates: true });
      const files = await FileSystem.readDirectoryAsync(PLAYLISTS_DIR);
      setListasSalvas(files.filter(f => f.endsWith('.json')).map(f => f.replace('.json', '')));
    } catch (e) {}
  };

  const salvarFilaAtual = async () => {
    if (!nomeFilaSalva.trim()) return alert("Digite um nome!");
    try {
      const dirInfo = await FileSystem.getInfoAsync(PLAYLISTS_DIR);
      if (!dirInfo.exists) await FileSystem.makeDirectoryAsync(PLAYLISTS_DIR, { intermediates: true });
      const filePath = `${PLAYLISTS_DIR}${nomeFilaSalva.trim()}.json`;
      await FileSystem.writeAsStringAsync(filePath, JSON.stringify(playlist));
      alert("Playlist salva com sucesso!");
      setModalSalvarFila(false);
      setNomeFilaSalva('');
    } catch (e) { alert("Erro ao salvar."); }
  };

  const exportarFilaComoArquivo = async () => {
    if (!nomeFilaSalva.trim()) return alert("Digite um nome!");
    try {
      const jsonStr = JSON.stringify(playlist);
      if (Platform.OS === 'web') {
        const blob = new Blob([jsonStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${nomeFilaSalva.trim()}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        const filePath = `${FileSystem.documentDirectory}${nomeFilaSalva.trim()}.json`;
        await FileSystem.writeAsStringAsync(filePath, jsonStr);
        if (await Sharing.isAvailableAsync()) await Sharing.shareAsync(filePath);
      }
      setModalSalvarFila(false);
      setNomeFilaSalva('');
    } catch (e) { alert("Erro ao exportar."); }
  };

  const carregarFilaSelecionada = async (nomeLista: string) => {
    try {
      const filePath = `${PLAYLISTS_DIR}${nomeLista}.json`;
      const conteudo = await FileSystem.readAsStringAsync(filePath);
      const filaLida = JSON.parse(conteudo);
      setPlaylist(repararLinksDaFila(filaLida));
      setModalCarregarFila(false);
      alert(`Playlist "${nomeLista}" carregada!`);
    } catch (e) { alert("Erro ao carregar."); }
  };

  const apagarFilaSalva = async (nomeLista: string) => {
    try {
      const filePath = `${PLAYLISTS_DIR}${nomeLista}.json`;
      await FileSystem.deleteAsync(filePath);
      carregarListasSalvas();
    } catch (e) { alert("Erro ao apagar."); }
  };

  const importarFilaDeArquivo = async () => {
    try {
      const resultado = await DocumentPicker.getDocumentAsync({ type: 'application/json' });
      if (!resultado.canceled) {
        let conteudo = "";
        if (Platform.OS === 'web') {
          const file = (resultado.assets[0] as any).file;
          conteudo = await file.text();
        } else {
          conteudo = await FileSystem.readAsStringAsync(resultado.assets[0].uri);
        }
        const filaLida = JSON.parse(conteudo);
        setPlaylist(repararLinksDaFila(filaLida));
        setModalCarregarFila(false);
        alert("Playlist importada com sucesso!");
      }
    } catch (e) { alert("Erro ao importar arquivo."); }
  };

  const salvarRenomearFila = () => {
    if (!modalRenomearFila) return;
    const novaLista = [...playlist];
    const item = novaLista.find(i => i.id === modalRenomearFila.id);
    if (item) item.name = modalRenomearFila.name;
    setPlaylist(novaLista);
    setModalRenomearFila(null);
  };

  const construirPlaylistLrcDaPasta = async (pasta: string, arquivoInicial: string = '') => {
    try {
      const caminhoPasta = `${LRC_LIBRARY_DIR}${pasta}/`;
      const arquivos = await FileSystem.readDirectoryAsync(caminhoPasta);
      
      const lrcFiles = arquivos.filter(f => f.toLowerCase().endsWith('.lrc'));
      const mediaExts = ['.mp4', '.mkv', '.avi', '.mov', '.webm', '.mp3', '.wav', '.m4a', '.aac'];
      const audioFiles = arquivos.filter(f => mediaExts.some(ext => f.toLowerCase().endsWith(ext)));

      const novaPlaylist = [];
      for (const lrc of lrcFiles) {
        const nomeBase = lrc.replace('.lrc', '');
        const audio = audioFiles.find(a => a.startsWith(nomeBase));
        if (audio) {
          novaPlaylist.push({
            id: nomeBase,
            name: nomeBase,
            audioUri: `${caminhoPasta}${audio}`,
            lrcUri: `${caminhoPasta}${lrc}`
          });
        }
      }

      if (novaPlaylist.length > 0) {
        novaPlaylist.sort((a, b) => a.name.localeCompare(b.name));
        setLrcPlaylist(novaPlaylist);
        const idx = arquivoInicial ? novaPlaylist.findIndex((p: any) => p.id === arquivoInicial) : 0;
        tocarItemLrc(novaPlaylist, idx !== -1 ? idx : 0);
      } else {
        alert("Nenhum par de Áudio + LRC encontrado nesta pasta.");
      }
    } catch (e) { alert("Erro ao carregar playlist da pasta."); }
  };



  const [menuAberto, setMenuAberto] = useState<boolean>(false);

  // 'externo' = Usa o backend Python (yt_dlp, com EQ e download)
  // 'interno' = Usa o frontend direto (YouTube API e Iframe, sem EQ)

  const [buscaFila, setBuscaFila] = useState<string>('');
  const [mostrarBuscaFila, setMostrarBuscaFila] = useState<boolean>(false);

  // --- ESTADOS: IA & LETRAS ---
    const [isModoCriador, setIsModoCriador] = useState<boolean>(false);
  const [linhasSync, setLinhasSync] = useState<{tempo: number | null, texto: string}[]>([]); 
  const [indiceCriador, setIndiceCriador] = useState<number>(0);
  

  // --- ESTADOS: IMPORTAR YOUTUBE/SOUNDCLOUD NO ESTÚDIO ---
  const [fonteBuscaEstudio, setFonteBuscaEstudio] = useState<'youtube' | 'soundcloud'>('youtube');
  const [modalOrigemMusica, setModalOrigemMusica] = useState<boolean>(false);
  const [modalBuscaYtEstudio, setModalBuscaYtEstudio] = useState<boolean>(false);
  const [buscaYtEstudio, setBuscaYtEstudio] = useState<string>('');
  const [resultadosYtEstudio, setResultadosYtEstudio] = useState<any[]>([]);
  const [isBuscandoYtEstudio, setIsBuscandoYtEstudio] = useState<boolean>(false);
  const [isBaixandoYtEstudio, setIsBaixandoYtEstudio] = useState<boolean>(false);
  const [idBaixandoEstudio, setIdBaixandoEstudio] = useState<string | null>(null);

  // --- ESTADOS: NAVEGAR NAS BIBLIOTECAS PELO ESTÚDIO ---
  const [modalBibEstudio, setModalBibEstudio] = useState<'local' | 'lrc' | null>(null);
  const [pastaBibEstudio, setPastaBibEstudio] = useState<string | null>(null);
  const [arquivosBibEstudio, setArquivosBibEstudio] = useState<string[]>([]);

  // --- ESTADOS: IMPORTAR LETRA DA BIBLIOTECA NO ESTÚDIO ---
  const [modalOrigemLetra, setModalOrigemLetra] = useState<boolean>(false);
  const [modalBibLetraLrc, setModalBibLetraLrc] = useState<boolean>(false);
  const [pastaBibLetraLrc, setPastaBibLetraLrc] = useState<string | null>(null);
  const [arquivosBibLetraLrc, setArquivosBibLetraLrc] = useState<string[]>([]);
  
  // --- ESTADOS: BUSCA DE LETRA ONLINE ---
  const [modalBuscaLetra, setModalBuscaLetra] = useState<boolean>(false);
  const [buscaTituloLrc, setBuscaTituloLrc] = useState<string>('');
  const [buscaArtistaLrc, setBuscaArtistaLrc] = useState<string>('');
  const [isBuscandoLrc, setIsBuscandoLrc] = useState<boolean>(false);
  const [resultadosLrc, setResultadosLrc] = useState<any[]>([]);

  // --- ESTADOS: SALVAR ÁUDIO DO YOUTUBE APÓS IMPORTAR ---
  const [modalSalvarYtEstudio, setModalSalvarYtEstudio] = useState<{uri: string, nome: string} | null>(null);
  const [destinoYtSelecionado, setDestinoYtSelecionado] = useState<'local' | 'lrc' | null>(null);

  // // --- ESTADOS: MIXER & EFEITOS (KARAOKÊ AO VIVO) ---
  const [modalMixer, setModalMixer] = useState<boolean>(false);
  

  

  // Carrega a lista toda vez que o modal do Mixer for aberto
  useEffect(() => {
    if (modalMixer) carregarDispositivosDeAudio();
  }, [modalMixer]);

  // --- ESTADOS: EDITOR LRC (SYNC EM MASSA / OFFSET) ---
  const [modalSyncMassa, setModalSyncMassa] = useState<boolean>(false);
  const [valorSyncMassa, setValorSyncMassa] = useState<string>('');

  // --- ESTADOS: METADADOS LRC ---
  const [modalMetadadosLrc, setModalMetadadosLrc] = useState<boolean>(false);
  const [lrcMetaFileName, setLrcMetaFileName] = useState<string>('');
  const [lrcMetaTitle, setLrcMetaTitle] = useState<string>('');
  const [lrcMetaArtist, setLrcMetaArtist] = useState<string>('');
  const [lrcMetaAlbum, setLrcMetaAlbum] = useState<string>('');
  const [lrcMetaBy, setLrcMetaBy] = useState<string>('');

  // --- ESTADOS: REPRODUTOR LRC (NOVO) ---
    const [lrcIndiceAtivo, setLrcIndiceAtivo] = useState<number>(-1);
  const lrcListRef = useRef<FlatList>(null);
  const [lrcMetaInfo, setLrcMetaInfo] = useState({ title: '', artist: '', album: '' });
  const [lrcCoverUrl, setLrcCoverUrl] = useState<string | null>(null);

  // FORÇA O PLAY AUTOMÁTICO QUANDO A MÚSICA LRC MUDA NA FILA
  useEffect(() => {
    if (lrcAudioUri && lrcAudioPlayer) {
      // Dá um micro-delay de 300ms para garantir que o áudio novo carregou na memória
      setTimeout(() => {
        // MÁGICA: Só dá o play se a música foi iniciada pelo sistema de Playlist/Pasta (isLrcPlaying = true).
        // Se foi apenas selecionada manualmente pelo botão "Selecionar Áudio" (isLrcPlaying = false), ele mantém pausado.
        if (isLrcPlaying) {
          lrcAudioPlayer.play();
        }
      }, 300); 
    }
  }, [lrcAudioUri]);
  
  // NOVOS ESTADOS DA PLAYLIST DO KARAOKÊ LRC
  
  const [isLrcPlaylistVisible, setIsLrcPlaylistVisible] = useState<boolean>(false);

  const [lrcPlaylist, setLrcPlaylist] = useState<any[]>([]);
  const [lrcCurrentIndex, setLrcCurrentIndex] = useState<number>(-1);

  const [modalPastasLrc, setModalPastasLrc] = useState<boolean>(false);

  const [modalDestinoLrc, setModalDestinoLrc] = useState<{ conteudo: string, nomeFinal: string } | null>(null);
  
  
  // --- NOVAS FUNÇÕES DO EDITOR PROFISSIONAL ---
  const formatarTempoMs = (segundos: number | null) => {
    if (segundos === null || isNaN(segundos)) return "--:--.---";
    const min = Math.floor(segundos / 60).toString().padStart(2, '0');
    const seg = Math.floor(segundos % 60).toString().padStart(2, '0');
    const ms = Math.floor((segundos % 1) * 1000).toString().padStart(3, '0');
    return `${min}:${seg}.${ms}`;
  };

  const ajustarTempoLinha = (index: number, delta: number) => {
    const novaLista = [...linhasSync];
    if (novaLista[index].tempo !== null) {
      novaLista[index].tempo = Math.max(0, novaLista[index].tempo! + delta);
      setLinhasSync(novaLista);
    }
  };

  const apagarTempoLinha = (index: number) => {
    const novaLista = [...linhasSync];
    novaLista[index].tempo = null;
    setLinhasSync(novaLista);
    if (index < indiceCriador) setIndiceCriador(index); // Volta o cursor
  };

  const editarTextoLinha = (index: number, novoTexto: string) => {
    const novaLista = [...linhasSync];
    novaLista[index].texto = novoTexto;
    setLinhasSync(novaLista);
  };

  const aplicarSyncEmMassa = () => {
    // Troca vírgula por ponto (caso o usuário digite 1,5) e transforma em número
    const valorNumerico = parseFloat(valorSyncMassa.replace(',', '.'));
    
    if (isNaN(valorNumerico)) {
      alert("Por favor, digite um número válido (ex: 1.5 ou -2.3)");
      return;
    }

    const novasLinhas = linhasSync.map(linha => {
      if (linha.tempo !== null) {
        // Math.max(0, ...) garante que o tempo nunca fique negativo (menor que zero)
        const novoTempo = Math.max(0, linha.tempo + valorNumerico);
        return { ...linha, tempo: novoTempo };
      }
      return linha;
    });

    setLinhasSync(novasLinhas);
    setModalSyncMassa(false);
    setValorSyncMassa('');
    alert(`Tempos ajustados em ${valorNumerico > 0 ? '+' : ''}${valorNumerico} segundos!`);
  };

    const flatListRef = useRef<FlatList>(null);
  const editorListRef = useRef<FlatList>(null);
  const [indiceAtivo, setIndiceAtivo] = useState<number>(-1);

  // --- ESTADOS: REPRODUTOR & YOUTUBE ---
    
  // Se houver música temporária (Tocar Agora), toca ela. Senão, se currentIndex for válido, toca a playlist. Senão, null.
  
  
  // EFEITO 1: Envia música para o monitor e segura o player principal pausado
  useEffect(() => {
    if (Platform.OS === 'web' && modoMonitorExterno && janelaExternaRef.current && !janelaExternaRef.current.closed) {
      if (arquivoPro) {
        janelaExternaRef.current.postMessage({
          type: 'tocar_nova_musica',
          uri: arquivoPro.uri,
          nome: arquivoPro.name,
          isInterno: !!arquivoPro.isInterno
        }, '*');

        // Dá um micro-delay e pausa o player principal, pois o Expo tenta dar auto-play
        if (player) {
          setTimeout(() => player.pause(), 150);
        }
      }
    }
  }, [arquivoPro, modoMonitorExterno]);

  // EFEITO 2: Escuta a janela secundária (Música acabou ou Janela fechou)
  useEffect(() => {
    if (Platform.OS !== 'web') return;

    const escutarMensagensExternas = (event: any) => {
      if (event.data && event.data.type === 'musica_terminou_externa') {
        // Forma à prova de falhas: força a fila a avançar usando o estado mais recente
        setReproducaoTemp(null);
        setCurrentIndex(prevIndex => {
            if (prevIndex < playlist.length - 1) {
              return prevIndex + 1;
            }
            return -1; // Fim da fila
        });
        setUrlAudioExtraido(null);
        
      } else if (event.data && event.data.type === 'janela_externa_fechada') {
        // 👇 REMOVEMOS O player.play() DAQUI TAMBÉM!
        // Apenas deixamos ele em paz.
      }
    };

    window.addEventListener('message', escutarMensagensExternas);
    return () => window.removeEventListener('message', escutarMensagensExternas);
  }, [playlist.length, arquivoPro, player]); // Dependências atualizadas para o player nunca se perder

  // EFEITO 3: Sincroniza o Equalizador com a Janela Externa em Tempo Real
  useEffect(() => {
    if (Platform.OS === 'web' && modoMonitorExterno && janelaExternaRef.current && !janelaExternaRef.current.closed) {
      // Dispara a mensagem atualizando a janela secundária
      janelaExternaRef.current.postMessage({
        type: 'sync_eq',
        ativo: eqPlaybackAtivo,
        ganho: eqGanho,
        grave: eqGrave,
        medio: eqMedio,
        agudo: eqAgudo
      }, '*');
    }
  }, [eqPlaybackAtivo, eqGanho, eqGrave, eqMedio, eqAgudo, modoMonitorExterno]);

  // --- FUNÇÕES DE AÇÃO EM MASSA ---
  const adicionarSelecionadosNaFila = () => {
    if (telaAtiva !== 'biblioteca') return;
    
    const novosItens = selecionadosBib.map(nome => {
      const uriLocal = (Platform.OS === 'web' && pastaAtual && pastasVirtuaisWeb[pastaAtual]) 
        ? (pastasVirtuaisWeb[pastaAtual].find(f => f.nome === nome)?.uri || '')
        : `${LIBRARY_DIR}${pastaAtual}/${nome}`;
        
      return { id: Date.now().toString() + Math.random().toString(), uri: uriLocal, name: nome };
    });

    setPlaylist(prev => [...prev, ...novosItens]);
    alert(`✅ ${novosItens.length} arquivo(s) adicionado(s) à fila!`);
    cancelarSelecao();
  };

  
  // --- FUNÇÃO EXCLUSIVA PARA LER PASTAS LRC DO PC NO MODO WEB ---
  const adicionarPastaLrcPCWeb = () => {
    if (Platform.OS !== 'web') return;
    
    const input = document.createElement('input');
    input.type = 'file';
    input.setAttribute('webkitdirectory', 'true');
    input.setAttribute('directory', 'true');
    input.multiple = true;
    
    input.onchange = (e: any) => {
      const files = e.target.files;
      if (!files || files.length === 0) return;
      
      const lrcFiles = [];
      const audioFiles = [];
      
      // 1. Separa quem é áudio e quem é letra (.lrc)
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const nameLower = file.name.toLowerCase();
        
        if (nameLower.endsWith('.lrc')) {
          lrcFiles.push(file);
        } else if (file.type.startsWith('audio/') || file.type.startsWith('video/') || nameLower.endsWith('.mp3') || nameLower.endsWith('.wav') || nameLower.endsWith('.m4a')) {
          audioFiles.push(file);
        }
      }
      
      const novaPlaylist = [];
      
      // 2. Casa os arquivos pelo nome exato (Ex: "Musica1.mp3" casa com "Musica1.lrc")
      for (const lrcFile of lrcFiles) {
        // Tira a extensão para pegar só o nome base
        const baseName = lrcFile.name.substring(0, lrcFile.name.lastIndexOf('.'));
        const audioMatch = audioFiles.find(a => a.name.substring(0, a.name.lastIndexOf('.')) === baseName);
        
        if (audioMatch) {
          novaPlaylist.push({
            id: baseName,
            name: baseName,
            audioUri: URL.createObjectURL(audioMatch), // Link virtual para o áudio
            lrcUri: URL.createObjectURL(lrcFile)       // Link virtual para o texto (.lrc)
          });
        }
      }
      
      // 3. Joga para a lista e dá o play!
      if (novaPlaylist.length > 0) {
        setLrcPlaylist(novaPlaylist);
        tocarItemLrc(novaPlaylist, 0); // O tocarItemLrc atualizado vai entender esse link virtual!
      } else {
        alert("Nenhum par exato de Áudio + Letra (.lrc) com o mesmo nome foi encontrado nesta pasta.");
      }
    };
    
    input.click(); // Dispara o clique invisível para abrir a janela do Windows/Mac!
  };

  // --- FUNÇÃO ATUALIZADA PARA LER ARQUIVOS TANTO NO CELULAR QUANTO NA WEB ---
  const tocarItemLrc = async (lista: any[], index: number) => {
    if (index < 0 || index >= lista.length) return;
    const item = lista[index];
    setLrcCurrentIndex(index);
    setLrcAudioUri(item.audioUri);
    setIsLrcPlaying(true);
    setLrcTempoAtual(0);
    
    try {
      let conteudo = "";
      
      // MÁGICA: Se for Web e o link for temporário (blob), usa o fetch. Se for celular, usa o FileSystem!
      if (Platform.OS === 'web' && item.lrcUri.startsWith('blob:')) {
        const resposta = await fetch(item.lrcUri);
        conteudo = await resposta.text();
      } else {
        conteudo = await FileSystem.readAsStringAsync(item.lrcUri);
      }

      const titleMatch = conteudo.match(/\[ti:(.*?)\]/);
      const artistMatch = conteudo.match(/\[ar:(.*?)\]/);
      const albumMatch = conteudo.match(/\[al:(.*?)\]/);
      
      const tituloFinal = titleMatch ? titleMatch[1].trim() : item.name;
      const artistaFinal = artistMatch ? artistMatch[1].trim() : 'Desconhecido';
      const albumFinal = albumMatch ? albumMatch[1].trim() : ''; 
      
      setLrcMetaInfo({
          title: tituloFinal,
          artist: artistaFinal,
          album: albumFinal
      });
      setLrcLetras(processarLRC(conteudo));
      
      buscarCapaDoAlbum(tituloFinal, artistaFinal, albumFinal);
      
    } catch(e) { setLrcLetras([]); }
  };

  const proximaLrc = () => { if(lrcCurrentIndex < lrcPlaylist.length - 1) tocarItemLrc(lrcPlaylist, lrcCurrentIndex + 1); };
  const anteriorLrc = () => { if(lrcCurrentIndex > 0) tocarItemLrc(lrcPlaylist, lrcCurrentIndex - 1); };

  // --- FUNÇÃO PARA BUSCAR CAPA DE ÁLBUM (ITUNES API APRIMORADA) ---
  const buscarCapaDoAlbum = async (titulo: string, artista: string, album: string = '') => {
    setLrcCoverUrl(null); 
    if (!titulo || titulo === 'Música' || titulo.startsWith('YouTube')) return;

    try {
      // Agora incluímos o ÁLBUM na busca, se ele existir no arquivo LRC!
      const termoOriginal = `${artista !== 'Desconhecido' && artista !== 'Artista Desconhecido' ? artista : ''} ${titulo} ${album}`.trim();
      const termoBusca = encodeURIComponent(termoOriginal);
      
      // limit=5: Pede 5 resultados para podermos ignorar trilhas sonoras de novela
      const resposta = await fetch(`https://itunes.apple.com/search?term=${termoBusca}&entity=song&limit=5`);
      const dados = await resposta.json();

      if (dados.results && dados.results.length > 0) {
        let melhorResultado = dados.results[0]; // Por padrão, pega o primeiro
        
        // INTELIGÊNCIA: Procura na lista um resultado onde o artista seja exatamente o procurado
        if (artista && artista !== 'Desconhecido') {
           const artistaBuscado = artista.toLowerCase();
           const achouExato = dados.results.find((r: any) => r.artistName.toLowerCase().includes(artistaBuscado));
           if (achouExato) melhorResultado = achouExato;
        }

        const urlCapa = melhorResultado.artworkUrl100.replace('100x100bb', '400x400bb');
        setLrcCoverUrl(urlCapa);
      }
    } catch (erro) {
      console.log("Erro ao buscar capa do álbum na API da Apple:", erro);
    }
  };

  // Atualização: Quando clica na biblioteca, carrega a pasta inteira!
  

  // ==========================================
  // FUNÇÕES CORE (IA & YOUTUBE)
  // ==========================================

  const selecionarMusica = async () => {
    try {
      const resultado = await DocumentPicker.getDocumentAsync({ type: 'audio/*', copyToCacheDirectory: true });
      if (!resultado.canceled) {
        setArquivoAudio(resultado.assets[0]); setAudioUri(resultado.assets[0].uri); 
        setKaraokePronto(false); setUrlPlayback(null); setUrlVoz(null); setTempoAtual(0); setDuracaoTotal(0); setIsPlaying(false);
      }
    } catch (erro) {}
  };

  // Nova função que apenas abre o menu de escolha
  const abrirSelecaoMusica = () => {
    setModalOrigemMusica(true);
  };

  // Função antiga adaptada para o botão "Celular"
  const escolherMusicaLocal = async () => {
    setModalOrigemMusica(false);
    try {
      const resultado = await DocumentPicker.getDocumentAsync({ type: ['audio/*', 'video/*'], copyToCacheDirectory: true });
      if (!resultado.canceled) {
        setArquivoAudio(resultado.assets[0]); setAudioUri(resultado.assets[0].uri); 
        setKaraokePronto(false); setUrlPlayback(null); setUrlVoz(null); setTempoAtual(0); setDuracaoTotal(0); setIsPlaying(false);
      }
    } catch (erro) {}
  };

  // Funções de Busca Online exclusivas para o Estúdio IA
  const buscarYoutubeEstudio = async () => {
    if (!buscaYtEstudio.trim()) return;
    Keyboard.dismiss(); setIsBuscandoYtEstudio(true); setResultadosYtEstudio([]);
    try {
      const endpoint = fonteBuscaEstudio === 'soundcloud' ? '/buscar_soundcloud' : '/buscar_youtube';
      const resposta = await fetch(`${URL_SERVIDOR}${endpoint}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ query: buscaYtEstudio }) });
      const dados = await resposta.json();
      if (dados.sucesso) setResultadosYtEstudio(dados.resultados);
    } catch (erro) { alert(`Erro ao buscar no ${fonteBuscaEstudio === 'soundcloud' ? 'SoundCloud' : 'YouTube'}.`); }
    setIsBuscandoYtEstudio(false);
  };

  const confirmarSalvarYtEstudio = async (pastaLocal: string) => {
    if (!modalSalvarYtEstudio || !destinoYtSelecionado) return;
    try {
      const dirBase = destinoYtSelecionado === 'local' ? LIBRARY_DIR : LRC_LIBRARY_DIR;
      const dest = `${dirBase}${pastaLocal}/${modalSalvarYtEstudio.nome}`;
      
      // Copia da memória temporária para a pasta definitiva
      await FileSystem.copyAsync({ from: modalSalvarYtEstudio.uri, to: dest });
      
      if (destinoYtSelecionado === 'local') inicializarBiblioteca();
      else inicializarBibliotecaLrc();

      alert(`✅ Áudio salvo com sucesso na pasta: ${pastaLocal}`);
    } catch (erro) {
      alert("Erro ao salvar o arquivo.");
    }
    // Fecha a janela
    setModalSalvarYtEstudio(null);
    setDestinoYtSelecionado(null);
  };

  const salvarNoDispositivoEstudio = async () => {
    if (!modalSalvarYtEstudio) return;
    try {
      if (Platform.OS === 'web') {
        // Na Web: Força o navegador a baixar em uma nova janela/aba sem matar o app
        const link = document.createElement('a');
        link.href = modalSalvarYtEstudio.uri;
        link.download = modalSalvarYtEstudio.nome;
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        // No Celular: O arquivo já está no Cache. Usamos o Sharing para o usuário salvar onde quiser
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(modalSalvarYtEstudio.uri, { dialogTitle: 'Salvar Áudio Importado' });
        } else {
          alert("O compartilhamento não está disponível no seu dispositivo.");
        }
      }
    } catch (e) {
      alert("Erro ao tentar salvar no dispositivo.");
    }
    // Limpa e fecha o modal
    setModalSalvarYtEstudio(null);
    setDestinoYtSelecionado(null);
  };

  const baixarYoutubeParaEstudio = async (id: string, titulo: string) => {
    setIsBaixandoYtEstudio(true);
    setIdBaixandoEstudio(id);
    try {
      const endpoint = fonteBuscaEstudio === 'soundcloud' ? '/baixar_soundcloud' : '/baixar_youtube';
      const resposta = await fetch(`${URL_SERVIDOR}${endpoint}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, formato: 'audio', resolucao: '320', extensao: 'mp3' }) });
      const dados = await resposta.json();
      
      if (dados.sucesso) {
         const nomeLimpo = titulo.replace(/[\/\\?%*:|"<>]/g, '').trim() || 'Audio_Extraido';
         
         // 1. Define a URL gerada pelo servidor como padrão
         let uriFinal = dados.url;
         
         // 2. Se for celular, faz o download físico para a memória Cache
         if (Platform.OS !== 'web') {
             const fileUri = `${FileSystem.cacheDirectory}${nomeLimpo}.mp3`;
             const downloadResumo = await FileSystem.downloadAsync(dados.url, fileUri);
             uriFinal = downloadResumo.uri;
         }
         
         // 3. A IA e o Player vão usar a URI correta dependendo da plataforma
         setArquivoAudio({ uri: uriFinal, name: `${nomeLimpo}.mp3`, mimeType: 'audio/mpeg' });
         setAudioUri(uriFinal);
         setKaraokePronto(false); setUrlPlayback(null); setUrlVoz(null); setTempoAtual(0); setDuracaoTotal(0); setIsPlaying(false);
         
         setModalBuscaYtEstudio(false); setBuscaYtEstudio(''); setResultadosYtEstudio([]);
         
         setModalSalvarYtEstudio({ uri: uriFinal, nome: `${nomeLimpo}.mp3` });
      } else { alert("Erro no servidor ao baixar o áudio."); }
    } catch (erro) { alert("Falha no download."); }
    setIsBaixandoYtEstudio(false);
    setIdBaixandoEstudio(null);
  };

  const abrirPastaNoEstudio = async (nomePasta: string, tipo: 'local' | 'lrc') => {
    const dirBase = tipo === 'local' ? LIBRARY_DIR : LRC_LIBRARY_DIR;
    try {
      const files = await FileSystem.readDirectoryAsync(`${dirBase}${nomePasta}`);
      // Filtra para mostrar apenas arquivos de áudio/vídeo (ignora os .lrc)
      const mediaExts = ['.mp4', '.mkv', '.avi', '.mov', '.webm', '.mp3', '.wav', '.m4a', '.aac'];
      const arquivosMedia = files.filter(f => mediaExts.some(ext => f.toLowerCase().endsWith(ext)));
      
      setPastaBibEstudio(nomePasta);
      setArquivosBibEstudio(arquivosMedia);
    } catch (e) { alert("Erro ao ler a pasta."); }
  };

  const selecionarArquivoBibEstudio = (nomeArquivo: string, tipo: 'local' | 'lrc') => {
    const dirBase = tipo === 'local' ? LIBRARY_DIR : LRC_LIBRARY_DIR;
    const fileUri = `${dirBase}${pastaBibEstudio}/${nomeArquivo}`;
    
    // Identifica o tipo para a IA processar corretamente
    const extensao = nomeArquivo.split('.').pop()?.toLowerCase() || 'mp3';
    let mimeType = 'audio/mpeg';
    if (extensao === 'wav') mimeType = 'audio/wav';
    else if (['mp4', 'mkv', 'avi', 'mov', 'webm'].includes(extensao)) mimeType = `video/${extensao}`;
    
    setArquivoAudio({ uri: fileUri, name: nomeArquivo, mimeType });
    setAudioUri(fileUri);
    setKaraokePronto(false); setUrlPlayback(null); setUrlVoz(null); setTempoAtual(0); setDuracaoTotal(0); setIsPlaying(false);
    
    // Fecha os menus
    setModalBibEstudio(null); setPastaBibEstudio(null); setArquivosBibEstudio([]);
  };

  // Nova função para abrir o menu de escolha da letra
  const abrirSelecaoLetra = () => setModalOrigemLetra(true);

  // A sua função antiga adaptada para "Arquivo do Celular"
  const escolherLetraLocal = async () => {
    setModalOrigemLetra(false);
    try {
      const resultado = await DocumentPicker.getDocumentAsync({ type: '*/*', copyToCacheDirectory: true });
      if (!resultado.canceled) {
        const arquivo = resultado.assets[0]; setNomeLetra(arquivo.name);
        let conteudo = "";
        if (Platform.OS === 'web') {
          const file = (arquivo as any).file; if (!file) return; conteudo = await file.text();
        } else {
          conteudo = await FileSystem.readAsStringAsync(arquivo.uri);
        }
        
        const temTempos = conteudo.includes('[');
        if (!temTempos) {
          const linhas = conteudo.trim().split('\n').filter(l => l.trim() !== "");
          setLinhasSync(linhas.map(l => ({ tempo: null, texto: l })));
          setIndiceCriador(0); setIsModoCriador(false); setLetras([]); 
        } else {
          const processado = processarLRC(conteudo);
          setLetras(processado);
          setLinhasSync(processado.map(l => ({ tempo: l.tempo, texto: l.texto })));
          setIndiceCriador(processado.length); setIsModoCriador(false); 
        }
      }
    } catch (erro) { alert("Não foi possível carregar a letra."); }
  };

  // Funções exclusivas para puxar letra da Biblioteca LRC
  const abrirPastaLetraNoEstudio = async (nomePasta: string) => {
    try {
      const files = await FileSystem.readDirectoryAsync(`${LRC_LIBRARY_DIR}${nomePasta}`);
      // Filtra para mostrar apenas arquivos de texto/lrc
      const textExts = ['.lrc', '.txt'];
      const arquivosLetra = files.filter(f => textExts.some(ext => f.toLowerCase().endsWith(ext)));
      
      setPastaBibLetraLrc(nomePasta);
      setArquivosBibLetraLrc(arquivosLetra);
    } catch (e) { alert("Erro ao ler a pasta."); }
  };

  const selecionarArquivoLetraBibEstudio = async (nomeArquivo: string) => {
    const fileUri = `${LRC_LIBRARY_DIR}${pastaBibLetraLrc}/${nomeArquivo}`;
    try {
      const conteudo = await FileSystem.readAsStringAsync(fileUri);
      setNomeLetra(`[Bib] ${nomeArquivo}`);
      
      const temTempos = conteudo.includes('[');
      if (!temTempos) {
        const linhas = conteudo.trim().split('\n').filter(l => l.trim() !== "");
        setLinhasSync(linhas.map(l => ({ tempo: null, texto: l })));
        setIndiceCriador(0); setIsModoCriador(false); setLetras([]); 
      } else {
        const processado = processarLRC(conteudo);
        setLetras(processado);
        setLinhasSync(processado.map(l => ({ tempo: l.tempo, texto: l.texto })));
        setIndiceCriador(processado.length); setIsModoCriador(false); 
      }
      
      // Fecha as janelas
      setModalBibLetraLrc(false); setPastaBibLetraLrc(null); setArquivosBibLetraLrc([]);
      alert("✅ Letra carregada da biblioteca!");
    } catch (e) {
       alert("Erro ao ler o arquivo de letra.");
    }
  };

  // 1. FAZ A BUSCA E MOSTRA A LISTA
  const buscarLetraNaInternet = async () => {
    if (!buscaTituloLrc.trim()) return alert("Digite pelo menos o nome da música!");
    Keyboard.dismiss(); setIsBuscandoLrc(true); setResultadosLrc([]); 
    
    const titulo = buscaTituloLrc.trim(); const artista = buscaArtistaLrc.trim();

    try {
      let url1 = `https://lrclib.net/api/search?track_name=${encodeURIComponent(titulo)}`;
      if (artista) url1 += `&artist_name=${encodeURIComponent(artista)}`;
      
      const resposta1 = await fetch(url1, { method: 'GET', headers: { 'User-Agent': 'GHKaraokeProApp/1.0' } });

      if (resposta1.ok) {
        const dados1 = await resposta1.json();
        if (dados1 && dados1.length > 0) {
          setResultadosLrc(dados1); // Salva a lista na variável para aparecer na tela!
          setIsBuscandoLrc(false);
          return;
        }
      }
    } catch (erro1) { console.log("Falha no LRCLIB:", erro1); }

    // Plano B: Se o LRCLIB não achar, tenta o OVH (Só funciona se tiver Artista)
    if (artista) {
      try {
        const url2 = `https://api.lyrics.ovh/v1/${encodeURIComponent(artista)}/${encodeURIComponent(titulo)}`;
        const resposta2 = await fetch(url2);

        if (resposta2.ok) {
          const dados2 = await resposta2.json();
          if (dados2.lyrics) {
             // Cria uma lista de 1 item só para o usuário poder clicar
             setResultadosLrc([{ id: 'ovh', trackName: titulo, artistName: artista, plainLyrics: dados2.lyrics, syncedLyrics: null }]);
             setIsBuscandoLrc(false);
             return;
          }
        }
      } catch (erro2) {}
    }

    setIsBuscandoLrc(false);
    alert("Nenhuma letra encontrada. Tente mudar o nome ou adicionar o artista.");
  };

  // 2. AÇÃO QUANDO O USUÁRIO CLICA EM UMA OPÇÃO DA LISTA
  const selecionarLetraDaLista = (item: any) => {
    const conteudoLrc = item.syncedLyrics || item.plainLyrics;
    if (!conteudoLrc) return alert("Esta versão não possui texto disponível.");

    setNomeLetra(`[Online] ${item.artistName} - ${item.trackName}`);

    const temTempos = conteudoLrc.includes('[');
    if (!temTempos) {
      const linhas = conteudoLrc.trim().split('\n').filter((l: string) => l.trim() !== "");
      setLinhasSync(linhas.map((l: string) => ({ tempo: null, texto: l })));
      setIndiceCriador(0); setIsModoCriador(false); setLetras([]); 
    } else {
      const processado = processarLRC(conteudoLrc);
      setLetras(processado);
      setLinhasSync(processado.map((l: any) => ({ tempo: l.tempo, texto: l.texto })));
      setIndiceCriador(processado.length); setIsModoCriador(false); 
    }

    // Limpa tudo e fecha a janela
    setModalBuscaLetra(false); setBuscaTituloLrc(''); setBuscaArtistaLrc(''); setResultadosLrc([]);
    alert("✅ Letra selecionada com sucesso!");
  };

  const registrarTempo = () => {
    if (indiceCriador < linhasSync.length) {
      const novaLista = [...linhasSync];
      novaLista[indiceCriador].tempo = tempoAtual;
      setLinhasSync(novaLista);
      setIndiceCriador(indiceCriador + 1);
    }
  };

  const abrirModalSalvarLRC = () => {
    const marcadas = linhasSync.filter(l => l.tempo !== null);
    if (marcadas.length === 0) return alert("Ainda não marcou nenhum tempo!");

    // Tenta deduzir o nome e artista a partir do nome do arquivo original (ex: "Artista - Musica")
    let defaultName = arquivoAudio?.name ? arquivoAudio.name.split('.')[0] : 'Sincronizado';
    let defaultArtist = '';
    let defaultTitle = defaultName;

    if (defaultName.includes('-')) {
      const parts = defaultName.split('-');
      defaultArtist = parts[0].trim();
      defaultTitle = parts[1].trim();
    }

    setLrcMetaFileName(defaultName);
    setLrcMetaTitle(defaultTitle);
    setLrcMetaArtist(defaultArtist);
    setLrcMetaAlbum('');
    setLrcMetaBy('');
    
    setModalMetadadosLrc(true);
  };

  const salvarArquivoLRC = async () => {
    const marcadas = linhasSync.filter(l => l.tempo !== null);
    let cabecalho = '';
    if (lrcMetaTitle) cabecalho += `[ti:${lrcMetaTitle}]\n`;
    if (lrcMetaArtist) cabecalho += `[ar:${lrcMetaArtist}]\n`;
    if (lrcMetaAlbum) cabecalho += `[al:${lrcMetaAlbum}]\n`;
    if (lrcMetaBy) cabecalho += `[by:${lrcMetaBy}]\n`;
    cabecalho += `[re:GH Karaokê]\n[ve:1.0]\n\n`;

    const conteudoLetra = marcadas.map(item => {
      const min = Math.floor(item.tempo! / 60).toString().padStart(2, '0');
      const seg = Math.floor(item.tempo! % 60).toString().padStart(2, '0');
      const cs = Math.floor((item.tempo! % 1) * 100).toString().padStart(2, '0');
      return `[${min}:${seg}.${cs}] ${item.texto}`;
    }).join('\n');
    
    const conteudoLRC = cabecalho + conteudoLetra;
    const nomeFinal = `${lrcMetaFileName || 'Sincronizado'}.lrc`;
    
    setModalMetadadosLrc(false);
    setModalDestinoLrc({ conteudo: conteudoLRC, nomeFinal }); // Abre a janela de destino
  };

  
  const executarDownloadDestino = async (destino: 'dispositivo' | 'biblioteca', pastaLocal?: string) => {
    const config = modalDestinoDownload;
    if (!config) return;
    setModalDestinoDownload(null);

    try {
      if (destino === 'dispositivo') {
         baixarECompartilhar(config.url, config.nomeFinal);
      } else if (destino === 'biblioteca' && pastaLocal) {
         if (Platform.OS === 'web') {
           baixarECompartilhar(config.url, config.nomeFinal);
         } else {
           const fileUri = `${LIBRARY_DIR}${pastaLocal}/${config.nomeFinal}`;
           await FileSystem.downloadAsync(config.url, fileUri);
           alert(`✅ Salvo com sucesso na pasta: ${pastaLocal}`);
           inicializarBiblioteca();
         }
      }
    } catch(e) {
       alert('Erro ao tentar salvar o arquivo.');
    }
  };

  const executarDownloadDestinoLRC = async (destino: 'dispositivo' | 'biblioteca', pastaLocal?: string) => {
    const config = modalDestinoLrc!;
    setModalDestinoLrc(null);

    try {
        if (destino === 'dispositivo') {
            if (Platform.OS === 'web') {
                const link = document.createElement('a'); 
                link.href = URL.createObjectURL(new Blob([config.conteudo], { type: 'text/plain' })); 
                link.download = config.nomeFinal;
                link.target = '_blank';
                document.body.appendChild(link); 
                link.click(); 
                document.body.removeChild(link);
            } else {
                const fileUri = `${FileSystem.documentDirectory}${config.nomeFinal}`;
                await FileSystem.writeAsStringAsync(fileUri, config.conteudo, { encoding: FileSystem.EncodingType.UTF8 });
                if (await Sharing.isAvailableAsync()) await Sharing.shareAsync(fileUri);
            }
        } else if (destino === 'biblioteca' && pastaLocal) {
            const fileUri = `${LRC_LIBRARY_DIR}${pastaLocal}/${config.nomeFinal}`;
            await FileSystem.writeAsStringAsync(fileUri, config.conteudo, { encoding: FileSystem.EncodingType.UTF8 });
            alert(`LRC salvo em: ${pastaLocal}`);
            inicializarBibliotecaLrc();

            // MÁGICA: Copia o áudio original junto!
            if (arquivoAudio && arquivoAudio.uri && !arquivoAudio.uri.startsWith('http')) {
                const extensaoAudio = arquivoAudio.name.split('.').pop();
                const nomeAudioFinal = `${config.nomeFinal.replace('.lrc', '')}.${extensaoAudio}`;
                const destAudio = `${LRC_LIBRARY_DIR}${pastaLocal}/${nomeAudioFinal}`;
                try { await FileSystem.copyAsync({ from: arquivoAudio.uri, to: destAudio }); } catch (e) {}
            }
        }
    } catch (erro) { alert("Erro ao guardar o ficheiro .lrc"); }
  };

  // --- NOVA FUNÇÃO DE RESGATE ---
  const resgatarArquivosPerdidos = async () => {
    try {
      const resposta = await fetch(`${URL_SERVIDOR}/arquivos_prontos`);
      const dados = await resposta.json();
      
      if (dados.sucesso && dados.arquivos.length > 0) {
        const nomes = dados.arquivos.map((arq: any) => `🎵 ${arq.nome} (${arq.tamanho_mb} MB)`).join('\n');
        alert(`ARQUIVOS RECUPERADOS:\n\n${nomes}\n\nEles estão salvos e prontos para uso no seu servidor!`);
      } else {
        alert("O servidor está limpo! Nenhum arquivo perdido ou acumulado.");
      }
    } catch (e) {
      alert("Erro ao conectar com o servidor para resgate.");
    }
  };

  

  
  const baixarECompartilhar = async (url: string, nomeFinal: string) => {
    try {
      if (Platform.OS === 'web') {
        const link = document.createElement('a'); 
        link.href = url; 
        link.download = nomeFinal;
        link.target = '_blank';
        document.body.appendChild(link); 
        link.click(); 
        document.body.removeChild(link);
      } else {
        const fileUri = `${FileSystem.documentDirectory}${nomeFinal}`;
        const downloadResumo = await FileSystem.downloadAsync(url, fileUri);
        if (await Sharing.isAvailableAsync()) await Sharing.shareAsync(downloadResumo.uri);
      }
    } catch (erro) { alert("Não foi possível salvar."); }
  };

  // ==========================================
  // EFEITOS DO REPRODUTOR IA E LETRAS
  // ==========================================
  
  useEffect(() => {
    if (letras.length === 0) return;
    const index = letras.findIndex((linha, i) => {
      const tempoProxima = i < letras.length - 1 ? letras[i + 1].tempo : Infinity;
      return tempoAtual >= linha.tempo && tempoAtual < tempoProxima && linha.tempo !== 0;
    });
    if (index !== indiceAtivo && index !== -1) {
      setIndiceAtivo(index);
      if (flatListRef.current) try { flatListRef.current.scrollToIndex({ index: index, animated: true, viewPosition: 0.5 }); } catch (e) {}
    }
  }, [tempoAtual, letras]);

  // ==========================================
  // FUNÇÕES DA PLAYLIST E REPRODUTOR PRO
  // ==========================================
  const selecionarMidiaPro = async () => {
    try {
      // 1. Adicionamos o "multiple: true" para liberar a seleção de vários arquivos no celular
      const resultado = await DocumentPicker.getDocumentAsync({ 
        type: ['audio/*', 'video/*'], 
        copyToCacheDirectory: true,
        multiple: true 
      });
      
      if (!resultado.canceled) { 
        // 2. Mapeamos todos os arquivos selecionados e criamos os itens da fila
        const novosItens = resultado.assets.map(asset => ({
          id: Date.now().toString() + Math.random().toString(),
          uri: asset.uri,
          name: asset.name
        }));

        // >>> MÁGICA: ORDENA A SELEÇÃO MÚLTIPLA DE ARQUIVOS
        novosItens.sort((a: any, b: any) => a.name.localeCompare(b.name));

        // 3. Injetamos todos eles de uma vez só no final da Playlist
        setPlaylist(prev => [...prev, ...novosItens]);
        setUrlAudioExtraido(null);
        
        // Dá um aviso visual pro usuário saber que deu certo!
        alert(`${novosItens.length} arquivo(s) adicionado(s) à fila!`);
      }
    } catch (erro) {
      alert("Erro ao selecionar os arquivos.");
    }
  };

  const adicionarPastaNaPlaylist = async (pasta: string) => {
    
    // --- NOVO: LER PASTAS VIRTUAIS NO MODO WEB ---
    if (Platform.OS === 'web' && pastasVirtuaisWeb[pasta]) {
      const arquivos = pastasVirtuaisWeb[pasta];
      const novosItens = arquivos.map(arq => ({
        id: Date.now().toString() + Math.random().toString(),
        uri: arq.uri,
        name: arq.nome
      }));

      // >>> MÁGICA: ORDENA A PASTA VIRTUAL DA WEB
      novosItens.sort((a: any, b: any) => a.name.localeCompare(b.name));

      setPlaylist(prev => [...prev, ...novosItens]);
      setModalPastasPro(false);
      alert(`${novosItens.length} arquivo(s) adicionado(s) à fila!`);
      return; // Interrompe para não tentar usar o FileSystem na Web
    }
    // ---------------------------------------------

    const caminhoPasta = `${LIBRARY_DIR}${pasta}/`;
    try {
      const arquivos = await FileSystem.readDirectoryAsync(caminhoPasta);
      const mediaExts = ['.mp4', '.mkv', '.avi', '.mov', '.webm', '.mp3', '.wav', '.m4a', '.aac'];
      const arquivosMedia = arquivos.filter(f => mediaExts.some(ext => f.toLowerCase().endsWith(ext)));

      if (arquivosMedia.length === 0) {
        alert("Nenhuma mídia de áudio ou vídeo encontrada nesta pasta.");
        return;
      }

      const novosItens = arquivosMedia.map(arq => ({
        id: Date.now().toString() + Math.random().toString(),
        uri: `${caminhoPasta}${arq}`,
        name: arq
      }));

      // >>> MÁGICA: ORDENA A PASTA DA BIBLIOTECA FÍSICA NO CELULAR
      novosItens.sort((a: any, b: any) => a.name.localeCompare(b.name));

      // Adiciona todos os itens no final da fila
      setPlaylist(prev => [...prev, ...novosItens]);
      setModalPastasPro(false);
      alert(`${novosItens.length} arquivos adicionados à fila!`);
    } catch (e) {
      alert("Erro ao ler a pasta.");
    }
  };

  // --- ADICIONAR PASTA DA MEMÓRIA DO DISPOSITIVO (SAF) ---
  const adicionarPastaDoDispositivo = async () => {
    if (Platform.OS === 'android') {
      try {
        // Solicita permissão ao usuário para ler uma pasta do celular
        const permissoes = await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();
        
        if (permissoes.granted) {
          // Lê todas as URIs de arquivos dentro da pasta escolhida
          const arquivosDaPasta = await FileSystem.StorageAccessFramework.readDirectoryAsync(permissoes.directoryUri);
          
          const mediaExts = ['.mp4', '.mkv', '.avi', '.mov', '.webm', '.mp3', '.wav', '.m4a', '.aac'];
          const arquivosMedia = arquivosDaPasta.filter(uri => 
            mediaExts.some(ext => uri.toLowerCase().endsWith(ext))
          );

          if (arquivosMedia.length === 0) {
            alert("Nenhuma mídia suportada foi encontrada nesta pasta.");
            return;
          }

          const novosItens = arquivosMedia.map(uri => {
            let nome = 'Mídia Desconhecida';
            try { 
              // 1. Decodifica a URI inteira primeiro (transforma os %2F ocultos em barras normais /)
              const uriDecodificada = decodeURIComponent(uri);
              
              // 2. Agora sim, quebra pelo '/' e pega estritamente a última parte (o nome do arquivo com a extensão)
              nome = uriDecodificada.split('/').pop() || 'Mídia Desconhecida';
            } catch(e) {
              // Fallback de segurança
              nome = uri.split('/').pop() || 'Mídia Desconhecida';
            }

            return {
              id: Date.now().toString() + Math.random().toString(),
              uri: uri,
              name: nome
            };
          });

          // >>> MÁGICA AQUI: Ordena os arquivos em ordem alfabética (A-Z)
          novosItens.sort((a: any, b: any) => a.name.localeCompare(b.name));

          // Injeta na fila
          setPlaylist(prev => [...prev, ...novosItens]);
          alert(`${novosItens.length} arquivo(s) adicionado(s) à fila!`);
        }
      } catch (erro) {
        alert("Erro ao ler a pasta do dispositivo.");
      }
    } else if (Platform.OS === 'web') {
      adicionarPastaPCWeb(); // Se for Web, chama a função do PC
    } else {
      // iOS tem restrições rigorosas com pastas. O ideal é selecionar arquivos múltiplos.
      alert("No iPhone/iPad, utilize o botão '+ Arquivo' para selecionar múltiplas músicas de uma vez.");
    }
  };

  // --- FUNÇÃO EXCLUSIVA PARA LER PASTAS DO PC NO MODO WEB ---
  const adicionarPastaPCWeb = () => {
    if (Platform.OS !== 'web') return;
    
    // Cria um input invisível com o superpoder de ler pastas (webkitdirectory)
    const input = document.createElement('input');
    input.type = 'file';
    input.setAttribute('webkitdirectory', 'true');
    input.setAttribute('directory', 'true');
    input.multiple = true;
    
    input.onchange = (e: any) => {
      const files = e.target.files;
      if (!files || files.length === 0) return;
      
      const novosItens: PlaylistItem[] = [];
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        // Filtra para pegar apenas arquivos de mídia
        if (file.type.startsWith('audio/') || file.type.startsWith('video/') || /\.(mp3|wav|mp4|mkv|avi|mov|webm)$/i.test(file.name)) {
          
          // Cria um link temporário na memória do navegador para tocar o arquivo
          const url = URL.createObjectURL(file);
          novosItens.push({
            id: Date.now().toString() + Math.random().toString(),
            uri: url,
            name: file.name
          });
        }
      }
      
      if (novosItens.length > 0) {
        // >>> MÁGICA: ORDENA AS MÚSICAS DO PC EM ORDEM ALFABÉTICA ANTES DE IR PRA FILA
        novosItens.sort((a: any, b: any) => a.name.localeCompare(b.name));

        setPlaylist(prev => [...prev, ...novosItens]);
        alert(`${novosItens.length} arquivo(s) adicionado(s) à fila!`);
      } else {
        alert("Nenhum arquivo de áudio ou vídeo encontrado na pasta selecionada.");
      }
    };
    
    input.click(); // Dispara o clique invisível para abrir a janela do PC!
  };

  
  
  

  // ==========================================
  // LÓGICA DO REPRODUTOR LRC (KARAOKÊ)
  // ==========================================
  const selecionarAudioLrc = async () => {
    try {
      const resultado = await DocumentPicker.getDocumentAsync({ type: 'audio/*', copyToCacheDirectory: true });
      if (!resultado.canceled) {
        setLrcAudioUri(resultado.assets[0].uri);
        setIsLrcPlaying(false);
        setLrcTempoAtual(0);
      }
    } catch (erro) {}
  };

  const selecionarArquivoLrcParaTocar = async () => {
    try {
      const resultado = await DocumentPicker.getDocumentAsync({ type: '*/*', copyToCacheDirectory: true });
      if (!resultado.canceled) {
        const arquivo = resultado.assets[0];
        let conteudo = "";
        if (Platform.OS === 'web') {
          const file = (arquivo as any).file; if (!file) return; conteudo = await file.text();
        } else {
          conteudo = await FileSystem.readAsStringAsync(arquivo.uri);
        }

        // Extrair Metadados do LRC
        const titleMatch = conteudo.match(/\[ti:(.*?)\]/);
        const artistMatch = conteudo.match(/\[ar:(.*?)\]/);
        const albumMatch = conteudo.match(/\[al:(.*?)\]/);
        
        const tituloFinal = titleMatch ? titleMatch[1].trim() : arquivo.name.split('.')[0];
        const artistaFinal = artistMatch ? artistMatch[1].trim() : 'Artista Desconhecido';
        const albumFinal = albumMatch ? albumMatch[1].trim() : ''; // <-- Pega o Álbum

        setLrcMetaInfo({
          title: tituloFinal,
          artist: artistaFinal,
          album: albumFinal
        });

        setLrcLetras(processarLRC(conteudo));
        
        // AGORA ENVIA O ÁLBUM TAMBÉM!
        buscarCapaDoAlbum(tituloFinal, artistaFinal, albumFinal);
        
      }
    } catch (erro) { alert("Não foi possível carregar a letra."); }
  };

  
  // Função que pega a música tocando no LRC Player e joga pro Editor
  const abrirEditorDoLrc = () => {
    // 1. Pausa a música no player atual
    if (isLrcPlaying && lrcAudioPlayer) {
      lrcAudioPlayer.pause();
      setIsLrcPlaying(false);
    }

    // 2. Transfere o Áudio para o Editor
    setAudioUri(lrcAudioUri);
    setArquivoAudio({ name: `${lrcMetaInfo.title || 'Música'}.mp3`, uri: lrcAudioUri });
    
    // 3. Transfere a Letra para o Editor
    setLinhasSync(lrcLetras.map(l => ({ tempo: l.tempo, texto: l.texto })));
    setIndiceCriador(lrcLetras.length); // Coloca o cursor no final, pois os tempos já existem

    // 4. Preenche os metadados (para a tela de Salvar depois)
    setLrcMetaTitle(lrcMetaInfo.title);
    setLrcMetaArtist(lrcMetaInfo.artist);
    setLrcMetaFileName(lrcMetaInfo.title);

    // 5. Troca de tela e abre o Editor Profissional magicamente!
    setTelaAtiva('principal');
    setIsModoCriador(true);
  };

  useEffect(() => {
    let intervalo: any;
    if (isLrcPlaying && lrcAudioPlayer) {
      intervalo = setInterval(() => {
        const curr = lrcAudioPlayer.currentTime || 0; 
        const dur = lrcAudioPlayer.duration || 0;
        setLrcTempoAtual(curr); setLrcDuracaoTotal(dur);
        
        // Verifica se a música chegou no fim (com uma margem de segurança de 0.5s)
        if (dur > 0 && curr >= dur - 0.5) { 
           lrcAudioPlayer.pause(); 
           lrcAudioPlayer.seekTo(0); 
           
           // MÁGICA DA SEQUÊNCIA LRC: Se tem próxima música na fila, pula pra ela!
           if (lrcPlaylist.length > 0 && lrcCurrentIndex >= 0 && lrcCurrentIndex < lrcPlaylist.length - 1) {
             tocarItemLrc(lrcPlaylist, lrcCurrentIndex + 1);
           } else {
             // Se for a última música, apenas pausa a reprodução
             setIsLrcPlaying(false); 
           }
        }
      }, 150);
    }
    return () => clearInterval(intervalo);
  }, [isLrcPlaying, lrcAudioPlayer, lrcPlaylist, lrcCurrentIndex]); // <-- Atualizamos as dependências para o React não se perder!

  useEffect(() => {
    if (lrcLetras.length === 0) return;
    const index = lrcLetras.findIndex((linha, i) => {
      const tempoProxima = i < lrcLetras.length - 1 ? lrcLetras[i + 1].tempo : Infinity;
      return lrcTempoAtual >= linha.tempo && lrcTempoAtual < tempoProxima && linha.tempo !== 0;
    });
    if (index !== lrcIndiceAtivo && index !== -1) {
      setLrcIndiceAtivo(index);
      if (lrcListRef.current) try { lrcListRef.current.scrollToIndex({ index: index, animated: true, viewPosition: 0.5 }); } catch (e) {}
    }
  }, [lrcTempoAtual, lrcLetras]);

  const navegarPara = (tela: 'principal' | 'reprodutor' | 'reprodutor_lrc' | 'biblioteca'  | 'biblioteca_lrc') => {
    setTelaAtiva(tela); 
    setMenuAberto(false);
    
    // As linhas que forçavam a pausa (player.pause(), tocarOuPausar(), etc) foram removidas!
    // Agora o áudio continuará tocando perfeitamente em segundo plano enquanto você navega pelas abas.
  };

  
  // --- FUNÇÕES DE RENDERIZAÇÃO DA INTERFACE DE FILTRO ---
  const renderFiltrosVisualizacao = (corAtiva: string) => (
    <View style={styles.filtroContainer}>
      <TouchableOpacity style={[styles.filtroBtn, modoVisao === 'compacto' && { backgroundColor: corAtiva }]} onPress={() => setModoVisao('compacto')}>
        <Ionicons name="grid" size={16} color={modoVisao === 'compacto' ? '#FFF' : '#777'} />
      </TouchableOpacity>
      <TouchableOpacity style={[styles.filtroBtn, modoVisao === 'detalhado' && { backgroundColor: corAtiva }]} onPress={() => setModoVisao('detalhado')}>
        <Ionicons name="information-circle" size={16} color={modoVisao === 'detalhado' ? '#FFF' : '#777'} />
      </TouchableOpacity>
      <TouchableOpacity style={[styles.filtroBtn, modoVisao === 'lista' && { backgroundColor: corAtiva }]} onPress={() => setModoVisao('lista')}>
        <Ionicons name="list" size={16} color={modoVisao === 'lista' ? '#FFF' : '#777'} />
      </TouchableOpacity>
    </View>
  );

  const renderPastaUnificada = (item: string, isLrc: boolean) => {
    const infos = isLrc ? infoPastasLrc[item] : infoPastas[item];
    let qtdArquivos = infos ? infos.count : 0;
    let tamanhoFormatado = infos ? formatarTamanhoBytes(infos.size) : 'Calculando...';

    // --- MÁGICA PARA AS PASTAS VIRTUAIS DO PC ---
    if (Platform.OS === 'web') {
      if (!isLrc && pastasVirtuaisWeb[item]) {
        qtdArquivos = pastasVirtuaisWeb[item].length;
        tamanhoFormatado = 'Pasta Virtual do PC';
      } else if (isLrc && pastasVirtuaisLrcWeb[item]) {
        qtdArquivos = pastasVirtuaisLrcWeb[item].length;
        tamanhoFormatado = 'Pasta Virtual do PC';
      }
    }
    
    const corPrimaria = isLrc ? '#FF9800' : '#FFCA28';
    const fnEntrar = () => isLrc ? entrarNaPastaLrc(item) : entrarNaPasta(item);
    const fnApagar = () => isLrc ? apagarItemLrc(item, true) : apagarItem(item, true);

    if (modoVisao === 'compacto') {
      return (
        <TouchableOpacity style={styles.pastaCardCompacto} onPress={fnEntrar}>
          <Ionicons name="folder" size={40} color={corPrimaria} />
          <Text style={styles.pastaNameCompacto} numberOfLines={1}>{item}</Text>
          <TouchableOpacity style={styles.btnExcluirPastaCompacto} onPress={fnApagar}>
            <Ionicons name="trash" size={14} color="#E50914" />
          </TouchableOpacity>
        </TouchableOpacity>
      );
    } else if (modoVisao === 'lista') {
      return (
        <TouchableOpacity style={styles.pastaCardLista} onPress={fnEntrar}>
          <Ionicons name="folder" size={36} color={corPrimaria} style={{marginRight: 15}} />
          <View style={{flex: 1}}>
            <Text style={styles.pastaNameLista} numberOfLines={1}>{item}</Text>
            <Text style={styles.pastaInfoLista}>{qtdArquivos} arquivos • {tamanhoFormatado}</Text>
          </View>
          <TouchableOpacity style={{padding: 10}} onPress={fnApagar}>
            <Ionicons name="trash" size={20} color="#E50914" />
          </TouchableOpacity>
        </TouchableOpacity>
      );
    } else {
      // MODO DETALHADO (Padrão Antigo Melhorado)
      return (
        <TouchableOpacity style={styles.pastaCard} onPress={fnEntrar}>
          <Ionicons name="folder" size={60} color={corPrimaria} />
          <Text style={styles.pastaName} numberOfLines={1}>{item}</Text>
          <View style={styles.pastaBadgeInfo}>
            <Text style={styles.pastaInfoDetalhado}>{qtdArquivos} arquivos</Text>
            <Text style={styles.pastaInfoDetalhado}>{tamanhoFormatado}</Text>
          </View>
          <TouchableOpacity style={styles.btnExcluirPasta} onPress={fnApagar}>
            <Ionicons name="trash" size={18} color="#E50914" />
          </TouchableOpacity>
        </TouchableOpacity>
      );
    }
  };

  // Prepara a fila filtrada preservando a posição (índice) original de cada música na Playlist
  const playlistFiltrada = playlist
    .map((item, index) => ({ ...item, originalIndex: index }))
    .filter(item => buscaFila.trim() === '' || item.name.toLowerCase().includes(buscaFila.toLowerCase()));


  

  // Esta função desenha o painel para podermos usá-lo em qualquer tela sem repetir código
  const renderEqualizadorMusica = () => {
    if (Platform.OS !== 'web') return null;
    return (
      <View style={{width: '100%', backgroundColor: 'rgba(255,152,0,0.1)', padding: 10, borderRadius: 8, marginVertical: 10}}>
        <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'}}>
          <View style={{flexDirection: 'row', alignItems: 'center'}}>
            <Ionicons name="options" size={20} color="#FF9800" style={{marginRight: 8}} />
            <Text style={{color: '#FF9800', fontWeight: 'bold'}}>EQ da Música</Text>
          </View>
          <View style={{flexDirection: 'row', alignItems: 'center', gap: 15}}>
            <TouchableOpacity onPress={() => setEqPlaybackAtivo(!eqPlaybackAtivo)} style={{backgroundColor: eqPlaybackAtivo ? '#4CAF50' : '#333', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 5}}>
              <Text style={{color: '#FFF', fontWeight: 'bold', fontSize: 11}}>{eqPlaybackAtivo ? 'LIGADO' : 'DESLIGADO'}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setEqPlaybackExpandido(!eqPlaybackExpandido)} style={{padding: 4}}>
              <Ionicons name={eqPlaybackExpandido ? "chevron-up" : "chevron-down"} size={22} color="#FFF" />
            </TouchableOpacity>
          </View>
        </View>

        {eqPlaybackExpandido && (
          <View style={{marginTop: 15}}>
            {/* === SLIDER DO VOLUME BOOSTER === */}
            <Text style={{color: '#FFF', fontSize: 12}}>Ganho de Volume (Booster): {Math.round(eqGanho * 100)}%</Text>
            <Slider minimumValue={0} maximumValue={3} value={eqGanho} onValueChange={setEqGanho} minimumTrackTintColor="#4CAF50" maximumTrackTintColor="#555" thumbTintColor="#4CAF50" style={{height: 35}} />

            {/* === SLIDERS DO EQUALIZADOR === */}

            <Text style={{color: '#FFF', fontSize: 12}}>Graves: {eqGrave > 0 ? '+' : ''}{Math.round(eqGrave)} dB</Text>
            <Slider minimumValue={-20} maximumValue={20} value={eqGrave} onValueChange={setEqGrave} minimumTrackTintColor="#FF9800" maximumTrackTintColor="#555" thumbTintColor="#FF9800" style={{height: 35}} />

            <Text style={{color: '#FFF', fontSize: 12}}>Médios: {eqMedio > 0 ? '+' : ''}{Math.round(eqMedio)} dB</Text>
            <Slider minimumValue={-20} maximumValue={20} value={eqMedio} onValueChange={setEqMedio} minimumTrackTintColor="#FFC107" maximumTrackTintColor="#555" thumbTintColor="#FFC107" style={{height: 35}} />

            <Text style={{color: '#FFF', fontSize: 12}}>Agudos: {eqAgudo > 0 ? '+' : ''}{Math.round(eqAgudo)} dB</Text>
            <Slider minimumValue={-20} maximumValue={20} value={eqAgudo} onValueChange={setEqAgudo} minimumTrackTintColor="#E50914" maximumTrackTintColor="#555" thumbTintColor="#E50914" style={{height: 35}} />
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Ionicons name="mic" size={28} color="#E50914" style={{marginRight: 8}} />
          <Text style={styles.title}>GH Karaokê</Text>
          <View style={styles.proBadge}><Text style={styles.titlePro}>PRO</Text></View>
        </View>
        <TouchableOpacity style={styles.menuButton} onPress={() => setMenuAberto(true)}>
          <Ionicons name="menu" size={34} color="#FFFFFF" />
        </TouchableOpacity>
      </View> 

      {/* MENU LATERAL E MODAIS DE BIBLIOTECA CENTRALIZADOS */}
      <MenuLateral
        visivel={menuAberto}
        onFechar={() => setMenuAberto(false)}
        onAbrirConfig={() => { setMenuAberto(false); setModalConfigAberto(true); }}
        motorBusca={motorBusca}
        setMotorBusca={setMotorBusca}
        onResgatarArquivos={() => { setMenuAberto(false); resgatarArquivosPerdidos(); }}
      />

      <ModalNovaPasta
        visivel={modalNovaPasta} onClose={() => setModalNovaPasta(false)}
        titulo="Nova Pasta de Gênero" placeholder="Ex: Forró, Rock..."
        valor={nomeNovaPasta} setValor={setNomeNovaPasta} onCriar={criarNovaPasta}
      />

      <ModalNovaPasta
        visivel={modalNovaPastaLrc} onClose={() => setModalNovaPastaLrc(false)}
        titulo="Pasta LRC (Gênero)" placeholder="Ex: Rock, Pop..."
        valor={nomeNovaPastaLrc} setValor={setNomeNovaPastaLrc} onCriar={criarNovaPastaLrc}
      />

      <ModalAcaoArquivo
        visivel={!!modalAcaoArquivo} onClose={() => setModalAcaoArquivo(null)}
        nomeArquivo={modalAcaoArquivo?.nome} isLrc={modalAcaoArquivo?.isLrc}
        onTocarAgora={() => acaoBibliotecaTocar('agora')} onAddFila={() => acaoBibliotecaTocar('fila')}
        onRenomear={abrirRenomearBib} onExportar={exportarArquivoBib} onApagar={apagarPeloModalOpcoes}
      />

      <ModalOrdem
        visivel={modalOrdem} onClose={() => setModalOrdem(false)}
        criterioAtual={criterioOrdem} onMudarOrdem={mudarOrdem}
      />

      <ModalRenomearBib
        visivel={!!modalRenomearBib} onClose={() => setModalRenomearBib(null)}
        isLrc={modalRenomearBib?.isLrc} novoNome={novoNomeBib} setNovoNome={setNovoNomeBib} onSalvar={confirmarRenomearBib}
      />

      {/* MODAL: CONFIGURAÇÕES */}
      <ModalConfiguracoes 
        visivel={modalConfigAberto} 
        fecharModal={() => setModalConfigAberto(false)} 
        modeloIA={modeloIA} 
        setModeloIA={setModeloIA} 
      />

      {/* MODAL QUALIDADE YOUTUBE */}
      <ModalQualidadeYoutube
        visivel={!!modalQualidadeYt}
        titulo={modalQualidadeYt?.titulo}
        tipo={modalQualidadeYt?.tipo}
        onEscolherQualidade={escolherQualidade}
        onCancelar={() => setModalQualidadeYt(null)}
      />

      {/* MODAL: DESTINO DO DOWNLOAD */}
      <ModalDestinoDownload 
         visivel={!!modalDestinoDownload}
         config={modalDestinoDownload}
         onClose={() => setModalDestinoDownload(null)}
         pastas={pastas}
         pastasVirtuaisWeb={pastasVirtuaisWeb}
         executarDownload={executarDownloadDestino}
      />

      {/* MODAL COMENTADO: AÇÃO YOUTUBE (TOCAR OU FILA) */}
      <Modal visible={!!modalAcaoYoutube} transparent={true} animationType="slide">
        <View style={styles.modalCenterOverlay}>
          <View style={styles.qualidadeBox}>
            <Ionicons name="logo-youtube" size={40} color="#E50914" style={{marginBottom: 10}}/>
            <Text style={styles.qualidadeSubtitle} numberOfLines={2}>{modalAcaoYoutube?.titulo}</Text>
            
            {/* BOTÃO: TOCAR AGORA */}
            <TouchableOpacity style={styles.qualidadeBtn} onPress={() => {
              if (modalAcaoYoutube) {
                if (motorBusca === 'interno') {
                  setReproducaoTemp({ uri: modalAcaoYoutube.id, name: `[Tocando Agora] ${modalAcaoYoutube.titulo}`, isInterno: true });
                  setUrlAudioExtraido(null);
                  setIsPlaylistVisible(false);
                } else if (modalAcaoYoutube.source === 'soundcloud') {
                  // MÁGICA 2: Se for SoundCloud, pula a escolha de qualidade e baixa direto (Áudio/320kbps)!
                  iniciarTocarYoutube(modalAcaoYoutube.id, 'audio', modalAcaoYoutube.titulo, '320', 'mp3', 'tocar', 'soundcloud');
                } else {
                  setModalQualidadeYt({ 
                    id: modalAcaoYoutube.id, 
                    titulo: modalAcaoYoutube.titulo, 
                    tipo: 'video', // YouTube padroniza para vídeo
                    acao: 'tocar', 
                    source: 'youtube' 
                  });
                }
                setModalAcaoYoutube(null);
              }
            }}>
              <Text style={styles.qualidadeBtnText}>▶️ Tocar Agora (Sem Fila)</Text>
            </TouchableOpacity>

            {/* BOTÃO: ADICIONAR À FILA */}
            <TouchableOpacity style={styles.qualidadeBtnAudio} onPress={() => {
              if (modalAcaoYoutube) {
                if (motorBusca === 'interno') {
                  adicionarNaPlaylist(modalAcaoYoutube.id, modalAcaoYoutube.titulo, true);
                  alert("Adicionado à Lista de Reprodução!");
                } else if (modalAcaoYoutube.source === 'soundcloud') {
                  // MÁGICA 3: Pula a escolha de qualidade e injeta o MP3 direto na Fila!
                  iniciarTocarYoutube(modalAcaoYoutube.id, 'audio', modalAcaoYoutube.titulo, '320', 'mp3', 'fila', 'soundcloud');
                } else {
                  setModalQualidadeYt({ 
                    id: modalAcaoYoutube.id, 
                    titulo: modalAcaoYoutube.titulo, 
                    tipo: 'video', // YouTube padroniza para vídeo
                    acao: 'fila', 
                    source: 'youtube' 
                  });
                }
                setModalAcaoYoutube(null);
              }
            }}>
              <Text style={styles.qualidadeBtnText}>
                ➕ Adicionar à Fila ({modalAcaoYoutube?.source === 'soundcloud' ? 'Áudio' : 'Vídeo'})
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.qualidadeCancelarBtn} onPress={() => setModalAcaoYoutube(null)}>
              <Text style={styles.qualidadeCancelarText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* MODAL DE BUSCA DE LETRA ONLINE */}
      <ModalBuscaLetra 
         visivel={modalBuscaLetra}
         onClose={() => { setModalBuscaLetra(false); setBuscaTituloLrc(''); setBuscaArtistaLrc(''); }}
         buscaTituloLrc={buscaTituloLrc}
         setBuscaTituloLrc={setBuscaTituloLrc}
         buscaArtistaLrc={buscaArtistaLrc}
         setBuscaArtistaLrc={setBuscaArtistaLrc}
         isBuscandoLrc={isBuscandoLrc}
         resultadosLrc={resultadosLrc}
         setResultadosLrc={setResultadosLrc}
         buscarLetraNaInternet={buscarLetraNaInternet}
         selecionarLetraDaLista={selecionarLetraDaLista}
      />

      {/* MODAL: ESCOLHER ORIGEM DA MÚSICA NO ESTÚDIO */}
      <Modal visible={modalOrigemMusica} transparent={true} animationType="fade">
        <View style={styles.modalCenterOverlay}>
          <View style={styles.qualidadeBox}>
            <Ionicons name="musical-notes" size={40} color="#E50914" style={{marginBottom: 10}}/>
            <Text style={styles.qualidadeTitle}>Importar Música</Text>
            <Text style={styles.qualidadeSubtitle}>De onde você quer puxar o áudio?</Text>
            
            <TouchableOpacity style={styles.btnDestinoCelular} onPress={escolherMusicaLocal}>
              <Ionicons name="folder" size={20} color="#FFF" style={{marginRight: 10}}/>
              <Text style={styles.qualidadeBtnText}>Memória Interna</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.btnDestinoCelular, {backgroundColor: '#E50914', marginTop: 10}]} onPress={() => { setModalOrigemMusica(false); setFonteBuscaEstudio('youtube'); setModalBuscaYtEstudio(true); }}>
              <Ionicons name="logo-youtube" size={20} color="#FFF" style={{marginRight: 10}}/>
              <Text style={styles.qualidadeBtnText}>Buscar no YouTube</Text>
            </TouchableOpacity>

            {/* NOVO: BOTÃO SOUNDCLOUD */}
            <TouchableOpacity style={[styles.btnDestinoCelular, {backgroundColor: '#FF5500', marginTop: 10}]} onPress={() => { setModalOrigemMusica(false); setFonteBuscaEstudio('soundcloud'); setModalBuscaYtEstudio(true); }}>
              <Ionicons name="cloud" size={20} color="#FFF" style={{marginRight: 10}}/>
              <Text style={styles.qualidadeBtnText}>Buscar no SoundCloud</Text>
            </TouchableOpacity>

            {/* NOVOS BOTÕES: BIBLIOTECAS */}
            <TouchableOpacity style={[styles.btnDestinoCelular, {backgroundColor: '#FFCA28', marginTop: 10}]} onPress={() => { setModalOrigemMusica(false); setModalBibEstudio('local'); inicializarBiblioteca(); }}>
              <Ionicons name="library" size={20} color="#000" style={{marginRight: 10}}/>
              <Text style={[styles.qualidadeBtnText, {color: '#000'}]}>Biblioteca Local</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.btnDestinoCelular, {backgroundColor: '#FF9800', marginTop: 10}]} onPress={() => { setModalOrigemMusica(false); setModalBibEstudio('lrc'); inicializarBibliotecaLrc(); }}>
              <Ionicons name="musical-notes" size={20} color="#FFF" style={{marginRight: 10}}/>
              <Text style={styles.qualidadeBtnText}>Biblioteca LRC</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.qualidadeCancelarBtn} onPress={() => setModalOrigemMusica(false)}>
              <Text style={styles.qualidadeCancelarText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* MODAL: NAVEGAR NAS BIBLIOTECAS (ESTÚDIO) */}
      <Modal visible={modalBibEstudio !== null} transparent={true} animationType="slide">
        <View style={styles.modalCenterOverlay}>
          <View style={[styles.destinoBox, {maxHeight: '80%', width: '90%'}]}>
            <Text style={styles.qualidadeTitle}>
              {modalBibEstudio === 'local' ? 'Biblioteca Local' : 'Biblioteca LRC'}
            </Text>

            {!pastaBibEstudio ? (
              // TELA 1: LISTA AS PASTAS
              <>
                <Text style={styles.qualidadeSubtitle}>Escolha uma pasta para buscar o áudio</Text>
                <ScrollView style={styles.destinoPastasScroll}>
                  {(modalBibEstudio === 'local' ? pastas : pastasLrc).length === 0 ? (
                    <Text style={{color: '#777', textAlign: 'center', marginTop: 10}}>Nenhuma pasta criada.</Text>
                  ) : (
                    (modalBibEstudio === 'local' ? pastas : pastasLrc).map(pasta => (
                      <TouchableOpacity key={pasta} style={styles.btnDestinoPasta} onPress={() => abrirPastaNoEstudio(pasta, modalBibEstudio!)}>
                        <Ionicons name="folder" size={20} color={modalBibEstudio === 'local' ? '#FFCA28' : '#FF9800'} style={{marginRight: 10}}/>
                        <Text style={styles.qualidadeBtnText}>{pasta}</Text>
                      </TouchableOpacity>
                    ))
                  )}
                </ScrollView>
              </>
            ) : (
              // TELA 2: LISTA OS ARQUIVOS DENTRO DA PASTA
              <>
                <Text style={styles.qualidadeSubtitle}>Músicas em: {pastaBibEstudio}</Text>
                <ScrollView style={styles.destinoPastasScroll}>
                  {arquivosBibEstudio.length === 0 ? (
                    <Text style={{color: '#777', textAlign: 'center', marginTop: 10}}>Nenhum áudio encontrado nesta pasta.</Text>
                  ) : (
                    arquivosBibEstudio.map(arq => (
                      <TouchableOpacity key={arq} style={styles.btnDestinoPasta} onPress={() => selecionarArquivoBibEstudio(arq, modalBibEstudio!)}>
                        <Ionicons name="play-circle" size={20} color="#4CAF50" style={{marginRight: 10}}/>
                        <Text style={styles.qualidadeBtnText} numberOfLines={1}>{arq}</Text>
                      </TouchableOpacity>
                    ))
                  )}
                </ScrollView>
                <TouchableOpacity style={[styles.qualidadeCancelarBtn, {marginBottom: 10}]} onPress={() => { setPastaBibEstudio(null); setArquivosBibEstudio([]); }}>
                  <Text style={[styles.qualidadeCancelarText, {color: '#A0A0A0'}]}>⬅ Voltar para Pastas</Text>
                </TouchableOpacity>
              </>
            )}

            <TouchableOpacity style={styles.qualidadeCancelarBtn} onPress={() => { setModalBibEstudio(null); setPastaBibEstudio(null); setArquivosBibEstudio([]); }}>
              <Text style={styles.qualidadeCancelarText}>Cancelar / Fechar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* MODAL: BUSCAR ONLINE PARA O ESTÚDIO (YT/SC) */}
      <Modal visible={modalBuscaYtEstudio} transparent={true} animationType="slide">
        <View style={styles.modalCenterOverlay}>
          <View style={[styles.destinoBox, { height: '85%', width: '95%' }]}>
            <Text style={styles.qualidadeTitle}>Buscar no {fonteBuscaEstudio === 'soundcloud' ? 'SoundCloud' : 'YouTube'}</Text>
            <Text style={styles.qualidadeSubtitle}>O áudio será baixado e enviado para a IA.</Text>
            
            <View style={{ flexDirection: 'row', width: '100%', marginBottom: 15 }}>
              <TextInput 
                style={[styles.searchInput, { flex: 1 }]} 
                placeholder={`Pesquisar no ${fonteBuscaEstudio === 'soundcloud' ? 'SoundCloud' : 'YouTube'}...`} 
                placeholderTextColor="#A0A0A0" 
                value={buscaYtEstudio} 
                onChangeText={setBuscaYtEstudio} 
                onSubmitEditing={buscarYoutubeEstudio} 
              />
              <TouchableOpacity style={[styles.searchButton, fonteBuscaEstudio === 'soundcloud' && {backgroundColor: '#FF5500'}]} onPress={buscarYoutubeEstudio}>
                <Ionicons name="search" size={20} color="#FFF" />
              </TouchableOpacity>
            </View>

            {isBuscandoYtEstudio && <ActivityIndicator size="large" color={fonteBuscaEstudio === 'soundcloud' ? '#FF5500' : '#E50914'} />}

            <FlatList data={resultadosYtEstudio} keyExtractor={(item) => item.id} style={{ width: '100%' }}
              renderItem={({ item }) => (
                <View style={styles.ytItem}>
                  <View style={styles.ytThumbContainer}>
                    {item.thumb ? <Image source={{ uri: item.thumb }} style={styles.ytThumb} /> : <View style={[styles.ytThumb, {backgroundColor: fonteBuscaEstudio === 'soundcloud' ? '#FF5500' : '#333', justifyContent: 'center', alignItems: 'center'}]}><Ionicons name={fonteBuscaEstudio === 'soundcloud' ? "cloud" : "videocam"} size={24} color="#FFF" /></View>}
                  </View>
                  <View style={styles.ytInfo}>
                    <Text style={styles.ytTitle} numberOfLines={2}>{item.titulo}</Text>
                    
                    {isBaixandoYtEstudio && idBaixandoEstudio === item.id ? (
                      <Text style={{color: fonteBuscaEstudio === 'soundcloud' ? '#FF5500' : '#E50914', fontSize: 12, marginTop: 5, fontWeight: 'bold'}}>Baixando áudio...</Text>
                    ) : (
                      <View style={{flexDirection: 'row', gap: 10, marginTop: 5}}>
                        <TouchableOpacity 
                          style={[styles.ytBtnAudio, {alignSelf: 'flex-start', opacity: isBaixandoYtEstudio ? 0.5 : 1}]} 
                          onPress={() => baixarYoutubeParaEstudio(item.id, item.titulo)}
                          disabled={isBaixandoYtEstudio} 
                        >
                          <Ionicons name="download" size={14} color="#FFF" />
                          <Text style={styles.ytBtnText}>Usar Áudio</Text>
                        </TouchableOpacity>

                        <TouchableOpacity 
                          style={[styles.ytBtnVideo, {alignSelf: 'flex-start', backgroundColor: fonteBuscaEstudio === 'soundcloud' ? '#BF360C' : '#E50914', opacity: isBaixandoYtEstudio ? 0.5 : 1}]} 
                          onPress={() => {
                            const urlPreview = fonteBuscaEstudio === 'soundcloud' ? item.id : `https://www.youtube.com/watch?v=${item.id}`;
                            if (Platform.OS === 'web') { 
                              // Abre um pop-up flutuante pequeno com a prévia
                              window.open(urlPreview, 'PreviaPopUp', 'width=500,height=350,toolbar=no,menubar=no,scrollbars=no,location=no,status=no'); 
                            } else { 
                              Linking.openURL(urlPreview); 
                            }
                          }}
                          disabled={isBaixandoYtEstudio} 
                        >
                          <Ionicons name="play" size={14} color="#FFF" />
                          <Text style={styles.ytBtnText}>Prévia</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                </View>
              )}
            />
            <TouchableOpacity style={styles.qualidadeCancelarBtn} onPress={() => setModalBuscaYtEstudio(false)} disabled={isBaixandoYtEstudio}>
              <Text style={[styles.qualidadeCancelarText, isBaixandoYtEstudio && {color: '#555'}]}>Cancelar e Fechar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* MODAL: SALVAR ÁUDIO DO YOUTUBE APÓS IMPORTAR PARA O ESTÚDIO */}
      <Modal visible={!!modalSalvarYtEstudio} transparent={true} animationType="slide">
        <View style={styles.modalCenterOverlay}>
          <View style={[styles.destinoBox, {maxHeight: '80%'}]}>
            <Text style={styles.qualidadeTitle}>Áudio Importado!</Text>
            <Text style={styles.qualidadeSubtitle}>Deseja salvar uma cópia definitiva deste áudio na sua biblioteca?</Text>
            
            {!destinoYtSelecionado ? (
              <>
                <TouchableOpacity style={[styles.btnDestinoCelular, {backgroundColor: '#4CAF50', marginBottom: 10}]} onPress={() => setDestinoYtSelecionado('local')}>
                  <Ionicons name="folder" size={20} color="#FFF" style={{marginRight: 10}}/>
                  <Text style={styles.qualidadeBtnText}>Salvar na Biblioteca Local</Text>
                </TouchableOpacity>

                <TouchableOpacity style={[styles.btnDestinoCelular, {backgroundColor: '#FF9800', marginBottom: 10}]} onPress={() => setDestinoYtSelecionado('lrc')}>
                  <Ionicons name="musical-notes" size={20} color="#FFF" style={{marginRight: 10}}/>
                  <Text style={styles.qualidadeBtnText}>Salvar na Biblioteca LRC</Text>
                </TouchableOpacity>

                {/* --- NOVO BOTÃO DE MEMÓRIA INTERNA AQUI --- */}
                <TouchableOpacity style={[styles.btnDestinoCelular, {backgroundColor: '#9C27B0'}]} onPress={salvarNoDispositivoEstudio}>
                  <Ionicons name="phone-portrait" size={20} color="#FFF" style={{marginRight: 10}}/>
                  <Text style={styles.qualidadeBtnText}>Salvar no Dispositivo (Celular/PC)</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.qualidadeCancelarBtn} onPress={() => { setModalSalvarYtEstudio(null); setDestinoYtSelecionado(null); }}>
                  <Text style={styles.qualidadeCancelarText}>Não, manter apenas temporário</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <Text style={styles.divisorDestino}>--- ESCOLHA A PASTA ---</Text>
                <ScrollView style={styles.destinoPastasScroll}>
                  {(destinoYtSelecionado === 'local' ? pastas : pastasLrc).length === 0 ? (
                    <Text style={{color: '#777', textAlign: 'center', marginTop: 10}}>Nenhuma pasta criada nesta biblioteca.</Text>
                  ) : (
                    (destinoYtSelecionado === 'local' ? pastas : pastasLrc).map(pasta => (
                      <TouchableOpacity key={pasta} style={styles.btnDestinoPasta} onPress={() => confirmarSalvarYtEstudio(pasta)}>
                        <Ionicons name="folder" size={20} color={destinoYtSelecionado === 'local' ? '#FFCA28' : '#FF9800'} style={{marginRight: 10}}/>
                        <Text style={styles.qualidadeBtnText}>Salvar em: {pasta}</Text>
                      </TouchableOpacity>
                    ))
                  )}
                </ScrollView>
                <TouchableOpacity style={styles.qualidadeCancelarBtn} onPress={() => setDestinoYtSelecionado(null)}>
                  <Text style={styles.qualidadeCancelarText}>⬅ Voltar</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* MODAL: AJUSTE DE TEMPO GLOBAL (OFFSET) */}
      <Modal visible={modalSyncMassa} transparent={true} animationType="fade">
        <View style={styles.modalCenterOverlay}>
          <View style={styles.qualidadeBox}>
            <Ionicons name="time" size={40} color="#2196F3" style={{marginBottom: 10}}/>
            <Text style={styles.qualidadeTitle}>Ajuste Global (Offset)</Text>
            <Text style={styles.qualidadeSubtitle}>Adicione ou subtraia segundos de TODAS as linhas da letra de uma vez.</Text>
            
            <TextInput 
              style={[styles.inputPasta, {textAlign: 'center', fontSize: 20, fontWeight: 'bold'}]} 
              placeholder="Ex: 1.5 ou -2.0" 
              placeholderTextColor="#777" 
              keyboardType="numbers-and-punctuation"
              value={valorSyncMassa} 
              onChangeText={setValorSyncMassa} 
            />
            <Text style={{color: '#A0A0A0', fontSize: 12, marginTop: 5, textAlign: 'center'}}>
              Use o sinal de menos (-) para adiantar a letra (tocar mais cedo).
            </Text>

            <View style={{flexDirection: 'row', gap: 15, marginTop: 20}}>
              <TouchableOpacity style={styles.qualidadeCancelarBtn} onPress={() => { setModalSyncMassa(false); setValorSyncMassa(''); }}>
                <Text style={styles.qualidadeCancelarText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.btnSalvarPasta, {backgroundColor: '#2196F3'}]} onPress={aplicarSyncEmMassa}>
                <Text style={styles.btnSalvarPastaText}>Aplicar Ajuste</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* MODAL: ESCOLHER ORIGEM DA LETRA NO ESTÚDIO */}
      <Modal visible={modalOrigemLetra} transparent={true} animationType="fade">
        <View style={styles.modalCenterOverlay}>
          <View style={styles.qualidadeBox}>
            <Ionicons name="document-text" size={40} color="#FF9800" style={{marginBottom: 10}}/>
            <Text style={styles.qualidadeTitle}>Importar Letra</Text>
            <Text style={styles.qualidadeSubtitle}>De onde você quer puxar o texto?</Text>
            
            <TouchableOpacity style={[styles.btnDestinoCelular, {backgroundColor: '#2196F3'}]} onPress={escolherLetraLocal}>
              <Ionicons name="folder" size={20} color="#FFF" style={{marginRight: 10}}/>
              <Text style={styles.qualidadeBtnText}>Memória Interna</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.btnDestinoCelular, {backgroundColor: '#FF9800', marginTop: 10}]} onPress={() => { setModalOrigemLetra(false); setModalBibLetraLrc(true); inicializarBibliotecaLrc(); }}>
              <Ionicons name="library" size={20} color="#FFF" style={{marginRight: 10}}/>
              <Text style={styles.qualidadeBtnText}>Biblioteca LRC</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.qualidadeCancelarBtn} onPress={() => setModalOrigemLetra(false)}>
              <Text style={styles.qualidadeCancelarText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* MODAL: NAVEGAR NA BIBLIOTECA LRC PARA LETRAS (ESTÚDIO) */}
      <Modal visible={modalBibLetraLrc} transparent={true} animationType="slide">
        <View style={styles.modalCenterOverlay}>
          <View style={[styles.destinoBox, {maxHeight: '80%', width: '90%'}]}>
            <Text style={styles.qualidadeTitle}>Biblioteca LRC</Text>

            {!pastaBibLetraLrc ? (
              // TELA 1: LISTA AS PASTAS LRC
              <>
                <Text style={styles.qualidadeSubtitle}>Escolha a pasta para buscar a letra</Text>
                <ScrollView style={styles.destinoPastasScroll}>
                  {(pastasLrc.length === 0 && Object.keys(pastasVirtuaisLrcWeb).length === 0) ? (
                    <View style={styles.emptyBiblio}>
                      <Ionicons name="musical-notes-outline" size={60} color="#444" />
                      <Text style={styles.emptyBiblioText}>Nenhuma pasta LRC criada.</Text>
                    </View>
                  ) : (
                    pastasLrc.map(pasta => (
                      <TouchableOpacity key={pasta} style={styles.btnDestinoPasta} onPress={() => abrirPastaLetraNoEstudio(pasta)}>
                        <Ionicons name="folder" size={20} color="#FF9800" style={{marginRight: 10}}/>
                        <Text style={styles.qualidadeBtnText}>{pasta}</Text>
                      </TouchableOpacity>
                    ))
                  )}
                </ScrollView>
              </>
            ) : (
              // TELA 2: LISTA OS ARQUIVOS .LRC E .TXT
              <>
                <Text style={styles.qualidadeSubtitle}>Letras em: {pastaBibLetraLrc}</Text>
                <ScrollView style={styles.destinoPastasScroll}>
                  {arquivosBibLetraLrc.length === 0 ? (
                    <Text style={{color: '#777', textAlign: 'center', marginTop: 10}}>Nenhum arquivo .lrc ou .txt nesta pasta.</Text>
                  ) : (
                    arquivosBibLetraLrc.map(arq => (
                      <TouchableOpacity key={arq} style={styles.btnDestinoPasta} onPress={() => selecionarArquivoLetraBibEstudio(arq)}>
                        <Ionicons name="document-text" size={20} color="#2196F3" style={{marginRight: 10}}/>
                        <Text style={styles.qualidadeBtnText} numberOfLines={1}>{arq}</Text>
                      </TouchableOpacity>
                    ))
                  )}
                </ScrollView>
                <TouchableOpacity style={[styles.qualidadeCancelarBtn, {marginBottom: 10}]} onPress={() => { setPastaBibLetraLrc(null); setArquivosBibLetraLrc([]); }}>
                  <Text style={[styles.qualidadeCancelarText, {color: '#A0A0A0'}]}>⬅ Voltar para Pastas</Text>
                </TouchableOpacity>
              </>
            )}

            <TouchableOpacity style={styles.qualidadeCancelarBtn} onPress={() => { setModalBibLetraLrc(false); setPastaBibLetraLrc(null); setArquivosBibLetraLrc([]); }}>
              <Text style={styles.qualidadeCancelarText}>Cancelar / Fechar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* MODAL METADADOS LRC (NOVO) */}
      <Modal visible={modalMetadadosLrc} transparent={false} animationType="slide">
        <SafeAreaView style={styles.metaContainer}>
          <View style={styles.metaHeader}>
            <TouchableOpacity onPress={() => setModalMetadadosLrc(false)} style={{flexDirection: 'row', alignItems: 'center'}}>
              <Ionicons name="arrow-back" size={24} color="#FFF" style={{marginRight: 10}}/>
              <Text style={styles.metaHeaderTitle}>Editar Informações (LRC)</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={salvarArquivoLRC}>
              <Ionicons name="save" size={28} color="#FF9800" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.metaScroll}>
            <Text style={styles.metaInfoText}>As informações abaixo serão salvas no cabeçalho do arquivo.</Text>
            
            <View style={styles.metaInputGroup}>
              <Text style={styles.metaLabel}>Nome do Arquivo (sem .lrc)</Text>
              <TextInput style={styles.metaInput} value={lrcMetaFileName} onChangeText={setLrcMetaFileName} placeholderTextColor="#777" />
            </View>

            <View style={styles.metaInputGroup}>
              <Text style={styles.metaLabel}>Título da Música</Text>
              <TextInput style={styles.metaInput} value={lrcMetaTitle} onChangeText={setLrcMetaTitle} placeholderTextColor="#777" />
            </View>

            <View style={styles.metaInputGroup}>
              <Text style={styles.metaLabel}>Artista</Text>
              <TextInput style={styles.metaInput} value={lrcMetaArtist} onChangeText={setLrcMetaArtist} placeholderTextColor="#777" />
            </View>

            <View style={styles.metaInputGroup}>
              <Text style={styles.metaLabel}>Álbum</Text>
              <TextInput style={styles.metaInput} value={lrcMetaAlbum} onChangeText={setLrcMetaAlbum} placeholderTextColor="#777" />
            </View>

            <View style={styles.metaInputGroup}>
              <Text style={styles.metaLabel}>Criador da Letra</Text>
              <TextInput style={styles.metaInput} value={lrcMetaBy} onChangeText={setLrcMetaBy} placeholderTextColor="#777" />
            </View>

            <View style={styles.metaInputGroupDisabled}>
              <Text style={styles.metaLabel}>Editor LRC Usado</Text>
              <Text style={styles.metaTextDisabled}>GH Karaokê</Text>
            </View>

          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* MODAL: DESTINO DO DOWNLOAD LRC */}
      <Modal visible={!!modalDestinoLrc} transparent={true} animationType="slide">
        <View style={styles.modalCenterOverlay}>
          <View style={styles.destinoBox}>
            <Text style={styles.qualidadeTitle}>Salvar arquivo .LRC</Text>
            <Text style={styles.qualidadeSubtitle} numberOfLines={1}>{modalDestinoLrc?.nomeFinal}</Text>
            
            <TouchableOpacity style={styles.btnDestinoCelular} onPress={() => executarDownloadDestinoLRC('dispositivo')}>
              <Ionicons name="phone-portrait" size={20} color="#FFF" style={{marginRight: 10}}/>
              <Text style={styles.qualidadeBtnText}>Compartilhar / Dispositivo</Text>
            </TouchableOpacity>

            <Text style={styles.divisorDestino}>--- OU NA BIBLIOTECA LRC ---</Text>

            <ScrollView style={styles.destinoPastasScroll}>
              {pastasLrc.length === 0 ? (
                <Text style={{color: '#777', textAlign: 'center', marginTop: 10}}>Crie uma pasta em "Biblioteca LRC" primeiro.</Text>
              ) : (
                pastasLrc.map(pasta => (
                  <TouchableOpacity key={pasta} style={styles.btnDestinoPasta} onPress={() => executarDownloadDestinoLRC('biblioteca', pasta)}>
                    <Ionicons name="folder" size={20} color="#FF9800" style={{marginRight: 10}}/>
                    <Text style={styles.qualidadeBtnText}>Salvar em: {pasta}</Text>
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>

            <TouchableOpacity style={styles.qualidadeCancelarBtn} onPress={() => setModalDestinoLrc(null)}><Text style={styles.qualidadeCancelarText}>Cancelar</Text></TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* MODAL ESCOLHER PASTA LRC (REPRODUTOR) */}
      <Modal visible={modalPastasLrc} transparent={true} animationType="slide">
        <View style={styles.modalCenterOverlay}>
          <View style={styles.destinoBox}>
            <Text style={styles.qualidadeTitle}>Tocar Gênero</Text>
            <Text style={styles.qualidadeSubtitle}>Escolha uma pasta da sua biblioteca</Text>
            <ScrollView style={styles.destinoPastasScroll}>
              {pastasLrc.length === 0 ? (
                <Text style={{color: '#777', textAlign: 'center', marginTop: 10}}>Crie uma pasta em "Biblioteca LRC" primeiro.</Text>
              ) : (
                pastasLrc.map(pasta => (
                  <TouchableOpacity key={pasta} style={styles.btnDestinoPasta} onPress={() => { 
                    setModalPastasLrc(false);
                    construirPlaylistLrcDaPasta(pasta);
                  }}>
                    <Ionicons name="folder" size={20} color="#FF9800" style={{marginRight: 10}}/>
                    <Text style={styles.qualidadeBtnText}>{pasta}</Text>
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>
            <TouchableOpacity style={styles.qualidadeCancelarBtn} onPress={() => setModalPastasLrc(false)}><Text style={styles.qualidadeCancelarText}>Cancelar</Text></TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* MODAL: RENOMEAR ITEM DA FILA */}
      <Modal visible={!!modalRenomearFila} transparent={true} animationType="fade">
        <View style={styles.modalCenterOverlay}>
          <View style={styles.qualidadeBox}>
            <Text style={styles.qualidadeTitle}>Renomear Arquivo</Text>
            <TextInput style={styles.inputPasta} value={modalRenomearFila?.name || ''} onChangeText={(text) => setModalRenomearFila(prev => prev ? {...prev, name: text} : null)} autoFocus />
            <View style={{flexDirection: 'row', gap: 15, marginTop: 20}}>
              <TouchableOpacity style={styles.qualidadeCancelarBtn} onPress={() => setModalRenomearFila(null)}><Text style={styles.qualidadeCancelarText}>Cancelar</Text></TouchableOpacity>
              <TouchableOpacity style={styles.btnSalvarPasta} onPress={salvarRenomearFila}><Text style={styles.btnSalvarPastaText}>Salvar</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* MODAL: SALVAR PLAYLIST */}
      <Modal visible={modalSalvarFila} transparent={true} animationType="fade">
        <View style={styles.modalCenterOverlay}>
          <View style={styles.qualidadeBox}>
            <Text style={styles.qualidadeTitle}>Salvar Playlist</Text>
            <Text style={styles.qualidadeSubtitle}>Dê um nome para guardar a fila atual</Text>
            <TextInput style={styles.inputPasta} placeholder="Ex: Festa Sertanejo" placeholderTextColor="#777" value={nomeFilaSalva} onChangeText={setNomeFilaSalva} autoFocus />
            
            <View style={{width: '100%', marginTop: 20}}>
              {/* Botão Antigo: Salva escondido dentro do app */}
              <TouchableOpacity style={[styles.btnDestinoCelular, {backgroundColor: '#4CAF50', marginBottom: 10}]} onPress={salvarFilaAtual}>
                <Ionicons name="save" size={20} color="#FFF" style={{marginRight: 10}}/>
                <Text style={styles.qualidadeBtnText}>Salvar no App (Interno)</Text>
              </TouchableOpacity>

              {/* Botão Novo: Salva um arquivo físico */}
              <TouchableOpacity style={[styles.btnDestinoCelular, {backgroundColor: '#2196F3'}]} onPress={exportarFilaComoArquivo}>
                <Ionicons name="download" size={20} color="#FFF" style={{marginRight: 10}}/>
                <Text style={styles.qualidadeBtnText}>Exportar Arquivo (.json)</Text>
              </TouchableOpacity>

              <TouchableOpacity style={[styles.qualidadeCancelarBtn, {alignItems: 'center', marginTop: 15}]} onPress={() => setModalSalvarFila(false)}>
                <Text style={styles.qualidadeCancelarText}>Cancelar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* MODAL: CARREGAR PLAYLIST */}
      <Modal visible={modalCarregarFila} transparent={true} animationType="slide">
        <View style={styles.modalCenterOverlay}>
          <View style={[styles.destinoBox, {maxHeight: '80%', width: '90%'}]}>
            <Text style={styles.qualidadeTitle}>Playlists Salvas</Text>

            {/* BOTÃO NOVO DE IMPORTAR FÍSICO */}
            <TouchableOpacity style={[styles.btnDestinoCelular, {backgroundColor: '#2196F3', marginBottom: 15, paddingVertical: 12}]} onPress={importarFilaDeArquivo}>
                <Ionicons name="document-text" size={20} color="#FFF" style={{marginRight: 10}}/>
                <Text style={styles.qualidadeBtnText}>Importar Arquivo (.json)</Text>
            </TouchableOpacity>

            <Text style={styles.qualidadeSubtitle}>Ou carregue das suas listas internas:</Text>

            <ScrollView style={styles.destinoPastasScroll}>
              {listasSalvas.length === 0 ? (
                <Text style={{color: '#777', textAlign: 'center', marginTop: 10}}>Nenhuma playlist salva ainda.</Text>
              ) : (
                listasSalvas.map(lista => (
                  <View key={lista} style={styles.arquivoRow}>
                    <TouchableOpacity style={styles.arquivoInfo} onPress={() => carregarFilaSelecionada(lista)}>
                      <Ionicons name="list" size={24} color="#FFCA28" />
                      <Text style={styles.arquivoName} numberOfLines={1}>{lista}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={{padding: 10}} onPress={() => apagarFilaSalva(lista)}>
                      <Ionicons name="trash" size={20} color="#E50914" />
                    </TouchableOpacity>
                  </View>
                ))
              )}
            </ScrollView>
            <TouchableOpacity style={styles.qualidadeCancelarBtn} onPress={() => setModalCarregarFila(false)}>
              <Text style={styles.qualidadeCancelarText}>Fechar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* MODAL ESCOLHER PASTA (REPRODUTOR PRINCIPAL) */}
      <Modal visible={modalPastasPro} transparent={true} animationType="slide">
        <View style={styles.modalCenterOverlay}>
          <View style={styles.destinoBox}>
            <Text style={styles.qualidadeTitle}>Adicionar à Fila</Text>
            <Text style={styles.qualidadeSubtitle}>Escolha uma pasta da Biblioteca Local</Text>
            <ScrollView style={styles.destinoPastasScroll}>
              {(pastas.length === 0 && Object.keys(pastasVirtuaisWeb).length === 0) ? (
                <Text style={{color: '#777', textAlign: 'center', marginTop: 10}}>Nenhuma pasta criada na Biblioteca Local.</Text>
              ) : (
                pastas.map(pasta => (
                  <TouchableOpacity key={pasta} style={styles.btnDestinoPasta} onPress={() => adicionarPastaNaPlaylist(pasta)}>
                    <Ionicons name="folder" size={20} color="#FFCA28" style={{marginRight: 10}}/>
                    <Text style={styles.qualidadeBtnText}>{pasta}</Text>
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>
            <TouchableOpacity style={styles.qualidadeCancelarBtn} onPress={() => setModalPastasPro(false)}><Text style={styles.qualidadeCancelarText}>Cancelar</Text></TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* MODAL FULLSCREEN DA FILA DE REPRODUÇÃO (EXCLUSIVO MOBILE) */}
      {Platform.OS !== 'web' && (
        <Modal 
          visible={telaAtiva === 'reprodutor' && isPlaylistVisible} 
          transparent={false} 
          animationType="slide" 
          onRequestClose={() => setIsPlaylistVisible(false)}
        >
          <SafeAreaView style={{ flex: 1, backgroundColor: '#1E1E1E' }}>
            <FilaReproducao 
              usarFlatList={true}
              mostrarBuscaFila={mostrarBuscaFila} setMostrarBuscaFila={setMostrarBuscaFila}
              buscaFila={buscaFila} setBuscaFila={setBuscaFila}
              playlist={playlist} playlistFiltrada={playlistFiltrada}
              currentIndex={currentIndex} setCurrentIndex={setCurrentIndex}
              reproducaoTemp={reproducaoTemp} setReproducaoTemp={setReproducaoTemp}
              setIsPlaylistVisible={setIsPlaylistVisible} carregarListasSalvas={carregarListasSalvas}
              setModalCarregarFila={setModalCarregarFila} setModalSalvarFila={setModalSalvarFila}
              confirmarLimparPlaylist={confirmarLimparPlaylist} inicializarBiblioteca={inicializarBiblioteca}
              setModalPastasPro={setModalPastasPro} adicionarPastaDoDispositivo={adicionarPastaDoDispositivo}
              selecionarMidiaPro={selecionarMidiaPro} moverItemFila={moverItemFila}
              setModalRenomearFila={setModalRenomearFila} removerDaPlaylist={removerDaPlaylist}
            />
          </SafeAreaView>
        </Modal>
      )}

      {/* MODAL: MIXER DE MICROFONE E EFEITOS */}
      <ModalMixer
        visivel={modalMixer}
        onMinimizar={() => setModalMixer(false)}
        micAtivo={micAtivo}
        alternarMicrofone={alternarMicrofone}
        micDevices={micDevices}
        selectedMicId={selectedMicId}
        setSelectedMicId={setSelectedMicId}
        mostrarInterfaces={mostrarInterfaces}
        setMostrarInterfaces={setMostrarInterfaces}
        volMic={volMic}
        setVolMic={setVolMic}
        reverbNivel={reverbNivel}
        setReverbNivel={setReverbNivel}
        reverbTempo={reverbTempo}
        setReverbTempo={setReverbTempo}
        echoNivel={echoNivel}
        setEchoNivel={setEchoNivel}
        echoTempo={echoTempo}
        setEchoTempo={setEchoTempo}
        echoFeedback={echoFeedback}
        setEchoFeedback={setEchoFeedback}
        graveNivel={graveNivel}
        setGraveNivel={setGraveNivel}
        medioNivel={medioNivel}
        setMedioNivel={setMedioNivel}
        agudoNivel={agudoNivel}
        setAgudoNivel={setAgudoNivel}
      />

      {/* ========================================================= */}
      {/* TELAS */}
      {/* ========================================================= */}

      {/* --- TELA: REPRODUTOR LRC (KARAOKÊ) --- */}
      {telaAtiva === 'reprodutor_lrc' && (
        <TelaReprodutorLRC
          telaAtiva={telaAtiva}
          lrcAudioUri={lrcAudioUri}
          lrcLetras={lrcLetras}
          isLandscape={isLandscape}
          lrcPlaylist={lrcPlaylist}
          inicializarBibliotecaLrc={inicializarBibliotecaLrc}
          setModalPastasLrc={setModalPastasLrc}
          selecionarAudioLrc={selecionarAudioLrc}
          selecionarArquivoLrcParaTocar={selecionarArquivoLrcParaTocar}
          lrcCoverUrl={lrcCoverUrl}
          lrcMetaInfo={lrcMetaInfo}
          abrirEditorDoLrc={abrirEditorDoLrc}
          setModalMixer={setModalMixer}
          isLrcPlaylistVisible={isLrcPlaylistVisible}
          setIsLrcPlaylistVisible={setIsLrcPlaylistVisible}
          lrcCurrentIndex={lrcCurrentIndex}
          tocarItemLrc={tocarItemLrc}
          lrcTempoAtual={lrcTempoAtual}
          lrcDuracaoTotal={lrcDuracaoTotal}
          lrcAudioPlayer={lrcAudioPlayer}
          setLrcTempoAtual={setLrcTempoAtual}
          anteriorLrc={anteriorLrc}
          tocarOuPausarLrc={tocarOuPausarLrc}
          isLrcPlaying={isLrcPlaying}
          proximaLrc={proximaLrc}
          lrcIndiceAtivo={lrcIndiceAtivo}
          lrcListRef={lrcListRef}
          renderEqualizadorMusica={renderEqualizadorMusica}
          formatarTempo={formatarTempo}
          adicionarPastaLrcPCWeb={adicionarPastaLrcPCWeb}
        />
      )}

      {/* --- TELA PRINCIPAL (IA E EDITOR) --- */}
      {telaAtiva === 'principal' && (
        <TelaEstudioIA 
            telaAtiva={telaAtiva} 
            audioUri={audioUri}    
            isModoCriador={isModoCriador}
            setIsModoCriador={setIsModoCriador}
            arquivoAudio={arquivoAudio}
            isExtractingLyrics={isExtractingLyrics}
            extrairLetraComIA={extrairLetraComIA}
            abrirSelecaoMusica={abrirSelecaoMusica}
            nomeLetra={nomeLetra}
            abrirSelecaoLetra={abrirSelecaoLetra}
            setModalBuscaLetra={setModalBuscaLetra}
            tempoAtual={tempoAtual}
            duracaoTotal={duracaoTotal}
            audioPlayer={audioPlayer}
            setTempoAtual={setTempoAtual}
            isPlaying={isPlaying}
            tocarOuPausar={tocarOuPausar}
            processarKaraoke={processarKaraoke}
            karaokePronto={karaokePronto}
            isProcessing={isProcessing}
            urlPlayback={urlPlayback}
            urlVoz={urlVoz}
            baixarECompartilhar={baixarECompartilhar}
            linhasSync={linhasSync}
            letras={letras}
            indiceAtivo={indiceAtivo}
            flatListRef={flatListRef}
            modeloIA={modeloIA}
            setModalSyncMassa={setModalSyncMassa}
            abrirModalSalvarLRC={abrirModalSalvarLRC}
            indiceCriador={indiceCriador}
            ajustarTempoLinha={ajustarTempoLinha}
            formatarTempoMs={formatarTempoMs}
            editarTextoLinha={editarTextoLinha}
            apagarTempoLinha={apagarTempoLinha}
            formatarTempo={formatarTempo}
            retrocederAudio={retrocederAudio}
            avancarAudio={avancarAudio}
            registrarTempo={registrarTempo}
        />
      )}

      {/* --- TELA REPRODUTOR E YOUTUBE --- */}
      {telaAtiva === 'reprodutor' && (
        <TelaReprodutorYoutube 
            telaAtiva={telaAtiva}
            isLandscape={isLandscape}
            buscaYoutube={buscaYoutube}
            setBuscaYoutube={setBuscaYoutube}
            fazerBuscaYoutube={fazerBuscaYoutube}
            limparBusca={limparBusca}
            isPlaylistVisible={isPlaylistVisible}
            setIsPlaylistVisible={setIsPlaylistVisible}
            fonteBusca={fonteBusca}
            setFonteBusca={setFonteBusca}
            resultadosYoutube={resultadosYoutube}
            isBuscandoYt={isBuscandoYt}
            arquivoPro={arquivoPro}
            player={player}
            currentIndex={currentIndex}
            playlist={playlist}
            reproducaoTemp={reproducaoTemp}
            setReproducaoTemp={setReproducaoTemp}
            setUrlAudioExtraido={setUrlAudioExtraido}
            setModalAcaoYoutube={setModalAcaoYoutube}
            isBaixandoYt={isBaixandoYt}
            idBaixando={idBaixando}
            adicionarNaPlaylist={adicionarNaPlaylist}
            setModalQualidadeYt={setModalQualidadeYt}
            setModalMixer={setModalMixer}
            modoMonitorExterno={modoMonitorExterno}
            alternarMonitorExterno={alternarMonitorExterno}
            youtubeTimeRef={youtubeTimeRef}
            isExtracting={isExtracting}
            urlAudioExtraido={urlAudioExtraido}
            baixarECompartilhar={baixarECompartilhar}
            extrairAudioDoVideo={extrairAudioDoVideo}
            eqPlaybackAtivo={eqPlaybackAtivo}
            tocarAnterior={tocarAnterior}
            tocarProxima={tocarProxima}
            mostrarBuscaFila={mostrarBuscaFila}
            setMostrarBuscaFila={setMostrarBuscaFila}
            buscaFila={buscaFila}
            setBuscaFila={setBuscaFila}
            playlistFiltrada={playlistFiltrada}
            setCurrentIndex={setCurrentIndex}
            carregarListasSalvas={carregarListasSalvas}
            setModalCarregarFila={setModalCarregarFila}
            setModalSalvarFila={setModalSalvarFila}
            confirmarLimparPlaylist={confirmarLimparPlaylist}
            inicializarBiblioteca={inicializarBiblioteca}
            setModalPastasPro={setModalPastasPro}
            adicionarPastaDoDispositivo={adicionarPastaDoDispositivo}
            selecionarMidiaPro={selecionarMidiaPro}
            moverItemFila={moverItemFila}
            setModalRenomearFila={setModalRenomearFila}
            removerDaPlaylist={removerDaPlaylist}
            renderEqualizadorMusica={renderEqualizadorMusica}
            youtubePlayerRef={youtubePlayerRef}
            videoViewRef={videoViewRef}
        />
      )}

      {/* --- TELA: BIBLIOTECA LOCAL E LRC (UNIFICADAS NO COMPONENTE) --- */}
      <PainelBiblioteca
         isLrc={false}
         telaAtiva={telaAtiva}
         pastaAtual={pastaAtual}
         pastas={pastas}
         pastasVirtuais={pastasVirtuaisWeb}
         modoVisao={modoVisao}
         renderFiltrosVisualizacao={renderFiltrosVisualizacao}
         renderPastaUnificada={renderPastaUnificada}
         restaurarPastasSalvasPC={restaurarPastasSalvasPC}
         linkarPastaPCWeb={() => linkarPastaPCWeb(false)}
         setModalNovaPasta={setModalNovaPasta}
         voltarParaPastas={voltarParaPastas}
         setModalOrdem={setModalOrdem}
         importarArquivos={importarArquivos}
         modoSelecaoBib={modoSelecaoBib}
         selecionadosBib={selecionadosBib}
         adicionarSelecionadosNaFila={adicionarSelecionadosNaFila}
         exportarSelecionados={exportarSelecionados}
         apagarSelecionados={apagarSelecionados}
         cancelarSelecao={cancelarSelecao}
         arquivosPasta={arquivosPasta}
         iniciarModoSelecao={iniciarModoSelecao}
         toggleSelecaoArquivo={toggleSelecaoArquivo}
         acaoClicarArquivo={(item, uriLocal) => setModalAcaoArquivo({nome: item, uri: uriLocal, isLrc: false, pasta: pastaAtual!})}
         apagarItem={(item, isPasta) => apagarItem(item, isPasta)}
      />

      <PainelBiblioteca
         isLrc={true}
         telaAtiva={telaAtiva}
         pastaAtual={pastaAtualLrc}
         pastas={pastasLrc}
         pastasVirtuais={pastasVirtuaisLrcWeb}
         modoVisao={modoVisao}
         renderFiltrosVisualizacao={renderFiltrosVisualizacao}
         renderPastaUnificada={renderPastaUnificada}
         restaurarPastasSalvasPC={restaurarPastasSalvasPC}
         linkarPastaPCWeb={() => linkarPastaPCWeb(true)}
         setModalNovaPasta={setModalNovaPastaLrc}
         voltarParaPastas={voltarParaPastasLrc}
         setModalOrdem={setModalOrdem}
         importarArquivos={importarArquivosLrc}
         modoSelecaoBib={modoSelecaoBib}
         selecionadosBib={selecionadosBib}
         adicionarSelecionadosNaFila={() => {}} // Não utilizado na Biblioteca LRC
         exportarSelecionados={exportarSelecionados}
         apagarSelecionados={apagarSelecionados}
         cancelarSelecao={cancelarSelecao}
         arquivosPasta={arquivosPastaLrc}
         iniciarModoSelecao={iniciarModoSelecao}
         toggleSelecaoArquivo={toggleSelecaoArquivo}
         acaoClicarArquivo={(item) => tocarParCasadoLrc(item)}
         abrirOpcoesLrc={(item) => setModalAcaoArquivo({nome: item, uri: `${LRC_LIBRARY_DIR}${pastaAtualLrc}/${item}`, isLrc: true, pasta: pastaAtualLrc!})}
         apagarItem={(item, isPasta) => apagarItemLrc(item, isPasta)}
      />

      {/* ========================================================= */}
      {/* NOVO PAINEL INFERIOR (BOTTOM TAB BAR) */}
      {/* ========================================================= */}
      <View style={styles.bottomTabBar}>
        <TouchableOpacity style={styles.bottomTabItem} onPress={() => navegarPara('principal')}>
          <Ionicons name="color-wand" size={30} color={telaAtiva === 'principal' ? "#E50914" : "#A0A0A0"} />
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.bottomTabItem} onPress={() => navegarPara('reprodutor')}>
          <Ionicons name="play-circle" size={30} color={telaAtiva === 'reprodutor' ? "#E50914" : "#A0A0A0"} />
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.bottomTabItem} onPress={() => navegarPara('reprodutor_lrc')}>
          <Ionicons name="musical-notes" size={30} color={telaAtiva === 'reprodutor_lrc' ? "#E50914" : "#A0A0A0"} />
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.bottomTabItem} onPress={() => navegarPara('biblioteca')}>
          <Ionicons name="folder-open" size={30} color={telaAtiva === 'biblioteca' ? "#E50914" : "#A0A0A0"} />
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.bottomTabItem} onPress={() => navegarPara('biblioteca_lrc')}>
          <Ionicons name="library" size={30} color={telaAtiva === 'biblioteca_lrc' ? "#E50914" : "#A0A0A0"} />
        </TouchableOpacity>
      </View>
      
    </SafeAreaView>
  );
}