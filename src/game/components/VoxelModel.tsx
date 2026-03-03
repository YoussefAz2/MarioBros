import { useRef, useLayoutEffect } from 'react';
import * as THREE from 'three';

export const MARIO_MATRIX = [
  "....RRRRR...",
  "...RRRRRRRR.",
  "...KKK..Y...",
  "..KYK...Y...",
  "..KYKK..Y...",
  "..KYKKKK....",
  "....KKKK....",
  "..RRBRR.....",
  ".RRRBRRR....",
  "RRRRBBRRRR..",
  "YYY.BB.YYY..",
  "YY..BB..YY..",
  "....BB......",
  "...BBB......",
  "..BB.BB.....",
  ".BB...BB...."
];

export const MARIO_PALETTE: Record<string, string> = {
  'R': '#ff0000',
  'B': '#0000ff',
  'Y': '#ffcc99',
  'K': '#331100'
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

interface VoxelProps {
  matrix: string[];
  palette: Record<string, string>;
  size?: number;
  depth?: number;
}

export default function VoxelModel({ matrix, palette, size = 0.06, depth = 3 }: VoxelProps) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  
  const pixels = matrix.join('').replace(/\./g, '').length;
  const count = pixels * depth;

  useLayoutEffect(() => {
    if (!meshRef.current) return;
    const dummy = new THREE.Object3D();
    let i = 0;
    
    const startZ = -Math.floor(depth / 2);
    const endZ = Math.floor(depth / 2);

    for (let z = startZ; z <= endZ; z++) {
      for (let y = 0; y < matrix.length; y++) {
        for (let x = 0; x < matrix[y].length; x++) {
          const char = matrix[y][x];
          if (char !== '.') {
            dummy.position.set(
              (x - matrix[y].length / 2) * size,
              ((matrix.length - y) - matrix.length / 2) * size,
              z * size
            );
            dummy.updateMatrix();
            meshRef.current.setMatrixAt(i, dummy.matrix);
            meshRef.current.setColorAt(i, new THREE.Color(palette[char]));
            i++;
          }
        }
      }
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
    if (meshRef.current.instanceColor) meshRef.current.instanceColor.needsUpdate = true;
  }, [matrix, palette, size, depth]);

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]} castShadow receiveShadow>
      <boxGeometry args={[size, size, size]} />
      <meshStandardMaterial roughness={0.8} />
    </instancedMesh>
  );
}
