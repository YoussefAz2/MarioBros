import { useRef } from 'react';
import { ThreeEvent, useFrame } from '@react-three/fiber';
import { RigidBody } from '@react-three/rapier';
import { useGameStore } from '../../store/useGameStore';
import * as THREE from 'three';

export default function Flag({ id, position }: { id?: string, position: [number, number, number] }) {
  const gameState = useGameStore(s => s.gameState);
  const setGameState = useGameStore(s => s.setGameState);
  const removeBlock = useGameStore(s => s.removeBlock);
  const selectedBlockType = useGameStore(s => s.selectedBlockType);
  const flagRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (flagRef.current) {
      // Waving animation
      flagRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 2) * 0.2;
    }
  });

  return (
    <RigidBody 
      type="fixed" 
      position={position} 
      sensor 
      onIntersectionEnter={(e) => {
        if (gameState === 'PLAYING' && e.other.rigidBodyObject?.name === 'player') {
          setGameState('WIN');
        }
      }}
    >
      <group>
        {/* Pole */}
        <mesh position={[0, 2.5, 0]} castShadow>
          <cylinderGeometry args={[0.1, 0.1, 5]} />
          <meshStandardMaterial color="#cccccc" metalness={0.8} roughness={0.2} />
        </mesh>
        {/* Top Ball */}
        <mesh position={[0, 5.1, 0]} castShadow>
          <sphereGeometry args={[0.2]} />
          <meshStandardMaterial color="#ffd700" metalness={0.8} roughness={0.2} />
        </mesh>
        {/* Flag */}
        <mesh ref={flagRef} position={[0.6, 4.5, 0]} castShadow>
          <planeGeometry args={[1.2, 0.8]} />
          <meshStandardMaterial color="#00ff00" side={THREE.DoubleSide} />
        </mesh>
      </group>
    </RigidBody>
  );
}
