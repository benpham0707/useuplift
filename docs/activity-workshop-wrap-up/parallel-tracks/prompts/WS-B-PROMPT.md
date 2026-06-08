You are producing the **compliance + consent design** for Uplift's outcomes data capture. This unblocks Phase 0.3 of the Activity Workshop wrap-up, which the adversarial review flagged as a BLOCKER (finding B4): the proposed migration links underage students' education records to admission decisions with no consent plumbing.

Goal: a defensible engineering-side design that a real lawyer can sign off on with minor edits.

## Read first (in order)

1. `docs/activity-workshop-wrap-up/01-MASTER-PLAN.md` §0.3 — outcomes flywheel spec
2. `docs/activity-workshop-wrap-up/work-logs/forge-plan-review.md` — review finding B4 (full context)
3. `CLAUDE.md` — Clerk auth (user IDs are TEXT not UUID), Supabase RLS pattern
4. `src/integrations/supabase/` — existing schema patterns
5. `supabase/migrations/` — existing migration style

## Produce — one design doc with 7 sections

### 1. Applicability analysis
Plain-language answers (cite statutes, write for engineers, not lawyers):
- **FERPA**: applies to Uplift? (Likely NO — FERPA covers federally-funded schools, not third-party ed-tech. But state laws (CA AB-1584, NY Ed Law §2-D, IL SOPPA, etc.) impose FERPA-like requirements on ed-tech. Map which states matter.)
- **COPPA**: applies? (Threshold: users <13. Uplift's cohort is 17–18; need age-gate for stragglers.)
- **GDPR/CCPA**: applies? (Yes for CA residents; international users may trigger GDPR.)
- **Actual legal exposure**: of linking `essays → admission_decision` and retaining indefinitely?

### 2. Consent flow design
- UI states: when does the consent prompt appear (signup? post-application?)
- Copy: exact text of the ask (≤80 words, written for a 17-year-old)
- Under-18 path: parental consent (email verification of guardian, or notarized form for younger minors)
- Granular consent: separate flags for (a) collect outcomes, (b) use in aggregate research, (c) use in personalized matching against future students
- Withdrawal: 1-click revoke endpoint spec

### 3. Schema changes to Phase 0.3 migration
- New columns on `application_outcomes`: `consent_version`, `consent_timestamp`, `parental_consent_id` (nullable)
- New table `consent_records`: `user_id`, `consent_type`, `version`, `timestamp`, `withdrawn_at`, `withdrawal_reason`
- New table `parental_consents`: `user_id`, `guardian_email`, `guardian_relationship`, `verification_method`, `verified_at`
- RLS policies for all three (users see own records + guardians see linked minor records)

Write paste-ready SQL for each migration.

### 4. Retention policy
- How long is outcomes data kept? (Recommendation: 7 years post-decision, then anonymize.)
- Anonymization vs deletion — which works for the data-flywheel use case?
- Right-to-delete (GDPR Art. 17 + CCPA): hard delete or anonymize? Endpoint spec.

### 5. Aggregate research vs personalization split
- Personalization ("students like you saw outcomes at X") requires persistent individual identifiers — higher consent bar
- Aggregate trend analysis can use fully-anonymized data — lower bar
- Design the boundary so the high-bar consent isn't a hard requirement for the flywheel to function at all

### 6. Audit & access controls
- Internal access: who at Uplift can query outcomes data?
- Audit log: every query logged (`queried_by`, `timestamp`, `query_hash`)
- Quarterly access review process

### 7. Open questions for legal review
- What the engineering design CANNOT decide alone
- Recommended lawyer specialty (ed-tech privacy + minors)
- Estimated legal review timeline (1–3 weeks)

## Quality bar

- Every statute citation has a section reference
- Every UI claim has mockup or exact copy
- Every schema change is paste-ready SQL
- No "we should consider" — every section ends with a concrete recommendation
- §7 acknowledges what's uncertain — don't pretend completeness

## Output

Write to: `docs/activity-workshop-wrap-up/compliance/outcomes-consent-design.md`

Header:
```markdown
# Outcomes Data — Consent & Compliance Design
> Engineering-side design. NOT a legal opinion. Requires lawyer review before migration applies.
> Author: <name>. Date: <date>. Status: <draft|reviewed|legally-cleared>.
```

Also produce: `docs/activity-workshop-wrap-up/compliance/EXEC-SUMMARY.md` — 1-page TL;DR for sharing with legal counsel (what we're collecting, why, who has access, retention, 3 highest-risk open questions).

Begin by researching applicable statutes (use WebSearch/WebFetch as needed). FERPA + state ed-tech privacy laws first, then COPPA age-gate requirements.
