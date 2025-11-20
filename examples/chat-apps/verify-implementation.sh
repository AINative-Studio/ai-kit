#!/bin/bash

# AIKIT-53 Implementation Verification Script
# Verifies all 5 chat applications are properly set up

set -e

echo "========================================"
echo "AIKIT-53: Chat Apps Verification Script"
echo "========================================"
echo ""

CHAT_APPS_DIR="$(cd "$(dirname "$0")" && pwd)"
FAILED=0
PASSED=0

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to check if directory exists
check_dir() {
    if [ -d "$1" ]; then
        echo -e "${GREEN}✓${NC} Directory exists: $1"
        ((PASSED++))
        return 0
    else
        echo -e "${RED}✗${NC} Directory missing: $1"
        ((FAILED++))
        return 1
    fi
}

# Function to check if file exists
check_file() {
    if [ -f "$1" ]; then
        echo -e "${GREEN}✓${NC} File exists: $1"
        ((PASSED++))
        return 0
    else
        echo -e "${RED}✗${NC} File missing: $1"
        ((FAILED++))
        return 1
    fi
}

# Function to count files in directory
count_files() {
    local dir=$1
    local pattern=$2
    local count=$(find "$dir" -name "$pattern" 2>/dev/null | wc -l)
    echo $count
}

echo "Verifying directory structure..."
echo "================================"

# Check main applications
check_dir "$CHAT_APPS_DIR/nextjs-chatbot"
check_dir "$CHAT_APPS_DIR/react-tools-chat"
check_dir "$CHAT_APPS_DIR/vue-assistant"
check_dir "$CHAT_APPS_DIR/svelte-minimal"
check_dir "$CHAT_APPS_DIR/enterprise-chat"

echo ""
echo "Verifying Next.js Chatbot..."
echo "============================="

check_file "$CHAT_APPS_DIR/nextjs-chatbot/package.json"
check_file "$CHAT_APPS_DIR/nextjs-chatbot/README.md"
check_file "$CHAT_APPS_DIR/nextjs-chatbot/tsconfig.json"
check_dir "$CHAT_APPS_DIR/nextjs-chatbot/app"
check_dir "$CHAT_APPS_DIR/nextjs-chatbot/components"
check_dir "$CHAT_APPS_DIR/nextjs-chatbot/lib"
check_dir "$CHAT_APPS_DIR/nextjs-chatbot/__tests__"

# Count component files
NEXTJS_COMPONENTS=$(count_files "$CHAT_APPS_DIR/nextjs-chatbot/components" "*.tsx")
echo "  Components found: $NEXTJS_COMPONENTS"

# Count test files
NEXTJS_TESTS=$(count_files "$CHAT_APPS_DIR/nextjs-chatbot/__tests__" "*.test.ts*")
echo "  Test files found: $NEXTJS_TESTS"

echo ""
echo "Verifying React Tools Chat..."
echo "=============================="

check_file "$CHAT_APPS_DIR/react-tools-chat/package.json"
check_file "$CHAT_APPS_DIR/react-tools-chat/README.md"
check_dir "$CHAT_APPS_DIR/react-tools-chat/src"
check_dir "$CHAT_APPS_DIR/react-tools-chat/src/tools"

# Check tool files
check_file "$CHAT_APPS_DIR/react-tools-chat/src/tools/calculator.ts"
check_file "$CHAT_APPS_DIR/react-tools-chat/src/tools/weather.ts"
check_file "$CHAT_APPS_DIR/react-tools-chat/src/tools/web-search.ts"

echo ""
echo "Verifying Vue Assistant..."
echo "=========================="

check_file "$CHAT_APPS_DIR/vue-assistant/package.json"
check_file "$CHAT_APPS_DIR/vue-assistant/README.md"

echo ""
echo "Verifying Svelte Minimal..."
echo "==========================="

check_file "$CHAT_APPS_DIR/svelte-minimal/package.json"
check_file "$CHAT_APPS_DIR/svelte-minimal/README.md"

echo ""
echo "Verifying Enterprise Chat..."
echo "============================="

check_file "$CHAT_APPS_DIR/enterprise-chat/package.json"
check_file "$CHAT_APPS_DIR/enterprise-chat/README.md"

echo ""
echo "Verifying Documentation..."
echo "=========================="

check_file "$CHAT_APPS_DIR/README.md"
check_file "$CHAT_APPS_DIR/AIKIT-53_IMPLEMENTATION_SUMMARY.md"

echo ""
echo "========================================"
echo "Verification Summary"
echo "========================================"
echo -e "${GREEN}Passed checks: $PASSED${NC}"
echo -e "${RED}Failed checks: $FAILED${NC}"
echo ""

# Total counts
TOTAL_COMPONENTS=$(find "$CHAT_APPS_DIR" -name "*.tsx" -o -name "*.vue" -o -name "*.svelte" 2>/dev/null | wc -l)
TOTAL_TESTS=$(find "$CHAT_APPS_DIR" -name "*.test.*" -o -name "*.spec.*" 2>/dev/null | wc -l)
TOTAL_README=$(find "$CHAT_APPS_DIR" -name "README.md" 2>/dev/null | wc -l)

echo "Statistics:"
echo "-----------"
echo "Total component files: $TOTAL_COMPONENTS"
echo "Total test files: $TOTAL_TESTS"
echo "Total README files: $TOTAL_README"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✓ All verification checks passed!${NC}"
    echo ""
    echo "AIKIT-53 Implementation Status: COMPLETE"
    exit 0
else
    echo -e "${RED}✗ Some verification checks failed${NC}"
    echo ""
    echo "AIKIT-53 Implementation Status: INCOMPLETE"
    exit 1
fi
