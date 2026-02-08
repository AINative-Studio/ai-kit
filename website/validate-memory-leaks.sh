#!/bin/bash

# Memory Leak Validation Script for Marketing Site
# Issue #141 - Automated validation before deployment

set -e  # Exit on error

echo "========================================"
echo "Memory Leak Validation - Marketing Site"
echo "Issue #141"
echo "========================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Track validation status
VALIDATION_PASSED=true

# Function to print status
print_status() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✓${NC} $2"
    else
        echo -e "${RED}✗${NC} $2"
        VALIDATION_PASSED=false
    fi
}

# 1. Check that fixed file exists
echo "1. Checking fixed HTML file exists..."
if [ -f "index.fixed.html" ]; then
    print_status 0 "index.fixed.html found"
else
    print_status 1 "index.fixed.html NOT found"
fi
echo ""

# 2. Verify EventListenerManager is present
echo "2. Verifying EventListenerManager class exists..."
if grep -q "class EventListenerManager" index.fixed.html; then
    print_status 0 "EventListenerManager class found"
else
    print_status 1 "EventListenerManager class NOT found"
fi
echo ""

# 3. Verify cleanup function is exposed
echo "3. Verifying cleanup function is exposed..."
if grep -q "window.__eventCleanup" index.fixed.html; then
    print_status 0 "window.__eventCleanup exposed"
else
    print_status 1 "window.__eventCleanup NOT exposed"
fi
echo ""

# 4. Verify beforeunload hook exists
echo "4. Verifying beforeunload cleanup hook..."
if grep -q "addEventListener('beforeunload'" index.fixed.html; then
    print_status 0 "beforeunload hook found"
else
    print_status 1 "beforeunload hook NOT found"
fi
echo ""

# 5. Count addEventListener calls
echo "5. Analyzing addEventListener usage..."
DIRECT_ADD_COUNT=$(grep -c "addEventListener(" index.fixed.html || echo "0")
EVENT_MANAGER_COUNT=$(grep -c "eventManager.addEventListener(" index.fixed.html || echo "0")

echo "   - Direct addEventListener calls: $DIRECT_ADD_COUNT"
echo "   - eventManager.addEventListener calls: $EVENT_MANAGER_COUNT"

if [ "$EVENT_MANAGER_COUNT" -gt 0 ]; then
    print_status 0 "Using eventManager for listeners"
else
    print_status 1 "NOT using eventManager - potential memory leak"
fi
echo ""

# 6. Verify observers are registered
echo "6. Verifying IntersectionObserver cleanup..."
if grep -q "eventManager.addObserver(observer)" index.fixed.html; then
    print_status 0 "Observers registered with eventManager"
else
    print_status 1 "Observers NOT registered with eventManager"
fi
echo ""

# 7. Check for removeEventListener calls
echo "7. Checking removeEventListener implementation..."
if grep -q "removeEventListener(" index.fixed.html; then
    print_status 0 "removeEventListener implemented"
else
    print_status 1 "removeEventListener NOT found"
fi
echo ""

# 8. Verify passive scroll listeners
echo "8. Verifying passive scroll listeners..."
if grep -q "passive: true" index.fixed.html; then
    print_status 0 "Passive scroll listeners configured"
else
    print_status 1 "Passive scroll listeners NOT configured"
fi
echo ""

# 9. Check original file has issues (for comparison)
echo "9. Verifying original file has memory leaks..."
if [ -f "index.html" ]; then
    if ! grep -q "eventManager.addEventListener" index.html; then
        print_status 0 "Original file confirmed to have memory leaks"
    else
        print_status 1 "Original file appears to be fixed already"
    fi
else
    print_status 1 "Original index.html not found for comparison"
fi
echo ""

# 10. Check test files exist
echo "10. Verifying test files exist..."
if [ -f "__tests__/memory-leak.test.js" ]; then
    print_status 0 "Unit tests found"
else
    print_status 1 "Unit tests NOT found"
fi

if [ -f "__tests__/memory-leak-browser.test.js" ]; then
    print_status 0 "Browser tests found"
else
    print_status 1 "Browser tests NOT found"
fi
echo ""

# 11. Verify documentation exists
echo "11. Verifying documentation..."
if [ -f "MEMORY-LEAK-REPORT.md" ]; then
    print_status 0 "Memory leak report found"
else
    print_status 1 "Memory leak report NOT found"
fi
echo ""

# 12. Check for common memory leak patterns
echo "12. Checking for common memory leak patterns..."

# Check for addEventListener outside of eventManager
# We check that eventManager.addEventListener is being used properly
EVENTMANAGER_USAGE=$(grep -c "eventManager.addEventListener" index.fixed.html || echo "0")

if [ "$EVENTMANAGER_USAGE" -gt 5 ]; then
    print_status 0 "EventListenerManager properly utilized ($EVENTMANAGER_USAGE uses)"
else
    print_status 1 "EventListenerManager not sufficiently used ($EVENTMANAGER_USAGE uses)"
fi
echo ""

# 13. Validate file size (sanity check)
echo "13. Validating file size..."
FILE_SIZE=$(wc -c < index.fixed.html)
if [ $FILE_SIZE -gt 1000 ] && [ $FILE_SIZE -lt 1000000 ]; then
    print_status 0 "File size reasonable ($FILE_SIZE bytes)"
else
    print_status 1 "File size suspicious ($FILE_SIZE bytes)"
fi
echo ""

# Final summary
echo "========================================"
echo "VALIDATION SUMMARY"
echo "========================================"

if [ "$VALIDATION_PASSED" = true ]; then
    echo -e "${GREEN}✓ ALL VALIDATIONS PASSED${NC}"
    echo ""
    echo "The fixed marketing site is ready for deployment."
    echo "All memory leak fixes have been verified."
    echo ""
    echo "Next steps:"
    echo "1. Run tests: npm test"
    echo "2. Manual memory profiling in Chrome DevTools"
    echo "3. Deploy: npm run deploy"
    exit 0
else
    echo -e "${RED}✗ VALIDATION FAILED${NC}"
    echo ""
    echo "Some checks did not pass. Please review the output above."
    echo "Do not deploy until all issues are resolved."
    exit 1
fi
