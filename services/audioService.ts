// A service to manage all audio playback, including ambiance, music, and sound effects.

type VolumeLevels = {
    master: number;
    music: number;
    ambient: number;
    sfx: number;
};

const AUDIO_VOLUME_KEY = 'gemini-rpg-audio-volumes';
const FADE_TIME_MS = 1500; // 1.5 seconds for a smooth fade

// NOTE: These are royalty-free URLs from pixabay.com.
const soundMap = {
    ambient: {
        forest: 'https://cdn.pixabay.com/audio/2022/08/23/audio_82c244cb3d.mp3', // Sci-fi Jungle
        cave: 'https://cdn.pixabay.com/audio/2022/10/20/audio_f73c683b2e.mp3', // Dark Sci-fi Drone
        village: 'https://cdn.pixabay.com/audio/2022/11/22/audio_248c823e59.mp3', // Cyberpunk Bar/City
        tavern: 'https://cdn.pixabay.com/audio/2022/07/20/audio_4505f50f24.mp3', // Sci-fi Club/Cantina
        combat: 'https://cdn.pixabay.com/audio/2023/07/19/audio_51a30f3542.mp3', // Tense Action Score
    },
    music: {
        peaceful: 'https://cdn.pixabay.com/audio/2024/02/26/audio_1b6d194c25.mp3', // Calm Sci-fi "Stardust"
        mystery: 'https://cdn.pixabay.com/audio/2023/11/17/audio_c97b87864f.mp3', // "Lost in Space"
        tense: 'https://cdn.pixabay.com/audio/2022/08/03/audio_3232dc1572.mp3', // Tense Detective/Cinematic
        victory: 'https://cdn.pixabay.com/audio/2022/10/17/audio_a168ab6a30.mp3', // "Level Up" Fanfare
    },
    sfx: {
        item_pickup: 'https://cdn.pixabay.com/audio/2022/11/18/audio_82c6b44a86.mp3', // Sci-fi Click
        quest_complete: 'https://cdn.pixabay.com/audio/2022/10/16/audio_731a547b85.mp3', // Success Notification
        quest_fail: 'https://cdn.pixabay.com/audio/2021/08/04/audio_c6d59e319b.mp3', // Error sound
        damage_taken: 'https://cdn.pixabay.com/audio/2022/10/06/audio_970a0e362c.mp3', // Robotic Glitch
        game_over: 'https://cdn.pixabay.com/audio/2022/09/19/audio_1311026049.mp3', // Game Over Jingle
        door_open: 'https://cdn.pixabay.com/audio/2022/04/05/audio_49b55239a5.mp3', // Sliding Door
        magic_spell: 'https://cdn.pixabay.com/audio/2022/04/07/audio_a7e786b723.mp3', // Magic Whoosh
    }
};

class AudioService {
    private isInitialized = false;
    private volumes: VolumeLevels;

    private ambientAudio: HTMLAudioElement | null = null;
    private musicAudio: HTMLAudioElement | null = null;
    
    private currentAmbientSrc: string | null = null;
    private currentMusicSrc: string | null = null;

    constructor() {
        this.volumes = this.loadVolumes();
    }

    private loadVolumes(): VolumeLevels {
        try {
            const stored = localStorage.getItem(AUDIO_VOLUME_KEY);
            if (stored) {
                const parsed = JSON.parse(stored);
                // Basic validation
                if (typeof parsed.master === 'number') {
                    return parsed;
                }
            }
        } catch (e) {
            console.error("Failed to load audio volumes from localStorage", e);
        }
        // Default values
        return { master: 0.7, music: 0.8, ambient: 0.9, sfx: 1.0 };
    }

    private saveVolumes(): void {
        try {
            localStorage.setItem(AUDIO_VOLUME_KEY, JSON.stringify(this.volumes));
        } catch (e) {
            console.error("Failed to save audio volumes to localStorage", e);
        }
    }
    
    // Must be called after a user interaction
    public init(): void {
        if (this.isInitialized) return;
        this.isInitialized = true;
        console.log("Audio service initialized.");
    }
    
    public getVolumes(): VolumeLevels {
        return { ...this.volumes };
    }

    public setVolume(type: keyof VolumeLevels, level: number): void {
        if (level < 0) level = 0;
        if (level > 1) level = 1;

        this.volumes[type] = level;
        this.saveVolumes();
        
        // Update currently playing audio volumes
        if (this.musicAudio) {
            this.musicAudio.volume = this.volumes.music * this.volumes.master;
        }
        if (this.ambientAudio) {
            this.ambientAudio.volume = this.volumes.ambient * this.volumes.master;
        }
    }

    private fade(audio: HTMLAudioElement, direction: 'in' | 'out', targetVolume: number, onComplete?: () => void) {
        if (direction === 'out' && audio.volume === 0) {
            onComplete?.();
            return;
        }
        
        const initialVolume = audio.volume;
        const finalVolume = direction === 'in' ? targetVolume : 0;
        let currentVolume = initialVolume;
        const intervalTime = 50; // ms per step
        const steps = FADE_TIME_MS / intervalTime;
        const volumeStep = (finalVolume - initialVolume) / steps;
        
        const timer = setInterval(() => {
            currentVolume += volumeStep;

            if ((direction === 'in' && currentVolume >= finalVolume) || (direction === 'out' && currentVolume <= finalVolume)) {
                audio.volume = finalVolume;
                clearInterval(timer);
                onComplete?.();
            } else {
                audio.volume = currentVolume;
            }
        }, intervalTime);
    }
    
    private playLoop(type: 'music' | 'ambient', name: string | null) {
        if (!this.isInitialized) return;

        const currentAudio = type === 'music' ? this.musicAudio : this.ambientAudio;
        const currentSrc = type === 'music' ? this.currentMusicSrc : this.currentAmbientSrc;
        const soundPath = name ? soundMap[type][name as keyof typeof soundMap.music] : null;
        
        if (currentSrc === soundPath) {
            // No change, do nothing.
            return;
        }

        // 1. Fade out the old sound if it exists
        if (currentAudio) {
            this.fade(currentAudio, 'out', 0, () => {
                currentAudio.pause();
            });
        }
        
        // Update the current source
        if (type === 'music') this.currentMusicSrc = soundPath;
        else this.currentAmbientSrc = soundPath;

        // 2. If a new sound is provided, create, fade in and play it
        if (soundPath) {
            const newAudio = new Audio(soundPath);
            newAudio.loop = true;
            newAudio.volume = 0;
            
            newAudio.addEventListener('error', () => {
                console.warn(`AudioService: Could not load audio from ${soundPath}. The resource may be unavailable or blocked.`);
                if (type === 'music') {
                    this.musicAudio = null;
                } else {
                    this.ambientAudio = null;
                }
            });

            newAudio.play().catch(e => {
                console.warn(`Audio playback failed for ${type}:`, (e as Error).message);
            });

            const targetVolume = (type === 'music' ? this.volumes.music : this.volumes.ambient) * this.volumes.master;
            this.fade(newAudio, 'in', targetVolume);

            if (type === 'music') this.musicAudio = newAudio;
            else this.ambientAudio = newAudio;
        } else {
            // No new sound, just ensure the old one is stopped
            if (type === 'music') this.musicAudio = null;
            else this.ambientAudio = null;
        }
    }

    public playMusic(name: string | null) {
        this.playLoop('music', name);
    }
    
    public playAmbient(name: string | null) {
        this.playLoop('ambient', name);
    }
    
    public playSfx(name: string | null) {
        if (!this.isInitialized || !name) return;
        
        const soundPath = soundMap.sfx[name as keyof typeof soundMap.sfx];
        if (soundPath) {
            const sfxAudio = new Audio(soundPath);
            sfxAudio.volume = this.volumes.sfx * this.volumes.master;

            sfxAudio.addEventListener('error', () => {
                 console.warn(`AudioService: Could not load SFX from ${soundPath}. The resource may be unavailable or blocked.`);
            });
            
            sfxAudio.play().catch(e => {
                console.warn(`SFX playback failed:`, (e as Error).message);
            });
        }
    }
    
    public stopAll() {
        this.playAmbient(null);
        this.playMusic(null);
    }
}


export const audioService = new AudioService();