import { useFrame, useThree } from '@react-three/fiber';
import { useKeyboardControls, OrbitControls } from '@react-three/drei';
import { useGameStore } from '../../store/useGameStore';
import { playerPosRef } from '../components/Player';
import * as THREE from 'three';
import { useEffect, useRef, useState } from 'react';

export default function CameraController() {
  const dimension = useGameStore(s => s.dimension);
  const gameState = useGameStore(s => s.gameState);
  const isTransitioning = useGameStore(s => s.isTransitioning);
  const selectedBlockType = useGameStore(s => s.selectedBlockType);
  const { set, size, camera } = useThree();
  const [, get] = useKeyboardControls();

  const orthoCamera = useRef(new THREE.OrthographicCamera(-10, 10, 10, -10, 0.1, 1000));
  const perspCamera = useRef(new THREE.PerspectiveCamera(50, size.width / size.height, 0.1, 1000));

  const lookAtTarget = useRef(new THREE.Vector3(0, 0, 0));
  const currentPos = useRef(new THREE.Vector3(0, 5, 15));
  const transitionSpin = useRef(0);
  const prevGameState = useRef(gameState);
  const orbitControlsRef = useRef<any>(null);
  const [isAltDown, setIsAltDown] = useState(false);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => { if (e.key === 'Alt') setIsAltDown(true); };
    const onKeyUp = (e: KeyboardEvent) => { if (e.key === 'Alt') setIsAltDown(false); };
    const onBlur = () => setIsAltDown(false);

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', onBlur);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', onBlur);
    };
  }, []);

  // Handle window resize for cameras
  useEffect(() => {
    const aspect = size.width / size.height;
    const viewSize = 14; // How many units tall the screen is in 2D

    orthoCamera.current.left = -viewSize * aspect / 2;
    orthoCamera.current.right = viewSize * aspect / 2;
    orthoCamera.current.top = viewSize / 2;
    orthoCamera.current.bottom = -viewSize / 2;
    orthoCamera.current.updateProjectionMatrix();

    perspCamera.current.aspect = aspect;
    perspCamera.current.updateProjectionMatrix();
  }, [size]);

  // Switch active camera when dimension changes or game state changes
  useEffect(() => {
    if (dimension === '2D' && gameState !== 'MENU' && gameState !== 'EDITOR') {
      set({ camera: orthoCamera.current });
    } else {
      set({ camera: perspCamera.current });
    }
  }, [dimension, gameState, set]);

  // Handle transitions between EDITOR and PLAYING
  useEffect(() => {
    if (gameState === 'EDITOR' && prevGameState.current !== 'EDITOR') {
      if (orbitControlsRef.current) {
        const p = playerPosRef.current;
        orbitControlsRef.current.target.set(p.x, p.y, p.z);
        camera.position.set(p.x, p.y + 15, p.z + 25);
        orbitControlsRef.current.update();
      }
    } else if (gameState !== 'EDITOR' && prevGameState.current === 'EDITOR') {
      currentPos.current.copy(camera.position);
      if (orbitControlsRef.current) {
        lookAtTarget.current.copy(orbitControlsRef.current.target);
      }
    }
    prevGameState.current = gameState;
  }, [gameState, camera]);

  useFrame((state, delta) => {
    // Menu Camera Spin
    if (gameState === 'MENU') {
      const t = state.clock.elapsedTime * 0.2;
      const radius = 25;
      perspCamera.current.position.set(Math.cos(t) * radius + 40, 10, Math.sin(t) * radius);
      perspCamera.current.lookAt(40, 2, 0);
      perspCamera.current.updateProjectionMatrix();
      return;
    }

    // In EDITOR mode, OrbitControls is the single source of truth for the camera.
    // We just apply WASD movement to its target to allow panning.
    if (gameState === 'EDITOR') {
      if (orbitControlsRef.current) {
        const { forward, backward, left, right, jump, down } = get() as any;
        const speed = 20 * delta;

        const forwardDir = new THREE.Vector3();
        camera.getWorldDirection(forwardDir);
        forwardDir.y = 0;
        forwardDir.normalize();

        const rightDir = new THREE.Vector3().crossVectors(forwardDir, new THREE.Vector3(0, 1, 0)).normalize();

        const move = new THREE.Vector3();
        if (forward) move.add(forwardDir.clone().multiplyScalar(speed));
        if (backward) move.add(forwardDir.clone().multiplyScalar(-speed));
        if (left) move.add(rightDir.clone().multiplyScalar(-speed));
        if (right) move.add(rightDir.clone().multiplyScalar(speed));
        if (jump) move.y += speed;
        if (down) move.y -= speed;

        if (move.lengthSq() > 0) {
          orbitControlsRef.current.target.add(move);
          camera.position.add(move);
        }

        orbitControlsRef.current.update();
      }
      return; // Skip the PLAYING camera logic
    }

    // PLAYING mode logic
    const p = playerPosRef.current;
    let targetX = p.x;
    let targetY = Math.max(p.y + 2, 0); // Don't look below ground level
    let targetZ = p.z;

    // Transition Animation (Cool barrel roll / swoop / FOV warp)
    if (isTransitioning) {
      transitionSpin.current += delta * Math.PI * 6; // Spin rapidly
      perspCamera.current.fov = THREE.MathUtils.lerp(perspCamera.current.fov, 120, 0.1);
    } else {
      transitionSpin.current = THREE.MathUtils.lerp(transitionSpin.current, 0, 0.1);
      perspCamera.current.fov = THREE.MathUtils.lerp(perspCamera.current.fov, 50, 0.1);
    }
    perspCamera.current.updateProjectionMatrix();

    if (dimension === '2D') {
      // Strict 2D Orthographic tracking
      currentPos.current.lerp(new THREE.Vector3(targetX, targetY, 15), 0.1);
      lookAtTarget.current.lerp(new THREE.Vector3(targetX, targetY, 0), 0.1);

      orthoCamera.current.position.copy(currentPos.current);

      orthoCamera.current.lookAt(lookAtTarget.current);

      // Apply transition roll
      orthoCamera.current.rotation.z = Math.sin(transitionSpin.current) * 0.5;
    } else {
      // 3D Perspective tracking
      const distance = 12;
      const height = 6;

      const tPos = new THREE.Vector3(targetX, targetY + height, targetZ + distance);
      const tLookAt = new THREE.Vector3(targetX, targetY, targetZ);

      // Apply transition swoop and dimension shift shake
      if (isTransitioning) {
        tPos.y += Math.sin(transitionSpin.current) * 5;
        tPos.x += Math.cos(transitionSpin.current) * 5;
        tLookAt.x += (Math.random() - 0.5) * 2;
        tLookAt.y += (Math.random() - 0.5) * 2;
      }

      currentPos.current.lerp(tPos, 0.08);
      lookAtTarget.current.lerp(tLookAt, 0.1);

      perspCamera.current.position.copy(currentPos.current);

      perspCamera.current.lookAt(lookAtTarget.current);

      // Apply transition roll
      perspCamera.current.rotation.z = Math.sin(transitionSpin.current) * 0.5;
    }
  });

  return gameState === 'EDITOR' ? (
    <OrbitControls
      ref={orbitControlsRef}
      camera={camera}
      enableDamping
      dampingFactor={0.05}
      enabled={true}
      enableRotate={true}
      enableZoom={!isAltDown}
      enablePan={true}
      mouseButtons={{
        LEFT: undefined as unknown as THREE.MOUSE,
        MIDDLE: THREE.MOUSE.PAN,
        RIGHT: THREE.MOUSE.ROTATE
      }}
    />
  ) : null;
}
