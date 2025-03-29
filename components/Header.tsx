'use client';

import React, { useState, useEffect } from 'react';
import { useInterval, IntervalType } from '@/contexts/IntervalContext';
import { LogMessage } from '@/hooks/useLogMessages';

interface HeaderProps {
  addLogMessage?: (message: LogMessage) => void;
}

const Header: React.FC<HeaderProps> = ({ addLogMessage }) => {
  const { interval, setInterval } = useInterval();
  const [currentTime, setCurrentTime] = useState(new Date());

  // 時計の更新
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // インターバルが変更されたときにログメッセージを追加
  const handleIntervalChange = (newInterval: IntervalType) => {
    setInterval(newInterval);

    // ログメッセージの追加（もし利用可能なら）
    if (addLogMessage) {
      addLogMessage({
        text: `データ更新間隔を${newInterval}に変更しました`,
        type: 'info',
        timestamp: new Date()
      });
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-20 bg-black bg-opacity-80 text-white p-4">
      <div className="container mx-auto flex justify-between items-center">
        <div className="flex items-center">
          <h1 className="text-xl font-bold mr-4">InfoCanvas</h1>
          <div className="text-sm hidden md:block">
            リアルタイム株価データダッシュボード
          </div>
        </div>
        <div className="flex items-center space-x-4">
          {/* インターバル選択 */}
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-300">更新間隔:</span>
            <select
              value={interval}
              onChange={(e) => handleIntervalChange(e.target.value as IntervalType)}
              className="bg-gray-800 text-white border border-gray-600 rounded px-2 py-1 text-sm"
            >
              <option value="1min">1分</option>
              <option value="5min">5分</option>
              <option value="15min">15分</option>
              <option value="30min">30分</option>
              <option value="60min">1時間</option>
              <option value="daily">日次</option>
            </select>
          </div>

          {/* 時計表示 */}
          <div className="text-sm font-mono bg-gray-800 px-3 py-1 rounded-full">
            {currentTime.toLocaleTimeString('ja-JP', {
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit'
            })}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header; 