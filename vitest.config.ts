import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["packages/**/*.test.ts", "apps/**/*.test.{ts,tsx}"],
    exclude: ["**/node_modules/**", "**/dist/**"],
    coverage: {
      provider: "v8",
      include: ["packages/core/src/**/*.ts", "apps/api/src/**/*.ts"],
      exclude: [
        "**/*.test.ts",
        "**/test-fixtures.ts",
        "**/index.ts",
        "apps/api/src/server.ts",
        "apps/api/src/db/migrate.ts",
      ],
      thresholds: { lines: 70, branches: 70, functions: 70, statements: 70 },
    },
  },
});
