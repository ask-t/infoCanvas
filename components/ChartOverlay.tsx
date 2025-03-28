'use client';

import InfoCanvas from "./InfoCanvas";

export default function ChartOverlay({ symbol, onClose }: { symbol: string; onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg w-[90%] max-w-4xl relative">
        <button
          className="absolute top-2 right-2 text-gray-600 hover:text-black"
          onClick={onClose}
        >
          ✕
        </button>
        <InfoCanvas symbol={symbol} />
      </div>
    </div>
  );
}