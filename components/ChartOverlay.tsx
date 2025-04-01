'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { StockData } from '@/types/stock';
import { LogMessage } from '@/hooks/useLogMessages';
import { useStockData } from '@/hooks/useStockData';
import {
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
  Brush
} from 'recharts';

// Temporary company name mapping
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

// Processed stock data with additional fields for chart
interface ProcessedStockData extends StockData {
  dateStr: string;
  ma5?: number;
  ma20?: number;
  changeColor: string;
  isPositive: boolean;
}

// Custom tooltip props
interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ payload: ProcessedStockData }>;
  label?: string;
}

const ChartOverlay: React.FC<ChartOverlayProps> = ({
  symbol,
  onClose,
  addLogMessage
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [chartTimeframe, setChartTimeframe] = useState<'day' | 'week' | 'month'>('day');
  const [showMA, setShowMA] = useState<boolean>(true);
  const [showVolume, setShowVolume] = useState<boolean>(true);

  // useStockData hook to get data
  const stockData = useStockData(symbol);

  // Function to add log message
  const logMessage = (message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info') => {
    if (addLogMessage) {
      addLogMessage({
        text: message,
        type,
        timestamp: new Date()
      });
    }
  };

  // Log message when chart period changes
  useEffect(() => {
    if (stockData) {
      const timeframeText = chartTimeframe === 'day' ? '1 day' : chartTimeframe === 'week' ? '1 week' : '1 month';
      logMessage(`Changed chart display period to ${timeframeText} for ${symbol}`, 'info');
    }
  }, [chartTimeframe, symbol, stockData]);

  useEffect(() => {
    if (stockData) {
      setLoading(false);
      logMessage(`Successfully loaded chart data for ${symbol}`, 'success');
    }
  }, [stockData, symbol]);

  // Error handling if no chart data
  useEffect(() => {
    if (!loading && (!stockData || stockData.length === 0)) {
      setError('Failed to get chart data');
      logMessage(`Failed to get chart data for ${symbol}`, 'error');
    } else {
      setError(null);
    }
  }, [loading, stockData, symbol]);

  // Filter data based on selected period
  const getFilteredData = (): StockData[] => {
    if (!stockData || stockData.length === 0) return [];

    const now = new Date();
    let cutoffDate: Date;

    switch (chartTimeframe) {
      case 'day':
        cutoffDate = new Date(now.getTime() - 24 * 60 * 60 * 1000); // 24 hours ago
        break;
      case 'week':
        cutoffDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); // 1 week ago
        break;
      case 'month':
      default:
        cutoffDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000); // 30 days ago
        break;
    }

    // Filter data
    const filtered = stockData.filter(data => new Date(data.timestamp as string | number | Date) >= cutoffDate);

    // Ensure at least 5 data points (display all data if insufficient)
    return filtered.length >= 5 ? filtered : stockData;
  };

  // Calculate moving averages and prepare data
  const prepareChartData = (data: StockData[]): ProcessedStockData[] => {
    if (!data || data.length === 0) return [];

    // Calculate 5-day Moving Average (MA5) and 20-day Moving Average (MA20)
    const withMovingAverages = data.map((item, index, array) => {
      // 5-day MA calculation
      let ma5 = 0;
      if (index >= 4) {
        const last5 = array.slice(index - 4, index + 1);
        ma5 = last5.reduce((sum, item) => sum + item.close, 0) / 5;
      }

      // 20-day MA calculation
      let ma20 = 0;
      if (index >= 19) {
        const last20 = array.slice(index - 19, index + 1);
        ma20 = last20.reduce((sum, item) => sum + item.close, 0) / 20;
      }

      // Format date for display
      const dateStr = new Date(item.timestamp as string | number | Date).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: chartTimeframe === 'day' ? '2-digit' : undefined,
        minute: chartTimeframe === 'day' ? '2-digit' : undefined
      });

      // Calculate price change colors
      const priceChange = item.close - (item.open ?? item.close);
      const isPositive = priceChange >= 0;
      const changeColor = isPositive ? "#22c55e" : "#ef4444";

      return {
        ...item,
        dateStr,
        ma5: ma5 > 0 ? ma5 : undefined,
        ma20: ma20 > 0 ? ma20 : undefined,
        changeColor,
        isPositive
      };
    });

    return withMovingAverages;
  };

  // Memoize processed data to prevent recalculation on each render
  const processedData = useMemo(() => {
    const filteredData = getFilteredData();
    return prepareChartData(filteredData);
  }, [stockData, chartTimeframe]);

  // Custom tooltip component
  const CustomTooltip: React.FC<CustomTooltipProps> = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white dark:bg-gray-800 p-3 border border-gray-200 dark:border-gray-700 rounded shadow-lg">
          <p className="font-bold text-gray-700 dark:text-gray-300">{data.dateStr}</p>
          <div className="grid grid-cols-2 gap-2 mt-2">
            <div className="text-gray-600 dark:text-gray-400">Open:</div>
            <div className="font-mono">${(data.open ?? data.close).toFixed(2)}</div>

            <div className="text-gray-600 dark:text-gray-400">High:</div>
            <div className="font-mono">${(data.high ?? data.close).toFixed(2)}</div>

            <div className="text-gray-600 dark:text-gray-400">Low:</div>
            <div className="font-mono">${(data.low ?? data.close).toFixed(2)}</div>

            <div className="text-gray-600 dark:text-gray-400">Close:</div>
            <div className={`font-mono ${data.isPositive ? 'text-green-500' : 'text-red-500'}`}>
              ${data.close.toFixed(2)}
            </div>

            {data.volume && (
              <>
                <div className="text-gray-600 dark:text-gray-400">Volume:</div>
                <div className="font-mono">{(data.volume / 1000000).toFixed(2)}M</div>
              </>
            )}

            {data.ma5 && showMA && (
              <>
                <div className="text-gray-600 dark:text-gray-400">MA5:</div>
                <div className="font-mono text-blue-500">${data.ma5.toFixed(2)}</div>
              </>
            )}

            {data.ma20 && showMA && (
              <>
                <div className="text-gray-600 dark:text-gray-400">MA20:</div>
                <div className="font-mono text-purple-500">${data.ma20.toFixed(2)}</div>
              </>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  // Render chart
  const renderChart = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading chart data...</p>
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

    if (processedData.length === 0) {
      return (
        <div className="flex items-center justify-center h-full text-gray-500">
          No data found for the selected period
        </div>
      );
    }

    // Calculate price change for market summary
    const firstClose = processedData[0]?.close || 0;
    const lastClose = processedData[processedData.length - 1]?.close || 0;
    const priceChange = lastClose - firstClose;
    const percentChange = ((priceChange / firstClose) * 100).toFixed(2);
    const isPositive = priceChange >= 0;

    // Calculate statistics
    const highPrice = Math.max(...processedData.map(d => d.high ?? d.close));
    const lowPrice = Math.min(...processedData.map(d => d.low ?? d.close));
    const avgVolume = processedData.reduce((sum, d) => sum + (d.volume ?? 0), 0) / processedData.length;

    return (
      <div className="h-full flex flex-col">
        {/* Market Summary */}
        <div className="mb-4 flex justify-between items-center">
          <div>
            <div className="text-3xl font-bold">${lastClose.toFixed(2)}</div>
            <div className={`text-sm ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
              {isPositive ? '↑' : '↓'} ${Math.abs(priceChange).toFixed(2)} ({isPositive ? '+' : ''}{percentChange}%)
            </div>
          </div>
          <div className="text-right text-gray-500 text-sm">
            <div>High: ${highPrice.toFixed(2)}</div>
            <div>Low: ${lowPrice.toFixed(2)}</div>
            <div>Avg Vol: {(avgVolume / 1000000).toFixed(2)}M</div>
          </div>
        </div>

        {/* Controls */}
        <div className="mb-4 flex flex-wrap justify-between items-center">
          <div className="flex space-x-2 mb-2 sm:mb-0">
            <button
              onClick={() => setShowMA(!showMA)}
              className={`px-3 py-1 text-xs rounded ${showMA ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300'}`}
            >
              Moving Averages
            </button>
            <button
              onClick={() => setShowVolume(!showVolume)}
              className={`px-3 py-1 text-xs rounded ${showVolume ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300'}`}
            >
              Volume
            </button>
          </div>
        </div>

        {/* Advanced Chart */}
        <div className="flex-1">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={processedData}
              margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
              <XAxis
                dataKey="dateStr"
                tick={{ fontSize: 10 }}
                tickCount={5}
              />
              <YAxis
                yAxisId="price"
                domain={['auto', 'auto']}
                orientation="right"
                tickFormatter={(value) => `$${value.toFixed(0)}`}
              />
              {showVolume && (
                <YAxis
                  yAxisId="volume"
                  orientation="left"
                  tickFormatter={(value) => `${(value / 1000000).toFixed(0)}M`}
                  domain={[0, 'dataMax']}
                />
              )}
              <Tooltip content={<CustomTooltip />} />
              <Legend />

              {/* Price Candlestick representation using scatter & reference line */}
              {processedData.map((entry, index) => (
                <React.Fragment key={index}>
                  {/* Vertical line from low to high */}
                  <ReferenceLine
                    yAxisId="price"
                    segment={[
                      { x: entry.dateStr, y: entry.low ?? entry.close },
                      { x: entry.dateStr, y: entry.high ?? entry.close }
                    ]}
                    stroke={entry.changeColor}
                    strokeWidth={1}
                    ifOverflow="extendDomain"
                  />
                </React.Fragment>
              ))}

              {/* Close price line */}
              <Line
                yAxisId="price"
                type="monotone"
                dataKey="close"
                stroke="#0369a1"
                strokeWidth={1.5}
                dot={false}
                name="Close Price"
              />

              {/* Moving Averages */}
              {showMA && (
                <>
                  <Line
                    yAxisId="price"
                    type="monotone"
                    dataKey="ma5"
                    stroke="#3b82f6"
                    strokeWidth={1}
                    dot={false}
                    name="MA5"
                  />
                  <Line
                    yAxisId="price"
                    type="monotone"
                    dataKey="ma20"
                    stroke="#a855f7"
                    strokeWidth={1}
                    dot={false}
                    name="MA20"
                  />
                </>
              )}

              {/* Volume bars */}
              {showVolume && (
                <Bar
                  yAxisId="volume"
                  dataKey="volume"
                  name="Volume"
                  barSize={5}
                  opacity={0.5}
                  fill="#6b7280"
                />
              )}

              {/* Brush for zoom/pan */}
              <Brush
                dataKey="dateStr"
                height={20}
                stroke="#8884d8"
                startIndex={Math.max(0, processedData.length - Math.min(20, processedData.length))}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  };

  // Get company name
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
                1 day
              </button>
              <button
                onClick={() => setChartTimeframe('week')}
                className={`px-3 py-1 text-sm ${chartTimeframe === 'week' ? 'bg-blue-500 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'}`}
              >
                1 week
              </button>
              <button
                onClick={() => setChartTimeframe('month')}
                className={`px-3 py-1 text-sm ${chartTimeframe === 'month' ? 'bg-blue-500 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'}`}
              >
                1 month
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