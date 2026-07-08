import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Keyboard, View, Text, TouchableOpacity, Modal, TextInput, ScrollView, FlatList, ActivityIndicator, Image, Platform, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { styles } from '../../styles/indexStyles';

export default function ModalCarregarFila(props: any) {
  const { modalCarregarFila, setModalCarregarFila, importarFilaDeArquivo, listasSalvas, carregarFilaSelecionada, apagarFilaSalva } = props;

  return (
    <Modal visible={modalCarregarFila} transparent={true} animationType="slide">
      <View style={styles.modalCenterOverlay}>
        <View style={[styles.destinoBox, {maxHeight: '80%', width: '90%'}]}>
          <Text style={styles.qualidadeTitle}>Playlists Salvas</Text>
    
          {/* BOTÃO NOVO DE IMPORTAR FÍSICO */}
          <TouchableOpacity style={[styles.btnDestinoCelular, {backgroundColor: '#2196F3', marginBottom: 15, paddingVertical: 12}]} onPress={importarFilaDeArquivo}>
              <Ionicons name="document-text" size={20} color="#FFF" style={{marginRight: 10}}/>
              <Text style={styles.qualidadeBtnText}>Importar Arquivo (.json)</Text>
          </TouchableOpacity>
    
          <Text style={styles.qualidadeSubtitle}>Ou carregue das suas listas internas:</Text>
    
          <ScrollView style={styles.destinoPastasScroll}>
            {listasSalvas.length === 0 ? (
              <Text style={{color: '#777', textAlign: 'center', marginTop: 10}}>Nenhuma playlist salva ainda.</Text>
            ) : (
              listasSalvas.map((lista: string) => (
              <View key={lista} style={styles.arquivoRow}>
                <TouchableOpacity style={styles.arquivoInfo} onPress={() => carregarFilaSelecionada(lista)}>
                <Ionicons name="list" size={24} color="#FFCA28" />
                <Text style={styles.arquivoName} numberOfLines={1}>{lista}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={{padding: 10}} onPress={() => apagarFilaSalva(lista)}>
                <Ionicons name="trash" size={20} color="#E50914" />
                </TouchableOpacity>
              </View>
              ))
            )}
          </ScrollView>
          <TouchableOpacity style={styles.qualidadeCancelarBtn} onPress={() => setModalCarregarFila(false)}>
            <Text style={styles.qualidadeCancelarText}>Fechar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}
