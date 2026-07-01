// ===== Aston News — Radio bar avec métadonnées =====
(function () {

  function esc(str) {
    const d = document.createElement('div');
    d.textContent = str || '';
    return d.innerHTML;
  }

  async function initRadio() {
    const mount = document.getElementById('radio-bar-mount');
    if (!mount) return;

    // Chargement des réglages
    let settings = { radio_show_name: 'Radio', radio_stream_url: '', radio_enabled: '1' };
    try {
      const res = await fetch('/api/settings');
      const data = await res.json();
      if (data.ok) settings = { ...settings, ...data.settings };
    } catch (e) { console.warn('Réglages radio indisponibles', e); }

    const enabled = settings.radio_enabled === '1';

    mount.innerHTML = `
      <div class="radio-bar" id="radio-bar">
        <div class="radio-left">
          <div class="radio-cover" id="radio-cover">
            <div class="radio-cover-placeholder">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/>
                <line x1="12" y1="2" x2="12" y2="5"/><line x1="12" y1="19" x2="12" y2="22"/>
                <line x1="2" y1="12" x2="5" y2="12"/><line x1="19" y1="12" x2="22" y2="12"/>
              </svg>
            </div>
          </div>
          <div class="radio-info">
            <div class="radio-track" id="radio-track">${esc(settings.radio_show_name)}</div>
            <div class="radio-artist" id="radio-artist" hidden></div>
          </div>
        </div>
        <div class="radio-right">
          <span class="radio-status" id="radio-status">${enabled ? 'En direct' : 'Hors antenne'}</span>
          <div class="radio-on-air" id="on-air-dot"></div>
          <div class="volume-wrap">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" opacity=".6">
              <path d="M11 5L6 9H2v6h4l5 4V5z"/>
              <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/>
            </svg>
            <input type="range" id="vol-slider" min="0" max="100" value="80" aria-label="Volume">
          </div>
          <button class="play-btn" id="play-btn" ${enabled ? '' : 'disabled'} aria-label="Lecture / Pause">
            <svg id="play-icon" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
          </button>
        </div>
      </div>
    `;

    if (!enabled || !settings.radio_stream_url) return;

    const audio = new Audio();
    audio.preload = 'none';
    audio.volume = 0.8;

    const playBtn    = document.getElementById('play-btn');
    const playIcon   = document.getElementById('play-icon');
    const dot        = document.getElementById('on-air-dot');
    const statusEl   = document.getElementById('radio-status');
    const trackEl    = document.getElementById('radio-track');
    const artistEl   = document.getElementById('radio-artist');
    const coverEl    = document.getElementById('radio-cover');
    const volSlider  = document.getElementById('vol-slider');

    const PLAY_PATH  = '<path d="M8 5v14l11-7z"/>';
    const PAUSE_PATH = '<path d="M6 5h4v14H6zM14 5h4v14h-4z"/>';
    let playing = false;
    let npInterval = null;
    let showName = settings.radio_show_name || 'Radio';

    function setPlaying(state) {
      playing = state;
      playIcon.innerHTML = state ? PAUSE_PATH : PLAY_PATH;
      dot.classList.toggle('live', state);
      if (!state) {
        // Réinitialise l'affichage au nom de l'émission
        trackEl.textContent = showName;
        artistEl.hidden = true;
        coverEl.innerHTML = `<div class="radio-cover-placeholder">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/>
          </svg></div>`;
      }
    }

    // Récupère les métadonnées "now playing"
    async function fetchNowPlaying() {
      try {
        const res = await fetch('/api/nowplaying');
        const data = await res.json();
        if (!data.ok || !data.online) return;

        // Met à jour le nom de l'émission si modifié
        try {
          const s = await fetch('/api/settings').then(r => r.json());
          if (s.ok) showName = s.settings.radio_show_name || showName;
        } catch {}

        if (data.track) {
          // Deezer a trouvé la piste
          trackEl.textContent = data.track.title || data.guessTitle || showName;
          if (data.track.artist) {
            artistEl.textContent = data.track.artist;
            artistEl.hidden = false;
          }
          if (data.track.cover) {
            coverEl.innerHTML = `<img src="${data.track.cover}" alt="Pochette" class="radio-cover-img">`;
          }
        } else if (data.streamTitle) {
          // Métadonnée ICY brute sans résultat Deezer
          trackEl.textContent = data.guessTitle || data.streamTitle;
          if (data.guessArtist) {
            artistEl.textContent = data.guessArtist;
            artistEl.hidden = false;
          }
        } else {
          trackEl.textContent = showName;
          artistEl.hidden = true;
        }
      } catch (e) {
        console.warn('Now playing indisponible', e);
      }
    }

    playBtn.addEventListener('click', async () => {
      if (!playing) {
        try {
          statusEl.textContent = 'Connexion…';
          audio.src = settings.radio_stream_url + '?t=' + Date.now();
          await audio.play();
          setPlaying(true);
          statusEl.textContent = 'En direct';
          await fetchNowPlaying();
          npInterval = setInterval(fetchNowPlaying, 30000);
        } catch {
          statusEl.textContent = 'Source indisponible';
          setPlaying(false);
        }
      } else {
        audio.pause();
        audio.removeAttribute('src');
        audio.load();
        clearInterval(npInterval);
        statusEl.textContent = 'En pause';
        setPlaying(false);
      }
    });

    audio.addEventListener('error', () => {
      statusEl.textContent = 'Source indisponible';
      clearInterval(npInterval);
      setPlaying(false);
    });

    volSlider.addEventListener('input', e => { audio.volume = e.target.value / 100; });
  }

  document.addEventListener('DOMContentLoaded', initRadio);
})();
