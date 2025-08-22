import React, { useState, useRef, useEffect } from 'react';
import { useGameStore, handlePlayerInput, getHint, searchArea } from '../store/gameStore';
import { ttsService } from '../services/ttsService';
import { RestIcon, SearchIcon, WhatIfIcon, DirectorIcon } from '../data/icons';

// Type definitions for the Web Speech API
interface SpeechRecognition {
    continuous: boolean;
    interimResults: boolean;
    lang: string;
    onstart: () => void;
    onend: () => void;
    onerror: (event: any) => void;
    onresult: (event: any) => void;
    start: () => void;
    stop: () => void;
}
declare global {
  interface Window {
    SpeechRecognition: { new(): SpeechRecognition };
    webkitSpeechRecognition: { new(): SpeechRecognition };
  }
}
const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
const isSpeechRecognitionSupported = !!SpeechRecognitionAPI;


const MicIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className} aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 0 0 6-6v-1.5m-6 7.5a6 6 0 0 1-6-6v-1.5m12 7.5v-1.5a6 6 0 0 0-6-6v-1.5a6 6 0 0 0-6 6v1.5m6 7.5a6 6 0 0 0 6-6" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 12.75a3 3 0 0 0 3-3v-1.5a3 3 0 0 0-6 0v1.5a3 3 0 0 0 3 3Z" />
    </svg>
);

const SendIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M3.478 2.404a.75.75 0 0 0-.926.941l2.432 7.905H13.5a.75.75 0 0 1 0 1.5H4.984l-2.432 7.905a.75.75 0 0 0 .926.94 60.519 60.519 0 0 0 18.445-8.986.75.75 0 0 0 0-1.218A60.517 60.517 0 0 0 3.478 2.404Z" />
    </svg>
);

const LightbulbIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className} aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 0 0 1.5-.189m-1.5.189a6.01 6.01 0 0 1-1.5-.189m3.75 7.478a12.06 12.06 0 0 1-4.5 0m3.75 2.311a7.5 7.5 0 0 1-7.5 0c-1.255 0-2.443.29-3.5.832a7.5 7.5 0 0 1-7.5 0c-1.057.542-2.245.832-3.5.832a7.5 7.5 0 0 1-7.5 0c-1.255 0-2.443.29-3.5.832a7.5 7.5 0 0 1-7.5 0" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a.75.75 0 0 1 .75.75v.008c0 .414-.336.75-.75.75h-.008a.75.75 0 0 1-.75-.75v-.008c0 .414.336.75.75.75h.008Z" />
    </svg>
);
  
const Controls: React.FC = () => {
    const { isLoading, isHintLoading, setWhatIfModalOpen, setCommentaryModalOpen } = useGameStore(state => ({ 
        isLoading: state.isLoading, 
        isHintLoading: state.isHintLoading,
        setWhatIfModalOpen: state.setWhatIfModalOpen,
        setCommentaryModalOpen: state.setCommentaryModalOpen
    }));
    
    const [inputText, setInputText] = useState('');
    const [isListening, setIsListening] = useState(false);
    const [micPermissionDenied, setMicPermissionDenied] = useState(false);
    const recognitionRef = useRef<SpeechRecognition | null>(null);
    
    useEffect(() => {
        if (!isSpeechRecognitionSupported) return;
        
        const recognition = new SpeechRecognitionAPI();
        recognition.continuous = false;
        recognition.lang = 'fa-IR';
        recognition.interimResults = false;
        
        recognition.onstart = () => {
            setIsListening(true);
            setMicPermissionDenied(false); // Assume it worked if it started
        };
        recognition.onend = () => setIsListening(false);
        recognition.onerror = (event) => {
            console.warn("Speech recognition error:", event.error);
            if (event.error === 'not-allowed') {
                setMicPermissionDenied(true);
            }
        };
        
        recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript.trim();
            if (transcript) {
                 handlePlayerInput(transcript);
            }
        };
        
        recognitionRef.current = recognition;
    }, []);

    const isActionDisabled = isLoading || isHintLoading;
    const isMicDisabled = isActionDisabled || !isSpeechRecognitionSupported;
    
    const handleFormSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!inputText.trim() || isActionDisabled) return;
        ttsService.cancel();
        handlePlayerInput(inputText);
        setInputText('');
    };

    const handleListen = () => {
        if (isListening || isActionDisabled) return;
        ttsService.cancel();
        recognitionRef.current?.start();
    };
    
    const placeholderText = isLoading 
      ? "در حال پردازش..." 
      : isListening
      ? "در حال شنیدن..."
      : micPermissionDenied
      ? "دسترسی به میکروفون رد شد"
      : "فرمان خود را اینجا وارد کنید...";

    return (
    <div className="max-w-4xl mx-auto">
        <form 
          className="flex items-center gap-1 p-1.5 glass-surface shadow-2xl shadow-black/50"
          style={{ clipPath: 'polygon(15px 0, calc(100% - 15px) 0, 100% 50%, calc(100% - 15px) 100%, 15px 100%, 0 50%)'}}
          onSubmit={handleFormSubmit}
        >
          {/* Announcer for screen readers */}
          <div aria-live="polite" aria-atomic="true" className="sr-only">
              {isListening && "در حال شنیدن"}
              {isLoading && "در حال پردازش درخواست"}
          </div>

          <button
            type="button"
            onClick={() => setWhatIfModalOpen(true)}
            disabled={isActionDisabled}
            className="flex-shrink-0 w-12 h-12 flex items-center justify-center
                      text-fuchsia-400 transition-all duration-300
                      hover:enabled:bg-fuchsia-500/10 
                      focus-visible:ring-2 focus-visible:ring-fuchsia-400/50 rounded-full
                      disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="سناریوی 'چه میشد اگر...؟'"
          >
            <WhatIfIcon className="w-7 h-7" />
          </button>
          
          <button
            type="button"
            onClick={() => setCommentaryModalOpen(true)}
            disabled={isActionDisabled}
            className="flex-shrink-0 w-12 h-12 flex items-center justify-center
                      text-sky-400 transition-all duration-300
                      hover:enabled:bg-sky-500/10 
                      focus-visible:ring-2 focus-visible:ring-sky-400/50 rounded-full
                      disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="گفتگو با کارگردان"
          >
            <DirectorIcon className="w-7 h-7" />
          </button>

          <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={placeholderText}
              disabled={isActionDisabled}
              aria-label="ورودی فرمان بازیکن"
              className="w-full h-12 bg-transparent text-lg text-[var(--color-text-primary)] focus:ring-0
                          border-x-2 border-[var(--color-border)] focus:outline-none placeholder:text-[var(--color-text-tertiary)]
                          disabled:opacity-50 px-4"
          />

          <button
            type="button"
            onClick={handleListen}
            disabled={isMicDisabled}
            className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center
                      text-[var(--color-text-secondary)] transition-all duration-300
                      hover:enabled:bg-rose-500/10
                      focus-visible:ring-2 focus-visible:ring-rose-400/50
                      disabled:opacity-50 disabled:cursor-not-allowed
                      ${isListening ? 'text-[var(--color-accent-rose)]' : ''}`}
            aria-label={isListening ? "در حال گوش دادن..." : micPermissionDenied ? "دسترسی به میکروفون رد شده، برای تلاش مجدد کلیک کنید" : "فعال کردن میکروفون"}
          >
            {isListening ? (
               <div className="w-6 h-6 rounded-full bg-rose-500 shadow-[0_0_15px] shadow-rose-500 animate-pulse" aria-hidden="true"></div>
            ) : (
               <MicIcon className="w-6 h-6" />
            )}
          </button>
          
          <button
              type="submit"
              disabled={isActionDisabled || !inputText.trim()}
              className="flex-shrink-0 w-14 h-14 flex items-center justify-center
                        bg-[var(--color-accent-cyan)] text-slate-900 transition-all duration-300
                        hover:enabled:scale-105 focus-visible:ring-2 focus-visible:ring-cyan-400/50
                        disabled:bg-[var(--color-text-tertiary)] disabled:text-[var(--color-bg-deep)] disabled:scale-100 disabled:cursor-not-allowed"
              aria-label="ارسال فرمان"
               style={{ clipPath: 'polygon(10px 0, calc(100% - 10px) 0, 100% 50%, calc(100% - 10px) 100%, 10px 100%, 0 50%)'}}
          >
            <SendIcon className="w-6 h-6" />
          </button>
        </form>
        {micPermissionDenied && (
            <div role="alert" className="mt-2 text-center max-w-lg mx-auto p-3 bg-rose-900/50 border border-rose-500/50 text-rose-200 rounded-lg flex items-center justify-center gap-3 text-sm">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 flex-shrink-0">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
                </svg>
                <span>دسترسی به میکروفون رد شد. برای استفاده از این قابلیت، دسترسی را در تنظیمات مرورگر خود فعال کرده و دوباره روی دکمه میکروفون کلیک کنید.</span>
            </div>
        )}
        {!isSpeechRecognitionSupported && !micPermissionDenied && <p className="text-xs text-center text-slate-500 mt-2">تشخیص گفتار در این مرورگر پشتیبانی نمی‌شود.</p>}
      </div>
  );
};

export default Controls;