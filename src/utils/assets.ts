export const MARIO_MATRIX = [
  "......RRRRR.....",
  ".....RRRRRRRRR..",
  ".....KKK..Y.....",
  "....KYK...Y.....",
  "....KYKK..Y.....",
  "....KYKKKK......",
  "......KKKK......",
  "....RRBRR.......",
  "...RRRBRRR......",
  "..RRRRBBRRRR....",
  "..YYY.BB.YYY....",
  "..YY..BB..YY....",
  "......BB........",
  ".....BBB........",
  "....BB.BB.......",
  "...BB...BB......"
];

export const MARIO_PALETTE: Record<string, string> = {
  'R': '#E52521', // Mario Red
  'B': '#049CD8', // Mario Blue
  'Y': '#FBD000', // Skin/Yellow
  'K': '#43B047'  // Brown/Greenish (using classic colors)
};

export const GOOMBA_MATRIX = [
  "......KKKK......",
  "....KKKKKKKK....",
  "...KKKKKKKKKK...",
  "..KKKKKKKKKKKK..",
  "..KKKWWKKWWKKK..",
  "..KKKWbKKWbKKK..",
  ".KKKKWWKKWWKKKK.",
  ".KKKKKKKKKKKKKK.",
  ".KKKKKKKKKKKKKK.",
  "..KKKKKKKKKKKK..",
  "...KKKKKKKKKK...",
  "....YYYYYYYY....",
  "....Y......Y....",
  "...YY......YY...",
  "..YYY......YYY..",
  ".YYYY......YYYY."
];

export const GOOMBA_PALETTE: Record<string, string> = {
  'K': '#8b4513',
  'W': '#ffffff',
  'b': '#000000',
  'Y': '#ffcc99'
};
