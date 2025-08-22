import { HuggingFaceConfig, GameState, ChatMessage } from '../types';

const HUGGINGFACE_CONFIG_KEY = 'gemini-rpg-huggingface-config';

const defaultHfConfig: HuggingFaceConfig = { 
    apiKey: '', 
    model: 'mistralai/Mistral-7B-Instruct-v0.2', 
    enabled: false, 
    prioritize: false 
};

export const getHuggingFaceConfig = (): HuggingFaceConfig => {
    try {
        const stored = localStorage.getItem(HUGGINGFACE_CONFIG_KEY);
        if (stored) {
            const parsed = JSON.parse(stored);
            return { ...defaultHfConfig, ...parsed };
        }
    } catch (error) {
        console.error("Failed to parse Hugging Face config from localStorage", error);
    }
    return { ...defaultHfConfig };
};

export const saveHuggingFaceConfig = (config: HuggingFaceConfig): void => {
    try {
        localStorage.setItem(HUGGINGFACE_CONFIG_KEY, JSON.stringify(config));
    } catch (error) {
        console.error("Failed to save Hugging Face config to localStorage", error);
    }
};

// This function formats the prompt in a generic way, but it's optimized for instruction-tuned models like Mistral.
const formatPromptForHuggingFace = (systemInstruction: string, history: ChatMessage[]): string => {
    // Combine system instruction and history into a single string.
    // Hugging Face models often don't have a dedicated 'system' role like OpenAI/Gemini.
    
    // We'll build the prompt by alternating user/assistant messages.
    const historyText = history
        .map(msg => {
            if (msg.role === 'user') {
                return `[INST] ${msg.text} [/INST]`;
            } else if (msg.role === 'model') {
                // The model's response should be the raw JSON, not wrapped in instructions.
                return msg.text;
            }
            return ''; // Ignore hint/error messages
        })
        .join('\n');

    // The final prompt includes the system instruction, the history, and a prompt for the next JSON output.
    return `${systemInstruction}\n\n${historyText}\n`;
};


export const callHuggingFaceApi = async (systemInstruction: string, history: ChatMessage[]): Promise<GameState> => {
    const config = getHuggingFaceConfig();
    if (!config.enabled || !config.apiKey || !config.model) {
        throw new Error("Hugging Face API is not enabled or configured.");
    }

    const formattedPrompt = formatPromptForHuggingFace(systemInstruction, history);

    const response = await fetch(`https://api-inference.huggingface.co/models/${config.model}`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${config.apiKey}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            inputs: formattedPrompt,
            parameters: {
                return_full_text: false, // We only want the newly generated text
                max_new_tokens: 4096,   // A reasonable limit for a complex JSON object
                temperature: 0.8,
                top_p: 0.95,
            },
            options: {
                // Important for preventing the model from stopping prematurely
                // when it generates the JSON structure.
                wait_for_model: true, 
            }
        })
    });
    
    if (!response.ok) {
        const errorBody = await response.text();
        console.error("Hugging Face API Error Body:", errorBody);
        throw new Error(`Hugging Face API responded with ${response.status}: ${errorBody}`);
    }

    const data = await response.json();
    
    // The response is typically an array with one element
    if (!Array.isArray(data) || !data[0] || !data[0].generated_text) {
        console.error("Unexpected Hugging Face API response format:", data);
        throw new Error("Unexpected response format from Hugging Face API.");
    }

    const generatedText = data[0].generated_text;
    
    // The model should return a clean JSON string.
    try {
        // Find the start and end of the JSON object, as the model might add extra text or newlines.
        const jsonStart = generatedText.indexOf('{');
        const jsonEnd = generatedText.lastIndexOf('}');
        if (jsonStart === -1 || jsonEnd === -1) {
            throw new Error("No JSON object found in response.");
        }
        const jsonString = generatedText.substring(jsonStart, jsonEnd + 1);
        return JSON.parse(jsonString) as GameState;
    } catch (e) {
        console.error("Failed to parse JSON from Hugging Face response:", generatedText);
        throw new Error("Hugging Face API returned a response that could not be parsed as valid game state JSON.");
    }
};