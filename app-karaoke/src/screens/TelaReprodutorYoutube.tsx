import React from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, FlatList, Image, ScrollView, Platform, Dimensions, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { VideoView } from 'expo-video';
import YoutubeIframe from 'react-native-youtube-iframe';
import { styles } from '../styles/indexStyles';
import FilaReproducao from '../components/FilaReproducao';

export default function TelaReprodutorYoutube(props: any) {
  const {
    telaAtiva, isLandscape, buscaYoutube, setBuscaYoutube, fazerBuscaYoutube,
    limparBusca, isPlaylistVisible, setIsPlaylistVisible, fonteBusca,
    setFonteBusca, resultadosYoutube, isBuscandoYt, arquivoPro, player,
    currentIndex, playlist, reproducaoTemp, setReproducaoTemp,
    setUrlAudioExtraido, setModalAcaoYoutube, isBaixandoYt, idBaixando,
    adicionarNaPlaylist, setModalQualidadeYt, setModalMixer,
    modoMonitorExterno, alternarMonitorExterno, youtubeTimeRef, isExtracting,
    urlAudioExtraido, baixarECompartilhar, extrairAudioDoVideo, eqPlaybackAtivo,
    tocarAnterior, tocarProxima, mostrarBuscaFila, setMostrarBuscaFila,
    buscaFila, setBuscaFila, playlistFiltrada, setCurrentIndex,
    carregarListasSalvas, setModalCarregarFila, setModalSalvarFila,
    confirmarLimparPlaylist, inicializarBiblioteca, setModalPastasPro,
    adicionarPastaDoDispositivo, selecionarMidiaPro, moverItemFila,
    setModalRenomearFila, removerDaPlaylist, renderEqualizadorMusica,
    youtubePlayerRef, videoViewRef, setResultadosYoutube
  } = props;

  return (
    <View style={[
      { flex: 1, width: '100%' },
      telaAtiva !== 'reprodutor' && { position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, zIndex: -10, pointerEvents: 'none' }
    ]}>
        {/* ========================================================== */}
        {/* MODO RETRATO (EM PÉ): Listas independentes (FlatList), Vídeo fixo */}
        {/* ========================================================== */}
        {!isLandscape && (
           <View style={{ flex: 1, width: '100%', backgroundColor: '#1E1E1E', padding: 15, paddingTop: 5 }}>
              
              {/* 1. BARRA DE PESQUISA */}
              <View style={styles.searchContainer}>
                <View style={styles.inputWrapper}>
                  <TextInput style={styles.searchInput} placeholder="Digite aqui..." placeholderTextColor="#A0A0A0" value={buscaYoutube} onChangeText={setBuscaYoutube} onSubmitEditing={fazerBuscaYoutube} />
                  {buscaYoutube.length > 0 && <TouchableOpacity style={styles.clearInputIcon} onPress={limparBusca}><Ionicons name="close-circle" size={20} color="#A0A0A0" /></TouchableOpacity>}
                </View>
                
                <TouchableOpacity style={styles.searchButton} onPress={fazerBuscaYoutube}>
                  <Ionicons name="search" size={20} color="#FFF" />
                </TouchableOpacity>
                
                <TouchableOpacity style={[styles.searchButton, { backgroundColor: isPlaylistVisible ? '#4CAF50' : '#555', marginLeft: 10 }]} onPress={() => setIsPlaylistVisible(!isPlaylistVisible)}>
                  <Ionicons name="list" size={20} color="#FFF" />
                </TouchableOpacity>
              </View>

              {/* SELETOR DE PLATAFORMA (YOUTUBE / SOUNDCLOUD) */}
              <View style={{flexDirection: 'row', gap: 10, marginBottom: 15, paddingHorizontal: 5}}>
                <TouchableOpacity 
                  style={{flex: 1, backgroundColor: fonteBusca === 'youtube' ? '#E50914' : '#333', paddingVertical: 8, borderRadius: 20, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', borderWidth: 1, borderColor: fonteBusca === 'youtube' ? '#FFF' : 'transparent'}} 
                  onPress={() => { setFonteBusca('youtube'); setResultadosYoutube?.([]); }}>
                  <Ionicons name="logo-youtube" size={16} color="#FFF" style={{marginRight: 5}}/>
                  <Text style={{color: '#FFF', fontWeight: 'bold', fontSize: 13}}>YouTube</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={{flex: 1, backgroundColor: fonteBusca === 'soundcloud' ? '#FF5500' : '#333', paddingVertical: 8, borderRadius: 20, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', borderWidth: 1, borderColor: fonteBusca === 'soundcloud' ? '#FFF' : 'transparent'}} 
                  onPress={() => { setFonteBusca('soundcloud'); setResultadosYoutube?.([]); }}>
                  <Ionicons name="cloud" size={16} color="#FFF" style={{marginRight: 5}}/>
                  <Text style={{color: '#FFF', fontWeight: 'bold', fontSize: 13}}>SoundCloud</Text>
                </TouchableOpacity>
              </View>

              {isBuscandoYt && <ActivityIndicator size="large" color="#E50914" style={{ marginTop: 20 }} />}

              {/* 2. RESULTADOS DA BUSCA (FLATLIST) */}
              {resultadosYoutube.length > 0 && (
                <View style={{ width: '100%', maxHeight: (arquivoPro || isPlaylistVisible) ? 220 : undefined, flex: (arquivoPro || isPlaylistVisible) ? 0 : 1, borderBottomWidth: 1, borderBottomColor: '#333', paddingBottom: 10, marginBottom: 10 }}>
                  <View style={styles.resultsHeader}>
                    <Text style={styles.resultsHeaderText}>
                      {resultadosYoutube.length} resultados {resultadosYoutube[0]?.isLocal ? '(Biblioteca Local)' : '(YouTube)'}
                    </Text>
                    <TouchableOpacity style={styles.closeResultsButton} onPress={limparBusca}><Ionicons name="close" size={16} color="#FFF" /><Text style={styles.closeResultsText}>Fechar Busca</Text></TouchableOpacity>
                  </View>
                  <FlatList 
                    data={resultadosYoutube} 
                    keyExtractor={(item: any) => item.id} 
                    style={{ width: '100%' }} 
                    showsVerticalScrollIndicator={false}
                    renderItem={({ item }: any) => (
                      <View style={styles.ytItem}>
                          <TouchableOpacity style={styles.ytThumbContainer} onPress={() => {
                            if (item.isLocal) { 
                              setReproducaoTemp({ uri: item.id, name: `[Tocando Agora] ${item.titulo}` }); 
                              setUrlAudioExtraido(null);
                              setIsPlaylistVisible(false); 
                            } 
                            else { setModalAcaoYoutube({ id: item.id, titulo: item.titulo, source: item.source }); }
                          }}>
                            {item.thumb ? <Image source={{ uri: item.thumb }} style={styles.ytThumb} /> : <View style={[styles.ytThumb, {backgroundColor: item.source === 'soundcloud' ? '#FF5500' : '#333', justifyContent: 'center', alignItems: 'center'}]}><Ionicons name={item.source === 'soundcloud' ? "cloud" : "folder"} size={30} color="#FFF" /></View>}
                            <View style={styles.playOverlay}><Ionicons name="play" size={36} color="#FFF" /></View>
                          </TouchableOpacity>

                          <View style={styles.ytInfo}>
                            <Text style={styles.ytTitle} numberOfLines={2}>{item.titulo}</Text>
                            <View style={styles.ytButtons}>
                              {isBaixandoYt && idBaixando === item.id ? (
                                <View style={{flexDirection: 'row', alignItems: 'center', marginTop: 5}}><ActivityIndicator size="small" color="#E50914" style={{marginRight: 8}} /><Text style={{color: '#A0A0A0', fontSize: 12}}>Carregando...</Text></View>
                              ) : item.isLocal ? (
                                <TouchableOpacity style={styles.ytBtnAudio} onPress={() => { adicionarNaPlaylist(item.id, item.titulo); alert("Adicionado à Lista de Reprodução!"); }}>
                                  <Ionicons name="add" size={14} color="#FFF" /><Text style={styles.ytBtnText}>Adicionar à Fila</Text>
                                </TouchableOpacity>
                              ) : (
                                <>
                                  <TouchableOpacity style={[styles.ytBtnVideo, item.source === 'soundcloud' && {backgroundColor: '#FF5500'}]} onPress={() => setModalQualidadeYt({ id: item.id, titulo: item.titulo, tipo: 'video', acao: 'baixar', source: item.source })}><Ionicons name="download" size={14} color="#FFF" /><Text style={styles.ytBtnText}>Vídeo</Text></TouchableOpacity>
                                  
                                  <TouchableOpacity style={[styles.ytBtnAudio, item.source === 'soundcloud' && {backgroundColor: '#E64A19'}]} onPress={() => setModalQualidadeYt({ id: item.id, titulo: item.titulo, tipo: 'audio', acao: 'baixar', source: item.source })}><Ionicons name="download" size={14} color="#FFF" /><Text style={styles.ytBtnText}>Áudio</Text></TouchableOpacity>
                                  
                                  <TouchableOpacity style={[styles.ytBtnVideo, {backgroundColor: item.source === 'soundcloud' ? '#BF360C' : '#E50914'}]} onPress={() => {
                                    const urlPreview = item.source === 'soundcloud' ? item.id : `https://www.youtube.com/watch?v=${item.id}`;
                                    if (Platform.OS === 'web') {
                                      window.open(urlPreview, 'PreviaPopUp', 'width=500,height=350,toolbar=no,menubar=no,scrollbars=no,location=no,status=no');
                                    } else {
                                      Linking.openURL(urlPreview);
                                    }
                                  }}>
                                    <Ionicons name="play" size={14} color="#FFF" />
                                    <Text style={styles.ytBtnText}>Prévia</Text>
                                  </TouchableOpacity>
                                </>
                              )}
                            </View>
                          </View>
                        </View>
                    )}
                  />
                </View>
              )}

              {/* 3. VÍDEO E CONTROLES */}
              {arquivoPro && (
                <View style={{ width: '100%', marginTop: 10, marginBottom: 10 }}>
                  <View style={styles.playerTopBar}>
                    <Text style={styles.infoTextPro} numberOfLines={1}>{arquivoPro.name}</Text>
                    <View style={{flexDirection: 'row', alignItems: 'center'}}>
                      
                      <TouchableOpacity onPress={() => setModalMixer(true)} style={{marginRight: 15}}>
                        <Ionicons name="options-outline" size={26} color="#4CAF50" />
                      </TouchableOpacity>

                      {Platform.OS === 'web' && (
                        <TouchableOpacity 
                          style={{backgroundColor: modoMonitorExterno ? '#E50914' : '#9C27B0', padding: 8, borderRadius: 5, justifyContent: 'center', alignItems: 'center'}} 
                          onPress={alternarMonitorExterno}
                        >
                          <Ionicons name={modoMonitorExterno ? "desktop" : "desktop-outline"} size={26} color="#FFF" />
                        </TouchableOpacity>
                      )}

                      {Platform.OS === 'web' && (
                        <TouchableOpacity onPress={() => { 
                          const isInterno = arquivoPro ? !!arquivoPro.isInterno : false;
                          const tempoAtual = isInterno ? youtubeTimeRef.current : (player ? player.currentTime || 0 : 0); 
                          
                          const novaJanela = window.open('', '_blank', 'width=854,height=480,toolbar=no,menubar=no,scrollbars=no,location=no,status=no');
                          
                          if (novaJanela) {
                            novaJanela.document.write(`
                              <!DOCTYPE html>
                              <html>
                                <head>
                                  <title>Tela Secundária - GH Karaokê</title>
                                  <style>
                                    body { margin: 0; background: black; display: flex; justify-content: center; align-items: center; height: 100vh; overflow: hidden; }
                                    video, iframe { width: 100%; height: 100%; object-fit: contain; border: none; }
                                  </style>
                                </head>
                                <body>
                                  ${isInterno 
                                    ? `<iframe id="telaSecundariaIframe" src="https://www.youtube.com/embed/${arquivoPro.uri}?autoplay=1&mute=1&start=${Math.floor(tempoAtual)}" allow="autoplay; fullscreen"></iframe>`
                                    : `<video id="telaSecundariaVideo" src="${arquivoPro.uri}" autoplay muted controls></video>`
                                  }
                                  <script>
                                    const vid = document.getElementById('telaSecundariaVideo');
                                    
                                    if (vid) {
                                      const iniciarTempo = () => {
                                        vid.currentTime = ${tempoAtual};
                                        vid.play().catch(e => console.log("Aguardando interação do usuário..."));
                                      };

                                      if (vid.readyState >= 1) {
                                          iniciarTempo();
                                      } else {
                                          vid.addEventListener('loadedmetadata', iniciarTempo);
                                      }

                                      window.addEventListener('message', (event) => {
                                        if (event.data && event.data.type === 'sync_tempo') {
                                          if (!vid) return; 

                                          const diff = Math.abs(vid.currentTime - event.data.tempo);
                                          if (diff > 1.0 && vid.readyState >= 1) {
                                            vid.currentTime = event.data.tempo;
                                          }
                                          
                                          if (event.data.isPlaying && vid.paused) {
                                            vid.play().catch(e => {});
                                          } else if (!event.data.isPlaying && !vid.paused) {
                                            vid.pause();
                                          }
                                        }
                                      });
                                    }
                                  </script>
                                </body>
                              </html>
                            `);
                            novaJanela.document.close();

                            const syncInterval = setInterval(() => {
                              if (novaJanela.closed) {
                                clearInterval(syncInterval); 
                              } else {
                                let tempoSincronizado = isInterno ? youtubeTimeRef.current : (player ? player.currentTime || 0 : 0);
                                let isPlayingSync = isInterno ? true : (player ? player.playing : false);

                                novaJanela.postMessage({ 
                                  type: 'sync_tempo', 
                                  tempo: tempoSincronizado,
                                  isPlaying: isPlayingSync
                                }, '*');
                              }
                            }, 500); 
                          }
                        }} style={{marginRight: 15}}>
                          <Ionicons name="open-outline" size={24} color="#4CAF50" />
                        </TouchableOpacity>
                      )}

                      {/\.(mp4|mkv|avi|mov|webm)$/i.test(arquivoPro.name) && (
                        isExtracting ? <ActivityIndicator size="small" color="#9C27B0" style={{marginRight: 15}}/>
                        : urlAudioExtraido ? <TouchableOpacity onPress={() => baixarECompartilhar(urlAudioExtraido, `Extraido_${arquivoPro.name.split('.')[0]}.wav`)}><Ionicons name="download" size={24} color="#4CAF50" style={{marginRight: 15}}/></TouchableOpacity>
                        : <TouchableOpacity onPress={extrairAudioDoVideo} style={{marginRight: 15}}><Ionicons name="musical-notes" size={22} color="#9C27B0" /></TouchableOpacity>
                      )}
                      <TouchableOpacity onPress={() => { setReproducaoTemp(null); setCurrentIndex(-1); player.pause(); }}>
                        <Ionicons name="close-circle" size={28} color="#E50914" />
                      </TouchableOpacity>
                    </View>
                  </View>

                  {arquivoPro.isInterno && eqPlaybackAtivo && (
                      <Text style={{color: '#FF9800', fontSize: 12, textAlign: 'center'}}>
                        ⚠️ Equalizador não suportado no modo Servidor Interno.
                      </Text>
                  )}
                  {!arquivoPro.isInterno && renderEqualizadorMusica()}

                  {arquivoPro.isInterno ? (
                    Platform.OS === 'web' ? (
                      modoMonitorExterno ? (
                          <View style={{ width: '100%', aspectRatio: 16/9, borderRadius: 10, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' }}>
                              <Ionicons name="desktop" size={40} color="#FFF" />
                              <Text style={{color: '#FFF', marginTop: 10, fontWeight: 'bold'}}>Reproduzindo na tela secundária</Text>
                          </View>
                      ) : (
                          <View style={{ width: '100%', aspectRatio: 16/9, borderRadius: 10, overflow: 'hidden', backgroundColor: '#000' }}>
                              <iframe 
                                  src={`https://www.youtube.com/embed/${arquivoPro.uri}?autoplay=1`} 
                                  style={{ width: '100%', height: '100%', border: 'none' }}
                                  allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
                                  allowFullScreen
                              />
                          </View>
                      )
                     ) : (
                      <View style={{ borderRadius: 10, overflow: 'hidden' }}>
                        <YoutubeIframe
                            ref={youtubePlayerRef}
                            height={220}
                            play={true}
                            videoId={arquivoPro.uri}
                            onChangeState={(state: string) => {
                              if (state === 'ended') tocarProxima();
                            }}
                        />
                      </View>
                    )
                  ) : (
                    <View style={{ width: '100%', aspectRatio: 16/9, borderRadius: 10, overflow: 'hidden', backgroundColor: '#000' }}>
                      <VideoView 
                        ref={videoViewRef} 
                        style={{ width: '100%', height: '100%' }} 
                        player={player} 
                        allowsPictureInPicture 
                      />
                    </View>
                  )}

                  <View style={styles.playlistControls}>
                    <TouchableOpacity onPress={tocarAnterior} disabled={currentIndex <= 0}><Ionicons name="play-skip-back" size={36} color={currentIndex <= 0 ? "#555" : "#FFF"} /></TouchableOpacity>
                    <Text style={styles.playlistCounterText}>{reproducaoTemp ? "Tocando Avulso" : (currentIndex >= 0 ? `${currentIndex + 1} de ${playlist.length}` : "Parado")}</Text>
                    <TouchableOpacity onPress={tocarProxima} disabled={currentIndex === -1 || currentIndex === playlist.length - 1}><Ionicons name="play-skip-forward" size={36} color={currentIndex === -1 || currentIndex === playlist.length - 1 ? "#555" : "#FFF"} /></TouchableOpacity>
                  </View>
                </View>
              )}

              {/* 4. LISTA DE REPRODUÇÃO (VISÍVEL APENAS NA WEB AQUI) */}
              {Platform.OS === 'web' && isPlaylistVisible ? (
                <FilaReproducao 
                  usarFlatList={true}
                  mostrarBuscaFila={mostrarBuscaFila} setMostrarBuscaFila={setMostrarBuscaFila}
                  buscaFila={buscaFila} setBuscaFila={setBuscaFila}
                  playlist={playlist} playlistFiltrada={playlistFiltrada}
                  currentIndex={currentIndex} setCurrentIndex={setCurrentIndex}
                  reproducaoTemp={reproducaoTemp} setReproducaoTemp={setReproducaoTemp}
                  setIsPlaylistVisible={setIsPlaylistVisible} carregarListasSalvas={carregarListasSalvas}
                  setModalCarregarFila={setModalCarregarFila} setModalSalvarFila={setModalSalvarFila}
                  confirmarLimparPlaylist={confirmarLimparPlaylist} inicializarBiblioteca={inicializarBiblioteca}
                  setModalPastasPro={setModalPastasPro} adicionarPastaDoDispositivo={adicionarPastaDoDispositivo}
                  selecionarMidiaPro={selecionarMidiaPro} moverItemFila={moverItemFila}
                  setModalRenomearFila={setModalRenomearFila} removerDaPlaylist={removerDaPlaylist}
                />
              ) : null}
          </View>       
            
        )}

        {/* ========================================================== */}
        {/* MODO PAISAGEM (DEITADO) - OPÇÃO A APLICADA AQUI! */}
        {/* ========================================================== */}
        {isLandscape && (
           <View style={{ flex: 1, width: '100%', backgroundColor: '#1E1E1E', padding: 15, paddingTop: 5 }}>
              
              <View style={styles.searchContainer}>
                <View style={styles.inputWrapper}>
                  <TextInput style={styles.searchInput} placeholder="Digite aqui..." placeholderTextColor="#A0A0A0" value={buscaYoutube} onChangeText={setBuscaYoutube} onSubmitEditing={fazerBuscaYoutube} />
                  {buscaYoutube.length > 0 && <TouchableOpacity style={styles.clearInputIcon} onPress={limparBusca}><Ionicons name="close-circle" size={20} color="#A0A0A0" /></TouchableOpacity>}
                </View>
                
                <TouchableOpacity style={styles.searchButton} onPress={fazerBuscaYoutube}>
                  <Ionicons name="search" size={20} color="#FFF" />
                </TouchableOpacity>
                
                <TouchableOpacity style={[styles.searchButton, { backgroundColor: isPlaylistVisible ? '#4CAF50' : '#555', marginLeft: 10 }]} onPress={() => setIsPlaylistVisible(!isPlaylistVisible)}>
                  <Ionicons name="list" size={20} color="#FFF" />
                </TouchableOpacity>
              </View>

              <View style={{flexDirection: 'row', gap: 10, marginBottom: 15, paddingHorizontal: 5}}>
                <TouchableOpacity 
                  style={{flex: 1, backgroundColor: fonteBusca === 'youtube' ? '#E50914' : '#333', paddingVertical: 8, borderRadius: 20, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', borderWidth: 1, borderColor: fonteBusca === 'youtube' ? '#FFF' : 'transparent'}} 
                  onPress={() => { setFonteBusca('youtube'); setResultadosYoutube([]); }}>
                  <Ionicons name="logo-youtube" size={16} color="#FFF" style={{marginRight: 5}}/>
                  <Text style={{color: '#FFF', fontWeight: 'bold', fontSize: 13}}>YouTube</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={{flex: 1, backgroundColor: fonteBusca === 'soundcloud' ? '#FF5500' : '#333', paddingVertical: 8, borderRadius: 20, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', borderWidth: 1, borderColor: fonteBusca === 'soundcloud' ? '#FFF' : 'transparent'}} 
                  onPress={() => { setFonteBusca('soundcloud'); setResultadosYoutube([]); }}>
                  <Ionicons name="cloud" size={16} color="#FFF" style={{marginRight: 5}}/>
                  <Text style={{color: '#FFF', fontWeight: 'bold', fontSize: 13}}>SoundCloud</Text>
                </TouchableOpacity>
              </View>

              {isBuscandoYt && <ActivityIndicator size="large" color="#E50914" style={{ marginTop: 20 }} />}

              {/* CONTEÚDO DIVIDIDO LADO A LADO */}
              <View style={{ flex: 1, flexDirection: 'row', gap: 15 }}>
                
                {/* === OPÇÃO A: REMOVEMOS O SCROLLVIEW E COLOCAMOS UMA VIEW === */}
                <View style={{ flex: 1, minWidth: '45%' }}>
                  
                  {/* Resultados da Busca (AGORA EM FLATLIST E COM FLEX: 1) */}
                  {resultadosYoutube.length > 0 && (
                    <View style={{ flex: 1, borderBottomWidth: 1, borderBottomColor: '#333', paddingBottom: 10, marginBottom: 10 }}>
                      <View style={styles.resultsHeader}>
                        <Text style={styles.resultsHeaderText}>
                          {resultadosYoutube.length} resultados {resultadosYoutube[0]?.isLocal ? '(Biblioteca Local)' : '(YouTube)'}
                        </Text>
                        <TouchableOpacity style={styles.closeResultsButton} onPress={limparBusca}><Ionicons name="close" size={16} color="#FFF" /><Text style={styles.closeResultsText}>Fechar Busca</Text></TouchableOpacity>
                      </View>
                      
                      <FlatList 
                        data={resultadosYoutube}
                        keyExtractor={(item: any) => item.id}
                        showsVerticalScrollIndicator={false}
                        style={{ width: '100%' }}
                        renderItem={({ item }: any) => (
                          <View style={styles.ytItem}>
                            <TouchableOpacity style={styles.ytThumbContainer} onPress={() => {
                              if (item.isLocal) { 
                                setReproducaoTemp({ uri: item.id, name: `[Tocando Agora] ${item.titulo}` }); 
                                setUrlAudioExtraido(null);
                                setIsPlaylistVisible(false); 
                              } 
                              else { setModalAcaoYoutube({ id: item.id, titulo: item.titulo, source: item.source }); }
                            }}>
                              {item.thumb ? <Image source={{ uri: item.thumb }} style={styles.ytThumb} /> : <View style={[styles.ytThumb, {backgroundColor: item.source === 'soundcloud' ? '#FF5500' : '#333', justifyContent: 'center', alignItems: 'center'}]}><Ionicons name={item.source === 'soundcloud' ? "cloud" : "folder"} size={30} color="#FFF" /></View>}
                              <View style={styles.playOverlay}><Ionicons name="play" size={36} color="#FFF" /></View>
                            </TouchableOpacity>

                            <View style={styles.ytInfo}>
                              <Text style={styles.ytTitle} numberOfLines={2}>{item.titulo}</Text>
                              <View style={styles.ytButtons}>
                                {isBaixandoYt && idBaixando === item.id ? (
                                  <View style={{flexDirection: 'row', alignItems: 'center', marginTop: 5}}><ActivityIndicator size="small" color="#E50914" style={{marginRight: 8}} /><Text style={{color: '#A0A0A0', fontSize: 12}}>Carregando...</Text></View>
                                ) : item.isLocal ? (
                                  <TouchableOpacity style={styles.ytBtnAudio} onPress={() => { adicionarNaPlaylist(item.id, item.titulo); alert("Adicionado à Lista de Reprodução!"); }}>
                                    <Ionicons name="add" size={14} color="#FFF" /><Text style={styles.ytBtnText}>Adicionar à Fila</Text>
                                  </TouchableOpacity>
                                ) : (
                                  <>
                                    <TouchableOpacity style={[styles.ytBtnVideo, item.source === 'soundcloud' && {backgroundColor: '#FF5500'}]} onPress={() => setModalQualidadeYt({ id: item.id, titulo: item.titulo, tipo: 'video', acao: 'baixar', source: item.source })}><Ionicons name="download" size={14} color="#FFF" /><Text style={styles.ytBtnText}>Vídeo</Text></TouchableOpacity>
                                    <TouchableOpacity style={[styles.ytBtnAudio, item.source === 'soundcloud' && {backgroundColor: '#E64A19'}]} onPress={() => setModalQualidadeYt({ id: item.id, titulo: item.titulo, tipo: 'audio', acao: 'baixar', source: item.source })}><Ionicons name="download" size={14} color="#FFF" /><Text style={styles.ytBtnText}>Áudio</Text></TouchableOpacity>
                                    <TouchableOpacity style={[styles.ytBtnVideo, {backgroundColor: item.source === 'soundcloud' ? '#BF360C' : '#E50914'}]} onPress={() => {
                                      const urlPreview = item.source === 'soundcloud' ? item.id : `https://www.youtube.com/watch?v=${item.id}`;
                                      if (Platform.OS === 'web') {
                                        window.open(urlPreview, 'PreviaPopUp', 'width=500,height=350,toolbar=no,menubar=no,scrollbars=no,location=no,status=no');
                                      } else {
                                        Linking.openURL(urlPreview);
                                      }
                                    }}>
                                      <Ionicons name="play" size={14} color="#FFF" />
                                      <Text style={styles.ytBtnText}>Prévia</Text>
                                    </TouchableOpacity>
                                  </>
                                )}
                              </View>
                            </View>
                          </View>
                        )}
                      />
                    </View>
                  )}

                  {/* Informações da Música Tocando (Fica Fixo no meio das listas) */}
                  {arquivoPro && (
                    <View style={{ width: '100%', marginBottom: 10 }}>
                      <View style={styles.playerTopBar}>
                        <Text style={styles.infoTextPro} numberOfLines={1}>{arquivoPro.name}</Text>
                        <View style={{flexDirection: 'row', alignItems: 'center'}}>

                          <TouchableOpacity onPress={() => setModalMixer(true)} style={{marginRight: 15}}>
                            <Ionicons name="options-outline" size={26} color="#4CAF50" />
                          </TouchableOpacity>

                          {Platform.OS === 'web' && (
                            <TouchableOpacity 
                              style={{backgroundColor: modoMonitorExterno ? '#E50914' : '#9C27B0', padding: 8, borderRadius: 5, justifyContent: 'center', alignItems: 'center'}} 
                              onPress={alternarMonitorExterno}
                            >
                              <Ionicons name={modoMonitorExterno ? "desktop" : "desktop-outline"} size={26} color="#FFF" />
                            </TouchableOpacity>
                          )}

                          {Platform.OS === 'web' && (
                            <TouchableOpacity onPress={() => { 
                              const isInterno = arquivoPro ? !!arquivoPro.isInterno : false;
                              const tempoAtual = isInterno ? youtubeTimeRef.current : (player ? player.currentTime || 0 : 0); 
                              
                              const novaJanela = window.open('', '_blank', 'width=854,height=480,toolbar=no,menubar=no,scrollbars=no,location=no,status=no');
                              
                              if (novaJanela) {
                                novaJanela.document.write(`
                                  <!DOCTYPE html>
                                  <html>
                                    <head>
                                      <title>Tela Secundária - GH Karaokê</title>
                                      <style>
                                        body { margin: 0; background: black; display: flex; justify-content: center; align-items: center; height: 100vh; overflow: hidden; }
                                        video, iframe { width: 100%; height: 100%; object-fit: contain; border: none; }
                                      </style>
                                    </head>
                                    <body>
                                      ${isInterno 
                                        ? `<iframe id="telaSecundariaIframe" src="https://www.youtube.com/embed/${arquivoPro.uri}?autoplay=1&mute=1&start=${Math.floor(tempoAtual)}" allow="autoplay; fullscreen"></iframe>`
                                        : `<video id="telaSecundariaVideo" src="${arquivoPro.uri}" autoplay muted controls></video>`
                                      }
                                      <script>
                                        const vid = document.getElementById('telaSecundariaVideo');
                                        
                                        if (vid) {
                                          const iniciarTempo = () => {
                                            vid.currentTime = ${tempoAtual};
                                            vid.play().catch(e => console.log("Aguardando interação do usuário..."));
                                          };

                                          if (vid.readyState >= 1) {
                                              iniciarTempo();
                                          } else {
                                              vid.addEventListener('loadedmetadata', iniciarTempo);
                                          }

                                          window.addEventListener('message', (event) => {
                                            if (event.data && event.data.type === 'sync_tempo') {
                                              if (!vid) return; 

                                              const diff = Math.abs(vid.currentTime - event.data.tempo);
                                              if (diff > 1.0 && vid.readyState >= 1) {
                                                vid.currentTime = event.data.tempo;
                                              }
                                              
                                              if (event.data.isPlaying && vid.paused) {
                                                vid.play().catch(e => {});
                                              } else if (!event.data.isPlaying && !vid.paused) {
                                                vid.pause();
                                              }
                                            }
                                          });
                                        }
                                      </script>
                                    </body>
                                  </html>
                                `);
                                novaJanela.document.close();

                                const syncInterval = setInterval(() => {
                                  if (novaJanela.closed) {
                                    clearInterval(syncInterval); 
                                  } else {
                                    let tempoSincronizado = isInterno ? youtubeTimeRef.current : (player ? player.currentTime || 0 : 0);
                                    let isPlayingSync = isInterno ? true : (player ? player.playing : false);

                                    novaJanela.postMessage({ 
                                      type: 'sync_tempo', 
                                      tempo: tempoSincronizado,
                                      isPlaying: isPlayingSync
                                    }, '*');
                                  }
                                }, 500); 
                              }
                            }} style={{marginRight: 15}}>
                              <Ionicons name="open-outline" size={24} color="#4CAF50" />
                            </TouchableOpacity>
                          )}

                          {/\.(mp4|mkv|avi|mov|webm)$/i.test(arquivoPro.name) && (
                            isExtracting ? <ActivityIndicator size="small" color="#9C27B0" style={{marginRight: 15}}/>
                            : urlAudioExtraido ? <TouchableOpacity onPress={() => baixarECompartilhar(urlAudioExtraido, `Extraido_${arquivoPro.name.split('.')[0]}.wav`)}><Ionicons name="download" size={24} color="#4CAF50" style={{marginRight: 15}}/></TouchableOpacity>
                            : <TouchableOpacity onPress={extrairAudioDoVideo} style={{marginRight: 15}}><Ionicons name="musical-notes" size={22} color="#9C27B0" /></TouchableOpacity>
                          )}
                          <TouchableOpacity onPress={() => { setReproducaoTemp(null); setCurrentIndex(-1); player.pause(); }}>
                            <Ionicons name="close-circle" size={28} color="#E50914" />
                          </TouchableOpacity>
                        </View>
                      </View>

                      {renderEqualizadorMusica()}

                      <View style={[styles.playlistControls, { marginTop: 10, marginBottom: 5 }]}>
                        <TouchableOpacity onPress={tocarAnterior} disabled={currentIndex <= 0}><Ionicons name="play-skip-back" size={36} color={currentIndex <= 0 ? "#555" : "#FFF"} /></TouchableOpacity>
                        <Text style={styles.playlistCounterText}>{reproducaoTemp ? "Tocando Avulso" : (currentIndex >= 0 ? `${currentIndex + 1} de ${playlist.length}` : "Parado")}</Text>
                        <TouchableOpacity onPress={tocarProxima} disabled={currentIndex === -1 || currentIndex === playlist.length - 1}><Ionicons name="play-skip-forward" size={36} color={currentIndex === -1 || currentIndex === playlist.length - 1 ? "#555" : "#FFF"} /></TouchableOpacity>
                      </View>
                    </View>
                  )}

                  {/* Lista de Reprodução - OPÇÃO A: USAR FLATLIST=TRUE AQUI! */}
                  {Platform.OS === 'web' && isPlaylistVisible ? (
                    <View style={{ flex: 1 }}>
                      <FilaReproducao 
                        usarFlatList={true}
                        mostrarBuscaFila={mostrarBuscaFila} setMostrarBuscaFila={setMostrarBuscaFila}
                        buscaFila={buscaFila} setBuscaFila={setBuscaFila}
                        playlist={playlist} playlistFiltrada={playlistFiltrada}
                        currentIndex={currentIndex} setCurrentIndex={setCurrentIndex}
                        reproducaoTemp={reproducaoTemp} setReproducaoTemp={setReproducaoTemp}
                        setIsPlaylistVisible={setIsPlaylistVisible} carregarListasSalvas={carregarListasSalvas}
                        setModalCarregarFila={setModalCarregarFila} setModalSalvarFila={setModalSalvarFila}
                        confirmarLimparPlaylist={confirmarLimparPlaylist} inicializarBiblioteca={inicializarBiblioteca}
                        setModalPastasPro={setModalPastasPro} adicionarPastaDoDispositivo={adicionarPastaDoDispositivo}
                        selecionarMidiaPro={selecionarMidiaPro} moverItemFila={moverItemFila}
                        setModalRenomearFila={setModalRenomearFila} removerDaPlaylist={removerDaPlaylist}
                      />
                    </View>
                  ) : null}
                  
                </View>

                {/* LADO DIREITO: O Player de Vídeo FIXO */}
                {arquivoPro && (
                  <View style={{ flex: isPlaylistVisible ? 1 : 1.2, justifyContent: 'center', paddingLeft: 10 }}>
                  
                    {arquivoPro.isInterno ? (
                      Platform.OS === 'web' ? (
                      modoMonitorExterno ? (
                          <View style={{ width: '100%', aspectRatio: 16/9, borderRadius: 10, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' }}>
                              <Ionicons name="desktop" size={40} color="#FFF" />
                              <Text style={{color: '#FFF', marginTop: 10, fontWeight: 'bold'}}>Reproduzindo na tela secundária</Text>
                          </View>
                      ) : (
                          <View style={{ width: '100%', aspectRatio: 16/9, borderRadius: 10, overflow: 'hidden', backgroundColor: '#000' }}>
                              <iframe 
                                  src={`https://www.youtube.com/embed/${arquivoPro.uri}?autoplay=1`} 
                                  style={{ width: '100%', height: '100%', border: 'none' }}
                                  allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
                                  allowFullScreen
                              />
                          </View>
                      )
                     ) : (
                        <View style={{ borderRadius: 10, overflow: 'hidden' }}>
                          <YoutubeIframe
                              ref={youtubePlayerRef}
                              height={Dimensions.get('window').height * 0.6}
                              play={true}
                              videoId={arquivoPro.uri}
                              onChangeState={(state: string) => {
                                if (state === 'ended') tocarProxima();
                              }}
                          />
                        </View>
                      )
                    ) : (
                      <View style={{ width: '100%', aspectRatio: 16/9, borderRadius: 10, overflow: 'hidden', backgroundColor: '#000' }}>
                        <VideoView 
                          ref={videoViewRef} 
                          style={{ width: '100%', height: '100%' }} 
                          player={player} 
                          allowsPictureInPicture 
                          allowsFullscreen
                        />
                      </View>
                    )}
                    
                  </View>
                )}
                
              </View>

           </View>
        )}
      </View>
  );
}