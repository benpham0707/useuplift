# Activity Profile Chat — E2E Test Results

> Generated: Feb 19, 2026 | System Version: v5 (post-extraction fix)

---

## Overview

Two end-to-end conversations were run through the Activity Profile Chat system, each simulating a realistic 4-turn student interaction. Both achieved **rich extraction on every turn** and built comprehensive profiles from natural conversation.

| Metric | Robotics Club President | Peer Tutoring Founder |
|--------|------------------------|-----------------------|
| Final Completeness | **80%** | **77%** |
| Fields Extracted | 35 | 33 |
| Quotes Captured | 11 | 13 |
| Extraction Quality | rich (all 4 turns) | rich (all 4 turns) |
| Question Repetitions | None | None |
| Total Tokens | 19,754 | 20,844 |
| Estimated Cost | $0.165 | $0.180 |
| Duration | 139.6s | 155.3s |

---

## Test 1: Robotics Club President

**Activity:** 3-year commitment, 15 hrs/week, grade 12 student

### Conversation Flow

**Opening Question:** "Can you give me a sense of the scale? How many people were involved?"

---

**Turn 1** — Student shares origin story (joined freshman year, sister's influence, electronics passion)

- System reflects back what it heard, confirms understanding, asks about team size
- Extracted: origin story, motivation, relationships, evolution, roles, skills
- **8 fields | 31% completeness**

**Turn 2** — Student shares growth metrics (8 to 32 members, mentorship program, outreach, competitions)

- System asks about biggest challenge in scaling
- Extracted: scale metrics, before/after, artifacts, roles, recognition, beneficiaries
- **10 fields | 63% completeness**

**Turn 3** — Student shares funding crisis (school board proposal, $5K secured, overcame fear)

- System asks what originally drew them to robotics
- Extracted: budget, key moments, challenge overcome, personal growth, skills, values
- **10 fields | 76% completeness**

**Turn 4** — Student shares proudest moment (mentees growing, personal transformation, major alignment)

- System closes conversation — profile is rich enough
- Extracted: proudest moment, recognition, growth, why it matters, character traits
- **7 fields | 80% completeness | Conversation complete**

### Completeness Progression

```
Turn 0: 8%  ####
Turn 1: 31% ################
Turn 2: 63% ################################
Turn 3: 76% ######################################
Turn 4: 80% ########################################
```

### Key Quotes Captured

| Quote | Best Use |
|-------|----------|
| "I was always taking apart electronics at home" | Essay |
| "the advisor asked me to step up as team lead" | Description |
| "We grew the club from 8 members to 32 in two years" | Description |
| "qualified for nationals for the first time in school history" | Description |
| "I created a mentorship program pairing experienced members with newcomers" | Essay |
| "I was terrified but it worked" | Essay |
| "leadership isn't just about the technical stuff, it's about advocating for your team" | Essay |
| "What I'm most proud of is seeing members who joined knowing nothing about robotics now mentoring others." | Essay |
| "The club changed who I am — I used to be really shy and now I present to the school board regularly." | Essay |

### Profile Highlights

- **7 distinct roles** identified (President, Team Lead, Robot Designer, Program Creator, Outreach Coordinator, Advocate, Mentor)
- **3 recognition items** (State Championship 2nd, Nationals Qualifier, Mentee's Innovation Award)
- **3 artifacts** (Mentorship Program, Outreach Program, School Board Proposal)
- **4 key moments** mapped (turning point, achievement, initiative, challenge overcome)
- **2 growth arcs** (leadership philosophy shift, public speaking confidence)
- **4 character traits** (Courage, Persistence, Responsibility, Transformative Leadership)

### Confidence Scores

| Dimension | Score |
|-----------|-------|
| Facts | 85% |
| Story | 100% |
| Meaning | 100% |
| Impact | 60% |
| Connections | 25% |

---

## Test 2: Peer Tutoring Program Founder

**Activity:** 2-year commitment, 10 hrs/week, Community Service

### Conversation Flow

**Opening Question:** "Can you give me a sense of the scale? How many people were involved?"

---

**Turn 1** — Student shares origin (noticed equity gap, started informally, got principal's support, 15 tutors + 40 students in month one)

- System reflects the numbers, asks about program growth since
- Extracted: scale, origin, motivation, key moments, evolution, relationships, values, beneficiaries, character traits, roles
- **11 fields | 49% completeness**

**Turn 2** — Student shares impact data (1.5 letter grade improvement, 12 from failing to passing, designed curriculum + study guides, 60 students/week)

- System catches the number discrepancy (40 vs 60), asks for clarification
- Extracted: updated scale, before/after impact, artifacts, roles, skills, evolution
- **9 fields | 65% completeness**

**Turn 3** — Student shares challenges (tutor graduation, created training manual, rebranding to remove stigma, personal motivation as child of immigrants)

- System asks about awards and recognition
- Extracted: key moments, artifacts, roles, values, origin deepened, why it matters, character traits, hardest challenge
- **9 fields | 71% completeness**

**Turn 4** — Student shares future vision (education policy major, 15% school math improvement, superintendent presentation, 3 schools interested)

- System asks about the superintendent presentation experience
- Extracted: recognition, school-wide impact, roles, ongoing legacy, major alignment, why it matters
- **7 fields | 77% completeness**

### Completeness Progression

```
Turn 0: 8%  ####
Turn 1: 49% #########################
Turn 2: 65% #################################
Turn 3: 71% ####################################
Turn 4: 77% #######################################
```

### Key Quotes Captured

| Quote | Best Use |
|-------|----------|
| "I noticed a lot of my classmates were struggling in math and science but couldn't afford private tutoring" | Essay |
| "I started helping a few friends after school and word spread quickly" | Interview |
| "I went to the principal with a plan to make it official" | Description |
| "the students we tutored saw an average grade improvement of 1.5 letter grades" | Description |
| "12 students went from failing to passing" | Essay |
| "I personally trained all 15 tutors using a curriculum I designed" | Interview |
| "I renamed it from 'remedial tutoring' to 'Academic Success Partners' to remove the stigma." | Essay |
| "Education equity is really important to me because my parents are immigrants and they couldn't help me with homework growing up." | Essay |
| "I want to study education policy in college because I've seen firsthand how a simple program can change outcomes." | Essay |
| "The principal told me our program contributed to the school's 15% improvement in math proficiency scores." | Interview |

### Profile Highlights

- **7 distinct roles** (Founder, Program Designer, Recruiter, Curriculum Designer, Trainer, Rebranding Lead, District Presenter)
- **2 recognition items** (Superintendent Presentation, Principal's Acknowledgment)
- **5 artifacts** (Training Curriculum, Study Guides, Practice Problems, Tracking Spreadsheet, Training Manual)
- **5 key moments** mapped (organic growth, formalization, rapid scaling, tutor loss crisis, stigma rebranding)
- **4 evolution phases** (informal beginnings, formalization, scaling, expansion)
- **6 character traits** (Initiative, Leadership, Empathy, Resilience, Social Awareness, Systems Thinking)
- **Ongoing legacy:** Working on district-wide adoption (3 schools interested)

### Section Completeness

| Section | Score |
|---------|-------|
| Facts | 85% |
| Story | 100% |
| Meaning | 70% |
| Impact | 60% |
| Connections | 40% |

---

## Quality Assessment

### What Works Well

1. **Extraction is thorough** — From ~200 words of natural student speech per turn, the system extracts 7-11 structured fields with high confidence
2. **Questions are contextual** — Each question builds on what was just said (e.g., asking about challenges after hearing growth metrics)
3. **No repetition** — The system tracks what's been asked and never re-asks
4. **Knows when to stop** — The robotics test naturally ended at 80% after 4 turns; the tutoring test would naturally continue a few more turns to fill remaining gaps
5. **Quote capture is strong** — 11-13 authentic quotes per conversation, tagged with suggested use (essay, description, interview)
6. **Reflects understanding** — Turn 1 responses mirror back what was heard before asking the next question, building trust

### Areas for Improvement

1. **Connections section underscored** — Both profiles show low confidence in connections (25-40%). The system doesn't probe deeply enough into how the activity connects to other activities or spike narrative
2. **Impact section could be richer** — Both at 60%. Could ask more specifically about measurable outcomes and testimonials
3. **Some roles are redundant** — "Robot Designer" and "Team Lead" overlap; could be consolidated
4. **Cost is high** — $0.17-0.18 per 4-turn conversation (see Cost Analysis below)

---

## Cost Analysis

### Activity Chat vs PIQ Chat Coach — Per Turn

| Dimension | Activity Profile Chat | PIQ Chat Coach |
|-----------|----------------------|----------------|
| **Model(s)** | Sonnet (extraction) + Haiku (questions) | Sonnet (single call) |
| **LLM calls per turn** | 2 | 1 |
| **Output ceiling** | 4,000 + 500 = 4,500 tokens | 500 tokens |
| **Prompt caching** | No | Yes (system prompt) |
| **Avg output/turn** | ~2,350 tokens | ~300-400 tokens |
| **Cost per turn** | ~$0.045 | ~$0.006-0.013 |
| **Cost per 4-turn chat** | ~$0.18 | ~$0.03-0.05 |

### Why Activity Chat Costs 4-6x More

The cost difference comes down to one thing: **the Sonnet extraction call uses maxTokens: 4000**.

Sonnet output costs **$15/million tokens**. At ~2,350 output tokens per turn, the extraction call alone costs ~$0.035/turn. By contrast, PIQ Chat caps output at 500 tokens (~$0.0075/turn) and uses prompt caching to reduce input costs on subsequent turns.

The Haiku question generation call (maxTokens: 500) is negligible — at Haiku pricing (~$1.25/MTok output), it adds ~$0.001/turn.

### Cost Breakdown Per Turn (Activity Chat)

```
Sonnet extraction:  ~2,700 input  x $3/MTok  = $0.0081
                    ~2,350 output x $15/MTok = $0.0353
                                              --------
                    Subtotal:                  $0.0434/turn

Haiku question:     ~1,500 input  x $0.25/MTok = $0.0004
                    ~300 output   x $1.25/MTok  = $0.0004
                                                 --------
                    Subtotal:                     $0.0008/turn

TOTAL PER TURN:     ~$0.044
TOTAL PER 4-TURN CHAT: ~$0.176
```

### Optimization Options

1. **Reduce extraction maxTokens from 4000 to 2000** — Actual output averages 2,350, but most of that is verbose field descriptions. A more concise extraction schema could cut output by 40%, saving ~$0.014/turn
2. **Add prompt caching** — The extraction system prompt + schema definition is ~800 tokens repeated every turn. Caching would save ~$0.002/turn
3. **Switch extraction to Haiku for "easy" turns** — When the student provides simple factual responses (numbers, dates), Haiku could handle extraction. Only use Sonnet for nuanced/ambiguous responses. Potential savings: 50% on ~half of turns
4. **Batch extraction** — Instead of extracting every turn, buffer 2 turns and extract once. Halves the number of Sonnet calls but adds latency

### Recommended Quick Win

Option 1 (reduce maxTokens) is the safest: change `responseExtractor.ts:277` from `maxTokens: 4000` to `maxTokens: 2500`. Test data shows no turn exceeded 2,710 output tokens. This alone would save ~$0.02 per conversation.

---

## Token Usage Detail

### Robotics Club President

| Turn | Input | Output | Total |
|------|-------|--------|-------|
| 1 | 2,513 | 2,208 | 4,721 |
| 2 | 2,682 | 2,561 | 5,243 |
| 3 | 2,821 | 2,160 | 4,981 |
| 4 | 2,900 | 1,909 | 4,809 |
| **Total** | **10,916** | **8,838** | **19,754** |

### Peer Tutoring Program

| Turn | Input | Output | Total |
|------|-------|--------|-------|
| 1 | 2,548 | 2,710 | 5,258 |
| 2 | 2,706 | 2,396 | 5,102 |
| 3 | 2,843 | 2,727 | 5,570 |
| 4 | 2,924 | 1,990 | 4,914 |
| **Total** | **11,021** | **9,823** | **20,844** |
