"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import {
  Tour,
  TourStats,
  DetailedReview,
  fetchAllTours,
  fetchReviewsByPlan,
} from "./reviewApi";
import CsvImportModal from "./components/CsvImportModal";
import TourTable from "./components/TourTable";
import ReviewTable from "./components/ReviewTable";

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

  // Load Material Icons
  useEffect(() => {
    const link = document.createElement("link");
    link.href = "https://fonts.googleapis.com/icon?family=Material+Icons";
    link.rel = "stylesheet";
    document.head.appendChild(link);
  }, []);

  // Load all tours with review stats
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
            return r
              ? { ...t, averageRating: r.value.avg, reviewCount: r.value.count }
              : t;
          })
        );
      } catch {
        if (!cancelled) setError("투어 목록을 불러오지 못했습니다.");
      } finally {
        setLoadingTours(false);
      }
    };
    loadAllTours();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleTourClick = useCallback(
    async (tourId: number) => {
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
        setError(e instanceof Error ? e.message : "리뷰 로딩 실패");
        setReviews([]);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const filteredTours = useMemo(
    () =>
      tours.filter((t) =>
        t.name.toLowerCase().includes(searchTerm.toLowerCase())
      ),
    [tours, searchTerm]
  );

  const renderStars = (rating: number) => {
    const rounded = Math.round(rating || 0);
    return (
      <div className="flex justify-center">
        {Array.from({ length: 5 }, (_, i) => (
          <span
            key={i}
            className="material-icons text-yellow-400"
            style={{ fontSize: "1.2rem" }}
          >
            {i < rounded ? "star" : "star_border"}
          </span>
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4 font-sans antialiased text-gray-800">
      {/* Search bar */}
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
            <span className="material-icons text-xl text-gray-600">
              search
            </span>
          </div>
        </div>
        {loadingTours && (
          <span className="text-sm text-gray-500">
            투어 목록을 불러오는 중...
          </span>
        )}
        {error && <span className="text-sm text-red-500">{error}</span>}
      </div>

      {/* Tour list table */}
      <TourTable
        tours={filteredTours}
        loadingTours={loadingTours}
        onTourClick={handleTourClick}
        onOpenCsvModal={(id, name) => {
          setModalTour({ id, name });
          setIsModalOpen(true);
        }}
        renderStars={renderStars}
      />

      {/* Review section header */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-gray-700">
          {selectedTourId
            ? `${tours.find((t) => t.id === selectedTourId)?.name} 리뷰`
            : "투어를 선택하면 리뷰를 불러옵니다"}
        </h2>
        {selectedTourId !== null && (
          <button
            onClick={() => {
              setSelectedTourId(null);
              setReviews([]);
            }}
            className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded-lg shadow transition duration-300 ease-in-out"
          >
            모든 리뷰 보기
          </button>
        )}
      </div>

      {/* Review details table */}
      <ReviewTable
        reviews={reviews}
        tours={tours}
        selectedTourId={selectedTourId}
        loading={loading}
        renderStars={renderStars}
      />

      {/* PDF export */}
      <div className="flex justify-start mt-4">
        <button
          onClick={() => alert("PDF 내보내기 버튼이 클릭되었습니다.")}
          className="bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-6 rounded-lg shadow-lg transition duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-green-300"
        >
          리뷰 PDF로 내보내기
        </button>
      </div>

      {/* CSV import modal */}
      {isModalOpen && modalTour && (
        <CsvImportModal
          planId={modalTour.id}
          tourName={modalTour.name}
          onClose={() => setIsModalOpen(false)}
          onSaveSuccess={() => handleTourClick(modalTour.id)}
        />
      )}
    </div>
  );
}
