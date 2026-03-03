// ZzFX - Zuper Zmall Zeckless Zound Zynthesizer v3 - MIT License - Copyright 2019 Frank Force
// https://github.com/KilledByAPixel/ZzFX

let audioCtx: AudioContext | null = null;

export const initAudio = () => {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
};

const zzfx = (...z: any[]) => zzfxP(zzfxG(...z));

const zzfxP = (...t: any[]) => {
  if (!audioCtx) initAudio();
  if (!audioCtx) return;
  let e = audioCtx.createBuffer(1, t.length, 44100),
    i = e.getChannelData(0);
  for (let n = 0; n < t.length; n++) i[n] = t[n];
  let a = audioCtx.createBufferSource();
  a.buffer = e;
  a.connect(audioCtx.destination);
  a.start();
  return a;
};

const zzfxG = (q = 1, k = 0.05, c = 220, e = 0, t = 0, u = 0.1, r = 0, F = 1, v = 0, z = 0, w = 0, A = 0, l = 0, B = 0, x = 0, I = 0, d = 0, J = 1, y = 0, H = 0) => {
  let b = 2 * Math.PI, p = (v *= 500 * b) / 44100 ** 2, h = (c *= (1 + 2 * k * Math.random() - k) * b / 44100), S = [], g = 0, E = 0, a = 0, n = 1, i = 0, O = 0, f = 0, D, C;
  e = 99 + 44100 * e; t = 44100 * t; u = 44100 * u; r = 44100 * r; l = 44100 * l; z *= 500 * b / 44100 ** 3; x *= b / 44100; w *= b / 44100; A *= 44100;
  for (y = 44100 * y, d = 0; d < e + t + u + r + l + y; d++) {
    let m = d < e ? d / e : d < e + t ? 1 - (d - e) / t * (1 - F) : d < e + t + u ? F : d < e + t + u + r ? F - (d - e - t - u) / r * F : d < e + t + u + r + l ? 0 : d < e + t + u + r + l + y ? (d - e - t - u - r - l) / y : 0;
    if (m < 0) m = 0;
    let G = (B ? 1 - H + H * Math.sin(b * d / B) : 1);
    D = g ? 1 < n ? 2 < n ? 3 < n ? Math.sin(a ** 3) : Math.max(Math.min(Math.tan(a), 1), -1) : 1 - (2 * a / b % 2 + 2) % 2 : 1 - 4 * Math.abs(Math.round(a / b) - a / b) : Math.sin(a);
    D = (E ? 1 - I + I * Math.sin(b * d / E) : 1) * m * G * D;
    C = (i = (1 + Math.sin(Math.random() * b)) / 2) * D + (1 - i) * (f = O ? f + (D - f) / O : D);
    S.push(Math.min(Math.max((g = h * (1 + p * d + z * d ** 2)) > b ? g - b : g < 0 ? g + b : g, -1), 1) * C * q);
    h += p += z; a += h * (1 - w + w * Math.sin(x * d));
    if (A && ++n > A) { a = n = 0; E = E ? 0 : I; }
  }
  return S;
};

// --- Effects Library
export const playJump = () => zzfx(0.4, 0, 320, 0, 0.01, 0.1, 0.06, 0.3, 1, -2, -300, 0, 0, 0, 0, 0, 0, 0.73, 0.05, 0);
export const playCoin = () => zzfx(0.6, 0, 1053, 0, 0.02, 0.22, 0, 1.3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0.85, 0.05, 0);
export const playBump = () => zzfx(0.9, 0.1, 100, 0.01, 0, 0, 0.1, 1, 10, -5, 0, 0, 0, 0, 0, 0, 0, 0.6, 0, 0);
export const playBreak = () => zzfx(1, 0.3, 50, 0.05, 0.02, 0, 0.1, 1, 0, -5, 0, 0, 0, 0, 0, 0, 0.1, 0.8, 0.1, 0);
export const playStomp = () => zzfx(0.8, 0, 200, 0.01, 0.05, 0, 0.2, 1, 0, -5, 0, 0, 0, 0, 0, 0, 0, 0.5, 0, 0);
export const playDimension = () => zzfx(1.1, 0.5, 150, 0.5, 0, 0, 1, 1, -50, 5, 100, 0, 0, 0, 0, 0, 0, 0.8, 0, 0);
export const playDie = () => zzfx(1, 0.05, 300, 0.1, 0.2, 0.5, 0.5, 1.5, 0, -15, 0, 0, 0, 0, 0, 0, 0, 0.7, 0, 0);
export const playVictory = () => zzfx(1, 0, 600, 0.05, 0.2, 0.4, 0.1, 1.5, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0.8, 0, 0);

// --- Background Music (BGM) Engine
let bgmInterval: number | null = null;
let bgmStep = 0;

export const initMusic = () => {
  if (bgmInterval !== null) return;
  // Démarre une boucle de séquence musicale (Arpeggiator simple)
  bgmInterval = window.setInterval(() => {
    if (!audioCtx || audioCtx.state !== 'running') return;

    // On importe dynamiquement pour éviter les dépendances circulaires
    import('../store/useGameStore').then(({ useGameStore }) => {
      const { dimension, gameState } = useGameStore.getState();
      if (gameState !== 'PLAYING' && gameState !== 'EDITOR') return; // Silence si Menu/Pause/Win

      if (dimension === '2D') {
        // Thème 2D : Arpège joyeux 8-Bit (Rapide)
        const notes2D = [440, 554, 659, 880, 659, 554];
        const note = notes2D[bgmStep % notes2D.length];
        zzfx(0.1, 0, note, 0.05, 0.1, 0, 0, 1.5, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0.8, 0, 0);
      } else {
        // Thème 3D : Nappe mystérieuse (Lente et grave)
        const notes3D = [220, 261, 329, 261];
        if (bgmStep % 4 === 0) { // Joue 4x plus lentement
          const note = notes3D[(bgmStep / 4) % notes3D.length];
          zzfx(0.2, 0.2, note, 0.5, 0.4, 0.8, 1, 1.5, 0, 5, 0, 0.1, 0.1, 0, 0, 0, 0, 0.5, 0, 0);
        }
      }
      bgmStep++;
    });
  }, 150); // 150ms tempo
};

export const stopMusic = () => {
  if (bgmInterval !== null) {
    clearInterval(bgmInterval);
    bgmInterval = null;
  }
};
