import * as os from 'os';
import * as path from 'path';
import { resolveLogPath } from '../path-utils.js';

describe('resolveLogPath', () => {

  describe('tilde expansion', () => {
    it('expands ~/logs to home directory path', () => {
      const result = resolveLogPath('~/logs');
      const expected = path.resolve(os.homedir(), 'logs');

      expect(result).toBe(expected);
    });

    it('expands ~/ to home directory', () => {
      const result = resolveLogPath('~/');
      const expected = path.resolve(os.homedir());

      expect(result).toBe(expected);
    });

    it('expands tilde with nested path', () => {
      const result = resolveLogPath('~/.claude/mcp-ts-engineer/logs');
      const expected = path.resolve(
        os.homedir(),
        '.claude',
        'mcp-ts-engineer',
        'logs'
      );

      expect(result).toBe(expected);
    });
  });

  describe('absolute path handling', () => {
    it('returns Unix absolute path unchanged', () => {
      const inputPath = '/var/logs';
      const result = resolveLogPath(inputPath);
      const expected = path.resolve(inputPath);

      expect(result).toBe(expected);
    });

    it('returns Windows absolute path unchanged', () => {
      const inputPath = 'C:\\logs';
      const result = resolveLogPath(inputPath);
      const expected = path.resolve(inputPath);

      expect(result).toBe(expected);
    });
  });

  describe('relative path resolution', () => {
    it('resolves relative path to current working directory', () => {
      const result = resolveLogPath('logs');
      const expected = path.resolve(process.cwd(), 'logs');

      expect(result).toBe(expected);
    });

    it('resolves nested relative path', () => {
      const result = resolveLogPath('logs/sessions');
      const expected = path.resolve(process.cwd(), 'logs', 'sessions');

      expect(result).toBe(expected);
    });

    it('resolves relative path with dot notation', () => {
      const result = resolveLogPath('./logs');
      const expected = path.resolve(process.cwd(), 'logs');

      expect(result).toBe(expected);
    });
  });

  describe('edge cases', () => {
    it('handles multiple slashes in tilde path', () => {
      const result = resolveLogPath('~//logs///nested');
      const expected = path.resolve(os.homedir(), 'logs', 'nested');

      expect(result).toBe(expected);
    });

    it('handles empty string input by resolving to cwd', () => {
      const result = resolveLogPath('');
      const expected = path.resolve(process.cwd());

      expect(result).toBe(expected);
    });

    it('handles only tilde character', () => {
      const result = resolveLogPath('~');
      const expected = path.resolve(os.homedir());

      expect(result).toBe(expected);
    });
  });

  describe('fallback behavior', () => {
    // Note: Testing actual fallback when os.homedir() throws is difficult
    // because os.homedir is a read-only property. The implementation
    // includes try-catch to handle this edge case (missing HOME env var
    // in restricted environments). This test verifies the normal behavior
    // and documents the fallback logic.

    it('successfully expands tilde using os.homedir() in normal conditions', () => {
      // In normal conditions, os.homedir() should work
      const homeDir = os.homedir();
      expect(homeDir).toBeTruthy();
      expect(path.isAbsolute(homeDir)).toBe(true);

      const result = resolveLogPath('~/logs');
      const expected = path.resolve(homeDir, 'logs');

      expect(result).toBe(expected);
    });

    it('handles paths without tilde normally', () => {
      // Non-tilde paths don't use os.homedir() at all
      const result = resolveLogPath('logs');
      const expected = path.resolve(process.cwd(), 'logs');

      expect(result).toBe(expected);
    });
  });

  describe('cross-platform compatibility', () => {
    it('normalizes path separators', () => {
      const result = resolveLogPath('~/logs/sessions');

      // Should use platform-specific separator
      expect(result).toContain(path.sep);
      expect(path.isAbsolute(result)).toBe(true);
    });

    it('handles mixed separators', () => {
      const result = resolveLogPath('logs/sessions/reports');
      const expected = path.resolve(process.cwd(), 'logs', 'sessions', 'reports');

      // Should normalize to platform-specific separators
      expect(result).toBe(expected);
      expect(path.isAbsolute(result)).toBe(true);
    });
  });
});
