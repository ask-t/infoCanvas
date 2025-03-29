import { useState, useCallback, useEffect, useRef } from 'react';

// 明示的にメッセージタイプを定義
export type MessageType = 'info' | 'success' | 'warning' | 'error';

export interface LogMessage {
  text: string;
  type: MessageType;
  timestamp: Date;
}

export function useLogMessages(maxMessages: number = 15) {
  const [messages, setMessages] = useState<LogMessage[]>([]);
  const initializedRef = useRef(false);
  const initialDataLoadedRef = useRef(false);

  // 新しいメッセージを追加する関数
  const addLogMessage = useCallback((message: string | LogMessage) => {
    let messageText: LogMessage;

    if (typeof message === 'string') {
      messageText = { text: message, type: 'info', timestamp: new Date() };
    } else {
      messageText = { ...message, timestamp: new Date(message.timestamp) };
    }

    setMessages(prev => {
      // 既に同じメッセージがあれば追加しない（重複防止）
      if (prev.some(m => m.text === messageText.text && m.type === messageText.type)) {
        return prev;
      }

      // 最大数を超える場合は古いメッセージを削除
      const newMessages = [...prev, messageText];
      if (newMessages.length > maxMessages) {
        return newMessages.slice(-maxMessages);
      }
      return newMessages;
    });
  }, [maxMessages]);

  // 初期デモメッセージを一度だけ設定するための分離されたeffect
  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    const demoData = loadInitialDemoData();
    setMessages(demoData);
    initialDataLoadedRef.current = true;
  }, []);

  // 定期的なランダムメッセージのための分離されたeffect
  useEffect(() => {
    if (!initialDataLoadedRef.current) return;

    const interval = setInterval(() => {
      const randomMsg = getRandomMessage();
      addLogMessage(randomMsg);
    }, 10000); // 10秒ごとにランダムメッセージ

    return () => clearInterval(interval);
  }, [addLogMessage]);

  return { messages, addLogMessage };
}

// 初期デモメッセージをロードする純粋な関数
function loadInitialDemoData(): LogMessage[] {
  const initialMessages: Array<{ text: string; type: MessageType }> = [
    { text: 'InfoCanvas システム起動中...', type: 'info' },
    { text: '株式市場データ接続完了', type: 'success' },
    { text: 'API認証完了 - データストリーム開始', type: 'info' },
    { text: 'AAPL: 前日比 +2.3% 上昇傾向', type: 'info' },
    { text: 'GOOGL: 前日比 -0.7% 安定推移中', type: 'info' },
    { text: 'MSFT: 大量取引検知: 500,000株', type: 'warning' },
    { text: 'AMZN: 急上昇シグナル検出', type: 'info' },
    { text: 'META: 前日比 -3.5% 下落傾向', type: 'info' },
    { text: '市場全体: ボラティリティ増加中', type: 'warning' },
    { text: 'サーバー接続: 一時的な遅延が発生しています', type: 'warning' },
    { text: 'データ更新: 最新の市場データを取得しました', type: 'success' },
    { text: 'システム負荷: 23%', type: 'info' }
  ];

  return initialMessages.map(msg => ({
    text: msg.text,
    type: msg.type,
    timestamp: new Date()
  }));
}

// ランダムメッセージを生成する純粋な関数
function getRandomMessage(): LogMessage {
  const randomMessages: Array<{ text: string; type: MessageType }> = [
    { text: 'データ更新完了: 最新情報に更新されました', type: 'success' },
    { text: 'メモリ使用率: 45%', type: 'info' },
    { text: 'サーバー応答時間: 120ms', type: 'info' },
    { text: 'ネットワーク接続が不安定です', type: 'warning' },
    { text: '市場データフィードが遅延しています', type: 'warning' },
    { text: 'API呼び出し制限に近づいています', type: 'warning' },
    { text: 'データバッファがいっぱいです: 古いデータを削除します', type: 'error' },
    { text: 'AMZN: 異常取引パターンを検出', type: 'warning' },
    { text: 'サーバーメンテナンス予定: 明日 03:00-04:00', type: 'info' }
  ];

  const now = new Date();
  const randomIndex = Math.floor(Math.random() * randomMessages.length);
  const { text, type } = randomMessages[randomIndex];

  return {
    text,
    type,
    timestamp: now
  };
}

export default useLogMessages; 