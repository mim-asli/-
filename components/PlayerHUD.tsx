import React, { useState, useEffect, useRef } from 'react';
import { useGameStore } from '../store/gameStore';
import { 
    SpeakerWaveIcon, HealthIcon, SanityIcon, ThirstIcon, SatietyIcon, 
    AetherIcon, ManaIcon, GritIcon, CoinIcon 
} from '../data/icons';

const SystemHubIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9M20.25 20.25h-4.5m4.5 0v-4.5m0-4.5L15 15" />
    </svg>
);


const resourceIcons: Record<string, React.ReactNode> = {
    'اتر': <AetherIcon className="w-7 h-7" />,
    'مانا': <ManaIcon className="w-7 h-7" />,
    'شانس': <GritIcon className="w-7 h-7" />,
};

const conditionDescriptions: Record<string, string> = {
    // Health
    'سالم': "سلامتی شما در وضعیت خوبی قرار دارد.",
    'زخمی': "شما جراحات سطحی برداشته‌اید. استراحت یا استفاده از آیتم‌های درمانی توصیه می‌شود.",
    'به شدت زخمی': "جراحات شما شدید است. برای جلوگیری از مرگ، فوراً به خود رسیدگی کنید.",
    // Sanity
    'آرام': "ذهن شما صاف و متمرکز است.",
    'مضطرب': "دنیای اطراف شما کمی ناپایدار به نظر می‌رسد. تمرکز کردن سخت‌تر شده است.",
    'وحشت‌زده': "مرز بین واقعیت و توهم در حال محو شدن است. ممکن است اتفاقات عجیبی را تجربه کنید.",
    // Satiety
    'سیر': "شما گرسنه نیستید و انرژی کافی دارید.",
    'گرسنه': "گرسنگی تمرکز شما را مختل کرده است. باید چیزی برای خوردن پیدا کنید.",
    'قحطی‌زده': "از فرط گرسنگی در حال از دست دادن سلامتی خود هستید. وضعیت بحرانی است.",
    // Thirst
    'سیراب': "شما تشنه نیستید.",
    'تشنه': "دهان شما خشک شده است. پیدا کردن آب اولویت دارد.",
    'خشکیده': "بدن شما به شدت کم‌آب شده و سلامتی‌تان در خطر است.",
    // Generic Special Resource
    'پایدار': "منبع ویژه شما در وضعیت پایدار و آماده استفاده است.",
    'نوسانی': "منبع ویژه شما ناپایدار است. استفاده از آن ممکن است عواقب پیش‌بینی‌نشده‌ای داشته باشد.",
    'تهی': "منبع ویژه شما تمام شده و باید دوباره شارژ شود."
};

const useAnimatedNumber = (targetValue: number) => {
    const [currentValue, setCurrentValue] = useState(targetValue);
    const valueRef = useRef(targetValue);
    const animationFrameRef = useRef<number | null>(null);

    useEffect(() => {
        const startValue = valueRef.current;
        const duration = 800; // ms
        let startTime: number | null = null;

        const animate = (timestamp: number) => {
            if (!startTime) startTime = timestamp;
            const progress = timestamp - startTime;
            const percentage = Math.min(progress / duration, 1);
            
            const easedPercentage = 1 - Math.pow(1 - percentage, 3); // Ease-out cubic

            const newValue = Math.round(startValue + (targetValue - startValue) * easedPercentage);
            setCurrentValue(newValue);

            if (progress < duration) {
                animationFrameRef.current = requestAnimationFrame(animate);
            } else {
                valueRef.current = targetValue;
            }
        };

        animationFrameRef.current = requestAnimationFrame(animate);

        return () => {
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
            valueRef.current = targetValue;
            setCurrentValue(targetValue);
        };
    }, [targetValue]);

    return currentValue;
};

const RadialStatus = ({ value, max, color, icon, label, condition }: { value: number, max: number, color: string, icon: React.ReactNode, label: string, condition?: string }) => {
    const percentage = max > 0 ? Math.max(0, Math.min(100, (value / max) * 100)) : 0;
    const circumference = 2 * Math.PI * 20; // 20 is the radius (cx, cy are 24, r is 20)
    const strokeDashoffset = circumference - (percentage / 100) * circumference;
    const description = condition ? conditionDescriptions[condition] : null;
    const animatedValue = useAnimatedNumber(value);

    return (
        <div className="relative flex flex-col items-center w-16 sm:w-20 group" aria-label={`${label}: ${value} از ${max}. وضعیت: ${condition || 'عادی'}`}>
            <div className="relative w-16 h-16 sm:w-20 sm:h-20">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 48 48" aria-hidden="true">
                    {/* Background circle */}
                    <circle
                        cx="24" cy="24" r="20"
                        fill="transparent"
                        stroke="rgba(255,255,255,0.1)"
                        strokeWidth="4"
                    />
                    {/* Foreground circle */}
                    <circle
                        cx="24" cy="24" r="20"
                        fill="transparent"
                        stroke={color}
                        strokeWidth="4"
                        strokeDasharray={circumference}
                        strokeDashoffset={strokeDashoffset}
                        strokeLinecap="round"
                        className="transition-all duration-500"
                        style={{filter: `drop-shadow(0 0 5px ${color})`}}
                    />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center text-white" aria-hidden="true">
                    <div className="h-7" style={{ color }}>{icon}</div>
                    <span className="font-mono text-base font-bold drop-shadow-md -mt-1">{animatedValue}</span>
                </div>
                <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 text-center text-xs font-bold text-[var(--color-text-secondary)] opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap bg-black/50 px-1 rounded" aria-hidden="true">
                    {label}
                </div>
            </div>
             {/* Tooltip for condition description */}
             {description && (
                <div 
                    className="absolute top-full mt-2 left-1/2 -translate-x-1/2 w-48 p-2 text-xs text-center text-[var(--color-text-primary)] bg-[var(--color-surface)] border border-[var(--color-border)] rounded-md shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-20"
                    role="tooltip"
                >
                   <p className="font-bold mb-1" style={{color}}>{condition}</p>
                   {description}
               </div>
           )}
        </div>
    );
};


const PlayerHUD = React.forwardRef<HTMLButtonElement>((_props, ref) => {
    const { playerStatus: status, worldState, setTtsControlsOpen, isTtsControlsOpen, ttsConfig } = useGameStore(state => ({
        playerStatus: state.playerStatus,
        worldState: state.worldState,
        isTtsControlsOpen: state.isTtsControlsOpen,
        setTtsControlsOpen: state.setTtsControlsOpen,
        ttsConfig: state.ttsConfig
    }));

    const animatedCurrency = useAnimatedNumber(status?.currency.amount ?? 0);

    if (!status) return null;
    
    const resourceName = status.specialResource.name;
    const resourceIcon = resourceIcons[resourceName] || <AetherIcon className="w-7 h-7" />;

    return (
        <>
            {/* Vitals in top-left */}
            <div className="fixed top-0 left-0 z-[101] hud-panel hud-panel-left animate-fade-in" style={{animationDelay: '300ms', animationFillMode: 'backwards'}}>
                <div className="flex items-start gap-2 p-2 pl-4">
                    <RadialStatus value={status.health.current} max={status.health.max} color="var(--color-accent-rose)" icon={<HealthIcon className="w-7 h-7" />} label="سلامتی" condition={status.healthCondition} />
                    <RadialStatus value={status.sanity.current} max={status.sanity.max} color="var(--color-accent-purple)" icon={<SanityIcon className="w-7 h-7" />} label="عقل" condition={status.sanityCondition} />
                    <RadialStatus value={status.thirst.current} max={status.thirst.max} color="var(--color-accent-blue)" icon={<ThirstIcon className="w-7 h-7" />} label="تشنگی" condition={status.thirstCondition} />
                    <RadialStatus value={status.satiety.current} max={status.satiety.max} color="var(--color-accent-amber)" icon={<SatietyIcon className="w-7 h-7" />} label="سیری" condition={status.satietyCondition} />
                    <RadialStatus value={status.specialResource.current} max={status.specialResource.max} color="var(--color-accent-cyan)" icon={resourceIcon} label={resourceName} condition={status.specialResource.condition} />
                </div>
            </div>

            {/* World State in top-right */}
            {worldState && (
                <div className="fixed top-0 right-0 z-[101] hud-panel hud-panel-right animate-fade-in" style={{animationDelay: '300ms', animationFillMode: 'backwards'}}>
                    <div className="flex items-center gap-4 p-2 pr-4">
                        {status.currency && (
                             <div className="flex items-center gap-3">
                                <CoinIcon className="w-7 h-7 text-[var(--color-accent-amber)]" style={{filter: `drop-shadow(0 0 4px var(--color-accent-amber))`}}/>
                                <div>
                                    <div className="font-display text-2xl text-[var(--color-text-primary)] leading-tight">{animatedCurrency}</div>
                                    <div className="text-sm text-[var(--color-text-secondary)] font-bold -mt-1">{status.currency.name}</div>
                                </div>
                            </div>
                        )}
                        <div className="text-center">
                            <div className="font-display text-2xl text-[var(--color-text-primary)] leading-tight">{worldState.time}</div>
                            <div className="text-sm text-[var(--color-text-secondary)] font-bold">{`روز ${worldState.day}`}</div>
                        </div>
                         <button
                            onClick={() => setTtsControlsOpen(!isTtsControlsOpen)}
                            className={`journal-toggle-btn w-14 h-14 rounded-full flex items-center justify-center ${ttsConfig.enabled ? '' : 'opacity-60'}`}
                            aria-label={isTtsControlsOpen ? "بستن تنظیمات گوینده" : "باز کردن تنظیمات گوینده"}
                            aria-expanded={isTtsControlsOpen}
                        >
                           <SpeakerWaveIcon className="w-7 h-7"/>
                           {!ttsConfig.enabled && <div className="absolute w-1 h-8 bg-rose-500 transform rotate-45"></div>}
                        </button>
                    </div>
                </div>
            )}
        </>
    );
});

PlayerHUD.displayName = "PlayerHUD";

export default PlayerHUD;