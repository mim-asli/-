import React, { useState, useEffect, useRef, useCallback } from 'react';
import * as saveGameService from '../services/saveGameService';
import { SaveSlot, Genre, Trait, Difficulty, GMPersonality, CustomGameData, Archetype, Scenario, GenreDefinition, DifficultyDefinition, GMPersonalityDefinition } from '../types';
import { archetypesJson, scenariosJson, genresJson, traitsJson, gmPersonalitiesJson, difficultyLevelsJson } from '../data';
import { 
    TechnomancerIcon, VoidRunnerIcon, GhostIcon, RoninIcon, BiotechIcon, PsionIcon,
    KnightIcon, MageIcon, RangerIcon, RogueIcon, ClericIcon, DwarfIcon,
    InvestigatorIcon, ExplorerIcon, SpyIcon, JournalistIcon,
    BookIcon, AdjustmentsIcon, ShieldExclamationIcon, CynicalIcon, PoeticIcon, MinimalistIcon, HumorousIcon,
    StalkerIcon, DiplomatIcon, BarbarianIcon, BardIcon, MechanicIcon, ShadowIcon, TrophyIcon
} from '../data/icons';
import { useGameStore, startNewGame, startCustomGame, loadGame } from '../store/gameStore';
import { useFocusTrap } from '../hooks/useFocusTrap';
import CustomScenarioCreator from './CustomScenarioCreator';

// --- Parsing Data from JSON strings ---
const ARCHETYPES: Archetype[] = JSON.parse(archetypesJson);
const SCENARIOS: Record<string, Scenario> = JSON.parse(scenariosJson);
const GENRES: Record<string, GenreDefinition> = JSON.parse(genresJson);
const TRAITS: Trait[] = JSON.parse(traitsJson);
const GM_PERSONALITIES: Record<string, GMPersonalityDefinition> = JSON.parse(gmPersonalitiesJson);
const DIFFICULTY_LEVELS: Record<string, DifficultyDefinition> = JSON.parse(difficultyLevelsJson);

// --- Icons ---
const archetypeIcons: Record<string, React.ReactNode> = {
    technomancer: <TechnomancerIcon className="w-12 h-12" />, void_runner: <VoidRunnerIcon className="w-12 h-12" />,
    ghost: <GhostIcon className="w-12 h-12" />, ronin: <RoninIcon className="w-12 h-12" />,
    biotech: <BiotechIcon className="w-12 h-12" />, psion: <PsionIcon className="w-12 h-12" />,
    stalker: <StalkerIcon className="w-12 h-12" />, diplomat: <DiplomatIcon className="w-12 h-12" />,
    knight: <KnightIcon className="w-12 h-12" />, mage: <MageIcon className="w-12 h-12" />,
    ranger: <RangerIcon className="w-12 h-12" />, rogue: <RogueIcon className="w-12 h-12" />,
    cleric: <ClericIcon className="w-12 h-12" />, dwarf_defender: <DwarfIcon className="w-12 h-12" />,
    barbarian: <BarbarianIcon className="w-12 h-12" />, bard: <BardIcon className="w-12 h-12" />,
    investigator: <InvestigatorIcon className="w-12 h-12" />, explorer: <ExplorerIcon className="w-12 h-12" />,
    spy: <SpyIcon className="w-12 h-12" />, journalist: <JournalistIcon className="w-12 h-12" />,
    mechanic: <MechanicIcon className="w-12 h-12" />, shadow: <ShadowIcon className="w-12 h-12" />,
};

const difficultyIcons: Record<string, React.ReactNode> = {
    book: <BookIcon className="w-8 h-8" />,
    adjustments: <AdjustmentsIcon className="w-8 h-8" />,
    shieldExclamation: <ShieldExclamationIcon className="w-8 h-8" />,
};

const gmPersonalityIcons: Record<string, React.ReactNode> = {
    book: <BookIcon className="w-8 h-8" />,
    cynical: <CynicalIcon className="w-8 h-8" />,
    poetic: <PoeticIcon className="w-8 h-8" />,
    minimalist: <MinimalistIcon className="w-8 h-8" />,
    humorous: <HumorousIcon className="w-8 h-8" />,
};

const ErrorIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className} aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
    </svg>
);
const CogIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className} aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-1.007 1.11-.952l2.104.166c.54.043.955.543.865 1.081l-1.216 5.165c.713.223 1.37.542 1.96.957l4.437-1.482c.54-.18.995.151.995.742l.023 2.308c0 .542-.444.972-.994 1.052l-4.11 1.03c-.22.411-.47.804-.74 1.167l3.013 3.699c.42.518.106 1.258-.51 1.442l-2.435.812c-.54.18-.995-.151-1.175-.68l-1.95-4.422a3.973 3.973 0 0 0-1.254 0l-1.95 4.422c-.18.529-.635.86-1.175-.68l-2.436-.812c-.615-.184-.93-1.02-.51-1.442l3.014-3.7c-.27-.362-.52-.755-.74-1.166l-4.11-1.03c-.55-.08-.994-.51-.994-1.052l.023-2.308c0-.59.455-.922.995-.742l4.438 1.482c.59-.415 1.247-.734 1.96-.957l-1.216-5.165c-.09-.538.325-1.038.865-1.081l2.104-.166Z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
    </svg>
);
const TrashIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
    </svg>
);
const WrenchScrewdriverIcon = ({ className }: { className?: string }) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17 17.25 21A2.652 2.652 0 0 0 21 17.25l-5.877-5.877M11.42 15.17l2.495-2.495a1.125 1.125 0 0 1 1.591 0l3.904 3.904a1.125 1.125 0 0 1 0 1.591l-2.495 2.495M11.42 15.17 6.344 20.25a2.25 2.25 0 0 1-3.182-3.182l5.25-5.25M11.42 15.17 15.75 10.92a2.25 2.25 0 0 0-3.182-3.182l-5.25 5.25a2.25 2.25 0 0 0 3.182 3.182Z" /></svg>;
const CloseIcon = ({ className }: { className?: string }) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>;

const MainMenuButton: React.FC<{ onClick: () => void; children: React.ReactNode; className?: string }> = ({ onClick, children, className }) => (
    <button
        onClick={onClick}
        className={`font-display text-3xl py-3 px-8 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:scale-105 transition-all duration-300 ${className}`}
    >
        {children}
    </button>
);

const Modal: React.FC<{ isOpen: boolean; onClose: () => void; title: string; children: React.ReactNode; }> = ({ isOpen, onClose, title, children }) => {
    const modalRef = useRef<HTMLDivElement>(null);
    useFocusTrap(modalRef, isOpen);

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') onClose();
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [onClose]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
            <div
                ref={modalRef}
                role="dialog"
                aria-modal="true"
                aria-labelledby="modal-title"
                className="w-full h-full max-w-5xl max-h-[90vh] viewport-frame flex flex-col"
                onClick={e => e.stopPropagation()}
            >
                <header className="flex-shrink-0 flex items-center justify-between pb-4 border-b-2 border-[var(--color-border)]">
                    <h2 id="modal-title" className="text-3xl font-display text-center text-[var(--color-accent-primary)]" style={{textShadow: '0 0 10px var(--color-accent-primary)'}}>{title}</h2>
                    <button onClick={onClose} className="p-2 text-slate-400 hover:text-white" aria-label="بستن"><CloseIcon className="w-6 h-6" /></button>
                </header>
                <div className="flex-grow overflow-y-auto mt-4 pr-2 -mr-2">{children}</div>
            </div>
        </div>
    );
};

// --- New Game Creator Component ---
const NewGameCreator: React.FC<{ onStart: (genre: Genre, charId: string, scenarioId: string, pName: string, pDesc: string, traits: string[], difficulty: Difficulty, gmPersonality: GMPersonality) => void }> = ({ onStart }) => {
    const [step, setStep] = useState(1);
    const [selectedGenre, setSelectedGenre] = useState<Genre>('scifi');
    const [selectedArchetypeId, setSelectedArchetypeId] = useState('');
    const [selectedScenarioId, setSelectedScenarioId] = useState('');
    const [playerName, setPlayerName] = useState('');
    const [playerDescription, setPlayerDescription] = useState('');
    const [selectedPerkId, setSelectedPerkId] = useState('');
    const [selectedFlawId, setSelectedFlawId] = useState('');
    const [difficulty, setDifficulty] = useState<Difficulty>('balanced');
    const [gmPersonality, setGmPersonality] = useState<GMPersonality>('standard');
    
    const availableArchetypes = ARCHETYPES.filter(a => a.genre === selectedGenre);
    const availableScenarios = Object.entries(SCENARIOS).filter(([_, s]) => s.genre === selectedGenre);
    const perks = TRAITS.filter(t => t.type === 'perk');
    const flaws = TRAITS.filter(t => t.type === 'flaw');

    useEffect(() => {
        setSelectedArchetypeId('');
        setSelectedScenarioId('');
    }, [selectedGenre]);

    const handleStart = () => {
        if (!selectedArchetypeId || !selectedScenarioId || !playerName.trim() || !selectedPerkId || !selectedFlawId) {
            alert("لطفا تمام فیلدها را تکمیل کنید.");
            return;
        }
        onStart(selectedGenre, selectedArchetypeId, selectedScenarioId, playerName, playerDescription, [selectedPerkId, selectedFlawId], difficulty, gmPersonality);
    };

    const nextStep = () => setStep(s => s + 1);
    const prevStep = () => setStep(s => s - 1);

    const renderStep = () => {
        switch (step) {
            case 1: // Genre
                return (
                    <div className="space-y-4 text-center">
                        <h3 className="text-2xl font-display text-amber-300">ژانر ماجراجویی خود را انتخاب کنید</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {Object.entries(GENRES).map(([id, genre]) => (
                                <button key={id} onClick={() => { setSelectedGenre(id as Genre); nextStep(); }} className="p-6 glass-surface rounded-lg border-2 border-transparent hover:border-cyan-400 transition-colors">
                                    <h4 className="text-2xl font-display text-cyan-300">{genre.name}</h4>
                                    <p className="text-sm text-slate-400 mt-2">{genre.description}</p>
                                </button>
                            ))}
                        </div>
                    </div>
                );
            case 2: // Archetype
                return (
                     <div className="space-y-4">
                        <h3 className="text-2xl font-display text-amber-300 text-center">کهن‌الگوی خود را انتخاب کنید</h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {availableArchetypes.map(arch => (
                                <button key={arch.id} onClick={() => setSelectedArchetypeId(arch.id)} className={`p-4 glass-surface rounded-lg border-2 transition-colors ${selectedArchetypeId === arch.id ? 'border-cyan-400' : 'border-transparent hover:border-slate-500'}`}>
                                    <div className="text-cyan-400 flex justify-center mb-2">{archetypeIcons[arch.iconId]}</div>
                                    <h4 className="text-xl font-display text-cyan-300">{arch.name}</h4>
                                    <p className="text-xs text-slate-400 mt-1">{arch.description}</p>
                                </button>
                            ))}
                        </div>
                         <div className="flex justify-between mt-6">
                            <button onClick={prevStep} className="font-bold text-slate-300 hover:text-white transition-colors"> &larr; بازگشت</button>
                            <button onClick={nextStep} disabled={!selectedArchetypeId} className="font-display px-6 py-2 bg-cyan-600 text-white rounded-md hover:bg-cyan-500 transition-colors disabled:bg-slate-600">بعدی &rarr;</button>
                        </div>
                    </div>
                );
            case 3: // Player Details
                return (
                    <div className="space-y-4 max-w-lg mx-auto">
                        <h3 className="text-2xl font-display text-amber-300 text-center">جزئیات شخصیت</h3>
                        <div><label className="block text-sm font-bold text-slate-300 mb-1">نام</label><input type="text" value={playerName} onChange={e => setPlayerName(e.target.value)} className="w-full p-2 bg-slate-900/70 rounded-md border-2 border-[var(--color-border)] focus:border-[var(--color-border-focus)] focus:ring-0 transition" /></div>
                        <div><label className="block text-sm font-bold text-slate-300 mb-1">شرح (اختیاری)</label><textarea value={playerDescription} onChange={e => setPlayerDescription(e.target.value)} rows={3} className="w-full p-2 bg-slate-900/70 rounded-md border-2 border-[var(--color-border)] focus:border-[var(--color-border-focus)] focus:ring-0 transition" placeholder="ظاهر یا پیشینه شخصیت خود را توصیف کنید..."></textarea></div>
                         <div className="flex justify-between mt-6">
                            <button onClick={prevStep} className="font-bold text-slate-300 hover:text-white transition-colors"> &larr; بازگشت</button>
                            <button onClick={nextStep} disabled={!playerName.trim()} className="font-display px-6 py-2 bg-cyan-600 text-white rounded-md hover:bg-cyan-500 transition-colors disabled:bg-slate-600">بعدی &rarr;</button>
                        </div>
                    </div>
                );
             case 4: // Traits
                return (
                    <div className="space-y-4 max-w-lg mx-auto">
                        <h3 className="text-2xl font-display text-amber-300 text-center">ویژگی‌ها را انتخاب کنید</h3>
                        <div>
                            <label className="block text-sm font-bold text-slate-300 mb-1">ویژگی مثبت (Perk)</label>
                            <select value={selectedPerkId} onChange={e => setSelectedPerkId(e.target.value)} className="w-full p-2 bg-slate-900/70 rounded-md border-2 border-[var(--color-border)] focus:border-[var(--color-border-focus)] focus:ring-0 transition"><option value="">انتخاب کنید...</option>{perks.map(p => <option key={p.id} value={p.id}>{p.name} - {p.description}</option>)}</select>
                        </div>
                         <div>
                            <label className="block text-sm font-bold text-slate-300 mb-1">ویژگی منفی (Flaw)</label>
                            <select value={selectedFlawId} onChange={e => setSelectedFlawId(e.target.value)} className="w-full p-2 bg-slate-900/70 rounded-md border-2 border-[var(--color-border)] focus:border-[var(--color-border-focus)] focus:ring-0 transition"><option value="">انتخاب کنید...</option>{flaws.map(f => <option key={f.id} value={f.id}>{f.name} - {f.description}</option>)}</select>
                        </div>
                        <div className="flex justify-between mt-6">
                            <button onClick={prevStep} className="font-bold text-slate-300 hover:text-white transition-colors"> &larr; بازگشت</button>
                            <button onClick={nextStep} disabled={!selectedPerkId || !selectedFlawId} className="font-display px-6 py-2 bg-cyan-600 text-white rounded-md hover:bg-cyan-500 transition-colors disabled:bg-slate-600">بعدی &rarr;</button>
                        </div>
                    </div>
                );
             case 5: // Scenario
                return (
                    <div className="space-y-4">
                        <h3 className="text-2xl font-display text-amber-300 text-center">سناریوی شروع را انتخاب کنید</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {availableScenarios.map(([id, scenario]) => (
                                <button key={id} onClick={() => setSelectedScenarioId(id)} className={`p-4 glass-surface rounded-lg border-2 text-left transition-colors ${selectedScenarioId === id ? 'border-cyan-400' : 'border-transparent hover:border-slate-500'}`}>
                                    <h4 className="font-bold text-cyan-300">{scenario.name}</h4>
                                    <p className="text-xs text-slate-400 mt-1">{scenario.description}</p>
                                </button>
                            ))}
                        </div>
                        <div className="flex justify-between mt-6">
                            <button onClick={prevStep} className="font-bold text-slate-300 hover:text-white transition-colors"> &larr; بازگشت</button>
                            <button onClick={nextStep} disabled={!selectedScenarioId} className="font-display px-6 py-2 bg-cyan-600 text-white rounded-md hover:bg-cyan-500 transition-colors disabled:bg-slate-600">بعدی &rarr;</button>
                        </div>
                    </div>
                );
             case 6: // Difficulty & GM Style
                 return (
                    <div className="space-y-8">
                         <div>
                             <h3 className="text-2xl font-display text-amber-300 text-center mb-4">سطح دشواری</h3>
                             <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                 {Object.entries(DIFFICULTY_LEVELS).map(([id, level]) => (
                                     <button key={id} onClick={() => setDifficulty(id as Difficulty)} className={`p-4 glass-surface rounded-lg border-2 text-center transition-colors ${difficulty === id ? 'border-cyan-400' : 'border-transparent hover:border-slate-500'}`}>
                                         <div className="text-cyan-400 flex justify-center mb-2">{difficultyIcons[level.iconId]}</div>
                                         <h4 className="font-bold text-cyan-300">{level.name}</h4>
                                         <p className="text-xs text-slate-400 mt-1">{level.description}</p>
                                     </button>
                                 ))}
                             </div>
                         </div>
                         <div>
                             <h3 className="text-2xl font-display text-amber-300 text-center mb-4">سبک راوی</h3>
                              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                                 {Object.entries(GM_PERSONALITIES).map(([id, personality]) => (
                                     <button key={id} onClick={() => setGmPersonality(id as GMPersonality)} className={`p-4 glass-surface rounded-lg border-2 text-center transition-colors ${gmPersonality === id ? 'border-cyan-400' : 'border-transparent hover:border-slate-500'}`}>
                                         <div className="text-cyan-400 flex justify-center mb-2">{gmPersonalityIcons[personality.iconId]}</div>
                                         <h4 className="font-bold text-sm text-cyan-300">{personality.name}</h4>
                                     </button>
                                 ))}
                             </div>
                         </div>
                         <div className="flex justify-between pt-6 border-t border-slate-700">
                             <button onClick={prevStep} className="font-bold text-slate-300 hover:text-white transition-colors"> &larr; بازگشت</button>
                             <button onClick={handleStart} className="font-display px-8 py-3 bg-rose-600 text-white rounded-md hover:bg-rose-500 transition-colors transform hover:scale-105 shadow-lg shadow-rose-500/30">شروع ماجراجویی</button>
                         </div>
                    </div>
                );
        }
    };
    return <div>{renderStep()}</div>
};

// --- Load Game Component ---
const LoadGame: React.FC<{ saves: SaveSlot[]; onLoad: (save: SaveSlot) => void; onDelete: (id: string) => void; }> = ({ saves, onLoad, onDelete }) => {
    const [deletingId, setDeletingId] = useState<string | null>(null);

    const handleDeleteClick = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        setDeletingId(id);
    };

    const confirmDelete = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        onDelete(id);
        setDeletingId(null);
    };

    return (
        <div className="space-y-3">
            {saves.length === 0 ? (
                <p className="text-center text-slate-400 p-8">هیچ ماجراجویی ذخیره شده‌ای یافت نشد.</p>
            ) : (
                saves.map(save => (
                    <div key={save.id} className="relative group">
                        <button onClick={() => onLoad(save)} className="w-full text-left p-4 glass-surface rounded-lg hover:border-slate-500 transition-colors">
                            <h4 className="font-bold text-lg text-cyan-300">{save.name}</h4>
                            <p className="text-xs text-slate-400">ذخیره شده در: {new Date(save.savedAt).toLocaleString('fa-IR')}</p>
                        </button>
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            {deletingId === save.id ? (
                                <>
                                    <span className="text-xs text-rose-300">مطمئن هستید؟</span>
                                    <button onClick={(e) => confirmDelete(e, save.id)} className="px-2 py-1 text-xs bg-rose-700 text-white rounded">بله</button>
                                    <button onClick={(e) => { e.stopPropagation(); setDeletingId(null); }} className="px-2 py-1 text-xs bg-slate-600 text-white rounded">خیر</button>
                                </>
                            ) : (
                                <button onClick={(e) => handleDeleteClick(e, save.id)} className="p-2 text-rose-400 hover:bg-rose-500/10 rounded-full" aria-label={`حذف ${save.name}`}><TrashIcon className="w-5 h-5"/></button>
                            )}
                        </div>
                    </div>
                ))
            )}
        </div>
    );
};

// --- Main Start Screen Component ---
const StartScreen: React.FC = () => {
    const { error, setView } = useGameStore(state => ({ error: state.error, setView: state.setView }));
    const [saves, setSaves] = useState<SaveSlot[]>([]);
    const [viewMode, setViewMode] = useState<'main' | 'load' | 'new' | 'custom'>('main');
    const [isCustomCreatorOpen, setCustomCreatorOpen] = useState(false);

    const refreshSaves = useCallback(() => {
        setSaves(saveGameService.getSavedGames());
    }, []);

    useEffect(() => {
        refreshSaves();
    }, [refreshSaves]);

    const handleStartNewGame = (genre: Genre, charId: string, scenarioId: string, pName: string, pDesc: string, traits: string[], difficulty: Difficulty, gmPersonality: GMPersonality) => {
        startNewGame(genre, charId, scenarioId, pName, pDesc, traits, difficulty, gmPersonality);
    };
    
    const handleStartCustomGame = (data: CustomGameData) => {
        setCustomCreatorOpen(false);
        startCustomGame(data);
    };

    const handleLoadGame = (save: SaveSlot) => {
        loadGame(save);
    };

    const handleDeleteSave = (id: string) => {
        saveGameService.deleteSave(id);
        refreshSaves();
    };
    
    const handleExport = () => saveGameService.exportAllSaves();
    
    const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            const result = saveGameService.importSaves(e.target?.result as string);
            alert(result.message);
            if (result.success) refreshSaves();
        };
        reader.readAsText(file);
        event.target.value = ''; // Reset input
    };

    return (
        <div className="h-screen w-screen flex flex-col items-center justify-center p-4 sm:p-8 animate-fade-in">
             <div className="absolute top-4 left-4 flex gap-2">
                <button onClick={() => setView('settings')} className="flex items-center gap-2 p-2 px-3 text-sm font-bold text-slate-400 hover:text-white glass-surface rounded-lg transition-colors"><CogIcon className="w-5 h-5" /><span>تنظیمات</span></button>
                <button onClick={() => setView('scoreboard')} className="flex items-center gap-2 p-2 px-3 text-sm font-bold text-slate-400 hover:text-white glass-surface rounded-lg transition-colors"><TrophyIcon className="w-5 h-5" /><span>تالار افتخارات</span></button>
             </div>
             
             <div className="text-center">
                 <h1 className="text-7xl md:text-9xl font-display tracking-wider text-transparent bg-clip-text bg-gradient-to-b from-cyan-300 to-purple-500 animate-text-glitch">
                    داستان
                </h1>
                <h2 className="text-2xl md:text-3xl font-display text-amber-300 -mt-2 md:-mt-4 text-glow-secondary">
                    رابط فرماندهی
                </h2>
             </div>

            {error && (
                <div role="alert" className="mt-8 max-w-lg p-4 bg-rose-900/50 border-2 border-rose-500/50 text-rose-200 rounded-lg flex items-center gap-3">
                    <ErrorIcon className="w-6 h-6 flex-shrink-0" />
                    <div>
                        <h3 className="font-bold">خطا در اتصال</h3>
                        <p className="text-sm">{error}</p>
                    </div>
                </div>
            )}
            
            <nav className="mt-12 flex flex-col items-center gap-4">
                <MainMenuButton onClick={() => setViewMode('new')}>ماجراجویی جدید</MainMenuButton>
                <MainMenuButton onClick={() => setViewMode('load')}>بارگذاری ماجراجویی</MainMenuButton>
                <MainMenuButton onClick={() => setCustomCreatorOpen(true)} className="flex items-center gap-2"><WrenchScrewdriverIcon className="w-6 h-6"/><span>سناریوی سفارشی</span></MainMenuButton>
            </nav>

            <Modal isOpen={viewMode === 'new'} onClose={() => setViewMode('main')} title="ماجراجویی جدید">
                <NewGameCreator onStart={handleStartNewGame} />
            </Modal>
            
            <Modal isOpen={viewMode === 'load'} onClose={() => setViewMode('main')} title="بارگذاری ماجراجویی">
                <LoadGame saves={saves} onLoad={handleLoadGame} onDelete={handleDeleteSave} />
                <div className="mt-6 pt-4 border-t-2 border-[var(--color-border)] flex flex-col sm:flex-row gap-2">
                    <button onClick={handleExport} className="w-full sm:w-auto flex-1 font-bold px-4 py-2 bg-slate-700/50 text-slate-300 rounded-md hover:bg-slate-700 transition-colors">خروجی</button>
                    <label className="w-full sm:w-auto flex-1 font-bold px-4 py-2 bg-slate-700/50 text-slate-300 rounded-md hover:bg-slate-700 transition-colors text-center cursor-pointer">
                        <span>ورودی</span>
                        <input type="file" accept=".json" onChange={handleImport} className="hidden" />
                    </label>
                </div>
            </Modal>
            
             <CustomScenarioCreator
                isOpen={isCustomCreatorOpen}
                onClose={() => setCustomCreatorOpen(false)}
                onStart={handleStartCustomGame}
            />

        </div>
    );
};

export default StartScreen;