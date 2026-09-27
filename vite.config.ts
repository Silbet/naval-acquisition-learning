import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
export default defineConfig(({ mode }) => ({
  base: mode === "pages" ? "/naval-acquisition-learning/" : "/",
  plugins: [react()],
  test: { include: ["tests/**/*.test.ts"] },
}));
