// One app-lifetime transport. Screens request a track; they never own its source.
export function createMusicPlayer(audio, { gainForTrack = () => 1 } = {}) {
  const positions = new Map();
  let requestedTrack = null;
  let loadedTrack = null;
  let enabled = true;
  let volume = 1;
  let restoreListener = null;
  let disposed = false;
  let playAttempt = null;

  function remember() {
    if (loadedTrack && !restoreListener && Number.isFinite(audio.currentTime)) {
      positions.set(loadedTrack, audio.currentTime);
    }
  }

  function applyPlayback() {
    audio.muted = !enabled;
    audio.volume = Math.max(0, Math.min(1, volume * gainForTrack(loadedTrack)));
    if (!enabled || !requestedTrack) {
      playAttempt = null;
      if (!audio.paused) audio.pause();
      return;
    }
    if (restoreListener || !audio.paused || playAttempt) return;
    const attempt = {};
    playAttempt = attempt;
    // Autoplay denial is recoverable on the next explicit user interaction.
    try {
      Promise.resolve(audio.play()).catch(() => {}).finally(() => {
        if (playAttempt === attempt) playAttempt = null;
      });
    } catch {
      playAttempt = null;
    }
  }

  function cancelRestore() {
    if (restoreListener) audio.removeEventListener("loadedmetadata", restoreListener);
    restoreListener = null;
  }

  return {
    // undefined keeps the previous request (loading/help); null requests silence.
    update(options = {}) {
      if (disposed) return;
      if (options.enabled !== undefined) enabled = options.enabled;
      if (options.volume !== undefined) volume = options.volume;
      if (options.track !== undefined) requestedTrack = options.track;
      if (requestedTrack && requestedTrack !== loadedTrack) {
        remember();
        cancelRestore();
        playAttempt = null;
        audio.pause();
        loadedTrack = requestedTrack;
        const position = positions.get(loadedTrack) || 0;
        if (position > 0) {
          restoreListener = () => {
            cancelRestore();
            const duration = audio.duration;
            const time = Number.isFinite(duration) && duration > 0 ? position % duration : position;
            try { audio.currentTime = time; } catch { /* A non-seekable source starts normally. */ }
            applyPlayback();
          };
          audio.addEventListener("loadedmetadata", restoreListener);
        }
        // Only a different song may replace src. Silence retains the loaded song.
        audio.src = loadedTrack;
      }
      applyPlayback();
    },
    dispose() {
      disposed = true;
      remember();
      cancelRestore();
      playAttempt = null;
      audio.pause();
    },
  };
}
