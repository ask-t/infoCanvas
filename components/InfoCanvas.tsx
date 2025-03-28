'use client';

import { useStockData } from "@/hooks/useStockData";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

export default function InfoCanvas({ symbol }: { symbol: string }) {
  const stockData = useStockData(symbol);

  return (
    <div className="bg-white p-4 rounded shadow-md">
      <ResponsiveContainer width="100%" height={400}>
        <LineChart data={stockData}>
          <XAxis dataKey="date" />
          <YAxis domain={["dataMin", "dataMax"]} />
          <Tooltip />
          <Line type="monotone" dataKey="close" stroke="#8884d8" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}