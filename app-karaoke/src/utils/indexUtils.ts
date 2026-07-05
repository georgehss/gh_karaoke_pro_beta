import { Platform } from 'react-native';
import Constants from 'expo-constants';
import * as FileSystem from 'expo-file-system/legacy';

// Substitua pelo endereço do seu servidor Python
export const LIBRARY_DIR = `${FileSystem.documentDirectory}KaraokeLibrary/`;
export const LRC_LIBRARY_DIR = `${FileSystem.documentDirectory}LrcLibrary/`;
export const PLAYLISTS_DIR = `${FileSystem.documentDirectory}Playlists/`;

const definirUrlAmbiente = (): string => {
  if (Platform.OS === 'web') {
    return 'http://localhost:5000';
  }

  // Captura o endereço de conexão que o Metro Bundler está usando para se comunicar com o app
  const hostUri = Constants.expoConfig?.hostUri; 
  
  if (hostUri) {
    // O hostUri vem no formato "192.168.X.X:8081", então separamos para pegar apenas o IP antes dos dois pontos
    const ipDoMetro = hostUri.split(':')[0];
    return `http://${ipDoMetro}:5000`;
  }

  // Fallback de segurança caso o hostUri falhe em algum cenário offline extremo
  return 'http://192.168.0.XX:5000'; 
};

export const URL_SERVIDOR = definirUrlAmbiente();

export const processarLRC = (conteudo: string) => {
  const linhas = conteudo.trim().split('\n');
  // Ajuste na Regex para suportar músicas longas com mais de 99 minutos
  const regex = /\[(\d{2,3}):(\d{2})\.(\d{2,3})\](.*)/;
  const resultado: any[] = [];
  
  for (const linha of linhas) {
    const linhaLimpa = linha.trim();
    if (linhaLimpa === "") continue;

    const match = regex.exec(linhaLimpa);
    if (match) {
      const min = parseInt(match[1], 10);
      const seg = parseInt(match[2], 10);
      const ms = parseInt(match[3], 10);
      // Calcula os milissegundos corretamente (seja 2 ou 3 dígitos)
      const divisor = match[3].length === 3 ? 1000 : 100;
      const tempoTotal = min * 60 + seg + (ms / divisor);
      
      if (match[4].trim() !== "") {
        resultado.push({ tempo: tempoTotal, texto: match[4].trim() });
      }
    } else if (linhaLimpa.startsWith('[') && linhaLimpa.includes(':')) {
      // 🚨 A MÁGICA AQUI: Se for um metadado (ex: [ti:Garçom]), ele ignora completamente e não joga na tela!
      continue; 
    } else {
      // Se for apenas um texto avulso perdido, joga com tempo 0
      resultado.push({ tempo: 0, texto: linhaLimpa });
    }
  }
  return resultado;
};

export const formatarTempo = (segundosTotaos: number) => {
  if (!segundosTotaos || isNaN(segundosTotaos)) return "00:00";
  const min = Math.floor(segundosTotaos / 60);
  const seg = Math.floor(segundosTotaos % 60);
  return `${min.toString().padStart(2, '0')}:${seg.toString().padStart(2, '0')}`;
};

export type PlaylistItem = { id: string; uri: string; name: string; isInterno?: boolean; };

// ==========================================
// BANCO DE DADOS PARA SALVAR PASTAS DO PC
// ==========================================
export const abrirBancoPastas = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('GHKaraokePastasDB', 1);
    request.onupgradeneeded = (e: any) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains('pastas_virtuais')) {
        db.createObjectStore('pastas_virtuais');
      }
    };
    request.onsuccess = (e: any) => resolve(e.target.result);
    request.onerror = (e: any) => reject(e.target.error);
  });
};

export const salvarHandleDB = async (nome: string, handle: any, isLrc: boolean) => {
  const db = await abrirBancoPastas();
  const tx = db.transaction('pastas_virtuais', 'readwrite');
  tx.objectStore('pastas_virtuais').put({ handle, isLrc }, nome);
};

export const apagarHandleDB = async (nome: string) => {
  const db = await abrirBancoPastas();
  const tx = db.transaction('pastas_virtuais', 'readwrite');
  tx.objectStore('pastas_virtuais').delete(nome);
};

// Função auxiliar para o Polling da IA (espera X milissegundos)
export const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

