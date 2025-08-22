import { PlayerStatus, Trait, InventoryItem, Skill, PinnedAction } from '../../types';

const QUICK_ACTION_LIMIT = 6;

export interface PlayerState {
    playerName: string | null;
    playerDescription: string | null;
    archetypeId: string | null;
    playerStatus: PlayerStatus | null;
    inventory: InventoryItem[];
    skills: Skill[];
    availableSkills: Skill[];
    traits: Trait[];
    pinnedActions: PinnedAction[];
}

export interface PlayerActions {
    resetPlayerState: () => void;
    pinAction: (action: PinnedAction) => void;
    unpinAction: (id: string) => void;
}

export type PlayerSlice = PlayerState & PlayerActions;

export const playerInitialState: PlayerState = {
    playerName: null,
    playerDescription: null,
    archetypeId: null,
    playerStatus: null,
    inventory: [],
    skills: [],
    availableSkills: [],
    traits: [],
    pinnedActions: [],
};

export const createPlayerSlice = (set): PlayerSlice => ({
    ...playerInitialState,
    resetPlayerState: () => set(playerInitialState),
    pinAction: (action) => set((state) => {
        if (state.pinnedActions.length >= QUICK_ACTION_LIMIT || state.pinnedActions.some(p => p.id === action.id)) {
            return {}; // Do nothing if limit reached or already pinned
        }
        return { pinnedActions: [...state.pinnedActions, action] };
    }),
    unpinAction: (id) => set((state) => ({
        pinnedActions: state.pinnedActions.filter(p => p.id !== id)
    })),
});