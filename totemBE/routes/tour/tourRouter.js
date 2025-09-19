// routes/tourRouter.js
import express from "express";
import axios from "axios";
import Tour from "../../models/tour/tourSchema.js";

const router = express.Router();
const TOUR_API_KEY =
  "1374c89d4ccdf007e9648d1f219973f10db5c123d1f2568a84cc58825cdfb91c";

// 기본 정보
router.get("/", (req, res) => {
  res.json({
    success: true,
    message: "투어 API 서버 정상 작동",
    endpoints: {
      spots: "GET /tour/spots/all - 관광지 1000개 조회",
      status: "GET /tour/status - 서버 상태 확인",
      clear: "DELETE /tour/clear - 데이터베이스 초기화",
    },
  });
});

// 데이터베이스 초기화
router.delete("/clear", async (req, res) => {
  try {
    await Tour.deleteMany({});
    res.json({
      success: true,
      message: "데이터베이스 초기화 완료",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "초기화 실패",
      error: error.message,
    });
  }
});

// 서버 상태 확인
router.get("/status", (req, res) => {
  res.json({
    success: true,
    message: "서버 정상 작동 중",
    status: "running",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// 관광지 1000개 조회 (데이터베이스 캐시 + API 연동)
router.get("/spots/all", async (req, res) => {
  try {
    const { page = 1, limit = 1000 } = req.query;

    console.log(`🔍 제주도 관광지 조회 시작`);

    // 1. 먼저 데이터베이스에서 확인
    const existingTours = await Tour.find({ areacode: "39" }).limit(1000);

    if (existingTours.length > 0) {
      console.log(`✅ 데이터베이스에서 조회: ${existingTours.length}개`);

      res.json({
        success: true,
        message: "관광지 조회 성공 (캐시)",
        data: {
          spots: existingTours,
          totalCount: existingTours.length,
          currentPage: 1,
          totalPages: 1,
        },
      });
      return;
    }

    // 2. 데이터베이스에 없으면 API 호출
    console.log(`🔄 API에서 새로 조회 중...`);

    const url = `https://apis.data.go.kr/B551011/KorService2/areaBasedList2`;
    const params = {
      serviceKey: TOUR_API_KEY,
      MobileOS: "WEB",
      MobileApp: "ToTem",
      _type: "json",
      numOfRows: 1000,
      pageNo: 1,
      arrange: "A",
      areaCode: "39", // 제주도
    };

    const response = await axios.get(url, { params, timeout: 15000 });

    if (response.data?.response?.header?.resultCode === "0000") {
      const items = response.data.response.body?.items?.item || [];
      const tourItems = Array.isArray(items) ? items : [items];

      console.log(`✅ API 조회 성공: ${tourItems.length}개`);

      // 3. 데이터베이스에 저장
      try {
        await Tour.insertMany(tourItems);
        console.log(`💾 데이터베이스에 저장 완료: ${tourItems.length}개`);
      } catch (saveError) {
        console.log(`⚠️ 저장 중 일부 오류 (중복 등): ${saveError.message}`);
      }

      res.json({
        success: true,
        message: "관광지 조회 성공 (API + 저장)",
        data: {
          spots: tourItems,
          totalCount: tourItems.length,
          currentPage: 1,
          totalPages: 1,
        },
      });
    } else {
      res.status(400).json({
        success: false,
        message: "API 오류",
        error: response.data?.response?.header?.resultMsg || "알 수 없는 오류",
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "API 호출 실패",
      error: error.message,
    });
  }
});

export default router;
