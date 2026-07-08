import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Keyboard, View, Text, TouchableOpacity, Modal, TextInput, ScrollView, FlatList, ActivityIndicator, Image, Platform, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { styles } from '../../styles/indexStyles';

export default function ModalBibLetraLrc(props: any) {
  const { modalBibLetraLrc, setModalBibLetraLrc, pastaBibLetraLrc, setPastaBibLetraLrc, pastasLrc, pastasVirtuaisLrcWeb, abrirPastaLetraNoEstudio, arquivosBibLetraLrc, setArquivosBibLetraLrc, selecionarArquivoLetraBibEstudio } = props;

  return (
    <Modal visible={modalBibLetraLrc} transparent={true} animationType="slide">
      <View style={styles.modalCenterOverlay}>
        <View style={[styles.destinoBox, {maxHeight: '80%', width: '90%'}]}>
          <Text style={styles.qualidadeTitle}>Biblioteca LRC</Text>
    
          {!pastaBibLetraLrc ? (
            // TELA 1: LISTA AS PASTAS LRC
            <>
              <Text style={styles.qualidadeSubtitle}>Escolha a pasta para buscar a letra</Text>
              <ScrollView style={styles.destinoPastasScroll}>
                {(pastasLrc.length === 0 && Object.keys(pastasVirtuaisLrcWeb).length === 0) ? (
                  <View style={styles.emptyBiblio}>
                  <Ionicons name="musical-notes-outline" size={60} color="#444" />
                  <Text style={styles.emptyBiblioText}>Nenhuma pasta LRC criada.</Text>
                  </View>
                ) : (
                  pastasLrc.map((pasta: string) => (
                  <TouchableOpacity key={pasta} style={styles.btnDestinoPasta} onPress={() => abrirPastaLetraNoEstudio(pasta)}>
                    <Ionicons name="folder" size={20} color="#FF9800" style={{marginRight: 10}}/>
                    <Text style={styles.qualidadeBtnText}>{pasta}</Text>
                  </TouchableOpacity>
                  ))
                )}
              </ScrollView>
            </>
          ) : (
            // TELA 2: LISTA OS ARQUIVOS .LRC E .TXT
            <>
              <Text style={styles.qualidadeSubtitle}>Letras em: {pastaBibLetraLrc}</Text>
              <ScrollView style={styles.destinoPastasScroll}>
                {arquivosBibLetraLrc.length === 0 ? (
                  <Text style={{color: '#777', textAlign: 'center', marginTop: 10}}>Nenhum arquivo .lrc ou .txt nesta pasta.</Text>
                ) : (
                  arquivosBibLetraLrc.map((arq: string) => (
                  <TouchableOpacity key={arq} style={styles.btnDestinoPasta} onPress={() => selecionarArquivoLetraBibEstudio(arq)}>
                    <Ionicons name="document-text" size={20} color="#2196F3" style={{marginRight: 10}}/>
                    <Text style={styles.qualidadeBtnText} numberOfLines={1}>{arq}</Text>
                  </TouchableOpacity>
                  ))
                )}
              </ScrollView>
              <TouchableOpacity style={[styles.qualidadeCancelarBtn, {marginBottom: 10}]} onPress={() => { setPastaBibLetraLrc(null); setArquivosBibLetraLrc([]); }}>
                <Text style={[styles.qualidadeCancelarText, {color: '#A0A0A0'}]}>⬅ Voltar para Pastas</Text>
              </TouchableOpacity>
            </>
          )}
    
          <TouchableOpacity style={styles.qualidadeCancelarBtn} onPress={() => { setModalBibLetraLrc(false); setPastaBibLetraLrc(null); setArquivosBibLetraLrc([]); }}>
            <Text style={styles.qualidadeCancelarText}>Cancelar / Fechar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}
