import express from "express";
import axios from "axios";
import Tour from "../../models/tour/tourSchema.js";
import authGuard from "../../middlewares/authGuard.js";

const router = express.Router();

// 기본 정보
router.get("/", (req, res) => {
  res.json({
    success: true,
    message: "투어 API 서버 정상 작동",
    endpoints: {
      spots: "GET /tour/spots/all - 관광지 조회",
      search: "GET /tour/spots/search?q=한라산 - 관광지 검색",
      detail: "GET /tour/spots/:contentid - 관광지 상세",
      status: "GET /tour/status - 서버 상태 확인",
    },
  });
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

// 데이터베이스 초기화 (관리자 전용)
router.delete("/clear", authGuard, async (req, res) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({
      success: false,
      message: "관리자 권한이 필요합니다.",
    });
  }

  try {
    const result = await Tour.deleteMany({});
    res.json({
      success: true,
      message: `데이터베이스 초기화 완료 (${result.deletedCount}건 삭제)`,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "초기화 실패",
    });
  }
});

// 관광지 조회 (페이지네이션)
router.get("/spots/all", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 100, 1000);
    const skip = (page - 1) * limit;

    // 먼저 DB에서 조회
    const [spots, total] = await Promise.all([
      Tour.find({ areacode: "39" }).skip(skip).limit(limit),
      Tour.countDocuments({ areacode: "39" }),
    ]);

    if (total > 0) {
      return res.json({
        success: true,
        message: "관광지 조회 성공 (캐시)",
        data: {
          spots,
          totalCount: total,
          currentPage: page,
          totalPages: Math.ceil(total / limit),
        },
      });
    }

    // DB에 없으면 API 호출
    const apiKey = process.env.TOURAPI_SERVICE_KEY;
    if (!apiKey) {
      return res.status(500).json({
        success: false,
        message: "Tour API 키가 설정되지 않았습니다.",
      });
    }

    const url = "https://apis.data.go.kr/B551011/KorService2/areaBasedList2";
    const params = {
      serviceKey: apiKey,
      MobileOS: "WEB",
      MobileApp: "ToTem",
      _type: "json",
      numOfRows: 1000,
      pageNo: 1,
      arrange: "A",
      areaCode: "39",
    };

    const response = await axios.get(url, { params, timeout: 15000 });

    if (response.data?.response?.header?.resultCode === "0000") {
      const items = response.data.response.body?.items?.item || [];
      const tourItems = Array.isArray(items) ? items : [items];

      // DB에 저장 (중복 무시)
      try {
        await Tour.insertMany(tourItems, { ordered: false });
      } catch (saveError) {
        if (saveError.code !== 11000) {
          console.error("투어 데이터 저장 오류:", saveError.message);
        }
      }

      return res.json({
        success: true,
        message: "관광지 조회 성공 (API)",
        data: {
          spots: tourItems,
          totalCount: tourItems.length,
          currentPage: 1,
          totalPages: 1,
        },
      });
    }

    res.status(400).json({
      success: false,
      message: "API 오류",
      error: response.data?.response?.header?.resultMsg || "알 수 없는 오류",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "관광지 조회 실패",
    });
  }
});

// 관광지 검색
router.get("/spots/search", async (req, res) => {
  try {
    const { q, type, page: pageStr, limit: limitStr } = req.query;
    const page = parseInt(pageStr) || 1;
    const limit = Math.min(parseInt(limitStr) || 20, 100);
    const skip = (page - 1) * limit;

    const filter = { areacode: "39" };

    if (q) {
      filter.$text = { $search: q };
    }

    if (type) {
      filter.contenttypeid = type;
    }

    const [spots, total] = await Promise.all([
      Tour.find(filter).skip(skip).limit(limit),
      Tour.countDocuments(filter),
    ]);

    res.json({
      success: true,
      message: "검색 완료",
      data: {
        spots,
        totalCount: total,
        currentPage: page,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("관광지 검색 오류:", error.message);
    res.status(500).json({
      success: false,
      message: "검색 실패",
    });
  }
});

// 관광지 상세 조회
router.get("/spots/:contentid", async (req, res) => {
  try {
    const spot = await Tour.findOne({ contentid: req.params.contentid });

    if (!spot) {
      return res.status(404).json({
        success: false,
        message: "관광지를 찾을 수 없습니다.",
      });
    }

    res.json({
      success: true,
      data: spot,
    });
  } catch (error) {
    console.error("관광지 상세 조회 오류:", error.message);
    res.status(500).json({
      success: false,
      message: "조회 실패",
    });
  }
});

// 카테고리별 관광지 조회
router.get("/spots/category/:cat1", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const skip = (page - 1) * limit;

    const filter = { areacode: "39", cat1: req.params.cat1 };

    if (req.query.cat2) filter.cat2 = req.query.cat2;
    if (req.query.cat3) filter.cat3 = req.query.cat3;

    const [spots, total] = await Promise.all([
      Tour.find(filter).skip(skip).limit(limit),
      Tour.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: {
        spots,
        totalCount: total,
        currentPage: page,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("카테고리 조회 오류:", error.message);
    res.status(500).json({
      success: false,
      message: "조회 실패",
    });
  }
});

export default router;
