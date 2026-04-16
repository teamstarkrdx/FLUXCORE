import React, { useRef, useMemo, useEffect } from 'react';
import { useFrame, useThree, extend } from '@react-three/fiber';
import * as THREE from 'three';
import { shaderMaterial } from '@react-three/drei';
import { ParticleConfig } from '../types';
import { 
  getCubePoint, 
  getFlowerPoint, 
  getHeartPoint, 
  getMeditatorPoint, 
  getRandomPointInSphere, 
  getSaturnPoint,
  getCustomPoint,
  getTextPoints,
  getNebulaPoint
} from '../utils/geometry';

interface ParticlesProps {
  config: ParticleConfig;
  handsDetected?: boolean;
  gestureRef?: React.MutableRefObject<{ expansion: number, rotX: number, rotY: number, rotZ: number, x: number, y: number, isFist: boolean, isReset: boolean }>;
}

// --- CUSTOM SHADER MATERIAL ---
const ParticleShaderMaterial = shaderMaterial(
  {
    uTime: 0,
    uColor: new THREE.Color(0.0, 0.0, 0.0),
    uPixelRatio: 1,
    uSize: 10,
  },
  // Vertex Shader
  `
    uniform float uTime;
    uniform float uPixelRatio;
    uniform float uSize;
    
    attribute float aRandom;
    
    varying vec3 vPosition;
    varying float vRandom;
    varying float vDepth;

    void main() {
      vPosition = position;
      vRandom = aRandom;

      vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
      vDepth = -mvPosition.z;
      gl_Position = projectionMatrix * mvPosition;
      
      // Breathing effect
      float breathe = 0.8 + sin(uTime * 1.5 + aRandom * 15.0) * 0.4;
      gl_PointSize = uSize * uPixelRatio * breathe * (1.0 / -mvPosition.z);
    }
  `,
  // Fragment Shader
  `
    uniform vec3 uColor;
    
    void main() {
      vec2 center = gl_PointCoord - vec2(0.5);
      float dist = length(center);
      if (dist > 0.5) discard;
      
      // Solid round tiny dust with slight anti-aliasing
      float alpha = smoothstep(0.5, 0.45, dist);
      gl_FragColor = vec4(uColor, alpha);
    }
  `
);

extend({ ParticleShaderMaterial });

const Particles: React.FC<ParticlesProps> = ({ config, handsDetected = false, gestureRef }) => {
  const pointsRef = useRef<THREE.Points>(null);
  const materialRef = useRef<any>(null);
  
  const currentAnim = useRef({ expansion: 1.0, rotX: 0, rotY: 0, rotZ: 0, rotVelX: 0, rotVelY: 0, rotVelZ: 0 });
  
  const count = config.count;
  
  // Buffers
  const { currentPositions, targetPositions, randoms, originalRandoms } = useMemo(() => {
    const curPos = new Float32Array(count * 3);
    const tarPos = new Float32Array(count * 3);
    const rnd = new Float32Array(count); 
    const origRnd = new Float32Array(count * 3); 

    for (let i = 0; i < count; i++) {
      const pt = getRandomPointInSphere(10);
      curPos[i*3] = pt.x;
      curPos[i*3+1] = pt.y;
      curPos[i*3+2] = pt.z;
      
      tarPos[i*3] = pt.x;
      tarPos[i*3+1] = pt.y;
      tarPos[i*3+2] = pt.z;

      rnd[i] = Math.random();
      origRnd[i*3] = Math.random() - 0.5;
      origRnd[i*3+1] = Math.random() - 0.5;
      origRnd[i*3+2] = Math.random() - 0.5;
    }

    return { 
      currentPositions: curPos, 
      targetPositions: tarPos, 
      randoms: rnd,
      originalRandoms: origRnd
    };
  }, [count]);

  // Update target positions based on shape/text
  useEffect(() => {
    let textPoints: {x:number, y:number, z:number}[] = [];
    let isTextMode = config.shape === 'text' && config.textValue && config.textValue.length > 0;
    
    if (isTextMode) {
      // Scale 9.0 for VERY LARGE text
      textPoints = getTextPoints(config.textValue, 9.0 * (config.shapeSize / 16.0)); 
    }

    for (let i = 0; i < count; i++) {
      let pt = { x: 0, y: 0, z: 0 };
      const scale = config.shapeSize; 

      if (isTextMode) {
        if (i < textPoints.length) {
          // Point belongs to the text
          pt = textPoints[i];
        } else {
          // Scattered, unattached background particles (starfield)
          const theta = Math.random() * Math.PI * 2;
          const phi = Math.acos((Math.random() * 2) - 1);
          
          // Wide distribution for a deep space feel
          const radius = 20 + 780 * Math.cbrt(Math.random()); 
          
          pt = {
            x: radius * Math.sin(phi) * Math.cos(theta),
            y: radius * Math.sin(phi) * Math.sin(theta),
            z: radius * Math.cos(phi) - 20 // Push back so text is readable
          };
        }
      } else {
        // Standard Shape Logic
        switch (config.shape) {
          case 'custom': pt = getCustomPoint(scale); break;
          case 'heart': pt = getHeartPoint(scale); break;
          case 'flower': pt = getFlowerPoint(scale); break;
          case 'saturn': pt = getSaturnPoint(scale); break;
          case 'meditator': pt = getMeditatorPoint(scale); break;
          case 'cube': pt = getCubePoint(scale); break;
          case 'nebula': pt = getNebulaPoint(scale); break;
          case 'sphere':
          default: pt = getRandomPointInSphere(scale); break;
        }
      }

      targetPositions[i*3] = pt.x * config.spacing;
      targetPositions[i*3+1] = pt.y * config.spacing;
      targetPositions[i*3+2] = pt.z * config.spacing;
    }
  }, [config.shape, config.textValue, config.spacing, config.shapeSize, count, targetPositions]);


  const { mouse, viewport } = useThree();

  useFrame((state) => {
    if (!pointsRef.current || !materialRef.current) return;

    // --- PHYSICS UPDATE (CPU) ---
    const geometry = pointsRef.current.geometry;
    const positionAttribute = geometry.getAttribute('position') as THREE.BufferAttribute;
    const posArray = positionAttribute.array as Float32Array;
    
    const time = state.clock.getElapsedTime();
    const speed = 0.7; // Slightly slowed down from 1.0
    
    // Smoothly interpolate animation state at 60fps
    if (handsDetected && gestureRef) {
      const targetExp = gestureRef.current.expansion;
      const lerpSpeed = gestureRef.current.isFist ? 0.15 : 0.08; // Responsive and snappy (60-70% feel)
      currentAnim.current.expansion += (targetExp - currentAnim.current.expansion) * lerpSpeed;

      // Advanced Momentum Physics for Rotation
      const targetRotX = gestureRef.current.rotX;
      const targetRotY = gestureRef.current.rotY;
      const targetRotZ = gestureRef.current.rotZ;
      
      // Direct lerp for flawless 1:1 syncing without malfunctions or stutter
      currentAnim.current.rotX += (targetRotX - currentAnim.current.rotX) * 0.15;
      currentAnim.current.rotY += (targetRotY - currentAnim.current.rotY) * 0.15;
      currentAnim.current.rotZ += (targetRotZ - currentAnim.current.rotZ) * 0.15;
    } else {
      // Return to config defaults if no hands
      currentAnim.current.expansion += (config.expansion - currentAnim.current.expansion) * 0.05;
      
      // If no hands, let momentum carry it for a bit before auto-rotation takes over
      currentAnim.current.rotVelX *= 0.95;
      currentAnim.current.rotVelY *= 0.95;
      currentAnim.current.rotVelZ *= 0.95;
      currentAnim.current.rotX += currentAnim.current.rotVelX;
      currentAnim.current.rotY += currentAnim.current.rotVelY;
      currentAnim.current.rotZ += currentAnim.current.rotVelZ;
    }

    const expansion = currentAnim.current.expansion;
    
    // Smoothness factor - increased to 0.2 for fast, non-laggy transitions (as it was before)
    const baseLerp = 0.2 * speed;

    // Mouse interaction for nebula
    let interactX = (mouse.x * viewport.width) / 2;
    let interactY = (mouse.y * viewport.height) / 2;
    
    // Disable gravitational repel physics when hands are detected
    const applyRepelPhysics = !handsDetected;
    
    const isNebula = config.shape === 'nebula';

    for (let i = 0; i < count; i++) {
      const idx = i * 3;
      
      let x = posArray[idx];
      let y = posArray[idx+1];
      let z = posArray[idx+2];

      // Base Target
      let tx = targetPositions[idx] * expansion;
      let ty = targetPositions[idx+1] * expansion;
      let tz = targetPositions[idx+2] * expansion;

      // --- DYNAMIC ALIVENESS ---
      const rndX = originalRandoms[idx];
      const rndY = originalRandoms[idx+1];
      const rndZ = originalRandoms[idx+2];

      // Orbital Drift
      const driftSpeed = time * 0.5 * speed;
      const driftRadius = 0.3 * expansion; 
      
      tx += Math.sin(driftSpeed + rndX * 10.0) * driftRadius;
      ty += Math.cos(driftSpeed + rndY * 10.0) * driftRadius;
      tz += Math.sin(driftSpeed + rndZ * 10.0) * driftRadius;

      // Flow Field (Gentle wave)
      const wave = Math.sin(tx * 0.2 + time) * 0.2;
      ty += wave;

      // Nebula Interaction
      if (isNebula) {
        // --- INTERACTION (Mouse Only) ---
        if (applyRepelPhysics) {
          const dxInteract = x - interactX;
          const dyInteract = y - interactY;
          const distInteractSq = dxInteract * dxInteract + dyInteract * dyInteract;
          
          const interactionRadiusSq = 15000.0; // Fully interactive across the entire view
          if (distInteractSq < interactionRadiusSq) { 
            const force = (interactionRadiusSq - distInteractSq) / interactionRadiusSq;
            const angle = Math.atan2(dyInteract, dxInteract);
            
            // Flowy gravitational physics: repel from interaction point
            const repelForce = 2.5; // Positive pushes away
            const swirlForce = 1.2; // Swirls around
            
            tx += Math.cos(angle) * force * repelForce;
            ty += Math.sin(angle) * force * repelForce;
            
            tx += Math.cos(angle + Math.PI / 2) * force * swirlForce;
            ty += Math.sin(angle + Math.PI / 2) * force * swirlForce;
            
            // Gentle Z-axis wave (flowy, slow)
            tz += Math.sin(time * 1.0 + distInteractSq * 0.05) * force * 2.0; 
          }
        }
      }

      // --- MOVEMENT LOGIC ---
      const dx = tx - x;
      const dy = ty - y;
      const dz = tz - z;
      const distSq = dx*dx + dy*dy + dz*dz;

      // Transition Turbulence
      // When switching shapes (distance is large), particles swirl
      if (distSq > 2.0) {
        const noiseScale = 0.05;
        const freq = 0.2;
        x += Math.sin(y * freq + time * 5.0) * noiseScale * speed;
        y += Math.cos(z * freq + time * 5.0) * noiseScale * speed;
        z += Math.sin(x * freq + time * 5.0) * noiseScale * speed;
      }

      // Linear Interpolation
      x += dx * baseLerp;
      y += dy * baseLerp;
      z += dz * baseLerp;

      posArray[idx] = x;
      posArray[idx+1] = y;
      posArray[idx+2] = z;
    }

    positionAttribute.needsUpdate = true;

    // --- UNIFORM UPDATE (GPU) ---
    materialRef.current.uTime = time;
    materialRef.current.uColor = new THREE.Color(config.color);
    materialRef.current.uSize = (config.size * 450);

    // Global rotation
    if (handsDetected && gestureRef) {
      // Hand rotation: smoothly follow the hand with momentum
      pointsRef.current.rotation.y = currentAnim.current.rotY;
      pointsRef.current.rotation.x = currentAnim.current.rotX;
      pointsRef.current.rotation.z = currentAnim.current.rotZ;
    } else if (config.autoRotate) {
      // Apply residual momentum
      pointsRef.current.rotation.y = currentAnim.current.rotY;
      pointsRef.current.rotation.x = currentAnim.current.rotX;
      pointsRef.current.rotation.z = currentAnim.current.rotZ;
      
      // Auto rotation: continue rotating from wherever it currently is
      currentAnim.current.rotY += 0.001 * speed;
      // Gently return X rotation to a slight wobble
      currentAnim.current.rotX += (Math.sin(time * 0.15) * 0.03 - currentAnim.current.rotX) * 0.02;
      // Gently return Z rotation to 0
      currentAnim.current.rotZ += (0 - currentAnim.current.rotZ) * 0.02;
    }
  });

  return (
    <points ref={pointsRef} key={count}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={currentPositions.length / 3}
          array={currentPositions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-aRandom"
          count={randoms.length}
          array={randoms}
          itemSize={1}
        />
      </bufferGeometry>
      {/* @ts-ignore */}
      <particleShaderMaterial
        ref={materialRef}
        transparent={true}
        depthWrite={false}
        blending={THREE.NormalBlending}
        uPixelRatio={Math.min(window.devicePixelRatio, 2)}
      />
    </points>
  );
};

export default Particles;