import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { styles } from '../../styles/indexStyles';
import { Ionicons } from '@expo/vector-icons';
import { useSettings } from '../../context/SettingsContext';

// Usamos os nomes exatos que o seu index.tsx está enviando
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
  
  // Puxa as funções globais do nosso sistema de Zoom
  const { zoomLevel, aumentarZoom, diminuirZoom, resetarZoom } = useSettings();

  return (
    <Modal visible={visivel} transparent={true} animationType="slide">
      <View style={styles.modalCenterOverlay}>
        <View style={[styles.destinoBox, {width: '90%', maxWidth: 500}]}>
          
          {/* CABEÇALHO COM O BOTÃO DE FECHAR (CORRIGIDO) */}
          <View style={{flexDirection: 'row', alignItems: 'center', marginBottom: 20, justifyContent: 'space-between', width: '100%'}}>
            <View style={{flexDirection: 'row', alignItems: 'center'}}>
              <Ionicons name="settings" size={28} color="#FFF" style={{marginRight: 10}}/>
              <Text style={styles.qualidadeTitle}>Configurações</Text>
            </View>
            <TouchableOpacity onPress={fecharModal} style={{padding: 5}}>
              <Ionicons name="close" size={28} color="#A0A0A0" />
            </TouchableOpacity>
          </View>

          {/* === PAINEL DE ZOOM === */}
          <Text style={[styles.qualidadeSubtitle, { marginTop: 0, marginBottom: 10 }]}>Tamanho do Layout (Zoom)</Text>
          
          <View style={localStyles.zoomContainer}>
            <TouchableOpacity style={localStyles.zoomBtn} onPress={diminuirZoom}>
              <Ionicons name="remove" size={24} color="#FFF" />
            </TouchableOpacity>

            <TouchableOpacity style={localStyles.zoomDisplay} onPress={resetarZoom}>
              <Text style={localStyles.zoomText}>{Math.round(zoomLevel * 100)}%</Text>
              <Text style={localStyles.zoomSubtext}>Toque para Resetar</Text>
            </TouchableOpacity>

            <TouchableOpacity style={localStyles.zoomBtn} onPress={aumentarZoom}>
              <Ionicons name="add" size={24} color="#FFF" />
            </TouchableOpacity>
          </View>
          {/* ======================= */}

          {/* === PAINEL DE INTELIGÊNCIA ARTIFICIAL === */}
          <Text style={[styles.qualidadeSubtitle, { marginTop: 25, marginBottom: 10 }]}>Motor de IA para Separação de Áudio</Text>

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

          {/* BOTÃO DE FECHAR INFERIOR (CORRIGIDO) */}
          <TouchableOpacity style={[styles.qualidadeCancelarBtn, {marginTop: 15}]} onPress={fecharModal}>
            <Text style={styles.qualidadeCancelarText}>Salvar e Fechar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

// Estilos específicos para os botões de Zoom
const localStyles = StyleSheet.create({
  zoomContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1E1E1E',
    borderRadius: 15,
    padding: 10,
    borderWidth: 1,
    borderColor: '#333',
    width: '100%'
  },
  zoomBtn: {
    backgroundColor: '#2A2A2A',
    padding: 10,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    width: 50,
    height: 50,
  },
  zoomDisplay: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  zoomText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  zoomSubtext: {
    color: '#E50914',
    fontSize: 10,
    marginTop: 2,
    fontWeight: 'bold'
  }
});