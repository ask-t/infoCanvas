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

  // 株価データから直接状態を計算（表示の一貫性を保つため）
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

  // ステータスに基づいて顧客表示とアニメーションを決定
  let customerImage = null;
  let effectImage = null;
  let stallClassName = "w-32"; // デフォルトのスタイル

  // 状態に応じた表示設定
  switch (displayedStatus) {
    case "surge":
      // 高騰状態: 顧客表示（早い動き）+ 店が光る
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
      // 上昇状態: 顧客表示（普通の動き）
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
      // 安定状態: 顧客表示（遅い動き）
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
      // 暴落状態: 雷アイコン + 暗い店舗
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
      // 下降状態: 幽霊アイコン + やや暗い店舗
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
      // 異常状態: 警告アイコン
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
      // 不明状態: 疑問符アイコン
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
      {/* デバッグ情報（開発環境のみ表示） */}
      {process.env.NODE_ENV === 'development' && (
        <div className="absolute -bottom-8 left-0 bg-black bg-opacity-75 text-white text-xs px-1 py-0.5 rounded z-50">
          {displayedStatus}
        </div>
      )}

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

      {/* 顧客または効果アイコンの表示 */}
      {customerImage}
      {effectImage}
    </div>
  );
};

export default StallItem; 