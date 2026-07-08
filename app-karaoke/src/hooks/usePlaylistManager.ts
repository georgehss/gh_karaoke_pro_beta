import { useState } from 'react';
import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import * as DocumentPicker from 'expo-document-picker';
import * as Sharing from 'expo-sharing';
import { PLAYLISTS_DIR, LIBRARY_DIR } from '../utils/indexUtils';

export function usePlaylistManager(playlist: any[], setPlaylist: any, pastasVirtuaisWeb: any, repararLinksDaFila: any) {
  const [modalPastasPro, setModalPastasPro] = useState<boolean>(false);
  const [modalRenomearFila, setModalRenomearFila] = useState<{id: string, name: string} | null>(null);
  const [modalSalvarFila, setModalSalvarFila] = useState<boolean>(false);
  const [nomeFilaSalva, setNomeFilaSalva] = useState<string>('');
  const [modalCarregarFila, setModalCarregarFila] = useState<boolean>(false);
  const [listasSalvas, setListasSalvas] = useState<string[]>([]);
  const [buscaFila, setBuscaFila] = useState<string>('');
  const [mostrarBuscaFila, setMostrarBuscaFila] = useState<boolean>(false);

  const carregarListasSalvas = async () => {
    try {
      const dirInfo = await FileSystem.getInfoAsync(PLAYLISTS_DIR);
      if (!dirInfo.exists) await FileSystem.makeDirectoryAsync(PLAYLISTS_DIR, { intermediates: true });
      const files = await FileSystem.readDirectoryAsync(PLAYLISTS_DIR);
      setListasSalvas(files.filter((f: string) => f.endsWith('.json')).map((f: string) => f.replace('.json', '')));
    } catch (e) {}
  };

  const salvarFilaAtual = async () => {
    if (!nomeFilaSalva.trim()) return alert('Digite um nome!');
    try {
      const dirInfo = await FileSystem.getInfoAsync(PLAYLISTS_DIR);
      if (!dirInfo.exists) await FileSystem.makeDirectoryAsync(PLAYLISTS_DIR, { intermediates: true });
      const filePath = `${PLAYLISTS_DIR}${nomeFilaSalva.trim()}.json`;
      await FileSystem.writeAsStringAsync(filePath, JSON.stringify(playlist));
      alert('Playlist salva com sucesso!');
      setModalSalvarFila(false);
      setNomeFilaSalva('');
    } catch (e) { alert('Erro ao salvar.'); }
  };

  const exportarFilaComoArquivo = async () => {
    if (!nomeFilaSalva.trim()) return alert('Digite um nome!');
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
    } catch (e) { alert('Erro ao exportar.'); }
  };

  const carregarFilaSelecionada = async (nomeLista: string) => {
    try {
      const filePath = `${PLAYLISTS_DIR}${nomeLista}.json`;
      const conteudo = await FileSystem.readAsStringAsync(filePath);
      const filaLida = JSON.parse(conteudo);
      setPlaylist(repararLinksDaFila(filaLida));
      setModalCarregarFila(false);
      alert(`Playlist "${nomeLista}" carregada!`);
    } catch (e) { alert('Erro ao carregar.'); }
  };

  const apagarFilaSalva = async (nomeLista: string) => {
    try {
      const filePath = `${PLAYLISTS_DIR}${nomeLista}.json`;
      await FileSystem.deleteAsync(filePath);
      carregarListasSalvas();
    } catch (e) { alert('Erro ao apagar.'); }
  };

  const importarFilaDeArquivo = async () => {
    try {
      const resultado = await DocumentPicker.getDocumentAsync({ type: 'application/json' });
      if (!resultado.canceled) {
        let conteudo = '';
        if (Platform.OS === 'web') {
          const file = (resultado.assets[0] as any).file;
          conteudo = await file.text();
        } else {
          conteudo = await FileSystem.readAsStringAsync(resultado.assets[0].uri);
        }
        const filaLida = JSON.parse(conteudo);
        setPlaylist(repararLinksDaFila(filaLida));
        setModalCarregarFila(false);
        alert('Playlist importada com sucesso!');
      }
    } catch (e) { alert('Erro ao importar arquivo.'); }
  };

  const salvarRenomearFila = () => {
    if (!modalRenomearFila) return;
    const novaLista = [...playlist];
    const item = novaLista.find((i: any) => i.id === modalRenomearFila.id);
    if (item) item.name = modalRenomearFila.name;
    setPlaylist(novaLista);
    setModalRenomearFila(null);
  };

  const adicionarPastaNaPlaylist = async (pasta: string) => {
    if (Platform.OS === 'web' && pastasVirtuaisWeb[pasta]) {
      const arquivos = pastasVirtuaisWeb[pasta];
      const novosItens = arquivos.map((arq: any) => ({
        id: Date.now().toString() + Math.random().toString(),
        uri: arq.uri,
        name: arq.nome
      }));
      novosItens.sort((a: any, b: any) => a.name.localeCompare(b.name));
      setPlaylist((prev: any) => [...prev, ...novosItens]);
      setModalPastasPro(false);
      alert(`${novosItens.length} arquivo(s) adicionado(s) à fila!`);
      return;
    }

    const caminhoPasta = `${LIBRARY_DIR}${pasta}/`;
    try {
      const arquivos = await FileSystem.readDirectoryAsync(caminhoPasta);
      const mediaExts = ['.mp4', '.mkv', '.avi', '.mov', '.webm', '.mp3', '.wav', '.m4a', '.aac'];
      const arquivosMedia = arquivos.filter((f: string) => mediaExts.some(ext => f.toLowerCase().endsWith(ext)));

      if (arquivosMedia.length === 0) {
        alert('Nenhuma mídia encontrada.');
        return;
      }

      const novosItens = arquivosMedia.map((arq: string) => ({
        id: Date.now().toString() + Math.random().toString(),
        uri: `${caminhoPasta}${arq}`,
        name: arq
      }));
      novosItens.sort((a: any, b: any) => a.name.localeCompare(b.name));
      setPlaylist((prev: any) => [...prev, ...novosItens]);
      setModalPastasPro(false);
      alert(`${novosItens.length} arquivos adicionados à fila!`);
    } catch (e) { alert('Erro ao ler a pasta.'); }
  };

  const adicionarPastaDoDispositivo = async () => {
    if (Platform.OS === 'android') {
      try {
        const permissoes = await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();
        if (permissoes.granted) {
          const arquivosDaPasta = await FileSystem.StorageAccessFramework.readDirectoryAsync(permissoes.directoryUri);
          const mediaExts = ['.mp4', '.mkv', '.avi', '.mov', '.webm', '.mp3', '.wav', '.m4a', '.aac'];
          const arquivosMedia = arquivosDaPasta.filter((uri: string) => mediaExts.some(ext => uri.toLowerCase().endsWith(ext)));

          if (arquivosMedia.length === 0) {
            alert('Nenhuma mídia suportada encontrada.');
            return;
          }

          const novosItens = arquivosMedia.map((uri: string) => {
            let nome = 'Mídia Desconhecida';
            try { 
              const uriDecodificada = decodeURIComponent(uri);
              nome = uriDecodificada.split('/').pop() || 'Mídia Desconhecida';
            } catch(e) { nome = uri.split('/').pop() || 'Mídia Desconhecida'; }
            return { id: Date.now().toString() + Math.random().toString(), uri: uri, name: nome };
          });

          novosItens.sort((a: any, b: any) => a.name.localeCompare(b.name));
          setPlaylist((prev: any) => [...prev, ...novosItens]);
          alert(`${novosItens.length} arquivo(s) adicionado(s) à fila!`);
        }
      } catch (erro) { alert('Erro ao ler a pasta do dispositivo.'); }
    } else if (Platform.OS === 'web') {
      adicionarPastaPCWeb(); 
    } else {
      alert("No iPhone/iPad, utilize o botão '+ Arquivo'.");
    }
  };

  const adicionarPastaPCWeb = () => {
    if (Platform.OS !== 'web') return;
    const input = document.createElement('input');
    input.type = 'file';
    input.setAttribute('webkitdirectory', 'true');
    input.setAttribute('directory', 'true');
    input.multiple = true;
    
    input.onchange = (e: any) => {
      const files = e.target.files;
      if (!files || files.length === 0) return;
      const novosItens: any[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (file.type.startsWith('audio/') || file.type.startsWith('video/') || /\.(mp3|wav|mp4|mkv|avi|mov|webm)$/i.test(file.name)) {
          const url = URL.createObjectURL(file);
          novosItens.push({ id: Date.now().toString() + Math.random().toString(), uri: url, name: file.name });
        }
      }
      if (novosItens.length > 0) {
        novosItens.sort((a: any, b: any) => a.name.localeCompare(b.name));
        setPlaylist((prev: any) => [...prev, ...novosItens]);
        alert(`${novosItens.length} arquivo(s) adicionado(s) à fila!`);
      } else { alert('Nenhum arquivo encontrado.'); }
    };
    input.click(); 
  };

  return {
    modalPastasPro, setModalPastasPro, modalRenomearFila, setModalRenomearFila,
    modalSalvarFila, setModalSalvarFila, nomeFilaSalva, setNomeFilaSalva,
    modalCarregarFila, setModalCarregarFila, listasSalvas, setListasSalvas,
    buscaFila, setBuscaFila, mostrarBuscaFila, setMostrarBuscaFila,
    carregarListasSalvas, salvarFilaAtual, exportarFilaComoArquivo,
    carregarFilaSelecionada, apagarFilaSalva, importarFilaDeArquivo,
    salvarRenomearFila, adicionarPastaNaPlaylist, adicionarPastaDoDispositivo, adicionarPastaPCWeb
  };
}