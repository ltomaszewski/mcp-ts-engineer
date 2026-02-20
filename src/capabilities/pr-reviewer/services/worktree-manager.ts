/**
 * Worktree manager service - creates and cleans up git worktrees for PR review.
 */

import { exec } from "child_process";
import { promisify } from "util";
import type { Logger } from "../../../core/logger/index.js";

const execAsync = promisify(exec);

export interface WorktreeInfo {
  path: string;
  branch: string;
  created: boolean;
}

export class WorktreeManager {
  private cwd: string;
  private logger?: Logger;

  constructor(cwd: string, logger?: Logger) {
    this.cwd = cwd;
    this.logger = logger;
  }

  /**
   * Create a worktree for PR review.
   * Reuses existing worktree if found.
   *
   * @param prNumber - PR number
   * @param branch - PR branch name
   * @returns Worktree information
   */
  async createWorktree(
    prNumber: number,
    branch: string
  ): Promise<WorktreeInfo> {
    const timestamp = Date.now();
    const worktreePath = `.worktrees/pr-${prNumber}-review-${timestamp}`;

    try {
      // Check if worktree already exists for this PR
      const { stdout } = await execAsync("git worktree list", {
        cwd: this.cwd,
      });

      const existingMatch = stdout.match(new RegExp(`\\.worktrees/pr-${prNumber}-review-\\d+`));
      if (existingMatch) {
        return {
          path: existingMatch[0],
          branch,
          created: false,
        };
      }

      // Create new worktree
      await execAsync(`git worktree add ${worktreePath} ${branch}`, {
        cwd: this.cwd,
      });

      return {
        path: worktreePath,
        branch,
        created: true,
      };
    } catch (error) {
      throw new Error(`Failed to create worktree: ${error}`);
    }
  }

  /**
   * Remove worktree.
   *
   * @param worktreePath - Path to worktree
   */
  async removeWorktree(worktreePath: string): Promise<void> {
    try {
      await execAsync(`git worktree remove ${worktreePath} --force`, {
        cwd: this.cwd,
      });
    } catch (error) {
      // Non-critical - log but don't throw
      if (this.logger) {
        this.logger.error(`Failed to remove worktree: ${error}`, { worktreePath });
      }
    }
  }

  /**
   * Cleanup all stale worktrees (older than 24 hours).
   */
  async cleanupStale(): Promise<void> {
    try {
      const { stdout } = await execAsync("git worktree list", {
        cwd: this.cwd,
      });

      const worktrees = stdout
        .split("\n")
        .filter((line) => line.includes(".worktrees/pr-"));

      for (const line of worktrees) {
        const match = line.match(/\.worktrees\/pr-\d+-review-(\d+)/);
        if (match) {
          const timestamp = parseInt(match[1], 10);
          const age = Date.now() - timestamp;
          const twentyFourHours = 24 * 60 * 60 * 1000;

          if (age > twentyFourHours) {
            const worktreePath = match[0];
            await this.removeWorktree(worktreePath);
          }
        }
      }
    } catch (error) {
      // Non-critical
      if (this.logger) {
        this.logger.error(`Failed to cleanup stale worktrees: ${error}`);
      }
    }
  }
}
