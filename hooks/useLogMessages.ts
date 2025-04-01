import { useState, useCallback, useEffect, useRef } from 'react';
import { useInterval } from '@/contexts/IntervalContext';
import { StockData } from '@/types/stock';

// Explicitly define message types
export type MessageType = 'info' | 'success' | 'warning' | 'error';

export interface LogMessage {
  text: string;
  type: MessageType;
  timestamp: Date;
}

// Global stock data storage for logs
type StockCache = {
  [symbol: string]: {
    data: StockData[] | null;
    lastUpdated: Date;
    previousClose?: number;
  }
};

const stockDataCache: StockCache = {};

export function updateStockCache(symbol: string, data: StockData[] | null) {
  if (!data || data.length === 0) return;

  const previousData = stockDataCache[symbol]?.data;
  const previousClose = previousData && previousData.length > 0
    ? previousData[previousData.length - 1].close
    : undefined;

  stockDataCache[symbol] = {
    data,
    lastUpdated: new Date(),
    previousClose
  };
}

export function useLogMessages(maxMessages: number = 15) {
  const [messages, setMessages] = useState<LogMessage[]>([]);
  const initializedRef = useRef(false);
  const initialDataLoadedRef = useRef(false);
  const { interval } = useInterval(); // Get current interval from context
  const nextUpdateRef = useRef<Date | null>(null);
  const updateTimerRef = useRef<NodeJS.Timeout | null>(null);
  const stockCheckTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Function to add a new message
  const addLogMessage = useCallback((message: string | LogMessage) => {
    let messageText: LogMessage;

    if (typeof message === 'string') {
      messageText = { text: message, type: 'info', timestamp: new Date() };
    } else {
      messageText = { ...message, timestamp: new Date(message.timestamp) };
    }

    setMessages(prev => {
      // If the same message already exists, do not add (prevent duplicates)
      if (prev.some(m => m.text === messageText.text && m.type === messageText.type)) {
        return prev;
      }

      // If exceeding the maximum number, delete old messages
      const newMessages = [...prev, messageText];
      if (newMessages.length > maxMessages) {
        return newMessages.slice(-maxMessages);
      }
      return newMessages;
    });
  }, [maxMessages]);

  // Function to calculate and set the next update time
  const setNextUpdateTime = useCallback(() => {
    // Determine update interval in milliseconds based on the current interval setting
    let updateIntervalMs = 60000; // Default is 1 minute
    switch (interval) {
      case '1min': updateIntervalMs = 60 * 1000; break;
      case '5min': updateIntervalMs = 5 * 60 * 1000; break;
      case '15min': updateIntervalMs = 15 * 60 * 1000; break;
      case '30min': updateIntervalMs = 30 * 60 * 1000; break;
      case '60min': updateIntervalMs = 60 * 60 * 1000; break;
      case 'daily': updateIntervalMs = 24 * 60 * 60 * 1000; break;
    }

    // Calculate next update time
    const nextUpdate = new Date(Date.now() + updateIntervalMs);
    nextUpdateRef.current = nextUpdate;

    // Log the next update time
    addLogMessage({
      text: `Next data update in ${formatTimeRemaining(updateIntervalMs)}`,
      type: 'info',
      timestamp: new Date()
    });

    // Start countdown timer for updates
    if (updateTimerRef.current) {
      clearInterval(updateTimerRef.current);
    }

    updateTimerRef.current = setInterval(() => {
      if (nextUpdateRef.current) {
        const remainingTime = nextUpdateRef.current.getTime() - Date.now();

        // Update every minute or when less than a minute is left, update every 10 seconds
        if (remainingTime <= 0) {
          // Time's up, clear the interval
          if (updateTimerRef.current) {
            clearInterval(updateTimerRef.current);
            updateTimerRef.current = null;
          }

          // Set new next update time
          setNextUpdateTime();

          // Also log that data update is happening
          addLogMessage({
            text: `Data update in progress...`,
            type: 'info',
            timestamp: new Date()
          });
        } else if (remainingTime <= 60000 && remainingTime % 10000 < 1000) {
          // When less than a minute remains, log every 10 seconds
          addLogMessage({
            text: `Data update in ${formatTimeRemaining(remainingTime)}`,
            type: 'info',
            timestamp: new Date()
          });
        } else if (remainingTime % 60000 < 1000) {
          // Log every minute otherwise
          addLogMessage({
            text: `Data update in ${formatTimeRemaining(remainingTime)}`,
            type: 'info',
            timestamp: new Date()
          });
        }
      }
    }, 1000);

  }, [interval, addLogMessage]);

  // Helper function to format the remaining time
  const formatTimeRemaining = (milliseconds: number): string => {
    if (milliseconds < 0) return 'now';

    const seconds = Math.floor(milliseconds / 1000) % 60;
    const minutes = Math.floor(milliseconds / (1000 * 60)) % 60;
    const hours = Math.floor(milliseconds / (1000 * 60 * 60));

    if (hours > 0) {
      return `${hours}h ${minutes}m ${seconds}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    } else {
      return `${seconds}s`;
    }
  };

  // Generate logs based on stock data changes
  const checkStockChanges = useCallback(() => {
    Object.entries(stockDataCache).forEach(([symbol, cache]) => {
      if (!cache.data || cache.data.length === 0) return;

      const latestData = cache.data[cache.data.length - 1];
      const previousClose = cache.previousClose;

      // Skip if we don't have previous data for comparison
      if (previousClose === undefined) return;

      const currentClose = latestData.close;
      const priceDiff = currentClose - previousClose;
      const percentChange = (priceDiff / previousClose) * 100;

      // Only log significant changes (>0.5%)
      if (Math.abs(percentChange) >= 0.5) {
        const changeDirection = priceDiff > 0 ? 'up' : 'down';
        const changeType: MessageType =
          Math.abs(percentChange) > 3 ? (changeDirection === 'up' ? 'success' : 'error') :
            Math.abs(percentChange) > 1 ? 'warning' : 'info';

        addLogMessage({
          text: `${symbol}: ${changeDirection === 'up' ? '↑' : '↓'} ${Math.abs(priceDiff).toFixed(2)} (${percentChange > 0 ? '+' : ''}${percentChange.toFixed(2)}%)`,
          type: changeType,
          timestamp: new Date()
        });

        // Add additional context for significant changes
        if (Math.abs(percentChange) > 2) {
          const volumeMsg = latestData.volume > 1000000
            ? `High trading volume: ${(latestData.volume / 1000000).toFixed(1)}M shares`
            : `Volume: ${(latestData.volume / 1000).toFixed(0)}K shares`;

          addLogMessage({
            text: `${symbol}: ${volumeMsg}`,
            type: 'info',
            timestamp: new Date()
          });
        }
      }

      // Update previous close for next comparison
      cache.previousClose = currentClose;
    });
  }, [addLogMessage]);

  // Check for market volatility
  const checkMarketVolatility = useCallback(() => {
    const symbols = Object.keys(stockDataCache);
    if (symbols.length < 3) return; // Need at least 3 stocks to measure volatility

    // Count stocks with significant price changes
    let upCount = 0;
    let downCount = 0;
    let totalChangePct = 0;

    for (const symbol of symbols) {
      const cache = stockDataCache[symbol];
      if (!cache.data || cache.data.length === 0 || cache.previousClose === undefined) continue;

      const latestClose = cache.data[cache.data.length - 1].close;
      const priceDiff = latestClose - cache.previousClose;
      const percentChange = (priceDiff / cache.previousClose) * 100;

      totalChangePct += Math.abs(percentChange);
      if (percentChange > 1) upCount++;
      if (percentChange < -1) downCount++;
    }

    const avgVolatility = totalChangePct / symbols.length;

    // Log market trends
    if (avgVolatility > 2) {
      const marketDirection = upCount > downCount ? 'bullish' : 'bearish';
      const msgType: MessageType = marketDirection === 'bullish' ? 'success' : 'warning';

      addLogMessage({
        text: `Market trend: ${marketDirection.toUpperCase()} - Volatility ${avgVolatility.toFixed(1)}%`,
        type: msgType,
        timestamp: new Date()
      });
    } else if (avgVolatility > 1) {
      addLogMessage({
        text: `Market showing moderate volatility: ${avgVolatility.toFixed(1)}%`,
        type: 'info',
        timestamp: new Date()
      });
    }
  }, [addLogMessage]);

  // Effect to update next update time when interval changes
  useEffect(() => {
    if (initialDataLoadedRef.current) {
      // Clear existing timer
      if (updateTimerRef.current) {
        clearInterval(updateTimerRef.current);
        updateTimerRef.current = null;
      }

      // Log interval change and set new update time
      addLogMessage({
        text: `Data update interval changed to ${interval}`,
        type: 'info',
        timestamp: new Date()
      });

      setNextUpdateTime();
    }
  }, [interval, setNextUpdateTime, addLogMessage]);

  // Set up stock data change monitoring
  useEffect(() => {
    if (!initialDataLoadedRef.current) return;

    // Check stock changes and market volatility every 30 seconds
    stockCheckTimerRef.current = setInterval(() => {
      checkStockChanges();

      // Check market volatility every 2 minutes (4 cycles)
      if (Date.now() % (120 * 1000) < 30 * 1000) {
        checkMarketVolatility();
      }

      // Log system stats occasionally
      if (Math.random() < 0.3) { // 30% chance each time
        const memoryUsage = Math.floor(25 + Math.random() * 15); // Random between 25-40%
        const serverLoad = Math.floor(20 + Math.random() * 30); // Random between 20-50%

        addLogMessage({
          text: `System stats - Memory: ${memoryUsage}% | Load: ${serverLoad}%`,
          type: 'info',
          timestamp: new Date()
        });
      }
    }, 30000);

    return () => {
      if (stockCheckTimerRef.current) {
        clearInterval(stockCheckTimerRef.current);
        stockCheckTimerRef.current = null;
      }
    };
  }, [checkStockChanges, checkMarketVolatility, addLogMessage]);

  // Separate effect to set initial demo messages only once
  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    const demoData = loadInitialDemoData();
    setMessages(demoData);
    initialDataLoadedRef.current = true;

    // Set initial next update time
    setNextUpdateTime();
  }, [setNextUpdateTime]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (updateTimerRef.current) {
        clearInterval(updateTimerRef.current);
      }
      if (stockCheckTimerRef.current) {
        clearInterval(stockCheckTimerRef.current);
      }
    };
  }, []);

  return { messages, addLogMessage };
}

// Pure function to load initial demo messages
function loadInitialDemoData(): LogMessage[] {
  const initialMessages: Array<{ text: string; type: MessageType }> = [
    { text: 'InfoCanvas system starting...', type: 'info' },
    { text: 'Stock market data connection established', type: 'success' },
    { text: 'API authentication completed', type: 'info' },
    { text: 'Real-time data stream initialized', type: 'success' },
    { text: 'System ready to monitor market activity', type: 'info' },
    { text: 'System load: 23%', type: 'info' }
  ];

  return initialMessages.map(msg => ({
    text: msg.text,
    type: msg.type,
    timestamp: new Date()
  }));
}

export default useLogMessages; 