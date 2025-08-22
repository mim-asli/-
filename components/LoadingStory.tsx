import React, { useState, useEffect } from 'react';
import { useGameStore } from '../store/gameStore';
import Typewriter from './Typewriter';

const LoadingStory: React.FC = () => {
    const { loadingSummary, setView } = useGameStore(state => ({
        loadingSummary: state.loadingSummary,
        setView: state.setView,
    }));
    
    const [isTyping, setIsTyping] = useState(true);

    // If for some reason we land here without a summary, redirect to the game
    useEffect(() => {
        if (!loadingSummary) {
            setView('game');
        }
    }, [loadingSummary, setView]);

    const handleContinue = () => {
        setView('game');
    };

    return (
        <div className="h-screen w-screen bg-bg-deep flex flex-col items-center justify-center p-8 animate-fade-in">
            <div className="max-w-3xl text-center">
                <h1 
                    className="text-5xl md:text-7xl font-display tracking-wider text-transparent bg-clip-text bg-gradient-to-b from-amber-300 to-amber-500 mb-8"
                    style={{ textShadow: '0 0 25px var(--color-accent-amber)'}}
                >
                    در قسمت قبل...
                </h1>
                
                <div className="text-lg md:text-xl text-[var(--color-text-secondary)] leading-relaxed text-right glass-surface p-6 rounded-lg max-h-[50vh] overflow-y-auto custom-scrollbar">
                    <style>{`
                        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
                        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                        .custom-scrollbar::-webkit-scrollbar-thumb { background-color: var(--color-border); border-radius: 20px; }
                    `}</style>
                    <Typewriter 
                        text={loadingSummary || ''} 
                        onComplete={() => setIsTyping(false)} 
                        speed={25}
                    />
                </div>

                <div className="mt-12 h-16 flex items-center justify-center">
                    {!isTyping && (
                         <button
                            onClick={handleContinue}
                            className="
                                font-display px-12 py-4 bg-[var(--color-accent-cyan)] text-slate-900 font-bold text-2xl rounded-lg 
                                hover:bg-cyan-300 transition-all transform hover:scale-105
                                focus-visible:ring-4 focus-visible:ring-cyan-300/50
                                shadow-[0_0_30px] shadow-cyan-500/30
                                animate-fade-in
                            "
                        >
                            ادامه ماجراجویی
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default LoadingStory;