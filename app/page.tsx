/* InfoCanvas - 背景 + 屋台配置 + APIキーを環境変数から利用する準備（状態別エフェクト切替対応） */

'use client';

import { useState } from "react";
import ChartOverlay from "@/components/ChartOverlay";
import dashboardConfig from "@/lib/config/dashboard.json";
import { useStockData } from "@/hooks/useStockData";

import { useSearchParams } from "next/navigation";

// データと状態の型定義
type StockData = { close: number;[key: string]: unknown };
type StatusType = 'surge' | 'up' | 'stable' | 'crash' | 'down' | 'abnormal' | 'unknown';

function getStockStatus(data: StockData[] | null, demoState: string | null): StatusType {
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

export default function HomePage() {
  const searchParams = useSearchParams();
  const mode = searchParams.get('mode');
  const demoState = mode === 'demo' ? searchParams.get('state') : null;
  const [selectedSymbol, setSelectedSymbol] = useState<string | null>(null);

  // 各銘柄のデータを個別にフックで取得
  // コンポーネントのトップレベルで各銘柄のデータを取得
  const stockDataBySymbol: Record<string, StockData[] | null> = {};

  // 各シンボルに対してuseStockDataを呼び出し（個別のカスタムフック）
  dashboardConfig.forEach(item => {
    // ここではダミーの代入のみ行う（実際のデータ取得は別途実装が必要）
    stockDataBySymbol[item.symbol] = null;
  });

  // AAPL（アップル）のデータ例
  const appleData = useStockData('AAPL');
  if (appleData) stockDataBySymbol['AAPL'] = appleData;

  // GOOGL（グーグル）のデータ例
  const googleData = useStockData('GOOGL');
  if (googleData) stockDataBySymbol['GOOGL'] = googleData;

  // MSFT（マイクロソフト）のデータ例
  const msftData = useStockData('MSFT');
  if (msftData) stockDataBySymbol['MSFT'] = msftData;

  // AMZN（アマゾン）のデータ例
  const amznData = useStockData('AMZN');
  if (amznData) stockDataBySymbol['AMZN'] = amznData;

  // META（メタ）のデータ例
  const metaData = useStockData('META');
  if (metaData) stockDataBySymbol['META'] = metaData;

  const handleOpenChart = (symbol: string) => setSelectedSymbol(symbol);
  const handleCloseChart = () => setSelectedSymbol(null);

  return (
    <main className="relative min-h-screen w-full overflow-hidden">
      {/* ヘッダー：表示モード切替 */}
      <div className="absolute top-0 left-0 z-20 w-full bg-black bg-opacity-70 text-white px-6 py-4 flex items-center justify-between">
        <h1 className="text-xl font-bold">InfoCanvas</h1>
        <div className="flex gap-4">
          <button className="bg-white text-black px-4 py-1 rounded hover:bg-gray-200 transition" onClick={() => location.href = '?mode=live'}>
            ライブ表示
          </button>
          <button className="bg-white text-black px-4 py-1 rounded hover:bg-gray-200 transition" onClick={() => location.href = '?mode=demo&state=surge'}>
            高騰デモ
          </button>
          <button className="bg-white text-black px-4 py-1 rounded hover:bg-gray-200 transition" onClick={() => location.href = '?mode=demo&state=up'}>
            上昇デモ
          </button>
          <button className="bg-white text-black px-4 py-1 rounded hover:bg-gray-200 transition" onClick={() => location.href = '?mode=demo&state=stable'}>
            安定デモ
          </button>
          <button className="bg-white text-black px-4 py-1 rounded hover:bg-gray-200 transition" onClick={() => location.href = '?mode=demo&state=crash'}>
            暴落デモ
          </button>
          <button className="bg-white text-black px-4 py-1 rounded hover:bg-gray-200 transition" onClick={() => location.href = '?mode=demo&state=down'}>
            下落デモ
          </button>
          <button className="bg-white text-black px-4 py-1 rounded hover:bg-gray-200 transition" onClick={() => location.href = '?mode=demo&state=abnormal'}>
            異常デモ
          </button>
          <button className="bg-white text-black px-4 py-1 rounded hover:bg-gray-200 transition" onClick={() => location.href = '?mode=demo&state=unknown'}>
            不明デモ
          </button>
        </div>
      </div>
      {/* 背景画像 */}
      <div className="absolute inset-0 z-0">
        <img
          src="/background/night-town.jpg"
          alt="Background"
          className="w-full h-full object-cover"
        />
      </div>

      {/* 屋台アイコンの配置 */}
      <div className="relative z-10 w-full h-screen">
        {dashboardConfig.map((item) => {
          const data = stockDataBySymbol[item.symbol];
          const status = getStockStatus(data, demoState);

          const showCustomer = ["surge", "up", "stable"].includes(status);
          const customerClass =
            status === "surge"
              ? "animate-bounce fast"
              : status === "up"
                ? "animate-bounce"
                : status === "stable"
                  ? ""
                  : "hidden";

          const effectIcon =
            status === "crash"
              ? "/icons/thunder.png"
              : status === "down"
                ? "/icons/ghost.png"
                : status === "abnormal"
                  ? "/icons/alert.png"
                  : status === "unknown"
                    ? "/icons/question.png"
                    : null;

          const stallClass =
            status === "surge"
              ? "w-32 drop-shadow-[0_0_25px_rgba(255,255,150,0.9)] brightness-125 animate-[flash_1.2s_ease-in-out_infinite]"
              : "w-32";

          return (
            <div
              key={item.symbol}
              className="absolute cursor-pointer"
              style={{ left: item.position.left, bottom: `calc(${item.position.bottom} - 40px)` }}
              onClick={() => handleOpenChart(item.symbol)}
            >
              <img src={item.image} alt={item.symbol} className={stallClass} style={{ filter: 'brightness(1)' }} />

              {showCustomer && (
                <img
                  src="/icons/customers.png"
                  alt="Effect"
                  className={`absolute left-1/2 -translate-x-1/2 w-[150px] ${customerClass}`}
                />
              )}

              {effectIcon && (
                <img
                  src={effectIcon}
                  alt="Effect"
                  className={`absolute -top-28 left-1/2 -translate-x-1/2 w-24 opacity-90 ${status === 'crash' ? 'animate-[flash_0.8s_ease-in-out_infinite]' : 'animate-float-slow'}`}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* チャートオーバーレイ */}
      {selectedSymbol && (
        <ChartOverlay symbol={selectedSymbol} onClose={handleCloseChart} />
      )}

      <style jsx global>{`
        @keyframes flash {
          0%, 100% { filter: brightness(1); }
          50% { filter: brightness(2.5); }
        }
        
        .animate-bounce.fast {
          animation: bounce 0.6s infinite;
        }
        
        .animate-float-slow {
          animation: float 3s ease-in-out infinite;
        }
        
        @keyframes float {
          0%, 100% { transform: translate(-50%, 0); }
          50% { transform: translate(-50%, -10px); }
        }
      `}</style>
    </main>
  );
}
