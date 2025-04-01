'use client';

import { useState, useEffect, useRef, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { useStockData } from "@/hooks/useStockData";
import dashboardConfig from "@/lib/config/dashboard.json";
import { StockData } from "@/types/stock";
import useLogMessages, { LogMessage } from "@/hooks/useLogMessages";

// Component imports
import Header from "@/components/Header";
import Background from "@/components/Background";
import StallContainer from "@/components/StallContainer";
import ChartOverlay from "@/components/ChartOverlay";
import Animations from "@/styles/animations";
import MarqueeDisplay from "@/components/MarqueeDisplay";

// Main app component
export default function MainApp() {
  const searchParams = useSearchParams();
  const mode = searchParams.get('mode');
  const demoState = mode === 'demo' ? searchParams.get('state') : null;
  const [selectedSymbol, setSelectedSymbol] = useState<string | null>(null);
  const { messages, addLogMessage } = useLogMessages();
  const [apiStatus, setApiStatus] = useState<'connecting' | 'connected' | 'error'>('connecting');

  // Log message when application starts to connect to API
  useEffect(() => {
    addLogMessage({
      text: `InfoCanvas stock data API connection is starting...`,
      type: 'info',
      timestamp: new Date()
    });

    // Show message after connection is established after 5 seconds
    const timer = setTimeout(() => {
      setApiStatus('connected');
      addLogMessage({
        text: `Stock data API connection established`,
        type: 'success',
        timestamp: new Date()
      });
    }, 5000);

    return () => clearTimeout(timer);
  }, [addLogMessage]);

  // ref to record previous data
  const prevDataRefs = useRef<Record<string, number | null>>({});
  const prevModeRef = useRef<string | null>(null);
  const prevDemoStateRef = useRef<string | null>(null);

  // Get data for main stocks
  const appleData = useStockData('AAPL');
  const tslaData = useStockData('TSLA');
  const nvdaData = useStockData('NVDA');
  const msftData = useStockData('MSFT');
  const amznData = useStockData('AMZN');

  // Get data for each stock with useMemo to prevent unnecessary re-renders
  const stockDataBySymbol = useMemo(() => {
    const data: Record<string, StockData[] | null> = {};

    // Initialize all symbols to null
    dashboardConfig.forEach(item => {
      data[item.symbol] = null;
    });

    // Set data for main stocks
    if (appleData) data['AAPL'] = appleData;
    if (tslaData) data['TSLA'] = tslaData;
    if (nvdaData) data['NVDA'] = nvdaData;
    if (msftData) data['MSFT'] = msftData;
    if (amznData) data['AMZN'] = amznData;

    return data;
  }, [appleData, tslaData, nvdaData, msftData, amznData]);

  // Monitor stock data changes and add log messages
  useEffect(() => {
    // Do not execute if API connection is not established
    if (apiStatus !== 'connected') return;

    // Monitor data for all stocks defined in dashboardConfig
    dashboardConfig.forEach(config => {
      const symbol = config.symbol;
      const data = stockDataBySymbol[symbol];

      if (data && data.length > 0) {
        const latestPrice = data[data.length - 1].close;
        const prevPrice = prevDataRefs.current[symbol];

        // Notify only if the value has changed
        if (prevPrice !== latestPrice) {
          // Determine if the stock price has increased or decreased
          let messageType: 'info' | 'success' | 'warning' = 'info';
          let changeText = '';

          if (prevPrice !== null) {
            const priceDiff = latestPrice - prevPrice;
            const percentChange = (priceDiff / prevPrice) * 100;

            if (priceDiff > 0) {
              messageType = 'success';
              changeText = ` (↑ +${percentChange.toFixed(2)}%)`;
            } else if (priceDiff < 0) {
              messageType = 'warning';
              changeText = ` (↓ ${percentChange.toFixed(2)}%)`;
            }
          }

          // Save current price
          prevDataRefs.current[symbol] = latestPrice;

          // Add log message
          const message: LogMessage = {
            text: `${symbol} Latest stock price: $${latestPrice.toFixed(2)}${changeText}`,
            type: messageType,
            timestamp: new Date()
          };
          addLogMessage(message);
        }
      }
    });
  }, [
    apiStatus,
    addLogMessage,
    stockDataBySymbol
  ]);

  // Monitor mode and demo state changes (separate useEffect)
  useEffect(() => {
    // Notify only if mode or demo state changes
    if (mode !== prevModeRef.current || demoState !== prevDemoStateRef.current) {
      prevModeRef.current = mode;
      prevDemoStateRef.current = demoState;

      if (mode === 'demo' && demoState) {
        const messageType =
          demoState === 'crash' || demoState === 'down' ? 'warning' :
            demoState === 'surge' || demoState === 'up' ? 'success' :
              demoState === 'abnormal' ? 'error' : 'info';

        const message: LogMessage = {
          text: `Demo mode: ${demoState} state is being simulated...`,
          type: messageType,
          timestamp: new Date()
        };
        addLogMessage(message);
      }
    }
  }, [mode, demoState, addLogMessage]);

  const handleOpenChart = (symbol: string) => {
    setSelectedSymbol(symbol);
    addLogMessage({
      text: `Loading ${symbol} stock chart...`,
      type: 'info',
      timestamp: new Date()
    });
  };

  const handleCloseChart = () => {
    setSelectedSymbol(null);
    addLogMessage({
      text: `Closed stock chart`,
      type: 'info',
      timestamp: new Date()
    });
  };

  return (
    <main className="relative min-h-screen w-full overflow-hidden">
      {/* Header component */}
      <Header addLogMessage={addLogMessage} />

      {/* Background component */}
      <Background />

      {/* Digital sign (log display) */}
      <MarqueeDisplay
        messages={messages}
        speed={150}
      />

      {/* Content */}
      <StallContainer
        dashboardConfig={dashboardConfig}
        stockDataBySymbol={stockDataBySymbol}
        demoState={demoState}
        onOpenChart={handleOpenChart}
      />

      {/* Stock chart overlay */}
      {selectedSymbol && (
        <ChartOverlay
          symbol={selectedSymbol}
          onClose={handleCloseChart}
          addLogMessage={addLogMessage}
        />
      )}

      {/* Animation styles */}
      <Animations />
    </main>
  );
} 