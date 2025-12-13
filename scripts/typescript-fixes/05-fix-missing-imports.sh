#!/bin/bash
# Fix Missing Imports (TS2304)
# Adds missing imports for common test globals and utilities

set -e

echo "📦 Fixing Missing Imports (TS2304)..."
echo ""

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

cd /Users/aideveloper/ai-kit

echo "${YELLOW}Collecting missing import errors...${NC}"

# Get missing 'expect' errors
npm run type-check 2>&1 | grep "error TS2304.*Cannot find name 'expect'" > /tmp/missing-expect.txt || true
# Get missing 'describe' errors
npm run type-check 2>&1 | grep "error TS2304.*Cannot find name 'describe'" > /tmp/missing-describe.txt || true
# Get missing 'it' errors
npm run type-check 2>&1 | grep "error TS2304.*Cannot find name 'it'" > /tmp/missing-it.txt || true

total_expect=$(wc -l < /tmp/missing-expect.txt | tr -d ' ')
total_describe=$(wc -l < /tmp/missing-describe.txt | tr -d ' ')
total_it=$(wc -l < /tmp/missing-it.txt | tr -d ' ')
total_errors=$((total_expect + total_describe + total_it))

if [ "$total_errors" -eq 0 ]; then
    echo "${GREEN}No missing import errors found!${NC}"
    rm -f /tmp/missing-*.txt
    exit 0
fi

echo "Found $total_errors missing import errors"
echo "  - expect: $total_expect"
echo "  - describe: $total_describe"
echo "  - it: $total_it"
echo ""

# Get unique files that need fixing
cat /tmp/missing-*.txt | awk -F':' '{print $1}' | sort -u > /tmp/files-to-fix.txt

echo "${BLUE}Adding imports to test files...${NC}"

while IFS= read -r file; do
    if [ -f "$file" ]; then
        echo "Processing: $file"

        # Check if file already has vitest import
        has_vitest=$(grep -c "from 'vitest'" "$file" || true)

        if [ "$has_vitest" -eq 0 ]; then
            # Determine what to import based on what's missing
            needs_expect=$(grep -c "$file.*expect" /tmp/missing-expect.txt || true)
            needs_describe=$(grep -c "$file.*describe" /tmp/missing-describe.txt || true)
            needs_it=$(grep -c "$file.*'it'" /tmp/missing-it.txt || true)

            imports=()
            [ "$needs_describe" -gt 0 ] && imports+=("describe")
            [ "$needs_it" -gt 0 ] && imports+=("it")
            [ "$needs_expect" -gt 0 ] && imports+=("expect")

            if [ ${#imports[@]} -gt 0 ]; then
                import_statement="import { $(IFS=, ; echo "${imports[*]}") } from 'vitest';"

                # Add import at the top of the file (after any existing imports)
                # Find the last import line
                last_import_line=$(grep -n "^import " "$file" | tail -1 | cut -d':' -f1 || echo "0")

                if [ "$last_import_line" -eq 0 ]; then
                    # No imports, add at the beginning
                    sed -i.bak "1i\\
$import_statement\\
" "$file"
                else
                    # Add after last import
                    sed -i.bak "${last_import_line}a\\
$import_statement
" "$file"
                fi

                echo "  → Added: $import_statement"
            fi
        else
            echo "  → Already has vitest imports"
        fi
    fi
done < /tmp/files-to-fix.txt

# Remove backup files
find . -name "*.bak" -type f -delete

echo ""
echo "${GREEN}✅ Missing import fixes complete!${NC}"
echo ""
echo "Note: This only fixes test global imports (describe, it, expect)"
echo "Other missing imports may need manual resolution."
echo ""
echo "Next steps:"
echo "1. Run: npm run type-check"
echo "2. Review changes with: git diff"

rm -f /tmp/missing-*.txt /tmp/files-to-fix.txt
