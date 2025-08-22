import React, { useState, useEffect, useRef } from 'react';
import { audioService } from '../services/audioService';
import { useFocusTrap } from '../hooks/useFocusTrap';

const CloseIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
    </svg>
);

const VolumeUpIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 0 1 0 12.728M16.463 8.288a5.25 5.25 0 0 1 0 7.424M6.75 8.25l4.72-4.72a.75.75 0 0 1 1.28.53v15.88a.75.75 0 0 1-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 0 1 2.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75Z" />
    </svg>
);

const VolumeOffIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className} aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 9.75 19.5 12m0 0 2.25 2.25M19.5 12l2.25-2.25M19.5 12l-2.25 2.25m-10.5-6 4.72-4.72a.75.75 0 0 1 1.28.53v15.88a.75.75 0 0 1-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 0 1 2.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75Z" />
    </svg>
);

const VolumeSlider: React.FC<{label: string, id: string, value: number, onChange: (value: number) => void}> = ({ label, id, value, onChange }) => {
    const isMuted = value === 0;

    const toggleMute = () => {
        if (isMuted) {
            onChange(0.7); // Restore to a default audible volume
        } else {
            onChange(0); // Mute
        }
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-2">
                 <label htmlFor={id} className="text-sm font-bold text-slate-300">{label}</label>
                <div className="flex items-center gap-3">
                    <span className="text-sm font-mono text-slate-400">{Math.round(value * 100)}%</span>
                    <button onClick={toggleMute} aria-label={isMuted ? `Unmute ${label}` : `Mute ${label}`}>
                        {isMuted ? <VolumeOffIcon className="w-5 h-5 text-slate-400" /> : <VolumeUpIcon className="w-5 h-5 text-slate-300" />}
                    </button>
                </div>
            </div>
            <input
                id={id}
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={value}
                onChange={(e) => onChange(parseFloat(e.target.value))}
                className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer range-thumb"
            />
        </div>
    );
};


interface AudioSettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const AudioSettingsModal: React.FC<AudioSettingsModalProps> = ({ isOpen, onClose }) => {
    const [volumes, setVolumes] = useState(audioService.getVolumes());
    const modalRef = useRef<HTMLDivElement>(null);
    useFocusTrap(modalRef, isOpen);

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                onClose();
            }
        };

        if (isOpen) {
            setVolumes(audioService.getVolumes());
            document.addEventListener('keydown', handleKeyDown);
        }

        return () => {
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [isOpen, onClose]);

    const handleVolumeChange = (type: keyof typeof volumes, value: number) => {
        audioService.setVolume(type, value);
        setVolumes(audioService.getVolumes());
    };

    if (!isOpen) {
        return null;
    }

    return (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
            <div 
                ref={modalRef}
                role="dialog"
                aria-modal="true"
                aria-labelledby="audio-settings-title"
                className="w-full max-w-md glass-surface rounded-2xl shadow-2xl overflow-hidden interactive-frame"
                onClick={e => e.stopPropagation()}
            >
                <header className="p-4 flex items-center justify-between bg-black/20 border-b-2 border-[var(--color-border)]">
                    <h1 id="audio-settings-title" className="text-2xl font-display text-[var(--color-accent-cyan)]">تنظیمات صدا</h1>
                    <button onClick={onClose} className="p-2 rounded-full text-slate-300 hover:bg-white/10" aria-label="بستن">
                        <CloseIcon className="w-6 h-6" />
                    </button>
                </header>
                <div className="p-6 space-y-6">
                    <VolumeSlider label="صدای اصلی" id="master-volume" value={volumes.master} onChange={(v) => handleVolumeChange('master', v)} />
                    <VolumeSlider label="موسیقی" id="music-volume" value={volumes.music} onChange={(v) => handleVolumeChange('music', v)} />
                    <VolumeSlider label="صدای محیط" id="ambient-volume" value={volumes.ambient} onChange={(v) => handleVolumeChange('ambient', v)} />
                    <VolumeSlider label="جلوه‌های صوتی" id="sfx-volume" value={volumes.sfx} onChange={(v) => handleVolumeChange('sfx', v)} />
                </div>
            </div>
        </div>
    );
};

export default AudioSettingsModal;