/**
 * Shared test data and helpers for skill loading integration tests.
 * Provides mock package.json data and utility functions used across
 * project-type-specific test files.
 *
 * NOTE: Each test file must set up its own vi.mock('fs') and dynamic imports
 * because Vitest's hoisted mocks cannot be shared across modules.
 */

import { vi } from 'vitest'

// ---------------------------------------------------------------------------
// Real-world package.json data from monorepo projects
// ---------------------------------------------------------------------------

/** Example NestJS GraphQL backend package.json */
export const EXAMPLE_SERVER_PKG = {
  dependencies: {
    '@apollo/server': '4.0.0',
    '@nestjs/apollo': '12.0.0',
    '@nestjs/common': '11.0.0',
    '@nestjs/config': '3.0.0',
    '@nestjs/core': '11.0.0',
    '@nestjs/graphql': '12.0.0',
    '@nestjs/jwt': '11.0.0',
    '@nestjs/mongoose': '11.0.0',
    '@nestjs/passport': '11.0.0',
    '@nestjs/platform-express': '11.0.0',
    'class-transformer': '0.5.0',
    'class-validator': '0.14.0',
    'date-fns': '3.0.0',
    'date-fns-tz': '3.0.0',
    graphql: '16.0.0',
    mongoose: '8.0.0',
    passport: '0.7.0',
    'passport-jwt': '4.0.0',
    rxjs: '7.0.0',
  },
  devDependencies: {
    '@nestjs/cli': '11.0.0',
    '@nestjs/testing': '11.0.0',
    '@types/jest': '29.0.0',
    jest: '29.0.0',
    'ts-jest': '29.0.0',
    typescript: '5.0.0',
  },
}

/** Example React Native/Expo mobile app package.json */
export const EXAMPLE_APP_PKG = {
  dependencies: {
    '@react-native-community/netinfo': '11.0.0',
    '@sentry/react-native': '6.0.0',
    '@shopify/flash-list': '1.0.0',
    '@tanstack/react-query': '5.0.0',
    'date-fns': '3.0.0',
    expo: '54.0.0',
    'expo-notifications': '0.28.0',
    'expo-router': '4.0.0',
    'graphql-request': '7.0.0',
    nativewind: '4.0.0',
    react: '19.0.0',
    'react-hook-form': '7.0.0',
    'react-native': '0.81.0',
    'react-native-gesture-handler': '2.0.0',
    'react-native-keyboard-controller': '1.0.0',
    'react-native-mmkv': '3.0.0',
    'react-native-reanimated': '3.0.0',
    zod: '3.0.0',
    zustand: '5.0.0',
  },
  devDependencies: {
    '@biomejs/biome': '1.0.0',
    '@testing-library/react-native': '12.0.0',
    '@types/jest': '29.0.0',
    jest: '29.0.0',
    typescript: '5.0.0',
  },
}

/** Example Next.js web app package.json */
export const EXAMPLE_NEXT_APP_PKG = {
  dependencies: {
    next: '15.0.0',
    react: '19.0.0',
    'react-dom': '19.0.0',
    '@tanstack/react-query': '5.0.0',
    zustand: '5.0.0',
    'react-hook-form': '7.0.0',
    '@hookform/resolvers': '3.0.0',
    zod: '3.0.0',
    'better-auth': '1.0.0',
    'class-variance-authority': '0.7.0',
    clsx: '2.0.0',
    'tailwind-merge': '2.0.0',
    'lucide-react': '0.400.0',
    'tw-animate-css': '1.0.0',
  },
  devDependencies: {
    typescript: '5.0.0',
    '@biomejs/biome': '2.0.0',
    '@tailwindcss/postcss': '4.0.0',
    tailwindcss: '4.0.0',
    vitest: '3.0.0',
    '@vitejs/plugin-react': '4.0.0',
    '@testing-library/react': '16.0.0',
    '@testing-library/jest-dom': '6.0.0',
    '@testing-library/user-event': '14.0.0',
    'vite-tsconfig-paths': '5.0.0',
    jsdom: '25.0.0',
  },
}

/** apps/mcp-ts-engineer/package.json (MCP server with Agent SDK) */
export const MCP_TS_ENGINEER_PKG = {
  dependencies: {
    '@anthropic-ai/claude-agent-sdk': '0.1.0',
    '@modelcontextprotocol/sdk': '1.22.0',
    zod: '3.0.0',
  },
  devDependencies: {
    '@types/jest': '29.0.0',
    '@types/node': '20.0.0',
    jest: '29.0.0',
    'ts-jest': '29.0.0',
    tsx: '4.0.0',
    typescript: '5.0.0',
  },
}

/** apps/mcp-agents-executor/package.json (MCP server, no Agent SDK) */
export const MCP_AGENTS_EXECUTOR_PKG = {
  dependencies: {
    '@modelcontextprotocol/sdk': '1.22.0',
    zod: '3.0.0',
  },
  devDependencies: {
    '@types/jest': '29.0.0',
    '@types/node': '20.0.0',
    jest: '29.0.0',
    'ts-jest': '29.0.0',
    tsx: '4.0.0',
    typescript: '5.0.0',
  },
}

/** packages/utils/package.json (minimal shared utility package) */
export const UTILS_PKG = {
  devDependencies: {
    typescript: '5.0.0',
  },
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Mock phase plan for prompt builder tests. */
export const MOCK_PHASE_PLAN = {
  phases: [
    {
      phase_number: 1,
      purpose: 'Test phase',
      dependencies: ['none'],
      files: [{ path: 'src/test.ts', action: 'CREATE', purpose: 'Test file' }],
    },
  ],
}

/** Creates a mock capability context for preparePromptInput tests. */
export function createMockContext(): Record<string, unknown> {
  return {
    session: { id: 's1' },
    invocation: { id: 'i1' },
    logger: { info: () => {}, debug: () => {}, error: () => {}, warn: () => {} },
    getSessionCost: () => ({ totalCostUsd: 0 }),
    promptVersion: 'v2',
    providerName: 'ClaudeProvider',
    invokeCapability: vi.fn(),
  }
}
