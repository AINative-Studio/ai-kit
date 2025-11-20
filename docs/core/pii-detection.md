# PII Detection (AIKIT-34 & AIKIT-35)

## Overview

The AIKit PII (Personally Identifiable Information) Detection system provides comprehensive detection and redaction of sensitive information in text. The system includes built-in patterns for common PII types (AIKIT-34) and supports custom user-defined patterns with advanced features (AIKIT-35).

## Features

- Built-in patterns for common PII types (email, phone, SSN, credit cards, etc.)
- Custom user-defined PII patterns
- Priority-based pattern matching
- Multiple redaction strategies
- Pattern validation and testing
- Import/export capabilities for pattern libraries
- Region-specific detection
- Performance-optimized matching

## Installation

```typescript
import { PIIDetector, PatternPriority, RedactionStrategy } from '@aikit/core/security';
```

## Quick Start

### Basic Usage (AIKIT-34)

```typescript
import { PIIDetector } from '@aikit/core/security';

const detector = new PIIDetector();

const text = 'Contact John Doe at john.doe@example.com or call (555) 123-4567';
const result = detector.detect(text);

console.log(result.summary.hasPII); // true
console.log(result.matches.length); // 2 (email and phone)
console.log(result.matches);
// [
//   {
//     type: 'EMAIL',
//     value: 'john.doe@example.com',
//     start: 24,
//     end: 45,
//     confidence: 0.95,
//     metadata: { region: 'GLOBAL', format: 'RFC 5322', validated: true }
//   },
//   {
//     type: 'PHONE',
//     value: '(555) 123-4567',
//     start: 54,
//     end: 68,
//     confidence: 0.85,
//     metadata: { region: 'US', format: 'US/Canada (XXX) XXX-XXXX', validated: true }
//   }
// ]
```

### With Redaction

```typescript
const detector = new PIIDetector({
  redact: true,
  redactionChar: '*',
});

const result = detector.detect('Email: john@example.com');
console.log(result.redactedText); // "Email: *****************"
```

## Built-in PII Types (AIKIT-34)

The PIIDetector includes comprehensive built-in patterns for detecting common types of PII across multiple regions.

### Supported PII Types

| Type | Description | Regions | Example |
|------|-------------|---------|---------|
| `EMAIL` | Email addresses | GLOBAL | `john.doe@example.com` |
| `PHONE` | Phone numbers (various formats) | US, CA, UK, EU, AU, GLOBAL | `(555) 123-4567`, `+44 20 7123 4567` |
| `SSN` | Social Security Numbers | US | `123-45-6789` |
| `CREDIT_CARD` | Credit card numbers (Visa, MC, Amex, etc.) | GLOBAL | `4532015112830366` |
| `IP_ADDRESS` | IPv4 and IPv6 addresses | GLOBAL | `192.168.1.1`, `2001:0db8:85a3::8a2e:0370:7334` |
| `DATE_OF_BIRTH` | Dates of birth | US, EU, UK, AU | `12/31/1990`, `31/12/1990` |
| `DRIVERS_LICENSE` | Driver's license numbers | US | `D1234567` |
| `PASSPORT` | Passport numbers | US, UK | `A12345678`, `123456789A` |
| `NAME` | Capitalized names | GLOBAL | `John Smith` |
| `URL` | Web URLs | GLOBAL | `https://example.com` |
| `IBAN` | International Bank Account Numbers | EU | `GB82WEST12345698765432` |
| `VAT_NUMBER` | VAT identification numbers | EU | `DE123456789` |
| `POSTAL_CODE` | Postal/ZIP codes | US, UK, CA | `12345`, `SW1A 1AA`, `K1A 0B1` |
| `PHYSICAL_ADDRESS` | Street addresses | GLOBAL | `123 Main Street` |

### Detection Examples

#### Email Detection

```typescript
const detector = new PIIDetector({ enabledTypes: [PIIType.EMAIL] });
const result = detector.detect('Contact: user@example.com');
console.log(result.matches[0].type); // 'EMAIL'
console.log(result.matches[0].confidence); // 0.95
```

#### Phone Number Detection (Multi-Region)

```typescript
const detector = new PIIDetector({
  enabledTypes: [PIIType.PHONE],
  regions: [Region.US, Region.UK],
});

const text = 'US: (555) 123-4567, UK: 0207 123 4567';
const result = detector.detect(text);
console.log(result.matches.length); // 2
```

#### Credit Card Detection with Validation

```typescript
const detector = new PIIDetector({
  enabledTypes: [PIIType.CREDIT_CARD],
  validate: true, // Enables Luhn algorithm validation
});

const result = detector.detect('Card: 4532015112830366');
console.log(result.matches[0].metadata.validated); // true
```

#### SSN Detection

```typescript
const detector = new PIIDetector({
  enabledTypes: [PIIType.SSN],
  validate: true,
});

const result = detector.detect('SSN: 123-45-6789');
// Validates format and rejects invalid patterns like 000-xx-xxxx, 666-xx-xxxx
```

### Configuration Options

```typescript
interface PIIDetectorConfig {
  /** Regions to support for detection */
  regions?: Region[];
  /** Specific PII types to detect (default: all types) */
  enabledTypes?: PIIType[];
  /** Whether to perform redaction */
  redact?: boolean;
  /** Redaction character/string to use */
  redactionChar?: string;
  /** Minimum confidence threshold (0-1) */
  minConfidence?: number;
  /** Custom patterns for detection */
  customPatterns?: PIIPattern[];
  /** Whether to validate detected PII (e.g., Luhn algorithm for credit cards) */
  validate?: boolean;
  /** Context window size for named entity recognition */
  contextWindow?: number;
}
```

### Region-Specific Detection

```typescript
// Detect only US-specific PII
const usDetector = new PIIDetector({
  regions: [Region.US],
  enabledTypes: [PIIType.SSN, PIIType.PHONE, PIIType.POSTAL_CODE],
});

// Detect European PII
const euDetector = new PIIDetector({
  regions: [Region.EU],
  enabledTypes: [PIIType.IBAN, PIIType.VAT_NUMBER],
});
```

### Validation Features

The detector includes validation for certain PII types:

- **Credit Cards**: Luhn algorithm validation
- **SSN**: Format and range validation (rejects invalid patterns)
- **IBAN**: Checksum validation
- **Phone Numbers**: Format validation per region

```typescript
const detector = new PIIDetector({
  validate: true, // Enable validation (default: true)
});

// Invalid credit card will not be detected
const result = detector.detect('Card: 4111111111111112'); // Fails Luhn check
console.log(result.matches.length); // 0

// Turn off validation to detect patterns without verification
const permissiveDetector = new PIIDetector({
  validate: false,
});
const result2 = permissiveDetector.detect('Card: 4111111111111112');
console.log(result2.matches.length); // 1 (pattern matched but not validated)
```

### Detection Result Structure

```typescript
interface PIIDetectionResult {
  /** Original text analyzed */
  text: string;
  /** All PII matches found */
  matches: PIIMatch[];
  /** Text with PII redacted (if redaction was enabled) */
  redactedText?: string;
  /** Summary statistics */
  summary: {
    totalMatches: number;
    matchesByType: Record<string, number>;
    hasPII: boolean;
  };
}

interface PIIMatch {
  /** Type of PII detected */
  type: PIIType;
  /** The actual PII value found */
  value: string;
  /** Starting position in the text */
  start: number;
  /** Ending position in the text */
  end: number;
  /** Confidence score (0-1) */
  confidence: number;
  /** Additional metadata about the match */
  metadata?: {
    region?: Region;
    format?: string;
    validated?: boolean;
  };
}
```

## Custom Patterns

### Registering Custom Patterns

Define and register custom PII patterns for organization-specific data:

```typescript
import { PatternPriority, RedactionStrategy } from '@aikit/core/security';

detector.registerCustomPattern({
  id: 'employee-id',
  name: 'Employee ID',
  description: 'Company employee identification number',
  pattern: /EMP-\d{6}/g,
  priority: PatternPriority.HIGH,
  redactionStrategy: RedactionStrategy.LABEL,
  tags: ['internal', 'hr'],
  enabled: true,
});
```

### Pattern Configuration Options

| Option | Type | Required | Description |
|--------|------|----------|-------------|
| `id` | string | Yes | Unique identifier (alphanumeric, hyphens, underscores only) |
| `name` | string | Yes | Human-readable name |
| `description` | string | No | What the pattern detects |
| `pattern` | RegExp | Yes | Regular expression pattern (should have global flag) |
| `priority` | PatternPriority | Yes | Matching priority (CRITICAL, HIGH, MEDIUM, LOW, LOWEST) |
| `redactionStrategy` | RedactionStrategy | No | How to redact matches (default: LABEL) |
| `customRedactor` | function | No | Custom redaction function |
| `caseSensitive` | boolean | No | Case sensitivity (default: depends on regex flags) |
| `tags` | string[] | No | Tags for categorization |
| `enabled` | boolean | No | Whether pattern is active (default: true) |
| `validator` | function | No | Optional validation function |
| `regions` | Region[] | No | Applicable regions |
| `confidence` | number | No | Confidence score 0-1 (default: 0.8) |

## Priority System

Patterns are evaluated in priority order (highest first). This ensures that more specific or critical patterns are matched before generic ones.

### Priority Levels

```typescript
enum PatternPriority {
  CRITICAL = 100,  // For highly sensitive data (SSN, credit cards)
  HIGH = 75,       // For important PII (employee IDs, internal codes)
  MEDIUM = 50,     // For standard PII (emails, phones)
  LOW = 25,        // For less sensitive data
  LOWEST = 0,      // For informational patterns
}
```

### Example

```typescript
// High priority pattern for sensitive internal codes
detector.registerCustomPattern({
  id: 'secret-project-code',
  name: 'Secret Project Code',
  pattern: /SECRET-[A-Z]{3}-\d{6}/g,
  priority: PatternPriority.CRITICAL,
  redactionStrategy: RedactionStrategy.HASH,
});

// Lower priority for general project codes
detector.registerCustomPattern({
  id: 'project-code',
  name: 'Project Code',
  pattern: /PROJ-\d{4}/g,
  priority: PatternPriority.MEDIUM,
  redactionStrategy: RedactionStrategy.LABEL,
});
```

## Redaction Strategies

### MASK Strategy

Replaces the entire value with asterisks:

```typescript
redactionStrategy: RedactionStrategy.MASK
// Input:  "john.doe@example.com"
// Output: "*********************"
```

### LABEL Strategy

Replaces with pattern name label:

```typescript
redactionStrategy: RedactionStrategy.LABEL
// Input:  "john.doe@example.com"
// Output: "[EMAIL]"
```

### HASH Strategy

Replaces with a hash of the value:

```typescript
redactionStrategy: RedactionStrategy.HASH
// Input:  "john.doe@example.com"
// Output: "[HASH:a1b2c3d4]"
```

### PARTIAL Strategy

Shows beginning and end, masks middle:

```typescript
redactionStrategy: RedactionStrategy.PARTIAL
// Input:  "john.doe@example.com"
// Output: "jo***************om"
```

### REMOVE Strategy

Completely removes the value:

```typescript
redactionStrategy: RedactionStrategy.REMOVE
// Input:  "Email: john.doe@example.com"
// Output: "Email: "
```

### Custom Redactor

Provide a custom function:

```typescript
detector.registerCustomPattern({
  id: 'custom-redact',
  name: 'Custom',
  pattern: /CUSTOM-\d{4}/g,
  priority: PatternPriority.MEDIUM,
  customRedactor: (match: string) => {
    return `<HIDDEN:${match.length} chars>`;
  },
});

// Input:  "Code: CUSTOM-1234"
// Output: "Code: <HIDDEN:11 chars>"
```

## Pattern Validation

Validate patterns before registration:

```typescript
const pattern = {
  id: 'test-pattern',
  name: 'Test Pattern',
  pattern: /TEST-\d{4}/g,
  priority: PatternPriority.MEDIUM,
};

const validation = detector.validatePattern(pattern);

if (!validation.valid) {
  console.error('Pattern errors:', validation.errors);
}

if (validation.warnings.length > 0) {
  console.warn('Pattern warnings:', validation.warnings);
}

console.log('Complexity score:', validation.complexityScore);
```

### Validation Checks

- Pattern ID format (alphanumeric, hyphens, underscores)
- Required fields present
- Valid regular expression
- Global flag presence
- Pattern complexity analysis

## Pattern Testing

Test patterns against sample text before deployment:

```typescript
detector.registerCustomPattern({
  id: 'test-pattern',
  name: 'Test Pattern',
  pattern: /TEST-\d{6}/g,
  priority: PatternPriority.MEDIUM,
  redactionStrategy: RedactionStrategy.LABEL,
});

const testResult = detector.testPattern('test-pattern', {
  testString: 'Codes: TEST-123456, TEST-789012',
  testRedaction: true,
  expectedMatches: 2,
});

console.log('Test passed:', testResult.passed);
console.log('Matches found:', testResult.matches.length);
console.log('Redacted output:', testResult.redactedOutput);
console.log('Execution time:', testResult.performance.executionTime, 'ms');
```

## Pattern Management

### Listing Patterns

```typescript
// List enabled patterns only
const enabledPatterns = detector.listCustomPatterns();

// List all patterns including disabled
const allPatterns = detector.listCustomPatterns(true);

console.log(`Total custom patterns: ${allPatterns.length}`);
console.log(`Enabled patterns: ${enabledPatterns.length}`);
```

### Getting a Specific Pattern

```typescript
const pattern = detector.getCustomPattern('employee-id');
if (pattern) {
  console.log('Pattern name:', pattern.name);
  console.log('Priority:', pattern.priority);
  console.log('Enabled:', pattern.enabled);
}
```

### Unregistering Patterns

```typescript
const removed = detector.unregisterCustomPattern('employee-id');
console.log('Pattern removed:', removed);
```

### Clearing All Custom Patterns

```typescript
detector.clearCustomPatterns();
console.log('All custom patterns cleared');
```

## Import/Export

### Exporting Patterns

Save your custom patterns to share or back up:

```typescript
const exportData = detector.exportPatterns();

// Save to file
import fs from 'fs';
fs.writeFileSync('pii-patterns.json', JSON.stringify(exportData, null, 2));
```

### Importing Patterns

Load patterns from JSON:

```typescript
import fs from 'fs';
const exportData = JSON.parse(fs.readFileSync('pii-patterns.json', 'utf-8'));

// Import with default options
const importedCount = detector.importPatterns(exportData);

// Import with options
const importedCount = detector.importPatterns(exportData, {
  replace: true,      // Replace existing patterns with same ID
  validate: true,     // Validate patterns before importing
  idPrefix: 'team-',  // Add prefix to imported IDs
});

console.log(`Imported ${importedCount} patterns`);
```

### Export Format

```json
{
  "version": "1.0.0",
  "exportedAt": "2024-11-19T12:00:00.000Z",
  "patterns": [
    {
      "id": "employee-id",
      "name": "Employee ID",
      "description": "Company employee identification",
      "pattern": "EMP-\\d{6}",
      "flags": "g",
      "priority": 75,
      "redactionStrategy": "label",
      "tags": ["internal", "hr"],
      "enabled": true,
      "confidence": 0.9,
      "regions": ["US"]
    }
  ]
}
```

## Integration with Built-in Patterns

Combine custom patterns with built-in detection:

```typescript
const detector = new PIIDetector({
  redact: true,
  regions: [Region.US, Region.GLOBAL],
});

// Register custom patterns
detector.registerCustomPattern({
  id: 'employee-id',
  name: 'Employee ID',
  pattern: /EMP-\d{6}/g,
  priority: PatternPriority.HIGH,
});

// Detect using both built-in and custom patterns
const result = detector.detectWithCustomPatterns(
  'Employee EMP-123456 can be reached at john@example.com'
);

console.log('Total matches:', result.matches.length);
console.log('Types found:', Object.keys(result.summary.matchesByType));
```

## Pattern Library Examples

### Financial Patterns

```typescript
// Credit card with custom validation
detector.registerCustomPattern({
  id: 'internal-card',
  name: 'Internal Payment Card',
  pattern: /IPC-\d{4}-\d{4}-\d{4}/g,
  priority: PatternPriority.CRITICAL,
  redactionStrategy: RedactionStrategy.PARTIAL,
  validator: (value: string) => {
    // Custom Luhn-like validation
    return value.split('-').every(part => part.length === 4);
  },
  tags: ['finance', 'payment'],
});

// Bank account numbers
detector.registerCustomPattern({
  id: 'bank-account',
  name: 'Bank Account Number',
  pattern: /BA-\d{10}/g,
  priority: PatternPriority.CRITICAL,
  redactionStrategy: RedactionStrategy.MASK,
  tags: ['finance', 'banking'],
});
```

### Healthcare Patterns

```typescript
// Patient ID
detector.registerCustomPattern({
  id: 'patient-id',
  name: 'Patient ID',
  pattern: /PAT-\d{8}/g,
  priority: PatternPriority.CRITICAL,
  redactionStrategy: RedactionStrategy.HASH,
  tags: ['healthcare', 'hipaa'],
});

// Medical record number
detector.registerCustomPattern({
  id: 'mrn',
  name: 'Medical Record Number',
  pattern: /MRN-[A-Z]{2}\d{6}/g,
  priority: PatternPriority.CRITICAL,
  redactionStrategy: RedactionStrategy.HASH,
  tags: ['healthcare', 'hipaa'],
});
```

### Corporate Patterns

```typescript
// Employee badge numbers
detector.registerCustomPattern({
  id: 'badge-number',
  name: 'Employee Badge',
  pattern: /BADGE-\d{5}/g,
  priority: PatternPriority.HIGH,
  redactionStrategy: RedactionStrategy.LABEL,
  tags: ['corporate', 'access'],
});

// Internal server names
detector.registerCustomPattern({
  id: 'server-name',
  name: 'Internal Server',
  pattern: /SRV-[A-Z]{3}-\d{3}/g,
  priority: PatternPriority.MEDIUM,
  redactionStrategy: RedactionStrategy.LABEL,
  tags: ['infrastructure', 'internal'],
});
```

## Best Practices

### Pattern Design

1. **Use Specific Patterns**: Make patterns as specific as possible to avoid false positives
2. **Include Global Flag**: Always use the `g` flag for proper matching
3. **Set Appropriate Priority**: Higher priority for more specific/sensitive data
4. **Test Thoroughly**: Use `testPattern()` with various test cases
5. **Validate First**: Use `validatePattern()` before registration

### Performance

1. **Avoid Overly Complex Patterns**: High complexity scores impact performance
2. **Use Non-Capturing Groups**: Use `(?:)` instead of `()` when you don't need captures
3. **Limit Backtracking**: Avoid patterns that cause excessive backtracking
4. **Region Filtering**: Specify regions to reduce unnecessary pattern evaluation

### Security

1. **Hash Sensitive Data**: Use `HASH` strategy for highly sensitive patterns
2. **Test Redaction**: Always verify redaction output in tests
3. **Document Patterns**: Include clear descriptions for all custom patterns
4. **Version Control**: Export and version control your pattern library
5. **Regular Audits**: Periodically review and update patterns

### Organization

1. **Use Tags**: Categorize patterns with meaningful tags
2. **Naming Convention**: Use consistent naming for pattern IDs
3. **Group Related Patterns**: Keep related patterns together
4. **Document Dependencies**: Note any pattern dependencies or conflicts
5. **Maintain Pattern Library**: Keep a central repository of shared patterns

## API Reference

### PIIDetector Methods

#### `registerCustomPattern(pattern: CustomPIIPattern): void`
Register a new custom pattern. Throws error if pattern is invalid.

#### `unregisterCustomPattern(patternId: string): boolean`
Remove a custom pattern. Returns true if pattern was removed.

#### `getCustomPattern(patternId: string): CustomPIIPattern | undefined`
Get a custom pattern by ID.

#### `listCustomPatterns(includeDisabled?: boolean): CustomPIIPattern[]`
List all custom patterns. By default, only enabled patterns are returned.

#### `validatePattern(pattern: Partial<CustomPIIPattern>): PatternValidationResult`
Validate a pattern without registering it.

#### `testPattern(patternId: string, options: PatternTestOptions): PatternTestResult`
Test a pattern against sample text.

#### `detectWithCustomPatterns(text: string): PIIDetectionResult`
Detect PII using both built-in and custom patterns.

#### `exportPatterns(): PatternExport`
Export all custom patterns to JSON.

#### `importPatterns(exportData: PatternExport, options?: ImportOptions): number`
Import patterns from JSON. Returns number of patterns imported.

#### `clearCustomPatterns(): void`
Remove all custom patterns.

#### `getPatternStats(): PatternStats`
Get statistics about registered patterns.

## Troubleshooting

### Pattern Not Matching

1. Ensure global flag is present: `/pattern/g`
2. Test pattern with `testPattern()` method
3. Check complexity score - simplify if too high
4. Verify region settings match pattern regions

### High False Positive Rate

1. Make pattern more specific
2. Add validator function for additional checks
3. Increase priority to override less specific patterns
4. Add context requirements (e.g., word boundaries)

### Performance Issues

1. Check pattern complexity score
2. Reduce number of enabled patterns
3. Use region filtering
4. Optimize regex (avoid backtracking)
5. Test with `testPattern()` performance metrics

## Examples

See the test suite in `packages/core/__tests__/security/CustomPIIPatterns.test.ts` for comprehensive examples of all features.

## License

MIT License - See LICENSE file for details
