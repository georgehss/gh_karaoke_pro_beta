import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Keyboard, View, Text, TouchableOpacity, Modal, TextInput, ScrollView, FlatList, ActivityIndicator, Image, Platform, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { styles } from '../../styles/indexStyles';

export default function ModalPastasLrc(props: any) {
  const { modalPastasLrc, setModalPastasLrc, pastasLrc, construirPlaylistLrcDaPasta } = props;

  return (
    <Modal visible={modalPastasLrc} transparent={true} animationType="slide">
      <View style={styles.modalCenterOverlay}>
        <View style={styles.destinoBox}>
          <Text style={styles.qualidadeTitle}>Tocar Gênero</Text>
          <Text style={styles.qualidadeSubtitle}>Escolha uma pasta da sua biblioteca</Text>
          <ScrollView style={styles.destinoPastasScroll}>
            {pastasLrc.length === 0 ? (
              <Text style={{color: '#777', textAlign: 'center', marginTop: 10}}>Crie uma pasta em "Biblioteca LRC" primeiro.</Text>
            ) : (
              pastasLrc.map((pasta: string) => (
              <TouchableOpacity key={pasta} style={styles.btnDestinoPasta} onPress={() => { 
                setModalPastasLrc(false);
                construirPlaylistLrcDaPasta(pasta);
              }}>
                <Ionicons name="folder" size={20} color="#FF9800" style={{marginRight: 10}}/>
                <Text style={styles.qualidadeBtnText}>{pasta}</Text>
              </TouchableOpacity>
              ))
            )}
          </ScrollView>
          <TouchableOpacity style={styles.qualidadeCancelarBtn} onPress={() => setModalPastasLrc(false)}><Text style={styles.qualidadeCancelarText}>Cancelar</Text></TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}
