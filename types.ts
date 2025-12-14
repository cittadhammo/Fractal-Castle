export interface TransformRule {
  position: [number, number, number];
  rotation: [number, number, number];
  scale: number;
}

export interface FractalConfig {
  name: string;
  description: string;
  baseShape: 'box' | 'sphere' | 'pyramid';
  color: string;
  rules: TransformRule[];
  iterations: number;
  maxInstances?: number;
}

export const INITIAL_CONFIG: FractalConfig = {
  name: "Sand Castle Base",
  description: "An empty plot ready for your sand structures.",
  baseShape: 'box',
  color: '#e6c288',
  iterations: 4,
  rules: []
};