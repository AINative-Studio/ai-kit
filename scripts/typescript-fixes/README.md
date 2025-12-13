# TypeScript Error Fix Scripts

Automated scripts to fix the 5,200+ TypeScript errors in the AI Kit project.

## 🎯 Quick Start

```bash
# Run all fixes (recommended)
cd /Users/aideveloper/ai-kit
bash scripts/typescript-fixes/fix-all.sh
```

## 📋 Available Scripts

### 1. `01-fix-tsconfig.sh` - Configuration Fixes
**Fixes:** 2,309 errors (44%)
- ✅ **TS17004**: Adds JSX configuration for .tsx files
- ✅ **TS2582**: Adds Vitest types for test files

**What it does:**
- Scans all tsconfig.json files
- Adds `"jsx": "react-jsx"` for packages with .tsx files
- Adds `"types": ["vitest/globals"]` for test files

**Impact:** ~2,309 errors fixed

---

### 2. `02-fix-unused-variables.sh` - Code Cleanup
**Fixes:** 306 errors (6%)
- ✅ **TS6133**: Prefixes unused variables with underscore

**What it does:**
- Finds all unused variable warnings
- Prefixes them with `_` (TypeScript convention)
- Example: `page` → `_page`

**Impact:** ~306 errors fixed

---

### 3. `03-fix-process-env.sh` - Environment Variables
**Fixes:** 122 errors (2%)
- ✅ **TS4111**: Converts dot notation to bracket notation

**What it does:**
- Converts `process.env.VAR` → `process.env['VAR']`
- Required for strict index signature checking

**Impact:** ~122 errors fixed

---

### 4. `04-fix-undefined-checks.sh` - Safety Report
**Fixes:** 0 (generates report for manual fixes)
- 📊 **TS2532**: Object possibly undefined
- 📊 **TS18047**: Possibly null

**What it does:**
- Generates a detailed report: `typescript-undefined-report.md`
- Lists all locations needing null/undefined checks
- Provides fix suggestions

**Impact:** Report for ~456 errors (requires manual fixes)

---

### 5. `05-fix-missing-imports.sh` - Import Fixes
**Fixes:** ~854 errors (16%)
- ✅ **TS2304**: Adds missing test imports

**What it does:**
- Adds `import { describe, it, expect } from 'vitest'`
- Only affects test files

**Impact:** ~854 errors fixed

---

### 6. `fix-all.sh` - Master Script
**Interactive menu with options:**

```
1) Fix All (Recommended)           - Runs all scripts
2) Fix Configuration Only          - TSConfig + JSX
3) Fix Code Quality                - Unused vars + process.env
4) Fix Missing Imports             - Test globals
5) Generate Reports Only           - Undefined checks
6) Custom Selection                - Pick and choose
0) Exit
```

## 📊 Expected Results

| Script | Errors Fixed | % of Total | Safety | Speed |
|--------|--------------|------------|--------|-------|
| TSConfig | ~2,309 | 44% | ✅ Safe | ⚡ Fast |
| Missing Imports | ~854 | 16% | ✅ Safe | ⚡ Fast |
| Unused Variables | ~306 | 6% | ✅ Safe | ⚡ Fast |
| process.env | ~122 | 2% | ✅ Safe | ⚡ Fast |
| **Total Auto** | **~3,591** | **69%** | ✅ Safe | ⚡ Fast |
| Undefined (Manual) | ~456 | 9% | ⚠️ Review | 🐌 Manual |

**Remaining ~1,153 errors (22%)** require deeper investigation:
- Type mismatches (TS2322)
- Module resolution (TS2307)
- Complex type issues

## 🚀 Usage Examples

### Example 1: Fix Everything Automatically
```bash
cd /Users/aideveloper/ai-kit
bash scripts/typescript-fixes/fix-all.sh
# Choose option 1
```

### Example 2: Just Configuration
```bash
cd /Users/aideveloper/ai-kit
bash scripts/typescript-fixes/01-fix-tsconfig.sh
```

### Example 3: Code Quality Only
```bash
cd /Users/aideveloper/ai-kit
bash scripts/typescript-fixes/02-fix-unused-variables.sh
bash scripts/typescript-fixes/03-fix-process-env.sh
```

### Example 4: Custom Workflow
```bash
# 1. Fix config first
bash scripts/typescript-fixes/01-fix-tsconfig.sh

# 2. Check progress
npm run type-check 2>&1 | grep "error TS" | wc -l

# 3. Fix imports
bash scripts/typescript-fixes/05-fix-missing-imports.sh

# 4. Check again
npm run type-check 2>&1 | grep "error TS" | wc -l

# 5. Clean up unused vars
bash scripts/typescript-fixes/02-fix-unused-variables.sh
```

## ⚠️ Important Notes

### Before Running
1. **Commit your changes**: `git add . && git commit -m "Before TS fixes"`
2. **Backup**: These scripts modify files in place
3. **Review**: Use `git diff` to review changes

### After Running
1. **Verify**: Run `npm run type-check`
2. **Test**: Run `npm test` to ensure nothing broke
3. **Review**: Check `git diff` for unexpected changes
4. **Commit**: If satisfied, commit the fixes

### Safety
- ✅ All scripts are **non-destructive** (safe to run)
- ✅ Scripts create `.bak` files that are auto-cleaned
- ✅ Changes are visible in git diff
- ✅ Can be reverted with `git restore .`

## 🔍 Understanding the Errors

### High Priority (Fix First)
1. **TS17004** - JSX not configured → Blocks React compilation
2. **TS2582** - Test globals missing → Blocks test compilation
3. **TS2304** - Missing imports → Code won't compile

### Medium Priority
4. **TS6133** - Unused variables → Code quality
5. **TS4111** - process.env access → Strict mode compliance

### Manual Review Required
6. **TS2532** - Possibly undefined → Needs careful null checks
7. **TS2322** - Type mismatches → May indicate real bugs

## 📈 Progress Tracking

Check errors before and after:

```bash
# Before
npm run type-check 2>&1 | grep "error TS" | wc -l
# Output: 5200

# Run fixes
bash scripts/typescript-fixes/fix-all.sh

# After
npm run type-check 2>&1 | grep "error TS" | wc -l
# Expected: ~1600 (69% reduction!)
```

## 🐛 Troubleshooting

### Script fails with "permission denied"
```bash
chmod +x scripts/typescript-fixes/*.sh
```

### Too many changes to review
```bash
# Review by script
git diff -- '**/tsconfig.json'  # Config changes
git diff -- '**/*.ts' | grep "^-"  # Removed lines
```

### Want to undo all changes
```bash
git restore .
```

### Need to fix specific package only
```bash
# Edit the script to change the directory
# Or run from package directory
cd packages/auth
bash ../../scripts/typescript-fixes/01-fix-tsconfig.sh
```

## 📝 Manual Fixes Guide

For errors that require manual fixes (see `typescript-undefined-report.md`):

### Optional Chaining
```typescript
// Before
const value = obj.property;

// After
const value = obj?.property;
```

### Nullish Coalescing
```typescript
// Before
const value = obj.property || defaultValue;

// After
const value = obj?.property ?? defaultValue;
```

### Type Guards
```typescript
// Before
const result = possiblyUndefined.map(x => x);

// After
if (possiblyUndefined) {
  const result = possiblyUndefined.map(x => x);
}
```

## 🎯 Success Metrics

After running all scripts, you should see:
- ✅ ~69% error reduction (5200 → ~1600)
- ✅ All configuration errors fixed
- ✅ All test files compile
- ✅ No more JSX errors
- ✅ Clean unused variable warnings

## 🔗 Related

- TypeScript Error Codes: https://github.com/microsoft/TypeScript/blob/main/src/compiler/diagnosticMessages.json
- Vitest Globals: https://vitest.dev/config/#globals
- React JSX: https://www.typescriptlang.org/docs/handbook/jsx.html

## 📞 Support

If you encounter issues:
1. Check this README
2. Review the error output
3. Check `typescript-undefined-report.md`
4. Review git diff
5. Ask for help with specific error codes
