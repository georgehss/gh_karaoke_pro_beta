import React from 'react';
import { Modal, View, Text, TouchableOpacity, ScrollView, Platform } from 'react-native';
import Slider from '@react-native-community/slider';
import { Ionicons } from '@expo/vector-icons';
import { styles } from '../../styles/indexStyles';

interface ModalMixerProps {
  visivel: boolean;
  onMinimizar: () => void;
  micAtivo: boolean;
  alternarMicrofone: () => void;
  micDevices: { label: string; deviceId: string }[];
  selectedMicId: string | null;
  setSelectedMicId: (id: string | null) => void;
  mostrarInterfaces: boolean;
  setMostrarInterfaces: (mostrar: boolean) => void;
  volMic: number;
  setVolMic: (vol: number) => void;
  reverbNivel: number;
  setReverbNivel: (nivel: number) => void;
  reverbTempo: number;
  setReverbTempo: (tempo: number) => void;
  echoNivel: number;
  setEchoNivel: (nivel: number) => void;
  echoTempo: number;
  setEchoTempo: (tempo: number) => void;
  echoFeedback: number;
  setEchoFeedback: (feedback: number) => void;
  graveNivel: number;
  setGraveNivel: (nivel: number) => void;
  medioNivel: number;
  setMedioNivel: (nivel: number) => void;
  agudoNivel: number;
  setAgudoNivel: (nivel: number) => void;
}

export default function ModalMixer({
  visivel,
  onMinimizar,
  micAtivo,
  alternarMicrofone,
  micDevices,
  selectedMicId,
  setSelectedMicId,
  mostrarInterfaces,
  setMostrarInterfaces,
  volMic,
  setVolMic,
  reverbNivel,
  setReverbNivel,
  reverbTempo,
  setReverbTempo,
  echoNivel,
  setEchoNivel,
  echoTempo,
  setEchoTempo,
  echoFeedback,
  setEchoFeedback,
  graveNivel,
  setGraveNivel,
  medioNivel,
  setMedioNivel,
  agudoNivel,
  setAgudoNivel,
}: ModalMixerProps) {
  return (
    <Modal visible={visivel} transparent={true} animationType="slide">
      <View style={styles.modalCenterOverlay}>
        <View style={[styles.destinoBox, { maxHeight: '90%' }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 5 }}>
            <Ionicons name="mic" size={28} color="#4CAF50" style={{ marginRight: 10 }} />
            <Text style={styles.qualidadeTitle}>Mixer ao Vivo</Text>
          </View>
          <Text style={styles.qualidadeSubtitle}>Ligue o microfone e ajuste sua voz (Web)</Text>

          <TouchableOpacity 
            style={[styles.btnDestinoCelular, { backgroundColor: micAtivo ? '#E50914' : '#4CAF50', marginBottom: 20 }]} 
            onPress={alternarMicrofone}
          >
            <Ionicons name={micAtivo ? "mic-off" : "mic"} size={20} color="#FFF" style={{ marginRight: 10 }} />
            <Text style={styles.qualidadeBtnText}>{micAtivo ? "Desligar Microfone" : "Ligar Microfone (Ouvir Retorno)"}</Text>
          </TouchableOpacity>

          {Platform.OS === 'web' && micDevices.length > 0 && (
            <View style={{ width: '100%', marginBottom: 15, backgroundColor: 'rgba(255, 255, 255, 0.05)', borderRadius: 8, padding: 10 }}>
              <TouchableOpacity 
                style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }} 
                onPress={() => setMostrarInterfaces(!mostrarInterfaces)}
              >
                <Text style={[styles.metaLabel, { marginBottom: 0, color: '#FFF' }]}>
                  🎤 Mudar Interface de Áudio
                </Text>
                <Ionicons name={mostrarInterfaces ? "chevron-up" : "chevron-down"} size={20} color="#FFF" />
              </TouchableOpacity>

              {mostrarInterfaces && (
                <View style={{ maxHeight: 120, backgroundColor: '#1E1E1E', borderRadius: 8, padding: 5, marginTop: 10 }}>
                  <ScrollView nestedScrollEnabled={true}>
                    {micDevices.map((device) => (
                      <TouchableOpacity
                        key={device.deviceId}
                        style={{
                          paddingVertical: 10,
                          paddingHorizontal: 15,
                          borderBottomWidth: 1,
                          borderBottomColor: '#333',
                          backgroundColor: selectedMicId === device.deviceId ? 'rgba(76, 175, 80, 0.2)' : 'transparent'
                        }}
                        onPress={() => {
                          setSelectedMicId(device.deviceId);
                          setMostrarInterfaces(false);
                          if (micAtivo) alert("⚠️ Desligue e ligue o microfone novamente para aplicar a mudança de interface.");
                        }}
                      >
                        <Text style={{ color: selectedMicId === device.deviceId ? '#4CAF50' : '#FFF', fontSize: 13, fontWeight: selectedMicId === device.deviceId ? 'bold' : 'normal' }}>
                          {device.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}
            </View>
          )}

          <ScrollView style={{ width: '100%' }} showsVerticalScrollIndicator={false}>
            <View style={styles.metaInputGroup}>
              <Text style={styles.metaLabel}>🎙️ Volume do Microfone: {Math.round(volMic * 100)}%</Text>
              <Slider style={{ width: '100%', height: 40 }} minimumValue={0} maximumValue={2} value={volMic} onValueChange={setVolMic} minimumTrackTintColor="#4CAF50" maximumTrackTintColor="#555" thumbTintColor="#4CAF50" />
            </View>

            <View style={[styles.metaInputGroup, { backgroundColor: 'rgba(156, 39, 176, 0.1)', padding: 10, borderRadius: 8 }]}>
              <Text style={{ color: '#9C27B0', fontWeight: 'bold', marginBottom: 5 }}>⛪ REVERB (SALÃO)</Text>
              <Text style={styles.metaLabel}>Volume do Reverb: {Math.round(reverbNivel * 100)}%</Text>
              <Slider style={{ width: '100%', height: 40 }} minimumValue={0} maximumValue={1.5} value={reverbNivel} onValueChange={setReverbNivel} minimumTrackTintColor="#9C27B0" maximumTrackTintColor="#555" thumbTintColor="#9C27B0" />
              
              <Text style={styles.metaLabel}>Tamanho da Sala: {reverbTempo.toFixed(1)}s</Text>
              <Slider style={{ width: '100%', height: 40 }} minimumValue={0.1} maximumValue={5.0} value={reverbTempo} onValueChange={setReverbTempo} minimumTrackTintColor="#BA68C8" maximumTrackTintColor="#555" thumbTintColor="#BA68C8" />
            </View>

            <View style={[styles.metaInputGroup, { backgroundColor: 'rgba(33, 150, 243, 0.1)', padding: 10, borderRadius: 8 }]}>
              <Text style={{ color: '#2196F3', fontWeight: 'bold', marginBottom: 5 }}>⛰️ ECO (DELAY)</Text>
              <Text style={styles.metaLabel}>Volume do Eco: {Math.round(echoNivel * 100)}%</Text>
              <Slider style={{ width: '100%', height: 40 }} minimumValue={0} maximumValue={1} value={echoNivel} onValueChange={setEchoNivel} minimumTrackTintColor="#2196F3" maximumTrackTintColor="#555" thumbTintColor="#2196F3" />
              
              <Text style={styles.metaLabel}>Velocidade do Eco: {Math.round(echoTempo * 1000)}ms</Text>
              <Slider style={{ width: '100%', height: 40 }} minimumValue={0.1} maximumValue={1.5} value={echoTempo} onValueChange={setEchoTempo} minimumTrackTintColor="#64B5F6" maximumTrackTintColor="#555" thumbTintColor="#64B5F6" />
              
              <Text style={styles.metaLabel}>Repetições (Feedback): {Math.round(echoFeedback * 100)}%</Text>
              <Slider style={{ width: '100%', height: 40 }} minimumValue={0} maximumValue={0.85} value={echoFeedback} onValueChange={setEchoFeedback} minimumTrackTintColor="#90CAF9" maximumTrackTintColor="#555" thumbTintColor="#90CAF9" />
            </View>
            
            <View style={[styles.metaInputGroup, { backgroundColor: 'rgba(255, 152, 0, 0.1)', padding: 10, borderRadius: 8, marginTop: 10 }]}>
              <Text style={{ color: '#FF9800', fontWeight: 'bold', marginBottom: 5 }}>🎛️ EQUALIZADOR</Text>
              <Text style={styles.metaLabel}>🔉 Graves (Bass): {graveNivel > 0 ? '+' : ''}{Math.round(graveNivel)} dB</Text>
              <Slider style={{ width: '100%', height: 40 }} minimumValue={-20} maximumValue={20} value={graveNivel} onValueChange={setGraveNivel} minimumTrackTintColor="#FF9800" maximumTrackTintColor="#555" thumbTintColor="#FF9800" />

              <Text style={styles.metaLabel}>🗣️ Médios (Mid): {medioNivel > 0 ? '+' : ''}{Math.round(medioNivel)} dB</Text>
              <Slider style={{ width: '100%', height: 40 }} minimumValue={-20} maximumValue={20} value={medioNivel} onValueChange={setMedioNivel} minimumTrackTintColor="#FFC107" maximumTrackTintColor="#555" thumbTintColor="#FFC107" />
              
              <Text style={styles.metaLabel}>🔊 Agudos (Treble): {agudoNivel > 0 ? '+' : ''}{Math.round(agudoNivel)} dB</Text>
              <Slider style={{ width: '100%', height: 40 }} minimumValue={-20} maximumValue={20} value={agudoNivel} onValueChange={setAgudoNivel} minimumTrackTintColor="#E50914" maximumTrackTintColor="#555" thumbTintColor="#E50914" />
            </View>
          </ScrollView>

          <TouchableOpacity style={styles.qualidadeCancelarBtn} onPress={onMinimizar}>
            <Text style={styles.qualidadeCancelarText}>Minimizar Mixer</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}