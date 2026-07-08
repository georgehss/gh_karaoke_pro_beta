import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Keyboard, View, Text, TouchableOpacity, Modal, TextInput, ScrollView, FlatList, ActivityIndicator, Image, Platform, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { styles } from '../../styles/indexStyles';

export default function ModalSyncMassa(props: any) {
  const { modalSyncMassa, setModalSyncMassa, valorSyncMassa, setValorSyncMassa, aplicarSyncEmMassa } = props;

  return (
    <Modal visible={modalSyncMassa} transparent={true} animationType="fade">
      <View style={styles.modalCenterOverlay}>
        <View style={styles.qualidadeBox}>
          <Ionicons name="time" size={40} color="#2196F3" style={{marginBottom: 10}}/>
          <Text style={styles.qualidadeTitle}>Ajuste Global (Offset)</Text>
          <Text style={styles.qualidadeSubtitle}>Adicione ou subtraia segundos de TODAS as linhas da letra de uma vez.</Text>
          
          <TextInput 
            style={[styles.inputPasta, {textAlign: 'center', fontSize: 20, fontWeight: 'bold'}]} 
            placeholder="Ex: 1.5 ou -2.0" 
            placeholderTextColor="#777" 
            keyboardType="numbers-and-punctuation"
            value={valorSyncMassa} 
            onChangeText={setValorSyncMassa} 
          />
          <Text style={{color: '#A0A0A0', fontSize: 12, marginTop: 5, textAlign: 'center'}}>
            Use o sinal de menos (-) para adiantar a letra (tocar mais cedo).
          </Text>
    
          <View style={{flexDirection: 'row', gap: 15, marginTop: 20}}>
            <TouchableOpacity style={styles.qualidadeCancelarBtn} onPress={() => { setModalSyncMassa(false); setValorSyncMassa(''); }}>
              <Text style={styles.qualidadeCancelarText}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.btnSalvarPasta, {backgroundColor: '#2196F3'}]} onPress={aplicarSyncEmMassa}>
              <Text style={styles.btnSalvarPastaText}>Aplicar Ajuste</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
