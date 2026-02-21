import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    include: ["**/__tests__/**/*.test.ts"],
    exclude: ["**/node_modules/**", "**/build/**"],
    setupFiles: ["./vitest.setup.ts"],
    testTimeout: 10000,
    restoreMocks: true,
    coverage: {
      include: ["src/**/*.ts"],
      exclude: ["src/**/*.d.ts", "src/**/__tests__/**", "src/index.ts"],
      thresholds: {
        branches: 25,
        functions: 80,
        lines: 80,
        statements: 80,
      },
    },
  },
});
