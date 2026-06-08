# Corpus Ingestion Pipeline

S-tier-only ingestion for `src/services/essayIntelligence/corpus/external/`.

## Pipeline

1. **Scrape** (`scrape-school-etw.ts`) — pulls JHU/Tufts/Conn College/
   Hamilton/MIT pages into `corpus/external/raw/<source_id>/`
2. **Normalize** (`normalize-essays.ts`) — converts raw HTML/PDF/text into
   `EssayRecord` JSON in `corpus/external/essays/`
3. **Transcribe** (`transcribe-video.ts`) — Whisper over user-supplied
   YouTube URLs of named-AO/dean talks → `corpus/external/transcripts/`
4. **Mine books** (`mine-book.ts`) — runs Claude over user-supplied EPUBs
   in `corpus/external/raw/books/` → heuristics
5. **Extract heuristics** (`extract-heuristics.ts`) — Claude pass over every
   essay+commentary and every transcript → `HeuristicRecord` JSON in
   `corpus/external/heuristics/`
6. **Dedupe + cluster** (`dedupe-heuristics.ts`) — semantic dedupe across
   sources, cluster by `applies_to` tag

## Run order

```bash
npx tsx scripts/corpusIngestion/scrape-school-etw.ts
npx tsx scripts/corpusIngestion/normalize-essays.ts
# user supplies videos.txt + EPUBs first:
npx tsx scripts/corpusIngestion/transcribe-video.ts
npx tsx scripts/corpusIngestion/mine-book.ts
npx tsx scripts/corpusIngestion/extract-heuristics.ts
npx tsx scripts/corpusIngestion/dedupe-heuristics.ts
```

## Cost ceiling

Hard cap $5 per script invocation per CLAUDE.md feedback_cost_budget rule.
Anything above must be approved before running.
