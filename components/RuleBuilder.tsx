import React, { useMemo, useState } from 'react';
import * as THREE from 'three';
import { TransformRule } from '../types';
import { Edges } from '@react-three/drei';
import { ThemeMode } from '../App';

interface RuleBuilderProps {
  rules: TransformRule[];
  onUpdateRules: (rules: TransformRule[]) => void;
  gridScale: number;
  theme: ThemeMode;
}

export const RuleBuilder: React.FC<RuleBuilderProps> = ({ rules, onUpdateRules, gridScale, theme }) => {
  const [hoveredGhost, setHoveredGhost] = useState<string | null>(null);
  const [hoveredRule, setHoveredRule] = useState<number | null>(null);

  // Helper to snap/index coordinates
  const { step, offset, toIndex, toPos } = useMemo(() => {
    const step = gridScale;
    const invScale = Math.round(1 / step);
    const isEven = invScale % 2 === 0;
    const offset = isEven ? step / 2 : 0;
    
    const toIndex = (val: number) => Math.round((val - offset) / step);
    const toPos = (idx: number) => idx * step + offset;
    
    return { step, offset, toIndex, toPos };
  }, [gridScale]);

  // Compute Occupied Cells and Frontier
  const { rulesIndices, frontier } = useMemo(() => {
    const occupied = new Set<string>();
    const rulesIndices: number[][] = []; 

    // 1. Mark Rule Positions as Occupied
    rules.forEach((r, idx) => {
      const i = toIndex(r.position[0]);
      const j = toIndex(r.position[1]);
      const k = toIndex(r.position[2]);
      occupied.add(`${i},${j},${k}`);
      rulesIndices[idx] = [i, j, k];
    });

    // 2. Mark Parent Cube Positions as Occupied
    const checkRange = Math.ceil(1.0 / step);
    for (let x = -checkRange; x <= checkRange; x++) {
      for (let y = -checkRange; y <= checkRange; y++) {
        for (let z = -checkRange; z <= checkRange; z++) {
          const px = toPos(x);
          const py = toPos(y);
          const pz = toPos(z);
          const e = 0.001;
          if (
            Math.abs(px) < 0.5 - e && 
            Math.abs(py) < 0.5 - e && 
            Math.abs(pz) < 0.5 - e
          ) {
             occupied.add(`${x},${y},${z}`);
          }
        }
      }
    }

    // 3. Find Frontier
    const frontierMap = new Map<string, [number, number, number]>();
    const neighbors = [
      [1, 0, 0], [-1, 0, 0],
      [0, 1, 0], [0, -1, 0],
      [0, 0, 1], [0, 0, -1]
    ];

    occupied.forEach(key => {
      const [ox, oy, oz] = key.split(',').map(Number);
      neighbors.forEach(([dx, dy, dz]) => {
        const nx = ox + dx;
        const ny = oy + dy;
        const nz = oz + dz;
        const nKey = `${nx},${ny},${nz}`;
        
        if (!occupied.has(nKey)) {
          frontierMap.set(nKey, [nx, ny, nz]);
        }
      });
    });

    const frontierList = Array.from(frontierMap.entries()).map(([key, indices]) => ({
      id: key,
      indices,
      position: [toPos(indices[0]), toPos(indices[1]), toPos(indices[2])] as [number, number, number]
    }));

    return { rulesIndices, frontier: frontierList };
  }, [rules, gridScale, step, offset, toIndex, toPos]);

  const handleAdd = (pos: [number, number, number]) => {
     onUpdateRules([...rules, { position: pos, rotation: [0,0,0], scale: gridScale }]);
  };

  const handleRemove = (index: number) => {
     const newRules = rules.filter((_, i) => i !== index);
     onUpdateRules(newRules);
  };

  // Theme Colors
  const colors = theme === 'light' ? {
    parent: "#5c5346",
    parentEdge: "#3e3832",
    block: "#e6c288",
    blockHover: "#ef4444",
    blockEdge: "#c2b280",
    blockEdgeHover: "#fee2e2",
    ghost: "#fef3c7",
    ghostEdge: "#d97706"
  } : {
    parent: "#222222",
    parentEdge: "#444444",
    block: "#4f46e5", // Indigo
    blockHover: "#ff4d4d",
    blockEdge: "#818cf8",
    blockEdgeHover: "#ffcccc",
    ghost: "#ffffff",
    ghostEdge: "#ffffff"
  };

  return (
    <group>
      {/* Parent Cube (Visual Anchor) */}
      <mesh>
         <boxGeometry args={[1, 1, 1]} />
         <meshStandardMaterial color={colors.parent} transparent opacity={0.9} roughness={0.9} />
         <Edges color={colors.parentEdge} threshold={15} />
         <lineSegments>
            <edgesGeometry args={[new THREE.BoxGeometry(1, 1, 1)]} />
            <lineBasicMaterial color={colors.parentEdge} />
         </lineSegments>
      </mesh>

      {/* Existing Rules */}
      {rules.map((rule, i) => (
         <mesh 
            key={i} 
            position={rule.position}
            onClick={(e) => { e.stopPropagation(); }}
            onContextMenu={(e) => { 
              e.nativeEvent.preventDefault();
              e.stopPropagation(); 
              handleRemove(i); 
            }}
            onPointerOver={(e) => { e.stopPropagation(); setHoveredRule(i); }}
            onPointerOut={() => setHoveredRule(null)}
         >
            <boxGeometry args={[gridScale - 0.005, gridScale - 0.005, gridScale - 0.005]} />
            <meshStandardMaterial 
              color={hoveredRule === i ? colors.blockHover : colors.block} 
              roughness={0.2}
            />
            <Edges color={hoveredRule === i ? colors.blockEdgeHover : colors.blockEdge} />
         </mesh>
      ))}

      {/* Frontier Ghosts */}
      {frontier.map(f => (
         <mesh 
            key={f.id}
            position={f.position}
            onClick={(e) => { 
                e.stopPropagation(); 
                if (e.delta < 5) handleAdd(f.position); 
            }}
            onPointerOver={(e) => { e.stopPropagation(); setHoveredGhost(f.id); }}
            onPointerOut={() => setHoveredGhost(null)}
         >
            <boxGeometry args={[gridScale, gridScale, gridScale]} />
            <meshBasicMaterial 
               color={colors.ghost} 
               transparent 
               opacity={hoveredGhost === f.id ? 0.4 : 0.0} 
               depthWrite={false}
            />
             {hoveredGhost === f.id && <Edges color={colors.ghostEdge} />}
         </mesh>
      ))}
    </group>
  );
};
