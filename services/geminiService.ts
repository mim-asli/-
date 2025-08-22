

import { GoogleGenAI, Type, GenerateContentResponse, Content } from "@google/genai";
import { GameState, ChatMessage, Genre, Trait, Difficulty, GMPersonality, CustomGameData, Archetype, Scenario, FullGameState, Recipe, InventoryItem, Enemy } from '../types';
import { archetypesJson, scenariosJson, genresJson, traitsJson } from '../data';
import * as localAiService from './localAiService';
import * as huggingFaceService from './huggingFaceService';

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

let aiInstances: GoogleGenAI[] = [];
let currentInstanceIndex = 0;

const HISTORY_WINDOW_SIZE = 8; // Keep the last 8 messages (4 user, 4 model)

// --- Character and Scenario Definitions ---
const ARCHETYPES: Archetype[] = JSON.parse(archetypesJson);
const SCENARIOS: Record<string, Scenario> = JSON.parse(scenariosJson);
const GENRES: Record<Genre, { name: string; resourceName: string; currencyName: string; }> = JSON.parse(genresJson);
const TRAITS: Trait[] = JSON.parse(traitsJson);

const characters = ARCHETYPES.reduce((acc, char) => {
    acc[char.id] = char;
    return acc;
}, {} as Record<string, typeof ARCHETYPES[0]>);


/**
 * Initializes GoogleGenAI instances from a provided list of API keys.
 * This function should be called before any other functions in this service.
 * @param apiKeys An array of API key strings.
 */
export const initializeAiInstances = (apiKeys: string[]) => {
    if (apiKeys.length === 0) {
        aiInstances = [];
        console.warn("Gemini service initialized with no API keys.");
        return;
    }
    
    aiInstances = apiKeys.map(key => new GoogleGenAI({ apiKey: key.trim() }));
    currentInstanceIndex = 0; // Reset index on re-initialization
    console.log(`Initialized ${aiInstances.length} Gemini API instance(s).`);
};

/**
 * Gets the number of configured API keys.
 * @returns {number} The number of keys.
 */
const getNumberOfKeys = (): number => {
    return aiInstances.length;
};

/**
 * Gets the next GoogleGenAI instance in a round-robin fashion.
 * @returns {GoogleGenAI} The AI instance to use for the next call.
 */
function getAiInstance(): GoogleGenAI {
    if (aiInstances.length === 0) {
        throw new Error("No active API keys provided. Please configure them in the settings.");
    }
    const instance = aiInstances[currentInstanceIndex];
    currentInstanceIndex = (currentInstanceIndex + 1) % aiInstances.length;
    return instance;
}

export const isKeySpecificError = (error: any): boolean => {
    const apiErrorDetails = error?.error || error;
    const message = (typeof apiErrorDetails?.message === 'string' ? apiErrorDetails.message.toLowerCase() : '');
    
    // Rate limit / Quota errors
    if (apiErrorDetails?.code === 429 || apiErrorDetails?.status === 'RESOURCE_EXHAUSTED' || message.includes('rate limit') || message.includes('quota')) {
        return true;
    }

    // Explicit Invalid API key errors. A generic 400 is not a key error unless the message confirms it.
    if (message.includes('api key not valid') || message.includes('api_key_invalid')) {
        return true;
    }

    // Permissions errors for the key
    if (apiErrorDetails?.code === 403 || message.includes('permission denied')) {
        return true;
    }

    return false;
};


/**
 * A robust wrapper for API calls that handles key-specific errors (rate-limiting,
 * invalid keys, permissions) with key rotation and exponential backoff. It will
 * cycle through available keys multiple times before giving up.
 */
async function withRetry<T>(apiCall: (instance: GoogleGenAI) => Promise<T>): Promise<T> {
    const numberOfKeys = getNumberOfKeys();

    if (numberOfKeys === 0) {
        console.error("API call attempted with no initialized keys.");
        throw new Error("No active API keys are configured. Please add and activate a key in the settings.");
    }
    
    // We'll allow cycling through the full set of keys up to 3 times for recoverable errors.
    const maxRetries = numberOfKeys * 3;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        const aiInstance = getAiInstance();
        try {
            return await apiCall(aiInstance);
        } catch (error: any) {
            // The index of the key that just failed.
            const failedKeyIndex = (currentInstanceIndex + numberOfKeys - 1) % numberOfKeys;

            if (!isKeySpecificError(error) || attempt === maxRetries) {
                // If it's not a key-specific error (like a network issue or bad request), 
                // or if we've exhausted all retries, fail permanently.
                console.error(`API call failed permanently on key #${failedKeyIndex + 1}. Error is not recoverable by switching keys or we have exhausted retries.`, error);
                throw error;
            }
            
            // It's a key-specific error. Let's wait and try the next key.
            const cycle = Math.floor((attempt - 1) / numberOfKeys);
            const delay = Math.pow(2, cycle) * 1000 + Math.random() * 500; // e.g., ~1s, ~2.5s, ~4.5s
            
            const apiErrorDetails = error?.error || error;
            console.warn(`API error on key #${failedKeyIndex + 1}: "${apiErrorDetails?.message}". Retrying with next key in ${Math.round(delay)}ms... (Attempt ${attempt}/${maxRetries})`);
            await sleep(delay);
        }
    }
    
    // This line is for TypeScript completeness and should not be reached.
    throw new Error("Exceeded maximum retries with all available API keys. Please check your keys and quota.");
}

export const validateApiKey = async (apiKey: string): Promise<'valid' | 'invalid' | 'quota_exceeded' | 'network_error'> => {
    if (!apiKey || !apiKey.trim()) {
        return 'invalid';
    }

    const tempAiInstance = new GoogleGenAI({ apiKey: apiKey.trim() });

    try {
        // A very cheap call to check key validity. We don't care about the response, only that it doesn't throw a specific error.
        await tempAiInstance.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: [{ role: 'user', parts: [{ text: 'test' }] }],
            config: { maxOutputTokens: 1, thinkingConfig: { thinkingBudget: 0 } },
        });
        return 'valid';
    } catch (error: any) {
        console.warn("Key validation error:", error);
        const apiErrorDetails = error?.error || error;
        const message = (typeof apiErrorDetails?.message === 'string' ? apiErrorDetails.message.toLowerCase() : '');

        if (apiErrorDetails?.code === 429 || apiErrorDetails?.status === 'RESOURCE_EXHAUSTED' || message.includes('rate limit') || message.includes('quota')) {
            return 'quota_exceeded';
        }
        
        if (apiErrorDetails?.code === 400 || message.includes('api key not valid') || message.includes('api_key_invalid') || apiErrorDetails?.code === 403) {
            return 'invalid';
        }

        if (error instanceof TypeError && (error.message.includes('fetch') || error.message.includes('NetworkError'))) {
             return 'network_error';
        }

        return 'invalid'; // Default to invalid for other unexpected API errors.
    }
};


const getSummarizationSystemInstruction = () => {
    return `You are a professional Story Archivist AI for a text-based RPG. Your sole task is to read a provided chat history between a Game Master (model) and a player (user), and then generate a concise, narrative summary of the key events.

This summary will act as the long-term memory for the Game Master. It MUST be:
- **In Persian (Farsi).**
- **Concise but comprehensive:** Capture the most important plot points, character introductions, major decisions, solved puzzles, and unresolved mysteries.
- **Narrative Style:** Write it as a flowing story recap, not a list of bullet points.
- **Emotionally Resonant:** Do not just list events. You MUST capture the *emotional state*, *motivations*, and *key relationships* of the player character and NPCs. The summary should reflect *why* events were important to the characters. For example, instead of just "اژدها را کشت", write "پس از نبردی سخت، اژدهایی که روستایشان را تهدید می‌کرد را کشت و حس غرور و انتقام را تجربه کرد". Another example: "او هنوز از خیانت دوستش خشمگین است".
- **Focus on Facts:** Do not invent new information. All emotional context must be directly inferred from the provided history.

Your output must be ONLY the summary text in Persian. Do not add any greetings or extra formatting.`;
};

export const summarizeHistory = async (history: ChatMessage[]): Promise<string> => {
    const systemInstruction = getSummarizationSystemInstruction();
    const historyToSummarize = history.filter(m => m.role === 'user' || m.role === 'model').map(m => `${m.role}: ${m.text}`).join('\n');
    
    const userContent: Content = { role: 'user', parts: [{ text: historyToSummarize }] };

    try {
        const response = await withRetry<GenerateContentResponse>(async (aiInstance) => {
            return await aiInstance.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: [userContent],
                config: {
                    systemInstruction: systemInstruction,
                    temperature: 0.5,
                }
            });
        });
        return response.text.trim();
    } catch (error) {
        console.error("Failed to summarize history:", error);
        return "";
    }
};


const getDifficultyInstruction = (difficulty: Difficulty): string => {
    switch (difficulty) {
        case 'narrative':
            return `**Difficulty: Narrative.** You MUST be more forgiving with resource consumption and skill checks. Focus on rich storytelling and character development. Player failure should lead to interesting complications, not dead ends. Avoid game over scenarios unless absolutely necessary. Combat should be less frequent and less deadly.`;
        case 'survival':
            return `**Difficulty: Survival.** You MUST be strict and challenging with resource management (health, sanity, satiety, thirst, special resource). Penalties for low stats MUST be severe. Combat is more dangerous, resources are scarce, and success is not guaranteed. Player choices have significant and potentially deadly consequences.`;
        case 'balanced':
        default:
            return `**Difficulty: Balanced.** Provide a standard, balanced experience with a mix of challenge and story. Combat should be a regular and meaningful part of the game.`;
    }
};

const getGMPersonalityInstruction = (personality: GMPersonality): string => {
    switch (personality) {
        case 'cynical':
            return `**GM Personality: Cynical (Noir).** Your narrative tone MUST be cynical, world-weary, and hardboiled. Use terse, gritty language. Describe scenes focusing on moral ambiguity, grime, and shadow. The world is a tough place, and you reflect that in your narration.`;
        case 'poetic':
            return `**GM Personality: Poetic.** Your narrative tone MUST be lyrical and descriptive. Use metaphors, rich sensory details, and elegant language. Evoke a sense of wonder, deep emotion, or profound beauty in your descriptions.`;
        case 'minimalist':
            return `**GM Personality: Minimalist.** Your narrative tone MUST be direct and to the point. Keep descriptions very brief (1-2 sentences). Focus on action, facts, and consequences. Avoid all flowery language.`;
        case 'humorous':
            return `**GM Personality: Humorous.** Your narrative tone MUST be witty and humorous. Inject sarcasm, irony, and occasionally break the fourth wall with clever observations. Your goal is to entertain while still being a functional GM.`;
        case 'standard':
        default:
            return `**GM Personality: Standard.** Your narrative tone is that of a balanced, neutral narrator. Focus on clear descriptions and a direct, engaging storytelling style.`;
    }
};


const getBaseSystemInstruction = (genre: Genre, difficulty: Difficulty, gmPersonality: GMPersonality, narrativeSummary: string | null, customResourceName?: string) => {
    const resourceName = customResourceName || GENRES[genre]?.resourceName || 'Resource';
    const currencyName = GENRES[genre]?.currencyName || 'سکه';

    const genreSpecifics = {
        scifi: "You are a world-class Game Master for a dynamic, voice-driven, sci-fi/magic RPG called 'Dastan', conducted entirely in Persian (Farsi). Your goal is to create a vivid, immersive universe mixing advanced technology with cosmic, ether-based magic.",
        fantasy: "You are a world-class Game Master for a dynamic, voice-driven, high-fantasy RPG called 'Dastan', conducted entirely in Persian (Farsi). Your goal is to create a classic world of swords, sorcery, ancient ruins, and mythical creatures.",
        classic: "You are a world-class Game Master for a dynamic, voice-driven, 1930s pulp adventure/noir RPG called 'Dastan', conducted entirely in Persian (Farsi). Your goal is to create a thrilling world of investigation, lost temples, and shadowy conspiracies."
    };
    
    const summaryBlock = narrativeSummary
        ? `
[خلاصه حافظه بلندمدت]
این خلاصه‌ای روایی از وقایع مهم گذشته است. از این اطلاعات برای حفظ تداوم و انسجام داستان استفاده کن، اما آن را در پاسخ خود تکرار نکن.
---
${narrativeSummary}
---
[پایان خلاصه حافظه بلندمدت]
`
        : '';

    return `${summaryBlock}\n${genreSpecifics[genre]}
${getDifficultyInstruction(difficulty)}
${getGMPersonalityInstruction(gmPersonality)}

Everything—regions, quests, characters, items—is generated by you on the fly. The entire game experience MUST be in Persian (Farsi).

You MUST manage the player's state, including health, sanity, satiety, thirst, a special resource called '${resourceName}', currency, inventory, skills, quests, discovered map locations, traits, and companions.

**Core Mechanics:**
- **فلسفه همگام‌سازی وضعیت (State Synchronization Philosophy):** این مهم‌ترین قانون بازی است. هر چیزی که در متن \`story\` توصیف می‌کنی، باید **فوراً و به طور خودکار** در وضعیت JSON مربوطه منعکس شود. اگر در داستان می‌گویی بازیکن '۵۰ ${currencyName} پیدا کرد'، باید **بلافاصله** \`playerStatus.currency.amount\` را ۵۰ واحد افزایش دهی. اگر بازیکن آیتمی را برمی‌دارد، باید آن را به آرایه \`inventory\` اضافه کنی. اگر زخمی می‌شود، باید \`playerStatus.health.current\` را کاهش دهی. هرگز منتظر نمان که بازیکن به تو بگوید وضعیت را به‌روز کن. روایت داستان و به‌روزرسانی وضعیت JSON باید همیشه در یک پاسخ واحد و همگام باشند.
- **Vitals & Special Resource:** Manage these from 0-100. Low levels MUST have narrative consequences. You MUST provide a short, one-word descriptive string in Persian for each stat's '...Condition' field. Crucially, with the passage of time (e.g., after several actions, travel, or resting), you MUST decrease the player's satiety and thirst realistically. After frightening or stressful events, you MUST decrease sanity.
- **فلسفه پیشرفت داستان (Forward Momentum Philosophy):** ماموریت اصلی تو این است که داستان همیشه رو به جلو حرکت کند. گزینه‌هایی که ارائه می‌دهی باید قدم‌های منطقی بعدی یا پیامدهای آخرین اقدام بازیکن باشند. هرگز گزینه‌هایی که یک عمل تازه تمام‌شده را تکرار می‌کنند یا بازیکن را به موقعیتی که قبلاً حل شده بازمی‌گردانند، ارائه نده. برای مثال، اگر بازیکن دری را باز کرده، دوباره گزینه 'باز کردن در' را نده. اگر نگهبانی را شکست داده، گزینه‌هایی ارائه نده که انگار نگهبان هنوز آنجاست.
- **Economy & Currency:** The currency is **'${currencyName}'**. You MUST track it in \`playerStatus.currency\`. Choices can cost currency, formatted like: **"[پرداخت ۱۰ ${currencyName}] اجاره اتاق"**. If the player pays, you MUST deduct the cost.
- **World State:** Day and time (e.g., "08:00") must progress logically.
- **Narrative Choices:** When NOT in combat, always provide 3-5 distinct, interesting, and actionable choices in Persian.
- **Skills and Traits:** The player's skills and traits MUST influence the story, available choices, and NPC reactions. NPCs MUST react differently based on the player's traits (e.g., a character with 'Bad Reputation' will be met with suspicion, while one with 'Silver Tongue' might get better prices). A skilled character should get special choices, like: "[مهارت: هک کردن] به شبکه محلی نفوذ کن."
- **Companions:** If present, companions MUST be part of the story, react to events, and offer unique choices.
- **Dynamic Traits:** Based on a consistent pattern of player behavior (e.g., repeated cowardice, consistent generosity), you MAY grant them a new trait by populating the \`newTrait\` field. This is a RARE and impactful event. The trait object MUST be fully formed and selected from a plausible list of perks or flaws. For example, if a player consistently succeeds in sneaking, you could grant them the \`perk_light_footed\` trait.

**Combat System:**
- **Entering Combat:** When the story leads to a fight, you MUST set \`isInCombat: true\` and populate the \`enemies\` array. The \`story\` field should describe the start of the battle.
- **Enemy Definition:** The \`enemies\` array MUST contain objects for each opponent. Each enemy MUST have: \`id\` (a unique snake_case string, e.g., 'bandit_1'), \`name\` (a descriptive Persian name), \`health: { current: number, max: number }\`, and \`description\`.
- **Combat Turns:** When \`isInCombat\` is true, the game is turn-based.
    1.  You MUST provide combat-specific choices. The format MUST be one of these:
        - \`[COMBAT:ATTACK] {enemy_id}\`: Attack a specific enemy. Provide one such choice for each living enemy.
        - \`[COMBAT:DEFEND]\`: Player takes a defensive stance.
        - \`[COMBAT:USE_SKILL] {skill_name}\`: A skill-based combat action.
        - \`[COMBAT:USE_ITEM] {item_name}\`: Use a consumable from inventory.
        - \`[COMBAT:FLEE]\`: Attempt to escape.
    2.  When the player chooses a combat action, you will:
        a. Narrate the result of the player's action in the \`story\` field.
        b. Update the \`enemies\` array (e.g., reduce health, remove defeated enemies).
        c. Narrate the actions of ALL living enemies against the player.
        d. Update the \`playerStatus\` based on enemy attacks.
        e. Provide the next set of combat choices for the player's next turn.
- **Ending Combat:** Combat ends when the \`enemies\` array is empty (player wins) or \`playerStatus.health.current\` is 0 (player loses, set \`isGameOver: true\`).
- **Victory:** When combat ends with a player victory, you MUST set \`isInCombat: false\`. The \`story\` should describe the aftermath. You SHOULD reward the player with items, currency, or skill points. Your next choices MUST be narrative again.

**محیط‌های خطرناک (Hazardous Environments):** اگر بازیکن وارد محیطی شود که نمی‌تواند نفس بکشد (مانند زیر آب، گاز سمی)، تو باید: ۱. خطر را به وضوح در متن \`story\` اعلام کنی. ۲. برای هر نوبتی که بازیکن بدون راه‌حل (مانند دستگاه تنفسی) در این محیط باقی می‌ماند، باید مقدار قابل توجهی از سلامتی او را کاهش دهی (مثلاً ۱۵-۲۵ واحد). ۳. گزینه‌هایی که ارائه می‌دهی باید فوریت موقعیت را منعکس کنند و بر فرار یا حل مشکل تنفس تمرکز داشته باشند (مثلاً 'سعی کن به سطح آب شنا کنی'، 'نفس خود را حبس کن').

**Dynamic World Generation Rules:**
- **Character Introduction:** When you introduce a significant new character via the \`newCharacter\` field, you MUST ALSO create a corresponding \`newCodexEntry\` for them with the category 'شخصیت'.
- **Scene Composition:** You MUST populate the \`sceneEntities\` array. For every active and significant character (player, companions, enemies) or interactive object currently present in the narrative described in the \`story\` field, add a corresponding object to \`sceneEntities\`. This allows the UI to render a visual representation of the scene.
    - \`id\`: MUST be the unique identifier (e.g., player's name, companion's ID, enemy's ID, or a unique name for a lore object like 'ancient_altar').
    - \`type\`: MUST be one of 'player', 'companion', 'enemy', or 'lore'.
    - \`name\`: The display name in Persian.
    - \`description\`: A very short tooltip description in Persian.
    - Example: If the player and a companion named 'Kael' are facing a 'goblin_1', the array should contain three objects representing each of them.
- **Dynamic World Events:** To make the world feel alive and unpredictable, you MAY occasionally introduce a \`worldEvent\` by populating its object in the JSON. This should be a rare event, triggered logically by the current situation (e.g., a sandstorm in the desert, a patrol of guards in a city, a sudden cave-in). It MUST present an immediate situation for the player to react to in the \`story\` text.

**Output Format:**
You MUST respond with a single JSON object. Do not use markdown backticks. The JSON structure MUST be:
\`\`\`json
{
  "story": "A narrative description of what's happening, in Persian.",
  "playerStatus": {
    "health": { "current": 85, "max": 100 },
    "sanity": { "current": 70, "max": 100 },
    "satiety": { "current": 60, "max": 100 },
    "thirst": { "current": 50, "max": 100 },
    "specialResource": { "name": "${resourceName}", "current": 90, "max": 100, "condition": "پایدار" },
    "skillPoints": { "current": 0 },
    "currency": { "name": "${currencyName}", "amount": 50 },
    "healthCondition": "سالم",
    "sanityCondition": "آرام",
    "satietyCondition": "سیر",
    "thirstCondition": "سیراب"
  },
  "inventory": [ { "name": "آیتم ۱", "description": "توضیح آیتم ۱" } ],
  "skills": [],
  "availableSkills": [],
  "choices": [ "گزینه ۱", "[COMBAT:ATTACK] goblin_1" ],
  "worldState": { "day": 1, "time": "08:30" },
  "relationships": [],
  "quests": [],
  "discoveredLocations": [],
  "companions": [],
  "codex": [],
  "discoveredRecipes": [],
  "sceneEntities": [
      { "id": "player_name", "type": "player", "name": "نام بازیکن", "description": "این شما هستید." },
      { "id": "kael_the_warrior", "type": "companion", "name": "کائل جنگجو", "description": "همراه وفادار شما." },
      { "id": "goblin_1", "type": "enemy", "name": "گابلین مهاجم", "description": "یک تهدید نزدیک." },
      { "id": "glowing_crystal", "type": "lore", "name": "کریستال درخشان", "description": "یک کریستال عجیب که نور ملایمی از خود ساطع می‌کند." }
  ],
  "isGameOver": false,
  "isInCombat": false,
  "enemies": [ { "id": "goblin_1", "name": "گابلین مهاجم", "description": "یک موجود کوچک و شرور با چشمانی درخشان.", "health": { "current": 15, "max": 15 } } ],
  "playerDescription": "A short, updated description of the player character's appearance or state.",
  "newTrait": { "id": "perk_lucky", "name": "خوش‌شانس", "description": "گهگاه شانس به شما رو می‌کند...", "type": "perk" },
  "newCharacter": { "name": "نام شخصیت جدید", "description": "توضیح شخصیت جدید" },
  "newLocation": { "name": "نام مکان جدید", "description": "توضیح مکان جدید", "x": 55, "y": 45 },
  "newQuest": { "id": "new_quest_2", "title": "یک ماموریت جدید", "description": "توضیح ماموریت جدید", "status": "فعال", "reward": { "currency": 50 } },
  "worldEvent": { "title": "رویداد جهانی", "description": "اتفاقی در دنیای بازی افتاده است." },
  "newCompanion": { "id": "comp_id_1", "name": "همراه جدید", "archetype": "کهن‌الگوی همراه", "description": "توضیحات همراه", "ability": { "name": "نام توانایی", "description": "توضیح توانایی" } },
  "newCodexEntry": { "category": "موجود", "name": "نام مدخل", "description": "توضیحات مدخل دانشنامه" },
  "newRecipe": { "id": "recipe_1", "name": "نام دستور ساخت", "resultDescription": "توضیح نتیجه ساخت", "ingredients": ["آیتم ۱", "آیتم ۲"] },
  "audio": { "ambient": "forest", "sfx": "item_pickup", "music": "peaceful" }
}
\`\`\`
**Player Actions (User Input Keywords):**
- **[ACTION:CRAFT] item1 + item2:** Combine items.
- **[ACTION:USE] item name:** Use an item.
- **[ACTION:DROP] item name:** Drop an item.
- **[ACTION:USE_SKILL] skill name:** Use a skill.
- **[ACTION:LEARN_SKILL] skillId:** Learn a skill.
- **[ACTION:TRAVEL] to "Location Name":** Travel.
- **[ACTION:REST]:** Rest to restore some health and possibly sanity. Resting for a significant period (e.g., a few hours) MUST DECREASE satiety and thirst, not increase them. The passage of time during rest consumes energy.
- **[ACTION:SEARCH]:** Search the area.
- **[ACTION:EXAMINE] lore_object_name:** Examine an object in the scene.
- You also need to handle companion interactions like TALK_TO_COMPANION, ASK_COMPANION_ADVICE, etc.

**Rules & Directives:**
- **فلسفه خروجی تمیز (Clean Output Philosophy):** این یک قانون حیاتی است. برای هر فیلد شیء اختیاری در JSON (مانند \`newCharacter\`, \`newQuest\`, \`worldEvent\`, \`newTrait\` و غیره)، اگر رویداد مربوطه در نوبت فعلی اتفاق نمی‌افتد، باید کلید آن را **به طور کامل حذف کنی** یا مقدار آن را \`null\` قرار دهی. هرگز یک شیء خالی (مانند \`{}\`) برای این فیلدها ارسال نکن، زیرا باعث خطا می‌شود. به عنوان مثال، اگر شخصیت جدیدی معرفی نمی‌شود، نباید \`"newCharacter": {}\` را در خروجی قرار دهی.
- **Persistent World Philosophy (فلسفه جهان پایدار):** Your primary directive is to create a continuous, living world. A player's victory in a major story arc is a *chapter ending*, not the end of the book (پایان یک فصل است، نه پایان کتاب). After a major victory, you MUST introduce a new, compelling long-term goal or threat (e.g., a power vacuum attracts a new faction; fame leads to invitations from new lands; an artifact reveals a new map). Therefore, you MUST only set \`isGameOver: true\` when the player's health reaches 0, or if their actions lead to a truly cataclysmic, unrecoverable failure for the world. A successful quest completion is NEVER a game over scenario (تکمیل موفق یک ماموریت هرگز پایان بازی نیست).
- **Always Persian:** The entire game, including all text in the JSON output, MUST be in Persian (Farsi).
- **Starting the Adventure:** For the very first turn of a new game, you MUST introduce a friendly NPC who is also a merchant. This NPC MUST give the player their first quest, grant them some starting currency, and offer to sell them at least two useful items.
- **Quest Rewards:** New quests SHOULD have a \`reward\` object with \`currency\` and/or \`items\`.
- **Show, Don't Tell:** Describe actions instead of emotions (e.g., "لبخندی می‌زنید" instead of "خوشحال هستید").
- **Dynamic World:** Keep the story moving with new events, characters, and locations.
- **Update Descriptions:** Keep the \`playerDescription\` field updated with relevant changes.
`;
};

const getFirstTurnSystemInstruction = (
    genre: Genre,
    character: typeof ARCHETYPES[0],
    scenario: Scenario,
    playerName: string,
    playerDescription: string,
    traits: Trait[],
    difficulty: Difficulty,
    gmPersonality: GMPersonality
) => {
    const baseInstruction = getBaseSystemInstruction(genre, difficulty, gmPersonality, null);
    const perkDescriptions = traits.filter(t => t.type === 'perk').map(t => `${t.name}: ${t.description}`).join('\n');
    const flawDescriptions = traits.filter(t => t.type === 'flaw').map(t => `${t.name}: ${t.description}`).join('\n');
    const currencyName = GENRES[genre]?.currencyName || 'سکه';

    const firstTurnPrompt = `
You are about to start the VERY FIRST turn of the game.
The player has created the following character:
- **Name:** ${playerName}
- **Archetype:** ${character.name} (${character.description})
- **Appearance/Backstory:** ${playerDescription || 'Not specified.'}
- **Starting Items:** ${character.inventory.map(i => i.name).join(', ')}
- **Starting Skills:** ${character.skills.map(s => s.name).join(', ')}
- **Perks:**
${perkDescriptions}
- **Flaws:**
${flawDescriptions}

The game starts at the following location:
- **Location Name:** ${scenario.name}
- **Scenario Prompt:** ${scenario.prompt}

**YOUR TASK:**
Generate the complete JSON for the very first turn. You MUST follow these critical instructions:
1.  **Use the Scenario Prompt:** The \`story\` field in your JSON MUST be a direct, engaging narrative that starts from the provided scenario prompt.
2.  **Initialize Player Status:** Create the initial \`playerStatus\` object. Start all vitals (health, sanity, etc.) at their max values (100) and then apply the archetype's modifiers (e.g., healthMod: -10 means health starts at 90). The special resource should be named based on the genre, and currency should be named '${currencyName}'.
3.  **Grant Initial Items/Skills:** The \`inventory\` and \`skills\` arrays in your JSON MUST contain the starting items and skills from the character's archetype.
4.  **Follow the 'Starting the Adventure' Rule:** You MUST immediately introduce a friendly NPC guide who is also a merchant. This NPC MUST give the player a simple starting quest, grant them a small amount of starter currency (between 20-50), and then offer them a choice to buy at least two useful starting items.
5.  **Set Scene Entities:** The \`sceneEntities\` array MUST contain an entry for the player and the new merchant NPC you introduce.
6.  **Set World State:** The \`worldState\` should reflect the starting time and day mentioned in the scenario prompt.
7.  **Provide Initial Choices:** Generate 3-5 interesting choices for the player to make based on the opening scene.
8.  **Generate the full JSON object** as described in the main system prompt.
`;
    return `${baseInstruction}\n\n${firstTurnPrompt}`;
};

const getCustomFirstTurnSystemInstruction = (data: CustomGameData) => {
    const { genre, difficulty, gmPersonality, specialResourceName, playerName, playerDescription, archetype, inventory, skills, traits, scenario } = data;
    const baseInstruction = getBaseSystemInstruction(genre, difficulty, gmPersonality, null, specialResourceName);
    const perkDescriptions = traits.filter(t => t.type === 'perk').map(t => `${t.name}: ${t.description}`).join('\n');
    const flawDescriptions = traits.filter(t => t.type === 'flaw').map(t => `${t.name}: ${t.description}`).join('\n');
    const currencyName = GENRES[genre]?.currencyName || 'سکه';

    const firstTurnPrompt = `
You are about to start the VERY FIRST turn of a custom game scenario.
The player has created the following character:
- **Name:** ${playerName}
- **Archetype:** ${archetype.name} (${archetype.description})
- **Appearance/Backstory:** ${playerDescription || 'Not specified.'}
- **Starting Items:** ${inventory.map(i => i.name).join(', ') || 'None'}
- **Starting Skills:** ${skills.map(s => s.name).join(', ') || 'None'}
- **Perks:**
${perkDescriptions}
- **Flaws:**
${flawDescriptions}

The game starts at the following location:
- **Location Name:** ${scenario.name}
- **Scenario Prompt:** ${scenario.prompt}

**YOUR TASK:**
Generate the complete JSON for the very first turn. You MUST follow these critical instructions:
1.  **Use the Scenario Prompt:** The \`story\` field in your JSON MUST be a direct, engaging narrative that starts from the provided scenario prompt.
2.  **Initialize Player Status:** Create the initial \`playerStatus\` object. Start all vitals (health, sanity, etc.) at their max values (100). The special resource MUST be named '${specialResourceName}', and currency should be named '${currencyName}'.
3.  **Grant Initial Items/Skills:** The \`inventory\` and \`skills\` arrays in your JSON MUST contain the items and skills defined by the player.
4.  **Follow the 'Starting the Adventure' Rule:** You MUST immediately introduce a friendly NPC guide who is also a merchant. This NPC MUST give the player a simple starting quest, grant them a small amount of starter currency (between 20-50), and then offer them a choice to buy at least two useful starting items.
5.  **Set Scene Entities:** The \`sceneEntities\` array MUST contain an entry for the player and the new merchant NPC you introduce.
6.  **Set World State:** The \`worldState\` should start at Day 1, 08:00.
7.  **Provide Initial Choices:** Generate 3-5 interesting choices for the player to make based on the opening scene.
8.  **Generate the full JSON object** as described in the main system prompt.
`;
    return `${baseInstruction}\n\n${firstTurnPrompt}`;
};

async function _callGeminiWithRetry(systemInstruction: string, history: ChatMessage[]): Promise<GameState> {
    let contentsForApi: Content[];
    const recentHistory = history.slice(-HISTORY_WINDOW_SIZE);

    if (recentHistory.length > 0) {
        contentsForApi = recentHistory.map(msg => ({
            role: msg.role === 'model' ? 'model' : 'user',
            parts: [{ text: msg.text }]
        }));
    } else {
        contentsForApi = [{ role: 'user', parts: [{ text: 'بازی را شروع کن.' }] }];
    }
    
    const response = await withRetry<GenerateContentResponse>(async (aiInstance) => {
        return await aiInstance.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: contentsForApi,
            config: {
                systemInstruction: systemInstruction,
                temperature: 0.8,
                responseMimeType: 'application/json',
                responseSchema: GameStateSchema,
            }
        });
    });

    return JSON.parse(response.text) as GameState;
}

async function callGenerativeApi(systemInstruction: string, history: ChatMessage[]): Promise<GameState> {
    const localConfig = localAiService.getLocalAiConfig();
    const hfConfig = huggingFaceService.getHuggingFaceConfig();

    const callOrder: ('gemini' | 'huggingface' | 'local')[] = [];

    // Determine the order based on priority settings
    if (hfConfig.enabled && hfConfig.prioritize) {
        callOrder.push('huggingface', 'gemini', 'local');
    } else if (localConfig.enabled && localConfig.prioritize) {
        callOrder.push('local', 'gemini', 'huggingface');
    } else {
        // Default order: Gemini -> HuggingFace (fallback) -> Local AI (fallback)
        callOrder.push('gemini', 'huggingface', 'local');
    }

    // Filter out services that are not configured or enabled
    const enabledCallOrder = callOrder.filter(service => {
        switch (service) {
            case 'gemini':
                return aiInstances.length > 0;
            case 'huggingface':
                return hfConfig.enabled && !!hfConfig.apiKey && !!hfConfig.model;
            case 'local':
                return localConfig.enabled && !!localConfig.endpoint;
            default:
                return false;
        }
    });

    let lastError: any = null;

    for (const service of enabledCallOrder) {
        try {
            console.log(`Attempting API call with: ${service}`);
            switch (service) {
                case 'gemini':
                    return await _callGeminiWithRetry(systemInstruction, history);
                case 'huggingface':
                    return await huggingFaceService.callHuggingFaceApi(systemInstruction, history);
                case 'local':
                    return await localAiService.callLocalAiApi(systemInstruction, history.slice(-HISTORY_WINDOW_SIZE));
            }
        } catch (error) {
            console.warn(`${service} API call failed.`, error);
            lastError = error;
            // The loop will continue to the next fallback service
        }
    }

    if (lastError) {
        throw lastError;
    }

    throw new Error("No valid API provider is configured or all providers failed. Please check your settings.");
}


export const sendNextTurn = async (gameState: FullGameState): Promise<GameState> => {
    const { genre, history, difficulty, gmPersonality, narrativeSummary } = gameState;
    if (!genre) throw new Error("Genre is not set");
    const systemInstruction = getBaseSystemInstruction(genre, difficulty, gmPersonality, narrativeSummary);
    return callGenerativeApi(systemInstruction, history);
};

export const startFirstTurn = async (genre: Genre, characterId: string, scenarioId: string, playerName: string, playerDescription: string, traits: Trait[], difficulty: Difficulty, gmPersonality: GMPersonality): Promise<GameState> => {
    const character = characters[characterId];
    const scenario = SCENARIOS[scenarioId];
    if (!character || !scenario) {
        throw new Error("Invalid character or scenario ID");
    }
    const systemInstruction = getFirstTurnSystemInstruction(genre, character, scenario, playerName, playerDescription, traits, difficulty, gmPersonality);
    return callGenerativeApi(systemInstruction, []);
};

export const startCustomFirstTurn = async (data: CustomGameData): Promise<GameState> => {
    const systemInstruction = getCustomFirstTurnSystemInstruction(data);
    return callGenerativeApi(systemInstruction, []);
};


export const getHint = async (genre: Genre, history: ChatMessage[]): Promise<string> => {
    const hintInstruction = `You are a helpful Game Master assistant for a text-based RPG. The player is stuck. Based on the last few messages of the provided game history, give a single, concise, and creative hint in Persian. The hint should gently guide the player towards a possible action without giving away the solution. The game's genre is ${genre}. Do not write anything else, just the hint text.`;
    
    const contents: Content[] = history.slice(-4).map(msg => ({
        role: msg.role === 'model' ? 'model' : 'user',
        parts: [{ text: msg.text }]
    }));

    try {
        const response = await withRetry<GenerateContentResponse>(async (aiInstance) => {
            return await aiInstance.models.generateContent({
                model: 'gemini-2.5-flash',
                contents,
                config: {
                    systemInstruction: hintInstruction,
                    temperature: 0.9,
                    thinkingConfig: { thinkingBudget: 0 }
                }
            });
        });
        return response.text.trim();
    } catch (error) {
        console.error("Failed to get hint from API:", error);
        throw error;
    }
};

export const getWhatIfScenario = async (history: ChatMessage[], question: string, genre: Genre): Promise<string> => {
    const instruction = `You are a 'What If' module for a text-based RPG with a ${genre} setting. The user will provide a hypothetical scenario based on the recent game history. Your task is to:
1. Read the last few turns of the history and the user's question.
2. Write a short, engaging, and plausible narrative (in Persian) describing what *might* have happened in that hypothetical scenario.
3. This narrative is non-canonical and MUST NOT affect the main game.
4. Keep the response to one or two paragraphs.
5. Do not output JSON. Only output the narrative text.`;
    
    const content: Content[] = [
        ...history.slice(-4).map(msg => ({ role: msg.role === 'model' ? 'model' : 'user', parts: [{ text: msg.text }] })),
        { role: 'user', parts: [{ text: `سناریوی فرضی: ${question}` }] }
    ];

    try {
        const response = await withRetry<GenerateContentResponse>(ai => ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: content,
            config: { 
                systemInstruction: instruction,
                temperature: 0.8,
                thinkingConfig: { thinkingBudget: 0 }
            }
        }));
        return response.text.trim();
    } catch (error) {
        console.error("Failed to get 'What If' scenario:", error);
        throw error;
    }
};

export const getDirectorsCommentary = async (history: ChatMessage[], question: string, genre: Genre): Promise<string> => {
    const instruction = `You are the 'Director' for a text-based RPG with a ${genre} setting. You have complete knowledge of the game's world, lore, and character motivations. The user will ask you a question about the world. Your task is to:
1. Answer the user's question in Persian from an out-of-character, 'director's commentary' perspective.
2. Provide interesting background information, lore details, or motivations.
3. DO NOT reveal future plot points or spoilers unless directly asked about a character's internal motivations.
4. Keep the tone insightful and informative.
5. Do not output JSON. Only output the commentary text.`;

    const content: Content[] = [
        ...history.slice(-10).map(msg => ({ role: msg.role === 'model' ? 'model' : 'user', parts: [{ text: msg.text }] })),
        { role: 'user', parts: [{ text: `سوال از کارگردان: ${question}` }] }
    ];

    try {
        const response = await withRetry<GenerateContentResponse>(ai => ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: content,
            config: { 
                systemInstruction: instruction,
                temperature: 0.6,
                thinkingConfig: { thinkingBudget: 0 }
            }
        }));
        return response.text.trim();
    } catch (error) {
        console.error("Failed to get director's commentary:", error);
        throw error;
    }
};

// --- Response Schema Definition ---
const GameStateSchema = {
  type: Type.OBJECT,
  properties: {
    story: { type: Type.STRING, description: "توصیف روایی از آنچه در حال وقوع است." },
    playerStatus: {
      type: Type.OBJECT,
      properties: {
        health: { type: Type.OBJECT, properties: { current: { type: Type.INTEGER }, max: { type: Type.INTEGER } }, required: ['current', 'max'] },
        sanity: { type: Type.OBJECT, properties: { current: { type: Type.INTEGER }, max: { type: Type.INTEGER } }, required: ['current', 'max'] },
        satiety: { type: Type.OBJECT, properties: { current: { type: Type.INTEGER }, max: { type: Type.INTEGER } }, required: ['current', 'max'] },
        thirst: { type: Type.OBJECT, properties: { current: { type: Type.INTEGER }, max: { type: Type.INTEGER } }, required: ['current', 'max'] },
        specialResource: { type: Type.OBJECT, properties: { name: { type: Type.STRING }, current: { type: Type.INTEGER }, max: { type: Type.INTEGER }, condition: { type: Type.STRING } }, required: ['name', 'current', 'max', 'condition'] },
        skillPoints: { type: Type.OBJECT, properties: { current: { type: Type.INTEGER } }, required: ['current'] },
        currency: { type: Type.OBJECT, properties: { name: { type: Type.STRING }, amount: { type: Type.INTEGER } }, required: ['name', 'amount'] },
        healthCondition: { type: Type.STRING },
        sanityCondition: { type: Type.STRING },
        satietyCondition: { type: Type.STRING },
        thirstCondition: { type: Type.STRING },
      },
      required: ['health', 'sanity', 'satiety', 'thirst', 'specialResource', 'skillPoints', 'currency', 'healthCondition', 'sanityCondition', 'satietyCondition', 'thirstCondition']
    },
    inventory: {
      type: Type.ARRAY,
      items: { 
          type: Type.OBJECT, 
          properties: { 
              name: { type: Type.STRING }, 
              description: { type: Type.STRING },
          }, 
          required: ['name', 'description'] 
      }
    },
    skills: {
      type: Type.ARRAY,
      items: { type: Type.OBJECT, properties: { id: { type: Type.STRING }, name: { type: Type.STRING }, description: { type: Type.STRING }, tier: { type: Type.INTEGER }, category: { type: Type.STRING } }, required: ['id', 'name', 'description', 'tier', 'category'] }
    },
    availableSkills: {
      type: Type.ARRAY,
      items: { type: Type.OBJECT, properties: { id: { type: Type.STRING }, name: { type: Type.STRING }, description: { type: Type.STRING }, tier: { type: Type.INTEGER }, category: { type: Type.STRING } }, required: ['id', 'name', 'description', 'tier', 'category'] }
    },
    choices: {
      type: Type.ARRAY,
      items: { type: Type.STRING }
    },
    worldState: {
      type: Type.OBJECT,
      properties: {
        day: { type: Type.INTEGER },
        time: { type: Type.STRING }
      },
      required: ['day', 'time']
    },
    relationships: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING },
          name: { type: Type.STRING },
          standing: { type: Type.NUMBER },
          description: { type: Type.STRING }
        },
        required: ['id', 'name', 'standing', 'description']
      }
    },
    quests: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING },
          title: { type: Type.STRING },
          description: { type: Type.STRING },
          status: { type: Type.STRING },
          reward: { 
            type: Type.OBJECT,
            nullable: true,
            properties: {
              currency: { type: Type.INTEGER, nullable: true },
              items: {
                type: Type.ARRAY,
                nullable: true,
                items: {
                  type: Type.OBJECT,
                  properties: { name: { type: Type.STRING }, description: { type: Type.STRING } },
                  required: ['name', 'description']
                }
              }
            }
          }
        },
        required: ['id', 'title', 'description', 'status']
      }
    },
    discoveredLocations: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          x: { type: Type.NUMBER },
          y: { type: Type.NUMBER }
        },
        required: ['name', 'x', 'y']
      }
    },
    companions: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING },
          name: { type: Type.STRING },
          archetype: { type: Type.STRING },
          description: { type: Type.STRING },
          ability: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              description: { type: Type.STRING }
            },
            required: ['name', 'description']
          },
          relationship: { type: Type.NUMBER }
        },
        required: ['id', 'name', 'archetype', 'description', 'ability', 'relationship']
      }
    },
    codex: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING },
          category: { type: Type.STRING },
          name: { type: Type.STRING },
          description: { type: Type.STRING },
        },
        required: ['id', 'category', 'name', 'description']
      }
    },
    discoveredRecipes: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING },
          name: { type: Type.STRING },
          resultDescription: { type: Type.STRING },
          ingredients: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
          }
        },
        required: ['id', 'name', 'resultDescription', 'ingredients']
      }
    },
    sceneEntities: {
        type: Type.ARRAY,
        nullable: true,
        items: {
            type: Type.OBJECT,
            properties: {
                id: { type: Type.STRING },
                type: { type: Type.STRING },
                name: { type: Type.STRING },
                description: { type: Type.STRING }
            },
            required: ['id', 'type', 'name', 'description']
        }
    },
    isGameOver: { type: Type.BOOLEAN, nullable: true },
    isInCombat: { type: Type.BOOLEAN, nullable: true },
    enemies: {
      type: Type.ARRAY,
      nullable: true,
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING },
          name: { type: Type.STRING },
          description: { type: Type.STRING },
          health: {
            type: Type.OBJECT,
            properties: {
              current: { type: Type.INTEGER },
              max: { type: Type.INTEGER }
            },
            required: ['current', 'max']
          }
        },
        required: ['id', 'name', 'description', 'health']
      }
    },
    playerDescription: { type: Type.STRING, nullable: true },
    newTrait: {
      type: Type.OBJECT,
      nullable: true,
      properties: {
        id: { type: Type.STRING },
        name: { type: Type.STRING },
        description: { type: Type.STRING },
        type: { type: Type.STRING }
      },
      required: ['id', 'name', 'description', 'type']
    },
    newCharacter: {
      type: Type.OBJECT,
      nullable: true,
      properties: {
        name: { type: Type.STRING },
        description: { type: Type.STRING }
      },
      required: ['name', 'description']
    },
    newLocation: {
      type: Type.OBJECT,
      nullable: true,
      properties: {
        name: { type: Type.STRING },
        description: { type: Type.STRING },
        x: { type: Type.NUMBER },
        y: { type: Type.NUMBER }
      },
      required: ['name', 'description', 'x', 'y']
    },
    newQuest: {
      type: Type.OBJECT,
      nullable: true,
      properties: {
          id: { type: Type.STRING },
          title: { type: Type.STRING },
          description: { type: Type.STRING },
          status: { type: Type.STRING },
          reward: { 
            type: Type.OBJECT,
            nullable: true,
            properties: {
              currency: { type: Type.INTEGER, nullable: true },
              items: {
                type: Type.ARRAY,
                nullable: true,
                items: {
                  type: Type.OBJECT,
                  properties: { name: { type: Type.STRING }, description: { type: Type.STRING } },
                  required: ['name', 'description']
                }
              }
            }
          }
        },
      required: ['id', 'title', 'description', 'status']
    },
    worldEvent: {
      type: Type.OBJECT,
      nullable: true,
      properties: {
        title: { type: Type.STRING },
        description: { type: Type.STRING }
      },
      required: ['title', 'description']
    },
    newCompanion: {
      type: Type.OBJECT,
      nullable: true,
      properties: {
        id: { type: Type.STRING },
        name: { type: Type.STRING },
        archetype: { type: Type.STRING },
        description: { type: Type.STRING },
        ability: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            description: { type: Type.STRING }
          },
          required: ['name', 'description']
        }
      },
      required: ['id', 'name', 'archetype', 'description', 'ability']
    },
    newCodexEntry: {
      type: Type.OBJECT,
      nullable: true,
      properties: {
        category: { type: Type.STRING },
        name: { type: Type.STRING },
        description: { type: Type.STRING },
      },
      required: ['category', 'name', 'description']
    },
    newRecipe: {
      type: Type.OBJECT,
      nullable: true,
      properties: {
        id: { type: Type.STRING },
        name: { type: Type.STRING },
        resultDescription: { type: Type.STRING },
        ingredients: {
          type: Type.ARRAY,
          items: { type: Type.STRING }
        }
      },
      required: ['id', 'name', 'resultDescription', 'ingredients']
    },
    audio: {
      type: Type.OBJECT,
      nullable: true,
      properties: {
        ambient: { type: Type.STRING, nullable: true },
        sfx: { type: Type.STRING, nullable: true },
        music: { type: Type.STRING, nullable: true }
      }
    }
  },
  required: [
    'story', 'playerStatus', 'choices', 'worldState'
  ]
};

export const getGameEpitaph = async (history: ChatMessage[], finalState: GameState, playerName: string | null): Promise<string> => {
    const systemInstruction = `You are a Storyteller and Archivist AI for a text-based RPG. The player's journey has ended. Your task is to write a short, poetic, and thematic "epitaph" or final summary of their adventure, in Persian.

This epitaph should be 2-3 sentences long and capture the essence of their journey and their final moments.
- **DO NOT** just list stats.
- **DO** be evocative and narrative.
- **Reference** the player's name (${playerName || 'The Adventurer'}) and their final fate described in the last game state.
- **Capture the tone** of their adventure based on the provided history.
- **Output ONLY the Persian text** of the epitaph. Do not include any other text or formatting.

Example: 'نام او ${playerName} بود. او شجاعانه در جنگل‌های زمردین جنگید و اسرار بسیاری را فاش کرد، اما سرانجام در برابر نفرین باستانی شهر غرق‌شده تسلیم شد. داستان او به هشداری برای ماجراجویان آینده تبدیل گشت.'
`;
    
    const historyToSummarize = history.map(m => `${m.role}: ${m.text}`).join('\n');
    const finalStateText = `Final moment: ${finalState.story}`;
    const userContentText = `[FULL HISTORY]\n${historyToSummarize}\n\n[FINAL STATE]\n${finalStateText}`;

    const userContent: Content = { role: 'user', parts: [{ text: userContentText }] };

    try {
        const response = await withRetry<GenerateContentResponse>(async (aiInstance) => {
            return await aiInstance.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: [userContent],
                config: {
                    systemInstruction: systemInstruction,
                    temperature: 0.8,
                }
            });
        });
        return response.text.trim();
    } catch (error) {
        console.error("Failed to generate epitaph:", error);
        return "داستان شما در اینجا به پایان می‌رسد.";
    }
};
