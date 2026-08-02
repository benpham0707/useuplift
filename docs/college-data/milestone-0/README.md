# Milestone 0: User Observation and Data Contract

Status: **in progress — observation gate open**

This directory is the evidence record for the college database's first milestone.
It prevents provisional product assumptions from becoming student-facing claims
without review.

## Deliverables

| Deliverable | Status | Evidence |
|---|---|---|
| Observe five target students doing college discovery unassisted | Pending external sessions | `observation-protocol.md` and `observation-synthesis.md` |
| Record decisions, sources, time, confusion, trust signals, and unfamiliar schools | Ready to collect | Per-session worksheet in `observation-protocol.md` |
| Review the provisional field manifest | Provisional contract written | `student-facing-field-contract.md` |
| Freeze the student-facing subset from observation and safety evidence | Blocked on five sessions | Decision table in `observation-synthesis.md` |
| Write reviewed field definitions and prohibited claims | Draft complete; final approval pending synthesis | `student-facing-field-contract.md` and `prohibited-claims.md` |

## Exit gate

Milestone 0 is complete only when all of the following are true:

1. Five eligible students have completed the same core discovery task without
   coaching from the observer.
2. Each session has a consent-safe record with no unnecessary personally
   identifiable information.
3. The synthesis identifies repeated decisions and trust failures; a single
   student's preference is not presented as universal evidence.
4. Every provisional field is marked `keep`, `defer`, or `remove`, with an
   observation reference and safety rationale.
5. Product and engineering reviewers sign and date the freeze decision.
6. No prohibited claim or unsupported competitor-derived content is approved.

Until this gate closes, engineering may build identity, release, provenance, and
ingestion foundations, but UI scope must not expand based on the provisional
field list.

## Source boundaries

Foundation sources are primary public releases from IPEDS and College Scorecard.
Niche, U.S. News, and similar products may inform competitive research, but their
rankings, descriptions, reviews, scores, methodologies, and compiled values are
not input data for Uplift.

