import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Keyboard, View, Text, TouchableOpacity, Modal, TextInput, ScrollView, FlatList, ActivityIndicator, Image, Platform, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { styles } from '../../styles/indexStyles';

interface ModalRenomearFilaState {
  name: string;
}

export default function ModalRenomearFila(props: any) {
  const { modalRenomearFila, setModalRenomearFila, salvarRenomearFila } = props;

  return (
    <Modal visible={!!modalRenomearFila} transparent={true} animationType="fade">
      <View style={styles.modalCenterOverlay}>
        <View style={styles.qualidadeBox}>
          <Text style={styles.qualidadeTitle}>Renomear Arquivo</Text>
            <TextInput style={styles.inputPasta} value={modalRenomearFila?.name || ''} onChangeText={(text: string) => setModalRenomearFila((prev: ModalRenomearFilaState | null) => prev ? {...prev, name: text} : null)} autoFocus />
          <View style={{flexDirection: 'row', gap: 15, marginTop: 20}}>
            <TouchableOpacity style={styles.qualidadeCancelarBtn} onPress={() => setModalRenomearFila(null)}><Text style={styles.qualidadeCancelarText}>Cancelar</Text></TouchableOpacity>
            <TouchableOpacity style={styles.btnSalvarPasta} onPress={salvarRenomearFila}><Text style={styles.btnSalvarPastaText}>Salvar</Text></TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
