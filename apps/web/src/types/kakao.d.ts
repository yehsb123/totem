/** Kakao JavaScript SDK 2.x 중 이 사이트가 쓰는 부분만 선언한다 */
interface KakaoSdk {
  init(appKey: string): void;
  isInitialized(): boolean;
  Auth: {
    /** 카카오 인가 페이지로 이동한다 (반환값 없음 — redirectUri 로 ?code=&state= 가 붙어 돌아온다) */
    authorize(options: { redirectUri: string; state?: string; scope?: string; prompt?: string }): void;
  };
}

interface Window {
  Kakao?: KakaoSdk;
}
