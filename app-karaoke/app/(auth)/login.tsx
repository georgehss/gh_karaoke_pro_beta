import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { Stack } from 'expo-router';
import { useAuth } from '../../src/context/AuthContext';
import { StatusBar } from 'expo-status-bar';

export default function LoginScreen() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [erroLogin, setErroLogin] = useState('');
  const { signIn, isLoading } = useAuth();

  const handleLogin = async () => {
    if (!username || !password) {
      setErroLogin('Preencha usuário e senha!');
      return;
    }
    
    setErroLogin(''); // Limpa o erro anterior da tela
    
    try {
      await signIn(username, password);
    } catch (error: any) {
      // Aqui a mágica acontece: o erro é capturado e não gera mais o aviso gigante (Uncaught Error)!
      setErroLogin(error.message);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar style="light" />

      <Stack.Screen 
        options={{
          title: 'GH Karaokê Pro',
          headerBackVisible: false,
          headerShown: false,
          headerLeft: () => null,
          headerStyle: { backgroundColor: '#1E1E1E' },
          headerTintColor: '#FFFFFF',
          headerShadowVisible: false,
        }} 
      />
      
      <View style={styles.headerContainer}>
        <View style={styles.titleRow}>
          <Text style={styles.titleGH}>GH </Text>
          <Text style={styles.title}>KARAOKÊ</Text>
          <View style={styles.proBadge}>
            <Text style={styles.titlePro}>PRO</Text>
          </View>
        </View>
        <Text style={styles.subtitle}>Faça login para acessar o GH Karaokê Pro</Text>
      </View>

      <View style={styles.formContainer}>
        
        {/* AVISO DE ERRO VISUAL NO FORMULÁRIO */}
        {erroLogin ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{erroLogin}</Text>
          </View>
        ) : null}

        <Text style={styles.label}>Usuário</Text>
        <TextInput
          style={styles.input}
          placeholder="Digite seu usuário"
          placeholderTextColor="#777"
          value={username}
          onChangeText={setUsername}
          autoCapitalize="none"
        />

        <Text style={styles.label}>Senha</Text>
        <TextInput
          style={styles.input}
          placeholder="Digite sua senha"
          placeholderTextColor="#777"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <TouchableOpacity 
          style={[styles.button, isLoading && { opacity: 0.7 }]} 
          onPress={handleLogin}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={styles.buttonText}>Entrar</Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1E1E1E', justifyContent: 'center', paddingHorizontal: 30 },
  headerContainer: { alignItems: 'center', marginBottom: 40 },
  titleRow: { flexDirection: 'row', alignItems: 'center' },
  titleGH: { fontSize: 32, fontWeight: '900', color: '#E50914', letterSpacing: -0.5 },
  title: { fontSize: 32, fontWeight: '900', color: '#FFFFFF', letterSpacing: -0.5 },
  proBadge: { backgroundColor: '#FFD700', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 5, marginLeft: 8 },
  titlePro: { fontSize: 14, fontWeight: 'bold', color: '#000' },
  subtitle: { color: '#A0A0A0', fontSize: 14, marginTop: 10, textAlign: 'center' },
  formContainer: { width: '100%', maxWidth: 400, alignSelf: 'center' },
  
  // Estilos da Caixinha de Erro que criamos
  errorBox: { backgroundColor: 'rgba(229, 9, 20, 0.1)', padding: 12, borderRadius: 10, marginBottom: 15, borderWidth: 1, borderColor: '#E50914' },
  errorText: { color: '#E50914', textAlign: 'center', fontWeight: 'bold', fontSize: 14 },
  
  label: { color: '#A0A0A0', fontSize: 14, fontWeight: 'bold', marginBottom: 5, marginLeft: 5 },
  input: { backgroundColor: '#2A2A2A', color: '#FFF', paddingHorizontal: 20, borderRadius: 15, height: 55, fontSize: 16, marginBottom: 20, borderWidth: 1, borderColor: '#333' },
  button: { backgroundColor: '#E50914', paddingVertical: 15, borderRadius: 30, alignItems: 'center', elevation: 5, marginTop: 10 },
  buttonText: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' },
});