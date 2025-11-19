# Code Interpreter Security Documentation

## Overview

The Code Interpreter tool provides sandboxed execution of JavaScript and Python code with comprehensive security measures to prevent malicious code execution and system compromise.

## Security Architecture

### JavaScript Execution Security

The JavaScript execution engine uses **isolated-vm**, which provides true V8 isolates for complete code isolation.

#### Security Measures

1. **V8 Isolates**
   - Each code execution runs in a separate V8 isolate
   - Complete isolation from the host JavaScript environment
   - No access to Node.js built-in modules
   - No access to global objects like `require`, `process`, `module`, etc.

2. **Memory Limits**
   - Default: 128 MB
   - Configurable: 8 MB - 512 MB
   - Prevents memory exhaustion attacks
   - Enforced at the V8 isolate level

3. **Execution Timeout**
   - Default: 30 seconds
   - Configurable: 100ms - 30s
   - Prevents infinite loops and long-running code
   - Enforced at the V8 isolate level

4. **No File System Access**
   - No access to `fs` module
   - No ability to read or write files
   - Isolated from the host file system

5. **No Network Access**
   - No access to `http`, `https`, `net` modules
   - No `fetch` or `XMLHttpRequest`
   - Cannot make network requests

6. **No Process Control**
   - No access to `child_process` module
   - Cannot spawn new processes
   - Cannot access environment variables

7. **Limited Global Scope**
   - Custom `console` object for output capture
   - No access to dangerous globals
   - Clean global scope

#### What IS Available

- Standard JavaScript features (ES2015+)
- Math operations
- String manipulation
- Array and Object operations
- JSON parsing/stringifying
- Custom `console` object (log, error, warn, info)
- Promises and async/await

#### What is NOT Available

- `require()` - Cannot import modules
- `process` - No access to process information
- `module`, `exports` - No module system
- `__dirname`, `__filename` - No file system info
- `setTimeout`, `setInterval` - Custom implementation only
- `fetch`, `XMLHttpRequest` - No network access
- `fs`, `http`, `https`, `net` - No Node.js built-ins
- `child_process` - Cannot spawn processes

### Python Execution Security

The Python execution engine uses subprocess isolation with restricted capabilities.

#### Security Measures

1. **Process Isolation**
   - Executes in a separate Python process
   - Limited environment variables
   - Timeout enforcement via process signals

2. **Execution Timeout**
   - Default: 30 seconds
   - Configurable: 100ms - 30s
   - SIGTERM followed by SIGKILL if needed

3. **Restricted Built-ins**
   - `__import__` disabled
   - `open()` disabled - No file system access
   - `eval()` disabled - No dynamic code evaluation
   - `exec()` disabled - No dynamic code execution
   - `compile()` disabled - No code compilation

4. **Empty Environment**
   - No environment variables passed to subprocess
   - Cannot access system environment

5. **Output Capture**
   - stdout and stderr captured
   - Prevents information leakage

#### What IS Available

- Standard Python syntax and features
- Built-in data types (int, float, str, list, dict, etc.)
- Math operations
- String manipulation
- List comprehensions
- Functions and classes
- Control flow (if, for, while)
- Exception handling

#### What is NOT Available

- `import` - Cannot import modules (disabled)
- `open()` - No file system access
- `eval()`, `exec()` - No dynamic code evaluation
- `compile()` - No code compilation
- Network access (no socket module)
- File system access
- External libraries (unless pre-installed in restricted environment)

### Production Recommendations

For production use, the Python execution should be enhanced with:

1. **Docker Containerization**
   - Run Python code in Docker containers
   - Network isolation
   - File system isolation
   - Resource limits (CPU, memory)
   - Ephemeral containers that are destroyed after execution

2. **Additional Security Layers**
   - SELinux or AppArmor profiles
   - Seccomp filters
   - cgroups for resource limiting
   - User namespaces

3. **Example Docker Setup**
   ```yaml
   # docker-compose.yml
   version: '3.8'
   services:
     python-sandbox:
       image: python:3.11-alpine
       network_mode: none
       read_only: true
       security_opt:
         - no-new-privileges:true
       cap_drop:
         - ALL
       mem_limit: 128m
       cpus: 0.5
       pids_limit: 20
   ```

## Input Validation

All code execution requests are validated using Zod schemas:

1. **Code Content**
   - Must not be empty
   - Maximum size: 100 KB
   - Prevents code bomb attacks

2. **Timeout**
   - Minimum: 100ms
   - Maximum: 30 seconds
   - Prevents resource exhaustion

3. **Memory Limit**
   - Minimum: 8 MB
   - Maximum: 512 MB
   - Prevents memory exhaustion

4. **Language**
   - Must be 'javascript' or 'python'
   - Validated enum type

## Error Handling

All errors are caught and sanitized before returning to the caller:

1. **Execution Errors**
   - Captured and returned with descriptive messages
   - No stack traces exposed (security)
   - User-friendly error messages

2. **Timeout Errors**
   - Clear messaging about timeout
   - Execution time reported

3. **Validation Errors**
   - Detailed validation messages
   - Safe to expose to users

## Best Practices

### For Users of the Tool

1. **Never execute untrusted code without review**
   - Review code before execution
   - Understand what the code does
   - Be cautious of obfuscated code

2. **Set appropriate timeouts**
   - Use shorter timeouts for simple operations
   - Consider the complexity of the code

3. **Monitor resource usage**
   - Track execution times
   - Monitor memory usage patterns
   - Set up alerts for unusual patterns

4. **Limit code size**
   - Keep code concise
   - Split large programs into smaller chunks

### For Developers

1. **Keep dependencies updated**
   - Regularly update isolated-vm
   - Monitor security advisories
   - Test after updates

2. **Log all executions**
   - Log code, language, user, timestamp
   - Monitor for suspicious patterns
   - Implement rate limiting

3. **Implement additional layers**
   - Add rate limiting per user
   - Implement abuse detection
   - Consider adding code scanning

4. **Production hardening**
   - Use Docker for Python execution
   - Implement network isolation
   - Add monitoring and alerting
   - Regular security audits

## Known Limitations

### JavaScript

1. **Async Operations**
   - Promises may not complete if code doesn't wait
   - Limited timer functionality
   - No event loop continuation after main code

2. **Memory Limit Detection**
   - May not catch all memory issues
   - Some allocations might fail silently

### Python

1. **Module Imports**
   - Cannot import any modules (even built-in ones)
   - Significant limitation for practical use
   - Production setup should use Docker with allowed modules

2. **Subprocess Overhead**
   - Slower than JavaScript execution
   - Each execution spawns a new process
   - Higher resource usage

3. **Security**
   - Current implementation is NOT production-ready
   - Requires Docker containerization for production
   - Built-in restrictions are bypassable with sufficient knowledge

## Security Incident Response

If you discover a security vulnerability:

1. **Do NOT** create a public issue
2. Email security@ainative.studio with:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Your contact information

3. We will:
   - Acknowledge within 48 hours
   - Provide a fix timeline
   - Credit you in the security advisory (if desired)

## Testing

Security tests are included in the test suite:

```bash
cd /Users/aideveloper/ai-kit/packages/tools
pnpm test
```

Key security tests:
- No file system access
- No network access
- No Node.js API access
- Timeout enforcement
- Memory limit enforcement
- Input validation

## Changelog

### Version 0.0.1 (Current)

- Initial implementation
- JavaScript execution with isolated-vm
- Python execution with subprocess isolation
- Basic security measures
- Input validation
- Timeout protection
- Memory limits (JavaScript only)

## Future Enhancements

1. **Docker Integration**
   - Full Docker containerization for Python
   - Network isolation
   - File system isolation

2. **Enhanced Monitoring**
   - Execution metrics
   - Resource usage tracking
   - Abuse detection

3. **Rate Limiting**
   - Per-user rate limits
   - Global rate limits
   - Adaptive rate limiting

4. **Code Analysis**
   - Static code analysis
   - Pattern detection
   - Malicious code detection

5. **Additional Languages**
   - Support for more languages
   - Language-specific security measures

## References

- [isolated-vm Documentation](https://github.com/laverdet/isolated-vm)
- [V8 Isolates](https://v8.dev/docs/embed)
- [OWASP Code Injection](https://owasp.org/www-community/attacks/Code_Injection)
- [Docker Security](https://docs.docker.com/engine/security/)
