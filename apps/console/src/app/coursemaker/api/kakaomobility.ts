import axios from "axios";

// 카카오 디벨로퍼스에서 발급받은 REST API 키를 여기에 입력하세요.
const KAKAO_REST_API_KEY = "YOUR_KAKAO_REST_API_KEY";

const KAKAO_API_BASE_URL = "https://apis-navi.kakaomobility.com";

// 좌표 정보를 위한 인터페이스
export interface Point {
  x: number;
  y: number;
  name?: string;
  angle?: number;
}

// 요청 파라미터에 대한 인터페이스
export interface DirectionsParams {
  origin: Point;
  destination: Point;
  waypoints?: Point[];
  priority?: "RECOMMEND" | "TIME" | "DISTANCE";
  avoid?: string[];
  roadevent?: number;
  alternatives?: boolean;
  road_details?: boolean;
  car_type?: number;
  car_fuel?: "GASOLINE" | "DIESEL" | "LPG";
  car_hipass?: boolean;
  summary?: boolean;
}

// API 응답 데이터에 대한 인터페이스 (주요 정보만 포함)
export interface DirectionsResponse {
  trans_id: string;
  routes: Array<{
    result_code: number;
    result_msg: string;
    summary: {
      origin: Point;
      destination: Point;
      waypoints?: Point[];
      distance: number;
      duration: number;
      fare: {
        taxi: number;
        toll: number;
      };
    };
  }>;
}

/**
 * 카카오모빌리티 다중 경유지 길찾기 API를 호출하는 함수입니다.
 * @param params API 요청에 필요한 파라미터 객체
 * @returns 길찾기 결과 데이터 또는 null
 */
export const getWaypointsDirections = async (
  params: DirectionsParams
): Promise<DirectionsResponse | null> => {
  if (!KAKAO_REST_API_KEY || KAKAO_REST_API_KEY === "YOUR_KAKAO_REST_API_KEY") {
    console.error("카카오 REST API 키가 설정되지 않았습니다.");
    return null;
  }

  try {
    const response = await axios.post<DirectionsResponse>(
      `${KAKAO_API_BASE_URL}/v1/waypoints/directions`,
      params,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `KakaoAK ${KAKAO_REST_API_KEY}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error("카카오모빌리티 API 호출 오류:", error.response?.data);
    } else {
      console.error("예상치 못한 오류 발생:", error);
    }
    return null;
  }
};
