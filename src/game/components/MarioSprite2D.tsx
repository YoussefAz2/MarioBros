import { useRef, useMemo } from 'react';
import { useFrame, useLoader } from '@react-three/fiber';
import * as THREE from 'three';

interface MarioSprite2DProps {
    facingRight: React.MutableRefObject<boolean>;
    walking: React.MutableRefObject<boolean>;
}
import { assetPath } from '../../utils/assetPath';

const TOTAL_FRAMES = 5;
const FRAME_RATE = 10;

// Paths to individually pre-split frame images
const FRAME_PATHS = [
    assetPath('/sprites/mario-1.png'),
    assetPath('/sprites/mario-2.png'),
    assetPath('/sprites/mario-3.png'),
    assetPath('/sprites/mario-4.png'),
    assetPath('/sprites/mario-5.png'),
];

export default function MarioSprite2D({ facingRight, walking }: MarioSprite2DProps) {
    const meshRef = useRef<THREE.Mesh>(null);
    const materialRef = useRef<THREE.MeshStandardMaterial>(null);
    const frameRef = useRef(0);
    const timeAccum = useRef(0);

    // Load all 5 frame textures individually
    const textures = useLoader(THREE.TextureLoader, FRAME_PATHS);

    // Configure all textures for pixel art
    useMemo(() => {
        textures.forEach(tex => {
            tex.magFilter = THREE.NearestFilter;
            tex.minFilter = THREE.NearestFilter;
            tex.colorSpace = THREE.SRGBColorSpace;
        });
    }, [textures]);

    useFrame((_, delta) => {
        if (!meshRef.current || !materialRef.current) return;

        const targetScaleX = facingRight.current ? 1 : -1;
        meshRef.current.scale.x = THREE.MathUtils.lerp(meshRef.current.scale.x, targetScaleX, 0.5);

        if (walking.current) {
            timeAccum.current += delta;
            if (timeAccum.current >= 1 / FRAME_RATE) {
                timeAccum.current = 0;
                frameRef.current = (frameRef.current + 1) % TOTAL_FRAMES;
                materialRef.current.map = textures[frameRef.current];
                materialRef.current.needsUpdate = true;
            }
        } else {
            if (frameRef.current !== 0) {
                frameRef.current = 0;
                materialRef.current.map = textures[0];
                materialRef.current.needsUpdate = true;
            }
            timeAccum.current = 0;
        }
    });

    // Each frame: 100x175
    const spriteHeight = 1.0;
    const spriteWidth = (100 / 175) * spriteHeight;

    return (
        <mesh ref={meshRef}>
            <planeGeometry args={[spriteWidth, spriteHeight]} />
            <meshStandardMaterial
                ref={materialRef}
                map={textures[0]}
                transparent
                alphaTest={0.5}
                side={THREE.DoubleSide}
            />
        </mesh>
    );
}
