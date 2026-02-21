/**
 * Tests for spec path utilities.
 */

import { describe, it, expect } from "@jest/globals";
import {
  extractFilePaths,
  validateSpecPaths,
  correctSpecPaths,
} from "../spec-path-utils.js";

describe("extractFilePaths", () => {
  describe("fenced code blocks", () => {
    it("extracts paths from typescript code blocks", () => {
      const content = `
# Implementation

\`\`\`typescript
// apps/my-app/src/components/Button.tsx
export const Button = () => <View />
\`\`\`
      `;

      const paths = extractFilePaths(content);
      expect(paths).toContain("apps/my-app/src/components/Button.tsx");
    });

    it("extracts multiple paths from single code block", () => {
      const content = `
\`\`\`typescript
// apps/my-app/src/hooks/useAuth.ts
// packages/types/src/api/auth.types.ts
\`\`\`
      `;

      const paths = extractFilePaths(content);
      expect(paths).toContain("apps/my-app/src/hooks/useAuth.ts");
      expect(paths).toContain("packages/types/src/api/auth.types.ts");
    });

    it("extracts paths from multiple code blocks", () => {
      const content = `
\`\`\`typescript
// apps/my-server/src/auth.ts
\`\`\`

\`\`\`typescript
// packages/utils/src/format.ts
\`\`\`
      `;

      const paths = extractFilePaths(content);
      expect(paths).toContain("apps/my-server/src/auth.ts");
      expect(paths).toContain("packages/utils/src/format.ts");
    });
  });

  describe("markdown tables", () => {
    it("extracts paths from table path column", () => {
      const content = `
| Path | Action |
|------|--------|
| apps/my-app/src/screens/LoginScreen.tsx | CREATE |
| packages/types/src/models/user.ts | UPDATE |
      `;

      const paths = extractFilePaths(content);
      expect(paths).toContain("apps/my-app/src/screens/LoginScreen.tsx");
      expect(paths).toContain("packages/types/src/models/user.ts");
    });

    it("handles table with different column order", () => {
      const content = `
| Action | Path | Purpose |
|--------|------|---------|
| CREATE | apps/my-server/src/modules/auth/auth.service.ts | Auth service |
      `;

      const paths = extractFilePaths(content);
      expect(paths).toContain(
        "apps/my-server/src/modules/auth/auth.service.ts"
      );
    });
  });

  describe("inline code", () => {
    it("extracts paths from inline code blocks", () => {
      const content =
        "Update the file `apps/my-app/src/config.ts` to include the new settings.";

      const paths = extractFilePaths(content);
      expect(paths).toContain("apps/my-app/src/config.ts");
    });

    it("extracts multiple inline paths", () => {
      const content =
        "Import from `packages/utils/src/date.ts` and `packages/types/src/index.ts`.";

      const paths = extractFilePaths(content);
      expect(paths).toContain("packages/utils/src/date.ts");
      expect(paths).toContain("packages/types/src/index.ts");
    });
  });

  describe("filtering", () => {
    it("ignores https URLs", () => {
      const content = `
\`\`\`typescript
// https://example.com/docs/api.ts
import { fetch } from 'node-fetch'
\`\`\`
      `;

      const paths = extractFilePaths(content);
      expect(paths).not.toContain("https://example.com/docs/api.ts");
    });

    it("ignores http URLs", () => {
      const content = "See `http://localhost:3000/api/users` for details.";

      const paths = extractFilePaths(content);
      expect(paths).not.toContain("http://localhost:3000/api/users");
    });

    it("ignores npm packages with @ prefix", () => {
      const content = `
\`\`\`typescript
import { Module } from '@nestjs/core'
import { useState } from 'react-native'
\`\`\`
      `;

      const paths = extractFilePaths(content);
      expect(paths).not.toContain("@nestjs/core");
      expect(paths).not.toContain("react-native");
    });

    it("ignores node_modules paths", () => {
      const content =
        "The file is at `node_modules/react/index.js` in the cache.";

      const paths = extractFilePaths(content);
      expect(paths).not.toContain("node_modules/react/index.js");
    });

    it("ignores simple npm package names without paths", () => {
      const content = "`zod` and `react-query` are used for validation.";

      const paths = extractFilePaths(content);
      expect(paths).not.toContain("zod");
      expect(paths).not.toContain("react-query");
    });
  });

  describe("edge cases", () => {
    it("returns empty array for content with no paths", () => {
      const content = "This is just a description with no file paths.";

      const paths = extractFilePaths(content);
      expect(paths).toEqual([]);
    });

    it("deduplicates repeated paths", () => {
      const content = `
- \`apps/my-app/src/config.ts\`
- \`apps/my-app/src/config.ts\`
      `;

      const paths = extractFilePaths(content);
      expect(
        paths.filter((p: string) => p === "apps/my-app/src/config.ts")
      ).toHaveLength(1);
    });
  });

  describe("false positive filtering", () => {
    describe("code patterns", () => {
      it("ignores this. prefixed patterns", () => {
        const content = "`this.agendaService.define()`";
        const paths = extractFilePaths(content);
        expect(paths).not.toContain("this.agendaService.define");
        expect(paths).toEqual([]);
      });

      it("ignores method calls like router.push", () => {
        const content = "`router.push` and `router.replace`";
        const paths = extractFilePaths(content);
        expect(paths).toEqual([]);
      });

      it("ignores property access patterns", () => {
        const content = "`selectedKidDetails.name` and `User.pushTokens`";
        const paths = extractFilePaths(content);
        expect(paths).toEqual([]);
      });
    });

    describe("abbreviations", () => {
      it("ignores e.g. abbreviation", () => {
        const content = "(e.g. this example)";
        const paths = extractFilePaths(content);
        expect(paths).toEqual([]);
      });

      it("ignores i.e. abbreviation", () => {
        const content = "(i.e. that is)";
        const paths = extractFilePaths(content);
        expect(paths).toEqual([]);
      });

      it("ignores etc. abbreviation", () => {
        const content = "files, folders, etc.";
        const paths = extractFilePaths(content);
        expect(paths).toEqual([]);
      });
    });

    describe("extension whitelist", () => {
      it("extracts paths with valid extensions", () => {
        const content =
          "`apps/my-app/src/file.ts` and `packages/types/index.json`";
        const paths = extractFilePaths(content);
        expect(paths).toContain("apps/my-app/src/file.ts");
        expect(paths).toContain("packages/types/index.json");
      });

      it("ignores paths with invalid extensions like .push", () => {
        const content = "`router.push`";
        const paths = extractFilePaths(content);
        expect(paths).toEqual([]);
      });

      it("ignores paths with invalid extensions like .name", () => {
        const content = "`user.name`";
        const paths = extractFilePaths(content);
        expect(paths).toEqual([]);
      });
    });

    describe("bare filenames", () => {
      it("ignores bare filenames without path prefix", () => {
        const content = "`app.store.ts` and `_layout.tsx`";
        const paths = extractFilePaths(content);
        expect(paths).toEqual([]);
      });

      it("extracts filenames with path prefix", () => {
        const content = "`apps/my-app/src/stores/app.store.ts`";
        const paths = extractFilePaths(content);
        expect(paths).toContain("apps/my-app/src/stores/app.store.ts");
      });
    });

    describe("fenced code block isolation", () => {
      it("does not extract code block content as inline code", () => {
        // Regression test: INLINE_CODE regex /`([^`]+)`/g incorrectly matched
        // content inside fenced code blocks because ``` contains single backticks
        const content = `
Update \`foo.ts\` to include:

\`\`\`typescript
import { bar } from '../bar.js';
\`\`\`
        `;

        const paths = extractFilePaths(content);
        // Should only find inline code path, not code block content
        expect(paths).not.toContain("bar.js");
        expect(paths).not.toContain("../bar.js");
      });

      it("extracts inline paths but not TypeScript imports from code blocks", () => {
        const content = `
Modify \`apps/my-app/src/config.ts\`:

\`\`\`typescript
import { User } from '@app/types';
import { format } from './utils/date.ts';
export const config = { apiUrl: 'https://api.example.com/v1/users' };
\`\`\`

Also update \`packages/types/src/index.ts\`.
        `;

        const paths = extractFilePaths(content);
        // Should extract inline code paths
        expect(paths).toContain("apps/my-app/src/config.ts");
        expect(paths).toContain("packages/types/src/index.ts");
        // Should NOT extract import paths from code block (they're not in comments)
        // and should NOT match code block content as inline code
        expect(paths).not.toContain("date.ts");
        expect(paths).not.toContain("./utils/date.ts");
      });
    });
  });
});

describe("validateSpecPaths", () => {
  describe("valid paths", () => {
    it("returns valid for paths starting with apps/", () => {
      const paths = [
        "apps/my-app/src/components/Button.tsx",
        "apps/my-server/src/auth.ts",
      ];

      const result = validateSpecPaths(paths, "my-app");

      expect(result.valid).toContain(
        "apps/my-app/src/components/Button.tsx"
      );
      expect(result.valid).toContain("apps/my-server/src/auth.ts");
      expect(result.correctable).toEqual([]);
      expect(result.uncorrectable).toEqual([]);
    });

    it("returns valid for paths starting with packages/", () => {
      const paths = [
        "packages/types/src/models/user.ts",
        "packages/utils/src/format.ts",
      ];

      const result = validateSpecPaths(paths, "my-app");

      expect(result.valid).toContain("packages/types/src/models/user.ts");
      expect(result.valid).toContain("packages/utils/src/format.ts");
      expect(result.correctable).toEqual([]);
      expect(result.uncorrectable).toEqual([]);
    });
  });

  describe("correctable paths", () => {
    it("returns correctable for paths starting with src/", () => {
      const paths = ["src/components/Button.tsx", "src/hooks/useAuth.ts"];

      const result = validateSpecPaths(paths, "my-app");

      expect(result.valid).toEqual([]);
      expect(result.correctable).toContain("src/components/Button.tsx");
      expect(result.correctable).toContain("src/hooks/useAuth.ts");
      expect(result.uncorrectable).toEqual([]);
    });

    it("returns correctable for paths starting with ./", () => {
      const paths = ["./config.ts", "./utils/helper.ts"];

      const result = validateSpecPaths(paths, "my-server");

      expect(result.valid).toEqual([]);
      expect(result.correctable).toContain("./config.ts");
      expect(result.correctable).toContain("./utils/helper.ts");
      expect(result.uncorrectable).toEqual([]);
    });
  });

  describe("uncorrectable paths", () => {
    it("returns uncorrectable for absolute paths", () => {
      const paths = [
        "/Users/dev/project/src/file.ts",
        "/home/user/app/config.ts",
      ];

      const result = validateSpecPaths(paths, "my-app");

      expect(result.valid).toEqual([]);
      expect(result.correctable).toEqual([]);
      expect(result.uncorrectable).toContain("/Users/dev/project/src/file.ts");
      expect(result.uncorrectable).toContain("/home/user/app/config.ts");
    });

    it("returns uncorrectable for parent directory references", () => {
      const paths = ["../sibling/file.ts", "../../parent/config.ts"];

      const result = validateSpecPaths(paths, "my-app");

      expect(result.valid).toEqual([]);
      expect(result.correctable).toEqual([]);
      expect(result.uncorrectable).toContain("../sibling/file.ts");
      expect(result.uncorrectable).toContain("../../parent/config.ts");
    });
  });

  describe("mixed validation results", () => {
    it("correctly categorizes mixed path types", () => {
      const paths = [
        "apps/my-app/src/valid.ts",
        "src/correctable.ts",
        "/Users/dev/uncorrectable.ts",
      ];

      const result = validateSpecPaths(paths, "my-app");

      expect(result.valid).toContain("apps/my-app/src/valid.ts");
      expect(result.correctable).toContain("src/correctable.ts");
      expect(result.uncorrectable).toContain("/Users/dev/uncorrectable.ts");
    });
  });
});

describe("correctSpecPaths", () => {
  describe("correcting src/ paths", () => {
    it("corrects src/foo.ts to apps/{target}/src/foo.ts", () => {
      const content = `
\`\`\`typescript
// src/components/Button.tsx
export const Button = () => <View />
\`\`\`
      `;

      const result = correctSpecPaths(content, "my-app");

      expect(result.correctedContent).toContain(
        "apps/my-app/src/components/Button.tsx"
      );
      expect(result.corrections).toContainEqual({
        original: "src/components/Button.tsx",
        corrected: "apps/my-app/src/components/Button.tsx",
      });
      expect(result.uncorrectable).toEqual([]);
    });

    it("corrects multiple src/ paths", () => {
      const content = `
| Path | Action |
|------|--------|
| src/auth.ts | CREATE |
| src/user.ts | UPDATE |
      `;

      const result = correctSpecPaths(content, "my-server");

      expect(result.correctedContent).toContain(
        "apps/my-server/src/auth.ts"
      );
      expect(result.correctedContent).toContain(
        "apps/my-server/src/user.ts"
      );
      expect(result.corrections).toHaveLength(2);
    });
  });

  describe("correcting ./ paths", () => {
    it("corrects ./foo.ts to apps/{target}/foo.ts", () => {
      const content = "Update `./config.ts` and `./utils/helper.ts`.";

      const result = correctSpecPaths(content, "my-app");

      expect(result.correctedContent).toContain("apps/my-app/config.ts");
      expect(result.correctedContent).toContain(
        "apps/my-app/utils/helper.ts"
      );
      expect(result.corrections).toContainEqual({
        original: "./config.ts",
        corrected: "apps/my-app/config.ts",
      });
    });
  });

  describe("preserving valid paths", () => {
    it("preserves apps/ paths unchanged", () => {
      const content = `
\`\`\`typescript
// apps/my-app/src/components/Button.tsx
\`\`\`
      `;

      const result = correctSpecPaths(content, "my-app");

      expect(result.correctedContent).toContain(
        "apps/my-app/src/components/Button.tsx"
      );
      expect(result.corrections).toEqual([]);
      expect(result.uncorrectable).toEqual([]);
    });

    it("preserves packages/ paths unchanged", () => {
      const content = "Import from `packages/types/src/index.ts`.";

      const result = correctSpecPaths(content, "my-app");

      expect(result.correctedContent).toContain("packages/types/src/index.ts");
      expect(result.corrections).toEqual([]);
      expect(result.uncorrectable).toEqual([]);
    });
  });

  describe("handling uncorrectable paths", () => {
    it("returns uncorrectable absolute paths without modifying content", () => {
      const content = "See `/Users/dev/project/src/file.ts` for details.";

      const result = correctSpecPaths(content, "my-app");

      expect(result.correctedContent).toBe(content);
      expect(result.corrections).toEqual([]);
      expect(result.uncorrectable).toContain("/Users/dev/project/src/file.ts");
    });

    it("returns uncorrectable parent directory references", () => {
      const content = "Import from `../sibling/file.ts`.";

      const result = correctSpecPaths(content, "my-app");

      expect(result.correctedContent).toBe(content);
      expect(result.corrections).toEqual([]);
      expect(result.uncorrectable).toContain("../sibling/file.ts");
    });
  });

  describe("mixed corrections", () => {
    it("corrects correctable paths and reports uncorrectable ones", () => {
      const content = `
Files to update:
- \`src/valid.ts\`
- \`apps/my-app/src/already-valid.ts\`
- \`/Users/dev/uncorrectable.ts\`
      `;

      const result = correctSpecPaths(content, "my-app");

      expect(result.correctedContent).toContain(
        "apps/my-app/src/valid.ts"
      );
      expect(result.correctedContent).toContain(
        "apps/my-app/src/already-valid.ts"
      );
      expect(result.corrections).toHaveLength(1);
      expect(result.uncorrectable).toContain("/Users/dev/uncorrectable.ts");
    });
  });

  describe("edge cases", () => {
    it("handles content with no file paths", () => {
      const content = "This is just a description with no file paths.";

      const result = correctSpecPaths(content, "my-app");

      expect(result.correctedContent).toBe(content);
      expect(result.corrections).toEqual([]);
      expect(result.uncorrectable).toEqual([]);
    });

    it("handles empty content", () => {
      const content = "";

      const result = correctSpecPaths(content, "my-app");

      expect(result.correctedContent).toBe("");
      expect(result.corrections).toEqual([]);
      expect(result.uncorrectable).toEqual([]);
    });
  });
});
