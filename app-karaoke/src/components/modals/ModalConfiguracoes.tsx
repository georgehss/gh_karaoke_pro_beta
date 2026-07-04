import React from 'react';
import { Modal, View, Text, TouchableOpacity } from 'react-native';
import { styles } from '../../styles/indexStyles';
import { Ionicons } from '@expo/vector-icons';

// 1. Definimos quais variáveis e funções este modal precisa receber do index.tsx
interface ModalConfiguracoesProps {
  visivel: boolean;
  fecharModal: () => void;
  modeloIA: 'fadr' | 'replicate' | 'local';
  setModeloIA: (modelo: 'fadr' | 'replicate' | 'local') => void;
}

export default function ModalConfiguracoes({ 
  visivel, 
  fecharModal, 
  modeloIA, 
  setModeloIA 
}: ModalConfiguracoesProps) {
  
  return (
    <Modal visible={visivel} transparent={true} animationType="slide">
      <View style={styles.modalCenterOverlay}>
        <View style={[styles.destinoBox, {width: '90%'}]}>
          <View style={{flexDirection: 'row', alignItems: 'center', marginBottom: 20}}>
            <Ionicons name="settings" size={28} color="#FFF" style={{marginRight: 10}}/>
            <Text style={styles.qualidadeTitle}>Configurações</Text>
          </View>

          <Text style={styles.qualidadeSubtitle}>Motor de IA para Separação de Áudio</Text>

          {/* OPÇÃO 1: FADR */}
          <TouchableOpacity
            style={[styles.btnDestinoPasta, modeloIA === 'fadr' && {backgroundColor: 'rgba(229, 9, 20, 0.2)', borderColor: '#E50914', borderWidth: 1}]}
            onPress={() => setModeloIA('fadr')}
          >
            <Ionicons name="cloud" size={24} color={modeloIA === 'fadr' ? "#E50914" : "#A0A0A0"} style={{marginRight: 15}}/>
            <View style={{flex: 1}}>
              <Text style={[styles.qualidadeBtnText, modeloIA === 'fadr' && {color: '#E50914'}]}>FADR (Nuvem)</Text>
              <Text style={{color: '#777', fontSize: 11}}>Equilíbrio entre qualidade e velocidade.</Text>
            </View>
            {modeloIA === 'fadr' && <Ionicons name="checkmark-circle" size={20} color="#E50914" />}
          </TouchableOpacity>

          {/* OPÇÃO 2: REPLICATE */}
          <TouchableOpacity
            style={[styles.btnDestinoPasta, modeloIA === 'replicate' && {backgroundColor: 'rgba(33, 150, 243, 0.2)', borderColor: '#2196F3', borderWidth: 1}]}
            onPress={() => setModeloIA('replicate')}
          >
            <Ionicons name="hardware-chip" size={24} color={modeloIA === 'replicate' ? "#2196F3" : "#A0A0A0"} style={{marginRight: 15}}/>
            <View style={{flex: 1}}>
              <Text style={[styles.qualidadeBtnText, modeloIA === 'replicate' && {color: '#2196F3'}]}>Replicate (GPUs Nuvem)</Text>
              <Text style={{color: '#777', fontSize: 11}}>Separação ultra-rápida de alta fidelidade.</Text>
            </View>
            {modeloIA === 'replicate' && <Ionicons name="checkmark-circle" size={20} color="#2196F3" />}
          </TouchableOpacity>

          {/* OPÇÃO 3: DEMUCS LOCAL */}
          <TouchableOpacity
            style={[styles.btnDestinoPasta, modeloIA === 'local' && {backgroundColor: 'rgba(76, 175, 80, 0.2)', borderColor: '#4CAF50', borderWidth: 1}]}
            onPress={() => setModeloIA('local')}
          >
            <Ionicons name="laptop" size={24} color={modeloIA === 'local' ? "#4CAF50" : "#A0A0A0"} style={{marginRight: 15}}/>
            <View style={{flex: 1}}>
              <Text style={[styles.qualidadeBtnText, modeloIA === 'local' && {color: '#4CAF50'}]}>Demucs (Servidor Local)</Text>
              <Text style={{color: '#777', fontSize: 11}}>Processado na sua própria máquina (Grátis).</Text>
            </View>
            {modeloIA === 'local' && <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />}
          </TouchableOpacity>

          <TouchableOpacity style={[styles.qualidadeCancelarBtn, {marginTop: 20}]} onPress={fecharModal}>
            <Text style={styles.qualidadeCancelarText}>Salvar e Fechar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}