import * as THREE from 'three';

export const getRandomPointInSphere = (r: number) => {
  const theta = Math.random() * Math.PI * 2;
  const phi = Math.acos((Math.random() * 2) - 1);
  const radius = r * Math.cbrt(Math.random());
  return {
    x: radius * Math.sin(phi) * Math.cos(theta),
    y: radius * Math.sin(phi) * Math.sin(theta),
    z: radius * Math.cos(phi)
  };
};

export const getNebulaPoint = (scale: number) => {
  // Scattered ambient dust forming a sphere, hollow in the middle (no flat spiral arms)
  const pt = getRandomPointInSphere(scale * 1.5);

  // Push out of center to keep it clean and empty in the middle
  const distSq = pt.x*pt.x + pt.y*pt.y + pt.z*pt.z;
  const minRadius = scale * 0.5; // Make the hollow center clean
  if (distSq < minRadius * minRadius) {
    const dist = Math.sqrt(distSq);
    if (dist > 0.001) {
      pt.x = (pt.x / dist) * minRadius;
      pt.y = (pt.y / dist) * minRadius;
      pt.z = (pt.z / dist) * minRadius;
    } else {
      pt.x = minRadius;
    }
  }
  return pt;
};

export const getHeartPoint = (scale: number) => {
  const t = Math.random() * Math.PI * 2;
  const r = Math.sqrt(Math.random()); 
  
  const x = 16 * Math.pow(Math.sin(t), 3);
  const y = 13 * Math.cos(t) - 5 * Math.cos(2*t) - 2 * Math.cos(3*t) - Math.cos(4*t);
  
  const z = (Math.random() - 0.5) * 4;

  const s = (scale / 16) * r;

  return { x: x * s, y: y * s, z: z * s };
};

export const getSaturnPoint = (scale: number) => {
  const isRing = Math.random() > 0.02; // 98% rings, 2% planet
  
  if (isRing) {
    const angle = Math.random() * Math.PI * 2;
    // Exact ring structure: inner gap, main bright ring, Cassini division, outer ring
    const r = Math.random();
    let dist = 0;
    
    if (r < 0.35) {
      // Inner C Ring (faint, broad - increased density)
      dist = scale * (1.0 + Math.random() * 0.3);
    } else if (r < 0.65) {
      // Main B Ring (thinned out relative to others)
      const density = Math.pow(Math.random(), 0.5); // Bias towards outer edge of B ring
      dist = scale * (1.3 + density * 0.5);
    } else if (r < 0.95) {
      // Outer A Ring (increased density)
      const density = Math.pow(Math.random(), 2); // Bias towards inner edge of A ring
      dist = scale * (1.9 + density * 0.4);
    } else {
      // Cassini Division (sparse)
      dist = scale * (1.8 + Math.random() * 0.1);
    }

    // Add a slight vertical thickness that tapers off at the edges
    const thickness = Math.exp(-Math.pow((dist/scale - 1.6), 2) * 5) * 0.06 * scale;

    return {
      x: Math.cos(angle) * dist,
      y: (Math.random() - 0.5) * thickness, // Extremely thin realistic ring
      z: Math.sin(angle) * dist
    };
  } else {
    // Planet body (slightly oblate spheroid)
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos((Math.random() * 2) - 1);
    const radius = scale * 0.8 * Math.cbrt(Math.random()); // smaller planet relative to rings
    return {
      x: radius * Math.sin(phi) * Math.cos(theta),
      y: radius * Math.sin(phi) * Math.sin(theta) * 0.85, // Flattened poles
      z: radius * Math.cos(phi)
    };
  }
};

export const getFlowerPoint = (scale: number) => {
  const k = 4; // Petals
  const theta = Math.random() * Math.PI * 2;
  const phi = Math.random() * Math.PI;
  
  const r = scale * (Math.sin(k * theta) + 1.5); 
  
  return {
    x: r * Math.sin(phi) * Math.cos(theta),
    y: r * Math.sin(phi) * Math.sin(theta),
    z: r * Math.cos(phi) * 0.25 
  };
};

export const getMeditatorPoint = (scale: number) => {
  const r = Math.random();
  const part = Math.random();
  
  let p = { x: 0, y: 0, z: 0 };
  
  if (part < 0.2) {
    // Head
    const headScale = scale * 0.35;
    const pt = getRandomPointInSphere(headScale);
    p = { x: pt.x, y: pt.y + scale * 1.2, z: pt.z };
  } else if (part < 0.6) {
    // Body
    const bodyW = scale * 0.6;
    const bodyH = scale * 0.8;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.random() * Math.PI;
    p = {
      x: bodyW * Math.sin(phi) * Math.cos(theta),
      y: bodyH * Math.cos(phi), 
      z: bodyW * Math.sin(phi) * Math.sin(theta)
    };
  } else {
    // Legs
    const angle = Math.random() * Math.PI * 2;
    const rad = scale * (0.5 + Math.random() * 0.6);
    const height = (Math.random() - 0.5) * scale * 0.4;
    
    p = {
      x: rad * Math.cos(angle),
      y: -scale * 0.8 + height,
      z: rad * Math.sin(angle)
    };
  }
  return p;
};

export const getCubePoint = (scale: number) => {
  const s = scale * 1.2;
  const isEdge = Math.random() > 0.3; // 70% of particles on edges, 30% inside/faces
  
  if (isEdge) {
    // Pick one of the 12 edges
    const edge = Math.floor(Math.random() * 12);
    const t = (Math.random() - 0.5) * 2 * s; // Position along the edge
    const fixed1 = (Math.random() > 0.5 ? 1 : -1) * s;
    const fixed2 = (Math.random() > 0.5 ? 1 : -1) * s;
    
    // Add slight noise to make the border "medium strong" but not a perfect 1px line
    const noise = () => (Math.random() - 0.5) * 0.1 * s;

    if (edge < 4) return { x: t, y: fixed1 + noise(), z: fixed2 + noise() };
    if (edge < 8) return { x: fixed1 + noise(), y: t, z: fixed2 + noise() };
    return { x: fixed1 + noise(), y: fixed2 + noise(), z: t };
  } else {
    // Volume/Faces
    return {
      x: (Math.random() - 0.5) * 2 * s,
      y: (Math.random() - 0.5) * 2 * s,
      z: (Math.random() - 0.5) * 2 * s
    };
  }
};

export const getCustomPoint = (scale: number) => {
  const u = Math.random() * Math.PI * 20; 
  const p = 2; 
  const q = 3; 
  
  const tubeRadius = scale * 0.3 * Math.random();
  const r = scale * (1.5 + 0.5 * Math.cos(q * u / p));
  
  const x = r * Math.cos(u);
  const y = r * Math.sin(u);
  const z = scale * Math.sin(q * u / p);
  
  return {
    x: x + (Math.random()-0.5) * tubeRadius,
    y: y + (Math.random()-0.5) * tubeRadius,
    z: z + (Math.random()-0.5) * tubeRadius
  };
};

// Generates points from text using an offscreen canvas
export const getTextPoints = (text: string, scale: number) => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  if (!ctx) return [];

  // 1. Setup - Use very large font for high resolution sampling
  const fontSize = 200; 
  const font = `900 ${fontSize}px "Arial Black", Arial, sans-serif`; 
  ctx.font = font;
  
  const textMetrics = ctx.measureText(text);
  const textWidth = textMetrics.width;
  const textHeight = fontSize; 
  
  // Padding avoids clipping at edges
  const width = Math.ceil(textWidth + 100);
  const height = Math.ceil(textHeight + 100);
  
  canvas.width = width;
  canvas.height = height;

  // 2. Draw Text
  ctx.font = font; 
  ctx.fillStyle = '#000000'; 
  ctx.fillRect(0, 0, width, height);
  
  // Draw white text. 
  // We do NOT use strokeText here because we want to manually detect the "pixel" edge 
  // to stack particles there.
  ctx.fillStyle = '#ffffff'; 
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, width / 2, height / 2);
  
  // 3. Sample Pixels
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;
  const points = [];
  
  // Sampling step. 
  const step = 2; 

  const getAlpha = (x: number, y: number) => {
    if (x < 0 || x >= width || y < 0 || y >= height) return 0;
    // Data is RGBA, we check Red channel since text is white (255,255,255)
    return data[(y * width + x) * 4]; 
  };

  for (let y = 0; y < height; y += step) {
    for (let x = 0; x < width; x += step) {
       const brightness = getAlpha(x, y);
       
       if (brightness > 100) { 
          // --- ROBUST EDGE DETECTION ---
          // Check 4 neighbors
          const top = getAlpha(x, y - step);
          const bottom = getAlpha(x, y + step);
          const left = getAlpha(x - step, y);
          const right = getAlpha(x + step, y);
          
          // If any neighbor is dark (transparent/black), this pixel is on the edge
          const isEdge = top < 80 || bottom < 80 || left < 80 || right < 80;

          // Normalize coordinates centered at 0,0
          // Y is flipped for 3D coords
          const nX = (x - width / 2) / (height / 2); 
          const nY = -(y - height / 2) / (height / 2);
          
          // --- EDGE STACKING ALGORITHM ---
          // "Outer line" needs to be VERY dense to be readable
          const particlesToAdd = isEdge ? 10 : 2; 

          for (let i = 0; i < particlesToAdd; i++) {
             points.push({
                // Tighter jitter on edges for sharp lines
                x: nX * scale * 1.5 + (Math.random() - 0.5) * (isEdge ? 0.015 : 0.08),
                y: nY * scale * 1.5 + (Math.random() - 0.5) * (isEdge ? 0.015 : 0.08),
                // Keep Z very shallow so text is legible from front
                z: (Math.random() - 0.5) * 0.4
             });
          }
       }
    }
  }
  return points;
};