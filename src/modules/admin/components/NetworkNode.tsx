'use client';

import React, { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text, RoundedBox } from '@react-three/drei';
import * as THREE from 'three';

interface NetworkNodeProps {
  position: [number, number, number];
  name: string;
  type: 'headquarters' | 'branch';
  userCount: number;
  monthlyVolume: number;
  isSelected: boolean;
  isHighlighted: boolean;
  onClick: () => void;
  onHover: (hover: boolean) => void;
}

export const NetworkNode: React.FC<NetworkNodeProps> = ({
  position,
  name,
  type,
  userCount,
  monthlyVolume,
  isSelected,
  isHighlighted,
  onClick,
  onHover
}) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  const baseSize = type === 'headquarters' ? 1.2 : 0.8;
  const color = type === 'headquarters' ? '#8b5cf6' : '#06b6d4';
  const glowColor = type === 'headquarters' ? '#a78bfa' : '#22d3ee';

  useFrame((state) => {
    if (!meshRef.current || !glowRef.current) return;

    const time = state.clock.elapsedTime;
    
    // Gentle rotation
    meshRef.current.rotation.y = time * 0.2;
    meshRef.current.rotation.x = Math.sin(time * 0.3) * 0.1;

    // Scale animation
    const targetScale = (hovered || isSelected) ? baseSize * 1.3 : baseSize;
    meshRef.current.scale.lerp(
      new THREE.Vector3(targetScale, targetScale, targetScale),
      0.1
    );

    // Glow pulse
    const glowScale = baseSize * 1.8 + Math.sin(time * 2) * 0.2;
    glowRef.current.scale.setScalar(glowScale);
    
    // Glow opacity
    const material = glowRef.current.material as THREE.MeshBasicMaterial;
    material.opacity = (hovered || isSelected || isHighlighted) 
      ? 0.3 + Math.sin(time * 3) * 0.1 
      : 0.1;
  });

  const handlePointerOver = () => {
    setHovered(true);
    onHover(true);
    document.body.style.cursor = 'pointer';
  };

  const handlePointerOut = () => {
    setHovered(false);
    onHover(false);
    document.body.style.cursor = 'auto';
  };

  return (
    <group position={position}>
      {/* Glow effect */}
      <mesh ref={glowRef}>
        <sphereGeometry args={[1, 32, 32]} />
        <meshBasicMaterial
          color={glowColor}
          transparent
          opacity={0.1}
          side={THREE.BackSide}
        />
      </mesh>

      {/* Main node */}
      <RoundedBox
        ref={meshRef}
        args={[1, 1, 1]}
        radius={0.15}
        smoothness={4}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
        onClick={onClick}
      >
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={hovered || isSelected ? 0.5 : 0.2}
          metalness={0.3}
          roughness={0.4}
        />
      </RoundedBox>

      {/* Company name label */}
      <Text
        position={[0, baseSize + 0.5, 0]}
        fontSize={0.3}
        color="white"
        anchorX="center"
        anchorY="middle"
        maxWidth={3}
      >
        {name.length > 15 ? name.substring(0, 15) + '...' : name}
      </Text>

      {/* Stats badge */}
      {(hovered || isSelected) && (
        <group position={[0, -baseSize - 0.4, 0]}>
          <Text
            fontSize={0.2}
            color="#a1a1aa"
            anchorX="center"
            anchorY="middle"
          >
            {`👥 ${userCount} • R$ ${(monthlyVolume / 1000).toFixed(0)}k`}
          </Text>
        </group>
      )}

      {/* Type indicator */}
      <mesh position={[baseSize * 0.6, baseSize * 0.6, baseSize * 0.6]}>
        <sphereGeometry args={[0.15, 16, 16]} />
        <meshBasicMaterial color={type === 'headquarters' ? '#fbbf24' : '#34d399'} />
      </mesh>
    </group>
  );
};
