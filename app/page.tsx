/* eslint-disable react/jsx-no-undef */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* InfoCanvas - 背景 + 屋台配置 + API key to use from environment variable (state-specific effect switching) */

import { Suspense } from "react";
import { IntervalProvider } from "@/contexts/IntervalContext";
import MainApp from "@/components/MainApp";
import Loading from "@/components/Loading";

// Pageコンポーネントは単純にクライアントコンポーネントをラップするだけにする
export default function HomePage() {
  return (
    <IntervalProvider>
      <Suspense fallback={<Loading />}>
        <MainApp />
      </Suspense>
    </IntervalProvider>
  );
}
