// src/screens/TelaEstudioIA.tsx
import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { styles } from '../styles/indexStyles'; // Ajuste o caminho se necessário
import PainelEditorLRC from '../components/PainelEditorLRC'; // Ajuste o caminho
import Slider from '@react-native-community/slider';

// Tipagem básica ou extração direta do props
export default function TelaEstudioIA(props: any) {
  // Desestruture tudo que a tela precisa e que veio do index.tsx
  const { 
    isModoCriador, setIsModoCriador, arquivoAudio, isExtractingLyrics, 
    extrairLetraComIA, abrirSelecaoMusica, nomeLetra, abrirSelecaoLetra, 
    setModalBuscaLetra, tempoAtual, duracaoTotal, audioPlayer, setTempoAtual, 
    isPlaying, tocarOuPausar, processarKaraoke, karaokePronto, isProcessing, 
    urlPlayback, urlVoz, baixarECompartilhar, linhasSync, letras, indiceAtivo, 
    flatListRef, modeloIA, setModalSyncMassa, abrirModalSalvarLRC, 
    indiceCriador, ajustarTempoLinha, formatarTempoMs, editarTextoLinha, 
    apagarTempoLinha, formatarTempo, retrocederAudio, avancarAudio, registrarTempo, telaAtiva, audioUri
  } = props;
  return (
    
    <View style={[styles.mainArea, isModoCriador && { paddingHorizontal: 0, paddingTop: 0 }, telaAtiva !== 'principal' && { position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, zIndex: -10, pointerEvents: 'none' }]}>
      {isModoCriador ? (
          /* ================================================= */
          /* NOVO EDITOR LRC PROFISSIONAL                      */
          /* ================================================= */
          <PainelEditorLRC 
            isModoCriador={isModoCriador}
            setIsModoCriador={setIsModoCriador}
            setModalSyncMassa={setModalSyncMassa}
            abrirModalSalvarLRC={abrirModalSalvarLRC}
            linhasSync={linhasSync}
            indiceCriador={indiceCriador}
            ajustarTempoLinha={ajustarTempoLinha}
            formatarTempoMs={formatarTempoMs}
            editarTextoLinha={editarTextoLinha}
            apagarTempoLinha={apagarTempoLinha}
            arquivoAudio={arquivoAudio}
            tempoAtual={tempoAtual}
            duracaoTotal={duracaoTotal}
            formatarTempo={formatarTempo}
            audioPlayer={audioPlayer}
            setTempoAtual={setTempoAtual}
            retrocederAudio={retrocederAudio}
            tocarOuPausar={tocarOuPausar}
            isPlaying={isPlaying}
            avancarAudio={avancarAudio}
            registrarTempo={registrarTempo}
          />
        ) : (
          /* ================================================= */
          /* TELA PRINCIPAL NORMAL (IA)                        */
          /* ================================================= */
          <ScrollView 
            style={{width: '100%', flex: 1}} 
            contentContainerStyle={{alignItems: 'center', paddingBottom: 100}} 
            showsVerticalScrollIndicator={false}
          >
            
            <View style={styles.studioTopHeader}>
              <View style={styles.iconGlow}><Ionicons name="color-wand" size={32} color="#FFF" /></View>
              <Text style={styles.studioTitle}>Estúdio IA</Text>
              <Text style={styles.studioSub}>Separação de Voz e Sincronização de Letras</Text>
            </View>

            <View style={styles.uploadCard}>
              <TouchableOpacity style={styles.uploadBtnPrimary} onPress={abrirSelecaoMusica}>
                <Ionicons name={arquivoAudio ? "checkmark-circle" : "musical-notes"} size={22} color="#FFF" style={{marginRight: 10}}/>
                <Text style={styles.uploadBtnText}>{arquivoAudio ? 'Música Selecionada' : 'Escolher Música (Áudio)'}</Text>
              </TouchableOpacity>
              {arquivoAudio && <Text style={styles.fileNameText} numberOfLines={1}>{arquivoAudio.name}</Text>}

              <View style={styles.divisorUpload} />

              <TouchableOpacity style={styles.uploadBtnSecondary} onPress={abrirSelecaoLetra}>
                <Ionicons name={nomeLetra ? "checkmark-circle" : "document-text"} size={22} color="#FFF" style={{marginRight: 10}}/>
                <Text style={styles.uploadBtnText}>{nomeLetra ? 'Letra Local Selecionada' : 'Escolher Letra Local (.txt / .lrc)'}</Text>
              </TouchableOpacity>

              {/* NOVO BOTÃO DE BUSCA ONLINE */}
              <TouchableOpacity style={[styles.uploadBtnSecondary, {backgroundColor: '#2196F3', marginTop: 10}]} onPress={() => setModalBuscaLetra(true)}>
                <Ionicons name="globe" size={22} color="#FFF" style={{marginRight: 10}}/>
                <Text style={styles.uploadBtnText}> Buscar Letra Online</Text>
              </TouchableOpacity>

              {/* A MÁGICA: BOTÃO DA IA WHISPER */}
              <TouchableOpacity 
                style={[styles.uploadBtnSecondary, {backgroundColor: '#9C27B0', marginTop: 10, opacity: !arquivoAudio || isExtractingLyrics ? 0.6 : 1}]} 
                onPress={extrairLetraComIA}
                disabled={!arquivoAudio || isExtractingLyrics}
              >
                {isExtractingLyrics ? (
                    <ActivityIndicator size="small" color="#FFF" style={{marginRight: 10}} />
                ) : (
                    <Ionicons name="sparkles" size={22} color="#FFF" style={{marginRight: 10}}/>
                )}
                <Text style={styles.uploadBtnText}>{isExtractingLyrics ? 'IA Ouvindo e Escrevendo...' : 'Extrair Letra com IA (Áudio)'}</Text>
              </TouchableOpacity>

              {nomeLetra && <Text style={styles.fileNameText} numberOfLines={1}>{nomeLetra}</Text>}
            </View>
            
            {arquivoAudio && (
              <View style={[styles.playerContainer, { flex: 0 }]}>
                {isProcessing ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#E50914" /><Text style={styles.loadingText}>A remover a voz com IA...</Text>
                  </View>
                ) : (
                  <>
                    {audioUri && (
                      <View style={styles.sliderContainer}>
                        <Text style={styles.tempoText}>{formatarTempo(tempoAtual)}</Text>
                        <Slider style={styles.slider} minimumValue={0} maximumValue={duracaoTotal || 1} value={tempoAtual} onSlidingComplete={(valor) => { if (audioPlayer) audioPlayer.seekTo(valor); setTempoAtual(valor); }} minimumTrackTintColor="#E50914" maximumTrackTintColor="#A0A0A0" thumbTintColor="#E50914" />
                        <Text style={styles.tempoText}>{formatarTempo(duracaoTotal)}</Text>
                      </View>
                    )}
                    <View style={styles.actionButtons}>
                      <TouchableOpacity style={[styles.playButton, isPlaying ? styles.pauseButton : null]} onPress={tocarOuPausar}><Text style={styles.playButtonText}>{isPlaying ? '⏸ Pausar' : '▶️ Tocar'}</Text></TouchableOpacity>
                      {!karaokePronto && (
                        <TouchableOpacity style={styles.karaokeButton} onPress={processarKaraoke}>
                          <Text style={styles.karaokeButtonText}>
                            Criar Karaokê ({modeloIA === 'fadr' ? 'FADR' : modeloIA === 'replicate' ? 'Replicate' : 'Local'})
                          </Text>
                        </TouchableOpacity>
                      )}
                      {karaokePronto && (
                        <>
                          <TouchableOpacity style={styles.saveButton} onPress={() => baixarECompartilhar(urlPlayback!, `Karaoke_${arquivoAudio.name.split('.')[0]}.wav`)}><Text style={styles.saveButtonText}>💾 Instrumental</Text></TouchableOpacity>
                          <TouchableOpacity style={styles.voiceButton} onPress={() => baixarECompartilhar(urlVoz!, `Vozes_${arquivoAudio.name.split('.')[0]}.wav`)}><Text style={styles.saveButtonText}>🎙️ Vozes</Text></TouchableOpacity>
                        </>
                      )}
                    </View>
                  </>
                )}

                {linhasSync.length > 0 && !isProcessing && (
                    <TouchableOpacity style={styles.creatorToggleButton} onPress={() => setIsModoCriador(true)}>
                      <Text style={styles.creatorToggleText}>🛠 Abrir Editor LRC Profissional</Text>
                    </TouchableOpacity>
                )}

                {karaokePronto && !isProcessing && letras.length > 0 && (
                  <View style={[styles.lyricsBox, { flex: 0, height: 400, marginTop: 15 }]}>
                    <FlatList 
                      ref={flatListRef} 
                      data={letras} 
                      keyExtractor={(i, idx) => idx.toString()} 
                      showsVerticalScrollIndicator={false} 
                      contentContainerStyle={{ paddingVertical: 120 }} 
                      nestedScrollEnabled={true}
                      renderItem={({ item, index }) => <Text style={[styles.lyricText, index === indiceAtivo ? styles.lyricActive : null]}>{item.texto}</Text>}
                      onScrollToIndexFailed={(info) => { setTimeout(() => { flatListRef.current?.scrollToIndex({ index: info.index, animated: true, viewPosition: 0.5 }); }, 500); }}
                    />
                  </View>
                )}
              </View>
            )}
          </ScrollView>
        )}
      </View>
  );
}