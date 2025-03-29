import React from 'react';

const Animations: React.FC = () => {
  return (
    <style jsx global>{`
      @keyframes flash {
        0%, 100% { filter: brightness(1); }
        50% { filter: brightness(2.5); }
      }
      
      .animate-bounce.fast {
        animation: bounce 0.3s infinite;
      }
      
      .animate-bounce.normal {
        animation: bounce 0.8s infinite;
      }

      .animate-bounce.slow {
        animation: bounce 1.8s infinite;
      }
      
      .animate-float-slow {
        animation: float 3s ease-in-out infinite;
      }
      
      @keyframes float {
        0%, 100% { transform: translate(-50%, 0); }
        50% { transform: translate(-50%, -10px); }
      }
    `}</style>
  );
};

export default Animations; 