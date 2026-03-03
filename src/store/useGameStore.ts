import { create } from 'zustand';

export type BlockType = 'brick' | 'ground' | 'question' | 'rift' | 'goomba' | 'pushable' | 'coin' | 'flag' | 'spawn' | 'spike' | 'platform' | 'lamp';
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
  timeLeft: number;
  blocks: BlockData[];
  history: BlockData[][];
  selectedBlockType: EditorTool;
  movingBlock: BlockData | null;
  resetKey: number;
  user: any | null;

  toggleDimension: () => void;
  setGameState: (state: 'MENU' | 'PLAYING' | 'EDITOR' | 'WIN' | 'PAUSE' | 'MARKETPLACE') => void;
  addCoin: () => void;
  decrementTime: () => void;
  addBlock: (block: Omit<BlockData, 'id'>) => void;
  addBlocks: (blocks: Omit<BlockData, 'id'>[]) => void;
  removeBlock: (id: string) => void;
  removeBlocks: (ids: string[]) => void;
  updateBlock: (id: string, type: BlockType) => void;
  setSelectedBlockType: (type: EditorTool) => void;
  setMovingBlock: (block: BlockData | null) => void;
  resetLevel: () => void;
  loadMap: (blocks: BlockData[]) => void;
  undo: () => void;
  setUser: (user: any | null) => void;
  setIsPublishing: (v: boolean) => void;
}

const defaultBlocks: BlockData[] = [
  ...Array.from({ length: 40 }).flatMap((_, i) =>
    Array.from({ length: 7 }).map((_, j) => ({
      id: `floor-${i - 10}-${j - 3}`,
      position: [i - 10, -1, j - 3] as [number, number, number],
      type: 'ground' as BlockType
    }))
  ),
  { id: 'b1', position: [3, 0, 0], type: 'brick' },
  { id: 'b2', position: [4, 0, 0], type: 'brick' },
  { id: 'b3', position: [4, 1, 0], type: 'brick' },
  { id: 'q1', position: [7, 3, 0], type: 'question' },
  { id: 'b4', position: [8, 3, 0], type: 'brick' },
  { id: 'q2', position: [9, 3, 0], type: 'question' },
  { id: 'g1', position: [11, 2, 0], type: 'goomba' },
  { id: 'r1', position: [14, 1, 0], type: 'rift' },
  { id: 'q3', position: [19, 0, 2], type: 'question' },
  { id: 'b5', position: [22, 0, 0], type: 'brick' },
  { id: 'b6', position: [22, 1, 0], type: 'brick' },
  { id: 'b7', position: [22, 2, 0], type: 'brick' },
  { id: 'g2', position: [20, 2, 0], type: 'goomba' },
  { id: 'p1', position: [15, 0, 0], type: 'pushable' },
  { id: 'c1', position: [4, 4, 0], type: 'coin' },
  { id: 'c2', position: [6, 4, 0], type: 'coin' },
  { id: 'f1', position: [28, 0, 0], type: 'flag' },
  { id: 's1', position: [0, 0, 0], type: 'spawn' },
];

export const useGameStore = create<GameState>((set) => ({
  dimension: '2D',
  isTransitioning: false,
  isPublishing: false,
  gameState: 'MENU',
  previousGameState: null,
  score: 0,
  coins: 0,
  timeLeft: 300,
  blocks: defaultBlocks,
  history: [],
  selectedBlockType: 'brick',
  movingBlock: null,
  resetKey: 0,
  user: null,

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
  decrementTime: () => set((state) => {
    if (state.timeLeft <= 0) {
      // Return state as is, triggering death is handled in HUD effect
      return state;
    }
    return { timeLeft: state.timeLeft - 1 };
  }),
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
  resetLevel: () => set((state) => ({
    score: 0,
    coins: 0,
    timeLeft: 300,
    resetKey: state.resetKey + 1,
    gameState: 'PLAYING',
    dimension: '2D'
  })),
  loadMap: (blocks) => set((state) => ({
    history: [...state.history, state.blocks].slice(-50),
    blocks,
    score: 0,
    coins: 0,
    timeLeft: 300,
    resetKey: state.resetKey + 1,
    gameState: 'PLAYING',
    dimension: '2D'
  })),
  undo: () => set((state) => {
    if (state.history.length === 0) return state;
    const newHistory = [...state.history];
    const previousBlocks = newHistory.pop()!;
    return { blocks: previousBlocks, history: newHistory };
  }),
  setUser: (user) => set({ user }),
  setIsPublishing: (v) => set({ isPublishing: v }),
}));
