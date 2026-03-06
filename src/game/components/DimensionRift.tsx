import { useRef, useState } from 'react';
import { useFrame, ThreeEvent } from '@react-three/fiber';
import { RigidBody } from '@react-three/rapier';
import { useGameStore } from '../../store/useGameStore';
import * as THREE from 'three';
import { playDimension } from '../../utils/audio';

const COOLDOWN_SCALE = new THREE.Vector3(0.5, 0.5, 0.5); // Preallocated for lerp

export default function DimensionRift({ id, position }: { id?: string, position: [number, number, number] }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const toggleDimension = useGameStore(s => s.toggleDimension);
  const dimension = useGameStore(s => s.dimension);
  const gameState = useGameStore(s => s.gameState);
  const removeBlock = useGameStore(s => s.removeBlock);
  const selectedBlockType = useGameStore(s => s.selectedBlockType);

  const cooldownRef = useRef(false);
  const [isOnCooldown, setIsOnCooldown] = useState(false);

  useFrame((state) => {
    if (meshRef.current) {
      if (!isOnCooldown) {
        meshRef.current.rotation.y += 0.03;
        meshRef.current.rotation.x += 0.02;

        // Pulse effect
        const scale = 1 + Math.sin(state.clock.elapsedTime * 5) * 0.1;
        meshRef.current.scale.set(scale, scale, scale);
      } else {
        // Shrink during cooldown
        meshRef.current.scale.lerp(COOLDOWN_SCALE, 0.1);
      }
    }
  });

  return (
    <RigidBody
      type="fixed"
      position={position}
      colliders="cuboid"
      sensor
      onIntersectionEnter={(e) => {
        const isPlayer = e.other.rigidBodyObject?.name === 'player' || e.other.rigidBodyObject?.userData?.isPlayer;
        if (gameState === 'PLAYING' && isPlayer && !cooldownRef.current) {
          cooldownRef.current = true;
          setIsOnCooldown(true);
          playDimension();
          toggleDimension();
          setTimeout(() => {
            cooldownRef.current = false;
            setIsOnCooldown(false);
          }, 3000); // 3 seconds cooldown
        }
      }}
    >
      <group>
        <mesh ref={meshRef}>
          <octahedronGeometry args={[0.8, 0]} />
          <meshStandardMaterial
            color={isOnCooldown ? "#555555" : (dimension === '2D' ? "#00ffff" : "#ff00ff")}
            emissive={isOnCooldown ? "#555555" : (dimension === '2D' ? "#00ffff" : "#ff00ff")}
            emissiveIntensity={isOnCooldown ? 0.2 : 1.5}
            wireframe
          />
        </mesh>

        {/* Inner core */}
        <mesh>
          <sphereGeometry args={[0.3, 16, 16]} />
          <meshBasicMaterial color={isOnCooldown ? "#333333" : "white"} />
        </mesh>
      </group>
    </RigidBody>
  );
}
