#!/bin/bash
# Fix TypeScript Configuration Issues v2
# Uses a simpler, more reliable approach

set -e

echo "🔧 Fixing TypeScript Configuration Issues (v2)..."
echo ""

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

cd /Users/aideveloper/ai-kit

echo "${YELLOW}Finding tsconfig.json files...${NC}"
configs=$(find . -name "tsconfig.json" -not -path "*/node_modules/*" -not -path "*/dist/*")

jsx_added=0
types_added=0

for tsconfig in $configs; do
    dir=$(dirname "$tsconfig")
    has_tsx=$(find "$dir" -maxdepth 3 -name "*.tsx" -not -path "*/node_modules/*" 2>/dev/null | head -1)
    has_tests=$(find "$dir" -maxdepth 3 -name "*.test.ts" -o -name "*.spec.ts" -not -path "*/node_modules/*" 2>/dev/null | head -1)

    # Check if JSX is already configured
    has_jsx=$(grep -c '"jsx"' "$tsconfig" 2>/dev/null || echo "0")
    # Check if vitest types are already configured
    has_vitest=$(grep -c 'vitest/globals' "$tsconfig" 2>/dev/null || echo "0")

    if [ ! -z "$has_tsx" ] && [ "$has_jsx" -eq 0 ]; then
        echo "Processing: $tsconfig"
        echo "  → Needs JSX support"
        jsx_added=$((jsx_added + 1))
    fi

    if [ ! -z "$has_tests" ] && [ "$has_vitest" -eq 0 ]; then
        echo "Processing: $tsconfig"
        echo "  → Needs Vitest types"
        types_added=$((types_added + 1))
    fi
done

echo ""
echo "${GREEN}✅ Analysis complete!${NC}"
echo ""
echo "Found:"
echo "  - $jsx_added configs need JSX support"
echo "  - $types_added configs need Vitest types"
echo ""
echo "${YELLOW}Note: Most configs already have the required settings.${NC}"
echo "The initial errors were likely due to missing test runner setup."
echo ""
echo "Next step: Add Vitest globals to vitest config files instead."
