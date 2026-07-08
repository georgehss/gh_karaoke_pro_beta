import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Keyboard, View, Text, TouchableOpacity, Modal, TextInput, ScrollView, FlatList, ActivityIndicator, Image, Platform, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { styles } from '../../styles/indexStyles';

export default function ModalSalvarFila(props: any) {
  const { modalSalvarFila, setModalSalvarFila, nomeFilaSalva, setNomeFilaSalva, salvarFilaAtual, exportarFilaComoArquivo } = props;

  return (
    <Modal visible={modalSalvarFila} transparent={true} animationType="fade">
      <View style={styles.modalCenterOverlay}>
        <View style={styles.qualidadeBox}>
          <Text style={styles.qualidadeTitle}>Salvar Playlist</Text>
          <Text style={styles.qualidadeSubtitle}>Dê um nome para guardar a fila atual</Text>
          <TextInput style={styles.inputPasta} placeholder="Ex: Festa Sertanejo" placeholderTextColor="#777" value={nomeFilaSalva} onChangeText={setNomeFilaSalva} autoFocus />
          
          <View style={{width: '100%', marginTop: 20}}>
            {/* Botão Antigo: Salva escondido dentro do app */}
            <TouchableOpacity style={[styles.btnDestinoCelular, {backgroundColor: '#4CAF50', marginBottom: 10}]} onPress={salvarFilaAtual}>
              <Ionicons name="save" size={20} color="#FFF" style={{marginRight: 10}}/>
              <Text style={styles.qualidadeBtnText}>Salvar no App (Interno)</Text>
            </TouchableOpacity>
    
            {/* Botão Novo: Salva um arquivo físico */}
            <TouchableOpacity style={[styles.btnDestinoCelular, {backgroundColor: '#2196F3'}]} onPress={exportarFilaComoArquivo}>
              <Ionicons name="download" size={20} color="#FFF" style={{marginRight: 10}}/>
              <Text style={styles.qualidadeBtnText}>Exportar Arquivo (.json)</Text>
            </TouchableOpacity>
    
            <TouchableOpacity style={[styles.qualidadeCancelarBtn, {alignItems: 'center', marginTop: 15}]} onPress={() => setModalSalvarFila(false)}>
              <Text style={styles.qualidadeCancelarText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
