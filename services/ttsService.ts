import { TTSConfig } from '../types';

class TTSService {
    private synth: SpeechSynthesis;
    private config: TTSConfig = {
        enabled: true,
        voiceURI: null,
        rate: 1,
        pitch: 1,
    };

    constructor() {
        if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
            this.synth = window.speechSynthesis;
        } else {
            this.synth = {
                speak: () => console.warn('Speech synthesis not supported.'),
                cancel: () => {},
                getVoices: () => [],
                paused: false,
                pending: false,
                speaking: false,
                pause: () => {},
                resume: () => {},
                onvoiceschanged: null,
            } as unknown as SpeechSynthesis;
        }
    }
    
    public updateConfig(newConfig: Partial<TTSConfig>) {
        this.config = { ...this.config, ...newConfig };
    }

    public getVoices(): SpeechSynthesisVoice[] {
        const voices = this.synth.getVoices();
        const persianVoices = voices.filter(v => v.lang.startsWith('fa'));
        return persianVoices.length > 0 ? persianVoices : voices;
    }

    public speak(text: string) {
        if (!this.synth || !this.config.enabled || !text) return;
        
        this.cancel();

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'fa-IR';
        
        const voices = this.getVoices();
        const selectedVoice = voices.find(v => v.voiceURI === this.config.voiceURI);
        
        utterance.voice = selectedVoice || voices.find(v => v.lang === 'fa-IR') || voices[0] || null;
        utterance.rate = this.config.rate;
        utterance.pitch = this.config.pitch;
        
        this.synth.speak(utterance);
    }
    
    public cancel() {
        if (this.synth && this.synth.speaking) {
            this.synth.cancel();
        }
    }
}

export const ttsService = new TTSService();