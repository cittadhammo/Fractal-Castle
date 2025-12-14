import React, { useState, Suspense, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, Stage, ContactShadows } from '@react-three/drei';
import { generateFractalConfig } from './services/geminiService';
import { FractalConfig, INITIAL_CONFIG, TransformRule } from './types';
import FractalMesh from './components/FractalMesh';
import UIOverlay from './components/UIOverlay';
import { RuleBuilder } from './components/RuleBuilder';

export type ThemeMode = 'light' | 'dark';

const App: React.FC = () => {
  // Initialize config from URL if present, otherwise use default
  const [config, setConfig] = useState<FractalConfig>(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const encodedConfig = params.get('c');
      if (encodedConfig) {
        // Simple base64 decode (handling potential unicode issues via escape)
        const jsonStr = decodeURIComponent(escape(atob(encodedConfig)));
        const parsed = JSON.parse(jsonStr);
        // Basic validation to ensure it has rules
        if (parsed && Array.isArray(parsed.rules)) {
          return { ...INITIAL_CONFIG, ...parsed };
        }
      }
    } catch (e) {
      console.error("Failed to load config from URL", e);
    }
    return INITIAL_CONFIG;
  });

  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'ai' | 'render' | 'builder'>('builder');
  const [gridScale, setGridScale] = useState(0.333);
  const [showBuilderPreview, setShowBuilderPreview] = useState(false);
  const [theme, setTheme] = useState<ThemeMode>('light');

  const handleGenerateAI = async (prompt: string) => {
    setIsGenerating(true);
    setError(null);
    try {
      const newConfigPartial = await generateFractalConfig(prompt);
      setConfig((prev) => ({
        ...prev,
        ...newConfigPartial,
        rules: newConfigPartial.rules || prev.rules,
        baseShape: newConfigPartial.baseShape || prev.baseShape,
        color: newConfigPartial.color || prev.color,
        name: newConfigPartial.name || "AI Generated Fractal",
        description: newConfigPartial.description || prompt,
        iterations: 4
      }));
      setActiveTab('render');
    } catch (err: any) {
      console.error(err);
      setError("Failed to generate fractal. Please check API Key or try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const updateRulesFromBuilder = (newRules: TransformRule[]) => {
    setConfig(prev => ({ ...prev, rules: newRules }));
  };

  const bgColor = theme === 'light' ? '#f5f5f4' : '#050505';
  const fogColor = theme === 'light' ? '#f5f5f4' : '#050505';

  return (
    <div className={`w-full h-full relative transition-colors duration-500`} style={{ backgroundColor: bgColor }}>
      {/* 3D Scene */}
      <Canvas shadows camera={{ position: [4, 4, 4], fov: 45 }}>
        {/* @ts-ignore */}
        <fog attach="fog" args={[fogColor, 10, 50]} />
        <Suspense fallback={null}>
          <Stage environment={theme === 'light' ? "city" : "night"} intensity={0.5} shadows={false} adjustCamera={false}>
            {activeTab === 'builder' && (
              <RuleBuilder 
                rules={config.rules} 
                onUpdateRules={updateRulesFromBuilder}
                gridScale={gridScale}
                theme={theme}
              />
            )}
            
            {(activeTab === 'render' || (activeTab === 'builder' && showBuilderPreview)) && (
               <FractalMesh 
                 config={config} 
                 opacity={activeTab === 'builder' ? 0.3 : 1.0} 
               />
            )}
          </Stage>
          <Environment preset={theme === 'light' ? "city" : "city"} />
        </Suspense>
        <ContactShadows position={[0, -2, 0]} opacity={0.4} scale={20} blur={2.5} far={4.5} color={theme === 'light' ? '#000000' : '#000000'} />
        <OrbitControls makeDefault autoRotate={activeTab !== 'builder'} autoRotateSpeed={0.5} />
      </Canvas>

      {/* UI Overlay */}
      <UIOverlay 
        config={config} 
        setConfig={setConfig} 
        onGenerateAI={handleGenerateAI}
        isGenerating={isGenerating}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        gridScale={gridScale}
        setGridScale={setGridScale}
        showPreview={showBuilderPreview}
        setShowPreview={setShowBuilderPreview}
        theme={theme}
        setTheme={setTheme}
        setError={setError}
      />

      {/* Error Toast */}
      {error && (
        <div className="absolute bottom-4 right-4 bg-red-500/90 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 animate-bounce z-50">
          <span className="font-bold">Notice:</span> {error}
          <button onClick={() => setError(null)} className="ml-2 underline">Dismiss</button>
        </div>
      )}
    </div>
  );
};

export default App;