import type { PlaceCategory } from "@totem/shared";

/**
 * TourAPI 키 없이도 코스메이커를 쓸 수 있도록 넣는 제주 대표 장소 샘플.
 * 좌표는 지도 표시용 근사값. 운영에서는 POST /places/sync 로 TourAPI 전체 데이터를 받는다.
 */
export const placesJeju: { title: string; category: PlaceCategory; addr1: string; mapX: number; mapY: number; popularity: number; foreignPopularity: number }[] = [
  { title: "성산일출봉", category: "attraction", addr1: "제주특별자치도 서귀포시 성산읍 성산리 1", mapX: 126.9425, mapY: 33.4588, popularity: 98, foreignPopularity: 95 },
  { title: "한라산국립공원", category: "attraction", addr1: "제주특별자치도 제주시 1100로 2070-61", mapX: 126.5332, mapY: 33.3617, popularity: 95, foreignPopularity: 90 },
  { title: "우도", category: "attraction", addr1: "제주특별자치도 제주시 우도면", mapX: 126.9519, mapY: 33.5064, popularity: 90, foreignPopularity: 70 },
  { title: "만장굴", category: "attraction", addr1: "제주특별자치도 제주시 구좌읍 만장굴길 182", mapX: 126.771, mapY: 33.5282, popularity: 80, foreignPopularity: 75 },
  { title: "협재해수욕장", category: "attraction", addr1: "제주특별자치도 제주시 한림읍 협재리 2497-1", mapX: 126.2396, mapY: 33.394, popularity: 88, foreignPopularity: 72 },
  { title: "섭지코지", category: "attraction", addr1: "제주특별자치도 서귀포시 성산읍 섭지코지로 107", mapX: 126.931, mapY: 33.424, popularity: 82, foreignPopularity: 78 },
  { title: "천지연폭포", category: "attraction", addr1: "제주특별자치도 서귀포시 남성중로 2-15", mapX: 126.5543, mapY: 33.247, popularity: 84, foreignPopularity: 88 },
  { title: "동문재래시장", category: "etc", addr1: "제주특별자치도 제주시 관덕로14길 20", mapX: 126.526, mapY: 33.5122, popularity: 76, foreignPopularity: 85 },
  { title: "우진해장국", category: "restaurant", addr1: "제주특별자치도 제주시 서사로 11", mapX: 126.5199, mapY: 33.5116, popularity: 86, foreignPopularity: 60 },
  { title: "올래국수", category: "restaurant", addr1: "제주특별자치도 제주시 귀아랑길 24", mapX: 126.523, mapY: 33.4938, popularity: 83, foreignPopularity: 58 },
  { title: "명진전복", category: "restaurant", addr1: "제주특별자치도 제주시 구좌읍 해맞이해안로 1282", mapX: 126.871, mapY: 33.527, popularity: 81, foreignPopularity: 66 },
  { title: "흑돼지거리", category: "restaurant", addr1: "제주특별자치도 제주시 관덕로15길", mapX: 126.5238, mapY: 33.5109, popularity: 79, foreignPopularity: 83 },
  { title: "봄날카페", category: "cafe", addr1: "제주특별자치도 제주시 애월읍 애월로1길 25", mapX: 126.311, mapY: 33.463, popularity: 74, foreignPopularity: 62 },
  { title: "몽상드애월", category: "cafe", addr1: "제주특별자치도 제주시 애월읍 애월북서길 56-1", mapX: 126.3105, mapY: 33.4633, popularity: 72, foreignPopularity: 69 },
  { title: "제주신라호텔", category: "hotel", addr1: "제주특별자치도 서귀포시 중문관광로72번길 75", mapX: 126.4077, mapY: 33.2477, popularity: 85, foreignPopularity: 89 },
  { title: "롯데호텔 제주", category: "hotel", addr1: "제주특별자치도 서귀포시 중문관광로72번길 35", mapX: 126.4105, mapY: 33.2482, popularity: 83, foreignPopularity: 87 },
  { title: "메종글래드 제주", category: "hotel", addr1: "제주특별자치도 제주시 노연로 80", mapX: 126.4903, mapY: 33.4851, popularity: 70, foreignPopularity: 76 },
];
