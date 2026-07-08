import { useState } from 'react';
import { Keyboard, Platform } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import * as DocumentPicker from 'expo-document-picker';
import * as Sharing from 'expo-sharing';
import { URL_SERVIDOR, LIBRARY_DIR, LRC_LIBRARY_DIR } from '../utils/indexUtils';

export function useStudioImporters(
  setArquivoAudio: any, setAudioUri: any, setKaraokePronto: any, setUrlPlayback: any,
  setUrlVoz: any, setTempoAtual: any, setDuracaoTotal: any, setIsPlaying: any,
  setNomeLetra: any, setLinhasSync: any, setIndiceCriador: any, setIsModoCriador: any,
  setLetras: any, processarLRC: any, inicializarBiblioteca: any, inicializarBibliotecaLrc: any
) {
  const [fonteBuscaEstudio, setFonteBuscaEstudio] = useState<'youtube' | 'soundcloud'>('youtube');
  const [modalOrigemMusica, setModalOrigemMusica] = useState<boolean>(false);
  const [modalBuscaYtEstudio, setModalBuscaYtEstudio] = useState<boolean>(false);
  const [buscaYtEstudio, setBuscaYtEstudio] = useState<string>('');
  const [resultadosYtEstudio, setResultadosYtEstudio] = useState<any[]>([]);
  const [isBuscandoYtEstudio, setIsBuscandoYtEstudio] = useState<boolean>(false);
  const [isBaixandoYtEstudio, setIsBaixandoYtEstudio] = useState<boolean>(false);
  const [idBaixandoEstudio, setIdBaixandoEstudio] = useState<string | null>(null);

  const [modalBibEstudio, setModalBibEstudio] = useState<'local' | 'lrc' | null>(null);
  const [pastaBibEstudio, setPastaBibEstudio] = useState<string | null>(null);
  const [arquivosBibEstudio, setArquivosBibEstudio] = useState<string[]>([]);

  const [modalOrigemLetra, setModalOrigemLetra] = useState<boolean>(false);
  const [modalBibLetraLrc, setModalBibLetraLrc] = useState<boolean>(false);
  const [pastaBibLetraLrc, setPastaBibLetraLrc] = useState<string | null>(null);
  const [arquivosBibLetraLrc, setArquivosBibLetraLrc] = useState<string[]>([]);

  const [modalBuscaLetra, setModalBuscaLetra] = useState<boolean>(false);
  const [buscaTituloLrc, setBuscaTituloLrc] = useState<string>('');
  const [buscaArtistaLrc, setBuscaArtistaLrc] = useState<string>('');
  const [isBuscandoLrc, setIsBuscandoLrc] = useState<boolean>(false);
  const [resultadosLrc, setResultadosLrc] = useState<any[]>([]);

  const [modalSalvarYtEstudio, setModalSalvarYtEstudio] = useState<{uri: string, nome: string} | null>(null);
  const [destinoYtSelecionado, setDestinoYtSelecionado] = useState<'local' | 'lrc' | null>(null);

  const resetPlayerState = () => {
    setKaraokePronto(false); setUrlPlayback(null); setUrlVoz(null); setTempoAtual(0); setDuracaoTotal(0); setIsPlaying(false);
  };

  const selecionarMusica = async () => {
    try {
      const resultado = await DocumentPicker.getDocumentAsync({ type: 'audio/*', copyToCacheDirectory: true });
      if (!resultado.canceled) {
        setArquivoAudio(resultado.assets[0]); setAudioUri(resultado.assets[0].uri);
        resetPlayerState();
      }
    } catch (erro) {}
  };

  const abrirSelecaoMusica = () => setModalOrigemMusica(true);

  const escolherMusicaLocal = async () => {
    setModalOrigemMusica(false);
    try {
      const resultado = await DocumentPicker.getDocumentAsync({ type: ['audio/*', 'video/*'], copyToCacheDirectory: true });
      if (!resultado.canceled) {
        setArquivoAudio(resultado.assets[0]); setAudioUri(resultado.assets[0].uri);
        resetPlayerState();
      }
    } catch (erro) {}
  };

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
      await FileSystem.copyAsync({ from: modalSalvarYtEstudio.uri, to: dest });
      if (destinoYtSelecionado === 'local') inicializarBiblioteca();
      else inicializarBibliotecaLrc();
      alert(`✅ Áudio salvo com sucesso na pasta: ${pastaLocal}`);
    } catch (erro) { alert('Erro ao salvar o arquivo.'); }
    setModalSalvarYtEstudio(null); setDestinoYtSelecionado(null);
  };

  const salvarNoDispositivoEstudio = async () => {
    if (!modalSalvarYtEstudio) return;
    try {
      if (Platform.OS === 'web') {
        const link = document.createElement('a');
        link.href = modalSalvarYtEstudio.uri;
        link.download = modalSalvarYtEstudio.nome;
        link.target = '_blank';
        document.body.appendChild(link); link.click(); document.body.removeChild(link);
      } else {
        if (await Sharing.isAvailableAsync()) await Sharing.shareAsync(modalSalvarYtEstudio.uri, { dialogTitle: 'Salvar Áudio Importado' });
        else alert('O compartilhamento não está disponível no seu dispositivo.');
      }
    } catch (e) { alert('Erro ao tentar salvar no dispositivo.'); }
    setModalSalvarYtEstudio(null); setDestinoYtSelecionado(null);
  };

  const baixarYoutubeParaEstudio = async (id: string, titulo: string) => {
    setIsBaixandoYtEstudio(true); setIdBaixandoEstudio(id);
    try {
      const endpoint = fonteBuscaEstudio === 'soundcloud' ? '/baixar_soundcloud' : '/baixar_youtube';
      const resposta = await fetch(`${URL_SERVIDOR}${endpoint}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, formato: 'audio', resolucao: '320', extensao: 'mp3' }) });
      const dados = await resposta.json();
      if (dados.sucesso) {
         const nomeLimpo = titulo.replace(/[\/\\?%*:|"<>]/g, '').trim() || 'Audio_Extraido';
         let uriFinal = dados.url;
         if (Platform.OS !== 'web') {
             const fileUri = `${FileSystem.cacheDirectory}${nomeLimpo}.mp3`;
             const downloadResumo = await FileSystem.downloadAsync(dados.url, fileUri);
             uriFinal = downloadResumo.uri;
         }
         setArquivoAudio({ uri: uriFinal, name: `${nomeLimpo}.mp3`, mimeType: 'audio/mpeg' });
         setAudioUri(uriFinal); resetPlayerState();
         setModalBuscaYtEstudio(false); setBuscaYtEstudio(''); setResultadosYtEstudio([]);
         setModalSalvarYtEstudio({ uri: uriFinal, nome: `${nomeLimpo}.mp3` });
      } else { alert('Erro no servidor ao baixar o áudio.'); }
    } catch (erro) { alert('Falha no download.'); }
    setIsBaixandoYtEstudio(false); setIdBaixandoEstudio(null);
  };

  const abrirPastaNoEstudio = async (nomePasta: string, tipo: 'local' | 'lrc') => {
    const dirBase = tipo === 'local' ? LIBRARY_DIR : LRC_LIBRARY_DIR;
    try {
      const files = await FileSystem.readDirectoryAsync(`${dirBase}${nomePasta}`);
      const mediaExts = ['.mp4', '.mkv', '.avi', '.mov', '.webm', '.mp3', '.wav', '.m4a', '.aac'];
      const arquivosMedia = files.filter((f: string) => mediaExts.some(ext => f.toLowerCase().endsWith(ext)));
      setPastaBibEstudio(nomePasta); setArquivosBibEstudio(arquivosMedia);
    } catch (e) { alert('Erro ao ler a pasta.'); }
  };

  const selecionarArquivoBibEstudio = (nomeArquivo: string, tipo: 'local' | 'lrc') => {
    const dirBase = tipo === 'local' ? LIBRARY_DIR : LRC_LIBRARY_DIR;
    const fileUri = `${dirBase}${pastaBibEstudio}/${nomeArquivo}`;
    const extensao = nomeArquivo.split('.').pop()?.toLowerCase() || 'mp3';
    let mimeType = 'audio/mpeg';
    if (extensao === 'wav') mimeType = 'audio/wav';
    else if (['mp4', 'mkv', 'avi', 'mov', 'webm'].includes(extensao)) mimeType = `video/${extensao}`;
    setArquivoAudio({ uri: fileUri, name: nomeArquivo, mimeType }); setAudioUri(fileUri);
    resetPlayerState();
    setModalBibEstudio(null); setPastaBibEstudio(null); setArquivosBibEstudio([]);
  };

  const abrirSelecaoLetra = () => setModalOrigemLetra(true);

  const setLetrasProcessadas = (conteudo: string, nome: string) => {
    setNomeLetra(nome);
    const temTempos = conteudo.includes('[');
    if (!temTempos) {
      const linhas = conteudo.trim().split('\n').filter((l: string) => l.trim() !== '');
      setLinhasSync(linhas.map((l: string) => ({ tempo: null, texto: l })));
      setIndiceCriador(0); setIsModoCriador(false); setLetras([]);
    } else {
      const processado = processarLRC(conteudo);
      setLetras(processado);
      setLinhasSync(processado.map((l: any) => ({ tempo: l.tempo, texto: l.texto })));
      setIndiceCriador(processado.length); setIsModoCriador(false);
    }
  };

  const escolherLetraLocal = async () => {
    setModalOrigemLetra(false);
    try {
      const resultado = await DocumentPicker.getDocumentAsync({ type: '*/*', copyToCacheDirectory: true });
      if (!resultado.canceled) {
        const arquivo = resultado.assets[0]; let conteudo = '';
        if (Platform.OS === 'web') {
          const file = (arquivo as any).file; if (!file) return; conteudo = await file.text();
        } else {
          conteudo = await FileSystem.readAsStringAsync(arquivo.uri);
        }
        setLetrasProcessadas(conteudo, arquivo.name);
      }
    } catch (erro) { alert('Não foi possível carregar a letra.'); }
  };

  const abrirPastaLetraNoEstudio = async (nomePasta: string) => {
    try {
      const files = await FileSystem.readDirectoryAsync(`${LRC_LIBRARY_DIR}${nomePasta}`);
      const textExts = ['.lrc', '.txt'];
      const arquivosLetra = files.filter((f: string) => textExts.some(ext => f.toLowerCase().endsWith(ext)));
      setPastaBibLetraLrc(nomePasta); setArquivosBibLetraLrc(arquivosLetra);
    } catch (e) { alert('Erro ao ler a pasta.'); }
  };

  const selecionarArquivoLetraBibEstudio = async (nomeArquivo: string) => {
    const fileUri = `${LRC_LIBRARY_DIR}${pastaBibLetraLrc}/${nomeArquivo}`;
    try {
      const conteudo = await FileSystem.readAsStringAsync(fileUri);
      setLetrasProcessadas(conteudo, `[Bib] ${nomeArquivo}`);
      setModalBibLetraLrc(false); setPastaBibLetraLrc(null); setArquivosBibLetraLrc([]);
      alert('✅ Letra carregada da biblioteca!');
    } catch (e) { alert('Erro ao ler o arquivo de letra.'); }
  };

  const buscarLetraNaInternet = async () => {
    if (!buscaTituloLrc.trim()) return alert('Digite pelo menos o nome da música!');
    Keyboard.dismiss(); setIsBuscandoLrc(true); setResultadosLrc([]);
    const titulo = buscaTituloLrc.trim(); const artista = buscaArtistaLrc.trim();
    try {
      let url1 = `https://lrclib.net/api/search?track_name=${encodeURIComponent(titulo)}`;
      if (artista) url1 += `&artist_name=${encodeURIComponent(artista)}`;
      const resposta1 = await fetch(url1, { method: 'GET', headers: { 'User-Agent': 'GHKaraokeProApp/1.0' } });
      if (resposta1.ok) {
        const dados1 = await resposta1.json();
        if (dados1 && dados1.length > 0) { setResultadosLrc(dados1); setIsBuscandoLrc(false); return; }
      }
    } catch (erro1) { console.log('Falha no LRCLIB:', erro1); }
    if (artista) {
      try {
        const url2 = `https://api.lyrics.ovh/v1/${encodeURIComponent(artista)}/${encodeURIComponent(titulo)}`;
        const resposta2 = await fetch(url2);
        if (resposta2.ok) {
          const dados2 = await resposta2.json();
          if (dados2.lyrics) {
             setResultadosLrc([{ id: 'ovh', trackName: titulo, artistName: artista, plainLyrics: dados2.lyrics, syncedLyrics: null }]);
             setIsBuscandoLrc(false); return;
          }
        }
      } catch (erro2) {}
    }
    setIsBuscandoLrc(false); alert('Nenhuma letra encontrada. Tente mudar o nome ou adicionar o artista.');
  };

  const selecionarLetraDaLista = (item: any) => {
    const conteudoLrc = item.syncedLyrics || item.plainLyrics;
    if (!conteudoLrc) return alert('Esta versão não possui texto disponível.');
    setLetrasProcessadas(conteudoLrc, `[Online] ${item.artistName} - ${item.trackName}`);
    setModalBuscaLetra(false); setBuscaTituloLrc(''); setBuscaArtistaLrc(''); setResultadosLrc([]);
    alert('✅ Letra selecionada com sucesso!');
  };

  const resgatarArquivosPerdidos = async () => {
    try {
      const resposta = await fetch(`${URL_SERVIDOR}/arquivos_prontos`);
      const dados = await resposta.json();
      if (dados.sucesso && dados.arquivos.length > 0) {
        const nomes = dados.arquivos.map((arq: any) => `🎵 ${arq.nome} (${arq.tamanho_mb} MB)`).join('\n');
        alert(`ARQUIVOS RECUPERADOS:\n\n${nomes}\n\nEles estão salvos e prontos para uso no seu servidor!`);
      } else { alert('O servidor está limpo! Nenhum arquivo perdido ou acumulado.'); }
    } catch (e) { alert('Erro ao conectar com o servidor para resgate.'); }
  };

  return {
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
  };
}