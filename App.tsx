import React, { useState, Suspense, useCallback, useEffect, useRef, Component, ErrorInfo, ReactNode } from 'react';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import Particles from './components/Particles';
import Controls from './components/Controls';
import HandTracker from './components/HandTracker';
import Preloader from './components/Preloader';
import { ParticleConfig, ShapeType } from './types';

const SHAPES: ShapeType[] = ['nebula', 'saturn', 'heart', 'flower', 'meditator', 'cube'];

class HandTrackerErrorBoundary extends Component<{children: ReactNode}, {hasError: boolean}> {
  constructor(props: {children: ReactNode}) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(_: Error) {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("HandTracker Error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return null; // Fail silently so the rest of the app continues to work
    }
    return this.props.children;
  }
}

const CameraResetter = ({ trigger }: { trigger: number }) => {
  const { camera, controls } = useThree();
  
  useEffect(() => {
    if (trigger > 0) {
      // Reset camera to initial position
      camera.position.set(0, 0, 45);
      camera.lookAt(0, 0, 0);
      
      // Reset OrbitControls target if it exists
      if (controls) {
        (controls as any).target.set(0, 0, 0);
        (controls as any).update();
      }
    }
  }, [trigger, camera, controls]);
  
  return null;
};

const DEFAULT_CONFIG: ParticleConfig = {
  count: 100000,
  size: 0.05,
  color: '#FFD700',
  shape: 'nebula',
  expansion: 1.0,
  autoRotate: true,
  textValue: '',
  spacing: 1.0,
  shapeSize: 16.0,
  handRotation: { x: 0, y: 0 }
};

const FpsUpdater = ({ setFps }: { setFps: (fps: number) => void }) => {
  const frames = useRef(0);
  const prevTime = useRef(performance.now());

  useFrame(() => {
    frames.current++;
    const time = performance.now();
    if (time >= prevTime.current + 1000) {
      setFps(Math.round((frames.current * 1000) / (time - prevTime.current)));
      frames.current = 0;
      prevTime.current = time;
    }
  });
  return null;
};

const App: React.FC = () => {
  const [appState, setAppState] = useState<'preloader' | 'entering' | 'main'>('preloader');
  const [selectedSong, setSelectedSong] = useState<string | null>(null);
  const [handsDetected, setHandsDetected] = useState(false);
  const [resetTrigger, setResetTrigger] = useState(0);
  const [config, setConfig] = useState<ParticleConfig>(DEFAULT_CONFIG);
  const [fps, setFps] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);

  // Use a ref for high-frequency gesture data to prevent React re-renders
  const gestureRef = useRef({
    expansion: 1.0,
    rotX: 0,
    rotY: 0,
    rotZ: 0,
    x: 0,
    y: 0,
    isFist: false,
    isReset: false
  });
  
  const lastResetTime = useRef(0);

  const handlePreloaderComplete = (songId: string | null) => {
    setSelectedSong(songId);
    setAppState('entering');
    
    // Start audio slightly before transition finishes for a seamless feel
    if (songId && audioRef.current) {
      const songFiles: Record<string, string> = {
        'golden-hour': '/golden-hour.mp3',
        'interstellar': '/interstellar.mp3',
        'sailor-song': '/sailor-song.mp3',
        'her': '/her.mp3',
        'sweater-weather': '/sweatherweather.mp3',
        'finding-her': '/findingher.mp3',
        'ninna-notavu': '/ninnanotavu.mp3',
        'priya-phool': '/priyaphool.mp3'
      };
      
      audioRef.current.src = songFiles[songId] || '';
      audioRef.current.volume = 0;
      audioRef.current.play().catch(e => console.warn("Audio play failed:", e));
      
      // Fade in audio
      let vol = 0;
      const fadeInterval = setInterval(() => {
        vol += 0.05;
        if (vol >= 1) {
          clearInterval(fadeInterval);
          if (audioRef.current) audioRef.current.volume = 1;
        } else {
          if (audioRef.current) audioRef.current.volume = vol;
        }
      }, 100);
    }

    setTimeout(() => {
      setAppState('main');
    }, 800); // Wait for transition animation to finish
  };

  const lerp = (start: number, end: number, t: number) => {
    return start * (1 - t) + end * t;
  };

  // Callback for hand gesture updates
  const handleGestureUpdate = useCallback((gesture: { expansion: number | null, rotX: number | null, rotY: number | null, rotZ: number | null, x: number | null, y: number | null, isFist?: boolean, isReset?: boolean, swipeDirection?: 'left' | 'right' | null }) => {
    if (gesture.expansion !== null && gesture.expansion !== undefined) gestureRef.current.expansion = gesture.expansion;
    if (gesture.rotX !== null) gestureRef.current.rotX = gesture.rotX;
    if (gesture.rotY !== null) gestureRef.current.rotY = gesture.rotY;
    if (gesture.rotZ !== null) gestureRef.current.rotZ = gesture.rotZ;
    if (gesture.x !== null) gestureRef.current.x = gesture.x;
    if (gesture.y !== null) gestureRef.current.y = gesture.y;
    if (gesture.isFist !== undefined) gestureRef.current.isFist = gesture.isFist;
    if (gesture.isReset !== undefined) gestureRef.current.isReset = gesture.isReset;
    
    // Handle Swipe Gesture to change shapes
    if (gesture.swipeDirection) {
      setConfig(prev => {
        const currentIndex = SHAPES.indexOf(prev.shape);
        let nextIndex = currentIndex;
        
        if (gesture.swipeDirection === 'right') {
          // Swipe Left to Right -> Next shape
          nextIndex = Math.min(currentIndex + 1, SHAPES.length - 1);
        } else if (gesture.swipeDirection === 'left') {
          // Swipe Right to Left -> Previous shape
          nextIndex = Math.max(currentIndex - 1, 0);
        }
        
        if (nextIndex !== currentIndex) {
          return { ...prev, shape: SHAPES[nextIndex] };
        }
        return prev;
      });
    }

    // Handle Reset Gesture (Peace Sign) with a 2-second debounce
    if (gesture.isReset) {
      const now = Date.now();
      if (now - lastResetTime.current > 2000) {
        lastResetTime.current = now;
        setConfig(DEFAULT_CONFIG);
        setResetTrigger(prev => prev + 1);
        gestureRef.current = { expansion: 1.0, rotX: 0, rotY: 0, rotZ: 0, x: 0, y: 0, isFist: false, isReset: false };
      }
    }
  }, []);

  return (
    <div className="relative w-full h-screen bg-black overflow-hidden">
      {(appState === 'preloader' || appState === 'entering') && (
        <Preloader onComplete={handlePreloaderComplete} />
      )}
      
      {/* 3D Scene */}
      <div className={`absolute inset-0 transition-opacity duration-1000 ${appState === 'main' || appState === 'entering' ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
        <Canvas
          camera={{ position: [0, 0, 45], fov: 60 }} // Moved camera back slightly to fit larger text
          dpr={[1, 2]}
          gl={{ antialias: false, alpha: false }}
        >
          <FpsUpdater setFps={setFps} />
          <color attach="background" args={['#050505']} />
          
          <Suspense fallback={null}>
            <Particles config={config} handsDetected={handsDetected} gestureRef={gestureRef} />
          </Suspense>

          <CameraResetter trigger={resetTrigger} />

          <OrbitControls 
            makeDefault
            enableZoom={true} 
            enablePan={false} 
            minDistance={1} 
            maxDistance={500} 
            autoRotate={config.autoRotate && !handsDetected} 
            autoRotateSpeed={0.5} 
          />
        </Canvas>

        {/* User Interface */}
        <Controls 
          config={config} 
          onChange={setConfig} 
          handsDetected={handsDetected} 
          fps={fps}
          onReset={() => {
            setResetTrigger(prev => prev + 1);
            gestureRef.current = { expansion: 1.0, rotX: 0, rotY: 0, rotZ: 0, x: 0, y: 0, isFist: false, isReset: false };
          }}
        />

        {/* Logic Components */}
        <HandTrackerErrorBoundary>
          <HandTracker 
            onGestureUpdate={handleGestureUpdate} 
            onHandsDetected={setHandsDetected} 
          />
        </HandTrackerErrorBoundary>
      </div>

      {/* Audio Element (Hidden) */}
      <audio ref={audioRef} loop />
    </div>
  );
};

export default App;