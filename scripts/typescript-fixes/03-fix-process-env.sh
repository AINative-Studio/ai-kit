#!/bin/bash
# Fix process.env Index Signature Access (TS4111)
# Converts process.env.VAR to process.env['VAR']

set -e

echo "🔧 Fixing process.env Index Signature Access (TS4111)..."
echo ""

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

cd /Users/aideveloper/ai-kit

echo "${YELLOW}Collecting process.env errors...${NC}"

# Get list of process.env errors
npm run type-check 2>&1 | grep "error TS4111" | grep "comes from an index signature" > /tmp/process-env.txt || true

total_errors=$(wc -l < /tmp/process-env.txt | tr -d ' ')

if [ "$total_errors" -eq 0 ]; then
    echo "${GREEN}No process.env errors found!${NC}"
    exit 0
fi

echo "Found $total_errors process.env access errors"
echo ""

# Parse and fix each error
while IFS= read -r line; do
    file=$(echo "$line" | awk -F':' '{print $1}')
    line_num=$(echo "$line" | awk -F':' '{print $2}')
    var_name=$(echo "$line" | grep -oP "'\K[^']+(?=' comes from)")

    if [ ! -z "$var_name" ] && [ -f "$file" ]; then
        echo "${BLUE}Fixing:${NC} $file:$line_num - process.env.$var_name"

        # Replace process.env.VAR with process.env['VAR']
        sed -i.bak "${line_num}s/process\.env\.${var_name}\b/process.env['${var_name}']/g" "$file"
    fi
done < /tmp/process-env.txt

# Remove backup files
find . -name "*.bak" -type f -delete

echo ""
echo "${GREEN}✅ process.env fixes complete!${NC}"
echo ""
echo "Converted: process.env.VAR → process.env['VAR']"
echo ""
echo "Next steps:"
echo "1. Run: npm run type-check"
echo "2. Review changes with: git diff"

rm /tmp/process-env.txt
