import React, { useEffect, useRef, useState, useCallback } from 'react';
import { COLORS, FPS, WORLD_SIZE, BASE_WEAPONS, UPGRADES_POOL, PLAYER_BASE_SPEED, WAVES } from '../constants';
import { Entity, Player, Enemy, Gem, Projectile, DamageNumber, GameState, UpgradeOption, Vector2 } from '../types';
import HUD from './HUD';
import UpgradeModal from './UpgradeModal';
import VirtualJoystick from './VirtualJoystick';
import MainMenu from './MainMenu';

// Helper: Random range
const randRange = (min: number, max: number) => Math.random() * (max - min) + min;
// Helper: Distance squared
const distSq = (a: { x: number, y: number }, b: { x: number, y: number }) => (a.x - b.x) ** 2 + (a.y - b.y) ** 2;

const Game = () => {
  const [gameState, setGameState] = useState<GameState>('menu');
  const [uiPlayer, setUiPlayer] = useState<Player | null>(null);
  const [kills, setKills] = useState(0);
  const [gameTime, setGameTime] = useState(0); // Frames
  const [upgradeOptions, setUpgradeOptions] = useState<UpgradeOption[]>([]);
  const [bossWarning, setBossWarning] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number>();
  const inputRef = useRef<Vector2>({ x: 0, y: 0 });
  const keysRef = useRef<Record<string, boolean>>({});
  
  // Game State Refs
  const entitiesRef = useRef({
    player: null as Player | null,
    enemies: [] as Enemy[],
    gems: [] as Gem[],
    projectiles: [] as Projectile[],
    damageNumbers: [] as DamageNumber[],
  });

  const gameStatsRef = useRef({
    frameCount: 0,
    kills: 0,
    enemySpawnTimer: 0,
    powerMultiplier: 1,
    cdMultiplier: 1,
    bossSpawned: false,
    currentWaveIndex: 0,
  });

  const initGame = useCallback(() => {
    entitiesRef.current = {
      player: {
        id: 'player',
        x: WORLD_SIZE / 2,
        y: WORLD_SIZE / 2,
        radius: 12,
        color: COLORS.player,
        hp: 100,
        maxHp: 100,
        speed: PLAYER_BASE_SPEED,
        pickupRange: 100,
        weapons: [{ ...BASE_WEAPONS.kunai }],
        level: 1,
        xp: 0,
        nextLevelXp: 5,
        facing: 0,
      },
      enemies: [],
      gems: [],
      projectiles: [],
      damageNumbers: [],
    };

    gameStatsRef.current = {
      frameCount: 0,
      kills: 0,
      enemySpawnTimer: 0,
      powerMultiplier: 1,
      cdMultiplier: 1,
      bossSpawned: false,
      currentWaveIndex: 0,
    };

    setKills(0);
    setGameTime(0);
    setBossWarning(false);
    setUiPlayer(entitiesRef.current.player);
    setGameState('playing');
  }, []);

  const update = () => {
    const state = entitiesRef.current;
    const stats = gameStatsRef.current;
    const player = state.player;

    if (!player || player.hp <= 0) {
      setGameState('gameover');
      return;
    }

    stats.frameCount++;
    setGameTime(stats.frameCount);

    const seconds = stats.frameCount / FPS;

    // --- WAVE LOGIC ---
    let currentWave = WAVES[0];
    for (let i = 0; i < WAVES.length; i++) {
      if (seconds >= WAVES[i].startTime) {
        currentWave = WAVES[i];
        stats.currentWaveIndex = i;
      }
    }

    // Boss Spawning
    if (currentWave.boss && !stats.bossSpawned) {
       spawnBoss(player);
       stats.bossSpawned = true;
       setBossWarning(true);
       setTimeout(() => setBossWarning(false), 3000);
    }

    // --- PLAYER MOVEMENT ---
    let moveX = inputRef.current.x;
    let moveY = inputRef.current.y;

    if (moveX === 0 && moveY === 0) {
        if (keysRef.current['w'] || keysRef.current['ArrowUp']) moveY = -1;
        if (keysRef.current['s'] || keysRef.current['ArrowDown']) moveY = 1;
        if (keysRef.current['a'] || keysRef.current['ArrowLeft']) moveX = -1;
        if (keysRef.current['d'] || keysRef.current['ArrowRight']) moveX = 1;
    }

    if (moveX !== 0 || moveY !== 0) {
      const len = Math.sqrt(moveX * moveX + moveY * moveY);
      moveX /= len;
      moveY /= len;
      player.x += moveX * player.speed;
      player.y += moveY * player.speed;
      player.x = Math.max(0, Math.min(WORLD_SIZE, player.x));
      player.y = Math.max(0, Math.min(WORLD_SIZE, player.y));
      player.facing = Math.atan2(moveY, moveX);
    }

    // --- ENEMY SPAWNING ---
    if (currentWave.enemyTypes.length > 0) {
      stats.enemySpawnTimer++;
      if (stats.enemySpawnTimer > currentWave.spawnRate) {
        stats.enemySpawnTimer = 0;
        
        // Spawn logic
        const angle = Math.random() * Math.PI * 2;
        const dist = 450 + Math.random() * 100; 
        const ex = player.x + Math.cos(angle) * dist;
        const ey = player.y + Math.sin(angle) * dist;
        
        // Pick type
        const type = currentWave.enemyTypes[Math.floor(Math.random() * currentWave.enemyTypes.length)];
        
        spawnEnemy(ex, ey, type);
      }
    }

    // --- ENTITY UPDATES ---
    
    // Enemies
    for (let i = state.enemies.length - 1; i >= 0; i--) {
      const enemy = state.enemies[i];
      
      // Move towards player
      const dx = player.x - enemy.x;
      const dy = player.y - enemy.y;
      const dist = Math.sqrt(dx*dx + dy*dy);
      
      // Despawn if too far (performance)
      if (dist > 1500 && !enemy.isBoss) {
          state.enemies.splice(i, 1);
          continue;
      }

      // Movement
      enemy.x += (dx / dist) * enemy.speed;
      enemy.y += (dy / dist) * enemy.speed;

      // Soft Collision with other enemies
      for (let j = i - 1; j >= 0; j--) {
          const other = state.enemies[j];
          if (Math.abs(enemy.x - other.x) < 20 && Math.abs(enemy.y - other.y) < 20) {
             const d2 = distSq(enemy, other);
             const minDist = enemy.radius + other.radius;
             if (d2 < minDist * minDist) {
                  const pushX = enemy.x - other.x;
                  const pushY = enemy.y - other.y;
                  const force = enemy.isBoss ? 0.01 : 0.05;
                  enemy.x += pushX * force;
                  enemy.y += pushY * force;
             }
          }
      }

      // Enemy Attack (Shooter)
      if (enemy.type === 'shooter' && stats.frameCount % 180 === 0 && dist < 400) {
         state.projectiles.push({
             id: Math.random().toString(),
             x: enemy.x, y: enemy.y,
             vx: (dx/dist) * 4, vy: (dy/dist) * 4,
             radius: 5, color: COLORS.projectileEnemy,
             damage: 10, duration: 100, pierce: 0, hitIds: [], type: 'bullet'
         });
      }

      // Boss Attack (Charge or something simple for now)
      if (enemy.isBoss && dist < 200 && stats.frameCount % 300 === 0) {
          // Dash
          enemy.x += (dx/dist) * 50;
          enemy.y += (dy/dist) * 50;
      }

      // Player Hit
      if (dist < player.radius + enemy.radius) {
        if (stats.frameCount % 30 === 0) { // I-frames
           player.hp -= Math.max(1, enemy.damage - (i % 2)); // Simple armor logic placeholder
           addDamageNumber(player.x, player.y - 20, enemy.damage, 'red');
        }
      }
    }

    // --- WEAPON LOGIC ---
    player.weapons.forEach(w => {
      w.cooldownTimer--;
      const actualCooldown = w.cooldown * stats.cdMultiplier;
      const actualDamage = w.damage * stats.powerMultiplier;

      if (w.cooldownTimer <= 0) {
        // KUNAI
        if (w.type === 'kunai') {
          const closest = getClosestEnemy(player, w.range);
          if (closest) {
             const dx = closest.x - player.x;
             const dy = closest.y - player.y;
             const dist = Math.sqrt(dx*dx + dy*dy);
             
             // Multi-shot upgrade logic
             const count = w.level > 2 ? 2 : 1;
             for(let c=0; c<count; c++) {
                 state.projectiles.push({
                   id: Math.random().toString(),
                   x: player.x, y: player.y,
                   radius: 4, color: COLORS.projectile,
                   vx: (dx/dist) * (w.projectileSpeed || 10) + (Math.random() - 0.5),
                   vy: (dy/dist) * (w.projectileSpeed || 10) + (Math.random() - 0.5),
                   damage: actualDamage, duration: 60, pierce: 0, hitIds: [], type: 'kunai'
                 });
             }
             w.cooldownTimer = actualCooldown;
          }
        }
        // BRICK
        else if (w.type === 'brick') {
           // Throws up, gravity pulls down
           state.projectiles.push({
               id: Math.random().toString(),
               x: player.x, y: player.y - 20,
               radius: 8, color: '#a3a3a3',
               vx: 0, vy: -8, // Initial Up velocity
               damage: actualDamage * 2, // High damage
               duration: 100, pierce: 999, hitIds: [], type: 'brick',
               gravity: 0.4
           });
           w.cooldownTimer = actualCooldown;
        }
        // DRILL
        else if (w.type === 'drill') {
            // Shoots in facing direction
            const dx = Math.cos(player.facing);
            const dy = Math.sin(player.facing);
            state.projectiles.push({
               id: Math.random().toString(),
               x: player.x, y: player.y,
               radius: 3, color: '#facc15',
               vx: dx * (w.projectileSpeed || 15),
               vy: dy * (w.projectileSpeed || 15),
               damage: actualDamage,
               duration: 120, pierce: 999, hitIds: [], type: 'drill'
            });
            w.cooldownTimer = actualCooldown;
        }
        // LIGHTNING
        else if (w.type === 'lightning') {
             // Instant hit random enemies
             const targets = state.enemies.filter(e => distSq(player, e) < (w.range || 500)**2);
             if (targets.length > 0) {
                 const target = targets[Math.floor(Math.random() * targets.length)];
                 target.hp -= actualDamage;
                 addDamageNumber(target.x, target.y, actualDamage, '#facc15');
                 // Visual handled in draw via a temporary effect or just the number for now
                 w.cooldownTimer = actualCooldown;
             }
        }
        // AURA & ORB (Passive/tick based)
        else if (w.type === 'aura') {
            state.enemies.forEach(e => {
                if (distSq(player, e) < (w.range || 100) ** 2) {
                    e.hp -= actualDamage;
                    if (stats.frameCount % 10 === 0) addDamageNumber(e.x, e.y, actualDamage, 'purple');
                }
            });
            w.cooldownTimer = actualCooldown;
        }
      }
      // ORB Logic (Continuous rotation damage)
      if (w.type === 'orb') {
            const orbCount = 2 + w.level;
            const range = w.range || 70;
            const speed = 0.05;
            
            for(let k=0; k<orbCount; k++) {
               const angle = (stats.frameCount * speed) + (k * (Math.PI * 2 / orbCount));
               const ox = player.x + Math.cos(angle) * range;
               const oy = player.y + Math.sin(angle) * range;
               
               state.enemies.forEach(e => {
                  // Check collision with orb point
                  if ((e.x - ox)**2 + (e.y - oy)**2 < (e.radius + 10)**2) {
                     if (stats.frameCount % 15 === 0) {
                       e.hp -= actualDamage;
                       addDamageNumber(e.x, e.y, actualDamage, 'cyan');
                     }
                  }
               });
            }
      }
    });

    // --- PROJECTILES ---
    for (let i = state.projectiles.length - 1; i >= 0; i--) {
      const p = state.projectiles[i];
      
      // Logic per type
      if (p.type === 'brick' && p.gravity) {
          p.vy += p.gravity;
      }

      p.x += p.vx;
      p.y += p.vy;
      p.duration--;

      if (p.duration <= 0) {
        state.projectiles.splice(i, 1);
        continue;
      }

      // Enemy Projectiles
      if (p.type === 'bullet') {
         const d2 = distSq(p, player);
         if (d2 < (p.radius + player.radius)**2) {
             player.hp -= p.damage;
             addDamageNumber(player.x, player.y, p.damage, 'red');
             state.projectiles.splice(i, 1);
         }
         continue;
      }

      // Player Projectiles vs Enemies
      for (let j = state.enemies.length - 1; j >= 0; j--) {
        const e = state.enemies[j];
        if (p.hitIds.includes(e.id)) continue;

        const d2 = distSq(p, e);
        if (d2 < (p.radius + e.radius)**2) {
           e.hp -= p.damage;
           addDamageNumber(e.x, e.y, p.damage);
           p.hitIds.push(e.id);
           
           if (p.pierce <= 0) {
             state.projectiles.splice(i, 1);
             break;
           } else {
             p.pierce--;
           }
        }
      }
    }

    // --- GEMS ---
    for (let i = state.gems.length - 1; i >= 0; i--) {
      const gem = state.gems[i];
      const d2 = distSq(player, gem);
      
      if (d2 < player.pickupRange ** 2) gem.magnetized = true;

      if (gem.magnetized) {
        const dx = player.x - gem.x;
        const dy = player.y - gem.y;
        const dist = Math.sqrt(d2);
        const speed = 12;
        gem.x += (dx/dist) * speed;
        gem.y += (dy/dist) * speed;

        if (dist < player.radius) {
           if (gem.type === 'xp') {
              player.xp += gem.value;
           } else if (gem.type === 'health') {
              player.hp = Math.min(player.maxHp, player.hp + 20);
              addDamageNumber(player.x, player.y, 20, '#4ade80');
           } else if (gem.type === 'chest') {
              // Instant huge XP or just full screen clear? 
              // For now, huge XP to trigger upgrades
              player.xp += 100; 
              // Clear screen effect
              state.enemies.forEach(e => { if(!e.isBoss) e.hp = 0; });
           }
           state.gems.splice(i, 1);
           checkLevelUp();
        }
      }
    }

    // --- DEATH & LOOT ---
    for (let i = state.enemies.length - 1; i >= 0; i--) {
      const e = state.enemies[i];
      if (e.hp <= 0) {
        stats.kills++;
        setKills(stats.kills);
        
        // Loot logic
        const rng = Math.random();
        if (e.isBoss) {
            dropGem(e.x, e.y, 0, 'chest');
            stats.bossSpawned = false; // Allow next boss
        } else if (rng < 0.01) {
            dropGem(e.x, e.y, 0, 'health');
        } else {
            dropGem(e.x, e.y, e.xpValue, 'xp');
        }
        
        state.enemies.splice(i, 1);
      }
    }

    // Cleanup damage numbers
    for (let i = state.damageNumbers.length - 1; i >= 0; i--) {
      state.damageNumbers[i].y -= 0.5;
      state.damageNumbers[i].life--;
      if (state.damageNumbers[i].life <= 0) state.damageNumbers.splice(i, 1);
    }

    setUiPlayer({...player}); 
  };

  const spawnEnemy = (x: number, y: number, type: Enemy['type']) => {
      const stats = gameStatsRef.current;
      // Scaling
      const hpMult = 1 + (stats.frameCount / 3600); 
      
      let props = { radius: 10, color: COLORS.enemyBasic, speed: 1.5, hp: 10, xp: 1 };
      
      switch(type) {
          case 'fast': props = { radius: 8, color: COLORS.enemyFast, speed: 2.8, hp: 5, xp: 2 }; break;
          case 'tank': props = { radius: 18, color: COLORS.enemyTank, speed: 0.8, hp: 40, xp: 5 }; break;
          case 'swarm': props = { radius: 6, color: COLORS.enemySwarm, speed: 2.0, hp: 2, xp: 1 }; break;
          case 'shooter': props = { radius: 12, color: COLORS.enemyShooter, speed: 1.2, hp: 15, xp: 3 }; break;
          case 'basic': default: break;
      }

      entitiesRef.current.enemies.push({
          id: Math.random().toString(36).substr(2, 9),
          x, y,
          radius: props.radius,
          color: props.color,
          hp: props.hp * hpMult,
          maxHp: props.hp * hpMult,
          speed: props.speed,
          damage: 5 + Math.floor(stats.frameCount / 1000),
          xpValue: props.xp,
          type: type,
          isBoss: false
      });
  };

  const spawnBoss = (player: Player) => {
      const angle = Math.random() * Math.PI * 2;
      const dist = 500;
      entitiesRef.current.enemies.push({
          id: 'BOSS',
          x: player.x + Math.cos(angle) * dist,
          y: player.y + Math.sin(angle) * dist,
          radius: 40,
          color: COLORS.enemyBoss,
          hp: 5000 * (1 + gameStatsRef.current.frameCount/10000),
          maxHp: 5000 * (1 + gameStatsRef.current.frameCount/10000),
          speed: 1.5,
          damage: 20,
          xpValue: 100,
          type: 'boss',
          isBoss: true
      });
  };

  const dropGem = (x: number, y: number, val: number, type: Gem['type']) => {
      let color = COLORS.gem1;
      if (val > 2) color = COLORS.gem10;
      if (type === 'health') color = COLORS.gemHealth;
      if (type === 'chest') color = COLORS.gemChest;

      entitiesRef.current.gems.push({
          id: Math.random().toString(),
          x, y, radius: type === 'chest' ? 8 : 4,
          color, value: val, magnetized: false, type
      });
  };

  const getClosestEnemy = (player: Player, range: number = 600) => {
      let closest = null;
      let closestDist = Infinity;
      entitiesRef.current.enemies.forEach(e => {
        const d = distSq(player, e);
        if (d < range*range && d < closestDist) {
          closestDist = d;
          closest = e;
        }
      });
      return closest;
  };

  const addDamageNumber = (x: number, y: number, dmg: number, color = COLORS.textDamage) => {
    entitiesRef.current.damageNumbers.push({
      id: Math.random().toString(),
      x, y, value: Math.floor(dmg), life: 30, color
    });
  };

  const checkLevelUp = () => {
    const p = entitiesRef.current.player;
    if (!p) return;

    if (p.xp >= p.nextLevelXp) {
      p.level++;
      p.xp -= p.nextLevelXp;
      p.nextLevelXp = Math.floor(p.nextLevelXp * 1.4);
      
      // Generate options
      const options = [];
      for(let i=0; i<3; i++) {
        options.push(UPGRADES_POOL[Math.floor(Math.random() * UPGRADES_POOL.length)]);
      }
      setUpgradeOptions(options);
      setGameState('levelup');
    }
  };

  const applyUpgrade = (opt: UpgradeOption) => {
     const p = entitiesRef.current.player;
     const stats = gameStatsRef.current;
     if(!p) return;

     if (opt.id === 'heal_potion') {
       p.hp = Math.min(p.maxHp, p.hp + (p.maxHp * 0.3));
     } else if (opt.type === 'stat') {
        if (opt.statType === 'speed') p.speed *= 1.1;
        if (opt.statType === 'maxHp') { p.maxHp *= 1.2; p.hp += 20; }
        if (opt.statType === 'pickupRange') p.pickupRange *= 1.25;
        if (opt.statType === 'cooldown') stats.cdMultiplier *= 0.9;
        if (opt.statType === 'power') stats.powerMultiplier *= 1.15;
     } else if (opt.type === 'weapon') {
        const existing = p.weapons.find(w => w.type === opt.weaponType);
        if (existing) {
          existing.level++;
          existing.damage *= 1.2;
          existing.cooldown *= 0.9;
        } else {
          if (opt.weaponType && BASE_WEAPONS[opt.weaponType]) {
             p.weapons.push({ ...BASE_WEAPONS[opt.weaponType] });
          }
        }
     }
     setGameState('playing');
  };

  const draw = (ctx: CanvasRenderingContext2D) => {
    const { player, enemies, gems, projectiles, damageNumbers } = entitiesRef.current;
    if (!player) return;

    const canvas = ctx.canvas;
    const width = canvas.width;
    const height = canvas.height;
    const camX = player.x - width / 2;
    const camY = player.y - height / 2;

    // BG
    ctx.fillStyle = '#1f2937';
    ctx.fillRect(0, 0, width, height);

    // Grid
    ctx.strokeStyle = '#374151';
    ctx.lineWidth = 2;
    const gridSize = 100;
    const startX = Math.floor(camX / gridSize) * gridSize;
    const startY = Math.floor(camY / gridSize) * gridSize;
    ctx.beginPath();
    for (let x = startX; x < camX + width + gridSize; x += gridSize) {
       ctx.moveTo(x - camX, 0);
       ctx.lineTo(x - camX, height);
    }
    for (let y = startY; y < camY + height + gridSize; y += gridSize) {
      ctx.moveTo(0, y - camY);
      ctx.lineTo(width, y - camY);
    }
    ctx.stroke();

    // Entities
    const drawCircle = (x: number, y: number, r: number, color: string, stroke: boolean = true) => {
       if (x < -50 || x > width + 50 || y < -50 || y > height + 50) return;
       ctx.beginPath();
       ctx.fillStyle = color;
       ctx.arc(x, y, r, 0, Math.PI * 2);
       ctx.fill();
       if(stroke) {
         ctx.strokeStyle = 'rgba(0,0,0,0.4)';
         ctx.lineWidth = 2;
         ctx.stroke();
       }
    };

    // Gems
    gems.forEach(g => {
       const cx = g.x - camX;
       const cy = g.y - camY;
       if (g.type === 'chest') {
           ctx.fillStyle = g.color;
           ctx.fillRect(cx - 6, cy - 6, 12, 12);
           ctx.strokeStyle = '#fff';
           ctx.strokeRect(cx - 6, cy - 6, 12, 12);
       } else {
           ctx.save();
           ctx.translate(cx, cy);
           ctx.rotate(gameStatsRef.current.frameCount * 0.1);
           ctx.fillStyle = g.color;
           ctx.beginPath();
           ctx.moveTo(0, -5);
           ctx.lineTo(4, 0);
           ctx.lineTo(0, 5);
           ctx.lineTo(-4, 0);
           ctx.fill();
           ctx.restore();
       }
    });

    // Enemies
    enemies.forEach(e => {
        const cx = e.x - camX;
        const cy = e.y - camY;
        drawCircle(cx, cy, e.radius, e.color);
        if (e.isBoss) {
             // Boss HP Bar
             ctx.fillStyle = 'black';
             ctx.fillRect(cx - 30, cy - e.radius - 15, 60, 8);
             ctx.fillStyle = 'red';
             ctx.fillRect(cx - 30, cy - e.radius - 15, 60 * (e.hp/e.maxHp), 8);
        }
    });

    // Projectiles
    projectiles.forEach(p => {
        const cx = p.x - camX;
        const cy = p.y - camY;
        if (p.type === 'brick') {
             ctx.fillStyle = '#a3a3a3';
             ctx.fillRect(cx-8, cy-4, 16, 8);
        } else if (p.type === 'drill') {
             ctx.save();
             ctx.translate(cx, cy);
             ctx.rotate(Math.atan2(p.vy, p.vx));
             ctx.fillStyle = '#facc15';
             ctx.beginPath();
             ctx.moveTo(10, 0);
             ctx.lineTo(-5, 5);
             ctx.lineTo(-5, -5);
             ctx.fill();
             ctx.restore();
        } else {
             drawCircle(cx, cy, p.radius, p.color, false);
        }
    });

    // Player
    ctx.save();
    ctx.translate(player.x - camX, player.y - camY);

    // Aura
    const aura = player.weapons.find(w => w.type === 'aura');
    if (aura) {
       ctx.fillStyle = 'rgba(50, 255, 50, 0.1)';
       ctx.beginPath();
       ctx.arc(0, 0, aura.range || 100, 0, Math.PI*2);
       ctx.fill();
       ctx.strokeStyle = 'rgba(50, 255, 50, 0.4)';
       ctx.lineWidth = 1;
       ctx.stroke();
    }
    // Orbs
    const orb = player.weapons.find(w => w.type === 'orb');
    if (orb) {
       const count = 2 + orb.level;
       const range = orb.range || 70;
       const angleOffset = gameStatsRef.current.frameCount * 0.05;
       ctx.fillStyle = '#0ea5e9'; // Sky blue
       for(let k=0; k<count; k++) {
          const a = angleOffset + (k * Math.PI * 2 / count);
          const ox = Math.cos(a) * range;
          const oy = Math.sin(a) * range;
          ctx.beginPath();
          ctx.arc(ox, oy, 8, 0, Math.PI*2);
          ctx.fill();
          ctx.strokeStyle = 'white';
          ctx.stroke();
       }
    }

    // Character Body
    ctx.fillStyle = player.color;
    ctx.beginPath();
    ctx.arc(0, 0, player.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 3;
    ctx.stroke();

    // HP Bar
    const hpW = 40;
    ctx.fillStyle = '#991b1b';
    ctx.fillRect(-hpW/2, -player.radius - 12, hpW, 6);
    ctx.fillStyle = '#22c55e';
    ctx.fillRect(-hpW/2, -player.radius - 12, hpW * (player.hp/player.maxHp), 6);
    ctx.restore();

    // Damage Numbers
    ctx.font = 'bold 14px sans-serif';
    ctx.textAlign = 'center';
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 2;
    damageNumbers.forEach(dn => {
      const cx = dn.x - camX;
      const cy = dn.y - camY;
      ctx.fillStyle = dn.color;
      ctx.globalAlpha = dn.life / 30;
      ctx.strokeText(Math.floor(dn.value).toString(), cx, cy);
      ctx.fillText(Math.floor(dn.value).toString(), cx, cy);
      ctx.globalAlpha = 1;
    });
  };

  const loop = useCallback(() => {
    if (gameState === 'playing') update();
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) draw(ctx);
    }
    requestRef.current = requestAnimationFrame(loop);
  }, [gameState]);

  useEffect(() => {
    requestRef.current = requestAnimationFrame(loop);
    return () => { if (requestRef.current) cancelAnimationFrame(requestRef.current); };
  }, [loop]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => keysRef.current[e.key] = true;
    const onKeyUp = (e: KeyboardEvent) => keysRef.current[e.key] = false;
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    const handleResize = () => {
       if (canvasRef.current) {
         canvasRef.current.width = window.innerWidth;
         canvasRef.current.height = window.innerHeight;
       }
    };
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-gray-900 text-white font-sans select-none">
      <canvas ref={canvasRef} className="block" />
      
      {gameState === 'playing' && uiPlayer && (
        <>
          <HUD player={uiPlayer} time={gameTime} kills={kills} />
          <VirtualJoystick onMove={(x, y) => inputRef.current = { x, y }} />
        </>
      )}

      {/* Boss Warning Overlay */}
      {bossWarning && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-40">
           <div className="bg-red-600/80 text-white text-6xl font-black py-4 px-20 animate-pulse transform -rotate-3 border-y-4 border-black shadow-2xl">
              보스 출현!
           </div>
        </div>
      )}

      {(gameState === 'menu' || gameState === 'gameover') && (
        <MainMenu 
          onStart={initGame} 
          gameOver={gameState === 'gameover'} 
          score={kills}
        />
      )}

      {gameState === 'levelup' && (
        <UpgradeModal options={upgradeOptions} onSelect={applyUpgrade} />
      )}
    </div>
  );
};

export default Game;