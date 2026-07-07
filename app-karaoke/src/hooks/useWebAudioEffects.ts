import { useState, useRef, useEffect } from 'react';
import { Platform } from 'react-native';

export interface MicDevice {
  label: string;
  deviceId: string;
}

export function useWebAudioEffects(arquivoPro: any, lrcAudioUri: string | null) {
  const [micAtivo, setMicAtivo] = useState<boolean>(false);
  const [volMic, setVolMic] = useState<number>(1.0);
  const [graveNivel, setGraveNivel] = useState<number>(0);
  const [medioNivel, setMedioNivel] = useState<number>(0);
  const [agudoNivel, setAgudoNivel] = useState<number>(0);
  const [echoNivel, setEchoNivel] = useState<number>(0);
  const [echoTempo, setEchoTempo] = useState<number>(0.3);
  const [echoFeedback, setEchoFeedback] = useState<number>(0.2);
  const [reverbNivel, setReverbNivel] = useState<number>(0);
  const [reverbTempo, setReverbTempo] = useState<number>(2.5);

  const [micDevices, setMicDevices] = useState<MicDevice[]>([]);
  const [selectedMicId, setSelectedMicId] = useState<string | null>(null);
  const [mostrarInterfaces, setMostrarInterfaces] = useState<boolean>(false);

  const [eqPlaybackAtivo, setEqPlaybackAtivo] = useState<boolean>(false);
  const [eqPlaybackExpandido, setEqPlaybackExpandido] = useState<boolean>(false);
  const [eqGrave, setEqGrave] = useState<number>(0);
  const [eqMedio, setEqMedio] = useState<number>(0);
  const [eqAgudo, setEqAgudo] = useState<number>(0);
  const [eqGanho, setEqGanho] = useState<number>(1);

  const audioContextRef = useRef<any>(null);
  const micStreamRef = useRef<any>(null);
  const nodesRef = useRef<any>({});

  const eqContextRef = useRef<any>(null);
  const eqSourceNodesRef = useRef<Map<HTMLMediaElement, any>>(new Map());
  const eqFiltersRef = useRef<any>({});

  const criarBufferReverb = (ctx: any, duracao: number, decaimento: number) => {
    const taxaAmostragem = ctx.sampleRate;
    const tamanho = taxaAmostragem * duracao;
    const impulso = ctx.createBuffer(2, tamanho, taxaAmostragem);
    const canalEsq = impulso.getChannelData(0);
    const canalDir = impulso.getChannelData(1);
    for (let i = 0; i < tamanho; i++) {
      const n = i >= tamanho ? 0 : Math.pow(1 - i / tamanho, decaimento);
      canalEsq[i] = (Math.random() * 2 - 1) * n;
      canalDir[i] = (Math.random() * 2 - 1) * n;
    }
    return impulso;
  };

  const carregarDispositivosDeAudio = async () => {
    if (Platform.OS === 'web' && navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
      try {
        await navigator.mediaDevices.getUserMedia({ audio: true });
        const devices = await navigator.mediaDevices.enumerateDevices();
        const audioInputs = devices.filter(device => device.kind === 'audioinput');
        setMicDevices(audioInputs.map(d => ({
          label: d.label || `Interface USB (${d.deviceId.slice(0, 5)}...)`,
          deviceId: d.deviceId
        })));
        if (audioInputs.length > 0 && !selectedMicId) {
          setSelectedMicId(audioInputs[0].deviceId);
        }
      } catch (e) {
        console.log("Erro ao carregar dispositivos de áudio", e);
      }
    }
  };

  const alternarMicrofone = async () => {
    if (Platform.OS !== 'web') {
      alert("No celular, o retorno de voz ao vivo requer um módulo nativo customizado (EAS Build).");
      return;
    }
    if (micAtivo) {
      if (micStreamRef.current) micStreamRef.current.getTracks().forEach((t: any) => t.stop());
      if (audioContextRef.current) audioContextRef.current.close();
      setMicAtivo(false);
    } else {
      try {
        const constraints: any = { echoCancellation: false, noiseSuppression: false, autoGainControl: false };
        if (selectedMicId) constraints.deviceId = { exact: selectedMicId };
        const stream = await navigator.mediaDevices.getUserMedia({ audio: constraints });
        micStreamRef.current = stream;
        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
        audioContextRef.current = ctx;

        const source = ctx.createMediaStreamSource(stream);
        const gainNode = ctx.createGain(); gainNode.gain.value = volMic;
        const bassNode = ctx.createBiquadFilter(); bassNode.type = 'lowshelf'; bassNode.frequency.value = 250; bassNode.gain.value = graveNivel;
        const midNode = ctx.createBiquadFilter(); midNode.type = 'peaking'; midNode.frequency.value = 1000; midNode.Q.value = 1; midNode.gain.value = medioNivel;
        const trebleNode = ctx.createBiquadFilter(); trebleNode.type = 'highshelf'; trebleNode.frequency.value = 4000; trebleNode.gain.value = agudoNivel;
        
        const delayNode = ctx.createDelay(3.0); delayNode.delayTime.value = echoTempo;
        const delayGain = ctx.createGain(); delayGain.gain.value = echoNivel;
        const feedbackGain = ctx.createGain(); feedbackGain.gain.value = echoFeedback;
        const convolverNode = ctx.createConvolver(); convolverNode.buffer = criarBufferReverb(ctx, reverbTempo, 2.0);
        const reverbGain = ctx.createGain(); reverbGain.gain.value = reverbNivel;

        nodesRef.current = { gainNode, bassNode, midNode, trebleNode, delayNode, delayGain, feedbackGain, convolverNode, reverbGain };

        source.connect(bassNode); bassNode.connect(midNode); midNode.connect(trebleNode); trebleNode.connect(gainNode); gainNode.connect(ctx.destination);
        trebleNode.connect(delayNode); delayNode.connect(delayGain); delayGain.connect(ctx.destination);
        delayNode.connect(feedbackGain); feedbackGain.connect(delayNode);
        trebleNode.connect(convolverNode); convolverNode.connect(reverbGain); reverbGain.connect(ctx.destination);
        setMicAtivo(true);
      } catch (e) {
        alert("Erro ao acessar o microfone.");
      }
    }
  };

  useEffect(() => {
    if (micAtivo && nodesRef.current) {
      if (nodesRef.current.gainNode) nodesRef.current.gainNode.gain.value = volMic;
      if (nodesRef.current.bassNode) nodesRef.current.bassNode.gain.value = graveNivel;
      if (nodesRef.current.midNode) nodesRef.current.midNode.gain.value = medioNivel;
      if (nodesRef.current.trebleNode) nodesRef.current.trebleNode.gain.value = agudoNivel;
      if (nodesRef.current.delayGain) nodesRef.current.delayGain.gain.value = echoNivel;
      if (nodesRef.current.delayNode) nodesRef.current.delayNode.delayTime.value = echoTempo;
      if (nodesRef.current.feedbackGain) nodesRef.current.feedbackGain.gain.value = echoFeedback;
      if (nodesRef.current.reverbGain) nodesRef.current.reverbGain.gain.value = reverbNivel;
    }
  }, [volMic, graveNivel, medioNivel, agudoNivel, echoNivel, echoTempo, echoFeedback, reverbNivel, micAtivo]);

  useEffect(() => {
    if (micAtivo && audioContextRef.current && nodesRef.current?.convolverNode) {
      nodesRef.current.convolverNode.buffer = criarBufferReverb(audioContextRef.current, reverbTempo, 2.0);
    }
  }, [reverbTempo, micAtivo]);

  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const aplicarEqualizador = () => {
      const mediaEl = arquivoPro ? document.querySelector('video') : (lrcAudioUri ? document.querySelector('audio') : document.querySelector('video') || document.querySelector('audio'));
      if (!mediaEl) return;

      if (mediaEl.getAttribute('crossorigin') !== 'anonymous') {
        mediaEl.setAttribute('crossorigin', 'anonymous');
        const tempo = mediaEl.currentTime; const pausado = mediaEl.paused; const url = mediaEl.src;
        if (url) {
          mediaEl.src = ''; mediaEl.src = url; mediaEl.currentTime = tempo;
          if (!pausado) mediaEl.play().catch(() => {});
        }
      }

      if (!eqContextRef.current) {
        eqContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        const bass = eqContextRef.current.createBiquadFilter(); bass.type = 'lowshelf'; bass.frequency.value = 250;
        const mid = eqContextRef.current.createBiquadFilter(); mid.type = 'peaking'; mid.frequency.value = 1000; mid.Q.value = 1;
        const treble = eqContextRef.current.createBiquadFilter(); treble.type = 'highshelf'; treble.frequency.value = 4000;
        const booster = eqContextRef.current.createGain();
        eqFiltersRef.current = { bass, mid, treble, booster };
      }

      if (eqContextRef.current.state === 'suspended') eqContextRef.current.resume();
      const { bass, mid, treble, booster } = eqFiltersRef.current;
      bass.gain.value = eqGrave; mid.gain.value = eqMedio; treble.gain.value = eqAgudo; booster.gain.value = eqGanho;

      let sourceNode = eqSourceNodesRef.current.get(mediaEl);
      if (!sourceNode) {
        try {
          sourceNode = eqContextRef.current.createMediaElementSource(mediaEl);
          eqSourceNodesRef.current.set(mediaEl, sourceNode);
        } catch (e) { return; }
      }

      try {
        sourceNode.disconnect(); booster.disconnect(); bass.disconnect(); mid.disconnect(); treble.disconnect();
      } catch (e) {}

      if (eqPlaybackAtivo) {
        sourceNode.connect(booster); booster.connect(bass); bass.connect(mid); mid.connect(treble); treble.connect(eqContextRef.current.destination);
      } else {
        sourceNode.connect(eqContextRef.current.destination);
      }
    };

    const timer = setTimeout(aplicarEqualizador, 1000);
    return () => clearTimeout(timer);
  }, [eqPlaybackAtivo, eqGrave, eqMedio, eqAgudo, eqGanho, arquivoPro, lrcAudioUri]);

  return {
    micAtivo, volMic, setVolMic, graveNivel, setGraveNivel, medioNivel, setMedioNivel, agudoNivel, setAgudoNivel,
    echoNivel, setEchoNivel, echoTempo, setEchoTempo, echoFeedback, setEchoFeedback, reverbNivel, setReverbNivel, reverbTempo, setReverbTempo,
    micDevices, selectedMicId, setSelectedMicId, mostrarInterfaces, setMostrarInterfaces, carregarDispositivosDeAudio, alternarMicrofone,
    eqPlaybackAtivo, setEqPlaybackAtivo, eqPlaybackExpandido, setEqPlaybackExpandido, eqGrave, setEqGrave, eqMedio, setEqMedio, eqAgudo, setEqAgudo, eqGanho, setEqGanho
  };
}
