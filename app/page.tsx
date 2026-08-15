import KakaoMap from "@/components/map/KakaoMap";
import { getCafes } from "@/lib/cafes/repository";

/**
 * 서버 컴포넌트에서 데이터를 읽어 클라이언트 지도 컴포넌트로 내려준다.
 * 데이터 소스가 나중에 DB로 바뀌어도 이 구조는 그대로 유지된다.
 */
export default async function Home() {
  const cafes = await getCafes();

  return (
    <main className="flex h-dvh flex-col">
      <header className="flex items-baseline gap-3 border-b border-neutral-200 px-4 py-3">
        <h1 className="text-base font-semibold">카공맵</h1>
        <p className="text-sm text-neutral-500">성수 · {cafes.length}곳</p>
      </header>

      <div className="min-h-0 flex-1">
        <KakaoMap cafes={cafes} />
      </div>
    </main>
  );
}
