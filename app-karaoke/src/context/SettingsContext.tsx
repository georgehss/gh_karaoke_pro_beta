import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

interface SettingsContextData {
  zoomLevel: number;
  aumentarZoom: () => void;
  diminuirZoom: () => void;
  resetarZoom: () => void;
}

const SettingsContext = createContext<SettingsContextData>({} as SettingsContextData);

// Função para salvar preferência
const saveZoomToStorage = async (zoom: number) => {
  if (Platform.OS === 'web') {
    localStorage.setItem('gh_karaoke_zoom', zoom.toString());
  } else {
    await SecureStore.setItemAsync('gh_karaoke_zoom', zoom.toString());
  }
};

export const SettingsProvider = ({ children }: { children: ReactNode }) => {
  const [zoomLevel, setZoomLevel] = useState(1.0); // 1.0 = 100%

  // Carrega o zoom salvo ao abrir o app
  useEffect(() => {
    const loadZoom = async () => {
      let savedZoom = null;
      if (Platform.OS === 'web') {
        savedZoom = localStorage.getItem('gh_karaoke_zoom');
      } else {
        savedZoom = await SecureStore.getItemAsync('gh_karaoke_zoom');
      }

      if (savedZoom) {
        const parsedZoom = parseFloat(savedZoom);
        setZoomLevel(parsedZoom);
        aplicarZoom(parsedZoom);
      }
    };
    loadZoom();
  }, []);

  // Aplica a mágica do Zoom no navegador (Web)
  const aplicarZoom = (zoom: number) => {
    if (Platform.OS === 'web') {
      // @ts-ignore -> Usado para o TypeScript não reclamar do DOM na Web
      document.body.style.zoom = zoom;
    }
  };

  const aumentarZoom = () => {
    if (zoomLevel < 1.5) { // Limite máximo de 150%
      const novoZoom = parseFloat((zoomLevel + 0.1).toFixed(1));
      setZoomLevel(novoZoom);
      aplicarZoom(novoZoom);
      saveZoomToStorage(novoZoom);
    }
  };

  const diminuirZoom = () => {
    if (zoomLevel > 0.5) { // Limite mínimo de 50%
      const novoZoom = parseFloat((zoomLevel - 0.1).toFixed(1));
      setZoomLevel(novoZoom);
      aplicarZoom(novoZoom);
      saveZoomToStorage(novoZoom);
    }
  };

  const resetarZoom = () => {
    setZoomLevel(1.0);
    aplicarZoom(1.0);
    saveZoomToStorage(1.0);
  };

  return (
    <SettingsContext.Provider value={{ zoomLevel, aumentarZoom, diminuirZoom, resetarZoom }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => useContext(SettingsContext);