import React, { useState, useEffect, useRef } from 'react';
import { Text, View, TouchableOpacity, Platform, FlatList, Modal, useWindowDimensions, Dimensions } from 'react-native';
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
import { usePlaylistManager } from '../../src/hooks/usePlaylistManager';
import { useStudioImporters } from '../../src/hooks/useStudioImporters';
import { useLrcManager } from '../../src/hooks/useLrcManager';
import { gerarHtmlMonitorExterno } from '../../src/utils/monitorTemplate';
import TelaEstudioIA from '../../src/screens/TelaEstudioIA';
import TelaReprodutorYoutube from '../../src/screens/TelaReprodutorYoutube';
import TelaReprodutorLRC from '../../src/screens/TelaReprodutorLRC';
import ModalDestinoDownload from '../../src/components/modals_extra/ModalDestinoDownload';
import ModalBuscaLetra from '../../src/components/modals_extra/ModalBuscaLetra';
// --- MODAIS EXTRAÍDOS PELO SCRIPT ---
import ModalAcaoYoutube from '../../src/components/modals_extra/ModalAcaoYoutube';
import ModalOrigemMusica from '../../src/components/modals_extra/ModalOrigemMusica';
import ModalBibEstudio from '../../src/components/modals_extra/ModalBibEstudio';
import ModalBuscaYtEstudio from '../../src/components/modals_extra/ModalBuscaYtEstudio';
import ModalSalvarYtEstudio from '../../src/components/modals_extra/ModalSalvarYtEstudio';
import ModalSyncMassa from '../../src/components/modals_extra/ModalSyncMassa';
import ModalOrigemLetra from '../../src/components/modals_extra/ModalOrigemLetra';
import ModalBibLetraLrc from '../../src/components/modals_extra/ModalBibLetraLrc';
import ModalMetadadosLrc from '../../src/components/modals_extra/ModalMetadadosLrc';
import ModalDestinoLrc from '../../src/components/modals_extra/ModalDestinoLrc';
import ModalPastasLrc from '../../src/components/modals_extra/ModalPastasLrc';
import ModalRenomearFila from '../../src/components/modals_extra/ModalRenomearFila';
import ModalSalvarFila from '../../src/components/modals_extra/ModalSalvarFila';
import ModalCarregarFila from '../../src/components/modals_extra/ModalCarregarFila';
import ModalPastasPro from '../../src/components/modals_extra/ModalPastasPro';

// Quando colocar na nuvem ou ngrok, é só trocar este link inteiro!
import { styles } from '../../src/styles/indexStyles';
import { LIBRARY_DIR, LRC_LIBRARY_DIR, processarLRC, formatarTempo } from '../../src/utils/indexUtils';

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

  // --- HOOK DE FILA DE REPRODUÇÃO (EXTRAÍDO) ---
  const playlistManager = usePlaylistManager(playlist, setPlaylist, pastasVirtuaisWeb, repararLinksDaFila);
  const {
    modalPastasPro, setModalPastasPro, modalRenomearFila, setModalRenomearFila,
    modalSalvarFila, setModalSalvarFila, nomeFilaSalva, setNomeFilaSalva,
    modalCarregarFila, setModalCarregarFila, listasSalvas, setListasSalvas,
    buscaFila, setBuscaFila, mostrarBuscaFila, setMostrarBuscaFila,
    carregarListasSalvas, salvarFilaAtual, exportarFilaComoArquivo,
    carregarFilaSelecionada, apagarFilaSalva, importarFilaDeArquivo,
    salvarRenomearFila, adicionarPastaNaPlaylist, adicionarPastaDoDispositivo, adicionarPastaPCWeb
  } = playlistManager;

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

  // FUNÇÕES DE PONTE (BIBLIOTECA E YOUTUBE)  
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

  // ESTADOS RESTAURADOS DA INTERFACE E MÁQUINA DE ESTADO (IA E REPRODUTOR)
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

  const [menuAberto, setMenuAberto] = useState<boolean>(false);

  // --- ESTADOS: IA & LETRAS ---
    const [isModoCriador, setIsModoCriador] = useState<boolean>(false);
  const [linhasSync, setLinhasSync] = useState<{tempo: number | null, texto: string}[]>([]); 
  const [indiceCriador, setIndiceCriador] = useState<number>(0);

  // --- HOOK DE IMPORTAÇÃO (ESTÚDIO & LETRAS) ---
  const studioImporters = useStudioImporters(
    setArquivoAudio, setAudioUri, setKaraokePronto, setUrlPlayback, setUrlVoz,
    setTempoAtual, setDuracaoTotal, setIsPlaying, setNomeLetra, setLinhasSync,
    setIndiceCriador, setIsModoCriador, setLetras, processarLRC, inicializarBiblioteca, inicializarBibliotecaLrc
  );
  const {
    fonteBuscaEstudio, setFonteBuscaEstudio, modalOrigemMusica, setModalOrigemMusica,
    modalBuscaYtEstudio, setModalBuscaYtEstudio, buscaYtEstudio, setBuscaYtEstudio,
    resultadosYtEstudio, setResultadosYtEstudio, isBuscandoYtEstudio, setIsBuscandoYtEstudio,
    isBaixandoYtEstudio, setIsBaixandoYtEstudio, idBaixandoEstudio, setIdBaixandoEstudio,
    modalBibEstudio, setModalBibEstudio, pastaBibEstudio, setPastaBibEstudio, arquivosBibEstudio, setArquivosBibEstudio,
    modalOrigemLetra, setModalOrigemLetra, modalBibLetraLrc, setModalBibLetraLrc,
    pastaBibLetraLrc, setPastaBibLetraLrc, arquivosBibLetraLrc, setArquivosBibLetraLrc,
    modalBuscaLetra, setModalBuscaLetra, buscaTituloLrc, setBuscaTituloLrc,
    buscaArtistaLrc, setBuscaArtistaLrc, isBuscandoLrc, setIsBuscandoLrc, resultadosLrc, setResultadosLrc,
    modalSalvarYtEstudio, setModalSalvarYtEstudio, destinoYtSelecionado, setDestinoYtSelecionado,
    selecionarMusica, abrirSelecaoMusica, escolherMusicaLocal,
    buscarYoutubeEstudio, confirmarSalvarYtEstudio, salvarNoDispositivoEstudio, baixarYoutubeParaEstudio,
    abrirPastaNoEstudio, selecionarArquivoBibEstudio, abrirSelecaoLetra, escolherLetraLocal,
    abrirPastaLetraNoEstudio, selecionarArquivoLetraBibEstudio, buscarLetraNaInternet,
    selecionarLetraDaLista, resgatarArquivosPerdidos
  } = studioImporters;

  // // --- ESTADOS: MIXER & EFEITOS (KARAOKÊ AO VIVO) ---
  const [modalMixer, setModalMixer] = useState<boolean>(false);
  
  // Carrega a lista toda vez que o modal do Mixer for aberto
  useEffect(() => {
    if (modalMixer) carregarDispositivosDeAudio();
  }, [modalMixer]);

  // --- ESTADOS: EDITOR LRC (SYNC EM MASSA / OFFSET) ---
  const [modalSyncMassa, setModalSyncMassa] = useState<boolean>(false);
  const [valorSyncMassa, setValorSyncMassa] = useState<string>('');

  // --- ESTADOS: REPRODUTOR LRC (NOVO) ---
      const lrcListRef = useRef<FlatList>(null);
    
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

    // --- HOOK DO GERENCIADOR LRC (KARAOKÊ E EDITOR) ---
  const lrcManager = useLrcManager(
    linhasSync, setLinhasSync, indiceCriador, setIndiceCriador,
    arquivoAudio, setArquivoAudio, setAudioUri, setTelaAtiva, setIsModoCriador,
    lrcAudioUri, setLrcAudioUri, isLrcPlaying, setIsLrcPlaying,
    lrcTempoAtual, setLrcTempoAtual, lrcLetras, setLrcLetras,
    inicializarBibliotecaLrc, baixarECompartilhar, lrcAudioPlayer, tempoAtual
  );
  const {
    modalMetadadosLrc, setModalMetadadosLrc, lrcMetaFileName, setLrcMetaFileName,
    lrcMetaTitle, setLrcMetaTitle, lrcMetaArtist, setLrcMetaArtist, lrcMetaAlbum, setLrcMetaAlbum,
    lrcMetaBy, setLrcMetaBy, lrcIndiceAtivo, setLrcIndiceAtivo, lrcMetaInfo, setLrcMetaInfo,
    lrcCoverUrl, setLrcCoverUrl, isLrcPlaylistVisible, setIsLrcPlaylistVisible,
    lrcPlaylist, setLrcPlaylist, lrcCurrentIndex, setLrcCurrentIndex,
    modalPastasLrc, setModalPastasLrc, modalDestinoLrc, setModalDestinoLrc,
    construirPlaylistLrcDaPasta, adicionarPastaLrcPCWeb, tocarItemLrc,
    proximaLrc, anteriorLrc, buscarCapaDoAlbum, registrarTempo,
    abrirModalSalvarLRC, salvarArquivoLRC, executarDownloadDestinoLRC,
    selecionarAudioLrc, selecionarArquivoLrcParaTocar, abrirEditorDoLrc
  } = lrcManager;

  // EFEITOS DO REPRODUTOR IA E LETRAS
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

  // FUNÇÕES DA PLAYLIST E REPRODUTOR PRO
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

            <ModalAcaoYoutube
        modalAcaoYoutube={modalAcaoYoutube}
        setModalAcaoYoutube={setModalAcaoYoutube}
        motorBusca={motorBusca}
        setReproducaoTemp={setReproducaoTemp}
        setUrlAudioExtraido={setUrlAudioExtraido}
        setIsPlaylistVisible={setIsPlaylistVisible}
        iniciarTocarYoutube={iniciarTocarYoutube}
        setModalQualidadeYt={setModalQualidadeYt}
        adicionarNaPlaylist={adicionarNaPlaylist}
      />

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

            <ModalOrigemMusica
        modalOrigemMusica={modalOrigemMusica}
        setModalOrigemMusica={setModalOrigemMusica}
        escolherMusicaLocal={escolherMusicaLocal}
        setFonteBuscaEstudio={setFonteBuscaEstudio}
        setModalBuscaYtEstudio={setModalBuscaYtEstudio}
        setModalBibEstudio={setModalBibEstudio}
        inicializarBiblioteca={inicializarBiblioteca}
        inicializarBibliotecaLrc={inicializarBibliotecaLrc}
      />

            <ModalBibEstudio
        modalBibEstudio={modalBibEstudio}
        setModalBibEstudio={setModalBibEstudio}
        pastaBibEstudio={pastaBibEstudio}
        setPastaBibEstudio={setPastaBibEstudio}
        pastas={pastas}
        pastasLrc={pastasLrc}
        abrirPastaNoEstudio={abrirPastaNoEstudio}
        arquivosBibEstudio={arquivosBibEstudio}
        setArquivosBibEstudio={setArquivosBibEstudio}
        selecionarArquivoBibEstudio={selecionarArquivoBibEstudio}
      />

            <ModalBuscaYtEstudio
        modalBuscaYtEstudio={modalBuscaYtEstudio}
        setModalBuscaYtEstudio={setModalBuscaYtEstudio}
        fonteBuscaEstudio={fonteBuscaEstudio}
        buscaYtEstudio={buscaYtEstudio}
        setBuscaYtEstudio={setBuscaYtEstudio}
        buscarYoutubeEstudio={buscarYoutubeEstudio}
        isBuscandoYtEstudio={isBuscandoYtEstudio}
        resultadosYtEstudio={resultadosYtEstudio}
        isBaixandoYtEstudio={isBaixandoYtEstudio}
        idBaixandoEstudio={idBaixandoEstudio}
        baixarYoutubeParaEstudio={baixarYoutubeParaEstudio}
      />

            <ModalSalvarYtEstudio
        modalSalvarYtEstudio={modalSalvarYtEstudio}
        setModalSalvarYtEstudio={setModalSalvarYtEstudio}
        destinoYtSelecionado={destinoYtSelecionado}
        setDestinoYtSelecionado={setDestinoYtSelecionado}
        salvarNoDispositivoEstudio={salvarNoDispositivoEstudio}
        pastas={pastas}
        pastasLrc={pastasLrc}
        confirmarSalvarYtEstudio={confirmarSalvarYtEstudio}
      />

            <ModalSyncMassa
        modalSyncMassa={modalSyncMassa}
        setModalSyncMassa={setModalSyncMassa}
        valorSyncMassa={valorSyncMassa}
        setValorSyncMassa={setValorSyncMassa}
        aplicarSyncEmMassa={aplicarSyncEmMassa}
      />

            <ModalOrigemLetra
        modalOrigemLetra={modalOrigemLetra}
        setModalOrigemLetra={setModalOrigemLetra}
        escolherLetraLocal={escolherLetraLocal}
        setModalBibLetraLrc={setModalBibLetraLrc}
        inicializarBibliotecaLrc={inicializarBibliotecaLrc}
      />

            <ModalBibLetraLrc
        modalBibLetraLrc={modalBibLetraLrc}
        setModalBibLetraLrc={setModalBibLetraLrc}
        pastaBibLetraLrc={pastaBibLetraLrc}
        setPastaBibLetraLrc={setPastaBibLetraLrc}
        pastasLrc={pastasLrc}
        pastasVirtuaisLrcWeb={pastasVirtuaisLrcWeb}
        abrirPastaLetraNoEstudio={abrirPastaLetraNoEstudio}
        arquivosBibLetraLrc={arquivosBibLetraLrc}
        setArquivosBibLetraLrc={setArquivosBibLetraLrc}
        selecionarArquivoLetraBibEstudio={selecionarArquivoLetraBibEstudio}
      />

            <ModalMetadadosLrc
        modalMetadadosLrc={modalMetadadosLrc}
        setModalMetadadosLrc={setModalMetadadosLrc}
        salvarArquivoLRC={salvarArquivoLRC}
        lrcMetaFileName={lrcMetaFileName}
        setLrcMetaFileName={setLrcMetaFileName}
        lrcMetaTitle={lrcMetaTitle}
        setLrcMetaTitle={setLrcMetaTitle}
        lrcMetaArtist={lrcMetaArtist}
        setLrcMetaArtist={setLrcMetaArtist}
        lrcMetaAlbum={lrcMetaAlbum}
        setLrcMetaAlbum={setLrcMetaAlbum}
        lrcMetaBy={lrcMetaBy}
        setLrcMetaBy={setLrcMetaBy}
      />

            <ModalDestinoLrc
        modalDestinoLrc={modalDestinoLrc}
        setModalDestinoLrc={setModalDestinoLrc}
        executarDownloadDestinoLRC={executarDownloadDestinoLRC}
        pastasLrc={pastasLrc}
      />

            <ModalPastasLrc
        modalPastasLrc={modalPastasLrc}
        setModalPastasLrc={setModalPastasLrc}
        pastasLrc={pastasLrc}
        construirPlaylistLrcDaPasta={construirPlaylistLrcDaPasta}
      />

            <ModalRenomearFila
        modalRenomearFila={modalRenomearFila}
        setModalRenomearFila={setModalRenomearFila}
        salvarRenomearFila={salvarRenomearFila}
      />

            <ModalSalvarFila
        modalSalvarFila={modalSalvarFila}
        setModalSalvarFila={setModalSalvarFila}
        nomeFilaSalva={nomeFilaSalva}
        setNomeFilaSalva={setNomeFilaSalva}
        salvarFilaAtual={salvarFilaAtual}
        exportarFilaComoArquivo={exportarFilaComoArquivo}
      />

            <ModalCarregarFila
        modalCarregarFila={modalCarregarFila}
        setModalCarregarFila={setModalCarregarFila}
        importarFilaDeArquivo={importarFilaDeArquivo}
        listasSalvas={listasSalvas}
        carregarFilaSelecionada={carregarFilaSelecionada}
        apagarFilaSalva={apagarFilaSalva}
      />

            <ModalPastasPro
        modalPastasPro={modalPastasPro}
        setModalPastasPro={setModalPastasPro}
        pastas={pastas}
        pastasVirtuaisWeb={pastasVirtuaisWeb}
        adicionarPastaNaPlaylist={adicionarPastaNaPlaylist}
      />

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

      {/* NOVO PAINEL INFERIOR (BOTTOM TAB BAR) */}
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