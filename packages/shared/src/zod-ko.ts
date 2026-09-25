import { z, ZodIssueCode, type ZodErrorMap } from "zod";

/**
 * zod 기본 오류 문구(영어: "String must contain at most 100 character(s)")를 한국어로.
 * 스키마에 직접 적은 문구가 있으면 그것이 우선한다. web·console 의 폼 검증과 API 의 400 응답이
 * 같은 zod 인스턴스를 쓰므로 여기 한 번 등록하면 세 곳이 모두 같은 문구를 낸다 (AUDIT §15).
 */
export const koreanErrorMap: ZodErrorMap = (issue, ctx) => {
  switch (issue.code) {
    case ZodIssueCode.invalid_type:
      if (issue.received === "undefined" || issue.received === "null") return { message: "필수 입력 항목입니다." };
      if (issue.expected === "integer") return { message: "정수로 입력해주세요." };
      if (issue.received === "nan") return { message: "숫자를 입력해주세요." };
      return { message: "입력 형식이 올바르지 않습니다." };
    case ZodIssueCode.too_small: {
      const n = Number(issue.minimum);
      if (issue.type === "string") return { message: n <= 1 ? "필수 입력 항목입니다." : `${n}자 이상 입력해주세요.` };
      if (issue.type === "number") return { message: `${n.toLocaleString("ko-KR")} ${issue.inclusive ? "이상" : "보다 큰 값"}이어야 합니다.` };
      if (issue.type === "array") return { message: `${n}개 이상 필요합니다.` };
      break;
    }
    case ZodIssueCode.too_big: {
      const n = Number(issue.maximum);
      if (issue.type === "string") return { message: `${n.toLocaleString("ko-KR")}자 이하로 입력해주세요.` };
      if (issue.type === "number") return { message: `${n.toLocaleString("ko-KR")} ${issue.inclusive ? "이하" : "보다 작은 값"}여야 합니다.` };
      if (issue.type === "array") return { message: `최대 ${n.toLocaleString("ko-KR")}개까지 가능합니다.` };
      break;
    }
    case ZodIssueCode.invalid_string:
      if (issue.validation === "email") return { message: "이메일 형식이 올바르지 않습니다." };
      if (issue.validation === "url") return { message: "주소(URL) 형식이 올바르지 않습니다." };
      return { message: "형식이 올바르지 않습니다." };
    case ZodIssueCode.invalid_enum_value:
      return { message: "허용되지 않은 값입니다." };
    case ZodIssueCode.invalid_date:
      return { message: "날짜가 올바르지 않습니다." };
    case ZodIssueCode.not_multiple_of:
      return { message: "값이 올바르지 않습니다." };
    case ZodIssueCode.unrecognized_keys:
      return { message: `알 수 없는 항목: ${issue.keys.join(", ")}` };
  }
  return { message: ctx.defaultError };
};

z.setErrorMap(koreanErrorMap);
