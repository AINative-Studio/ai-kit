# Workspace Dependency Resolution

## Overview

This document explains the workspace dependency resolution system implemented for the AI Kit monorepo. The system automatically replaces `workspace:*` protocol dependencies with actual version numbers during the publishing process, ensuring proper dependency resolution when packages are installed from npm.

## Problem Statement

When using pnpm workspaces with the `workspace:*` protocol, internal monorepo dependencies are properly linked during development. However, when publishing to npm, these `workspace:*` references must be replaced with actual version numbers, otherwise npm users will encounter dependency resolution errors.

**Example Issue:**
```json
{
  "dependencies": {
    "@ainative/ai-kit-core": "workspace:*"
  }
}
```

This works in the monorepo but fails when published to npm because npm doesn't understand the `workspace:*` protocol.

## Solution

The solution consists of three main components:

### 1. Workspace Dependency Resolver (`scripts/workspace-dependency-resolver.ts`)

The core library that handles the dependency resolution logic:

- **`findAllPackageJsonFiles(rootDir)`**: Recursively finds all package.json files in the workspace
- **`getPackageVersion(packageName, rootDir)`**: Retrieves the version of a package by name
- **`replaceWorkspaceDependencies(packageJsonPath, rootDir)`**: Replaces workspace:* with actual versions
- **`validateResolvedDependencies(packageJsonPath)`**: Validates all dependencies are resolved
- **`resolveWorkspaceDependencies(rootDir)`**: Main function that processes all packages

**Features:**
- Supports `workspace:*`, `workspace:^`, and `workspace:~` protocols
- Preserves semver prefixes (^, ~)
- Handles dependencies, devDependencies, and peerDependencies
- Provides detailed replacement reports
- Gracefully handles errors and malformed files

### 2. Prepare Publish Script (`scripts/prepare-publish.ts`)

CLI script that prepares packages for publishing:

```bash
pnpm run prepare:publish
```

**What it does:**
1. Creates backups of all modified package.json files in `.workspace-backup/`
2. Replaces all workspace:* dependencies with actual versions
3. Generates a detailed report of all replacements
4. Provides next steps for publishing

### 3. Restore Script (`scripts/restore-workspace-deps.ts`)

CLI script that restores workspace:* dependencies after publishing:

```bash
pnpm run restore:workspace
```

**What it does:**
1. Restores package.json files from backups
2. Cleans up the `.workspace-backup/` directory

## Usage

### Automated Publishing Workflow

The release scripts are already configured to handle workspace dependency resolution:

```bash
# Full release workflow
pnpm run release

# Beta release
pnpm run release:beta

# Dry run
pnpm run publish:dry-run
```

These scripts automatically:
1. Prepare workspace dependencies
2. Build packages
3. Run tests
4. Publish to npm
5. Restore workspace dependencies

### Manual Usage

If you need to manually prepare packages:

```bash
# 1. Prepare for publishing
pnpm run prepare:publish

# 2. Build your packages
pnpm build

# 3. Publish (example using changeset)
pnpm changeset:publish

# 4. Restore workspace dependencies
pnpm run restore:workspace
```

## How It Works

### Resolution Process

1. **Discovery**: Scan the `packages/` directory for all package.json files
2. **Version Mapping**: Build a map of package names to their versions
3. **Replacement**: For each package:
   - Find all workspace:* dependencies
   - Look up the actual version
   - Replace with the resolved version
   - Preserve semver prefixes if specified
4. **Backup**: Create backups before modifying files
5. **Validation**: Verify all workspace dependencies were resolved

### Example Transformation

**Before (Development):**
```json
{
  "name": "@ainative/ai-kit",
  "version": "0.1.0-alpha.4",
  "dependencies": {
    "@ainative/ai-kit-core": "workspace:*",
    "react-markdown": "^10.1.0"
  }
}
```

**After (Publishing):**
```json
{
  "name": "@ainative/ai-kit",
  "version": "0.1.0-alpha.4",
  "dependencies": {
    "@ainative/ai-kit-core": "0.1.4",
    "react-markdown": "^10.1.0"
  }
}
```

### Semver Prefix Handling

The resolver preserves semver prefixes:

- `workspace:*` → `0.1.4` (exact version)
- `workspace:^` → `^0.1.4` (compatible version)
- `workspace:~` → `~0.1.4` (patch updates)

## Testing

The workspace dependency resolver has comprehensive test coverage (77.65%):

```bash
# Run tests
npx vitest run --config vitest.scripts.config.ts scripts/__tests__/workspace-dependency-resolver.test.ts --coverage
```

**Test Coverage:**
- File discovery and filtering
- Version resolution
- Dependency replacement
- Error handling
- Edge cases (malformed files, circular dependencies, etc.)
- Integration scenarios

**Test Results:**
```
Test Files  1 passed (1)
     Tests  35 passed (35)
  Coverage  77.65% statements, 75% branches, 85.71% functions
```

## Architecture Decisions

### Why Not Use Changesets Built-in Support?

While changesets has some workspace protocol handling, we needed:
1. More control over the replacement process
2. Ability to create backups for safety
3. Custom validation and error handling
4. Support for all semver prefix types
5. Detailed reporting for debugging

### Why Backup and Restore?

The backup/restore approach provides:
1. **Safety**: Easy rollback if something goes wrong
2. **Clarity**: Clear separation between dev and publish states
3. **Consistency**: Ensures workspace protocol is always used in development
4. **Auditability**: Can verify what was changed before publishing

### Why Exclude Examples?

Example applications are not published to npm, so they:
- Don't need workspace dependency resolution
- Can continue using workspace:* indefinitely
- Reduce processing time
- Avoid unnecessary modifications

## File Structure

```
ai-kit/
├── scripts/
│   ├── workspace-dependency-resolver.ts  # Core library
│   ├── prepare-publish.ts                # Prepare for publishing
│   ├── restore-workspace-deps.ts         # Restore after publishing
│   └── __tests__/
│       └── workspace-dependency-resolver.test.ts
├── .workspace-backup/                    # Temporary backups (gitignored)
└── vitest.scripts.config.ts             # Test configuration
```

## Error Handling

The resolver handles various error scenarios:

1. **Malformed package.json**: Skips and continues processing
2. **Missing package**: Throws clear error with package name
3. **Circular dependencies**: Resolves based on current versions
4. **Missing version field**: Skips package during version lookup
5. **No workspace dependencies**: Returns early without modifications

## Integration with CI/CD

The workspace dependency resolution integrates with the existing CI/CD pipeline:

```yaml
# Example CI workflow
- name: Prepare for publishing
  run: pnpm run prepare:publish

- name: Build packages
  run: pnpm build

- name: Publish to npm
  run: pnpm changeset:publish

- name: Restore workspace deps
  run: pnpm run restore:workspace
```

## Troubleshooting

### Issue: "Cannot resolve workspace dependency"

**Cause**: Referenced package not found in workspace

**Solution**:
1. Verify the package exists in `packages/`
2. Check the package name matches exactly
3. Ensure package.json has a valid name field

### Issue: Backup directory not cleaned up

**Cause**: Restore script not run or failed

**Solution**:
```bash
# Manually restore
pnpm run restore:workspace

# Or manually delete backups
rm -rf .workspace-backup
```

### Issue: Tests failing after dependency resolution

**Cause**: Dependencies not properly restored

**Solution**:
```bash
# Restore workspace dependencies
pnpm run restore:workspace

# Reinstall dependencies
pnpm install
```

## Future Enhancements

Potential improvements for future iterations:

1. **Dry-run mode**: Preview changes without modifying files
2. **Selective resolution**: Only resolve specific packages
3. **Version validation**: Ensure resolved versions are compatible
4. **Changelog integration**: Track dependency version changes
5. **Performance optimization**: Parallel processing for large monorepos

## Related Issues

- Issue #104: workspace:* dependency doesn't resolve from npm
- Related to: npm publishing workflow, monorepo architecture

## References

- [pnpm Workspaces Documentation](https://pnpm.io/workspaces)
- [Workspace Protocol Specification](https://pnpm.io/workspaces#workspace-protocol-workspace)
- [Changesets Documentation](https://github.com/changesets/changesets)
