# External Corpus — S-Tier Sources Only

Scraped admit essays and named-AO commentary used as transformative reference
material for prompt construction (few-shot anchors, retrieval-augmented
generation in `landingDetector`, `aoFirstRead`, `howlerPass`, L3.5, L5).

**Not redistributed.** `raw/`, `essays/`, and `transcripts/` are gitignored.
Only structured derivatives in `heuristics/` are committed.

## Inclusion bar (S-tier only)

A source is admitted only if it satisfies BOTH:

1. **Author credibility:** named former admissions officer at a top-30 school,
   official school-published material with named AO commentary, or named
   admissions dean speaking on a credentialed channel (Khan Academy, the
   school's own publication, NYT, Inside Higher Ed, Chronicle of Higher Ed).
2. **Attribution traceable:** every essay and every commentary line has a
   permanent URL or printed citation back to the named source.

**Excluded by policy:** Reddit, anonymous Twitter, YouTube creators without
verified AO/dean credentials, prepscholar/collegevine, commercial counseling
firms (Crimson, BetterCollegeApps), College Essay Guy (counselor not AO —
admitted only with explicit `annotation_perspective: "counselor"` tag and
downweighted at retrieval).

## Folder layout

- `raw/` — unprocessed HTML/PDF/audio dumps from scrapes (gitignored)
- `essays/` — normalized JSON, one file per essay (gitignored — copyright)
- `transcripts/` — Whisper transcripts of named-AO video/podcast (gitignored)
- `heuristics/` — structured taste rules extracted from above (committed)
- `sources.json` — registry of every ingested source with credibility tag

## Schemas

See `schemas.ts` for the canonical TS types. Short version:

```
EssayRecord:
  id, source_id, school_destination, year, prompt, essay_text,
  ao_commentary[], annotation_perspective: "ao" | "dean" | "counselor",
  archetype_hints[], outcome: "admitted" | "rejected" | "unknown"

HeuristicRecord:
  id, source_id, applies_to: ("opener"|"closer"|"voice"|"structure"
    |"authenticity"|"school_fit"|"ao_fatigue"|"ao_delight"|"howler")[],
  pattern, judgment, school_specific?, confidence: 0..1, quote, source_url
```
