import { useState, useEffect, useCallback } from 'react';
import { StockData } from '@/types/stock';
import { LogMessage } from './useLogMessages';
import { useInterval, IntervalType } from '@/contexts/IntervalContext';

// Type definition for stock data API response
interface TimeSeriesValue {
  '1. open': string;
  '2. high': string;
  '3. low': string;
  '4. close': string;
  '5. volume': string;
}

interface ApiResponse {
  'Meta Data'?: {
    '1. Information': string;
    '2. Symbol': string;
    '3. Last Refreshed': string;
    '4. Interval': string;
    '5. Output Size': string;
    '6. Time Zone': string;
  };
  'Time Series (5min)'?: Record<string, TimeSeriesValue>;
  'Time Series (1min)'?: Record<string, TimeSeriesValue>;
  'Time Series (15min)'?: Record<string, TimeSeriesValue>;
  'Time Series (30min)'?: Record<string, TimeSeriesValue>;
  'Time Series (60min)'?: Record<string, TimeSeriesValue>;
  'Time Series (Daily)'?: Record<string, TimeSeriesValue>;
  'Error Message'?: string;
  'Note'?: string;
}

// Function to set a global logging handler
let globalLogHandler: ((message: LogMessage) => void) | null = null;

// Function to add a log message
function addLogMessage(message: LogMessage) {
  if (globalLogHandler) {
    globalLogHandler(message);
  }
  console.log(`[${message.type.toUpperCase()}] ${message.text}`);
}

// Function to get time series data from API response
function getTimeSeriesFromResponse(data: ApiResponse, interval: IntervalType): Record<string, TimeSeriesValue> | null {
  let timeSeriesData = null;

  switch (interval) {
    case '1min':
      timeSeriesData = data['Time Series (1min)'] || null;
      break;
    case '5min':
      timeSeriesData = data['Time Series (5min)'] || null;
      break;
    case '15min':
      timeSeriesData = data['Time Series (15min)'] || null;
      break;
    case '30min':
      timeSeriesData = data['Time Series (30min)'] || null;
      break;
    case '60min':
      timeSeriesData = data['Time Series (60min)'] || null;
      break;
    case 'daily':
      timeSeriesData = data['Time Series (Daily)'] || null;
      break;
    default:
      timeSeriesData = data['Time Series (5min)'] || null;
  }

  // Log debug information for API response
  if (!timeSeriesData) {
    console.log('API Response Keys:', Object.keys(data));
    console.log('Interval requested:', interval);
  }

  return timeSeriesData;
}

// Function to fetch recent stock data from API
async function fetchStockData(symbol: string, intervalParam: IntervalType): Promise<StockData[]> {
  const interval = intervalParam || '1min'; // Set default interval if undefined

  try {
    // Log attempt to connect to API
    addLogMessage({
      text: `${symbol} stock data retrieval started... (${interval} interval)`,
      type: 'info',
      timestamp: new Date()
    });

    // Fetch stock data from AlphaVantage API
    const API_KEY = process.env.NEXT_PUBLIC_ALPHA_VANTAGE_API_KEY || 'demo';

    // Select API endpoint based on interval
    const functionParam = interval === 'daily' ? 'TIME_SERIES_DAILY' : 'TIME_SERIES_INTRADAY';
    const url = `https://www.alphavantage.co/query?function=${functionParam}&symbol=${symbol}&interval=${interval === 'daily' ? '' : interval}&apikey=${API_KEY}`;

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`API connection error: ${response.status} ${response.statusText}`);
    }

    const data: ApiResponse = await response.json();

    // Check for error response from API
    if (data['Error Message']) {
      throw new Error(`API error: ${data['Error Message']}`);
    }

    if (data['Note']) {
      // Message when API usage limit is reached
      addLogMessage({
        text: `API usage limit reached: ${data['Note']}`,
        type: 'warning',
        timestamp: new Date()
      });
      return generateDemoData(symbol, interval); // Return demo data instead of throwing an error
    }

    // Get time series corresponding to interval from response
    const timeSeriesData = getTimeSeriesFromResponse(data, interval);

    if (!timeSeriesData) {
      console.warn(`Time series data not found for interval (${interval}). Falling back to demo data.`);
      // Return demo data instead of throwing an error
      return generateDemoData(symbol, interval);
    }

    // Convert JSON response to StockData array
    const stockData: StockData[] = Object.entries(timeSeriesData).map(([timestamp, values]) => ({
      timestamp: new Date(timestamp),
      open: parseFloat(values['1. open']),
      high: parseFloat(values['2. high']),
      low: parseFloat(values['3. low']),
      close: parseFloat(values['4. close']),
      volume: parseInt(values['5. volume'], 10)
    })).sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

    // Success log
    addLogMessage({
      text: `${symbol} stock data retrieved successfully (${stockData.length} items, ${interval} interval)`,
      type: 'success',
      timestamp: new Date()
    });

    return stockData;

  } catch (error) {
    // Error log
    addLogMessage({
      text: `${symbol} data retrieval error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      type: 'error',
      timestamp: new Date()
    });

    console.error('Stock API error:', error);
    return generateDemoData(symbol, interval); // Return demo data in case of error
  }
}

// Function to generate demo data used when there is no API key or in case of error
function generateDemoData(symbol: string, interval: IntervalType): StockData[] {
  const data: StockData[] = [];
  const now = new Date();
  let basePrice: number;

  // Set realistic price range for each symbol
  switch (symbol) {
    case 'AAPL': basePrice = 175.0; break;
    case 'MSFT': basePrice = 338.0; break;
    case 'GOOGL': basePrice = 130.0; break;
    case 'AMZN': basePrice = 145.0; break;
    case 'META': basePrice = 318.0; break;
    case 'TSLA': basePrice = 260.0; break;
    case 'NVDA': basePrice = 700.0; break;
    default: basePrice = 100.0;
  }

  // Set trend (up, down, random)
  const trend = Math.random() > 0.5 ? 'up' : Math.random() > 0.5 ? 'down' : 'mixed';
  const trendFactor = trend === 'up' ? 0.01 : trend === 'down' ? -0.01 : 0;

  // Set volatility
  const volatility = 0.02; // 2% volatility

  // Cumulative factor for trend generation
  let cumulativeFactor = 1.0;

  // Adjust data generation amount based on interval
  let intervalMinutes: number;
  let daysToGenerate: number;

  switch (interval) {
    case '1min':
      intervalMinutes = 1;
      daysToGenerate = 7; // 1 minute interval means 7 days
      break;
    case '5min':
      intervalMinutes = 5;
      daysToGenerate = 30; // 5 minute interval means 30 days
      break;
    case '15min':
      intervalMinutes = 15;
      daysToGenerate = 60; // 15 minute interval means 60 days
      break;
    case '30min':
      intervalMinutes = 30;
      daysToGenerate = 90; // 30 minute interval means 90 days
      break;
    case '60min':
      intervalMinutes = 60;
      daysToGenerate = 120; // 60 minute interval means 120 days
      break;
    case 'daily':
      intervalMinutes = 24 * 60;
      daysToGenerate = 365; // Daily means 365 days
      break;
    default:
      intervalMinutes = 5;
      daysToGenerate = 30;
  }

  // Number of intervals per day
  const intervalsPerDay = 24 * 60 / intervalMinutes;
  const totalIntervals = Math.min(daysToGenerate * intervalsPerDay, 5000); // Set upper limit

  for (let i = 0; i < totalIntervals; i++) {
    // Go back in time
    const timestamp = new Date(now.getTime() - (i * intervalMinutes * 60 * 1000));

    // Price fluctuation based on trend
    if (i % intervalsPerDay === 0) { // Slightly accelerate trend every day
      cumulativeFactor *= (1 + (Math.random() * 0.01 * (trend === 'mixed' ? (Math.random() > 0.5 ? 1 : -1) : 1)));
    }

    // Calculate price by combining random element and trend
    const randomWalk = (Math.random() * 2 - 1) * volatility;
    const price = basePrice * cumulativeFactor * (1 + randomWalk + (i / totalIntervals) * trendFactor);

    // Slightly fluctuate price to generate high and low
    const high = price * (1 + Math.random() * 0.01);
    const low = price * (1 - Math.random() * 0.01);
    const open = low + Math.random() * (high - low);
    const close = low + Math.random() * (high - low);

    // Randomly generate volume (affected by trend)
    const volumeBase = 100000 + Math.random() * 900000;
    const volume = Math.floor(volumeBase * (1 + Math.abs(randomWalk) * 2)); // Higher volume when price fluctuation is large

    data.push({
      timestamp,
      open: parseFloat(open.toFixed(2)),
      high: parseFloat(high.toFixed(2)),
      low: parseFloat(low.toFixed(2)),
      close: parseFloat(close.toFixed(2)),
      volume
    });
  }

  // Sort by date (oldest first)
  return data.sort((a, b) => {
    // Ensure timestamp is Date type
    const aTime = a.timestamp instanceof Date ? a.timestamp.getTime() : 0;
    const bTime = b.timestamp instanceof Date ? b.timestamp.getTime() : 0;
    return aTime - bTime;
  });
}

// Custom hook
export function useStockData(symbol: string) {
  const [stockData, setStockData] = useState<StockData[] | null>(null);
  const { interval } = useInterval(); // Get interval from context

  // Fetch data periodically
  const fetchData = useCallback(async () => {
    try {
      const data = await fetchStockData(symbol, interval);
      setStockData(data);
    } catch (error) {
      console.error(`Error fetching stock data for ${symbol}:`, error);
      setStockData(generateDemoData(symbol, interval));
    }
  }, [symbol, interval]);

  // Initial data load and periodic update
  useEffect(() => {
    let isMounted = true;

    const getStockData = async () => {
      if (!isMounted) return;
      await fetchData();
    };

    getStockData();

    // Determine update frequency based on interval
    let updateInterval = 60000; // Default is 1 minute
    switch (interval) {
      case '1min': updateInterval = 60 * 1000; break;
      case '5min': updateInterval = 5 * 60 * 1000; break;
      case '15min': updateInterval = 15 * 60 * 1000; break;
      case '30min': updateInterval = 30 * 60 * 1000; break;
      case '60min': updateInterval = 60 * 60 * 1000; break;
      case 'daily': updateInterval = 24 * 60 * 60 * 1000; break;
    }

    // Data update timer
    const timer = setInterval(getStockData, updateInterval);

    return () => {
      isMounted = false;
      clearInterval(timer);
    };
  }, [fetchData, interval]);

  return stockData;
}