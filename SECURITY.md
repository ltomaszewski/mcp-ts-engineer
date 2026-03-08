# Security Policy

## Supported Versions

| Version | Supported |
|---------|-----------|
| 1.x     | Yes       |

## Reporting a Vulnerability

If you discover a security vulnerability, please report it responsibly.

**Do not open a public GitHub issue for security vulnerabilities.**

Instead, please email **luki22@gmail.com** with:

1. Description of the vulnerability
2. Steps to reproduce
3. Potential impact
4. Suggested fix (if any)

## Response Timeline

- **Acknowledgment**: Within 48 hours
- **Initial assessment**: Within 1 week
- **Fix or mitigation**: Depending on severity, typically within 2 weeks for critical issues

## Scope

The following are in scope:

- Command injection in shell operations
- Path traversal in file operations
- Secret leakage in logs or outputs
- Authentication/authorization bypass
- Budget enforcement bypass
- Prompt injection affecting agent behavior

The following are out of scope:

- Vulnerabilities in upstream dependencies (report to the respective project)
- Issues requiring physical access to the machine
- Social engineering

## Security Measures

This project implements several security measures:

- **Input validation**: All capability inputs validated via Zod schemas
- **Shell injection prevention**: `execFileSync` with array arguments (no string interpolation)
- **Log redaction**: API keys, tokens, and credentials automatically redacted
- **Budget enforcement**: Query, session, and daily cost limits
- **Recursive call prevention**: Blocked tools list prevents infinite loops
- **File permissions**: Cost reports written with restricted permissions (0o600)

## Disclosure Policy

We follow coordinated disclosure. We ask that you:

1. Allow us reasonable time to fix the issue before public disclosure
2. Make a good faith effort to avoid data destruction or service disruption
3. Do not access or modify other users' data

We will credit reporters in release notes (unless you prefer to remain anonymous).
