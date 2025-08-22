import React from 'react';
import { SceneEntity, Enemy } from '../types';
import { useGameStore, handlePlayerInput } from '../store/gameStore';
import { UserIcon, CompanionIcon, MonsterIcon, QuestionMarkCircleIcon } from '../data/icons';

const entityIcons: Record<SceneEntity['type'], React.ReactNode> = {
    player: <UserIcon className="w-10 h-10" />,
    companion: <CompanionIcon className="w-10 h-10" />,
    enemy: <MonsterIcon className="w-10 h-10 text-rose-400" />,
    lore: <QuestionMarkCircleIcon className="w-10 h-10 text-sky-300" />,
};

const EntityHealthBar: React.FC<{ enemy: Enemy | undefined }> = ({ enemy }) => {
    if (!enemy) return null;
    const percentage = enemy.health.max > 0 ? (enemy.health.current / enemy.health.max) * 100 : 0;
    return (
        <div className="entity-health-bar-bg">
            <div className="entity-health-bar-fg" style={{ width: `${percentage}%` }}></div>
        </div>
    );
};

const SingleEntity: React.FC<{ entity: SceneEntity; enemyData: Enemy | undefined }> = ({ entity, enemyData }) => {
    const isPlayer = entity.type === 'player';
    const isLore = entity.type === 'lore';
    const { isLoading } = useGameStore(state => ({ isLoading: state.isLoading }));

    const handleClick = () => {
        if (isLore && !isLoading) {
            handlePlayerInput(`[ACTION:EXAMINE] ${entity.id}`);
        }
    };

    const animationClass = isPlayer ? 'animate-player-pulse' : 'animate-entity-float';
    const cursorClass = isLore ? 'cursor-pointer hover:scale-105' : 'cursor-default';
    const Tag = isLore ? 'button' : 'div';

    return (
        <Tag
            onClick={isLore ? handleClick : undefined}
            disabled={isLore ? isLoading : undefined}
            className={`scene-entity relative flex flex-col items-center gap-2 text-center text-white p-2 transition-transform duration-300 ${cursorClass}`}
            aria-label={`${entity.name}: ${entity.description}`}
        >
            <div className={`relative w-20 h-20 flex items-center justify-center rounded-full glass-surface ${animationClass}`}>
                {entityIcons[entity.type]}
            </div>
            <span className="text-xs font-bold w-24 truncate">{entity.name}</span>
            <EntityHealthBar enemy={enemyData} />
            <div className="scene-entity-tooltip">{entity.description}</div>
        </Tag>
    );
};

interface SceneEntityDisplayProps {
    entities: SceneEntity[];
    enemies: Enemy[];
}

const SceneEntityDisplay: React.FC<SceneEntityDisplayProps> = ({ entities, enemies }) => {
    if (!entities || entities.length === 0) {
        return null;
    }
    
    // Group entities for layout
    const player = entities.find(e => e.type === 'player');
    const companions = entities.filter(e => e.type === 'companion');
    const enemyEntities = entities.filter(e => e.type === 'enemy');
    const loreObjects = entities.filter(e => e.type === 'lore');

    return (
        <div className="scene-display-container animate-fade-in">
            <div className="scene-group scene-group-player">
                {player && <SingleEntity entity={player} enemyData={undefined} />}
                {companions.map(c => <SingleEntity key={c.id} entity={c} enemyData={undefined} />)}
            </div>
            <div className="scene-group scene-group-lore">
                 {loreObjects.map(l => <SingleEntity key={l.id} entity={l} enemyData={undefined} />)}
            </div>
            <div className="scene-group scene-group-enemies">
                {enemyEntities.map(e => {
                    const enemyData = enemies.find(en => en.id === e.id);
                    return <SingleEntity key={e.id} entity={e} enemyData={enemyData} />;
                })}
            </div>
        </div>
    );
};

export default SceneEntityDisplay;