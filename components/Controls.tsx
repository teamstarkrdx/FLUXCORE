import React, { useState } from 'react';
import { ParticleConfig, ShapeType } from '../types';
import { Heart, Flower, Box, Globe, User, Disc, Type, Settings2, X, Info } from 'lucide-react';
import clsx from 'clsx';

interface ControlsProps {
  config: ParticleConfig;
  onChange: (newConfig: ParticleConfig) => void;
  handsDetected: boolean;
  onReset: () => void;
  fps: number;
}

const Controls: React.FC<ControlsProps> = ({ config, onChange, handsDetected, onReset, fps }) => {
  const [localText, setLocalText] = useState('');
  const [isConfigOpen, setIsConfigOpen] = useState(true);
  const [isInfoOpen, setIsInfoOpen] = useState(false);
  
  const handleChange = (key: keyof ParticleConfig, value: any) => {
    onChange({ ...config, [key]: value });
  };

  const applyText = () => {
    if (localText.trim().length > 0) {
      onChange({ ...config, shape: 'text', textValue: localText });
    }
  };

  const handleReset = () => {
    onChange({
      ...config,
      size: 0.05,
      color: '#00FFFF',
      shape: 'nebula',
      expansion: 1.0,
      autoRotate: true,
      textValue: '',
      spacing: 1.0,
      shapeSize: 16.0,
      handRotation: { x: 0, y: 0 }
    });
    setLocalText('');
    onReset();
  };

  const shapes: { id: ShapeType; icon: React.ReactNode; label: string }[] = [
    { id: 'nebula', icon: <Globe size={18} />, label: 'Nebula' },
    { id: 'saturn', icon: <Disc size={18} />, label: 'Saturn' },
    { id: 'heart', icon: <Heart size={18} />, label: 'Love' },
    { id: 'flower', icon: <Flower size={18} />, label: 'Flora' },
    { id: 'meditator', icon: <User size={18} />, label: 'Zen' },
    { id: 'cube', icon: <Box size={18} />, label: 'Tesseract' },
  ];

  return (
    <>
      {/* Top Right: Settings Panel */}
      <div className="absolute top-6 right-6 flex flex-col gap-4 z-40 items-end">
        <div className="flex gap-3">
          <button 
            onClick={() => setIsInfoOpen(true)}
            className="bg-black/40 backdrop-blur-xl border border-white/10 p-3 rounded-full shadow-2xl transition-all hover:bg-black/50 text-white/80 hover:text-white"
            title="Information & Gestures"
          >
            <Info size={20} />
          </button>
          <button 
            onClick={() => setIsConfigOpen(!isConfigOpen)}
            className="bg-black/40 backdrop-blur-xl border border-white/10 p-3 rounded-full shadow-2xl transition-all hover:bg-black/50 text-white/80 hover:text-white"
          >
            {isConfigOpen ? <X size={20} /> : <Settings2 size={20} />}
          </button>
        </div>

        <div className={clsx(
          "bg-black/40 backdrop-blur-xl border border-white/10 p-5 rounded-2xl w-72 shadow-2xl transition-all duration-300 origin-top-right max-h-[75vh] overflow-y-auto custom-scrollbar",
          isConfigOpen ? "scale-100 opacity-100" : "scale-95 opacity-0 pointer-events-none"
        )}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-white font-bold tracking-tight text-sm uppercase opacity-80">Configuration</h2>
            <div className="flex items-center gap-3">
              <button 
                onClick={handleReset}
                className="text-[10px] text-white/50 hover:text-white uppercase tracking-wider transition-colors bg-white/5 hover:bg-white/10 px-2 py-1 rounded border border-white/10"
              >
                Reset
              </button>
              <div className={clsx("w-2 h-2 rounded-full animate-pulse", handsDetected ? "bg-green-500" : "bg-red-500")} />
            </div>
          </div>

          {/* Color Picker */}
          <div className="mb-6">
            <label className="text-xs text-white/50 font-mono mb-2 block">PARTICLE HUE</label>
            <div className="flex gap-2 flex-wrap">
              {['#FFD700', '#FF0000', '#00FFFF', '#7000FF', '#FF00FF', '#0066FF'].map((c) => (
                <button
                  key={c}
                  onClick={() => handleChange('color', c)}
                  className={clsx(
                    "w-8 h-8 rounded-full border-2 transition-transform hover:scale-110",
                    config.color === c ? "border-white scale-110 shadow-[0_0_10px_currentColor]" : "border-transparent opacity-50 hover:opacity-100"
                  )}
                  style={{ backgroundColor: c, color: c }}
                />
              ))}
              <input
                 type="color"
                 value={config.color}
                 onChange={(e) => handleChange('color', e.target.value)}
                 className="w-8 h-8 rounded-full overflow-hidden opacity-50 hover:opacity-100 cursor-pointer border-0 p-0"
              />
            </div>
          </div>

          {/* Name/Text Input Section */}
          <div className="mb-6">
             <label className="text-xs text-white/50 font-mono mb-2 block">VISUALIZE NAME</label>
             <div className="flex gap-2">
               <input 
                 type="text" 
                 value={localText}
                 onChange={(e) => setLocalText(e.target.value)}
                 onKeyDown={(e) => e.key === 'Enter' && applyText()}
                 placeholder="Enter Name..."
                 className="flex-1 bg-white/10 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-white/50"
               />
               <button 
                 onClick={applyText}
                 className="bg-white/10 hover:bg-white/20 border border-white/10 text-white p-2 rounded-lg transition-colors"
                 title="Apply Text"
               >
                 <Type size={16} />
               </button>
             </div>
          </div>

          {/* Sliders (Removed Density) */}
          <div className="space-y-5">
            <div>
              <div className="flex justify-between text-xs text-white/60 font-mono mb-1">
                <span>SIZE</span>
                <span>{config.size.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="0.05"
                max="0.5" // Reduced max size for "dust" feel
                step="0.01"
                value={config.size}
                onChange={(e) => handleChange('size', parseFloat(e.target.value))}
                className="w-full h-1 bg-white/20 rounded-lg appearance-none cursor-pointer accent-white hover:accent-blue-400"
              />
            </div>

            <div>
              <div className="flex justify-between items-center text-xs text-white/60 font-mono mb-1">
                <span>AUTO ROTATE</span>
                <button 
                  onClick={() => handleChange('autoRotate', !config.autoRotate)}
                  className={clsx(
                    "px-3 py-1 rounded-full border transition-colors",
                    config.autoRotate ? "bg-white text-black border-white" : "bg-transparent text-white/60 border-white/20"
                  )}
                >
                  {config.autoRotate ? 'ON' : 'OFF'}
                </button>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs text-white/60 font-mono mb-1">
                <span>SPACING</span>
                <span>{config.spacing.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="0.1"
                max="5.0"
                step="0.1"
                value={config.spacing}
                onChange={(e) => handleChange('spacing', parseFloat(e.target.value))}
                className="w-full h-1 bg-white/20 rounded-lg appearance-none cursor-pointer accent-white hover:accent-blue-400"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs text-white/60 font-mono mb-1">
                <span>SHAPE SIZE</span>
                <span>{config.shapeSize.toFixed(1)}</span>
              </div>
              <input
                type="range"
                min="5"
                max="50"
                step="1"
                value={config.shapeSize}
                onChange={(e) => handleChange('shapeSize', parseFloat(e.target.value))}
                className="w-full h-1 bg-white/20 rounded-lg appearance-none cursor-pointer accent-white hover:accent-blue-400"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Center: Shape Selector */}
      <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 z-40 max-w-full overflow-x-auto px-4 no-scrollbar">
        <div className="flex items-center gap-2 bg-black/40 backdrop-blur-md border border-white/10 p-2 rounded-full shadow-2xl min-w-max">
          {shapes.map((s) => (
            <button
              key={s.id}
              onClick={() => handleChange('shape', s.id)}
              className={clsx(
                "flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-300 text-sm font-medium",
                config.shape === s.id
                  ? "bg-white text-black shadow-[0_0_20px_rgba(255,255,255,0.3)] scale-105"
                  : "text-white/60 hover:text-white hover:bg-white/10"
              )}
            >
              {s.icon}
              <span className={clsx(config.shape === s.id ? "block" : "hidden sm:block")}>{s.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Intro / Status Text */}
      <div className="absolute top-6 left-6 pointer-events-none select-none z-30">
        <h1 className="text-4xl font-black text-white tracking-tighter uppercase drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]">
          Flux<span style={{ color: config.color }}>Core</span>
        </h1>
        <div className="flex items-center gap-2 mt-2">
           <div className={clsx("w-1.5 h-1.5 rounded-full", handsDetected ? "bg-green-400 animate-pulse" : "bg-white/30")} />
           <p className="text-white/50 text-[10px] font-mono tracking-widest uppercase">
             {handsDetected ? "HAND TRACKING ACTIVE" : "WAITING FOR CAMERA..."} | {fps} FPS
           </p>
        </div>
        {handsDetected && (
           <p className="text-green-400/80 text-[10px] font-mono mt-1 animate-in fade-in slide-in-from-left-2">
             PINCH FINGERS TO ZOOM | OPEN PALM TO SWIPE | TWO HANDS TO ROTATE
           </p>
        )}
      </div>
      {/* Info Modal */}
      {isInfoOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-[#111] border border-white/10 rounded-2xl p-6 md:p-8 max-w-lg w-full shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
            <button 
              onClick={() => setIsInfoOpen(false)}
              className="absolute top-4 right-4 text-white/50 hover:text-white transition-colors"
            >
              <X size={24} />
            </button>
            
            <h2 className="text-2xl font-black text-white mb-6 uppercase tracking-tight">System Manual</h2>
            
            <div className="space-y-6 text-sm text-white/80 max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar">
              
              <section>
                <h3 className="text-white font-bold mb-2 text-base border-b border-white/10 pb-1">Hand Gestures (Strict Modes)</h3>
                <p className="text-xs text-white/60 mb-3 leading-relaxed">Only ONE gesture can be active at a time. When a specific gesture is detected, all other controls are locked to ensure stability.</p>
                <ul className="list-disc pl-5 space-y-3">
                  <li><strong className="text-white">Idle (Relaxed Hand):</strong> If your hand is relaxed and not making a specific gesture, all movement locks perfectly still.</li>
                  <li><strong className="text-white">Rotate (Two Hands):</strong> Hold up <strong>both hands</strong>. Move them up/down to pitch, left/right to turn, or twist them like a steering wheel to roll the object.</li>
                  <li><strong className="text-white">Zoom (Index + Thumb):</strong> Extend only your index and thumb on one hand. Pinch them together or apart to zoom.</li>
                  <li><strong className="text-white">Swipe Shapes (Open Palm):</strong> With all 5 fingers fully extended on one hand, wave left or right to switch between shapes.</li>
                  <li><strong className="text-white">Reset (Peace Sign):</strong> Hold up a peace sign (index and middle fingers extended) to instantly reset the scene and camera.</li>
                  <li><strong className="text-white">Nebula Interaction:</strong> The gravitational repel effect only works with the <strong>mouse pointer</strong>. When using hand tracking, physics are disabled so you have perfect control.</li>
                </ul>
              </section>

              <section>
                <h3 className="text-white font-bold mb-2 text-base border-b border-white/10 pb-1">Tips for Stability</h3>
                <ul className="list-disc pl-5 space-y-2">
                  <li>Ensure you are in a <strong>well-lit room</strong>.</li>
                  <li>Try to have a relatively <strong>plain background</strong> behind you.</li>
                  <li>Keep your hands fully visible within the camera frame.</li>
                  <li>Check the camera panel in the bottom right: the green skeleton shows exactly what the AI sees.</li>
                </ul>
              </section>

              <section>
                <h3 className="text-white font-bold mb-2 text-base border-b border-white/10 pb-1">Future Roadmap</h3>
                <p className="mb-2 text-white/60 italic">These advanced physics features are planned for future updates:</p>
                <ul className="list-disc pl-5 space-y-2 text-white/60">
                  <li><strong>Spring-Damper Systems (Hooke's Law):</strong> Giving objects physical weight and elasticity when grabbed.</li>
                  <li><strong>Inertia & Residual Velocity:</strong> Letting objects glide and spin naturally after you let go.</li>
                  <li><strong>Dynamic Grip Strength:</strong> Adjusting physics based on how tightly you close your fist.</li>
                </ul>
              </section>

            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Controls;