import React, { useState, useEffect } from 'react';
import { notificationService } from '../services/notificationService';
import { Notification } from '../types';
import { QuestIcon, SkillsIcon, BookIcon, CompanionIcon, RecipeIcon, TraitIcon } from '../data/icons';

const CheckCircleIcon = ({ className }: { className?: string }) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>;
const InformationCircleIcon = ({ className }: { className?: string }) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z" /></svg>;

const ICONS: Record<Notification['type'], React.ReactNode> = {
    success: <CheckCircleIcon className="w-6 h-6 text-green-400" />,
    info: <InformationCircleIcon className="w-6 h-6 text-cyan-400" />,
    quest: <QuestIcon className="w-6 h-6 text-amber-400" />,
    skill: <SkillsIcon className="w-6 h-6 text-purple-400" />,
    trait: <TraitIcon className="w-6 h-6 text-yellow-300" />,
    codex: <BookIcon className="w-6 h-6 text-fuchsia-400" />,
    companion: <CompanionIcon className="w-6 h-6 text-rose-400" />,
    recipe: <RecipeIcon className="w-6 h-6 text-lime-400" />,
};

const Toast: React.FC<{ notification: Notification; onDismiss: (id: string) => void }> = ({ notification, onDismiss }) => {
    useEffect(() => {
        const timer = setTimeout(() => {
            onDismiss(notification.id);
        }, 5000); // 5 seconds
        return () => clearTimeout(timer);
    }, [notification.id, onDismiss]);

    return (
        <div className="toast-item animate-toast-in w-full max-w-sm p-4 glass-surface rounded-lg shadow-2xl flex items-start gap-3 border-t-2 border-[var(--color-border)]">
            <div className="flex-shrink-0 mt-0.5">{ICONS[notification.type]}</div>
            <p className="flex-grow text-sm font-semibold text-slate-200">{notification.message}</p>
            <button onClick={() => onDismiss(notification.id)} className="flex-shrink-0 p-1 rounded-full text-slate-500 hover:text-white hover:bg-white/10" aria-label="بستن اعلان">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
        </div>
    );
};


export const NotificationProvider: React.FC = () => {
    const [notifications, setNotifications] = useState<Notification[]>([]);

    useEffect(() => {
        const unsubscribe = notificationService.subscribe((notification) => {
            setNotifications(prev => [notification, ...prev.slice(0, 4)]); // Keep max 5 notifications
        });
        return () => unsubscribe();
    }, []);

    const dismiss = (id: string) => {
        setNotifications(prev => prev.filter(n => n.id !== id));
    };

    return (
        <div className="fixed top-24 right-4 z-50 w-full max-w-sm space-y-3 pointer-events-none" aria-live="polite" aria-atomic="true">
            {notifications.map(n => (
                 <div key={n.id} className="pointer-events-auto">
                    <Toast notification={n} onDismiss={dismiss} />
                </div>
            ))}
        </div>
    );
};