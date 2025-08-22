import React, { useState, useRef } from 'react';
import { useGameStore } from '../store/gameStore';
import { useFocusTrap } from '../hooks/useFocusTrap';
import * as geminiService from '../services/geminiService';
import { CloseIcon, DirectorIcon } from '../data/icons';

const DirectorsCommentaryModal: React.FC = () => {
    const { 
        isOpen, 
        isLoading, 
        result, 
        history, 
        genre,
        setModalOpen, 
        setLoading, 
        setResult 
    } = useGameStore(state => ({
        isOpen: state.isCommentaryModalOpen,
        isLoading: state.isCommentaryLoading,
        result: state.commentaryResult,
        history: state.history,
        genre: state.genre,
        setModalOpen: state.setCommentaryModalOpen,
        setLoading: state.setCommentaryLoading,
        setResult: state.setCommentaryResult,
    }));
    
    const [question, setQuestion] = useState('');
    const modalRef = useRef<HTMLDivElement>(null);
    useFocusTrap(modalRef, isOpen);

    const handleClose = () => {
        setModalOpen(false);
        setQuestion('');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!question.trim() || isLoading || !genre) return;

        setLoading(true);
        setResult(null);
        try {
            const commentary = await geminiService.getDirectorsCommentary(history, question, genre);
            setResult(commentary);
        } catch (error) {
            console.error(error);
            setResult("متاسفانه در پاسخ به سوال شما از کارگردان خطایی رخ داد.");
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 animate-fade-in" onClick={handleClose}>
            <div
                ref={modalRef}
                role="dialog"
                aria-modal="true"
                aria-labelledby="director-title"
                className="w-full max-w-2xl glass-surface rounded-2xl shadow-2xl flex flex-col max-h-[90vh] interactive-frame"
                onClick={e => e.stopPropagation()}
            >
                <header className="p-4 flex items-center justify-between bg-black/20 border-b-2 border-[var(--color-border)]">
                    <div className="flex items-center gap-3">
                        <DirectorIcon className="w-8 h-8 text-sky-400" />
                        <h1 id="director-title" className="text-2xl font-display text-sky-400">گفتگو با کارگردان</h1>
                    </div>
                    <button onClick={handleClose} className="p-2 rounded-full text-slate-400 hover:text-white hover:bg-white/10" aria-label="بستن">
                        <CloseIcon className="w-6 h-6" />
                    </button>
                </header>

                <div className="p-6 flex-grow overflow-y-auto space-y-4">
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label htmlFor="director-question" className="block text-sm font-bold text-slate-300 mb-2">
                                سوال خود را در مورد دنیا، شخصیت‌ها یا داستان بپرسید:
                            </label>
                            <textarea
                                id="director-question"
                                value={question}
                                onChange={e => setQuestion(e.target.value)}
                                rows={4}
                                className="w-full p-2 bg-slate-900/70 rounded-md border-2 border-[var(--color-border)] focus:border-[var(--color-border-focus)] focus:ring-0 transition"
                                placeholder="مثال: تاریخچه شهر فراموش شده چه بوده است؟"
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={isLoading || !question.trim()}
                            className="font-display w-full px-8 py-3 bg-sky-600 text-white font-bold text-xl rounded-lg hover:enabled:bg-sky-500 transition-all disabled:bg-slate-600 disabled:cursor-not-allowed"
                        >
                            {isLoading ? 'در حال فکر کردن...' : 'پرسیدن'}
                        </button>
                    </form>

                    {isLoading && (
                        <div className="flex justify-center items-center p-8">
                            <div className="w-8 h-8 border-4 border-dashed rounded-full animate-spin border-sky-400"></div>
                        </div>
                    )}

                    {result && !isLoading && (
                        <div className="p-4 glass-surface rounded-lg border-l-4 border-sky-500 animate-fade-in">
                            <h3 className="font-bold text-lg text-sky-300 mb-2">پاسخ کارگردان:</h3>
                            <p className="text-base text-slate-200 whitespace-pre-wrap">{result}</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default DirectorsCommentaryModal;
