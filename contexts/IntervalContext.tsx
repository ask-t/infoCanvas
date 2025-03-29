'use client';

import React, { createContext, useState, useContext, ReactNode } from 'react';

// 利用可能なインターバルの定義
export type IntervalType = '1min' | '5min' | '15min' | '30min' | '60min' | 'daily';

interface IntervalContextType {
  interval: IntervalType;
  setInterval: (interval: IntervalType) => void;
}

// デフォルト値を持つコンテキストを作成
const IntervalContext = createContext<IntervalContextType>({
  interval: '5min', // デフォルトは5分間隔
  setInterval: () => { },
});

// コンテキストプロバイダーコンポーネント
export const IntervalProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [interval, setInterval] = useState<IntervalType>('5min');

  return (
    <IntervalContext.Provider value={{ interval, setInterval }}>
      {children}
    </IntervalContext.Provider>
  );
};

// カスタムフック - インターバルコンテキストにアクセスするため
export const useInterval = () => useContext(IntervalContext);

export default IntervalContext; 