export const notFound = (req, res, next) => {
  res.status(404).json({
    success: false,
    message: "요청한 리소스를 찾을 수 없습니다.",
  });
};

export const errorHandler = (err, req, res, next) => {
  // eslint-disable-next-line no-console
  console.error("에러 발생:", err);

  let status = err.status || 500;
  let message = err.message || "서버 내부 오류가 발생했습니다.";

  // Mongoose 검증 오류 처리
  if (err.name === "ValidationError") {
    status = 400;
    const errors = Object.values(err.errors).map((e) => e.message);
    message = `데이터 검증 오류: ${errors.join(", ")}`;
  }

  // Mongoose 중복 키 오류 처리
  if (err.code === 11000) {
    status = 400;
    message = "이미 존재하는 데이터입니다.";
  }

  // JWT 오류 처리
  if (err.name === "JsonWebTokenError") {
    status = 401;
    message = "유효하지 않은 토큰입니다.";
  }

  if (err.name === "TokenExpiredError") {
    status = 401;
    message = "토큰이 만료되었습니다.";
  }

  res.status(status).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
};
