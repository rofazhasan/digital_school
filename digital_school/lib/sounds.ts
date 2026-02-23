"use client";

const SOUNDS = {
    click: "https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3",
    success: "https://assets.mixkit.co/active_storage/sfx/1435/1435-preview.mp3",
    hover: "https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3",
    transition: "https://assets.mixkit.co/active_storage/sfx/2567/2567-preview.mp3",
    alert: "https://assets.mixkit.co/active_storage/sfx/2572/2572-preview.mp3",
};

export const playSound = (soundName: keyof typeof SOUNDS) => {
    if (typeof window === "undefined") return;
    const audio = new Audio(SOUNDS[soundName]);
    audio.volume = 0.2;
    audio.play().catch(() => {
        // Ignore autoplay blocks
    });
};
