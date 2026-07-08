import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Keyboard, View, Text, TouchableOpacity, Modal, TextInput, ScrollView, FlatList, ActivityIndicator, Image, Platform, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { styles } from '../../styles/indexStyles';

export default function ModalOrigemMusica(props: any) {
  const { modalOrigemMusica, setModalOrigemMusica, escolherMusicaLocal, setFonteBuscaEstudio, setModalBuscaYtEstudio, setModalBibEstudio, inicializarBiblioteca, inicializarBibliotecaLrc } = props;

  return (
    <Modal visible={modalOrigemMusica} transparent={true} animationType="fade">
      <View style={styles.modalCenterOverlay}>
        <View style={styles.qualidadeBox}>
          <Ionicons name="musical-notes" size={40} color="#E50914" style={{marginBottom: 10}}/>
          <Text style={styles.qualidadeTitle}>Importar Música</Text>
          <Text style={styles.qualidadeSubtitle}>De onde você quer puxar o áudio?</Text>
          
          <TouchableOpacity style={styles.btnDestinoCelular} onPress={escolherMusicaLocal}>
            <Ionicons name="folder" size={20} color="#FFF" style={{marginRight: 10}}/>
            <Text style={styles.qualidadeBtnText}>Memória Interna</Text>
          </TouchableOpacity>
    
          <TouchableOpacity style={[styles.btnDestinoCelular, {backgroundColor: '#E50914', marginTop: 10}]} onPress={() => { setModalOrigemMusica(false); setFonteBuscaEstudio('youtube'); setModalBuscaYtEstudio(true); }}>
            <Ionicons name="logo-youtube" size={20} color="#FFF" style={{marginRight: 10}}/>
            <Text style={styles.qualidadeBtnText}>Buscar no YouTube</Text>
          </TouchableOpacity>
    
          {/* NOVO: BOTÃO SOUNDCLOUD */}
          <TouchableOpacity style={[styles.btnDestinoCelular, {backgroundColor: '#FF5500', marginTop: 10}]} onPress={() => { setModalOrigemMusica(false); setFonteBuscaEstudio('soundcloud'); setModalBuscaYtEstudio(true); }}>
            <Ionicons name="cloud" size={20} color="#FFF" style={{marginRight: 10}}/>
            <Text style={styles.qualidadeBtnText}>Buscar no SoundCloud</Text>
          </TouchableOpacity>
    
          {/* NOVOS BOTÕES: BIBLIOTECAS */}
          <TouchableOpacity style={[styles.btnDestinoCelular, {backgroundColor: '#FFCA28', marginTop: 10}]} onPress={() => { setModalOrigemMusica(false); setModalBibEstudio('local'); inicializarBiblioteca(); }}>
            <Ionicons name="library" size={20} color="#000" style={{marginRight: 10}}/>
            <Text style={[styles.qualidadeBtnText, {color: '#000'}]}>Biblioteca Local</Text>
          </TouchableOpacity>
    
          <TouchableOpacity style={[styles.btnDestinoCelular, {backgroundColor: '#FF9800', marginTop: 10}]} onPress={() => { setModalOrigemMusica(false); setModalBibEstudio('lrc'); inicializarBibliotecaLrc(); }}>
            <Ionicons name="musical-notes" size={20} color="#FFF" style={{marginRight: 10}}/>
            <Text style={styles.qualidadeBtnText}>Biblioteca LRC</Text>
          </TouchableOpacity>
    
          <TouchableOpacity style={styles.qualidadeCancelarBtn} onPress={() => setModalOrigemMusica(false)}>
            <Text style={styles.qualidadeCancelarText}>Cancelar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}
