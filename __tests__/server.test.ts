/**
 * Tests for MCP server factory.
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { createServer } from "../src/server.js";
import { CapabilityRegistry } from "../src/core/capability-registry/index.js";

describe("createServer", () => {
  it("returns server context with McpServer instance", () => {
    const { server, registry } = createServer();
    expect(server).toBeInstanceOf(McpServer);
    expect(registry).toBeInstanceOf(CapabilityRegistry);
  });

  it("creates new instances on each call", () => {
    const ctx1 = createServer();
    const ctx2 = createServer();
    expect(ctx1.server).not.toBe(ctx2.server);
    expect(ctx1.registry).not.toBe(ctx2.registry);
  });

  it("server has registerTool method", () => {
    const { server } = createServer();
    expect(typeof server.registerTool).toBe("function");
  });

  it("server has connect method", () => {
    const { server } = createServer();
    expect(typeof server.connect).toBe("function");
  });

  it("server can register a tool without error", () => {
    const { server } = createServer();

    // Verify that registerTool can be called without throwing
    expect(() => {
      server.registerTool(
        "test_tool",
        {
          title: "Test Tool",
          description: "A test tool",
        },
        async () => ({ content: [{ type: "text" as const, text: "test" }] })
      );
    }).not.toThrow();
  });

  it("initializes capability registry", () => {
    const { registry } = createServer();
    expect(registry.listCapabilities()).toEqual([]);
  });
});
