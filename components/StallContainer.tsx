import React from 'react';
import { DashboardItem, StockData } from '@/types/stock';
import { getStockStatus } from '@/types/stock';
import StallItem from './StallItem';

interface StallContainerProps {
  dashboardConfig: DashboardItem[];
  stockDataBySymbol: Record<string, StockData[] | null>;
  demoState: string | null;
  onOpenChart: (symbol: string) => void;
}

const StallContainer: React.FC<StallContainerProps> = ({
  dashboardConfig,
  stockDataBySymbol,
  demoState,
  onOpenChart
}) => {
  return (
    <div className="relative z-10 w-full h-screen">
      {dashboardConfig.map((item) => {
        const data = stockDataBySymbol[item.symbol];
        const status = getStockStatus(data, demoState);

        return (
          <StallItem
            key={item.symbol}
            item={item}
            status={status}
            stockData={data}
            onOpenChart={onOpenChart}
          />
        );
      })}
    </div>
  );
};

export default StallContainer; 