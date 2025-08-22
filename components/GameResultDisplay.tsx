import React, { useRef, useEffect } from 'react';
import { useGameStore, restartGame } from '../store/gameStore';

const StatItem: React.FC<{ label: string; value: string | number }> = ({ label, value }) => (
    <div className="flex justify-between items-baseline py-3 border-b border-[var(--color-border)]">
        <dt className="text-base font-bold text-[var(--color-text-secondary)]">{label}</dt>
        <dd className="text-lg font-mono text-[var(--color-text-primary)]">{value}</dd>
    </div>
);

const GameResultDisplay: React.FC = () => {
    const {
        gameEpitaph,
        finalGameState,
        playerName,
        quests,
        worldState,
    } = useGameStore(state => ({
        gameEpitaph: state.gameEpitaph,
        finalGameState: state.finalGameState,
        playerName: state.playerName,
        quests: state.quests,
        worldState: state.worldState,
    }));

  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    // Programmatically focus the heading so screen readers announce the game over state
    headingRef.current?.focus();
  }, []);

  const questsCompleted = quests.filter(q => q.status === 'تکمیل شد').length;
  const finalStatus = finalGameState?.story || "سرنوشت شما نامعلوم باقی ماند.";

  return (
    <div className="h-screen w-screen flex flex-col items-center justify-center p-4 sm:p-8 animate-fade-in">
        <div className="w-full max-w-2xl viewport-frame text-center">
            <h1
                ref={headingRef}
                tabIndex={-1}
                className="text-5xl md:text-7xl font-display tracking-wider text-transparent bg-clip-text bg-gradient-to-b from-rose-400 to-rose-600 focus:outline-none"
                style={{ textShadow: '0 0 25px var(--color-accent-rose)' }}
            >
                انتقال پایان یافت
            </h1>

            <div className="my-8 p-4 text-lg italic text-center text-rose-200/80 border-y-2 border-rose-500/20">
                {gameEpitaph || "داستان شما در اینجا به پایان می‌رسد."}
            </div>

            <div className="text-right max-w-md mx-auto mb-10">
                <h2 className="font-display text-2xl text-amber-300 mb-4 text-center">خلاصه ماموریت</h2>
                <dl>
                    <StatItem label="نام ماجراجو" value={playerName || 'ناشناس'} />
                    <StatItem label="روزهای سپری شده" value={worldState?.day || 1} />
                    <StatItem label="ماموریت‌های تکمیل شده" value={questsCompleted} />
                    <div className="pt-3">
                        <dt className="text-base font-bold text-[var(--color-text-secondary)]">وضعیت نهایی</dt>
                        <dd className="text-base text-[var(--color-text-primary)] mt-1">{finalStatus}</dd>
                    </div>
                </dl>
            </div>

            <button
                onClick={restartGame}
                className="
                font-display px-12 py-4 bg-[var(--color-accent-cyan)] text-slate-900 font-bold text-2xl rounded-lg 
                hover:bg-cyan-300 transition-all transform hover:scale-105
                focus-visible:ring-4 focus-visible:ring-cyan-300/50
                shadow-[0_0_30px] shadow-cyan-500/30
                "
            >
                اتصال مجدد به سیستم
            </button>
        </div>
    </div>
  );
};

export default GameResultDisplay;