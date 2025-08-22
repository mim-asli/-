import { LocalAiConfig, GameState, ChatMessage } from '../types';

const LOCAL_AI_CONFIG_KEY = 'gemini-rpg-local-ai-config';

const defaultConfig: LocalAiConfig = { 
    endpoint: 'http://127.0.0.1:11434/v1/chat/completions', 
    enabled: false, 
    prioritize: false 
};


export const getLocalAiConfig = (): LocalAiConfig => {
    try {
        const storedConfig = localStorage.getItem(LOCAL_AI_CONFIG_KEY);
        if (storedConfig) {
            const parsed = JSON.parse(storedConfig);
            // Merge stored config with defaults to ensure all keys are present
            return { ...defaultConfig, ...parsed };
        }
    } catch (error) {
        console.error("Failed to parse Local AI config from localStorage", error);
    }
    // Return a copy of the default config
    return { ...defaultConfig };
};

export const saveLocalAiConfig = (config: LocalAiConfig): void => {
    try {
        localStorage.setItem(LOCAL_AI_CONFIG_KEY, JSON.stringify(config));
    } catch (error) {
        console.error("Failed to save Local AI config to localStorage", error);
    }
};

export const callLocalAiApi = async (systemInstruction: string, history: ChatMessage[]): Promise<GameState> => {
    const localConfig = getLocalAiConfig();
    if (!localConfig.enabled) {
        throw new Error("Local AI is not enabled.");
    }

    const messages = [
        { role: 'system', content: systemInstruction },
        ...history.map(msg => ({ role: msg.role === 'model' ? 'assistant' : 'user', content: msg.text }))
    ];
    
    if (history.length === 0) {
        messages.push({ role: 'user', content: 'بازی را شروع کن.' });
    }

    const response = await fetch(localConfig.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            // model name can be anything for local, often ignored by the server
            model: 'local-model', 
            messages: messages,
            temperature: 0.7,
            stream: false,
            // Request JSON output if the local model supports it
            response_format: { type: "json_object" } 
        })
    });

    if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`Local AI server responded with ${response.status}: ${errorBody}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    
    // The response from a local AI should be a clean JSON string.
    // We clean it just in case it's wrapped in markdown.
    return JSON.parse(content.replace(/```json\n?|\n?```/g, '')) as GameState;
};