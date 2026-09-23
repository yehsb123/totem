"use client";

import { Tour } from "../reviewApi";

interface TourTableProps {
  tours: Tour[];
  loadingTours: boolean;
  onTourClick: (tourId: number) => void;
  onOpenCsvModal: (tourId: number, tourName: string) => void;
  renderStars: (rating: number) => React.ReactNode;
}

export default function TourTable({
  tours,
  loadingTours,
  onTourClick,
  onOpenCsvModal,
  renderStars,
}: TourTableProps) {
  return (
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
          {tours.length > 0 ? (
            tours.map((tour) => (
              <tr
                key={tour.id}
                className="text-center h-14 border-b border-gray-200 last:border-b-0 hover:bg-gray-50"
              >
                <td
                  className="p-2 text-left text-gray-800 cursor-pointer"
                  onClick={() => onTourClick(tour.id)}
                >
                  {tour.name} ({tour.tourManager})
                </td>
                <td
                  className="p-2 text-gray-700 flex justify-center items-center gap-2 cursor-pointer"
                  onClick={() => onTourClick(tour.id)}
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
                      onTourClick(tour.id);
                    }}
                  >
                    리뷰 보기
                  </button>
                  <button
                    className="bg-green-100 text-green-700 py-1 px-3 rounded-md hover:bg-green-200 transition"
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenCsvModal(tour.id, tour.name);
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
  );
}
