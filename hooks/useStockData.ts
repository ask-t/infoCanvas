import { parseAlphaVantageResponse } from "@/lib/stockParser";
import { StockData } from "@/types/stock";

export function useStockData(symbol: string): StockData[] {
  try {
    const data = require(`@/lib/mock/${symbol.toLowerCase()}-intraday.json`);
    return parseAlphaVantageResponse(data);
  } catch (e) {
    console.error("データ読み込みエラー:", symbol);
    return [];
  }
}