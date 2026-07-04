// src/utils/monitorTemplate.ts

export const gerarHtmlMonitorExterno = (
  nomeInicial: string,
  uriInicial: string,
  isInterno: boolean,
  tempoAtual: number
): string => {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Tela Secundária - GH Karaokê</title>
        <style>
          body { margin: 0; background: black; display: flex; justify-content: center; align-items: center; height: 100vh; overflow: hidden; }
          video, iframe { width: 100%; height: 100%; object-fit: contain; border: none; }
          #infoBar { position: absolute; top: 0; left: 0; width: 100%; padding: 15px 20px; background: linear-gradient(to bottom, rgba(0,0,0,0.8), transparent); color: white; font-family: sans-serif; font-size: 22px; font-weight: bold; text-shadow: 2px 2px 4px #000; box-sizing: border-box; z-index: 10; display: flex; justify-content: space-between; pointer-events: none; }
          #status { color: #E50914; font-size: 16px; font-weight: bold; }
          #btnForcarPlay { display: none; position: absolute; padding: 20px 40px; font-size: 20px; font-weight: bold; background: #E50914; color: white; border: none; border-radius: 10px; cursor: pointer; z-index: 20; box-shadow: 0px 4px 10px rgba(0,0,0,0.5); }
        </style>
      </head>
      <body>
        <div id="infoBar">
          <span id="titulo">${nomeInicial}</span>
          <span id="status">Ao Vivo</span>
        </div>
        
        <button id="btnForcarPlay">▶ CLIQUE AQUI PARA LIBERAR O ÁUDIO</button>
        
        <div id="playerContainer" style="width: 100%; height: 100%;">
          ${isInterno 
            ? `<iframe id="videoIframe" src="https://www.youtube.com/embed/${uriInicial}?autoplay=1&start=${Math.floor(tempoAtual)}" allow="autoplay; fullscreen"></iframe>`
            : `<video id="videoPlayer" crossorigin="anonymous" autoplay controls src="${uriInicial}"></video>`
          }
        </div>
        
        <script>
          const isInternoIncial = ${isInterno};
          const tituloSpan = document.getElementById('titulo');
          const btnPlay = document.getElementById('btnForcarPlay');
          const playerContainer = document.getElementById('playerContainer');

          let vid = document.getElementById('videoPlayer');
          let iframe = document.getElementById('videoIframe');

          if (!isInternoIncial && vid && '${uriInicial}' !== '') {
              const iniciarTempo = () => {
                  vid.currentTime = ${tempoAtual};
                  let playPromise = vid.play();
                  if (playPromise !== undefined) {
                      playPromise.catch(error => {
                          console.log("Autoplay bloqueado.", error);
                          btnPlay.style.display = 'block';
                      });
                  }
              };
              
              if (vid.readyState >= 1) {
                  iniciarTempo();
              } else {
                  vid.addEventListener('loadedmetadata', iniciarTempo);
              }
          }

          btnPlay.addEventListener('click', () => {
              if (vid) { vid.play(); if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume(); }
              btnPlay.style.display = 'none';
          });

          let audioCtx, source, bass, mid, treble, booster;
          let isEqActive = false;

          function initAudio() {
              if (!vid) return; 
              if (audioCtx) return; 
              audioCtx = new (window.AudioContext || window.webkitAudioContext)();
              source = audioCtx.createMediaElementSource(vid);
              
              bass = audioCtx.createBiquadFilter(); bass.type = 'lowshelf'; bass.frequency.value = 250;
              mid = audioCtx.createBiquadFilter(); mid.type = 'peaking'; mid.frequency.value = 1000; mid.Q.value = 1;
              treble = audioCtx.createBiquadFilter(); treble.type = 'highshelf'; treble.frequency.value = 4000;
              booster = audioCtx.createGain();

              applyRouting();
          }

          function applyRouting() {
              if (!audioCtx || !source) return;
              source.disconnect(); booster.disconnect(); bass.disconnect(); mid.disconnect(); treble.disconnect();
              if (isEqActive) {
                  source.connect(booster); booster.connect(bass); bass.connect(mid); mid.connect(treble); treble.connect(audioCtx.destination);
              } else { source.connect(audioCtx.destination); }
          }

          window.addEventListener('message', (event) => {
            const data = event.data;
            if (!data) return;

            if (data.type === 'tocar_nova_musica') {
              tituloSpan.innerText = data.nome;
              btnPlay.style.display = 'none';
              
              if (data.isInterno) {
                 playerContainer.innerHTML = \`<iframe id="videoIframe" src="https://www.youtube.com/embed/\${data.uri}?autoplay=1" allow="autoplay; fullscreen"></iframe>\`;
                 vid = null; iframe = document.getElementById('videoIframe');
              } else {
                 playerContainer.innerHTML = \`<video id="videoPlayer" crossorigin="anonymous" autoplay controls src="\${data.uri}"></video>\`;
                 vid = document.getElementById('videoPlayer'); iframe = null;

                 let playPromise2 = vid.play();
                 if (playPromise2 !== undefined) { playPromise2.catch(e => btnPlay.style.display = 'block'); }
                 
                 vid.addEventListener('ended', () => { window.opener.postMessage({ type: 'musica_terminou_externa' }, '*'); });
                 if(audioCtx) { audioCtx.close(); audioCtx = null; }
                 initAudio();
                 if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
              }
            } else if (data.type === 'sync_eq' && vid) {
              initAudio();
              if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
              
              isEqActive = data.ativo;
              if (booster) booster.gain.value = data.ganho;
              if (bass) bass.gain.value = data.grave;
              if (mid) mid.gain.value = data.medio;
              if (treble) treble.gain.value = data.agudo;
              applyRouting();
            }
          });

          if (vid) { vid.addEventListener('ended', () => { window.opener.postMessage({ type: 'musica_terminou_externa' }, '*'); }); }
        </script>
      </body>
    </html>
  `;
};