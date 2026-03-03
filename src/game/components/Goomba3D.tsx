import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Model as GoombaModel } from './GoombaModel';

interface Goomba3DProps {
  walking: React.MutableRefObject<boolean>;
  facingRight: React.MutableRefObject<boolean>;
}

export default function Goomba3D({ walking, facingRight }: Goomba3DProps) {
  const group = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (group.current) {
      // Smoothly rotate the Goomba to face its movement direction
      const targetRot = facingRight.current ? Math.PI / 2 : -Math.PI / 2;
      group.current.rotation.y = THREE.MathUtils.lerp(group.current.rotation.y, targetRot, 0.2);
    }
  });

  return (
    <group ref={group} scale={0.015} position={[0, -0.4, 0]}>
      {/* 
        The GoombaModel handles its own walk animation internally.
        We wrap it in a group to control its global scale/rotation/position 
        relative to the physics RigidBody.
      */}
      <group rotation={[0, -Math.PI / 2, 0]}>
        <GoombaModel />
      </group>
    </group>
  );
}
