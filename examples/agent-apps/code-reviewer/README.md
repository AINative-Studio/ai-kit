# Code Review Agent

Automated code review with GitHub integration, security scanning, style checks, performance analysis, and test coverage assessment.

## Features

- **Security Vulnerability Detection**: Identifies SQL injection, XSS, and other security issues
- **Style and Best Practice Checks**: Enforces coding standards
- **Performance Analysis**: Detects inefficient code patterns
- **Test Coverage Analysis**: Ensures adequate test coverage
- **PR Comment Generation**: Automatically posts review comments on GitHub PRs
- **CLI Interface**: Use from command line for local reviews
- **Web Dashboard**: Visual interface for review results

## Installation

```bash
npm install
```

## Configuration

Create `.env.local`:

```env
ANTHROPIC_API_KEY=your_key
GITHUB_TOKEN=your_github_token
```

## Usage

### CLI

```bash
# Review current repository
npm run cli review --repo .

# Review specific PR
npm run cli review --repo owner/repo --pr 123

# Review specific branch
npm run cli review --repo owner/repo --branch feature-x

# Skip specific checks
npm run cli review --repo . --no-security --no-tests
```

### Web Interface

```bash
npm run dev
# Open http://localhost:3002
```

### API

```bash
POST /api/review
{
  "repository": "owner/repo",
  "pullRequestNumber": 123,
  "checkSecurity": true,
  "checkStyle": true,
  "checkPerformance": true,
  "checkTests": true
}
```

## Review Categories

- **Security**: SQL injection, XSS, authentication issues, sensitive data exposure
- **Style**: Linting violations, naming conventions, code formatting
- **Performance**: Inefficient loops, memory leaks, slow operations
- **Tests**: Coverage gaps, missing edge cases, test quality

## Severity Levels

- **Critical**: Must fix before merging
- **High**: Should fix before merging
- **Medium**: Fix when possible
- **Low**: Nice to have
- **Info**: Informational only

## Integration with GitHub

The agent can automatically post comments on pull requests:

```typescript
import { codeReviewAgent } from './agents/code-review-agent';

const result = await codeReviewAgent.review({
  repository: 'owner/repo',
  pullRequestNumber: 123,
});

const comment = await codeReviewAgent.generatePRComment(result.output.findings);
// Post comment to GitHub PR
```

## Testing

```bash
npm test
```

## Deployment

See main deployment guide for Docker, Vercel, and Railway instructions.
