# College database production cutover — 2026-08-02

The normalized college foundation and its validated active projection were
promoted from `uplift-staging` (`ussnqsnuygqpgldyqtvv`) to production `uplift`
(`zclaplpkuvxkrdwsgrul`) before staging retirement.

## Verified production state

| Object | Rows |
| --- | ---: |
| Canonical institutions | 5,110 |
| Institution identifiers | 7,149 |
| Institution attribute facts | 57,192 |
| Institution metric facts | 31,698 |
| Versioned college profiles | 12,024 |
| Versioned profile facts | 176,230 |
| Institution lookup rows | 12,024 |
| Private staged institution rows | 24,872 |
| Private staged metric rows | 75,476 |

Active projection `abcac548-43d6-43c2-af1d-2313bd7a3eba` matches staging:
2,706 profiles, 2,359 profiles with positive undergraduate enrollment, 43,016
field-level facts, and two attached official releases.

Production Storage now contains checksum-verified copies of `HD2023.zip` and
`Most-Recent-Cohorts-Institution_06102026.zip` in the private
`college-source-releases` bucket.

The obsolete 2,607 legacy `public.colleges` rows were removed after confirming
that `user_college_list` and `college_reports` contained zero rows. The legacy
table structures remain temporarily as compatibility shells for the older saved
college screen. The student-facing catalog reads only the versioned normalized
foundation.

Daily development and migration replay now use local Supabase. Hosted PR
validation uses Supabase Preview branches. No persistent staging project is
required at the current team and product stage.
