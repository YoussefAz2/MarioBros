import { useEffect, useState } from 'react';
import { useGameStore, BlockType, EditorTool } from '../store/useGameStore';
import Marketplace from './Marketplace';
import PublishModal from './PublishModal';
import LoginModal from './LoginModal';
import { supabase } from '../lib/supabase';
import { dbService, ScoreData } from '../services/db';
import { playDimension, initMusic, stopMusic } from '../utils/audio';
import defaultLevelData from '../data/levelbase1.json';
import { Coins, Trophy, RefreshCw, Hand, UploadCloud, Globe, Play, Settings, XCircle, User, LogOut, Clock, Lightbulb } from 'lucide-react';

const BlockIcon = ({ type }: { type: EditorTool }) => {
  switch (type) {
    case 'brick':
      return (
        <svg viewBox="0 0 32 32" className="w-8 h-8">
          <rect width="32" height="32" fill="#c84c0c" />
          <path d="M0 16H32M16 0V16M8 16V32M24 16V32" stroke="#6b2400" strokeWidth="2" />
        </svg>
      );
    case 'ground':
      return (
        <svg viewBox="0 0 32 32" className="w-8 h-8">
          <rect width="32" height="32" fill="#8c3408" />
          <path d="M0 4H32M0 12H32M0 20H32M0 28H32" stroke="#5c2000" strokeWidth="2" strokeDasharray="4 4" />
        </svg>
      );
    case 'question':
      return (
        <svg viewBox="0 0 32 32" className="w-8 h-8">
          <rect width="32" height="32" fill="#e8c400" />
          <circle cx="4" cy="4" r="2" fill="#b8860b" />
          <circle cx="28" cy="4" r="2" fill="#b8860b" />
          <circle cx="4" cy="28" r="2" fill="#b8860b" />
          <circle cx="28" cy="28" r="2" fill="#b8860b" />
          <text x="16" y="24" fontSize="24" fontFamily="monospace" fontWeight="bold" fill="#000" textAnchor="middle">?</text>
        </svg>
      );

    case 'goomba':
      return (
        <svg viewBox="0 0 32 32" className="w-8 h-8">
          <path d="M16 4 C 8 4, 4 16, 4 24 L 28 24 C 28 16, 24 4, 16 4" fill="#5c2c16" />
          <circle cx="12" cy="16" r="3" fill="#fff" />
          <circle cx="20" cy="16" r="3" fill="#fff" />
          <circle cx="12" cy="16" r="1" fill="#000" />
          <circle cx="20" cy="16" r="1" fill="#000" />
          <path d="M8 28 C 8 24, 12 24, 12 28 Z" fill="#000" />
          <path d="M20 28 C 20 24, 24 24, 24 28 Z" fill="#000" />
        </svg>
      );
    case 'rift':
      return (
        <svg viewBox="0 0 32 32" className="w-8 h-8 drop-shadow-md group-hover:drop-shadow-[0_0_8px_rgba(255,0,255,0.8)]">
          <polygon points="16,4 28,12 28,20 16,28 4,20 4,12" fill="none" stroke="#ff00ff" strokeWidth="2" />
          <circle cx="16" cy="16" r="4" fill="#ffffff" />
        </svg>
      );
    case 'spawn':
      return (
        <svg viewBox="0 0 32 32" className="w-8 h-8 drop-shadow-md group-hover:drop-shadow-[0_0_8px_rgba(74,222,128,0.8)]">
          <path d="M16 2 C10.5 2 6 6.5 6 12 C6 20 16 30 16 30 C16 30 26 20 26 12 C26 6.5 21.5 2 16 2 Z" fill="#4ade80" />
          <circle cx="16" cy="12" r="5" fill="#ffffff" />
        </svg>
      );
    case 'spike':
      return (
        <svg viewBox="0 0 32 32" className="w-8 h-8">
          <polygon points="16,4 4,28 28,28" fill="#dd0000" stroke="#880000" strokeWidth="2" />
        </svg>
      );
    case 'platform':
      return (
        <svg viewBox="0 0 32 32" className="w-8 h-8">
          <rect x="2" y="12" width="28" height="8" rx="2" fill="#888888" stroke="#444444" strokeWidth="2" />
          <path d="M6 16 L12 10 M6 16 L12 22 M26 16 L20 10 M26 16 L20 22" stroke="#ffffff" strokeWidth="2" fill="none" />
        </svg>
      );
    case 'pushable':
      return (
        <svg viewBox="0 0 32 32" className="w-8 h-8">
          <rect width="32" height="32" fill="#0055ff" />
          <rect x="4" y="4" width="24" height="24" fill="none" stroke="#0033aa" strokeWidth="2" />
          <line x1="4" y1="4" x2="28" y2="28" stroke="#0033aa" strokeWidth="2" />
          <line x1="28" y1="4" x2="4" y2="28" stroke="#0033aa" strokeWidth="2" />
        </svg>
      );
    case 'coin':
      return (
        <svg viewBox="0 0 32 32" className="w-8 h-8">
          <ellipse cx="16" cy="16" rx="10" ry="14" fill="#ffd700" stroke="#b8860b" strokeWidth="2" />
          <ellipse cx="16" cy="16" rx="4" ry="8" fill="none" stroke="#b8860b" strokeWidth="2" />
        </svg>
      );
    case 'flag':
      return (
        <svg viewBox="0 0 32 32" className="w-8 h-8">
          <rect x="6" y="2" width="2" height="28" fill="#ccc" />
          <circle cx="7" cy="2" r="2" fill="#ffd700" />
          <polygon points="8,4 26,10 8,16" fill="#00ff00" />
        </svg>
      );
    case 'eraser':
      return (
        <svg viewBox="0 0 32 32" className="w-8 h-8">
          <rect x="4" y="10" width="24" height="12" rx="2" fill="#ff4444" transform="rotate(-20 16 16)" />
          <rect x="4" y="10" width="8" height="12" rx="2" fill="#ffaaaa" transform="rotate(-20 16 16)" />
        </svg>
      );
    case 'move':
      return (
        <svg viewBox="0 0 32 32" className="w-8 h-8">
          <path d="M16 2 L12 8 L20 8 Z" fill="#00aaff" />
          <path d="M16 30 L12 24 L20 24 Z" fill="#00aaff" />
          <path d="M2 16 L8 12 L8 20 Z" fill="#00aaff" />
          <path d="M30 16 L24 12 L24 20 Z" fill="#00aaff" />
          <circle cx="16" cy="16" r="4" fill="#00aaff" />
        </svg>
      );
    case 'lamp':
      return (
        <Lightbulb className="w-8 h-8 text-yellow-400" />
      );
    case 'checkpoint':
      return (
        <svg viewBox="0 0 32 32" className="w-8 h-8 drop-shadow-md group-hover:drop-shadow-[0_0_8px_rgba(74,222,128,0.8)]">
          <polygon points="16,2 30,16 16,30 2,16" fill="none" stroke="#4ade80" strokeWidth="2" />
          <circle cx="16" cy="16" r="4" fill="#4ade80" />
        </svg>
      );
  }
};

export default function HUD() {
  const { dimension, score, coins, timeElapsed, incrementTime, currentMapId, gameState, setGameState, selectedBlockType, setSelectedBlockType, toggleDimension, resetLevel, isTransitioning, user, setUser, clearCheckpoint } = useGameStore();
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [scoreBlink, setScoreBlink] = useState(false);
  const [coinBlink, setCoinBlink] = useState(false);
  const [topScores, setTopScores] = useState<ScoreData[]>([]);
  const [hasSubmittedScore, setHasSubmittedScore] = useState(false);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Écouter les changements de session Auth
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, [setUser]);

  // Trigger animation on score change
  useEffect(() => {
    if (score > 0) {
      setScoreBlink(true);
      const t = setTimeout(() => setScoreBlink(false), 200);
      return () => clearTimeout(t);
    }
  }, [score]);

  // Trigger animation on coin change
  useEffect(() => {
    if (coins > 0) {
      setCoinBlink(true);
      const t = setTimeout(() => setCoinBlink(false), 200);
      return () => clearTimeout(t);
    }
  }, [coins]);

  // Timer logic
  useEffect(() => {
    let timer: number;
    if (gameState === 'PLAYING') {
      timer = window.setInterval(() => {
        incrementTime();
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [gameState, incrementTime]);

  // Scoreboard logic on WIN
  useEffect(() => {
    if (gameState === 'WIN' && currentMapId) {
      if (user && !hasSubmittedScore) {
        setHasSubmittedScore(true);
        const username = user.email ? user.email.split('@')[0] : 'Player';
        dbService.submitScore(currentMapId, timeElapsed, user.id, username)
          .then(() => dbService.getTopScores(currentMapId))
          .then(setTopScores)
          .catch(err => {
            console.error(err);
            dbService.getTopScores(currentMapId).then(setTopScores).catch(console.error);
          });
      } else if (!hasSubmittedScore) {
        dbService.getTopScores(currentMapId).then(setTopScores).catch(console.error);
      }
    } else if (gameState !== 'WIN') {
      setHasSubmittedScore(false);
      setTopScores([]);
    }
  }, [gameState, currentMapId, user, timeElapsed, hasSubmittedScore]);

  const blockTypes: { type: EditorTool, label: string, color: string }[] = [
    { type: 'brick', label: 'Brick', color: 'bg-[#c84c0c]' },
    { type: 'ground', label: 'Ground', color: 'bg-[#8c3408]' },
    { type: 'question', label: '?', color: 'bg-[#e8c400]' },
    { type: 'goomba', label: 'Goomba', color: 'bg-[#5c2c16]' },
    { type: 'rift', label: 'Rift', color: 'bg-[#ff00ff]' },
    { type: 'pushable', label: 'Push', color: 'bg-[#0055ff]' },
    { type: 'coin', label: 'Coin', color: 'bg-[#ffd700]' },
    { type: 'flag', label: 'Flag', color: 'bg-[#00ff00]' },
    { type: 'spawn', label: 'Spawn', color: 'bg-[#4ade80]' },
    { type: 'spike', label: 'Spike', color: 'bg-red-700' },
    { type: 'platform', label: 'Platform', color: 'bg-gray-500' },
    { type: 'lamp', label: 'Lamp', color: 'bg-yellow-500' },
    { type: 'checkpoint', label: 'Checkpt', color: 'bg-green-600' },
    { type: 'eraser', label: 'Eraser', color: 'bg-red-500' },
    { type: 'move', label: 'Move', color: 'bg-[#00aaff]' },
  ];

  const handlePlayTest = () => {
    if (gameState === 'EDITOR') {
      setGameState('PLAYING');
      initMusic();
    } else {
      setGameState('EDITOR');
      stopMusic();
    }
  };

  const startGame = () => {
    // Toujours recharger le niveau de base quand on clique "Jouer"
    useGameStore.getState().loadMap(null, defaultLevelData as any);
    initMusic();
  };

  useEffect(() => {
    if (gameState === 'PLAYING' || gameState === 'EDITOR') {
      initMusic();
    } else if (gameState === 'PAUSE' || gameState === 'MENU' || gameState === 'WIN' || gameState === 'MARKETPLACE') {
      stopMusic();
    }
  }, [gameState]);

  useEffect(() => {
    // Removed updateDimensionMix as it is unused
  }, [dimension, isTransitioning]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        const state = useGameStore.getState();
        if (state.gameState === 'PLAYING' || state.gameState === 'EDITOR') {
          setGameState('PAUSE');
        } else if (state.gameState === 'PAUSE') {
          // Si on annule la pause, on retourne d'où on vient
          setGameState(state.previousGameState || 'PLAYING');
        }
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        const state = useGameStore.getState();
        if (state.gameState === 'EDITOR') {
          state.undo();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setGameState]);

  if (gameState === 'MENU') {
    return (
      <div className="absolute inset-0 flex flex-col items-center justify-center z-50 bg-black/40 backdrop-blur-sm" style={{ fontFamily: "'Press Start 2P', cursive" }}>
        <div className="text-center animate-bounce mb-12">
          <h1 className="text-6xl md:text-8xl text-[#E52521] drop-shadow-[4px_4px_0_#000] mb-4">SUPER</h1>
          <h1 className="text-5xl md:text-7xl text-[#FBD000] drop-shadow-[4px_4px_0_#000] mb-4">MARIO</h1>
          <h2 className="text-3xl md:text-5xl text-[#049CD8] drop-shadow-[4px_4px_0_#000]">DIMENSION SHIFT</h2>
        </div>

        {!user ? (
          <div className="flex flex-col items-center mt-8 pointer-events-auto">
            <button
              onClick={() => setShowLoginModal(true)}
              className="px-10 py-5 bg-[#E52521] text-white text-xl md:text-2xl font-black tracking-widest border-4 border-white rounded-2xl shadow-[0_0_30px_rgba(229,37,33,0.8)] hover:scale-110 hover:bg-[#cc1f1c] transition-all flex items-center gap-4 animate-pulse uppercase"
            >
              <User className="w-8 h-8" />
              CONNEXION
            </button>
            <p className="mt-6 text-white/50 text-sm max-w-md text-center tracking-wide leading-relaxed">
              Un compte est requis pour sauvegarder vos scores, créer des maps personnalisées et accéder au marketplace communautaire.
            </p>
          </div>
        ) : (
          <>
            <button
              onClick={startGame}
              className="mt-8 px-8 py-4 bg-[#43B047] text-white text-xl md:text-2xl border-4 border-white rounded-xl shadow-[0_0_20px_rgba(67,176,71,0.8)] hover:scale-110 hover:bg-[#328a36] transition-all pointer-events-auto"
            >
              JOUER
            </button>

            <button
              onClick={() => setGameState('EDITOR')}
              className="mt-6 px-6 py-3 bg-[#888888] text-white text-sm md:text-base border-4 border-white rounded-xl shadow-[0_0_10px_rgba(0,0,0,0.5)] hover:scale-110 hover:bg-[#666666] transition-all pointer-events-auto"
            >
              ÉDITEUR DE NIVEAUX
            </button>

            <button
              onClick={() => setGameState('MARKETPLACE')}
              className="mt-6 px-6 py-3 bg-[#049CD8] text-white text-sm md:text-base border-4 border-white rounded-xl shadow-[0_0_10px_rgba(4,156,216,0.5)] hover:scale-110 hover:bg-[#037bb0] transition-all pointer-events-auto flex items-center gap-2"
            >
              <Globe className="w-5 h-5" />
              MARKETPLACE
            </button>

            <div className="mt-8 pointer-events-auto">
              <button
                onClick={() => supabase.auth.signOut()}
                className="px-4 py-2 bg-red-500/80 hover:bg-red-500 text-white rounded-lg flex items-center gap-2 text-sm transition-all shadow-[0_0_10px_rgba(239,68,68,0.3)]"
              >
                <LogOut className="w-4 h-4" /> DÉCONNEXION
              </button>
            </div>
          </>
        )}

        {showLoginModal && <LoginModal onClose={() => setShowLoginModal(false)} />}

        <p className="absolute bottom-8 text-white/70 text-xs text-center font-sans tracking-widest">
          ZQSD/Flèches pour se déplacer • Espace pour sauter<br />Trouvez la Faille Dimensionnelle pour passer en 3D !
        </p>
      </div>
    );
  }

  return (
    <div className="absolute top-0 left-0 w-full h-full pointer-events-none flex flex-col justify-between z-10 text-white font-sans">
      <div className="p-6 flex justify-between items-start">
        <div className="flex gap-4 md:gap-8">
          <div className={`bg-black/50 backdrop-blur-md px-6 py-3 rounded-2xl border-2 shadow-[0_4px_30px_rgba(0,0,0,0.5)] transition-colors duration-150 ${scoreBlink ? 'border-[#FBD000] shadow-[0_0_20px_#FBD000]' : 'border-white/20'}`}>
            <p className="text-white/70 text-xs font-bold uppercase tracking-wider mb-1 flex items-center gap-1 drop-shadow-[2px_2px_0_#000]"><Trophy className="w-3 h-3 text-[#FBD000]" /> Score</p>
            <p className="text-white font-black text-2xl drop-shadow-[2px_2px_0_#000]" style={{ fontFamily: "'Press Start 2P', cursive" }}>{String(score).padStart(6, '0')}</p>
          </div>

          <div className={`bg-black/50 backdrop-blur-md px-6 py-3 rounded-2xl border-2 shadow-[0_4px_30px_rgba(0,0,0,0.5)] transition-colors duration-150 flex flex-col items-center justify-center ${coinBlink ? 'border-[#FBD000] shadow-[0_0_20px_#FBD000]' : 'border-white/20'}`}>
            <p className="text-[#FBD000] font-black text-2xl mb-1 flex items-center gap-2 drop-shadow-[2px_2px_0_#000]">
              <Coins className="w-6 h-6 animate-spin" style={{ animationDuration: '3s' }} /> x{String(coins).padStart(2, '0')}
            </p>
            <div className={`px-3 py-1 rounded-full border-2 ${dimension === '2D' ? 'border-[#049CD8] text-[#049CD8] shadow-[0_0_10px_#049CD8]' : 'border-[#ff00ff] text-[#ff00ff] shadow-[0_0_10px_#ff00ff]'} bg-black/80 transition-colors`}>
              <p className="text-[10px] font-bold tracking-widest">MODE: {dimension}</p>
            </div>
          </div>

          <div className="bg-black/50 backdrop-blur-md px-6 py-3 rounded-2xl border-2 border-white/20 shadow-[0_4px_30px_rgba(0,0,0,0.5)] transition-colors flex flex-col items-center justify-center">
            <p className="text-xl font-black mb-1 flex items-center gap-2 drop-shadow-[2px_2px_0_#000] text-white">
              <Clock className="w-5 h-5" /> {formatTime(timeElapsed)}
            </p>
            <div className="px-3 py-1 rounded-full border-2 border-white/30 text-white/50 bg-black/80">
              <p className="text-[10px] font-bold tracking-widest drop-shadow-[2px_2px_0_#000]">TEMPS</p>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-end gap-4">
          {gameState === 'EDITOR' && (
            <>
              <button
                onClick={() => user ? setShowPublishModal(true) : setShowLoginModal(true)}
                className="px-6 py-3 rounded-2xl pointer-events-auto border-2 bg-[#049CD8]/80 hover:bg-[#037bb0] backdrop-blur-md border-white/50 transition-all text-sm font-bold tracking-wider hover:scale-105 shadow-xl flex items-center gap-2"
              >
                <UploadCloud className="w-4 h-4" />
                PUBLIER LE NIVEAU
              </button>
              <button
                onClick={toggleDimension}
                className="px-6 py-3 rounded-2xl pointer-events-auto border-2 bg-purple-600/80 hover:bg-purple-500 backdrop-blur-md border-white/50 transition-all text-sm font-bold tracking-wider hover:scale-105 shadow-xl"
              >
                🔄 BASCULER {dimension === '2D' ? '3D' : '2D'}
              </button>
            </>
          )}
          <button
            onClick={handlePlayTest}
            className={`px-6 py-3 rounded-2xl pointer-events-auto border-2 backdrop-blur-md transition-all text-sm font-bold tracking-wider hover:scale-105 shadow-xl ${gameState === 'EDITOR'
              ? 'bg-[#43B047]/80 hover:bg-[#328a36] border-white/50'
              : 'bg-[#E52521]/80 hover:bg-[#cc1f1c] border-white/50'
              }`}
          >
            {gameState === 'EDITOR' ? '▶ TESTER' : '🛠 ÉDITEUR'}
          </button>
        </div>
      </div>

      {/* Pause Screen */}
      {gameState === 'PAUSE' && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/70 pointer-events-auto backdrop-blur-lg z-50 animate-in fade-in duration-200">
          <div className="bg-gradient-to-b from-black/90 to-black/70 p-12 rounded-3xl text-center border-4 border-white/30 shadow-[0_0_50px_rgba(0,0,0,0.8)] backdrop-blur-xl transform transition-all scale-100 hover:scale-[1.02]">
            <h1 className="text-5xl md:text-6xl text-white mb-4 font-black tracking-widest drop-shadow-[4px_4px_0_#000]" style={{ fontFamily: "'Press Start 2P', cursive" }}>PAUSE</h1>
            <p className="text-white/50 mb-12 italic font-sans tracking-wide">Prenez une pause, les dimensions vous attendront.</p>

            <div className="flex flex-col gap-5">
              <button
                onClick={() => setGameState(useGameStore.getState().previousGameState || 'PLAYING')}
                className="group flex items-center justify-center gap-3 bg-[#43B047] text-white px-8 py-4 rounded-2xl text-xl font-bold border-4 border-[#328a36] hover:bg-[#52d157] hover:border-[#43B047] hover:scale-105 transition-all shadow-[0_0_20px_rgba(67,176,71,0.5)]"
              >
                <Play className="w-6 h-6 fill-current group-hover:animate-pulse" />
                {useGameStore.getState().previousGameState === 'EDITOR' ? 'REPRENDRE L\'ÉDITEUR' : 'REPRENDRE LA PARTIE'}
              </button>

              <button
                onClick={() => setGameState('EDITOR')}
                className="group flex items-center justify-center gap-3 bg-[#E52521] text-white px-8 py-4 rounded-2xl text-xl font-bold border-4 border-[#cc1f1c] hover:bg-[#ff3b38] hover:border-[#E52521] hover:scale-105 transition-all shadow-[0_0_20px_rgba(229,37,33,0.5)]"
              >
                <Settings className="w-6 h-6 group-hover:rotate-90 transition-transform duration-300" />
                ÉDITEUR DE NIVEAUX
              </button>

              <button
                onClick={() => { clearCheckpoint(); setGameState('MENU'); stopMusic(); }}
                className="group mt-4 flex items-center justify-center gap-2 bg-transparent text-white/70 hover:text-white px-8 py-3 rounded-2xl text-sm font-bold border-2 border-white/20 hover:border-white/50 transition-all"
              >
                <XCircle className="w-4 h-4 group-hover:text-red-400 transition-colors" />
                QUITTER AU MENU
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Win Screen */}
      {gameState === 'WIN' && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80 pointer-events-auto backdrop-blur-sm p-4 z-50">
          <div className="bg-[#049CD8] p-8 md:p-12 rounded-3xl text-center border-4 border-white shadow-[0_0_50px_rgba(4,156,216,0.8)] max-w-2xl w-full max-h-screen overflow-y-auto">
            <h1 className="text-3xl md:text-5xl text-[#FBD000] mb-4 font-black tracking-tighter drop-shadow-[4px_4px_0_#000]" style={{ fontFamily: "'Press Start 2P', cursive" }}>NIVEAU TERMINÉ !</h1>

            <div className="flex justify-center gap-8 mb-8">
              <p className="text-xl md:text-2xl text-white font-bold drop-shadow-[2px_2px_0_#000]">SCORE: {score}</p>
              <p className="text-xl md:text-2xl text-[#FBD000] font-bold drop-shadow-[2px_2px_0_#000] flex items-center gap-2">
                <Clock className="w-6 h-6" /> {formatTime(timeElapsed)}
              </p>
            </div>

            {currentMapId && (
              <div className="bg-black/30 rounded-xl p-4 mb-8 text-left border border-white/20">
                <h2 className="text-white text-lg font-bold mb-4 flex items-center gap-2 border-b border-white/20 pb-2">
                  <Trophy className="w-5 h-5 text-[#FBD000]" /> TOP 10 SPEEDRUN
                </h2>
                {topScores.length === 0 ? (
                  <p className="text-white/50 text-sm italic text-center py-4">Chargement des scores...</p>
                ) : (
                  <div className="flex flex-col gap-2">
                    {topScores.map((s, i) => (
                      <div key={s.id} className={`flex justify-between items-center p-2 rounded ${i === 0 ? 'bg-yellow-500/20 border border-yellow-500/50' : i === 1 ? 'bg-gray-300/20 border border-gray-300/30' : i === 2 ? 'bg-orange-600/20 border border-orange-600/30' : ''}`}>
                        <span className="text-white font-mono flex items-center gap-2">
                          <span className="text-sm opacity-50 w-4">{i + 1}.</span>
                          {s.username} {user?.id === s.user_id && <span className="text-xs bg-[#E52521] px-2 py-0.5 rounded-full ml-2">YOU</span>}
                        </span>
                        <span className="text-[#4ade80] font-bold font-mono">{formatTime(s.time_elapsed)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            <button
              onClick={() => { clearCheckpoint(); setGameState('MENU'); }}
              className="bg-[#E52521] text-white px-8 py-4 rounded-2xl text-xl font-bold border-4 border-white hover:bg-[#cc1f1c] hover:scale-110 transition-all drop-shadow-[2px_2px_0_#000]"
            >
              MENU PRINCIPAL
            </button>
          </div>
        </div>
      )}

      {gameState === 'EDITOR' && (
        <div className="p-6 flex justify-center pointer-events-auto">
          <div className="bg-black/60 p-4 rounded-3xl border-2 border-white/20 flex gap-3 backdrop-blur-xl overflow-x-auto max-w-full items-center shadow-2xl">
            {blockTypes.map(b => (
              <button
                key={b.type}
                onClick={() => setSelectedBlockType(b.type)}
                className={`w-16 h-16 shrink-0 rounded-2xl border-4 flex flex-col items-center justify-center gap-1 text-[10px] font-bold transition-all hover:scale-110 ${b.color} ${selectedBlockType === b.type ? 'border-white scale-110 shadow-[0_0_15px_rgba(255,255,255,0.5)]' : 'border-black/50'} drop-shadow-none`}
              >
                <BlockIcon type={b.type} />
                <span className="opacity-80">{b.label}</span>
              </button>
            ))}
            <div className="ml-4 pl-4 border-l-2 border-white/20 flex flex-col justify-center text-xs text-white/70 whitespace-nowrap gap-1 font-medium">
              <p>Clic gauche + Glisser : Construire/Effacer</p>
              <p>Clic droit : Orbite • Molette : Zoom</p>
              <p>Alt + Clic : Pipette • Ctrl+Z : Annuler</p>
            </div>
          </div>
        </div>
      )}

      {gameState === 'PLAYING' && (
        <div className="absolute bottom-6 left-6 text-white/70 text-xs font-medium bg-black/40 px-4 py-2 rounded-full backdrop-blur-md">
          <p>Contrôles : Flèches/ZQSD pour se déplacer • Espace pour sauter</p>
        </div>
      )}

      {gameState === 'MARKETPLACE' && <Marketplace />}
      {showPublishModal && <PublishModal onClose={() => setShowPublishModal(false)} />}
      {showLoginModal && <LoginModal onClose={() => setShowLoginModal(false)} />}
    </div>
  );
}
