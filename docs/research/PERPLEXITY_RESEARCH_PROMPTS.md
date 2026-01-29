# Perplexity Deep Research Prompts for PASS System

> **Instructions**: Run each prompt separately in Perplexity Pro with Deep Research mode enabled. Each prompt should be run independently to get maximum depth. Save outputs for integration into the codebase.

---

## PROMPT 1: Top 30 College Admission Statistics & Benchmarks (2024-2025 Cycle)

```
I need comprehensive, verified admission statistics for the top 30 US universities for the 2024-2025 admission cycle. This data will be used to build a college advising system that must be as accurate as professional counselors.

**CRITICAL: Only use data from official sources - Common Data Sets (CDS), official university admissions pages, IPEDS, and verified reporting from reputable sources like US News methodology reports. Do not estimate or approximate.**

For each of the following 30 universities, provide:

### 1. Acceptance Rates (Most Recent Available Data)
- Overall acceptance rate with exact year/cycle
- Early Decision (ED) acceptance rate if applicable
- Early Action (EA) acceptance rate if applicable
- Regular Decision (RD) acceptance rate if offered separately
- Restrictive Early Action (REA) rate if applicable
- Total number of applicants
- Total number admitted
- Total enrolled (to calculate yield)

### 2. Academic Benchmarks (from CDS Section C)
For GPA:
- 25th percentile GPA
- 50th percentile (median) GPA
- 75th percentile GPA
- Percentage of admitted students with 4.0 unweighted GPA
- What GPA scale they report on (weighted vs unweighted)

For SAT (if reported):
- 25th/50th/75th percentile composite scores
- 25th/50th/75th percentile Math scores
- 25th/50th/75th percentile Evidence-Based Reading & Writing scores
- Percentage of enrolled students submitting SAT

For ACT (if reported):
- 25th/50th/75th percentile composite scores
- Percentage of enrolled students submitting ACT

### 3. Class Rank Data
- What percentage of admitted students were in top 10% of their class?
- What percentage were in top 25%?
- Does the school report class rank is "very important", "important", "considered", or "not considered" in admissions?

### 4. Test Policy for 2025-2026 Cycle
- Is testing required, test-optional, test-flexible, or test-blind?
- If test-optional, any nuances (e.g., recommended for certain majors, scholarship consideration)?
- Any announced changes for future cycles?
- Source URL for their official testing policy

**Universities to Cover (in this order):**
1. Harvard University
2. Stanford University
3. Massachusetts Institute of Technology (MIT)
4. Yale University
5. Princeton University
6. Columbia University
7. University of Pennsylvania
8. California Institute of Technology (Caltech)
9. Duke University
10. Northwestern University
11. University of Chicago
12. Johns Hopkins University
13. Dartmouth College
14. Brown University
15. Cornell University
16. Vanderbilt University
17. Rice University
18. University of Notre Dame
19. Washington University in St. Louis
20. Georgetown University
21. Emory University
22. University of Southern California (USC)
23. UCLA
24. UC Berkeley
25. Carnegie Mellon University
26. University of Virginia
27. University of Michigan
28. NYU
29. Boston College
30. Tufts University

**Output Format**: Present data in a structured table format for each school, with clear citations to the source (CDS year, official page URL, etc.). Flag any data points that could not be verified from primary sources.
```

---

## PROMPT 2: College Application Essay Requirements (2025-2026 Cycle)

```
I need detailed, verified information about supplemental essay requirements for the top 30 US universities for the 2025-2026 application cycle. This will power an essay coaching system that must have accurate, current requirements.

**CRITICAL: Only use official university application pages, Common App requirements, and verified admissions office communications. Requirements change yearly - ensure data is for 2025-2026 cycle specifically.**

For each of the 30 universities listed below, provide:

### 1. Application Platform(s) Accepted
- Common Application
- Coalition Application
- QuestBridge
- University-specific application (if any)
- Which platform is most commonly used/recommended

### 2. Supplemental Essay Requirements
For EACH required essay prompt:
- The exact, word-for-word prompt text
- Word limit (minimum and maximum if specified)
- Whether it's required or optional
- Any prompt variations or choices

### 3. "Why This School" Essay Analysis
- Does this school require a "Why Us" essay?
- Exact word count allowed
- What specifically do they want students to address?
- Any guidance from the admissions office about what they're looking for?

### 4. Short Answer Questions
- List all short answer questions required
- Character/word limits for each
- Topics covered (activities, intellectual interests, community, etc.)

### 5. Additional Writing Samples
- Does this school request any additional writing (research abstract, graded paper, etc.)?
- Are there any major-specific essays required?
- Portfolio requirements for arts programs?

### 6. Optional Essays
- What optional essays are offered?
- Admissions office guidance on whether to submit optional materials

### 7. Total Writing Load
- Total word count across all required essays
- Estimated time to complete (based on word counts)
- Strategic overlap potential with other schools' essays

**Universities (same list as Prompt 1):**
[Harvard through Tufts - same 30 schools]

**Output Format**: For each school, list every single essay/short answer with exact prompt text and word limits. Include direct links to official supplemental essay pages. Note the date you accessed this information.
```

---

## PROMPT 3: Demonstrated Interest Policies & Interview Requirements

```
I need comprehensive information about how the top 30 US universities track and value demonstrated interest, and their interview policies. This is crucial for advising students on where to invest their time in school engagement.

**CRITICAL: Use only official sources - CDS Section C7 (Level of Interest), admissions blogs, official Q&As, and verified reporting. Demonstrated interest policies are often misunderstood - accuracy is essential.**

For each of the 30 universities, provide:

### 1. Demonstrated Interest Tracking
From Common Data Set Section C7, what level of importance does this school assign to "Level of applicant's interest"?
- Very Important
- Important
- Considered
- Not Considered

### 2. How Interest is Tracked (if applicable)
- Do they track email opens/clicks?
- Do they track portal logins?
- Do they track campus visit attendance?
- Do they track virtual event attendance?
- Do they track contact with regional admissions officers?
- Do they use a demonstrated interest score/ranking?

### 3. Recommended Interest-Building Activities
Based on admissions office guidance, what are the most impactful ways to demonstrate interest?
- Campus visits (in-person)
- Virtual campus tours
- Information sessions
- Admissions office contact
- Student ambassador interactions
- Regional events/college fairs
- Social media engagement
- Early application timing

### 4. Interview Policy & Process
- Are interviews offered?
- Required, strongly recommended, recommended, optional, or not offered?
- Who conducts interviews (admissions officers, alumni, students)?
- How to request/schedule an interview
- Interview format (in-person, virtual, phone)
- Typical interview length
- Geographic availability limitations
- Impact on admissions decision (from CDS if available)

### 5. Campus Visit Recommendations
- Does visiting campus help your application at this school?
- Best times to visit
- What visits are tracked vs. not
- Virtual visit options and their weight

### 6. Nuances and Insider Knowledge
- Any official quotes from admissions officers about demonstrated interest
- Known misconceptions about this school's interest tracking
- Specific advice for international or distant students
- Yield protection considerations (do they care if you'll actually attend?)

**Universities (same 30 schools)**

**Output Format**: Clear categorization for each school with specific, actionable guidance. Include direct quotes from admissions officers where available. Cite sources with URLs.
```

---

## PROMPT 4: Institutional Values & Admissions Philosophy

```
I need deep insight into what each of the top 30 US universities actually values in applicants - beyond just statistics. This will help students understand fit and craft authentic applications.

**CRITICAL: Use admissions office statements, dean/director interviews, official blogs, published admissions criteria, and mission statements. Avoid speculation - cite actual institutional positions.**

For each university, research and provide:

### 1. Mission and Core Values
- Official mission statement
- Stated core values
- Educational philosophy
- What kind of student thrives here?

### 2. What Admissions Officers Say They Look For
Direct quotes from:
- Deans of Admission
- Admissions directors
- Admissions blogs/podcasts
- Official information session content
- Published "what we look for" pages

Include specific quotes about:
- Academic preparation expectations
- Extracurricular involvement expectations
- Character traits they value
- Red flags they mention avoiding

### 3. Institutional Priorities and Initiatives
- Current strategic priorities that affect admissions
- Diversity and inclusion commitments
- First-generation student initiatives
- Geographic diversity goals
- Socioeconomic diversity programs
- STEM vs humanities balance
- Research emphasis

### 4. "Fit" Indicators
- What type of student is NOT a good fit (per official sources)
- Campus culture descriptors from official materials
- Student body characteristics they emphasize
- Learning environment descriptions

### 5. Unique Aspects That Affect Applications
- Signature programs applicants should know about
- Unique academic structures (e.g., open curriculum, core curriculum)
- Special application components
- Honors programs and their requirements
- Research opportunities for undergrads
- Study abroad emphasis

### 6. What Makes Their Process Different
- Any unique evaluation methods
- Committee review process details
- Regional representation considerations
- How they handle waitlists
- Gap year policies
- Transfer student priorities

### 7. Recent Admissions Trends & Statements
- Any recent changes in admissions philosophy
- Responses to test-optional debates
- Statements about AI in applications
- COVID-era policy changes that remained

**Universities (same 30 schools)**

**Output Format**: Narrative format for each school with extensive direct quotes. This should feel like insider knowledge from admissions offices themselves. Include sources for every claim.
```

---

## PROMPT 5: Activity Tier Classification Standards

```
I need to establish rigorous, defensible standards for classifying high school extracurricular activities into tiers (1-4) for college admissions evaluation. This must be based on how elite college admissions officers actually evaluate activities.

**CRITICAL: Use admissions officer interviews, published guidance from elite schools, college counselor resources from organizations like NACAC/HECA, and documented admissions practices. This is for serious advising, not casual guidance.**

### 1. Tier 1 Activities (Rare Distinction - Top ~1% of applicants)
What specific achievements qualify as Tier 1? Provide concrete examples:

**National/International Recognition**
- Which specific competitions/awards are Tier 1? (Be exhaustive)
- Science: Intel ISEF, Regeneron STS, USA Biology/Chemistry/Physics Olympiad... what else?
- Math: USAMO, IMO qualification... thresholds?
- Arts: YoungArts, national Scholastic Gold Keys... what's the bar?
- Music: All-National recognition, major competition wins?
- Debate: TOC champions, national circuit achievements?
- Athletics: What varsity levels matter? D1 recruitment?
- Service: Which national recognition programs?

**Leadership at Scale**
- What defines "significant organizational leadership"?
- Founding organizations with what scale of impact?
- Political/civic engagement at what level?

**Published Work/Media**
- What publication standards matter?
- Media coverage thresholds?

### 2. Tier 2 Activities (Strong Distinction - Top ~5-10%)
**Regional/State Level Recognition**
- State competition placements - which ones count?
- Regional leadership positions
- Select program admissions (which summer programs?)

**Sustained Leadership with Measurable Impact**
- What metrics indicate "significant" impact?
- Leadership position tenure requirements?
- Organization size thresholds?

### 3. Tier 3 Activities (Solid Contribution - Top ~25%)
**School-Level Excellence**
- Captain/president roles at what commitment level?
- School awards and recognition
- Consistent multi-year commitment thresholds

**Community Impact**
- Community service hour thresholds?
- Local organization leadership?

### 4. Tier 4 Activities (Participation)
- What qualifies as "participation" vs. "involvement"?
- Do admissions officers view these differently?
- How many Tier 4 activities are too many?

### 5. Cross-Cutting Questions
**Time Commitment Standards**
- Hours per week that signal serious commitment?
- Years of involvement expectations?
- Summer vs. school year weighting?

**Quality vs. Quantity**
- How many activities is optimal?
- Depth vs. breadth preferences by school type?
- The "spike" concept - how is this evaluated?

**Context Considerations**
- How are activities evaluated differently for:
  - Rural vs. urban students?
  - First-generation students?
  - Low-income students?
  - International students?
- How do admissions officers account for opportunity gaps?

### 6. Specific Program/Competition Tier Classifications
Create an exhaustive list categorizing well-known programs:

**Science Research Programs**
- RSI, SSTP, MOSTEC, Garcia, Simons... tier for each?

**Summer Academic Programs**
- Which are selective enough to matter?
- Tier classification for each major program

**Competitions by Field**
- Complete list of meaningful competitions with tier thresholds

**Leadership Programs**
- Boys/Girls State, HOBY, etc. - how valued?

**Output Format**: Provide specific, defensible tier assignments with rationale. Include quotes from admissions officers where available. This should be usable as a reference document for activity classification.
```

---

## PROMPT 6: Awards and Honors Recognition Hierarchy

```
I need a comprehensive hierarchy of high school awards and honors for college admissions evaluation. The goal is to understand which awards actually impress admissions officers at elite institutions.

**CRITICAL: Use documented admissions practices, counselor guidance, and verifiable selectivity data. Many awards are misrepresented in selectivity - we need accurate assessments.**

### 1. National-Level Prestigious Awards
For each award/honor, provide:
- Exact name and sponsoring organization
- Selection rate/number of recipients annually
- Criteria for selection
- How admissions officers view it (with sources)
- Any red flags or misperceptions

**Categories to cover:**

**Academic Competitions (Finals/Top Recognition)**
- Science Olympiad (what level matters?)
- Math competitions (AMC/AIME/USAMO progression - what's the threshold?)
- Science fairs (regional vs. state vs. ISEF)
- Debate/Speech (NFL/NSDA qualification levels)
- Model UN (what recognition matters?)
- History competitions (National History Day levels)
- Writing competitions (Scholastic levels, other prestigious ones)
- Quiz Bowl/Academic Decathlon levels

**Scholarship Programs with Prestige**
- National Merit progression (Commended vs. Semifinalist vs. Finalist)
- QuestBridge implications
- Coca-Cola Scholars
- Gates Scholarship
- Posse Scholarship
- Others with admissions weight

**Recognition Programs**
- Presidential Scholar
- US Senate Youth Program
- Congressional Award levels
- Boys/Girls State selection
- Hugh O'Brien Youth Leadership

**Arts Recognition**
- YoungArts levels and what they mean
- Scholastic Art & Writing (Gold Key significance)
- Music: All-State vs. All-Regional vs. All-National
- Theater: Thespian Honor Society levels

### 2. School-Level Honors Assessment
How should common school honors be weighted?

**Academic Honor Societies**
- National Honor Society - how valued?
- Subject-specific honor societies (Mu Alpha Theta, Science Honor Society, etc.)
- When do these matter vs. not?

**School Awards**
- Valedictorian/Salutatorian significance
- Department awards
- School-nominated awards for national programs

### 3. Common App Honors Section Optimization
The Common App allows 5 honors - how should students prioritize?

- Hierarchy for selection
- How to describe honors effectively
- Recognition levels: School vs. State/Regional vs. National vs. International
- Grade levels to assign
- Common mistakes to avoid

### 4. Red Flags and Overrated Awards
Which commonly listed awards do NOT impress admissions officers?
- Pay-to-participate "honors"
- Easily obtained recognitions
- Misleading "national" recognitions
- How to identify legitimate vs. vanity awards

### 5. Context-Dependent Evaluation
How do these awards read differently based on:
- School context (competitive vs. less competitive high school)
- Geographic region
- Student background/circumstances
- Intended major alignment

### 6. Award Selectivity Data
For major awards, provide actual numbers:
- Number of applicants/nominees
- Number of recipients
- Selection rate percentage
- Trend over time (getting harder/easier?)

**Output Format**: Create a tiered classification system (Tier 1-4 similar to activities) with specific awards assigned to each tier. Include selectivity data and admissions officer perspectives with sources.
```

---

## PROMPT 7: School-Specific Strong Programs and Competitive Majors

```
I need detailed information about academic program strengths and major-specific admission competitiveness at the top 30 universities. This is crucial for advising students on realistic school selection.

**CRITICAL: Use official program rankings, department data, and documented admissions rates by major where available. Competitiveness varies dramatically by intended major - this nuance is essential.**

For each of the 30 universities, provide:

### 1. Signature/Flagship Programs
- What are the 3-5 programs this school is most famous for?
- How do these programs affect overall admissions?
- Are these programs direct-admit or internal application?

### 2. Competitive/Impacted Majors
For each school, identify:
- Which majors are significantly more competitive than overall admission rate?
- Estimated or reported acceptance rates by major (where available)
- Engineering schools: separate admission process?
- Business schools: undergraduate admission competitiveness
- CS/Data Science: is this a capped major?
- Pre-med/sciences: any special considerations?

### 3. Lesser-Known Program Strengths
- Strong programs that don't get enough attention
- Interdisciplinary programs that are uniquely excellent
- Research opportunities in specific fields
- Graduate school placement by major

### 4. Major Declaration Process
- When must students declare?
- How hard is it to switch into competitive majors?
- Are there GPA requirements for certain majors?
- Lottery systems for oversubscribed majors?

### 5. Admissions Implications
- Does intended major affect admission probability?
- Can listing a less competitive major help admission?
- How do schools view "undecided" applicants?
- Major-specific essay requirements?

### 6. Program-Specific Requirements
- Portfolio requirements for art/architecture/design
- Audition requirements for music/theater
- Additional testing for certain programs
- Prerequisite coursework expectations

### 7. Job/Graduate School Outcomes by Major
Where available:
- Employment rates by major
- Graduate school placement
- Starting salary data
- Notable employers/programs that recruit from specific departments

**Universities (same 30 schools)**

**Output Format**: For each school, provide a clear breakdown of program competitiveness with specific data where available. Flag where information is estimated vs. officially published.
```

---

## PROMPT 8: Financial Aid, Merit Scholarships, and CSS Profile Requirements

```
I need comprehensive financial aid information for top 30 universities to help students make realistic school list decisions based on affordability.

**CRITICAL: Use official financial aid pages, College Board data, and IPEDS. Financial policies change yearly - ensure current information.**

For each of the 30 universities:

### 1. Need-Based Aid Policy
- Does this school meet 100% of demonstrated need?
- What methodology do they use (CSS Profile, FAFSA only, institutional)?
- Are there any gaps in need-based packages?
- Loan vs. grant policies
- Work-study expectations

### 2. Net Price Data
- Average net price by income bracket:
  - $0-30,000
  - $30,001-48,000
  - $48,001-75,000
  - $75,001-110,000
  - $110,001+
- Total cost of attendance (current year)
- What percentage of students receive aid?

### 3. Merit Scholarship Availability
- Does this school offer merit aid (need-blind)?
- Named scholarship programs
- Typical merit award amounts
- Application requirements for merit scholarships
- Separate application deadlines?

### 4. Special Financial Circumstances
- No-loan policies (if applicable)
- Income thresholds for free tuition
- Family home equity treatment
- Small business/farm asset treatment
- Divorced/separated parent policies

### 5. CSS Profile Specifics (if required)
- Does this school require CSS Profile?
- Noncustodial parent requirements
- Additional documentation required
- Deadline dates

### 6. International Student Aid
- Is need-based aid available for international students?
- Is admissions need-blind or need-aware for internationals?
- Typical aid packages for international students
- Any restrictions?

### 7. Early Decision Financial Considerations
- Can you compare ED financial aid packages?
- What if ED aid is insufficient?
- Any ED-specific scholarships?

### 8. Appeal/Negotiation
- Does this school negotiate/match aid offers?
- Professional judgment policy
- Appeals process

**Universities (same 30 schools, with particular attention to public vs. private differences)**

**Output Format**: Create a comprehensive financial profile for each school with specific numbers and policies. This should help students quickly assess affordability.
```

---

## Usage Instructions

1. **Run each prompt separately** in Perplexity Pro with Deep Research mode
2. **Save outputs** to `/docs/research/outputs/` with naming convention:
   - `PROMPT_1_ADMISSION_STATS_OUTPUT.md`
   - `PROMPT_2_ESSAY_REQUIREMENTS_OUTPUT.md`
   - etc.
3. **Timestamp each output** for reference
4. **Flag any gaps** where authoritative data wasn't available
5. **Cross-reference** conflicting information between sources

After completing all prompts, we'll integrate verified data into:
- `src/services/portfolioStrategy/data/collegeAdmissionsData.ts`
- `src/services/portfolioStrategy/data/activityTierClassifications.ts`
- `src/services/portfolioStrategy/data/awardRecognitionHierarchy.ts`
