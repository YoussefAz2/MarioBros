import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useGameStore } from '../../store/useGameStore';

interface SpawnPointProps {
    id: string;
    position: [number, number, number];
}

export default function SpawnPoint({ id, position }: SpawnPointProps) {
    const boxRef = useRef<THREE.Group>(null);
    const arrowRef = useRef<THREE.Group>(null);
    const dimension = useGameStore(s => s.dimension);
    const gameState = useGameStore(s => s.gameState);

    const isVisible = gameState === 'EDITOR';

    useFrame((state) => {
        if (!isVisible || !boxRef.current || !arrowRef.current) return;
        const t = state.clock.elapsedTime;

        // Légère lévitation pulsante
        boxRef.current.position.y = position[1] + Math.sin(t * 2) * 0.05;
        // La flèche tourne pour indiquer l'arrivée
        arrowRef.current.rotation.y = t * 1.5;
    });

    return (
        <group position={position} visible={isVisible}>
            {/* Base "Start Plateau" */}
            <group ref={boxRef} position={[0, -0.4, 0]}>
                <mesh position={[0, 0, 0]}>
                    <cylinderGeometry args={[0.45, 0.45, 0.2, 32]} />
                    <meshStandardMaterial color="#333333" />
                </mesh>
                <mesh position={[0, 0.11, 0]}>
                    <cylinderGeometry args={[0.4, 0.4, 0.05, 32]} />
                    <meshStandardMaterial color="#4ade80" emissive="#16a34a" emissiveIntensity={0.5} />
                </mesh>
            </group>

            {/* Floating Arrow pointant vers le bas */}
            <group ref={arrowRef} position={[0, 0.8, 0]}>
                <mesh position={[0, 0.3, 0]}>
                    <cylinderGeometry args={[0.05, 0.05, 0.4, 8]} />
                    <meshStandardMaterial color="#4ade80" emissive="#4ade80" emissiveIntensity={1} />
                </mesh>
                <mesh position={[0, 0, 0]}>
                    <coneGeometry args={[0.15, 0.3, 16]} />
                    <meshStandardMaterial color="#4ade80" emissive="#4ade80" emissiveIntensity={1} />
                </mesh>
            </group>
        </group>
    );
}
