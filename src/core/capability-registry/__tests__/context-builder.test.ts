/**
 * Unit tests for context-builder — model extraction from child responses.
 */

import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import { createCapabilityContext } from "../context-builder.js";
import type { CapabilityDefinition } from "../capability-registry.types.js";
import type { CapabilityRegistryDeps } from "../capability-registry.js";
import type { McpToolResponse } from "../invocation-handler.js";
import { z } from "zod";

describe("createCapabilityContext - model extraction", () => {
  let mockDeps: CapabilityRegistryDeps;
  let mockSelfInvoke: jest.Mock<(name: string, input: unknown) => Promise<McpToolResponse>>;
  let mockCapability: CapabilityDefinition;

  beforeEach(() => {
    // Setup mock dependencies
    const mockSession = {
      id: "test-session-id",
      invocations: [],
      totalCost: 0,
      totalInputTokens: 0,
      totalOutputTokens: 0,
      totalTurns: 0,
      createdAt: new Date().toISOString(),
    };

    mockDeps = {
      sessionManager: {
        getSession: jest.fn(() => mockSession),
        propagateChildCost: jest.fn(),
      } as any,
      costTracker: {
        getSessionSummary: jest.fn(() => ({
          totalCostUsd: 0.05,
          totalInputTokens: 200,
          totalOutputTokens: 100,
          totalTurns: 2,
          operationCount: 2,
        })),
        recordChildCost: jest.fn(),
      } as any,
      logger: {
        withContext: jest.fn(() => ({
          info: jest.fn(),
          debug: jest.fn(),
          error: jest.fn(),
          warn: jest.fn(),
        })),
      } as any,
      costReportWriter: {} as any,
      diskWriter: {} as any,
      promptLoader: {} as any,
      aiProvider: {} as any,
    };

    mockSelfInvoke = jest.fn();

    mockCapability = {
      id: "test-capability",
      type: "tool",
      name: "Test Capability",
      description: "Test",
      inputSchema: z.object({}),
      promptRegistry: {},
      currentPromptVersion: "v1",
      preparePromptInput: (input) => input,
      processResult: (input) => input,
    };
  });

  it("extracts _model from child response and uses it in cost entry", async () => {
    // Setup child response with _model field
    const childResponse: McpToolResponse = {
      content: [
        {
          type: "text",
          text: JSON.stringify({
            result: "success",
            session_id: "child-session-id",
            cost_usd: 0.02,
            turns: 1,
            _input_tokens: 100,
            _output_tokens: 50,
            _model: "claude-3-5-haiku-20241022",
          }),
        },
      ],
    };

    mockSelfInvoke.mockResolvedValue(childResponse);

    const context = createCapabilityContext(
      "test-session-id",
      "test-invocation-id",
      mockCapability,
      mockDeps,
      mockSelfInvoke
    );

    // Invoke child capability
    await context.invokeCapability("child-capability", {});

    // Verify recordChildCost was called with the correct model
    expect(mockDeps.costTracker.recordChildCost).toHaveBeenCalledWith(
      "test-session-id",
      "test-invocation-id",
      "child-capability",
      expect.objectContaining({
        model: "claude-3-5-haiku-20241022",
        inputTokens: 100,
        outputTokens: 50,
        costUsd: 0.02,
      })
    );
  });

  it("uses default model when _model is missing from child response", async () => {
    // Child response without _model field
    const childResponse: McpToolResponse = {
      content: [
        {
          type: "text",
          text: JSON.stringify({
            result: "success",
            session_id: "child-session-id",
            cost_usd: 0.02,
            turns: 1,
            _input_tokens: 100,
            _output_tokens: 50,
            // _model is missing
          }),
        },
      ],
    };

    mockSelfInvoke.mockResolvedValue(childResponse);

    const context = createCapabilityContext(
      "test-session-id",
      "test-invocation-id",
      mockCapability,
      mockDeps,
      mockSelfInvoke
    );

    await context.invokeCapability("child-capability", {});

    // Verify default model is used
    expect(mockDeps.costTracker.recordChildCost).toHaveBeenCalledWith(
      "test-session-id",
      "test-invocation-id",
      "child-capability",
      expect.objectContaining({
        model: "claude-3-5-sonnet-20241022",
      })
    );
  });

  it("uses default model when _model is not a string", async () => {
    // Child response with invalid _model type
    const childResponse: McpToolResponse = {
      content: [
        {
          type: "text",
          text: JSON.stringify({
            result: "success",
            session_id: "child-session-id",
            cost_usd: 0.02,
            turns: 1,
            _input_tokens: 100,
            _output_tokens: 50,
            _model: 12345, // Invalid type
          }),
        },
      ],
    };

    mockSelfInvoke.mockResolvedValue(childResponse);

    const context = createCapabilityContext(
      "test-session-id",
      "test-invocation-id",
      mockCapability,
      mockDeps,
      mockSelfInvoke
    );

    await context.invokeCapability("child-capability", {});

    // Verify default model is used
    expect(mockDeps.costTracker.recordChildCost).toHaveBeenCalledWith(
      "test-session-id",
      "test-invocation-id",
      "child-capability",
      expect.objectContaining({
        model: "claude-3-5-sonnet-20241022",
      })
    );
  });

  it("handles different model values from child (opus)", async () => {
    const childResponse: McpToolResponse = {
      content: [
        {
          type: "text",
          text: JSON.stringify({
            result: "success",
            session_id: "child-session-id",
            cost_usd: 0.05,
            turns: 1,
            _input_tokens: 150,
            _output_tokens: 75,
            _model: "opus",
          }),
        },
      ],
    };

    mockSelfInvoke.mockResolvedValue(childResponse);

    const context = createCapabilityContext(
      "test-session-id",
      "test-invocation-id",
      mockCapability,
      mockDeps,
      mockSelfInvoke
    );

    await context.invokeCapability("child-capability", {});

    expect(mockDeps.costTracker.recordChildCost).toHaveBeenCalledWith(
      "test-session-id",
      "test-invocation-id",
      "child-capability",
      expect.objectContaining({
        model: "opus",
      })
    );
  });

  it("uses childSessionId for unique cost entry IDs to prevent collisions", async () => {
    // This test verifies that when a parent invokes multiple children,
    // each child gets a unique cost entry ID based on childSessionId,
    // not the parent's invocationId (which would cause collisions)

    const childResponse1: McpToolResponse = {
      content: [
        {
          type: "text",
          text: JSON.stringify({
            result: "child-1-success",
            session_id: "child-session-id-1",
            cost_usd: 0.01,
            turns: 1,
            _input_tokens: 50,
            _output_tokens: 25,
            _model: "claude-3-5-haiku-20241022",
          }),
        },
      ],
    };

    const childResponse2: McpToolResponse = {
      content: [
        {
          type: "text",
          text: JSON.stringify({
            result: "child-2-success",
            session_id: "child-session-id-2",
            cost_usd: 0.02,
            turns: 1,
            _input_tokens: 100,
            _output_tokens: 50,
            _model: "claude-3-5-sonnet-20241022",
          }),
        },
      ],
    };

    mockSelfInvoke
      .mockResolvedValueOnce(childResponse1)
      .mockResolvedValueOnce(childResponse2);

    const context = createCapabilityContext(
      "test-session-id",
      "test-invocation-id",
      mockCapability,
      mockDeps,
      mockSelfInvoke
    );

    // Invoke two children sequentially with the SAME parent invocationId
    await context.invokeCapability("child-capability-1", {});
    await context.invokeCapability("child-capability-2", {});

    // Verify that both recordChildCost calls have UNIQUE IDs
    expect(mockDeps.costTracker.recordChildCost).toHaveBeenCalledTimes(2);

    // First child should have ID based on child-session-id-1
    expect(mockDeps.costTracker.recordChildCost).toHaveBeenNthCalledWith(
      1,
      "test-session-id",
      "test-invocation-id",
      "child-capability-1",
      expect.objectContaining({
        id: "cost_child_child-session-id-1", // NOT cost_child_test-invocation-id
        childSessionId: "child-session-id-1",
      })
    );

    // Second child should have ID based on child-session-id-2
    expect(mockDeps.costTracker.recordChildCost).toHaveBeenNthCalledWith(
      2,
      "test-session-id",
      "test-invocation-id",
      "child-capability-2",
      expect.objectContaining({
        id: "cost_child_child-session-id-2", // NOT cost_child_test-invocation-id
        childSessionId: "child-session-id-2",
      })
    );
  });

  describe("Child Metadata Propagation", () => {
    it("extracts commitSha from child result", async () => {
      const childResponse: McpToolResponse = {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              result: "success",
              session_id: "child-session-id",
              cost_usd: 0.02,
              turns: 1,
              _input_tokens: 100,
              _output_tokens: 50,
              _model: "sonnet",
              commit_sha: "abc123def456",
            }),
          },
        ],
      };

      mockSelfInvoke.mockResolvedValue(childResponse);

      const context = createCapabilityContext(
        "test-session-id",
        "test-invocation-id",
        mockCapability,
        mockDeps,
        mockSelfInvoke
      );

      await context.invokeCapability("child-capability", {});

      expect(mockDeps.costTracker.recordChildCost).toHaveBeenCalledWith(
        "test-session-id",
        "test-invocation-id",
        "child-capability",
        expect.objectContaining({
          commitSha: "abc123def456",
        })
      );
    });

    it("sets status='success' when no error field present", async () => {
      const childResponse: McpToolResponse = {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              result: "success",
              session_id: "child-session-id",
              cost_usd: 0.02,
              turns: 1,
              _input_tokens: 100,
              _output_tokens: 50,
            }),
          },
        ],
      };

      mockSelfInvoke.mockResolvedValue(childResponse);

      const context = createCapabilityContext(
        "test-session-id",
        "test-invocation-id",
        mockCapability,
        mockDeps,
        mockSelfInvoke
      );

      await context.invokeCapability("child-capability", {});

      expect(mockDeps.costTracker.recordChildCost).toHaveBeenCalledWith(
        "test-session-id",
        "test-invocation-id",
        "child-capability",
        expect.objectContaining({
          status: "success",
        })
      );
    });

    it("sets status='error' when error field present", async () => {
      const childResponse: McpToolResponse = {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              error: "Error",
              message: "Child capability failed",
              session_id: "child-session-id",
              cost_usd: 0.02,
              turns: 1,
              _input_tokens: 100,
              _output_tokens: 50,
            }),
          },
        ],
      };

      mockSelfInvoke.mockResolvedValue(childResponse);

      const context = createCapabilityContext(
        "test-session-id",
        "test-invocation-id",
        mockCapability,
        mockDeps,
        mockSelfInvoke
      );

      await context.invokeCapability("child-capability", {});

      expect(mockDeps.costTracker.recordChildCost).toHaveBeenCalledWith(
        "test-session-id",
        "test-invocation-id",
        "child-capability",
        expect.objectContaining({
          status: "error",
        })
      );
    });

    it("handles missing commitSha gracefully", async () => {
      const childResponse: McpToolResponse = {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              result: "success",
              session_id: "child-session-id",
              cost_usd: 0.02,
              turns: 1,
              _input_tokens: 100,
              _output_tokens: 50,
              // No commit_sha
            }),
          },
        ],
      };

      mockSelfInvoke.mockResolvedValue(childResponse);

      const context = createCapabilityContext(
        "test-session-id",
        "test-invocation-id",
        mockCapability,
        mockDeps,
        mockSelfInvoke
      );

      await context.invokeCapability("child-capability", {});

      expect(mockDeps.costTracker.recordChildCost).toHaveBeenCalledWith(
        "test-session-id",
        "test-invocation-id",
        "child-capability",
        expect.objectContaining({
          commitSha: undefined,
        })
      );
    });

    it("handles null commitSha value", async () => {
      const childResponse: McpToolResponse = {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              result: "success",
              session_id: "child-session-id",
              cost_usd: 0.02,
              turns: 1,
              _input_tokens: 100,
              _output_tokens: 50,
              commit_sha: null,
            }),
          },
        ],
      };

      mockSelfInvoke.mockResolvedValue(childResponse);

      const context = createCapabilityContext(
        "test-session-id",
        "test-invocation-id",
        mockCapability,
        mockDeps,
        mockSelfInvoke
      );

      await context.invokeCapability("child-capability", {});

      expect(mockDeps.costTracker.recordChildCost).toHaveBeenCalledWith(
        "test-session-id",
        "test-invocation-id",
        "child-capability",
        expect.objectContaining({
          commitSha: undefined,
        })
      );
    });

    it("includes commitSha and status in recorded CostEntry", async () => {
      const childResponse: McpToolResponse = {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              result: "success",
              session_id: "child-session-id",
              cost_usd: 0.02,
              turns: 1,
              _input_tokens: 100,
              _output_tokens: 50,
              _model: "haiku",
              commit_sha: "xyz789",
            }),
          },
        ],
      };

      mockSelfInvoke.mockResolvedValue(childResponse);

      const context = createCapabilityContext(
        "test-session-id",
        "test-invocation-id",
        mockCapability,
        mockDeps,
        mockSelfInvoke
      );

      await context.invokeCapability("child-capability", {});

      // Verify both commitSha and status are included
      expect(mockDeps.costTracker.recordChildCost).toHaveBeenCalledWith(
        "test-session-id",
        "test-invocation-id",
        "child-capability",
        expect.objectContaining({
          model: "haiku",
          commitSha: "xyz789",
          status: "success",
          costUsd: 0.02,
          inputTokens: 100,
          outputTokens: 50,
        })
      );
    });
  });

  describe("propagateChildCost cache metrics extraction", () => {
    it("extracts promptCacheWrite from _cache_creation_input_tokens when > 0 (AC-6)", async () => {
      const childResponse: McpToolResponse = {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              result: "success",
              session_id: "child-session-id",
              cost_usd: 0.02,
              turns: 1,
              _input_tokens: 1500,
              _output_tokens: 800,
              _model: "sonnet",
              _cache_creation_input_tokens: 12000,
            }),
          },
        ],
      };

      mockSelfInvoke.mockResolvedValue(childResponse);

      const context = createCapabilityContext(
        "test-session-id",
        "test-invocation-id",
        mockCapability,
        mockDeps,
        mockSelfInvoke
      );

      await context.invokeCapability("child-capability", {});

      expect(mockDeps.costTracker.recordChildCost).toHaveBeenCalledWith(
        "test-session-id",
        "test-invocation-id",
        "child-capability",
        expect.objectContaining({
          promptCacheWrite: 12000,
        })
      );
    });

    it("extracts promptCacheRead from _cache_read_input_tokens when > 0 (AC-7)", async () => {
      const childResponse: McpToolResponse = {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              result: "success",
              session_id: "child-session-id",
              cost_usd: 0.02,
              turns: 1,
              _input_tokens: 1500,
              _output_tokens: 800,
              _model: "sonnet",
              _cache_read_input_tokens: 8500,
            }),
          },
        ],
      };

      mockSelfInvoke.mockResolvedValue(childResponse);

      const context = createCapabilityContext(
        "test-session-id",
        "test-invocation-id",
        mockCapability,
        mockDeps,
        mockSelfInvoke
      );

      await context.invokeCapability("child-capability", {});

      expect(mockDeps.costTracker.recordChildCost).toHaveBeenCalledWith(
        "test-session-id",
        "test-invocation-id",
        "child-capability",
        expect.objectContaining({
          promptCacheRead: 8500,
        })
      );
    });

    it("omits promptCacheWrite when value is 0 (AC-6, AC-10)", async () => {
      const childResponse: McpToolResponse = {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              result: "success",
              session_id: "child-session-id",
              cost_usd: 0.02,
              turns: 1,
              _input_tokens: 1500,
              _output_tokens: 800,
              _model: "sonnet",
              _cache_creation_input_tokens: 0,
            }),
          },
        ],
      };

      mockSelfInvoke.mockResolvedValue(childResponse);

      const context = createCapabilityContext(
        "test-session-id",
        "test-invocation-id",
        mockCapability,
        mockDeps,
        mockSelfInvoke
      );

      await context.invokeCapability("child-capability", {});

      expect(mockDeps.costTracker.recordChildCost).toHaveBeenCalledWith(
        "test-session-id",
        "test-invocation-id",
        "child-capability",
        expect.not.objectContaining({
          promptCacheWrite: expect.anything(),
        })
      );
    });

    it("omits promptCacheRead when undefined (AC-7, AC-10)", async () => {
      const childResponse: McpToolResponse = {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              result: "success",
              session_id: "child-session-id",
              cost_usd: 0.02,
              turns: 1,
              _input_tokens: 1500,
              _output_tokens: 800,
              _model: "sonnet",
              // _cache_read_input_tokens is undefined
            }),
          },
        ],
      };

      mockSelfInvoke.mockResolvedValue(childResponse);

      const context = createCapabilityContext(
        "test-session-id",
        "test-invocation-id",
        mockCapability,
        mockDeps,
        mockSelfInvoke
      );

      await context.invokeCapability("child-capability", {});

      expect(mockDeps.costTracker.recordChildCost).toHaveBeenCalledWith(
        "test-session-id",
        "test-invocation-id",
        "child-capability",
        expect.not.objectContaining({
          promptCacheRead: expect.anything(),
        })
      );
    });

    it("extracts promptVersion from _prompt_version when present (AC-8)", async () => {
      const childResponse: McpToolResponse = {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              result: "success",
              session_id: "child-session-id",
              cost_usd: 0.02,
              turns: 1,
              _input_tokens: 1500,
              _output_tokens: 800,
              _model: "sonnet",
              _prompt_version: "v2",
            }),
          },
        ],
      };

      mockSelfInvoke.mockResolvedValue(childResponse);

      const context = createCapabilityContext(
        "test-session-id",
        "test-invocation-id",
        mockCapability,
        mockDeps,
        mockSelfInvoke
      );

      await context.invokeCapability("child-capability", {});

      expect(mockDeps.costTracker.recordChildCost).toHaveBeenCalledWith(
        "test-session-id",
        "test-invocation-id",
        "child-capability",
        expect.objectContaining({
          promptVersion: "v2",
        })
      );
    });

    it("omits promptVersion when undefined (AC-8, AC-10)", async () => {
      const childResponse: McpToolResponse = {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              result: "success",
              session_id: "child-session-id",
              cost_usd: 0.02,
              turns: 1,
              _input_tokens: 1500,
              _output_tokens: 800,
              _model: "sonnet",
              // _prompt_version is undefined
            }),
          },
        ],
      };

      mockSelfInvoke.mockResolvedValue(childResponse);

      const context = createCapabilityContext(
        "test-session-id",
        "test-invocation-id",
        mockCapability,
        mockDeps,
        mockSelfInvoke
      );

      await context.invokeCapability("child-capability", {});

      expect(mockDeps.costTracker.recordChildCost).toHaveBeenCalledWith(
        "test-session-id",
        "test-invocation-id",
        "child-capability",
        expect.not.objectContaining({
          promptVersion: expect.anything(),
        })
      );
    });

    it("calculates totalTokensIn as inputTokens + promptCacheRead (AC-4, AC-12)", async () => {
      const childResponse: McpToolResponse = {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              result: "success",
              session_id: "child-session-id",
              cost_usd: 0.02,
              turns: 1,
              _input_tokens: 1500,
              _output_tokens: 800,
              _model: "sonnet",
              _cache_read_input_tokens: 8500,
            }),
          },
        ],
      };

      mockSelfInvoke.mockResolvedValue(childResponse);

      const context = createCapabilityContext(
        "test-session-id",
        "test-invocation-id",
        mockCapability,
        mockDeps,
        mockSelfInvoke
      );

      await context.invokeCapability("child-capability", {});

      expect(mockDeps.costTracker.recordChildCost).toHaveBeenCalledWith(
        "test-session-id",
        "test-invocation-id",
        "child-capability",
        expect.objectContaining({
          totalTokensIn: 10000, // 1500 + 8500
        })
      );
    });

    it("calculates totalTokensIn when promptCacheRead is 0 (AC-4, AC-12)", async () => {
      const childResponse: McpToolResponse = {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              result: "success",
              session_id: "child-session-id",
              cost_usd: 0.02,
              turns: 1,
              _input_tokens: 1500,
              _output_tokens: 800,
              _model: "sonnet",
              _cache_read_input_tokens: 0,
            }),
          },
        ],
      };

      mockSelfInvoke.mockResolvedValue(childResponse);

      const context = createCapabilityContext(
        "test-session-id",
        "test-invocation-id",
        mockCapability,
        mockDeps,
        mockSelfInvoke
      );

      await context.invokeCapability("child-capability", {});

      expect(mockDeps.costTracker.recordChildCost).toHaveBeenCalledWith(
        "test-session-id",
        "test-invocation-id",
        "child-capability",
        expect.objectContaining({
          totalTokensIn: 1500, // 1500 + 0
        })
      );
    });

    it("calculates totalTokensOut as outputTokens (AC-5, AC-12)", async () => {
      const childResponse: McpToolResponse = {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              result: "success",
              session_id: "child-session-id",
              cost_usd: 0.02,
              turns: 1,
              _input_tokens: 1500,
              _output_tokens: 800,
              _model: "sonnet",
            }),
          },
        ],
      };

      mockSelfInvoke.mockResolvedValue(childResponse);

      const context = createCapabilityContext(
        "test-session-id",
        "test-invocation-id",
        mockCapability,
        mockDeps,
        mockSelfInvoke
      );

      await context.invokeCapability("child-capability", {});

      expect(mockDeps.costTracker.recordChildCost).toHaveBeenCalledWith(
        "test-session-id",
        "test-invocation-id",
        "child-capability",
        expect.objectContaining({
          totalTokensOut: 800,
        })
      );
    });

    it("includes all cache metrics and prompt version in single entry (AC-6, AC-7, AC-8, AC-12)", async () => {
      const childResponse: McpToolResponse = {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              result: "success",
              session_id: "child-session-id",
              cost_usd: 0.02,
              turns: 1,
              _input_tokens: 1500,
              _output_tokens: 800,
              _model: "sonnet",
              _cache_creation_input_tokens: 12000,
              _cache_read_input_tokens: 7000,
              _prompt_version: "v2",
            }),
          },
        ],
      };

      mockSelfInvoke.mockResolvedValue(childResponse);

      const context = createCapabilityContext(
        "test-session-id",
        "test-invocation-id",
        mockCapability,
        mockDeps,
        mockSelfInvoke
      );

      await context.invokeCapability("child-capability", {});

      expect(mockDeps.costTracker.recordChildCost).toHaveBeenCalledWith(
        "test-session-id",
        "test-invocation-id",
        "child-capability",
        expect.objectContaining({
          promptCacheWrite: 12000,
          promptCacheRead: 7000,
          promptVersion: "v2",
          totalTokensIn: 8500, // 1500 + 7000
          totalTokensOut: 800,
        })
      );
    });

    it("omits promptCacheWrite when empty string (AC-6, AC-10)", async () => {
      const childResponse: McpToolResponse = {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              result: "success",
              session_id: "child-session-id",
              cost_usd: 0.02,
              turns: 1,
              _input_tokens: 1500,
              _output_tokens: 800,
              _model: "sonnet",
              _prompt_version: "",
            }),
          },
        ],
      };

      mockSelfInvoke.mockResolvedValue(childResponse);

      const context = createCapabilityContext(
        "test-session-id",
        "test-invocation-id",
        mockCapability,
        mockDeps,
        mockSelfInvoke
      );

      await context.invokeCapability("child-capability", {});

      expect(mockDeps.costTracker.recordChildCost).toHaveBeenCalledWith(
        "test-session-id",
        "test-invocation-id",
        "child-capability",
        expect.not.objectContaining({
          promptVersion: expect.anything(),
        })
      );
    });
  });
});
