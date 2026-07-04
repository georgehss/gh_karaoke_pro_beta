import { useState, useEffect } from 'react';
import { Platform, Alert } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import * as DocumentPicker from 'expo-document-picker';
import * as Sharing from 'expo-sharing';
import { LIBRARY_DIR, LRC_LIBRARY_DIR, abrirBancoPastas, salvarHandleDB, apagarHandleDB } from '../utils/indexUtils';

export function useLibraryManager(telaAtiva: string) {
  // ==========================================
  // 1. ESTADOS DA BIBLIOTECA LOCAL
  // ==========================================
  const [pastas, setPastas] = useState<string[]>([]);
  const [pastaAtual, setPastaAtual] = useState<string | null>(null);
  const [arquivosPasta, setArquivosPasta] = useState<string[]>([]);
  const [modalNovaPasta, setModalNovaPasta] = useState<boolean>(false);
  const [nomeNovaPasta, setNomeNovaPasta] = useState<string>('');
  const [modalAcaoArquivo, setModalAcaoArquivo] = useState<{nome: string, uri: string, isLrc: boolean, pasta: string} | null>(null);

  // ==========================================
  // 2. ESTADOS DE SELEÇÃO MÚLTIPLA
  // ==========================================
  const [modoSelecaoBib, setModoSelecaoBib] = useState<boolean>(false);
  const [selecionadosBib, setSelecionadosBib] = useState<string[]>([]);

  // ==========================================
  // 3. ESTADOS DE PASTAS VIRTUAIS (LINK PC/WEB)
  // ==========================================
  const [pastasVirtuaisWeb, setPastasVirtuaisWeb] = useState<Record<string, {nome: string, uri: string}[]>>({});
  const [pastasVirtuaisLrcWeb, setPastasVirtuaisLrcWeb] = useState<Record<string, {nome: string, audioUri: string, lrcUri: string}[]>>({});

  // ==========================================
  // 4. ESTADOS DE RENOMEAR, FILTROS E ORDENAÇÃO
  // ==========================================
  const [modalRenomearBib, setModalRenomearBib] = useState<{nomeAntigo: string, uri: string, isLrc: boolean, pasta: string} | null>(null);
  const [novoNomeBib, setNovoNomeBib] = useState<string>('');
  const [modoVisao, setModoVisao] = useState<'compacto' | 'lista' | 'detalhado'>('detalhado');
  const [infoPastas, setInfoPastas] = useState<Record<string, { count: number, size: number }>>({});
  const [infoPastasLrc, setInfoPastasLrc] = useState<Record<string, { count: number, size: number }>>({});
  const [modalOrdem, setModalOrdem] = useState<boolean>(false);
  const [criterioOrdem, setCriterioOrdem] = useState<'a-z' | 'z-a' | 'extensao' | 'recentes'>('a-z');

  // ==========================================
  // 5. ESTADOS DA BIBLIOTECA LRC (KARAOKÊ)
  // ==========================================
  const [pastasLrc, setPastasLrc] = useState<string[]>([]);
  const [pastaAtualLrc, setPastaAtualLrc] = useState<string | null>(null);
  const [arquivosPastaLrc, setArquivosPastaLrc] = useState<string[]>([]);
  const [modalNovaPastaLrc, setModalNovaPastaLrc] = useState<boolean>(false);
  const [nomeNovaPastaLrc, setNomeNovaPastaLrc] = useState<string>('');

  // ==========================================
  // FUNÇÕES DE LEITURA VIRTUAL (WEB)
  // ==========================================
  const processarHandleDoPC = async (nomePasta: string, dirHandle: any, isLrc: boolean, requiresPermission = false) => {
    try {
      if (requiresPermission) {
        const permission = await dirHandle.requestPermission({ mode: 'read' });
        if (permission !== 'granted') return false;
      }

      const files = [];
      for await (const entry of dirHandle.values()) {
        if (entry.kind === 'file') files.push(await entry.getFile());
      }

      if (isLrc) {
        const lrcFiles = [];
        const audioFiles = [];
        for (let i = 0; i < files.length; i++) {
          const file = files[i];
          const nameLower = file.name.toLowerCase();
          if (nameLower.endsWith('.lrc')) lrcFiles.push(file);
          else if (file.type.startsWith('audio/') || file.type.startsWith('video/') || nameLower.endsWith('.mp3') || nameLower.endsWith('.wav') || nameLower.endsWith('.m4a')) audioFiles.push(file);
        }

        const paresCasados: {nome: string, audioUri: string, lrcUri: string}[] = [];
        for (const lrcFile of lrcFiles) {
          const baseName = lrcFile.name.substring(0, lrcFile.name.lastIndexOf('.'));
          const audioMatch = audioFiles.find((a: any) => a.name.substring(0, a.name.lastIndexOf('.')) === baseName);
          if (audioMatch) {
            paresCasados.push({ nome: baseName, audioUri: URL.createObjectURL(audioMatch), lrcUri: URL.createObjectURL(lrcFile) });
          }
        }

        if (paresCasados.length > 0) {
          setPastasVirtuaisLrcWeb(prev => ({...prev, [nomePasta]: paresCasados}));
          return true;
        }
      } else {
        const midias: {nome: string, uri: string}[] = [];
        for (let i = 0; i < files.length; i++) {
          const file = files[i];
          if (file.type.startsWith('audio/') || file.type.startsWith('video/') || /\.(mp3|wav|mp4|mkv|avi|mov|webm)$/i.test(file.name)) {
            midias.push({ nome: file.name, uri: URL.createObjectURL(file) });
          }
        }
        if (midias.length > 0) {
          setPastasVirtuaisWeb(prev => ({...prev, [nomePasta]: midias}));
          return true;
        }
      }
      return false;
    } catch (e) {
      console.log("Erro ao processar pasta do PC:", e);
      return false;
    }
  };

  // ==========================================
  // FUNÇÕES DE SELEÇÃO MÚLTIPLA
  // ==========================================
  const iniciarModoSelecao = (nomeArquivo: string) => { setModoSelecaoBib(true); setSelecionadosBib([nomeArquivo]); };
  const cancelarSelecao = () => { setModoSelecaoBib(false); setSelecionadosBib([]); };
  
  const toggleSelecaoArquivo = (nomeArquivo: string) => {
    if (selecionadosBib.includes(nomeArquivo)) {
      const novaLista = selecionadosBib.filter(item => item !== nomeArquivo);
      setSelecionadosBib(novaLista);
      if (novaLista.length === 0) setModoSelecaoBib(false);
    } else {
      setSelecionadosBib([...selecionadosBib, nomeArquivo]);
    }
  };

  const apagarSelecionados = async () => {
    const isLrc = telaAtiva === 'biblioteca_lrc';
    const pasta = isLrc ? pastaAtualLrc : pastaAtual;
    
    const confirmar = Platform.OS === 'web' 
      ? (window as any).confirm(`Deseja apagar ${selecionadosBib.length} arquivo(s)?`) 
      : await new Promise(resolve => Alert.alert("Apagar", `Deseja apagar ${selecionadosBib.length} arquivo(s)?`, [{ text: "Cancelar", onPress: () => resolve(false) }, { text: "Sim", onPress: () => resolve(true) }]));

    if (confirmar) {
      for (const nome of selecionadosBib) {
        if (Platform.OS === 'web') {
          const stateKey = isLrc ? pastasVirtuaisLrcWeb : pastasVirtuaisWeb;
          const setter = isLrc ? setPastasVirtuaisLrcWeb : setPastasVirtuaisWeb;
          if (stateKey[pasta!]) {
            const filtrados = stateKey[pasta!].filter((f: any) => isLrc ? (f.nome + '.lrc') !== nome && f.nome !== nome : f.nome !== nome);
            (setter as any)((prev: any) => ({...prev, [pasta!]: filtrados}));
          }
        } else {
          const dirBase = isLrc ? LRC_LIBRARY_DIR : LIBRARY_DIR;
          try { await FileSystem.deleteAsync(`${dirBase}${pasta}/${nome}`, { idempotent: true }); } catch(e) {}
        }
      }
      if (isLrc) carregarArquivosDaPastaLrc(pasta!); else carregarArquivosDaPasta(pasta!);
      cancelarSelecao();
    }
  };

  const exportarSelecionados = async () => {
    const isLrc = telaAtiva === 'biblioteca_lrc';
    const pasta = isLrc ? pastaAtualLrc : pastaAtual;

    if (Platform.OS === 'web') {
      selecionadosBib.forEach(nome => {
        const uriLocal = isLrc
          ? (pastasVirtuaisLrcWeb[pasta!]?.find(f => (f.nome + '.lrc') === nome || f.nome === nome)?.lrcUri || '')
          : (pastasVirtuaisWeb[pasta!]?.find(f => f.nome === nome)?.uri || '');
        if(uriLocal) {
          const link = document.createElement('a'); link.href = uriLocal; link.download = nome;
          document.body.appendChild(link); link.click(); document.body.removeChild(link);
        }
      });
    } else {
      if (await Sharing.isAvailableAsync()) {
        alert("Atenção: O celular abrirá a janela de compartilhamento uma vez para cada arquivo selecionado.");
        for (const nome of selecionadosBib) {
          const dirBase = isLrc ? LRC_LIBRARY_DIR : LIBRARY_DIR;
          await Sharing.shareAsync(`${dirBase}${pasta}/${nome}`, { dialogTitle: `Exportando ${nome}` });
        }
      }
    }
    cancelarSelecao();
  };

  // ==========================================
  // FUNÇÕES DE CÁLCULO E ORDENAÇÃO
  // ==========================================
  const formatarTamanhoBytes = (bytes: number) => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const calcularEstatisticasPasta = async (listaPastas: string[], dirBase: string, setterInfo: Function) => {
    if (Platform.OS === 'web') return; 
    const infos: Record<string, { count: number, size: number }> = {};
    for (const pasta of listaPastas) {
      try {
        const caminhoPasta = `${dirBase}${pasta}/`;
        const arquivos = await FileSystem.readDirectoryAsync(caminhoPasta);
        let tamanhoTotal = 0;
        for (const arq of arquivos) {
          const fileInfo = await FileSystem.getInfoAsync(`${caminhoPasta}${arq}`);
          if (fileInfo.exists && !fileInfo.isDirectory) {
            tamanhoTotal += fileInfo.size || 0;
          }
        }
        infos[pasta] = { count: arquivos.length, size: tamanhoTotal };
      } catch (e) {
        infos[pasta] = { count: 0, size: 0 };
      }
    }
    setterInfo(infos); 
  };

  const aplicarOrdemArquivos = async (files: string[], criterio: typeof criterioOrdem, dirBase: string, setter: (sortedFiles: string[]) => void, isVirtual: boolean) => {
    if (criterio === 'recentes' && !isVirtual && Platform.OS !== 'web') {
      try {
        const comData: { nome: string; tempo: number }[] = await Promise.all(files.map(async f => {
          const info = await FileSystem.getInfoAsync(`${dirBase}${f}`);
          const tempoAtualizacao = info.exists ? info.modificationTime : 0;
          return { nome: f, tempo: tempoAtualizacao };
        }));
        comData.sort((a, b) => b.tempo - a.tempo);
        setter(comData.map(f => f.nome));
        return;
      } catch(e) { console.log("Erro ao ordenar recentes", e); }
    }
    const copia = [...files];
    if (criterio === 'a-z') copia.sort((a: string, b: string) => a.localeCompare(b));
    else if (criterio === 'z-a') copia.sort((a: string, b: string) => b.localeCompare(a));
    else if (criterio === 'extensao') {
      copia.sort((a: string, b: string) => {
        const extA = a.split('.').pop()?.toLowerCase() || '';
        const extB = b.split('.').pop()?.toLowerCase() || '';
        if (extA === extB) return a.localeCompare(b);
        return extA.localeCompare(extB);
      });
    }
    setter(copia);
  };

  const mudarOrdem = (novoCriterio: 'a-z' | 'z-a' | 'extensao' | 'recentes') => {
    setCriterioOrdem(novoCriterio); setModalOrdem(false);
    if (telaAtiva === 'biblioteca' && pastaAtual) {
      if (Platform.OS === 'web' && pastasVirtuaisWeb[pastaAtual]) aplicarOrdemArquivos(pastasVirtuaisWeb[pastaAtual].map(f => f.nome), novoCriterio, '', setArquivosPasta, true);
      else aplicarOrdemArquivos(arquivosPasta, novoCriterio, `${LIBRARY_DIR}${pastaAtual}/`, setArquivosPasta, false);
    } else if (telaAtiva === 'biblioteca_lrc' && pastaAtualLrc) {
      if (Platform.OS === 'web' && pastasVirtuaisLrcWeb[pastaAtualLrc]) aplicarOrdemArquivos(pastasVirtuaisLrcWeb[pastaAtualLrc].map(f => f.nome + '.lrc'), novoCriterio, '', setArquivosPastaLrc, true);
      else aplicarOrdemArquivos(arquivosPastaLrc, novoCriterio, `${LRC_LIBRARY_DIR}${pastaAtualLrc}/`, setArquivosPastaLrc, false);
    }
  };

  // ==========================================
  // FUNÇÕES DA BIBLIOTECA LOCAL
  // ==========================================
  const inicializarBiblioteca = async () => {
    try {
      const dirInfo = await FileSystem.getInfoAsync(LIBRARY_DIR);
      if (!dirInfo.exists) await FileSystem.makeDirectoryAsync(LIBRARY_DIR, { intermediates: true });
      const files = await FileSystem.readDirectoryAsync(LIBRARY_DIR);
      const pastasReais = files.filter(f => !f.includes('.'));
      setPastas(pastasReais);
      calcularEstatisticasPasta(pastasReais, LIBRARY_DIR, setInfoPastas); 
    } catch (e) { }
  };

  const criarNovaPasta = async () => {
    if (!nomeNovaPasta.trim()) return;
    try {
      await FileSystem.makeDirectoryAsync(`${LIBRARY_DIR}${nomeNovaPasta}`, { intermediates: true });
      setModalNovaPasta(false); setNomeNovaPasta(''); inicializarBiblioteca();
    } catch (e) { alert("Erro ao criar pasta."); }
  };

  const carregarArquivosDaPasta = async (nomeDaPasta: string) => {
    try { 
      const files = await FileSystem.readDirectoryAsync(`${LIBRARY_DIR}${nomeDaPasta}`); 
      aplicarOrdemArquivos(files, criterioOrdem, `${LIBRARY_DIR}${nomeDaPasta}/`, setArquivosPasta, false);
    } catch (e) { console.log("Erro ao ler arquivos", e); }
  };

  const entrarNaPasta = async (nomeDaPasta: string) => { 
    setPastaAtual(nomeDaPasta); 
    if (Platform.OS === 'web' && pastasVirtuaisWeb[nomeDaPasta]) aplicarOrdemArquivos(pastasVirtuaisWeb[nomeDaPasta].map(f => f.nome), criterioOrdem, '', setArquivosPasta, true);
    else carregarArquivosDaPasta(nomeDaPasta); 
  };
  
  const voltarParaPastas = () => { setPastaAtual(null); setArquivosPasta([]); inicializarBiblioteca(); };

  const importarArquivos = async () => {
    try {
      const resultado = await DocumentPicker.getDocumentAsync({ type: ['video/*', 'audio/*'], multiple: true, copyToCacheDirectory: true });
      if (!resultado.canceled) {
        for (const asset of resultado.assets) {
          const dest = `${LIBRARY_DIR}${pastaAtual}/${asset.name}`;
          await FileSystem.copyAsync({ from: asset.uri, to: dest });
        }
        carregarArquivosDaPasta(pastaAtual!); alert(`${resultado.assets.length} arquivo(s) importado(s)!`);
      }
    } catch (erro) { alert("Erro ao importar arquivos."); }
  };

  const apagarItem = (nome: string, isPasta: boolean) => {
    if (Platform.OS === 'web' && isPasta && pastasVirtuaisWeb[nome]) {
      const novas = {...pastasVirtuaisWeb}; delete novas[nome];
      setPastasVirtuaisWeb(novas); voltarParaPastas(); apagarHandleDB(nome); return;
    }
    if (Platform.OS === 'web') {
      const confirmar = (window as any).confirm(isPasta ? `Tem certeza que deseja apagar a pasta "${nome}" e TODAS as músicas dentro dela?` : `Tem certeza que deseja apagar "${nome}"?`);
      if (confirmar) {
        try {
          const caminho = isPasta ? `${LIBRARY_DIR}${nome}` : `${LIBRARY_DIR}${pastaAtual}/${nome}`;
          FileSystem.deleteAsync(caminho, { idempotent: true }).then(() => {
            if (isPasta) inicializarBiblioteca(); else carregarArquivosDaPasta(pastaAtual!);
          });
        } catch (e) { alert("Erro ao apagar."); }
      }
    } else {
      Alert.alert(
        isPasta ? "Apagar Pasta" : "Apagar Arquivo",
        isPasta ? `Tem certeza que deseja apagar a pasta "${nome}" e TODAS as músicas dentro dela?` : `Tem certeza que deseja apagar "${nome}"?`,
        [
          { text: "Cancelar", style: "cancel" },
          { 
            text: "Sim, Apagar", style: "destructive",
            onPress: async () => {
              try {
                const caminho = isPasta ? `${LIBRARY_DIR}${nome}` : `${LIBRARY_DIR}${pastaAtual}/${nome}`;
                await FileSystem.deleteAsync(caminho, { idempotent: true });
                if (isPasta) inicializarBiblioteca(); else carregarArquivosDaPasta(pastaAtual!);
              } catch (e) { alert("Erro ao apagar."); }
            }
          }
        ]
      );
    }
  };

  // ==========================================
  // FUNÇÕES DE INTEGRAÇÃO WEB (LINKS DO PC)
  // ==========================================
  const linkarPastaPCWeb = async (isLrc: boolean) => {
    if (Platform.OS !== 'web') return;
    if (!('showDirectoryPicker' in window)) { alert("Seu navegador não suporta a nova tecnologia de salvamento de pastas. Use Google Chrome, Edge ou Opera."); return; }
    try {
      const rootHandle = await (window as any).showDirectoryPicker();
      let pastasAdicionadas = 0;
      const pastasParaProcessar = [];
      pastasParaProcessar.push({ handle: rootHandle, nome: `[PC] ${rootHandle.name}` });

      for await (const entry of rootHandle.values()) {
        if (entry.kind === 'directory') pastasParaProcessar.push({ handle: entry, nome: `[PC] ${entry.name}` });
      }

      for (const item of pastasParaProcessar) {
        const sucesso = await processarHandleDoPC(item.nome, item.handle, isLrc, false);
        if (sucesso) { salvarHandleDB(item.nome, item.handle, isLrc); pastasAdicionadas++; }
      }

      if (pastasAdicionadas > 0) setTimeout(() => alert(`✅ ${pastasAdicionadas} pasta(s) vinculada(s) com sucesso!`), 200);
      else alert("Nenhum arquivo de mídia/letra compatível encontrado nesta pasta raiz ou em suas subpastas.");
    } catch (e) { console.log("Seleção de pasta cancelada:", e); }
  };

  const restaurarPastasSalvasPC = async () => {
    if (Platform.OS !== 'web') return;
    try {
      const db = await abrirBancoPastas();
      const tx = db.transaction('pastas_virtuais', 'readonly');
      const store = tx.objectStore('pastas_virtuais');
      
      const valores = await new Promise<any[]>((resolve, reject) => { const req = store.getAll(); req.onsuccess = () => resolve(req.result); req.onerror = () => reject(req.error); });
      const nomes = await new Promise<any[]>((resolve, reject) => { const req = store.getAllKeys(); req.onsuccess = () => resolve(req.result); req.onerror = () => reject(req.error); });
      
      if (valores.length === 0) { alert("Você não possui pastas do PC salvas na memória."); return; }

      let restauradas = 0;
      for (let i = 0; i < valores.length; i++) {
        const { handle, isLrc } = valores[i];
        const nome = nomes[i] as string;
        const sucesso = await processarHandleDoPC(nome, handle, isLrc, true);
        if (sucesso) restauradas++;
      }
      
      if (restauradas > 0) alert(`${restauradas} pasta(s) do PC restaurada(s) com sucesso!`);
    } catch (e) { console.error(e); alert("Erro ao ler banco de dados ou restaurar pastas."); }
  };

  // ==========================================
  // FUNÇÕES DA BIBLIOTECA LRC
  // ==========================================
  const inicializarBibliotecaLrc = async () => {
    try {
      const dirInfo = await FileSystem.getInfoAsync(LRC_LIBRARY_DIR);
      if (!dirInfo.exists) await FileSystem.makeDirectoryAsync(LRC_LIBRARY_DIR, { intermediates: true });
      const files = await FileSystem.readDirectoryAsync(LRC_LIBRARY_DIR);
      const pastasReais = files.filter(f => !f.includes('.'));
      setPastasLrc(pastasReais);
      calcularEstatisticasPasta(pastasReais, LRC_LIBRARY_DIR, setInfoPastasLrc); 
    } catch (e) {}
  };

  const criarNovaPastaLrc = async () => {
    if (!nomeNovaPastaLrc.trim()) return;
    try {
      await FileSystem.makeDirectoryAsync(`${LRC_LIBRARY_DIR}${nomeNovaPastaLrc}`, { intermediates: true });
      setModalNovaPastaLrc(false); setNomeNovaPastaLrc(''); inicializarBibliotecaLrc();
    } catch (e) { alert("Erro ao criar pasta LRC."); }
  };

  const carregarArquivosDaPastaLrc = async (nomeDaPasta: string) => {
    try { 
      const files = await FileSystem.readDirectoryAsync(`${LRC_LIBRARY_DIR}${nomeDaPasta}`); 
      aplicarOrdemArquivos(files, criterioOrdem, `${LRC_LIBRARY_DIR}${nomeDaPasta}/`, setArquivosPastaLrc, false);
    } catch (e) {}
  };

  const entrarNaPastaLrc = async (nomeDaPasta: string) => { 
    setPastaAtualLrc(nomeDaPasta); 
    if (Platform.OS === 'web' && pastasVirtuaisLrcWeb[nomeDaPasta]) aplicarOrdemArquivos(pastasVirtuaisLrcWeb[nomeDaPasta].map(f => f.nome + '.lrc'), criterioOrdem, '', setArquivosPastaLrc, true);
    else carregarArquivosDaPastaLrc(nomeDaPasta); 
  };
  
  const voltarParaPastasLrc = () => { setPastaAtualLrc(null); setArquivosPastaLrc([]); inicializarBibliotecaLrc(); };

  const importarArquivosLrc = async () => {
    try {
      const resultado = await DocumentPicker.getDocumentAsync({ type: ['audio/*', '*/*'], multiple: true, copyToCacheDirectory: true });
      if (!resultado.canceled) {
        for (const asset of resultado.assets) {
          const dest = `${LRC_LIBRARY_DIR}${pastaAtualLrc}/${asset.name}`;
          await FileSystem.copyAsync({ from: asset.uri, to: dest });
        }
        carregarArquivosDaPastaLrc(pastaAtualLrc!); alert(`${resultado.assets.length} arquivo(s) importado(s)!`);
      }
    } catch (erro) { alert("Erro ao importar arquivos."); }
  };

  const apagarItemLrc = (nome: string, isPasta: boolean) => {
    if (Platform.OS === 'web' && isPasta && pastasVirtuaisLrcWeb[nome]) {
      const novas = {...pastasVirtuaisLrcWeb}; delete novas[nome];
      setPastasVirtuaisLrcWeb(novas); voltarParaPastasLrc(); apagarHandleDB(nome); return;
    }
    Alert.alert(
      isPasta ? "Apagar Pasta LRC" : "Apagar Arquivo LRC",
      isPasta ? `Tem certeza que deseja apagar a pasta "${nome}" e TODOS os arquivos dentro dela?` : `Tem certeza que deseja apagar "${nome}"?`,
      [
        { text: "Cancelar", style: "cancel" },
        { 
          text: "Sim, Apagar", style: "destructive",
          onPress: async () => {
            try {
              const caminho = isPasta ? `${LRC_LIBRARY_DIR}${nome}` : `${LRC_LIBRARY_DIR}${pastaAtualLrc}/${nome}`;
              await FileSystem.deleteAsync(caminho, { idempotent: true });
              if (isPasta) inicializarBibliotecaLrc(); else carregarArquivosDaPastaLrc(pastaAtualLrc!);
            } catch (e) { alert("Erro ao apagar."); }
          }
        }
      ]
    );
  };

  // ==========================================
  // FUNÇÕES GENÉRICAS DE AÇÕES DE ARQUIVO
  // ==========================================
  const exportarArquivoBib = async () => {
    if (!modalAcaoArquivo) return;
    try {
      if (Platform.OS === 'web') {
        const link = document.createElement('a');
        link.href = modalAcaoArquivo.uri; link.download = modalAcaoArquivo.nome;
        document.body.appendChild(link); link.click(); document.body.removeChild(link);
      } else {
        if (await Sharing.isAvailableAsync()) await Sharing.shareAsync(modalAcaoArquivo.uri, { dialogTitle: 'Salvar Arquivo no Celular' });
        else alert("O compartilhamento não está disponível no seu dispositivo.");
      }
    } catch (e) { alert("Erro ao tentar salvar o arquivo."); }
    setModalAcaoArquivo(null); 
  };

  const abrirRenomearBib = () => {
    if (!modalAcaoArquivo) return;
    const partes = modalAcaoArquivo.nome.split('.');
    const extensao = partes.length > 1 ? `.${partes.pop()}` : '';
    const nomeSemExt = partes.join('.');
    
    setNovoNomeBib(nomeSemExt);
    setModalRenomearBib({
      nomeAntigo: modalAcaoArquivo.nome, uri: modalAcaoArquivo.uri,
      isLrc: modalAcaoArquivo.isLrc, pasta: modalAcaoArquivo.pasta
    });
    setModalAcaoArquivo(null); 
  };

  const confirmarRenomearBib = async () => {
    if (!modalRenomearBib || !novoNomeBib.trim()) return;
    try {
      const partes = modalRenomearBib.nomeAntigo.split('.');
      const extensao = partes.length > 1 ? `.${partes.pop()}` : '';
      const nomeFinal = `${novoNomeBib.trim()}${extensao}`;
      
      const dirBase = modalRenomearBib.isLrc ? LRC_LIBRARY_DIR : LIBRARY_DIR;
      const novoUri = `${dirBase}${modalRenomearBib.pasta}/${nomeFinal}`;

      await FileSystem.moveAsync({ from: modalRenomearBib.uri, to: novoUri });

      if (modalRenomearBib.isLrc) carregarArquivosDaPastaLrc(modalRenomearBib.pasta);
      else carregarArquivosDaPasta(modalRenomearBib.pasta);
      
      setModalRenomearBib(null);
      alert("✅ Arquivo renomeado com sucesso!");
    } catch (e) {
      alert("Erro ao renomear. Verifique se o nome contém caracteres inválidos ou se já existe.");
    }
  };

  const apagarPeloModalOpcoes = () => {
    if (!modalAcaoArquivo) return;
    if (modalAcaoArquivo.isLrc) apagarItemLrc(modalAcaoArquivo.nome, false);
    else apagarItem(modalAcaoArquivo.nome, false);
    setModalAcaoArquivo(null);
  };

  // Efeitos iniciais
  useEffect(() => { inicializarBiblioteca(); inicializarBibliotecaLrc(); }, []);

  return {
    pastas, setPastas, pastaAtual, setPastaAtual, arquivosPasta, setArquivosPasta,
    modalNovaPasta, setModalNovaPasta, nomeNovaPasta, setNomeNovaPasta, modalAcaoArquivo, setModalAcaoArquivo,
    modoSelecaoBib, setModoSelecaoBib, selecionadosBib, setSelecionadosBib,
    pastasVirtuaisWeb, setPastasVirtuaisWeb, pastasVirtuaisLrcWeb, setPastasVirtuaisLrcWeb,
    modalRenomearBib, setModalRenomearBib, novoNomeBib, setNovoNomeBib, modoVisao, setModoVisao,
    infoPastas, setInfoPastas, infoPastasLrc, setInfoPastasLrc, modalOrdem, setModalOrdem, criterioOrdem, setCriterioOrdem,
    pastasLrc, setPastasLrc, pastaAtualLrc, setPastaAtualLrc, arquivosPastaLrc, setArquivosPastaLrc,
    modalNovaPastaLrc, setModalNovaPastaLrc, nomeNovaPastaLrc, setNomeNovaPastaLrc,
    
    iniciarModoSelecao, cancelarSelecao, toggleSelecaoArquivo, apagarSelecionados, exportarSelecionados,
    mudarOrdem, formatarTamanhoBytes,
    inicializarBiblioteca, criarNovaPasta, entrarNaPasta, carregarArquivosDaPasta, voltarParaPastas,
    linkarPastaPCWeb, restaurarPastasSalvasPC, importarArquivos, apagarItem,
    inicializarBibliotecaLrc, criarNovaPastaLrc, entrarNaPastaLrc, carregarArquivosDaPastaLrc, voltarParaPastasLrc,
    importarArquivosLrc, apagarItemLrc, exportarArquivoBib, abrirRenomearBib, confirmarRenomearBib, apagarPeloModalOpcoes
  };
}