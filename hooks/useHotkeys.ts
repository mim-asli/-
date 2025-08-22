import { useEffect, useCallback } from 'react';

type HotkeyMap = {
    [key: string]: (event: KeyboardEvent) => void;
};

// Using any[] for deps to allow for flexible dependency arrays.
// This is a common pattern in generic hooks.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function useHotkeys(hotkeyMap: HotkeyMap, deps: any[] = []) {
    const handleKeyDown = useCallback((event: KeyboardEvent) => {
        const target = event.target as HTMLElement;
        
        // Ignore hotkeys if the user is typing in an input field, textarea, or select.
        if (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) {
            return;
        }

        const handler = hotkeyMap[event.key.toLowerCase()];
        if (handler) {
            event.preventDefault();
            handler(event);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [hotkeyMap, ...deps]);

    useEffect(() => {
        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [handleKeyDown]);
}
