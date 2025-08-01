"use client";

import React, { useRef, useMemo, Suspense, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Icosahedron, Dodecahedron, Stars } from '@react-three/drei';
import { useTheme } from 'next-themes';
import * as THREE from 'three';
import { WebGLContextManager, WebGLContextRegistry } from './webgl-context-manager';
import { WebGLFallback, useWebGLSupport } from './webgl-fallback';

// A single satellite crystal that orbits the center
function Satellite({ radius, speed }: { radius: number, speed: number }) {
    const meshRef = useRef<THREE.Mesh>(null!);
    const { resolvedTheme } = useTheme();
    const time = useRef(Math.random() * 10000);

    // Memoize the color to avoid recalculation
    const color = useMemo(() =>
            new THREE.Color(resolvedTheme === 'dark' ? '#5eead4' : '#0d9488'), // teal-300 dark, teal-600 light
        [resolvedTheme]);

    // Animate the satellite's position in an orbit
    useFrame((state, delta) => {
        if (meshRef.current) {
            time.current += delta * speed;
            const x = Math.cos(time.current) * radius;
            const z = Math.sin(time.current) * radius;
            meshRef.current.position.set(x, 0, z);
            meshRef.current.rotation.x += delta * 0.5;
            meshRef.current.rotation.y += delta * 0.5;
        }
    });

    return (
        <Dodecahedron ref={meshRef} args={[0.2, 0]}>
            <meshStandardMaterial
                color={color}
                roughness={0.4}
                emissive={color}
                emissiveIntensity={0.8}
            />
        </Dodecahedron>
    );
}

/**
 * The main crystal at the center, with a glowing aura.
 * It reacts directly to theme changes.
 */
function MainCrystal() {
    const { resolvedTheme } = useTheme();
    const mainMeshRef = useRef<THREE.Mesh>(null!);
    const glowMeshRef = useRef<THREE.Mesh>(null!);

    // Memoize colors to prevent recalculation on every render
    const colors = useMemo(() => ({
        base: resolvedTheme === 'dark' ? '#93c5fd' : '#3b82f6',     // blue-300 dark, blue-500 light
        emissive: resolvedTheme === 'dark' ? '#3b82f6' : '#60a5fa', // blue-500 dark, blue-400 light
        glow: resolvedTheme === 'dark' ? '#bfdbfe' : '#93c5fd',     // blue-200 dark, blue-300 light
    }), [resolvedTheme]);

    // Animate the rotation of the crystal
    useFrame((state, delta) => {
        const rotationSpeed = delta * 0.1;
        if (mainMeshRef.current) {
            mainMeshRef.current.rotation.y += rotationSpeed;
            mainMeshRef.current.rotation.x += rotationSpeed * 0.5;
        }
        if (glowMeshRef.current) {
            glowMeshRef.current.rotation.y += rotationSpeed;
            glowMeshRef.current.rotation.x += rotationSpeed * 0.5;
        }
    });

    return (
        <group>
            {/* The inner, solid crystal */}
            <Icosahedron ref={mainMeshRef} args={[2.5, 1]}>
                <meshPhysicalMaterial
                    key={resolvedTheme} // Force re-creation on theme change
                    color={colors.base}
                    emissive={colors.emissive}
                    emissiveIntensity={0.6}
                    metalness={0.1}
                    roughness={0.1}
                    transmission={1.0}
                    thickness={1.5}
                    ior={1.5}
                />
            </Icosahedron>
            {/* The outer mesh that creates a soft glow effect */}
            <Icosahedron ref={glowMeshRef} args={[2.7, 1]}>
                <meshBasicMaterial
                    key={resolvedTheme} // Force re-creation on theme change
                    color={colors.glow}
                    transparent
                    opacity={0.3}
                    blending={THREE.AdditiveBlending}
                    side={THREE.BackSide}
                />
            </Icosahedron>
        </group>
    );
}

/**
 * Sets up the main 3D scene, including lighting, stars, and camera effects.
 */
function Scene() {
    const { viewport, camera } = useThree();

    // Creates a subtle parallax effect by moving the camera with the mouse
    useFrame((state) => {
        const { x, y } = state.pointer;
        const targetX = x * (viewport.width / 20);
        const targetY = y * (viewport.height / 20);

        // Smoothly interpolate camera position for a gentle effect
        camera.position.x = THREE.MathUtils.lerp(camera.position.x, targetX, 0.03);
        camera.position.y = THREE.MathUtils.lerp(camera.position.y, targetY, 0.03);
        camera.lookAt(0, 0, 0);
    });

    return (
        <>
            <WebGLContextManager 
                id="hero-canvas" 
                onContextLost={() => console.log('Hero canvas context lost')}
                onContextRestored={() => console.log('Hero canvas context restored')}
            />
            
            {/* Lighting Setup */}
            <ambientLight intensity={1.0} />
            <pointLight position={[10, 10, 10]} intensity={200} color="#ffffff" />
            <pointLight position={[-10, -10, -10]} intensity={150} color="#60a5fa" />

            <MainCrystal />

            {/* Render multiple orbiting satellites */}
            <Satellite radius={4} speed={0.4} />
            <Satellite radius={4.5} speed={-0.3} />
            <Satellite radius={5} speed={0.2} />

            <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
        </>
    );
}

/**
 * The main exported component that wraps the R3F Canvas.
 */
export default function HeroCanvas() {
    const webglSupported = useWebGLSupport();
    
    return (
        <div className="absolute inset-0 z-0 opacity-40 dark:opacity-50 transition-opacity duration-500">
            <WebGLFallback webglSupported={webglSupported}>
                <Canvas 
                    camera={{ fov: 50, position: [0, 0, 14] }}
                    gl={{ 
                        powerPreference: "high-performance",
                        antialias: true,
                        alpha: false,
                        stencil: false,
                        depth: true
                    }}
                    onCreated={({ gl }) => {
                        gl.setClearColor(0x000000, 0);
                        gl.setPixelRatio(Math.min(window.devicePixelRatio, 2));
                    }}
                >
                    {/* Suspense provides a fallback while 3D assets are loading */}
                    <Suspense fallback={null}>
                        <Scene />
                    </Suspense>
                </Canvas>
            </WebGLFallback>
        </div>
    );
}
