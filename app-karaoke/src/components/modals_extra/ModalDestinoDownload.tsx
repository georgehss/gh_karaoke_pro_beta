import React from 'react';
import { Modal, View, Text, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { styles } from '../../styles/indexStyles';

export default function ModalDestinoDownload(props: any) {
  const { visivel, onClose, config, pastas, pastasVirtuaisWeb, executarDownload } = props;

  if (!visivel) return null;

  return (
    <Modal visible={visivel} transparent={true} animationType="slide">
      <View style={styles.modalCenterOverlay}>
        <View style={styles.destinoBox}>
          <Text style={styles.qualidadeTitle}>Onde deseja salvar?</Text>
          <Text style={styles.qualidadeSubtitle} numberOfLines={2}>{config?.titulo}</Text>
          
          <TouchableOpacity style={styles.btnDestinoCelular} onPress={() => executarDownload('dispositivo')}>
            <Ionicons name="phone-portrait" size={20} color="#FFF" style={{marginRight: 10}}/>
            <Text style={styles.qualidadeBtnText}>Armazenamento do Celular</Text>
          </TouchableOpacity>

          <Text style={styles.divisorDestino}>--- OU NA BIBLIOTECA LOCAL ---</Text>

          <ScrollView style={styles.destinoPastasScroll}>
            {(pastas.length === 0 && Object.keys(pastasVirtuaisWeb || {}).length === 0) ? (
              <Text style={{color: '#777', textAlign: 'center', marginTop: 10}}>Nenhuma pasta criada na Biblioteca Local.</Text>
            ) : (
              <>
                {pastas.map((pasta: any) => (
                  <TouchableOpacity key={pasta} style={styles.btnDestinoPasta} onPress={() => executarDownload('biblioteca', pasta)}>
                    <Ionicons name="folder" size={20} color="#FFCA28" style={{marginRight: 10}}/>
                    <Text style={styles.qualidadeBtnText}>{pasta}</Text>
                  </TouchableOpacity>
                ))}

                {Platform.OS === 'web' && pastasVirtuaisWeb && Object.keys(pastasVirtuaisWeb).map((pasta: any) => (
                  <TouchableOpacity key={pasta} style={styles.btnDestinoPasta} onPress={() => executarDownload('biblioteca', pasta)}>
                    <Ionicons name="folder" size={20} color="#4CAF50" style={{marginRight: 10}}/>
                    <Text style={styles.qualidadeBtnText}>{pasta} (Web)</Text>
                  </TouchableOpacity>
                ))}
              </>
            )}
          </ScrollView>

          <TouchableOpacity style={styles.qualidadeCancelarBtn} onPress={onClose}><Text style={styles.qualidadeCancelarText}>Cancelar</Text></TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}