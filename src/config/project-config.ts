/**
 * Project configuration for making mcp-ts-engineer project-agnostic.
 * Consuming monorepos provide their own ProjectConfig at startup.
 */

/** Codemap reference for quick navigation prompts */
export interface CodemapEntry {
  /** Area label (e.g. "Monorepo", "Server") */
  area: string
  /** Absolute path to codemap markdown file */
  path: string
}

/**
 * Project-specific configuration.
 * All project-specific values are injected here; the framework itself is generic.
 */
export interface ProjectConfig {
  /** MCP server display name (e.g. "MyTsEngineer") */
  serverName: string
  /** MCP server version */
  serverVersion: string
  /** Log directory path (supports ~/). Override via LOG_DIR env var. */
  logDir: string
  /** Git commit tag prefix (e.g. "[ts-engineer]") */
  commitTag: string
  /** Absolute path to the consuming monorepo root */
  monorepoRoot: string
  /** Absolute path to this submodule (where .claude/ lives) */
  submodulePath: string
  /** Codemap entries for agent prompts (absolute paths) */
  codemaps: CodemapEntry[]
  /** Extra review checklist items for the audit/review prompts */
  reviewChecklist?: string[]
  /** GitHub repo owner for PR-related capabilities (e.g. "myorg") */
  repoOwner?: string
  /** GitHub repo name for PR-related capabilities (e.g. "my-mono") */
  repoName?: string
}

/**
 * Derive a log directory path from a server name.
 * Converts PascalCase/camelCase to kebab-case for filesystem-friendly paths.
 *
 * @example
 * "BastionTsEngineer" → "~/.claude/bastion-ts-engineer/logs/"
 * "MellowTsEngineer"  → "~/.claude/mellow-ts-engineer/logs/"
 * "McpTsEngineer"     → "~/.claude/mcp-ts-engineer/logs/"
 */
export function deriveLogDir(serverName: string): string {
  const kebab = serverName
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/([A-Z])([A-Z][a-z])/g, '$1-$2')
    .toLowerCase()
  return `~/.claude/${kebab}/logs/`
}

/**
 * Default configuration — generic, no project-specific values.
 * Consuming apps SHOULD call initProjectConfig() with their own config.
 */
const DEFAULT_CONFIG: ProjectConfig = {
  serverName: 'McpTsEngineer',
  serverVersion: '1.0.0',
  logDir: deriveLogDir('McpTsEngineer'),
  commitTag: '[ts-engineer]',
  monorepoRoot: process.cwd(),
  submodulePath: process.cwd(),
  codemaps: [],
  reviewChecklist: [],
}

let _config: ProjectConfig = { ...DEFAULT_CONFIG }

/**
 * Initialize the project configuration. Call once at startup before createServer().
 */
export function initProjectConfig(config: ProjectConfig): void {
  _config = config
}

/**
 * Get the current project configuration.
 * Returns defaults if initProjectConfig() was never called.
 */
export function getProjectConfig(): ProjectConfig {
  return _config
}
