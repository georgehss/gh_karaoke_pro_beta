import { LogBox } from 'react-native';
import { Stack } from 'expo-router';

// Oculta os avisos chatos de bibliotecas de terceiros que estão desatualizadas
LogBox.ignoreLogs([
  'props.pointerEvents is deprecated',
]);

export default function TabLayout() {

  return (
    <Stack screenOptions={{ headerShown: false }} />
  );
}