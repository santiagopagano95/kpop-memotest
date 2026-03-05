const audioCache = {};

function getAudio(src) {
  if (!audioCache[src]) {
    audioCache[src] = new Audio(src);
  }
  return audioCache[src];
}

export function playSound(src) {
  try {
    const audio = getAudio(src);
    audio.currentTime = 0;
    audio.play().catch(() => {}); // ignore autoplay errors
  } catch {
    // ignore errors (e.g. empty placeholder files)
  }
}

export function startBgMusic() {
  try {
    const audio = getAudio('/audio/bg-music.mp3');
    audio.loop = true;
    audio.volume = 0.3;
    audio.play().catch(() => {});
  } catch {
    // ignore
  }
}

export function stopBgMusic() {
  try {
    const audio = getAudio('/audio/bg-music.mp3');
    audio.pause();
    audio.currentTime = 0;
  } catch {
    // ignore
  }
}
