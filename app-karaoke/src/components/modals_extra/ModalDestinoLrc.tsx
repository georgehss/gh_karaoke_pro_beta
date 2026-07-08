import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Keyboard, View, Text, TouchableOpacity, Modal, TextInput, ScrollView, FlatList, ActivityIndicator, Image, Platform, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { styles } from '../../styles/indexStyles';

export default function ModalDestinoLrc(props: any) {
  const { modalDestinoLrc, setModalDestinoLrc, executarDownloadDestinoLRC, pastasLrc } = props;

  return (
    <Modal visible={!!modalDestinoLrc} transparent={true} animationType="slide">
      <View style={styles.modalCenterOverlay}>
        <View style={styles.destinoBox}>
          <Text style={styles.qualidadeTitle}>Salvar arquivo .LRC</Text>
          <Text style={styles.qualidadeSubtitle} numberOfLines={1}>{modalDestinoLrc?.nomeFinal}</Text>
          
          <TouchableOpacity style={styles.btnDestinoCelular} onPress={() => executarDownloadDestinoLRC('dispositivo')}>
            <Ionicons name="phone-portrait" size={20} color="#FFF" style={{marginRight: 10}}/>
            <Text style={styles.qualidadeBtnText}>Compartilhar / Dispositivo</Text>
          </TouchableOpacity>
    
          <Text style={styles.divisorDestino}>--- OU NA BIBLIOTECA LRC ---</Text>
    
          <ScrollView style={styles.destinoPastasScroll}>
            {pastasLrc.length === 0 ? (
              <Text style={{color: '#777', textAlign: 'center', marginTop: 10}}>Crie uma pasta em "Biblioteca LRC" primeiro.</Text>
            ) : (
              pastasLrc.map((pasta: string) => (
              <TouchableOpacity key={pasta} style={styles.btnDestinoPasta} onPress={() => executarDownloadDestinoLRC('biblioteca', pasta)}>
                <Ionicons name="folder" size={20} color="#FF9800" style={{marginRight: 10}}/>
                <Text style={styles.qualidadeBtnText}>Salvar em: {pasta}</Text>
              </TouchableOpacity>
              ))
            )}
          </ScrollView>
    
          <TouchableOpacity style={styles.qualidadeCancelarBtn} onPress={() => setModalDestinoLrc(null)}><Text style={styles.qualidadeCancelarText}>Cancelar</Text></TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}
