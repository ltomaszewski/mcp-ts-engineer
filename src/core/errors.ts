/**
 * Framework error classes.
 * All errors extend FrameworkError base class and preserve cause chain.
 */

/** Base error class for all framework errors */
export class FrameworkError extends Error {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options)
    this.name = 'FrameworkError'
  }
}

/** AI provider initialization or query failed */
export class AIProviderError extends FrameworkError {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options)
    this.name = 'AIProviderError'
  }
}

/** Session not found or invalid session operation */
export class SessionError extends FrameworkError {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options)
    this.name = 'SessionError'
  }
}

/** Logger initialization or write failed */
export class LoggerError extends FrameworkError {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options)
    this.name = 'LoggerError'
  }
}

/** Disk write operation failed */
export class DiskWriteError extends FrameworkError {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options)
    this.name = 'DiskWriteError'
  }
}

/** Configuration validation failed */
export class ConfigError extends FrameworkError {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options)
    this.name = 'ConfigError'
  }
}

/** Tool execution failed */
export class ToolError extends FrameworkError {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options)
    this.name = 'ToolError'
  }
}

/** Resource retrieval failed */
export class ResourceError extends FrameworkError {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options)
    this.name = 'ResourceError'
  }
}

/** Prompt rendering or retrieval failed */
export class PromptError extends FrameworkError {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options)
    this.name = 'PromptError'
  }
}

/** Prompt version not found */
export class PromptVersionNotFoundError extends PromptError {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options)
    this.name = 'PromptVersionNotFoundError'
  }
}

/** Prompt version is past sunset date */
export class PromptSunsetError extends PromptError {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options)
    this.name = 'PromptSunsetError'
  }
}

/** Capability registration or lookup failed */
export class CapabilityError extends FrameworkError {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options)
    this.name = 'CapabilityError'
  }
}

/** Input validation failed */
export class ValidationError extends FrameworkError {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options)
    this.name = 'ValidationError'
  }
}

/** Cost calculation or tracking failed */
export class CostError extends FrameworkError {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options)
    this.name = 'CostError'
  }
}

/** Timeout exceeded */
export class TimeoutError extends FrameworkError {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options)
    this.name = 'TimeoutError'
  }
}

/** Sandbox violation or execution restricted */
export class SandboxError extends FrameworkError {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options)
    this.name = 'SandboxError'
  }
}

/** MCP server connection or communication failed */
export class MCPError extends FrameworkError {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options)
    this.name = 'MCPError'
  }
}

/** Subagent orchestration failed */
export class SubagentError extends FrameworkError {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options)
    this.name = 'SubagentError'
  }
}

/** Server is shutting down, cannot accept new requests */
export class ServerShuttingDownError extends FrameworkError {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options)
    this.name = 'ServerShuttingDownError'
  }

  /**
   * Convert to MCP error response.
   * @returns MCP-compatible error response
   */
  static toMcpResponse(): { content: Array<{ type: 'text'; text: string }>; isError: true } {
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            error: 'ServerShuttingDown',
            message: 'Server is shutting down, cannot accept new capability invocations',
            session_id: null,
          }),
        },
      ],
      isError: true,
    }
  }
}
