import { apiGet, apiPost, apiPut, apiDelete } from "@/services/apiClient";

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

export const getSpotList = async (
  params: SpotLoadParams
): Promise<Spot[] | null> => {
  try {
    const queryParams = new URLSearchParams();
    queryParams.set("MobileOS", "WEB");
    queryParams.set("MobileAPP", "ToTem");
    queryParams.set("_type", "json");
    queryParams.set("serviceKey", "{key}");
    queryParams.set("sigunguCode", String(params.sigunguCode));
    queryParams.set("lclsSystm1", params.lclsSystm1);
    if (params.numOfRows) queryParams.set("numOfRows", String(params.numOfRows));
    if (params.pageNo) queryParams.set("pageNo", String(params.pageNo));
    if (params.arrange) queryParams.set("arrange", params.arrange);
    if (params.lclsSystm2) queryParams.set("lclsSystm2", params.lclsSystm2);
    if (params.lclsSystm3) queryParams.set("lclsSystm3", params.lclsSystm3);

    const path = `/api/spot/v1/${params.lang}?${queryParams.toString()}`;
    return await apiGet<Spot[]>(path);
  } catch (error) {
    console.error("API 호출 중 오류 발생:", error);
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

export const createPlan = async (
  params: PlanMakeParams,
  _accessToken?: string
): Promise<PlanMakeResponse | null> => {
  try {
    return await apiPost<PlanMakeResponse>("/api/plan/v1", params);
  } catch (error) {
    console.error("API 호출 오류:", error);
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
  _accessToken?: string
): Promise<PlanLoadResponse | null> => {
  try {
    return await apiGet<PlanLoadResponse>(`/api/plan/${planId}/v1`);
  } catch (error) {
    console.error("API 호출 중 오류 발생:", error);
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
  _accessToken?: string
): Promise<PlanMakeResponse | null> => {
  try {
    return await apiPut<PlanMakeResponse>(`/api/plan/${planId}/v1`, params);
  } catch (error) {
    console.error("API 호출 중 오류 발생:", error);
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
  _accessToken?: string
): Promise<PlanDeleteResponse | null> => {
  try {
    return await apiDelete<PlanDeleteResponse>(`/api/plan/${planId}/v1`);
  } catch (error) {
    console.error("API 호출 중 오류 발생:", error);
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
  _accessToken?: string
): Promise<PlanDetailMakeResponse | null> => {
  try {
    return await apiPost<PlanDetailMakeResponse>(
      `/api/plan/${planId}/date/v1`,
      params
    );
  } catch (error) {
    console.error("API 호출 중 오류 발생:", error);
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
  _accessToken?: string
): Promise<PlanDetailLoadResponse | null> => {
  try {
    return await apiGet<PlanDetailLoadResponse>(
      `/api/plan/${planId}/date/${day}/v1`
    );
  } catch (error) {
    console.error("API 호출 중 오류 발생:", error);
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
  _accessToken?: string
): Promise<PlanDetailUpdateResponse | null> => {
  try {
    return await apiPut<PlanDetailUpdateResponse>(
      `/api/plan/${planId}/date/${day}/v1`,
      params
    );
  } catch (error) {
    console.error("API 호출 중 오류 발생:", error);
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
  _accessToken?: string
): Promise<PlanDetailDeleteResponse | null> => {
  try {
    return await apiDelete<PlanDetailDeleteResponse>(
      `/api/plan/${planId}/date/${day}/v1`
    );
  } catch (error) {
    console.error("API 호출 중 오류 발생:", error);
    return null;
  }
};
