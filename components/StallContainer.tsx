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
  // Manage the status of each stock
  const [stockStatus, setStockStatus] = useState<Record<string, StatusType>>({});

  // If a demo state is set, apply the same status to all stocks
  useEffect(() => {
    if (demoState) {
      const statusMap: Record<string, StatusType> = {};

      // Set status based on demo state
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
      console.log('Apply demo mode:', demoState, statusMap);
      return; // If in demo mode, skip real-time data-based determination
    }

    // If not in demo mode, determine status based on stock data
    const newStatusMap: Record<string, StatusType> = {};

    dashboardConfig.forEach(item => {
      const symbol = item.symbol;
      const data = stockDataBySymbol[symbol];

      if (!data || data.length < 2) {
        newStatusMap[symbol] = 'unknown';
        return;
      }

      // Analyze recent price changes
      const latestData = data[data.length - 1];
      const previousData = data.length > 1 ? data[data.length - 2] : null;

      if (!latestData || !previousData || latestData.close === undefined || previousData.close === undefined) {
        newStatusMap[symbol] = 'unknown';
        return;
      }

      // Calculate percentage change from previous data (short-term fluctuation)
      const priceChange = latestData.close - previousData.close;
      const percentChange = (priceChange / previousData.close) * 100;

      // Set clear criteria for judgment
      let status: StatusType;

      // Set status based on percentage change
      if (percentChange <= -3) {
        status = 'crash'; // If price drops by 3% or more, it's a crash
      } else if (percentChange <= -0.5) {
        status = 'down'; // If price drops between 0.5% and 3%, it's a decline
      } else if (percentChange >= 3) {
        status = 'surge'; // If price rises by 3% or more, it's a surge
      } else if (percentChange >= 0.5) {
        status = 'up'; // If price rises between 0.5% and 3%, it's an increase
      } else {
        // If the change is small, consider it stable
        status = 'stable';
      }

      // Consider long-term trends as well
      if (status === 'stable' && data.length >= 5) {
        const olderData = data[data.length - 5];
        if (olderData && olderData.close !== undefined) {
          const longTermChange = ((latestData.close - olderData.close) / olderData.close) * 100;

          // Reflect long-term downward trend if any
          if (longTermChange <= -5) {
            status = 'down';
          }
          // Reflect long-term upward trend if any
          else if (longTermChange >= 5) {
            status = 'up';
          }
        }
      }

      newStatusMap[symbol] = status;

      // Debug log
      console.log(`${symbol}: Current value=${latestData.close.toFixed(2)}, Change=${percentChange.toFixed(2)}%, Status=${status}`);
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