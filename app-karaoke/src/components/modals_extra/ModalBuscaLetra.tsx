import React from 'react';
import { Modal, View, Text } from 'react-native';

export default function ModalBuscaLetra({ visivel, onClose }) {
  if (!visivel) return null;
  return (
    <Modal visible={visivel} transparent={true} animationType="fade">
       <View><Text>Modal Busca Letra</Text></View>
    </Modal>
  );
}