import { CSV_HEADER_ALIASES, type CreateReviewRequest } from "@totem/shared";
import { env } from "../../config/env";
import { badRequest, upstream } from "../../lib/http";

/** RFC 4180 CSV 파서 (따옴표 안 쉼표·줄바꿈·"" 이스케이프 처리) */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;
  const src = text.replace(/^﻿/, "");
  for (let i = 0; i < src.length; i++) {
    const ch = src[i];
    if (quoted) {
      if (ch === '"') {
        if (src[i + 1] === '"') {
          field += '"';
          i++;
        } else quoted = false;
      } else field += ch;
      continue;
    }
    if (ch === '"') quoted = true;
    else if (ch === ",") {
      row.push(field);
      field = "";
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && src[i + 1] === "\n") i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else field += ch;
  }
  if (field !== "" || row.length) {
    row.push(field);
    rows.push(row);
  }
  return rows.filter((r) => r.some((c) => c.trim() !== ""));
}

/** 구글 시트 공유/편집 URL 을 CSV 내보내기 URL 로 바꾼다 (이미 CSV 주소면 그대로) */
export function toCsvExportUrl(input: string): string {
  const url = new URL(input);
  const m = url.pathname.match(/^\/spreadsheets\/d\/([^/]+)/);
  if (url.hostname === "docs.google.com" && m && !url.pathname.includes("/export") && !url.pathname.includes("/pub")) {
    const gid = url.searchParams.get("gid") ?? url.hash.match(/gid=(\d+)/)?.[1] ?? "0";
    return `https://docs.google.com/spreadsheets/d/${m[1]}/export?format=csv&gid=${gid}`;
  }
  return url.toString();
}

function hostAllowed(host: string) {
  return env.REVIEW_IMPORT_ALLOWED_HOSTS.some((h) => host === h || host.endsWith(`.${h}`));
}

/**
 * 본문을 **바이트 단위로 세며** 읽고, 한도를 넘는 순간 끊는다.
 * (예전: content-length 가 없으면 전부 메모리에 받은 뒤 `text.length`(글자 수)로 비교 —
 *  한글은 글자당 3바이트라 한도의 약 3배까지 통과했고, 끝없는 응답이면 메모리를 다 쓸 수 있었다 — AUDIT §32)
 */
async function readLimited(res: Response, maxBytes: number): Promise<string> {
  if (!res.body) return "";
  const reader = res.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > maxBytes) {
      await reader.cancel().catch(() => undefined);
      throw badRequest("CSV 파일이 너무 큽니다.");
    }
    chunks.push(value);
  }
  return new TextDecoder("utf-8").decode(Buffer.concat(chunks));
}

/** 허용 호스트만, https 만, 최대 크기까지만 받는다. 리다이렉트도 매 단계 호스트를 검사한다 (SSRF 방지) */
export async function downloadCsv(inputUrl: string): Promise<string> {
  let url = toCsvExportUrl(inputUrl);
  for (let hop = 0; hop < 4; hop++) {
    const u = new URL(url);
    if (u.protocol !== "https:" || !hostAllowed(u.hostname)) {
      throw badRequest(`허용되지 않은 주소입니다. 허용: ${env.REVIEW_IMPORT_ALLOWED_HOSTS.join(", ")}`);
    }
    const res = await fetch(url, { redirect: "manual", signal: AbortSignal.timeout(15_000) }).catch(() => {
      throw upstream("CSV 주소에 연결할 수 없습니다.");
    });
    if (res.status >= 300 && res.status < 400 && res.headers.get("location")) {
      url = new URL(res.headers.get("location")!, url).toString();
      continue;
    }
    if (!res.ok) throw badRequest(`CSV 를 내려받지 못했습니다 (${res.status}). 시트가 '링크가 있는 모든 사용자' 공개인지 확인해주세요.`);
    const length = Number(res.headers.get("content-length") ?? 0);
    if (length > env.REVIEW_IMPORT_MAX_BYTES) throw badRequest("CSV 파일이 너무 큽니다.");
    const text = await readLimited(res, env.REVIEW_IMPORT_MAX_BYTES);
    if (/^\s*<(!doctype|html)/i.test(text)) throw badRequest("CSV 가 아니라 웹페이지가 내려왔습니다. 시트 공개 설정을 확인해주세요.");
    return text;
  }
  throw badRequest("리다이렉트가 너무 많습니다.");
}

const normHeader = (h: string) => h.trim().toLowerCase().replace(/[\s_()[\]]/g, "");

/** "5", "5점", "4.6" → 1~5 정수. 빈 값은 null, 범위 밖이면 오류 */
function rating(v: string | undefined, required: boolean): number | null {
  const s = (v ?? "").trim();
  if (!s) {
    if (required) throw new Error("총점이 비어 있습니다.");
    return null;
  }
  const n = Math.round(Number(s.replace(/[^\d.]/g, "")));
  if (!Number.isFinite(n) || n < 1 || n > 5) throw new Error(`평점은 1~5 여야 합니다: "${s}"`);
  return n;
}

export interface ParsedRow {
  row: number;
  review: CreateReviewRequest & { submittedAt: string };
  /**
   * 같은 행인지 판단하는 원본 값(시트에 적힌 그대로). 날짜 칸이 비어 "지금"으로 채운 값은 넣지 않는다 —
   * 넣으면 가져올 때마다 달라져 같은 시트를 다시 가져오면 리뷰가 두 번 쌓인다 (AUDIT §18).
   */
  identity: string;
}

export function mapRows(rows: string[][]): { parsed: ParsedRow[]; errors: { row: number; message: string }[] } {
  if (rows.length < 2) throw badRequest("CSV 에 데이터 행이 없습니다.");
  const header = rows[0].map((h) => CSV_HEADER_ALIASES[normHeader(h)] ?? CSV_HEADER_ALIASES[h.trim()] ?? null);
  if (!header.includes("totalRating")) {
    throw badRequest("CSV 에 '총점'(totalRating) 열이 없습니다.", { headers: rows[0] });
  }
  const parsed: ParsedRow[] = [];
  const errors: { row: number; message: string }[] = [];
  rows.slice(1).forEach((cells, i) => {
    const rowNo = i + 2; // 사람이 보는 시트 행 번호 (헤더가 1행)
    const get = (key: string) => {
      const idx = header.indexOf(key as never);
      return idx >= 0 ? cells[idx] : undefined;
    };
    try {
      const submittedRaw = get("submittedAt")?.trim();
      const submitted = submittedRaw ? new Date(submittedRaw.replace(/\. /g, "-").replace(/\.$/, "")) : new Date();
      parsed.push({
        row: rowNo,
        identity: JSON.stringify(["totalRating", "restaurantRating", "accommodationRating", "attractionRating", "guideRating", "comment", "reviewerName", "submittedAt"].map((k) => get(k)?.trim() ?? "")),
        review: {
          totalRating: rating(get("totalRating"), true)!,
          restaurantRating: rating(get("restaurantRating"), false),
          accommodationRating: rating(get("accommodationRating"), false),
          attractionRating: rating(get("attractionRating"), false),
          guideRating: rating(get("guideRating"), false),
          comment: get("comment")?.trim().slice(0, 2000) || null,
          reviewerName: get("reviewerName")?.trim().slice(0, 50) || null,
          submittedAt: Number.isNaN(submitted.getTime()) ? new Date().toISOString() : submitted.toISOString(),
        },
      });
    } catch (e) {
      errors.push({ row: rowNo, message: (e as Error).message });
    }
  });
  return { parsed, errors };
}
