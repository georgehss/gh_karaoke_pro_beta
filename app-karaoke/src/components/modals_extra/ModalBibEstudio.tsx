import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Keyboard, View, Text, TouchableOpacity, Modal, TextInput, ScrollView, FlatList, ActivityIndicator, Image, Platform, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { styles } from '../../styles/indexStyles';

export default function ModalBibEstudio(props: any) {
  const { modalBibEstudio, setModalBibEstudio, pastaBibEstudio, setPastaBibEstudio, pastas, pastasLrc, abrirPastaNoEstudio, arquivosBibEstudio, setArquivosBibEstudio, selecionarArquivoBibEstudio } = props;

  return (
    <Modal visible={modalBibEstudio !== null} transparent={true} animationType="slide">
      <View style={styles.modalCenterOverlay}>
        <View style={[styles.destinoBox, {maxHeight: '80%', width: '90%'}]}>
          <Text style={styles.qualidadeTitle}>
            {modalBibEstudio === 'local' ? 'Biblioteca Local' : 'Biblioteca LRC'}
          </Text>
    
          {!pastaBibEstudio ? (
            // TELA 1: LISTA AS PASTAS
            <>
              <Text style={styles.qualidadeSubtitle}>Escolha uma pasta para buscar o áudio</Text>
              <ScrollView style={styles.destinoPastasScroll}>
                {(modalBibEstudio === 'local' ? pastas : pastasLrc).length === 0 ? (
                  <Text style={{color: '#777', textAlign: 'center', marginTop: 10}}>Nenhuma pasta criada.</Text>
                ) : (
                  (modalBibEstudio === 'local' ? pastas : pastasLrc).map((pasta: string) => (
                  <TouchableOpacity key={pasta} style={styles.btnDestinoPasta} onPress={() => abrirPastaNoEstudio(pasta, modalBibEstudio!)}>
                    <Ionicons name="folder" size={20} color={modalBibEstudio === 'local' ? '#FFCA28' : '#FF9800'} style={{marginRight: 10}}/>
                    <Text style={styles.qualidadeBtnText}>{pasta}</Text>
                  </TouchableOpacity>
                  ))
                )}
              </ScrollView>
            </>
          ) : (
            // TELA 2: LISTA OS ARQUIVOS DENTRO DA PASTA
            <>
              <Text style={styles.qualidadeSubtitle}>Músicas em: {pastaBibEstudio}</Text>
              <ScrollView style={styles.destinoPastasScroll}>
                {arquivosBibEstudio.length === 0 ? (
                  <Text style={{color: '#777', textAlign: 'center', marginTop: 10}}>Nenhum áudio encontrado nesta pasta.</Text>
                ) : (
                  arquivosBibEstudio.map((arq: string) => (
                  <TouchableOpacity key={arq} style={styles.btnDestinoPasta} onPress={() => selecionarArquivoBibEstudio(arq, modalBibEstudio!)}>
                    <Ionicons name="play-circle" size={20} color="#4CAF50" style={{marginRight: 10}}/>
                    <Text style={styles.qualidadeBtnText} numberOfLines={1}>{arq}</Text>
                  </TouchableOpacity>
                  ))
                )}
              </ScrollView>
              <TouchableOpacity style={[styles.qualidadeCancelarBtn, {marginBottom: 10}]} onPress={() => { setPastaBibEstudio(null); setArquivosBibEstudio([]); }}>
                <Text style={[styles.qualidadeCancelarText, {color: '#A0A0A0'}]}>⬅ Voltar para Pastas</Text>
              </TouchableOpacity>
            </>
          )}
    
          <TouchableOpacity style={styles.qualidadeCancelarBtn} onPress={() => { setModalBibEstudio(null); setPastaBibEstudio(null); setArquivosBibEstudio([]); }}>
            <Text style={styles.qualidadeCancelarText}>Cancelar / Fechar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}
