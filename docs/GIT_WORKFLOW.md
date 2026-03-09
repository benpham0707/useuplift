# Git Workflow & Branching Strategy

> **Read this file when performing git operations: branching, committing, pushing, or creating PRs.**
> Referenced from CLAUDE.md — not loaded every session.

---

## Branching Strategy

> **`main` is the production branch. Never push directly to main. All changes go through feature branches and PRs.**

**Branch naming convention:**

| Prefix | Purpose | Example |
|--------|---------|---------|
| `feat/` | New features or capabilities | `feat/voice-profile-engine` |
| `fix/` | Bug fixes | `fix/credit-deduction-race` |
| `refactor/` | Code restructuring, no behavior change | `refactor/workshop-stage-types` |
| `chore/` | Tooling, config, CI, dependency updates | `chore/upgrade-anthropic-sdk` |
| `test/` | Adding or improving tests | `test/activity-pipeline-e2e` |
| `docs/` | Documentation only | `docs/api-endpoint-reference` |

Branch names: lowercase, hyphens, short but descriptive. No UUIDs, no random suffixes.

## Workflow

```
1. git checkout main && git pull origin main
2. git checkout -b feat/my-feature
3. Make atomic commits on the feature branch
4. git push -u origin feat/my-feature
5. gh pr create --base main --title "feat: description" --body "..."
6. After review/approval, merge via GitHub PR (squash or merge commit)
7. Delete the branch after merge (local + remote)
```

## Rules (enforced by pre-push hook)

1. **No direct pushes to `main`** — pre-push hook blocks this. All changes via PRs.
2. **Branch from latest `main`** — always pull before branching.
3. **One feature per branch** — don't bundle unrelated changes.
4. **Keep branches short-lived** — merge or close within days. Delete after merge.

## For Agent Swarms / Worktrees

- Teammates use the same naming convention: `feat/{role}-{description}`
- Worktree branches merge into the Lead's feature branch (not directly into main)
- The Lead opens the final PR to main after integrating all teammate work

## PR Standards

- Title follows conventional format: `feat:`, `fix:`, `refactor:`, etc.
- Body includes Summary (what and why) and Test Plan sections
- Tag the other co-founder for review on significant changes
- PRs touching only non-functional files (docs, comments, config) can be self-merged
