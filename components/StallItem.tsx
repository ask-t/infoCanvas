import React, { useState, useEffect } from 'react';
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
  const [displayedStatus, setDisplayedStatus] = useState<StatusType>(status);

  // Calculate status directly from stock data (to maintain display consistency)
  useEffect(() => {
    if (stockData && stockData.length >= 2) {
      const latestData = stockData[stockData.length - 1];
      const previousData = stockData[stockData.length - 2];

      if (latestData?.close !== undefined && previousData?.close !== undefined) {
        const priceChange = latestData.close - previousData.close;
        const percentChange = (priceChange / previousData.close) * 100;

        let newStatus: StatusType;

        if (percentChange <= -3) {
          newStatus = 'crash';
        } else if (percentChange <= -0.5) {
          newStatus = 'down';
        } else if (percentChange >= 3) {
          newStatus = 'surge';
        } else if (percentChange >= 0.5) {
          newStatus = 'up';
        } else {
          newStatus = 'stable';
        }

        setDisplayedStatus(newStatus);
        console.log(`${item.symbol} 状態調整: ${status} → ${newStatus}, 変化率: ${percentChange.toFixed(2)}%`);
      } else {
        setDisplayedStatus(status);
      }
    } else {
      setDisplayedStatus(status);
    }
  }, [stockData, status, item.symbol]);

  // Determine customer display and animation based on status
  let customerImage = null;
  let effectImage = null;
  let stallClassName = "w-32"; // Default style

  // Display settings based on status
  switch (displayedStatus) {
    case "surge":
      // Surge state: Customer display (fast movement) + Stall lights up
      customerImage = (
        <Image
          src="/icons/customers.png"
          alt="顧客"
          className="absolute left-1/2 -translate-x-1/2 w-[150px] h-[150px] animate-bounce fast"
          width={150}
          height={150}
        />
      );
      stallClassName = "w-32 drop-shadow-[0_0_25px_rgba(255,255,150,0.9)] brightness-125 animate-[flash_1.2s_ease-in-out_infinite]";
      break;

    case "up":
      // Up state: Customer display (normal movement)
      customerImage = (
        <Image
          src="/icons/customers.png"
          alt="顧客"
          className="absolute left-1/2 -translate-x-1/2 w-[150px] h-[150px] animate-bounce normal"
          width={150}
          height={150}
        />
      );
      stallClassName = "w-32 brightness-110";
      break;

    case "stable":
      // Stable state: Customer display (slow movement)
      customerImage = (
        <Image
          src="/icons/customers.png"
          alt="顧客"
          className="absolute left-1/2 -translate-x-1/2 w-[150px] h-[150px] animate-bounce slow"
          width={150}
          height={150}
        />
      );
      stallClassName = "w-32";
      break;

    case "crash":
      // Crash state: Lightning icon + Dark stall
      effectImage = (
        <Image
          src="/icons/thunder.png"
          alt="暴落"
          className="absolute -top-36 left-16 -translate-x-1/2 w-[150px] h-[150px] opacity-90 animate-[flash_0.8s_ease-in-out_infinite]"
          width={96}
          height={96}
        />
      );
      stallClassName = "w-32 drop-shadow-[0_0_15px_rgba(255,0,0,0.7)] brightness-90";
      break;

    case "down":
      // Down state: Ghost icon + Slightly dark stall
      effectImage = (
        <Image
          src="/icons/ghost.png"
          alt="下降"
          className="absolute -top-36 left-32 -translate-x-1/2 w-[150px] h-[150px] opacity-90 animate-float-slow"
          width={96}
          height={96}
        />
      );
      stallClassName = "w-32 brightness-75";
      break;

    case "abnormal":
      // Abnormal state: Warning icon
      effectImage = (
        <Image
          src="/icons/alert.png"
          alt="異常"
          className="absolute -top-36 left-32 -translate-x-1/2 w-[150px] h-[150px] opacity-90 animate-float-slow"
          width={96}
          height={96}
        />
      );
      stallClassName = "w-32 brightness-95";
      break;

    case "unknown":
    default:
      // Unknown state: Question mark icon
      effectImage = (
        <Image
          src="/icons/question.png"
          alt="不明"
          className="absolute -top-36 left-32 -translate-x-1/2 w-[150px] h-[150px] opacity-90 animate-float-slow"
          width={96}
          height={96}
        />
      );
      stallClassName = "w-32 opacity-90";
      break;
  }

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
        status={displayedStatus}
      />

      <Image
        src={item.image}
        alt={item.symbol}
        className={stallClassName}
        style={{ filter: 'brightness(1)' }}
        width={128}
        height={128}
      />

      {/* Display customer or effect icon */}
      {customerImage}
      {effectImage}
    </div>
  );
};

export default StallItem; 