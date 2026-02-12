#!/bin/bash
# Memory Sync Script for Claude Code
# Runs on Stop to update sprint context in memory
# Keeps Current_Sprint entity up to date with latest git state

cd /Users/tuepham/uplift-final-final-18698-62030 2>/dev/null || exit 0

MEMORY_DIR="$HOME/.claude/projects/-Users-tuepham-uplift-final-final-18698-62030/memory"

# Update sprint-status.md with current state
{
    echo "# Sprint Status (auto-updated)"
    echo ""
    echo "Last sync: $(date '+%Y-%m-%d %H:%M')"
    echo "Branch: $(git branch --show-current 2>/dev/null)"
    echo ""
    echo "## Uncommitted Changes"
    git diff --name-only 2>/dev/null | head -20
    echo ""
    echo "## Recent Commits (last 5)"
    git log --oneline -5 2>/dev/null
    echo ""
    echo "## Modified Service Modules"
    git diff --name-only 2>/dev/null | grep "src/services/" | sed 's|src/services/portfolioStrategy/services/||' | sort -u
} > "$MEMORY_DIR/sprint-status.md" 2>/dev/null

echo "Memory synced at $(date '+%H:%M')"
