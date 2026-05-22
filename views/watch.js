import { layout, escapeHtml } from './layout.js';

export function renderWatch({ file, hasSubtitle }) {
  const videoUrl = `/video?file=${encodeURIComponent(file)}`;
  const subtitleUrl = hasSubtitle
    ? `/subtitle?file=${encodeURIComponent(file.replace(/\.\w+$/, '.vtt'))}`
    : null;

  const filename = file.split('/').pop().replace(/\.\w+$/, '');

  const body = `
    <style>
      body {
        background: #000;
        background-image: none;
        overflow: hidden;
      }
      .player {
        position: fixed;
        inset: 0;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .player video {
        width: 100%;
        height: 100%;
        background: #000;
        outline: none;
      }
      .controls-top {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        padding: 18px 24px;
        z-index: 10;
        display: flex;
        align-items: center;
        gap: 16px;
        background: linear-gradient(180deg, rgba(0,0,0,0.7), transparent);
        opacity: 0;
        transition: opacity 0.3s;
      }
      .player:hover .controls-top,
      .controls-top:hover {
        opacity: 1;
      }
      .controls-top a {
        color: var(--text);
        text-decoration: none;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        font-size: 14px;
        padding: 6px 12px;
        border-radius: 4px;
        transition: background 0.2s;
      }
      .controls-top a:hover {
        background: rgba(212, 162, 86, 0.15);
        color: var(--accent);
      }
      .controls-top .now-playing {
        font-family: Georgia, serif;
        font-size: 14px;
        color: var(--text-dim);
        font-style: italic;
        margin-left: auto;
      }
    </style>

    <div class="player">
      <div class="controls-top">
        <a href="/">← Voltar</a>
        <span class="now-playing">${escapeHtml(filename)}</span>
      </div>

      <video controls autoplay playsinline crossorigin="anonymous">
        <source src="${videoUrl}">
        ${
          subtitleUrl
            ? `<track kind="subtitles" src="${subtitleUrl}" srclang="pt" label="Português" default>`
            : ''
        }
        Seu navegador não suporta a tag <code>&lt;video&gt;</code>.
      </video>
    </div>

    <script>
      // Atalhos de teclado: espaço = play/pause, setas = seek 10s, F = fullscreen, M = mute
      const v = document.querySelector('video');
      document.addEventListener('keydown', (e) => {
        if (e.target.tagName === 'INPUT') return;
        switch (e.key.toLowerCase()) {
          case ' ': e.preventDefault(); v.paused ? v.play() : v.pause(); break;
          case 'arrowright': v.currentTime += 10; break;
          case 'arrowleft':  v.currentTime -= 10; break;
          case 'f': document.fullscreenElement ? document.exitFullscreen() : v.requestFullscreen(); break;
          case 'm': v.muted = !v.muted; break;
        }
      });
    </script>
  `;

  return layout({ title: `${filename} · Pobreflix`, body });
}
