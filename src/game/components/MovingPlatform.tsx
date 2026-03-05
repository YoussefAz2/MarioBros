import { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { RigidBody, RapierRigidBody, useRapier } from '@react-three/rapier';
import { useGameStore } from '../../store/useGameStore';
import * as THREE from 'three';

export default function MovingPlatform({ position }: { position: [number, number, number] }) {
    const body = useRef<RapierRigidBody>(null);
    const dimension = useGameStore(s => s.dimension);
    const isPlaying = useGameStore(s => s.gameState === 'PLAYING');

    // Platform moves left and right by 3 units total
    const startX = position[0];
    const direction = useRef(1);
    const lastFlipTime = useRef(0);
    const { rapier, world } = useRapier();
    const range = 2.5;
    const speed = 2;

    useFrame((_, delta) => {
        if (!body.current) return;

        if (useGameStore.getState().gameState === 'EDITOR') {
            body.current.setTranslation(new THREE.Vector3(...position), true);
            body.current.setLinvel({ x: 0, y: 0, z: 0 }, true);
            return;
        }

        if (!isPlaying) return;

        const currentPos = body.current.translation();

        // Reverse direction if out of range (fallback)
        if (currentPos.x > startX + 15 && direction.current === 1) direction.current = -1;
        if (currentPos.x < startX - 15 && direction.current === -1) direction.current = 1;

        // Raycast to detect obstacles
        const rayOrigin = new THREE.Vector3(currentPos.x + (direction.current * 1.1), currentPos.y, currentPos.z);
        const rayDirection = new THREE.Vector3(direction.current, 0, 0);
        const ray = new rapier.Ray(rayOrigin, rayDirection);
        const hit = world.castRay(ray, 0.2, true); // Ray length 0.2

        if (hit && hit.collider) {
            const hitObj = hit.collider.parent();
            // Ignore player and collectables
            const hitUserData = hitObj?.userData as any;
            if (hitUserData?.name !== 'player' && hitUserData?.isPlayer !== true) {
                const now = performance.now();
                if (now - lastFlipTime.current > 200) {
                    direction.current *= -1;
                    lastFlipTime.current = now;
                }
            }
        }

        body.current.setLinvel({ x: speed * direction.current, y: 0, z: 0 }, true);
    });

    return (
        <RigidBody
            ref={body}
            type="kinematicVelocity"
            position={position}
            friction={2.0}
            lockRotations
            name="platform"
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
