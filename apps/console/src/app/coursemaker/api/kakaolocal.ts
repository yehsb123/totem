import axios from "axios";

// 카카오 디벨로퍼스에서 발급받은 REST API 키를 여기에 입력하세요.
const KAKAO_REST_API_KEY = "80cb2f3616b19959ef326033f035195d"; // API 문서에 있는 키를 사용했습니다.

const API_BASE_URL = "http://localhost:8000/api/spot/local/v1";

// API 응답에서 'documents' 배열의 각 항목에 대한 타입 정의
export interface LocalDocument {
  distance: string;
  id: string;
  phone: string;
  x: string;
  y: string;
  address_name: string;
  category_group_code: string;
  category_group_name: string;
  category_name: string;
  place_name: string;
  place_url: string;
  road_address_name: string;
}

// API 응답 전체 구조에 대한 타입 정의
export interface LocalSearchResponse {
  meta: {
    same_name: {
      region: string[];
      keyword: string;
      selected_region: string;
    };
    pageable_count: number;
    total_count: number;
    is_end: boolean;
  };
  documents: LocalDocument[];
}

// 요청 파라미터에 대한 타입 정의
export interface LocalSearchParams {
  query: string;
  x?: string;
  y?: string;
}

/**
 * 카카오 로컬 검색 API를 호출하여 장소 정보를 가져오는 함수입니다.
 * @param params API 요청에 필요한 파라미터 객체 (query 필수)
 * @returns 검색 결과 데이터 또는 null
 */
export const getLocalPlaces = async (
  params: LocalSearchParams
): Promise<LocalSearchResponse | null> => {
  if (!KAKAO_REST_API_KEY) {
    console.error("카카오 REST API 키가 설정되지 않았습니다.");
    return null;
  }

  try {
    const response = await axios.get<LocalSearchResponse>(
      `${API_BASE_URL}?query=${encodeURIComponent(params.query)}`,
      {
        params: {
          x: params.x,
          y: params.y,
        },
        headers: {
          "Content-Type": "application/json",
          Authorization: `KakaoAK ${KAKAO_REST_API_KEY}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error("카카오 로컬 API 호출 오류:", error.response?.data);
    } else {
      console.error("예상치 못한 오류 발생:", error);
    }
    return null;
  }
};
