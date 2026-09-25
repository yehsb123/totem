import { afterEach, describe, expect, it, vi } from "vitest";
import { downloadCsv } from "../src/modules/reviews/csv";

const URL_ = "https://docs.google.com/spreadsheets/d/X/export?format=csv&gid=0";
const enc = new TextEncoder();

/** content-length 없이(청크) 조각을 흘려보내는 응답. pulled 로 실제로 몇 조각 읽혔는지 센다 */
function chunked(chunk: string, times: number) {
  const state = { pulled: 0 };
  const bytes = enc.encode(chunk);
  const body = new ReadableStream<Uint8Array>({
    pull(ctrl) {
      if (state.pulled >= times) return ctrl.close();
      state.pulled++;
      ctrl.enqueue(bytes);
    },
  });
  return { res: new Response(body, { status: 200, headers: { "content-type": "text/csv" } }), state };
}

afterEach(() => vi.unstubAllGlobals());

describe("CSV 내려받기 크기 제한 (바이트 기준, 넘는 순간 중단)", () => {
  it("content-length 없는 큰 응답은 끝까지 받지 않고 끊는다", async () => {
    const { res, state } = chunked("a".repeat(100_000), 1_000); // 100MB 흉내
    vi.stubGlobal("fetch", async () => res);
    await expect(downloadCsv(URL_)).rejects.toThrow("CSV 파일이 너무 큽니다.");
    expect(state.pulled).toBeLessThan(30); // 한도(2MB) 근처에서 중단
  });

  it("한글은 글자가 아니라 바이트로 센다 (글자 수로는 한도 안, 바이트로는 초과)", async () => {
    const { res } = chunked("가".repeat(100_000), 8); // 80만 글자 = 240만 바이트 > 200만
    vi.stubGlobal("fetch", async () => res);
    await expect(downloadCsv(URL_)).rejects.toThrow("CSV 파일이 너무 큽니다.");
  });

  it("한도 안의 한글 CSV 는 그대로 읽는다 (조각 경계에서 글자가 깨지지 않음)", async () => {
    const row = "총점,코멘트\n5,정말 좋았어요 😀\n";
    const { res } = chunked(row, 3);
    vi.stubGlobal("fetch", async () => res);
    expect(await downloadCsv(URL_)).toBe(row.repeat(3));
  });
});
