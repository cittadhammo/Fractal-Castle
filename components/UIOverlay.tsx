import React, { useState, useRef } from 'react';
import { FractalConfig, TransformRule } from '../types';
import { Sparkles, Dna, Box, RefreshCw, Wand2, Plus, Trash2, Github, Hammer, MousePointer2, Eye, Sun, Moon, Share2, Download, Upload, Link as LinkIcon, Copy, FileJson } from 'lucide-react';
import { ThemeMode } from '../App';

interface UIOverlayProps {
  config: FractalConfig;
  setConfig: React.Dispatch<React.SetStateAction<FractalConfig>>;
  onGenerateAI: (prompt: string) => void;
  isGenerating: boolean;
  activeTab: 'ai' | 'render' | 'builder';
  setActiveTab: (tab: 'ai' | 'render' | 'builder') => void;
  gridScale: number;
  setGridScale: (s: number) => void;
  showPreview: boolean;
  setShowPreview: (v: boolean) => void;
  theme: ThemeMode;
  setTheme: (t: ThemeMode) => void;
  setError: (msg: string | null) => void;
}

const UIOverlay: React.FC<UIOverlayProps> = ({ 
  config, setConfig, onGenerateAI, isGenerating,
  activeTab, setActiveTab, gridScale, setGridScale,
  showPreview, setShowPreview, theme, setTheme, setError
}) => {
  const [prompt, setPrompt] = useState('');
  const [listLimit, setListLimit] = useState(10); // Virtualization limit
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpdateRule = (index: number, field: keyof TransformRule, value: any, subIndex?: number) => {
    const newRules = [...config.rules];
    if (field === 'position' || field === 'rotation') {
       // @ts-ignore
       newRules[index][field][subIndex!] = parseFloat(value);
    } else {
       // @ts-ignore
       newRules[index][field] = parseFloat(value);
    }
    setConfig({ ...config, rules: newRules });
  };

  const addRule = () => {
    setConfig({
      ...config,
      rules: [...config.rules, { position: [0, 1, 0], rotation: [0, 0, 0], scale: 0.5 }]
    });
  };

  const removeRule = (index: number) => {
    const newRules = config.rules.filter((_, i) => i !== index);
    setConfig({ ...config, rules: newRules });
  };

  // --- Export / Import / Share Logic ---
  
  const handleExportJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(config, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `${config.name.replace(/\s+/g, '_')}_fractal.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed && Array.isArray(parsed.rules)) {
          setConfig(parsed);
          setError("Fractal loaded successfully!");
          setTimeout(() => setError(null), 3000);
        } else {
          setError("Invalid fractal file format.");
        }
      } catch (err) {
        setError("Error parsing JSON file.");
      }
    };
    reader.readAsText(file);
    // Reset input so same file can be selected again if needed
    e.target.value = '';
  };

  const handleShareLink = () => {
    try {
      const jsonStr = JSON.stringify(config);
      // UTF-8 safe base64 encoding
      const encoded = btoa(unescape(encodeURIComponent(jsonStr)));
      
      // Use URL API for robust construction
      const url = new URL(window.location.href);
      url.searchParams.set('c', encoded);
      
      navigator.clipboard.writeText(url.toString());
      setError("Link copied to clipboard!");
      setTimeout(() => setError(null), 3000);
    } catch (err) {
      setError("Config too large for link. Use Export or Copy Data.");
    }
  };

  const handleCopyData = () => {
    const jsonStr = JSON.stringify(config, null, 2);
    navigator.clipboard.writeText(jsonStr);
    setError("Raw data copied to clipboard!");
    setTimeout(() => setError(null), 3000);
  };

  const handlePasteData = () => {
    try {
      const data = prompt("Paste fractal JSON data here:");
      if (!data) return;
      
      const parsed = JSON.parse(data);
      if (parsed && Array.isArray(parsed.rules)) {
        setConfig(parsed);
        setError("Fractal loaded from text!");
        setTimeout(() => setError(null), 3000);
      } else {
        setError("Invalid data format.");
      }
    } catch (err) {
      setError("Failed to parse text data.");
    }
  };

  // Theme Definitions
  const styles = theme === 'light' ? {
    sidebar: "bg-white/80 border-stone-200 text-stone-800",
    heading: "from-amber-500 to-orange-500",
    subtext: "text-stone-500",
    tabActive: "bg-amber-600 text-white",
    tabInactive: "text-stone-500 hover:text-stone-800",
    panelBg: "bg-amber-50 border-amber-200",
    panelText: "text-stone-600",
    inputBg: "bg-stone-100 border-stone-300 focus:border-amber-500",
    accentText: "text-amber-600",
    divider: "bg-stone-200",
    title: "text-stone-800/20"
  } : {
    sidebar: "bg-[#0a0a0a]/90 border-white/10 text-gray-200",
    heading: "from-indigo-400 to-purple-400",
    subtext: "text-gray-400",
    tabActive: "bg-indigo-600 text-white",
    tabInactive: "text-gray-400 hover:text-white",
    panelBg: "bg-indigo-900/20 border-indigo-500/20",
    panelText: "text-gray-300",
    inputBg: "bg-black/50 border-white/10 focus:border-indigo-500",
    accentText: "text-indigo-400",
    divider: "bg-white/10",
    title: "text-white/10"
  };

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    // Sync the fractal color with the theme palette
    setConfig(prev => ({
      ...prev,
      color: newTheme === 'light' ? '#e6c288' : '#4f46e5'
    }));
  };

  return (
    <div className="absolute top-0 left-0 h-full w-full pointer-events-none flex flex-col md:flex-row z-10 font-sans">
      
      {/* Sidebar Controls */}
      <div className={`pointer-events-auto w-full md:w-96 backdrop-blur-xl p-6 overflow-y-auto border-r h-1/2 md:h-full flex flex-col gap-6 shadow-2xl transition-colors duration-300 ${styles.sidebar}`}>
        
        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <h1 className={`text-2xl font-bold bg-gradient-to-r bg-clip-text text-transparent flex items-center gap-2 ${styles.heading}`}>
              <Dna className={`w-6 h-6 ${theme === 'light' ? 'text-amber-500' : 'text-indigo-400'}`} />
              FractalGen AI
            </h1>
            <p className={`text-xs mt-1 ${styles.subtext}`}>Procedural Recursive Geometry Engine</p>
          </div>
          <button 
            onClick={toggleTheme}
            className={`p-2 rounded-full transition-colors ${theme === 'light' ? 'bg-stone-200 hover:bg-stone-300 text-amber-600' : 'bg-white/10 hover:bg-white/20 text-indigo-300'}`}
          >
            {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
          </button>
        </div>

        {/* Tab Switcher */}
        <div className={`flex p-1 rounded-lg gap-1 ${theme === 'light' ? 'bg-stone-200' : 'bg-white/5'}`}>
          <button 
            onClick={() => setActiveTab('ai')}
            className={`flex-1 flex items-center justify-center gap-1 py-2 rounded-md text-xs font-medium transition-colors ${activeTab === 'ai' ? styles.tabActive : styles.tabInactive}`}
          >
            <Sparkles className="w-3 h-3" /> AI
          </button>
          <button 
            onClick={() => setActiveTab('builder')}
            className={`flex-1 flex items-center justify-center gap-1 py-2 rounded-md text-xs font-medium transition-colors ${activeTab === 'builder' ? styles.tabActive : styles.tabInactive}`}
          >
            <Hammer className="w-3 h-3" /> Builder
          </button>
          <button 
            onClick={() => setActiveTab('render')}
            className={`flex-1 flex items-center justify-center gap-1 py-2 rounded-md text-xs font-medium transition-colors ${activeTab === 'render' ? styles.tabActive : styles.tabInactive}`}
          >
            <Box className="w-3 h-3" /> Render
          </button>
        </div>

        {/* Builder Panel */}
        {activeTab === 'builder' && (
           <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-left-4 duration-300">
              <div className={`border p-4 rounded-lg space-y-4 ${styles.panelBg}`}>
                <div className={`text-xs mb-2 space-y-2 ${styles.panelText}`}>
                  <strong className={`block mb-1 flex items-center gap-2 ${styles.accentText}`}><MousePointer2 className="w-3 h-3"/> Controls</strong>
                  <ul className="list-disc pl-4 space-y-1 opacity-80">
                     <li><strong>Left Click</strong> on adjacent space (ghost) to Add.</li>
                     <li><strong>Right Click</strong> on a block to Delete.</li>
                     <li><strong>Drag</strong> background to Rotate view.</li>
                  </ul>
                </div>
                
                <div className="space-y-2">
                  <label className={`text-xs font-bold ${styles.panelText}`}>Grid Scale (Child Size)</label>
                  <div className="flex gap-2">
                    {[
                      { l: '1/2', v: 0.5 },
                      { l: '1/3', v: 0.333 },
                      { l: '1/4', v: 0.25 }
                    ].map(opt => (
                      <button
                        key={opt.l}
                        onClick={() => {
                          setGridScale(opt.v);
                        }}
                        className={`flex-1 py-2 text-xs font-mono rounded border transition-colors ${Math.abs(gridScale - opt.v) < 0.01 ? styles.tabActive : `${styles.inputBg} ${styles.subtext} hover:opacity-80`}`}
                      >
                        {opt.l}
                      </button>
                    ))}
                  </div>
                </div>

                <div className={`flex items-center justify-between pt-2 border-t ${theme === 'light' ? 'border-amber-200' : 'border-white/10'}`}>
                  <label className={`text-xs font-bold flex items-center gap-2 ${styles.panelText}`}>
                     <Eye className={`w-4 h-4 ${styles.accentText}`} />
                     Live Preview
                  </label>
                  <button 
                    onClick={() => setShowPreview(!showPreview)}
                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none ${showPreview ? (theme === 'light' ? 'bg-amber-600' : 'bg-indigo-600') : 'bg-gray-400/50'}`}
                  >
                    <span
                      className={`${
                        showPreview ? 'translate-x-5' : 'translate-x-1'
                      } inline-block h-3 w-3 transform rounded-full bg-white transition-transform`}
                    />
                  </button>
                </div>

                <div className="mt-4 flex justify-between items-center">
                    <span className={`text-xs ${styles.subtext}`}>{config.rules.length} blocks placed</span>
                    <button 
                      onClick={() => setConfig({...config, rules: []})}
                      className="text-xs text-red-400 hover:text-red-300 underline"
                    >
                      Clear All
                    </button>
                </div>
              </div>
           </div>
        )}

        {/* AI Control Panel */}
        {activeTab === 'ai' && (
          <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-left-4 duration-300">
            <div className="space-y-2">
              <label className={`text-sm font-medium ${styles.panelText}`}>Describe a Structure</label>
              <textarea 
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="e.g., A desert fortress with high towers made of sandstone..."
                className={`w-full h-32 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 resize-none ${styles.inputBg} ${theme === 'light' ? 'text-stone-800' : 'text-gray-200'}`}
              />
            </div>
            <button 
              onClick={() => onGenerateAI(prompt)}
              disabled={isGenerating || !prompt.trim()}
              className={`w-full py-3 rounded-lg font-bold text-sm hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg ${theme === 'light' ? 'bg-gradient-to-r from-amber-600 to-orange-600 text-white shadow-orange-900/10' : 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-indigo-900/20'}`}
            >
              {isGenerating ? (
                <><RefreshCw className="w-4 h-4 animate-spin" /> Dreaming...</>
              ) : (
                <><Wand2 className="w-4 h-4" /> Generate Fractal</>
              )}
            </button>
          </div>
        )}

        {/* Render Control Panel (Formerly Manual) */}
        {activeTab === 'render' && (
          <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-right-4 duration-300 pb-10">
            {/* Global Settings */}
            <div className="space-y-4">
               <div className="flex justify-between items-center">
                 <label className={`text-sm font-medium ${styles.panelText}`}>Base Shape</label>
                 <select 
                    value={config.baseShape}
                    onChange={(e) => setConfig({...config, baseShape: e.target.value as any})}
                    className={`rounded px-2 py-1 text-xs ${styles.inputBg} ${theme === 'light' ? 'text-stone-800' : 'text-gray-200'}`}
                 >
                   <option value="box">Cube</option>
                   <option value="sphere">Sphere</option>
                   <option value="pyramid">Pyramid</option>
                 </select>
               </div>

               <div>
                 <div className="flex justify-between text-xs mb-1">
                    <span className={styles.subtext}>Iterations</span>
                    <span className={styles.accentText}>{config.iterations}</span>
                 </div>
                 <input 
                    type="range" 
                    min="1" 
                    max="6" 
                    step="1"
                    value={config.iterations}
                    onChange={(e) => setConfig({...config, iterations: parseInt(e.target.value)})}
                    className={`w-full h-2 rounded-lg appearance-none cursor-pointer ${theme === 'light' ? 'bg-stone-200 accent-amber-600' : 'bg-white/10 accent-indigo-600'}`}
                 />
               </div>
               
               <div>
                  <label className={`text-xs block mb-1 ${styles.subtext}`}>Color</label>
                  <div className="flex gap-2">
                    <input 
                      type="color" 
                      value={config.color}
                      onChange={(e) => setConfig({...config, color: e.target.value})}
                      className="h-8 w-12 bg-transparent border-0 rounded cursor-pointer"
                    />
                    <span className={`text-xs self-center font-mono ${styles.subtext}`}>{config.color}</span>
                  </div>
               </div>
            </div>

            <div className={`h-px w-full ${styles.divider}`} />

            {/* Rules Editor */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className={`text-sm font-bold ${styles.panelText}`}>Recursion Rules ({config.rules.length})</h3>
                <button onClick={addRule} className={`p-1 rounded ${styles.accentText} hover:bg-white/10`}>
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              {/* Virtualized/Limited List to prevent Freezing */}
              <div className="space-y-3">
                {config.rules.slice(0, listLimit).map((rule, idx) => (
                  <div key={idx} className={`p-3 rounded border relative group ${styles.inputBg}`}>
                    <button 
                      onClick={() => removeRule(idx)}
                      className="absolute top-2 right-2 text-gray-400 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                    
                    <div className={`text-[10px] uppercase font-bold mb-2 ${styles.subtext}`}>Rule #{idx + 1}</div>
                    
                    <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                       {/* Position */}
                       <div className="col-span-2 space-y-1">
                          <label className={`text-[10px] ${styles.subtext}`}>Position (X, Y, Z)</label>
                          <div className="flex gap-1">
                             {[0,1,2].map(axis => (
                               <input 
                                 key={`pos-${axis}`}
                                 type="number" step="0.1"
                                 value={rule.position[axis]}
                                 onChange={(e) => handleUpdateRule(idx, 'position', e.target.value, axis)}
                                 className={`w-full border rounded px-1 py-1 text-xs text-center focus:outline-none ${styles.inputBg} ${theme === 'light' ? 'border-stone-300' : 'border-white/10'}`}
                               />
                             ))}
                          </div>
                       </div>
                       
                       {/* Scale */}
                       <div className="col-span-2 flex items-center justify-between">
                          <label className={`text-[10px] ${styles.subtext}`}>Scale</label>
                          <input 
                             type="number" step="0.05"
                             value={rule.scale}
                             onChange={(e) => handleUpdateRule(idx, 'scale', e.target.value)}
                             className={`w-20 border rounded px-1 py-1 text-xs text-center focus:outline-none ${styles.inputBg} ${theme === 'light' ? 'border-stone-300' : 'border-white/10'}`}
                           />
                       </div>
                    </div>
                  </div>
                ))}
                
                {config.rules.length > listLimit && (
                  <button 
                    onClick={() => setListLimit(l => l + 20)}
                    className={`w-full py-2 text-xs font-medium rounded ${styles.panelBg} ${styles.accentText} hover:opacity-80`}
                  >
                    Show {config.rules.length - listLimit} More Rules
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
        
        {/* Footer Actions: Share / Export / Import */}
        <div className={`mt-auto pt-4 border-t space-y-3 ${styles.divider}`}>
           <div className="grid grid-cols-5 gap-1">
              <button 
                onClick={handleShareLink}
                title="Copy Share Link"
                className={`flex flex-col items-center justify-center p-2 rounded text-[10px] gap-1 transition-colors ${theme === 'light' ? 'bg-stone-100 hover:bg-stone-200 text-stone-600' : 'bg-white/5 hover:bg-white/10 text-gray-300'}`}
              >
                 <LinkIcon className="w-4 h-4" /> Link
              </button>
              <button 
                onClick={handleCopyData}
                title="Copy Raw Data"
                className={`flex flex-col items-center justify-center p-2 rounded text-[10px] gap-1 transition-colors ${theme === 'light' ? 'bg-stone-100 hover:bg-stone-200 text-stone-600' : 'bg-white/5 hover:bg-white/10 text-gray-300'}`}
              >
                 <Copy className="w-4 h-4" /> Copy
              </button>
              <button 
                onClick={handlePasteData}
                title="Paste Data"
                className={`flex flex-col items-center justify-center p-2 rounded text-[10px] gap-1 transition-colors ${theme === 'light' ? 'bg-stone-100 hover:bg-stone-200 text-stone-600' : 'bg-white/5 hover:bg-white/10 text-gray-300'}`}
              >
                 <FileJson className="w-4 h-4" /> Paste
              </button>
              <button 
                onClick={handleExportJSON}
                title="Download JSON"
                className={`flex flex-col items-center justify-center p-2 rounded text-[10px] gap-1 transition-colors ${theme === 'light' ? 'bg-stone-100 hover:bg-stone-200 text-stone-600' : 'bg-white/5 hover:bg-white/10 text-gray-300'}`}
              >
                 <Download className="w-4 h-4" /> Save
              </button>
              <button 
                onClick={handleImportClick}
                title="Import JSON"
                className={`flex flex-col items-center justify-center p-2 rounded text-[10px] gap-1 transition-colors ${theme === 'light' ? 'bg-stone-100 hover:bg-stone-200 text-stone-600' : 'bg-white/5 hover:bg-white/10 text-gray-300'}`}
              >
                 <Upload className="w-4 h-4" /> Load
              </button>
           </div>
           
           <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileChange} 
              accept=".json" 
              className="hidden" 
            />

           <a href="#" className={`flex items-center gap-2 text-xs transition-colors justify-center ${styles.subtext} hover:opacity-100`}>
              <Github className="w-4 h-4" /> View Source
           </a>
        </div>
      </div>

      {/* Main View Area Title */}
      <div className="flex-1 p-8 flex justify-end items-start pointer-events-none">
        <div className="text-right">
            <h2 className={`text-4xl md:text-6xl font-black select-none ${styles.title}`}>{config.name}</h2>
             {activeTab === 'builder' && (
                <div className={`mt-2 inline-block px-3 py-1 rounded text-sm font-mono animate-pulse border ${theme === 'light' ? 'bg-amber-100 border-amber-300 text-amber-600' : 'bg-indigo-900/40 border-indigo-500/50 text-indigo-400'}`}>
                   BUILDER MODE ACTIVE
                </div>
             )}
        </div>
      </div>
    </div>
  );
};

export default UIOverlay;