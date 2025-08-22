import React, { useEffect, useState, useRef, useMemo } from 'react';
import { useGameStore, getHint, searchArea, handlePlayerInput } from './store/gameStore';
import GameView from './components/GameView';
import Controls from './components/Controls';
import StartScreen from './components/StartScreen';
import SettingsPage from './pages/SettingsPage';
import GameResultDisplay from './components/GameResultDisplay';
import PlayerHUD from './components/PlayerHUD';
import LoadingStory from './components/LoadingStory';
import { useHotkeys } from './hooks/useHotkeys';
import { NotificationProvider } from './components/NotificationProvider';
import TTSControls from './components/TTSControls';
import QuickActionBar from './components/QuickActionBar';
import WhatIfModal from './components/WhatIfModal';
import DirectorsCommentaryModal from './components/DirectorsCommentaryModal';
import Scoreboard from './components/Scoreboard';
import PermissionScreen from './components/PermissionScreen';

const App: React.FC = () => {
    const store = useGameStore(state => ({
        view: state.view,
        gameOver: state.gameOver,
        theme: state.theme,
        isLoading: state.isLoading,
        setView: state.setView,
        pinnedActions: state.pinnedActions,
        isTtsControlsOpen: state.isTtsControlsOpen,
        setTtsControlsOpen: state.setTtsControlsOpen,
        playerStatus: state.playerStatus,
    }));
    const { 
        view, gameOver, theme, isLoading, setView, 
        pinnedActions, isTtsControlsOpen, setTtsControlsOpen, playerStatus
    } = store;

    // --- Derived UI State from playerStatus ---
    const { statusEffectClasses, textGlitchClass } = useMemo(() => {
        if (!playerStatus) return { statusEffectClasses: '', textGlitchClass: '' };

        const healthPct = playerStatus.health.current / playerStatus.health.max;
        const sanityPct = playerStatus.sanity.current / playerStatus.sanity.max;
        const thirstPct = playerStatus.thirst.current / playerStatus.thirst.max;
        const resourcePct = playerStatus.specialResource.current / playerStatus.specialResource.max;

        const effects: string[] = [];
        if (healthPct <= 0.35) effects.push('low-health');
        if (sanityPct <= 0.40) effects.push('low-sanity');
        if (thirstPct <= 0.30) effects.push('low-thirst');
        if (resourcePct <= 0.25) effects.push('low-resource');

        const statusEffectClasses = effects.join(' ');
        const textGlitchClass = sanityPct <= 0.40 ? 'text-glitch-active' : '';

        return { statusEffectClasses, textGlitchClass };
    }, [playerStatus]);
    
    // --- Transient UI Effect for Damage Flash ---
    const [damageFlash, setDamageFlash] = useState(false);
    const prevHealthRef = useRef<number | undefined>(undefined);

    useEffect(() => {
        const currentHealth = playerStatus?.health.current;
        
        if (prevHealthRef.current === undefined || currentHealth === undefined) {
            prevHealthRef.current = currentHealth;
            return;
        }

        if (currentHealth < prevHealthRef.current) {
            setDamageFlash(true);
            const timer = setTimeout(() => {
                setDamageFlash(false);
            }, 500);
            
            return () => clearTimeout(timer);
        }
        
        prevHealthRef.current = currentHealth;
    }, [playerStatus?.health.current]);


    useHotkeys({
        's': () => {
             if (view === 'start') {
                setView('settings');
            }
        },
        'h': () => {
            if (view === 'game' && !isLoading) {
                getHint();
            }
        },
        'f': () => {
            if (view === 'game' && !isLoading) {
                searchArea();
            }
        },
        'escape': () => {
            if (isTtsControlsOpen) {
                setTtsControlsOpen(false);
            }
        },
        ...Object.fromEntries(
            Array.from({ length: 6 }, (_, i) => [
                String(i + 1),
                () => {
                    if (view === 'game' && !isLoading) {
                        const action = pinnedActions[i];
                        if (action) {
                            const command = action.type === 'item' 
                                ? `[ACTION:USE] ${action.name}` 
                                : `[ACTION:USE_SKILL] ${action.name}`;
                            handlePlayerInput(command);
                        }
                    }
                }
            ])
        )
    }, [view, isLoading, setView, pinnedActions, isTtsControlsOpen, setTtsControlsOpen]);

    useEffect(() => {
        const container = document.getElementById('background-streams');
        if (container && container.children.length === 0) {
            const streams = Array.from({ length: 25 }).map(() => {
                const stream = document.createElement('div');
                stream.className = 'stream';
                stream.style.left = `${Math.random() * 100}%`;
                stream.style.animationDuration = `${Math.random() * 15 + 10}s`;
                stream.style.animationDelay = `${Math.random() * 10}s`;
                stream.style.height = `${Math.random() * 40 + 30}vh`;
                return stream;
            });
            container.append(...streams);
        }
    }, []);

    useEffect(() => {
        document.documentElement.className = theme;
    }, [theme]);

    const renderView = () => {
        if (gameOver) {
            return <GameResultDisplay />;
        }

        switch(view) {
            case 'permission':
                return <PermissionScreen />;
            case 'settings':
                return <SettingsPage />;
            case 'scoreboard':
                return <Scoreboard />;
            case 'start':
                return <StartScreen />;
            case 'loadingStory':
                return <LoadingStory />;
            case 'game':
                return (
                    <div className={`h-screen w-screen overflow-hidden p-0 ${textGlitchClass}`}>
                        <div className={`status-effects-overlay ${statusEffectClasses}`}></div>
                        <div className={`damage-feedback-overlay ${damageFlash ? 'active' : ''}`}></div>
                        <PlayerHUD />

                        <div className="h-full w-full flex flex-col p-4 md:p-6 lg:p-8">
                             <main className="flex-grow flex flex-col overflow-hidden viewport-frame interactive-frame">
                               <GameView />
                            </main>

                            <footer className="flex-shrink-0 w-full z-10 pt-4">
                               <QuickActionBar />
                               <Controls />
                            </footer>
                        </div>
                    </div>
                );
            default:
                return <StartScreen />;
        }
    }

    return (
        <>
            <NotificationProvider />
            {renderView()}
            <TTSControls />
            <WhatIfModal />
            <DirectorsCommentaryModal />
        </>
    );
};

export default App;