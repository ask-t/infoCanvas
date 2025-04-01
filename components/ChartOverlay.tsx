'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { StockData } from '@/types/stock';
import { LogMessage } from '@/hooks/useLogMessages';
import { useStockData, ExtendedIntervalType } from '@/hooks/useStockData';
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

// Time frame options
type TimeFrame = 'day' | 'week' | 'month';

// API rate limit note
const API_RATE_LIMIT_NOTE = "Note: Alpha Vantage API has a limit of 25 requests per day. Demo data will be displayed when the limit is reached.";

const ChartOverlay: React.FC<ChartOverlayProps> = ({
  symbol,
  onClose,
  addLogMessage
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [chartTimeframe, setChartTimeframe] = useState<TimeFrame>('day');
  const [showMA, setShowMA] = useState<boolean>(true);
  const [showVolume, setShowVolume] = useState<boolean>(true);
  const [isUsingDemoData, setIsUsingDemoData] = useState<boolean>(false);

  // Map chart timeframe to API parameter
  const timeframeParam = useMemo<ExtendedIntervalType>(() => {
    switch (chartTimeframe) {
      case 'day': return '60min'; // Use 60min for daily view
      case 'week': return 'weekly';
      case 'month': return 'monthly';
      default: return '60min';
    }
  }, [chartTimeframe]);

  // Get stock data using the appropriate API endpoint
  const stockData = useStockData(symbol, timeframeParam);

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
  }, [chartTimeframe, symbol, stockData, logMessage]);

  useEffect(() => {
    if (stockData) {
      setLoading(false);
      logMessage(`Successfully loaded ${chartTimeframe} chart data for ${symbol}`, 'success');
    }
  }, [stockData, symbol, chartTimeframe, logMessage]);

  // Error handling if no chart data
  useEffect(() => {
    if (!loading && (!stockData || stockData.length === 0)) {
      setError('Failed to get chart data');
      logMessage(`Failed to get chart data for ${symbol}`, 'error');
    } else {
      setError(null);
    }
  }, [loading, stockData, symbol, logMessage]);

  // Effect to detect demo data
  useEffect(() => {
    if (stockData && stockData.length >= 3) {
      // Check if timestamps are too regular (a sign of demo data)
      const ts0 = stockData[0].timestamp instanceof Date
        ? stockData[0].timestamp.getTime()
        : new Date(stockData[0].timestamp as string | number).getTime();

      const ts1 = stockData[1].timestamp instanceof Date
        ? stockData[1].timestamp.getTime()
        : new Date(stockData[1].timestamp as string | number).getTime();

      const ts2 = stockData[2].timestamp instanceof Date
        ? stockData[2].timestamp.getTime()
        : new Date(stockData[2].timestamp as string | number).getTime();

      const interval1 = ts1 - ts0;
      const interval2 = ts2 - ts1;

      // If intervals are within 1 second of each other, it's likely demo data
      setIsUsingDemoData(Math.abs(interval2 - interval1) < 1000);
    }
  }, [stockData]);

  // Calculate moving averages and prepare data
  const prepareChartData = useCallback((data: StockData[]): ProcessedStockData[] => {
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

      // Format date for display based on timeframe
      const dateStr = new Date(item.timestamp as string | number | Date).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: chartTimeframe === 'day' ? '2-digit' : undefined,
        minute: chartTimeframe === 'day' ? '2-digit' : undefined,
        year: chartTimeframe === 'month' ? '2-digit' : undefined
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
  }, [chartTimeframe]);

  // Memoize processed data to prevent recalculation on each render
  const processedData = useMemo(() => {
    return prepareChartData(stockData || []);
  }, [stockData, chartTimeframe, prepareChartData]);

  // Handle timeframe change
  const handleTimeframeChange = (timeframe: TimeFrame) => {
    setLoading(true);
    setChartTimeframe(timeframe);
  };

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

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-gray-800 dark:text-white">
              {companyNames[symbol] || symbol}
              {isUsingDemoData && (
                <span className="ml-2 text-xs font-normal text-yellow-600 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-900 px-2 py-0.5 rounded-full">
                  Demo Data
                </span>
              )}
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {symbol} • {chartTimeframe === 'day' ? '1 Day' : chartTimeframe === 'week' ? '1 Week' : '1 Month'} Chart
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {isUsingDemoData && (
          <div className="px-4 py-2 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200 text-xs">
            <p>{API_RATE_LIMIT_NOTE}</p>
          </div>
        )}

        <div className="flex space-x-2 p-3 border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => handleTimeframeChange('day')}
            className={`px-3 py-1 rounded text-sm font-medium ${chartTimeframe === 'day'
              ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200'
              : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
          >
            1 Day
          </button>
          <button
            onClick={() => handleTimeframeChange('week')}
            className={`px-3 py-1 rounded text-sm font-medium ${chartTimeframe === 'week'
              ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200'
              : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
          >
            1 Week
          </button>
          <button
            onClick={() => handleTimeframeChange('month')}
            className={`px-3 py-1 rounded text-sm font-medium ${chartTimeframe === 'month'
              ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200'
              : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
          >
            1 Month
          </button>

          <div className="border-l border-gray-300 dark:border-gray-700 mx-2" />

          <button
            onClick={() => setShowMA(!showMA)}
            className={`px-3 py-1 rounded text-sm font-medium ${showMA
              ? 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-200'
              : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
          >
            Show MA
          </button>

          <button
            onClick={() => setShowVolume(!showVolume)}
            className={`px-3 py-1 rounded text-sm font-medium ${showVolume
              ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-200'
              : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
          >
            Show Volume
          </button>
        </div>

        <div className="flex-1 overflow-auto p-4">
          {loading ? (
            <div className="flex justify-center items-center h-96">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : error ? (
            <div className="flex justify-center items-center h-96">
              <div className="text-red-500 text-center">
                <svg className="w-12 h-12 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
                <p className="text-xl font-bold">{error}</p>
                <p className="text-gray-600 dark:text-gray-400 mt-2">
                  Please try another symbol or timeframe.
                </p>
              </div>
            </div>
          ) : (
            <div className="h-[500px]">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart
                  data={processedData}
                  margin={{
                    top: 20,
                    right: 30,
                    left: 20,
                    bottom: 60,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" opacity={0.7} />
                  <XAxis
                    dataKey="dateStr"
                    tick={{ fontSize: 12 }}
                    tickMargin={10}
                    minTickGap={10}
                  />
                  <YAxis
                    yAxisId="price"
                    domain={['auto', 'auto']}
                    tick={{ fontSize: 12 }}
                    tickMargin={10}
                    tickFormatter={(value) => `$${value.toFixed(0)}`}
                  />
                  {showVolume && (
                    <YAxis
                      yAxisId="volume"
                      orientation="right"
                      tick={{ fontSize: 12 }}
                      tickMargin={10}
                      tickFormatter={(value) => `${(value / 1000000).toFixed(0)}M`}
                    />
                  )}
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <ReferenceLine y={0} stroke="#666" yAxisId="price" />

                  {/* Price chart */}
                  <Line
                    type="monotone"
                    dataKey="close"
                    stroke="#0369a1"
                    strokeWidth={2}
                    dot={false}
                    yAxisId="price"
                    name="Price"
                  />

                  {/* Volume bars */}
                  {showVolume && (
                    <Bar
                      dataKey="volume"
                      yAxisId="volume"
                      fill="#64748b"
                      opacity={0.4}
                      name="Volume"
                    />
                  )}

                  {/* Moving Averages */}
                  {showMA && (
                    <>
                      <Line
                        type="monotone"
                        dataKey="ma5"
                        stroke="#3b82f6"
                        dot={false}
                        yAxisId="price"
                        name="MA5"
                        strokeWidth={1.5}
                      />
                      <Line
                        type="monotone"
                        dataKey="ma20"
                        stroke="#8b5cf6"
                        dot={false}
                        yAxisId="price"
                        name="MA20"
                        strokeWidth={1.5}
                      />
                    </>
                  )}

                  {/* Brush for zooming/scrolling */}
                  <Brush
                    dataKey="dateStr"
                    height={30}
                    stroke="#8884d8"
                    startIndex={Math.max(0, processedData.length - 20)}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChartOverlay;