import { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { RigidBody, RapierRigidBody } from '@react-three/rapier';
import { useGameStore } from '../../store/useGameStore';
import * as THREE from 'three';

export default function MovingPlatform({ position }: { position: [number, number, number] }) {
    const body = useRef<RapierRigidBody>(null);
    const dimension = useGameStore(s => s.dimension);
    const isPlaying = useGameStore(s => s.gameState === 'PLAYING');

    // Platform moves left and right by 3 units total
    const startX = position[0];
    const direction = useRef(1);
    const range = 2.5;
    const speed = 2;

    useFrame((_, delta) => {
        if (!body.current || !isPlaying) {
            if (!isPlaying && body.current) {
                body.current.setTranslation(new THREE.Vector3(...position), true);
                body.current.setLinvel({ x: 0, y: 0, z: 0 }, true);
            }
            return;
        }

        const currentPos = body.current.translation();

        // Reverse direction if out of range
        // On n'inverse plus seulement via la position (ou on le garde comme sécurité lointaine)
        if (currentPos.x > startX + 15 && direction.current === 1) direction.current = -1;
        if (currentPos.x < startX - 15 && direction.current === -1) direction.current = 1;

        body.current.setLinvel({ x: speed * direction.current, y: 0, z: 0 }, true);
    });

    const handleCollision = (e: any) => {
        // Inverser la direction si la plateforme percute un mur ou un objet autre que le joueur
        const isPlayer = e.other.rigidBodyObject?.name === 'player' || e.other.rigidBodyObject?.userData?.isPlayer;
        if (!isPlayer) {
            direction.current *= -1;
        }
    };

    return (
        <RigidBody
            ref={body}
            type="kinematicVelocity"
            position={position}
            friction={2.0}
            lockRotations
            name="platform"
            onCollisionEnter={handleCollision}
        >
            <group position={[0, -0.25, 0]}>
                {dimension === '2D' ? (
                    <mesh position={[0, 0, 0]}>
                        <boxGeometry args={[2, 0.5, 1]} />
                        <meshBasicMaterial color="#888888" />
                        <mesh position={[0, 0.25, 0.51]}>
                            <planeGeometry args={[2, 0.1]} />
                            <meshBasicMaterial color="#ffffff" />
                        </mesh>
                        <mesh position={[0, -0.25, 0.51]}>
                            <planeGeometry args={[2, 0.1]} />
                            <meshBasicMaterial color="#444444" />
                        </mesh>
                    </mesh>
                ) : (
                    <mesh position={[0, 0, 0]}>
                        <boxGeometry args={[2, 0.5, 1]} />
                        <meshStandardMaterial color="#888888" metalness={0.5} roughness={0.5} />
                    </mesh>
                )}
            </group>
        </RigidBody>
    );
}
