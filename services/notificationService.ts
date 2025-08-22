import { Notification } from '../types';

type Listener = (notification: Notification) => void;

let listeners: Listener[] = [];

export const notificationService = {
  subscribe: (listener: Listener): (() => void) => {
    listeners.push(listener);
    return () => {
      listeners = listeners.filter(l => l !== listener);
    };
  },
  
  notify: (message: string, type: Notification['type'] = 'info') => {
    const notification: Notification = {
      id: String(Date.now()),
      message,
      type,
    };
    listeners.forEach(listener => listener(notification));
  },
};
