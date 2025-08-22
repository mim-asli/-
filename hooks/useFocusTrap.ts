import { useEffect, useRef, useCallback } from 'react';

const FOCUSABLE_SELECTORS = 'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function useFocusTrap(containerRef: React.RefObject<HTMLElement>, active: boolean) {
    const previousActiveElement = useRef<HTMLElement | null>(null);

    const handleKeyDown = useCallback((event: KeyboardEvent) => {
        if (event.key !== 'Tab' || !containerRef.current) return;

        const focusableElements = Array.from(containerRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTORS)).filter(el => el.offsetParent !== null);
        if (focusableElements.length === 0) return;

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];
        const currentFocusedIndex = focusableElements.indexOf(document.activeElement as HTMLElement);

        if (event.shiftKey) {
            // Shift + Tab
            if (document.activeElement === firstElement || currentFocusedIndex === -1) {
                event.preventDefault();
                lastElement.focus();
            }
        } else {
            // Tab
            if (document.activeElement === lastElement || currentFocusedIndex === -1) {
                event.preventDefault();
                firstElement.focus();
            }
        }
    }, [containerRef]);

    useEffect(() => {
        if (active) {
            previousActiveElement.current = document.activeElement as HTMLElement;
            
            // Defer focus slightly to ensure the element is focusable
            setTimeout(() => {
                const focusableElements = containerRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTORS);
                const firstFocusable = focusableElements?.[0];
                firstFocusable?.focus();
            }, 50);
            
            document.addEventListener('keydown', handleKeyDown);
        } else {
            document.removeEventListener('keydown', handleKeyDown);
            if (previousActiveElement.current) {
                previousActiveElement.current.focus();
                previousActiveElement.current = null;
            }
        }

        return () => {
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [active, containerRef, handleKeyDown]);
}
