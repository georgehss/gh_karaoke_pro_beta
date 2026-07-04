import React from 'react';
import { View, Text, TouchableOpacity, FlatList, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { styles } from '../styles/indexStyles';
import { LIBRARY_DIR, LRC_LIBRARY_DIR } from '../utils/indexUtils';

interface PainelBibliotecaProps {
  isLrc: boolean;
  telaAtiva: string;
  pastaAtual: string | null;
  pastas: string[];
  pastasVirtuais: Record<string, any>;
  modoVisao: string;
  renderFiltrosVisualizacao: (corAtiva: string) => React.ReactNode;
  renderPastaUnificada: (item: string, isLrc: boolean) => React.ReactNode;
  restaurarPastasSalvasPC: () => void;
  linkarPastaPCWeb: (isLrc: boolean) => void;
  setModalNovaPasta: (val: boolean) => void;
  voltarParaPastas: () => void;
  setModalOrdem: (val: boolean) => void;
  importarArquivos: () => void;
  modoSelecaoBib: boolean;
  selecionadosBib: string[];
  adicionarSelecionadosNaFila: () => void;
  exportarSelecionados: () => void;
  apagarSelecionados: () => void;
  cancelarSelecao: () => void;
  arquivosPasta: string[];
  iniciarModoSelecao: (nome: string) => void;
  toggleSelecaoArquivo: (nome: string) => void;
  acaoClicarArquivo: (nome: string, uriLocal: string) => void;
  abrirOpcoesLrc?: (nome: string) => void;
  apagarItem: (nome: string, isPasta: boolean) => void;
}

export default function PainelBiblioteca(props: PainelBibliotecaProps) {
  const corPrimaria = props.isLrc ? '#FF9800' : '#4CAF50';
  const corBotaoLink = '#2196F3';
  const corBotaoRestaurar = props.isLrc ? '#FF5500' : '#FF9800';

  return (
    <View style={[styles.biblioContainer, { display: (props.telaAtiva === (props.isLrc ? 'biblioteca_lrc' : 'biblioteca')) ? 'flex' : 'none' }]}>
      {props.pastaAtual === null ? (
        // ======================= TELA DE PASTAS =======================
        <>
          <View style={styles.biblioHeader}>
            <Text style={styles.biblioTitle}>{props.isLrc ? 'Biblioteca LRC' : 'Biblioteca Local'}</Text>
            <View style={{flexDirection: 'row', alignItems: 'center'}}>
              {props.renderFiltrosVisualizacao(corPrimaria)}

              {Platform.OS === 'web' && (
                <>
                  <TouchableOpacity style={[styles.btnNovaPasta, {backgroundColor: corBotaoRestaurar, marginRight: 10}]} onPress={props.restaurarPastasSalvasPC}>
                    <Ionicons name="refresh" size={18} color="#FFF" style={{marginRight: 5}}/>
                    <Text style={styles.btnNovaPastaText}>Restaurar PC</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.btnNovaPasta, {backgroundColor: corBotaoLink, marginRight: 10}]} onPress={() => props.linkarPastaPCWeb(props.isLrc)}>
                    <Ionicons name="link" size={18} color="#FFF" style={{marginRight: 5}}/>
                    <Text style={styles.btnNovaPastaText}>Linkar PC</Text>
                  </TouchableOpacity>
                </>
              )}

              <TouchableOpacity style={[styles.btnNovaPasta, props.isLrc && {backgroundColor: corPrimaria}]} onPress={() => props.setModalNovaPasta(true)}>
                <Ionicons name="add" size={18} color="#FFF" />
              </TouchableOpacity>
            </View>
          </View>

          {(props.pastas.length === 0 && Object.keys(props.pastasVirtuais).length === 0) ? (
            <View style={styles.emptyBiblio}>
              <Ionicons name={props.isLrc ? "musical-notes-outline" : "folder-outline"} size={60} color="#444" />
              <Text style={styles.emptyBiblioText}>{props.isLrc ? 'Nenhuma pasta LRC criada.' : 'Nenhuma pasta de gênero criada.'}</Text>
            </View>
          ) : (
            <FlatList
              key={`lista-${props.isLrc ? 'lrc' : 'local'}-${props.modoVisao}`}
              data={[...props.pastas, ...Object.keys(props.pastasVirtuais)]}
              extraData={props.pastasVirtuais}
              keyExtractor={(item) => item}
              numColumns={props.modoVisao === 'compacto' ? 3 : (props.modoVisao === 'detalhado' ? 2 : 1)}
              style={{ flex: 1, width: '100%' }}
              contentContainerStyle={{ paddingVertical: 10, flexGrow: 1 }}
              renderItem={({ item }) => props.renderPastaUnificada(item, props.isLrc) as React.ReactElement}
            />
          )}
        </>
      ) : (
        // ======================= TELA DENTRO DA PASTA =======================
        <>
          <View style={styles.biblioHeaderDentro}>
            <TouchableOpacity onPress={props.voltarParaPastas} style={{flexDirection: 'row', alignItems: 'center', flex: 1}}>
              <Ionicons name="arrow-back" size={24} color="#FFF" />
              <Text style={styles.biblioTitleDentro} numberOfLines={1}>{props.pastaAtual}</Text>
            </TouchableOpacity>

            <View style={{flexDirection: 'row', gap: 10}}>
              <TouchableOpacity style={[styles.btnImportar, {backgroundColor: '#555'}]} onPress={() => props.setModalOrdem(true)}>
                <Ionicons name="filter" size={18} color="#FFF" />
              </TouchableOpacity>
              <TouchableOpacity style={[styles.btnImportar, props.isLrc && {backgroundColor: corPrimaria}]} onPress={props.importarArquivos}>
                <Ionicons name="add" size={18} color="#FFF" style={{marginRight: 5}}/><Text style={styles.btnNovaPastaText}>{props.isLrc ? 'LRC/MP3' : 'Importar'}</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* BARRA DE AÇÕES MÚLTIPLAS */}
          {props.modoSelecaoBib && (
            <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'rgba(33, 150, 243, 0.2)', padding: 12, borderRadius: 10, marginBottom: 10, borderWidth: 1, borderColor: '#2196F3'}}>
              <Text style={{color: '#2196F3', fontWeight: 'bold', fontSize: 16}}>{props.selecionadosBib.length} item(ns)</Text>
              <View style={{flexDirection: 'row', gap: 15}}>
                {props.telaAtiva === 'biblioteca' && !props.isLrc && (
                  <TouchableOpacity onPress={props.adicionarSelecionadosNaFila} style={{padding: 5}}>
                    <Ionicons name="list" size={24} color="#4CAF50" />
                  </TouchableOpacity>
                )}
                <TouchableOpacity onPress={props.exportarSelecionados} style={{padding: 5}}>
                  <Ionicons name="share-social" size={24} color="#FFF" />
                </TouchableOpacity>
                <TouchableOpacity onPress={props.apagarSelecionados} style={{padding: 5}}>
                  <Ionicons name="trash" size={24} color="#E50914" />
                </TouchableOpacity>
                <TouchableOpacity onPress={props.cancelarSelecao} style={{padding: 5}}>
                  <Ionicons name="close-circle" size={24} color="#A0A0A0" />
                </TouchableOpacity>
              </View>
            </View>
          )}

          {props.arquivosPasta.length === 0 ? (
            <View style={styles.emptyBiblio}>
              <Ionicons name="document-text-outline" size={60} color="#444" />
              <Text style={styles.emptyBiblioText}>{props.isLrc ? 'Pasta LRC vazia.' : 'Pasta vazia.'}</Text>
              {!props.isLrc && <Text style={styles.emptyPlaylistSub}>Clique em Importar para adicionar do celular.</Text>}
            </View>
          ) : (
            <FlatList key={`${props.isLrc ? 'lrc' : 'local'}-arquivos`} data={props.arquivosPasta} keyExtractor={(item) => item} contentContainerStyle={{ paddingVertical: 10 }}
              renderItem={({ item }) => {
                const dirBase = props.isLrc ? LRC_LIBRARY_DIR : LIBRARY_DIR;
                const uriLocal = (Platform.OS === 'web' && props.pastaAtual && props.pastasVirtuais[props.pastaAtual])
                  ? (props.pastasVirtuais[props.pastaAtual].find((f: any) => f.nome === item)?.uri || '')
                  : `${dirBase}${props.pastaAtual}/${item}`;

                return (
                  <View style={styles.arquivoRow}>
                    <TouchableOpacity
                      style={styles.arquivoInfo}
                      onLongPress={() => props.iniciarModoSelecao(item)}
                      onPress={() => {
                        if (props.modoSelecaoBib) {
                          props.toggleSelecaoArquivo(item);
                        } else {
                          props.acaoClicarArquivo(item, uriLocal);
                        }
                      }}
                    >
                      {props.modoSelecaoBib && (
                        <Ionicons name={props.selecionadosBib.includes(item) ? "checkmark-circle" : "ellipse-outline"} size={24} color={props.selecionadosBib.includes(item) ? (props.isLrc ? "#2196F3" : "#4CAF50") : "#555"} style={{marginRight: 10}} />
                      )}
                      {props.isLrc ? (
                         <Ionicons name={item.endsWith('.lrc') ? "document-text" : "musical-note"} size={24} color={item.endsWith('.lrc') ? "#2196F3" : "#4CAF50"} />
                      ) : (
                         <Ionicons name={/\.(mp4|mkv|avi|mov|webm)$/i.test(item) ? "videocam" : "musical-note"} size={24} color="#4CAF50" />
                      )}
                      <Text style={styles.arquivoName} numberOfLines={1}>{item}</Text>
                    </TouchableOpacity>

                    {props.isLrc ? (
                      <View style={{flexDirection: 'row', alignItems: 'center'}}>
                        <TouchableOpacity style={{padding: 10}} onPress={() => props.abrirOpcoesLrc && props.abrirOpcoesLrc(item)}>
                          <Ionicons name="ellipsis-vertical" size={20} color="#FFF" />
                        </TouchableOpacity>
                        <TouchableOpacity style={{padding: 10}} onPress={() => props.apagarItem(item, false)}>
                          <Ionicons name="trash" size={20} color="#E50914" />
                        </TouchableOpacity>
                      </View>
                    ) : (
                      <TouchableOpacity style={{padding: 10}} onPress={() => props.apagarItem(item, false)}><Ionicons name="trash" size={20} color="#E50914" /></TouchableOpacity>
                    )}
                  </View>
                );
              }}
            />
          )}
        </>
      )}
    </View>
  );
}