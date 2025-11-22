import React from 'react';
import { UpgradeOption } from '../types';

interface UpgradeModalProps {
  options: UpgradeOption[];
  onSelect: (option: UpgradeOption) => void;
}

const UpgradeModal: React.FC<UpgradeModalProps> = ({ options, onSelect }) => {
  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm animate-fadeIn">
      <div className="bg-gray-800 border-4 border-yellow-500 rounded-xl p-6 max-w-4xl w-full mx-4 shadow-2xl">
        <h2 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-yellow-200 text-center mb-2 drop-shadow-sm">레벨 업!</h2>
        <p className="text-gray-300 text-center mb-8 text-lg">능력을 선택하세요</p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {options.map((opt, idx) => (
            <button
              key={idx}
              onClick={() => onSelect(opt)}
              className="group relative flex flex-col items-center p-6 bg-gray-700/80 hover:bg-gray-600 border-2 border-gray-600 hover:border-yellow-400 rounded-xl transition-all transform hover:-translate-y-2 shadow-lg"
            >
              <div className="text-7xl mb-6 group-hover:scale-110 transition-transform duration-200 filter drop-shadow-lg">
                {opt.icon}
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">{opt.name}</h3>
              <div className="text-sm text-gray-300 text-center h-12 leading-snug">
                {opt.description}
              </div>
              <div className={`mt-6 px-4 py-1 rounded-full text-xs font-black uppercase tracking-wide border
                ${opt.rarity === 'common' ? 'bg-gray-600 border-gray-400 text-gray-200' : ''}
                ${opt.rarity === 'rare' ? 'bg-blue-600 border-blue-400 text-white' : ''}
                ${opt.rarity === 'epic' ? 'bg-purple-600 border-purple-400 text-white' : ''}
              `}>
                {opt.rarity === 'common' ? '일반' : opt.rarity === 'rare' ? '희귀' : '에픽'}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default UpgradeModal;