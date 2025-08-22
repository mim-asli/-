import React from 'react';
import { Companion } from '../types';
import { UserGroupIcon } from '../data/icons';
  
interface CompanionDisplayProps {
  companion: Companion | null;
}

const CompanionDisplay: React.FC<CompanionDisplayProps> = ({ companion }) => {
    if (!companion) {
        return (
            <div className="text-center p-4">
                 <h3 className="font-display text-2xl text-amber-300">بدون همراه</h3>
                 <p className="text-slate-400 mt-2">شما در این ماجراجویی تنها هستید.</p>
            </div>
        )
    }

    return (
        <div className="flex flex-col items-center gap-6 p-4">
            <div className="relative w-48 h-48">
                <div className="absolute inset-0" style={{ clipPath: 'polygon(30% 0, 70% 0, 100% 30%, 100% 70%, 70% 100%, 30% 100%, 0 70%, 0 30%)' }}>
                     <div className="w-full h-full flex items-center justify-center bg-black/20">
                        <UserGroupIcon className="w-24 h-24 text-slate-500" />
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
                 <h3 className="font-display text-3xl text-amber-300" style={{textShadow: "0 0 10px var(--color-accent-amber)"}}>
                    {companion.name}
                </h3>
                 <p className="text-slate-400">{companion.archetype}</p>
            </div>
        </div>
    );
};

export default CompanionDisplay;