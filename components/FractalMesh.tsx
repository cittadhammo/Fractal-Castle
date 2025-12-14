import React, { useMemo, useRef, useLayoutEffect } from 'react';
import * as THREE from 'three';
import { FractalConfig } from '../types';

interface FractalMeshProps {
  config: FractalConfig;
  opacity?: number;
}

const MAX_INSTANCES = 100000;

const FractalMesh: React.FC<FractalMeshProps> = ({ config, opacity = 1 }) => {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  
  // Geometry definition based on shape
  const geometry = useMemo(() => {
    switch (config.baseShape) {
      case 'sphere': return new THREE.SphereGeometry(0.5, 16, 16);
      case 'pyramid': return new THREE.ConeGeometry(0.5, 1, 4);
      case 'box':
      default: return new THREE.BoxGeometry(1, 1, 1);
    }
  }, [config.baseShape]);

  // Material definition
  const material = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: config.color,
      roughness: 0.9, // Sand is rough
      metalness: 0.1, // Sand is not metallic
      transparent: opacity < 1,
      opacity: opacity,
    });
  }, [config.color, opacity]);

  // Compute matrices iteratively
  const matrices = useMemo(() => {
    // Level 0: Identity (The root shape)
    let currentLevelMatrices: THREE.Matrix4[] = [new THREE.Matrix4()]; 
    
    // Initialize accumulation with Level 0
    // This ensures the "previous iteration" (the starting one) stays.
    let allMatrices: THREE.Matrix4[] = [...currentLevelMatrices];

    for (let i = 0; i < config.iterations; i++) {
      const nextLevelMatrices: THREE.Matrix4[] = [];
      
      // Calculate projected count to prevent crashes
      const projectedCount = allMatrices.length + (currentLevelMatrices.length * config.rules.length);

      if (projectedCount > MAX_INSTANCES) {
        console.warn(`Max instances reached at iteration ${i}. Stopping recursion.`);
        break;
      }

      for (const parentMatrix of currentLevelMatrices) {
        for (const rule of config.rules) {
          const childMatrix = parentMatrix.clone();
          
          // Apply transformation relative to parent
          // 1. Translate
          const translation = new THREE.Matrix4().makeTranslation(
            rule.position[0],
            rule.position[1],
            rule.position[2]
          );
          
          // 2. Rotate
          const rotation = new THREE.Matrix4().makeRotationFromEuler(
            new THREE.Euler(rule.rotation[0], rule.rotation[1], rule.rotation[2])
          );

          // 3. Scale
          const scale = new THREE.Matrix4().makeScale(
            rule.scale,
            rule.scale,
            rule.scale
          );

          // Combine: Child = Parent * T * R * S
          // Note: Matrix multiplication order matters. 
          // Usually in local space: Multiply parent by local transform.
          const localTransform = new THREE.Matrix4()
            .multiply(translation)
            .multiply(rotation)
            .multiply(scale);

          childMatrix.multiply(localTransform);
          nextLevelMatrices.push(childMatrix);
        }
      }
      currentLevelMatrices = nextLevelMatrices;
      
      // Accumulate the new generation
      allMatrices.push(...nextLevelMatrices);
    }
    
    return allMatrices;
  }, [config]);

  // Update the InstancedMesh
  useLayoutEffect(() => {
    if (!meshRef.current) return;
    
    const count = Math.min(matrices.length, MAX_INSTANCES);
    meshRef.current.count = count;

    for (let i = 0; i < count; i++) {
      meshRef.current.setMatrixAt(i, matrices[i]);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
  }, [matrices]);

  return (
    // @ts-ignore
    <instancedMesh
      ref={meshRef}
      args={[geometry, undefined, MAX_INSTANCES]}
      material={material}
      castShadow
      receiveShadow
    />
  );
};

export default FractalMesh;