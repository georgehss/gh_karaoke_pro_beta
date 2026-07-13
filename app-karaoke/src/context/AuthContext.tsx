import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

interface UserData {
  id: string;
  username: string;
  isPro: boolean;
}

interface AuthContextData {
  user: UserData | null;
  isLoading: boolean;
  signIn: (username: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

// === FUNÇÕES INTELIGENTES PARA SALVAR EM WEB OU CELULAR ===
const saveToStorage = async (key: string, value: string) => {
  if (Platform.OS === 'web') {
    localStorage.setItem(key, value);
  } else {
    await SecureStore.setItemAsync(key, value);
  }
};

const getFromStorage = async (key: string) => {
  if (Platform.OS === 'web') {
    return localStorage.getItem(key);
  } else {
    return await SecureStore.getItemAsync(key);
  }
};

const deleteFromStorage = async (key: string) => {
  if (Platform.OS === 'web') {
    localStorage.removeItem(key);
  } else {
    await SecureStore.deleteItemAsync(key);
  }
};

// === DETECTOR DE IP INTELIGENTE PARA O MODO LOCAL ===
const obterUrlLocalInteligente = (): string => {
  // 1. Prioriza a variável do .env, se existir
  if (process.env.EXPO_PUBLIC_LOCAL_API_URL) {
    return process.env.EXPO_PUBLIC_LOCAL_API_URL;
  }

  // 2. Na Web, o backend local sempre responde no localhost
  if (Platform.OS === 'web') {
    return 'http://localhost:5000/api/login';
  }

  // 3. No Mobile (Expo Go), extrai o IP real da máquina que está rodando o bundler
  const hostUri = Constants.expoConfig?.hostUri;
  if (hostUri) {
    const ipDoComputador = hostUri.split(':')[0];
    return `http://${ipDoComputador}:5000/api/login`;
  }

  // Fallback genérico
  return 'http://127.0.0.1:5000/api/login';
};
// ==========================================================

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadStorageData() {
      try {
        const storedToken = await getFromStorage('gh_karaoke_token');
        const storedUser = await getFromStorage('gh_karaoke_user');

        if (storedToken && storedUser) {
          setUser(JSON.parse(storedUser));
        }
      } catch (error) {
        console.error("Erro ao carregar token", error);
      } finally {
        setIsLoading(false);
      }
    }
    loadStorageData();
  }, []);

  const signIn = async (username: string, password: string) => {
    setIsLoading(true);
    try {
      const authMode = process.env.EXPO_PUBLIC_AUTH_MODE || 'serverless';

      // Usa o detector inteligente se for local, ou o caminho serverless
      const apiUrl = authMode === 'local'
        ? obterUrlLocalInteligente()
        : (process.env.EXPO_PUBLIC_SERVERLESS_API_URL || '/.netlify/functions/login');

      console.log(`Efetuando login via modo: ${authMode} | URL: ${apiUrl}`);

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.erro || "Falha na autenticação");
      }

      await saveToStorage('gh_karaoke_token', data.token);
      await saveToStorage('gh_karaoke_user', JSON.stringify(data.user));

      setUser(data.user);
    } catch (error: any) {
      console.error("Erro no signIn:", error);
      alert(error.message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    setIsLoading(true);
    await deleteFromStorage('gh_karaoke_token');
    await deleteFromStorage('gh_karaoke_user');
    setUser(null);
    setIsLoading(false);
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);