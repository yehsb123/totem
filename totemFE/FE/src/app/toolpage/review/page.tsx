"use client";

import { useEffect, useMemo, useState } from "react";

// DetailedReview 인터페이스: 리뷰 데이터 필드
interface DetailedReview {
  id: number;
  totalRating: number;
  restaurantRating?: number | null;
  accommodationRating?: number | null;
  attractionRating?: number | null;
  guideRating?: number | null;
  comment?: string | null;
  planId: number;
}

// Tour 인터페이스: 투어 데이터 필드 (API 응답에 맞게 정의)
interface Tour {
  id: number;
  name: string;
  tourManager: string; // API에 tourManager 필드가 있다고 가정
  averageRating: number | null;
  reviewCount: number | null;
}

// TourStats 인터페이스: 투어 통계 데이터 필드
interface TourStats {
  id: number;
  avg: number;
  count: number;
}

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL;
const getToken = () => localStorage.getItem("access_token") || "";

// 모든 투어 목록을 불러오는 함수
async function fetchAllTours(): Promise<Tour[]> {
  const res = await fetch(`${API_BASE}/api/tour/v1`, {
    headers: {
      Authorization: getToken(),
      Accept: "application/json",
    },
    cache: "no-store",
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || `투어 목록 조회 실패 (${res.status})`);
  }
  return res.json();
}

// 리뷰 조회 함수 (fetch GET 메소드)
async function fetchReviewsByPlan(planId: number): Promise<DetailedReview[]> {
  const res = await fetch(`${API_BASE}/api/review/${planId}/v1`, {
    headers: {
      Authorization: getToken(),
      Accept: "application/json",
    },
    cache: "no-store",
  });
  if (!res.ok) {
    const errorData = await res
      .json()
      .catch(() => ({ message: `리뷰 조회 실패(${res.status})` }));
    throw new Error(errorData.message || `리뷰 조회 실패(${res.status})`);
  }
  return res.json();
}

// CSV로 리뷰를 저장하는 함수 (fetch POST 메소드)
async function saveReviewsFromCsv(planId: number, csvUrl: string) {
  const res = await fetch(`${API_BASE}/api/review/import/${planId}/v1`, {
    method: "POST",
    headers: {
      "Content-Type": "text/plain",
      Authorization: getToken(),
    },
    body: csvUrl,
  });

  if (res.status === 201) {
    return { success: true, message: "폼 저장 완료" };
  } else {
    const errorData = await res
      .json()
      .catch(() => ({ message: `오류 발생: ${res.status}` }));
    return {
      success: false,
      message: errorData.message || `오류 발생: ${res.status}`,
    };
  }
}

// CSV 파일 업로드 모달 컴포넌트
const CsvImportModal = ({
  planId,
  tourName,
  onClose,
  onSaveSuccess,
}: {
  planId: number;
  tourName: string;
  onClose: () => void;
  onSaveSuccess: () => void;
}) => {
  const [csvUrl, setCsvUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    const result = await saveReviewsFromCsv(planId, csvUrl);

    if (result.success) {
      setMessage("✅ 폼 저장 완료! 잠시 후 자동으로 닫힙니다.");
      onSaveSuccess();
      setTimeout(onClose, 2000);
    } else {
      setMessage(`❌ ${result.message}`);
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex justify-center items-center">
      <div className="relative p-8 bg-white w-96 mx-auto rounded-lg shadow-xl">
        <h3 className="text-xl font-bold mb-4">&apos;{tourName}&apos; 리뷰 저장</h3>
        <p className="mb-4 text-sm text-gray-600">
          Google Sheets &apos;CSV로 게시&apos; 링크를 입력해주세요.
        </p>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            className="w-full p-2 mb-4 border rounded-md"
            placeholder="예: https://docs.google.com/spreadsheets/..."
            value={csvUrl}
            onChange={(e) => setCsvUrl(e.target.value)}
            required
          />
          <div className="flex justify-between items-center">
            <button
              type="submit"
              className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 disabled:bg-gray-400"
              disabled={loading}
            >
              {loading ? "저장 중..." : "저장"}
            </button>
            <button
              type="button"
              className="bg-gray-200 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-300"
              onClick={onClose}
            >
              닫기
            </button>
          </div>
          {message && (
            <div
              className={`mt-4 text-center ${
                message.startsWith("❌") ? "text-red-500" : "text-green-500"
              }`}
            >
              {message}
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default function App() {
  const [tours, setTours] = useState<Tour[]>([]);
  const [reviews, setReviews] = useState<DetailedReview[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTourId, setSelectedTourId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingTours, setLoadingTours] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalTour, setModalTour] = useState<{
    id: number;
    name: string;
  } | null>(null);

  useEffect(() => {
    const link = document.createElement("link");
    link.href = "https://fonts.googleapis.com/icon?family=Material+Icons";
    link.rel = "stylesheet";
    document.head.appendChild(link);
  }, []);

  useEffect(() => {
    let cancelled = false;
    const loadAllTours = async () => {
      setLoadingTours(true);
      try {
        const allTours = await fetchAllTours();
        if (cancelled) return;

        const results = await Promise.allSettled(
          allTours.map(async (tour) => {
            const list = await fetchReviewsByPlan(tour.id);
            const total = list.reduce((s, r) => s + (r.totalRating || 0), 0);
            const avg =
              list.length > 0
                ? parseFloat((total / list.length).toFixed(1))
                : 0;
            return { id: tour.id, avg, count: list.length };
          })
        );
        if (cancelled) return;

        setTours(
          allTours.map((t) => {
            const r = results.find(
              (res): res is PromiseFulfilledResult<TourStats> =>
                res.status === "fulfilled" && res.value.id === t.id
            );
            if (r) {
              return {
                ...t,
                averageRating: r.value.avg,
                reviewCount: r.value.count,
              };
            }
            return t;
          })
        );
      } catch (e: unknown) {
        if (e instanceof Error) {
          console.error("투어 목록 로딩 중 에러 발생:", e);
          setError("투어 목록을 불러오지 못했습니다.");
        }
      } finally {
        setLoadingTours(false);
      }
    };

    loadAllTours();

    return () => {
      cancelled = true;
    };
  }, []);

  const handleTourClick = async (tourId: number) => {
    setSelectedTourId(tourId);
    setSearchTerm("");
    setLoading(true);
    setError(null);
    try {
      const data = await fetchReviewsByPlan(tourId);
      setReviews(data);
      const total = data.reduce((s, r) => s + (r.totalRating || 0), 0);
      const avg = data.length
        ? parseFloat((total / data.length).toFixed(1))
        : 0;
      setTours((prev) =>
        prev.map((t) =>
          t.id === tourId
            ? { ...t, averageRating: avg, reviewCount: data.length }
            : t
        )
      );
    } catch (e: unknown) {
      if (e instanceof Error) {
        setError(e.message || "리뷰 로딩 실패");
      } else {
        setError("리뷰 로딩 실패");
      }
      setReviews([]);
    } finally {
      setLoading(false);
    }
  };

  const handleShowAllReviews = () => {
    setSelectedTourId(null);
    setReviews([]);
  };

  const filteredTours = useMemo(() => {
    return tours.filter((t) =>
      t.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [tours, searchTerm]);

  const renderStars = (rating: number) => {
    const stars = [];
    const rounded = Math.round(rating || 0);
    for (let i = 0; i < 5; i++) {
      stars.push(
        <span
          key={i}
          className="material-icons text-yellow-400"
          style={{ fontSize: "1.2rem" }}
        >
          {i < rounded ? "star" : "star_border"}
        </span>
      );
    }
    return <div className="flex justify-center">{stars}</div>;
  };

  const handleExportPDF = () => {
    alert("PDF 내보내기 버튼이 클릭되었습니다.");
  };

  const openCsvModal = (tourId: number, tourName: string) => {
    setModalTour({ id: tourId, name: tourName });
    setIsModalOpen(true);
  };

  const handleCsvSaveSuccess = () => {
    if (modalTour) {
      handleTourClick(modalTour.id);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4 font-sans antialiased text-gray-800">
      <div className="bg-white p-4 rounded-lg shadow-md mb-4 flex items-center gap-4 flex-wrap">
        <div className="relative flex items-center">
          <input
            type="text"
            placeholder="투어 이름 검색..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="h-10 px-4 text-base text-gray-800 bg-white border border-gray-300 rounded-md shadow-sm outline-none pr-10"
          />
          <div className="absolute top-0 right-0 h-full w-10 bg-gray-200 border-l border-gray-300 rounded-r-md flex items-center justify-center pointer-events-none">
            <span className="material-icons text-xl text-gray-600">search</span>
          </div>
        </div>
        {loadingTours && (
          <span className="text-sm text-gray-500">
            투어 목록을 불러오는 중…
          </span>
        )}
        {error && <span className="text-sm text-red-500">{error}</span>}
      </div>

      <div className="bg-white p-5 rounded-lg shadow-md mb-4">
        <h2 className="text-xl font-semibold mb-4 text-gray-700">
          전체 투어 목록
        </h2>
        <table className="w-full bg-white border-collapse rounded-xl overflow-hidden shadow-sm">
          <thead>
            <tr className="bg-green-50 h-12 text-gray-700">
              <th className="p-2 text-left">투어명 (매니저)</th>
              <th className="p-2 text-center">총 리뷰 인원 / 평균 별점</th>
              <th className="p-2 text-center"></th>
            </tr>
          </thead>
          <tbody>
            {filteredTours.length > 0 ? (
              filteredTours.map((tour) => (
                <tr
                  key={tour.id}
                  className="text-center h-14 border-b border-gray-200 last:border-b-0 hover:bg-gray-50"
                >
                  <td
                    className="p-2 text-left text-gray-800 cursor-pointer"
                    onClick={() => handleTourClick(tour.id)}
                  >
                    {tour.name} ({tour.tourManager})
                  </td>
                  <td
                    className="p-2 text-gray-700 flex justify-center items-center gap-2 cursor-pointer"
                    onClick={() => handleTourClick(tour.id)}
                  >
                    <span>{tour.reviewCount ?? "-"}명</span>
                    <div className="text-sm font-semibold">
                      ({tour.averageRating ?? "-"}점)
                    </div>
                    {typeof tour.averageRating === "number"
                      ? renderStars(tour.averageRating)
                      : renderStars(0)}
                  </td>
                  <td className="p-2">
                    <button
                      className="bg-blue-100 text-blue-700 py-1 px-3 rounded-md hover:bg-blue-200 transition mr-2"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleTourClick(tour.id);
                      }}
                    >
                      리뷰 보기
                    </button>
                    <button
                      className="bg-green-100 text-green-700 py-1 px-3 rounded-md hover:bg-green-200 transition"
                      onClick={(e) => {
                        e.stopPropagation();
                        openCsvModal(tour.id, tour.name);
                      }}
                    >
                      CSV로 리뷰 저장
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={3} className="p-4 text-center text-gray-500">
                  {loadingTours
                    ? "투어 목록을 불러오는 중입니다."
                    : "검색 결과가 없습니다."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-gray-700">
          {selectedTourId
            ? `${tours.find((t) => t.id === selectedTourId)?.name} 리뷰`
            : "투어를 선택하면 리뷰를 불러옵니다"}
        </h2>
        {selectedTourId !== null && (
          <button
            onClick={handleShowAllReviews}
            className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded-lg shadow transition duration-300 ease-in-out"
          >
            모든 리뷰 보기
          </button>
        )}
      </div>

      <div className="bg-white p-5 rounded-lg shadow-md mb-4">
        <table className="w-full bg-white border-collapse rounded-xl overflow-hidden shadow-sm">
          <thead>
            <tr className="bg-blue-50 h-12 text-gray-700">
              <th className="p-2 text-center">리뷰 ID</th>
              <th className="p-2 text-center">투어명</th>
              <th className="p-2 text-center">총 별점</th>
              <th className="p-2 text-center">상세 별점</th>
              <th className="p-2 text-left">리뷰 내용</th>
            </tr>
          </thead>
          <tbody>
            {reviews.length > 0 ? (
              reviews.map((review) => {
                const tour = tours.find((t) => t.id === review.planId);
                return (
                  <tr
                    key={review.id}
                    className="text-center h-14 border-b border-gray-200 last:border-b-0 hover:bg-gray-50"
                  >
                    <td className="p-2 text-gray-800">{review.id}</td>
                    <td className="p-2 text-gray-800">{tour?.name}</td>
                    <td className="p-2">{renderStars(review.totalRating)}</td>
                    <td className="p-2 text-left text-gray-700">
                      <ul className="list-disc list-inside text-sm">
                        <li>식당: {review.restaurantRating ?? "N/A"}</li>
                        <li>숙소: {review.accommodationRating ?? "N/A"}</li>
                        <li>관광: {review.attractionRating ?? "N/A"}</li>
                        <li>가이드: {review.guideRating ?? "N/A"}</li>
                      </ul>
                    </td>
                    <td className="p-2 text-left text-gray-700 max-w-xs truncate">
                      {review.comment}
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={5} className="p-4 text-center text-gray-500">
                  {selectedTourId
                    ? loading
                      ? "리뷰를 불러오는 중…"
                      : "선택된 투어에 대한 리뷰가 없습니다."
                    : "투어를 먼저 선택해주세요."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex justify-start mt-4">
        <button
          onClick={handleExportPDF}
          className="bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-6 rounded-lg shadow-lg transition duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-green-300"
        >
          리뷰 PDF로 내보내기
        </button>
      </div>

      {isModalOpen && modalTour && (
        <CsvImportModal
          planId={modalTour.id}
          tourName={modalTour.name}
          onClose={() => setIsModalOpen(false)}
          onSaveSuccess={handleCsvSaveSuccess}
        />
      )}
    </div>
  );
}
