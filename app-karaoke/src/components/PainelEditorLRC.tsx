import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, FlatList, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import { styles } from '../styles/indexStyles'; // Ajuste o caminho se necessário

interface PainelEditorLRCProps {
  isModoCriador: boolean;
  setIsModoCriador: (val: boolean) => void;
  setModalSyncMassa: (val: boolean) => void;
  abrirModalSalvarLRC: () => void;
  linhasSync: {tempo: number | null, texto: string}[];
  indiceCriador: number;
  ajustarTempoLinha: (index: number, delta: number) => void;
  formatarTempoMs: (tempo: number | null) => string;
  editarTextoLinha: (index: number, texto: string) => void;
  apagarTempoLinha: (index: number) => void;
  arquivoAudio: any;
  tempoAtual: number;
  duracaoTotal: number;
  formatarTempo: (tempo: number) => string;
  audioPlayer: any;
  setTempoAtual: (tempo: number) => void;
  retrocederAudio: () => void;
  tocarOuPausar: () => void;
  isPlaying: boolean;
  avancarAudio: () => void;
  registrarTempo: () => void;
}

export default function PainelEditorLRC(props: PainelEditorLRCProps) {
  const editorListRef = useRef<FlatList>(null);

  // EFEITO MIGRADO: Auto-scroll do Editor LRC para acompanhar a linha atual
  useEffect(() => {
    if (props.isModoCriador && props.linhasSync.length > 0 && props.indiceCriador < props.linhasSync.length) {
      try {
        editorListRef.current?.scrollToIndex({ 
          index: props.indiceCriador, 
          animated: true, 
          viewPosition: 0.5 
        });
      } catch (e) {}
    }
  }, [props.indiceCriador, props.isModoCriador, props.linhasSync.length]);

  return (
    <View style={styles.editorFullContainer}>
      <View style={styles.editorHeader}>
        <TouchableOpacity onPress={() => props.setIsModoCriador(false)}>
          <Ionicons name="arrow-back" size={28} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.editorTitle}>Editor LRC</Text>
        
        <View style={{flexDirection: 'row', alignItems: 'center', gap: 15}}>
          <TouchableOpacity onPress={() => props.setModalSyncMassa(true)}>
            <Ionicons name="time" size={30} color="#2196F3" />
          </TouchableOpacity>
          <TouchableOpacity onPress={props.abrirModalSalvarLRC}>
            <Ionicons name="checkmark" size={32} color="#FF9800" />
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        ref={editorListRef}
        data={props.linhasSync}
        keyExtractor={(_, idx) => idx.toString()}
        style={styles.editorList}
        onScrollToIndexFailed={(info) => {
          setTimeout(() => {
            editorListRef.current?.scrollToIndex({ index: info.index, animated: true, viewPosition: 0.5 });
          }, 500);
        }}
        renderItem={({item, index}) => {
          const isActive = index === props.indiceCriador;
          return (
            <View style={[styles.editorRow, isActive && styles.editorRowActive]}>
              <TouchableOpacity onPress={() => props.ajustarTempoLinha(index, -0.1)} disabled={item.tempo === null} style={styles.editorTimeBtn}>
                <Ionicons name="chevron-back" size={18} color={item.tempo === null ? '#555' : (isActive ? '#000' : '#FFF')} />
              </TouchableOpacity>
              
              <Text style={[styles.editorTimeText, isActive && styles.editorTextActive]}>{props.formatarTempoMs(item.tempo)}</Text>
              
              <TouchableOpacity onPress={() => props.ajustarTempoLinha(index, 0.1)} disabled={item.tempo === null} style={styles.editorTimeBtn}>
                <Ionicons name="chevron-forward" size={18} color={item.tempo === null ? '#555' : (isActive ? '#000' : '#FFF')} />
              </TouchableOpacity>

              <TextInput 
                style={[styles.editorLyricText, isActive && styles.editorTextActive, { paddingVertical: 0 }]} 
                value={item.texto} 
                onChangeText={(texto) => props.editarTextoLinha(index, texto)}
                multiline={true}
              />
              
              <TouchableOpacity onPress={() => props.apagarTempoLinha(index)} style={styles.editorActionBtn}>
                <Ionicons name="trash" size={18} color={item.tempo === null ? '#555' : (isActive ? '#D32F2F' : '#E50914')} />
              </TouchableOpacity>
            </View>
          )
        }}
      />

      <View style={styles.editorBottomBar}>
        <Text style={styles.editorSongTitle} numberOfLines={1}>{props.arquivoAudio?.name || 'Música'}</Text>
        
        <View style={styles.editorSliderContainer}>
          <Text style={styles.tempoText}>{props.formatarTempo(props.tempoAtual)}</Text>
          <Slider 
            style={styles.slider} 
            minimumValue={0} 
            maximumValue={props.duracaoTotal || 1} 
            value={props.tempoAtual} 
            onSlidingComplete={(valor) => { if (props.audioPlayer) props.audioPlayer.seekTo(valor); props.setTempoAtual(valor); }} 
            minimumTrackTintColor="#FF9800" maximumTrackTintColor="#555" thumbTintColor="#FF9800" 
          />
          <Text style={styles.tempoText}>{props.formatarTempo(props.duracaoTotal)}</Text>
        </View>

        <View style={styles.editorControls}>
          <TouchableOpacity style={styles.editorControlBtn} onPress={props.retrocederAudio}><Ionicons name="play-back" size={28} color="#FFF" /></TouchableOpacity>
          <TouchableOpacity style={styles.editorControlBtn} onPress={props.tocarOuPausar}><Ionicons name={props.isPlaying ? "pause-circle" : "play-circle"} size={54} color="#FFF" /></TouchableOpacity>
          <TouchableOpacity style={styles.editorControlBtn} onPress={props.avancarAudio}><Ionicons name="play-forward" size={28} color="#FFF" /></TouchableOpacity>
          
          <TouchableOpacity style={[styles.markButtonNovo, props.indiceCriador >= props.linhasSync.length && {backgroundColor: '#555'}]} onPress={props.registrarTempo} disabled={props.indiceCriador >= props.linhasSync.length}>
            <Text style={styles.markButtonText}>MARK</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}