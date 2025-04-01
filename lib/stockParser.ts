/* eslint-disable @typescript-eslint/no-explicit-any */
import { StockData } from "@/types/stock";

// AlphaVantageレスポンスの型をより詳細に定義
type TimeSeriesValue = {
  "1. open": string;
  "2. high": string;
  "3. low": string;
  "4. close": string;
  "5. volume": string;
  [key: string]: string;
};

type AlphaVantageResponse = {
  "Meta Data"?: {
    [key: string]: string;
  };
  [key: string]: any;
};

export function parseAlphaVantageResponse(data: AlphaVantageResponse): StockData[] {
  const timeSeriesKey = Object.keys(data).find((key) => key.startsWith("Time Series"));
  if (!timeSeriesKey) return [];

  const rawSeries = data[timeSeriesKey];
  const parsed: StockData[] = Object.entries(rawSeries).map(([datetime, values]) => {
    // 適切な型アサーションを使用
    const timeSeriesValue = values as TimeSeriesValue;
    return {
      date: datetime,
      timestamp: new Date(datetime),
      open: parseFloat(timeSeriesValue["1. open"]),
      high: parseFloat(timeSeriesValue["2. high"]),
      low: parseFloat(timeSeriesValue["3. low"]),
      close: parseFloat(timeSeriesValue["4. close"]),
      volume: parseInt(timeSeriesValue["5. volume"], 10),
    };
  });

  return parsed.reverse();
}