import React, { useState, useEffect } from 'react';
import { ApiKey, LocalAiConfig, HuggingFaceConfig } from '../types';
import * as apiKeyService from '../services/apiKeyService';
import * as geminiService from '../services/geminiService';
import { useGameStore } from '../store/gameStore';
import * as localAiService from '../services/localAiService';
import * as huggingFaceService from '../services/huggingFaceService';
import AudioSettingsModal from '../components/AudioSettingsModal';
import { Theme } from '../store/slices/uiSlice';
import { SpinnerIcon, CheckCircleIcon, XCircleIcon, ExclamationTriangleIcon, CpuChipIcon } from '../data/icons';

const BackIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
    </svg>
);

const TrashIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
    </svg>
);

const KeyIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className} aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 0 1 3 3m3 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
    </svg>
);

const VolumeUpIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 0 1 0 12.728M16.463 8.288a5.25 5.25 0 0 1 0 7.424M6.75 8.25l4.72-4.72a.75.75 0 0 1 1.28.53v15.88a.75.75 0 0 1-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 0 1 2.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75Z" />
    </svg>
);

const ServerIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 17.25v-.228a4.5 4.5 0 0 0-.12-1.03l-2.268-9.64a3.375 3.375 0 0 0-3.285-2.602H7.923a3.375 3.375 0 0 0-3.285 2.602l-2.268 9.64a4.5 4.5 0 0 0-.12 1.03v.228m15.46 0a4.5 4.5 0 0 1-1.242 3.126l-3.314 3.314a2.25 2.25 0 0 1-1.59 2.25h-2.11a2.25 2.25 0 0 1-1.591-2.25l-3.314-3.314a4.5 4.5 0 0 1-1.241-3.126" />
    </svg>
);

const PaintBrushIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
    </svg>
);

type KeyStatus = 'valid' | 'invalid' | 'quota_exceeded' | 'network_error' | 'pending' | 'idle';

const maskApiKey = (key: string): string => {
    if (key.length < 8) return '****';
    return `${key.substring(0, 4)}...${key.substring(key.length - 4)}`;
};

const StatusIcon: React.FC<{ status: KeyStatus | undefined }> = ({ status }) => {
    if (!status || status === 'idle') return <div className="w-6 h-6"></div>;

    const STATUS_MAP = {
        pending: { Icon: SpinnerIcon, color: 'text-slate-400', label: 'در حال تست...' },
        valid: { Icon: CheckCircleIcon, color: 'text-green-400', label: 'معتبر' },
        invalid: { Icon: XCircleIcon, color: 'text-rose-400', label: 'نامعتبر یا منقضی شده' },
        quota_exceeded: { Icon: ExclamationTriangleIcon, color: 'text-amber-400', label: 'محدودیت سهمیه' },
        network_error: { Icon: XCircleIcon, color: 'text-rose-400', label: 'خطای شبکه' },
    };

    const currentStatus = STATUS_MAP[status];
    if (!currentStatus) return <div className="w-6 h-6"></div>;
    
    const { Icon, color, label } = currentStatus;

    return (
        <div className="relative group flex items-center justify-center">
            <Icon className={`w-6 h-6 ${color}`} />
            <div role="tooltip" className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-max px-2 py-1 text-xs font-bold text-white bg-black/80 rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                {label}
            </div>
        </div>
    );
};


const SettingsPage: React.FC = () => {
    const { setView, theme, setTheme } = useGameStore(state => ({
        setView: state.setView,
        theme: state.theme,
        setTheme: state.setTheme,
    }));
    const [keys, setKeys] = useState<ApiKey[]>([]);
    const [newKeyName, setNewKeyName] = useState('');
    const [newKeyValue, setNewKeyValue] = useState('');
    const [isAudioModalOpen, setAudioModalOpen] = useState(false);
    const [localAiConfig, setLocalAiConfig] = useState<LocalAiConfig>({ endpoint: '', enabled: false, prioritize: false });
    const [huggingFaceConfig, setHuggingFaceConfig] = useState<HuggingFaceConfig>({ apiKey: '', model: '', enabled: false, prioritize: false });
    const [keyStatuses, setKeyStatuses] = useState<Record<string, KeyStatus>>({});
    const [isTesting, setIsTesting] = useState(false);

    useEffect(() => {
        setKeys(apiKeyService.getApiKeys());
        setLocalAiConfig(localAiService.getLocalAiConfig());
        setHuggingFaceConfig(huggingFaceService.getHuggingFaceConfig());
    }, []);

    const handleAddKey = () => {
        if (!newKeyName.trim() || !newKeyValue.trim()) return;
        const newKey: ApiKey = {
            id: String(Date.now()),
            name: newKeyName,
            key: newKeyValue,
            isActive: true,
        };
        const updatedKeys = [...keys, newKey];
        setKeys(updatedKeys);
        apiKeyService.saveApiKeys(updatedKeys);
        setNewKeyName('');
        setNewKeyValue('');
    };

    const handleToggleKey = (id: string) => {
        const updatedKeys = keys.map(k => k.id === id ? { ...k, isActive: !k.isActive } : k);
        setKeys(updatedKeys);
        apiKeyService.saveApiKeys(updatedKeys);
    };

    const handleDeleteKey = (id: string) => {
        const updatedKeys = keys.filter(k => k.id !== id);
        setKeys(updatedKeys);
        apiKeyService.saveApiKeys(updatedKeys);
        setKeyStatuses(prev => {
            const newStatuses = {...prev};
            delete newStatuses[id];
            return newStatuses;
        })
    };

    const handleToggleAllKeys = () => {
        const areAnyActive = keys.some(k => k.isActive);
        const allToggled = keys.map(k => ({ ...k, isActive: !areAnyActive }));
        setKeys(allToggled);
        apiKeyService.saveApiKeys(allToggled);
    };

    const handleLocalAiConfigChange = (field: keyof LocalAiConfig, value: string | boolean) => {
        const newConfig = { ...localAiConfig, [field]: value };
        if (field === 'prioritize' && value === true && huggingFaceConfig.prioritize) {
            const newHfConfig = { ...huggingFaceConfig, prioritize: false };
            setHuggingFaceConfig(newHfConfig);
            huggingFaceService.saveHuggingFaceConfig(newHfConfig);
        }
        setLocalAiConfig(newConfig);
        localAiService.saveLocalAiConfig(newConfig);
    };

    const handleHuggingFaceConfigChange = (field: keyof HuggingFaceConfig, value: string | boolean) => {
        const newConfig = { ...huggingFaceConfig, [field]: value };
        if (field === 'prioritize' && value === true && localAiConfig.prioritize) {
            const newLocalConfig = { ...localAiConfig, prioritize: false };
            setLocalAiConfig(newLocalConfig);
            localAiService.saveLocalAiConfig(newLocalConfig);
        }
        setHuggingFaceConfig(newConfig);
        huggingFaceService.saveHuggingFaceConfig(newConfig);
    };

    const handleTestKeys = async () => {
        setIsTesting(true);
        const initialStatuses: Record<string, KeyStatus> = {};
        keys.forEach(k => initialStatuses[k.id] = 'pending');
        setKeyStatuses(initialStatuses);
    
        const promises = keys.map(async (key) => {
            const status = await geminiService.validateApiKey(key.key);
            return { id: key.id, status };
        });
    
        const results = await Promise.all(promises);
        
        setKeyStatuses(prev => {
            const newStatuses = { ...prev };
            results.forEach(result => {
                newStatuses[result.id] = result.status;
            });
            return newStatuses;
        });
    
        setIsTesting(false);
    };
    
    const themes: { value: Theme, label: string }[] = [
        { value: 'theme-dark', label: 'تاریک' },
        { value: 'theme-light', label: 'روشن' },
    ];

    return (
        <div className="h-screen w-full flex flex-col items-center justify-start p-4 overflow-y-auto">
            <header className="w-full max-w-4xl text-center relative mb-8">
                <button
                    onClick={() => setView('start')}
                    aria-label="بازگشت به صفحه اصلی"
                    className="absolute right-0 top-1/2 -translate-y-1/2 flex items-center justify-center p-3 glass-surface rounded-lg text-slate-300 hover:text-white hover:border-slate-500 transition-all"
                >
                    <BackIcon className="w-6 h-6"/>
                </button>
                <h1 className="text-5xl md:text-6xl font-display text-[var(--color-accent-primary)]" style={{textShadow: '0 0 20px var(--color-accent-primary)'}}>
                    تنظیمات
                </h1>
            </header>

            <div className="w-full max-w-4xl mx-auto space-y-8 animate-fade-in">

                {/* Theme Settings */}
                <div className="space-y-4">
                    <h3 className="font-display text-2xl text-amber-300 flex items-center gap-3">
                        <PaintBrushIcon className="w-6 h-6" />
                        <span>پوسته برنامه</span>
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                        {themes.map((t) => (
                            <button
                                key={t.value}
                                onClick={() => setTheme(t.value)}
                                className={`p-4 rounded-lg text-center font-bold transition-all border-2 ${
                                    theme === t.value
                                        ? 'bg-cyan-500/20 border-cyan-400 text-cyan-200'
                                        : 'bg-black/10 border-[var(--color-border)] text-slate-300 hover:border-slate-500'
                                }`}
                                aria-pressed={theme === t.value}
                            >
                                {t.label}
                            </button>
                        ))}
                    </div>
                </div>


                {/* API Keys */}
                <div className="space-y-4">
                     <h3 className="font-display text-2xl text-amber-300 flex items-center justify-between">
                        <span className="flex items-center gap-3">
                            <KeyIcon className="w-6 h-6" />
                            <span>کلیدهای Google Gemini API</span>
                        </span>
                        <div className="flex items-center gap-2">
                             <button
                                onClick={handleToggleAllKeys}
                                disabled={keys.length === 0}
                                className="text-sm font-bold px-4 py-2 bg-purple-600 text-white rounded-md hover:enabled:bg-purple-500 transition-colors disabled:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {keys.some(k => k.isActive) ? 'غیرفعال کردن همه' : 'فعال کردن همه'}
                            </button>
                            <button
                                onClick={handleTestKeys}
                                disabled={isTesting || keys.length === 0}
                                className="text-sm font-bold px-4 py-2 bg-sky-600 text-white rounded-md hover:enabled:bg-sky-500 transition-colors disabled:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isTesting ? (
                                    <span className="flex items-center gap-2">
                                        <SpinnerIcon className="w-4 h-4" />
                                        <span>در حال تست...</span>
                                    </span>
                                ) : (
                                    <span>تست کلیدها</span>
                                )}
                            </button>
                        </div>
                    </h3>
                    <div className="glass-surface p-4 rounded-lg space-y-3">
                        {keys.length > 0 ? (
                            keys.map(k => (
                                <div key={k.id} className="flex items-center justify-between gap-3 p-2 bg-black/20 rounded-md">
                                    <div className="flex items-center gap-3 flex-grow">
                                        <StatusIcon status={keyStatuses[k.id]} />
                                        <button
                                            role="switch"
                                            aria-checked={k.isActive}
                                            onClick={() => handleToggleKey(k.id)}
                                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${k.isActive ? 'bg-green-500' : 'bg-slate-600'}`}
                                        >
                                            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${k.isActive ? 'translate-x-6' : 'translate-x-1'}`} />
                                        </button>
                                        <div className="flex-grow">
                                            <p className="font-bold text-slate-200">{k.name}</p>
                                            <p className="text-xs font-mono text-slate-400">{maskApiKey(k.key)}</p>
                                        </div>
                                    </div>
                                    <button onClick={() => handleDeleteKey(k.id)} className="p-2 text-rose-400 hover:bg-rose-500/10 rounded-full" aria-label={`حذف کلید ${k.name}`}>
                                        <TrashIcon className="w-5 h-5"/>
                                    </button>
                                </div>
                            ))
                        ) : (
                            <p className="text-center text-slate-400 p-4">هنوز هیچ کلیدی اضافه نشده است.</p>
                        )}
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2">
                        <input type="text" value={newKeyName} onChange={e => setNewKeyName(e.target.value)} placeholder="نام کلید (مثال: کلید شخصی)" className="flex-grow p-2 bg-slate-900/70 rounded-md border-2 border-[var(--color-border)] focus:border-[var(--color-border-focus)] focus:ring-0 transition" />
                        <input type="password" value={newKeyValue} onChange={e => setNewKeyValue(e.target.value)} placeholder="مقدار کلید API" className="flex-grow p-2 bg-slate-900/70 rounded-md border-2 border-[var(--color-border)] focus:border-[var(--color-border-focus)] focus:ring-0 transition" />
                        <button onClick={handleAddKey} className="font-bold px-6 py-2 bg-cyan-600 text-white rounded-md hover:bg-cyan-500 transition-colors">افزودن کلید</button>
                    </div>
                </div>

                {/* Hugging Face Settings */}
                <div className="space-y-4">
                    <h3 className="font-display text-2xl text-amber-300 flex items-center gap-3">
                        <CpuChipIcon className="w-6 h-6" />
                        <span>هوش مصنوعی Hugging Face (اختیاری)</span>
                    </h3>
                    <div className="glass-surface p-4 rounded-lg space-y-4">
                         <div className="flex items-center justify-between">
                            <label htmlFor="hf-ai-toggle" className="font-bold text-slate-200">فعال‌سازی Hugging Face</label>
                            <button
                                role="switch"
                                aria-checked={huggingFaceConfig.enabled}
                                id="hf-ai-toggle"
                                onClick={() => handleHuggingFaceConfigChange('enabled', !huggingFaceConfig.enabled)}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${huggingFaceConfig.enabled ? 'bg-green-500' : 'bg-slate-600'}`}
                            >
                                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${huggingFaceConfig.enabled ? 'translate-x-6' : 'translate-x-1'}`} />
                            </button>
                        </div>
                        <div className={`space-y-4 ${!huggingFaceConfig.enabled ? 'opacity-50 pointer-events-none' : ''}`}>
                            <div>
                                <label htmlFor="hf-api-key" className="block text-sm font-bold text-slate-300 mb-1">کلید API هاگینگ فیس</label>
                                <input type="password" id="hf-api-key" value={huggingFaceConfig.apiKey} onChange={e => handleHuggingFaceConfigChange('apiKey', e.target.value)} className="w-full p-2 bg-slate-900/70 rounded-md border-2 border-[var(--color-border)] focus:border-[var(--color-border-focus)] focus:ring-0 transition font-mono text-sm" />
                            </div>
                            <div>
                                <label htmlFor="hf-model-id" className="block text-sm font-bold text-slate-300 mb-1">شناسه مدل (Model ID)</label>
                                <input type="text" id="hf-model-id" value={huggingFaceConfig.model} onChange={e => handleHuggingFaceConfigChange('model', e.target.value)} className="w-full p-2 bg-slate-900/70 rounded-md border-2 border-[var(--color-border)] focus:border-[var(--color-border-focus)] focus:ring-0 transition font-mono text-sm" placeholder="مثال: mistralai/Mistral-7B-Instruct-v0.2" />
                                <p className="text-xs text-slate-500 mt-1">
                                    برای بهترین نتیجه، از مدل‌های instruction-tuned (مانند Mistral یا Llama) استفاده کنید.
                                </p>
                            </div>
                            <div className="flex items-center justify-between">
                                <label htmlFor="hf-ai-priority-toggle" className="font-bold text-slate-200">اولویت‌بندی</label>
                                <button
                                    role="switch"
                                    aria-checked={huggingFaceConfig.prioritize}
                                    id="hf-ai-priority-toggle"
                                    onClick={() => handleHuggingFaceConfigChange('prioritize', !huggingFaceConfig.prioritize)}
                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${huggingFaceConfig.prioritize ? 'bg-green-500' : 'bg-slate-600'}`}
                                >
                                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${huggingFaceConfig.prioritize ? 'translate-x-6' : 'translate-x-1'}`} />
                                </button>
                            </div>
                            <p className="text-xs text-slate-500 -mt-2">اگر فعال باشد، همیشه از Hugging Face استفاده می‌شود (حتی اگر کلید Gemini داشته باشید).</p>
                        </div>
                    </div>
                </div>

                 {/* Local AI Settings */}
                <div className="space-y-4">
                    <h3 className="font-display text-2xl text-amber-300 flex items-center gap-3">
                        <ServerIcon className="w-6 h-6" />
                        <span>هوش مصنوعی محلی (اختیاری)</span>
                    </h3>
                    <div className="glass-surface p-4 rounded-lg space-y-4">
                         <div className="flex items-center justify-between">
                            <label htmlFor="local-ai-toggle" className="font-bold text-slate-200">فعال‌سازی هوش مصنوعی محلی</label>
                            <button
                                role="switch"
                                aria-checked={localAiConfig.enabled}
                                id="local-ai-toggle"
                                onClick={() => handleLocalAiConfigChange('enabled', !localAiConfig.enabled)}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${localAiConfig.enabled ? 'bg-green-500' : 'bg-slate-600'}`}
                            >
                                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${localAiConfig.enabled ? 'translate-x-6' : 'translate-x-1'}`} />
                            </button>
                        </div>
                        <div className={`space-y-4 ${!localAiConfig.enabled ? 'opacity-50 pointer-events-none' : ''}`}>
                            <div>
                                <label htmlFor="local-ai-endpoint" className="block text-sm font-bold text-slate-300 mb-1">آدرس Endpoint</label>
                                <input type="text" id="local-ai-endpoint" value={localAiConfig.endpoint} onChange={e => handleLocalAiConfigChange('endpoint', e.target.value)} className="w-full p-2 bg-slate-900/70 rounded-md border-2 border-[var(--color-border)] focus:border-[var(--color-border-focus)] focus:ring-0 transition font-mono text-sm" />
                                <p className="text-xs text-slate-500 mt-1">آدرس سرور محلی شما (مانند Ollama).</p>
                            </div>
                            <div className="flex items-center justify-between">
                                <label htmlFor="local-ai-priority-toggle" className="font-bold text-slate-200">اولویت‌بندی</label>
                                <button
                                    role="switch"
                                    aria-checked={localAiConfig.prioritize}
                                    id="local-ai-priority-toggle"
                                    onClick={() => handleLocalAiConfigChange('prioritize', !localAiConfig.prioritize)}
                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${localAiConfig.prioritize ? 'bg-green-500' : 'bg-slate-600'}`}
                                >
                                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${localAiConfig.prioritize ? 'translate-x-6' : 'translate-x-1'}`} />
                                </button>
                            </div>
                            <p className="text-xs text-slate-500 -mt-2">اگر فعال باشد، همیشه از هوش مصنوعی محلی استفاده می‌شود. اگر غیرفعال باشد، فقط در صورت خطا یا محدودیت سرویس‌های دیگر استفاده می‌شود.</p>
                        </div>
                    </div>
                </div>

                {/* Audio Settings */}
                <div className="space-y-4">
                    <h3 className="font-display text-2xl text-amber-300 flex items-center gap-3">
                        <VolumeUpIcon className="w-6 h-6" />
                        <span>صدا</span>
                    </h3>
                    <button onClick={() => setAudioModalOpen(true)} className="w-full text-left font-bold px-6 py-4 bg-slate-700/50 text-slate-200 rounded-md hover:bg-slate-700 transition-colors">
                        باز کردن تنظیمات صدا
                    </button>
                </div>
            </div>
            
            <AudioSettingsModal isOpen={isAudioModalOpen} onClose={() => setAudioModalOpen(false)} />
        </div>
    );
};

export default SettingsPage;