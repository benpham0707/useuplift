#!/bin/bash
# Session Context Injector for Claude Code
# Runs on SessionStart to provide dynamic project state

cd /Users/tuepham/uplift-final-final-18698-62030 2>/dev/null || exit 0

echo "=== Dynamic Session Context ==="

# Git state
echo ""
echo "## Git Status"
BRANCH=$(git branch --show-current 2>/dev/null)
echo "Branch: $BRANCH"
MODIFIED=$(git diff --name-only 2>/dev/null | wc -l | tr -d ' ')
STAGED=$(git diff --cached --name-only 2>/dev/null | wc -l | tr -d ' ')
UNTRACKED=$(git ls-files --others --exclude-standard 2>/dev/null | wc -l | tr -d ' ')
echo "Modified: $MODIFIED | Staged: $STAGED | Untracked: $UNTRACKED"

# Recent commits (last 3)
echo ""
echo "## Recent Commits"
git log --oneline -3 2>/dev/null

# TypeScript health (quick check, non-blocking)
echo ""
echo "## Quick Health"
if [ -f "package.json" ]; then
    echo "package.json: present"
fi
if [ -f "tsconfig.json" ]; then
    echo "tsconfig.json: present"
fi

# Modified service files (most relevant context)
MODIFIED_SERVICES=$(git diff --name-only 2>/dev/null | grep "src/services/" | head -5)
if [ -n "$MODIFIED_SERVICES" ]; then
    echo ""
    echo "## Modified Services"
    echo "$MODIFIED_SERVICES"
fi

echo ""
echo "=== End Session Context ==="
