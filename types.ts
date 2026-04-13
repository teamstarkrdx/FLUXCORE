import React from 'react';

export type ShapeType = 'sphere' | 'heart' | 'flower' | 'saturn' | 'meditator' | 'cube' | 'custom' | 'text' | 'nebula';

export interface ParticleConfig {
  count: number;
  size: number;
  color: string;
  shape: ShapeType;
  expansion: number; // Controlled by hand gesture (0.5 to 10.0)
  autoRotate: boolean;
  textValue: string; // The text to display when shape is 'text'
  spacing: number;
  shapeSize: number;
  handRotation: { x: number, y: number };
}

// Global Declarations
declare global {
  interface Window {
    Hands: any;
    Camera: any;
    drawConnectors: any;
    drawLandmarks: any;
    HAND_CONNECTIONS: any;
  }
}