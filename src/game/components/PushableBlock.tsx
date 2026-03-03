import { useRef, useEffect } from 'react';
import { useFrame, ThreeEvent } from '@react-three/fiber';
import { RigidBody, RapierRigidBody, RoundCuboidCollider } from '@react-three/rapier';
import { useGameStore } from '../../store/useGameStore';
import * as THREE from 'three';

export default function PushableBlock({ id, position }: { id?: string, position: [number, number, number] }) {
  const body = useRef<RapierRigidBody>(null);
  const dimension = useGameStore(s => s.dimension);
  const gameState = useGameStore(s => s.gameState);
  const removeBlock = useGameStore(s => s.removeBlock);
  const selectedBlockType = useGameStore(s => s.selectedBlockType);

  const lockedPos = useRef<THREE.Vector3 | null>(null);

  useFrame(() => {
    if (!body.current) return;

    // In 2D or EDITOR, the block is completely immovable
    if (dimension === '2D' || gameState === 'EDITOR') {
      if (!lockedPos.current) {
        // En mode Editeur, on fait confiance à 100% à la prop UI "position" car le moteur 
        // physique peut renvoyer (0,0,0) sur sa toute première frame d'initialisation.
        if (gameState === 'EDITOR') {
          lockedPos.current = new THREE.Vector3(...position);
        } else {
          // En jeu régulier, on verrouille sur la position physique courante au moment du switch 2D
          lockedPos.current = new THREE.Vector3().copy(body.current.translation());
        }

        if (dimension === '2D' && gameState !== 'EDITOR') {
          // Snap to 2D plane and round the X position to align with grid
          lockedPos.current.z = 0;
          lockedPos.current.x = Math.round(lockedPos.current.x);
        }
      }
      body.current.setTranslation(lockedPos.current, true);
      body.current.setLinvel({ x: 0, y: 0, z: 0 }, true);
      body.current.setAngvel({ x: 0, y: 0, z: 0 }, true);
    } else {
      // In 3D PLAYING mode, it's free to move!
      lockedPos.current = null;

      // Add a tiny bit of anti-gravity to prevent floor friction bugs
      const linvel = body.current.linvel();
      if (Math.abs(linvel.x) > 0.1 || Math.abs(linvel.z) > 0.1) {
        body.current.applyImpulse({ x: 0, y: 0.02, z: 0 }, true);
      }
    }
  });

  // Force actualisation de la position de lockedPos dans l'éditeur si on utilise l'outil Move (qui modifie la prop position)
  useEffect(() => {
    if (gameState === 'EDITOR') {
      lockedPos.current = new THREE.Vector3(...position);
      if (body.current) {
        body.current.setTranslation(lockedPos.current, true);
        body.current.setLinvel({ x: 0, y: 0, z: 0 }, true);
      }
    }
  }, [position, gameState]);

  return (
    <RigidBody
      ref={body}
      type="dynamic" // ALWAYS dynamic to avoid Rapier bugs when switching types
      mass={0.5}
      position={position}
      enabledRotations={[false, false, false]} // Strictly prevent tilting
      friction={0}
      restitution={0}
      linearDamping={6}
      canSleep={false}
      colliders={false} // Disable auto-collider to prevent catching on floor seams
    >
      {/* RoundCuboidCollider is perfect for sliding over grid seams without catching */}
      <RoundCuboidCollider args={[0.4, 0.45, 0.4, 0.08]} />

      <mesh receiveShadow castShadow>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="#0055ff" metalness={0.5} roughness={0.2} />
        {/* Add a little inner box to make it look like a crate */}
        <mesh position={[0, 0, 0.51]}>
          <boxGeometry args={[0.8, 0.8, 0.01]} />
          <meshStandardMaterial color="#0033aa" />
        </mesh>
        <mesh position={[0, 0, -0.51]}>
          <boxGeometry args={[0.8, 0.8, 0.01]} />
          <meshStandardMaterial color="#0033aa" />
        </mesh>
        <mesh position={[0.51, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
          <boxGeometry args={[0.8, 0.8, 0.01]} />
          <meshStandardMaterial color="#0033aa" />
        </mesh>
        <mesh position={[-0.51, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
          <boxGeometry args={[0.8, 0.8, 0.01]} />
          <meshStandardMaterial color="#0033aa" />
        </mesh>
      </mesh>
    </RigidBody>
  );
}
