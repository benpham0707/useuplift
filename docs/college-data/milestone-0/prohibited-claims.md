# Prohibited College Claims and Content

These rules apply to UI copy, APIs, generated explanations, analytics labels,
fixtures, demos, and internal product terminology. A disclaimer does not make a
prohibited claim acceptable.

## Never claim from the foundation data

- Individual admission probability or “chance of acceptance.”
- Reach, match, safety, target, likely, or guaranteed-admission classification.
- Overall fit, compatibility, recommendation, confidence, or quality score.
- “Best,” “top,” “elite,” or ranking position derived from Uplift's federal data.
- Strong teaching, supportive culture, student happiness, campus vibe, safety,
  prestige, or program quality without an independently approved source contract.
- Current major availability from historical CIP completions or Scorecard program
  percentage records.
- Personal affordability, expected aid, or future net price from a published
  tuition, cost, average net price, or income-bracket benchmark.
- Individual earnings, career success, return on investment, or salary promise
  from historical cohort outcomes.
- Causal language such as “this college produces higher earnings” from aggregate
  observational data.
- An inferred successor campus when an institution closes, merges, or changes
  identity without a reviewed authoritative relationship source.

## Prohibited source reuse

Do not copy, scrape, paraphrase, or seed from competitor rankings, descriptions,
reviews, grades, scores, photos, logos, compiled statistics, or proprietary
methodologies. Niche and U.S. News are competitive references, not data sources.

Do not expose private raw-object paths, signed storage URLs, secret API keys,
unreviewed institution submissions, or internal quality notes through public APIs.

## Required replacements

| Avoid | Use only when supported |
|---|---|
| “You are a strong match” | “Matches your selected filters” followed by the exact factual filters |
| “Affordable for you” | “Historical average net price” with cohort/year and a net-price-calculator action |
| “Offers your major” | “Recent degree evidence in [broad CIP family]” with reporting year |
| “30% chance of admission” | “Historical admission rate: 30%” with cohort/year and aggregate-context label |
| “High confidence data” | Explicit source, year, status, and missing/conflict labels |
| “Great outcomes” | The named historical outcome metric with its exact cohort and suppression state |

## Review gate

Any new derived label, score, generated description, manually curated attribute,
or non-federal source requires a versioned source/methodology proposal, rights
review where applicable, safe-language examples, failure states, and explicit
approval before entering the manifest.
