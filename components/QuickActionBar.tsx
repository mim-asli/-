import React from 'react';
import { useGameStore, handlePlayerInput } from '../store/gameStore';
import { PinnedAction } from '../types';
import { InventoryIcon, SkillsIcon } from '../data';

const QUICK_ACTION_LIMIT = 6;

const QuickActionSlot: React.FC<{ action: PinnedAction; index: number; isLoading: boolean }> = ({ action, index, isLoading }) => {
    const Icon = action.type === 'item' ? InventoryIcon : SkillsIcon;
    
    const onActivate = () => {
        if (isLoading) return;
        const command = action.type === 'item' 
            ? `[ACTION:USE] ${action.name}` 
            : `[ACTION:USE_SKILL] ${action.name}`;
        handlePlayerInput(command);
    };

    return (
        <div className="relative group">
            <button
                onClick={onActivate}
                disabled={isLoading}
                className="w-16 h-16 glass-surface rounded-lg flex items-center justify-center transition-all duration-200 hover:enabled:border-[var(--color-accent-primary)] disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label={`استفاده از ${action.name} (کلید میانبر ${index + 1})`}
            >
                <Icon className="w-8 h-8 text-[var(--color-text-secondary)]" />
                <div 
                    className="absolute -top-1 -right-1 w-5 h-5 bg-slate-800 text-slate-300 text-xs font-bold rounded-full flex items-center justify-center border-2 border-[var(--color-surface)]"
                    aria-hidden="true"
                >
                    {index + 1}
                </div>
            </button>
            <div 
                className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-max px-2 py-1 text-xs font-bold text-white bg-black/80 rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
                role="tooltip"
            >
                {action.name}
            </div>
        </div>
    );
};

const EmptySlot: React.FC<{ index: number }> = ({ index }) => (
     <div className="relative group">
        <div className="w-16 h-16 glass-surface rounded-lg flex items-center justify-center border-2 border-dashed border-[var(--color-border)] opacity-40">
            <div 
                className="absolute -top-1 -right-1 w-5 h-5 bg-slate-800 text-slate-400 text-xs font-bold rounded-full flex items-center justify-center border-2 border-[var(--color-surface)]"
                aria-hidden="true"
            >
                {index + 1}
            </div>
        </div>
        <div 
            className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-max px-2 py-1 text-xs font-bold text-white bg-black/80 rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
            role="tooltip"
        >
            خالی
        </div>
    </div>
);

const QuickActionBar: React.FC = () => {
    const { pinnedActions, isLoading } = useGameStore(state => ({
        pinnedActions: state.pinnedActions,
        isLoading: state.isLoading,
    }));

    if (pinnedActions.length === 0) return null;

    return (
        <div 
            className="max-w-max mx-auto mb-4 p-2 glass-surface rounded-xl flex items-center gap-2 animate-fade-in-stagger"
            aria-label="نوار اقدام سریع"
        >
            {Array.from({ length: QUICK_ACTION_LIMIT }).map((_, index) => {
                const action = pinnedActions[index];
                if (action) {
                    return <QuickActionSlot key={action.id} action={action} index={index} isLoading={isLoading} />;
                }
                return <EmptySlot key={index} index={index} />;
            })}
        </div>
    );
};

export default QuickActionBar;