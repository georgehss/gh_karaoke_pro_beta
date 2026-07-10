import { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SettingsProvider } from '../src/context/SettingsContext';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { AuthProvider, useAuth } from '../src/context/AuthContext';

// Mantém a sua configuração original
export const unstable_settings = {
  anchor: '(tabs)',
};

// Este componente intercepta as rotas e renderiza o seu Stack original
const InitialLayout = () => {
  const colorScheme = useColorScheme();
  const { user, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return; 

    // Convertendo para String para corrigir o erro ts(2367)
    const inAuthGroup = String(segments[0]) === '(auth)';

    if (!user && !inAuthGroup) {
      // Usando 'as any' para corrigir o erro ts(2345)
      router.replace('/(auth)/login' as any);
    } 
    else if (user && inAuthGroup) {
      router.replace('/(tabs)' as any);
    }
  }, [user, isLoading, segments]);

  // Mostra a tela de carregamento enquanto vasculha o SecureStore
  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#1E1E1E' }}>
        <ActivityIndicator size="large" color="#E50914" />
      </View>
    );
  }

  // Retorna a sua estrutura original de Temas e Stacks
  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        {/* Adicionamos a rota (auth) para garantir que ela não tenha cabeçalho */}
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        {/* Suas rotas originais */}
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
};

// O RootLayout agora abraça o aplicativo com o Provedor de Autenticação
export default function RootLayout() {
  return (
    <SettingsProvider> {/* <-- Adicionado aqui */}
      <AuthProvider>
        <InitialLayout />
      </AuthProvider>
    </SettingsProvider>
  );
}