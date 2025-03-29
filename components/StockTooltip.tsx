'use client';

import React from 'react';
import { StockData, StatusType } from '@/types/stock';

interface StockTooltipProps {
  symbol: string;
  data: StockData[] | null;
  visible: boolean;
  status?: StatusType; // 親から渡される状態
}

// 企業情報のマッピング
const companyInfo: Record<string, { name: string, sector: string }> = {
  'AAPL': { name: 'Apple Inc', sector: 'テクノロジー' },
  'MSFT': { name: 'Microsoft Corp', sector: 'テクノロジー' },
  'GOOGL': { name: 'Alphabet Inc', sector: 'テクノロジー' },
  'AMZN': { name: 'Amazon.com Inc', sector: '消費財' },
  'META': { name: 'Meta Platforms Inc', sector: 'テクノロジー' },
  'TSLA': { name: 'Tesla Inc', sector: '自動車' },
  'NVDA': { name: 'NVIDIA Corp', sector: 'テクノロジー' },
};

// 状態の日本語表記
const statusLabel: Record<string, string> = {
  'surge': '高騰中',
  'up': '上昇中',
  'stable': '安定',
  'down': '下降中',
  'crash': '暴落中',
  'abnormal': '異常',
  'unknown': '不明'
};

const StockTooltip: React.FC<StockTooltipProps> = ({ symbol, data, visible, status = 'unknown' }) => {
  if (!visible || !data || data.length === 0) return null;

  // 最新のデータを取得
  const latestData = data[data.length - 1];
  if (!latestData) return null;

  // データの完全性チェック
  const { open, high, low, close, volume, timestamp } = latestData;
  if (open === undefined || high === undefined || low === undefined ||
    close === undefined || volume === undefined || timestamp === undefined) {
    return null;
  }

  // 前日比を計算（データが十分にある場合）
  const previousData = data.length > 1 ? data[data.length - 2] : null;
  let priceChange = 0;
  let percentChange = 0;
  let changeDirection = '';

  if (previousData && previousData.close !== undefined) {
    priceChange = close - previousData.close;
    percentChange = (priceChange / previousData.close) * 100;
    changeDirection = priceChange > 0 ? '↑' : priceChange < 0 ? '↓' : '';
  }

  // 企業情報
  const company = companyInfo[symbol] || { name: symbol, sector: '不明' };

  // 当日の値動き
  const dayRange = high - low;
  const currentInRange = (close - low) / (dayRange || 1) * 100; // ゼロ除算を防止

  // 日付のフォーマット
  const formatTime = (timestampValue: unknown): string => {
    if (!timestampValue) return '--:--';

    try {
      // timestampがDateオブジェクト、数値、または文字列の場合に対応
      const date = new Date(timestampValue as string | number | Date);
      if (isNaN(date.getTime())) {
        return '--:--'; // 無効な日付の場合
      }
      return date.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' });
    } catch (error) {
      console.error('日付フォーマットエラー:', error);
      return '--:--';
    }
  };

  // パーセント変化に基づいて実際の状態を計算（データの整合性チェック用）
  const calculateActualStatus = (): StatusType => {
    if (Math.abs(percentChange) < 0.1) return 'stable';
    if (percentChange <= -3) return 'crash';
    if (percentChange <= -0.5) return 'down';
    if (percentChange >= 3) return 'surge';
    if (percentChange >= 0.5) return 'up';
    return 'stable';
  };

  // 計算された実際の状態
  const actualStatus = calculateActualStatus();

  // 状態に応じたスタイルとアイコン
  const getStatusStyle = (currentStatus: StatusType) => {
    switch (currentStatus) {
      case 'surge':
        return 'bg-green-600';
      case 'up':
        return 'bg-green-500';
      case 'down':
        return 'bg-red-500';
      case 'crash':
        return 'bg-red-600';
      case 'abnormal':
        return 'bg-yellow-500';
      case 'stable':
        return 'bg-blue-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-30">
      <div className="bg-black bg-opacity-80 text-white rounded-lg p-4 shadow-lg min-w-[220px]">
        <div className="text-center mb-3">
          <h3 className="text-xl font-bold">{symbol}</h3>
          <p className="text-gray-400 text-sm">{company.name}</p>
        </div>

        <div className="text-center mb-3">
          <p className="text-2xl font-bold">${close.toFixed(2)}</p>
          <p className={`text-sm ${priceChange > 0 ? 'text-green-500' : priceChange < 0 ? 'text-red-500' : 'text-gray-400'}`}>
            {changeDirection} {Math.abs(priceChange).toFixed(2)} ({priceChange > 0 ? '+' : ''}{percentChange.toFixed(2)}%)
          </p>
        </div>

        {/* 当日値幅のビジュアル表示 */}
        <div className="mb-3">
          <div className="flex justify-between text-xs mb-1">
            <span>安値: ${low.toFixed(2)}</span>
            <span>高値: ${high.toFixed(2)}</span>
          </div>
          <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500"
              style={{ width: `${currentInRange}%` }}
            ></div>
            <div
              className="h-full w-1 bg-white"
              style={{
                marginTop: '-8px',
                marginLeft: `${currentInRange}%`,
                transform: 'translateX(-50%)'
              }}
            ></div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-1 text-xs text-gray-300">
          <div>始値: ${open.toFixed(2)}</div>
          <div>出来高: {(volume / 1000).toFixed(1)}K</div>
          <div>セクター: {company.sector}</div>
          <div>更新: {formatTime(timestamp)}</div>
        </div>

        {/* 状態表示 - 実際の株価変動を常に反映 */}
        <div className="mt-2 pt-2 border-t border-gray-700 text-center">
          <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${getStatusStyle(actualStatus)}`}>
            {statusLabel[actualStatus]}
          </span>
        </div>
      </div>
      <div className="h-2 w-2 bg-black bg-opacity-80 rotate-45 absolute -bottom-1 left-1/2 -translate-x-1/2"></div>
    </div>
  );
};

export default StockTooltip; 