/**
 * Tests for AI Provider factory.
 */

import {
  registerProvider,
  createAIProvider,
  getRegisteredProviders,
  clearProviderRegistry,
  type ProviderFactory,
} from "../ai-provider.factory.js";
import { ConfigError } from "../../errors.js";
import type { AIProvider, AIQueryRequest, AIQueryResult } from "../ai-provider.types.js";

// Mock provider for testing
class MockProvider implements AIProvider {
  constructor(private options?: Record<string, unknown>) {}

  async query(_request: AIQueryRequest): Promise<AIQueryResult> {
    return {
      content: "mock response",
      usage: { inputTokens: 10, outputTokens: 20, totalTokens: 30 },
      costUsd: 0.001,
      turns: 1,
      terminationReason: "success",
      trace: {
        tid: "test-trace",
        startedAt: new Date().toISOString(),
        request: _request,
        turns: [],
      },
    };
  }

  getOptions(): Record<string, unknown> | undefined {
    return this.options;
  }
}

describe("AI Provider Factory", () => {
  beforeEach(() => {
    // Clear registry before each test
    clearProviderRegistry();
  });

  describe("registerProvider", () => {
    it("should register a provider with valid name", () => {
      const factory: ProviderFactory = () => new MockProvider();

      expect(() => registerProvider("test-provider", factory)).not.toThrow();
      expect(getRegisteredProviders()).toContain("test-provider");
    });

    it("should accept names with alphanumeric, hyphens, and underscores", () => {
      const factory: ProviderFactory = () => new MockProvider();

      expect(() => registerProvider("claude", factory)).not.toThrow();
      expect(() => registerProvider("claude-sdk", factory)).not.toThrow();
      expect(() => registerProvider("provider_123", factory)).not.toThrow();
      expect(() => registerProvider("test-provider-v2", factory)).not.toThrow();
    });

    it("should reject invalid provider names", () => {
      const factory: ProviderFactory = () => new MockProvider();

      expect(() => registerProvider("Invalid Name", factory)).toThrow(ConfigError);
      expect(() => registerProvider("provider.name", factory)).toThrow(ConfigError);
      expect(() => registerProvider("UPPERCASE", factory)).toThrow(ConfigError);
      expect(() => registerProvider("provider@123", factory)).toThrow(ConfigError);
    });

    it("should reject duplicate provider names", () => {
      const factory: ProviderFactory = () => new MockProvider();

      registerProvider("claude", factory);

      expect(() => registerProvider("claude", factory)).toThrow(ConfigError);
      expect(() => registerProvider("claude", factory)).toThrow(/already registered/);
    });
  });

  describe("createAIProvider", () => {
    it("should create provider instance with registered factory", () => {
      const factory: ProviderFactory = () => new MockProvider();
      registerProvider("test", factory);

      const provider = createAIProvider({ name: "test" });

      expect(provider).toBeInstanceOf(MockProvider);
    });

    it("should pass options to provider factory", () => {
      const factory: ProviderFactory = (options) => new MockProvider(options);
      registerProvider("test", factory);

      const options = { apiKey: "test-key", timeout: 5000 };
      const provider = createAIProvider({ name: "test", options }) as MockProvider;

      expect(provider.getOptions()).toEqual(options);
    });

    it("should throw error for missing provider", () => {
      expect(() => createAIProvider({ name: "nonexistent" })).toThrow(ConfigError);
      expect(() => createAIProvider({ name: "nonexistent" })).toThrow(/not found/);
    });

    it("should list available providers in error message", () => {
      registerProvider("claude", () => new MockProvider());
      registerProvider("openai", () => new MockProvider());

      try {
        createAIProvider({ name: "invalid" });
        throw new Error("Should have thrown error");
      } catch (error) {
        expect(error).toBeInstanceOf(ConfigError);
        const message = (error as Error).message;
        expect(message).toContain("claude");
        expect(message).toContain("openai");
      }
    });
  });

  describe("getRegisteredProviders", () => {
    it("should return empty array when no providers registered", () => {
      expect(getRegisteredProviders()).toEqual([]);
    });

    it("should return all registered provider names", () => {
      registerProvider("provider1", () => new MockProvider());
      registerProvider("provider2", () => new MockProvider());
      registerProvider("provider3", () => new MockProvider());

      const providers = getRegisteredProviders();
      expect(providers).toHaveLength(3);
      expect(providers).toContain("provider1");
      expect(providers).toContain("provider2");
      expect(providers).toContain("provider3");
    });
  });

  describe("clearProviderRegistry", () => {
    it("should remove all registered providers", () => {
      registerProvider("provider1", () => new MockProvider());
      registerProvider("provider2", () => new MockProvider());

      expect(getRegisteredProviders()).toHaveLength(2);

      clearProviderRegistry();

      expect(getRegisteredProviders()).toHaveLength(0);
    });
  });
});
