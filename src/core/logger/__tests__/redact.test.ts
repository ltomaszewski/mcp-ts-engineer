/**
 * Tests for redaction utility.
 */

import { redactSensitive } from "../redact.js";

describe("redactSensitive", () => {
  describe("primitives", () => {
    it("should return null as-is", () => {
      expect(redactSensitive(null)).toBe(null);
    });

    it("should return undefined as-is", () => {
      expect(redactSensitive(undefined)).toBe(undefined);
    });

    it("should return numbers as-is", () => {
      expect(redactSensitive(42)).toBe(42);
      expect(redactSensitive(3.14)).toBe(3.14);
    });

    it("should return booleans as-is", () => {
      expect(redactSensitive(true)).toBe(true);
      expect(redactSensitive(false)).toBe(false);
    });
  });

  describe("strings", () => {
    it("should redact Anthropic API keys", () => {
      const input = "My key is sk-ant-api03-abcdefghij1234567890";
      const result = redactSensitive(input);
      expect(result).toBe("My key is [REDACTED]");
    });

    it("should redact Bearer tokens", () => {
      const input = "Authorization: Bearer abc123def456";
      const result = redactSensitive(input);
      expect(result).toBe("Authorization: [REDACTED]");
    });

    it("should redact generic API keys", () => {
      const input = 'Config: api_key="my-secret-key-123"';
      const result = redactSensitive(input);
      expect(result).toBe('Config: [REDACTED]');
    });

    it("should not redact safe strings", () => {
      const input = "Hello world, this is safe text";
      const result = redactSensitive(input);
      expect(result).toBe(input);
    });

    it("should handle multiple patterns in one string", () => {
      const input = "Key: sk-ant-api03-abcdefghijk and Bearer token123";
      const result = redactSensitive(input);
      expect(result).toContain("[REDACTED]");
      expect(result).not.toContain("sk-ant-api03");
      expect(result).not.toContain("token123");
    });
  });

  describe("objects", () => {
    it("should redact sensitive values in objects", () => {
      const input = {
        username: "alice",
        apiKey: "sk-ant-api03-secretkey123",
        safe: "value",
      };
      const result = redactSensitive(input) as Record<string, unknown>;
      expect(result.username).toBe("alice");
      expect(result.apiKey).toBe("[REDACTED]");
      expect(result.safe).toBe("value");
    });

    it("should handle nested objects", () => {
      const input = {
        user: {
          name: "bob",
          auth: {
            token: "Bearer secret-token-xyz",
          },
        },
      };
      const result = redactSensitive(input) as Record<string, unknown>;
      const user = result.user as Record<string, unknown>;
      const auth = user.auth as Record<string, unknown>;
      expect(user.name).toBe("bob");
      expect(auth.token).toBe("[REDACTED]");
    });

    it("should handle JSON password fields", () => {
      const input = '{"username":"alice","password":"supersecret123"}';
      const result = redactSensitive(input);
      expect(result).toBe('{"username":"alice",[REDACTED]}');
    });

    it("should handle JSON token fields", () => {
      const input = '{"user":"bob","token":"abc123xyz"}';
      const result = redactSensitive(input);
      expect(result).toBe('{"user":"bob",[REDACTED]}');
    });
  });

  describe("arrays", () => {
    it("should redact sensitive values in arrays", () => {
      const input = ["safe", "sk-ant-api03-secret", "also safe"];
      const result = redactSensitive(input) as string[];
      expect(result[0]).toBe("safe");
      expect(result[1]).toBe("[REDACTED]");
      expect(result[2]).toBe("also safe");
    });

    it("should handle arrays with nested objects", () => {
      const input = [
        { id: 1, key: "sk-ant-api03-key1" },
        { id: 2, key: "safe" },
      ];
      const result = redactSensitive(input) as Array<Record<string, unknown>>;
      expect(result[0]?.id).toBe(1);
      expect(result[0]?.key).toBe("[REDACTED]");
      expect(result[1]?.id).toBe(2);
      expect(result[1]?.key).toBe("safe");
    });
  });

  describe("circular references", () => {
    it("should handle circular object references", () => {
      const obj: Record<string, unknown> = { name: "test" };
      obj.self = obj; // Circular reference

      const result = redactSensitive(obj) as Record<string, unknown>;
      expect(result.name).toBe("test");
      expect(result.self).toBe("[CIRCULAR]");
    });

    it("should handle circular array references", () => {
      const arr: unknown[] = ["item"];
      arr.push(arr); // Circular reference

      const result = redactSensitive(arr) as unknown[];
      expect(result[0]).toBe("item");
      expect(result[1]).toBe("[CIRCULAR]");
    });
  });

  describe("depth limits", () => {
    it("should handle deeply nested objects within limit", () => {
      const deep = { a: { b: { c: { d: { e: "value" } } } } };
      const result = redactSensitive(deep) as Record<string, unknown>;
      const a = result.a as Record<string, unknown>;
      const b = a.b as Record<string, unknown>;
      const c = b.c as Record<string, unknown>;
      const d = c.d as Record<string, unknown>;
      expect(d.e).toBe("value");
    });

    it("should handle max depth gracefully", () => {
      // Create object deeper than MAX_DEPTH (20)
      let deep: Record<string, unknown> = { value: "deep" };
      for (let i = 0; i < 25; i++) {
        deep = { nested: deep };
      }

      const result = redactSensitive(deep);
      expect(result).toBeDefined(); // Should not throw
    });
  });

  describe("large inputs", () => {
    it("should reject inputs exceeding size limit", () => {
      // Create a very large object (> REDACT_MAX_INPUT_MB)
      const largeStr = "x".repeat(60 * 1024 * 1024); // 60MB string
      const result = redactSensitive(largeStr);
      expect(result).toBe("[REDACTED: Input too large]");
    });
  });

  describe("edge cases", () => {
    it("should handle empty objects", () => {
      const result = redactSensitive({});
      expect(result).toEqual({});
    });

    it("should handle empty arrays", () => {
      const result = redactSensitive([]);
      expect(result).toEqual([]);
    });

    it("should handle mixed types in objects", () => {
      const input = {
        str: "text",
        num: 42,
        bool: true,
        nil: null,
        undef: undefined,
        arr: [1, 2, 3],
        obj: { nested: "value" },
      };
      const result = redactSensitive(input) as Record<string, unknown>;
      expect(result.str).toBe("text");
      expect(result.num).toBe(42);
      expect(result.bool).toBe(true);
      expect(result.nil).toBe(null);
      expect(result.undef).toBe(undefined);
      expect(result.arr).toEqual([1, 2, 3]);
      expect((result.obj as Record<string, unknown>).nested).toBe("value");
    });

    it("should not mutate original input", () => {
      const input = { key: "sk-ant-api03-secret" };
      const result = redactSensitive(input) as Record<string, unknown>;
      expect(input.key).toBe("sk-ant-api03-secret"); // Original unchanged
      expect(result.key).toBe("[REDACTED]");
    });
  });
});
