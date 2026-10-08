'use client';

import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface ParticleBackgroundProps {
  count?: number;
  mousePosition: { x: number; y: number };
}

export const ParticleBackground: React.FC<ParticleBackgroundProps> = ({ 
  count = 200,
  mousePosition 
}) => {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const particleData = useRef<{ position: THREE.Vector3; velocity: THREE.Vector3; opacity: number }[]>([]);

  const dummy = useMemo(() => new THREE.Object3D(), []);

  useMemo(() => {
    particleData.current = Array.from({ length: count }, () => ({
      position: new THREE.Vector3(
        (Math.random() - 0.5) * 50,
        (Math.random() - 0.5) * 50,
        (Math.random() - 0.5) * 30
      ),
      velocity: new THREE.Vector3(
        (Math.random() - 0.5) * 0.01,
        (Math.random() - 0.5) * 0.01,
        (Math.random() - 0.5) * 0.005
      ),
      opacity: Math.random() * 0.5 + 0.2
    }));
  }, [count]);

  useFrame((state) => {
    if (!meshRef.current) return;

    const time = state.clock.elapsedTime;

    particleData.current.forEach((particle, i) => {
      // Organic movement
      particle.position.x += particle.velocity.x + Math.sin(time * 0.5 + i) * 0.002;
      particle.position.y += particle.velocity.y + Math.cos(time * 0.3 + i) * 0.002;
      particle.position.z += particle.velocity.z;

      // Parallax effect based on mouse
      const parallaxX = mousePosition.x * (particle.position.z * 0.02 + 0.5);
      const parallaxY = mousePosition.y * (particle.position.z * 0.02 + 0.5);

      // Boundary wrap
      if (Math.abs(particle.position.x) > 25) particle.velocity.x *= -1;
      if (Math.abs(particle.position.y) > 25) particle.velocity.y *= -1;
      if (Math.abs(particle.position.z) > 15) particle.velocity.z *= -1;

      dummy.position.set(
        particle.position.x + parallaxX,
        particle.position.y + parallaxY,
        particle.position.z
      );
      
      const scale = 0.02 + Math.sin(time * 2 + i * 0.1) * 0.01;
      dummy.scale.setScalar(scale);
      dummy.updateMatrix();
      meshRef.current!.setMatrixAt(i, dummy.matrix);
    });

    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
      <sphereGeometry args={[1, 8, 8]} />
      <meshBasicMaterial 
        color="#8b5cf6" 
        transparent 
        opacity={0.4}
      />
    </instancedMesh>
  );
};
