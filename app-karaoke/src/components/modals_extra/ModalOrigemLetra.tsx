import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Keyboard, View, Text, TouchableOpacity, Modal, TextInput, ScrollView, FlatList, ActivityIndicator, Image, Platform, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { styles } from '../../styles/indexStyles';

export default function ModalOrigemLetra(props: any) {
  const { modalOrigemLetra, setModalOrigemLetra, escolherLetraLocal, setModalBibLetraLrc, inicializarBibliotecaLrc } = props;

  return (
    <Modal visible={modalOrigemLetra} transparent={true} animationType="fade">
      <View style={styles.modalCenterOverlay}>
        <View style={styles.qualidadeBox}>
          <Ionicons name="document-text" size={40} color="#FF9800" style={{marginBottom: 10}}/>
          <Text style={styles.qualidadeTitle}>Importar Letra</Text>
          <Text style={styles.qualidadeSubtitle}>De onde você quer puxar o texto?</Text>
          
          <TouchableOpacity style={[styles.btnDestinoCelular, {backgroundColor: '#2196F3'}]} onPress={escolherLetraLocal}>
            <Ionicons name="folder" size={20} color="#FFF" style={{marginRight: 10}}/>
            <Text style={styles.qualidadeBtnText}>Memória Interna</Text>
          </TouchableOpacity>
    
          <TouchableOpacity style={[styles.btnDestinoCelular, {backgroundColor: '#FF9800', marginTop: 10}]} onPress={() => { setModalOrigemLetra(false); setModalBibLetraLrc(true); inicializarBibliotecaLrc(); }}>
            <Ionicons name="library" size={20} color="#FFF" style={{marginRight: 10}}/>
            <Text style={styles.qualidadeBtnText}>Biblioteca LRC</Text>
          </TouchableOpacity>
    
          <TouchableOpacity style={styles.qualidadeCancelarBtn} onPress={() => setModalOrigemLetra(false)}>
            <Text style={styles.qualidadeCancelarText}>Cancelar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}
