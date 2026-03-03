import { useRef, useMemo } from 'react';
import { useGameStore } from '../../store/useGameStore';
import * as THREE from 'three';

export default function Lamp({ id, position }: { id?: string; position: [number, number, number] }) {
    const dimension = useGameStore(s => s.dimension);

    // Gradient radial pour le halo 2D
    const canvas = useMemo(() => {
        const c = document.createElement('canvas');
        c.width = 128;
        c.height = 128;
        const ctx = c.getContext('2d');
        if (ctx) {
            const gradient = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
            gradient.addColorStop(0, 'rgba(255, 200, 50, 0.8)');
            gradient.addColorStop(0.5, 'rgba(255, 150, 0, 0.3)');
            gradient.addColorStop(1, 'rgba(255, 100, 0, 0)');
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, 128, 128);
        }
        return new THREE.CanvasTexture(c);
    }, []);

    // Sprite Pixel Art manuel de lanterne
    const lampTexture = useMemo(() => {
        const c = document.createElement('canvas');
        c.width = 32;
        c.height = 32;
        const ctx = c.getContext('2d');
        if (ctx) {
            // Poteau en bois
            ctx.fillStyle = "#5c4033";
            ctx.fillRect(12, 16, 8, 16);

            // Base de la lanterne
            ctx.fillStyle = "#222222";
            ctx.fillRect(8, 14, 16, 4);

            // Verre lumineux
            ctx.fillStyle = "#ffdd44";
            ctx.fillRect(10, 6, 12, 8);

            // Chapeau de la lanterne
            ctx.fillStyle = "#222222";
            ctx.fillRect(8, 2, 16, 4);
            ctx.fillRect(12, 0, 8, 2);
        }
        const tex = new THREE.CanvasTexture(c);
        tex.magFilter = THREE.NearestFilter;
        return tex;
    }, []);

    return (
        <group position={position}>
            {dimension === '3D' ? (
                // Rendu 3D : Modèle de torche/lampe + PointLight
                <group>
                    {/* Poteau */}
                    <mesh position={[0, -0.2, 0]}>
                        <cylinderGeometry args={[0.1, 0.1, 0.6]} />
                        <meshStandardMaterial color="#4a3b32" />
                    </mesh>
                    {/* Lanterne */}
                    <mesh position={[0, 0.2, 0]}>
                        <boxGeometry args={[0.3, 0.3, 0.3]} />
                        <meshStandardMaterial color="#2d2d2d" />
                    </mesh>
                    {/* Cœur lumineux */}
                    <mesh position={[0, 0.2, 0]}>
                        <sphereGeometry args={[0.12]} />
                        <meshBasicMaterial color="#ffcc00" />
                    </mesh>

                    {/* Vraie Lumière Dynamique pour la 3D */}
                    <pointLight position={[0, 0.2, 0]} color="#ffaa00" intensity={5} distance={10} decay={2} castShadow />
                </group>
            ) : (
                // Rendu 2D : Sprite/Pixel + Halo Additif pour simuler l'éclairage de nuit
                <group>
                    {/* Sprite Pixel Art de la Torche */}
                    <mesh position={[0, 0, 0]}>
                        <planeGeometry args={[1, 1]} />
                        <meshBasicMaterial map={lampTexture} transparent opacity={1} />
                    </mesh>

                    {/* Halo lumineux (Fake 2D Light) Additive */}
                    <mesh position={[0, 0, -0.5]}>
                        <planeGeometry args={[10, 10]} />
                        <meshBasicMaterial
                            map={canvas}
                            transparent
                            depthWrite={false}
                            blending={THREE.AdditiveBlending}
                        />
                    </mesh>
                </group>
            )}
        </group>
    );
}
