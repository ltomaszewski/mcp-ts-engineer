/**
 * Tests for parseJsonSafe utility.
 */

import { describe, it, expect } from "@jest/globals";
import { z } from "zod";
import { parseJsonSafe } from "../parse-json-safe.js";

describe("parseJsonSafe", () => {
  const TestSchema = z.object({
    id: z.string(),
    count: z.number(),
  });

  type TestData = z.infer<typeof TestSchema>;

  const fallback: TestData = { id: "fallback", count: 0 };

  it("parses valid JSON with matching schema", () => {
    const json = '{"id":"test-123","count":42}';
    const result = parseJsonSafe(json, TestSchema, fallback);

    expect(result).toEqual({ id: "test-123", count: 42 });
  });

  it("returns fallback for invalid JSON", () => {
    const json = "not valid json{";
    const result = parseJsonSafe(json, TestSchema, fallback);

    expect(result).toEqual(fallback);
  });

  it("returns fallback when schema validation fails", () => {
    const json = '{"id":"test","count":"not-a-number"}';
    const result = parseJsonSafe(json, TestSchema, fallback);

    expect(result).toEqual(fallback);
  });

  it("returns fallback for missing required fields", () => {
    const json = '{"id":"test"}';
    const result = parseJsonSafe(json, TestSchema, fallback);

    expect(result).toEqual(fallback);
  });

  it("returns fallback for empty string", () => {
    const json = "";
    const result = parseJsonSafe(json, TestSchema, fallback);

    expect(result).toEqual(fallback);
  });

  it("handles nested objects correctly", () => {
    const NestedSchema = z.object({
      user: z.object({
        name: z.string(),
        age: z.number(),
      }),
    });

    const json = '{"user":{"name":"John","age":30}}';
    const nestedFallback = { user: { name: "", age: 0 } };
    const result = parseJsonSafe(json, NestedSchema, nestedFallback);

    expect(result).toEqual({ user: { name: "John", age: 30 } });
  });

  it("handles arrays correctly", () => {
    const ArraySchema = z.array(z.string());
    const json = '["a","b","c"]';
    const arrayFallback: string[] = [];
    const result = parseJsonSafe(json, ArraySchema, arrayFallback);

    expect(result).toEqual(["a", "b", "c"]);
  });

  it("uses z.unknown() for flexible parsing", () => {
    const UnknownSchema = z.unknown();
    const json = '{"anything":"goes"}';
    const result = parseJsonSafe(json, UnknownSchema, {});

    expect(result).toEqual({ anything: "goes" });
  });
});
