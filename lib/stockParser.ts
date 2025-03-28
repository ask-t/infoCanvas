import { StockData } from "@/types/stock";

type AlphaVantageResponse = {
  [key: string]: any;
};

export function parseAlphaVantageResponse(data: AlphaVantageResponse): StockData[] {
  const timeSeriesKey = Object.keys(data).find((key) => key.startsWith("Time Series"));
  if (!timeSeriesKey) return [];

  const rawSeries = data[timeSeriesKey];
  const parsed: StockData[] = Object.entries(rawSeries).map(([datetime, values]) => ({
    date: datetime,
    open: parseFloat(values["1. open"]),
    high: parseFloat(values["2. high"]),
    low: parseFloat(values["3. low"]),
    close: parseFloat(values["4. close"]),
    volume: parseInt(values["5. volume"], 10),
  }));

  return parsed.reverse();
}