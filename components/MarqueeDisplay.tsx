import React, { useState, useEffect } from 'react';
import { LogMessage, MessageType } from '@/hooks/useLogMessages';

interface MarqueeDisplayProps {
  messages: LogMessage[];
  speed?: number; // Scroll speed (milliseconds)
}

const MarqueeDisplay: React.FC<MarqueeDisplayProps> = ({
  messages = [], // Set default value
  speed = 100
}) => {
  // Change initial position to 0 (start display from within the screen)
  const [scrollPosition, setScrollPosition] = useState(0);
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);

  // Default message (displayed when there are no messages)
  const defaultMessage = '<span class="success-glow">InfoCanvas system running...</span>';

  // Ensure safe array (prevent undefined errors)
  const safeMessages = Array.isArray(messages) ? messages : [];

  // Classify messages into stock-related and others
  const stockMessages = safeMessages.filter(msg =>
    msg && msg.text && (
      msg.text.includes('$') ||
      msg.text.includes('stock price') ||
      /[A-Z]{2,5}/.test(msg.text)
    )
  );

  const otherMessages = safeMessages.filter(msg =>
    msg && msg.text && !(
      msg.text.includes('$') ||
      msg.text.includes('stock price') ||
      /[A-Z]{2,5}/.test(msg.text)
    )
  );

  // Switch messages (for static display part)
  useEffect(() => {
    if (otherMessages.length <= 1) return;

    const messageChangeInterval = setInterval(() => {
      setCurrentMessageIndex(prev => (prev + 1) % otherMessages.length);
    }, 5000); // Switch messages every 5 seconds

    return () => clearInterval(messageChangeInterval);
  }, [otherMessages]);

  // Scroll stock messages
  useEffect(() => {
    if (stockMessages.length === 0) return;

    const scrollTimer = setInterval(() => {
      setScrollPosition(prev => {
        // Return to the right edge when fully displayed (loop display)
        if (prev < -300) {
          return 0;  // Change reset position to 0
        }
        return prev - 0.15; // Reduce movement amount to slow down scroll speed
      });
    }, speed);

    return () => clearInterval(scrollTimer);
  }, [speed, stockMessages]);

  // Get CSS class according to message type
  const getMessageClass = (type: MessageType): string => {
    switch (type) {
      case 'error': return 'error-flash';
      case 'warning': return 'warning-flash';
      case 'success': return 'success-glow';
      default: return '';
    }
  };

  // Generate HTML for scroll display
  const generateScrollHTML = (): string => {
    if (stockMessages.length === 0) return '';

    return stockMessages.map(msg => {
      if (!msg || !msg.text) return '';

      const cssClass = getMessageClass(msg.type);
      const timestamp = new Date(msg.timestamp).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });

      return cssClass
        ? `[${timestamp}] <span class="${cssClass}">${msg.text}</span>`
        : `[${timestamp}] ${msg.text}`;
    }).join(' ★ ');
  };

  // Display text (static part)
  let staticDisplayText = defaultMessage;
  if (otherMessages.length > 0) {
    const message = otherMessages[currentMessageIndex];
    if (message && message.text) {
      const cssClass = getMessageClass(message.type);
      const timestamp = new Date(message.timestamp).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });

      staticDisplayText = cssClass
        ? `[${timestamp}] <span class="${cssClass}">${message.text}</span>`
        : `[${timestamp}] ${message.text}`;
    }
  }

  // HTML for scroll text
  const scrollHTML = generateScrollHTML();

  // If no messages, display only static part
  const hasStockMessages = stockMessages.length > 0;
  const hasOtherMessages = otherMessages.length > 0 || defaultMessage.length > 0;

  return (
    <div className="fixed top-20 left-0 right-0 z-30 w-full pointer-events-none overflow-hidden bg-black bg-opacity-80 py-3 border-y-2 border-[#333]">
      {/* Non-stock information (always static display) */}
      {hasOtherMessages && (
        <div className="text-center mb-1 whitespace-nowrap font-led text-[#ff5722]"
          style={{
            textShadow: '0 0 5px rgba(255, 87, 34, 0.7), 0 0 10px rgba(255, 87, 34, 0.5)',
            letterSpacing: '1px',
            fontWeight: 'bold',
            fontSize: '1.2rem',
          }}>
          <span className="relative" dangerouslySetInnerHTML={{ __html: staticDisplayText }}></span>
        </div>
      )}

      {/* Stock information (always scroll display) */}
      {hasStockMessages && (
        <div className="whitespace-nowrap font-led text-[#00bcd4]"
          style={{
            transform: `translateX(${scrollPosition}%)`,
            textShadow: '0 0 5px rgba(0, 188, 212, 0.7), 0 0 10px rgba(0, 188, 212, 0.5)',
            letterSpacing: '1px',
            fontWeight: 'bold',
            fontSize: '1.1rem',
            paddingRight: '50%',  // Scroll out margin
          }}>
          <span className="relative" dangerouslySetInnerHTML={{ __html: scrollHTML }}></span>
        </div>
      )}
    </div>
  );
};

export default MarqueeDisplay; 