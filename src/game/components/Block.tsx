import { RigidBody } from '@react-three/rapier';
import { useMemo, useState, useRef } from 'react';
import { createBrickTexture, createQuestionTexture } from '../../utils/textures';
import { useGameStore, BlockType } from '../../store/useGameStore';
import { ThreeEvent, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { playBump, playBreak, playCoin } from '../../utils/audio';

interface BlockProps {
  id?: string;
  position: [number, number, number];
  type?: BlockType;
}

const ZERO_VECTOR = new THREE.Vector3(0, 0, 0); // Preallocated for lerp

export default function Block({ id, position, type = 'brick' }: BlockProps) {
  const brickTex = useMemo(() => createBrickTexture(), []);
  const questionTex = useMemo(() => createQuestionTexture(), []);
  const gameState = useGameStore(s => s.gameState);
  const removeBlock = useGameStore(s => s.removeBlock);
  const selectedBlockType = useGameStore(s => s.selectedBlockType);
  const addCoin = useGameStore(s => s.addCoin);

  const [hit, setHit] = useState(false);
  const [breaking, setBreaking] = useState(false);
  const meshRef = useRef<THREE.Mesh>(null);
  const fragments = useRef<THREE.Mesh[]>([]);

  let material;
  switch (type) {
    case 'ground':
      material = <meshStandardMaterial map={brickTex} color="#c84c0c" />;
      break;
    case 'question':
      material = <meshStandardMaterial map={questionTex} />;
      break;
    case 'brick':
    default:
      material = <meshStandardMaterial map={brickTex} />;
      break;
  }

  useFrame((state, delta) => {
    if (breaking && fragments.current.length > 0) {
      // Fragments explosion physics simulation
      fragments.current.forEach((frag, i) => {
        if (!frag) return;

        // Initialize velocity on first frame
        if (!frag.userData.vel) {
          frag.userData.vel = new THREE.Vector3(
            (i % 2 === 0 ? 1 : -1) * 3, // X spread
            (i < 2 ? 1 : -0.5) * 4 + 4, // Y upward burst
            (Math.random() - 0.5) * 4   // Z spread
          );
        }

        // Apply gravity
        frag.userData.vel.y -= 25 * delta;

        // Move and spin
        frag.position.addScaledVector(frag.userData.vel, delta);
        frag.rotation.x += delta * 15;
        frag.rotation.y += delta * 15;

        // Shrink
        frag.scale.lerp(ZERO_VECTOR, 0.1);
      });
    } else if (hit && !breaking && meshRef.current) {
      // Visual bump when hit
      meshRef.current.position.y = THREE.MathUtils.lerp(meshRef.current.position.y, 0.2, 0.3);
    }
  });

  const handleCollision = (e: any) => {
    // Seuls les blocs 'question' réagissent au fait d'être cognés par en dessous
    if (type === 'question' && e.other.rigidBodyObject?.name === 'player') {
      const playerY = e.other.rigidBodyObject.position.y;
      if (playerY < position[1] - 0.4 && !hit && !breaking) {
        setBreaking(true);
        playBreak(); // Petit son de destruction du bloc
        playCoin();
        addCoin();

        // Attendre 400ms pour laisser l'animation des fragments se dissiper
        setTimeout(() => {
          if (id) removeBlock(id);
        }, 400);
      }
    }
  };

  if (breaking) {
    return (
      <group position={position}>
        {Array.from({ length: 4 }).map((_, i) => (
          <mesh
            key={`frag-${i}`}
            ref={(el) => (fragments.current[i] = el as THREE.Mesh)}
            position={[(i % 2 === 0 ? 0.25 : -0.25), (i < 2 ? 0.25 : -0.25), 0]}
            scale={[0.4, 0.4, 0.4]}
          >
            <boxGeometry args={[1, 1, 1]} />
            {material}
          </mesh>
        ))}
      </group>
    );
  }

  return (
    <RigidBody type="fixed" position={position} friction={0} onCollisionEnter={handleCollision}>
      <mesh ref={meshRef} receiveShadow castShadow>
        <boxGeometry args={[1, 1, 1]} />
        {material}
      </mesh>
    </RigidBody>
  );
}
