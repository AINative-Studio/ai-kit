#!/bin/bash
# Run all TypeScript fixes in sequence
set -e

cd /Users/aideveloper/ai-kit

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
BOLD='\033[1m'
NC='\033[0m'

echo ""
echo "${BOLD}🚀 Running All TypeScript Fixes${NC}"
echo ""

# Count initial errors
echo "${YELLOW}Counting initial errors...${NC}"
initial=$(npx tsc --noEmit 2>&1 | grep -c "error TS" || echo "0")
echo "${BOLD}Initial errors: $initial${NC}"
echo ""

# Fix 1: Missing imports
echo "${BLUE}[1/3] Fixing missing test imports...${NC}"
npx tsc --noEmit 2>&1 | grep "error TS2304.*Cannot find name 'expect'" | awk -F':' '{print $1}' | sort -u > /tmp/fix-imports.txt
npx tsc --noEmit 2>&1 | grep "error TS2304.*Cannot find name 'describe'" | awk -F':' '{print $1}' | sort -u >> /tmp/fix-imports.txt
npx tsc --noEmit 2>&1 | grep "error TS2304.*Cannot find name 'it'" | awk -F':' '{print $1}' | sort -u >> /tmp/fix-imports.txt

sort -u /tmp/fix-imports.txt > /tmp/fix-imports-unique.txt
count=$(wc -l < /tmp/fix-imports-unique.txt | tr -d ' ')

if [ "$count" -gt 0 ]; then
    echo "  Adding imports to $count files..."
    while IFS= read -r file; do
        if [ -f "$file" ]; then
            # Check if already has vitest import
            if ! grep -q "from 'vitest'" "$file"; then
                # Add import after any existing imports
                last_import=$(grep -n "^import " "$file" | tail -1 | cut -d':' -f1 || echo "0")
                if [ "$last_import" -eq 0 ]; then
                    # No imports, add at beginning
                    sed -i.bak "1i\\
import { describe, it, expect } from 'vitest';\\
" "$file"
                else
                    # Add after last import
                    sed -i.bak "${last_import}a\\
import { describe, it, expect } from 'vitest';
" "$file"
                fi
            fi
        fi
    done < /tmp/fix-imports-unique.txt
    find . -name "*.bak" -delete
    echo "  ${GREEN}✓ Done${NC}"
else
    echo "  ${GREEN}✓ No missing imports${NC}"
fi
echo ""

# Fix 2: Unused variables
echo "${BLUE}[2/3] Fixing unused variables...${NC}"
npx tsc --noEmit 2>&1 | grep "error TS6133" > /tmp/unused-vars.txt || true
count=$(wc -l < /tmp/unused-vars.txt | tr -d ' ')

if [ "$count" -gt 0 ]; then
    echo "  Found $count unused variables, prefixing with underscore..."
    while IFS= read -r line; do
        file=$(echo "$line" | awk -F':' '{print $1}')
        line_num=$(echo "$line" | awk -F':' '{print $2}')
        var_name=$(echo "$line" | grep -oP "'\K[^']+(?=' is declared)" || true)

        if [ ! -z "$var_name" ] && [ -f "$file" ]; then
            sed -i.bak "${line_num}s/\b${var_name}\b/_${var_name}/g" "$file"
        fi
    done < /tmp/unused-vars.txt
    find . -name "*.bak" -delete
    echo "  ${GREEN}✓ Done${NC}"
else
    echo "  ${GREEN}✓ No unused variables${NC}"
fi
echo ""

# Fix 3: process.env access
echo "${BLUE}[3/3] Fixing process.env access...${NC}"
npx tsc --noEmit 2>&1 | grep "error TS4111" | grep "comes from an index signature" > /tmp/process-env.txt || true
count=$(wc -l < /tmp/process-env.txt | tr -d ' ')

if [ "$count" -gt 0 ]; then
    echo "  Found $count process.env access issues..."
    while IFS= read -r line; do
        file=$(echo "$line" | awk -F':' '{print $1}')
        line_num=$(echo "$line" | awk -F':' '{print $2}')
        var_name=$(echo "$line" | grep -oP "'\K[^']+(?=' comes from)" || true)

        if [ ! -z "$var_name" ] && [ -f "$file" ]; then
            sed -i.bak "${line_num}s/process\.env\.${var_name}\b/process.env['${var_name}']/g" "$file"
        fi
    done < /tmp/process-env.txt
    find . -name "*.bak" -delete
    echo "  ${GREEN}✓ Done${NC}"
else
    echo "  ${GREEN}✓ No process.env issues${NC}"
fi
echo ""

# Count final errors
echo "${YELLOW}Counting final errors...${NC}"
final=$(npx tsc --noEmit 2>&1 | grep -c "error TS" || echo "0")

# Summary
echo ""
echo "${BOLD}═══════════════════════════════════════${NC}"
echo "${BOLD}            SUMMARY${NC}"
echo "${BOLD}═══════════════════════════════════════${NC}"
echo "Initial errors:  $initial"
echo "Final errors:    $final"
errors_fixed=$((initial - final))
if [ $errors_fixed -gt 0 ]; then
    percentage=$((errors_fixed * 100 / initial))
    echo "${GREEN}Errors fixed:    $errors_fixed ($percentage%)${NC}"
else
    echo "No change in error count"
fi
echo "${BOLD}═══════════════════════════════════════${NC}"
echo ""

# Cleanup
rm -f /tmp/fix-imports.txt /tmp/fix-imports-unique.txt /tmp/unused-vars.txt /tmp/process-env.txt

echo "${GREEN}✅ All fixes complete!${NC}"
