import { useRef, useState } from 'react';
import { useFrame, ThreeEvent } from '@react-three/fiber';
import { RigidBody } from '@react-three/rapier';
import { useGameStore } from '../../store/useGameStore';
import * as THREE from 'three';
import { playCoin } from '../../utils/audio';

export default function Coin({ id, position }: { id: string, position: [number, number, number] }) {
  const groupRef = useRef<THREE.Group>(null);
  const gameState = useGameStore(s => s.gameState);
  const removeBlock = useGameStore(s => s.removeBlock);
  const selectedBlockType = useGameStore(s => s.selectedBlockType);
  const addCoin = useGameStore(s => s.addCoin);

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += 0.05;
      groupRef.current.position.y = Math.sin(state.clock.elapsedTime * 3) * 0.1;
    }
  });

  return (
    <RigidBody
      type="fixed"
      position={position}
      sensor
      onIntersectionEnter={(e) => {
        if (gameState === 'PLAYING' && e.other.rigidBodyObject?.name === 'player') {
          playCoin();
          addCoin();
          if (id) removeBlock(id);
        }
      }}
    >
      <group ref={groupRef}>
        <mesh castShadow rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.3, 0.3, 0.1, 16]} />
          <meshStandardMaterial color="#ffd700" metalness={0.8} roughness={0.2} />
        </mesh>
      </group>
    </RigidBody>
  );
}
