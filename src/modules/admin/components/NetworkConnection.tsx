'use client';

import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Line } from '@react-three/drei';
import * as THREE from 'three';

interface NetworkConnectionProps {
  start: [number, number, number];
  end: [number, number, number];
  strength: number;
  isHighlighted: boolean;
  type: 'parent-child' | 'sibling';
}

export const NetworkConnection: React.FC<NetworkConnectionProps> = ({
  start,
  end,
  strength,
  isHighlighted,
  type
}) => {
  const pulseRef = useRef<THREE.Mesh>(null);
  const progressRef = useRef(0);

  const curve = useMemo(() => {
    const startVec = new THREE.Vector3(...start);
    const endVec = new THREE.Vector3(...end);
    const midPoint = new THREE.Vector3().addVectors(startVec, endVec).multiplyScalar(0.5);
    
    // Add curve height based on distance
    const distance = startVec.distanceTo(endVec);
    midPoint.y += distance * 0.2;

    return new THREE.QuadraticBezierCurve3(startVec, midPoint, endVec);
  }, [start, end]);

  const points = useMemo(() => curve.getPoints(50), [curve]);

  const color = type === 'parent-child' ? '#8b5cf6' : '#06b6d4';
  const opacity = isHighlighted ? 0.8 : 0.3;
  const lineWidth = strength * 2 + 1;

  useFrame((state) => {
    if (!pulseRef.current) return;

    // Animate pulse along the curve
    progressRef.current = (progressRef.current + 0.005) % 1;
    const point = curve.getPoint(progressRef.current);
    pulseRef.current.position.copy(point);

    // Pulse scale animation
    const scale = 0.08 + Math.sin(state.clock.elapsedTime * 5) * 0.03;
    pulseRef.current.scale.setScalar(scale);
  });

  return (
    <group>
      {/* Main connection line using Drei Line */}
      <Line
        points={points}
        color={color}
        lineWidth={lineWidth}
        transparent
        opacity={opacity}
      />

      {/* Glow line behind */}
      <Line
        points={points}
        color={color}
        lineWidth={lineWidth * 2}
        transparent
        opacity={opacity * 0.3}
      />

      {/* Energy pulse traveling along the line */}
      {isHighlighted && (
        <mesh ref={pulseRef}>
          <sphereGeometry args={[1, 16, 16]} />
          <meshBasicMaterial
            color="#ffffff"
            transparent
            opacity={0.8}
          />
        </mesh>
      )}
    </group>
  );
};
