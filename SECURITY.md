# Security Policy

## Supported Versions

We actively support the following versions of AI Kit with security updates:

| Version | Supported          | End of Support |
| ------- | ------------------ | -------------- |
| 0.0.x   | :white_check_mark: | TBD            |

**Note:** As this is a pre-1.0 release, we recommend always using the latest version. Breaking changes may occur between minor versions during the 0.x phase.

### Package-Specific Support

All packages in the AI Kit monorepo follow the same versioning and support schedule:

- `@ainative/ai-kit-core` - Core SDK (agents, streaming, memory, safety)
- `@ainative/ai-kit` - React integration
- `@ainative/ai-kit-video` - Video recording primitives
- `@ainative/ai-kit-safety` - Safety guardrails
- `@ainative/ai-kit-tools` - Built-in tools
- `@ainative/ai-kit-cli` - CLI scaffolding

## Reporting a Vulnerability

**Please do not report security vulnerabilities through public GitHub issues.**

We take security seriously and appreciate responsible disclosure. If you discover a security vulnerability, please follow these steps:

### 1. Private Disclosure

Send a detailed report to:

**Email:** security@ainative.studio

**Subject Line:** `[SECURITY] Brief description of the vulnerability`

### 2. What to Include

Please provide as much information as possible:

- **Description:** Clear explanation of the vulnerability
- **Impact:** What an attacker could achieve
- **Affected Versions:** Which versions are vulnerable
- **Affected Packages:** Which AI Kit packages are impacted
- **Reproduction Steps:** Detailed steps to reproduce the issue
- **Proof of Concept:** Code sample or demonstration (if applicable)
- **Suggested Fix:** Your recommendation for remediation (optional)
- **CVE Information:** If you've already obtained a CVE ID (optional)

### 3. Response Timeline

We are committed to responding promptly:

| Timeline | Action |
|----------|--------|
| **24 hours** | Initial acknowledgment of your report |
| **72 hours** | Preliminary assessment and severity classification |
| **7 days** | Detailed response with our remediation plan |
| **30-90 days** | Security patch released (depending on severity) |

### 4. Disclosure Process

- We will work with you to understand and validate the vulnerability
- We will keep you informed of our progress
- We will credit you in the security advisory (unless you prefer to remain anonymous)
- We request that you do not publicly disclose the vulnerability until we have released a fix

## Security Update Process

### How We Handle Security Issues

1. **Triage:** Security reports are prioritized above feature requests and non-security bugs
2. **Assessment:** We evaluate the severity using CVSS 3.1 scoring
3. **Development:** We develop and test a fix in a private repository
4. **Release:** We release a security patch as soon as possible
5. **Notification:** We notify users through multiple channels

### Severity Classification

We use the following severity levels based on CVSS scores:

| Severity | CVSS Score | Response Time | Description |
|----------|------------|---------------|-------------|
| **Critical** | 9.0-10.0 | 24-48 hours | Requires immediate action |
| **High** | 7.0-8.9 | 7 days | Significant security impact |
| **Medium** | 4.0-6.9 | 30 days | Moderate security impact |
| **Low** | 0.1-3.9 | 90 days | Minor security impact |

### How You'll Be Notified

When we release a security update:

1. **GitHub Security Advisories:** Published on our repository
2. **Release Notes:** Detailed in the changelog with `[SECURITY]` prefix
3. **NPM Advisory:** Flagged in npm audit reports
4. **Email Notification:** Sent to users who have starred/watched the repository (if available)
5. **Social Media:** Announced on our official channels for critical issues

### Applying Security Updates

```bash
# Check for vulnerabilities in your dependencies
npm audit

# Update AI Kit packages to the latest secure version
npm update @ainative/ai-kit-core @ainative/ai-kit

# Or use pnpm
pnpm update @ainative/ai-kit-core @ainative/ai-kit

# Verify the update
npm audit
```

## Responsible Disclosure Policy

### Our Commitments

We pledge to:

- Respond to security reports within 24 hours
- Work with researchers in good faith to understand and fix issues
- Keep researchers informed throughout the remediation process
- Publicly acknowledge researchers (with permission) in security advisories
- Not pursue legal action against researchers who follow this policy

### Researcher Guidelines

To qualify for responsible disclosure protections:

- **Make a good faith effort** to avoid privacy violations, data destruction, and service interruption
- **Do not access or modify** data that does not belong to you
- **Do not exploit** the vulnerability beyond what is necessary to demonstrate it
- **Give us reasonable time** to fix the issue before public disclosure (typically 90 days)
- **Do not violate** any laws or breach any agreements

### Safe Harbor

We consider security research conducted under this policy to be:

- Authorized under the Computer Fraud and Abuse Act (CFAA)
- Exempt from the Digital Millennium Copyright Act (DMCA)
- Lawful and valuable to the security of our users

### Out of Scope

The following are **not** considered security vulnerabilities:

- Denial of Service attacks (unless due to algorithmic complexity)
- Social engineering attacks against AI Kit maintainers or users
- Physical attacks against our infrastructure
- Issues in dependencies (report to the upstream project)
- Issues requiring extensive user interaction or unlikely scenarios
- Rate limiting or resource exhaustion in client-side code
- Version information disclosure
- Issues affecting only outdated/unsupported versions

## Contact Information

### Security Team

- **Primary Contact:** security@ainative.studio
- **PGP Key:** Available upon request for encrypted communication
- **Response Hours:** Monday-Friday, 9 AM - 5 PM UTC (critical issues monitored 24/7)

### General Contact

- **GitHub Issues:** For non-security bugs and features
- **GitHub Discussions:** For questions and community support
- **Email:** hello@ainative.studio

## Security Best Practices for Users

### For Application Developers

#### 1. Input Validation

Always validate and sanitize user inputs before passing to AI Kit:

```typescript
import { PromptInjectionDetector } from '@ainative/ai-kit-safety'

const detector = new PromptInjectionDetector({
  sensitivityLevel: 'HIGH'
})

const userInput = req.body.message

// Check for prompt injection
const result = detector.detect(userInput)
if (result.isInjection && result.recommendation === 'block') {
  return res.status(400).json({ error: 'Invalid input detected' })
}
```

#### 2. API Key Security

Never expose API keys in client-side code:

```typescript
// ❌ WRONG - Never do this
const stream = new AIStream({
  endpoint: 'https://api.anthropic.com/v1/messages',
  headers: { 'x-api-key': 'sk-ant-...' } // Exposed to client!
})

// ✅ CORRECT - Use a backend proxy
const stream = new AIStream({
  endpoint: '/api/ai-proxy', // Your secure backend endpoint
})
```

#### 3. Content Moderation

Always moderate AI-generated content before displaying to users:

```typescript
import { ContentModerator } from '@ainative/ai-kit-safety'

const moderator = new ContentModerator({
  enabledCategories: ['PROFANITY', 'HATE_SPEECH', 'VIOLENCE']
})

const aiResponse = await agent.execute(userInput)
const modResult = moderator.moderate(aiResponse.response)

if (modResult.action === 'BLOCK') {
  return 'I cannot provide that response.'
}
```

#### 4. PII Protection

Redact sensitive information before logging or storing:

```typescript
import { PIIDetector } from '@ainative/ai-kit-safety'

const piiDetector = new PIIDetector({ redact: true })
const userMessage = "My email is user@example.com"

const result = await piiDetector.detectAndRedact(userMessage)
console.log(result.redactedText) // "My email is [EMAIL REDACTED]"
```

#### 5. Rate Limiting

Implement rate limiting to prevent abuse:

```typescript
// Example using express-rate-limit
import rateLimit from 'express-rate-limit'

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
})

app.use('/api/ai', limiter)
```

#### 6. Dependency Audits

Regularly audit dependencies for vulnerabilities:

```bash
# Run audit before each deployment
npm audit

# Fix vulnerabilities automatically (review changes!)
npm audit fix

# For manual review
npm audit --json > audit-report.json
```

#### 7. Environment Variables

Use environment variables for all secrets:

```bash
# .env (never commit this file!)
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...
ZERODB_ENCRYPTION_KEY=...

# .env.example (commit this as a template)
ANTHROPIC_API_KEY=your_api_key_here
OPENAI_API_KEY=your_api_key_here
ZERODB_ENCRYPTION_KEY=generate_with_openssl
```

#### 8. Secure Memory Storage

Encrypt sensitive data in memory stores:

```typescript
import { UserMemory, ZeroDBStore } from '@ainative/ai-kit-core'

// Use ZeroDB for encrypted storage
const memory = new UserMemory({
  store: new ZeroDBStore({
    encryptionKey: process.env.ZERODB_ENCRYPTION_KEY
  })
})
```

### For End Users

1. **Keep Dependencies Updated:** Run `npm update` regularly
2. **Review Permissions:** Audit what data your AI application can access
3. **Monitor API Usage:** Watch for unusual activity in your provider dashboards
4. **Use HTTPS Only:** Never send API keys or sensitive data over unencrypted connections
5. **Implement Logging:** Track AI interactions for security auditing

## Bug Bounty Program

**Status:** Currently not available

We are evaluating the implementation of a bug bounty program. In the meantime:

- We appreciate responsible disclosure from the security community
- We will publicly acknowledge security researchers in our advisories
- We may provide swag or recognition for significant findings

**Stay tuned:** Follow our repository for updates on our bug bounty program.

## Security Advisories

View all published security advisories:

- **GitHub:** [https://github.com/AINative-Studio/ai-kit/security/advisories](https://github.com/AINative-Studio/ai-kit/security/advisories)
- **npm:** Search for package advisories at [https://www.npmjs.com/advisories](https://www.npmjs.com/advisories)

## Additional Resources

- **Security Features Documentation:** See our [Safety package documentation](./packages/safety/README.md)
- **OWASP Top 10 for LLM Applications:** [https://owasp.org/www-project-top-10-for-large-language-model-applications/](https://owasp.org/www-project-top-10-for-large-language-model-applications/)
- **AI Security Best Practices:** [https://atlas.mitre.org/](https://atlas.mitre.org/)

## Questions?

If you have questions about this security policy, please contact us at security@ainative.studio

---

**Last Updated:** February 8, 2026

**Version:** 1.0.0
