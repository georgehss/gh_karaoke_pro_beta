import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

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
      // ⚠️ ATENÇÃO: Troque pelo IP da sua máquina se estiver rodando no celular via Expo Go!
      // Exemplo: 'http://192.168.1.15:5000/api/login'
      const apiUrl = 'http://127.0.0.1:5000/api/login'; 

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.erro || "Falha na autenticação");
      }

      // Se deu tudo certo, salva o token real e os dados reais no Cofre
      await saveToStorage('gh_karaoke_token', data.token);
      await saveToStorage('gh_karaoke_user', JSON.stringify(data.user));

      setUser(data.user);
    } catch (error: any) {
      console.error("Erro no signIn:", error);
      alert(error.message); // Exibe o aviso "Usuário ou senha inválidos" na tela
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