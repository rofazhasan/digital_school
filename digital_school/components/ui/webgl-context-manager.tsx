"use client";

import React, { useEffect, useRef } from 'react';
import { useThree } from '@react-three/fiber';

interface WebGLContextManagerProps {
  id: string;
  onContextLost?: () => void;
  onContextRestored?: () => void;
}

export const WebGLContextManager: React.FC<WebGLContextManagerProps> = ({ 
  id, 
  onContextLost, 
  onContextRestored 
}) => {
  const { gl } = useThree();
  const hasHandlers = useRef(false);

  useEffect(() => {
    if (hasHandlers.current) return;

    const handleContextLost = (event: Event) => {
      event.preventDefault();
      console.warn(`WebGL context lost in ${id}`);
      onContextLost?.();
    };

    const handleContextRestored = () => {
      console.log(`WebGL context restored in ${id}`);
      onContextRestored?.();
    };

    gl.domElement.addEventListener('webglcontextlost', handleContextLost);
    gl.domElement.addEventListener('webglcontextrestored', handleContextRestored);
    hasHandlers.current = true;

    return () => {
      gl.domElement.removeEventListener('webglcontextlost', handleContextLost);
      gl.domElement.removeEventListener('webglcontextrestored', handleContextRestored);
      hasHandlers.current = false;
    };
  }, [gl, id, onContextLost, onContextRestored]);

  return null;
};

// Global WebGL context manager to prevent multiple instances
class WebGLContextRegistry {
  private static instances = new Set<string>();

  static register(id: string): boolean {
    if (this.instances.has(id)) {
      console.warn(`WebGL context ${id} already registered`);
      return false;
    }
    this.instances.add(id);
    return true;
  }

  static unregister(id: string): void {
    this.instances.delete(id);
  }

  static getInstanceCount(): number {
    return this.instances.size;
  }
}

export { WebGLContextRegistry }; 