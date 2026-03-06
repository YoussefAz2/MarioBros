import * as THREE from 'three';

// Shared texture cache — all Block instances reuse the same textures
let _brickTex: THREE.CanvasTexture | null = null;
let _questionTex: THREE.CanvasTexture | null = null;

export const createBrickTexture = () => {
  if (_brickTex) return _brickTex;
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d')!;

  // Base color
  ctx.fillStyle = '#c84c0c';
  ctx.fillRect(0, 0, 64, 64);

  // Mortar lines
  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 31, 64, 2); // Horizontal middle
  ctx.fillRect(0, 62, 64, 2); // Horizontal bottom
  ctx.fillRect(31, 0, 2, 32); // Vertical top middle
  ctx.fillRect(15, 32, 2, 32); // Vertical bottom left
  ctx.fillRect(47, 32, 2, 32); // Vertical bottom right

  // Highlights
  ctx.fillStyle = '#ffce9c';
  ctx.fillRect(0, 0, 64, 2);
  ctx.fillRect(0, 33, 64, 2);

  const tex = new THREE.CanvasTexture(canvas);
  tex.magFilter = THREE.NearestFilter;
  _brickTex = tex;
  return tex;
};

export const createQuestionTexture = () => {
  if (_questionTex) return _questionTex;
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#e8c400';
  ctx.fillRect(0, 0, 64, 64);

  // Rivets
  ctx.fillStyle = '#c84c0c';
  ctx.fillRect(4, 4, 4, 4);
  ctx.fillRect(56, 4, 4, 4);
  ctx.fillRect(4, 56, 4, 4);
  ctx.fillRect(56, 56, 4, 4);

  // Question mark
  ctx.fillStyle = '#c84c0c';
  ctx.font = 'bold 40px "Courier New"';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('?', 34, 34);

  ctx.fillStyle = '#000000';
  ctx.fillText('?', 32, 32);

  const tex = new THREE.CanvasTexture(canvas);
  tex.magFilter = THREE.NearestFilter;
  _questionTex = tex;
  return tex;
};
