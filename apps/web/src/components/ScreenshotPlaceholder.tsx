/**
 * 아직 받지 못한 스크린샷 자리표시 (WEB-004).
 * 실제 이미지를 public/images/ 에 넣으면 이 컴포넌트 대신 next/image 로 바꾼다.
 */
export default function ScreenshotPlaceholder({
  name,
  aspect = "16 / 9",
  className = "",
}: {
  /** 들어올 이미지 파일명 (예: images/schedule-intro.png) */
  name: string;
  /** CSS aspect-ratio 값 */
  aspect?: string;
  className?: string;
}) {
  return (
    <div
      role="img"
      aria-label={`스크린샷 준비 중: ${name}`}
      style={{ aspectRatio: aspect }}
      className={`flex w-full items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-100 p-6 ${className}`}
    >
      <div className="flex flex-col items-center gap-2 text-center text-slate-500">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="size-8" aria-hidden>
          <rect x="3" y="4" width="18" height="16" rx="2" />
          <circle cx="8.5" cy="9.5" r="1.5" />
          <path d="m21 16-5-5-8 8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <span className="text-sm">스크린샷 준비 중: {name}</span>
      </div>
    </div>
  );
}
