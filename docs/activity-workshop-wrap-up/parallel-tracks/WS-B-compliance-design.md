# WS-B: Outcomes Consent & Compliance Design

> **Purpose**: Unblock the outcomes flywheel (Phase 0.3) by producing a defensible consent + retention design for FERPA/COPPA-adjacent ed-tech serving high-school applicants. Without this, the 0.3 migration is a legal halt.
> **Owner**: Tue (with legal/compliance researcher agent — see prompt below) — final design must be reviewed by a real lawyer before migration applies
> **Estimated time**: 2–3 days research + 1 day design synthesis
> **Output location**: `docs/activity-workshop-wrap-up/compliance/outcomes-consent-design.md`

---

## Paste this prompt into a fresh session

You are producing the **compliance + consent design** for Uplift's outcomes data capture. The plan flagged this as a BLOCKER (review finding B4). Goal: a defensible design that a real lawyer can sign off on with minor edits.

### What to read first

1. `docs/activity-workshop-wrap-up/01-MASTER-PLAN.md` §0.3 — the outcomes flywheel spec
2. `docs/activity-workshop-wrap-up/work-logs/forge-plan-review.md` — review finding B4 (legal context)
3. `CLAUDE.md` — Clerk auth model (user IDs are TEXT not UUID), Supabase RLS pattern
4. `src/integrations/supabase/` — existing schema patterns to follow
5. `supabase/migrations/` — existing migration style

### What to produce

A single design doc covering 7 sections:

#### 1. Applicability analysis
Plain-language answer to:
- Does FERPA apply to Uplift? (Likely NO — FERPA covers schools that receive federal funds, not third-party ed-tech. But state laws (CA AB-1584, NY Ed Law §2-D, IL SOPPA, etc.) impose FERPA-like requirements on ed-tech vendors. Map which states matter.)
- Does COPPA apply? (Threshold: users <13. Uplift's primary cohort is 17–18, but younger users may sign up. Need age gate.)
- Does GDPR/CCPA apply? (Yes for CA residents; international students may trigger GDPR.)
- What is the actual legal exposure of linking `essays → admission_decision` and retaining indefinitely?

Cite specific statutes. Don't bury in jargon — write for an engineering audience.

#### 2. Consent flow design
- UI states: when does the consent prompt appear (signup? post-application?)
- Copy: exact text of the consent ask (≤80 words, written for a 17-year-old)
- For under-18 users: parental-consent path (email verification of guardian, or notarized form for minors of certain ages?)
- Granular consent: separate flags for (a) collect outcomes, (b) use in aggregate research, (c) use in personalized matching against future students
- Withdrawal: 1-click revoke endpoint

#### 3. Schema changes to Phase 0.3 migration
- New columns on `application_outcomes`: `consent_version`, `consent_timestamp`, `parental_consent_id` (nullable)
- New table: `consent_records` (`user_id`, `consent_type`, `version`, `timestamp`, `withdrawn_at`, `withdrawal_reason`)
- New table: `parental_consents` (`user_id`, `guardian_email`, `guardian_relationship`, `verification_method`, `verified_at`)
- RLS policies for all three (users see own records + guardians see linked minor records)

#### 4. Retention policy
- How long is outcomes data kept? (Recommendation: 7 years post-decision, then anonymize.)
- Anonymization vs deletion: which is acceptable for the data flywheel use case?
- Right-to-delete (GDPR Art. 17 + CCPA): hard delete or anonymize? Endpoint spec.

#### 5. Aggregate research vs personalization split
- Data used for "students like you saw outcomes at X" requires individual identifiers persistent — different consent
- Aggregate trend analysis can use fully-anonymized data — lower bar
- Design the boundary so the high-bar consent isn't a hard requirement for the flywheel to function

#### 6. Audit & access controls
- Internal access: who at Uplift can query outcomes data?
- Audit log: every query against outcomes data logged (queried_by, timestamp, query_hash)
- Quarterly access review

#### 7. Open questions for legal review
- List what the engineering design CANNOT decide
- Recommended lawyer or firm specialty (ed-tech privacy + minors)
- Estimated legal review timeline (1–3 weeks for a competent ed-tech privacy attorney)

### Quality bar

- Every statute citation has a section reference
- Every UI claim has a mockup or exact copy
- Every schema change is paste-ready SQL
- No "we should consider" — every section ends with a concrete recommendation
- Acknowledges what's uncertain in §7, doesn't pretend completeness

### Output structure

Write to `docs/activity-workshop-wrap-up/compliance/outcomes-consent-design.md`. Header:

```markdown
# Outcomes Data — Consent & Compliance Design
> Engineering-side design. NOT a legal opinion. Requires lawyer review before migration applies.
> Author: <name>. Date: <date>. Status: <draft|reviewed|legally-cleared>.
```

### Bonus: deliver a 1-page summary

`docs/activity-workshop-wrap-up/compliance/EXEC-SUMMARY.md` — 1-page TL;DR for sharing with legal counsel that names what we're collecting, why, who has access, retention, and the 3 highest-risk open questions.

---

## Status

- [ ] Started
- [ ] Applicability analysis complete
- [ ] Consent flow drafted
- [ ] Schema migrations drafted
- [ ] Retention policy drafted
- [ ] Sent for legal review (lawyer name: _____)
- [ ] Legal feedback incorporated
- [ ] Migration ready to apply
