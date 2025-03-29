'use client';

import React, { useState, useEffect } from 'react';
import { StockData } from '@/types/stock';
import { LogMessage } from '@/hooks/useLogMessages';
import { useStockData } from '@/hooks/useStockData';
import InfoCanvas from "./InfoCanvas";

// 仮の会社名マッピング
const companyNames: Record<string, string> = {
  'AAPL': 'Apple Inc.',
  'TSLA': 'Tesla, Inc.',
  'NVDA': 'NVIDIA Corporation',
  'MSFT': 'Microsoft Corporation',
  'AMZN': 'Amazon.com, Inc.',
  'GOOGL': 'Alphabet Inc. (Google)',
  'META': 'Meta Platforms, Inc.'
};

interface ChartOverlayProps {
  symbol: string;
  onClose: () => void;
  addLogMessage?: (message: LogMessage) => void;
}

const ChartOverlay: React.FC<ChartOverlayProps> = ({
  symbol,
  onClose,
  addLogMessage
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [chartTimeframe, setChartTimeframe] = useState<'day' | 'week' | 'month'>('day');

  // useStockDataフックを使ってデータを取得
  const stockData = useStockData(symbol);

  // ログメッセージを追加する関数
  const logMessage = (message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info') => {
    if (addLogMessage) {
      addLogMessage({
        text: message,
        type,
        timestamp: new Date()
      });
    }
  };

  // チャート期間が変更されたときにログを表示
  useEffect(() => {
    if (stockData) {
      const timeframeText = chartTimeframe === 'day' ? '1日' : chartTimeframe === 'week' ? '1週間' : '1ヶ月';
      logMessage(`${symbol}のチャート表示期間を${timeframeText}に変更しました`, 'info');
    }
  }, [chartTimeframe, symbol, stockData]);

  useEffect(() => {
    if (stockData) {
      setLoading(false);
      logMessage(`${symbol}のチャートデータを正常に読み込みました`, 'success');
    }
  }, [stockData, symbol]);

  // チャートデータがない場合のエラー処理
  useEffect(() => {
    if (!loading && (!stockData || stockData.length === 0)) {
      setError('チャートデータを取得できませんでした');
      logMessage(`${symbol}のチャートデータ取得に失敗しました`, 'error');
    } else {
      setError(null);
    }
  }, [loading, stockData, symbol]);

  // 選択された期間に基づいてデータをフィルタリング
  const getFilteredData = (): StockData[] => {
    if (!stockData || stockData.length === 0) return [];

    const now = new Date();
    let cutoffDate: Date;

    switch (chartTimeframe) {
      case 'day':
        cutoffDate = new Date(now.getTime() - 24 * 60 * 60 * 1000); // 24時間前
        break;
      case 'week':
        cutoffDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); // 1週間前
        break;
      case 'month':
      default:
        cutoffDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000); // 30日前
        break;
    }

    // フィルタリングしたデータを返す
    const filtered = stockData.filter(data => new Date(data.timestamp) >= cutoffDate);

    // 最低5件のデータを確保（不足する場合はすべてのデータを表示）
    return filtered.length >= 5 ? filtered : stockData;
  };

  // チャートのレンダリング
  const renderChart = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-4 text-gray-600">チャートデータを読み込み中...</p>
          </div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex items-center justify-center h-full">
          <div className="text-center text-red-500">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="mt-4">{error}</p>
          </div>
        </div>
      );
    }

    const filteredData = getFilteredData();
    console.log(`期間: ${chartTimeframe}, フィルタ後データ数: ${filteredData.length}`);

    if (filteredData.length === 0) {
      return (
        <div className="flex items-center justify-center h-full text-gray-500">
          選択された期間のデータがありません
        </div>
      );
    }

    // 最高値と最安値を計算
    const maxPrice = Math.max(...filteredData.map(d => d.high));
    const minPrice = Math.min(...filteredData.map(d => d.low));
    const range = maxPrice - minPrice;
    const paddedMax = maxPrice + range * 0.1; // 10%のパディングを追加
    const paddedMin = Math.max(0, minPrice - range * 0.1);

    // 価格上昇/下落の判定
    const firstClose = filteredData[0]?.close || 0;
    const lastClose = filteredData[filteredData.length - 1]?.close || 0;
    const priceChange = lastClose - firstClose;
    const percentChange = ((priceChange / firstClose) * 100).toFixed(2);
    const isPositive = priceChange >= 0;

    // 日付フォーマット設定
    const dateFormat: Intl.DateTimeFormatOptions =
      chartTimeframe === 'day'
        ? { hour: '2-digit', minute: '2-digit' }
        : chartTimeframe === 'week'
          ? { month: 'numeric', day: 'numeric', hour: '2-digit' }
          : { month: 'numeric', day: 'numeric' };

    return (
      <div className="h-full flex flex-col">
        {/* 価格概要 */}
        <div className="mb-4 flex justify-between items-center">
          <div>
            <div className="text-3xl font-bold">${lastClose.toFixed(2)}</div>
            <div className={`text-sm ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
              {isPositive ? '↑' : '↓'} ${Math.abs(priceChange).toFixed(2)} ({isPositive ? '+' : ''}{percentChange}%)
            </div>
          </div>
          <div className="text-right text-gray-500 text-sm">
            <div>高値: ${Math.max(...filteredData.map(d => d.high)).toFixed(2)}</div>
            <div>安値: ${Math.min(...filteredData.map(d => d.low)).toFixed(2)}</div>
            <div>出来高: {(filteredData.reduce((sum, d) => sum + d.volume, 0) / 1000000).toFixed(2)}M</div>
          </div>
        </div>

        {/* チャート描画エリア */}
        <div className="flex-1 relative">
          {/* チャートのSVG */}
          <svg className="w-full h-full" viewBox={`0 0 ${filteredData.length} ${paddedMax - paddedMin}`} preserveAspectRatio="none">
            {/* 価格ライン */}
            <path
              d={filteredData.map((d, i) => {
                const x = i;
                const y = paddedMax - d.close;
                return i === 0 ? `M ${x} ${y}` : `L ${x} ${y}`;
              }).join(' ')}
              stroke={isPositive ? "#22c55e" : "#ef4444"}
              strokeWidth="2"
              fill="none"
            />

            {/* ローソク足の代わりに価格範囲を表示 */}
            {filteredData.map((d, i) => {
              const x = i;
              const yHigh = paddedMax - d.high;
              const yLow = paddedMax - d.low;
              return (
                <line
                  key={i}
                  x1={x}
                  y1={yHigh}
                  x2={x}
                  y2={yLow}
                  stroke={d.close >= d.open ? "#22c55e" : "#ef4444"}
                  strokeWidth="1"
                />
              );
            })}
          </svg>

          {/* X軸ラベル（時間または日付） */}
          <div className="absolute bottom-0 left-0 right-0 flex justify-between text-xs text-gray-500">
            {filteredData.length > 0 && (
              <>
                <div>{new Date(filteredData[0].timestamp).toLocaleString('ja-JP', dateFormat)}</div>
                {filteredData.length > 2 && (
                  <div>{new Date(filteredData[Math.floor(filteredData.length / 2)].timestamp).toLocaleString('ja-JP', dateFormat)}</div>
                )}
                <div>{new Date(filteredData[filteredData.length - 1].timestamp).toLocaleString('ja-JP', dateFormat)}</div>
              </>
            )}
          </div>

          {/* Y軸ラベル（価格） */}
          <div className="absolute top-0 bottom-0 right-0 flex flex-col justify-between text-xs text-gray-500">
            <div>${paddedMax.toFixed(2)}</div>
            <div>${((paddedMax + paddedMin) / 2).toFixed(2)}</div>
            <div>${paddedMin.toFixed(2)}</div>
          </div>
        </div>
      </div>
    );
  };

  // 会社名を取得
  const companyName = companyNames[symbol] || symbol;

  return (
    <div className="fixed inset-0 z-40 bg-black bg-opacity-80 flex items-center justify-center">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold dark:text-white">
            {symbol} <span className="text-gray-500 text-base font-normal">({companyName})</span>
          </h2>
          <div className="flex space-x-2">
            <div className="flex rounded-lg border overflow-hidden">
              <button
                onClick={() => setChartTimeframe('day')}
                className={`px-3 py-1 text-sm ${chartTimeframe === 'day' ? 'bg-blue-500 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'}`}
              >
                1日
              </button>
              <button
                onClick={() => setChartTimeframe('week')}
                className={`px-3 py-1 text-sm ${chartTimeframe === 'week' ? 'bg-blue-500 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'}`}
              >
                1週間
              </button>
              <button
                onClick={() => setChartTimeframe('month')}
                className={`px-3 py-1 text-sm ${chartTimeframe === 'month' ? 'bg-blue-500 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'}`}
              >
                1ヶ月
              </button>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
        <div className="h-96 bg-white dark:bg-gray-800 rounded-lg">
          {renderChart()}
        </div>
      </div>
    </div>
  );
};

export default ChartOverlay;