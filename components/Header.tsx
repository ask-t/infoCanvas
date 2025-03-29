import React from 'react';

const Header: React.FC = () => {
  return (
    <div className="absolute top-0 left-0 z-20 w-full bg-black bg-opacity-70 text-white px-6 py-4 flex items-center justify-between">
      <h1 className="text-xl font-bold">InfoCanvas</h1>
      <div className="flex gap-4">
        <button className="bg-white text-black px-4 py-1 rounded hover:bg-gray-200 transition" onClick={() => location.href = '?mode=live'}>
          ライブ表示
        </button>
        <button className="bg-white text-black px-4 py-1 rounded hover:bg-gray-200 transition" onClick={() => location.href = '?mode=demo&state=surge'}>
          高騰デモ
        </button>
        <button className="bg-white text-black px-4 py-1 rounded hover:bg-gray-200 transition" onClick={() => location.href = '?mode=demo&state=up'}>
          上昇デモ
        </button>
        <button className="bg-white text-black px-4 py-1 rounded hover:bg-gray-200 transition" onClick={() => location.href = '?mode=demo&state=stable'}>
          安定デモ
        </button>
        <button className="bg-white text-black px-4 py-1 rounded hover:bg-gray-200 transition" onClick={() => location.href = '?mode=demo&state=crash'}>
          暴落デモ
        </button>
        <button className="bg-white text-black px-4 py-1 rounded hover:bg-gray-200 transition" onClick={() => location.href = '?mode=demo&state=down'}>
          下落デモ
        </button>
        <button className="bg-white text-black px-4 py-1 rounded hover:bg-gray-200 transition" onClick={() => location.href = '?mode=demo&state=abnormal'}>
          異常デモ
        </button>
        <button className="bg-white text-black px-4 py-1 rounded hover:bg-gray-200 transition" onClick={() => location.href = '?mode=demo&state=unknown'}>
          不明デモ
        </button>
      </div>
    </div>
  );
};

export default Header; 