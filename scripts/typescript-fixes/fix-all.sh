#!/bin/bash
# Master TypeScript Error Fix Script
# Fixes TypeScript errors in groups with progress tracking

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
BOLD='\033[1m'
NC='\033[0m'

# Script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd /Users/aideveloper/ai-kit

# Banner
echo ""
echo "${BOLD}╔════════════════════════════════════════════════════╗${NC}"
echo "${BOLD}║   TypeScript Error Auto-Fix Suite                 ║${NC}"
echo "${BOLD}║   AI Kit Project                                   ║${NC}"
echo "${BOLD}╚════════════════════════════════════════════════════╝${NC}"
echo ""

# Function to count errors
count_errors() {
    npm run type-check 2>&1 | grep "error TS" | wc -l | tr -d ' '
}

# Function to run a fix script
run_fix() {
    local script_name=$1
    local description=$2

    echo ""
    echo "${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo "${BLUE}Running:${NC} $description"
    echo "${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

    bash "$SCRIPT_DIR/$script_name"
}

# Initial error count
echo "${YELLOW}Counting initial errors...${NC}"
initial_errors=$(count_errors)
echo "${BOLD}Initial error count: $initial_errors${NC}"
echo ""

# Show menu
echo "Select which fixes to apply:"
echo ""
echo "  ${BOLD}1)${NC} Fix All (Recommended)"
echo "  ${BOLD}2)${NC} Fix Configuration Only (TSConfig + JSX)"
echo "  ${BOLD}3)${NC} Fix Code Quality (Unused vars, process.env)"
echo "  ${BOLD}4)${NC} Fix Missing Imports"
echo "  ${BOLD}5)${NC} Generate Reports Only"
echo "  ${BOLD}6)${NC} Custom Selection"
echo "  ${BOLD}0)${NC} Exit"
echo ""
echo -n "Enter choice [0-6]: "
read choice

case $choice in
    1)
        echo "${GREEN}Running all fixes...${NC}"
        run_fix "01-fix-tsconfig.sh" "TypeScript Configuration"
        run_fix "05-fix-missing-imports.sh" "Missing Imports"
        run_fix "03-fix-process-env.sh" "process.env Access"
        run_fix "02-fix-unused-variables.sh" "Unused Variables"
        run_fix "04-fix-undefined-checks.sh" "Undefined Checks Report"
        ;;
    2)
        echo "${GREEN}Fixing configuration...${NC}"
        run_fix "01-fix-tsconfig.sh" "TypeScript Configuration"
        ;;
    3)
        echo "${GREEN}Fixing code quality...${NC}"
        run_fix "02-fix-unused-variables.sh" "Unused Variables"
        run_fix "03-fix-process-env.sh" "process.env Access"
        ;;
    4)
        echo "${GREEN}Fixing missing imports...${NC}"
        run_fix "05-fix-missing-imports.sh" "Missing Imports"
        ;;
    5)
        echo "${GREEN}Generating reports...${NC}"
        run_fix "04-fix-undefined-checks.sh" "Undefined Checks Report"
        ;;
    6)
        echo ""
        echo "Custom Selection:"
        echo -n "Fix TSConfig? [y/N]: "; read fix_tsconfig
        echo -n "Fix Unused Variables? [y/N]: "; read fix_unused
        echo -n "Fix process.env? [y/N]: "; read fix_env
        echo -n "Fix Missing Imports? [y/N]: "; read fix_imports
        echo -n "Generate Reports? [y/N]: "; read gen_reports

        [[ "$fix_tsconfig" =~ ^[Yy]$ ]] && run_fix "01-fix-tsconfig.sh" "TypeScript Configuration"
        [[ "$fix_unused" =~ ^[Yy]$ ]] && run_fix "02-fix-unused-variables.sh" "Unused Variables"
        [[ "$fix_env" =~ ^[Yy]$ ]] && run_fix "03-fix-process-env.sh" "process.env Access"
        [[ "$fix_imports" =~ ^[Yy]$ ]] && run_fix "05-fix-missing-imports.sh" "Missing Imports"
        [[ "$gen_reports" =~ ^[Yy]$ ]] && run_fix "04-fix-undefined-checks.sh" "Undefined Checks Report"
        ;;
    0)
        echo "Exiting..."
        exit 0
        ;;
    *)
        echo "${RED}Invalid choice${NC}"
        exit 1
        ;;
esac

# Final error count
echo ""
echo "${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo "${YELLOW}Counting final errors...${NC}"
final_errors=$(count_errors)

echo ""
echo "${BOLD}╔════════════════════════════════════════════════════╗${NC}"
echo "${BOLD}║                    SUMMARY                         ║${NC}"
echo "${BOLD}╠════════════════════════════════════════════════════╣${NC}"
printf "${BOLD}║${NC}  Initial errors: %-33s ${BOLD}║${NC}\n" "$initial_errors"
printf "${BOLD}║${NC}  Final errors:   %-33s ${BOLD}║${NC}\n" "$final_errors"

errors_fixed=$((initial_errors - final_errors))
if [ $errors_fixed -gt 0 ]; then
    printf "${BOLD}║${NC}  ${GREEN}Errors fixed:   %-33s${NC} ${BOLD}║${NC}\n" "$errors_fixed"
    percentage=$((errors_fixed * 100 / initial_errors))
    printf "${BOLD}║${NC}  ${GREEN}Improvement:    %-32s${NC} ${BOLD}║${NC}\n" "$percentage%"
elif [ $errors_fixed -lt 0 ]; then
    printf "${BOLD}║${NC}  ${RED}Errors added:   %-33s${NC} ${BOLD}║${NC}\n" "$((errors_fixed * -1))"
else
    printf "${BOLD}║${NC}  No change in error count                       ${BOLD}║${NC}\n"
fi

echo "${BOLD}╚════════════════════════════════════════════════════╝${NC}"
echo ""

if [ $final_errors -eq 0 ]; then
    echo "${GREEN}${BOLD}🎉 All TypeScript errors fixed!${NC}"
else
    echo "${YELLOW}Next steps:${NC}"
    echo "  1. Review changes: ${BLUE}git diff${NC}"
    echo "  2. Run tests: ${BLUE}npm test${NC}"
    echo "  3. Check remaining errors: ${BLUE}npm run type-check${NC}"
    echo "  4. Review reports in: ${BLUE}typescript-undefined-report.md${NC}"
fi

echo ""
