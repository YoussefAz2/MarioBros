import { useRef, useEffect, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGameStore, BlockType } from '../../store/useGameStore';
import * as THREE from 'three';
import { createBrickTexture, createQuestionTexture } from '../../utils/textures';

export default function EditorCursor() {
  const meshRef = useRef<THREE.Mesh>(null);
  const instancedMeshRef = useRef<THREE.InstancedMesh>(null);
  const previewMeshRef = useRef<THREE.Mesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  const brickTex = useMemo(() => createBrickTexture(), []);
  const questionTex = useMemo(() => createQuestionTexture(), []);

  // Pre-create all preview materials ONCE (outside useFrame!) to avoid per-frame allocation glitch
  const previewMaterials = useMemo<Record<string, THREE.MeshStandardMaterial>>(() => ({
    ground: new THREE.MeshStandardMaterial({ map: brickTex, color: '#c84c0c', transparent: true, opacity: 0.7 }),
    question: new THREE.MeshStandardMaterial({ map: questionTex, transparent: true, opacity: 0.7 }),
    goomba: new THREE.MeshStandardMaterial({ color: '#5c2c16', transparent: true, opacity: 0.7 }),
    rift: new THREE.MeshStandardMaterial({ color: '#ff00ff', transparent: true, opacity: 0.7 }),
    pushable: new THREE.MeshStandardMaterial({ color: '#0055ff', transparent: true, opacity: 0.7 }),
    coin: new THREE.MeshStandardMaterial({ color: '#ffd700', transparent: true, opacity: 0.7 }),
    flag: new THREE.MeshStandardMaterial({ color: '#00ff00', transparent: true, opacity: 0.7 }),
    spawn: new THREE.MeshStandardMaterial({ color: '#4ade80', transparent: true, opacity: 0.7 }),
    brick: new THREE.MeshStandardMaterial({ map: brickTex, transparent: true, opacity: 0.7 }),
  }), [brickTex, questionTex]);

  // Track last assigned type to avoid unnecessary material re-assignment
  const lastPreviewTypeRef = useRef<string | null>(null);

  const isDraggingRef = useRef(false);
  const dragButtonRef = useRef(-1);
  const isAltDownRef = useRef(false);

  const currentActivePosRef = useRef<THREE.Vector3>(new THREE.Vector3());
  const currentNormalRef = useRef<THREE.Vector3>(new THREE.Vector3(0, 0, 1));

  const dragStartPosRef = useRef<THREE.Vector3 | null>(null);
  const dragStartNormalRef = useRef<THREE.Vector3 | null>(null);
  const lockedDragNormalRef = useRef<THREE.Vector3 | null>(null);
  const previewBlocksRef = useRef<THREE.Vector3[]>([]);

  const geometry = useMemo(() => new THREE.BoxGeometry(1.05, 1.05, 1.05), []);
  const material = useMemo(() => new THREE.MeshBasicMaterial({ color: 0xffff00, wireframe: true, transparent: true, opacity: 0.8, depthTest: false }), []);

  useEffect(() => {
    const onPointerDown = (e: PointerEvent) => {
      if (e.target instanceof HTMLCanvasElement) {
        const state = useGameStore.getState();
        if (state.selectedBlockType === 'move' && e.button === 0) {
          if (!state.movingBlock) {
            const hoveredBlock = state.blocks.find(b =>
              b.position[0] === currentActivePosRef.current.x &&
              b.position[1] === currentActivePosRef.current.y &&
              b.position[2] === currentActivePosRef.current.z
            );
            if (hoveredBlock) {
              state.setMovingBlock(hoveredBlock);
              state.removeBlock(hoveredBlock.id);
              // Ne pas faire "return;" ici afin de déclencher "isDraggingRef" 
              // et permettre le Drag & Drop en un seul mouvement.
            }
          }
        }

        isDraggingRef.current = true;
        dragButtonRef.current = e.button;
        if (e.button === 0) {
          dragStartPosRef.current = currentActivePosRef.current.clone();
          dragStartNormalRef.current = currentNormalRef.current.clone();
        }
      }
    };

    const onPointerUp = () => {
      if (isDraggingRef.current && dragButtonRef.current === 0 && dragStartPosRef.current) {
        const state = useGameStore.getState();
        const isEraser = state.selectedBlockType === 'eraser';
        const isMove = state.selectedBlockType === 'move';

        if (isMove) {
          if (state.movingBlock) {
            state.addBlock({
              position: [currentActivePosRef.current.x, currentActivePosRef.current.y, currentActivePosRef.current.z],
              type: state.movingBlock.type
            });
            state.setMovingBlock(null);
          }
        } else if (isAltDownRef.current) {
          // Pipette logic
          const hoveredBlock = state.blocks.find(b =>
            b.position[0] === currentActivePosRef.current.x &&
            b.position[1] === currentActivePosRef.current.y &&
            b.position[2] === currentActivePosRef.current.z
          );
          if (hoveredBlock) {
            state.setSelectedBlockType(hoveredBlock.type);
          }
        } else if (isEraser) {
          // Erase logic
          const blocksToRemove = state.blocks.filter(b =>
            previewBlocksRef.current.some(p => p.x === b.position[0] && p.y === b.position[1] && p.z === b.position[2])
          );
          if (blocksToRemove.length > 0) {
            state.removeBlocks(blocksToRemove.map(b => b.id));
          }
        } else {
          // Build logic
          const newBlocks = previewBlocksRef.current.filter(p =>
            !state.blocks.some(b => b.position[0] === p.x && b.position[1] === p.y && b.position[2] === p.z)
          ).map(p => ({
            position: [p.x, p.y, p.z] as [number, number, number],
            type: state.selectedBlockType as BlockType
          }));

          if (newBlocks.length > 0) {
            state.addBlocks(newBlocks);
          }
        }
      }

      isDraggingRef.current = false;
      dragButtonRef.current = -1;
      dragStartPosRef.current = null;
      dragStartNormalRef.current = null;
      lockedDragNormalRef.current = null;
      previewBlocksRef.current = [];

      if (instancedMeshRef.current) {
        instancedMeshRef.current.count = 0;
      }
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Alt') isAltDownRef.current = true;
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Alt') isAltDownRef.current = false;
    };

    window.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, []);

  useFrame(({ pointer, camera, raycaster, scene }) => {
    const state = useGameStore.getState();
    if (state.gameState !== 'EDITOR') {
      if (meshRef.current) meshRef.current.visible = false;
      if (instancedMeshRef.current) instancedMeshRef.current.count = 0;
      return;
    }

    raycaster.setFromCamera(pointer, camera);
    const isEraser = state.selectedBlockType === 'eraser';
    const isMovePickup = state.selectedBlockType === 'move' && !state.movingBlock;
    const useErasePos = isEraser || isMovePickup || isAltDownRef.current;

    let activePos = new THREE.Vector3();
    let hitNormal = new THREE.Vector3(0, 0, 1);

    // If dragging, determine the plane dynamically based on mouse movement
    if (isDraggingRef.current && dragButtonRef.current === 0 && dragStartPosRef.current && dragStartNormalRef.current && !isAltDownRef.current) {

      let dragPlaneNormal = lockedDragNormalRef.current;

      if (!dragPlaneNormal) {
        const cameraDir = camera.getWorldDirection(new THREE.Vector3()).negate();
        const cameraPlane = new THREE.Plane().setFromNormalAndCoplanarPoint(cameraDir, dragStartPosRef.current);
        const rawIntersect = new THREE.Vector3();
        raycaster.ray.intersectPlane(cameraPlane, rawIntersect);

        if (rawIntersect) {
          const delta = rawIntersect.clone().sub(dragStartPosRef.current);
          if (delta.length() > 0.5) {
            const absX = Math.abs(delta.x);
            const absY = Math.abs(delta.y);
            const absZ = Math.abs(delta.z);

            dragPlaneNormal = new THREE.Vector3();
            if (absY > absX && absY > absZ) {
              // Vertical drag -> Wall
              if (dragStartNormalRef.current && dragStartNormalRef.current.y === 0) {
                dragPlaneNormal.copy(dragStartNormalRef.current);
              } else {
                if (Math.abs(cameraDir.z) > Math.abs(cameraDir.x)) {
                  dragPlaneNormal.set(0, 0, 1);
                } else {
                  dragPlaneNormal.set(1, 0, 0);
                }
              }
            } else {
              // Horizontal drag -> Floor
              dragPlaneNormal.set(0, 1, 0);
            }
            lockedDragNormalRef.current = dragPlaneNormal;
          } else {
            dragPlaneNormal = dragStartNormalRef.current || new THREE.Vector3(0, 1, 0);
          }
        } else {
          dragPlaneNormal = dragStartNormalRef.current || new THREE.Vector3(0, 1, 0);
        }
      }

      const orthogonalPlane = new THREE.Plane().setFromNormalAndCoplanarPoint(dragPlaneNormal, dragStartPosRef.current);
      const finalIntersect = new THREE.Vector3();
      raycaster.ray.intersectPlane(orthogonalPlane, finalIntersect);

      if (finalIntersect) {
        activePos.copy(finalIntersect);
        activePos.x = Math.round(activePos.x);
        activePos.y = Math.round(activePos.y);
        activePos.z = Math.round(activePos.z);
        hitNormal.copy(dragPlaneNormal);
      } else {
        activePos.copy(currentActivePosRef.current);
        hitNormal.copy(currentNormalRef.current);
      }
    } else {
      // Normal raycast when not dragging
      const intersects = raycaster.intersectObjects(scene.children, true);
      let buildPos = new THREE.Vector3();
      let erasePos = new THREE.Vector3();
      let found = false;

      for (const hit of intersects) {
        if (!(hit.object instanceof THREE.Mesh)) continue;
        if (hit.object === meshRef.current || hit.object === instancedMeshRef.current || hit.object === previewMeshRef.current) continue;

        if (hit.face) {
          hitNormal.copy(hit.face.normal);

          buildPos.copy(hit.point).add(hit.face.normal.clone().multiplyScalar(0.5));
          buildPos.x = Math.round(buildPos.x);
          buildPos.y = Math.round(buildPos.y);
          buildPos.z = Math.round(buildPos.z);

          erasePos.copy(hit.point).sub(hit.face.normal.clone().multiplyScalar(0.1));
          erasePos.x = Math.round(erasePos.x);
          erasePos.y = Math.round(erasePos.y);
          erasePos.z = Math.round(erasePos.z);

          found = true;
          break;
        }
      }

      if (!found) {
        // Try intersecting with the ground plane (Y=0) first to build floors
        let hitGround = raycaster.ray.intersectPlane(new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), buildPos);
        if (hitGround) {
          buildPos.x = Math.round(buildPos.x);
          buildPos.y = 0;
          buildPos.z = Math.round(buildPos.z);
          erasePos.copy(buildPos);
          hitNormal.set(0, 1, 0);
        } else {
          // Fallback to Z=0 plane if looking perfectly horizontal
          let hitWall = raycaster.ray.intersectPlane(new THREE.Plane(new THREE.Vector3(0, 0, 1), 0), buildPos);
          if (hitWall) {
            buildPos.x = Math.round(buildPos.x);
            buildPos.y = Math.round(buildPos.y);
            buildPos.z = 0;
            erasePos.copy(buildPos);
            hitNormal.set(0, 0, 1);
          }
        }
      }

      activePos = useErasePos ? erasePos : buildPos;
    }

    // --- PREVENT OVERLAPPING FOR LARGE BLOCKS (e.g. Platform 2x1x1) ---
    const isPlatform = state.selectedBlockType === 'platform' || state.movingBlock?.type === 'platform';
    if (isPlatform && !useErasePos) {
      const proposedBox = new THREE.Box3(
        new THREE.Vector3(activePos.x - 0.9, activePos.y - 0.4, activePos.z - 0.4),
        new THREE.Vector3(activePos.x + 0.9, activePos.y + 0.4, activePos.z + 0.4)
      );

      let maxAttempts = 5;
      while (maxAttempts > 0) {
        let overlapBlock = null;
        for (const block of state.blocks) {
          if (state.movingBlock && state.movingBlock.id === block.id) continue;

          const bx = block.position[0];
          const by = block.position[1];
          const bz = block.position[2];
          // Support generic 1x1x1 block bounds
          const blockBox = new THREE.Box3(
            new THREE.Vector3(bx - 0.45, by - 0.45, bz - 0.45),
            new THREE.Vector3(bx + 0.45, by + 0.45, bz + 0.45)
          );

          if (proposedBox.intersectsBox(blockBox)) {
            overlapBlock = block;
            break;
          }
        }

        if (overlapBlock) {
          // Décaler du côté opposé au bloc touché
          const dx = activePos.x - overlapBlock.position[0];
          if (dx >= 0) {
            activePos.x += 1;
            proposedBox.min.x += 1;
            proposedBox.max.x += 1;
          } else {
            activePos.x -= 1;
            proposedBox.min.x -= 1;
            proposedBox.max.x -= 1;
          }
        } else {
          break; // Posé correctement sans collision !
        }
        maxAttempts--;
      }
    }

    currentActivePosRef.current.copy(activePos);
    currentNormalRef.current.copy(hitNormal);

    if (meshRef.current && material) {
      if (state.selectedBlockType === 'move') {
        material.color.set('#00aaff');
        if (state.movingBlock) {
          meshRef.current.visible = false; // Hide the wireframe
          if (previewMeshRef.current) {
            previewMeshRef.current.visible = true;
            previewMeshRef.current.position.copy(activePos);

            // Only re-assign material if the block type changed (avoids per-frame allocation glitch)
            const type = state.movingBlock.type;
            if (lastPreviewTypeRef.current !== type) {
              lastPreviewTypeRef.current = type;
              const mat = previewMaterials[type] ?? previewMaterials.brick;
              previewMeshRef.current.material = mat;
            }
          }
        } else {
          meshRef.current.visible = true;
          if (previewMeshRef.current) previewMeshRef.current.visible = false;
        }
      } else {
        material.color.set(isEraser ? '#ff0000' : '#ffff00');
        if (previewMeshRef.current) previewMeshRef.current.visible = false;
      }

      const isPlatform = state.selectedBlockType === 'platform' || state.movingBlock?.type === 'platform';
      const targetScale = isPlatform ? new THREE.Vector3(2, 0.5, 1) : new THREE.Vector3(1, 1, 1);
      meshRef.current.scale.copy(targetScale);
      if (previewMeshRef.current) previewMeshRef.current.scale.copy(targetScale);

      if (isDraggingRef.current && dragButtonRef.current === 0 && dragStartPosRef.current && dragStartNormalRef.current && !isAltDownRef.current && state.selectedBlockType !== 'move') {
        meshRef.current.visible = false;

        // Brush Logic (Minecraft-style drag) :
        // L'interpolation manuelle complexe est inutile car useFrame tourne à 60/144 fps.
        // On se contente d'ajouter la cellule survolée si elle n'est pas déjà dans le tableau de prévisualisation.
        const exists = previewBlocksRef.current.some(p => p.x === activePos.x && p.y === activePos.y && p.z === activePos.z);

        if (!exists) {
          previewBlocksRef.current.push(activePos.clone());
        }

        const newPreview = previewBlocksRef.current;

        if (instancedMeshRef.current) {
          instancedMeshRef.current.count = newPreview.length;
          newPreview.forEach((pos, i) => {
            dummy.position.copy(pos);
            dummy.updateMatrix();
            instancedMeshRef.current!.setMatrixAt(i, dummy.matrix);
          });
          instancedMeshRef.current.instanceMatrix.needsUpdate = true;
        }
      } else {
        if (!state.movingBlock || state.selectedBlockType !== 'move') {
          meshRef.current.visible = true;
        }
        meshRef.current.position.copy(activePos);
        if (instancedMeshRef.current) instancedMeshRef.current.count = 0;
      }
    }
  });

  return (
    <>
      <mesh ref={meshRef} renderOrder={100} geometry={geometry} material={material} />
      <mesh ref={previewMeshRef} visible={false}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial transparent opacity={0.7} />
      </mesh>
      <instancedMesh ref={instancedMeshRef} args={[geometry, material, 1000]} renderOrder={100} />
    </>
  );
}
