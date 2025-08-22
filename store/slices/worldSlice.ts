import { CharacterProfile, LocationProfile, Quest, Relationship, DiscoveredLocation, Companion, CodexEntry, Recipe, Enemy, SceneEntity } from '../../types';

export interface WorldState {
    currentCharacter: CharacterProfile | null;
    currentLocation: LocationProfile | null;
    quests: Quest[];
    relationships: Relationship[];
    discoveredLocations: DiscoveredLocation[];
    worldState: { day: number; time: string } | null;
    companions: Companion[];
    codex: CodexEntry[];
    discoveredRecipes: Recipe[];
    enemies: Enemy[];
    sceneEntities: SceneEntity[];
    enemiesDefeated: number;
}

export interface WorldActions {
    updateCompanion: (companion: Companion) => void;
    updateCodexEntry: (entry: CodexEntry) => void;
    updateQuest: (quest: Quest) => void;
    incrementEnemiesDefeated: (count: number) => void;
    resetWorldState: () => void;
}

export type WorldSlice = WorldState & WorldActions;

export const worldInitialState: WorldState = {
    currentCharacter: null,
    currentLocation: null,
    quests: [],
    relationships: [],
    discoveredLocations: [],
    worldState: null,
    companions: [],
    codex: [],
    discoveredRecipes: [],
    enemies: [],
    sceneEntities: [],
    enemiesDefeated: 0,
};

export const createWorldSlice = (set): WorldSlice => ({
    ...worldInitialState,
    updateCompanion: (companionToUpdate) => set((state) => ({
        companions: state.companions.map(c => 
            c.id === companionToUpdate.id ? companionToUpdate : c
        )
    })),
    updateCodexEntry: (entryToUpdate) => set((state) => ({
        codex: state.codex.map(c =>
            c.id === entryToUpdate.id ? entryToUpdate : c
        )
    })),
    updateQuest: (questToUpdate) => set((state) => ({
        quests: state.quests.map(q =>
            q.id === questToUpdate.id ? questToUpdate : q
        )
    })),
    incrementEnemiesDefeated: (count) => set((state) => ({
        enemiesDefeated: state.enemiesDefeated + count
    })),
    resetWorldState: () => set(worldInitialState),
});