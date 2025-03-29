'use client';

import React from 'react';
import { StockData, StatusType } from '@/types/stock';

interface StockTooltipProps {
  symbol: string;
  data: StockData[] | null;
  visible: boolean;
  status?: StatusType;
}

// Mapping of company information
const companyInfo: Record<string, { name: string, sector: string }> = {
  'AAPL': { name: 'Apple Inc', sector: 'Technology' },
  'MSFT': { name: 'Microsoft Corp', sector: 'Technology' },
  'GOOGL': { name: 'Alphabet Inc', sector: 'Technology' },
  'AMZN': { name: 'Amazon.com Inc', sector: 'Consumer Goods' },
  'META': { name: 'Meta Platforms Inc', sector: 'Technology' },
  'TSLA': { name: 'Tesla Inc', sector: 'Automobile' },
  'NVDA': { name: 'NVIDIA Corp', sector: 'Technology' },
};

// English labels for status
const statusLabel: Record<string, string> = {
  'surge': 'Surging',
  'up': 'Rising',
  'stable': 'Stable',
  'down': 'Falling',
  'crash': 'Crashing',
  'abnormal': 'Abnormal',
  'unknown': 'Unknown'
};

const StockTooltip: React.FC<StockTooltipProps> = ({ symbol, data, visible, status = 'unknown' }) => {
  if (!visible || !data || data.length === 0) return null;

  // Get the latest data
  const latestData = data[data.length - 1];
  if (!latestData) return null;

  // Check data integrity
  const { open, high, low, close, volume, timestamp } = latestData;
  if (open === undefined || high === undefined || low === undefined ||
    close === undefined || volume === undefined || timestamp === undefined) {
    return null;
  }

  // Calculate change from previous day (if sufficient data)
  const previousData = data.length > 1 ? data[data.length - 2] : null;
  let priceChange = 0;
  let percentChange = 0;
  let changeDirection = '';

  if (previousData && previousData.close !== undefined) {
    priceChange = close - previousData.close;
    percentChange = (priceChange / previousData.close) * 100;
    changeDirection = priceChange > 0 ? '↑' : priceChange < 0 ? '↓' : '';
  }

  // Company information
  const company = companyInfo[symbol] || { name: symbol, sector: 'Unknown' };

  // Daily price movement
  const dayRange = high - low;
  const currentInRange = (close - low) / (dayRange || 1) * 100; // Prevent division by zero

  // Format the date
  const formatTime = (timestampValue: unknown): string => {
    if (!timestampValue) return '--:--';

    try {
      // timestamp can be Date object, number, or string
      const date = new Date(timestampValue as string | number | Date);
      if (isNaN(date.getTime())) {
        return '--:--'; // Invalid date format
      }
      return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    } catch (error) {
      console.error('Date formatting error:', error);
      return '--:--';
    }
  };

  // Calculate actual status based on percentage change (for data consistency check)
  const calculateActualStatus = (): StatusType => {
    if (Math.abs(percentChange) < 0.1) return 'stable';
    if (percentChange <= -3) return 'crash';
    if (percentChange <= -0.5) return 'down';
    if (percentChange >= 3) return 'surge';
    if (percentChange >= 0.5) return 'up';
    return 'stable';
  };

  // Calculated actual status
  const actualStatus = calculateActualStatus();

  // Style and icon based on status
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

        {/* Daily price range visual representation */}
        <div className="mb-3">
          <div className="flex justify-between text-xs mb-1">
            <span>Low: ${low.toFixed(2)}</span>
            <span>High: ${high.toFixed(2)}</span>
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
          <div>Open: ${open.toFixed(2)}</div>
          <div>Volume: {(volume / 1000).toFixed(1)}K</div>
          <div>Sector: {company.sector}</div>
          <div>Updated: {formatTime(timestamp)}</div>
        </div>

        {/* Status display - actual stock movement always reflected */}
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