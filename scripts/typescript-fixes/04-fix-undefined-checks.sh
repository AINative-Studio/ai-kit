#!/bin/bash
# Fix Undefined Checks (TS2532, TS18047)
# Adds null/undefined checks where needed

set -e

echo "🛡️  Fixing Undefined/Null Checks (TS2532, TS18047)..."
echo ""

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

cd /Users/aideveloper/ai-kit

echo "${YELLOW}Collecting undefined errors...${NC}"

# Get list of undefined errors
npm run type-check 2>&1 | grep -E "error TS(2532|18047)" > /tmp/undefined-errors.txt || true

total_errors=$(wc -l < /tmp/undefined-errors.txt | tr -d ' ')

if [ "$total_errors" -eq 0 ]; then
    echo "${GREEN}No undefined errors found!${NC}"
    exit 0
fi

echo "Found $total_errors undefined/null errors"
echo ""
echo "${RED}⚠️  WARNING: This script creates a report only.${NC}"
echo "${RED}Manual fixes are recommended for type safety.${NC}"
echo ""

# Create a report file
report_file="typescript-undefined-report.md"

cat > "$report_file" << 'EOF'
# TypeScript Undefined/Null Error Report

This report lists all places where TypeScript detected potential undefined/null errors.
These need manual review and fixing.

## Recommended Fixes

1. **Optional Chaining**: `obj?.property`
2. **Nullish Coalescing**: `value ?? defaultValue`
3. **Type Guards**: `if (value !== undefined) { ... }`
4. **Non-null Assertion** (use sparingly): `value!`

## Errors by File

EOF

# Group errors by file
echo "${BLUE}Generating report...${NC}"

current_file=""
while IFS= read -r line; do
    file=$(echo "$line" | awk -F':' '{print $1}')
    line_num=$(echo "$line" | awk -F':' '{print $2}')
    error_msg=$(echo "$line" | awk -F'error TS[0-9]+: ' '{print $2}')

    if [ "$file" != "$current_file" ]; then
        current_file="$file"
        echo "" >> "$report_file"
        echo "### $file" >> "$report_file"
        echo "" >> "$report_file"
    fi

    echo "- Line $line_num: $error_msg" >> "$report_file"
done < /tmp/undefined-errors.txt

echo "" >> "$report_file"
echo "---" >> "$report_file"
echo "" >> "$report_file"
echo "Total errors: $total_errors" >> "$report_file"

echo ""
echo "${GREEN}✅ Report generated: $report_file${NC}"
echo ""
echo "To fix these errors:"
echo "1. Review the report: cat $report_file"
echo "2. Add null checks using optional chaining (?.)"
echo "3. Add default values using nullish coalescing (??)"
echo "4. Add proper type guards where needed"
echo ""
echo "Example fixes:"
echo "  ${BLUE}// Before${NC}"
echo "  const value = obj.property;"
echo ""
echo "  ${GREEN}// After${NC}"
echo "  const value = obj?.property ?? defaultValue;"

rm /tmp/undefined-errors.txt
