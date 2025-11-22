export interface Vector2 {
  x: number;
  y: number;
}

export interface Entity {
  id: string;
  x: number;
  y: number;
  radius: number;
  color: string;
}

export interface Player extends Entity {
  hp: number;
  maxHp: number;
  speed: number;
  pickupRange: number;
  weapons: Weapon[];
  level: number;
  xp: number;
  nextLevelXp: number;
  facing: number; // Angle in radians
}

export interface Enemy extends Entity {
  hp: number;
  maxHp: number;
  speed: number;
  damage: number;
  xpValue: number;
  type: 'basic' | 'fast' | 'tank' | 'swarm' | 'shooter' | 'boss';
  isBoss: boolean;
}

export interface Gem extends Entity {
  value: number;
  magnetized: boolean;
  type: 'xp' | 'chest' | 'health';
}

export interface Projectile extends Entity {
  vx: number;
  vy: number;
  damage: number;
  duration: number; // Frames to live
  pierce: number; // How many enemies it can hit
  hitIds: string[]; // IDs of enemies already hit
  type: 'kunai' | 'brick' | 'drill' | 'bullet'; // bullet is enemy projectile
  gravity?: number; // For brick
}

export interface DamageNumber {
  id: string;
  x: number;
  y: number;
  value: number;
  life: number;
  color: string;
}

export interface Weapon {
  type: 'kunai' | 'orb' | 'aura' | 'drill' | 'brick' | 'lightning';
  level: number;
  cooldown: number;
  cooldownTimer: number;
  damage: number;
  range?: number; // Detection range or Area size
  projectileCount?: number;
  projectileSpeed?: number;
  duration?: number;
}

export interface UpgradeOption {
  id: string;
  name: string;
  description: string;
  type: 'weapon' | 'stat';
  weaponType?: Weapon['type'];
  statType?: 'speed' | 'maxHp' | 'pickupRange' | 'cooldown' | 'power';
  icon: string;
  rarity: 'common' | 'rare' | 'epic';
}

export interface Wave {
  startTime: number; // In seconds
  spawnRate: number; // Frames between spawns
  enemyTypes: Enemy['type'][];
  boss?: boolean;
}

export type GameState = 'menu' | 'playing' | 'paused' | 'levelup' | 'gameover' | 'victory';