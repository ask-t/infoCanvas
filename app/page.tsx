/* InfoCanvas - 背景 + 屋台配置 + APIキーを環境変数から利用する準備（状態別エフェクト切替対応） */

'use client';

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { useStockData } from "@/hooks/useStockData";
import dashboardConfig from "@/lib/config/dashboard.json";
import { StockData } from "@/types/stock";

// コンポーネントのインポート
import Header from "@/components/Header";
import Background from "@/components/Background";
import StallContainer from "@/components/StallContainer";
import ChartOverlay from "@/components/ChartOverlay";
import Animations from "@/styles/animations";

export default function HomePage() {
  const searchParams = useSearchParams();
  const mode = searchParams.get('mode');
  const demoState = mode === 'demo' ? searchParams.get('state') : null;
  const [selectedSymbol, setSelectedSymbol] = useState<string | null>(null);

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

  const handleOpenChart = (symbol: string) => setSelectedSymbol(symbol);
  const handleCloseChart = () => setSelectedSymbol(null);

  return (
    <main className="relative min-h-screen w-full overflow-hidden">
      {/* ヘッダーコンポーネント */}
      <Header />

      {/* 背景コンポーネント */}
      <Background />

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
