import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

// Next 16 부터 `next lint` 가 없어져 ESLint CLI + eslint-config-next 의 flat config 를 직접 쓴다
export default defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores([".next/**", ".next-dev/**", "next-env.d.ts"]),
]);
