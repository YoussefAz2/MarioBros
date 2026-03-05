import { useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { RigidBody, RapierRigidBody, CapsuleCollider, useRapier } from '@react-three/rapier';
import { useGameStore } from '../../store/useGameStore';
import Sprite2D from './Sprite2D';
import Goomba3D from './Goomba3D';
import { GOOMBA_MATRIX, GOOMBA_PALETTE } from '../../utils/assets';
import { playStomp } from '../../utils/audio';
import * as THREE from 'three';
import { playerPosRef } from './Player';

export default function Enemy({ id, position }: { id?: string, position: [number, number, number] }) {
  const body = useRef<RapierRigidBody>(null);
  const [dead, setDead] = useState(false);
  const dimension = useGameStore(s => s.dimension);
  const gameState = useGameStore(s => s.gameState);
  const removeBlock = useGameStore(s => s.removeBlock);
  const resetKey = useGameStore(s => s.resetKey);
  const { rapier, world } = useRapier();

  const dirRef = useRef(-1); // -1 = left, 1 = right
  const isWalking = useRef(false);
  const facingRight = useRef(false);
  const stuckTimer = useRef(0);
  const lastX = useRef(position[0]);
  const squashScale = useRef(1);

  useEffect(() => {
    if (!body.current) return;
    body.current.setTranslation(new THREE.Vector3(...position), true);
    body.current.setLinvel({ x: 0, y: 0, z: 0 }, true);
    dirRef.current = -1;
    lastX.current = position[0];
    stuckTimer.current = 0;
    setDead(false);
  }, [resetKey]);

  useFrame((_, delta) => {
    if (!body.current) return;
    if (dead) {
      body.current?.setLinvel({ x: 0, y: 0, z: 0 }, true);
      return;
    }

    const isPlaying = gameState === 'PLAYING';

    if (gameState === 'EDITOR') {
      body.current.setGravityScale(0, false);
      body.current.setLinvel({ x: 0, y: 0, z: 0 }, true);
      body.current.setTranslation(new THREE.Vector3(...position), true);
      return;
    }

    body.current.setGravityScale(isPlaying ? 1 : 0, false);
    if (!isPlaying) return;

    const linvel = body.current.linvel();
    const pos = body.current.translation();

    if (pos.y < -10) {
      useGameStore.getState().resetLevel();
      return;
    }

    // Optimization & Gameplay: Only move if player is nearby (within 15 blocks)
    const distToPlayerX = Math.abs(pos.x - playerPosRef.current.x);
    if (distToPlayerX > 15) {
      body.current.setLinvel({ x: 0, y: linvel.y, z: 0 }, true);
      isWalking.current = false;
      return;
    }

    // ── WALL DETECTION via RAYCAST ──
    // Cast a short ray in the walking direction to detect walls
    const rayOrigin = { x: pos.x, y: pos.y, z: pos.z };
    const rayDir = { x: dirRef.current, y: 0, z: 0 };
    const ray = new rapier.Ray(rayOrigin, rayDir);
    const hit = world.castRay(ray, 0.55, true, undefined, undefined, undefined, body.current);

    if (hit != null) {
      // Check if the raycast hit the player
      // @ts-ignore - toi exists on RayColliderHit at runtime
      const hitX = pos.x + dirRef.current * hit.toi;
      const distToPlayerX = Math.abs(hitX - playerPosRef.current.x);
      const distToPlayerY = Math.abs(pos.y - playerPosRef.current.y);
      const distCenterToPlayer = Math.abs(pos.x - playerPosRef.current.x);

      // If the hit point or the Goomba center is very close to the player horizontally and vertically,
      // it means the raycast hit the player, not a wall. We want to collide with the player.
      if ((distToPlayerX < 1.2 || distCenterToPlayer < 1.5) && distToPlayerY < 2.0) {
        // It's the player, don't reverse!
      } else {
        // Wall detected — reverse
        dirRef.current *= -1;
      }
    }

    // ── STUCK DETECTION (fallback) ──
    // If the Goomba hasn't moved despite trying, reverse it (unless blocked by the player)
    const dx = Math.abs(pos.x - lastX.current);
    if (dx < 0.01) {
      stuckTimer.current += delta;
      if (stuckTimer.current > 0.3) {
        const isBlockedByPlayer = Math.abs(pos.x - playerPosRef.current.x) < 1.5 && Math.abs(pos.y - playerPosRef.current.y) < 2.0;
        if (!isBlockedByPlayer) {
          dirRef.current *= -1;
        }
        stuckTimer.current = 0;
      }
    } else {
      stuckTimer.current = 0;
    }
    lastX.current = pos.x;

    // Apply movement
    const speed = 3;
    body.current.setLinvel({ x: speed * dirRef.current, y: linvel.y, z: 0 }, true);
    isWalking.current = true;
    facingRight.current = dirRef.current === 1;

    if (dimension === '2D' && Math.abs(pos.z) > 0.05) {
      body.current.setTranslation({ x: pos.x, y: pos.y, z: 0 }, true);
    }
  });

  const handleCollision = (e: any) => {
    if (dead || gameState !== 'PLAYING') return;

    // Identify the player by checking if the hit object's Rapier translation is very close to the player's tracked position
    // (since @react-three/rapier seems to lose the name and userData props on the rigidBodyObject at runtime)
    const t = e.other.rigidBody?.translation();
    const hitObjX = t?.x ?? 0;
    const hitObjY = t?.y ?? 0;
    const hitObjZ = t?.z ?? e.other.rigidBodyObject?.position?.z ?? 0;
    const enemyZ = body.current?.translation().z ?? 0;

    // Ignore collisions occurring across different Z-depth lines in 3D
    if (useGameStore.getState().dimension === '3D' && Math.abs(hitObjZ - enemyZ) > 0.45) {
      return;
    }

    const isPlayer = e.other.rigidBodyObject?.name === 'player' || e.other.rigidBodyObject?.userData?.isPlayer;

    if (isPlayer) {
      const playerY = t?.y ?? hitObjY;
      const enemyY = body.current?.translation().y ?? 0;
      console.log('Player Y:', playerY, 'Enemy Y:', enemyY);

      if (playerY > enemyY + 0.4) {
        playStomp();

        e.other.rigidBody?.setLinvel(
          { x: e.other.rigidBody.linvel().x, y: 12, z: e.other.rigidBody.linvel().z },
          true
        );
        if (id) removeBlock(id);
      } else {
        console.log('Player hit from side! Resetting level...');
        useGameStore.getState().resetLevel();
      }
    }
  };


  return (
    <RigidBody
      ref={body}
      name="enemy"
      userData={{ isEnemy: true }}
      type="dynamic"
      colliders={false}
      lockRotations
      position={position}
      friction={0}
      restitution={0}
      canSleep={false}
      gravityScale={0}
      onCollisionEnter={handleCollision}
    >
      <CapsuleCollider args={[0.2, dead ? 0.05 : 0.3]} />
      <group position={[0, -0.1, 0]} scale={[1, squashScale.current, 1]}>
        {dimension === '2D' ? (
          <Sprite2D matrix={GOOMBA_MATRIX} palette={GOOMBA_PALETTE} facingRight={facingRight} />
        ) : (
          <Goomba3D walking={isWalking} facingRight={facingRight} />
        )}
      </group>
    </RigidBody>
  );
}
