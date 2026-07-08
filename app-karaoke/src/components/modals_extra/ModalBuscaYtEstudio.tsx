import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Keyboard, View, Text, TouchableOpacity, Modal, TextInput, ScrollView, FlatList, ActivityIndicator, Image, Platform, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { styles } from '../../styles/indexStyles';

export default function ModalBuscaYtEstudio(props: any) {
  const { modalBuscaYtEstudio, setModalBuscaYtEstudio, fonteBuscaEstudio, buscaYtEstudio, setBuscaYtEstudio, buscarYoutubeEstudio, isBuscandoYtEstudio, resultadosYtEstudio, isBaixandoYtEstudio, idBaixandoEstudio, baixarYoutubeParaEstudio } = props;

  return (
    <Modal visible={modalBuscaYtEstudio} transparent={true} animationType="slide">
      <View style={styles.modalCenterOverlay}>
        <View style={[styles.destinoBox, { height: '85%', width: '95%' }]}>
          <Text style={styles.qualidadeTitle}>Buscar no {fonteBuscaEstudio === 'soundcloud' ? 'SoundCloud' : 'YouTube'}</Text>
          <Text style={styles.qualidadeSubtitle}>O áudio será baixado e enviado para a IA.</Text>
          
          <View style={{ flexDirection: 'row', width: '100%', marginBottom: 15 }}>
            <TextInput 
              style={[styles.searchInput, { flex: 1 }]} 
              placeholder={`Pesquisar no ${fonteBuscaEstudio === 'soundcloud' ? 'SoundCloud' : 'YouTube'}...`} 
              placeholderTextColor="#A0A0A0" 
              value={buscaYtEstudio} 
              onChangeText={setBuscaYtEstudio} 
              onSubmitEditing={buscarYoutubeEstudio} 
            />
            <TouchableOpacity style={[styles.searchButton, fonteBuscaEstudio === 'soundcloud' && {backgroundColor: '#FF5500'}]} onPress={buscarYoutubeEstudio}>
              <Ionicons name="search" size={20} color="#FFF" />
            </TouchableOpacity>
          </View>
    
          {isBuscandoYtEstudio && <ActivityIndicator size="large" color={fonteBuscaEstudio === 'soundcloud' ? '#FF5500' : '#E50914'} />}
    
          <FlatList data={resultadosYtEstudio} keyExtractor={(item) => item.id} style={{ width: '100%' }}
            renderItem={({ item }) => (
              <View style={styles.ytItem}>
                <View style={styles.ytThumbContainer}>
                  {item.thumb ? <Image source={{ uri: item.thumb }} style={styles.ytThumb} /> : <View style={[styles.ytThumb, {backgroundColor: fonteBuscaEstudio === 'soundcloud' ? '#FF5500' : '#333', justifyContent: 'center', alignItems: 'center'}]}><Ionicons name={fonteBuscaEstudio === 'soundcloud' ? "cloud" : "videocam"} size={24} color="#FFF" /></View>}
                </View>
                <View style={styles.ytInfo}>
                  <Text style={styles.ytTitle} numberOfLines={2}>{item.titulo}</Text>
                  
                  {isBaixandoYtEstudio && idBaixandoEstudio === item.id ? (
                    <Text style={{color: fonteBuscaEstudio === 'soundcloud' ? '#FF5500' : '#E50914', fontSize: 12, marginTop: 5, fontWeight: 'bold'}}>Baixando áudio...</Text>
                  ) : (
                    <View style={{flexDirection: 'row', gap: 10, marginTop: 5}}>
                      <TouchableOpacity 
                        style={[styles.ytBtnAudio, {alignSelf: 'flex-start', opacity: isBaixandoYtEstudio ? 0.5 : 1}]} 
                        onPress={() => baixarYoutubeParaEstudio(item.id, item.titulo)}
                        disabled={isBaixandoYtEstudio} 
                      >
                        <Ionicons name="download" size={14} color="#FFF" />
                        <Text style={styles.ytBtnText}>Usar Áudio</Text>
                      </TouchableOpacity>
    
                      <TouchableOpacity 
                        style={[styles.ytBtnVideo, {alignSelf: 'flex-start', backgroundColor: fonteBuscaEstudio === 'soundcloud' ? '#BF360C' : '#E50914', opacity: isBaixandoYtEstudio ? 0.5 : 1}]} 
                        onPress={() => {
                          const urlPreview = fonteBuscaEstudio === 'soundcloud' ? item.id : `https://www.youtube.com/watch?v=${item.id}`;
                          if (Platform.OS === 'web') { 
                            // Abre um pop-up flutuante pequeno com a prévia
                            window.open(urlPreview, 'PreviaPopUp', 'width=500,height=350,toolbar=no,menubar=no,scrollbars=no,location=no,status=no'); 
                          } else { 
                            Linking.openURL(urlPreview); 
                          }
                        }}
                        disabled={isBaixandoYtEstudio} 
                      >
                        <Ionicons name="play" size={14} color="#FFF" />
                        <Text style={styles.ytBtnText}>Prévia</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              </View>
            )}
          />
          <TouchableOpacity style={styles.qualidadeCancelarBtn} onPress={() => setModalBuscaYtEstudio(false)} disabled={isBaixandoYtEstudio}>
            <Text style={[styles.qualidadeCancelarText, isBaixandoYtEstudio && {color: '#555'}]}>Cancelar e Fechar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}
