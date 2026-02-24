/**
 * Project context loader service.
 * Assembles project-specific context from CLAUDE.md, rules, skill files,
 * and review checklist for injection into review prompts.
 */

import fs from 'node:fs/promises'
import path from 'node:path'
import type { ProjectConfig } from '../../../config/project-config.js'

/** Maximum characters for CLAUDE.md content */
const CLAUDE_MD_MAX_CHARS = 4000
/** Maximum characters per rule file */
const RULE_MAX_CHARS = 1500
/** Maximum characters per skill SKILL.md */
const SKILL_MAX_CHARS = 1500

/** Result returned by loadProjectContext */
export interface ProjectContextResult {
  /** Assembled context string for prompt injection */
  context: string
  /** List of skill names that were loaded */
  skillsLoaded: string[]
  /** List of rule file base names (without .md) that were loaded */
  rulesLoaded: string[]
}

/** Skill detection rule: maps file pattern to skill name */
interface SkillDetectionRule {
  /** Returns true if the file path matches this rule */
  matches: (filePath: string) => boolean
  /** Skill name to load */
  skill: string
}

const SKILL_DETECTION_RULES: SkillDetectionRule[] = [
  {
    matches: (f) =>
      f.endsWith('.module.ts') || f.endsWith('.service.ts') || f.endsWith('.controller.ts'),
    skill: 'nestjs-core',
  },
  {
    matches: (f) => f.endsWith('.guard.ts') || f.includes('/auth/') || f.includes('\\auth\\'),
    skill: 'nestjs-auth',
  },
  {
    matches: (f) =>
      f.endsWith('.schema.ts') ||
      f.includes('/mongoose/') ||
      f.includes('\\mongoose\\') ||
      f.includes('/schemas/') ||
      f.includes('\\schemas\\'),
    skill: 'nestjs-mongoose',
  },
  {
    matches: (f) =>
      f.endsWith('.resolver.ts') || f.includes('/graphql/') || f.includes('\\graphql\\'),
    skill: 'nestjs-graphql',
  },
  {
    matches: (f) =>
      f.endsWith('.tsx') ||
      f.includes('/expo/') ||
      f.includes('\\expo\\') ||
      f.includes('react-native'),
    skill: 'expo-core',
  },
  {
    matches: (f) => f.endsWith('.tsx') || f.includes('react-native'),
    skill: 'react-native-core',
  },
  {
    matches: (f) => f.endsWith('.ts') || f.endsWith('.tsx'),
    skill: 'typescript-clean-code',
  },
]

/**
 * Detect relevant skills from a list of changed file paths.
 *
 * @param filesChanged - List of changed file paths
 * @returns Deduplicated list of skill names
 */
function detectSkills(filesChanged: string[]): string[] {
  const detected = new Set<string>()

  for (const file of filesChanged) {
    for (const rule of SKILL_DETECTION_RULES) {
      if (rule.matches(file)) {
        detected.add(rule.skill)
      }
    }
  }

  return Array.from(detected)
}

/**
 * Safely read a file, returning null if it doesn't exist.
 *
 * @param filePath - Absolute path to the file
 * @returns File content or null
 */
async function readFileSafe(filePath: string): Promise<string | null> {
  try {
    return await fs.readFile(filePath, 'utf-8')
  } catch {
    return null
  }
}

/**
 * Truncate a string to a maximum number of characters, appending a truncation marker.
 *
 * @param content - The content to truncate
 * @param maxChars - Maximum character limit
 * @returns Truncated content
 */
function truncate(content: string, maxChars: number): string {
  if (content.length <= maxChars) {
    return content
  }
  return `${content.slice(0, maxChars)}\n... [truncated]`
}

/**
 * Load all .md files from a directory, returning name → content pairs.
 *
 * @param dir - Directory path
 * @param maxCharsEach - Maximum characters per file
 * @returns Map of base name (without .md) to truncated content
 */
async function loadMarkdownDir(dir: string, maxCharsEach: number): Promise<Map<string, string>> {
  const result = new Map<string, string>()

  try {
    const entries = await fs.readdir(dir)
    const mdFiles = entries.filter((e) => e.endsWith('.md')).sort()

    for (const file of mdFiles) {
      const content = await readFileSafe(path.join(dir, file))
      if (content !== null) {
        const name = path.basename(file, '.md')
        result.set(name, truncate(content, maxCharsEach))
      }
    }
  } catch {
    // Directory doesn't exist or is not readable — return empty
  }

  return result
}

/**
 * Assemble project-specific context from CLAUDE.md, rules, skill files,
 * and review checklist for injection into review prompts.
 *
 * Context budget:
 * - CLAUDE.md: ~4000 chars
 * - Each rule file: ~1500 chars
 * - Each skill SKILL.md: ~1500 chars
 *
 * @param config - Project configuration with monorepoRoot and submodulePath
 * @param filesChanged - Changed file paths used for skill detection
 * @returns Assembled context string and metadata
 */
export async function loadProjectContext(
  config: ProjectConfig,
  filesChanged: string[],
): Promise<ProjectContextResult> {
  const sections: string[] = []
  const skillsLoaded: string[] = []
  const rulesLoaded: string[] = []

  // 1. Load CLAUDE.md from monorepo root
  const claudeMdPath = path.join(config.monorepoRoot, 'CLAUDE.md')
  const claudeMdContent = await readFileSafe(claudeMdPath)
  if (claudeMdContent !== null) {
    sections.push(`### CLAUDE.md\n\n${truncate(claudeMdContent, CLAUDE_MD_MAX_CHARS)}`)
  }

  // 2. Load .claude/rules/*.md from submodule path
  const rulesDir = path.join(config.submodulePath, '.claude', 'rules')
  const rulesMap = await loadMarkdownDir(rulesDir, RULE_MAX_CHARS)

  if (rulesMap.size > 0) {
    const ruleSections: string[] = []
    for (const [name, content] of rulesMap) {
      rulesLoaded.push(name)
      ruleSections.push(`#### ${name}\n\n${content}`)
    }
    sections.push(`### Rules\n\n${ruleSections.join('\n\n')}`)
  }

  // 3. Detect relevant skills and load SKILL.md for each
  const detectedSkills = detectSkills(filesChanged)

  if (detectedSkills.length > 0) {
    const skillSections: string[] = []

    for (const skill of detectedSkills) {
      const skillMdPath = path.join(config.submodulePath, '.claude', 'skills', skill, 'SKILL.md')
      const skillContent = await readFileSafe(skillMdPath)

      if (skillContent !== null) {
        skillsLoaded.push(skill)
        skillSections.push(`#### ${skill}\n\n${truncate(skillContent, SKILL_MAX_CHARS)}`)
      }
    }

    if (skillSections.length > 0) {
      sections.push(`### Skills\n\n${skillSections.join('\n\n')}`)
    }
  }

  // 4. Include reviewChecklist if provided
  const checklist = config.reviewChecklist ?? []
  if (checklist.length > 0) {
    const checklistContent = checklist.map((item) => `- ${item}`).join('\n')
    sections.push(`### Review Checklist\n\n${checklistContent}`)
  }

  const context =
    sections.length > 0 ? `## Project-Specific Rules & Patterns\n\n${sections.join('\n\n')}` : ''

  return { context, skillsLoaded, rulesLoaded }
}
