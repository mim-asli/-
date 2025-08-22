import React, { useState, useMemo, useEffect } from 'react';
import { useGameStore, useItem, dropItem, learnSkill, travelTo, saveGame, craftItems } from '../store/gameStore';
import { InventoryItem, Skill, Quest, Trait, DiscoveredLocation } from '../types';
import LocationDisplay from './LocationDisplay';
import { 
    InventoryIcon, UserIcon, QuestIcon, MapIcon, UseIcon, DropIcon, LearnIcon, SaveIcon, CraftingIcon 
} from '../data/icons';
import WorldMap from './WorldMap';

type SidebarTab = 'inventory' | 'character' | 'quests' | 'map';

const TabButton: React.FC<{
    icon: React.ReactNode;
    label: string;
    isActive: boolean;
    onClick: () => void;
}> = ({ icon, label, isActive, onClick }) => (
    <button
        role="tab"
        aria-selected={isActive}
        onClick={onClick}
        className={`flex-1 flex flex-col items-center justify-center p-2 text-xs font-bold transition-colors duration-200 border-b-2 ${
            isActive
                ? 'text-[var(--color-accent-primary)] border-[var(--color-accent-primary)]'
                : 'text-[var(--color-text-secondary)] border-transparent hover:text-[var(--color-text-primary)] hover:border-slate-500'
        }`}
    >
        {icon}
        <span className="mt-1">{label}</span>
    </button>
);

const InventoryPanel: React.FC = () => {
    const { inventory, isLoading } = useGameStore(state => ({
        inventory: state.inventory,
        isLoading: state.isLoading,
    }));
    const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
    const [isCrafting, setIsCrafting] = useState(false);
    const [craftingItems, setCraftingItems] = useState<InventoryItem[]>([]);

    const handleItemClick = (item: InventoryItem) => {
        if (isCrafting) {
            const isSelected = craftingItems.some(ci => ci.name === item.name);
            if (isSelected) {
                setCraftingItems(craftingItems.filter(ci => ci.name !== item.name));
            } else if (craftingItems.length < 4) { // Limit to 4 items for crafting
                setCraftingItems([...craftingItems, item]);
            }
        } else {
            setSelectedItem(item);
        }
    };
    
    const handleCombine = () => {
        if (craftingItems.length < 2 || isLoading) return;
        craftItems(craftingItems.map(i => i.name));
        // Reset state after action
        setCraftingItems([]);
        setIsCrafting(false);
    };

    const toggleCraftingMode = () => {
        setIsCrafting(!isCrafting);
        setCraftingItems([]); // Reset selection when toggling
        setSelectedItem(null); // Deselect item when entering crafting mode
    };

    return (
        <div className="h-full flex flex-col">
            <div className="flex justify-between items-center p-2">
                <h3 className="font-display text-xl text-amber-300">کوله پشتی</h3>
                <button 
                    onClick={toggleCraftingMode}
                    className={`flex items-center gap-2 text-xs font-bold p-2 rounded-md transition-colors ${
                        isCrafting 
                            ? 'bg-rose-500/10 text-rose-300 hover:bg-rose-500/20'
                            : 'bg-slate-700/50 text-slate-300 hover:bg-slate-700'
                    }`}
                >
                    <CraftingIcon className="w-4 h-4" />
                    {isCrafting ? "لغو ترکیب" : "ترکیب آیتم"}
                </button>
            </div>
            
            {isCrafting && (
                <div className="p-2 glass-surface rounded-lg mb-2 animate-fade-in">
                    <div className="grid grid-cols-4 gap-2 my-2 min-h-[4.5rem]">
                        {craftingItems.map(item => (
                             <div key={item.name} className="relative aspect-square w-full glass-surface rounded-lg p-1">
                                <div className="w-full h-full flex items-center justify-center text-slate-500"><InventoryIcon className="w-8 h-8" /></div>
                             </div>
                        ))}
                    </div>
                    <button 
                        onClick={handleCombine} 
                        disabled={isLoading || craftingItems.length < 2} 
                        className="w-full flex items-center justify-center gap-2 text-sm font-bold p-2 bg-amber-600/20 text-amber-300 hover:enabled:bg-amber-600/30 rounded-md transition-colors disabled:opacity-50"
                    >
                       ترکیب ({craftingItems.length})
                    </button>
                </div>
            )}
            
            {inventory.length > 0 ? (
                <div className="flex-grow grid grid-cols-1 md:grid-cols-2 gap-2 overflow-hidden">
                    <div className="grid grid-cols-4 gap-2 content-start overflow-y-auto pr-1 -mr-1">
                        {inventory.map(item => {
                            const isSelectedForCrafting = isCrafting && craftingItems.some(ci => ci.name === item.name);
                            return (
                                <button
                                    key={item.name}
                                    onClick={() => handleItemClick(item)}
                                    className={`relative aspect-square w-full glass-surface rounded-lg p-1 transition-all duration-200 border-2 ${
                                        (selectedItem?.name === item.name && !isCrafting) ? 'border-[var(--color-accent-primary)]' :
                                        isSelectedForCrafting ? 'border-amber-400 ring-2 ring-amber-400' : 
                                        'border-transparent hover:border-slate-500'
                                    }`}
                                >
                                    <div className="w-full h-full flex items-center justify-center text-slate-500">
                                        <InventoryIcon className="w-8 h-8" />
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                    <div className="glass-surface rounded-lg p-3 flex flex-col">
                        {selectedItem && !isCrafting ? (
                             <div className="animate-fade-in flex flex-col h-full">
                                <h4 className="font-bold text-lg text-[var(--color-accent-secondary)]">{selectedItem.name}</h4>
                                <p className="text-sm text-[var(--color-text-secondary)] my-2 flex-grow overflow-y-auto">{selectedItem.description}</p>
                                <div className="flex gap-2 mt-auto">
                                    <button onClick={() => useItem(selectedItem.name)} disabled={isLoading} className="flex-1 flex items-center justify-center gap-2 text-xs font-bold p-2 bg-green-500/10 text-green-300 hover:bg-green-500/20 rounded-md transition-colors disabled:opacity-50"><UseIcon className="w-4 h-4"/>استفاده</button>
                                    <button onClick={() => dropItem(selectedItem.name)} disabled={isLoading} className="flex-1 flex items-center justify-center gap-2 text-xs font-bold p-2 bg-rose-500/10 text-rose-300 hover:bg-rose-500/20 rounded-md transition-colors disabled:opacity-50"><DropIcon className="w-4 h-4"/>انداختن</button>
                                </div>
                            </div>
                        ) : (
                            <div className="flex items-center justify-center h-full text-center text-slate-500 text-sm">
                                <p>{isCrafting ? "یک آیتم برای افزودن به لیست ترکیب انتخاب کنید." : "یک آیتم را برای مشاهده جزئیات انتخاب کنید."}</p>
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                 <div className="flex-grow flex items-center justify-center text-center text-slate-500 p-4">
                    <p>کوله پشتی شما خالی است.</p>
                </div>
            )}
        </div>
    );
};

const CharacterPanel: React.FC = () => {
     const { playerStatus, skills, availableSkills, traits, isLoading, playerName, playerDescription } = useGameStore(state => ({
        playerStatus: state.playerStatus,
        skills: state.skills,
        availableSkills: state.availableSkills,
        traits: state.traits,
        isLoading: state.isLoading,
        playerName: state.playerName,
        playerDescription: state.playerDescription,
    }));
    
    if (!playerStatus) return null;

    const PlayerPortrait = () => (
        <div className="flex flex-col items-center gap-4 mb-4">
            <div className="relative w-32 h-32">
                <div className="w-full h-full rounded-full overflow-hidden glass-surface">
                    <div className="w-full h-full flex items-center justify-center bg-black/20 border-2 border-dashed border-[var(--color-border)] relative">
                            <UserIcon className="w-16 h-16 text-slate-600" />
                    </div>
                </div>
            </div>
            <div className="text-center">
                 <h3 className="font-display text-2xl text-[var(--color-text-primary)]">
                    {playerName || 'شخصیت اصلی'}
                </h3>
                 <p className="text-sm text-[var(--color-text-secondary)] px-4">{playerDescription}</p>
            </div>
        </div>
    );

    return (
        <div className="h-full flex flex-col space-y-3">
             <h3 className="font-display text-xl text-center text-amber-300 p-2">شخصیت</h3>
             <div className="flex-grow overflow-y-auto pr-1 -mr-1 space-y-4">
                <PlayerPortrait />
                <div className="p-2 text-center rounded-lg glass-surface">
                    <p className="text-xs text-[var(--color-text-secondary)]">امتیاز مهارت</p>
                    <p className="font-display text-3xl text-[var(--color-accent-secondary)] text-glow-secondary">{playerStatus.skillPoints.current}</p>
                </div>
                <div>
                     <h4 className="font-bold text-base text-[var(--color-accent-primary)] mb-2">ویژگی‌ها</h4>
                     <ul className="space-y-2">
                        {traits.map(trait => (
                             <li key={trait.id} className="p-2 rounded-lg border-l-4 bg-black/20" style={{borderColor: trait.type === 'perk' ? 'var(--color-accent-green)' : 'var(--color-accent-rose)'}}>
                                <h5 className="font-bold text-sm" style={{color: trait.type === 'perk' ? 'var(--color-accent-green)' : 'var(--color-accent-rose)'}}>{trait.name}</h5>
                                <p className="text-xs text-[var(--color-text-secondary)]">{trait.description}</p>
                            </li>
                        ))}
                    </ul>
                </div>
                <div>
                    <h4 className="font-bold text-base text-[var(--color-accent-primary)] mb-2">مهارت‌های آموخته‌شده</h4>
                    {skills.length > 0 ? (
                        <ul className="space-y-2">
                            {skills.map(skill => <li key={skill.id} className="p-2 glass-surface rounded-lg"><p className="font-semibold text-sm text-[var(--color-text-primary)]">{skill.name}</p><p className="text-xs text-[var(--color-text-secondary)]">{skill.description}</p></li>)}
                        </ul>
                    ) : <p className="text-xs text-center text-slate-500">هنوز مهارتی نیاموخته‌اید.</p>}
                </div>

                 <div>
                    <h4 className="font-bold text-base text-[var(--color-accent-green)] mb-2">مهارت‌های قابل یادگیری</h4>
                    {availableSkills.length > 0 ? (
                         <ul className="space-y-2">
                            {availableSkills.map(skill => (
                                <li key={skill.id} className="p-2 glass-surface rounded-lg border-l-2 border-green-500">
                                    <p className="font-semibold text-sm text-[var(--color-accent-green)]">{skill.name}</p>
                                    <p className="text-xs text-[var(--color-text-secondary)] mb-2">{skill.description}</p>
                                    <button onClick={() => learnSkill(skill.id)} disabled={isLoading || playerStatus.skillPoints.current < 1} className="w-full text-xs font-bold px-2 py-1 bg-green-500/20 text-green-200 hover:enabled:bg-green-500/30 rounded-md transition-colors disabled:opacity-50">
                                        یادگیری (1 امتیاز)
                                    </button>
                                </li>
                            ))}
                        </ul>
                    ) : <p className="text-xs text-center text-slate-500">مهارت جدیدی برای یادگیری وجود ندارد.</p>}
                </div>
             </div>
        </div>
    )
}

const QuestsPanel: React.FC = () => {
    const quests = useGameStore(state => state.quests);
    return (
        <div className="h-full flex flex-col">
            <h3 className="font-display text-xl text-center text-amber-300 p-2">ماموریت‌ها</h3>
            <div className="flex-grow overflow-y-auto pr-1 -mr-1">
                 {quests.length > 0 ? (
                    <ul className="space-y-2">
                        {quests.map(quest => {
                             let statusColor = quest.status === 'تکمیل شد' ? 'border-green-500' : quest.status === 'شکست خورد' ? 'border-rose-600' : 'border-slate-600';
                            return (
                                 <li key={quest.id} className={`glass-surface p-3 rounded-lg border-l-4 ${statusColor}`}>
                                    <h4 className="font-bold text-sm text-[var(--color-accent-secondary)]">{quest.title}</h4>
                                    <p className="text-xs text-[var(--color-text-secondary)] mt-1 mb-2">{quest.description}</p>
                                    <p className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-tertiary)]">{quest.status}</p>
                                </li>
                            );
                        })}
                    </ul>
                 ) : (
                     <div className="flex h-full items-center justify-center text-center text-slate-500 p-4">
                        <p>شما هیچ ماموریت فعالی ندارید.</p>
                    </div>
                 )}
            </div>
        </div>
    );
};

const MapPanel: React.FC = () => {
    const { discoveredLocations, currentLocation, isLoading } = useGameStore(state => ({
        discoveredLocations: state.discoveredLocations,
        currentLocation: state.currentLocation,
        isLoading: state.isLoading,
    }));

    const handleLocationClick = (location: DiscoveredLocation) => {
        if (isLoading) return;
        travelTo(location.name);
    };

    return (
        <div className="h-full flex flex-col">
             <h3 className="font-display text-xl text-center text-amber-300 p-2">نقشه</h3>
             <div className="flex-grow overflow-y-auto space-y-4 p-2">
                <LocationDisplay 
                    location={currentLocation}
                 />
                 <WorldMap 
                    locations={discoveredLocations} 
                    currentLocationName={currentLocation?.name || null} 
                    onLocationClick={handleLocationClick}
                />
             </div>
        </div>
    );
};


const GameSidebar: React.FC = () => {
    const [activeTab, setActiveTab] = useState<SidebarTab>('inventory');
    const { isSaving, isLoading } = useGameStore(state => ({
        isSaving: state.isSaving,
        isLoading: state.isLoading,
    }));
    const [saveButtonText, setSaveButtonText] = useState('ذخیره بازی');

    useEffect(() => {
        let timeoutId: number;
        if (isSaving) {
            setSaveButtonText('در حال ذخیره...');
            // The action takes 1s to reset isSaving. We'll show "Saved!" after that.
            timeoutId = window.setTimeout(() => {
                setSaveButtonText('ذخیره شد!');
                // Then revert back to normal after a couple of seconds.
                timeoutId = window.setTimeout(() => {
                    setSaveButtonText('ذخیره بازی');
                }, 2000);
            }, 1000);
        }
        return () => clearTimeout(timeoutId);
    }, [isSaving]);

    const renderContent = () => {
        switch (activeTab) {
            case 'inventory': return <InventoryPanel />;
            case 'character': return <CharacterPanel />;
            case 'quests': return <QuestsPanel />;
            case 'map': return <MapPanel />;
            default: return null;
        }
    };

    return (
        <div className="h-full flex flex-col glass-surface p-2 rounded-lg">
            <header className="flex-shrink-0">
                <div className="flex" role="tablist" aria-label="پنل اطلاعات بازی">
                    <TabButton icon={<InventoryIcon className="w-6 h-6" />} label="کوله" isActive={activeTab === 'inventory'} onClick={() => setActiveTab('inventory')} />
                    <TabButton icon={<UserIcon className="w-6 h-6" />} label="شخصیت" isActive={activeTab === 'character'} onClick={() => setActiveTab('character')} />
                    <TabButton icon={<QuestIcon className="w-6 h-6" />} label="ماموریت‌ها" isActive={activeTab === 'quests'} onClick={() => setActiveTab('quests')} />
                    <TabButton icon={<MapIcon className="w-6 h-6" />} label="نقشه" isActive={activeTab === 'map'} onClick={() => setActiveTab('map')} />
                </div>
            </header>
            <main className="flex-grow pt-2 overflow-hidden">
                {renderContent()}
            </main>
            <footer className="flex-shrink-0 mt-2 pt-2 border-t-2 border-[var(--color-border)]">
                <button
                    onClick={saveGame}
                    disabled={isLoading || isSaving}
                    className={`w-full flex items-center justify-center gap-2 font-bold p-2 rounded-lg transition-colors duration-300 disabled:cursor-not-allowed
                        ${isSaving && saveButtonText === 'ذخیره شد!' ? 'bg-green-500/20 text-green-300' : 'bg-slate-700/50 text-slate-300 hover:enabled:bg-slate-700 disabled:opacity-50'}
                    `}
                >
                    <SaveIcon className="w-5 h-5" />
                    <span>{saveButtonText}</span>
                </button>
            </footer>
        </div>
    );
};

export default GameSidebar;