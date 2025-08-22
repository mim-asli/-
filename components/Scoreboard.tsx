import React, { useState, useEffect, useMemo } from 'react';
import { useGameStore } from '../store/gameStore';
import * as scoreboardService from '../services/scoreboardService';
import { ScoreboardStats, Archetype, Genre } from '../types';
import { archetypesJson } from '../data';
import { TrophyIcon, QuestIcon, UserGroupIcon, GlobeAltIcon, HealthIcon, BackIcon, TrashIcon, MonsterIcon } from '../data/icons';

const ARCHETYPES: Archetype[] = JSON.parse(archetypesJson);

const BackButton: React.FC = () => {
    const { setView } = useGameStore(state => ({ setView: state.setView }));
    return (
        <button
            onClick={() => setView('start')}
            aria-label="بازگشت به صفحه اصلی"
            className="absolute right-4 top-4 flex items-center justify-center p-3 glass-surface rounded-lg text-slate-300 hover:text-white hover:border-slate-500 transition-all"
        >
            <BackIcon className="w-6 h-6"/>
        </button>
    );
};

const StatCard: React.FC<{ icon: React.ReactNode; label: string; value: string | number; colorClass: string }> = ({ icon, label, value, colorClass }) => (
    <div className="glass-surface p-4 rounded-lg flex items-center gap-4 border-l-4" style={{ borderColor: `var(--${colorClass})`}}>
        <div className="text-4xl" style={{ color: `var(--${colorClass})`, filter: `drop-shadow(0 0 8px var(--${colorClass}))` }}>{icon}</div>
        <div>
            <div className="text-sm font-bold text-slate-400">{label}</div>
            <div className="text-3xl font-display text-slate-100">{value}</div>
        </div>
    </div>
);

const Scoreboard: React.FC = () => {
    const [stats, setStats] = useState<ScoreboardStats | null>(null);

    useEffect(() => {
        setStats(scoreboardService.getScoreboard());
    }, []);

    const favoriteArchetype = useMemo(() => {
        if (!stats || Object.keys(stats.playthroughsByArchetype).length === 0) {
            return null;
        }
        const favoriteId = Object.entries(stats.playthroughsByArchetype).sort((a, b) => b[1] - a[1])[0][0];
        return ARCHETYPES.find(a => a.id === favoriteId) || null;
    }, [stats]);

    const handleReset = () => {
        if (window.confirm("آیا از پاک کردن تمام آمارهای تالار افتخارات مطمئن هستید؟ این عمل قابل بازگشت نیست.")) {
            scoreboardService.resetScoreboard();
            setStats(scoreboardService.getScoreboard());
        }
    };

    if (!stats) {
        return <div className="h-screen w-screen flex items-center justify-center">در حال بارگذاری آمار...</div>;
    }

    return (
        <div className="h-screen w-screen flex flex-col items-center justify-center p-4 sm:p-8 animate-fade-in">
            <BackButton />
            <div className="w-full max-w-4xl viewport-frame text-center overflow-y-auto">
                <header className="mb-8">
                    <h1 className="text-5xl md:text-7xl font-display tracking-wider text-transparent bg-clip-text bg-gradient-to-b from-amber-300 to-amber-500" style={{ textShadow: '0 0 25px var(--color-accent-amber)' }}>
                        تالار افتخارات
                    </h1>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-left mb-8">
                    <StatCard icon={<TrophyIcon className="w-8 h-8"/>} label="تعداد بازی‌ها" value={stats.totalPlaythroughs} colorClass="color-accent-amber" />
                    <StatCard icon={<HealthIcon className="w-8 h-8"/>} label="روزهای زنده مانده" value={stats.totalDaysSurvived} colorClass="color-accent-green" />
                    <StatCard icon={<QuestIcon className="w-8 h-8"/>} label="ماموریت‌های تکمیل شده" value={stats.totalQuestsCompleted} colorClass="color-accent-cyan" />
                    <StatCard icon={<MonsterIcon className="w-8 h-8"/>} label="دشمنان شکست‌خورده" value={stats.totalEnemiesDefeated} colorClass="color-accent-rose" />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left">
                    <div className="glass-surface p-6 rounded-lg">
                        <h2 className="font-display text-2xl text-amber-300 mb-4 flex items-center gap-2"><GlobeAltIcon className="w-6 h-6" /> ژانرهای بازی شده</h2>
                        <ul className="space-y-3">
                            {Object.entries(stats.playthroughsByGenre).map(([genre, count]) => (
                                <li key={genre} className="flex justify-between items-center text-lg">
                                    <span className="font-bold text-slate-300 capitalize">{genre === 'scifi' ? 'علمی-تخیلی' : genre === 'fantasy' ? 'فانتزی' : 'کلاسیک'}</span>
                                    <span className="font-mono text-cyan-300">{count}</span>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div className="glass-surface p-6 rounded-lg">
                         <h2 className="font-display text-2xl text-amber-300 mb-4 flex items-center gap-2"><UserGroupIcon className="w-6 h-6" /> کهن‌الگوی مورد علاقه</h2>
                         {favoriteArchetype ? (
                            <div className="text-center p-4 bg-black/20 rounded-md">
                                <h3 className="font-bold text-2xl text-cyan-300">{favoriteArchetype.name}</h3>
                                <p className="text-sm text-slate-400 mt-1">{favoriteArchetype.description}</p>
                                <p className="text-xs font-mono text-slate-500 mt-2">بازی شده: {stats.playthroughsByArchetype[favoriteArchetype.id]} بار</p>
                            </div>
                         ) : (
                            <p className="text-center text-slate-400 p-4">هنوز کهن‌الگوی مورد علاقه‌ای ثبت نشده است.</p>
                         )}
                    </div>
                </div>

                <footer className="mt-8 pt-4 border-t border-[var(--color-border)]">
                     <button 
                        onClick={handleReset}
                        className="flex items-center gap-2 mx-auto text-sm font-bold text-rose-400 hover:text-rose-300 transition-colors opacity-70 hover:opacity-100"
                     >
                        <TrashIcon className="w-4 h-4" />
                        <span>پاک کردن آمار</span>
                    </button>
                </footer>
            </div>
        </div>
    );
};

export default Scoreboard;