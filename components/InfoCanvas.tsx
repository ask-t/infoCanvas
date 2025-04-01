'use client';

import { useStockData } from "@/hooks/useStockData";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

export default function InfoCanvas({ symbol }: { symbol: string }) {
  const stockData = useStockData(symbol);

  // データがロード中またはnullの場合の表示
  if (!stockData) {
    return (
      <div className="bg-white p-4 rounded shadow-md flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">データを読み込み中...</p>
        </div>
      </div>
    );
  }

  // データが空の場合の表示
  if (stockData.length === 0) {
    return (
      <div className="bg-white p-4 rounded shadow-md flex items-center justify-center h-96">
        <p className="text-gray-600">データがありません</p>
      </div>
    );
  }

  // 日付のフォーマット関数
  const formatDate = (timestamp: string | number | Date) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleDateString('ja-JP', { month: 'short', day: 'numeric', hour: '2-digit' });
  };

  return (
    <div className="bg-white p-4 rounded shadow-md">
      <h3 className="text-lg font-semibold mb-4">{symbol}株価チャート</h3>
      <ResponsiveContainer width="100%" height={400}>
        <LineChart data={stockData}>
          <XAxis
            dataKey="timestamp"
            tickFormatter={formatDate}
            interval="preserveStartEnd"
            minTickGap={50}
          />
          <YAxis
            domain={["auto", "auto"]}
            tickFormatter={(value) => `¥${value.toFixed(2)}`}
          />
          <Tooltip
            labelFormatter={formatDate}
            formatter={(value) => [`¥${Number(value).toFixed(2)}`, '終値']}
          />
          <Line
            type="monotone"
            dataKey="close"
            stroke="#4F46E5"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 6 }}
            name="終値"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}