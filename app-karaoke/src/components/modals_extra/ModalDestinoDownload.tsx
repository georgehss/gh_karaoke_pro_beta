import React from 'react';
import { Modal, View, Text } from 'react-native';

export default function ModalDestinoDownload({ visivel, onClose }) {
  if (!visivel) return null;
  return (
    <Modal visible={visivel} transparent={true} animationType="slide">
      <View><Text>Modal Destino</Text></View>
    </Modal>
  );
}