#!/usr/bin/env bash
# tools/corpus/run-phase2-live.sh
#
# One-command bootstrap for Phase 2 live deployment.
# Applies migration, seeds embeddings, runs retrieval-quality tests.
#
# Usage:
#   ./tools/corpus/run-phase2-live.sh
#
# Prerequisites (sources from project .env automatically):
#   OPENAI_API_KEY
#   SUPABASE_URL  (or VITE_SUPABASE_URL)
#   SUPABASE_SERVICE_ROLE_KEY
#
# Safe to re-run — migration is idempotent, seeder uses content-addressable skip-embed.

set -euo pipefail

cd "$(dirname "$0")/../.."
REPO_ROOT="$(pwd)"

echo "════════════════════════════════════════════════════════════════"
echo "Phase 2 live deployment — Uplift corpus embeddings"
echo "════════════════════════════════════════════════════════════════"

# ─────────────────────────────────────────────────────────────────────
# Step 0: Load .env if it exists (non-strict — env vars already set win)
# ─────────────────────────────────────────────────────────────────────
if [ -f "${REPO_ROOT}/.env" ]; then
  echo "[step 0] Loading .env ..."
  set -a
  # shellcheck disable=SC1090
  . "${REPO_ROOT}/.env"
  set +a
fi

# ─────────────────────────────────────────────────────────────────────
# Step 1: Check required env vars
# ─────────────────────────────────────────────────────────────────────
echo "[step 1] Checking required environment variables..."
MISSING=()
[ -z "${OPENAI_API_KEY:-}" ] && MISSING+=("OPENAI_API_KEY")
[ -z "${SUPABASE_URL:-}${VITE_SUPABASE_URL:-}" ] && MISSING+=("SUPABASE_URL or VITE_SUPABASE_URL")
[ -z "${SUPABASE_SERVICE_ROLE_KEY:-}${SUPABASE_SERVICE_KEY:-}" ] && MISSING+=("SUPABASE_SERVICE_ROLE_KEY or SUPABASE_SERVICE_KEY")
if [ "${#MISSING[@]}" -gt 0 ]; then
  echo "  ✗ Missing env vars: ${MISSING[*]}"
  exit 1
fi
echo "  ✓ All required env vars present"

# ─────────────────────────────────────────────────────────────────────
# Step 2: Apply migration (idempotent)
# ─────────────────────────────────────────────────────────────────────
echo "[step 2] Applying migration 20260420000000_add_corpus_embeddings.sql..."
if command -v supabase >/dev/null 2>&1; then
  echo "  Using supabase CLI"
  supabase db push --include-all || { echo "  ✗ Migration failed"; exit 1; }
else
  echo "  ⚠ supabase CLI not found — apply migration manually via Supabase dashboard or psql"
  echo "  File: supabase/migrations/20260420000000_add_corpus_embeddings.sql"
  echo "  Skipping step 2, continuing to step 3..."
fi

# ─────────────────────────────────────────────────────────────────────
# Step 3: Seed embeddings (content-addressable; safe to re-run)
# ─────────────────────────────────────────────────────────────────────
echo "[step 3] Seeding corpus embeddings..."
npx tsx tools/corpus/embedCorpus.ts || { echo "  ✗ Seeding failed"; exit 1; }

# ─────────────────────────────────────────────────────────────────────
# Step 4: Run retrieval quality tests
# ─────────────────────────────────────────────────────────────────────
echo "[step 4] Running retrieval quality golden-query tests..."
npx tsx tests/corpus/test-retrieval-quality.ts || { echo "  ✗ Retrieval quality tests failed — inspect failures above"; exit 1; }

# ─────────────────────────────────────────────────────────────────────
# Step 5: Run integrity + derivation tests as final gate
# ─────────────────────────────────────────────────────────────────────
echo "[step 5] Final gate: integrity + derivation tests..."
npx tsx tests/corpus/test-corpus-integrity.ts || { echo "  ✗ Integrity test failed"; exit 1; }
npx tsx tests/corpus/test-derivation-correctness.ts || { echo "  ✗ Derivation test failed"; exit 1; }

echo "════════════════════════════════════════════════════════════════"
echo "Phase 2 live deployment complete — corpus embeddings live."
echo "════════════════════════════════════════════════════════════════"
