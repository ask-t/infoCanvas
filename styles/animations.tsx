import React from 'react';

const Animations: React.FC = () => {
  return (
    <style jsx global>{`
      @keyframes flash {
        0%, 100% { filter: brightness(1); }
        50% { filter: brightness(2.5); }
      }
      
      .animate-bounce.fast {
        animation: bounce 0.6s infinite;
      }
      
      .animate-bounce.normal {
        animation: bounce 1s infinite;
      }
      
      .animate-bounce.slow {
        animation: bounce 1.5s infinite;
      }
      
      .animate-float-slow {
        animation: float 3s ease-in-out infinite;
      }
      
      @keyframes float {
        0%, 100% { transform: translate(-50%, 0); }
        50% { transform: translate(-50%, -10px); }
      }
      
      /* Animation for LED display */
      @keyframes blink {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.7; }
      }
      
      .font-led {
        font-family: 'Courier New', monospace;
        letter-spacing: 2px;
        animation: blink 2s infinite;
        display: inline-block;
        position: relative;
        overflow: hidden;
      }
      
      /* LED dot background pattern */
      .bg-dot-pattern {
        background-image: radial-gradient(rgba(0, 0, 0, 0.3) 1px, transparent 1px);
        background-size: 3px 3px;
      }
      
      /* Blinking effect for error messages */
      .error-flash {
        color: #ff0000 !important;
        animation: error-blink 0.5s infinite;
        font-weight: bold;
      }
      
      @keyframes error-blink {
        0%, 49% { opacity: 1; }
        50%, 100% { opacity: 0.5; }
      }
      
      /* Blinking effect for warning messages */
      .warning-flash {
        color: #ffcc00 !important;
        animation: warning-blink 1s infinite;
      }
      
      @keyframes warning-blink {
        0%, 75% { opacity: 1; }
        76%, 100% { opacity: 0.7; }
      }
      
      /* Effect for success messages */
      .success-glow {
        color: #00ff00 !important;
        text-shadow: 0 0 5px rgba(0, 255, 0, 0.7), 0 0 10px rgba(0, 255, 0, 0.5) !important;
      }
    `}</style>
  );
};

export default Animations; 