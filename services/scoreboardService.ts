import { FullGameState, ScoreboardStats, Genre } from '../types';

const SCOREBOARD_STORAGE_KEY = 'gemini-rpg-scoreboard';

const initialStats: ScoreboardStats = {
    totalPlaythroughs: 0,
    totalDaysSurvived: 0,
    totalQuestsCompleted: 0,
    totalEnemiesDefeated: 0,
    playthroughsByGenre: {
        scifi: 0,
        fantasy: 0,
        classic: 0,
    },
    playthroughsByArchetype: {},
};

export const getScoreboard = (): ScoreboardStats => {
    try {
        const stored = localStorage.getItem(SCOREBOARD_STORAGE_KEY);
        if (stored) {
            const parsed = JSON.parse(stored);
            // Basic validation and merging with defaults for forward compatibility
            return { ...initialStats, ...parsed };
        }
    } catch (e) {
        console.error("Failed to load scoreboard from localStorage", e);
    }
    return { ...initialStats };
};

const saveScoreboard = (stats: ScoreboardStats): void => {
    try {
        localStorage.setItem(SCOREBOARD_STORAGE_KEY, JSON.stringify(stats));
    } catch (e) {
        console.error("Failed to save scoreboard to localStorage", e);
    }
};

export const updateScoreboardOnGameOver = (finalState: FullGameState): void => {
    const stats = getScoreboard();

    stats.totalPlaythroughs += 1;
    stats.totalDaysSurvived += finalState.worldState?.day || 0;
    stats.totalQuestsCompleted += finalState.quests.filter(q => q.status === 'تکمیل شد').length;
    stats.totalEnemiesDefeated += finalState.enemiesDefeated;

    if (finalState.genre) {
        stats.playthroughsByGenre[finalState.genre] = (stats.playthroughsByGenre[finalState.genre] || 0) + 1;
    }

    if (finalState.archetypeId) {
        stats.playthroughsByArchetype[finalState.archetypeId] = (stats.playthroughsByArchetype[finalState.archetypeId] || 0) + 1;
    }

    saveScoreboard(stats);
};

export const resetScoreboard = (): void => {
    saveScoreboard({ ...initialStats });
};