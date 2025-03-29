// 株式データの型定義
export type StockData = {
  close: number;
  volume?: number;
  date?: string;
  open?: number;
  high?: number;
  low?: number;
  [key: string]: unknown
};

// 状態の型定義
export type StatusType = 'surge' | 'up' | 'stable' | 'crash' | 'down' | 'abnormal' | 'unknown';

// ダッシュボード設定項目の型定義
export interface DashboardItem {
  symbol: string;
  image: string;
  position: {
    left: string;
    bottom: string;
  };
}

// 株式状態判定の関数
export function getStockStatus(data: StockData[] | null, demoState: string | null): StatusType {
  if (demoState) return demoState as StatusType;
  if (!data || data.length < 2) return "unknown";
  const first = data[0].close;
  const last = data[data.length - 1].close;
  const change = (last - first) / first;
  if (change > 0.05) return "surge";
  if (change > 0.01) return "up";
  if (change < -0.05) return "crash";
  if (change < -0.01) return "down";
  if (Math.abs(change) <= 0.01) return "stable";
  return "abnormal";
}