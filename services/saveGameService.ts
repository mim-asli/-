import { SaveSlot, FullGameState, ChatMessage, GameState, CharacterProfile, LocationProfile, Genre, Trait, Difficulty, GMPersonality, Companion, CodexEntry, Recipe } from '../types';

const SAVE_GAMES_STORAGE_KEY = 'gemini-rpg-saves';

/**
 * Retrieves all saved games from localStorage.
 * @returns {SaveSlot[]} An array of save slots.
 */
export const getSavedGames = (): SaveSlot[] => {
    try {
        const storedSaves = localStorage.getItem(SAVE_GAMES_STORAGE_KEY);
        if (!storedSaves) return [];
        const saves = JSON.parse(storedSaves) as SaveSlot[];
        // Sort by most recently saved
        return saves.sort((a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime());
    } catch (error) {
        console.error("Failed to parse saved games from localStorage", error);
        return [];
    }
};

/**
 * Saves a new array of save slots to localStorage.
 * @param {SaveSlot[]} saves The entire array of save slots to save.
 */
const persistSaves = (saves: SaveSlot[]): void => {
    try {
        localStorage.setItem(SAVE_GAMES_STORAGE_KEY, JSON.stringify(saves));
    } catch (error) {
        console.error("Failed to save games to localStorage", error);
    }
};

/**
 * Creates a new save slot with the complete initial game state.
 * @returns {SaveSlot} The newly created save slot.
 */
export const createNewSave = (
    genre: Genre,
    firstTurnState: GameState, 
    firstHistory: ChatMessage[], 
    playerName: string | null,
    archetypeId: string | null,
    playerDescription: string | null,
    characterProfile: CharacterProfile | null,
    locationProfile: LocationProfile | null,
    traits: Trait[],
    difficulty: Difficulty,
    gmPersonality: GMPersonality,
    companions: Companion[],
    codex: CodexEntry[],
    discoveredRecipes: Recipe[]
): SaveSlot => {
    const newId = String(Date.now());
    const name = `${playerName || 'ماجراجو'} - روز ${firstTurnState.worldState.day}, ${firstTurnState.worldState.time}`;
    
    const newSave: SaveSlot = {
        id: newId,
        name: name,
        savedAt: new Date().toISOString(),
        gameState: {
            genre: genre,
            difficulty: difficulty,
            gmPersonality: gmPersonality,
            history: firstHistory,
            playerName: playerName,
            playerDescription: playerDescription,
            archetypeId: archetypeId,
            playerStatus: firstTurnState.playerStatus,
            worldState: firstTurnState.worldState,
            inventory: firstTurnState.inventory,
            skills: firstTurnState.skills,
            availableSkills: firstTurnState.availableSkills,
            quests: firstTurnState.quests,
            relationships: firstTurnState.relationships,
            discoveredLocations: firstTurnState.discoveredLocations,
            choices: firstTurnState.choices,
            gameOver: firstTurnState.isGameOver ?? false,
            isInCombat: firstTurnState.isInCombat ?? false,
            enemies: firstTurnState.enemies ?? [],
            enemiesDefeated: 0,
            currentCharacter: characterProfile,
            currentLocation: locationProfile,
            traits: traits,
            companions: companions,
            codex: codex,
            discoveredRecipes: discoveredRecipes,
            sceneEntities: firstTurnState.sceneEntities || [],
            narrativeSummary: null,
            pinnedActions: [],
        }
    };

    const allSaves = getSavedGames();
    persistSaves([newSave, ...allSaves]);
    return newSave;
};


/**
 * Updates an existing save slot with the latest game state.
 * @param {string} slotId The ID of the save slot to update.
 * @param {FullGameState} gameState The new state to save.
 * @returns {void}
 */
export const updateSave = (slotId: string, gameState: FullGameState): void => {
    const allSaves = getSavedGames();
    const saveIndex = allSaves.findIndex(s => s.id === slotId);

    if (saveIndex === -1) {
        console.error(`Save slot with ID ${slotId} not found.`);
        return;
    }

    let name = allSaves[saveIndex].name;
    if (gameState.worldState) {
        name = `${gameState.playerName || 'ماجراجو'} - روز ${gameState.worldState.day}, ${gameState.worldState.time}`;
    }


    const updatedSave: SaveSlot = {
        ...allSaves[saveIndex],
        name,
        savedAt: new Date().toISOString(),
        gameState: gameState,
    };

    allSaves[saveIndex] = updatedSave;
    persistSaves(allSaves);
};

/**
 * Deletes a save slot by its ID.
 * @param {string} slotId The ID of the save slot to delete.
 * @returns {void}
 */
export const deleteSave = (slotId: string): void => {
    let allSaves = getSavedGames();
    allSaves = allSaves.filter(s => s.id !== slotId);
    persistSaves(allSaves);
};

/**
 * Exports all saved games to a JSON file.
 */
export const exportAllSaves = (): void => {
    const saves = getSavedGames();
    if (saves.length === 0) {
        alert("هیچ ماجراجویی برای خروجی گرفتن وجود ندارد.");
        return;
    }
    const jsonString = JSON.stringify(saves, null, 2); // Pretty print
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const date = new Date().toISOString().split('T')[0];
    a.href = url;
    a.download = `dastan-saves-${date}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
};

/**
 * Imports saves from a JSON string, merging them with existing saves.
 * @param {string} jsonString The JSON content from the imported file.
 * @returns An object indicating the result of the import.
 */
export const importSaves = (jsonString: string): { success: boolean; message: string } => {
    try {
        const importedSaves = JSON.parse(jsonString);

        if (!Array.isArray(importedSaves) || (importedSaves.length > 0 && (!importedSaves[0].id || !importedSaves[0].gameState))) {
            throw new Error("فایل معتبر نیست. ساختار فایل ذخیره شده صحیح نمی‌باشد.");
        }

        const existingSaves = getSavedGames();
        const mergedSavesMap = new Map<string, SaveSlot>();

        // Add existing saves to map first to be potentially overwritten
        for (const save of existingSaves) {
            mergedSavesMap.set(save.id, save);
        }

        let newCount = 0;
        let updatedCount = 0;

        // Merge imported saves, counting new vs updated
        for (const importedSave of importedSaves as SaveSlot[]) {
            if (mergedSavesMap.has(importedSave.id)) {
                updatedCount++;
            } else {
                newCount++;
            }
            mergedSavesMap.set(importedSave.id, importedSave);
        }

        const finalSaves = Array.from(mergedSavesMap.values());
        persistSaves(finalSaves);

        let message = `عملیات موفق بود. ${newCount} ماجراجویی جدید وارد شد`;
        if (updatedCount > 0) {
            message += ` و ${updatedCount} ماجراجویی موجود به‌روز شد.`;
        }
        
        return {
            success: true,
            message,
        };
    } catch (err: any) {
        return {
            success: false,
            message: err.message || "خواندن فایل با خطا مواجه شد.",
        };
    }
};