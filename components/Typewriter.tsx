import React, { useState, useEffect, useRef } from 'react';

interface TypewriterProps {
  text: string;
  speed?: number;
  className?: string;
  onComplete?: () => void;
  onUpdate?: () => void;
}

const Typewriter: React.FC<TypewriterProps> = ({ text, speed = 30, className, onComplete, onUpdate }) => {
  const [displayedText, setDisplayedText] = useState('');
  const timerRef = useRef<number | null>(null);
  const isFinishedRef = useRef(false);
  const [isTrulyFinished, setIsTrulyFinished] = useState(false);

  useEffect(() => {
    // Cleanup previous timer if text changes
    if (timerRef.current) {
        clearInterval(timerRef.current);
    }
    
    isFinishedRef.current = false;
    setIsTrulyFinished(false);
    setDisplayedText('');

    if (!text) {
        onComplete?.();
        setIsTrulyFinished(true);
        return;
    };

    let i = 0;
    timerRef.current = window.setInterval(() => {
      i += 1;
      setDisplayedText(text.slice(0, i));
      onUpdate?.();
      
      if (i >= text.length) {
        if (timerRef.current) clearInterval(timerRef.current);
        isFinishedRef.current = true;
        onComplete?.();
        // The cursor will blink for a bit before disappearing.
        setTimeout(() => setIsTrulyFinished(true), 800);
      }
    }, speed);

    // Cleanup on unmount
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [text, speed, onComplete, onUpdate]);

  const skipAnimation = () => {
    if (!isFinishedRef.current) {
      if (timerRef.current) clearInterval(timerRef.current);
      isFinishedRef.current = true;
      setDisplayedText(text);
      onComplete?.();
      setTimeout(() => setIsTrulyFinished(true), 800);
    }
  };

  return (
    <span
      onClick={skipAnimation}
      className={className}
      title={isFinishedRef.current ? '' : 'برای نمایش کامل متن کلیک کنید'}
      role="button"
      tabIndex={isFinishedRef.current ? -1 : 0}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') skipAnimation(); }}
      style={{ cursor: isFinishedRef.current ? 'auto' : 'pointer' }}
    >
      {displayedText}
      {!isTrulyFinished && (
        <span
          aria-hidden="true"
          className="inline-block w-2.5 h-6 bg-[var(--color-text-primary)] ml-1 align-text-bottom opacity-75 animate-pulse"
          style={{ animation: 'pulse 1s cubic-bezier(0.4, 0, 0.6, 1) infinite' }}
        ></span>
      )}
    </span>
  );
};

export default Typewriter;
