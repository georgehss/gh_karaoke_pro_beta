import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, FlatList, Image, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import { styles } from '../styles/indexStyles';

export default function TelaReprodutorLRC(props: any) {
  const {
    lrcAudioUri, lrcLetras, isLandscape, lrcPlaylist, Platform: propsPlatform,
    inicializarBibliotecaLrc, setModalPastasLrc, selecionarAudioLrc,
    selecionarArquivoLrcParaTocar, lrcCoverUrl, lrcMetaInfo, abrirEditorDoLrc,
    setModalMixer, isLrcPlaylistVisible, setIsLrcPlaylistVisible, lrcCurrentIndex,
    tocarItemLrc, lrcTempoAtual, lrcDuracaoTotal, lrcAudioPlayer, setLrcTempoAtual,
    anteriorLrc, tocarOuPausarLrc, isLrcPlaying, proximaLrc, lrcIndiceAtivo,
    lrcListRef, renderEqualizadorMusica, formatarTempo, adicionarPastaLrcPCWeb
  } = props;

  return (
    <View style={styles.lrcPlayerContainer}>
      {(!lrcAudioUri || lrcLetras.length === 0) ? (
        <ScrollView 
          style={{ flex: 1, width: '100%' }} 
          contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', alignItems: 'center', padding: 20, paddingBottom: 40 }} 
          showsVerticalScrollIndicator={false}
        >
          <Ionicons name="mic-outline" size={80} color="#FF9800" style={{marginBottom: 20}} />
          <Text style={styles.lrcSelectionTitle}>Karaokê LRC Player</Text>
          <Text style={styles.lrcSelectionSub}>Selecione uma pasta da sua biblioteca ou arquivos avulsos!</Text>

          <TouchableOpacity style={[styles.lrcSelectBtn, {backgroundColor: '#4CAF50'}]} 
            onPress={() => { 
              if (Platform.OS === 'web') {
                adicionarPastaLrcPCWeb();
              } else {
                inicializarBibliotecaLrc(); 
                setModalPastasLrc(true);
              }
            }}>
            <Ionicons name="folder-open" size={24} color="#FFF" style={{marginRight: 10}} />
            <Text style={styles.lrcSelectBtnText}>Tocar Pasta</Text>
          </TouchableOpacity>

          <Text style={{color: '#555', marginVertical: 10}}>--- OU MÚSICA AVULSA ---</Text>

          <TouchableOpacity style={styles.lrcSelectBtn} onPress={selecionarAudioLrc}>
            <Ionicons name="musical-note" size={24} color="#FFF" style={{marginRight: 10}} />
            <Text style={styles.lrcSelectBtnText}>{lrcAudioUri && lrcPlaylist.length === 0 ? 'Áudio Selecionado ✔️' : 'Selecionar Áudio'}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.lrcSelectBtn, {backgroundColor: '#2196F3'}]} onPress={selecionarArquivoLrcParaTocar}>
            <Ionicons name="document-text" size={24} color="#FFF" style={{marginRight: 10}} />
            <Text style={styles.lrcSelectBtnText}>{lrcLetras.length > 0 && lrcPlaylist.length === 0 ? 'Letra Selecionada ✔️' : 'Selecionar LRC'}</Text>
          </TouchableOpacity>
        </ScrollView>
      ) : (
        <View style={[styles.lrcPlayingArea, { flexDirection: isLandscape ? 'row' : 'column' }]}>
          
          {/* === LADO ESQUERDO (Paisagem) / TOPO (Retrato) === */}
          <View style={{ flex: isLandscape ? 1 : undefined, display: 'flex', flexDirection: 'column', justifyContent: isLandscape ? 'space-between' : 'flex-start' }}>
            <View>
              <View style={styles.lrcMusicHeader}>
                <View style={styles.lrcAlbumArt}>
                  {lrcCoverUrl ? (
                    <Image source={{ uri: lrcCoverUrl }} style={{ width: 60, height: 60, borderRadius: 8 }} />
                  ) : (
                    <Ionicons name="musical-notes" size={40} color="#FF9800" />
                  )}
                </View>
                <View style={styles.lrcMusicInfo}>
                  <Text style={styles.lrcMusicTitle} numberOfLines={1}>{lrcMetaInfo.title}</Text>
                  <Text style={styles.lrcMusicArtist} numberOfLines={1}>{lrcMetaInfo.artist}</Text>
                </View>
                
                <TouchableOpacity onPress={abrirEditorDoLrc} style={{marginRight: 15}}>
                  <Ionicons name="create-outline" size={28} color="#2196F3" />
                </TouchableOpacity>

                <TouchableOpacity onPress={() => setModalMixer(true)} style={{marginRight: 15}}>
                  <Ionicons name="options-outline" size={26} color="#4CAF50" />
                </TouchableOpacity>

                {lrcPlaylist.length > 0 && (
                  <TouchableOpacity onPress={() => setIsLrcPlaylistVisible(!isLrcPlaylistVisible)}>
                    <Ionicons name="list" size={28} color={isLrcPlaylistVisible ? "#FF9800" : "#FFF"} style={{marginRight: 15}}/>
                  </TouchableOpacity>
                )}

                <TouchableOpacity onPress={() => { selecionarAudioLrc(null); tocarItemLrc([], -1); setIsLrcPlaylistVisible(false); }}>
                  <Ionicons name="close-circle" size={28} color="#E50914" />
                </TouchableOpacity>
              </View>

              {isLrcPlaylistVisible && lrcPlaylist.length > 0 && (
                <View style={{maxHeight: 250, backgroundColor: '#161616', borderBottomWidth: 1, borderBottomColor: '#333'}}>
                  <View style={{padding: 10, backgroundColor: '#111', flexDirection: 'row', justifyContent: 'space-between'}}>
                    <Text style={{color: '#FF9800', fontWeight: 'bold'}}>Fila da Pasta ({lrcPlaylist.length} músicas)</Text>
                  </View>
                  <FlatList 
                    data={lrcPlaylist} 
                    keyExtractor={(item: any) => item.id}
                    renderItem={({item, index}: any) => (
                      <TouchableOpacity 
                        style={[styles.queueItem, lrcCurrentIndex === index && styles.queueItemActive, {paddingHorizontal: 20}]} 
                        onPress={() => { tocarItemLrc(lrcPlaylist, index); setIsLrcPlaylistVisible(false); }}
                      >
                         <Ionicons name={lrcCurrentIndex === index ? "musical-notes" : "play"} size={16} color={lrcCurrentIndex === index ? "#FF9800" : "#A0A0A0"} style={{ marginRight: 10 }} />
                         <Text style={[styles.queueItemText, lrcCurrentIndex === index && {color: '#FF9800', fontWeight: 'bold'}]} numberOfLines={1}>{item.name}</Text>
                      </TouchableOpacity>
                    )}
                  />
                </View>
              )}
            </View>

            {isLandscape && (
              <View style={[styles.lrcBottomControlBar, { borderTopWidth: 0, paddingBottom: 10, paddingHorizontal: 10 }]}>
                <View style={styles.lrcSliderContainer}>
                  {renderEqualizadorMusica()}
                  <Text style={styles.lrcTimeText}>{formatarTempo(lrcTempoAtual)}</Text>
                  <Slider style={styles.lrcSlider} minimumValue={0} maximumValue={lrcDuracaoTotal || 1} value={lrcTempoAtual} onSlidingComplete={(valor) => { if (lrcAudioPlayer) lrcAudioPlayer.seekTo(valor); setLrcTempoAtual(valor); }} minimumTrackTintColor="#FF9800" maximumTrackTintColor="#555" thumbTintColor="#FF9800" />
                  <Text style={styles.lrcTimeText}>{formatarTempo(lrcDuracaoTotal)}</Text>
                </View>

                <View style={styles.lrcButtonsContainer}>
                  <TouchableOpacity onPress={lrcPlaylist.length > 0 ? anteriorLrc : () => { if(lrcAudioPlayer) lrcAudioPlayer.seekTo(Math.max(0, lrcTempoAtual - 10)); }}>
                    <Ionicons name={lrcPlaylist.length > 0 ? "play-skip-back" : "play-back"} size={32} color={lrcPlaylist.length > 0 && lrcCurrentIndex === 0 ? "#555" : "#FFF"} />
                  </TouchableOpacity>
                  
                  <TouchableOpacity onPress={tocarOuPausarLrc} style={styles.lrcPlayBtnMain}>
                    <Ionicons name={isLrcPlaying ? "pause" : "play"} size={40} color="#000" />
                  </TouchableOpacity>
                  
                  <TouchableOpacity onPress={lrcPlaylist.length > 0 ? proximaLrc : () => { if(lrcAudioPlayer) lrcAudioPlayer.seekTo(Math.min(lrcDuracaoTotal, lrcTempoAtual + 10)); }}>
                    <Ionicons name={lrcPlaylist.length > 0 ? "play-skip-forward" : "play-forward"} size={32} color={lrcPlaylist.length > 0 && lrcCurrentIndex === lrcPlaylist.length - 1 ? "#555" : "#FFF"} />
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>

          {/* === LADO DIREITO (Paisagem) / MEIO (Retrato) : A LETRA === */}
          <View style={{ flex: isLandscape ? 1.5 : 1 }}>
            <FlatList
              ref={lrcListRef}
              data={lrcLetras}
              keyExtractor={(item: any, idx: number) => idx.toString()}
              style={styles.lrcLyricsList}
              contentContainerStyle={{ paddingVertical: isLandscape ? 50 : 180 }}
              showsVerticalScrollIndicator={false}
              onScrollToIndexFailed={(info) => {
                setTimeout(() => { lrcListRef.current?.scrollToIndex({ index: info.index, animated: true, viewPosition: 0.5 }); }, 500);
              }}
              renderItem={({ item, index }: any) => {
                const isActive = index === lrcIndiceAtivo;
                return (
                  <Text style={[styles.lrcLyricLine, isActive && styles.lrcLyricLineActive]}>
                    {item.texto}
                  </Text>
                );
              }}
            />
          </View>

          {!isLandscape && (
            <View style={styles.lrcBottomControlBar}>
              <View style={styles.lrcSliderContainer}>
                {renderEqualizadorMusica()}
                <Text style={styles.lrcTimeText}>{formatarTempo(lrcTempoAtual)}</Text>
                <Slider style={styles.lrcSlider} minimumValue={0} maximumValue={lrcDuracaoTotal || 1} value={lrcTempoAtual} onSlidingComplete={(valor) => { if (lrcAudioPlayer) lrcAudioPlayer.seekTo(valor); setLrcTempoAtual(valor); }} minimumTrackTintColor="#FF9800" maximumTrackTintColor="#555" thumbTintColor="#FF9800" />
                <Text style={styles.lrcTimeText}>{formatarTempo(lrcDuracaoTotal)}</Text>
              </View>

              <View style={styles.lrcButtonsContainer}>
                <TouchableOpacity onPress={lrcPlaylist.length > 0 ? anteriorLrc : () => { if(lrcAudioPlayer) lrcAudioPlayer.seekTo(Math.max(0, lrcTempoAtual - 10)); }}>
                  <Ionicons name={lrcPlaylist.length > 0 ? "play-skip-back" : "play-back"} size={32} color={lrcPlaylist.length > 0 && lrcCurrentIndex === 0 ? "#555" : "#FFF"} />
                </TouchableOpacity>
                
                <TouchableOpacity onPress={tocarOuPausarLrc} style={styles.lrcPlayBtnMain}>
                  <Ionicons name={isLrcPlaying ? "pause" : "play"} size={40} color="#000" />
                </TouchableOpacity>
                
                <TouchableOpacity onPress={lrcPlaylist.length > 0 ? proximaLrc : () => { if(lrcAudioPlayer) lrcAudioPlayer.seekTo(Math.min(lrcDuracaoTotal, lrcTempoAtual + 10)); }}>
                  <Ionicons name={lrcPlaylist.length > 0 ? "play-skip-forward" : "play-forward"} size={32} color={lrcPlaylist.length > 0 && lrcCurrentIndex === lrcPlaylist.length - 1 ? "#555" : "#FFF"} />
                </TouchableOpacity>
              </View>
            </View>
          )}

        </View>
      )}
    </View>
  );
}