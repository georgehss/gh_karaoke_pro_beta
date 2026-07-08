import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Keyboard, View, Text, TouchableOpacity, Modal, TextInput, ScrollView, FlatList, ActivityIndicator, Image, Platform, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { styles } from '../../styles/indexStyles';

export default function ModalAcaoYoutube(props: any) {
  const { modalAcaoYoutube, setModalAcaoYoutube, motorBusca, setReproducaoTemp, setUrlAudioExtraido, setIsPlaylistVisible, iniciarTocarYoutube, setModalQualidadeYt, adicionarNaPlaylist } = props;

  return (
    <Modal visible={!!modalAcaoYoutube} transparent={true} animationType="slide">
      <View style={styles.modalCenterOverlay}>
        <View style={styles.qualidadeBox}>
          <Ionicons name="logo-youtube" size={40} color="#E50914" style={{marginBottom: 10}}/>
          <Text style={styles.qualidadeSubtitle} numberOfLines={2}>{modalAcaoYoutube?.titulo}</Text>
          
          {/* BOTÃO: TOCAR AGORA */}
          <TouchableOpacity style={styles.qualidadeBtn} onPress={() => {
            if (modalAcaoYoutube) {
              if (motorBusca === 'interno') {
                setReproducaoTemp({ uri: modalAcaoYoutube.id, name: `[Tocando Agora] ${modalAcaoYoutube.titulo}`, isInterno: true });
                setUrlAudioExtraido(null);
                setIsPlaylistVisible(false);
              } else if (modalAcaoYoutube.source === 'soundcloud') {
                // MÁGICA 2: Se for SoundCloud, pula a escolha de qualidade e baixa direto (Áudio/320kbps)!
                iniciarTocarYoutube(modalAcaoYoutube.id, 'audio', modalAcaoYoutube.titulo, '320', 'mp3', 'tocar', 'soundcloud');
              } else {
                setModalQualidadeYt({ 
                  id: modalAcaoYoutube.id, 
                  titulo: modalAcaoYoutube.titulo, 
                  tipo: 'video', // YouTube padroniza para vídeo
                  acao: 'tocar', 
                  source: 'youtube' 
                });
              }
              setModalAcaoYoutube(null);
            }
          }}>
            <Text style={styles.qualidadeBtnText}>▶️ Tocar Agora (Sem Fila)</Text>
          </TouchableOpacity>
    
          {/* BOTÃO: ADICIONAR À FILA */}
          <TouchableOpacity style={styles.qualidadeBtnAudio} onPress={() => {
            if (modalAcaoYoutube) {
              if (motorBusca === 'interno') {
                adicionarNaPlaylist(modalAcaoYoutube.id, modalAcaoYoutube.titulo, true);
                alert("Adicionado à Lista de Reprodução!");
              } else if (modalAcaoYoutube.source === 'soundcloud') {
                // MÁGICA 3: Pula a escolha de qualidade e injeta o MP3 direto na Fila!
                iniciarTocarYoutube(modalAcaoYoutube.id, 'audio', modalAcaoYoutube.titulo, '320', 'mp3', 'fila', 'soundcloud');
              } else {
                setModalQualidadeYt({ 
                  id: modalAcaoYoutube.id, 
                  titulo: modalAcaoYoutube.titulo, 
                  tipo: 'video', // YouTube padroniza para vídeo
                  acao: 'fila', 
                  source: 'youtube' 
                });
              }
              setModalAcaoYoutube(null);
            }
          }}>
            <Text style={styles.qualidadeBtnText}>
              ➕ Adicionar à Fila ({modalAcaoYoutube?.source === 'soundcloud' ? 'Áudio' : 'Vídeo'})
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.qualidadeCancelarBtn} onPress={() => setModalAcaoYoutube(null)}>
            <Text style={styles.qualidadeCancelarText}>Cancelar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}
