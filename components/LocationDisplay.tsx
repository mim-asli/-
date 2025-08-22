import React from 'react';
import { LocationProfile } from '../types';
import { GlobeAltIcon } from '../data/icons';


interface LocationDisplayProps {
  location: LocationProfile | null;
}

const LocationDisplay: React.FC<LocationDisplayProps> = ({ location }) => {
    return (
        <div className="text-center">
            <h4 className="font-display text-2xl text-[var(--color-accent-secondary)] mb-3 text-glow-secondary">
                {location?.name || 'مکان نامشخص'}
            </h4>
            <div className="p-1 rounded-lg border border-cyan-400/20" style={{boxShadow: '0 0 15px var(--color-accent-cyan), inset 0 0 15px var(--color-accent-cyan)'}}>
                <div className="w-full aspect-video flex flex-col items-center justify-center gap-4 text-slate-500 text-center p-8 rounded-lg bg-black/20">
                    <GlobeAltIcon className="w-16 h-16 text-slate-500" />
                </div>
            </div>
        </div>
      );
};

export default LocationDisplay;