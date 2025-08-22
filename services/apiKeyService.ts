import { ApiKey } from '../types';

const API_KEYS_STORAGE_KEY = 'gemini-rpg-api-keys';

export const getApiKeys = (): ApiKey[] => {
    try {
        const storedKeys = localStorage.getItem(API_KEYS_STORAGE_KEY);
        return storedKeys ? JSON.parse(storedKeys) : [];
    } catch (error) {
        console.error("Failed to parse API keys from localStorage", error);
        return [];
    }
};

export const saveApiKeys = (keys: ApiKey[]): void => {
    try {
        localStorage.setItem(API_KEYS_STORAGE_KEY, JSON.stringify(keys));
    } catch (error) {
        console.error("Failed to save API keys to localStorage", error);
    }
};

export const getActiveApiKeys = (): ApiKey[] => {
    return getApiKeys().filter(k => k.isActive);
};
