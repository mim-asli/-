import React from 'react';
import { CharacterProfile } from '../types';
import { UserIcon } from '../data/icons';

interface CharacterDisplayProps {
  character: CharacterProfile | null;
  playerName: string | null;
}

const CharacterDisplay: React.FC<CharacterDisplayProps> = ({ character, playerName }) => {
    return (
        <div className="flex flex-col items-center gap-6 p-4">
            <div className="relative w-48 h-48">
                <div className="absolute inset-0" style={{ clipPath: 'polygon(30% 0, 70% 0, 100% 30%, 100% 70%, 70% 100%, 30% 100%, 0 70%, 0 30%)' }}>
                     <div className="w-full h-full flex items-center justify-center bg-black/20">
                        <UserIcon className="w-24 h-24 text-slate-500" />
                    </div>
                </div>
                 <div 
                     className="absolute inset-0 border-2 border-cyan-400/50" 
                     style={{ clipPath: 'polygon(30% 0, 70% 0, 100% 30%, 100% 70%, 70% 100%, 30% 100%, 0 70%, 0 30%)',
                     boxShadow: '0 0 15px var(--color-accent-cyan), inset 0 0 15px var(--color-accent-cyan)'
                    }}
                ></div>
            </div>
            
            <div className="text-center">
                 <h3 className="font-display text-3xl text-[var(--color-accent-secondary)] text-glow-secondary">
                    {character ? character.name : (playerName || 'شخصیت اصلی')}
                </h3>
                 {character && <p className="text-[var(--color-text-secondary)]">شخصیت مقابل شما</p>}
                 {!character && <p className="text-[var(--color-text-secondary)]">شما</p>}
            </div>
        </div>
    );
};

export default CharacterDisplay;