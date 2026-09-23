import { apiGet, API_BASE } from "@/services/apiClient";

// ---------- Types ----------

export interface DetailedReview {
  id: number;
  totalRating: number;
  restaurantRating?: number | null;
  accommodationRating?: number | null;
  attractionRating?: number | null;
  guideRating?: number | null;
  comment?: string | null;
  planId: number;
}

export interface Tour {
  id: number;
  name: string;
  tourManager: string;
  averageRating: number | null;
  reviewCount: number | null;
}

export interface TourStats {
  id: number;
  avg: number;
  count: number;
}

// ---------- API functions ----------

export async function fetchAllTours(): Promise<Tour[]> {
  return apiGet<Tour[]>("/api/tour/v1");
}

export async function fetchReviewsByPlan(
  planId: number
): Promise<DetailedReview[]> {
  return apiGet<DetailedReview[]>(`/api/review/${planId}/v1`);
}

export async function saveReviewsFromCsv(
  planId: number,
  csvUrl: string
): Promise<{ success: boolean; message: string }> {
  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("accessToken") || ""
      : "";

  const res = await fetch(`${API_BASE}/api/review/import/${planId}/v1`, {
    method: "POST",
    headers: {
      "Content-Type": "text/plain",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: csvUrl,
  });

  if (res.status === 201) {
    return { success: true, message: "폼 저장 완료" };
  }

  const errorData = await res
    .json()
    .catch(() => ({ message: `오류 발생: ${res.status}` }));
  return {
    success: false,
    message: errorData.message || `오류 발생: ${res.status}`,
  };
}
