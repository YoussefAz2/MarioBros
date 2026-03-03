import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import ProceduralMario from './ProceduralMario';

interface Mario3DProps {
  walking: React.MutableRefObject<boolean>;
  facingRight: React.MutableRefObject<boolean>;
  velocityX: React.MutableRefObject<number>;
  velocityZ: React.MutableRefObject<number>;
}

export default function Mario3D({ walking, facingRight, velocityX, velocityZ }: Mario3DProps) {
  const group = useRef<THREE.Group>(null);
  const currentAngle = useRef(Math.PI / 2); // Start facing +X (right)

  useFrame(() => {
    if (!group.current) return;

    const vx = velocityX.current;
    const vz = velocityZ.current;
    const speed = Math.sqrt(vx * vx + vz * vz);

    if (speed > 0.3) {
      // Calculate target angle from velocity using atan2
      // atan2(vx, -vz) gives us: right=PI/2, left=-PI/2, forward(into screen)=0, backward=PI
      const targetAngle = Math.atan2(vx, vz);

      // Smooth rotation using lerp with angle wrapping
      let diff = targetAngle - currentAngle.current;
      // Wrap to [-PI, PI] for shortest path
      while (diff > Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;
      currentAngle.current += diff * 0.15;
    } else {
      // When idle, face left or right based on facingRight
      const idleAngle = facingRight.current ? Math.PI / 2 : -Math.PI / 2;
      let diff = idleAngle - currentAngle.current;
      while (diff > Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;
      currentAngle.current += diff * 0.1;
    }

    group.current.rotation.y = currentAngle.current;
  });

  return (
    <group ref={group} position={[0, -0.25, 0]}>
      {/* ProceduralMario is built facing +Z. 
          The Y rotation in useFrame handles all direction changes. */}
      <ProceduralMario walkingRef={walking} />
    </group>
  );
}
