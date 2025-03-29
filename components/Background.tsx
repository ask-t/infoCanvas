import React from 'react';
import Image from 'next/image';

const Background: React.FC = () => {
  return (
    <div className="absolute inset-0 z-0">
      <Image
        src="/background/night-town.jpg"
        alt="Background"
        fill
        sizes="100vw"
        style={{
          objectFit: 'cover'
        }}
        priority
      />
    </div>
  );
};

export default Background; 