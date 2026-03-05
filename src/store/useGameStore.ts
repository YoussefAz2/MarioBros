import { create } from 'zustand';

export type BlockType = 'brick' | 'ground' | 'question' | 'rift' | 'goomba' | 'pushable' | 'coin' | 'flag' | 'spawn' | 'spike' | 'platform' | 'lamp' | 'checkpoint';
export type EditorTool = BlockType | 'eraser' | 'move';

export interface BlockData {
  id: string;
  position: [number, number, number];
  type: BlockType;
}

interface GameState {
  dimension: '2D' | '3D';
  isTransitioning: boolean;
  gameState: 'MENU' | 'PLAYING' | 'EDITOR' | 'WIN' | 'PAUSE' | 'MARKETPLACE';
  previousGameState: 'PLAYING' | 'EDITOR' | null;
  isPublishing: boolean;
  score: number;
  coins: number;
  timeElapsed: number;
  currentMapId: string | number | null;
  blocks: BlockData[];
  history: BlockData[][];
  selectedBlockType: EditorTool;
  movingBlock: BlockData | null;
  buildDepth: number;
  resetKey: number;
  user: any | null;
  lastCheckpoint: [number, number, number] | null;
  checkpointDimension: '2D' | '3D' | null;

  toggleDimension: () => void;
  setGameState: (state: 'MENU' | 'PLAYING' | 'EDITOR' | 'WIN' | 'PAUSE' | 'MARKETPLACE') => void;
  addCoin: () => void;
  incrementTime: () => void;
  addBlock: (block: Omit<BlockData, 'id'>) => void;
  addBlocks: (blocks: Omit<BlockData, 'id'>[]) => void;
  removeBlock: (id: string) => void;
  removeBlocks: (ids: string[]) => void;
  updateBlock: (id: string, type: BlockType) => void;
  setSelectedBlockType: (type: EditorTool) => void;
  setMovingBlock: (block: BlockData | null) => void;
  setBuildDepth: (depth: number) => void;
  resetLevel: () => void;
  loadMap: (id: string | number | null, blocks: BlockData[]) => void;
  undo: () => void;
  setUser: (user: any | null) => void;
  setIsPublishing: (v: boolean) => void;
  setCheckpoint: (pos: [number, number, number], dim: '2D' | '3D') => void;
  clearCheckpoint: () => void;
}

// Niveau de base créé par l'utilisateur ("levelbase1")
import levelBase1Data from '../data/levelbase1.json';
const defaultBlocks: BlockData[] = levelBase1Data as BlockData[];

export const useGameStore = create<GameState>((set) => ({
  dimension: '2D',
  isTransitioning: false,
  isPublishing: false,
  gameState: 'MENU',
  previousGameState: null,
  score: 0,
  coins: 0,
  timeElapsed: 0,
  currentMapId: null,
  blocks: defaultBlocks,
  history: [],
  selectedBlockType: 'brick',
  movingBlock: null,
  buildDepth: 0,
  resetKey: 0,
  user: null,
  lastCheckpoint: null,
  checkpointDimension: null,

  toggleDimension: () => {
    set({ isTransitioning: true });
    setTimeout(() => {
      set((state) => ({
        dimension: state.dimension === '2D' ? '3D' : '2D',
        isTransitioning: false
      }));
    }, 500); // 500ms flash animation
  },
  setGameState: (newState) => set((state) => {
    // Si on entre en Pause depuis Jouer ou Éditeur, on sauvegarde la provenance
    if (newState === 'PAUSE' && (state.gameState === 'PLAYING' || state.gameState === 'EDITOR')) {
      return { gameState: newState, previousGameState: state.gameState };
    }
    return { gameState: newState };
  }),
  addCoin: () => set((state) => ({ coins: state.coins + 1, score: state.score + 100 })),
  incrementTime: () => set((state) => ({ timeElapsed: state.timeElapsed + 1 })),
  addBlock: (block) => set((state) => {
    // Règle exclusive : Un seul Spawn Point par niveau
    const newBlocks = block.type === 'spawn'
      ? state.blocks.filter(b => b.type !== 'spawn')
      : [...state.blocks];

    return {
      history: [...state.history, state.blocks].slice(-50),
      blocks: [...newBlocks, { ...block, id: `block-${Date.now()}-${Math.random()}` }]
    };
  }),
  addBlocks: (newBlocks) => set((state) => {
    // Règle exclusive : S'il y a un 'spawn' dans les nouveaux blocs (le dernier compte),
    // on doit d'abord purger l'état précédent de tout bloc 'spawn' existant.
    const hasNewSpawn = newBlocks.some(b => b.type === 'spawn');
    const filteredOldBlocks = hasNewSpawn
      ? state.blocks.filter(b => b.type !== 'spawn')
      : state.blocks;

    // Si pendant un Drag on a posé plusieurs Spawns dans 'newBlocks', on ne garde que le dernier
    const finalNewBlocks = [...newBlocks];
    if (hasNewSpawn) {
      // Find the last index manually since findLastIndex needs ES2023
      let lastSpawnIndex = -1;
      for (let i = finalNewBlocks.length - 1; i >= 0; i--) {
        if (finalNewBlocks[i].type === 'spawn') {
          lastSpawnIndex = i;
          break;
        }
      }

      for (let i = 0; i < finalNewBlocks.length; i++) {
        if (finalNewBlocks[i].type === 'spawn' && i !== lastSpawnIndex) {
          // Marquer pour suppression via un type temporaire sans générer d'erreur de cast bloquante
          (finalNewBlocks[i] as any)._toBeDeleted = true;
        }
      }
    }

    return {
      history: [...state.history, state.blocks].slice(-50),
      blocks: [
        ...filteredOldBlocks,
        ...finalNewBlocks.filter(b => !(b as any)._toBeDeleted).map(b => ({ ...b, id: `block-${Date.now()}-${Math.random()}` }))
      ]
    };
  }),
  removeBlock: (id) => set((state) => ({
    history: [...state.history, state.blocks].slice(-50),
    blocks: state.blocks.filter(b => b.id !== id)
  })),
  removeBlocks: (ids) => set((state) => ({
    history: [...state.history, state.blocks].slice(-50),
    blocks: state.blocks.filter(b => !ids.includes(b.id))
  })),
  updateBlock: (id, type) => set((state) => ({
    blocks: state.blocks.map(b => b.id === id ? { ...b, type } : b)
  })),
  setSelectedBlockType: (type) => set((state) => {
    // Si on change d'outil au milieu d'un déplacement, on restaure le bloc à sa position originelle
    if (state.movingBlock && state.selectedBlockType === 'move' && type !== 'move') {
      return {
        selectedBlockType: type,
        movingBlock: null,
        blocks: [...state.blocks, state.movingBlock]
      };
    }
    return { selectedBlockType: type, movingBlock: null };
  }),
  setMovingBlock: (block) => set({ movingBlock: block }),
  setBuildDepth: (depth) => set({ buildDepth: depth }),
  resetLevel: () => set((state) => ({
    score: 0,
    coins: 0,
    timeElapsed: 0,
    resetKey: state.resetKey + 1,
    gameState: 'PLAYING',
    dimension: state.checkpointDimension || '2D'
  })),
  loadMap: (id, blocks) => set((state) => ({
    history: [...state.history, state.blocks].slice(-50),
    blocks,
    score: 0,
    coins: 0,
    timeElapsed: 0,
    currentMapId: id,
    resetKey: state.resetKey + 1,
    gameState: 'PLAYING',
    dimension: '2D',
    lastCheckpoint: null
  })),
  undo: () => set((state) => {
    if (state.history.length === 0) return state;
    const newHistory = [...state.history];
    const previousBlocks = newHistory.pop()!;
    return { blocks: previousBlocks, history: newHistory };
  }),
  setUser: (user) => set({ user }),
  setIsPublishing: (v) => set({ isPublishing: v }),
  setCheckpoint: (pos, dim) => set({ lastCheckpoint: pos, checkpointDimension: dim }),
  clearCheckpoint: () => set({ lastCheckpoint: null, checkpointDimension: null }),
}));
