import React, { useRef, useEffect, useCallback, useState, useMemo } from 'react';
import { useGameStore, handlePlayerInput } from '../store/gameStore';
import { GameState, WorldEvent, Enemy } from '../types';
import Typewriter from './Typewriter';
import ChoiceButton from './ChoiceButton';
import GameSidebar from './GameSidebar';
import SceneEntityDisplay from './SceneEntityDisplay';
import { SkillsIcon, CraftingIcon, WorldEventIcon, AttackIcon, DefendIcon, FleeIcon, UseIcon } from '../data/icons';
import { ttsService } from '../services/ttsService';

const LightbulbIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path fillRule="evenodd" d="M12 2.25c.75 0 1.5.75 1.5 1.5v1.125c0 .386.314.75.75.75h1.125c.75 0 1.5.75 1.5 1.5V9a.75.75 0 0 1-.75.75h-1.125a.75.75 0 0 1-.75-.75V8.25a.75.75 0 0 0-.75-.75H12a.75.75 0 0 0-.75.75v.75a.75.75 0 0 1-.75.75H9.375A.75.75 0 0 1 8.625 9V7.125c0-.75.75-1.5 1.5-1.5h1.125a.75.75 0 0 1 .75-.75V3.75c0-.75.75-1.5 1.5-1.5ZM12 7.5a4.5 4.5 0 0 0-4.5 4.5v3a.75.75 0 0 0 .75.75h7.5a.75.75 0 0 0 .75-.75v-3a4.5 4.5 0 0 0-4.5-4.5Z" clipRule="evenodd" />
    </svg>
);

const ErrorIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={className} aria-hidden="true">
      <path fillRule="evenodd" d="M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0Zm-8.25-1.75a.75.75 0 0 0-1.5 0v3.5a.75.75 0 0 0 1.5 0v-3.5ZM10 12a1 1 0 1 0 0 2 1 1 0 0 0 0-2Z" clipRule="evenodd" />
    </svg>
);

const CombatUI: React.FC<{ enemies: Enemy[] }> = ({ enemies }) => {
    if (!enemies || enemies.length === 0) return null;
    return (
        <div className="flex-shrink-0 mb-4 p-3 glass-surface rounded-lg border-2 border-rose-500/30 animate-fade-in">
            <h3 className="font-display text-xl text-center text-rose-400 mb-3" style={{ textShadow: '0 0 8px var(--color-accent-rose)'}}>مبارزه</h3>
            <div className="flex flex-wrap justify-center gap-4">
                {enemies.map(enemy => (
                    <div key={enemy.id} className="p-3 bg-black/30 rounded-md w-48 text-center" aria-label={`دشمن: ${enemy.name}, سلامتی: ${enemy.health.current} از ${enemy.health.max}`}>
                        <p className="font-bold text-base text-slate-200">{enemy.name}</p>
                        <div className="w-full bg-slate-700 rounded-full h-2.5 my-1.5" title={`${enemy.health.current} / ${enemy.health.max}`}>
                            <div className="bg-rose-600 h-2.5 rounded-full transition-all duration-300" style={{ width: `${(enemy.health.current / enemy.health.max) * 100}%` }}></div>
                        </div>
                        <p className="text-xs text-slate-400 italic">{enemy.description}</p>
                    </div>
                ))}
            </div>
        </div>
    );
};

const GameView: React.FC = () => {
    const store = useGameStore(state => ({
        history: state.history,
        isLoading: state.isLoading,
        choices: state.choices,
        isHintLoading: state.isHintLoading,
    }));
    const { history, isLoading, choices, isHintLoading } = store;

    const endOfMessagesRef = useRef<null | HTMLDivElement>(null);
    const [choicesAvailable, setChoicesAvailable] = useState(false);

    const parsedLastModelMessage = useMemo(() => {
        const lastModelMsg = history.slice().reverse().find(msg => msg.role === 'model');
        if (lastModelMsg) {
            try {
                return { gameState: JSON.parse(lastModelMsg.text) as GameState };
            } catch (e) {
                console.error("Failed to parse last game state from history:", e);
                return { gameState: null };
            }
        }
        return { gameState: null };
    }, [history]);

    const { gameState: lastGameState } = parsedLastModelMessage;
    const isInCombat = lastGameState?.isInCombat ?? false;
    const enemies = lastGameState?.enemies ?? [];
    const sceneEntities = lastGameState?.sceneEntities ?? [];


    useEffect(() => {
        if (!isLoading && choices.length > 0) {
            const timer = setTimeout(() => setChoicesAvailable(true), 100);
            return () => clearTimeout(timer);
        } else {
            setChoicesAvailable(false);
        }
    }, [isLoading, choices.length]);

    const scrollToBottom = useCallback(() => {
        endOfMessagesRef.current?.scrollIntoView({ behavior: "smooth" });
    }, []);

    useEffect(() => {
        setTimeout(scrollToBottom, 100);
    }, [history, isLoading, scrollToBottom]);

    return (
        <div className="w-full h-full flex flex-col overflow-hidden">
            <div className="flex-grow grid grid-cols-1 lg:grid-cols-3 gap-4 overflow-hidden">
                {/* Right Sidebar */}
                <div className="lg:col-span-1 h-full overflow-y-auto custom-scrollbar pr-2 -mr-2">
                   <GameSidebar />
                </div>

                {/* Story and Messages */}
                <div className="lg:col-span-2 h-full flex flex-col overflow-hidden">
                    <div className="flex-shrink-0">
                        <SceneEntityDisplay entities={sceneEntities} enemies={enemies} />
                    </div>
                    <div className="flex-grow overflow-y-auto pr-4 -mr-4 custom-scrollbar">
                        <style>{`
                            .custom-scrollbar::-webkit-scrollbar { width: 6px; }
                            .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                            .custom-scrollbar::-webkit-scrollbar-thumb { background-color: var(--color-border); border-radius: 20px; }
                        `}</style>
                        {isInCombat && <CombatUI enemies={enemies} />}
                        <div className="flex flex-col gap-6 pb-4" aria-live="polite">
                            {history.map((msg, index) => {
                                const isLastMessage = index === history.length - 1;

                                if (msg.role === 'user') {
                                    return (
                                        <div key={index} className="flex animate-fade-in justify-end">
                                            <div className="max-w-prose p-3 px-4 rounded-lg text-lg border user-input-text">
                                                {msg.text}
                                            </div>
                                        </div>
                                    );
                                }
                                if (msg.role === 'hint' || msg.role === 'error') {
                                    const isError = msg.role === 'error';
                                    const containerClasses = isError ? "bg-rose-950/40 text-rose-300 border-rose-500/30" : "bg-amber-950/40 text-amber-300 border-amber-500/30";
                                    const Icon = isError ? ErrorIcon : LightbulbIcon;
                                    return (
                                        <div key={index} className="flex justify-center animate-fade-in my-2">
                                            <div role={isError ? "alert" : "status"} className={`max-w-prose p-3 rounded-lg text-lg flex items-center gap-3 border ${containerClasses}`}>
                                                <Icon className="w-5 h-5 flex-shrink-0" />
                                                <p className={`${isError ? 'not-italic font-semibold' : 'italic'} text-base`}>{msg.text}</p>
                                            </div>
                                        </div>
                                    );
                                }
                                if (msg.role === 'model') {
                                    try {
                                        const gameState: GameState = JSON.parse(msg.text);
                                        return (
                                            <React.Fragment key={index}>
                                                {gameState.worldEvent && (
                                                    <div className="max-w-prose w-full border-l-4 border-purple-400 bg-black/20 p-4 rounded-lg shadow-sm animate-fade-in my-4">
                                                        <div className="flex items-center gap-3 mb-2">
                                                            <WorldEventIcon className="w-6 h-6 text-purple-400 flex-shrink-0" />
                                                            <h4 className="font-display text-xl text-[var(--color-accent-purple)]" style={{ textShadow: '0 0 8px var(--color-accent-purple)' }}>{gameState.worldEvent.title}</h4>
                                                        </div>
                                                        <p className="text-base text-[var(--color-text-secondary)] pl-9">{gameState.worldEvent.description}</p>
                                                    </div>
                                                )}
                                                {gameState.story && (
                                                    <div className="max-w-prose text-lg leading-relaxed text-[var(--color-text-primary)] story-text animate-fade-in">
                                                        {isLastMessage && !isLoading ? (
                                                            <Typewriter text={gameState.story} className="whitespace-pre-wrap" onComplete={() => { scrollToBottom(); ttsService.speak(gameState.story); }} onUpdate={scrollToBottom} />
                                                        ) : (
                                                            <p className="whitespace-pre-wrap">{gameState.story}</p>
                                                        )}
                                                    </div>
                                                )}
                                            </React.Fragment>
                                        );
                                    } catch (e) {
                                        console.error("Failed to parse game state from history message:", msg.text, e);
                                        return null;
                                    }
                                }
                                return null;
                            })}
                            
                            {isLoading && (
                                <div className="flex justify-start animate-fade-in" aria-label="هوش مصنوعی در حال پاسخگویی است">
                                    <div className="p-4 rounded-lg text-lg leading-relaxed">
                                        <div className="flex items-center gap-3">
                                            <div className="w-2.5 h-2.5 bg-[var(--color-text-tertiary)] rounded-full animate-pulse [animation-delay:-0.3s]"></div>
                                            <div className="w-2.5 h-2.5 bg-[var(--color-text-tertiary)] rounded-full animate-pulse [animation-delay:-0.15s]"></div>
                                            <div className="w-2.5 h-2.5 bg-[var(--color-text-tertiary)] rounded-full animate-pulse"></div>
                                        </div>
                                    </div>
                                </div>
                            )}
                            <div ref={endOfMessagesRef} />
                        </div>
                    </div>
                     {!isLoading && choices.length > 0 && (
                        <div className="flex-shrink-0 mt-auto pt-6">
                            <div className="max-w-4xl mx-auto flex flex-wrap justify-center gap-4">
                                {choices.map((choice, index) => {
                                    const skillMatch = choice.match(/^\[مهارت: (.*?)\] (.*)/);
                                    const combineMatch = choice.match(/^\[ترکیب: (.*?)\] (.*)/);
                                    const combatAttackMatch = choice.match(/^\[COMBAT:ATTACK\] (.*)/);
                                    const combatDefendMatch = choice.match(/^\[COMBAT:DEFEND\]/);
                                    const combatFleeMatch = choice.match(/^\[COMBAT:FLEE\]/);
                                    const combatUseSkillMatch = choice.match(/^\[COMBAT:USE_SKILL\] (.*)/);
                                    const combatUseItemMatch = choice.match(/^\[COMBAT:USE_ITEM\] (.*)/);

                                    const renderChoice = (icon: React.ReactNode, primary: string, secondary?: string) => (
                                        <ChoiceButton key={index} onClick={() => handlePlayerInput(choice)} disabled={isLoading || isHintLoading} className="animate-fade-in-stagger" style={{ animationDelay: `${index * 80}ms` }}>
                                            <div className="flex items-center text-left gap-3">
                                                <div className="flex-shrink-0">{icon}</div>
                                                <div className="flex-grow">
                                                    <span className="block text-lg font-bold">{primary}</span>
                                                    {secondary && <span className="block text-sm font-normal text-[var(--color-text-secondary)] opacity-90">{secondary}</span>}
                                                </div>
                                            </div>
                                        </ChoiceButton>
                                    );

                                    if (combatAttackMatch) {
                                        const enemyId = combatAttackMatch[1];
                                        const enemyName = enemies.find(e => e.id === enemyId)?.name || enemyId;
                                        return renderChoice(<AttackIcon className="w-7 h-7 text-rose-400" />, `حمله به ${enemyName}`);
                                    }
                                    if (combatDefendMatch) {
                                        return renderChoice(<DefendIcon className="w-7 h-7 text-blue-400" />, "دفاع");
                                    }
                                    if (combatFleeMatch) {
                                        return renderChoice(<FleeIcon className="w-7 h-7 text-green-400" />, "فرار");
                                    }
                                    if (combatUseSkillMatch) {
                                        return renderChoice(<SkillsIcon className="w-7 h-7 text-purple-400" />, "استفاده از مهارت", combatUseSkillMatch[1]);
                                    }
                                    if (combatUseItemMatch) {
                                        return renderChoice(<UseIcon className="w-7 h-7 text-amber-400" />, "استفاده از آیتم", combatUseItemMatch[1]);
                                    }
                                    if (skillMatch) {
                                        return renderChoice(<SkillsIcon className="w-7 h-7 text-purple-400" />, skillMatch[2], `استفاده از: ${skillMatch[1]}`);
                                    }
                                    if (combineMatch) {
                                        return renderChoice(<CraftingIcon className="w-7 h-7 text-amber-400" />, combineMatch[2], `ترکیب: ${combineMatch[1]}`);
                                    }
                                    return (
                                        <ChoiceButton key={index} onClick={() => handlePlayerInput(choice)} disabled={isLoading || isHintLoading} className="animate-fade-in-stagger" style={{ animationDelay: `${index * 80}ms` }}>
                                            {choice}
                                        </ChoiceButton>
                                    )
                                })}
                            </div>
                            {choicesAvailable && <div aria-live="polite" className="sr-only">گزینه‌های جدید در دسترس است</div>}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default GameView;