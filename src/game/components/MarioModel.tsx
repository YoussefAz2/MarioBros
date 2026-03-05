/*
 * Mario Animated Model - loads mario_animated.glb and plays walk animation
 * Uses a simple approach: load scene directly and attach animations 
 * Author: abdulmugheeskhan20th (CC-BY-4.0)
 */

import React from 'react'
import { useGLTF, useAnimations } from '@react-three/drei'
import { GLTF } from 'three-stdlib'
import * as THREE from 'three'
import { assetPath } from '../../utils/assetPath'

type GLTFResult = GLTF & {
  animations: THREE.AnimationClip[]
}

interface MarioModelProps {
  walking?: boolean;
}

export function Model({ walking }: MarioModelProps) {
  const group = React.useRef<THREE.Group>(null)
  const { scene, animations } = useGLTF(assetPath('/models/mario_animated/scene.gltf')) as GLTFResult
  const { actions, names } = useAnimations(animations, group)

  // Debug: log animation names on first mount
  React.useEffect(() => {
    console.log('[MarioModel] Available animations:', names)
  }, [names])

  // Fix material rendering: force double-sided AND flip normals if needed
  React.useEffect(() => {
    scene.traverse((obj) => {
      if ((obj as THREE.Mesh).isMesh) {
        const mesh = obj as THREE.Mesh

        // Recompute normals in case they're inverted from Blender export
        if (mesh.geometry) {
          // Flip the normals by negating the normal attribute
          const normals = mesh.geometry.getAttribute('normal')
          if (normals) {
            for (let i = 0; i < normals.count; i++) {
              normals.setXYZ(i, -normals.getX(i), -normals.getY(i), -normals.getZ(i))
            }
            normals.needsUpdate = true
          }
        }

        const applyFix = (mat: THREE.Material) => {
          mat.side = THREE.DoubleSide
          mat.needsUpdate = true
        }

        if (Array.isArray(mesh.material)) {
          mesh.material.forEach(applyFix)
        } else if (mesh.material) {
          applyFix(mesh.material as THREE.Material)
        }
      }
    })
  }, [scene])

  // Control the walk animation
  React.useEffect(() => {
    // Try the main walking animation (Action.010 is the run cycle)
    const walkAnim = actions['Armature|Action.010'] || actions[names[0]]
    if (!walkAnim) {
      console.warn('[MarioModel] No animation found. Names:', names)
      return
    }

    walkAnim.setEffectiveTimeScale(1.0)
    walkAnim.setLoop(THREE.LoopRepeat, Infinity)
    walkAnim.clampWhenFinished = false

    if (walking) {
      walkAnim.reset().fadeIn(0.15).play()
    } else {
      walkAnim.fadeOut(0.2)
    }

    return () => {
      walkAnim.stop()
    }
  }, [walking, actions, names])

  return (
    <group ref={group} dispose={null}>
      <primitive object={scene} />
    </group>
  )
}

useGLTF.preload(assetPath('/models/mario_animated/scene.gltf'))
