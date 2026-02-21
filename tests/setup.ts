/**
 * Jest ESM setup file for mcp-ts-engineer tests.
 *
 * This file is loaded before tests run and configures the test environment.
 */

import { jest, beforeEach } from "@jest/globals";

// Extend timeout for async operations in tests
jest.setTimeout(10000);

// Reset mocks between tests
beforeEach(() => {
  jest.restoreAllMocks();
});

export {};
