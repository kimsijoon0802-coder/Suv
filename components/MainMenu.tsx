import React from 'react';

interface MainMenuProps {
  onStart: () => void;
  score?: number;
  gameOver: boolean;
}

const MainMenu: React.FC<MainMenuProps> = ({ onStart, score, gameOver }) => {
  return (
    <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-gray-900 text-white">
      <div className="text-center max-w-md px-6">
        <h1 className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-b from-yellow-400 to-orange-600 mb-4 filter drop-shadow-lg">
          탕탕특공대
          <span className="block text-2xl text-white mt-2 tracking-widest font-bold">웹 버전</span>
        </h1>
        
        {gameOver && (
          <div className="mb-8 p-6 bg-red-900/30 border border-red-500/50 rounded-lg backdrop-blur">
            <h2 className="text-3xl font-bold text-red-400 mb-2">게임 오버</h2>
            <p className="text-xl text-gray-300">처치한 적: <span className="text-white font-bold">{score}</span></p>
          </div>
        )}

        <div className="space-y-4">
          <button
            onClick={onStart}
            className="w-full py-4 px-8 text-xl font-bold bg-gradient-to-r from-green-500 to-green-700 rounded-full shadow-lg hover:shadow-green-500/50 hover:scale-105 transition-all active:scale-95"
          >
            {gameOver ? '다시 시작' : '전투 시작'}
          </button>
          
          <div className="text-gray-500 text-sm mt-8">
            <p>PC: WASD 이동</p>
            <p>모바일: 화면 드래그</p>
            <p className="mt-2 opacity-50">공격은 자동으로 발사됩니다.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MainMenu;