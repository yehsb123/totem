"use client";

import { FileDown, Plus, Search, Star, Trash2, Upload } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { createReviewRequest, type ImportReviewsResult, type Review, type Tour } from "@totem/shared";
import { EmptyState, ErrorState, Field, LoadingState, Modal, btn, inputClass, useToast } from "@/components/ui";
import { api, errorMessage } from "@/lib/api";

function Stars({ value }: { value: number | null }) {
  const rounded = Math.round(value ?? 0);
  return (
    <span className="inline-flex" aria-label={value === null ? "평점 없음" : `${value}점`}>
      {Array.from({ length: 5 }, (_, i) => (
        <Star key={i} className={`h-4 w-4 ${i < rounded ? "fill-yellow-400 text-yellow-400" : "text-slate-300"}`} />
      ))}
    </span>
  );
}

const score = (v: number | null) => (v === null ? "-" : v);

export default function ReviewsPage() {
  const toast = useToast();
  const [q, setQ] = useState("");
  const [tours, setTours] = useState<Tour[]>([]);
  const [loadingTours, setLoadingTours] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Tour | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [csvFor, setCsvFor] = useState<Tour | null>(null);
  const [addFor, setAddFor] = useState<Tour | null>(null);

  const loadTours = useCallback(async () => {
    setLoadingTours(true);
    setError(null);
    try {
      setTours((await api.tours.list({ q: q.trim() || undefined, limit: 100 })).items);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setLoadingTours(false);
    }
  }, [q]);

  useEffect(() => {
    const t = setTimeout(loadTours, 200);
    return () => clearTimeout(t);
  }, [loadTours]);

  const openTour = useCallback(
    async (tour: Tour) => {
      setSelected(tour);
      setLoadingReviews(true);
      try {
        setReviews((await api.reviews.listByTour(tour.id, { limit: 200 })).items);
      } catch (e) {
        toast.error(errorMessage(e));
        setReviews([]);
      } finally {
        setLoadingReviews(false);
      }
    },
    [toast],
  );

  /** 리뷰가 바뀌면 투어 목록의 평균·개수도 서버 값으로 다시 받는다 */
  const refreshSelected = async (tour: Tour) => {
    const fresh = await api.tours.get(tour.id);
    setTours((arr) => arr.map((t) => (t.id === fresh.id ? fresh : t)));
    await openTour(fresh);
  };

  const removeReview = async (r: Review) => {
    if (!selected || !window.confirm("이 리뷰를 삭제할까요?")) return;
    try {
      await api.reviews.remove(r.id);
      toast.success("리뷰를 삭제했습니다.");
      await refreshSelected(selected);
    } catch (e) {
      toast.error(errorMessage(e));
    }
  };

  const averages = useMemo(() => {
    const avg = (pick: (r: Review) => number | null) => {
      const vals = reviews.map(pick).filter((v): v is number => v !== null);
      return vals.length ? Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10 : null;
    };
    return {
      total: avg((r) => r.totalRating),
      restaurant: avg((r) => r.restaurantRating),
      accommodation: avg((r) => r.accommodationRating),
      attraction: avg((r) => r.attractionRating),
      guide: avg((r) => r.guideRating),
    };
  }, [reviews]);

  return (
    <div className="space-y-4 p-4">
      <div className="no-print flex flex-wrap items-center gap-3 rounded-lg bg-white p-4 shadow-sm">
        <div className="relative w-72">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input className={`${inputClass} pl-9`} placeholder="투어 이름 검색" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        {loadingTours && <span className="text-sm text-slate-500">불러오는 중…</span>}
      </div>

      <div className="no-print overflow-x-auto rounded-lg bg-white shadow-sm">
        {error ? (
          <ErrorState message={error} onRetry={loadTours} />
        ) : !loadingTours && tours.length === 0 ? (
          <EmptyState text="투어가 없습니다. 투어관리에서 먼저 투어를 등록하세요." />
        ) : (
          <table className="w-full min-w-[720px] text-sm">
            <thead className="bg-blue-50 text-slate-700">
              <tr>
                <th className="p-3 text-left">투어명</th>
                <th className="p-3">기간</th>
                <th className="p-3">담당자</th>
                <th className="p-3">평균 평점</th>
                <th className="p-3">리뷰 수</th>
                <th className="p-3" />
              </tr>
            </thead>
            <tbody>
              {tours.map((t) => (
                <tr key={t.id} className={`border-t border-slate-100 text-center ${selected?.id === t.id ? "bg-blue-50/60" : "hover:bg-slate-50"}`}>
                  <td className="p-3 text-left font-medium">{t.title}</td>
                  <td className="whitespace-nowrap p-3">
                    {t.startDate} ~ {t.endDate}
                  </td>
                  <td className="p-3">{t.managerName || "-"}</td>
                  <td className="p-3">
                    <div className="flex items-center justify-center gap-1">
                      <Stars value={t.reviewStats.averageRating} />
                      <span className="text-xs text-slate-500">{t.reviewStats.averageRating ?? "-"}</span>
                    </div>
                  </td>
                  <td className="p-3">{t.reviewStats.reviewCount}</td>
                  <td className="whitespace-nowrap p-3">
                    <button className="mr-2 rounded-md bg-blue-100 px-3 py-1 text-blue-700 hover:bg-blue-200" onClick={() => openTour(t)}>
                      리뷰 보기
                    </button>
                    <button className="rounded-md bg-green-100 px-3 py-1 text-green-700 hover:bg-green-200" onClick={() => setCsvFor(t)}>
                      <Upload className="mr-1 inline h-3.5 w-3.5" />
                      CSV 가져오기
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <section className="rounded-lg bg-white p-4 shadow-sm">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-semibold text-slate-800">{selected ? `${selected.title} 리뷰` : "투어를 선택하면 리뷰를 불러옵니다"}</h2>
          {selected && (
            <div className="no-print flex gap-2">
              <button className={btn.secondary} onClick={() => setAddFor(selected)}>
                <Plus className="h-4 w-4" /> 리뷰 직접 입력
              </button>
              <button className={btn.secondary} onClick={() => window.print()} disabled={reviews.length === 0}>
                <FileDown className="h-4 w-4" /> PDF로 저장(인쇄)
              </button>
            </div>
          )}
        </div>
        {selected &&
          (loadingReviews ? (
            <LoadingState />
          ) : reviews.length === 0 ? (
            <EmptyState text="아직 리뷰가 없습니다. CSV 로 가져오거나 직접 입력하세요." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-sm">
                <thead className="bg-slate-50 text-slate-700">
                  <tr>
                    <th className="p-2">제출일</th>
                    <th className="p-2">작성자</th>
                    <th className="p-2">총점</th>
                    <th className="p-2">식당</th>
                    <th className="p-2">숙소</th>
                    <th className="p-2">관광지</th>
                    <th className="p-2">가이드</th>
                    <th className="p-2 text-left">코멘트</th>
                    <th className="no-print p-2" />
                  </tr>
                </thead>
                <tbody>
                  {reviews.map((r) => (
                    <tr key={r.id} className="border-t border-slate-100 text-center">
                      <td className="whitespace-nowrap p-2">{r.submittedAt.slice(0, 10)}</td>
                      <td className="p-2">{r.reviewerName ?? "익명"}</td>
                      <td className="p-2">
                        <Stars value={r.totalRating} />
                      </td>
                      <td className="p-2">{score(r.restaurantRating)}</td>
                      <td className="p-2">{score(r.accommodationRating)}</td>
                      <td className="p-2">{score(r.attractionRating)}</td>
                      <td className="p-2">{score(r.guideRating)}</td>
                      <td className="max-w-sm whitespace-pre-wrap p-2 text-left">{r.comment ?? ""}</td>
                      <td className="no-print p-2">
                        <button className="rounded p-1 text-slate-400 hover:text-red-600" onClick={() => removeReview(r)} aria-label="삭제">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  <tr className="border-t-2 border-slate-200 bg-slate-50 text-center font-semibold">
                    <td className="p-2" colSpan={2}>
                      평균 ({reviews.length}건)
                    </td>
                    <td className="p-2">{score(averages.total)}</td>
                    <td className="p-2">{score(averages.restaurant)}</td>
                    <td className="p-2">{score(averages.accommodation)}</td>
                    <td className="p-2">{score(averages.attraction)}</td>
                    <td className="p-2">{score(averages.guide)}</td>
                    <td colSpan={2} />
                  </tr>
                </tbody>
              </table>
            </div>
          ))}
      </section>

      <CsvImportModal
        tour={csvFor}
        onClose={() => setCsvFor(null)}
        onImported={async (t) => {
          await refreshSelected(t);
        }}
      />
      <AddReviewModal
        tour={addFor}
        onClose={() => setAddFor(null)}
        onSaved={async (t) => {
          toast.success("리뷰를 저장했습니다.");
          await refreshSelected(t);
        }}
      />
    </div>
  );
}

function CsvImportModal({ tour, onClose, onImported }: { tour: Tour | null; onClose: () => void; onImported: (t: Tour) => Promise<void> }) {
  const [url, setUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ImportReviewsResult | null>(null);

  useEffect(() => {
    setUrl("");
    setError(null);
    setResult(null);
  }, [tour]);

  if (!tour) return null;
  const submit = async () => {
    setBusy(true);
    setError(null);
    try {
      const r = await api.reviews.importCsv(tour.id, url.trim());
      setResult(r);
      await onImported(tour);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      open
      onClose={onClose}
      title={`${tour.title} — CSV 리뷰 가져오기`}
      footer={
        <>
          <button className={btn.secondary} onClick={onClose}>
            닫기
          </button>
          {!result && (
            <button className={btn.primary} onClick={submit} disabled={busy || !url.trim()}>
              {busy ? "가져오는 중…" : "가져오기"}
            </button>
          )}
        </>
      }
    >
      <div className="space-y-3 text-sm">
        <Field label="구글 시트 / CSV 주소" hint="시트 공유를 '링크가 있는 모든 사용자'로 설정한 뒤 주소창의 URL 을 붙여넣으세요.">
          <input className={inputClass} value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://docs.google.com/spreadsheets/d/…" disabled={!!result} />
        </Field>
        <div className="rounded-md bg-slate-50 p-3 text-xs text-slate-600">
          인식하는 열 이름: <b>총점</b>(필수) · 식당 · 숙소 · 관광지 · 가이드 · 코멘트 · 작성자 · 타임스탬프. 점수는 1~5. 같은 행을 다시 가져오면 중복 저장하지 않습니다.
        </div>
        {error && <p className="rounded-md bg-red-50 px-3 py-2 text-red-700">{error}</p>}
        {result && (
          <div className="space-y-2">
            <p className="font-medium text-slate-800">
              전체 {result.totalRows}행 중 <span className="text-green-700">{result.imported}건 저장</span>, {result.skipped}건 건너뜀
            </p>
            {result.errors.length > 0 && (
              <ul className="max-h-48 overflow-y-auto rounded-md border border-slate-200 p-2 text-xs">
                {result.errors.map((e) => (
                  <li key={`${e.row}-${e.message}`}>
                    {e.row}행: {e.message}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
}

const RATING_FIELDS = [
  ["totalRating", "총점 *"],
  ["restaurantRating", "식당"],
  ["accommodationRating", "숙소"],
  ["attractionRating", "관광지"],
  ["guideRating", "가이드"],
] as const;

function AddReviewModal({ tour, onClose, onSaved }: { tour: Tour | null; onClose: () => void; onSaved: (t: Tour) => Promise<void> }) {
  const [ratings, setRatings] = useState<Record<string, string>>({});
  const [comment, setComment] = useState("");
  const [reviewerName, setReviewerName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setRatings({ totalRating: "5" });
    setComment("");
    setReviewerName("");
    setError(null);
  }, [tour]);

  if (!tour) return null;
  const num = (v?: string) => (v ? Number(v) : null);
  const submit = async () => {
    const parsed = createReviewRequest.safeParse({
      totalRating: num(ratings.totalRating),
      restaurantRating: num(ratings.restaurantRating),
      accommodationRating: num(ratings.accommodationRating),
      attractionRating: num(ratings.attractionRating),
      guideRating: num(ratings.guideRating),
      comment: comment.trim() || null,
      reviewerName: reviewerName.trim() || null,
    });
    if (!parsed.success) return setError(parsed.error.issues[0]?.message ?? "입력값을 확인해주세요.");
    setBusy(true);
    try {
      await api.reviews.create(tour.id, parsed.data);
      await onSaved(tour);
      onClose();
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      open
      onClose={onClose}
      title="리뷰 직접 입력"
      footer={
        <>
          <button className={btn.secondary} onClick={onClose}>
            취소
          </button>
          <button className={btn.primary} onClick={submit} disabled={busy}>
            저장
          </button>
        </>
      }
    >
      <div className="space-y-3">
        <div className="grid grid-cols-5 gap-2">
          {RATING_FIELDS.map(([key, label]) => (
            <Field key={key} label={label}>
              <select className={inputClass} value={ratings[key] ?? ""} onChange={(e) => setRatings((r) => ({ ...r, [key]: e.target.value }))}>
                {key !== "totalRating" && <option value="">-</option>}
                {[5, 4, 3, 2, 1].map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </Field>
          ))}
        </div>
        <Field label="작성자">
          <input className={inputClass} value={reviewerName} onChange={(e) => setReviewerName(e.target.value)} placeholder="비우면 익명" />
        </Field>
        <Field label="코멘트">
          <textarea className={`${inputClass} min-h-[80px]`} value={comment} onChange={(e) => setComment(e.target.value)} />
        </Field>
        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>
    </Modal>
  );
}
