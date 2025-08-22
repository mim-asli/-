export type CodexCategory = 'شخصیت' | 'مکان' | 'افسانه' | 'آیتم' | 'موجود';

export interface Skill {
  id: string; // e.g., 'stealth_1', 'lockpicking_2'
  name: string; // e.g., "Stealth", "Advanced Lockpicking"
  description: string;
  tier: number; // 1, 2, 3, etc.
  category: 'Combat' | 'Stealth' | 'Social' | 'Knowledge' | 'Crafting' | 'Special';
}

export type Genre = 'scifi' | 'fantasy' | 'classic';
export type Difficulty = 'narrative' | 'balanced' | 'survival';
export type GMPersonality = 'standard' | 'cynical' | 'poetic' | 'minimalist' | 'humorous';

export interface ChatMessage {
  role: 'user' | 'model' | 'hint' | 'error';
  text: string;
}

export interface InventoryItem {
  name: string;
  description: string;
}

export interface PlayerStatus {
  health: {
    current: number;
    max: number;
  };
  sanity: {
    current: number;
    max: number;
  };
  satiety: {
    current: number;
    max: number;
  };
  thirst: {
    current: number;
    max: number;
  };
  specialResource: {
    name: string; // e.g., 'Aether', 'Mana', 'Grit'
    current: number;
    max: number;
    condition: string;
  };
  skillPoints: {
    current: number;
  };
  currency: {
    name: string;
    amount: number;
  };
  healthCondition: string;
  sanityCondition: string;
  satietyCondition: string;
  thirstCondition: string;
}

export interface CharacterProfile {
  name: string;
  description?: string;
}

export interface LocationProfile {
  name: string;
  description?: string;
}

export interface Trait {
  id: string;
  name: string;
  description: string;
  type: 'perk' | 'flaw';
}

export interface Quest {
  id: string;
  title: string;
  description: string;
  status: 'فعال' | 'تکمیل شد' | 'شکست خورد';
  reward?: {
    currency?: number;
    items?: InventoryItem[];
  };
}

export interface DiscoveredLocation {
    name: string;
    x: number;
    y: number;
}

export interface Relationship {
    id:string; // The unique identifier for the faction/NPC, e.g., 'merchants_guild'
    name: string; // e.g., "The Merchants' Guild"
    standing: number; // e.g., -50 to 100
    description: string; // e.g., "Views you with suspicion"
}

export interface WorldEvent {
  title: string;
  description: string;
}

export interface Companion {
    id: string;
    name: string;
    archetype: string; // e.g., "Grizzled Mercenary", "Curious Automaton"
    description: string;
    ability: {
        name: string;
        description: string;
    };
    relationship: number; // -100 to 100
}

export interface CodexEntry {
    id: string;
    category: CodexCategory;
    name: string;
    description: string;
}

export interface Recipe {
  id: string; // e.g., 'recipe_health_potion'
  name: string; // e.g., "معجون سلامتی"
  resultDescription: string; // e.g., "یک معجون که زخم های سطحی را درمان می کند."
  ingredients: string[]; // e.g., ["گل لاله کوهی", "آب چشمه"]
}

export interface Enemy {
    id: string;
    name: string;
    description: string;
    health: {
        current: number;
        max: number;
    };
}

export interface SceneEntity {
    id: string; // Player's name, companion's ID, enemy's ID, or a unique name for a lore object
    type: 'player' | 'companion' | 'enemy' | 'lore';
    name: string; // Display name
    description: string; // A short description for tooltip
}

export interface GameState {
  story: string;
  playerStatus: PlayerStatus;
  inventory: InventoryItem[];
  skills: Skill[];
  availableSkills: Skill[];
  choices: string[];
  worldState: {
    day: number;
    time: string; // e.g., "08:00"
  };
  relationships: Relationship[];
  quests: Quest[];
  discoveredLocations: DiscoveredLocation[];
  companions: Companion[];
  codex: CodexEntry[];
  discoveredRecipes: Recipe[];
  sceneEntities?: SceneEntity[];
  isGameOver?: boolean;
  isInCombat?: boolean;
  enemies?: Enemy[];
  playerDescription?: string;
  newTrait?: Trait;
  newCharacter?: {
    name: string;
    description: string;
  };
  newLocation?: {
    name:string;
    description: string;
    x: number;
    y: number;
  };
  newQuest?: Quest;
  worldEvent?: WorldEvent;
  newCompanion?: {
    id: string;
    name: string;
    archetype: string;
    description: string;
    ability: {
        name: string;
        description: string;
    };
  };
  newCodexEntry?: {
    category: CodexCategory;
    name: string;
    description: string;
  };
  newRecipe?: Recipe;
  audio?: {
    ambient?: string | null; // e.g., 'forest', 'cave', 'village', null to stop
    sfx?: string | null;      // e.g., 'item_pickup', 'quest_complete'
    music?: string | null;    // e.g., 'peaceful', 'combat', 'mystery'
  };
}

export interface ApiKey {
  id: string;
  name: string;
  key: string;
  isActive: boolean;
}

export interface LocalAiConfig {
    endpoint: string;
    enabled: boolean;
    prioritize: boolean;
}

export interface HuggingFaceConfig {
    apiKey: string;
    model: string;
    enabled: boolean;
    prioritize: boolean;
}

export interface PinnedAction {
    type: 'item' | 'skill';
    id: string; // Item name or Skill ID
    name: string;
}

// Represents all the state needed to fully restore a game session.
export interface FullGameState {
    genre: Genre | null;
    difficulty: Difficulty;
    gmPersonality: GMPersonality;
    history: ChatMessage[];
    playerName: string | null;
    playerDescription: string | null;
    archetypeId: string | null;
    playerStatus: PlayerStatus | null;
    worldState: { day: number; time: string } | null;
    inventory: InventoryItem[];
    skills: Skill[];
    availableSkills: Skill[];
    choices: string[];
    gameOver: boolean;
    isInCombat: boolean;
    enemies: Enemy[];
    enemiesDefeated: number;
    currentCharacter: CharacterProfile | null;
    currentLocation: LocationProfile | null;
    quests: Quest[];
    relationships: Relationship[];
    discoveredLocations: DiscoveredLocation[];
    traits: Trait[];
    companions: Companion[];
    codex: CodexEntry[];
    discoveredRecipes: Recipe[];
    sceneEntities: SceneEntity[];
    narrativeSummary: string | null;
    pinnedActions: PinnedAction[];
}

// Represents a single save slot stored in localStorage.
export interface SaveSlot {
    id: string; // A unique ID for the slot, typically a timestamp.
    name: string; // A descriptive name, e.g., "Day 5, 14:30 - The Whispering Caves"
    savedAt: string; // ISO string for sorting and display.
    gameState: FullGameState;
}

// Represents the data structure for a user-defined custom scenario.
export interface CustomGameData {
  genre: Genre;
  difficulty: Difficulty;
  gmPersonality: GMPersonality;
  specialResourceName: string;
  playerName: string;
  playerDescription: string;
  archetype: {
    name: string;
    description: string;
  };
  inventory: InventoryItem[];
  skills: Skill[];
  traits: Trait[];
  scenario: {
    name: string;
    prompt: string;
    x: number;
    y: number;
  };
}

export interface Notification {
  id: string;
  type: 'success' | 'info' | 'quest' | 'skill' | 'codex' | 'companion' | 'recipe' | 'trait';
  message: string;
}

export interface TTSConfig {
    enabled: boolean;
    voiceURI: string | null;
    rate: number; // 0.1 to 10
    pitch: number; // 0 to 2
}

export interface ScoreboardStats {
    totalPlaythroughs: number;
    totalDaysSurvived: number;
    totalQuestsCompleted: number;
    totalEnemiesDefeated: number;
    playthroughsByGenre: Record<Genre, number>;
    playthroughsByArchetype: Record<string, number>;
}

// --- Data Definitions for JSON ---
export interface GenreDefinition {
    name:string;
    description: string;
    resourceName: string;
    currencyName: string;
}

export interface IconDefinition {
    name:string;
    description: string;
    iconId: string;
}

export type DifficultyDefinition = IconDefinition;
export type GMPersonalityDefinition = IconDefinition;

export interface Archetype {
    id: string;
    name: string;
    genre: Genre;
    description: string;
    inventory: InventoryItem[];
    skills: Skill[];
    iconId: string;
    healthMod: number;
    sanityMod: number;
    satietyMod: number;
    thirstMod: number;
    resourceMod: number;
    perkId: string;
    flawId: string;
}

export interface Scenario {
    name: string;
    description: string;
    prompt: string;
    x: number;
    y: number;
    genre: Genre;
}