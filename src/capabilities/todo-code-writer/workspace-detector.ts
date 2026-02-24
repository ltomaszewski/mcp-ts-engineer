/**
 * Workspace technology detection from package.json.
 * Re-exports shared utilities from src/shared/workspace-detector.ts
 *
 * This file exists for backward compatibility. Original implementation
 * moved to shared location for reuse across capabilities.
 */

export {
  detectWorkspace,
  detectWorkspaceTechnologies,
  type TechnologyTag,
  type WorkspaceDetectionResult,
} from '../../shared/workspace-detector.js'
