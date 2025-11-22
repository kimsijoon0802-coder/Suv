import React from 'react';
import { Player } from '../types';

interface HUDProps {
  player: Player;
  time: number;
  kills: number;
}

const HUD: React.FC<HUDProps> = ({ player, time, kills }) => {
  const formatTime = (frames: number) => {
    const seconds = Math.floor(frames / 60);
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const xpPercentage = Math.min(100, (player.xp / player.nextLevelXp) * 100);

  return (
    <div className="absolute inset-0 pointer-events-none z-20 flex flex-col justify-between p-4">
      {/* Top Bar: Level, XP, Time */}
      <div className="flex flex-col w-full gap-3">
        {/* XP Bar */}
        <div className="w-full h-8 bg-gray-900/80 border-2 border-gray-600 rounded-full overflow-hidden relative shadow-lg">
          <div 
            className="h-full bg-gradient-to-r from-green-500 to-emerald-400 transition-all duration-300 ease-out"
            style={{ width: `${xpPercentage}%` }}
          />
          <div className="absolute inset-0 flex items-center justify-center text-sm font-black text-white shadow-black drop-shadow-md">
            LV {player.level}
          </div>
        </div>

        {/* Timer & Kills */}
        <div className="flex justify-center items-center gap-8 text-white font-mono text-xl font-bold drop-shadow-lg bg-black/20 py-2 rounded-lg backdrop-blur-sm">
           <div className="flex items-center gap-2 text-yellow-300">
             <span>⏱️</span>
             <span>{formatTime(time)}</span>
           </div>
           <div className="flex items-center gap-2 text-red-400">
             <span>💀</span>
             <span>{kills}</span>
           </div>
        </div>
      </div>
    </div>
  );
};

export default HUD;