import { useGameStore } from '../store/useGameStore';

let audioCtx: AudioContext | null = null;
let isPlaying = false;
let currentOsc: OscillatorNode[] = [];
let masterGain: GainNode | null = null;
let dimensionFilter: BiquadFilterNode | null = null;

// Mario-ish major scale progression
const MELODY = [
    330, 330, 330, 262, 330, 392, 196,
    262, 196, 165, 220, 247, 233, 220,
    196, 330, 392, 440, 349, 392, 330, 262, 294, 247
];

const BASS = [
    131, 131, 131, 131, 131, 196, 98,
    131, 98, 82, 110, 123, 116, 110,
    98, 165, 196, 220, 175, 196, 165, 131, 147, 123
];

let seqStep = 0;
let nextNoteTime = 0;
const LOOKAHEAD = 25.0; // ms
const SCHEDULE_AHEAD = 0.1; // seconds

export const initMusic = () => {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();

        masterGain = audioCtx.createGain();
        masterGain.gain.value = 0.2; // Volume plus doux (était à 0.4)
        masterGain.connect(audioCtx.destination);

        // Filtre passe-bas pour adoucir le rendu global
        dimensionFilter = audioCtx.createBiquadFilter();
        dimensionFilter.type = 'lowpass';
        dimensionFilter.frequency.value = 20000; // Ouvert par défaut (2D)
        dimensionFilter.connect(masterGain);
    }
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
};

export const startMusicLoop = () => {
    if (isPlaying) return;
    initMusic();
    isPlaying = true;
    seqStep = 0;
    nextNoteTime = audioCtx!.currentTime + 0.1;
    scheduler();
};

export const stopMusicLoop = () => {
    isPlaying = false;
    currentOsc.forEach(o => { try { o.stop(); o.disconnect(); } catch (e) { } });
    currentOsc = [];
};

export const updateDimensionMix = (dimension: '2D' | '3D', isTransitioning: boolean) => {
    if (!audioCtx || !dimensionFilter) return;
    const t = audioCtx.currentTime;

    // Au lieu de mettre une "grosse basse oppressante", on garde la même musique joyeuse
    // Mais on assourdit légèrement le son (effet filtre passe-bas) quand on est dans la dimension 3D
    // C'est un effet très Nintendo (comme quand on passe sous l'eau ou dans un tuyau !)
    dimensionFilter.frequency.setTargetAtTime(dimension === '3D' ? 800 : 20000, t, 0.5);
};

const playNote = (freq: number, bassFreq: number, time: number) => {
    if (!audioCtx || !dimensionFilter) return;

    // Mélodie : Forme d'onde Triangle au lieu de Carrée (beaucoup moins perçante/désagréable)
    const osc1 = audioCtx.createOscillator();
    const vca1 = audioCtx.createGain();
    osc1.type = 'triangle';
    osc1.frequency.value = freq;
    osc1.connect(vca1);
    vca1.connect(dimensionFilter);

    // Enveloppe plus douce (Attack légèrement plus lente, Release plus long)
    vca1.gain.setValueAtTime(0, time);
    vca1.gain.linearRampToValueAtTime(0.08, time + 0.03);
    vca1.gain.exponentialRampToValueAtTime(0.001, time + 0.2);

    osc1.start(time);
    osc1.stop(time + 0.25);

    // Basse : Forme d'onde Sinusoïdale (très douce et ronde) au lieu de Triangle
    const osc2 = audioCtx.createOscillator();
    const vca2 = audioCtx.createGain();
    osc2.type = 'sine';
    osc2.frequency.value = bassFreq;
    osc2.connect(vca2);
    vca2.connect(dimensionFilter);

    vca2.gain.setValueAtTime(0, time);
    vca2.gain.linearRampToValueAtTime(0.12, time + 0.05);
    vca2.gain.exponentialRampToValueAtTime(0.01, time + 0.25);

    osc2.start(time);
    osc2.stop(time + 0.3);

    currentOsc.push(osc1, osc2);
    // Nettoyage des noeuds
    setTimeout(() => {
        currentOsc = currentOsc.filter(o => o !== osc1 && o !== osc2);
    }, 400);
};

const tick = () => {
    while (nextNoteTime < audioCtx!.currentTime + SCHEDULE_AHEAD) {
        if (seqStep < MELODY.length) {
            if (MELODY[seqStep] > 0) {
                playNote(MELODY[seqStep], BASS[seqStep], nextNoteTime);
            }
        }

        nextNoteTime += 0.15; // 150ms par step
        seqStep++;
        if (seqStep >= MELODY.length) seqStep = 0; // Boucle infinie
    }
};

const scheduler = () => {
    if (!isPlaying) return;
    tick();
    setTimeout(scheduler, LOOKAHEAD);
};
