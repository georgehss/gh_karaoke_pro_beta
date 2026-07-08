import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Keyboard, View, Text, TouchableOpacity, Modal, TextInput, ScrollView, FlatList, ActivityIndicator, Image, Platform, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { styles } from '../../styles/indexStyles';

export default function ModalSalvarYtEstudio(props: any) {
  const { modalSalvarYtEstudio, setModalSalvarYtEstudio, destinoYtSelecionado, setDestinoYtSelecionado, salvarNoDispositivoEstudio, pastas, pastasLrc, confirmarSalvarYtEstudio } = props;

  return (
    <Modal visible={!!modalSalvarYtEstudio} transparent={true} animationType="slide">
      <View style={styles.modalCenterOverlay}>
        <View style={[styles.destinoBox, {maxHeight: '80%'}]}>
          <Text style={styles.qualidadeTitle}>Áudio Importado!</Text>
          <Text style={styles.qualidadeSubtitle}>Deseja salvar uma cópia definitiva deste áudio na sua biblioteca?</Text>
          
          {!destinoYtSelecionado ? (
            <>
              <TouchableOpacity style={[styles.btnDestinoCelular, {backgroundColor: '#4CAF50', marginBottom: 10}]} onPress={() => setDestinoYtSelecionado('local')}>
                <Ionicons name="folder" size={20} color="#FFF" style={{marginRight: 10}}/>
                <Text style={styles.qualidadeBtnText}>Salvar na Biblioteca Local</Text>
              </TouchableOpacity>
    
              <TouchableOpacity style={[styles.btnDestinoCelular, {backgroundColor: '#FF9800', marginBottom: 10}]} onPress={() => setDestinoYtSelecionado('lrc')}>
                <Ionicons name="musical-notes" size={20} color="#FFF" style={{marginRight: 10}}/>
                <Text style={styles.qualidadeBtnText}>Salvar na Biblioteca LRC</Text>
              </TouchableOpacity>
    
              {/* --- NOVO BOTÃO DE MEMÓRIA INTERNA AQUI --- */}
              <TouchableOpacity style={[styles.btnDestinoCelular, {backgroundColor: '#9C27B0'}]} onPress={salvarNoDispositivoEstudio}>
                <Ionicons name="phone-portrait" size={20} color="#FFF" style={{marginRight: 10}}/>
                <Text style={styles.qualidadeBtnText}>Salvar no Dispositivo (Celular/PC)</Text>
              </TouchableOpacity>
    
              <TouchableOpacity style={styles.qualidadeCancelarBtn} onPress={() => { setModalSalvarYtEstudio(null); setDestinoYtSelecionado(null); }}>
                <Text style={styles.qualidadeCancelarText}>Não, manter apenas temporário</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Text style={styles.divisorDestino}>--- ESCOLHA A PASTA ---</Text>
              <ScrollView style={styles.destinoPastasScroll}>
                {(destinoYtSelecionado === 'local' ? pastas : pastasLrc).length === 0 ? (
                  <Text style={{color: '#777', textAlign: 'center', marginTop: 10}}>Nenhuma pasta criada nesta biblioteca.</Text>
                ) : (
                  (destinoYtSelecionado === 'local' ? pastas : pastasLrc).map((pasta: string) => (
                  <TouchableOpacity key={pasta} style={styles.btnDestinoPasta} onPress={() => confirmarSalvarYtEstudio(pasta)}>
                    <Ionicons name="folder" size={20} color={destinoYtSelecionado === 'local' ? '#FFCA28' : '#FF9800'} style={{marginRight: 10}}/>
                    <Text style={styles.qualidadeBtnText}>Salvar em: {pasta}</Text>
                  </TouchableOpacity>
                  ))
                )}
              </ScrollView>
              <TouchableOpacity style={styles.qualidadeCancelarBtn} onPress={() => setDestinoYtSelecionado(null)}>
                <Text style={styles.qualidadeCancelarText}>⬅ Voltar</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}
