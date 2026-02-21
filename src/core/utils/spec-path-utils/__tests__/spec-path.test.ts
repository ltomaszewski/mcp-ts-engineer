/**
 * Unit tests for spec path validation and correction.
 * Tests new patterns for docs/, .claude/, and internal directories.
 */

import { describe, it, expect } from "@jest/globals";
import { classifyPath } from "../spec-path-validation.js";
import { correctPath } from "../spec-path-correction.js";

describe("classifyPath", () => {
  describe("monorepo root paths", () => {
    it("recognizes docs/specs/foo.md as valid", () => {
      expect(classifyPath("docs/specs/foo.md")).toBe("valid");
    });

    it("recognizes .claude/rules/bar.md as valid", () => {
      expect(classifyPath(".claude/rules/bar.md")).toBe("valid");
    });

    it("recognizes apps/my-server/src/main.ts as valid", () => {
      expect(classifyPath("apps/my-server/src/main.ts")).toBe("valid");
    });

    it("recognizes packages/types/src/index.ts as valid", () => {
      expect(classifyPath("packages/types/src/index.ts")).toBe("valid");
    });
  });

  describe("internal directory paths", () => {
    it("recognizes core/errors.ts as correctable", () => {
      expect(classifyPath("core/errors.ts")).toBe("correctable");
    });

    it("recognizes lib/utils/index.ts as correctable", () => {
      expect(classifyPath("lib/utils/index.ts")).toBe("correctable");
    });

    it("recognizes utils/helpers.ts as correctable", () => {
      expect(classifyPath("utils/helpers.ts")).toBe("correctable");
    });

    it("recognizes modules/auth/auth.service.ts as correctable", () => {
      expect(classifyPath("modules/auth/auth.service.ts")).toBe("correctable");
    });

    it("recognizes providers/database.provider.ts as correctable", () => {
      expect(classifyPath("providers/database.provider.ts")).toBe("correctable");
    });

    it("recognizes capabilities/echo-agent/echo.capability.ts as correctable", () => {
      expect(classifyPath("capabilities/echo-agent/echo.capability.ts")).toBe(
        "correctable"
      );
    });

    it("recognizes config/constants.ts as correctable", () => {
      expect(classifyPath("config/constants.ts")).toBe("correctable");
    });

    it("recognizes shared/types/index.ts as correctable", () => {
      expect(classifyPath("shared/types/index.ts")).toBe("correctable");
    });

    it("recognizes hooks/useAuth.ts as correctable", () => {
      expect(classifyPath("hooks/useAuth.ts")).toBe("correctable");
    });

    it("recognizes prompts/system.prompt.ts as correctable", () => {
      expect(classifyPath("prompts/system.prompt.ts")).toBe("correctable");
    });
  });

  describe("existing correctable patterns", () => {
    it("recognizes src/components/Button.tsx as correctable", () => {
      expect(classifyPath("src/components/Button.tsx")).toBe("correctable");
    });

    it("recognizes ./hooks/useAuth.ts as correctable", () => {
      expect(classifyPath("./hooks/useAuth.ts")).toBe("correctable");
    });
  });

  describe("uncorrectable patterns", () => {
    it("recognizes absolute path as uncorrectable", () => {
      expect(classifyPath("/Users/dev/project/file.ts")).toBe("uncorrectable");
    });

    it("recognizes parent directory reference as uncorrectable", () => {
      expect(classifyPath("../sibling/file.ts")).toBe("uncorrectable");
    });
  });
});

describe("correctPath", () => {
  const target = "mcp-ts-engineer";

  describe("internal directory corrections", () => {
    it("transforms core/foo.ts to apps/mcp-ts-engineer/src/core/foo.ts", () => {
      expect(correctPath("core/foo.ts", target)).toBe(
        "apps/mcp-ts-engineer/src/core/foo.ts"
      );
    });

    it("transforms lib/bar.ts to apps/mcp-ts-engineer/src/lib/bar.ts", () => {
      expect(correctPath("lib/bar.ts", target)).toBe(
        "apps/mcp-ts-engineer/src/lib/bar.ts"
      );
    });

    it("transforms utils/helper.ts to apps/mcp-ts-engineer/src/utils/helper.ts", () => {
      expect(correctPath("utils/helper.ts", target)).toBe(
        "apps/mcp-ts-engineer/src/utils/helper.ts"
      );
    });

    it("transforms modules/auth/auth.ts to apps/mcp-ts-engineer/src/modules/auth/auth.ts", () => {
      expect(correctPath("modules/auth/auth.ts", target)).toBe(
        "apps/mcp-ts-engineer/src/modules/auth/auth.ts"
      );
    });

    it("transforms capabilities/index.ts to apps/mcp-ts-engineer/src/capabilities/index.ts", () => {
      expect(correctPath("capabilities/index.ts", target)).toBe(
        "apps/mcp-ts-engineer/src/capabilities/index.ts"
      );
    });
  });

  describe("existing correction patterns", () => {
    it("transforms src/foo.ts to apps/mcp-ts-engineer/src/foo.ts", () => {
      expect(correctPath("src/foo.ts", target)).toBe(
        "apps/mcp-ts-engineer/src/foo.ts"
      );
    });

    it("transforms ./foo.ts to apps/mcp-ts-engineer/foo.ts", () => {
      expect(correctPath("./foo.ts", target)).toBe(
        "apps/mcp-ts-engineer/foo.ts"
      );
    });
  });

  describe("no correction needed", () => {
    it("leaves valid monorepo paths unchanged", () => {
      expect(correctPath("apps/my-server/src/main.ts", target)).toBe(
        "apps/my-server/src/main.ts"
      );
    });

    it("leaves docs/ paths unchanged", () => {
      expect(correctPath("docs/specs/foo.md", target)).toBe(
        "docs/specs/foo.md"
      );
    });

    it("leaves .claude/ paths unchanged", () => {
      expect(correctPath(".claude/rules/bar.md", target)).toBe(
        ".claude/rules/bar.md"
      );
    });
  });
});
