import React from 'react';
import { RigidBody } from '@react-three/rapier';
import { useGameStore } from '../../store/useGameStore';
import * as THREE from 'three';
import { playDie } from '../../utils/audio';

export default function Spike({ position }: { position: [number, number, number] }) {
    const dimension = useGameStore(s => s.dimension);
    const gameState = useGameStore(s => s.gameState);
    const resetLevel = useGameStore(s => s.resetLevel);

    // Sprite Pixel Art manuel pour le Pic 2D
    const spikeTexture = React.useMemo(() => {
        const c = document.createElement('canvas');
        c.width = 32;
        c.height = 32;
        const ctx = c.getContext('2d');
        if (ctx) {
            // Base métallique
            ctx.fillStyle = "#555555";
            ctx.fillRect(2, 24, 28, 8);
            ctx.fillStyle = "#333333";
            ctx.fillRect(2, 28, 28, 4);

            // Pointes (3 pointes)
            ctx.fillStyle = "#dddddd";
            // Pointe 1 (gauche)
            ctx.beginPath(); ctx.moveTo(8, 24); ctx.lineTo(4, 8); ctx.lineTo(12, 24); ctx.fill();
            // Pointe 2 (centre)
            ctx.beginPath(); ctx.moveTo(16, 24); ctx.lineTo(16, 4); ctx.lineTo(20, 24); ctx.fill();
            // Pointe 3 (droite)
            ctx.beginPath(); ctx.moveTo(24, 24); ctx.lineTo(28, 8); ctx.lineTo(20, 24); ctx.fill();

            // Reflets pointes
            ctx.fillStyle = "#ffffff";
            ctx.beginPath(); ctx.moveTo(8, 24); ctx.lineTo(4, 8); ctx.lineTo(6, 24); ctx.fill();
            ctx.beginPath(); ctx.moveTo(16, 24); ctx.lineTo(16, 4); ctx.lineTo(18, 24); ctx.fill();
            ctx.beginPath(); ctx.moveTo(24, 24); ctx.lineTo(28, 8); ctx.lineTo(26, 24); ctx.fill();
        }
        const tex = new THREE.CanvasTexture(c);
        tex.magFilter = THREE.NearestFilter;
        return tex;
    }, []);

    return (
        <RigidBody
            type="fixed"
            position={position}
            colliders="hull"
            onCollisionEnter={(e) => {
                if (gameState === 'PLAYING' && e.other.rigidBodyObject?.name === 'player') {
                    playDie();
                    resetLevel();
                }
            }}
        >
            <group position={[0, -0.5, 0]}>
                {dimension === '2D' ? (
                    // 2D Pixel Art Spike Sprite
                    <mesh position={[0, 0.5, 0]}>
                        <planeGeometry args={[1, 1]} />
                        <meshBasicMaterial map={spikeTexture} transparent={true} side={THREE.DoubleSide} alphaTest={0.5} />
                    </mesh>
                ) : (
                    // 3D Arcade Spike (Base + 4 Cones)
                    <group position={[0, 0.5, 0]}>
                        {/* Base métallique carrée */}
                        <mesh position={[0, -0.4, 0]}>
                            <boxGeometry args={[0.9, 0.2, 0.9]} />
                            <meshStandardMaterial color="#7f8c8d" metalness={0.6} roughness={0.4} />
                        </mesh>
                        {/* 4 Pointes */}
                        {[
                            [-0.25, -0.25], [0.25, -0.25],
                            [-0.25, 0.25], [0.25, 0.25]
                        ].map(([x, z], i) => (
                            <mesh key={i} position={[x, 0, z]}>
                                <coneGeometry args={[0.15, 0.6, 4]} />
                                <meshStandardMaterial color="#bdc3c7" metalness={0.9} roughness={0.15} flatShading />
                            </mesh>
                        ))}
                        {/* Petite lumière interne anti-nuit */}
                        <pointLight position={[0, 0.5, 0]} intensity={2} distance={2} color="#ffffff" decay={2} />
                    </group>
                )}
            </group>
        </RigidBody>
    );
}
