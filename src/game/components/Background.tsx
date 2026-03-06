import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGameStore } from '../../store/useGameStore';
import { Points, Stars } from '@react-three/drei';
import * as THREE from 'three';

const MarioCloud = ({ position, scale = 1, speed = 1 }: { position: [number, number, number], scale?: number, speed?: number }) => {
    const cloudRef = useRef<THREE.Group>(null);
    useFrame((state, delta) => {
        if (cloudRef.current) {
            cloudRef.current.position.x += speed * delta;
            // Boucler le nuage s'il va trop loin
            if (cloudRef.current.position.x > 80) cloudRef.current.position.x = -80;
            if (cloudRef.current.position.x < -80) cloudRef.current.position.x = 80;
        }
    });

    return (
        <group ref={cloudRef} position={position} scale={[scale, scale, scale]}>
            <mesh position={[0, 0, 0]}>
                <boxGeometry args={[4, 2, 1]} />
                <meshBasicMaterial color="#a0a0b0" transparent opacity={0.8} />
            </mesh>
            <mesh position={[-2, -0.5, 0]}>
                <boxGeometry args={[3, 1, 1.1]} />
                <meshBasicMaterial color="#8a8a9a" transparent opacity={0.8} />
            </mesh>
            <mesh position={[2, -0.5, 0]}>
                <boxGeometry args={[3, 1, 1.1]} />
                <meshBasicMaterial color="#8a8a9a" transparent opacity={0.8} />
            </mesh>
        </group>
    );
};

function GradientSky3D() {
    const uniforms = useMemo(() => ({
        topColor: { value: new THREE.Color('#05020d') }, // Bleu nuit très sombre
        bottomColor: { value: new THREE.Color('#2d1b4e') } // Violet nocturne à l'horizon
    }), []);

    return (
        <group>
            {/* Étoiles Premium du ciel 3D */}
            <Stars radius={100} depth={50} count={1500} factor={4} saturation={0} fade speed={2} />

            {/* Dôme du ciel avec shader de dégradé vertical */}
            <mesh>
                <sphereGeometry args={[500, 16, 16]} />
                <shaderMaterial
                    side={THREE.BackSide}
                    uniforms={uniforms}
                    vertexShader={`
                        varying vec3 vWorldPosition;
                        void main() {
                            vec4 worldPosition = modelMatrix * vec4(position, 1.0);
                            vWorldPosition = worldPosition.xyz;
                            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                        }
                    `}
                    fragmentShader={`
                        uniform vec3 topColor;
                        uniform vec3 bottomColor;
                        varying vec3 vWorldPosition;
                        void main() {
                            float h = normalize(vWorldPosition).y;
                            float factor = smoothstep(-0.4, 0.2, h); // Interpolation ciblée sur l'horizon, abaissé pour la caméra plongeante
                            gl_FragColor = vec4(mix(bottomColor, topColor, factor), 1.0);
                        }
                    `}
                />
            </mesh>

            {/* Nuages cubiques flottants, abaissés pour compenser l'angle de caméra */}
            <MarioCloud position={[-30, 0, -40]} scale={1.5} speed={0.5} />
            <MarioCloud position={[20, 5, -50]} scale={2} speed={0.3} />
            <MarioCloud position={[40, -5, -30]} scale={1.2} speed={0.7} />
            <MarioCloud position={[-60, 2, -60]} scale={2.5} speed={0.4} />
        </group>
    );
}

export default function Background() {
    const dimension = useGameStore(s => s.dimension);
    const parallaxRef = useRef<THREE.Group>(null);
    const starsRef = useRef<THREE.Points>(null);

    useFrame((state, delta) => {
        if (parallaxRef.current && dimension === '2D') {
            parallaxRef.current.position.x = state.camera.position.x * 0.95;

            // Animer lentement les points
            if (starsRef.current) {
                starsRef.current.rotation.y -= delta * 0.02;
                starsRef.current.rotation.x -= delta * 0.01;
            }
        }
    });

    // Generer des etoiles seulement une fois
    const starPositions = useMemo(() => {
        const points = new Float32Array(3000);
        for (let i = 0; i < 3000; i++) {
            points[i] = (Math.random() - 0.5) * 100;
        }
        return points;
    }, []);

    return (
        <group>
            {dimension === '3D' ? (
                <GradientSky3D />
            ) : (
                <group ref={parallaxRef} position={[0, 0, -20]}>
                    <Points ref={starsRef} positions={starPositions}>
                        <pointsMaterial size={1.0} color="#ffffff" transparent opacity={1} sizeAttenuation />
                    </Points>

                    {/* Ajout d'une nebuleuse de fond pour plus de profondeur de couleur */}
                    <mesh position={[0, 0, -30]}>
                        <planeGeometry args={[200, 100]} />
                        <meshBasicMaterial color="#0b001a" transparent opacity={0.9} />
                    </mesh>
                </group>
            )}
        </group>
    );
}
