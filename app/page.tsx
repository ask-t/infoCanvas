/* InfoCanvas - 背景 + 屋台配置 + APIキーを環境変数から利用する準備（状態別エフェクト切替対応） */

'use client';

import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { useStockData } from "@/hooks/useStockData";
import dashboardConfig from "@/lib/config/dashboard.json";
import { StockData } from "@/types/stock";
import useLogMessages, { LogMessage } from "@/hooks/useLogMessages";
import { IntervalProvider } from "@/contexts/IntervalContext";

// コンポーネントのインポート
import Header from "@/components/Header";
import Background from "@/components/Background";
import StallContainer from "@/components/StallContainer";
import ChartOverlay from "@/components/ChartOverlay";
import Animations from "@/styles/animations";
import MarqueeDisplay from "@/components/MarqueeDisplay";

// アプリケーションのメインコンポーネント
function App() {
  const searchParams = useSearchParams();
  const mode = searchParams.get('mode');
  const demoState = mode === 'demo' ? searchParams.get('state') : null;
  const [selectedSymbol, setSelectedSymbol] = useState<string | null>(null);
  const { messages, addLogMessage } = useLogMessages();
  const [apiStatus, setApiStatus] = useState<'connecting' | 'connected' | 'error'>('connecting');
  const [viewMode, setViewMode] = useState<'stalls' | 'dashboard'>('stalls');

  // アプリ起動時にAPI接続開始のログを表示
  useEffect(() => {
    addLogMessage({
      text: `InfoCanvas 株価データAPIに接続しています...`,
      type: 'info',
      timestamp: new Date()
    });

    // 5秒後に接続完了のメッセージを表示
    const timer = setTimeout(() => {
      setApiStatus('connected');
      addLogMessage({
        text: `株価データAPI接続が確立されました`,
        type: 'success',
        timestamp: new Date()
      });
    }, 5000);

    return () => clearTimeout(timer);
  }, [addLogMessage]);

  // 前回のデータを記録するためのref
  const prevDataRefs = useRef<Record<string, number | null>>({});
  const prevModeRef = useRef<string | null>(null);
  const prevDemoStateRef = useRef<string | null>(null);

  // 各銘柄のデータを個別にフックで取得
  const stockDataBySymbol: Record<string, StockData[] | null> = {};

  // dashboardConfig に定義されている銘柄のデータを取得
  dashboardConfig.forEach(item => {
    stockDataBySymbol[item.symbol] = null;
  });

  // 主要銘柄のデータを取得
  const appleData = useStockData('AAPL');
  if (appleData) stockDataBySymbol['AAPL'] = appleData;

  const tslaData = useStockData('TSLA');
  if (tslaData) stockDataBySymbol['TSLA'] = tslaData;

  const nvdaData = useStockData('NVDA');
  if (nvdaData) stockDataBySymbol['NVDA'] = nvdaData;

  const msftData = useStockData('MSFT');
  if (msftData) stockDataBySymbol['MSFT'] = msftData;

  const amznData = useStockData('AMZN');
  if (amznData) stockDataBySymbol['AMZN'] = amznData;

  // 株価データの変更を監視し、ログにメッセージを追加
  useEffect(() => {
    // API接続が確立されてない場合は実行しない
    if (apiStatus !== 'connected') return;

    // dashboardConfigで設定されているすべての銘柄のデータを監視
    dashboardConfig.forEach(config => {
      const symbol = config.symbol;
      const data = stockDataBySymbol[symbol];

      if (data && data.length > 0) {
        const latestPrice = data[data.length - 1].close;
        const prevPrice = prevDataRefs.current[symbol];

        // 前回と値が異なる場合のみ通知
        if (prevPrice !== latestPrice) {
          // 前回値との比較で上昇/下落を判定
          let messageType: 'info' | 'success' | 'warning' = 'info';
          let changeText = '';

          if (prevPrice !== null) {
            const priceDiff = latestPrice - prevPrice;
            const percentChange = (priceDiff / prevPrice) * 100;

            if (priceDiff > 0) {
              messageType = 'success';
              changeText = ` (↑ +${percentChange.toFixed(2)}%)`;
            } else if (priceDiff < 0) {
              messageType = 'warning';
              changeText = ` (↓ ${percentChange.toFixed(2)}%)`;
            }
          }

          // 現在値を保存
          prevDataRefs.current[symbol] = latestPrice;

          // ログメッセージを追加
          const message: LogMessage = {
            text: `${symbol} 最新株価: $${latestPrice.toFixed(2)}${changeText}`,
            type: messageType,
            timestamp: new Date()
          };
          addLogMessage(message);
        }
      }
    });
  }, [
    apiStatus,
    addLogMessage,
    stockDataBySymbol,
    appleData,
    tslaData,
    nvdaData,
    msftData,
    amznData
  ]);

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
      text: `${symbol} の詳細チャートを読み込み中...`,
      type: 'info',
      timestamp: new Date()
    });
  };

  const handleCloseChart = () => {
    setSelectedSymbol(null);
    addLogMessage({
      text: `チャート表示を閉じました`,
      type: 'info',
      timestamp: new Date()
    });
  };

  const toggleViewMode = () => {
    const newMode = viewMode === 'stalls' ? 'dashboard' : 'stalls';
    setViewMode(newMode);
    addLogMessage({
      text: `表示モードを${newMode === 'stalls' ? '屋台表示' : 'ダッシュボード表示'}に切り替えました`,
      type: 'info',
      timestamp: new Date()
    });
  };

  return (
    <main className="relative min-h-screen w-full overflow-hidden">
      {/* ヘッダーコンポーネント */}
      <Header addLogMessage={addLogMessage} />

      {/* 背景コンポーネント */}
      <Background />

      {/* 電光掲示板（ログ表示） */}
      <MarqueeDisplay
        messages={messages}
        speed={150}
      />

      {/* 表示モードに応じたコンテンツ */}
      {viewMode === 'stalls' ? (
        <StallContainer
          dashboardConfig={dashboardConfig}
          stockDataBySymbol={stockDataBySymbol}
          demoState={demoState}
          onOpenChart={handleOpenChart}
        />
      ) : (
        <div className="pt-40 pb-16 px-4">
          <Dashboard
            stockDataBySymbol={stockDataBySymbol}
            onOpenChart={handleOpenChart}
            addLogMessage={addLogMessage}
          />
        </div>
      )}

      {/* チャートオーバーレイ */}
      {selectedSymbol && (
        <ChartOverlay
          symbol={selectedSymbol}
          onClose={handleCloseChart}
          addLogMessage={addLogMessage}
        />
      )}

      {/* アニメーションスタイル */}
      <Animations />
    </main>
  );
}

// IntervalProviderでラップしたアプリケーションをエクスポート
export default function HomePage() {
  return (
    <IntervalProvider>
      <App />
    </IntervalProvider>
  );
}
