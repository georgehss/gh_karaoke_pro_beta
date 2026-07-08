import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Keyboard, View, Text, TouchableOpacity, Modal, TextInput, ScrollView, FlatList, ActivityIndicator, Image, Platform, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { styles } from '../../styles/indexStyles';

export default function ModalPastasPro(props: any) {
  const { modalPastasPro, setModalPastasPro, pastas, pastasVirtuaisWeb, adicionarPastaNaPlaylist } = props;

  return (
    <Modal visible={modalPastasPro} transparent={true} animationType="slide">
      <View style={styles.modalCenterOverlay}>
        <View style={styles.destinoBox}>
          <Text style={styles.qualidadeTitle}>Adicionar à Fila</Text>
          <Text style={styles.qualidadeSubtitle}>Escolha uma pasta da Biblioteca Local</Text>
          <ScrollView style={styles.destinoPastasScroll}>
            {(pastas.length === 0 && Object.keys(pastasVirtuaisWeb).length === 0) ? (
              <Text style={{color: '#777', textAlign: 'center', marginTop: 10}}>Nenhuma pasta criada na Biblioteca Local.</Text>
            ) : (
              pastas.map((pasta: string) => (
              <TouchableOpacity key={pasta} style={styles.btnDestinoPasta} onPress={() => adicionarPastaNaPlaylist(pasta)}>
                <Ionicons name="folder" size={20} color="#FFCA28" style={{marginRight: 10}}/>
                <Text style={styles.qualidadeBtnText}>{pasta}</Text>
              </TouchableOpacity>
              ))
            )}
          </ScrollView>
          <TouchableOpacity style={styles.qualidadeCancelarBtn} onPress={() => setModalPastasPro(false)}><Text style={styles.qualidadeCancelarText}>Cancelar</Text></TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}
