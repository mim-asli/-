import { create } from 'zustand';
import * as geminiService from '../services/geminiService';
import * as apiKeyService from '../services/apiKeyService';
import * as saveGameService from '../services/saveGameService';
import * as localAiService from '../services/localAiService';
import { audioService } from '../services/audioService';
import { notificationService } from '../services/notificationService';
import * as scoreboardService from '../services/scoreboardService';
import { GameState, SaveSlot, FullGameState, ChatMessage, Genre, Trait, CharacterProfile, LocationProfile, Difficulty, InventoryItem, GMPersonality, Companion, Skill, CustomGameData, CodexEntry, Recipe, Archetype, Quest, SceneEntity } from '../types';
import { traitsJson, archetypesJson } from '../data';

import { PlayerSlice, createPlayerSlice, playerInitialState } from './slices/playerSlice';
import { WorldSlice, createWorldSlice, worldInitialState } from './slices/worldSlice';
import { StorySlice, createStorySlice, storyInitialState } from './slices/storySlice';
import { UISlice, createUISlice, uiInitialState, Theme } from './slices/uiSlice';

// Parse data from JSON strings
const TRAITS: Trait[] = JSON.parse(traitsJson);
const ARCHETYPES: Archetype[] = JSON.parse(archetypesJson);


export type GameStore = PlayerSlice & WorldSlice & StorySlice & UISlice;

const fullInitialState = {
    ...playerInitialState,
    ...worldInitialState,
    ...storyInitialState,
    ...uiInitialState,
};

export const useGameStore = create<GameStore>((set) => ({
    ...createPlayerSlice(set),
    ...createWorldSlice(set),
    ...createStorySlice(set),
    ...createUISlice(set),
}));

// --- Standalone Action Functions ---

const initializeAndCheckKeys = () => {
    const activeKeys = apiKeyService.getActiveApiKeys();
    const localConfig = localAiService.getLocalAiConfig();
    
    if (activeKeys.length === 0 && !localConfig.enabled) {
        useGameStore.getState().setError("هیچ کلید API فعالی یافت نشد و هوش مصنوعی محلی نیز غیرفعال است. لطفاً در بخش تنظیمات، یک کلید اضافه و فعال کنید یا هوش مصنوعی محلی را فعال کنید.");
        return false;
    }

    if (activeKeys.length === 0 && localConfig.enabled && !localConfig.prioritize) {
         useGameStore.getState().setError("هیچ کلید API فعالی یافت نشد. برای استفاده از هوش مصنوعی محلی به عنوان پشتیبان، باید حداقل یک کلید فعال داشته باشید یا حالت اولویت را برای آن فعال کنید.");
        return false;
    }
    
    geminiService.initializeAiInstances(activeKeys.map(k => k.key));
    audioService.init();
    useGameStore.getState().setError(null);
    return true;
};

// Helper to construct the full game state from the store's state
const getFullState = (state: GameStore): FullGameState => ({
    genre: state.genre,
    difficulty: state.difficulty,
    gmPersonality: state.gmPersonality,
    history: state.history,
    playerName: state.playerName,
    playerDescription: state.playerDescription,
    archetypeId: state.archetypeId,
    playerStatus: state.playerStatus,
    worldState: state.worldState,
    inventory: state.inventory,
    skills: state.skills,
    availableSkills: state.availableSkills,
    quests: state.quests,
    relationships: state.relationships,
    discoveredLocations: state.discoveredLocations,
    choices: state.choices,
    gameOver: state.gameOver,
    isInCombat: state.isInCombat,
    enemies: state.enemies,
    enemiesDefeated: state.enemiesDefeated,
    currentCharacter: state.currentCharacter,
    currentLocation: state.currentLocation,
    traits: state.traits,
    companions: state.companions,
    codex: state.codex,
    discoveredRecipes: state.discoveredRecipes,
    sceneEntities: state.sceneEntities,
    narrativeSummary: state.narrativeSummary,
    pinnedActions: state.pinnedActions,
});


export const handlePlayerInput = async (text: string) => {
    const oldState = useGameStore.getState();
    if (oldState.isLoading || !oldState.genre) return;

    const userMessage: ChatMessage = { role: 'user', text };
    useGameStore.setState(state => ({
        isLoading: true,
        choices: [],
        history: [...state.history, userMessage],
    }));

    try {
        const stateForApiCall = useGameStore.getState();
        const currentState = getFullState(stateForApiCall);
        const response = await geminiService.sendNextTurn(currentState);
        
        const newHistory: ChatMessage[] = [...stateForApiCall.history, { role: 'model', text: JSON.stringify(response) }];

        if (response.isGameOver) {
             const finalFullState = {
                ...getFullState(useGameStore.getState()),
                playerStatus: response.playerStatus,
                gameOver: true,
            };
            scoreboardService.updateScoreboardOnGameOver(finalFullState);

            const epitaph = await geminiService.getGameEpitaph(
                oldState.history, // history before the final model message
                response,
                oldState.playerName
            );
            
            useGameStore.setState({
                gameEpitaph: epitaph,
                finalGameState: response,
                isLoading: false,
                history: newHistory,
                choices: [],
                gameOver: true,
                playerStatus: response.playerStatus, // Update status one last time
            });

            if (response.audio) {
                audioService.playSfx(response.audio.sfx ?? 'game_over');
            } else {
                audioService.playSfx('game_over');
            }
            audioService.playMusic(null);
            audioService.playAmbient(null);

        } else {
            // Game continues, update state with resilience
            
            // Handle transient 'new' fields that create/update persistent state
            let newCharacter = oldState.currentCharacter;
            if (response.newCharacter) {
                newCharacter = { ...response.newCharacter };
            }

            let newLocation = oldState.currentLocation;
            if (response.newLocation) {
                newLocation = { ...response.newLocation };
            }
            
            // Use merged value for companions array, then process newCompanion
            let companions = response.companions ?? oldState.companions;
            if (response.newCompanion) {
                const newCompanionToAdd: Companion = {
                    ...response.newCompanion,
                    relationship: 0,
                };
                if (!companions.some(c => c.id === newCompanionToAdd.id)) {
                    companions = [...companions, newCompanionToAdd];
                }
            }
            
            // Increment defeated enemies if combat just ended
            const isInCombat = response.isInCombat ?? oldState.isInCombat;
            if (oldState.isInCombat && !isInCombat && (response.playerStatus?.health.current ?? 0) > 0) {
                oldState.incrementEnemiesDefeated(oldState.enemies.length);
            }

            useGameStore.setState({
                isLoading: false,
                history: newHistory,

                // --- Resilient State Merging ---
                // Critical state from response. If the API call succeeded, these MUST be present.
                playerStatus: response.playerStatus,
                worldState: response.worldState,
                choices: response.choices,
                
                // Merged state (if field is missing in response, use old value)
                inventory: response.inventory ?? oldState.inventory,
                skills: response.skills ?? oldState.skills,
                availableSkills: response.availableSkills ?? oldState.availableSkills,
                quests: response.quests ?? oldState.quests,
                relationships: response.relationships ?? oldState.relationships,
                discoveredLocations: response.discoveredLocations ?? oldState.discoveredLocations,
                codex: response.codex ?? oldState.codex,
                discoveredRecipes: response.discoveredRecipes ?? oldState.discoveredRecipes,
                sceneEntities: response.sceneEntities ?? oldState.sceneEntities,
                enemies: response.enemies ?? oldState.enemies,
                isInCombat: isInCombat,
                gameOver: response.isGameOver ?? false,
                playerDescription: response.playerDescription ?? oldState.playerDescription,
                
                // State with special handling derived from response
                currentCharacter: newCharacter,
                currentLocation: newLocation,
                companions: companions,
            });
            
            if (response.audio) {
                audioService.playAmbient(response.audio.ambient ?? null);
                audioService.playMusic(response.audio.music ?? null);
                audioService.playSfx(response.audio.sfx ?? null);
            }
            
            const newState = useGameStore.getState();

            // --- Auto-Save Logic ---
            if (newState.currentSaveSlotId) {
                saveGameService.updateSave(newState.currentSaveSlotId, getFullState(newState));
            }

            // --- Notification & Image Generation Logic ---
            // 1. Direct events from response
            if (response.newQuest) notificationService.notify(`ماموریت جدید: ${response.newQuest.title}`, 'quest');
            if (response.newCodexEntry) notificationService.notify(`دانشنامه به‌روز شد: ${response.newCodexEntry.name}`, 'codex');
            if (response.newCompanion) notificationService.notify(`همراه جدید: ${response.newCompanion.name} به شما پیوست!`, 'companion');
            if (response.newRecipe) notificationService.notify(`دستور ساخت جدید: ${response.newRecipe.name}`, 'recipe');
            if (response.newTrait) {
                const oldTraits = useGameStore.getState().traits;
                if (!oldTraits.some(t => t.id === response.newTrait!.id)) {
                    useGameStore.setState({ traits: [...oldTraits, response.newTrait] });
                    notificationService.notify(`ویژگی جدید کسب کردید: ${response.newTrait.name}`, 'trait');
                }
            }

            // 2. State change comparisons
            if (newState.inventory.length > oldState.inventory.length) {
                const oldInventoryNames = new Set(oldState.inventory.map(i => i.name));
                const newItem = newState.inventory.find(i => !oldInventoryNames.has(i.name));
                if (newItem) {
                    notificationService.notify(`آیتم جدید: ${newItem.name}`, 'success');
                }
            }

            const newSkillPoints = newState.playerStatus?.skillPoints.current ?? 0;
            const oldSkillPoints = oldState.playerStatus?.skillPoints.current ?? 0;
            if (newSkillPoints > oldSkillPoints) {
                notificationService.notify('امتیاز مهارت جدید دریافت کردید!', 'skill');
            }

            // --- Background Summarization Logic ---
            const modelMessagesCount = newHistory.filter(m => m.role === 'model').length;
            if (modelMessagesCount > 0 && modelMessagesCount % 4 === 0) {
                console.log(`Triggering summarization for long-term memory at turn ${modelMessagesCount}.`);
                geminiService.summarizeHistory(newHistory)
                    .then(summary => {
                        if (summary) {
                            useGameStore.getState().setNarrativeSummary(summary);
                            useGameStore.getState().addHistoryMessage({ role: 'hint', text: 'بایگان، تاریخچه ماجراجویی شما را برای حفظ حافظه بلندمدت ثبت کرد.' });
                            console.log("Narrative summary updated successfully.");
                        } else {
                            console.warn("Summarization resulted in an empty string.");
                            useGameStore.getState().addHistoryMessage({ role: 'error', text: 'خطا در بایگانی حافظه بلندمدت: خلاصه‌سازی ناموفق بود.' });
                        }
                    })
                    .catch(error => {
                        console.error("Failed to summarize history for long-term memory:", error);
                        useGameStore.getState().addHistoryMessage({ role: 'error', text: 'خطا در بایگانی حافظه بلندمدت. ممکن است تداوم داستان با مشکل مواجه شود.' });
                    });
            }
        }

    } catch (error: any) {
        console.error("Failed to process turn:", error);
        
        let errorMsg = "خطایی در ارتباط با هوش مصنوعی رخ داد. ممکن است به دلیل محدودیت‌های سرویس یا مشکلات شبکه باشد. لطفاً لحظاتی دیگر دوباره تلاش کنید.";

        // Provide a more specific message if all keys failed due to quota/validity issues.
        if (geminiService.isKeySpecificError(error)) {
            errorMsg = "تمام کلیدهای API فعال شما نامعتبر هستند یا سهمیه آن‌ها تمام شده است. لطفاً کلیدهای خود را در بخش تنظیمات بررسی، تست و فعال کنید یا کلید جدیدی اضافه کنید.";
        }
        
        useGameStore.setState(state => ({
            isLoading: false,
            // Add the error message to the history which already contains the user's failed input
            history: [...state.history, { role: 'error', text: errorMsg }],
            // Restore the choices from before the action was attempted so the user can try again
            choices: oldState.choices, 
        }));
    }
};

export const startNewGame = async (genre: Genre, characterId: string, scenarioId: string, pName: string, pDescription: string, traitIds: string[], difficulty: Difficulty, gmPersonality: GMPersonality) => {
    if (!initializeAndCheckKeys()) return;

    useGameStore.setState({ ...fullInitialState, view: 'game', isLoading: true, error: null, genre, difficulty, gmPersonality });

    try {
        const selectedTraits = traitIds.map(id => TRAITS.find(t => t.id === id)).filter(Boolean) as Trait[];
        const archetype = ARCHETYPES.find(a => a.id === characterId);
        if (!archetype) throw new Error("Archetype not found");

        const firstState = await geminiService.startFirstTurn(genre, characterId, scenarioId, pName, pDescription, selectedTraits, difficulty, gmPersonality);
        const firstHistory: ChatMessage[] = [{ role: 'model', text: JSON.stringify(firstState) }];

        const characterProfile = { name: pName || 'شخصیت اصلی' };
        const locationProfile = firstState.newLocation ? { name: firstState.newLocation.name, description: firstState.newLocation.description } : null;

        const newSave = saveGameService.createNewSave(
            genre, firstState, firstHistory, pName, characterId, 
            pDescription || firstState.playerDescription, 
            characterProfile, locationProfile, selectedTraits, difficulty, gmPersonality,
            [], // Start with no companions
            [], // Start with empty codex
            [] // Start with empty recipes
        );

        useGameStore.setState({
            ...newSave.gameState,
            isLoading: false,
            view: 'game',
            currentSaveSlotId: newSave.id,
        });

         if (firstState.audio) {
            audioService.playAmbient(firstState.audio.ambient ?? null);
            audioService.playMusic(firstState.audio.music ?? null);
            audioService.playSfx(firstState.audio.sfx ?? null);
        }

    } catch (error: any) {
        console.error("Failed to start game:", error);
        const errorMsg = error.message.includes("local AI") 
            ? "خطایی در اتصال به هوش مصنوعی محلی رخ داد. لطفاً از صحت آدرس و روشن بودن سرور خود مطمئن شوید."
            : "خطایی در شروع بازی رخ داد. لطفاً از اعتبار و فعال بودن کلید(های) API خود در تنظیمات مطمئن شوید یا حالت اولویت هوش مصنوعی محلی را فعال کنید.";
        useGameStore.getState().setError(errorMsg);
    }
};

export const startCustomGame = async (data: CustomGameData) => {
    if (!initializeAndCheckKeys()) return;

    useGameStore.setState({ ...fullInitialState, view: 'game', isLoading: true, error: null, genre: data.genre, difficulty: data.difficulty, gmPersonality: data.gmPersonality });

    try {
        const firstState = await geminiService.startCustomFirstTurn(data);
        const firstHistory: ChatMessage[] = [{ role: 'model', text: JSON.stringify(firstState) }];

        const characterProfile = { name: data.playerName };
        const locationProfile = firstState.newLocation ? { name: firstState.newLocation.name, description: firstState.newLocation.description } : null;

        const newSave = saveGameService.createNewSave(
            data.genre, 
            firstState, 
            firstHistory, 
            data.playerName,
            `custom_${Date.now()}`,
            data.playerDescription,
            characterProfile, 
            locationProfile, 
            data.traits, 
            data.difficulty, 
            data.gmPersonality,
            [], // Start with no companions
            [], // Start with empty codex
            [] // Start with empty recipes
        );

        useGameStore.setState({
            ...newSave.gameState,
            isLoading: false,
            view: 'game',
            currentSaveSlotId: newSave.id,
        });
        
        if (firstState.audio) {
            audioService.playAmbient(firstState.audio.ambient ?? null);
            audioService.playMusic(firstState.audio.music ?? null);
            audioService.playSfx(firstState.audio.sfx ?? null);
        }

    } catch (error: any) {
        console.error("Failed to start custom game:", error);
        const errorMsg = error.message.includes("local AI") 
            ? "خطایی در اتصال به هوش مصنوعی محلی رخ داد. لطفاً از صحت آدرس و روشن بودن سرور خود مطمئن شوید."
            : "خطایی در شروع بازی سفارشی رخ داد. لطفاً از اعتبار کلید(های) API خود مطمئن شوید یا حالت اولویت هوش مصنوعی محلی را فعال کنید.";
        useGameStore.getState().setError(errorMsg);
    }
};

export const getHint = async () => {
    const { isLoading, isHintLoading, history, genre } = useGameStore.getState();
    if (isLoading || isHintLoading || !genre) return;
    
    useGameStore.getState().setHintLoading(true);
    try {
        const hintText = await geminiService.getHint(genre, history);
        useGameStore.getState().addHistoryMessage({ role: 'hint', text: hintText });
    } catch(error: any) {
        console.error("Failed to get hint:", error);
        useGameStore.getState().addHistoryMessage({ role: 'error', text: "متاسفانه دریافت راهنمایی در حال حاضر ممکن نیست." });
    } finally {
        useGameStore.getState().setHintLoading(false);
    }
};

export const loadGame = (save: SaveSlot) => {
    if (!initializeAndCheckKeys()) return;

    const skills = (save.gameState.skills as any[]).map(s => typeof s === 'string' ? { id: s.toLowerCase().replace(' ', '_'), name: s, description: 'مهارت از بازی ذخیره شده قدیمی.', tier: 1, category: 'Special' } : s);
    const availableSkills = (save.gameState.availableSkills as any[]).map(s => typeof s === 'string' ? { id: s.toLowerCase().replace(' ', '_'), name: s, description: 'مهارت از بازی ذخیره شده قدیمی.', tier: 1, category: 'Special' } : s);
    if (!save.gameState.playerStatus?.skillPoints) {
        if(save.gameState.playerStatus) {
            save.gameState.playerStatus.skillPoints = { current: 0 };
        }
    }

    useGameStore.setState({
        ...save.gameState,
        skills,
        availableSkills,
        enemiesDefeated: save.gameState.enemiesDefeated ?? 0,
        isInCombat: save.gameState.isInCombat ?? false,
        enemies: save.gameState.enemies ?? [],
        codex: save.gameState.codex || [],
        discoveredRecipes: save.gameState.discoveredRecipes || [],
        sceneEntities: save.gameState.sceneEntities || [],
        narrativeSummary: save.gameState.narrativeSummary || null,
        difficulty: save.gameState.difficulty || 'balanced',
        gmPersonality: save.gameState.gmPersonality || 'standard',
        pinnedActions: save.gameState.pinnedActions || [],
        view: 'game',
        currentSaveSlotId: save.id,
        error: null,
        isLoading: true,
    });

    const lastModelMessageText = save.gameState.history.filter(m => m.role === 'model').pop()?.text;
    if(lastModelMessageText) {
        try {
            const lastState = JSON.parse(lastModelMessageText);
            if (lastState.audio) {
                audioService.playAmbient(lastState.audio.ambient ?? null);
                audioService.playMusic(lastState.audio.music ?? null);
            }
        } catch (e) { console.warn("Could not parse last message for audio on load.", e); }
    }

    const showSummaryAndContinue = (summary: string | null) => {
        if (summary && summary.trim().length > 10) {
            useGameStore.setState({ view: 'loadingStory', loadingSummary: summary, isLoading: false });
        } else {
            useGameStore.setState({ view: 'game', isLoading: false });
        }
    };
    
    if (save.gameState.narrativeSummary && save.gameState.narrativeSummary.trim().length > 10) {
        showSummaryAndContinue(save.gameState.narrativeSummary);
    } else if (save.gameState.history && save.gameState.history.length > 2) {
        geminiService.summarizeHistory(save.gameState.history).then(newSummary => {
            if (newSummary) {
                useGameStore.setState({ narrativeSummary: newSummary });
                const currentState = useGameStore.getState();
                const fullStateForSave: FullGameState = {
                    genre: currentState.genre,
                    difficulty: currentState.difficulty,
                    gmPersonality: currentState.gmPersonality,
                    history: currentState.history,
                    playerName: currentState.playerName,
                    playerDescription: currentState.playerDescription,
                    archetypeId: currentState.archetypeId,
                    playerStatus: currentState.playerStatus,
                    worldState: currentState.worldState,
                    inventory: currentState.inventory,
                    skills: currentState.skills,
                    availableSkills: currentState.availableSkills,
                    quests: currentState.quests,
                    relationships: currentState.relationships,
                    discoveredLocations: currentState.discoveredLocations,
                    choices: currentState.choices,
                    gameOver: currentState.gameOver,
                    isInCombat: currentState.isInCombat,
                    enemies: currentState.enemies,
                    enemiesDefeated: currentState.enemiesDefeated,
                    currentCharacter: currentState.currentCharacter,
                    currentLocation: currentState.currentLocation,
                    traits: currentState.traits,
                    companions: currentState.companions,
                    codex: currentState.codex,
                    discoveredRecipes: currentState.discoveredRecipes,
                    sceneEntities: currentState.sceneEntities,
                    narrativeSummary: newSummary,
                    pinnedActions: currentState.pinnedActions,
                };
                saveGameService.updateSave(save.id, fullStateForSave);
            }
            showSummaryAndContinue(newSummary);
        }).catch(err => {
            console.error("Failed to generate summary on load:", err);
            showSummaryAndContinue(null);
        });
    } else {
        showSummaryAndContinue(null);
    }
};

export const restartGame = () => {
    useGameStore.setState(fullInitialState);
    audioService.stopAll();
};

export const saveGame = () => {
    const state = useGameStore.getState();
    if (!state.currentSaveSlotId) return;
    
    state.setSaving(true);

    const fullStateForSave = getFullState(state);
    saveGameService.updateSave(state.currentSaveSlotId, fullStateForSave);

    setTimeout(() => {
        useGameStore.getState().setSaving(false);
        useGameStore.getState().addHistoryMessage({role: 'hint', text: 'بازی ذخیره شد.'});
    }, 1000);
};

export const craftItems = (items: string[]) => {
    const text = `[ACTION:CRAFT] ${items.join(' + ')}`;
    handlePlayerInput(text);
    
};

export const craftFromRecipe = (recipe: Recipe) => {
    const text = `[ACTION:CRAFT] ${recipe.ingredients.join(' + ')}`;
    
    handlePlayerInput(text);
};

export const travelTo = (locationName: string) => {
    const text = `[ACTION:TRAVEL] to "${locationName}"`;
    handlePlayerInput(text);
    
};

export const learnSkill = (skillId: string) => {
    const text = `[ACTION:LEARN_SKILL] ${skillId}`;
    handlePlayerInput(text);
};

export const useItem = (itemName: string) => {
    const text = `[ACTION:USE] ${itemName}`;
    handlePlayerInput(text);
    
};

export const dropItem = (itemName: string) => {
    const text = `[ACTION:DROP] ${itemName}`;
    handlePlayerInput(text);
};

export const talkToCompanion = (companionId: string) => {
    const text = `[ACTION:TALK_TO_COMPANION] ${companionId}`;
    handlePlayerInput(text);
    
};

export const askCompanionForAdvice = (companionId: string) => {
    const text = `[ACTION:ASK_COMPANION_ADVICE] ${companionId}`;
    handlePlayerInput(text);
    
};

export const giveItemToCompanion = (itemName: string, companionId: string) => {
    const text = `[ACTION:GIVE] ${itemName} TO ${companionId}`;
    handlePlayerInput(text);
    
};

export const commandCompanionAbility = (companionId: string) => {
    const text = `[ACTION:COMMAND_COMPANION] ${companionId}`;
    handlePlayerInput(text);
    
};

export const searchArea = () => {
    handlePlayerInput('[ACTION:SEARCH]');
};