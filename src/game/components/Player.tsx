import { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { RigidBody, RapierRigidBody, CapsuleCollider, useRapier } from '@react-three/rapier';
import { useKeyboardControls } from '@react-three/drei';
import { useGameStore } from '../../store/useGameStore';
import * as THREE from 'three';
import MarioSprite2D from './MarioSprite2D';
import Mario3D from './Mario3D';
import { playJump, playDie } from '../../utils/audio';

// Global ref to avoid React state updates on every frame for the camera
export const playerPosRef = { current: new THREE.Vector3(0, 0, 0) };

export default function Player() {
  const body = useRef<RapierRigidBody>(null);
  const [, get] = useKeyboardControls();
  const dimension = useGameStore(s => s.dimension);
  const gameState = useGameStore(s => s.gameState);
  const isTransitioning = useGameStore(s => s.isTransitioning);
  const resetKey = useGameStore(s => s.resetKey);
  const { rapier, world } = useRapier();

  const isWalking = useRef(false);
  const facingRight = useRef(true);
  const velocityX = useRef(0);
  const velocityZ = useRef(0);
  const canJump = useRef(true);

  // Reset player position when level restarts
  useEffect(() => {
    if (body.current) {
      const state = useGameStore.getState();
      const spawnBlocks = state.blocks.filter(b => b.type === 'spawn');
      const spawnBlock = spawnBlocks.length > 0 ? spawnBlocks[spawnBlocks.length - 1] : null;

      const spawnX = spawnBlock ? spawnBlock.position[0] : 0;
      const spawnY = spawnBlock ? spawnBlock.position[1] + 2 : 5; // Hauteur relative au bloc de spawn
      const spawnZ = spawnBlock ? spawnBlock.position[2] : 0;

      body.current.setTranslation({ x: spawnX, y: spawnY, z: spawnZ }, true);
      body.current.setLinvel({ x: 0, y: 0, z: 0 }, true);
    }
  }, [resetKey]);

  useFrame(() => {
    if (!body.current) return;

    if (gameState !== 'PLAYING') {
      body.current.setLinvel({ x: 0, y: 0, z: 0 }, true);
      return;
    }

    const linvel = body.current.linvel();
    const pos = body.current.translation();

    // Handle falling off the map
    if (pos.y < -20) {
      playDie();
      useGameStore.getState().resetLevel(); // Assuming handleDeath() is resetLevel()
      return;
    }

    if (isTransitioning) {
      body.current.setLinvel({ x: 0, y: linvel.y, z: 0 }, true);
      return;
    }

    const { forward, backward, left, right, jump } = get();

    const maxSpeed = 7;
    const accel = 1.5;
    const friction = 0.8;

    let targetX = linvel.x;
    let targetZ = linvel.z;

    // Horizontal movement
    if (left) targetX -= accel;
    if (right) targetX += accel;
    if (!left && !right) targetX *= friction;

    // Depth movement (only in 3D)
    if (dimension === '3D') {
      if (forward) targetZ -= accel;
      if (backward) targetZ += accel;
      if (!forward && !backward) targetZ *= friction;
    } else {
      targetZ = 0; // Lock Z velocity in 2D

      // Snap position back to Z=0 if it drifted
      if (Math.abs(pos.z) > 0.05) {
        body.current.setTranslation({ x: pos.x, y: pos.y, z: 0 }, true);
      }
    }

    // Clamp speeds
    targetX = THREE.MathUtils.clamp(targetX, -maxSpeed, maxSpeed);
    targetZ = THREE.MathUtils.clamp(targetZ, -maxSpeed, maxSpeed);

    // Robust Grounded Check using Raycast (Ignorer les sensors comme le Rift)
    const rayOrigin = { x: pos.x, y: pos.y - 0.61, z: pos.z };
    const rayDir = { x: 0, y: -1, z: 0 };
    const ray = new rapier.Ray(rayOrigin, rayDir);
    // Le 3eme argument true = `solid`, le callback filter permet d'ignorer les colliders "sensor"
    const hit = world.castRay(ray, 0.1, true, undefined, undefined, undefined, undefined, (collider) => !collider.isSensor());
    const isGrounded = hit != null;

    // Jump Logic (Adjusted jump height to 14.3)
    if (jump && isGrounded && canJump.current) {
      playJump();
      body.current.setLinvel({ x: targetX, y: 14.3, z: targetZ }, true);
      canJump.current = false;
    } else {
      body.current.setLinvel({ x: targetX, y: linvel.y, z: targetZ }, true);
      // Variable jump height: pull down if space released early
      if (!jump && linvel.y > 0) {
        body.current.applyImpulse({ x: 0, y: -1.0, z: 0 }, true);
      }
    }

    // Reset jump lock when touching ground after letting go of jump key
    if (!jump && isGrounded) {
      canJump.current = true;
    }

    // Update global ref for camera
    playerPosRef.current.copy(body.current.translation());

    // Update animation refs
    if (targetX > 0.1) facingRight.current = true;
    if (targetX < -0.1) facingRight.current = false;
    isWalking.current = Math.abs(targetX) > 0.1 || Math.abs(targetZ) > 0.1;
    velocityX.current = targetX;
    velocityZ.current = targetZ;
  });

  const handlePlayerCollision = (e: any) => {
    if (gameState !== 'PLAYING') return;

    // Check if the collided object is an enemy
    const isEnemy = e.other.rigidBodyObject?.name === 'enemy' || e.other.rigidBodyObject?.userData?.isEnemy;
    if (isEnemy) {
      const enemyY = e.other.rigidBody?.translation()?.y ?? e.other.rigidBodyObject?.position.y ?? 0;
      const playerY = body.current?.translation().y ?? 0;

      const enemyZ = e.other.rigidBody?.translation()?.z ?? e.other.rigidBodyObject?.position.z ?? 0;
      const playerZ = body.current?.translation().z ?? 0;

      if (useGameStore.getState().dimension === '3D' && Math.abs(playerZ - enemyZ) > 0.45) {
        return; // Ignore si le joueur n'est pas sur la même ligne de profondeur
      }

      // If player hit the enemy from the side or below, the player dies
      // If from above, the Enemy's onCollisionEnter will handle its own death
      if (playerY <= enemyY + 0.4) {
        console.log('Player killed by Goomba! Resetting level...');
        useGameStore.getState().resetLevel();
      }
    }
  };

  return (
    <RigidBody
      ref={body}
      name="player"
      userData={{ isPlayer: true }}
      colliders={false}
      mass={1}
      type="dynamic"
      lockRotations
      position={[0, 5, 0]}
      friction={0}
      restitution={0}
      gravityScale={gameState === 'PLAYING' ? 1 : 0}
      onCollisionEnter={handlePlayerCollision}
    >
      <CapsuleCollider args={[0.3, 0.3]} position={[0, 0, 0]} />
      <group position={[0, -0.1, 0]}>
        {dimension === '2D' ? (
          <MarioSprite2D facingRight={facingRight} walking={isWalking} />
        ) : (
          <Mario3D walking={isWalking} facingRight={facingRight} velocityX={velocityX} velocityZ={velocityZ} />
        )}
      </group>
    </RigidBody>
  );
}
