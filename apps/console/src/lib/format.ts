/**
 * 날짜는 모두 "로컬 날짜" 기준 YYYY-MM-DD 문자열로 다룬다.
 * toISOString() 은 UTC 라 한국 시간 오전 9시 전에는 하루 전 날짜가 나오므로 쓰지 않는다 (AUDIT F5).
 */
export function toLocalDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export const today = () => toLocalDate(new Date());

/** "YYYY-MM-DD" → 로컬 자정 Date */
export const parseLocalDate = (s: string) => {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
};

export const addDays = (s: string, n: number) => {
  const d = parseLocalDate(s);
  d.setDate(d.getDate() + n);
  return toLocalDate(d);
};

export const toMonth = (d: Date) => toLocalDate(d).slice(0, 7);

export const shiftMonth = (month: string, n: number) => {
  const [y, m] = month.split("-").map(Number);
  return toMonth(new Date(y, m - 1 + n, 1));
};

export const formatMonthKo = (month: string) => {
  const [y, m] = month.split("-");
  return `${y}년 ${Number(m)}월`;
};

export const formatDateKo = (iso: string | null | undefined) => {
  if (!iso) return "-";
  const d = new Date(iso);
  return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일`;
};

export const formatNumber = (n: number) => n.toLocaleString("ko-KR");

export const formatWon = (n: number) => `${n.toLocaleString("ko-KR")}원`;

/** 큰 수를 만·억 단위로 (대시보드 카드) */
export function formatKoreanUnit(n: number): string {
  if (Math.abs(n) >= 1e8) return `${(n / 1e8).toFixed(1).replace(/\.0$/, "")}억`;
  if (Math.abs(n) >= 1e4) return `${(n / 1e4).toFixed(1).replace(/\.0$/, "")}만`;
  return n.toLocaleString("ko-KR");
}
