import axios from "axios";

export interface Spot {
  addr1: string;
  addr2: string;
  firstImage: string;
  firstImage2: string;
  mapX: number;
  mapY: number;
  mlevel: number;
  tel: string;
  title: string;
  zipcode: number;
}

export type Arrange = "A" | "C" | "D" | "O" | "Q" | "R";

export type LclsSystm1 =
  | "AC"
  | "C01"
  | "EV"
  | "EX"
  | "FD"
  | "HS"
  | "LS"
  | "NA"
  | "SH"
  | "VE";

export interface SpotLoadParams {
  lang: "kr" | "en";
  numOfRows?: number;
  pageNo?: number;
  arrange?: Arrange;
  sigunguCode: number;
  lclsSystm1: LclsSystm1;
  lclsSystm2?: string;
  lclsSystm3?: string;
}

const SPOT_API_BASE_URL = "http://localhost:8000/api/spot/v1";

export const getSpotList = async (
  params: SpotLoadParams
): Promise<Spot[] | null> => {
  try {
    const url = `${SPOT_API_BASE_URL}/${params.lang}`;
    const queryParams = {
      ...params,
      MobileOS: "WEB",
      MobileAPP: "ToTem",
      _type: "json",
      serviceKey: "{key}",
    };
    const response = await axios.get<Spot[]>(url, { params: queryParams });
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      if (error.response?.status === 204) {
        console.log("API 응답 데이터가 비어 있습니다.");
        return null;
      } else {
        console.error("API 호출 중 오류 발생:", error.message);
      }
    } else {
      console.error("알 수 없는 오류 발생:", error);
    }
    return null;
  }
};

export interface PlanMakeParams {
  title: string;
  start_date: number;
  end_date: number;
  nation: string;
  age: number;
  gender: string;
  number: number;
  note: string;
}

export interface PlanMakeResponse {
  plan_id: number;
  title: string;
  startDate: string;
  endDate: string;
  nation: string;
  age: number;
  gender: string;
  number: number;
  note: string;
}

const PLAN_API_BASE_URL = "http://localhost:8000/api/plan";

export const createPlan = async (
  params: PlanMakeParams,
  accessToken: string
): Promise<PlanMakeResponse | null> => {
  try {
    const response = await axios.post<PlanMakeResponse>(
      `${PLAN_API_BASE_URL}/v1`,
      params,
      {
        headers: {
          "Content-Type": "application/json",
          Authentication: accessToken,
        },
      }
    );
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error("API 호출 오류:", error.response?.data);
    } else {
      console.error("예상치 못한 오류 발생:", error);
    }
    return null;
  }
};

export interface CourseDetail {
  contentId: number;
  courseOrder: number;
  note: string;
}

export interface PlanCourse {
  day: number;
  courses: CourseDetail[];
}

export interface PlanLoadResponse {
  plan_id: number;
  title: string;
  startDate: string;
  endDate: string;
  nation: string;
  age: number;
  gender: string;
  number: number;
  note: string;
  courses: PlanCourse[];
}

/**
 * 특정 투어 계획을 ID로 조회하는 함수입니다.
 * @param planId 조회할 투어 계획의 ID
 * @param accessToken 사용자 인증을 위한 토큰
 * @returns 투어 계획 데이터 또는 null
 */
export const getPlan = async (
  planId: number,
  accessToken: string
): Promise<PlanLoadResponse | null> => {
  try {
    const url = `${PLAN_API_BASE_URL}/${planId}/v1`;
    const response = await axios.get<PlanLoadResponse>(url, {
      headers: {
        "Content-Type": "application/json",
        Authentication: accessToken,
      },
    });
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      if (error.response?.status === 404) {
        console.error("해당 투어 계획을 찾을 수 없습니다.");
      } else {
        console.error("API 호출 중 오류 발생:", error.message);
      }
    } else {
      console.error("알 수 없는 오류 발생:", error);
    }
    return null;
  }
};

// --- 투어 수정 관련 ---

/**
 * 기존 투어 계획을 수정하는 함수입니다.
 * @param planId 수정할 투어 계획의 ID
 * @param params 수정할 데이터가 포함된 객체
 * @param accessToken 사용자 인증을 위한 토큰
 * @returns 수정된 투어 계획 데이터 또는 null
 */
export const updatePlan = async (
  planId: number,
  params: PlanMakeParams,
  accessToken: string
): Promise<PlanMakeResponse | null> => {
  try {
    const url = `${PLAN_API_BASE_URL}/${planId}/v1`;
    const response = await axios.put<PlanMakeResponse>(url, params, {
      headers: {
        "Content-Type": "application/json",
        Authentication: accessToken,
      },
    });
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      if (error.response?.status === 404) {
        console.error("해당 투어 계획을 찾을 수 없습니다.");
      } else {
        console.error("API 호출 중 오류 발생:", error.message);
      }
    } else {
      console.error("알 수 없는 오류 발생:", error);
    }
    return null;
  }
};

export interface PlanDeleteResponse {
  message: string;
}

/**
 * 특정 투어 계획을 삭제하는 함수입니다.
 * @param planId 삭제할 투어 계획의 ID
 * @param accessToken 사용자 인증을 위한 토큰
 * @returns 삭제 완료 메시지 또는 null
 */
export const deletePlan = async (
  planId: number,
  accessToken: string
): Promise<PlanDeleteResponse | null> => {
  try {
    const url = `${PLAN_API_BASE_URL}/${planId}/v1`;
    const response = await axios.delete<PlanDeleteResponse>(url, {
      headers: {
        "Content-Type": "application/json",
        Authentication: accessToken,
      },
    });
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      if (error.response?.status === 404) {
        console.error("해당 투어 계획을 찾을 수 없습니다.");
      } else {
        console.error("API 호출 중 오류 발생:", error.message);
      }
    } else {
      console.error("알 수 없는 오류 발생:", error);
    }
    return null;
  }
};

export interface PlanDetailMakeParams {
  day: number;
  courses: {
    contentId: number;
    courseOrder: number;
    note: string;
  }[];
}

export interface PlanDetailMakeResponse {
  day: number;
  courses: PlanDetailMakeParams["courses"];
}

/**
 * 특정 투어 계획에 일자별 상세 코스를 추가하는 함수입니다.
 * @param planId 상세 코스를 추가할 투어 계획의 ID
 * @param params 일자별 코스 정보
 * @param accessToken 사용자 인증을 위한 토큰
 * @returns 생성된 코스 정보 또는 null
 */
export const createPlanDetail = async (
  planId: number,
  params: PlanDetailMakeParams,
  accessToken: string
): Promise<PlanDetailMakeResponse | null> => {
  try {
    const url = `${PLAN_API_BASE_URL}/${planId}/date/v1`;
    const response = await axios.post<PlanDetailMakeResponse>(url, params, {
      headers: {
        "Content-Type": "application/json",
        Authentication: accessToken,
      },
    });
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      if (error.response?.status === 404) {
        console.error("해당 투어 계획을 찾을 수 없습니다.");
      } else {
        console.error("API 호출 중 오류 발생:", error.message);
      }
    } else {
      console.error("알 수 없는 오류 발생:", error);
    }
    return null;
  }
};

export type PlanDetailLoadResponse = PlanDetailMakeResponse;

/**
 * 특정 투어 계획의 특정 일자에 대한 상세 코스 정보를 조회하는 함수입니다.
 * @param planId 조회할 투어 계획의 ID
 * @param day 조회할 일차
 * @param accessToken 사용자 인증을 위한 토큰
 * @returns 일자별 코스 정보 또는 null
 */
export const getPlanDetail = async (
  planId: number,
  day: number,
  accessToken: string
): Promise<PlanDetailLoadResponse | null> => {
  try {
    const url = `${PLAN_API_BASE_URL}/${planId}/date/${day}/v1`;
    const response = await axios.get<PlanDetailLoadResponse>(url, {
      headers: {
        "Content-Type": "application/json",
        Authentication: accessToken,
      },
    });
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      if (error.response?.status === 404) {
        console.error("해당 투어 계획 또는 일차를 찾을 수 없습니다.");
      } else {
        console.error("API 호출 중 오류 발생:", error.message);
      }
    } else {
      console.error("알 수 없는 오류 발생:", error);
    }
    return null;
  }
};

export type PlanDetailUpdateParams = PlanDetailMakeParams;

export type PlanDetailUpdateResponse = PlanDetailMakeResponse;

/**
 * 특정 투어 계획의 특정 일차 상세 코스를 수정하는 함수입니다.
 * @param planId 수정할 투어 계획의 ID
 * @param day 수정할 일차
 * @param params 수정할 코스 정보가 포함된 객체
 * @param accessToken 사용자 인증을 위한 토큰
 * @returns 수정된 코스 정보 또는 null
 */
export const updatePlanDetail = async (
  planId: number,
  day: number,
  params: PlanDetailUpdateParams,
  accessToken: string
): Promise<PlanDetailUpdateResponse | null> => {
  try {
    const url = `${PLAN_API_BASE_URL}/${planId}/date/${day}/v1`;
    const response = await axios.put<PlanDetailUpdateResponse>(url, params, {
      headers: {
        "Content-Type": "application/json",
        Authentication: accessToken,
      },
    });
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      if (error.response?.status === 404) {
        console.error("해당 투어 계획 또는 일차를 찾을 수 없습니다.");
      } else {
        console.error("API 호출 중 오류 발생:", error.message);
      }
    } else {
      console.error("알 수 없는 오류 발생:", error);
    }
    return null;
  }
};

export type PlanDetailDeleteResponse = PlanDetailMakeResponse;

/**
 *
 * @param planId
 * @param day
 * @param accessToken
 * @returns
 */
export const deletePlanDetail = async (
  planId: number,
  day: number,
  accessToken: string
): Promise<PlanDetailDeleteResponse | null> => {
  try {
    const url = `${PLAN_API_BASE_URL}/${planId}/date/${day}/v1`;
    const response = await axios.delete<PlanDetailDeleteResponse>(url, {
      headers: {
        "Content-Type": "application/json",
        Authentication: accessToken,
      },
    });
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      if (error.response?.status === 404) {
        console.error("해당 투어 계획 또는 일차를 찾을 수 없습니다.");
      } else {
        console.error("API 호출 중 오류 발생:", error.message);
      }
    } else {
      console.error("알 수 없는 오류 발생:", error);
    }
    return null;
  }
};
