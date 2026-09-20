'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Volume2, VolumeX, CloudRain, Music, Coffee } from 'lucide-react';
import { Button } from '@/components/ui/button';

type AmbientSoundType = 'none' | 'rain' | 'lofi' | 'cafe';

export function AmbientAudioControls() {
  const [activeSound, setActiveSound] = useState<AmbientSoundType>('none');
  const [volume, setVolume] = useState(0.5);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const noiseSourceRef = useRef<AudioBufferSourceNode | null>(null);

  const stopAudio = () => {
    if (noiseSourceRef.current) {
      try {
        noiseSourceRef.current.stop();
        noiseSourceRef.current.disconnect();
      } catch (e) {}
      noiseSourceRef.current = null;
    }
  };

  const playPinkNoise = (filterFreq: number) => {
    stopAudio();
    if (!audioCtxRef.current) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      audioCtxRef.current = new AudioCtx();
    }

    const ctx = audioCtxRef.current;
    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    // Generate 5 seconds of pink noise buffer
    const bufferSize = ctx.sampleRate * 5;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);

    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      data[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
      data[i] *= 0.11;
      b6 = white * 0.115926;
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    noise.loop = true;

    // Filter
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(filterFreq, ctx.currentTime);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(volume * 0.4, ctx.currentTime);
    gainNodeRef.current = gain;

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    noise.start();
    noiseSourceRef.current = noise;
  };

  const handleSelect = (sound: AmbientSoundType) => {
    if (sound === activeSound) {
      stopAudio();
      setActiveSound('none');
      return;
    }

    setActiveSound(sound);
    if (sound === 'rain') {
      playPinkNoise(1200); // Rain sound filter
    } else if (sound === 'lofi') {
      playPinkNoise(450); // Deep soft murmur
    } else if (sound === 'cafe') {
      playPinkNoise(800); // Gentle cafe ambience
    } else {
      stopAudio();
    }
  };

  useEffect(() => {
    return () => {
      stopAudio();
      if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
        audioCtxRef.current.close().catch(() => {});
      }
    };
  }, []);

  const sounds = [
    { id: 'none', label: 'Mute', icon: VolumeX },
    { id: 'rain', label: 'Rain Flow', icon: CloudRain },
    { id: 'lofi', label: 'Deep Focus', icon: Music },
    { id: 'cafe', label: 'Library', icon: Coffee },
  ];

  return (
    <div className="flex items-center gap-1.5 p-1 rounded-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
      {sounds.map((s) => {
        const Icon = s.icon;
        const isActive = activeSound === s.id;
        return (
          <button
            key={s.id}
            onClick={() => handleSelect(s.id as AmbientSoundType)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
              isActive
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Icon className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{s.label}</span>
          </button>
        );
      })}
    </div>
  );
}
