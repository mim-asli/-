
import React, { useState, useMemo, useRef } from 'react';
import { Genre, Difficulty, GMPersonality, InventoryItem, Skill, Trait, CustomGameData, GenreDefinition, DifficultyDefinition, GMPersonalityDefinition } from '../types';
import { genresJson, gmPersonalitiesJson, traitsJson, difficultyLevelsJson } from '../data';
import { useFocusTrap } from '../hooks/useFocusTrap';

const PlusIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
    </svg>
);
  
const TrashIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
    </svg>
);

interface CustomScenarioCreatorProps {
    isOpen: boolean;
    onClose: () => void;
    onStart: (data: CustomGameData) => void;
}

const GENRES: Record<string, GenreDefinition> = JSON.parse(genresJson);
const GM_PERSONALITIES: Record<string, GMPersonalityDefinition> = JSON.parse(gmPersonalitiesJson);
const TRAITS: Trait[] = JSON.parse(traitsJson);
const DIFFICULTY_LEVELS: Record<string, DifficultyDefinition> = JSON.parse(difficultyLevelsJson);

const TOTAL_STEPS = 6;
const STEP_TITLES = [
    "۱: مبانی جهان",
    "۲: پروفایل شخصیت",
    "۳: ویژگی‌ها و مهارت‌ها",
    "۴: تجهیزات اولیه",
    "۵: صحنه افتتاحیه",
    "۶: بازبینی و شروع"
];

const Stepper: React.FC<{ currentStep: number }> = ({ currentStep }) => (
    <div className="flex items-center" aria-label="مراحل ساخت سناریو">
        {Array.from({ length: TOTAL_STEPS }).map((_, index) => {
            const step = index + 1;
            const isCompleted = currentStep > step;
            const isActive = currentStep === step;
            return (
                <React.Fragment key={step}>
                    <div className="flex flex-col items-center">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300 ${isActive ? 'bg-[var(--color-accent-primary)] text-slate-900 ring-4 ring-[var(--color-accent-primary)]/30' : isCompleted ? 'bg-[var(--color-accent-primary)]/50 text-slate-200' : 'bg-slate-700 text-slate-300'}`}>
                           {isCompleted ? '✓' : step}
                        </div>
                    </div>
                    {step < TOTAL_STEPS && <div className={`flex-1 h-1 rounded-full transition-colors duration-500 ${isCompleted ? 'bg-[var(--color-accent-primary)]/50' : 'bg-slate-700'}`}></div>}
                </React.Fragment>
            );
        })}
    </div>
);

const CustomScenarioCreator: React.FC<CustomScenarioCreatorProps> = ({ isOpen, onClose, onStart }) => {
    const modalRef = useRef<HTMLDivElement>(null);
    useFocusTrap(modalRef, isOpen);

    const [currentStep, setCurrentStep] = useState(1);
    const [genre, setGenre] = useState<Genre>('fantasy');
    const [difficulty, setDifficulty] = useState<Difficulty>('balanced');
    const [gmPersonality, setGmPersonality] = useState<GMPersonality>('standard');
    const [specialResourceName, setSpecialResourceName] = useState('مانا');
    const [playerName, setPlayerName] = useState('');
    const [playerDescription, setPlayerDescription] = useState('');
    const [archetypeName, setArchetypeName] = useState('');
    const [archetypeDescription, setArchetypeDescription] = useState('');
    const [inventory, setInventory] = useState<InventoryItem[]>([]);
    const [skills, setSkills] = useState<Omit<Skill, 'id' | 'tier' | 'category'>[]>([]);
    const [selectedPerkId, setSelectedPerkId] = useState<string>('');
    const [selectedFlawId, setSelectedFlawId] = useState<string>('');
    const [scenarioName, setScenarioName] = useState('');
    const [scenarioPrompt, setScenarioPrompt] = useState('');
    const [locationX, setLocationX] = useState(50);
    const [locationY, setLocationY] = useState(50);

    const perks = useMemo(() => TRAITS.filter(t => t.type === 'perk'), []);
    const flaws = useMemo(() => TRAITS.filter(t => t.type === 'flaw'), []);

    const isStepValid = useMemo(() => {
        switch (currentStep) {
            case 2: return playerName.trim() !== '' && archetypeName.trim() !== '';
            case 3: return selectedPerkId !== '' && selectedFlawId !== '';
            case 5: return scenarioName.trim() !== '' && scenarioPrompt.trim() !== '';
            default: return true;
        }
    }, [currentStep, playerName, archetypeName, selectedPerkId, selectedFlawId, scenarioName, scenarioPrompt]);

    const isFormValid = useMemo(() => (
        playerName.trim() && archetypeName.trim() && selectedPerkId && selectedFlawId && scenarioName.trim() && scenarioPrompt.trim() && specialResourceName.trim()
    ), [playerName, archetypeName, selectedPerkId, selectedFlawId, scenarioName, scenarioPrompt, specialResourceName]);

    const handleStartClick = () => {
        if (!isFormValid) return;
        const perk = TRAITS.find(t => t.id === selectedPerkId);
        const flaw = TRAITS.find(t => t.id === selectedFlawId);
        if (!perk || !flaw) return;
        
        const gameData: CustomGameData = {
            genre, difficulty, gmPersonality,
            specialResourceName: specialResourceName.trim(),
            playerName: playerName.trim(), playerDescription: playerDescription.trim(),
            archetype: { name: archetypeName.trim(), description: archetypeDescription.trim() },
            inventory,
            skills: skills.map((s, i) => ({ id: `custom_skill_${i}`, name: s.name, description: s.description, tier: 1, category: 'Special' })),
            traits: [perk, flaw],
            scenario: { name: scenarioName.trim(), prompt: scenarioPrompt.trim(), x: locationX, y: locationY }
        };
        onStart(gameData);
    };

    const addInventoryItem = () => setInventory([...inventory, { name: '', description: '' }]);
    const updateInventoryItem = (index: number, field: keyof InventoryItem, value: string) => setInventory(inventory.map((item, i) => i === index ? { ...item, [field]: value } : item));
    const removeInventoryItem = (index: number) => setInventory(inventory.filter((_, i) => i !== index));

    const addSkill = () => setSkills([...skills, { name: '', description: '' }]);
    const updateSkill = (index: number, field: 'name' | 'description', value: string) => setSkills(skills.map((skill, i) => i === index ? { ...skill, [field]: value } : skill));
    const removeSkill = (index: number) => setSkills(skills.filter((_, i) => i !== index));
    
    const nextStep = () => setCurrentStep(prev => Math.min(prev + 1, TOTAL_STEPS));
    const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 1));
    
    const renderContent = () => {
        switch (currentStep) {
            case 1: return (
                <div className="space-y-4 p-3 glass-surface rounded-lg max-w-md mx-auto">
                    <h3 className="font-display text-2xl text-amber-300 mb-3 text-center">مبانی جهان</h3>
                    <div><label className="block text-sm font-bold text-slate-300 mb-1">ژانر</label><select value={genre} onChange={e => setGenre(e.target.value as Genre)} className="w-full p-2 bg-slate-900/70 rounded-md border-2 border-[var(--color-border)] focus:border-[var(--color-border-focus)] focus:ring-0 transition">{Object.entries(GENRES).map(([id, g]) => <option key={id} value={id}>{g.name}</option>)}</select></div>
                    <div><label className="block text-sm font-bold text-slate-300 mb-1">سطح دشواری</label><select value={difficulty} onChange={e => setDifficulty(e.target.value as Difficulty)} className="w-full p-2 bg-slate-900/70 rounded-md border-2 border-[var(--color-border)] focus:border-[var(--color-border-focus)] focus:ring-0 transition">{Object.entries(DIFFICULTY_LEVELS).map(([id, l]) => <option key={id} value={id}>{l.name}</option>)}</select></div>
                    <div><label className="block text-sm font-bold text-slate-300 mb-1">سبک راوی</label><select value={gmPersonality} onChange={e => setGmPersonality(e.target.value as GMPersonality)} className="w-full p-2 bg-slate-900/70 rounded-md border-2 border-[var(--color-border)] focus:border-[var(--color-border-focus)] focus:ring-0 transition">{Object.entries(GM_PERSONALITIES).map(([id, p]) => <option key={id} value={id}>{p.name}</option>)}</select></div>
                    <div><label className="block text-sm font-bold text-slate-300 mb-1">نام منبع ویژه</label><input type="text" value={specialResourceName} onChange={e => setSpecialResourceName(e.target.value)} placeholder="مثال: مانا، اتر، شانس" className="w-full p-2 bg-slate-900/70 rounded-md border-2 border-[var(--color-border)] focus:border-[var(--color-border-focus)] focus:ring-0 transition" /></div>
                </div>
            );
            case 2: return (
                <div className="space-y-4 p-3 glass-surface rounded-lg max-w-md mx-auto">
                    <h3 className="font-display text-2xl text-amber-300 mb-3 text-center">شخصیت</h3>
                    <div><label className="block text-sm font-bold text-slate-300 mb-1">نام شخصیت</label><input type="text" value={playerName} onChange={e => setPlayerName(e.target.value)} className="w-full p-2 bg-slate-900/70 rounded-md border-2 border-[var(--color-border)] focus:border-[var(--color-border-focus)] focus:ring-0 transition" /></div>
                    <div><label className="block text-sm font-bold text-slate-300 mb-1">نام کهن‌الگو/کلاس</label><input type="text" value={archetypeName} onChange={e => setArchetypeName(e.target.value)} className="w-full p-2 bg-slate-900/70 rounded-md border-2 border-[var(--color-border)] focus:border-[var(--color-border-focus)] focus:ring-0 transition" placeholder="مثال: شوالیه سقوط‌کرده" /></div>
                    <div><label className="block text-sm font-bold text-slate-300 mb-1">شرح شخصیت (اختیاری)</label><textarea value={playerDescription} onChange={e => setPlayerDescription(e.target.value)} rows={2} className="w-full p-2 bg-slate-900/70 rounded-md border-2 border-[var(--color-border)] focus:border-[var(--color-border-focus)] focus:ring-0 transition" placeholder="پس‌زمینه یا ظاهر شخصیت"></textarea></div>
                    <div><label className="block text-sm font-bold text-slate-300 mb-1">شرح کهن‌الگو (اختیاری)</label><textarea value={archetypeDescription} onChange={e => setArchetypeDescription(e.target.value)} rows={2} className="w-full p-2 bg-slate-900/70 rounded-md border-2 border-[var(--color-border)] focus:border-[var(--color-border-focus)] focus:ring-0 transition" placeholder="یک جمله در مورد این کلاس"></textarea></div>
                </div>
            );
            case 3: return (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl mx-auto">
                    <div className="space-y-4 p-3 glass-surface rounded-lg">
                        <h3 className="font-display text-xl text-amber-300 text-center">ویژگی‌ها</h3>
                        <div><label className="block text-sm font-bold text-slate-300 mb-1">ویژگی مثبت (Perk)</label><select value={selectedPerkId} onChange={e => setSelectedPerkId(e.target.value)} className="w-full p-2 bg-slate-900/70 rounded-md border-2 border-[var(--color-border)] focus:border-[var(--color-border-focus)] focus:ring-0 transition"><option value="">انتخاب کنید...</option>{perks.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></div>
                        <div><label className="block text-sm font-bold text-slate-300 mb-1">ویژگی منفی (Flaw)</label><select value={selectedFlawId} onChange={e => setSelectedFlawId(e.target.value)} className="w-full p-2 bg-slate-900/70 rounded-md border-2 border-[var(--color-border)] focus:border-[var(--color-border-focus)] focus:ring-0 transition"><option value="">انتخاب کنید...</option>{flaws.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}</select></div>
                    </div>
                    <div className="space-y-4 p-3 glass-surface rounded-lg">
                        <h3 className="font-display text-xl text-amber-300 text-center">مهارت‌ها</h3>
                        <div className="space-y-2 max-h-48 overflow-y-auto pr-2">{skills.map((skill, index) => (<div key={index} className="flex gap-2 items-start"><div className="flex-grow"><input type="text" placeholder="نام مهارت" value={skill.name} onChange={e => updateSkill(index, 'name', e.target.value)} className="w-full text-sm p-1.5 bg-slate-800/70 rounded-md border border-[var(--color-border)] focus:border-[var(--color-border-focus)] focus:ring-0 transition" /><textarea placeholder="توضیح مهارت" value={skill.description} onChange={e => updateSkill(index, 'description', e.target.value)} rows={1} className="w-full text-xs mt-1 p-1.5 bg-slate-800/70 rounded-md border border-[var(--color-border)] focus:border-[var(--color-border-focus)] focus:ring-0 transition"></textarea></div><button onClick={() => removeSkill(index)} className="p-2 bg-rose-900/50 text-rose-300 rounded-md hover:bg-rose-900 transition-colors flex-shrink-0 mt-0.5" aria-label={`حذف مهارت ${skill.name}`}><TrashIcon className="w-5 h-5"/></button></div>))}</div >
                        <button onClick={addSkill} className="w-full mt-2 flex items-center justify-center gap-2 text-sm font-bold p-2 bg-slate-700/50 text-slate-300 hover:bg-slate-700 rounded-md transition-colors"><PlusIcon className="w-4 h-4"/> افزودن مهارت</button>
                    </div>
                </div>
            );
            case 4: return (
                <div className="space-y-4 p-3 glass-surface rounded-lg max-w-md mx-auto">
                    <h3 className="font-display text-2xl text-amber-300 text-center">کوله پشتی</h3>
                    <div className="space-y-2 max-h-60 overflow-y-auto pr-2">{inventory.map((item, index) => (<div key={index} className="flex gap-2 items-start"><div className="flex-grow"><input type="text" placeholder="نام آیتم" value={item.name} onChange={e => updateInventoryItem(index, 'name', e.target.value)} className="w-full text-sm p-1.5 bg-slate-800/70 rounded-md border border-[var(--color-border)] focus:border-[var(--color-border-focus)] focus:ring-0 transition" /><textarea placeholder="توضیح آیتم" value={item.description} onChange={e => updateInventoryItem(index, 'description', e.target.value)} rows={1} className="w-full text-xs mt-1 p-1.5 bg-slate-800/70 rounded-md border border-[var(--color-border)] focus:border-[var(--color-border-focus)] focus:ring-0 transition"></textarea></div><button onClick={() => removeInventoryItem(index)} className="p-2 bg-rose-900/50 text-rose-300 rounded-md hover:bg-rose-900 transition-colors flex-shrink-0 mt-0.5" aria-label={`حذف آیتم ${item.name}`}><TrashIcon className="w-5 h-5"/></button></div>))}</div>
                    <button onClick={addInventoryItem} className="w-full mt-2 flex items-center justify-center gap-2 text-sm font-bold p-2 bg-slate-700/50 text-slate-300 hover:bg-slate-700 rounded-md transition-colors"><PlusIcon className="w-4 h-4"/> افزودن آیتم</button>
                </div>
            );
            case 5: return (
                 <div className="space-y-4 p-3 glass-surface rounded-lg max-w-2xl mx-auto">
                     <h3 className="font-display text-2xl text-amber-300 mb-3 text-center">صحنه افتتاحیه</h3>
                     <div><label className="block text-sm font-bold text-slate-300 mb-1">نام مکان شروع</label><input type="text" value={scenarioName} onChange={e => setScenarioName(e.target.value)} className="w-full p-2 bg-slate-900/70 rounded-md border-2 border-[var(--color-border)] focus:border-[var(--color-border-focus)] focus:ring-0 transition" placeholder="مثال: غار اژدهای خفته" /></div>
                     <div><label className="block text-sm font-bold text-slate-300 mb-1">مختصات شروع (X: {locationX}, Y: {locationY})</label><div className="flex gap-2"><input type="range" min="0" max="100" value={locationX} onChange={e => setLocationX(parseInt(e.target.value, 10))} className="w-full" /><input type="range" min="0" max="100" value={locationY} onChange={e => setLocationY(parseInt(e.target.value, 10))} className="w-full" /></div></div>
                     <div><label className="block text-sm font-bold text-slate-300 mb-1">متن شروع داستان</label><textarea value={scenarioPrompt} onChange={e => setScenarioPrompt(e.target.value)} rows={8} className="w-full p-2 bg-slate-900/70 rounded-md border-2 border-[var(--color-border)] focus:border-[var(--color-border-focus)] focus:ring-0 transition font-mono text-sm" placeholder="متن افتتاحیه بازی را اینجا بنویسید..."></textarea><p className="text-xs text-slate-500 mt-1">این متن اولین چیزی است که هوش مصنوعی می‌بیند تا بازی را شروع کند.</p></div>
                 </div>
            );
            case 6: 
                const perk = TRAITS.find(t => t.id === selectedPerkId);
                const flaw = TRAITS.find(t => t.id === selectedFlawId);
                return (
                    <div className="p-3 glass-surface rounded-lg max-w-3xl mx-auto text-sm">
                        <h3 className="font-display text-2xl text-amber-300 mb-3 text-center">بازبینی نهایی</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div><strong className="text-slate-300">نام:</strong> {playerName}</div>
                            <div><strong className="text-slate-300">کلاس:</strong> {archetypeName}</div>
                            <div><strong className="text-slate-300">ژانر:</strong> {GENRES[genre].name}</div>
                            <div><strong className="text-slate-300">سختی:</strong> {DIFFICULTY_LEVELS[difficulty].name}</div>
                            <div className="md:col-span-2"><strong className="text-slate-300">ویژگی مثبت:</strong> {perk?.name}</div>
                            <div className="md:col-span-2"><strong className="text-slate-300">ویژگی منفی:</strong> {flaw?.name}</div>
                            <div className="md:col-span-2"><strong className="text-slate-300">مهارت‌ها:</strong> {skills.length > 0 ? skills.map(s => s.name).join(', ') : 'هیچ'}</div>
                            <div className="md:col-span-2"><strong className="text-slate-300">آیتم‌ها:</strong> {inventory.length > 0 ? inventory.map(i => i.name).join(', ') : 'هیچ'}</div>
                            <div className="md:col-span-2"><strong className="text-slate-300">مکان شروع:</strong> {scenarioName}</div>
                        </div>
                    </div>
                );
            default: return null;
        }
    };
    
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-2 sm:p-4 animate-fade-in" onClick={onClose}>
            <div
                ref={modalRef}
                role="dialog"
                aria-modal="true"
                aria-labelledby="custom-scenario-title"
                className="w-full max-w-6xl h-full max-h-[98vh] glass-surface rounded-2xl shadow-2xl flex flex-col interactive-frame"
                onClick={e => e.stopPropagation()}
            >
                <header className="p-4 border-b-2 border-[var(--color-border)] flex-shrink-0">
                    <h1 id="custom-scenario-title" className="font-display text-3xl md:text-4xl text-center text-[var(--color-accent-primary)]" style={{ textShadow: '0 0 15px var(--color-accent-primary)' }}>خلق دنیای شما</h1>
                    <p className="text-center text-slate-300 font-bold mt-1">{STEP_TITLES[currentStep - 1]}</p>
                    <div className="max-w-md mx-auto mt-4"><Stepper currentStep={currentStep} /></div>
                </header>
                
                <div className="flex-grow p-4 md:p-6 overflow-y-auto custom-scrollbar flex flex-col justify-center">
                    <div className="animate-fade-in">{renderContent()}</div>
                </div>

                <footer className="p-4 flex-shrink-0 border-t-2 border-[var(--color-border)] bg-black/20 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <button onClick={onClose} className="font-bold text-slate-300 hover:text-white transition-colors px-6 py-2 rounded-lg text-center">انصراف</button>
                    <div className="flex items-center gap-4">
                        {currentStep > 1 && <button onClick={prevStep} className="font-bold text-slate-300 hover:text-white transition-colors px-6 py-2 rounded-lg text-center"> &larr; قبلی</button>}
                        
                        {currentStep < TOTAL_STEPS ? (
                            <button onClick={nextStep} disabled={!isStepValid} className="font-display px-8 py-3 bg-[var(--color-accent-cyan)] text-slate-900 font-bold text-xl rounded-lg hover:enabled:bg-cyan-300 transition-all disabled:bg-slate-600 disabled:text-slate-400 disabled:cursor-not-allowed">
                                بعدی &rarr;
                            </button>
                        ) : (
                            <button onClick={handleStartClick} disabled={!isFormValid} className="font-display px-8 py-3 bg-[var(--color-accent-secondary)] text-slate-900 font-bold text-xl rounded-lg hover:enabled:brightness-110 transition-all transform hover:enabled:scale-105 shadow-lg shadow-[var(--color-accent-secondary)]/20 disabled:bg-slate-600 disabled:text-slate-400 disabled:cursor-not-allowed">
                                آغاز ماجراجویی
                            </button>
                        )}
                    </div>
                </footer>
            </div>
        </div>
    );
};

export default CustomScenarioCreator;
