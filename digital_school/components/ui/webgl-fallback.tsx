"use client";

import React from 'react';
import { motion } from 'framer-motion';

interface WebGLFallbackProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  webglSupported?: boolean;
}

export const WebGLFallback: React.FC<WebGLFallbackProps> = ({ 
  children, 
  fallback,
  webglSupported = true 
}) => {
  if (!webglSupported) {
    return (
      <div className="flex items-center justify-center w-full h-full bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
        {fallback || (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center text-gray-600 dark:text-gray-400"
          >
            <div className="text-4xl mb-4">🎨</div>
            <p className="text-sm">Enhanced graphics not available</p>
          </motion.div>
        )}
      </div>
    );
  }

  return <>{children}</>;
};

// Hook to check WebGL support
export const useWebGLSupport = () => {
  const [isSupported, setIsSupported] = React.useState(true);

  React.useEffect(() => {
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      setIsSupported(!!gl);
    } catch (e) {
      setIsSupported(false);
    }
  }, []);

  return isSupported;
}; 