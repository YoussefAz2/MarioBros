import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { RigidBody, CuboidCollider } from '@react-three/rapier';
import { useGameStore } from '../../store/useGameStore';
import * as THREE from 'three';
import { playCheckpoint } from '../../utils/audio';

export default function Checkpoint({ position }: { position: [number, number, number] }) {
    const dimension = useGameStore(s => s.dimension);
    const gameState = useGameStore(s => s.gameState);
    const lastCheckpoint = useGameStore(s => s.lastCheckpoint);
    const setCheckpoint = useGameStore(s => s.setCheckpoint);
    const crystalRef = useRef<THREE.Mesh>(null);

    // Vérifie si CE checkpoint précis est le dernier touché
    const isActive = lastCheckpoint && lastCheckpoint[0] === position[0] && lastCheckpoint[1] === position[1] && lastCheckpoint[2] === position[2];

    useFrame((state) => {
        if (crystalRef.current) {
            crystalRef.current.rotation.y += 0.05;
            if (isActive) {
                crystalRef.current.position.y = 0.5 + Math.sin(state.clock.elapsedTime * 4) * 0.1;
            } else {
                crystalRef.current.position.y = 0.5;
            }
        }
    });

    const handleCollision = (e: any) => {
        if (gameState !== 'PLAYING') return;
        const isPlayer = e.other.rigidBodyObject?.name === 'player' || e.other.rigidBodyObject?.userData?.isPlayer;
        if (isPlayer && !isActive) {
            setCheckpoint(position, dimension);
            playCheckpoint();
        }
    };

    return (
        <RigidBody
            type="fixed"
            position={position}
            colliders={false}
            onIntersectionEnter={handleCollision}
        >
            <CuboidCollider args={[0.5, 0.5, 0.5]} sensor />

            <group position={[0, -0.4, 0]}>
                {/* Socle métallique */}
                {dimension === '2D' ? (
                    <mesh position={[0, 0.1, 0]}>
                        <boxGeometry args={[0.8, 0.2, 0.8]} />
                        <meshBasicMaterial color="#555555" />
                    </mesh>
                ) : (
                    <mesh position={[0, 0.1, 0]}>
                        <cylinderGeometry args={[0.4, 0.5, 0.2, 8]} />
                        <meshStandardMaterial color="#888888" metalness={0.8} roughness={0.2} />
                    </mesh>
                )}

                {/* Cristal flottant */}
                <mesh ref={crystalRef} position={[0, 0.5, 0]}>
                    <octahedronGeometry args={[0.3, 0]} />
                    {dimension === '2D' ? (
                        <meshBasicMaterial color={isActive ? "#4ade80" : "#ef4444"} wireframe={!isActive} />
                    ) : (
                        <meshStandardMaterial
                            color={isActive ? "#4ade80" : "#ef4444"}
                            emissive={isActive ? "#4ade80" : "#000000"}
                            emissiveIntensity={isActive ? 2 : 0}
                            transparent
                            opacity={0.8}
                        />
                    )}
                </mesh>
            </group>
        </RigidBody>
    );
}
