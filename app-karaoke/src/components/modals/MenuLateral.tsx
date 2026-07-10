import React from 'react';
import { Modal, View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { styles } from '../../styles/indexStyles';

import { useAuth } from '../../context/AuthContext';

interface MenuLateralProps {
  visivel: boolean;
  onFechar: () => void;
  onAbrirConfig: () => void;
  motorBusca: 'externo' | 'interno';
  setMotorBusca: (motor: 'externo' | 'interno') => void;
  onResgatarArquivos: () => void;
}

export default function MenuLateral({ visivel, onFechar, onAbrirConfig, motorBusca, setMotorBusca, onResgatarArquivos }: MenuLateralProps) {
  const { signOut } = useAuth();

  const handleSair = () => {
    onFechar();
    signOut();
  };

  return (
    <Modal visible={visivel} transparent={true} animationType="fade">
      <View style={styles.modalOverlay}>
        <View style={styles.menuBox}>
          
          {/* CABEÇALHO FIXO - Não vai rolar junto com a lista */}
          <View style={styles.menuHeader}>
            <Text style={styles.menuTitle}>Menu Opções</Text>
            <TouchableOpacity onPress={onFechar}>
              <Ionicons name="close" size={28} color="#A0A0A0" />
            </TouchableOpacity>
          </View>
          
          {/* ÁREA ROLÁVEL - Envolvemos todos os botões no ScrollView */}
          <ScrollView 
            showsVerticalScrollIndicator={false} // Esconde a barra de rolagem feia do navegador
            contentContainerStyle={{ paddingBottom: 30 }} // Dá um respiro no final da lista
          >
            <TouchableOpacity style={styles.menuItem} onPress={onAbrirConfig}>
              <Ionicons name="settings" size={24} color="#FFFFFF" />
              <Text style={styles.menuItemText}>Configurações</Text>
            </TouchableOpacity>

            <Text style={[styles.qualidadeSubtitle, {marginTop: 20}]}>Motor de Reprodução de Streaming</Text>

            <TouchableOpacity
              style={[styles.btnDestinoPasta, motorBusca === 'externo' && {backgroundColor: 'rgba(229, 9, 20, 0.2)', borderColor: '#E50914', borderWidth: 1}]}
              onPress={() => setMotorBusca('externo')}
            >
              <Ionicons name="server" size={24} color={motorBusca === 'externo' ? "#E50914" : "#A0A0A0"} style={{marginRight: 15}}/>
              <View style={{flex: 1}}>
                <Text style={[styles.qualidadeBtnText, motorBusca === 'externo' && {color: '#E50914'}]}>Servidor Externo (Backend)</Text>
                <Text style={{color: '#777', fontSize: 11}}>Baixa a mídia. Permite usar o Equalizador e IA.</Text>
              </View>
              {motorBusca === 'externo' && <Ionicons name="checkmark-circle" size={20} color="#E50914" />}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.btnDestinoPasta, motorBusca === 'interno' && {backgroundColor: 'rgba(33, 150, 243, 0.2)', borderColor: '#2196F3', borderWidth: 1}]}
              onPress={() => setMotorBusca('interno')}
            >
              <Ionicons name="phone-portrait" size={24} color={motorBusca === 'interno' ? "#2196F3" : "#A0A0A0"} style={{marginRight: 15}}/>
              <View style={{flex: 1}}>
                <Text style={[styles.qualidadeBtnText, motorBusca === 'interno' && {color: '#2196F3'}]}>Servidor Interno (Frontend)</Text>
                <Text style={{color: '#777', fontSize: 11}}>Toca direto do YouTube. Mais rápido, mas sem Equalizador.</Text>
              </View>
              {motorBusca === 'interno' && <Ionicons name="checkmark-circle" size={20} color="#2196F3" />}
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem} onPress={onResgatarArquivos}>
              <Ionicons name="folder-open" size={24} color="#FFFFFF" />
              <Text style={styles.menuItemText}>Resgatar Arquivos (Servidor)</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.menuItem} onPress={() => { onFechar(); alert("Obrigado por apoiar o GH Karaokê PRO!"); }}>
              <Ionicons name="heart" size={24} color="#E50914" />
              <Text style={styles.menuItemText}>Doações</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.menuItem} onPress={() => { onFechar(); alert("Módulo de compartilhamento em breve!"); }}>
              <Ionicons name="share-social" size={24} color="#2196F3" />
              <Text style={styles.menuItemText}>Compartilhar App</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.menuItem} onPress={() => { onFechar(); alert("GH Karaokê PRO v1.4.4\n\nDesenvolvido por: George Harrison."); }}>
              <Ionicons name="information-circle" size={24} color="#FFCA28" />
              <Text style={styles.menuItemText}>Sobre</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.menuItem, { marginTop: 30, borderTopWidth: 1, borderTopColor: '#444' }]} onPress={handleSair}>
              <Ionicons name="log-out-outline" size={24} color="#E50914" />
              <Text style={[styles.menuItemText, { color: '#E50914', fontWeight: 'bold' }]}>Sair da Conta</Text>
            </TouchableOpacity>
          </ScrollView>

        </View>
      </View>
    </Modal>
  );
}