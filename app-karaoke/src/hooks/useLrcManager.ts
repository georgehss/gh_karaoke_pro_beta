import { useState } from 'react';
import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import * as DocumentPicker from 'expo-document-picker';
import * as Sharing from 'expo-sharing';
import { LRC_LIBRARY_DIR, processarLRC } from '../utils/indexUtils';

export function useLrcManager(
  linhasSync: any, setLinhasSync: any, indiceCriador: any, setIndiceCriador: any,
  arquivoAudio: any, setArquivoAudio: any, setAudioUri: any,
  setTelaAtiva: any, setIsModoCriador: any, lrcAudioUri: any, setLrcAudioUri: any,
  isLrcPlaying: any, setIsLrcPlaying: any, lrcTempoAtual: any, setLrcTempoAtual: any,
  lrcLetras: any, setLrcLetras: any, inicializarBibliotecaLrc: any,
  baixarECompartilhar: any, lrcAudioPlayer: any, tempoAtual: any
) {
  const [modalMetadadosLrc, setModalMetadadosLrc] = useState<boolean>(false);
  const [lrcMetaFileName, setLrcMetaFileName] = useState<string>('');
  const [lrcMetaTitle, setLrcMetaTitle] = useState<string>('');
  const [lrcMetaArtist, setLrcMetaArtist] = useState<string>('');
  const [lrcMetaAlbum, setLrcMetaAlbum] = useState<string>('');
  const [lrcMetaBy, setLrcMetaBy] = useState<string>('');
  const [lrcIndiceAtivo, setLrcIndiceAtivo] = useState<number>(-1);
  const [lrcMetaInfo, setLrcMetaInfo] = useState({ title: '', artist: '', album: '' });
  const [lrcCoverUrl, setLrcCoverUrl] = useState<string | null>(null);
  const [isLrcPlaylistVisible, setIsLrcPlaylistVisible] = useState<boolean>(false);
  const [lrcPlaylist, setLrcPlaylist] = useState<any[]>([]);
  const [lrcCurrentIndex, setLrcCurrentIndex] = useState<number>(-1);
  const [modalPastasLrc, setModalPastasLrc] = useState<boolean>(false);
  const [modalDestinoLrc, setModalDestinoLrc] = useState<{ conteudo: string, nomeFinal: string } | null>(null);

  const buscarCapaDoAlbum = async (titulo: string, artista: string, album: string = '') => {
    setLrcCoverUrl(null);
    if (!titulo || titulo === 'Música' || titulo.startsWith('YouTube')) return;
    try {
      const termoOriginal = `${artista !== 'Desconhecido' && artista !== 'Artista Desconhecido' ? artista : ''} ${titulo} ${album}`.trim();
      const termoBusca = encodeURIComponent(termoOriginal);
      const resposta = await fetch(`https://itunes.apple.com/search?term=${termoBusca}&entity=song&limit=5`);
      const dados = await resposta.json();
      if (dados.results && dados.results.length > 0) {
        let melhorResultado = dados.results[0];
        if (artista && artista !== 'Desconhecido') {
           const artistaBuscado = artista.toLowerCase();
           const achouExato = dados.results.find((r: any) => r.artistName.toLowerCase().includes(artistaBuscado));
           if (achouExato) melhorResultado = achouExato;
        }
        const urlCapa = melhorResultado.artworkUrl100.replace('100x100bb', '400x400bb');
        setLrcCoverUrl(urlCapa);
      }
    } catch (erro) { console.log('Erro ao buscar capa na Apple', erro); }
  };

  const tocarItemLrc = async (lista: any[], index: number) => {
    if (index < 0 || index >= lista.length) return;
    const item = lista[index];
    setLrcCurrentIndex(index);
    setLrcAudioUri(item.audioUri);
    setIsLrcPlaying(true);
    setLrcTempoAtual(0);
    try {
      let conteudo = '';
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
      setLrcMetaInfo({ title: tituloFinal, artist: artistaFinal, album: albumFinal });
      setLrcLetras(processarLRC(conteudo));
      buscarCapaDoAlbum(tituloFinal, artistaFinal, albumFinal);
    } catch(e) { setLrcLetras([]); }
  };

  const construirPlaylistLrcDaPasta = async (pasta: string, arquivoInicial: string = '') => {
    try {
      const caminhoPasta = `${LRC_LIBRARY_DIR}${pasta}/`;
      const arquivos = await FileSystem.readDirectoryAsync(caminhoPasta);
      const lrcFiles = arquivos.filter((f: string) => f.toLowerCase().endsWith('.lrc'));
      const mediaExts = ['.mp4', '.mkv', '.avi', '.mov', '.webm', '.mp3', '.wav', '.m4a', '.aac'];
      const audioFiles = arquivos.filter((f: string) => mediaExts.some(ext => f.toLowerCase().endsWith(ext)));
      const novaPlaylist: any[] = [];
      for (const lrc of lrcFiles) {
        const nomeBase = lrc.replace('.lrc', '');
        const audio = audioFiles.find((a: string) => a.startsWith(nomeBase));
        if (audio) {
          novaPlaylist.push({ id: nomeBase, name: nomeBase, audioUri: `${caminhoPasta}${audio}`, lrcUri: `${caminhoPasta}${lrc}` });
        }
      }
      if (novaPlaylist.length > 0) {
        novaPlaylist.sort((a, b) => a.name.localeCompare(b.name));
        setLrcPlaylist(novaPlaylist);
        const idx = arquivoInicial ? novaPlaylist.findIndex((p: any) => p.id === arquivoInicial) : 0;
        tocarItemLrc(novaPlaylist, idx !== -1 ? idx : 0);
      } else { alert('Nenhum par de Áudio + LRC encontrado nesta pasta.'); }
    } catch (e) { alert('Erro ao carregar playlist da pasta.'); }
  };

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
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const nameLower = file.name.toLowerCase();
        if (nameLower.endsWith('.lrc')) lrcFiles.push(file);
        else if (file.type.startsWith('audio/') || file.type.startsWith('video/') || nameLower.endsWith('.mp3') || nameLower.endsWith('.wav') || nameLower.endsWith('.m4a')) audioFiles.push(file);
      }
      const novaPlaylist: any[] = [];
      for (const lrcFile of lrcFiles) {
        const baseName = lrcFile.name.substring(0, lrcFile.name.lastIndexOf('.'));
        const audioMatch = audioFiles.find((a: any) => a.name.substring(0, a.name.lastIndexOf('.')) === baseName);
        if (audioMatch) novaPlaylist.push({ id: baseName, name: baseName, audioUri: URL.createObjectURL(audioMatch), lrcUri: URL.createObjectURL(lrcFile) });
      }
      if (novaPlaylist.length > 0) {
        setLrcPlaylist(novaPlaylist);
        tocarItemLrc(novaPlaylist, 0);
      } else { alert('Nenhum par exato de Áudio + Letra (.lrc) com o mesmo nome foi encontrado nesta pasta.'); }
    };
    input.click();
  };

  const proximaLrc = () => { if(lrcCurrentIndex < lrcPlaylist.length - 1) tocarItemLrc(lrcPlaylist, lrcCurrentIndex + 1); };
  const anteriorLrc = () => { if(lrcCurrentIndex > 0) tocarItemLrc(lrcPlaylist, lrcCurrentIndex - 1); };

  const registrarTempo = () => {
    if (indiceCriador < linhasSync.length) {
      const novaLista = [...linhasSync];
      novaLista[indiceCriador].tempo = tempoAtual || 0;
      setLinhasSync(novaLista);
      setIndiceCriador(indiceCriador + 1);
    }
  };

  const abrirModalSalvarLRC = () => {
    const marcadas = linhasSync.filter((l: any) => l.tempo !== null);
    if (marcadas.length === 0) return alert('Ainda não marcou nenhum tempo!');
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
    const marcadas = linhasSync.filter((l: any) => l.tempo !== null);
    let cabecalho = '';
    if (lrcMetaTitle) cabecalho += `[ti:${lrcMetaTitle}]\n`;
    if (lrcMetaArtist) cabecalho += `[ar:${lrcMetaArtist}]\n`;
    if (lrcMetaAlbum) cabecalho += `[al:${lrcMetaAlbum}]\n`;
    if (lrcMetaBy) cabecalho += `[by:${lrcMetaBy}]\n`;
    cabecalho += `[re:GH Karaokê]\n[ve:1.0]\n\n`;
    const conteudoLetra = marcadas.map((item: any) => {
      const min = Math.floor(item.tempo! / 60).toString().padStart(2, '0');
      const seg = Math.floor(item.tempo! % 60).toString().padStart(2, '0');
      const cs = Math.floor((item.tempo! % 1) * 100).toString().padStart(2, '0');
      return `[${min}:${seg}.${cs}] ${item.texto}`;
    }).join('\n');
    const conteudoLRC = cabecalho + conteudoLetra;
    const nomeFinal = `${lrcMetaFileName || 'Sincronizado'}.lrc`;
    setModalMetadadosLrc(false);
    setModalDestinoLrc({ conteudo: conteudoLRC, nomeFinal });
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
            if (arquivoAudio && arquivoAudio.uri && !arquivoAudio.uri.startsWith('http')) {
                const extensaoAudio = arquivoAudio.name.split('.').pop();
                const nomeAudioFinal = `${config.nomeFinal.replace('.lrc', '')}.${extensaoAudio}`;
                const destAudio = `${LRC_LIBRARY_DIR}${pastaLocal}/${nomeAudioFinal}`;
                try { await FileSystem.copyAsync({ from: arquivoAudio.uri, to: destAudio }); } catch (e) {}
            }
        }
    } catch (erro) { alert('Erro ao guardar o ficheiro .lrc'); }
  };

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
        let conteudo = '';
        if (Platform.OS === 'web') {
          const file = (arquivo as any).file; if (!file) return; conteudo = await file.text();
        } else {
          conteudo = await FileSystem.readAsStringAsync(arquivo.uri);
        }
        const titleMatch = conteudo.match(/\[ti:(.*?)\]/);
        const artistMatch = conteudo.match(/\[ar:(.*?)\]/);
        const albumMatch = conteudo.match(/\[al:(.*?)\]/);
        const tituloFinal = titleMatch ? titleMatch[1].trim() : arquivo.name.split('.')[0];
        const artistaFinal = artistMatch ? artistMatch[1].trim() : 'Artista Desconhecido';
        const albumFinal = albumMatch ? albumMatch[1].trim() : '';
        setLrcMetaInfo({ title: tituloFinal, artist: artistaFinal, album: albumFinal });
        setLrcLetras(processarLRC(conteudo));
        buscarCapaDoAlbum(tituloFinal, artistaFinal, albumFinal);
      }
    } catch (erro) { alert('Não foi possível carregar a letra.'); }
  };

  const abrirEditorDoLrc = () => {
    if (isLrcPlaying && lrcAudioPlayer) {
      lrcAudioPlayer.pause();
      setIsLrcPlaying(false);
    }
    setAudioUri(lrcAudioUri);
    setArquivoAudio({ name: `${lrcMetaInfo.title || 'Música'}.mp3`, uri: lrcAudioUri });
    setLinhasSync(lrcLetras.map((l: any) => ({ tempo: l.tempo, texto: l.texto })));
    setIndiceCriador(lrcLetras.length);
    setLrcMetaTitle(lrcMetaInfo.title);
    setLrcMetaArtist(lrcMetaInfo.artist);
    setLrcMetaFileName(lrcMetaInfo.title);
    setTelaAtiva('principal');
    setIsModoCriador(true);
  };

  return {
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
  };
}