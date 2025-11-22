import { UpgradeOption, Weapon, Wave } from './types';

export const WORLD_SIZE = 4000;
export const PLAYER_BASE_SPEED = 3.5;
export const FPS = 60;

export const COLORS = {
  player: '#3b82f6', // Blue
  enemyBasic: '#ef4444', // Red
  enemyFast: '#f97316', // Orange
  enemyTank: '#7f1d1d', // Dark Red
  enemySwarm: '#a855f7', // Purple
  enemyShooter: '#14b8a6', // Teal
  enemyBoss: '#be123c', // Rose (Big)
  gem1: '#10b981', // Green
  gem10: '#3b82f6', // Blue
  gem50: '#f59e0b', // Gold
  gemChest: '#fbbf24', // Gold Chest
  gemHealth: '#ec4899', // Pink
  projectile: '#e2e8f0',
  projectileEnemy: '#ef4444',
  textDamage: '#ffffff',
  textCrit: '#fbbf24',
};

// Waves configuration (Time in seconds)
export const WAVES: Wave[] = [
  { startTime: 0, spawnRate: 60, enemyTypes: ['basic'] },
  { startTime: 30, spawnRate: 45, enemyTypes: ['basic', 'fast'] },
  { startTime: 60, spawnRate: 30, enemyTypes: ['basic', 'fast', 'swarm'] },
  { startTime: 120, spawnRate: 20, enemyTypes: ['basic', 'tank', 'shooter'] },
  { startTime: 180, spawnRate: 15, enemyTypes: ['swarm', 'fast', 'tank'] },
  { startTime: 240, spawnRate: 100, enemyTypes: [], boss: true }, // Boss Spawn
  { startTime: 245, spawnRate: 10, enemyTypes: ['basic', 'swarm', 'shooter'] }, // Chaos after boss
];

export const BASE_WEAPONS: Record<string, Weapon> = {
  kunai: {
    type: 'kunai',
    level: 1,
    cooldown: 40,
    cooldownTimer: 0,
    damage: 15,
    projectileSpeed: 12,
    range: 600, // Range to detect enemy
  },
  orb: {
    type: 'orb',
    level: 0,
    cooldown: 0, // Constant
    cooldownTimer: 0,
    damage: 8,
    projectileCount: 0,
    range: 70, // Orbit radius
  },
  aura: {
    type: 'aura',
    level: 0,
    cooldown: 30,
    cooldownTimer: 0,
    damage: 3,
    range: 120, // Radius
  },
  drill: {
    type: 'drill',
    level: 0,
    cooldown: 90,
    cooldownTimer: 0,
    damage: 20,
    projectileSpeed: 15,
    duration: 120,
    range: 1000,
  },
  brick: {
    type: 'brick',
    level: 0,
    cooldown: 50,
    cooldownTimer: 0,
    damage: 30,
    projectileSpeed: 0, // Handled by gravity logic
    duration: 60,
    range: 200,
  },
  lightning: {
    type: 'lightning',
    level: 0,
    cooldown: 80,
    cooldownTimer: 0,
    damage: 40,
    range: 500,
  }
};

export const UPGRADES_POOL: UpgradeOption[] = [
  // --- Weapons ---
  {
    id: 'kunai_upgrade',
    name: '쿠나이',
    description: '가장 가까운 적에게 수리검을 던집니다.',
    type: 'weapon',
    weaponType: 'kunai',
    icon: '🗡️',
    rarity: 'common',
  },
  {
    id: 'orb_unlock',
    name: '수호자',
    description: '캐릭터 주변을 도는 보호막을 생성합니다.',
    type: 'weapon',
    weaponType: 'orb',
    icon: '🔮',
    rarity: 'rare',
  },
  {
    id: 'aura_unlock',
    name: '역장',
    description: '주변 적에게 지속적인 피해를 줍니다.',
    type: 'weapon',
    weaponType: 'aura',
    icon: '🤢',
    rarity: 'common',
  },
  {
    id: 'drill_unlock',
    name: '화살 드릴',
    description: '적을 관통하며 날아가는 드릴을 발사합니다.',
    type: 'weapon',
    weaponType: 'drill',
    icon: '🏹',
    rarity: 'rare',
  },
  {
    id: 'brick_unlock',
    name: '벽돌',
    description: '위로 던져져 아래로 떨어지며 큰 피해를 줍니다.',
    type: 'weapon',
    weaponType: 'brick',
    icon: '🧱',
    rarity: 'common',
  },
  {
    id: 'lightning_unlock',
    name: '번개 발사기',
    description: '무작위 적에게 벼락을 떨어뜨립니다.',
    type: 'weapon',
    weaponType: 'lightning',
    icon: '⚡',
    rarity: 'epic',
  },
  // --- Stats ---
  {
    id: 'speed_boost',
    name: '운동화',
    description: '이동 속도가 10% 증가합니다.',
    type: 'stat',
    statType: 'speed',
    icon: '👟',
    rarity: 'common',
  },
  {
    id: 'hp_boost',
    name: '로닌 갑옷',
    description: '최대 체력이 20% 증가합니다.',
    type: 'stat',
    statType: 'maxHp',
    icon: '🛡️',
    rarity: 'common',
  },
  {
    id: 'magnet_boost',
    name: '자석',
    description: '아이템 획득 범위가 25% 증가합니다.',
    type: 'stat',
    statType: 'pickupRange',
    icon: '🧲',
    rarity: 'common',
  },
  {
    id: 'cooldown_boost',
    name: '에너지 큐브',
    description: '공격 쿨타임이 10% 감소합니다.',
    type: 'stat',
    statType: 'cooldown',
    icon: '🧊',
    rarity: 'rare',
  },
  {
    id: 'power_boost',
    name: '강력한 총알',
    description: '공격력이 15% 증가합니다.',
    type: 'stat',
    statType: 'power',
    icon: '💪',
    rarity: 'rare',
  },
  {
    id: 'heal_potion',
    name: '고기',
    description: '체력을 30% 회복합니다.',
    type: 'stat',
    statType: 'maxHp', 
    icon: '🍖',
    rarity: 'common',
  },
];