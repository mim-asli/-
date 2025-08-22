import React from 'react';
import { useGameStore } from '../store/gameStore';

const PermissionScreen: React.FC = () => {
    const { setView } = useGameStore(state => ({ setView: state.setView }));

    const handleRequestPermission = async () => {
        try {
            // Request microphone access. The browser will show the native prompt.
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            // Immediately stop the track to release the microphone resource.
            // We only need the permission, not the active stream.
            stream.getTracks().forEach(track => track.stop());
            console.log('Microphone permission granted.');
        } catch (err) {
            console.warn('Microphone permission denied or an error occurred.', err);
        } finally {
            // Regardless of the outcome, proceed to the start screen.
            setView('start');
        }
    };

    return (
        <div className="h-screen w-screen flex flex-col items-center justify-center p-4 sm:p-8 animate-fade-in bg-[var(--color-bg-deep)]">
            <div className="text-center mb-12">
                <h1 className="text-7xl md:text-9xl font-display tracking-wider text-transparent bg-clip-text bg-gradient-to-b from-cyan-300 to-purple-500 animate-text-glitch" style={{ filter: 'blur(2px)', opacity: 0.5 }}>
                    داستان
                </h1>
            </div>

            <div className="w-full max-w-md p-8 text-center glass-surface rounded-lg shadow-2xl border border-[var(--color-border)]">
                <h2 className="text-2xl font-bold text-[var(--color-text-primary)] mb-4">اجازه دسترسی</h2>
                <p className="text-[var(--color-text-secondary)] mb-6">
                    به این برنامه اجازه دسترسی به موارد زیر را بدهید:
                </p>
                
                <div className="bg-slate-900/50 p-4 rounded-md border border-[var(--color-border)] text-left">
                    <label htmlFor="mic-permission" className="flex items-center cursor-default">
                        <input id="mic-permission" type="checkbox" checked readOnly className="h-5 w-5 rounded bg-slate-700 border-slate-500 text-cyan-500 focus:ring-0" />
                        <span className="mr-3 font-medium text-[var(--color-text-primary)]">میکروفون</span>
                    </label>
                </div>

                <button
                    onClick={handleRequestPermission}
                    className="mt-8 w-full font-display px-8 py-3 bg-[var(--color-accent-primary)] text-white text-xl rounded-lg hover:bg-purple-500 transition-all transform hover:scale-105 shadow-lg shadow-purple-500/30"
                >
                    اجازه دادن
                </button>
                
                <p className="text-xs text-[var(--color-text-tertiary)] mt-4">
                    این برنامه ممکن است بدون این دسترسی‌ به درستی کار نکند.
                </p>
                 <button onClick={() => setView('start')} className="mt-4 text-sm text-slate-500 hover:text-slate-300 transition-colors">
                    بعدا
                </button>
            </div>
        </div>
    );
};

export default PermissionScreen;
