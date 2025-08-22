import React, { useState, useEffect, useRef } from 'react';
import { useGameStore } from '../store/gameStore';
import { ttsService } from '../services/ttsService';
import { useFocusTrap } from '../hooks/useFocusTrap';

const CloseIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
    </svg>
);

const TTSControls: React.FC = () => {
    const { isTtsControlsOpen, setTtsControlsOpen, ttsConfig, setTtsConfig } = useGameStore(state => ({
        isTtsControlsOpen: state.isTtsControlsOpen,
        setTtsControlsOpen: state.setTtsControlsOpen,
        ttsConfig: state.ttsConfig,
        setTtsConfig: state.setTtsConfig,
    }));
    
    const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
    const panelRef = useRef<HTMLDivElement>(null);
    useFocusTrap(panelRef, isTtsControlsOpen);

    useEffect(() => {
        const fetchVoices = () => {
            const availableVoices = ttsService.getVoices();
            setVoices(availableVoices);
            // Set a default Persian voice if none is selected
            if (!ttsConfig.voiceURI && availableVoices.length > 0) {
                const defaultVoice = availableVoices.find(v => v.lang.startsWith('fa')) || availableVoices[0];
                if (defaultVoice) {
                    setTtsConfig({ voiceURI: defaultVoice.voiceURI });
                }
            }
        };
        
        // Voices may load asynchronously
        if (isTtsControlsOpen) {
            fetchVoices();
            if (speechSynthesis.onvoiceschanged !== undefined) {
                speechSynthesis.onvoiceschanged = fetchVoices;
            }
        }
    }, [isTtsControlsOpen, ttsConfig.voiceURI, setTtsConfig]);

    if (!isTtsControlsOpen) return null;

    return (
        <div 
            ref={panelRef}
            className="fixed top-24 right-4 z-40 w-full max-w-xs p-4 glass-surface rounded-lg shadow-2xl animate-fade-in"
            role="dialog"
            aria-modal="true"
            aria-labelledby="tts-controls-title"
        >
            <div className="flex justify-between items-center mb-4">
                <h2 id="tts-controls-title" className="font-display text-xl text-cyan-300">تنظیمات گوینده</h2>
                <button onClick={() => setTtsControlsOpen(false)} className="p-1 rounded-full text-slate-400 hover:text-white hover:bg-white/10" aria-label="بستن">
                    <CloseIcon className="w-5 h-5"/>
                </button>
            </div>
            
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <label htmlFor="tts-toggle" className="font-bold text-slate-200">گوینده فعال</label>
                    <button
                        role="switch"
                        aria-checked={ttsConfig.enabled}
                        id="tts-toggle"
                        onClick={() => setTtsConfig({ enabled: !ttsConfig.enabled })}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${ttsConfig.enabled ? 'bg-cyan-500' : 'bg-slate-600'}`}
                    >
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${ttsConfig.enabled ? 'translate-x-6' : 'translate-x-1'}`} />
                    </button>
                </div>
                
                <div className={!ttsConfig.enabled ? 'opacity-50 pointer-events-none' : ''}>
                    <div>
                        <label htmlFor="tts-voice" className="block text-sm font-bold text-slate-300 mb-1">صدا</label>
                        <select
                            id="tts-voice"
                            value={ttsConfig.voiceURI || ''}
                            onChange={e => setTtsConfig({ voiceURI: e.target.value })}
                            className="w-full p-2 bg-slate-900/70 rounded-md border-2 border-[var(--color-border)] focus:border-[var(--color-border-focus)] focus:ring-0 transition"
                        >
                            {voices.map(voice => (
                                <option key={voice.voiceURI} value={voice.voiceURI}>
                                    {voice.name} ({voice.lang})
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="mt-4">
                        <label htmlFor="tts-rate" className="block text-sm font-bold text-slate-300 mb-1">سرعت: {ttsConfig.rate.toFixed(1)}x</label>
                        <input
                            id="tts-rate"
                            type="range"
                            min="0.5" max="2" step="0.1"
                            value={ttsConfig.rate}
                            onChange={e => setTtsConfig({ rate: parseFloat(e.target.value) })}
                            className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer"
                        />
                    </div>
                    <div className="mt-4">
                        <label htmlFor="tts-pitch" className="block text-sm font-bold text-slate-300 mb-1">زیر و بمی: {ttsConfig.pitch.toFixed(1)}</label>
                        <input
                            id="tts-pitch"
                            type="range"
                            min="0.5" max="2" step="0.1"
                            value={ttsConfig.pitch}
                            onChange={e => setTtsConfig({ pitch: parseFloat(e.target.value) })}
                            className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TTSControls;