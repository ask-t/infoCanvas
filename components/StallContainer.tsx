'use client';

import React, { useEffect, useState } from 'react';
import { DashboardItem, StatusType, StockData } from '@/types/stock';
import StallItem from './StallItem';

interface StallContainerProps {
  dashboardConfig: DashboardItem[];
  stockDataBySymbol: Record<string, StockData[] | null>;
  demoState?: string | null;
  onOpenChart: (symbol: string) => void;
}

const StallContainer: React.FC<StallContainerProps> = ({
  dashboardConfig,
  stockDataBySymbol,
  demoState,
  onOpenChart
}) => {
  // 各銘柄の状態を管理
  const [stockStatus, setStockStatus] = useState<Record<string, StatusType>>({});

  // デモステートが設定されている場合、すべての銘柄に同じステータスを適用
  useEffect(() => {
    if (demoState) {
      const statusMap: Record<string, StatusType> = {};

      // デモステートに基づいてステータスを設定
      dashboardConfig.forEach(item => {
        switch (demoState) {
          case 'surge':
            statusMap[item.symbol] = 'surge';
            break;
          case 'up':
            statusMap[item.symbol] = 'up';
            break;
          case 'stable':
            statusMap[item.symbol] = 'stable';
            break;
          case 'down':
            statusMap[item.symbol] = 'down';
            break;
          case 'crash':
            statusMap[item.symbol] = 'crash';
            break;
          case 'abnormal':
            statusMap[item.symbol] = 'abnormal';
            break;
          default:
            statusMap[item.symbol] = 'unknown';
        }
      });

      setStockStatus(statusMap);
      console.log('デモモード適用:', demoState, statusMap);
      return; // デモモードの場合、リアルタイムデータに基づく判定はスキップ
    }

    // デモモードでない場合、株価データに基づいて状態を判定
    const newStatusMap: Record<string, StatusType> = {};

    dashboardConfig.forEach(item => {
      const symbol = item.symbol;
      const data = stockDataBySymbol[symbol];

      if (!data || data.length < 2) {
        newStatusMap[symbol] = 'unknown';
        return;
      }

      // 直近の価格変化を分析
      const latestData = data[data.length - 1];
      const previousData = data.length > 1 ? data[data.length - 2] : null;

      if (!latestData || !previousData || latestData.close === undefined || previousData.close === undefined) {
        newStatusMap[symbol] = 'unknown';
        return;
      }

      // 前回比での価格変化率（短期変動）
      const priceChange = latestData.close - previousData.close;
      const percentChange = (priceChange / previousData.close) * 100;

      // 短期変動に基づいて状態を判定（パーセント変化を優先）
      let status: StatusType;

      // 明確な判断基準を設定
      if (percentChange <= -3) {
        status = 'crash'; // 3%以上の急激な下落で暴落
      } else if (percentChange <= -0.5) {
        status = 'down'; // 0.5-3%の下落で下降
      } else if (percentChange >= 3) {
        status = 'surge'; // 3%以上の急激な上昇で高騰
      } else if (percentChange >= 0.5) {
        status = 'up'; // 0.5-3%の上昇で上昇
      } else {
        // 変動が小さい場合は安定と判断
        status = 'stable';
      }

      // 長期的な傾向も考慮
      if (status === 'stable' && data.length >= 5) {
        const olderData = data[data.length - 5];
        if (olderData && olderData.close !== undefined) {
          const longTermChange = ((latestData.close - olderData.close) / olderData.close) * 100;

          // 長期的な下降傾向があれば反映
          if (longTermChange <= -5) {
            status = 'down';
          }
          // 長期的な上昇傾向があれば反映
          else if (longTermChange >= 5) {
            status = 'up';
          }
        }
      }

      newStatusMap[symbol] = status;

      // デバッグログ
      console.log(`${symbol}: 現在値=${latestData.close.toFixed(2)}, 変化=${percentChange.toFixed(2)}%, 状態=${status}`);
    });

    setStockStatus(newStatusMap);
  }, [dashboardConfig, stockDataBySymbol, demoState]);

  return (
    <div className="relative z-10 w-full h-screen">
      {dashboardConfig.map((item) => (
        <StallItem
          key={item.symbol}
          item={item}
          status={stockStatus[item.symbol] || 'unknown'}
          stockData={stockDataBySymbol[item.symbol]}
          onOpenChart={onOpenChart}
        />
      ))}
    </div>
  );
};

export default StallContainer; 