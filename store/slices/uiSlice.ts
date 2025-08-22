import { ttsService } from '../../services/ttsService';
import { TTSConfig, GameState } from '../../types';

export type JournalTab = 'character' | 'companion' | 'map' | 'codex' | 'quests' | 'relationships' | 'inventory' | 'skills' | 'crafting' | 'recipes';
export type JournalView = JournalTab | null;
export type Theme = 'theme-dark' | 'theme-light';

const THEME_STORAGE_KEY = 'gemini-rpg-theme';

export type AppView = 'permission' | 'start' | 'settings' | 'game' | 'loadingStory' | 'scoreboard';

export interface UIState {
    view: AppView;
    isLoading: boolean;
    isHintLoading: boolean;
    isSaving: boolean;
    currentSaveSlotId: string | null;
    error: string | null;
    loadingSummary: string | null;
    ttsConfig: TTSConfig;
    isTtsControlsOpen: boolean;
    theme: Theme;
    isWhatIfModalOpen: boolean;
    whatIfResult: string | null;
    isWhatIfLoading: boolean;
    isCommentaryModalOpen: boolean;
    commentaryResult: string | null;
    isCommentaryLoading: boolean;
    gameEpitaph: string | null;
    finalGameState: GameState | null;
}

export interface UIActions {
    setView: (view: AppView) => void;
    setLoading: (isLoading: boolean) => void;
    setHintLoading: (isHintLoading: boolean) => void;
    setSaving: (isSaving: boolean) => void;
    setCurrentSaveSlotId: (slotId: string | null) => void;
    setError: (error: string | null) => void;
    setLoadingSummary: (summary: string | null) => void;
    setTtsConfig: (config: Partial<TTSConfig>) => void;
    setTtsControlsOpen: (isOpen: boolean) => void;
    setTheme: (theme: Theme) => void;
    setWhatIfModalOpen: (isOpen: boolean) => void;
    setWhatIfResult: (result: string | null) => void;
    setWhatIfLoading: (isLoading: boolean) => void;
    setCommentaryModalOpen: (isOpen: boolean) => void;
    setCommentaryResult: (result: string | null) => void;
    setCommentaryLoading: (isLoading: boolean) => void;
    resetUIState: () => void;
}

export type UISlice = UIState & UIActions;

const oldTheme = localStorage.getItem(THEME_STORAGE_KEY);
// Migrate old theme values to the new system. Default to dark.
const initialTheme: Theme = oldTheme === 'theme-light' ? 'theme-light' : 'theme-dark';


export const uiInitialState: UIState = {
    view: 'permission',
    isLoading: false,
    isHintLoading: false,
    isSaving: false,
    currentSaveSlotId: null,
    error: null,
    loadingSummary: null,
    ttsConfig: {
        enabled: true,
        voiceURI: null,
        rate: 1,
        pitch: 1,
    },
    isTtsControlsOpen: false,
    theme: initialTheme,
    isWhatIfModalOpen: false,
    whatIfResult: null,
    isWhatIfLoading: false,
    isCommentaryModalOpen: false,
    commentaryResult: null,
    isCommentaryLoading: false,
    gameEpitaph: null,
    finalGameState: null,
};

export const createUISlice = (set): UISlice => ({
    ...uiInitialState,
    setView: (view) => set(() => ({ view, error: null })),
    setLoading: (isLoading) => set(() => ({ isLoading })),
    setHintLoading: (isHintLoading) => set(() => ({ isHintLoading })),
    setSaving: (isSaving) => set(() => ({ isSaving })),
    setCurrentSaveSlotId: (slotId) => set(() => ({ currentSaveSlotId: slotId })),
    setError: (error) => set(() => ({ error, isLoading: false, view: 'start' })),
    setLoadingSummary: (summary) => set(() => ({ loadingSummary: summary })),
    setTtsConfig: (config) => set((state) => {
        const newConfig = { ...state.ttsConfig, ...config };
        ttsService.updateConfig(newConfig);
        return { ttsConfig: newConfig };
    }),
    setTtsControlsOpen: (isOpen) => set({ isTtsControlsOpen: isOpen }),
    setTheme: (theme) => {
        try {
            localStorage.setItem(THEME_STORAGE_KEY, theme);
        } catch (e) {
            console.error("Failed to save theme to localStorage", e);
        }
        set({ theme });
    },
    setWhatIfModalOpen: (isOpen) => set({ isWhatIfModalOpen: isOpen, whatIfResult: null }), // Reset result on open/close
    setWhatIfResult: (result) => set({ whatIfResult: result }),
    setWhatIfLoading: (isLoading) => set({ isWhatIfLoading: isLoading }),
    setCommentaryModalOpen: (isOpen) => set({ isCommentaryModalOpen: isOpen, commentaryResult: null }), // Reset result on open/close
    setCommentaryResult: (result) => set({ commentaryResult: result }),
    setCommentaryLoading: (isLoading) => set({ isCommentaryLoading: isLoading }),
    resetUIState: () => set(uiInitialState),
});