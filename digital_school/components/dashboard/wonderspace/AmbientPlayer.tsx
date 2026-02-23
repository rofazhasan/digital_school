"use client";

import { useState, useRef, useEffect } from "react";
import { Play, Pause, Volume2, Waves, Wind, Trees as Tree, Droplets, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { GlassCard } from "./GlassCard";
import { playSound } from "@/lib/sounds";

const SOUNDS = [
    { id: "rain", name: "Rain", icon: Droplets, url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3" }, // Placeholders
    { id: "waves", name: "Waves", icon: Waves, url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3" },
    { id: "wind", name: "Wind", icon: Wind, url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3" },
    { id: "forest", name: "Forest", icon: Tree, url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3" },
];

export function AmbientPlayer() {
    const [isPlaying, setIsPlaying] = useState(false);
    const [activeSound, setActiveSound] = useState(SOUNDS[0]);
    const [volume, setVolume] = useState([50]);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    useEffect(() => {
        if (audioRef.current) {
            audioRef.current.volume = volume[0] / 100;
        }
    }, [volume]);

    const togglePlay = () => {
        playSound("click");
        if (audioRef.current) {
            if (isPlaying) {
                audioRef.current.pause();
            } else {
                audioRef.current.play();
            }
            setIsPlaying(!isPlaying);
        }
    };

    const selectSound = (sound: typeof SOUNDS[0]) => {
        playSound("click");
        setActiveSound(sound);
        setIsPlaying(false);
        if (audioRef.current) {
            audioRef.current.src = sound.url;
            audioRef.current.load();
        }
    };

    return (
        <GlassCard className="h-full">
            <div className="flex flex-col gap-6">
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold flex items-center gap-2">
                        <Volume2 className="w-5 h-5 text-primary" />
                        Ambient Sounds
                    </h3>
                    <Button
                        size="icon"
                        variant="ghost"
                        onClick={togglePlay}
                        className="w-12 h-12 rounded-full bg-primary/10 hover:bg-primary/20 text-primary transition-all scale-110"
                    >
                        {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-1" />}
                    </Button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                    {SOUNDS.map((sound) => (
                        <button
                            key={sound.id}
                            onClick={() => selectSound(sound)}
                            className={`flex items-center gap-2 p-3 rounded-2xl border transition-all ${activeSound.id === sound.id
                                    ? "bg-primary/10 border-primary/30 text-primary"
                                    : "bg-muted/30 border-transparent hover:bg-muted/50"
                                }`}
                        >
                            <sound.icon className="w-4 h-4" />
                            <span className="text-xs font-medium">{sound.name}</span>
                        </button>
                    ))}
                </div>

                <div className="space-y-3 pt-2">
                    <div className="flex items-center justify-between text-[10px] text-muted-foreground font-bold uppercase tracking-wider">
                        <span className="flex items-center gap-1">
                            <VolumeX className="w-3 h-3" /> 0%
                        </span>
                        <span>Volume</span>
                        <span className="flex items-center gap-1">
                            <Volume2 className="w-3 h-3" /> 100%
                        </span>
                    </div>
                    <Slider
                        value={volume}
                        onValueChange={setVolume}
                        max={100}
                        step={1}
                        className="cursor-pointer"
                    />
                </div>
            </div>
            <audio ref={audioRef} loop src={activeSound.url} />
        </GlassCard>
    );
}
