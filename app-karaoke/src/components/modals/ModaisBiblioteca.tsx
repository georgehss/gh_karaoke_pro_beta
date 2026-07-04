import React from 'react';
import { Modal, View, Text, TouchableOpacity, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { styles } from '../../styles/indexStyles';

// 1. MODAL CRIAR NOVA PASTA (Serve tanto para Local quanto para LRC)
interface ModalNovaPastaProps {
  visivel: boolean; onClose: () => void; titulo: string; placeholder: string; valor: string; setValor: (v: string) => void; onCriar: () => void;
}
export function ModalNovaPasta({ visivel, onClose, titulo, placeholder, valor, setValor, onCriar }: ModalNovaPastaProps) {
  return (
    <Modal visible={visivel} transparent={true} animationType="fade">
      <View style={styles.modalCenterOverlay}>
        <View style={styles.qualidadeBox}>
          <Text style={styles.qualidadeTitle}>{titulo}</Text>
          <TextInput style={styles.inputPasta} placeholder={placeholder} placeholderTextColor="#777" value={valor} onChangeText={setValor} autoFocus />
          <View style={{flexDirection: 'row', gap: 15, marginTop: 20}}>
            <TouchableOpacity style={styles.qualidadeCancelarBtn} onPress={onClose}><Text style={styles.qualidadeCancelarText}>Cancelar</Text></TouchableOpacity>
            <TouchableOpacity style={styles.btnSalvarPasta} onPress={onCriar}><Text style={styles.btnSalvarPastaText}>Criar</Text></TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// 2. MODAL DE ORDENAÇÃO
interface ModalOrdemProps {
  visivel: boolean; onClose: () => void; criterioAtual: string; onMudarOrdem: (c: any) => void;
}
export function ModalOrdem({ visivel, onClose, criterioAtual, onMudarOrdem }: ModalOrdemProps) {
  return (
    <Modal visible={visivel} transparent={true} animationType="fade">
      <View style={styles.modalCenterOverlay}>
        <View style={styles.destinoBox}>
          <Text style={styles.qualidadeTitle}>Organizar Arquivos</Text>
          <Text style={styles.qualidadeSubtitle}>Escolha a ordem de exibição das mídias</Text>

          <TouchableOpacity style={[styles.btnDestinoPasta, criterioAtual === 'a-z' && {borderColor: '#4CAF50', borderWidth: 1}]} onPress={() => onMudarOrdem('a-z')}>
            <Ionicons name="text" size={20} color={criterioAtual === 'a-z' ? "#4CAF50" : "#FFF"} style={{marginRight: 10}}/>
            <Text style={[styles.qualidadeBtnText, criterioAtual === 'a-z' && {color: '#4CAF50'}]}>Alfabética (A - Z)</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.btnDestinoPasta, criterioAtual === 'z-a' && {borderColor: '#4CAF50', borderWidth: 1}]} onPress={() => onMudarOrdem('z-a')}>
            <Ionicons name="text" size={20} color={criterioAtual === 'z-a' ? "#4CAF50" : "#FFF"} style={{marginRight: 10}}/>
            <Text style={[styles.qualidadeBtnText, criterioAtual === 'z-a' && {color: '#4CAF50'}]}>Alfabética Inversa (Z - A)</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.btnDestinoPasta, criterioAtual === 'recentes' && {borderColor: '#FF9800', borderWidth: 1}]} onPress={() => onMudarOrdem('recentes')}>
            <Ionicons name="time" size={20} color={criterioAtual === 'recentes' ? "#FF9800" : "#FFF"} style={{marginRight: 10}}/>
            <Text style={[styles.qualidadeBtnText, criterioAtual === 'recentes' && {color: '#FF9800'}]}>Mais Recentes (Celular)</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.btnDestinoPasta, criterioAtual === 'extensao' && {borderColor: '#2196F3', borderWidth: 1}]} onPress={() => onMudarOrdem('extensao')}>
            <Ionicons name="document" size={20} color={criterioAtual === 'extensao' ? "#2196F3" : "#FFF"} style={{marginRight: 10}}/>
            <Text style={[styles.qualidadeBtnText, criterioAtual === 'extensao' && {color: '#2196F3'}]}>Por Formato (.mp4, .mp3)</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.qualidadeCancelarBtn, {marginTop: 10}]} onPress={onClose}>
            <Text style={styles.qualidadeCancelarText}>Cancelar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

// 3. MODAL RENOMEAR
interface ModalRenomearBibProps {
  visivel: boolean; onClose: () => void; isLrc?: boolean; novoNome: string; setNovoNome: (v: string) => void; onSalvar: () => void;
}
export function ModalRenomearBib({ visivel, onClose, isLrc, novoNome, setNovoNome, onSalvar }: ModalRenomearBibProps) {
  return (
    <Modal visible={visivel} transparent={true} animationType="fade">
      <View style={styles.modalCenterOverlay}>
        <View style={styles.qualidadeBox}>
          <Text style={styles.qualidadeTitle}>Renomear Arquivo</Text>
          {isLrc && (
            <Text style={{color: '#FF9800', fontSize: 11, textAlign: 'center', marginBottom: 10}}>
              Aviso: Se mudar o nome de um arquivo LRC, não esqueça de renomear o áudio com o nome idêntico para manter o par!
            </Text>
          )}
          <TextInput style={styles.inputPasta} value={novoNome} onChangeText={setNovoNome} autoFocus placeholder="Digite o novo nome" />
          <View style={{flexDirection: 'row', gap: 15, marginTop: 20}}>
            <TouchableOpacity style={styles.qualidadeCancelarBtn} onPress={onClose}><Text style={styles.qualidadeCancelarText}>Cancelar</Text></TouchableOpacity>
            <TouchableOpacity style={styles.btnSalvarPasta} onPress={onSalvar}><Text style={styles.btnSalvarPastaText}>Salvar</Text></TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// 4. MODAL AÇÕES DO ARQUIVO
interface ModalAcaoArquivoProps {
  visivel: boolean; onClose: () => void; nomeArquivo?: string; isLrc?: boolean; onTocarAgora: () => void; onAddFila: () => void; onRenomear: () => void; onExportar: () => void; onApagar: () => void;
}
export function ModalAcaoArquivo({ visivel, onClose, nomeArquivo, isLrc, onTocarAgora, onAddFila, onRenomear, onExportar, onApagar }: ModalAcaoArquivoProps) {
  if (!visivel) return null;
  return (
    <Modal visible={visivel} transparent={true} animationType="slide">
      <View style={styles.modalCenterOverlay}>
        <View style={styles.qualidadeBox}>
          <Ionicons name="document-text" size={40} color="#FFD700" style={{marginBottom: 10}}/>
          <Text style={styles.qualidadeSubtitle} numberOfLines={2}>{nomeArquivo}</Text>
          
          {!isLrc && (
            <>
              <TouchableOpacity style={[styles.qualidadeBtn, {width: '100%'}]} onPress={onTocarAgora}><Text style={styles.qualidadeBtnText}>▶️ Tocar Agora</Text></TouchableOpacity>
              <TouchableOpacity style={[styles.qualidadeBtnAudio, {width: '100%'}]} onPress={onAddFila}><Text style={styles.qualidadeBtnText}>➕ Adicionar à Fila</Text></TouchableOpacity>
            </>
          )}

          <Text style={styles.divisorDestino}>--- GERENCIAR ARQUIVO ---</Text>

          <TouchableOpacity style={[styles.btnDestinoCelular, {backgroundColor: '#2196F3', marginBottom: 10, paddingVertical: 12}]} onPress={onRenomear}>
            <Ionicons name="pencil" size={18} color="#FFF" style={{marginRight: 10}} /><Text style={styles.qualidadeBtnText}>Renomear</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.btnDestinoCelular, {backgroundColor: '#4CAF50', marginBottom: 10, paddingVertical: 12}]} onPress={onExportar}>
            <Ionicons name="save" size={18} color="#FFF" style={{marginRight: 10}} /><Text style={styles.qualidadeBtnText}>Exportar (Salvar no Celular)</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.btnDestinoCelular, {backgroundColor: '#E50914', paddingVertical: 12}]} onPress={onApagar}>
            <Ionicons name="trash" size={18} color="#FFF" style={{marginRight: 10}} /><Text style={styles.qualidadeBtnText}>Apagar Definitivamente</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.qualidadeCancelarBtn} onPress={onClose}><Text style={styles.qualidadeCancelarText}>Cancelar</Text></TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}