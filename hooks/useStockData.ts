import { useState, useEffect, useCallback, useMemo } from 'react';
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
    '4. Interval'?: string;
    '5. Output Size'?: string;
    '6. Time Zone': string;
  };
  'Time Series (5min)'?: Record<string, TimeSeriesValue>;
  'Time Series (1min)'?: Record<string, TimeSeriesValue>;
  'Time Series (15min)'?: Record<string, TimeSeriesValue>;
  'Time Series (30min)'?: Record<string, TimeSeriesValue>;
  'Time Series (60min)'?: Record<string, TimeSeriesValue>;
  'Time Series (Daily)'?: Record<string, TimeSeriesValue>;
  'Weekly Time Series'?: Record<string, TimeSeriesValue>;
  'Monthly Time Series'?: Record<string, TimeSeriesValue>;
  'Error Message'?: string;
  'Note'?: string;
}

// Extended interval type to include weekly and monthly
export type ExtendedIntervalType = IntervalType | 'weekly' | 'monthly';

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
function getTimeSeriesFromResponse(data: ApiResponse, interval: ExtendedIntervalType): Record<string, TimeSeriesValue> | null {
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
    case 'weekly':
      timeSeriesData = data['Weekly Time Series'] || null;
      break;
    case 'monthly':
      timeSeriesData = data['Monthly Time Series'] || null;
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

// Function to get API function name based on interval
function getApiFunctionName(interval: ExtendedIntervalType): string {
  switch (interval) {
    case 'weekly':
      return 'TIME_SERIES_WEEKLY';
    case 'monthly':
      return 'TIME_SERIES_MONTHLY';
    case 'daily':
      return 'TIME_SERIES_DAILY';
    default:
      return 'TIME_SERIES_INTRADAY';
  }
}

// Function to fetch recent stock data from API
async function fetchStockData(symbol: string, intervalParam: ExtendedIntervalType): Promise<StockData[]> {
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
    const functionParam = getApiFunctionName(interval);
    let url = `https://www.alphavantage.co/query?function=${functionParam}&symbol=${symbol}&apikey=${API_KEY}`;

    // Add interval parameter only for intraday data
    if (functionParam === 'TIME_SERIES_INTRADAY') {
      url += `&interval=${interval}`;
    }

    console.log(`Fetching data from: ${url.replace(API_KEY, 'API_KEY_HIDDEN')}`);

    // Add timeout and abort controller for better error handling
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

    try {
      const response = await fetch(url, {
        signal: controller.signal,
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });

      clearTimeout(timeoutId);

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
        console.warn(`Time series data not found for interval (${interval}). Falling back to demo data.`, data);
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
      })).sort((a, b) => {
        const aTime = a.timestamp instanceof Date ? a.timestamp.getTime() : new Date(a.timestamp as string | number | Date).getTime();
        const bTime = b.timestamp instanceof Date ? b.timestamp.getTime() : new Date(b.timestamp as string | number | Date).getTime();
        return aTime - bTime;
      });

      // Success log
      addLogMessage({
        text: `${symbol} stock data retrieved successfully (${stockData.length} items, ${interval} interval)`,
        type: 'success',
        timestamp: new Date()
      });

      return stockData;

    } catch (fetchError) {
      // Handle AbortController errors
      if (fetchError instanceof DOMException && fetchError.name === 'AbortError') {
        addLogMessage({
          text: `${symbol} data retrieval timeout after 10 seconds.`,
          type: 'error',
          timestamp: new Date()
        });
        console.warn('API request timed out after 10 seconds, falling back to demo data.');
      } else {
        console.error('Fetch error:', fetchError);
      }
      throw fetchError; // Rethrow to be caught by the outer try/catch
    }

  } catch (error) {
    // Error log
    addLogMessage({
      text: `${symbol} data retrieval error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      type: 'error',
      timestamp: new Date()
    });

    console.warn('Stock API error - Generating demo data instead.', error);
    return generateDemoData(symbol, interval); // Return demo data in case of error
  }
}

// Function to generate demo data used when there is no API key or in case of error
function generateDemoData(symbol: string, interval: ExtendedIntervalType): StockData[] {
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
    case 'weekly':
      intervalMinutes = 7 * 24 * 60;
      daysToGenerate = 520; // Weekly means 10 years (520 weeks)
      break;
    case 'monthly':
      intervalMinutes = 30 * 24 * 60;
      daysToGenerate = 240; // Monthly means 20 years (240 months)
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
    // Higher volume on trend days
    const volume = Math.round(volumeBase * (1 + Math.abs(randomWalk) * 5));

    data.push({
      timestamp,
      open,
      high,
      low,
      close,
      volume
    });
  }

  return data.sort((a, b) => {
    const aTime = a.timestamp instanceof Date ? a.timestamp.getTime() : new Date(a.timestamp as string | number | Date).getTime();
    const bTime = b.timestamp instanceof Date ? b.timestamp.getTime() : new Date(b.timestamp as string | number | Date).getTime();
    return aTime - bTime;
  });
}

// Custom hook
export function useStockData(symbol: string, interval?: ExtendedIntervalType) {
  const [stockData, setStockData] = useState<StockData[] | null>(null);
  const [isUsingDemoData, setIsUsingDemoData] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [retryCount, setRetryCount] = useState<number>(0);
  const [lastFetchParams, setLastFetchParams] = useState<string>('');
  const [fetchTimestamp, setFetchTimestamp] = useState<number>(0);
  const { interval: contextInterval } = useInterval(); // Get interval from context
  const effectiveInterval = interval || contextInterval; // Use provided interval or default from context

  // Simple in-memory cache for API responses - persistent across renders
  const apiCache = useMemo(() => new Map<string, { data: StockData[], timestamp: number }>(), []);

  // Check if we need to fetch new data
  const shouldFetchNewData = useCallback((symbol: string, interval: ExtendedIntervalType) => {
    const cacheKey = `${symbol}-${interval}`;
    const now = Date.now();

    // Don't fetch if we're already using demo data and have retried 3+ times
    if (isUsingDemoData && retryCount >= 2) {
      return false;
    }

    // Check if params changed
    if (lastFetchParams !== cacheKey) {
      console.log(`Parameters changed from ${lastFetchParams} to ${cacheKey}, forcing fetch`);
      setLastFetchParams(cacheKey);
      setRetryCount(0);
      return true;
    }

    // Prevent fetching too frequently (at least 5 minutes between manual fetches)
    const minTimeBetweenFetches = 5 * 60 * 1000; // 5 minutes
    if (now - fetchTimestamp < minTimeBetweenFetches) {
      console.log(`Recent fetch detected ${(now - fetchTimestamp) / 1000}s ago, using cached/existing data`);
      return false;
    }

    // Check cache
    if (apiCache.has(cacheKey)) {
      const cached = apiCache.get(cacheKey)!;

      // Determine if cache is fresh enough based on interval
      let cacheMaxAge = 15 * 60 * 1000; // 15 minutes default

      switch (interval) {
        case '1min': cacheMaxAge = 5 * 60 * 1000; break; // 5 minutes
        case '5min': cacheMaxAge = 15 * 60 * 1000; break; // 15 minutes
        case '15min':
        case '30min':
        case '60min': cacheMaxAge = 60 * 60 * 1000; break; // 1 hour
        case 'daily': cacheMaxAge = 24 * 60 * 60 * 1000; break; // 1 day
        case 'weekly': cacheMaxAge = 7 * 24 * 60 * 60 * 1000; break; // 1 week
        case 'monthly': cacheMaxAge = 30 * 24 * 60 * 60 * 1000; break; // 1 month
      }

      if (now - cached.timestamp < cacheMaxAge) {
        console.log(`Cache hit for ${cacheKey}, age: ${(now - cached.timestamp) / 1000}s, max age: ${cacheMaxAge / 1000}s`);
        return false;
      }

      console.log(`Cache expired for ${cacheKey}, age: ${(now - cached.timestamp) / 1000}s, max age: ${cacheMaxAge / 1000}s`);
    }

    return true;
  }, [apiCache, isUsingDemoData, lastFetchParams, retryCount, fetchTimestamp]);

  // Fetch data periodically
  const fetchData = useCallback(async () => {
    const cacheKey = `${symbol}-${effectiveInterval}`;
    const now = Date.now();

    // Check if we have this data cached
    if (apiCache.has(cacheKey)) {
      const cached = apiCache.get(cacheKey)!;
      setStockData(cached.data);

      // Set demo data flag if cache is demo data
      const data = cached.data;
      if (data.length >= 3) {
        const timestamp0 = data[0].timestamp instanceof Date
          ? data[0].timestamp.getTime()
          : new Date(data[0].timestamp as string | number).getTime();

        const timestamp1 = data[1].timestamp instanceof Date
          ? data[1].timestamp.getTime()
          : new Date(data[1].timestamp as string | number).getTime();

        const timestamp2 = data[2].timestamp instanceof Date
          ? data[2].timestamp.getTime()
          : new Date(data[2].timestamp as string | number).getTime();

        const timeRegularity = Math.abs(
          (timestamp2 - timestamp1) - (timestamp1 - timestamp0)
        );
        setIsUsingDemoData(timeRegularity < 100); // If very regular (less than 100ms difference), it's likely demo data
      }

      setLoading(false);
      return;
    }

    // Check if we should fetch or limit API calls
    if (!shouldFetchNewData(symbol, effectiveInterval)) {
      if (!stockData) {
        // Generate demo data if we have no data at all
        const demoData = generateDemoData(symbol, effectiveInterval);
        setStockData(demoData);
        setIsUsingDemoData(true);

        // Cache demo data
        apiCache.set(cacheKey, { data: demoData, timestamp: now });
      }
      setLoading(false);
      return;
    }

    try {
      setRetryCount(prev => prev + 1);
      setFetchTimestamp(now);

      // Log that we're attempting a fetch
      addLogMessage({
        text: `Fetching ${symbol} data with ${effectiveInterval} interval (attempt ${retryCount + 1})`,
        type: 'info',
        timestamp: new Date()
      });

      const data = await fetchStockData(symbol, effectiveInterval);
      setStockData(data);

      // Cache successful responses
      apiCache.set(cacheKey, { data, timestamp: now });

      // Check if we're using demo data by inspecting timestamp pattern
      // Demo data has very regular timestamp intervals
      if (data.length >= 3) {
        const timestamp0 = data[0].timestamp instanceof Date
          ? data[0].timestamp.getTime()
          : new Date(data[0].timestamp as string | number).getTime();

        const timestamp1 = data[1].timestamp instanceof Date
          ? data[1].timestamp.getTime()
          : new Date(data[1].timestamp as string | number).getTime();

        const timestamp2 = data[2].timestamp instanceof Date
          ? data[2].timestamp.getTime()
          : new Date(data[2].timestamp as string | number).getTime();

        const timeRegularity = Math.abs(
          (timestamp2 - timestamp1) - (timestamp1 - timestamp0)
        );
        setIsUsingDemoData(timeRegularity < 100); // If very regular (less than 100ms difference), it's likely demo data
      }
    } catch (error) {
      console.error(`Error fetching stock data for ${symbol}:`, error);

      // Check if we already have some data - if so, keep using it
      if (!stockData) {
        const demoData = generateDemoData(symbol, effectiveInterval);
        setStockData(demoData);
        setIsUsingDemoData(true);

        // Cache demo data too to prevent refetching
        apiCache.set(cacheKey, { data: demoData, timestamp: now });
      }

      // Log that we're using demo data
      addLogMessage({
        text: `Using demo data for ${symbol} due to API error. Attempt: ${retryCount}`,
        type: 'warning',
        timestamp: new Date()
      });
    } finally {
      setLoading(false);
    }
  }, [symbol, effectiveInterval, apiCache, shouldFetchNewData, retryCount, stockData]);

  // Initial data load and periodic update
  useEffect(() => {
    let isMounted = true;

    // Only set loading to true for the initial load or when parameters change
    if (lastFetchParams !== `${symbol}-${effectiveInterval}`) {
      setLoading(true);
    }

    const getStockData = async () => {
      if (!isMounted) return;

      try {
        await fetchData();
      } catch (e) {
        console.error("Failed to fetch data even after fallback", e);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    getStockData();

    // For periodic updates, use a smarter approach
    let updateInterval: number;

    // If using demo data or retry count exceeded, don't set up periodic updates
    if (isUsingDemoData || retryCount >= 2) {
      // No auto refresh for demo data or after multiple retries
      return () => {
        isMounted = false;
      };
    }

    // Otherwise, set up appropriate intervals based on the data type
    switch (effectiveInterval) {
      case '1min': updateInterval = 60 * 1000; break; // 1 minute
      case '5min': updateInterval = 5 * 60 * 1000; break; // 5 minutes
      case '15min': updateInterval = 15 * 60 * 1000; break; // 15 minutes
      case '30min': updateInterval = 30 * 60 * 1000; break; // 30 minutes
      case '60min': updateInterval = 60 * 60 * 1000; break; // 1 hour
      case 'daily':
      case 'weekly':
      case 'monthly':
      default:
        // For daily, weekly, monthly - no auto refresh
        return () => {
          isMounted = false;
        };
    }

    // Only set up timer for intraday data
    const timer = setInterval(getStockData, updateInterval);

    return () => {
      isMounted = false;
      clearInterval(timer);
    };
  }, [fetchData, effectiveInterval, isUsingDemoData, retryCount, symbol, lastFetchParams]);

  return stockData;
}