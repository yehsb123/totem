"use client";

import { DetailedReview, Tour } from "../reviewApi";

interface ReviewTableProps {
  reviews: DetailedReview[];
  tours: Tour[];
  selectedTourId: number | null;
  loading: boolean;
  renderStars: (rating: number) => React.ReactNode;
}

export default function ReviewTable({
  reviews,
  tours,
  selectedTourId,
  loading,
  renderStars,
}: ReviewTableProps) {
  return (
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
                    ? "리뷰를 불러오는 중..."
                    : "선택된 투어에 대한 리뷰가 없습니다."
                  : "투어를 먼저 선택해주세요."}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
