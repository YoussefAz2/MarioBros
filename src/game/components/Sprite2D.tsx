import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface Sprite2DProps {
  matrix: string[];
  palette: Record<string, string>;
  facingRight: React.MutableRefObject<boolean>;
}

export default function Sprite2D({ matrix, palette, facingRight }: Sprite2DProps) {
  const meshRef = useRef<THREE.Mesh>(null);

  const texture = useMemo(() => {
    const canvas = document.createElement('canvas');
    const width = matrix[0].length;
    const height = matrix.length;
    canvas.width = width * 8;
    canvas.height = height * 8;
    const ctx = canvas.getContext('2d')!;
    
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const char = matrix[y][x];
        if (char !== '.') {
          ctx.fillStyle = palette[char];
          ctx.fillRect(x * 8, y * 8, 8, 8);
        }
      }
    }
    
    const tex = new THREE.CanvasTexture(canvas);
    tex.magFilter = THREE.NearestFilter;
    tex.minFilter = THREE.NearestFilter;
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }, [matrix, palette]);

  useFrame(() => {
    if (meshRef.current) {
      const targetScaleX = facingRight.current ? 1 : -1;
      meshRef.current.scale.x = THREE.MathUtils.lerp(meshRef.current.scale.x, targetScaleX, 0.5);
    }
  });

  return (
    <mesh ref={meshRef}>
      <planeGeometry args={[matrix[0].length / 16, matrix.length / 16]} />
      <meshStandardMaterial map={texture} transparent alphaTest={0.5} side={THREE.DoubleSide} />
    </mesh>
  );
}
