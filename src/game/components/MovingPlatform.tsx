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

    // Pre-allocated objects for ray casting (reused every frame)
    const rayRef = useRef<any>(null);
    const rayOriginVec = useRef(new THREE.Vector3());
    const rayDirVec = useRef(new THREE.Vector3());
    const tempVec = useRef(new THREE.Vector3());

    useFrame((_, delta) => {
        if (!body.current) return;

        if (useGameStore.getState().gameState === 'EDITOR') {
            tempVec.current.set(...position);
            body.current.setTranslation(tempVec.current, true);
            body.current.setLinvel({ x: 0, y: 0, z: 0 }, true);
            return;
        }

        if (!isPlaying) return;

        const currentPos = body.current.translation();

        // Reverse direction if out of range (fallback)
        if (currentPos.x > startX + 15 && direction.current === 1) direction.current = -1;
        if (currentPos.x < startX - 15 && direction.current === -1) direction.current = 1;

        // Raycast to detect obstacles — reuse objects to avoid per-frame allocation
        rayOriginVec.current.set(currentPos.x + (direction.current * 1.1), currentPos.y, currentPos.z);
        rayDirVec.current.set(direction.current, 0, 0);
        if (!rayRef.current) rayRef.current = new rapier.Ray(rayOriginVec.current, rayDirVec.current);
        else { rayRef.current.origin = rayOriginVec.current; rayRef.current.dir = rayDirVec.current; }
        const hit = world.castRay(rayRef.current, 0.2, true);

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
                {/* Both variants always mounted — toggle visibility */}
                <group visible={dimension === '2D'}>
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
                </group>
                <group visible={dimension === '3D'}>
                    <mesh position={[0, 0, 0]}>
                        <boxGeometry args={[2, 0.5, 1]} />
                        <meshStandardMaterial color="#888888" metalness={0.5} roughness={0.5} />
                    </mesh>
                </group>
            </group>
        </RigidBody>
    );
}
