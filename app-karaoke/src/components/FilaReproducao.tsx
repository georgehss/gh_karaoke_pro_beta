import React from 'react';
import { View, Text, TouchableOpacity, TextInput, FlatList, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { styles } from '../styles/indexStyles';

interface FilaReproducaoProps {
  usarFlatList: boolean;
  mostrarBuscaFila: boolean;
  setMostrarBuscaFila: (val: boolean) => void;
  buscaFila: string;
  setBuscaFila: (val: string) => void;
  playlist: any[];
  playlistFiltrada: any[];
  currentIndex: number;
  setCurrentIndex: (val: number) => void;
  reproducaoTemp: any;
  setReproducaoTemp: (val: any) => void;
  setIsPlaylistVisible: (val: boolean) => void;
  carregarListasSalvas: () => void;
  setModalCarregarFila: (val: boolean) => void;
  setModalSalvarFila: (val: boolean) => void;
  confirmarLimparPlaylist: () => void;
  inicializarBiblioteca: () => void;
  setModalPastasPro: (val: boolean) => void;
  adicionarPastaDoDispositivo: () => void;
  selecionarMidiaPro: () => void;
  moverItemFila: (index: number, dir: 'up' | 'down') => void;
  setModalRenomearFila: (val: any) => void;
  removerDaPlaylist: (index: number) => void;
}

export default function FilaReproducao({
  usarFlatList, mostrarBuscaFila, setMostrarBuscaFila, buscaFila, setBuscaFila,
  playlist, playlistFiltrada, currentIndex, setCurrentIndex, reproducaoTemp,
  setReproducaoTemp, setIsPlaylistVisible, carregarListasSalvas,
  setModalCarregarFila, setModalSalvarFila, confirmarLimparPlaylist,
  inicializarBiblioteca, setModalPastasPro, adicionarPastaDoDispositivo,
  selecionarMidiaPro, moverItemFila, setModalRenomearFila, removerDaPlaylist
}: FilaReproducaoProps) {
  return (
    <View style={[styles.queueContainer, Platform.OS !== 'web' ? { flex: 1, margin: 0, borderRadius: 0, backgroundColor: '#1E1E1E', paddingTop: Platform.OS === 'ios' ? 40 : 20 } : { flex: 1, marginTop: 0 }]}>
      <View style={styles.queueHeader}>
        {!mostrarBuscaFila ? (
          <>
            <Text style={[styles.queueTitle, {flex: 1}]} numberOfLines={1}>Fila de Reprodução</Text>
            
            <View style={{flexDirection: 'row', alignItems: 'center', gap: 12}}>
              <TouchableOpacity onPress={() => setMostrarBuscaFila(true)} style={{padding: 4}}>
                <Ionicons name="search" size={22} color="#FFF" />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => { carregarListasSalvas(); setModalCarregarFila(true); }} style={{padding: 4}}><Ionicons name="folder-open" size={22} color="#FFCA28" /></TouchableOpacity>
              <TouchableOpacity onPress={() => setModalSalvarFila(true)} style={{padding: 4}}><Ionicons name="save" size={22} color="#2196F3" /></TouchableOpacity>
              <TouchableOpacity onPress={confirmarLimparPlaylist} style={{padding: 4}}><Text style={styles.queueClearText}>Limpar</Text></TouchableOpacity>
              
              {Platform.OS !== 'web' && (
                <TouchableOpacity onPress={() => setIsPlaylistVisible(false)} style={{padding: 4, marginLeft: 5}}>
                  <Ionicons name="chevron-down-circle" size={28} color="#E50914" />
                </TouchableOpacity>
              )}
            </View>
          </>
        ) : (
          <View style={{flexDirection: 'row', alignItems: 'center', flex: 1, gap: 10}}>
            <TextInput 
              style={[styles.searchInput, {flex: 1, height: 38, fontSize: 13, paddingHorizontal: 15}]} 
              placeholder="Pesquisar na fila..." 
              placeholderTextColor="#A0A0A0" 
              value={buscaFila} 
              onChangeText={setBuscaFila} 
              autoFocus 
            />
            <TouchableOpacity onPress={() => { setMostrarBuscaFila(false); setBuscaFila(''); }} style={{padding: 4}}>
              <Ionicons name="close-circle" size={24} color="#E50914" />
            </TouchableOpacity>
          </View>
        )}
      </View>

      <View style={{flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15, gap: 8}}>
        <TouchableOpacity style={{flex: 1, flexDirection: 'row', backgroundColor: '#4CAF50', paddingVertical: 8, borderRadius: 5, justifyContent: 'center', alignItems: 'center'}} 
          onPress={() => { inicializarBiblioteca(); setModalPastasPro(true); }}>
          <Ionicons name="library" size={14} color="#FFF" style={{marginRight: 4}}/>
          <Text style={{color: '#FFF', fontSize: 12, fontWeight: 'bold'}}>Bib. App</Text>
        </TouchableOpacity>

        <TouchableOpacity style={{flex: 1, flexDirection: 'row', backgroundColor: '#FF9800', paddingVertical: 8, borderRadius: 5, justifyContent: 'center', alignItems: 'center'}} 
          onPress={adicionarPastaDoDispositivo}>
          <Ionicons name="folder-open" size={14} color="#FFF" style={{marginRight: 4}}/>
          <Text style={{color: '#FFF', fontSize: 12, fontWeight: 'bold'}}>Pasta Cel.</Text>
        </TouchableOpacity>

        <TouchableOpacity style={{flex: 1, flexDirection: 'row', backgroundColor: '#2196F3', paddingVertical: 8, borderRadius: 5, justifyContent: 'center', alignItems: 'center'}} onPress={selecionarMidiaPro}>
          <Ionicons name="document" size={14} color="#FFF" style={{marginRight: 4}}/>
          <Text style={{color: '#FFF', fontSize: 12, fontWeight: 'bold'}}>Arquivos</Text>
        </TouchableOpacity>
      </View>

      {playlist.length > 0 ? (
        playlistFiltrada.length > 0 ? (
          usarFlatList ? (
            <FlatList data={playlistFiltrada} keyExtractor={item => item.id} style={{ width: '100%' }} showsVerticalScrollIndicator={false}
              renderItem={({ item }) => {
                const index = item.originalIndex;
                return (
                  <View style={[styles.queueItem, !reproducaoTemp && currentIndex === index && styles.queueItemActive]}>
                    <TouchableOpacity style={styles.queueItemTouchable} onPress={() => { setReproducaoTemp(null); setCurrentIndex(index); if(Platform.OS !== 'web') setIsPlaylistVisible(false); }}>
                      <Ionicons name={!reproducaoTemp && currentIndex === index ? "musical-notes" : "play"} size={16} color={!reproducaoTemp && currentIndex === index ? "#FFD700" : "#A0A0A0"} style={{ marginRight: 10 }} />
                      <Text style={[styles.queueItemText, !reproducaoTemp && currentIndex === index && styles.queueItemTextActive]} numberOfLines={1}>{item.name}</Text>
                    </TouchableOpacity>
                    <View style={{flexDirection: 'row', alignItems: 'center', gap: 12, marginLeft: 10}}>
                      <View style={{flexDirection: 'column', alignItems: 'center'}}>
                        <TouchableOpacity onPress={() => moverItemFila(index, 'up')} disabled={index === 0} style={{padding: 2}}><Ionicons name="caret-up" size={18} color={index === 0 ? "transparent" : "#A0A0A0"} /></TouchableOpacity>
                        <TouchableOpacity onPress={() => moverItemFila(index, 'down')} disabled={index === playlist.length - 1} style={{padding: 2}}><Ionicons name="caret-down" size={18} color={index === playlist.length - 1 ? "transparent" : "#A0A0A0"} /></TouchableOpacity>
                      </View>
                      <TouchableOpacity onPress={() => setModalRenomearFila({id: item.id, name: item.name})} style={{padding: 5}}><Ionicons name="pencil" size={18} color="#2196F3" /></TouchableOpacity>
                      <TouchableOpacity onPress={() => removerDaPlaylist(index)} style={{padding: 5}}><Ionicons name="close" size={22} color="#E50914" /></TouchableOpacity>
                    </View>
                  </View>
                );
              }}
            />
          ) : (
            playlistFiltrada.map((item) => {
              const index = item.originalIndex;
              return (
                <View key={item.id} style={[styles.queueItem, !reproducaoTemp && currentIndex === index && styles.queueItemActive]}>
                  <TouchableOpacity style={styles.queueItemTouchable} onPress={() => { setReproducaoTemp(null); setCurrentIndex(index); if(Platform.OS !== 'web') setIsPlaylistVisible(false); }}>
                    <Ionicons name={!reproducaoTemp && currentIndex === index ? "musical-notes" : "play"} size={16} color={!reproducaoTemp && currentIndex === index ? "#FFD700" : "#A0A0A0"} style={{ marginRight: 10 }} />
                    <Text style={[styles.queueItemText, !reproducaoTemp && currentIndex === index && styles.queueItemTextActive]} numberOfLines={1}>{item.name}</Text>
                  </TouchableOpacity>
                  <View style={{flexDirection: 'row', alignItems: 'center', gap: 12, marginLeft: 10}}>
                    <View style={{flexDirection: 'column', alignItems: 'center'}}>
                      <TouchableOpacity onPress={() => moverItemFila(index, 'up')} disabled={index === 0} style={{padding: 2}}><Ionicons name="caret-up" size={18} color={index === 0 ? "transparent" : "#A0A0A0"} /></TouchableOpacity>
                      <TouchableOpacity onPress={() => moverItemFila(index, 'down')} disabled={index === playlist.length - 1} style={{padding: 2}}><Ionicons name="caret-down" size={18} color={index === playlist.length - 1 ? "transparent" : "#A0A0A0"} /></TouchableOpacity>
                    </View>
                    <TouchableOpacity onPress={() => setModalRenomearFila({id: item.id, name: item.name})} style={{padding: 5}}><Ionicons name="pencil" size={18} color="#2196F3" /></TouchableOpacity>
                    <TouchableOpacity onPress={() => removerDaPlaylist(index)} style={{padding: 5}}><Ionicons name="close" size={22} color="#E50914" /></TouchableOpacity>
                  </View>
                </View>
              );
            })
          )
        ) : (
          <Text style={{color: '#777', textAlign: 'center', marginTop: 20, paddingBottom: 20}}>Nenhuma música encontrada na busca.</Text>
        )
      ) : (
        <View style={styles.emptyPlaylistContainer}>
          <Ionicons name="list" size={50} color="#333" />
          <Text style={styles.emptyPlaylistText}>Sua lista de reprodução está vazia.</Text>
          <Text style={styles.emptyPlaylistSub}>Adicione arquivos acima ou pesquise no YouTube!</Text>
        </View>
      )}
    </View>
  );
}