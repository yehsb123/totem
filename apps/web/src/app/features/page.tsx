import { permanentRedirect } from "next/navigation";

/** /features 자체 페이지는 없으므로 첫 번째 기능 소개로 보낸다 (영구 이동 — 검색엔진이 같은 내용을 두 주소로 보지 않게) */
export default function FeaturesIndexPage() {
  permanentRedirect("/features/coursemaker");
}
