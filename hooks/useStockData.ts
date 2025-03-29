import { useState, useEffect, useCallback } from 'react';
import { StockData } from '@/types/stock';
import { LogMessage } from './useLogMessages';
import { useInterval, IntervalType } from '@/contexts/IntervalContext';

// 株価データのAPIレスポンスの型定義
interface TimeSeriesValue {
  '1. open': string;
  '2. high': string;
  '3. low': string;
  '4. close': string;
  '5. volume': string;
}

interface ApiResponse {
  'Meta Data'?: {
    '1. Information': string;
    '2. Symbol': string;
    '3. Last Refreshed': string;
    '4. Interval': string;
    '5. Output Size': string;
    '6. Time Zone': string;
  };
  'Time Series (5min)'?: Record<string, TimeSeriesValue>;
  'Time Series (1min)'?: Record<string, TimeSeriesValue>;
  'Time Series (15min)'?: Record<string, TimeSeriesValue>;
  'Time Series (30min)'?: Record<string, TimeSeriesValue>;
  'Time Series (60min)'?: Record<string, TimeSeriesValue>;
  'Time Series (Daily)'?: Record<string, TimeSeriesValue>;
  'Error Message'?: string;
  'Note'?: string;
}

// グローバルなaddLogMessageハンドラ
let globalLogHandler: ((message: LogMessage) => void) | null = null;

// ロギングハンドラを設定する関数
export function setGlobalLogHandler(handler: (message: LogMessage) => void) {
  globalLogHandler = handler;
}

// ログメッセージを追加する関数
function addLogMessage(message: LogMessage) {
  if (globalLogHandler) {
    globalLogHandler(message);
  }
  console.log(`[${message.type.toUpperCase()}] ${message.text}`);
}

// APIレスポンスからタイムシリーズデータを取得する関数
function getTimeSeriesFromResponse(data: ApiResponse, interval: IntervalType): Record<string, TimeSeriesValue> | null {
  switch (interval) {
    case '1min':
      return data['Time Series (1min)'] || null;
    case '5min':
      return data['Time Series (5min)'] || null;
    case '15min':
      return data['Time Series (15min)'] || null;
    case '30min':
      return data['Time Series (30min)'] || null;
    case '60min':
      return data['Time Series (60min)'] || null;
    case 'daily':
      return data['Time Series (Daily)'] || null;
    default:
      return data['Time Series (5min)'] || null;
  }
}

// 直近の株価データ取得API関数
async function fetchStockData(symbol: string, interval: IntervalType): Promise<StockData[]> {
  try {
    // API接続試行をログに記録
    addLogMessage({
      text: `${symbol}の株価データ取得を開始...（${interval}間隔）`,
      type: 'info',
      timestamp: new Date()
    });

    // AlphaVantage APIから株価データを取得
    const API_KEY = process.env.NEXT_PUBLIC_ALPHA_VANTAGE_API_KEY || 'demo';

    // インターバルに応じてAPIエンドポイントを選択
    const functionParam = interval === 'daily' ? 'TIME_SERIES_DAILY' : 'TIME_SERIES_INTRADAY';
    const url = `https://www.alphavantage.co/query?function=${functionParam}&symbol=${symbol}&interval=${interval === 'daily' ? '' : interval}&apikey=${API_KEY}`;

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`API接続エラー: ${response.status} ${response.statusText}`);
    }

    const data: ApiResponse = await response.json();

    // APIからのエラーレスポンスをチェック
    if (data['Error Message']) {
      throw new Error(`API エラー: ${data['Error Message']}`);
    }

    if (data['Note']) {
      // API利用制限に達した場合のメッセージ
      addLogMessage({
        text: `API制限到達: ${data['Note']}`,
        type: 'warning',
        timestamp: new Date()
      });
      return generateDemoData(symbol, interval); // デモデータを返す
    }

    // レスポンスからインターバルに対応するタイムシリーズを取得
    const timeSeriesData = getTimeSeriesFromResponse(data, interval);

    if (!timeSeriesData) {
      throw new Error(`タイムシリーズデータが見つかりません（${interval}）`);
    }

    // JSON応答をStockData配列に変換
    const stockData: StockData[] = Object.entries(timeSeriesData).map(([timestamp, values]) => ({
      timestamp: new Date(timestamp),
      open: parseFloat(values['1. open']),
      high: parseFloat(values['2. high']),
      low: parseFloat(values['3. low']),
      close: parseFloat(values['4. close']),
      volume: parseInt(values['5. volume'], 10)
    })).sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

    // 成功ログ
    addLogMessage({
      text: `${symbol}の株価データを正常に取得（${stockData.length}件、${interval}間隔）`,
      type: 'success',
      timestamp: new Date()
    });

    return stockData;

  } catch (error) {
    // エラーログ
    addLogMessage({
      text: `${symbol}のデータ取得エラー: ${error instanceof Error ? error.message : '不明なエラー'}`,
      type: 'error',
      timestamp: new Date()
    });

    console.error('Stock API error:', error);
    return generateDemoData(symbol, interval); // エラー時はデモデータを返す
  }
}

// APIキーがない場合やエラー時に使用するデモデータ生成関数
function generateDemoData(symbol: string, interval: IntervalType): StockData[] {
  const data: StockData[] = [];
  const now = new Date();
  let basePrice: number;

  // 銘柄ごとにリアルな価格帯を設定
  switch (symbol) {
    case 'AAPL': basePrice = 175.0; break;
    case 'MSFT': basePrice = 338.0; break;
    case 'GOOGL': basePrice = 130.0; break;
    case 'AMZN': basePrice = 145.0; break;
    case 'META': basePrice = 318.0; break;
    case 'TSLA': basePrice = 260.0; break;
    case 'NVDA': basePrice = 700.0; break;
    default: basePrice = 100.0;
  }

  // 傾向の設定（上昇、下降、ランダム）
  const trend = Math.random() > 0.5 ? 'up' : Math.random() > 0.5 ? 'down' : 'mixed';
  const trendFactor = trend === 'up' ? 0.01 : trend === 'down' ? -0.01 : 0;

  // ボラティリティの設定
  const volatility = 0.02; // 2%のボラティリティ

  // トレンド生成のための累積要素
  let cumulativeFactor = 1.0;

  // インターバルに応じてデータ生成量を調整
  let intervalMinutes: number;
  let daysToGenerate: number;

  switch (interval) {
    case '1min':
      intervalMinutes = 1;
      daysToGenerate = 7; // 1分間隔なら7日分
      break;
    case '5min':
      intervalMinutes = 5;
      daysToGenerate = 30; // 5分間隔なら30日分
      break;
    case '15min':
      intervalMinutes = 15;
      daysToGenerate = 60; // 15分間隔なら60日分
      break;
    case '30min':
      intervalMinutes = 30;
      daysToGenerate = 90; // 30分間隔なら90日分
      break;
    case '60min':
      intervalMinutes = 60;
      daysToGenerate = 120; // 60分間隔なら120日分
      break;
    case 'daily':
      intervalMinutes = 24 * 60;
      daysToGenerate = 365; // 日次なら365日分
      break;
    default:
      intervalMinutes = 5;
      daysToGenerate = 30;
  }

  // 1日あたりのインターバル数
  const intervalsPerDay = 24 * 60 / intervalMinutes;
  const totalIntervals = Math.min(daysToGenerate * intervalsPerDay, 5000); // 上限を設ける

  for (let i = 0; i < totalIntervals; i++) {
    // 時間をさかのぼる
    const timestamp = new Date(now.getTime() - (i * intervalMinutes * 60 * 1000));

    // トレンドに基づく価格変動
    if (i % intervalsPerDay === 0) { // 1日ごとに傾向を少し加速
      cumulativeFactor *= (1 + (Math.random() * 0.01 * (trend === 'mixed' ? (Math.random() > 0.5 ? 1 : -1) : 1)));
    }

    // ランダム要素と傾向を組み合わせて価格を計算
    const randomWalk = (Math.random() * 2 - 1) * volatility;
    const price = basePrice * cumulativeFactor * (1 + randomWalk + (i / totalIntervals) * trendFactor);

    // 少し価格を変動させて高値・安値を生成
    const high = price * (1 + Math.random() * 0.01);
    const low = price * (1 - Math.random() * 0.01);
    const open = low + Math.random() * (high - low);
    const close = low + Math.random() * (high - low);

    // ボリュームもランダムに生成（傾向に影響される）
    const volumeBase = 100000 + Math.random() * 900000;
    const volume = Math.floor(volumeBase * (1 + Math.abs(randomWalk) * 2)); // 価格変動が大きいほどボリュームも大きい

    data.push({
      timestamp,
      open: parseFloat(open.toFixed(2)),
      high: parseFloat(high.toFixed(2)),
      low: parseFloat(low.toFixed(2)),
      close: parseFloat(close.toFixed(2)),
      volume
    });
  }

  // 日付順（古い順）で並べ替え
  return data.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
}

// カスタムフック
export function useStockData(symbol: string) {
  const [stockData, setStockData] = useState<StockData[] | null>(null);
  const { interval } = useInterval(); // コンテキストからインターバルを取得

  // 定期的なデータ取得
  const fetchData = useCallback(async () => {
    try {
      const data = await fetchStockData(symbol, interval);
      setStockData(data);
    } catch (error) {
      console.error(`Error fetching stock data for ${symbol}:`, error);
      setStockData(generateDemoData(symbol, interval));
    }
  }, [symbol, interval]);

  // 初期データロードと定期更新
  useEffect(() => {
    let isMounted = true;

    const getStockData = async () => {
      if (!isMounted) return;
      await fetchData();
    };

    getStockData();

    // インターバルに基づいて更新頻度を決定
    let updateInterval = 60000; // デフォルトは1分
    switch (interval) {
      case '1min': updateInterval = 60 * 1000; break;
      case '5min': updateInterval = 5 * 60 * 1000; break;
      case '15min': updateInterval = 15 * 60 * 1000; break;
      case '30min': updateInterval = 30 * 60 * 1000; break;
      case '60min': updateInterval = 60 * 60 * 1000; break;
      case 'daily': updateInterval = 24 * 60 * 60 * 1000; break;
    }

    // データ更新タイマー
    const timer = setInterval(getStockData, updateInterval);

    return () => {
      isMounted = false;
      clearInterval(timer);
    };
  }, [fetchData, interval]);

  return stockData;
}