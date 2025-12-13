#!/bin/bash
# Fix TypeScript Configuration Issues
# Fixes: TS17004 (JSX), TS2582 (Test globals)

set -e

echo "🔧 Fixing TypeScript Configuration Issues..."
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Find all tsconfig.json files
echo "${YELLOW}Finding tsconfig.json files...${NC}"
tsconfigs=$(find . -name "tsconfig.json" -not -path "*/node_modules/*" -not -path "*/dist/*")

for tsconfig in $tsconfigs; do
    echo "Processing: $tsconfig"

    # Check if it's a test config or contains .tsx files
    dir=$(dirname "$tsconfig")
    has_tsx=$(find "$dir" -name "*.tsx" -not -path "*/node_modules/*" -not -path "*/dist/*" 2>/dev/null | head -1)
    has_tests=$(find "$dir" -name "*.test.ts" -o -name "*.spec.ts" -not -path "*/node_modules/*" 2>/dev/null | head -1)

    # Add JSX support if .tsx files exist
    if [ ! -z "$has_tsx" ]; then
        echo "  → Adding JSX support (found .tsx files)"

        # Use Node.js to update JSON safely (handle JSONC format)
        node -e "
        const fs = require('fs');
        const path = '$tsconfig';
        let content = fs.readFileSync(path, 'utf8');

        // Strip comments (// and /* */)
        content = content.replace(/\/\*[\s\S]*?\*\//g, '');
        content = content.replace(/\/\/.*/g, '');
        // Remove trailing commas
        content = content.replace(/,(\s*[}\]])/g, '\$1');

        const config = JSON.parse(content);

        if (!config.compilerOptions) config.compilerOptions = {};
        config.compilerOptions.jsx = 'react-jsx';

        // Add to lib array if not present
        if (!config.compilerOptions.lib) config.compilerOptions.lib = [];
        if (!config.compilerOptions.lib.includes('DOM')) {
            config.compilerOptions.lib.push('DOM');
        }
        if (!config.compilerOptions.lib.includes('DOM.Iterable')) {
            config.compilerOptions.lib.push('DOM.Iterable');
        }

        fs.writeFileSync(path, JSON.stringify(config, null, 2) + '\n');
        "
    fi

    # Add test globals for test files
    if [ ! -z "$has_tests" ]; then
        echo "  → Adding Vitest types (found test files)"

        node -e "
        const fs = require('fs');
        const path = '$tsconfig';
        let content = fs.readFileSync(path, 'utf8');

        // Strip comments (// and /* */)
        content = content.replace(/\/\*[\s\S]*?\*\//g, '');
        content = content.replace(/\/\/.*/g, '');
        // Remove trailing commas
        content = content.replace(/,(\s*[}\]])/g, '\$1');

        const config = JSON.parse(content);

        if (!config.compilerOptions) config.compilerOptions = {};
        if (!config.compilerOptions.types) config.compilerOptions.types = [];

        if (!config.compilerOptions.types.includes('vitest/globals')) {
            config.compilerOptions.types.push('vitest/globals');
        }

        fs.writeFileSync(path, JSON.stringify(config, null, 2) + '\n');
        "
    fi
done

echo ""
echo "${GREEN}✅ TypeScript configuration fixes complete!${NC}"
echo ""
echo "Next steps:"
echo "1. Run: npm run type-check"
echo "2. Verify JSX errors are gone"
echo "3. Verify test global errors are reduced"
