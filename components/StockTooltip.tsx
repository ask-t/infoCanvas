import React from 'react';
import { StockData } from '@/types/stock';

interface StockTooltipProps {
  symbol: string;
  data: StockData[] | null;
  visible: boolean;
}

const StockTooltip: React.FC<StockTooltipProps> = ({ symbol, data, visible }) => {
  if (!visible) return null;

  // データがない場合
  if (!data || data.length === 0) {
    return (
      <div className="absolute -top-24 left-1/2 -translate-x-1/2 bg-black bg-opacity-80 text-white p-3 rounded-md shadow-lg z-30 min-w-[180px]">
        <h3 className="font-bold text-center">{symbol}</h3>
        <p className="text-xs text-center">データ読み込み中...</p>
      </div>
    );
  }

  // 最新の株価データを取得
  const latest = data[data.length - 1];
  const previous = data.length > 1 ? data[data.length - 2] : null;

  // 前日比の計算
  const change = previous ? latest.close - previous.close : 0;
  const changePercent = previous ? (change / previous.close) * 100 : 0;

  // 上昇/下落の判定
  const isUp = change > 0;
  const changeColor = isUp ? 'text-green-500' : change < 0 ? 'text-red-500' : 'text-gray-400';

  return (
    <div className="absolute -top-24 left-1/2 -translate-x-1/2 bg-black bg-opacity-80 text-white p-3 rounded-md shadow-lg z-30 min-w-[180px]">
      <h3 className="font-bold text-center">{symbol}</h3>
      <div className="text-center mt-1">
        <p className="text-lg font-semibold">{latest.close.toFixed(2)}</p>
        <p className={`text-xs ${changeColor}`}>
          {isUp ? '▲' : '▼'} {Math.abs(change).toFixed(2)} ({Math.abs(changePercent).toFixed(2)}%)
        </p>
      </div>
      <div className="text-xs mt-2 grid grid-cols-2 gap-x-2">
        <span className="text-gray-400">出来高:</span>
        <span className="text-right">{latest.volume?.toLocaleString?.() || 'N/A'}</span>
      </div>
    </div>
  );
};

export default StockTooltip; 