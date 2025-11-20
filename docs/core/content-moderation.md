# Content Moderation

The ContentModerator provides a comprehensive content filtering system for LLM applications, detecting and filtering inappropriate content across multiple categories with configurable severity levels and actions.

## Installation

```bash
npm install @ainative/ai-kit-core
```

## Quick Start

```typescript
import { ContentModerator } from '@ainative/ai-kit-core/security'

// Create moderator with default settings
const moderator = new ContentModerator()

// Moderate user input
const result = moderator.moderate(userInput)

if (result.flagged) {
  console.log(`Content flagged: ${result.action}`)
  console.log(`Severity: ${result.overallSeverity}`)
  console.log(`Violations: ${result.summary.totalViolations}`)

  if (result.action === 'BLOCK') {
    return {
      error: 'Content violates our policies',
      details: result.matches.map(m => m.reason)
    }
  }
}
```

## Features

- **6 Moderation Categories**: Profanity, hate speech, violence, sexual content, spam, and PII
- **4 Severity Levels**: LOW, MEDIUM, HIGH, CRITICAL
- **3 Action Types**: ALLOW, WARN, BLOCK
- **Multi-Language Support**: 12 languages including English, Spanish, French, German, and more
- **Context-Aware Filtering**: Reduces false positives by analyzing surrounding context
- **PII Detection Integration**: Automatically detects personally identifiable information
- **Customizable Patterns**: Add your own moderation rules and word lists
- **Text Sanitization**: Optional redaction of flagged content
- **Batch Processing**: Moderate multiple texts efficiently

## Moderation Categories

### 1. Profanity

Detects offensive language and profanity with varying severity levels.

**Severity Levels:**
- LOW: Mild profanity (crap, stupid, damn)
- MEDIUM: Moderate profanity (hell, ass)
- HIGH: Strong profanity (f-word, s-word, b-word)

**Example:**

```typescript
const moderator = new ContentModerator({
  enabledCategories: [ModerationCategory.PROFANITY]
})

const result = moderator.moderate("This is fucking terrible!")
// result.flagged: true
// result.overallSeverity: HIGH
// result.action: BLOCK
```

### 2. Hate Speech

Identifies discriminatory language, slurs, and hate rhetoric targeting protected groups.

**Severity:** CRITICAL

**Detects:**
- Racial and ethnic slurs
- Homophobic and transphobic language
- Religious discrimination
- Hate rhetoric patterns

**Example:**

```typescript
const result = moderator.moderate("I hate all [group]")
// result.flagged: true
// result.overallSeverity: CRITICAL
// result.action: BLOCK
```

### 3. Violence

Detects violent content including threats, graphic descriptions, and weapon-related content.

**Severity Levels:**
- HIGH: Weapon creation, graphic violence
- CRITICAL: Direct threats of violence

**Context-Aware:** Violence in fictional contexts (games, movies) may be allowed.

**Example:**

```typescript
const moderator = new ContentModerator({
  contextAwareFiltering: true
})

// Blocked - direct threat
const result1 = moderator.moderate("I will kill you")
// result1.action: BLOCK

// Allowed - fictional context
const result2 = moderator.moderate("In the game, you kill enemies")
// result2.action: ALLOW
```

### 4. Sexual Content

Identifies explicit sexual content and solicitation.

**Severity:** HIGH

**Context-Aware:** Medical and educational contexts may be allowed.

**Example:**

```typescript
// Blocked - explicit content
const result1 = moderator.moderate("Looking for porn")
// result1.flagged: true

// Allowed - medical context
const result2 = moderator.moderate("The doctor examined the breast tissue")
// result2.action: ALLOW (with context-aware filtering)
```

### 5. Spam

Detects promotional content, multiple URLs, and repetitive text.

**Severity Levels:**
- LOW: Repetitive text
- MEDIUM: Promotional language, multiple URLs

**Example:**

```typescript
const result = moderator.moderate("Buy now! Limited time! Click here!")
// result.flagged: true
// result.category: SPAM
// result.severity: MEDIUM
```

### 6. PII (Personally Identifiable Information)

Integrates with PIIDetector to identify sensitive personal information.

**Severity:** HIGH

**Detects:**
- Email addresses
- Phone numbers
- Social Security Numbers
- Credit card numbers
- IP addresses
- And more...

**Example:**

```typescript
const moderator = new ContentModerator({
  enablePIIDetection: true
})

const result = moderator.moderate("My email is user@example.com")
// result.flagged: true
// result.matches[0].category: PII
```

## Configuration

### Basic Configuration

```typescript
import {
  ContentModerator,
  ModerationCategory,
  Language,
  SeverityLevel
} from '@ainative/ai-kit-core/security'

const moderator = new ContentModerator({
  // Enable specific categories
  enabledCategories: [
    ModerationCategory.PROFANITY,
    ModerationCategory.HATE_SPEECH,
    ModerationCategory.VIOLENCE
  ],

  // Support multiple languages
  languages: [Language.ENGLISH, Language.SPANISH],

  // Enable text sanitization
  sanitize: true,
  sanitizationChar: '*',

  // Enable context-aware filtering
  contextAwareFiltering: true,

  // Enable PII detection
  enablePIIDetection: true,

  // Minimum confidence threshold
  minConfidence: 0.7,

  // Maximum text length to analyze
  maxTextLength: 10000
})
```

### Threshold Configuration

Control when content is blocked or warned based on confidence and severity.

```typescript
const moderator = new ContentModerator({
  thresholds: {
    // Block if confidence >= 0.8
    blockThreshold: 0.8,

    // Warn if confidence >= 0.6
    warnThreshold: 0.6,

    // Auto-block this severity and above
    autoBlockSeverity: SeverityLevel.CRITICAL
  }
})
```

### Language Support

Built-in support for 12 languages:

```typescript
const moderator = new ContentModerator({
  languages: [
    Language.ENGLISH,    // English
    Language.SPANISH,    // Spanish
    Language.FRENCH,     // French
    Language.GERMAN,     // German
    Language.ITALIAN,    // Italian
    Language.PORTUGUESE, // Portuguese
    Language.DUTCH,      // Dutch
    Language.RUSSIAN,    // Russian
    Language.CHINESE,    // Chinese
    Language.JAPANESE,   // Japanese
    Language.KOREAN,     // Korean
    Language.ARABIC      // Arabic
  ]
})

// Example: Detect Spanish profanity
const result = moderator.moderate("Eres una puta")
// result.flagged: true
```

## Custom Patterns

Add custom moderation rules for your specific use case.

### Register Custom Pattern

```typescript
import { ModerationPattern, ModerationCategory, SeverityLevel } from '@ainative/ai-kit-core/security'

const customPattern: ModerationPattern = {
  id: 'company-confidential',
  category: ModerationCategory.SPAM,
  pattern: /\b(confidential|internal[-\s]use[-\s]only|proprietary)\b/gi,
  severity: SeverityLevel.HIGH,
  confidence: 0.9,
  description: 'Company confidential information',
  languages: [Language.ENGLISH],
  caseSensitive: false
}

moderator.registerPattern(customPattern)
```

### Pattern with Keywords

```typescript
const keywordPattern: ModerationPattern = {
  id: 'banned-brands',
  category: ModerationCategory.SPAM,
  pattern: ['competitor-a', 'competitor-b', 'competitor-c'],
  severity: SeverityLevel.MEDIUM,
  confidence: 0.85,
  description: 'Competitor brand mentions'
}

moderator.registerPattern(keywordPattern)
```

### Context Rules

Add context rules to reduce false positives:

```typescript
const violencePattern: ModerationPattern = {
  id: 'violence-custom',
  category: ModerationCategory.VIOLENCE,
  pattern: /\b(fight|attack|battle)\b/gi,
  severity: SeverityLevel.MEDIUM,
  confidence: 0.7,
  description: 'Violence-related terms',
  contextRules: [
    {
      type: 'whitelist',
      pattern: /\b(game|sport|chess|debate)\b/gi,
      action: 'allow',
      windowSize: 100
    }
  ]
}

moderator.registerPattern(violencePattern)
```

## Custom Word Lists

Create custom word lists for specific categories and languages.

```typescript
import { WordList, ModerationCategory, Language, SeverityLevel } from '@ainative/ai-kit-core/security'

const customWordList: WordList = {
  category: ModerationCategory.PROFANITY,
  language: Language.ENGLISH,
  severity: SeverityLevel.HIGH,
  words: [
    'customword1',
    'customword2',
    'customword3'
  ],
  caseSensitive: false
}

moderator.registerWordList(customWordList)
```

## Result Structure

The moderation result provides detailed information about detected violations.

```typescript
interface ModerationResult {
  // Original text analyzed
  text: string

  // Whether violations were detected
  flagged: boolean

  // Recommended action (ALLOW, WARN, BLOCK)
  action: ModerationAction

  // Overall severity level
  overallSeverity: SeverityLevel

  // Overall confidence (0-1)
  confidence: number

  // Individual matches
  matches: ModerationMatch[]

  // Summary statistics
  summary: {
    totalViolations: number
    violationsByCategory: Partial<Record<ModerationCategory, number>>
    highestSeverity: SeverityLevel
  }

  // Timestamp of analysis
  timestamp: Date

  // Sanitized text (if enabled)
  sanitizedText?: string
}
```

### Match Details

Each match includes:

```typescript
interface ModerationMatch {
  category: ModerationCategory
  severity: SeverityLevel
  confidence: number
  matchedText: string
  start: number
  end: number
  reason: string
  metadata?: {
    patternId?: string
    language?: Language
    context?: string
    [key: string]: any
  }
}
```

## Usage Examples

### Example 1: Basic Moderation

```typescript
const moderator = new ContentModerator()

const result = moderator.moderate("This is fucking terrible!")

console.log(result.flagged)           // true
console.log(result.action)            // BLOCK
console.log(result.overallSeverity)   // HIGH
console.log(result.confidence)        // 0.9
console.log(result.matches.length)    // 1
console.log(result.matches[0].category) // PROFANITY
```

### Example 2: Multi-Category Detection

```typescript
const moderator = new ContentModerator()

const result = moderator.moderate(
  "I hate you and will kill you, contact me at evil@example.com"
)

console.log(result.summary.totalViolations) // 3
console.log(result.summary.violationsByCategory)
// {
//   HATE_SPEECH: 1,
//   VIOLENCE: 1,
//   PII: 1
// }
```

### Example 3: Text Sanitization

```typescript
const moderator = new ContentModerator({
  sanitize: true,
  sanitizationChar: '#'
})

const result = moderator.moderate("This fucking shit is terrible")

console.log(result.sanitizedText)
// "This ####### #### is terrible"
```

### Example 4: Batch Processing

```typescript
const moderator = new ContentModerator()

const texts = [
  "This is clean",
  "This is fucking bad",
  "I hate everyone",
  "Contact me at user@example.com"
]

const results = moderator.moderateBatch(texts)

results.forEach((result, index) => {
  console.log(`Text ${index + 1}:`, result.flagged ? 'FLAGGED' : 'CLEAN')
})
```

### Example 5: Custom Moderation Workflow

```typescript
const moderator = new ContentModerator({
  thresholds: {
    blockThreshold: 0.8,
    warnThreshold: 0.6,
    autoBlockSeverity: SeverityLevel.HIGH
  }
})

function handleUserMessage(message: string) {
  const result = moderator.moderate(message)

  switch (result.action) {
    case ModerationAction.BLOCK:
      return {
        allowed: false,
        message: "Your message violates our community guidelines",
        violations: result.matches.map(m => m.reason)
      }

    case ModerationAction.WARN:
      return {
        allowed: true,
        warning: "Your message may contain inappropriate content",
        flaggedContent: result.sanitizedText
      }

    case ModerationAction.ALLOW:
      return {
        allowed: true,
        message: message
      }
  }
}
```

### Example 6: Context-Aware Moderation

```typescript
const moderator = new ContentModerator({
  contextAwareFiltering: true
})

// Violence in fictional context - allowed
const result1 = moderator.moderate(
  "In the video game, players can kill zombies and fight monsters"
)
console.log(result1.action) // ALLOW

// Direct threat - blocked
const result2 = moderator.moderate(
  "I will kill you right now"
)
console.log(result2.action) // BLOCK
```

### Example 7: Multi-Language Moderation

```typescript
const moderator = new ContentModerator({
  languages: [
    Language.ENGLISH,
    Language.SPANISH,
    Language.FRENCH
  ]
})

// English profanity
const result1 = moderator.moderate("This is fucking bad")
console.log(result1.flagged) // true

// Spanish profanity
const result2 = moderator.moderate("Esto es una puta mierda")
console.log(result2.flagged) // true

// French profanity
const result3 = moderator.moderate("C'est de la merde")
console.log(result3.flagged) // true
```

## Integration Patterns

### Express.js Middleware

```typescript
import express from 'express'
import { ContentModerator, ModerationAction } from '@ainative/ai-kit-core/security'

const moderator = new ContentModerator()

function contentModerationMiddleware(req, res, next) {
  const { message } = req.body

  if (!message) {
    return next()
  }

  const result = moderator.moderate(message)

  if (result.action === ModerationAction.BLOCK) {
    return res.status(400).json({
      error: 'Content violation',
      details: result.matches.map(m => m.reason)
    })
  }

  if (result.action === ModerationAction.WARN) {
    req.moderationWarning = result
  }

  next()
}

app.use(contentModerationMiddleware)
```

### GraphQL Integration

```typescript
import { ContentModerator, ModerationAction } from '@ainative/ai-kit-core/security'

const moderator = new ContentModerator()

const resolvers = {
  Mutation: {
    postMessage: async (_, { content }, context) => {
      const result = moderator.moderate(content)

      if (result.action === ModerationAction.BLOCK) {
        throw new Error('Content violates community guidelines')
      }

      // Save message with moderation metadata
      return await saveMessage({
        content: content,
        moderationResult: result,
        flagged: result.flagged
      })
    }
  }
}
```

### Real-time Chat Moderation

```typescript
import { Server } from 'socket.io'
import { ContentModerator, ModerationAction } from '@ainative/ai-kit-core/security'

const moderator = new ContentModerator({
  sanitize: true,
  thresholds: {
    blockThreshold: 0.8,
    warnThreshold: 0.6,
    autoBlockSeverity: SeverityLevel.HIGH
  }
})

io.on('connection', (socket) => {
  socket.on('message', (data) => {
    const result = moderator.moderate(data.message)

    if (result.action === ModerationAction.BLOCK) {
      socket.emit('error', {
        message: 'Message blocked due to policy violation'
      })
      return
    }

    // Broadcast sanitized version if flagged
    const broadcastMessage = result.flagged && result.sanitizedText
      ? result.sanitizedText
      : data.message

    io.emit('message', {
      user: socket.id,
      message: broadcastMessage,
      flagged: result.flagged
    })
  })
})
```

## Best Practices

### 1. Choose Appropriate Thresholds

```typescript
// Strict moderation for public forums
const strictModerator = new ContentModerator({
  thresholds: {
    blockThreshold: 0.7,
    warnThreshold: 0.5,
    autoBlockSeverity: SeverityLevel.MEDIUM
  }
})

// Lenient moderation for private channels
const lenientModerator = new ContentModerator({
  thresholds: {
    blockThreshold: 0.9,
    warnThreshold: 0.8,
    autoBlockSeverity: SeverityLevel.CRITICAL
  }
})
```

### 2. Enable Context-Aware Filtering

```typescript
// Reduce false positives by analyzing context
const moderator = new ContentModerator({
  contextAwareFiltering: true
})
```

### 3. Use Appropriate Categories

```typescript
// Only enable relevant categories for your use case
const chatModerator = new ContentModerator({
  enabledCategories: [
    ModerationCategory.PROFANITY,
    ModerationCategory.HATE_SPEECH,
    ModerationCategory.VIOLENCE
  ]
})

// Different settings for user profiles
const profileModerator = new ContentModerator({
  enabledCategories: [
    ModerationCategory.PROFANITY,
    ModerationCategory.HATE_SPEECH,
    ModerationCategory.PII,
    ModerationCategory.SEXUAL_CONTENT
  ]
})
```

### 4. Handle Edge Cases

```typescript
function moderateContent(text: string) {
  // Validate input
  if (!text || text.trim().length === 0) {
    return { allowed: true }
  }

  // Moderate
  const result = moderator.moderate(text)

  // Log for review
  if (result.flagged) {
    logModerationEvent({
      text: text,
      result: result,
      timestamp: new Date()
    })
  }

  return {
    allowed: result.action !== ModerationAction.BLOCK,
    result: result
  }
}
```

### 5. Provide User Feedback

```typescript
function getFriendlyError(result: ModerationResult): string {
  const categories = Object.keys(result.summary.violationsByCategory)

  if (categories.includes(ModerationCategory.PROFANITY)) {
    return "Please avoid using offensive language"
  }

  if (categories.includes(ModerationCategory.HATE_SPEECH)) {
    return "Hate speech is not allowed in our community"
  }

  if (categories.includes(ModerationCategory.VIOLENCE)) {
    return "Violent or threatening content is prohibited"
  }

  if (categories.includes(ModerationCategory.PII)) {
    return "Please don't share personal information publicly"
  }

  return "Your message violates our community guidelines"
}
```

### 6. Monitor and Tune

```typescript
// Log moderation results for analysis
function moderateAndLog(text: string) {
  const result = moderator.moderate(text)

  // Send to analytics
  analytics.track('content_moderated', {
    flagged: result.flagged,
    action: result.action,
    categories: Object.keys(result.summary.violationsByCategory),
    severity: result.overallSeverity,
    confidence: result.confidence
  })

  return result
}
```

## Performance Considerations

### Batch Processing

For multiple texts, use batch processing:

```typescript
// Efficient batch processing
const results = moderator.moderateBatch(texts)

// Less efficient individual processing
const results = texts.map(text => moderator.moderate(text))
```

### Text Length Limits

Set appropriate max length to avoid performance issues:

```typescript
const moderator = new ContentModerator({
  maxTextLength: 5000 // Truncate longer texts
})
```

### Selective Category Enabling

Only enable categories you need:

```typescript
const moderator = new ContentModerator({
  enabledCategories: [
    ModerationCategory.PROFANITY,
    ModerationCategory.HATE_SPEECH
  ]
})
```

## Configuration Management

### Get Current Configuration

```typescript
const config = moderator.getConfig()
console.log(config.enabledCategories)
console.log(config.languages)
console.log(config.minConfidence)
```

### Update Configuration

```typescript
moderator.updateConfig({
  minConfidence: 0.85,
  sanitize: true,
  thresholds: {
    blockThreshold: 0.9
  }
})
```

### Get Statistics

```typescript
const stats = moderator.getStats()
console.log('Total patterns:', stats.totalPatterns)
console.log('Total word lists:', stats.totalWordLists)
console.log('Patterns by category:', stats.patternsByCategory)
console.log('Word lists by language:', stats.wordListsByLanguage)
```

## Troubleshooting

### False Positives

If you're getting too many false positives:

1. Enable context-aware filtering
2. Increase confidence threshold
3. Add context rules to patterns
4. Review and adjust severity levels

```typescript
const moderator = new ContentModerator({
  contextAwareFiltering: true,
  minConfidence: 0.8,
  thresholds: {
    blockThreshold: 0.85
  }
})
```

### False Negatives

If content is not being detected:

1. Lower confidence threshold
2. Add custom patterns for your use case
3. Enable all relevant categories
4. Check language settings

```typescript
const moderator = new ContentModerator({
  minConfidence: 0.6,
  enabledCategories: Object.values(ModerationCategory),
  languages: [Language.ENGLISH, Language.SPANISH]
})
```

## API Reference

See the [TypeScript types documentation](../../packages/core/src/security/types.ts) for complete API reference.

## Related Modules

- [PII Detection](./pii-detection.md) - Detect personally identifiable information
- [Prompt Injection Detection](./prompt-injection-detection.md) - Detect prompt injection attacks
- [Jailbreak Detection](./jailbreak-detection.md) - Detect jailbreak attempts

## Support

For issues, questions, or contributions, please visit our [GitHub repository](https://github.com/ainative/ai-kit).
