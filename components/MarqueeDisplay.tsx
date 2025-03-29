import React, { useState, useEffect } from 'react';
import { LogMessage, MessageType } from '@/hooks/useLogMessages';

interface MarqueeDisplayProps {
  messages: LogMessage[];
  speed?: number; // スクロール速度（ミリ秒）
}

const MarqueeDisplay: React.FC<MarqueeDisplayProps> = ({
  messages = [], // デフォルト値を設定
  speed = 100
}) => {
  // 初期位置を0に変更（画面内から表示開始）
  const [scrollPosition, setScrollPosition] = useState(0);
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);

  // デフォルトメッセージ（メッセージがない場合に表示）
  const defaultMessage = '<span class="success-glow">InfoCanvasシステム稼働中...</span>';

  // 安全な配列確保（undefinedエラー対策）
  const safeMessages = Array.isArray(messages) ? messages : [];

  // メッセージを株価関連とその他に分類
  const stockMessages = safeMessages.filter(msg =>
    msg && msg.text && (
      msg.text.includes('$') ||
      msg.text.includes('株価') ||
      /[A-Z]{2,5}/.test(msg.text)
    )
  );

  const otherMessages = safeMessages.filter(msg =>
    msg && msg.text && !(
      msg.text.includes('$') ||
      msg.text.includes('株価') ||
      /[A-Z]{2,5}/.test(msg.text)
    )
  );

  // メッセージを切り替える（静的表示部分用）
  useEffect(() => {
    if (otherMessages.length <= 1) return;

    const messageChangeInterval = setInterval(() => {
      setCurrentMessageIndex(prev => (prev + 1) % otherMessages.length);
    }, 5000); // 5秒ごとにメッセージを切り替え

    return () => clearInterval(messageChangeInterval);
  }, [otherMessages]);

  // 株価メッセージをスクロールさせる
  useEffect(() => {
    if (stockMessages.length === 0) return;

    const scrollTimer = setInterval(() => {
      setScrollPosition(prev => {
        // 完全に表示が終わったら右端に戻す（ループ表示）
        if (prev < -300) {
          return 0;  // リセット位置も0に変更
        }
        return prev - 0.15; // スクロール速度を遅くするために移動量を減らす
      });
    }, speed);

    return () => clearInterval(scrollTimer);
  }, [speed, stockMessages]);

  // メッセージタイプに応じたCSSクラスを取得
  const getMessageClass = (type: MessageType): string => {
    switch (type) {
      case 'error': return 'error-flash';
      case 'warning': return 'warning-flash';
      case 'success': return 'success-glow';
      default: return '';
    }
  };

  // スクロール表示用のHTMLを生成
  const generateScrollHTML = (): string => {
    if (stockMessages.length === 0) return '';

    return stockMessages.map(msg => {
      if (!msg || !msg.text) return '';

      const cssClass = getMessageClass(msg.type);
      const timestamp = new Date(msg.timestamp).toLocaleTimeString('ja-JP', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });

      return cssClass
        ? `[${timestamp}] <span class="${cssClass}">${msg.text}</span>`
        : `[${timestamp}] ${msg.text}`;
    }).join(' ★ ');
  };

  // 表示するテキスト（静的部分）
  let staticDisplayText = defaultMessage;
  if (otherMessages.length > 0) {
    const message = otherMessages[currentMessageIndex];
    if (message && message.text) {
      const cssClass = getMessageClass(message.type);
      const timestamp = new Date(message.timestamp).toLocaleTimeString('ja-JP', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });

      staticDisplayText = cssClass
        ? `[${timestamp}] <span class="${cssClass}">${message.text}</span>`
        : `[${timestamp}] ${message.text}`;
    }
  }

  // HTMLとして表示するスクロールテキスト
  const scrollHTML = generateScrollHTML();

  // メッセージがなければ静的部分だけ表示
  const hasStockMessages = stockMessages.length > 0;
  const hasOtherMessages = otherMessages.length > 0 || defaultMessage.length > 0;

  return (
    <div className="fixed top-20 left-0 right-0 z-30 w-full pointer-events-none overflow-hidden bg-black bg-opacity-80 py-3 border-y-2 border-[#333]">
      {/* 株価以外の情報（常に静的表示） */}
      {hasOtherMessages && (
        <div className="text-center mb-1 whitespace-nowrap font-led text-[#ff5722]"
          style={{
            textShadow: '0 0 5px rgba(255, 87, 34, 0.7), 0 0 10px rgba(255, 87, 34, 0.5)',
            letterSpacing: '1px',
            fontWeight: 'bold',
            fontSize: '1.2rem',
          }}>
          <span className="relative" dangerouslySetInnerHTML={{ __html: staticDisplayText }}></span>
        </div>
      )}

      {/* 株価情報（常にスクロール表示） */}
      {hasStockMessages && (
        <div className="whitespace-nowrap font-led text-[#00bcd4]"
          style={{
            transform: `translateX(${scrollPosition}%)`,
            textShadow: '0 0 5px rgba(0, 188, 212, 0.7), 0 0 10px rgba(0, 188, 212, 0.5)',
            letterSpacing: '1px',
            fontWeight: 'bold',
            fontSize: '1.1rem',
            paddingRight: '50%',  // スクロールアウト用の余白
          }}>
          <span className="relative" dangerouslySetInnerHTML={{ __html: scrollHTML }}></span>
        </div>
      )}
    </div>
  );
};

export default MarqueeDisplay; 