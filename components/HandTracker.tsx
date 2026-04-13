import React, { useEffect, useRef, useState } from 'react';
import { Camera as CameraIcon, AlertCircle, X } from 'lucide-react';
import clsx from 'clsx';

interface HandTrackerProps {
  onGestureUpdate: (gesture: { zoomDelta?: number, rotX: number | null, rotY: number | null, rotZ: number | null, x: number | null, y: number | null, isFist?: boolean, isReset?: boolean, swipeDirection?: 'left' | 'right' | null }) => void;
  onHandsDetected: (detected: boolean) => void;
}

const HandTracker: React.FC<HandTrackerProps> = ({ onGestureUpdate, onHandsDetected }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // Keep references to clean up
  const cameraRef = useRef<any>(null);
  const handsRef = useRef<any>(null);
  
  // State for swipe detection
  const swipeState = useRef({
      startX: 0,
      startTime: 0,
      isOpen: false,
      cooldown: 0
  });
  
  // State for mode locking and smoothing
  const modeState = useRef({
      currentMode: 'idle',
      detectedMode: 'idle',
      confidence: 0
  });

  const prevPinchDist = useRef<number | null>(null);

  const stopCamera = () => {
    if (cameraRef.current) {
        try {
             // Stop the tracks to release the camera light
             const stream = videoRef.current?.srcObject as MediaStream;
             if (stream) {
                 stream.getTracks().forEach(track => track.stop());
             }
             if (cameraRef.current.stop) {
                 cameraRef.current.stop();
             }
        } catch(e) {
            console.warn("Error stopping stream tracks", e);
        }
        cameraRef.current = null;
    }
    if (handsRef.current) {
        try {
            handsRef.current.close();
        } catch(e) {
            console.warn("Error closing hands", e);
        }
        handsRef.current = null;
    }
    setCameraActive(false);
    onHandsDetected(false);
  };

  const startCamera = async () => {
    if (cameraActive || isLoading) return;
    
    setIsLoading(true);
    setCameraError(null);

    try {
        // Wait for libraries to load
        let retries = 0;
        while ((!window.Hands || !window.Camera) && retries < 20) {
            await new Promise(resolve => setTimeout(resolve, 500));
            retries++;
        }

        if (!window.Hands || !window.Camera) {
            throw new Error("Gesture libraries failed to load. Please check your connection.");
        }

        const hands = new window.Hands({
            locateFile: (file: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
        });

        hands.setOptions({
            maxNumHands: 2,
            modelComplexity: 1,
            minDetectionConfidence: 0.65,
            minTrackingConfidence: 0.65
        });

        hands.onResults((results: any) => {
            // Draw landmarks
            if (canvasRef.current && videoRef.current) {
                const canvasCtx = canvasRef.current.getContext('2d');
                if (canvasCtx) {
                    canvasCtx.save();
                    canvasCtx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
                    // The video is mirrored via CSS, so we need to mirror the canvas drawing too
                    canvasCtx.translate(canvasRef.current.width, 0);
                    canvasCtx.scale(-1, 1);
                    
                    if (results.multiHandLandmarks) {
                        for (const landmarks of results.multiHandLandmarks) {
                            if (window.drawConnectors && window.HAND_CONNECTIONS) {
                                window.drawConnectors(canvasCtx, landmarks, window.HAND_CONNECTIONS, {color: '#00FF00', lineWidth: 5});
                            }
                            if (window.drawLandmarks) {
                                window.drawLandmarks(canvasCtx, landmarks, {color: '#FF0000', lineWidth: 2, radius: 4});
                            }
                        }
                    }
                    canvasCtx.restore();
                }
            }

            if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
                onHandsDetected(true);
                const landmarks = results.multiHandLandmarks;
                let factor = 1.0;

                // --- ADVANCED GESTURE SYSTEM ---
                const hand = landmarks[0];
                const wrist = hand[0];
                const thumbTip = hand[4];
                const indexTip = hand[8];

                // 1. Finger Extension Detection (for Hand 1)
                const isExtended = (tipIdx: number, mcpIdx: number) => {
                    const tip = hand[tipIdx];
                    const mcp = hand[mcpIdx];
                    const distTip = Math.sqrt(Math.pow(tip.x - wrist.x, 2) + Math.pow(tip.y - wrist.y, 2));
                    const distMcp = Math.sqrt(Math.pow(mcp.x - wrist.x, 2) + Math.pow(mcp.y - wrist.y, 2));
                    return distTip > distMcp * 1.2;
                };
                
                const indexExt = isExtended(8, 5);
                const middleExt = isExtended(12, 9);
                const ringExt = isExtended(16, 13);
                const pinkyExt = isExtended(20, 17);
                
                // Thumb extension (using joint 2 as MCP equivalent)
                const thumbDistTip = Math.sqrt(Math.pow(hand[4].x - wrist.x, 2) + Math.pow(hand[4].y - wrist.y, 2));
                const thumbDistMcp = Math.sqrt(Math.pow(hand[2].x - wrist.x, 2) + Math.pow(hand[2].y - wrist.y, 2));
                const thumbExt = thumbDistTip > thumbDistMcp * 1.2;

                // 2. Determine Raw Mode (Strict Priority)
                let rawMode = 'idle';
                if (landmarks.length >= 2) {
                    rawMode = 'two_hand_rotate';
                } else if (thumbExt && indexExt && middleExt && ringExt && pinkyExt) {
                    rawMode = 'swipe'; // Open Palm
                } else if (!thumbExt && !indexExt && !middleExt && !ringExt && !pinkyExt) {
                    rawMode = 'snappy_rotate'; // Fist (All Curled)
                } else if (indexExt && middleExt && !ringExt && !pinkyExt) {
                    rawMode = 'reset'; // Peace Sign (Index + Middle, thumb doesn't matter)
                } else if (thumbExt && indexExt && !middleExt && !ringExt && !pinkyExt) {
                    rawMode = 'zoom'; // Index + Thumb Pinch (Others Curled)
                } else {
                    rawMode = 'idle'; // Default (Relaxed/Mixed)
                }

                // 3. Mode Smoothing (Debounce to prevent flicker)
                if (rawMode === modeState.current.detectedMode) {
                    modeState.current.confidence++;
                } else {
                    modeState.current.detectedMode = rawMode;
                    modeState.current.confidence = 1;
                }

                // Lock in mode after 3 consistent frames for stability (reduced from 5 to prevent getting stuck)
                if (modeState.current.confidence > 2) {
                    modeState.current.currentMode = rawMode;
                }
                
                // FORCE exit two_hand_rotate if we lose a hand
                if (landmarks.length < 2 && modeState.current.currentMode === 'two_hand_rotate') {
                    modeState.current.currentMode = 'idle';
                }

                const activeMode = modeState.current.currentMode;

                // 4. Calculate Outputs based ONLY on Active Mode (Locking Logic)
                // Default to resetting values when not actively performing the gesture
                let outZoomDelta = 0; 
                let outRotX: number | null = 0;
                let outRotY: number | null = 0;
                let outRotZ: number | null = 0;
                let outSwipe: 'left' | 'right' | null = null;
                let outReset = false;
                let outFist = activeMode === 'snappy_rotate';

                const x = -(wrist.x - 0.5) * 2;
                const y = -(wrist.y - 0.5) * 2;

                if (activeMode === 'two_hand_rotate' && landmarks.length >= 2) {
                    const hand1 = landmarks[0][0]; // wrist 1
                    const hand2 = landmarks[1][0]; // wrist 2
                    
                    // Sort hands left to right
                    const leftHand = hand1.x < hand2.x ? hand1 : hand2;
                    const rightHand = hand1.x < hand2.x ? hand2 : hand1;
                    
                    const cx = (leftHand.x + rightHand.x) / 2;
                    const cy = (leftHand.y + rightHand.y) / 2;
                    
                    const dx = rightHand.x - leftHand.x;
                    const dy = rightHand.y - leftHand.y;
                    
                    // Yaw (Y-axis rotation): based on horizontal center
                    let dxCenter = cx - 0.5;
                    const deadzone = 0.05;
                    if (Math.abs(dxCenter) < deadzone) dxCenter = 0;
                    else dxCenter = dxCenter > 0 ? dxCenter - deadzone : dxCenter + deadzone;
                    outRotY = -dxCenter * Math.PI * 3.0;
                    
                    // Pitch (X-axis rotation): based on vertical center
                    let dyCenter = cy - 0.5;
                    if (Math.abs(dyCenter) < deadzone) dyCenter = 0;
                    else dyCenter = dyCenter > 0 ? dyCenter - deadzone : dyCenter + deadzone;
                    const maxPitch = Math.PI / 3.0;
                    let rotX = -dyCenter * Math.PI * 2.0;
                    outRotX = Math.max(-maxPitch, Math.min(maxPitch, rotX));
                    
                    // Roll (Z-axis rotation): based on angle between hands
                    // If right hand is higher (smaller y), dy is negative, angle is negative.
                    // We want object to tilt left (counter-clockwise), which is positive Z rotation.
                    const angle = Math.atan2(dy, dx);
                    outRotZ = -angle;
                    
                } else if (activeMode === 'zoom') {
                    const dxPinch = thumbTip.x - indexTip.x;
                    const dyPinch = thumbTip.y - indexTip.y;
                    const pinchDist = Math.sqrt(dxPinch*dxPinch + dyPinch*dyPinch);
                    if (prevPinchDist.current !== null) {
                        let delta = pinchDist - prevPinchDist.current;
                        if (Math.abs(delta) < 0.003) delta = 0; // Deadzone to prevent jitter
                        outZoomDelta = delta;
                    }
                    prevPinchDist.current = pinchDist;
                } else if (activeMode === 'swipe') {
                    prevPinchDist.current = null;
                    const now = Date.now();
                    if (now > swipeState.current.cooldown) {
                        if (!swipeState.current.isOpen) {
                            swipeState.current.isOpen = true;
                            swipeState.current.startX = x;
                            swipeState.current.startTime = now;
                        } else {
                            const dx = x - swipeState.current.startX;
                            const dt = now - swipeState.current.startTime;

                            if (dt < 1000) { // Must complete swipe within 1 second
                                if (dx > 0.7) {
                                    outSwipe = 'right';
                                    swipeState.current.cooldown = now + 1000;
                                    swipeState.current.isOpen = false;
                                } else if (dx < -0.7) {
                                    outSwipe = 'left';
                                    swipeState.current.cooldown = now + 1000;
                                    swipeState.current.isOpen = false;
                                }
                            } else {
                                swipeState.current.startX = x;
                                swipeState.current.startTime = now;
                            }
                        }
                    }
                } else if (activeMode === 'reset') {
                    outReset = true;
                }

                // If not in swipe mode, reset swipe anchor
                if (activeMode !== 'swipe') {
                    swipeState.current.isOpen = false;
                }
                
                if (activeMode !== 'zoom') {
                    prevPinchDist.current = null;
                }

                // Send all data. Null values will be ignored by App.tsx, locking their last state.
                onGestureUpdate({ zoomDelta: outZoomDelta, rotX: outRotX, rotY: outRotY, rotZ: outRotZ, x, y, isFist: outFist, isReset: outReset, swipeDirection: outSwipe });
            } else {
                onHandsDetected(false);
                prevPinchDist.current = null;
            }
        });
        
        handsRef.current = hands;

        if (videoRef.current) {
            const camera = new window.Camera(videoRef.current, {
                onFrame: async () => {
                    if (videoRef.current && handsRef.current) {
                        try {
                            await handsRef.current.send({ image: videoRef.current });
                        } catch (e: any) {
                            // Ignore "SolutionWasm instance already deleted" errors during unmount
                            if (!e.toString().includes("already deleted")) {
                                console.warn("Error sending image to Hands:", e);
                            }
                        }
                    }
                },
                width: 640,
                height: 480
            });
            
            cameraRef.current = camera;
            
            await camera.start();
            setCameraActive(true);
        }

    } catch (err: any) {
        console.error("Camera init error:", err);
        let errMsg = "Failed to access camera. Please check your connection and permissions.";
        const errStr = err.toString();
        
        if (err.name === 'NotAllowedError' || errStr.includes('Permission denied')) {
            errMsg = "Camera access denied. Please allow camera permissions in your browser settings.";
        } else if (err.name === 'NotReadableError' || errStr.includes('Device in use') || errStr.includes('track')) {
            errMsg = "Camera is currently in use by another application (e.g., Zoom, another tab). Please close it and try again.";
        } else if (err.name === 'NotFoundError') {
            errMsg = "No camera device found on this system.";
        } else if (err.message) {
            errMsg = err.message;
        }
        
        setCameraError(errMsg);
    } finally {
        setIsLoading(false);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
      return () => stopCamera();
  }, []);

  return (
    <div className="absolute bottom-6 right-6 z-50 flex flex-col items-end">
       {/* Error Message */}
       {cameraError && (
        <div className="bg-red-500/10 backdrop-blur-md border border-red-500/50 text-red-200 px-4 py-3 rounded-lg mb-4 max-w-xs flex items-start gap-3 shadow-lg animate-in slide-in-from-right">
            <AlertCircle size={18} className="mt-0.5 shrink-0" />
            <div className="text-xs">
                <p className="font-bold mb-1">Camera Error</p>
                <p>{cameraError}</p>
                <button 
                    onClick={startCamera}
                    className="mt-2 bg-red-500/20 hover:bg-red-500/30 text-white px-3 py-1 rounded text-xs transition-colors"
                >
                    Try Again
                </button>
            </div>
            <button onClick={() => setCameraError(null)} className="text-white/50 hover:text-white"><X size={14} /></button>
        </div>
      )}

      {/* Video / Control */}
      <div className={`
        relative overflow-hidden transition-all duration-500 ease-in-out shadow-2xl
        ${cameraActive ? 'w-48 h-36 rounded-xl border-2 border-green-500/50' : 'w-12 h-12 rounded-full border border-white/20 bg-black/40 hover:bg-white/10 cursor-pointer'}
      `}>
          <video 
              ref={videoRef} 
              className={clsx("w-full h-full object-cover transform -scale-x-100", !cameraActive && "opacity-0 absolute pointer-events-none")} 
              playsInline 
              muted
          />
          <canvas
              ref={canvasRef}
              className={clsx("absolute inset-0 w-full h-full pointer-events-none z-10", !cameraActive && "opacity-0")}
              width={640}
              height={480}
          />
          {cameraActive ? (
            <>
                <button 
                    onClick={stopCamera}
                    className="absolute top-2 right-2 p-1.5 bg-black/50 text-white/70 hover:text-white rounded-full backdrop-blur-sm transition-colors z-10"
                    title="Stop Camera"
                >
                    <X size={12} />
                </button>
                <div className="absolute bottom-0 left-0 w-full text-center bg-gradient-to-t from-black/90 to-transparent text-[10px] text-green-400 font-mono py-1.5 pointer-events-none">
                    TRACKING ACTIVE
                </div>
            </>
          ) : (
             <button 
                onClick={startCamera}
                disabled={isLoading}
                className="absolute inset-0 w-full h-full flex items-center justify-center text-white/80"
                title="Enable Hand Gestures"
             >
                {isLoading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                    <CameraIcon size={20} />
                )}
             </button>
          )}
      </div>
      
      {!cameraActive && !cameraError && (
          <div className="mt-2 text-[10px] text-white/40 font-mono uppercase tracking-widest mr-2 select-none">
              Enable Gestures
          </div>
      )}
    </div>
  );
};

export default HandTracker;