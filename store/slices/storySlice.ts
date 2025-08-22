import { Genre, ChatMessage, Difficulty, GMPersonality } from '../../types';

export interface StoryState {
    genre: Genre | null;
    difficulty: Difficulty;
    gmPersonality: GMPersonality;
    history: ChatMessage[];
    choices: string[];
    gameOver: boolean;
    isInCombat: boolean;
    narrativeSummary: string | null;
}

export interface StoryActions {
    addHistoryMessage: (message: ChatMessage) => void;
    setDifficulty: (difficulty: Difficulty) => void;
    setGmPersonality: (personality: GMPersonality) => void;
    setNarrativeSummary: (summary: string | null) => void;
    resetStoryState: () => void;
}

export type StorySlice = StoryState & StoryActions;

export const storyInitialState: StoryState = {
    genre: null,
    difficulty: 'balanced',
    gmPersonality: 'standard',
    history: [],
    choices: [],
    gameOver: false,
    isInCombat: false,
    narrativeSummary: null,
};

export const createStorySlice = (set): StorySlice => ({
    ...storyInitialState,
    addHistoryMessage: (message) => set((state) => ({ history: [...state.history, message] })),
    setDifficulty: (difficulty) => set({ difficulty }),
    setGmPersonality: (personality) => set({ gmPersonality: personality }),
    setNarrativeSummary: (summary) => set({ narrativeSummary: summary }),
    resetStoryState: () => set(storyInitialState),
});