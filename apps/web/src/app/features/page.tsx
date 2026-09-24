import { redirect } from "next/navigation";

/** /features 자체 페이지는 없으므로 첫 번째 기능 소개로 보낸다 */
export default function FeaturesIndexPage() {
  redirect("/features/coursemaker");
}
