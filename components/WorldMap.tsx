import React from 'react';
import { DiscoveredLocation } from '../types';

interface WorldMapProps {
  locations: DiscoveredLocation[];
  currentLocationName: string | null;
  onLocationClick?: (location: DiscoveredLocation) => void;
}

const LocationPinIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={className} aria-hidden="true">
      <path fillRule="evenodd" d="M9.69 18.933l.003.001C9.89 19.02 10 19 10 19s.11.02.308-.066l.002-.001.006-.003.018-.008a5.741 5.741 0 0 0 .281-.14c.186-.1.4-.223.654-.369.623-.359 1.445-.966 2.274-1.765C15.302 14.988 17 12.493 17 9A7 7 0 1 0 3 9c0 3.492 1.698 5.988 3.355 7.584a13.731 13.731 0 0 0 2.273 1.765 11.842 11.842 0 0 0 .935.509Z" clipRule="evenodd" />
      <path d="M10 11.25a2.25 2.25 0 1 0 0-4.5 2.25 2.25 0 0 0 0 4.5Z" />
    </svg>
);


const WorldMap: React.FC<WorldMapProps> = ({ locations, currentLocationName, onLocationClick }) => {
  if (!locations || locations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center text-center text-slate-500 rounded-lg p-8 h-full border-2 border-dashed border-[var(--color-border)]">
        <h3 className="font-medium text-lg mt-2">نقشه هنوز کشف نشده است</h3>
        <p className="text-sm">با کاوش در جهان، نقشه شما در اینجا ترسیم خواهد شد.</p>
      </div>
    );
  }

  return (
    <div className="p-1 glass-surface rounded-lg">
        <div 
            className="relative w-full aspect-square rounded-md overflow-hidden"
            role="img"
            aria-label="نقشه جهان با مکان‌های کشف شده"
        >
            {/* Tactical Grid Background */}
            <div className="absolute inset-0 bg-slate-900/50">
                 <div className="absolute inset-0 bg-[repeating-linear-gradient(var(--color-border)_0_1px,transparent_1px_40px),repeating-linear-gradient(90deg,var(--color-border)_0_1px,transparent_1px_40px)]"></div>
            </div>

            {locations.map((loc) => {
                const isCurrent = loc.name === currentLocationName;
                const isClickable = onLocationClick && !isCurrent;
                
                const PinWrapper = isClickable ? 'button' : 'div';

                return (
                    <PinWrapper
                        key={loc.name}
                        className="absolute -translate-x-1/2 -translate-y-1/2 group animate-fade-in"
                        style={{ left: `${loc.x}%`, top: `${loc.y}%` }}
                        aria-label={isCurrent ? `مکان فعلی: ${loc.name}` : isClickable ? `سفر به ${loc.name}` : loc.name}
                        aria-current={isCurrent ? "true" : "false"}
                        onClick={isClickable ? () => onLocationClick(loc) : undefined}
                    >
                        <LocationPinIcon className={`w-7 h-7 drop-shadow-lg transition-all duration-300 ${isCurrent ? 'text-[var(--color-accent-secondary)] scale-125' : 'text-[var(--color-text-secondary)] group-hover:text-[var(--color-accent-primary)] group-hover:scale-110'}`} />
                        {isCurrent && (
                            <div className="absolute inset-0 rounded-full bg-amber-400/50 animate-ping" aria-hidden="true"></div>
                        )}
                        <span className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-max px-2 py-1 text-xs font-bold text-white bg-black/70 rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" aria-hidden="true">
                            {loc.name}
                        </span>
                    </PinWrapper>
                );
            })}
        </div>
    </div>
  );
};

export default WorldMap;