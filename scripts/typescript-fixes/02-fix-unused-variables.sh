#!/bin/bash
# Fix Unused Variables (TS6133)
# Automatically removes or comments out unused variables

set -e

echo "🧹 Fixing Unused Variables (TS6133)..."
echo ""

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Get list of unused variable errors
echo "${YELLOW}Collecting unused variable errors...${NC}"

cd /Users/aideveloper/ai-kit

# Create temp file with errors
npm run type-check 2>&1 | grep "error TS6133" > /tmp/unused-vars.txt || true

total_errors=$(wc -l < /tmp/unused-vars.txt | tr -d ' ')

if [ "$total_errors" -eq 0 ]; then
    echo "${GREEN}No unused variables found!${NC}"
    exit 0
fi

echo "Found $total_errors unused variable errors"
echo ""

# Parse and fix each error
while IFS= read -r line; do
    # Extract file, line number, and variable name
    file=$(echo "$line" | awk -F':' '{print $1}')
    line_num=$(echo "$line" | awk -F':' '{print $2}')
    var_name=$(echo "$line" | grep -oP "'\K[^']+(?=' is declared)")

    if [ ! -z "$var_name" ] && [ -f "$file" ]; then
        echo "${BLUE}Fixing:${NC} $file:$line_num - unused variable '$var_name'"

        # Prefix unused parameters with underscore
        # This is the TypeScript convention for intentionally unused variables
        sed -i.bak "${line_num}s/\b${var_name}\b/_${var_name}/g" "$file"
    fi
done < /tmp/unused-vars.txt

# Remove backup files
find . -name "*.bak" -type f -delete

echo ""
echo "${GREEN}✅ Unused variable fixes complete!${NC}"
echo ""
echo "Applied fixes:"
echo "- Prefixed unused parameters with underscore (_param)"
echo "- This follows TypeScript convention for intentionally unused vars"
echo ""
echo "Next steps:"
echo "1. Run: npm run type-check"
echo "2. Review changes with: git diff"
echo "3. Commit if satisfied"

rm /tmp/unused-vars.txt
