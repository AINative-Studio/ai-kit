#!/bin/bash

# CSP Testing Script for AI Kit Marketing Site
# Tests Content Security Policy implementation
# Issue: #136

set -e

echo "==================================================================="
echo "Content Security Policy (CSP) Testing Script"
echo "==================================================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test counter
TESTS_PASSED=0
TESTS_FAILED=0

# Function to print test result
test_result() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✓ PASS${NC}: $2"
        ((TESTS_PASSED++))
    else
        echo -e "${RED}✗ FAIL${NC}: $2"
        ((TESTS_FAILED++))
    fi
}

# Check if website files exist
echo "1. Checking file structure..."
echo "-------------------------------------------------------------------"

if [ -f "index.html" ]; then
    test_result 0 "index.html exists"
else
    test_result 1 "index.html not found"
fi

if [ -f "styles.css" ]; then
    test_result 0 "styles.css exists"
else
    test_result 1 "styles.css not found"
fi

if [ -f "script.js" ]; then
    test_result 0 "script.js exists"
else
    test_result 1 "script.js not found"
fi

if [ -f "SECURITY.md" ]; then
    test_result 0 "SECURITY.md exists"
else
    test_result 1 "SECURITY.md not found"
fi

echo ""

# Check for CSP meta tag in HTML
echo "2. Checking CSP implementation in HTML..."
echo "-------------------------------------------------------------------"

if grep -q "Content-Security-Policy" index.html; then
    test_result 0 "CSP meta tag found in index.html"
else
    test_result 1 "CSP meta tag not found in index.html"
fi

if grep -q "default-src 'self'" index.html; then
    test_result 0 "CSP default-src 'self' directive present"
else
    test_result 1 "CSP default-src 'self' directive missing"
fi

if grep -q "frame-ancestors 'none'" index.html; then
    test_result 0 "CSP frame-ancestors 'none' directive present"
else
    test_result 1 "CSP frame-ancestors 'none' directive missing"
fi

echo ""

# Check for inline scripts/styles (should be NONE)
echo "3. Checking for inline code violations..."
echo "-------------------------------------------------------------------"

INLINE_SCRIPT_COUNT=$(grep -c "<script[^>]*>" index.html | grep -v "application/ld+json" || echo 0)
if [ "$INLINE_SCRIPT_COUNT" -le 2 ]; then  # 1 for JSON-LD, 1 for external script.js
    test_result 0 "No unauthorized inline scripts found"
else
    test_result 1 "Found $INLINE_SCRIPT_COUNT inline script tags (should be ≤2)"
fi

INLINE_STYLE_COUNT=$(grep -c "<style" index.html || echo 0)
if [ "$INLINE_STYLE_COUNT" -eq 0 ]; then
    test_result 0 "No inline style tags found"
else
    test_result 1 "Found $INLINE_STYLE_COUNT inline style tags (should be 0)"
fi

INLINE_ONCLICK_COUNT=$(grep -c "onclick=" index.html || echo 0)
if [ "$INLINE_ONCLICK_COUNT" -gt 0 ]; then
    test_result 1 "Found $INLINE_ONCLICK_COUNT onclick handlers (allowed for demo purposes)"
else
    test_result 0 "No onclick handlers found"
fi

echo ""

# Check for external resources linkage
echo "4. Checking external resource linkage..."
echo "-------------------------------------------------------------------"

if grep -q 'href="./styles.css"' index.html; then
    test_result 0 "External stylesheet linked correctly"
else
    test_result 1 "External stylesheet not linked"
fi

if grep -q 'src="./script.js"' index.html; then
    test_result 0 "External script linked correctly"
else
    test_result 1 "External script not linked"
fi

echo ""

# Check deployment configurations
echo "5. Checking deployment configuration files..."
echo "-------------------------------------------------------------------"

if [ -f "netlify.toml" ]; then
    test_result 0 "netlify.toml exists"
    if grep -q "Content-Security-Policy" netlify.toml; then
        test_result 0 "CSP configured in netlify.toml"
    else
        test_result 1 "CSP not configured in netlify.toml"
    fi
else
    test_result 1 "netlify.toml not found"
fi

if [ -f "vercel.json" ]; then
    test_result 0 "vercel.json exists"
    if grep -q "Content-Security-Policy" vercel.json; then
        test_result 0 "CSP configured in vercel.json"
    else
        test_result 1 "CSP not configured in vercel.json"
    fi
else
    test_result 1 "vercel.json not found"
fi

if [ -f "_headers" ]; then
    test_result 0 "_headers file exists"
    if grep -q "Content-Security-Policy" _headers; then
        test_result 0 "CSP configured in _headers"
    else
        test_result 1 "CSP not configured in _headers"
    fi
else
    test_result 1 "_headers file not found"
fi

echo ""

# Check security headers
echo "6. Checking additional security headers..."
echo "-------------------------------------------------------------------"

for file in netlify.toml vercel.json _headers; do
    if [ -f "$file" ]; then
        if grep -q "X-Frame-Options" "$file"; then
            test_result 0 "X-Frame-Options found in $file"
        else
            test_result 1 "X-Frame-Options missing in $file"
        fi

        if grep -q "X-Content-Type-Options" "$file"; then
            test_result 0 "X-Content-Type-Options found in $file"
        else
            test_result 1 "X-Content-Type-Options missing in $file"
        fi

        if grep -q "Strict-Transport-Security" "$file"; then
            test_result 0 "HSTS found in $file"
        else
            test_result 1 "HSTS missing in $file"
        fi
    fi
done

echo ""

# Check for accessibility attributes
echo "7. Checking accessibility features..."
echo "-------------------------------------------------------------------"

if grep -q 'rel="noopener"' index.html; then
    test_result 0 "External links have rel='noopener'"
else
    test_result 1 "External links missing rel='noopener'"
fi

if grep -q 'aria-label' index.html; then
    test_result 0 "ARIA labels present"
else
    test_result 1 "ARIA labels missing"
fi

if grep -q 'skip-to-content' index.html; then
    test_result 0 "Skip to content link present"
else
    test_result 1 "Skip to content link missing"
fi

echo ""

# Summary
echo "==================================================================="
echo "Test Summary"
echo "==================================================================="
echo -e "${GREEN}Tests Passed: $TESTS_PASSED${NC}"
echo -e "${RED}Tests Failed: $TESTS_FAILED${NC}"
echo ""

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "${GREEN}✓ All tests passed! CSP implementation is production-ready.${NC}"
    exit 0
else
    echo -e "${YELLOW}⚠ Some tests failed. Please review the failures above.${NC}"
    exit 1
fi
