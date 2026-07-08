import React from 'react';
import { View, Text, TouchableOpacity, Modal, TextInput, ScrollView, FlatList, ActivityIndicator, Image, Platform, Linking, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { styles } from '../../styles/indexStyles';

export default function ModalMetadadosLrc(props: any) {
  const { modalMetadadosLrc, setModalMetadadosLrc, salvarArquivoLRC, lrcMetaFileName, setLrcMetaFileName, lrcMetaTitle, setLrcMetaTitle, lrcMetaArtist, setLrcMetaArtist, lrcMetaAlbum, setLrcMetaAlbum, lrcMetaBy, setLrcMetaBy } = props;

  return (
    <Modal visible={modalMetadadosLrc} transparent={false} animationType="slide">
      <SafeAreaView style={styles.metaContainer}>
        <View style={styles.metaHeader}>
          <TouchableOpacity onPress={() => setModalMetadadosLrc(false)} style={{flexDirection: 'row', alignItems: 'center'}}>
            <Ionicons name="arrow-back" size={24} color="#FFF" style={{marginRight: 10}}/>
            <Text style={styles.metaHeaderTitle}>Editar Informações (LRC)</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={salvarArquivoLRC}>
            <Ionicons name="save" size={28} color="#FF9800" />
          </TouchableOpacity>
        </View>
    
        <ScrollView style={styles.metaScroll}>
          <Text style={styles.metaInfoText}>As informações abaixo serão salvas no cabeçalho do arquivo.</Text>
          
          <View style={styles.metaInputGroup}>
            <Text style={styles.metaLabel}>Nome do Arquivo (sem .lrc)</Text>
            <TextInput style={styles.metaInput} value={lrcMetaFileName} onChangeText={setLrcMetaFileName} placeholderTextColor="#777" />
          </View>
    
          <View style={styles.metaInputGroup}>
            <Text style={styles.metaLabel}>Título da Música</Text>
            <TextInput style={styles.metaInput} value={lrcMetaTitle} onChangeText={setLrcMetaTitle} placeholderTextColor="#777" />
          </View>
    
          <View style={styles.metaInputGroup}>
            <Text style={styles.metaLabel}>Artista</Text>
            <TextInput style={styles.metaInput} value={lrcMetaArtist} onChangeText={setLrcMetaArtist} placeholderTextColor="#777" />
          </View>
    
          <View style={styles.metaInputGroup}>
            <Text style={styles.metaLabel}>Álbum</Text>
            <TextInput style={styles.metaInput} value={lrcMetaAlbum} onChangeText={setLrcMetaAlbum} placeholderTextColor="#777" />
          </View>
    
          <View style={styles.metaInputGroup}>
            <Text style={styles.metaLabel}>Criador da Letra</Text>
            <TextInput style={styles.metaInput} value={lrcMetaBy} onChangeText={setLrcMetaBy} placeholderTextColor="#777" />
          </View>
    
          <View style={styles.metaInputGroupDisabled}>
            <Text style={styles.metaLabel}>Editor LRC Usado</Text>
            <Text style={styles.metaTextDisabled}>GH Karaokê</Text>
          </View>
    
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}
