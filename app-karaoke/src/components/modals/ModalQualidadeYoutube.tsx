import React from 'react';
import { Modal, View, Text, TouchableOpacity } from 'react-native';
import { styles } from '../../styles/indexStyles';

interface ModalQualidadeYoutubeProps {
  visivel: boolean;
  onCancelar: () => void;
  titulo?: string;
  tipo?: 'video' | 'audio';
  onEscolherQualidade: (resolucao: string, extensao: string) => void;
}

export default function ModalQualidadeYoutube({
  visivel,
  onCancelar,
  titulo,
  tipo,
  onEscolherQualidade,
}: ModalQualidadeYoutubeProps) {
  return (
    <Modal visible={visivel} transparent={true} animationType="slide">
      <View style={styles.modalCenterOverlay}>
        <View style={styles.qualidadeBox}>
          <Text style={styles.qualidadeTitle}>Escolha a Qualidade</Text>
          <Text style={styles.qualidadeSubtitle} numberOfLines={2}>
            {titulo}
          </Text>
          <View style={styles.qualidadeOptionsContainer}>
            {tipo === 'video' ? (
              <>
                <TouchableOpacity style={styles.qualidadeBtn} onPress={() => onEscolherQualidade('1080', 'mp4')}>
                  <Text style={styles.qualidadeBtnText}>1080p (Full HD)</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.qualidadeBtn} onPress={() => onEscolherQualidade('720', 'mp4')}>
                  <Text style={styles.qualidadeBtnText}>720p (HD Padrão)</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.qualidadeBtn} onPress={() => onEscolherQualidade('480', 'mp4')}>
                  <Text style={styles.qualidadeBtnText}>480p (Qualidade SD)</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.qualidadeBtn} onPress={() => onEscolherQualidade('360', 'mp4')}>
                  <Text style={styles.qualidadeBtnText}>360p (Econômico)</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <TouchableOpacity style={styles.qualidadeBtnAudio} onPress={() => onEscolherQualidade('192', 'wav')}>
                  <Text style={styles.qualidadeBtnText}>WAV (Alta Qualidade)</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.qualidadeBtnAudio} onPress={() => onEscolherQualidade('320', 'mp3')}>
                  <Text style={styles.qualidadeBtnText}>MP3 320kbps (Ótimo)</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.qualidadeBtnAudio} onPress={() => onEscolherQualidade('128', 'mp3')}>
                  <Text style={styles.qualidadeBtnText}>MP3 128kbps (Leve)</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
          <TouchableOpacity style={styles.qualidadeCancelarBtn} onPress={onCancelar}>
            <Text style={styles.qualidadeCancelarText}>Cancelar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}