# Provisional Student-Facing Field Contract v0

Status: **provisional pending five-student observation**

This contract narrows the federal-data foundation to fields that can be explained
truthfully. Observation may remove a field or change its priority. It may not add
unsupported claims or weaken source/cohort requirements.

“Latest” below means the latest accepted source reporting period, not ingestion
time. Missing, suppressed, and conflicting are distinct states; none renders as
zero. All displayed values carry source organization and reporting period.

| Field family | Type/unit and validity | Primary source/cohort | Safe student-facing use | Missing/suppressed/conflict behavior |
|---|---|---|---|---|
| UNITID | integer external ID | IPEDS HD | Stable identity; never a quality signal | Institution cannot enter the projection without a reviewed identity |
| Official name and aliases | text | IPEDS HD reporting year | Search and identity | Preserve prior names as dated aliases; do not guess fuzzy identity |
| City, state, ZIP | text; normalized state code | IPEDS HD reporting year | Location and state/region filtering | Say `Not reported` for missing locality; never infer from name |
| Latitude/longitude | decimal coordinates | IPEDS/Scorecard reporting year | Storage for later mapping | Not shown and not used for distance in v1 |
| Ownership | enum: public/private nonprofit/private for-profit | IPEDS HD | Factual type filter | `Not reported`; never collapse for-profit into nonprofit |
| Institutional level and active status | enum plus dated status | IPEDS HD | Two-/four-year context and truthful closure state | Conflicting status blocks normal detail and shows `Status needs verification` |
| Locale/campus setting | source taxonomy mapped to versioned Uplift enum | IPEDS/Scorecard with source year | Urban/suburban/rural discovery context | `Not reported`; no manual vibe label |
| Undergraduate enrollment | nonnegative integer, students | Scorecard/IPEDS undergraduate cohort | Historical size context | `Not reported`; never substitute total enrollment |
| Admission rate | decimal 0–1, fall admissions cohort | Scorecard mapped to IPEDS ADM | Historical aggregate context only | Suppressed stays suppressed; never turn into individual probability |
| SAT reading/math 25th and 75th percentiles | integer 200–800 per section | Scorecard/IPEDS ADM, same cohort as labeled | Historical submitted-score context | Show available components with `Partial data`; never impute a range |
| ACT composite 25th and 75th percentiles | integer 1–36 | Scorecard/IPEDS ADM, labeled cohort | Historical submitted-score context | Show `Partial data` or `Not reported`; never impute |
| In-/out-of-state tuition | USD per academic year | Scorecard/IPEDS IC | Published tuition context with residency and year | Never substitute for total cost or likely price |
| Cost of attendance | USD per academic year | College Scorecard | Published total-cost context | `Not reported`; never substitute tuition |
| Average net price | USD, documented cohort/year | College Scorecard | Historical affordability benchmark | Label as average and historical; not a personal estimate |
| Net price by income bracket | USD, exact documented bracket | College Scorecard | Historical bracket-specific benchmark when explicitly selected | No interpolation; do not expose profile income or imply an aid offer |
| Pell Grant share | decimal 0–1, award year | Scorecard/IPEDS SFA | Access context | Not a school-quality or individual-eligibility signal |
| First-year retention | decimal 0–1, cohort labeled | Scorecard/IPEDS | Historical persistence context | Do not mix full-/part-time or cohort definitions |
| Completion rate | decimal 0–1, metric cohort labeled | Scorecard/IPEDS | Historical completion context | Never compare mismatched time horizons silently |
| Median earnings ten years after entry | USD, exact years-after-entry cohort | College Scorecard | Historical cohort outcome context | Preserve suppression; not a salary promise or program-level claim |
| Program percentage by two-digit CIP family | decimal 0–1, award/reporting year | Scorecard/IPEDS | Recent degree-production evidence for a broad field | Say `Recent program evidence`; never claim current major availability |
| Official institution website | normalized `https`/`http` URL | IPEDS/Scorecard | User verification action | Omit invalid/private URLs and show an unavailable action |
| Official net-price calculator | normalized `https`/`http` URL | Scorecard or reviewed institution source | Affordability verification action | Omit invalid URL; do not generate or guess one |
| Public release citation | normalized public URL plus source metadata | Accepted release metadata | Inspect source/methodology | Private object locations never enter the public response |

## Supported starting context

The first release may prefill only these editable values when they exist:

1. field interest;
2. state or region;
3. ownership/type;
4. campus setting;
5. annual planning budget.

Profile provenance and user identifiers are not exposed in shareable URLs. Annual
planning budget is a filter/input, not a claim that a college is affordable.

## Precedence and display rules

1. Identity and characteristics prefer the latest accepted IPEDS release; final
   beats provisional only for the same reporting period.
2. Admissions, enrollment, price, aid, retention, and completion require matching
   cohort semantics before comparison.
3. Net price and outcomes use College Scorecard's documented cohort and
   suppression state.
4. Program records are historical evidence, not a live catalog.
5. Preserve candidate facts when sources conflict. Display a winner only when the
   versioned precedence rule resolves it; otherwise display `Conflicting data`.

## Freeze procedure

After observations, each field receives `keep`, `defer`, or `remove` in
`observation-synthesis.md`. The frozen v1 contract must record display priority,
safe-language template, source/cohort mapping, range/unit validation, missing and
suppressed behavior, conflict precedence, and a test fixture before UI use.

