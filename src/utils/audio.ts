// Audio Engine — Sons propres style Nintendo avec Web Audio API oscillateurs
// Remplace l'ancien système zzfx par des oscillateurs doux et agréables
import { useGameStore } from '../store/useGameStore';

let audioCtx: AudioContext | null = null;

export const initAudio = () => {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
};

// --- Utilitaire : joue une note propre avec oscillateur ---
const playTone = (
  freq: number,
  duration: number,
  volume: number = 0.15,
  type: OscillatorType = 'sine',
  slideFreq?: number
) => {
  if (!audioCtx) initAudio();
  if (!audioCtx) return;
  const t = audioCtx.currentTime;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t);
  if (slideFreq) {
    osc.frequency.linearRampToValueAtTime(slideFreq, t + duration);
  }
  gain.gain.setValueAtTime(volume, t);
  gain.gain.linearRampToValueAtTime(0.001, t + duration);
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.start(t);
  osc.stop(t + duration + 0.01);
};

// --- Utilitaire : séquence de notes rapides ---
const playSequence = (notes: number[], tempo: number, volume: number = 0.12, type: OscillatorType = 'triangle') => {
  if (!audioCtx) initAudio();
  if (!audioCtx) return;
  notes.forEach((freq, i) => {
    setTimeout(() => playTone(freq, tempo * 0.9, volume, type), i * tempo * 1000);
  });
};

// ═══════════════════════════════════════════════════════
//  EFFETS SONORES — Style Mario propre et doux
// ═══════════════════════════════════════════════════════

// Saut : slide vers le haut, court et joyeux
export const playJump = () => {
  playTone(400, 0.15, 0.12, 'triangle', 800);
};

// Pièce : deux notes aiguës rapides (ding-ding classique Mario)
export const playCoin = () => {
  playTone(988, 0.07, 0.1, 'square');
  setTimeout(() => playTone(1319, 0.15, 0.1, 'square'), 70);
};

// Bump : son sourd quand on tape un bloc
export const playBump = () => {
  playTone(150, 0.1, 0.15, 'triangle', 80);
};

// Casser un bloc : bruit court
export const playBreak = () => {
  playTone(200, 0.05, 0.12, 'sawtooth', 50);
  setTimeout(() => playTone(120, 0.08, 0.08, 'triangle'), 50);
};

// Écraser un Goomba : stomp satisfaisant
export const playStomp = () => {
  playTone(500, 0.08, 0.15, 'triangle', 200);
  setTimeout(() => playTone(300, 0.12, 0.1, 'sine'), 60);
};

// Changement de dimension 2D↔3D : son cosmique
export const playDimension = () => {
  playTone(300, 0.3, 0.1, 'sine', 600);
  setTimeout(() => playTone(600, 0.3, 0.08, 'triangle', 900), 150);
};

// Mort : descente triste
export const playDie = () => {
  playSequence([600, 500, 400, 300, 200], 0.12, 0.12, 'triangle');
};

// Victoire : fanfare joyeuse
export const playVictory = () => {
  playSequence([523, 659, 784, 1047], 0.15, 0.12, 'triangle');
};

// Checkpoint : son de validation
export const playCheckpoint = () => {
  playTone(660, 0.1, 0.1, 'triangle');
  setTimeout(() => playTone(880, 0.2, 0.1, 'triangle'), 100);
};

// ═══════════════════════════════════════════════════════
//  MUSIQUE DE FOND — Arpège doux style Mario
// ═══════════════════════════════════════════════════════
let bgmInterval: number | null = null;
let bgmStep = 0;

// Mélodie Mario-like joyeuse (notes en Hz)
const MELODY_2D = [
  523, 523, 0, 523, 0, 392, 523, 0,
  659, 0, 0, 0, 330, 0, 0, 0,
  392, 0, 0, 330, 0, 0, 262, 0,
  0, 330, 0, 440, 0, 494, 466, 440,
];

const BASS_2D = [
  131, 0, 131, 0, 131, 0, 131, 0,
  165, 0, 0, 0, 82, 0, 0, 0,
  98, 0, 0, 82, 0, 0, 65, 0,
  0, 82, 0, 110, 0, 123, 117, 110,
];

export const initMusic = () => {
  if (bgmInterval !== null) return;
  initAudio();

  bgmInterval = window.setInterval(() => {
    if (!audioCtx || audioCtx.state !== 'running') return;

    const { gameState } = useGameStore.getState();
    if (gameState !== 'PLAYING' && gameState !== 'EDITOR') return;

    // Même mélodie en 2D et 3D
    const note = MELODY_2D[bgmStep % MELODY_2D.length];
    const bass = BASS_2D[bgmStep % BASS_2D.length];
    if (note > 0) playTone(note, 0.12, 0.06, 'triangle');
    if (bass > 0) playTone(bass, 0.14, 0.04, 'sine');
    bgmStep++;
  }, 175);
};

export const stopMusic = () => {
  if (bgmInterval !== null) {
    clearInterval(bgmInterval);
    bgmInterval = null;
    bgmStep = 0;
  }
};
