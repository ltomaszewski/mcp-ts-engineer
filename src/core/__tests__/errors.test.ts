/**
 * Tests for framework error classes.
 */

import {
  AIProviderError,
  CapabilityError,
  ConfigError,
  CostError,
  DiskWriteError,
  FrameworkError,
  LoggerError,
  MCPError,
  PromptError,
  ResourceError,
  SandboxError,
  ServerShuttingDownError,
  SessionError,
  SubagentError,
  TimeoutError,
  ToolError,
  ValidationError,
  isFatalError,
} from '../errors.js'

describe('FrameworkError', () => {
  it('should create error with message', () => {
    const error = new FrameworkError('Test error')
    expect(error.message).toBe('Test error')
    expect(error.name).toBe('FrameworkError')
    expect(error).toBeInstanceOf(Error)
  })

  it('should preserve cause chain', () => {
    const cause = new Error('Original cause')
    const error = new FrameworkError('Wrapped error', { cause })
    expect(error.cause).toBe(cause)
  })
})

describe('AIProviderError', () => {
  it('should create error with correct name', () => {
    const error = new AIProviderError('AI provider failed')
    expect(error.message).toBe('AI provider failed')
    expect(error.name).toBe('AIProviderError')
    expect(error).toBeInstanceOf(FrameworkError)
  })

  it('should preserve cause chain', () => {
    const cause = new Error('Network timeout')
    const error = new AIProviderError('Query failed', { cause })
    expect(error.cause).toBe(cause)
  })
})

describe('SessionError', () => {
  it('should create error with correct name', () => {
    const error = new SessionError('Session not found')
    expect(error.message).toBe('Session not found')
    expect(error.name).toBe('SessionError')
    expect(error).toBeInstanceOf(FrameworkError)
  })
})

describe('LoggerError', () => {
  it('should create error with correct name', () => {
    const error = new LoggerError('Logger write failed')
    expect(error.message).toBe('Logger write failed')
    expect(error.name).toBe('LoggerError')
    expect(error).toBeInstanceOf(FrameworkError)
  })
})

describe('DiskWriteError', () => {
  it('should create error with correct name', () => {
    const error = new DiskWriteError('Disk write failed')
    expect(error.message).toBe('Disk write failed')
    expect(error.name).toBe('DiskWriteError')
    expect(error).toBeInstanceOf(FrameworkError)
  })
})

describe('ConfigError', () => {
  it('should create error with correct name', () => {
    const error = new ConfigError('Invalid configuration')
    expect(error.message).toBe('Invalid configuration')
    expect(error.name).toBe('ConfigError')
    expect(error).toBeInstanceOf(FrameworkError)
  })
})

describe('ToolError', () => {
  it('should create error with correct name', () => {
    const error = new ToolError('Tool execution failed')
    expect(error.message).toBe('Tool execution failed')
    expect(error.name).toBe('ToolError')
    expect(error).toBeInstanceOf(FrameworkError)
  })
})

describe('ResourceError', () => {
  it('should create error with correct name', () => {
    const error = new ResourceError('Resource not found')
    expect(error.message).toBe('Resource not found')
    expect(error.name).toBe('ResourceError')
    expect(error).toBeInstanceOf(FrameworkError)
  })
})

describe('PromptError', () => {
  it('should create error with correct name', () => {
    const error = new PromptError('Prompt rendering failed')
    expect(error.message).toBe('Prompt rendering failed')
    expect(error.name).toBe('PromptError')
    expect(error).toBeInstanceOf(FrameworkError)
  })
})

describe('CapabilityError', () => {
  it('should create error with correct name', () => {
    const error = new CapabilityError('Capability not registered')
    expect(error.message).toBe('Capability not registered')
    expect(error.name).toBe('CapabilityError')
    expect(error).toBeInstanceOf(FrameworkError)
  })
})

describe('ValidationError', () => {
  it('should create error with correct name', () => {
    const error = new ValidationError('Input validation failed')
    expect(error.message).toBe('Input validation failed')
    expect(error.name).toBe('ValidationError')
    expect(error).toBeInstanceOf(FrameworkError)
  })
})

describe('CostError', () => {
  it('should create error with correct name', () => {
    const error = new CostError('Cost calculation failed')
    expect(error.message).toBe('Cost calculation failed')
    expect(error.name).toBe('CostError')
    expect(error).toBeInstanceOf(FrameworkError)
  })
})

describe('TimeoutError', () => {
  it('should create error with correct name', () => {
    const error = new TimeoutError('Operation timed out')
    expect(error.message).toBe('Operation timed out')
    expect(error.name).toBe('TimeoutError')
    expect(error).toBeInstanceOf(FrameworkError)
  })
})

describe('SandboxError', () => {
  it('should create error with correct name', () => {
    const error = new SandboxError('Sandbox violation')
    expect(error.message).toBe('Sandbox violation')
    expect(error.name).toBe('SandboxError')
    expect(error).toBeInstanceOf(FrameworkError)
  })
})

describe('MCPError', () => {
  it('should create error with correct name', () => {
    const error = new MCPError('MCP connection failed')
    expect(error.message).toBe('MCP connection failed')
    expect(error.name).toBe('MCPError')
    expect(error).toBeInstanceOf(FrameworkError)
  })
})

describe('SubagentError', () => {
  it('should create error with correct name', () => {
    const error = new SubagentError('Subagent execution failed')
    expect(error.message).toBe('Subagent execution failed')
    expect(error.name).toBe('SubagentError')
    expect(error).toBeInstanceOf(FrameworkError)
  })
})

describe('isFatalError', () => {
  describe('returns true for fatal errors', () => {
    it('ServerShuttingDownError (instanceof)', () => {
      expect(isFatalError(new ServerShuttingDownError('shutting down'))).toBe(true)
    })

    it('error message containing "aborted by user"', () => {
      expect(isFatalError(new Error('Claude Code process aborted by user'))).toBe(true)
    })

    it('error message containing "process exited"', () => {
      expect(isFatalError(new Error('process exited unexpectedly'))).toBe(true)
    })

    it('error message containing "shutting down"', () => {
      expect(isFatalError(new Error('Server is shutting down'))).toBe(true)
    })

    it('CapabilityError wrapping fatal message (MCP serialization boundary)', () => {
      const wrapped = new CapabilityError(
        'Child capability lint_fix_step failed: Claude Code process aborted by user',
      )
      expect(isFatalError(wrapped)).toBe(true)
    })

    it('nested cause chain with fatal error at depth 2', () => {
      const root = new ServerShuttingDownError('shutting down')
      const mid = new AIProviderError('query failed', { cause: root })
      const outer = new CapabilityError('child failed', { cause: mid })
      expect(isFatalError(outer)).toBe(true)
    })

    it('case-insensitive matching', () => {
      expect(isFatalError(new Error('ABORTED BY USER'))).toBe(true)
      expect(isFatalError(new Error('Process Exited'))).toBe(true)
    })
  })

  describe('returns false for transient/non-fatal errors', () => {
    it('generic Error', () => {
      expect(isFatalError(new Error('network timeout'))).toBe(false)
    })

    it('FrameworkError without fatal message', () => {
      expect(isFatalError(new FrameworkError('something broke'))).toBe(false)
    })

    it('null', () => {
      expect(isFatalError(null)).toBe(false)
    })

    it('undefined', () => {
      expect(isFatalError(undefined)).toBe(false)
    })

    it('string (non-fatal)', () => {
      expect(isFatalError('random error string')).toBe(false)
    })

    it('ETIMEDOUT (transient network error)', () => {
      expect(isFatalError(new Error('ETIMEDOUT'))).toBe(false)
    })

    it('CapabilityError with non-fatal message', () => {
      expect(isFatalError(new CapabilityError('Child capability failed: lint errors'))).toBe(false)
    })
  })
})
