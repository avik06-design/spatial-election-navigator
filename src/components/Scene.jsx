import React, { useRef, useEffect, useState } from 'react';
import { CameraControls, Text, Float, Environment, Image, Sparkles } from '@react-three/drei';
import * as THREE from 'three';

export default function Scene({ activeNode, setActiveNode }) {
  const cameraControlsRef = useRef(null);
  const [hoveredNode, setHoveredNode] = useState(null);

  useEffect(() => {
    document.body.style.cursor = hoveredNode ? 'pointer' : 'auto';
    return () => { document.body.style.cursor = 'auto'; };
  }, [hoveredNode]);

  const platforms = [
    { id: 'registration', name: 'REGISTRATION', position: new THREE.Vector3(-10, 2, -6), imageUrl: 'https://images.unsplash.com/photo-1540910419892-4a36d2c3266c?q=80&w=800' },
    { id: 'research', name: 'RESEARCH', position: new THREE.Vector3(-3.5, -2, 2), imageUrl: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?q=80&w=800' },
    { id: 'voting', name: 'VOTING DAY', position: new THREE.Vector3(4, 1, 6), imageUrl: 'https://images.unsplash.com/photo-1541802645635-11f2286a7482?q=80&w=800' },
    { id: 'results', name: 'RESULTS', position: new THREE.Vector3(10.5, -1, -3), imageUrl: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=800' },
  ];

  useEffect(() => {
    if (cameraControlsRef.current) {
      if (activeNode) {
        const target = platforms.find((p) => p.id === activeNode);
        if (target) {
          const camPos = target.position.clone().add(new THREE.Vector3(1.5, 0, 4.5));
          cameraControlsRef.current.setLookAt(
            camPos.x, camPos.y, camPos.z,
            target.position.x, target.position.y, target.position.z,
            true
          );
        }
      } else {
        cameraControlsRef.current.setLookAt(0, 8, 22, 0, 0, 0, true);
      }
    }
  }, [activeNode]);

  return (
    <>
      <ambientLight intensity={0.4} />
      <directionalLight position={[5, 12, 4]} intensity={2} color="#e0e7ff" />
      <Environment preset="city" />
      <Sparkles count={250} scale={35} size={2} speed={0.2} opacity={0.3} color="#ffffff" />

      <CameraControls ref={cameraControlsRef} makeDefault dollySpeed={1.5} smoothTime={0.5} />

      {platforms.map((platform) => (
        <Float key={platform.id} speed={2} rotationIntensity={0.3} floatIntensity={0.8}>
          <group 
            position={platform.position}
            onClick={(e) => {
              e.stopPropagation();
              setActiveNode(platform.id);
            }}
            onPointerOver={(e) => { e.stopPropagation(); setHoveredNode(platform.id); }}
            onPointerOut={(e) => { e.stopPropagation(); if (hoveredNode === platform.id) setHoveredNode(null); }}
          >
            <mesh position={[0, 0, -0.05]} castShadow receiveShadow>
              <planeGeometry args={[3.8, 4.8]} />
              <meshPhysicalMaterial color="#ffffff" transmission={1} opacity={1} metalness={0.2} roughness={0.1} ior={1.5} thickness={0.5} />
            </mesh>
            <Image url={platform.imageUrl} position={[0, 0, 0]} scale={[3.6, 4.6]} transparent opacity={0.95} />
            <mesh position={[0, -1.6, 0.01]}>
              <planeGeometry args={[3.6, 1.4]} />
              <meshBasicMaterial color="#000000" transparent opacity={0.6} />
            </mesh>
            <Text
              position={[0, -1.8, 0.1]}
              fontSize={0.38}
              font="https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfMZhrib2Bg-4.ttf"
              color="#ffffff"
              anchorX="center"
              anchorY="middle"
            >
              {platform.name}
            </Text>
          </group>
        </Float>
      ))}
    </>
  );
}
