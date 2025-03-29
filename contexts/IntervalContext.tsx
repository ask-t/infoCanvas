'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

// 利用可能なインターバルの定義
export type IntervalType = '1min' | '5min' | '15min' | '30min' | '60min' | 'daily';

interface IntervalContextType {
  interval: IntervalType;
  setInterval: (interval: IntervalType) => void;
}

// デフォルト値を持つコンテキストを作成
const defaultContext: IntervalContextType = {
  interval: '5min', // デフォルトは5分間隔
  setInterval: () => { }
};

// デフォルト値を持つコンテキストを作成
const IntervalContext = createContext<IntervalContextType>(defaultContext);

// コンテキストプロバイダーコンポーネント
export const IntervalProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // クライアントサイドでのみレンダリングされるように
  const [isClient, setIsClient] = useState(false);
  const [interval, setIntervalState] = useState<IntervalType>(defaultContext.interval);

  // クライアントサイドでのみ実行されるようにする
  useEffect(() => {
    setIsClient(true);
  }, []);

  const setInterval = (newInterval: IntervalType) => {
    setIntervalState(newInterval);
  };

  // サーバーサイドレンダリング時のデフォルト値をシミュレート
  if (!isClient) {
    return (
      <IntervalContext.Provider value={defaultContext}>
        {children}
      </IntervalContext.Provider>
    );
  }

  return (
    <IntervalContext.Provider value={{ interval, setInterval }}>
      {children}
    </IntervalContext.Provider>
  );
};

// カスタムフック - インターバルコンテキストにアクセスするため
export const useInterval = () => useContext(IntervalContext);

export default IntervalContext; 