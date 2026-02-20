/**
 * Workspace technology detection from package.json.
 * Reads the target workspace's package.json and maps dependencies
 * to technology tags used for conditional prompt assembly.
 *
 * Originally from: src/capabilities/todo-code-writer/workspace-detector.ts
 */

import { readFileSync } from "fs";
import { join } from "path";

/** Technology tags recognized by the prompt system. */
export type TechnologyTag =
  | "react-native"
  | "react"
  | "nestjs"
  | "expo"
  | "tanstack-query"
  | "zustand";

/** Mapping from dependency name to technology tag. */
const DEPENDENCY_TECHNOLOGY_MAP: Record<string, TechnologyTag> = {
  "react-native": "react-native",
  react: "react",
  "@nestjs/core": "nestjs",
  expo: "expo",
  "@tanstack/react-query": "tanstack-query",
  zustand: "zustand",
};

/** Result of workspace detection. */
export interface WorkspaceDetectionResult {
  /** High-level technology tags (e.g., "react-native", "nestjs"). */
  technologies: string[];
  /** Raw dependency names found in package.json (both deps and devDeps). */
  dependencies: string[];
}

/**
 * Detects the workspace technology stack by reading its package.json.
 *
 * @param cwd - Path to the workspace root (where package.json lives)
 * @returns Detection result with technologies and raw dependencies; empty arrays on any error
 */
export function detectWorkspace(cwd: string | undefined): WorkspaceDetectionResult {
  const empty: WorkspaceDetectionResult = { technologies: [], dependencies: [] };

  if (!cwd) {
    return empty;
  }

  let content: string;
  try {
    content = readFileSync(join(cwd, "package.json"), "utf-8");
  } catch {
    return empty;
  }

  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(content) as Record<string, unknown>;
  } catch {
    return empty;
  }

  const deps = parsed.dependencies as Record<string, string> | undefined;
  const devDeps = parsed.devDependencies as Record<string, string> | undefined;

  const allDepNames = [
    ...Object.keys(deps || {}),
    ...Object.keys(devDeps || {}),
  ];
  const uniqueDeps = [...new Set(allDepNames)];

  const technologies = new Set<string>();
  const hasReactNative = uniqueDeps.includes("react-native");

  for (const dep of uniqueDeps) {
    const tech = DEPENDENCY_TECHNOLOGY_MAP[dep];
    if (tech) {
      // If react-native is present, skip the standalone "react" tag
      // (react-native implies react)
      if (tech === "react" && hasReactNative) {
        continue;
      }
      technologies.add(tech);
    }
  }

  return {
    technologies: [...technologies],
    dependencies: uniqueDeps,
  };
}

/**
 * Detects only technology tags (legacy compat).
 * @deprecated Use detectWorkspace() instead for full detection.
 */
export function detectWorkspaceTechnologies(cwd: string | undefined): string[] {
  return detectWorkspace(cwd).technologies;
}
