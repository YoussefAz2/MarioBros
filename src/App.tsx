import { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { Physics } from '@react-three/rapier';
import { KeyboardControls } from '@react-three/drei';
import * as THREE from 'three';
import Level1 from './game/levels/Level1';
import HUD from './ui/HUD';
import { useGameStore } from './store/useGameStore';
import { isWebGLAvailable, WebGLUnavailableScreen, CanvasErrorBoundary } from './ui/WebGLCheck';

const keyboardMap = [
  { name: 'forward', keys: ['ArrowUp', 'KeyW'] },
  { name: 'backward', keys: ['ArrowDown', 'KeyS'] },
  { name: 'left', keys: ['ArrowLeft', 'KeyA'] },
  { name: 'right', keys: ['ArrowRight', 'KeyD'] },
  { name: 'jump', keys: ['Space'] },
  { name: 'down', keys: ['ShiftLeft', 'ShiftRight'] },
  { name: 'rotateLeft', keys: ['KeyQ'] },
  { name: 'rotateRight', keys: ['KeyE'] },
];

export default function App() {
  const gameState = useGameStore(s => s.gameState);
  const dimension = useGameStore(s => s.dimension);
  const isPaused = gameState === 'PAUSE' || gameState === 'MENU' || gameState === 'WIN' || gameState === 'MARKETPLACE';

  // Check WebGL support before attempting to render Three.js
  if (!isWebGLAvailable()) {
    return <WebGLUnavailableScreen />;
  }

  return (
    <div
      className="w-full h-screen bg-[#0b001a] overflow-hidden relative"
      onContextMenu={(e) => e.preventDefault()}
    >
      <HUD />

      <KeyboardControls map={keyboardMap}>
        <CanvasErrorBoundary fallback={<WebGLUnavailableScreen />}>
          <Canvas shadows camera={{ position: [0, 5, 15], fov: 50, near: 0.1, far: 5000 }} gl={{ preserveDrawingBuffer: true, failIfMajorPerformanceCaveat: false }}>
            {dimension === '2D' && <color attach="background" args={['#0b001a']} />}
            {dimension === '2D' ? (
              <fog attach="fog" args={['#0b001a', 15, 60]} />
            ) : (
              <fog attach="fog" args={['#1a0e2d', 30, 100]} />
            )}
            <ambientLight intensity={0.2} />
            <directionalLight
              position={[100, 20, 100]}
              castShadow
              intensity={0.6}
              shadow-mapSize={[2048, 2048]}
            >
              <orthographicCamera attach="shadow-camera" args={[-30, 30, 30, -30, 0.1, 100]} />
            </directionalLight>

            <Suspense fallback={null}>
              <Physics gravity={[0, -50, 0]} paused={isPaused}>
                <Level1 />
              </Physics>
            </Suspense>

          </Canvas>

          {/* Filtre CSS CRT ultra-léger pour le mode 2D sans crasher r3f */}
          {dimension === '2D' && (
            <div
              className="absolute inset-0 pointer-events-none mix-blend-overlay opacity-30 z-10"
              style={{
                background: 'linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%), linear-gradient(90deg, rgba(255, 0, 0, 0.06), rgba(0, 255, 0, 0.02), rgba(0, 0, 255, 0.06))',
                backgroundSize: '100% 4px, 6px 100%'
              }}
            />
          )}
        </CanvasErrorBoundary>
      </KeyboardControls>
    </div>
  );
}
