import { useState, useCallback, useEffect, useRef } from 'react';

// Explicitly define message types
export type MessageType = 'info' | 'success' | 'warning' | 'error';

export interface LogMessage {
  text: string;
  type: MessageType;
  timestamp: Date;
}

export function useLogMessages(maxMessages: number = 15) {
  const [messages, setMessages] = useState<LogMessage[]>([]);
  const initializedRef = useRef(false);
  const initialDataLoadedRef = useRef(false);

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

  // Separate effect to set initial demo messages only once
  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    const demoData = loadInitialDemoData();
    setMessages(demoData);
    initialDataLoadedRef.current = true;
  }, []);

  // Separate effect for periodic random messages
  useEffect(() => {
    if (!initialDataLoadedRef.current) return;

    const interval = setInterval(() => {
      const randomMsg = getRandomMessage();
      addLogMessage(randomMsg);
    }, 10000); // Random message every 10 seconds

    return () => clearInterval(interval);
  }, [addLogMessage]);

  return { messages, addLogMessage };
}

// Pure function to load initial demo messages
function loadInitialDemoData(): LogMessage[] {
  const initialMessages: Array<{ text: string; type: MessageType }> = [
    { text: 'InfoCanvas system starting...', type: 'info' },
    { text: 'Stock market data connection completed', type: 'success' },
    { text: 'API authentication completed - data stream started', type: 'info' },
    { text: 'AAPL: Previous day +2.3% upward trend', type: 'info' },
    { text: 'GOOGL: Previous day -0.7% stable trend', type: 'info' },
    { text: 'MSFT: Large transaction detected: 500,000 shares', type: 'warning' },
    { text: 'AMZN: Sudden upward signal detected', type: 'info' },
    { text: 'META: Previous day -3.5% downward trend', type: 'info' },
    { text: 'Market overall: Volatility increasing', type: 'warning' },
    { text: 'Server connection: Temporary delay occurred', type: 'warning' },
    { text: 'Data update: Latest market data obtained', type: 'success' },
    { text: 'System load: 23%', type: 'info' }
  ];

  return initialMessages.map(msg => ({
    text: msg.text,
    type: msg.type,
    timestamp: new Date()
  }));
}

// Pure function to generate random messages
function getRandomMessage(): LogMessage {
  const randomMessages: Array<{ text: string; type: MessageType }> = [
    { text: 'Data update completed: Latest information updated', type: 'success' },
    { text: 'Memory usage: 45%', type: 'info' },
    { text: 'Server response time: 120ms', type: 'info' },
    { text: 'Network connection unstable', type: 'warning' },
    { text: 'Market data feed delayed', type: 'warning' },
    { text: 'API call limit approaching', type: 'warning' },
    { text: 'Data buffer full: Old data will be deleted', type: 'error' },
    { text: 'AMZN: Abnormal trading pattern detected', type: 'warning' },
    { text: 'Server maintenance scheduled: Tomorrow 03:00-04:00', type: 'info' }
  ];

  const now = new Date();
  const randomIndex = Math.floor(Math.random() * randomMessages.length);
  const { text, type } = randomMessages[randomIndex];

  return {
    text,
    type,
    timestamp: now
  };
}

export default useLogMessages; 