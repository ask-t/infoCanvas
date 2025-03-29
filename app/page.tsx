/* InfoCanvas - 背景 + 屋台配置 + APIキーを環境変数から利用する準備（状態別エフェクト切替対応） */

'use client';

import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { useStockData } from "@/hooks/useStockData";
import dashboardConfig from "@/lib/config/dashboard.json";
import { StockData } from "@/types/stock";
import useLogMessages, { LogMessage } from "@/hooks/useLogMessages";

// コンポーネントのインポート
import Header from "@/components/Header";
import Background from "@/components/Background";
import StallContainer from "@/components/StallContainer";
// チャートオーバーレイコンポーネントが実装されるまではコメントアウト
// import ChartOverlay from "@/components/ChartOverlay";
import Animations from "@/styles/animations";
import MarqueeDisplay from "@/components/MarqueeDisplay";

// 仮のChartOverlayコンポーネント（後で実装予定）
const ChartOverlay = ({ symbol, onClose }: { symbol: string, onClose: () => void }) => (
  <div className="fixed inset-0 z-40 bg-black bg-opacity-80 flex items-center justify-center">
    <div className="bg-white rounded-lg p-4 max-w-4xl max-h-[80vh] overflow-auto">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">{symbol} 詳細チャート</h2>
        <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
          閉じる
        </button>
      </div>
      <div className="h-96 bg-gray-100 flex items-center justify-center">
        <p>チャート表示予定 - 実装中</p>
      </div>
    </div>
  </div>
);

export default function HomePage() {
  const searchParams = useSearchParams();
  const mode = searchParams.get('mode');
  const demoState = mode === 'demo' ? searchParams.get('state') : null;
  const [selectedSymbol, setSelectedSymbol] = useState<string | null>(null);
  const { messages, addLogMessage } = useLogMessages();

  // 前回のデータを記録するためのref
  const prevAppleDataRef = useRef<number | null>(null);
  const prevModeRef = useRef<string | null>(null);
  const prevDemoStateRef = useRef<string | null>(null);

  // 各銘柄のデータを個別にフックで取得
  const stockDataBySymbol: Record<string, StockData[] | null> = {};

  // 各シンボルに対してuseStockDataを呼び出し（個別のカスタムフック）
  dashboardConfig.forEach(item => {
    // ここではダミーの代入のみ行う（実際のデータ取得は別途実装が必要）
    stockDataBySymbol[item.symbol] = null;
  });

  // 主要銘柄のデータを取得
  const appleData = useStockData('AAPL');
  if (appleData) stockDataBySymbol['AAPL'] = appleData;

  const googleData = useStockData('GOOGL');
  if (googleData) stockDataBySymbol['GOOGL'] = googleData;

  const msftData = useStockData('MSFT');
  if (msftData) stockDataBySymbol['MSFT'] = msftData;

  const amznData = useStockData('AMZN');
  if (amznData) stockDataBySymbol['AMZN'] = amznData;

  const metaData = useStockData('META');
  if (metaData) stockDataBySymbol['META'] = metaData;

  // データの変更を監視し、ログにメッセージを追加（変更時のみ）
  useEffect(() => {
    // 株価データの変化を検出して通知
    if (appleData && appleData.length > 0) {
      const latestPrice = appleData[appleData.length - 1].close;

      // 前回と値が異なる場合のみ通知
      if (prevAppleDataRef.current !== latestPrice) {
        prevAppleDataRef.current = latestPrice;

        const message: LogMessage = {
          text: `AAPL 最新株価: $${latestPrice.toFixed(2)}`,
          type: 'info',
          timestamp: new Date()
        };
        addLogMessage(message);
      }
    }
  }, [appleData, addLogMessage]);

  // モードやデモ状態の変更を監視（別のuseEffectに分離）
  useEffect(() => {
    // モードまたはデモ状態が変わった場合のみ通知
    if (mode !== prevModeRef.current || demoState !== prevDemoStateRef.current) {
      prevModeRef.current = mode;
      prevDemoStateRef.current = demoState;

      if (mode === 'demo' && demoState) {
        const messageType =
          demoState === 'crash' || demoState === 'down' ? 'warning' :
            demoState === 'surge' || demoState === 'up' ? 'success' :
              demoState === 'abnormal' ? 'error' : 'info';

        const message: LogMessage = {
          text: `デモモード: ${demoState} 状態をシミュレーション中...`,
          type: messageType,
          timestamp: new Date()
        };
        addLogMessage(message);
      }
    }
  }, [mode, demoState, addLogMessage]);

  const handleOpenChart = (symbol: string) => {
    setSelectedSymbol(symbol);
    addLogMessage({
      text: `${symbol} の詳細チャートを表示中...`,
      type: 'info',
      timestamp: new Date()
    });
  };

  const handleCloseChart = () => setSelectedSymbol(null);

  return (
    <main className="relative min-h-screen w-full overflow-hidden">
      {/* ヘッダーコンポーネント */}
      <Header />

      {/* 背景コンポーネント */}
      <Background />

      {/* 電光掲示板（ログ表示） */}
      <MarqueeDisplay
        messages={messages}
        speed={150}
      />

      {/* 屋台コンテナコンポーネント */}
      <StallContainer
        dashboardConfig={dashboardConfig}
        stockDataBySymbol={stockDataBySymbol}
        demoState={demoState}
        onOpenChart={handleOpenChart}
      />

      {/* チャートオーバーレイ */}
      {selectedSymbol && (
        <ChartOverlay symbol={selectedSymbol} onClose={handleCloseChart} />
      )}

      {/* アニメーションスタイル */}
      <Animations />
    </main>
  );
}
