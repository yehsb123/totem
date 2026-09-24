import Link from "next/link";

/** 리소스 하위 페이지 → 리소스 센터로 돌아가기 */
export default function BackLink() {
  return (
    <Link
      href="/resources"
      className="mb-8 inline-flex items-center text-sm font-medium text-indigo-600 transition-colors hover:text-indigo-700"
    >
      <svg viewBox="0 0 20 20" fill="currentColor" className="mr-1 size-5" aria-hidden>
        <path
          fillRule="evenodd"
          d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
          clipRule="evenodd"
        />
      </svg>
      리소스 센터
    </Link>
  );
}
