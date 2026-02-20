/**
 * Path resolution utilities for log directory configuration.
 * Handles tilde expansion and cross-platform path resolution.
 */

import * as os from 'os';
import * as path from 'path';

/**
 * Resolves a log directory path with tilde expansion and normalization.
 *
 * @param inputPath - Path to resolve (supports tilde, absolute, relative)
 * @returns Absolute path with tilde expanded
 *
 * @example
 * ```ts
 * resolveLogPath('~/logs') // '/Users/username/logs'
 * resolveLogPath('/var/logs') // '/var/logs'
 * resolveLogPath('logs') // '/current/working/directory/logs'
 * ```
 */
export function resolveLogPath(inputPath: string): string {
  let expandedPath = inputPath;

  // Handle tilde expansion
  if (inputPath.startsWith('~/') || inputPath === '~') {
    try {
      const homeDir = os.homedir();
      expandedPath = inputPath === '~'
        ? homeDir
        : path.join(homeDir, inputPath.slice(2));
    } catch (error) {
      // Fallback to current working directory if HOME is not available
      // This can happen in restricted environments (e.g., minimal containers)
      const pathAfterTilde = inputPath === '~' ? '' : inputPath.slice(2);
      expandedPath = pathAfterTilde ? path.join(process.cwd(), pathAfterTilde) : process.cwd();
    }
  }

  // Resolve to absolute path (handles relative paths and normalizes)
  return path.resolve(expandedPath);
}
