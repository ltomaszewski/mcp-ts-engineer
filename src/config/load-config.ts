/**
 * Auto-detect paths and load optional ts-engineer.config.json from monorepo root.
 *
 * Resolution order:
 * 1. Auto-detect submodulePath from this package's location
 * 2. Auto-detect monorepoRoot by walking up to find root package.json with workspaces
 * 3. Look for ts-engineer.config.json at monorepoRoot
 * 4. Merge config file values over defaults
 * 5. Resolve relative codemap paths to absolute
 */

import { existsSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import type { ProjectConfig, CodemapEntry } from "./project-config.js";
import { deriveLogDir } from "./project-config.js";

const CONFIG_FILENAME = "ts-engineer.config.json";

/**
 * Walk up from startDir to find the monorepo root.
 * Detected by a package.json containing a "workspaces" field,
 * or by a .git directory as fallback.
 */
function findMonorepoRoot(startDir: string): string {
  let dir = startDir;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const pkgPath = path.join(dir, "package.json");
    if (existsSync(pkgPath)) {
      try {
        const pkg = JSON.parse(readFileSync(pkgPath, "utf-8"));
        if (pkg.workspaces) return dir;
      } catch { /* ignore parse errors */ }
    }
    // Fallback: .git directory (not file — submodules use a .git file)
    const gitPath = path.join(dir, ".git");
    if (existsSync(gitPath) && statSync(gitPath).isDirectory()) return dir;

    const parent = path.dirname(dir);
    if (parent === dir) break; // reached filesystem root
    dir = parent;
  }
  return startDir; // fallback: use startDir itself
}

/**
 * Load and merge config from ts-engineer.config.json.
 *
 * Auto-detects submodulePath and monorepoRoot. Then looks for
 * CONFIG_FILENAME at the monorepo root and merges any values found.
 *
 * Codemap paths in the config file can be relative to monorepoRoot —
 * they'll be resolved to absolute paths automatically.
 */
export function loadProjectConfig(): ProjectConfig {
  // src/config/load-config.ts → packages/mcp-ts-engineer/
  const submodulePath = path.resolve(import.meta.dirname, "../..");
  const monorepoRoot = findMonorepoRoot(submodulePath);

  const defaultServerName = "McpTsEngineer";
  const defaults: ProjectConfig = {
    serverName: defaultServerName,
    serverVersion: "1.0.0",
    logDir: deriveLogDir(defaultServerName),
    commitTag: "[ts-engineer]",
    monorepoRoot,
    submodulePath,
    codemaps: [],
    reviewChecklist: [],
  };

  // Look for config file
  const configPath = path.join(monorepoRoot, CONFIG_FILENAME);
  if (!existsSync(configPath)) return defaults;

  try {
    const raw = JSON.parse(readFileSync(configPath, "utf-8")) as Partial<ProjectConfig>;

    // Auto-derive logDir from serverName when config has serverName but no logDir.
    // This ensures each project gets isolated logs even without explicit logDir.
    const effectiveLogDir = raw.logDir
      ?? (raw.serverName ? deriveLogDir(raw.serverName) : defaults.logDir);

    // Merge — config file values override defaults
    const merged: ProjectConfig = {
      ...defaults,
      ...raw,
      logDir: effectiveLogDir,
      // Always use auto-detected paths (config file can't override these)
      monorepoRoot,
      submodulePath,
    };

    // Resolve relative codemap paths to absolute
    if (merged.codemaps.length > 0) {
      merged.codemaps = merged.codemaps.map((entry: CodemapEntry) => ({
        area: entry.area,
        path: path.isAbsolute(entry.path)
          ? entry.path
          : path.resolve(monorepoRoot, entry.path),
      }));
    }

    return merged;
  } catch {
    // Config file exists but is malformed — use defaults
    return defaults;
  }
}
