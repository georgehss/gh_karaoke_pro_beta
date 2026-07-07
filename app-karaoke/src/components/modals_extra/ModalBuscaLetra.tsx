import React from 'react';
import { Modal, View, Text, TextInput, TouchableOpacity, FlatList, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { styles } from '../../styles/indexStyles';

export default function ModalBuscaLetra(props: any) {
  const { 
    visivel, onClose, buscaTituloLrc, setBuscaTituloLrc, 
    buscaArtistaLrc, setBuscaArtistaLrc, isBuscandoLrc, 
    resultadosLrc, setResultadosLrc, buscarLetraNaInternet, 
    selecionarLetraDaLista 
  } = props;

  if (!visivel) return null;

  return (
    <Modal visible={visivel} transparent={true} animationType="fade">
      <View style={styles.modalCenterOverlay}>
        <View style={[styles.qualidadeBox, resultadosLrc.length > 0 && {height: '80%', width: '95%'}]}>
          <Ionicons name="cloud-download" size={40} color="#2196F3" style={{marginBottom: 10}}/>
          <Text style={styles.qualidadeTitle}>Baixar Letra Online</Text>
          
          {resultadosLrc.length === 0 ? (
            <>
              <TextInput style={[styles.inputPasta, {marginBottom: 10, marginTop: 10}]} placeholder="Nome da Música (Obrigatório)" placeholderTextColor="#777" value={buscaTituloLrc} onChangeText={setBuscaTituloLrc} />
              <TextInput style={styles.inputPasta} placeholder="Nome do Artista (Opcional)" placeholderTextColor="#777" value={buscaArtistaLrc} onChangeText={setBuscaArtistaLrc} />

              {isBuscandoLrc ? (
                <ActivityIndicator size="large" color="#2196F3" style={{marginTop: 20}} />
              ) : (
                <View style={{flexDirection: 'row', gap: 15, marginTop: 20}}>
                  <TouchableOpacity style={styles.qualidadeCancelarBtn} onPress={onClose}>
                    <Text style={styles.qualidadeCancelarText}>Cancelar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.btnSalvarPasta, {backgroundColor: '#2196F3'}]} onPress={buscarLetraNaInternet}>
                    <Text style={styles.btnSalvarPastaText}>Buscar</Text>
                  </TouchableOpacity>
                </View>
              )}
            </>
          ) : (
            <>
              <Text style={styles.qualidadeSubtitle}>{resultadosLrc.length} opções encontradas</Text>
              
              <FlatList 
                data={resultadosLrc} 
                keyExtractor={(item: any, index: number) => item.id ? item.id.toString() : index.toString()} 
                style={{width: '100%', marginVertical: 10}}
                showsVerticalScrollIndicator={false}
                renderItem={({item}: any) => (
                  <TouchableOpacity style={styles.ytItem} onPress={() => selecionarLetraDaLista(item)}>
                    <View style={{flex: 1, marginLeft: 10, justifyContent: 'center'}}>
                      <Text style={styles.ytTitle} numberOfLines={1}>{item.trackName}</Text>
                      <Text style={{color: '#A0A0A0', fontSize: 12}}>{item.artistName}</Text>
                    </View>
                    
                    <View style={{justifyContent: 'center', alignItems: 'center'}}>
                      <View style={{paddingHorizontal: 8, paddingVertical: 4, backgroundColor: item.syncedLyrics ? '#4CAF50' : '#FF9800', borderRadius: 5}}>
                        <Text style={{color: '#FFF', fontSize: 10, fontWeight: 'bold'}}>{item.syncedLyrics ? 'SINC (LRC)' : 'TEXTO'}</Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                )}
              />

              <TouchableOpacity style={styles.qualidadeCancelarBtn} onPress={() => setResultadosLrc([])}>
                <Text style={[styles.qualidadeCancelarText, {color: '#A0A0A0'}]}>⬅ Voltar / Nova Busca</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}