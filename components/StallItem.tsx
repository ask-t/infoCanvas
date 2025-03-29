import React, { useState } from 'react';
import Image from 'next/image';
import { DashboardItem, StatusType, StockData } from '@/types/stock';
import StockTooltip from './StockTooltip';

interface StallItemProps {
  item: DashboardItem;
  status: StatusType;
  stockData: StockData[] | null;
  onOpenChart: (symbol: string) => void;
}

const StallItem: React.FC<StallItemProps> = ({ item, status, stockData, onOpenChart }) => {
  const [showTooltip, setShowTooltip] = useState(false);

  const showCustomer = ["surge", "up", "stable"].includes(status);
  const customerClass =
    status === "surge"
      ? "animate-bounce fast"
      : status === "up"
        ? "animate-bounce normal"
        : status === "stable"
          ? "animate-bounce slow"
          : "hidden";

  const effectIcon =
    status === "crash"
      ? "/icons/thunder.png"
      : status === "down"
        ? "/icons/ghost.png"
        : status === "abnormal"
          ? "/icons/alert.png"
          : status === "unknown"
            ? "/icons/question.png"
            : null;

  const stallClass =
    status === "surge"
      ? "w-32 drop-shadow-[0_0_25px_rgba(255,255,150,0.9)] brightness-125 animate-[flash_1.2s_ease-in-out_infinite]"
      : "w-32";

  return (
    <div
      className="absolute cursor-pointer"
      style={{ left: item.position.left, bottom: `calc(${item.position.bottom} - 40px)` }}
      onClick={() => onOpenChart(item.symbol)}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <StockTooltip
        symbol={item.symbol}
        data={stockData}
        visible={showTooltip}
      />

      <Image
        src={item.image}
        alt={item.symbol}
        className={stallClass}
        style={{ filter: 'brightness(1)' }}
        width={128}
        height={128}
      />

      {showCustomer && (
        <Image
          src="/icons/customers.png"
          alt="Effect"
          className={`absolute left-1/2 -translate-x-1/2 w-[150px] h-[150px] ${customerClass}`}
          width={150}
          height={150}
        />
      )}

      {effectIcon && (
        <Image
          src={effectIcon}
          alt="Effect"
          className={`absolute -top-36 -translate-x-1/2 w-[150px] h-[150px] opacity-90 ${status === 'crash' ? 'animate-[flash_0.8s_ease-in-out_infinite] left-16' : 'animate-float-slow left-32'}`}
          width={96}
          height={96}
        />
      )}
    </div>
  );
};

export default StallItem; 