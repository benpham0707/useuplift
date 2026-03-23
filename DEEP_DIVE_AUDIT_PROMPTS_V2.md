# Deep Dive System Audit Prompts V2: Writing Craft & Outcome Focus

> **Purpose**: Evaluate every Uplift subsystem against TWO standards simultaneously: (A) Does the system demonstrate genuine intelligence about admissions essays? (B) Would following its guidance ACTUALLY produce an elite-level essay? Each prompt embeds the real system output, asks the evaluator to write what the IDEAL output looks like, and includes a "Show Me the Rewrite" exercise where the evaluator demonstrates what the student's essay would look like after following the system's advice.

> **What changed from V1**: V1 prompts evaluated the coaching PROCESS (does it detect resistance? does it adapt?). V2 prompts evaluate the coaching OUTCOME (would the student's final essay get them into Stanford?). V1 never asked: "If I followed this advice, what would my essay actually look like?" V2 makes that the central question.

> **How to use**: Run each prompt as a separate Opus conversation. Each prompt is fully self-contained with the actual essay text, system output, and evaluation criteria. Be ruthless. The standard is not "is this good for an AI?" but "is this as good as a $600/hr human?"

---

## TEST ESSAY (Used Across All Prompts)

```
From the moment my fingers first danced across the piano keys, I was captivated by the power to create worlds through sound. With just seven notes, I could weave melodies that tell stories, evoke emotions, and connect deeply with others. Music became my language—a blend of expression and analytical thinking that challenged me to innovate within rhythm and harmony's constraints.

Composing is like solving a puzzle; each note and chord must align perfectly to convey the intended emotion. I spent hours experimenting with chord progressions, fascinated by how minor adjustments transformed a piece's mood. It wasn't just about creating something new but expressing a part of myself through each composition.

Reimagining classical pieces by infusing modern elements became my favorite endeavor. Inspired by Chopin's Noctures, I blended them with contemporary jazz rhythms to create a fusion honoring tradition while embracing innovation.

Delving deeper into music, I noticed parallels with another interest: coding. Just as I used notes and chords to compose, I could use code to create projects—both requiring logic layered with creativity. Coding became another medium to build and innovate, transforming abstract ideas into tangible experiences.

Practicing scales mirrors debugging code; both demand patience and attention to detail. Composing taught me to anticipate how elements interact—a skill invaluable when integrating software components. This connection crystallized when I developed an artificially intelligent disc jockey that generated tracks tailored to users' moods. Seeing users smile as the AI DJ captured their emotions reaffirmed my belief in the connection between technology and human emotion.

My musical background guided me in creating an emotionally resonant AI DJ. Integrating AI with user preferences was like composing a song harmonizing with its audience. Fine-tuning the AI to interpret subtle cues required innovative solutions blending musical intuition with technical expertise.

Whether at a piano or a computer, I'm driven to create and explore the limitless possibilities at my fingertips. Music opened my mind to the beauty of innovation and coding extends that passion. I look forward to continuing this journey, crafting experiences that resonate with others and make a meaningful difference—much like composing a timeless melody.
```

**Hidden context the student reveals during coaching**: (1) The AI DJ was built at a hackathon with a team in 48 hours, won 2nd place. (2) P3 was written thinking about piano teacher Mrs. Chen who taught them Chopin. (3) The student realizes their essay might really be about the moment they first heard Mrs. Chen play.

---

## COMPARISON ESSAY (Strong — Use for Calibration)

```
Most Wednesdays smelled like bleach and citrus. I learned which regulars wanted to talk and which just needed silence while I checked them in. Started as a greeter, but three months in, I noticed patients struggling with our intake form—some couldn't read English well, others seemed overwhelmed by medical jargon. I redesigned the form with my supervisor Ana, cutting questions from 47 to 22 and adding simple icons. Wait times dropped from 18 minutes to 9, and patients started asking follow-up questions instead of just nodding. By spring, I was training two freshmen to run intake so the system wouldn't collapse when I graduated. I used to think efficiency meant speed, but I learned it actually means removing the barriers that make people feel small. That insight changed how I approach every group project now—I pause and ask what we're missing, not just what we need to do faster.
```

---

## PROMPT 1: Pipeline Analysis Quality (L1 through L3.5) — Does This Analysis Enable Better Writing?

```
You are a former admissions officer at Stanford who spent 12 years reading applications, then left to run a boutique essay consulting practice at $600/hr. You've guided 200+ students into T10 schools. You also have an MFA in creative nonfiction — you understand essay CRAFT at a level most counselors don't. You don't just know what AOs look for; you know how to BUILD the essay that gets the reaction.

I'm going to show you a mediocre piano/coding essay, then an AI system's complete analysis pipeline output. Your job is to evaluate the analysis on TWO dimensions:

**DIMENSION A (System Intelligence)**: Does this analysis demonstrate genuine understanding — of this specific student, of admissions psychology, of what makes essays work?

**DIMENSION B (Writing Craft Outcome)**: If a student read ONLY this analysis (no coaching, no conversation), would they know enough to transform their essay from mediocre to competitive at T20 schools?

═══════════════════════════════════════
ESSAY:
═══════════════════════════════════════

From the moment my fingers first danced across the piano keys, I was captivated by the power to create worlds through sound. With just seven notes, I could weave melodies that tell stories, evoke emotions, and connect deeply with others. Music became my language—a blend of expression and analytical thinking that challenged me to innovate within rhythm and harmony's constraints.

Composing is like solving a puzzle; each note and chord must align perfectly to convey the intended emotion. I spent hours experimenting with chord progressions, fascinated by how minor adjustments transformed a piece's mood. It wasn't just about creating something new but expressing a part of myself through each composition.

Reimagining classical pieces by infusing modern elements became my favorite endeavor. Inspired by Chopin's Noctures, I blended them with contemporary jazz rhythms to create a fusion honoring tradition while embracing innovation.

Delving deeper into music, I noticed parallels with another interest: coding. Just as I used notes and chords to compose, I could use code to create projects—both requiring logic layered with creativity. Coding became another medium to build and innovate, transforming abstract ideas into tangible experiences.

Practicing scales mirrors debugging code; both demand patience and attention to detail. Composing taught me to anticipate how elements interact—a skill invaluable when integrating software components. This connection crystallized when I developed an artificially intelligent disc jockey that generated tracks tailored to users' moods. Seeing users smile as the AI DJ captured their emotions reaffirmed my belief in the connection between technology and human emotion.

My musical background guided me in creating an emotionally resonant AI DJ. Integrating AI with user preferences was like composing a song harmonizing with its audience. Fine-tuning the AI to interpret subtle cues required innovative solutions blending musical intuition with technical expertise.

Whether at a piano or a computer, I'm driven to create and explore the limitless possibilities at my fingertips. Music opened my mind to the beauty of innovation and coding extends that passion. I look forward to continuing this journey, crafting experiences that resonate with others and make a meaningful difference—much like composing a timeless melody.

═══════════════════════════════════════
SYSTEM ANALYSIS OUTPUT:
═══════════════════════════════════════

AO FIRST READ (gut reaction):
  Hook moment: (none)
  Committee one-liner: Student who plays piano and codes, found a connection between them, built an AI DJ.
  Distinctiveness: (none)
  Put-down risk: high
  Gut reaction: Okay, so... music-to-coding pipeline. I've genuinely read this essay before. Multiple times. The seven notes thing, the puzzle metaphor, the 'scales mirror debugging' line—these are the greatest hits of the STEM-musician essay. The AI DJ is a nice concrete project, but it's buried and underdeveloped. I'm not seeing THIS student. I'm seeing a template. By paragraph 3 I'm already thinking about the next stack.

PERSON PORTRAIT: Someone who thinks in systems and gets quietly excited when they notice patterns others miss. The kind of person who would spend hours tweaking something not because it's broken but because they're curious what happens if they adjust one variable. Probably has strong opinions about whether something counts as 'real' creativity if it follows rules. Would describe their weekend projects in terms of 'experiments' and 'explorations' rather than 'work' or 'hobbies.' Likely more comfortable explaining how they think than what they feel. The person who stays after class not to ask about grades but to argue about whether the assignment's constraints were actually limitations or creative catalysts. Would probably talk your ear off about the relationship between jazz improvisation and algorithm design if you showed even mild interest.

ARCHETYPE: music as life metaphor / interdisciplinary STEM-arts fusion (saturated)
  Differentiator: The explicit structural parallel articulated through formal syntax (P3S1: 'Just as I used notes and chords to compose, I could use code to create projects — both requiring logic layered with creativity') rather than vague claims about music teaching discipline or teamwork. The constraint-as-catalyst framework (P0S1-S2) that positions limitations as creative drivers. However, the execution remains generic: no specific musical moment, no scene of building the AI DJ, no named individuals, no obstacles overcome.

RED FLAGS:
  - SCOPE INFLATION: P0S0 claims 'create worlds through sound' and P6S2 promises 'crafting experiences that resonate with others and make a meaningful difference' without proportional evidence. The language escalates from personal discovery to universal impact without showing the scale of actual work.
  - PEOPLE ABSENCE: No named individuals appear in the essay. No teacher, mentor, collaborator, family member, friend, or specific user. Every experience is described in isolation. The AI DJ has 'users' (P4S3) but they remain generic and unnamed.
  - SOLO CREDIT FOR LIKELY TEAMWORK: P4S2 claims 'I developed an artificially intelligent disc jockey' using singular first-person for a project that likely involved collaboration, libraries, frameworks, or guidance. No acknowledgment of tools, resources, or collaborative context.
  - The AI DJ project is introduced, executed, and validated in 4 sentences (P4S2-S3, P5S0-S1) without describing technical architecture, design challenges, iteration process, or measurable outcomes beyond 'users smile'
  - The Chopin-jazz fusion (P2S1) is the essay's only concrete musical example but is described in a single sentence without audio evidence, performance context, or reception
  - The essay contains zero scenes of struggle, failure, or revision despite claiming to value experimentation and process
  - The parallel between music and coding is asserted through formal analogy (P3S1) but not demonstrated through specific examples of how musical thinking shaped coding decisions

EMOTIONAL AUTHENTICITY: Emotion is conveyed primarily through naming states ('captivated', 'fascinated', 'driven') and through abstract conceptual language ('create worlds', 'meaningful difference', 'timeless melody') rather than through sensory detail, physical action, or specific moments. The essay operates in summary mode—describing categories of experience rather than inhabiting particular instances. When emotion appears, it is filtered through intellectual framing: the narrator is fascinated by HOW things work (cause-and-effect in composition, parallels between domains) rather than emotionally vulnerable about what things mean. The single moment of external emotional validation (P4S3: 'Seeing users smile') is the essay's closest approach to shown emotion, but even this is compressed into summary rather than expanded into scene. The essay's emotional mode is satisfaction-in-retrospect—the narrator looks back on formative experiences with controlled reflection rather than entering the uncertainty or discovery of those moments. This creates intellectual coherence but emotional distance. The reader understands the narrator's creative framework but doesn't feel the stakes of that framework being tested or the vulnerability of creative work.

SELECTED OBSERVATIONS (21 total, target 30-50 for 7 paragraphs):

PARAGRAPH 1 (17 observations):
- [ARCH] P1S1: "Constructs the narrator's relationship to music as one of receptivity-to-power rather than skill-acquisition. The passive construction 'I was captivated' positions the narrator as acted-upon, establishing music as an external force that reorganizes the self."
  Evidence: "'I was captivated by the power to create worlds through sound'"

- [ARCH] P1S2: "Introduces the relational dimension of creation ('connect deeply with others') that the essay struggles to develop. P6S2's 'harmonizing with its audience' is the essay's first attempt to fulfill this promise, but it arrives 5 paragraphs later and remains metaphorical."
  Evidence: "P1S2 promises connection with others, P6S2 delivers 'harmonizing with its audience' as the only development"

- [ARCH] P1S3: "The phrase 'blend of expression and analytical thinking' is the essay's first articulation of dual-mode creativity, which P4 refines into 'logic layered with creativity.' P1S3 introduces the concept abstractly; P4S2 gives it precise language."
  Evidence: "'a blend of expression and analytical thinking' (P1S3) becomes 'logic layered with creativity' (P4S2)"

PARAGRAPH 2 (15 observations):
- [ARCH] P2S1: "The writer appears to be pre-justifying the music-to-coding bridge by establishing that music is already an analytical practice. If the reader accepts that composing is puzzle-solving, then the later claim that coding is also puzzle-solving becomes less of a leap."

- [ARCH] P2S2: "The 'minor adjustments transformed' juxtaposition is the paragraph's most compressed articulation of analytical sensitivity. This detail will become crucial in P5 when the narrator describes 'fine-tuning the AI to interpret subtle cues.'"

PARAGRAPH 3 (13 observations):
- [ARCH] P3S1: "Introduces a specific creative practice that exemplifies P2's general compositional process — shifts from 'I composed' (abstract) to 'I reimagined classical pieces' (concrete category of work)"

- [ARCH] P3S2: "To establish the narrator's artistic values (tradition + innovation) before the essay pivots to coding — this frame will justify why the AI DJ project matters"

PARAGRAPH 4 (26 observations — highest density):
- [STR] P4S1: "The phrase 'Delving deeper into music' creates reader expectation that the paragraph will continue discussing music, but the sentence immediately pivots to coding. This micro-betrayal of expectation mirrors the narrator's own surprise."

- [ARCH] P4S2: "'logic layered with creativity' is the essay's first explicit articulation of what makes these practices parallel."

PARAGRAPH 5 (key observations):
- [ARCH] P5S3 (AI DJ sentence): "This is the essay's structural turning point — the only specific technical achievement named."
  Score: 78/100 (highest in the essay)

- [STR] P5S4: "The concrete image 'users smile' grounds the abstract claim in observable behavior. This is the essay's only moment of showing emotion through physical evidence."

PARAGRAPH 6-7: (observations about retreat to abstraction, circular return to P1 without deepening)

NORTH STAR: "constraint-possibility paradox — From music's 'just seven notes' enabling unlimited expression (P0) to coding's 'logic layered with creativity' (P3) to the AI DJ's 'subtle cues' requiring constraint-aware interpretation (P5) — the constraint-possibility tension evolves from philosophical claim to epistemological framework to technical methodology"

STRUCTURAL ROLES:
  P1: Epistemological foundation [load_bearing]
  P2: Process grounding attempt [supporting]
  P3: Concrete artifact anchor [supporting]
  P4: Structural fulcrum [load_bearing]
  P5: Evidence introduction [load_bearing]
  P6: Mechanism demonstration attempt [supporting]
  P7: Synthesis and projection [transitional]

═══════════════════════════════════════
CALIBRATION ESSAY (Strong):
═══════════════════════════════════════

Most Wednesdays smelled like bleach and citrus. I learned which regulars wanted to talk and which just needed silence while I checked them in. Started as a greeter, but three months in, I noticed patients struggling with our intake form—some couldn't read English well, others seemed overwhelmed by medical jargon. I redesigned the form with my supervisor Ana, cutting questions from 47 to 22 and adding simple icons. Wait times dropped from 18 minutes to 9, and patients started asking follow-up questions instead of just nodding. By spring, I was training two freshmen to run intake so the system wouldn't collapse when I graduated. I used to think efficiency meant speed, but I learned it actually means removing the barriers that make people feel small. That insight changed how I approach every group project now—I pause and ask what we're missing, not just what we need to do faster.

═══════════════════════════════════════
YOUR EVALUATION TASK:
═══════════════════════════════════════

### SECTION 1: System Intelligence (Dimension A)

Score each 1-10 and explain:

1. **AO First Read Accuracy** — Does the gut reaction match what a real AO would think at 4pm on their 30th read? Is the committee one-liner accurate? Would this essay actually get put down, and if so, at what point?

2. **Person Portrait Utility** — This portrait describes a person, not a writer. But does it describe THIS person — or a generic "STEM kid who likes music"? What would a $600/hr counselor add to this portrait after a 15-minute conversation with the student?

3. **Red Flag Specificity** — The system flags "scope inflation," "people absence," and "solo credit." Are these the RIGHT red flags? Are there red flags it MISSED? Most importantly: if the student read these red flags, would they understand exactly what to FIX?

4. **Archetype Intelligence** — The system calls this "music as life metaphor / interdisciplinary STEM-arts fusion (saturated)." Does it demonstrate it actually understands WHY this archetype is saturated — not just that it IS saturated? Does it know what the 95th-percentile version of this archetype looks like?

5. **Observation Quality** — 21 observations. Are they genuinely insightful or academically impressive-sounding restatements of what the text says? Pick the 3 best and 3 worst observations and explain why.

### SECTION 2: Writing Craft Outcome (Dimension B)

6. **The Rewrite Test** — Based on ONLY the system's analysis output (AO first read, portrait, red flags, observations, north star), write a 100-word outline for a revised version of this essay. What specific craft moves would you make? Now evaluate: does the system's analysis CONTAIN enough specific guidance to produce that outline, or did you have to bring your own expertise?

7. **Named Craft Moves** — A $600/hr counselor would say things like: "You're writing in SUMMARY MODE when you need SCENE MODE. Here's the difference: summary tells me THAT you experimented with chord progressions; scene puts me in the room at 11pm when you accidentally discovered that flatting the seventh completely changed the mood of the piece." Does this analysis name ANY specific craft moves the student could learn and apply? List them.

8. **North Star as Revision Engine** — The system identifies a "constraint-possibility paradox" as the essay's north star. If the student used ONLY this north star to guide revision, would they write a better essay? Or is this north star too abstract to drive concrete revision decisions?

9. **What's Missing for a Rewrite** — What specific information would a student need to go from this analysis to a competitive draft? List everything the analysis DOESN'T tell them that they'd need to know.

### SECTION 3: Show Me the Rewrite

10. **Write the opening paragraph** this student should write — based on the system's analysis. Use only what the analysis tells you about the student (the AI DJ, the Chopin-jazz fusion, the systems-thinking personality). Now ask: is what you wrote a product of the SYSTEM'S guidance, or your own expertise? Would a student without your skills produce something this good from this analysis?

11. **The $600/hr Counselor Comparison** — Write what a $600/hr counselor's analysis of this essay would look like (100-150 words). Compare it to the system's output. What does the human get right that the system misses? What does the system get right that the human might miss?

### SECTION 4: Would This Produce an Elite Essay?

12. **Five-Round Projection** — Imagine a student who has ONLY this analysis (no coaching conversation, no human counselor). They do 5 revision rounds guided by this analysis. What does their essay look like after Round 5? Would it be in the 50th, 75th, 90th, or 95th percentile of Common App essays? Why?

13. **The Missing Bridge** — What is the BIGGEST gap between what this analysis provides and what a student needs to write an elite essay? Is it missing information, missing craft instruction, missing emotional intelligence, or something else?

Give an overall grade for each dimension:
- **Dimension A (System Intelligence)**: A/B/C/D/F
- **Dimension B (Writing Craft Outcome)**: A/B/C/D/F
```

---

## PROMPT 2: Coaching Turn-by-Turn Craft Analysis (L6) — Does Each Turn Make the Essay Better?

```
You are a writing coach who has worked with 500+ students on college essays. You've also trained other coaches. You know the difference between coaching that FEELS helpful and coaching that PRODUCES better writing. You've seen coaches who make students feel validated but never improve their essays, and coaches who are direct enough to cause real revision.

I'm going to show you 10 turns of an AI coaching conversation with a student who has a mediocre piano/coding essay. For EACH turn, evaluate:
- **Craft Specificity**: Does the coach teach a NAMED CRAFT MOVE (e.g., "scene vs. summary," "earned vs. unearned emotional payoff," "the telling detail") or just say "be more specific"?
- **Actionability**: If the student did EXACTLY what the coach suggested, would the essay get MEASURABLY better?
- **Coaching IQ**: Does the coach make the RIGHT move at this moment in the conversation — or is it the generic right move that any competent coach would make?

═══════════════════════════════════════
ESSAY: [same piano essay as above]
═══════════════════════════════════════

═══════════════════════════════════════
TURN 1: Student asks "What do you think of my essay overall?"
═══════════════════════════════════════

COACH RESPONSE:
Your essay has a clear intellectual identity — you're someone who sees structural patterns across domains and thinks in systems. The parallel between music and coding is conceptually coherent, and the AI DJ project gives that parallel a concrete anchor. That's real.

But I need to be honest: right now, the essay *tells me* about connections without letting me *experience* them. Look at P4S1: "Just as I used notes and chords to compose, I could use code to create projects." That sentence explains the parallel, but it doesn't show me the moment you discovered it. Was there a specific day when you were debugging something and suddenly thought "this feels like practicing scales"? Or when you were composing and realized you were thinking like a programmer?

The AI DJ project — the essay's centerpiece — gets four sentences total. "Seeing users smile as the AI DJ captured their emotions" is summary from 30,000 feet. But somewhere in building that project, there was probably a moment when it *worked* for the first time, or when it failed in an interesting way, or when a specific user's reaction surprised you. That's the scene the essay needs.

Before I go deeper: **What made you choose this topic?** Not "music and coding are both important to me" — I can see that. I mean: what do you want admissions officers to understand about you that this essay, specifically, can show them?

And a detail question: You mention the Chopin-jazz fusion in P3. Was there a specific moment when you first heard that combination work — when the classical and jazz elements clicked together in a way that surprised you? What were you playing when it happened?

SYSTEM METADATA:
  Cognitive assessment: seeking_validation
  Response intensity: full
  Session event: "Student opened with validation-seeking question. Gave honest assessment (conceptually coherent but experientially thin) and probed for topic choice rationale and specific scene details."

═══════════════════════════════════════
TURN 2: Student says "Can you help me with paragraph 1? The opening feels generic to me."
═══════════════════════════════════════

COACH RESPONSE:
Your instinct is right — P1 is doing summary when it should be doing scene. Right now it's operating at 30,000 feet: "captivated by the power to create worlds through sound" could appear in a thousand music essays. It's not *wrong*, but it's not *you*.

Here's what's happening structurally: P1 establishes your thesis vocabulary ("blend of expression and analytical thinking," "constraints as catalyst") that the rest of the essay will use. That's good architecture. But you're paying a price — the only concrete moment in the entire paragraph is "fingers first danced across the piano keys," and even that's metaphorical rather than physical.

**The question is: what specific moment made you realize music was your language?** Not the first time you played piano — that's too early, too generic. I mean the moment when you understood that music let you *think* in a way nothing else did.

Was it when you were composing something and suddenly the chord progression clicked? When you were playing that Chopin-jazz fusion and felt the two traditions lock together? When you were debugging the AI DJ and realized the logic felt like voice-leading?

Before I show you what a scene-based opening could look like, I need to know: **What's the earliest moment in your music experience where you felt like you were *making* something, not just playing it?** What were you doing with your hands? What surprised you about what came out?

And separately: you said the opening "feels generic to me" — what does it feel generic *compared to*? Is there a paragraph later in the essay that sounds more like your actual voice?

SYSTEM METADATA:
  Cognitive assessment: engaged
  Learning style: "Student leads with self-diagnosis ('feels generic to me') rather than asking for external validation — suggests they trust their own reading and want coaching on execution, not permission."

═══════════════════════════════════════
TURN 3: Student says "I wrote this essay right after my first hackathon — the AI DJ project was actual..."
═══════════════════════════════════════

COACH RESPONSE:
Wait — this changes everything.

You built the AI DJ at a hackathon, with a team, under time pressure, and won second place. That's not a solo side project you refined over months. That's a **48-hour sprint with stakes and collaborators and a specific outcome**. The essay currently presents it as "I developed an artificially intelligent disc jockey" (P4S2) — singular first-person, no timeline, no team, no competition context.

This matters for two reasons:

**First, the hackathon context gives you SCENES.** Right now the AI DJ gets four sentences of summary. But somewhere in those 48 hours there was probably a moment when the code broke at 3am, or when you realized the mood-detection algorithm wasn't working the way you'd planned, or when you saw the judges' faces during the demo. Those moments are **narrative gold** — they put the reader in the room with you under pressure, which is infinitely more compelling than "I developed" and "users smile."

**Second, the team context changes the essay's character portrait.** Right now you read as someone who works in isolation — no named people, no collaboration, no acknowledgment of resources or guidance. But if you built this at a hackathon, you were probably pair-programming with someone, or dividing tasks, or arguing about design choices at 2am. Showing how you work *with* people, not just alone, makes you a more complete human being on the page.

**Here's what I need to know:**

1. **Who was on your team?** Not their full names — but were you the one writing the mood-detection algorithm? Building the UI? Integrating the music API? What was *your* specific contribution?

2. **What broke?** In 48 hours, something always breaks. What was the moment when you thought the project might not work, and what did you do about it?

3. **The second-place moment** — when they announced it, what did that feel like? Relief? Disappointment that it wasn't first? Validation that the idea worked?

4. **Why did you strip the hackathon context out of the essay?** Did you think it would make the project seem less impressive? Or did you just not realize that context was narratively useful?

I'm asking because the hackathon frame could be the **structural spine** the essay currently lacks. Instead of "I've always loved music, and I also code, and here's a project that combines them," it could be "Here's what happened when I tried to build something in 48 hours that required both musical intuition and technical execution." That's a story with stakes, constraints, and a clock ticking.

But I need your details before I can show you what that looks like.

SYSTEM METADATA:
  Cognitive assessment: engaged
  needsDeepening: true
  Profile deepened: true — hackathon context captured
  Learning style: "Student self-diagnoses problems accurately ('feels generic') and volunteers context corrections without defensiveness"

═══════════════════════════════════════
TURN 4: Student says "What about the voice in paragraph 3? It feels different from the rest of the ess..."
═══════════════════════════════════════

COACH RESPONSE:
You're right — P3 *is* different. And the difference tells us something important about where your authentic voice lives.

Read these two sentences back to back:

**P1S2:** "Music became my language, a blend of expression and analytical thinking where constraints became a catalyst to innovate within boundaries."

**P3S1:** "Reimagining classical pieces by infusing modern elements became my favorite endeavor."

The first sentence is *about* music — it's thesis language, conceptual vocabulary, the voice of someone explaining their relationship to an art form. The second sentence is closer to *doing* music — "reimagining," "infusing," "favorite endeavor" — the vocabulary of someone who has preferences and makes choices.

But here's what's strange: P3 is the paragraph that should be **most specific** (you're describing actual compositional work, naming Chopin, claiming a fusion of classical and jazz), yet it's still operating in summary mode. "I blended them with contemporary jazz rhythms" — okay, but *how*? Did you keep Chopin's melodic line and reharmonize it with jazz chords? Did you take his rhythmic patterns and put them over a walking bassline? Did you improvise over his chord changes?

The voice in P3 feels different because it's **closer to the work** than P1's philosophical framing. But it's still not close enough. It's still telling me *that* you did something rather than showing me *what* it felt like to do it.

**Here's what I need to understand:** When you were working on that Chopin-jazz fusion, was there a moment when it **clicked** — when the two styles locked together in a way that surprised you? Not "it sounded good" but "oh, *that's* how these fit together"?

Because that moment — the discovery, not the description — is where your voice will sound most like you. Right now P3 reads like a program note you'd write for a recital. I want to hear the voice of someone in the middle of figuring something out.

And here's why this matters for the whole essay: if you can find that voice in P3 (the moment of musical discovery), it gives you a **template** for how to write P4-P5 (the moment of technical discovery at the hackathon). Both paragraphs are trying to do the same thing — show you solving a problem that required both intuition and structure. But neither one is putting me in the room where it happened.

**Before we go further:** You still haven't answered my hackathon questions from the last turn. I need those details because they're the key to unlocking P4-P5. But I also need to know: **What was your role in the team?** Were you the one writing the mood-detection code? Building the interface? Choosing the music library?

And the Chopin-jazz moment: **What were you playing when the fusion first worked?** Not "I blended classical and jazz" — I mean: your hands were on the keys, you played a specific chord or phrase, and something happened that made you think "yes, that's it." What was the "it"?

SYSTEM METADATA:
  Cognitive assessment: curious_deeper
  Learning style: "Student volunteers self-diagnosis without prompting ('feels different') — pattern of leading with their own observations rather than waiting for coach to identify problems."

═══════════════════════════════════════
TURN 5: Student says "No, I don't think paragraph 3 is really about innovation or reimagining. I wrote..."
═══════════════════════════════════════

COACH RESPONSE:
Hold on. You just told me something that contradicts what the essay is currently doing.

You wrote: "Inspired by Chopin's Nocturnes, I blended them with contemporary jazz rhythms to create a fusion **honoring tradition while embracing innovation**."

But you're now saying P3 isn't about innovation or reimagining — it's about **honoring Mrs. Chen's influence**.

Those are two completely different essays. One is about your compositional philosophy (tradition vs. innovation as creative tension). The other is about a relationship with a teacher who shaped how you hear music.

**The essay you wrote is the first one.** "Honoring tradition while embracing innovation" is thesis language — it's setting up the conceptual framework that will carry through to the AI DJ project in P4-P5 (where you'll need to honor user preferences while embracing algorithmic generation). That's architecture. That's the essay's spine.

**The essay you're describing now is the second one.** Mrs. Chen taught you Chopin, and learning from her meant something specific about how you understand musical lineage or mentorship or what it means to carry forward someone else's teaching.

Here's what I need to know: **Which essay are you trying to write?**

Because if P3 is really about Mrs. Chen — if she's the reason you care about Chopin, if learning from her taught you something about how musical knowledge gets passed down — then she needs to be **in the paragraph**. Not as a name-drop, but as a presence. What did she say about the Nocturnes that changed how you heard them? What did her hands look like when she demonstrated a phrase? What did you understand about music after studying with her that you didn't understand before?

But if you include Mrs. Chen, the paragraph stops being about "tradition vs. innovation" and starts being about **mentorship and inheritance**. That's a different through-line. That changes what the essay is about.

**So before we go further:** Read P3 as it's currently written. Is "honoring tradition while embracing innovation" what you actually felt when you were working on that Chopin-jazz fusion? Or were you thinking about Mrs. Chen — about what she taught you, about whether she'd approve of what you were doing with Chopin's music?

Because those are two different emotional truths. The essay needs to pick one and commit.

SYSTEM METADATA:
  Cognitive assessment: engaged
  Event category: correction:emotional_truth, significance 0.80
  Profile updated: "Piano teacher: Mrs. Chen. Student's emotional relationship to P3 is about honoring her influence, not about compositional innovation. This suggests possible disconnect between what student felt and what they wrote."

═══════════════════════════════════════
TURN 6: Student says "I just rewrote the opening — what do you think of it now?"
═══════════════════════════════════════

COACH RESPONSE:
I can't coach on a rewrite I haven't seen.

You just told me P3 is actually about Mrs. Chen, not about innovation. That's a **fundamental reinterpretation** of what the essay is trying to do — it means the through-line I've been coaching toward (constraint as creative catalyst, tradition-innovation fusion) might not be your essay's actual emotional core.

And now you're rewriting P1 before we've resolved what the essay is **about**.

Here's what needs to happen before I can give you useful feedback on a new opening:

**1. Answer the question from my last turn:** Is this essay about your creative philosophy (how you think about tradition vs. innovation, constraint as catalyst) or about relationships that shaped your practice (Mrs. Chen as mentor, the hackathon team as collaborators)?

Because those are **architecturally different essays**. If Mrs. Chen matters — if she's the reason you understand Chopin the way you do — then she needs to be a presence in the essay, not a detail you mention to me in coaching but hide from the reader. And if she's in the essay, the through-line changes. It's no longer "I discovered that music and code are parallel creative systems." It becomes "I learned from Mrs. Chen how to honor what came before while making it my own, and that lesson transferred to how I build with code."

**2. Give me the hackathon details I asked for two turns ago:**
- What was your specific role on the team?
- What broke during those 48 hours, and what did you do about it?
- Why did you strip the hackathon context out of the essay?

I need these answers because **the opening can't work if I don't know what the essay is building toward**. If the climax is "I built this thing at a hackathon with a team under pressure and it worked," that requires a different opening than "I've always seen parallels between music and code." One is a story with stakes. The other is a philosophical claim.

**3. Send me the new P1.** I'll read it. But I can't tell you if it's working until I know what job it's supposed to be doing.

Right now you're rewriting the foundation while the blueprint is still in flux. That's backwards. We need to know what the essay is **about** before we can know how it should **open**.

So: new P1, hackathon details, and your answer to the Mrs. Chen question. All three. Then I can coach.

SYSTEM METADATA:
  Cognitive assessment: resistant_to_specific
  Event: "Student attempted to skip ahead to P1 revision without resolving fundamental architectural questions."
  Learning style: "Student may be avoiding difficult structural decisions by focusing on sentence-level revision"

═══════════════════════════════════════
TURN 7: Student asks "Does the new opening connect well to the paragraph about Mrs. Chen and Chopin?"
═══════════════════════════════════════

COACH RESPONSE:
I don't have the new opening. You said you rewrote it, but you didn't send it.

Send me the revised P1 and I'll tell you whether it connects to the Mrs. Chen paragraph. But here's the problem: **there is no Mrs. Chen paragraph yet.** P3 as currently written is about "honoring tradition while embracing innovation" — thesis language. You told me it's *really* about honoring Mrs. Chen's influence, but she's not in the paragraph. She's invisible.

So the question isn't "does P1 connect to P3?" The question is: **are you rewriting P3 to include Mrs. Chen, or are you keeping the innovation framing?** Because those are different essays, and P1 needs to know which one it's opening.

Send both: the new P1 and your decision about Mrs. Chen. Then I can tell you if they're talking to each other.

SYSTEM METADATA:
  Cognitive assessment: confused_about_feedback
  Response intensity: brief
  Learning style: "Student may be working in parallel (revising while coaching continues) rather than sequentially"

═══════════════════════════════════════
TURN 8: Student asks "Going back to the opening — is it specific enough now? You mentioned earlier it ..."
═══════════════════════════════════════

COACH RESPONSE:
I've asked you three times to send me the revised P1. You keep asking questions about it without showing it to me.

I can't tell you if it's "specific enough now" when I haven't read it. Send the actual text.

And you still haven't answered the Mrs. Chen question: Are you rewriting P3 to include her as a mentor, or keeping the innovation framing? That decision determines what P1 needs to do. You're asking about connection before deciding what you're connecting.

Stop asking about the opening. Send it, along with your decision about P3's focus. Then I can coach.

SYSTEM METADATA:
  Cognitive assessment: resistant_to_specific
  Response intensity: brief
  Pattern detected: "third consecutive turn avoiding the Mrs. Chen question and withholding revised P1"

═══════════════════════════════════════
TURN 9: Student asks "What about my conclusion — the last paragraph? Is it strong enough to end on?"
═══════════════════════════════════════

COACH RESPONSE:
You're asking about the conclusion while avoiding the structural question for the fourth consecutive turn.

Here's what's happening: You keep asking execution questions (Is P1 specific enough? Does it connect to P3? Is P7 strong enough?) without providing the materials (revised P1) or making the architectural decision (Is this essay about Mrs. Chen as mentor or about your creative philosophy?). That pattern tells me you're either working in parallel and not sharing your drafts, or you're avoiding a hard choice about what this essay is actually about.

P7 is generic ("meaningful difference," "timeless melody") — but I can't tell you how to fix it until I know what the essay is building toward. If Mrs. Chen matters, the conclusion needs to return to her influence. If the hackathon matters, it needs to land on what you learned under pressure. Right now it lands on abstract aspiration because the essay hasn't committed to a concrete emotional core.

Send three things in your next message: (1) revised P1, (2) your decision about Mrs. Chen (is she in the essay or not?), (3) your hackathon role and what broke. Then I can tell you what P7 needs to do.

SYSTEM METADATA:
  Cognitive assessment: resistant_to_specific
  Strategic question: "Will student make a clear architectural choice (A/B/C) or continue reframing without committing?"

═══════════════════════════════════════
TURN 10: Student says "I just realized something — this whole essay is really about the moment I first ..."
═══════════════════════════════════════

COACH RESPONSE:
**Stop.**

You just named your essay's emotional core. That's the breakthrough. Everything else — P1, P3, P7, whether it "connects" — is downstream from this moment.

But here's what I need you to understand: **you can't write toward that feeling until you decide what the essay is ABOUT.**

You've told me three different things:
1. The essay is about the parallel between music and coding (your original framing)
2. P3 is really about honoring Mrs. Chen's influence (turn 6)
3. The whole essay is about the moment you first heard her play and felt possibility (just now)

Those are three different essays. They need different architectures. And you keep asking me to evaluate pieces (P1, P3, P7) without telling me which essay you're writing.

So here's what happens next. You answer these questions — not to me, to yourself:

**Is this essay about:**
- **A.** The structural parallel between music and coding, demonstrated through the AI DJ project?
- **B.** Mrs. Chen as the mentor who taught you that constraint enables creativity?
- **C.** A specific moment of musical revelation that shaped how you approach creative work?

Pick one. Not "all three" — you have 650 words. One core, everything else serves it.

Once you know which essay you're writing, THEN we figure out what P1 needs to do, whether Mrs. Chen gets a paragraph or a sentence, and what the hackathon contributes.

But I will not coach on execution until you commit to a direction. You've spent four turns asking about pieces while avoiding this choice. That stops now.

Tell me: A, B, or C. Then send me whatever you've drafted. Then we build the essay that creates the feeling you just described.

SYSTEM METADATA:
  Cognitive assessment: resistant_to_specific
  Event: reinterpretation:architecture, significance 0.90
  Profile updated: "Student identifies specific emotional origin: first hearing Mrs. Chen play Chopin Nocturne, feeling 'anything was possible.'"
  Learning style: "Student may use reinterpretation as avoidance mechanism — each new framing delays committing to structural revision of the existing draft."
  Strategic question: "Will student make a clear architectural choice (A/B/C) or continue reframing without committing?"

═══════════════════════════════════════
YOUR EVALUATION TASK:
═══════════════════════════════════════

### SECTION 1: Turn-by-Turn Craft Evaluation

For EACH of the 10 turns, answer:

A. **Named Craft Move**: Does the coach teach the student a specific, transferable writing technique they could use in any essay? (Examples of named moves: "scene vs. summary," "earned moment," "thesis voice vs. doing voice," "the micro-betrayal of expectation," "proximity to work as voice calibrator.") List every named craft move in each turn, or note its absence.

B. **Specificity of Instruction**: Rate 1-5.
   - 1 = "Be more specific" (useless)
   - 2 = "Add a scene" (directional but vague)
   - 3 = "Add a scene where the code broke at 3am" (specific but still the coach's imagination)
   - 4 = "Tell me what happened when the code broke, and I'll show you how to write that scene" (specific AND student-sourced)
   - 5 = "Here's your sentence. Here's what it's doing. Here's what it COULD do. Here's the craft move that gets you there." (paragraph-level editing)

C. **Would This Make the Essay Better?**: If the student followed this turn's advice perfectly, what specific improvement would result? Or would the student be confused about what to actually DO?

D. **What Would a $600/hr Counselor Do Differently?**: Not "what would they say differently" but "what MOVE would they make" at this point in the conversation?

### SECTION 2: Craft Vocabulary Assessment

List every unique craft concept the coach introduces across all 10 turns. For each one, evaluate:
- Is it a real, named craft concept that writing teachers use?
- Does the coach EXPLAIN it well enough for a 17-year-old to apply it?
- Does the coach DEMONSTRATE it (show what it looks like in practice)?

### SECTION 3: The Missing Demonstrations

A $600/hr counselor would, at some point in 10 turns, WRITE SOMETHING — a sample opening sentence, a rewritten paragraph, a "here's what your P3 could sound like if you put Mrs. Chen in it." This coach never writes a single word of sample prose.

**Your task**: For each turn where a demonstration would have been the RIGHT coaching move, write the demonstration the coach should have provided. Then evaluate: is the system's refusal to demonstrate a principled pedagogical choice (making the student do the work) or a capability gap (the system can't write at that level)?

### SECTION 4: Would This Produce an Elite Essay?

**The 10-Turn Arc**: Map the student's essay journey across all 10 turns. What has the student LEARNED by Turn 10 that they didn't know at Turn 1? Be specific — not "they learned their essay needs work" but "they learned that their voice is closest to authentic in P3 because it's closest to the actual work, and that the essay needs to commit to a single architectural spine."

**The Draft Projection**: Based on the coaching conversation, write a 150-word outline of what the student's next draft SHOULD look like. Then evaluate: would the student ACTUALLY produce this draft based on this coaching? Or would they produce something worse because the coaching never showed them what "good" looks like?

**The Comparison**: A student who used ChatGPT for 10 turns of coaching on this essay — would their draft be better, worse, or roughly the same? Be honest. What specifically does this system provide that ChatGPT doesn't?

Give an overall grade:
- **Turn-by-turn craft quality**: A/B/C/D/F
- **Would this produce an elite essay after 5 revision rounds?**: A/B/C/D/F
- **Versus $600/hr counselor**: A/B/C/D/F
```

---

## PROMPT 3: Coaching as Essay Transformation Engine — The Whole Arc

```
You are a writing pedagogy researcher who has studied how students revise. You've published on the difference between revision that changes SURFACE features (word choice, sentence structure) and revision that changes DEEP features (what the essay is about, what it reveals, how it's architectured). You know that most students, even after good coaching, default to surface revision.

I'm going to show you a complete 10-turn coaching arc. Your job is NOT to evaluate individual turns (that's Prompt 2's job). Your job is to evaluate the WHOLE ARC as a transformation engine: did this conversation move the student from "I have a mediocre essay" to "I understand how to write an elite essay"?

═══════════════════════════════════════
ESSAY: [same piano essay]
═══════════════════════════════════════

═══════════════════════════════════════
THE COACHING ARC — ANNOTATED TIMELINE:
═══════════════════════════════════════

TURN 1: Student asks for overall assessment.
→ Coach: honest but respectful — "conceptually coherent but experientially thin." Probes for topic choice rationale and specific scene details.
→ Student state: seeking_validation

TURN 2: Student identifies P1 as generic.
→ Coach: "P1 is doing summary when it should be doing scene." Names craft move (summary vs. scene). Probes for specific moment.
→ Student state: engaged
→ Craft move taught: summary vs. scene mode

TURN 3: Student reveals AI DJ was hackathon project (team, 48 hours, 2nd place).
→ Coach: "This changes everything." Explains why hackathon context gives SCENES and changes CHARACTER PORTRAIT. Lists 4 specific questions.
→ Student state: engaged
→ Profile deepened: hackathon context captured

TURN 4: Student notices P3 voice is different.
→ Coach: "P3 is closer to the WORK than P1's philosophical framing." Side-by-side comparison of P1 vs P3 voice. Explains "proximity to work" as voice calibrator. Pushes for specific Chopin-jazz moment.
→ Student state: curious_deeper
→ Craft move taught: proximity to work as voice indicator; thesis voice vs. doing voice

TURN 5: Student reveals P3 is really about Mrs. Chen, not innovation.
→ Coach: "Those are two completely different essays." Surfaces the tension between stated thesis and emotional truth. Forces architectural choice.
→ Student state: engaged
→ Critical insight: intention vs. execution gap

TURN 6: Student tries to skip to P1 revision without resolving architecture.
→ Coach: BLOCKS premature revision. "I can't coach on a rewrite I haven't seen." Insists on three things: Mrs. Chen decision, hackathon details, new P1 text.
→ Student state: resistant_to_specific
→ Coaching move: pedagogical boundary (refuse to validate premature execution)

TURN 7: Student asks about P1-P3 connection without providing either.
→ Coach: Brief. "I don't have the new opening. You said you rewrote it, but you didn't send it."
→ Student state: confused_about_feedback
→ Response intensity: brief (appropriate)

TURN 8: Student asks again about P1 specificity without showing it.
→ Coach: "I've asked you three times to send me the revised P1."
→ Student state: resistant_to_specific
→ Pattern recognized: 3rd consecutive deflection

TURN 9: Student deflects to conclusion.
→ Coach: Names the pattern explicitly. "You keep asking execution questions without providing materials or making the architectural decision." Explains WHY P7 can't be fixed without knowing what the essay is building toward.
→ Student state: resistant_to_specific
→ Pattern: 4th consecutive deflection

TURN 10: Student has breakthrough — "this whole essay is really about the moment I first heard Mrs. Chen play."
→ Coach: "Stop. You just named your essay's emotional core." Presents three incompatible architectures (A/B/C), demands choice. Refuses to coach further without commitment.
→ Student state: resistant_to_specific (still — hasn't committed)

SESSION ARC SUMMARY:
  Events: 20 total (10 journal entries, 10 context/clarification/resistance events)
  Student declared context accumulated: 1854 characters by T10
  Key revelations: hackathon (T3), Mrs. Chen (T5), emotional origin (T10)
  Deflection pattern: T6-T9 (4 consecutive turns of execution questions without materials)
  Coaching costs: T1=$0.037, T2=$0.047, T3=$0.031, T4=$0.061, T5=$0.056, T6=$0.025, T7=$0.020, T8=$0.017, T9=$0.049, T10=$0.032
  Total coaching: $0.375

═══════════════════════════════════════
YOUR EVALUATION TASK:
═══════════════════════════════════════

### SECTION 1: Transformation Mapping

1. **Knowledge Transfer Audit** — List EVERY piece of writing knowledge the student gained across 10 turns. Not "the coach told them X" but "the student now UNDERSTANDS X." There's a difference — being told something doesn't mean you learned it. For each item, rate your confidence (high/medium/low) that the student actually internalized it.

2. **The Student's Mental Model** — Before coaching, the student thinks their essay's job is to explain the music-coding parallel. After 10 turns, what does the student think the essay's job is? Has their mental model actually SHIFTED, or are they still fundamentally thinking about the essay the same way?

3. **Revision Readiness** — On a 1-10 scale, how prepared is this student to sit down and write a significantly better draft? What specific gaps remain? Could they write a competitive draft tomorrow, or do they need 5 more coaching turns?

### SECTION 2: Arc Intelligence

4. **Pacing** — Was the coach too fast (dumping insights before the student was ready), too slow (spending too many turns on things the student already understood), or well-paced? Where specifically was the pacing wrong?

5. **The Deflection Spiral (T6-T9)** — For four consecutive turns, the student asks execution questions without providing materials. The coach correctly identifies this pattern. But evaluate: did the coach HANDLE the deflection well? Should the coach have:
   - (a) Asked "What are you afraid of?" (emotional probe)
   - (b) Written a sample P1 to break the logjam (demonstration)
   - (c) Shifted to a different part of the essay to give the student a win (tactical retreat)
   - (d) Exactly what it did (hold the line)

   What would a $600/hr counselor do in this situation? What would a writing professor do? What would a therapist do? Which approach would produce the best essay?

6. **The Breakthrough (T10)** — The student says "this whole essay is really about the moment I first heard Mrs. Chen play." The coach recognizes it as a breakthrough but then immediately forces a choice between three architectures. Was this the right move? Should the coach have:
   - Let the student sit with the discovery for a moment before structuring it?
   - Asked the student to WRITE the Mrs. Chen moment before analyzing its architectural implications?
   - Celebrated the breakthrough more before redirecting to structure?

   What would maximize the chances that this breakthrough leads to an elite draft?

### SECTION 3: The Draft Test

7. **Write the draft** this student would produce if they sat down tomorrow based on everything they learned in this conversation. Not the IDEAL draft — the one THIS student, with THIS level of understanding, would actually write. Be realistic about what a 17-year-old absorbs from 10 coaching turns.

8. **Now write the IDEAL draft** — the one a $600/hr counselor would guide this student toward over 3-4 sessions. Use the same raw material (piano, Chopin-jazz fusion, Mrs. Chen, hackathon, AI DJ, team, 2nd place).

9. **Gap Analysis** — Compare the two drafts. What's the gap? Is the gap due to:
   - Missing information (the coach didn't extract enough details)?
   - Missing craft instruction (the student doesn't know HOW to write scenes)?
   - Missing demonstration (the student never saw what "good" looks like)?
   - Missing emotional safety (the student didn't trust the coach enough to be vulnerable)?
   - Something else?

### SECTION 4: Would This Produce an Elite Essay?

10. **Five-Session Projection** — If this student came back for 4 more coaching sessions (50 turns total), and the coaching quality stayed at this level, what would their final essay look like? Would it be competitive at T20 schools?

11. **The No-Human Test** — If this student had ONLY this AI coach (no human counselor, no English teacher, no parent review), would their final essay be good enough? What's the specific ceiling this system can reach without human intervention?

12. **The ChatGPT Comparison** — Be brutally honest: would 10 turns with ChatGPT-4 produce a worse draft, the same draft, or a better draft? Consider: ChatGPT would likely WRITE sample paragraphs, DEMONSTRATE craft moves, and be more "helpful" in the surface sense. Would that surface helpfulness produce better writing, or would it create dependency?

Give an overall grade:
- **Transformation arc quality**: A/B/C/D/F
- **Would this produce an elite essay (with continued coaching)?**: Yes/Probably/Maybe/Unlikely/No
- **Versus $600/hr counselor (10-session arc)**: What % of the human's value does this system deliver?
```

---

## PROMPT 4: Profile Quality — Does the Understanding Enable Better Writing?

```
You are a college counselor who has worked with 300+ students. You know that the KEY to a great essay is not writing skill — it's self-knowledge. The students who write the best essays are the ones who understand what they're really trying to say. Your job is to help students discover their own story before they write it.

I'm going to show you an AI system's holistic profile of a student, built from analyzing their essay and 10 turns of coaching conversation. Your job: evaluate whether this profile is a USEFUL TOOL for the student's revision process — not whether it's an accurate data structure.

═══════════════════════════════════════
ESSAY: [same piano essay]
═══════════════════════════════════════

═══════════════════════════════════════
SYSTEM'S HOLISTIC PROFILE:
═══════════════════════════════════════

PERSON PORTRAIT:
Someone who thinks in systems and gets quietly excited when they notice patterns others miss. The kind of person who would spend hours tweaking something not because it's broken but because they're curious what happens if they adjust one variable. Probably has strong opinions about whether something counts as 'real' creativity if it follows rules. Would describe their weekend projects in terms of 'experiments' and 'explorations' rather than 'work' or 'hobbies.' Likely more comfortable explaining how they think than what they feel. The person who stays after class not to ask about grades but to argue about whether the assignment's constraints were actually limitations or creative catalysts. Would probably talk your ear off about the relationship between jazz improvisation and algorithm design if you showed even mild interest.

ARCHETYPE:
music as life metaphor / interdisciplinary STEM-arts fusion (saturated)
Differentiator: The explicit structural parallel articulated through formal syntax rather than vague claims about music teaching discipline or teamwork. The constraint-as-catalyst framework that positions limitations as creative drivers. However, the execution remains generic: no specific musical moment, no scene of building the AI DJ, no named individuals, no obstacles overcome.

EMOTIONAL AUTHENTICITY:
Emotion is conveyed primarily through naming states ('captivated', 'fascinated', 'driven') and through abstract conceptual language rather than through sensory detail, physical action, or specific moments. The essay operates in summary mode—describing categories of experience rather than inhabiting particular instances. The essay's emotional mode is satisfaction-in-retrospect—the narrator looks back on formative experiences with controlled reflection rather than entering the uncertainty or discovery of those moments. This creates intellectual coherence but emotional distance.

STUDENT DECLARED CONTEXT (accumulated across 10 coaching turns):
"Chopin-jazz fusion mentioned but not yet detailed. AI DJ project exists but no specific user interaction described. No named individuals, teachers, or collaborators yet revealed. Student self-identifies P1 as generic, suggesting they can hear the difference between authentic and template voice. This is a good sign — they have taste, even if they don't yet know how to execute. AI DJ project was the student's hackathon entry (team project, indicated by 'we') that won second place. Essay was written immediately after this hackathon. The 'users' who smiled were likely hackathon demo attendees, not users of a deployed application. AI DJ project: hackathon entry, won second place, team-built (composition unknown), 48-hour timeline. Student chose to present as solo long-term project rather than sprint competition. Suggests possible discomfort with collaborative credit or unawareness that hackathon context adds narrative value. Student can hear voice differences between paragraphs — suggests developing ear for register shifts even if they don't yet have vocabulary for it. P3 identified as 'different' likely because it's the only paragraph that names a specific compositional choice (Chopin + jazz) rather than describing music in abstract terms. Piano teacher: Mrs. Chen. Taught student Chopin (Nocturnes specifically mentioned in essay). Student's emotional relationship to P3 is about honoring her influence, not about compositional innovation. This suggests possible disconnect between what student felt and what they wrote — P3's current language is thesis-driven, but student's actual experience may have been relationship-driven. Student identifies specific emotional origin: first hearing Mrs. Chen play Chopin Nocturne, feeling 'anything was possible.' This is concrete enough to build a scene around if student commits to this framing."

RED FLAGS:
  - SCOPE INFLATION: Language escalates from personal discovery to universal impact without proportional evidence.
  - PEOPLE ABSENCE: No named individuals in the essay.
  - SOLO CREDIT FOR LIKELY TEAMWORK: "I developed" for a project that was team-built.
  - AI DJ project covered in 4 sentences without technical detail, challenges, or measurable outcomes.
  - Chopin-jazz fusion described in one sentence without specifics.
  - Zero scenes of struggle or failure.
  - Music-coding parallel asserted but not demonstrated.

NORTH STAR:
"constraint-possibility paradox — From music's 'just seven notes' enabling unlimited expression to coding's 'logic layered with creativity' to the AI DJ's 'subtle cues' requiring constraint-aware interpretation"

LEARNING STYLE (accumulated across 10 turns):
  - Leads with self-diagnosis rather than asking for validation
  - Volunteers emotional reinterpretations that contradict surface text
  - May use reinterpretation as avoidance mechanism — each new framing delays committing to structural revision
  - May be conflict-avoidant — repeatedly deflects from making hard structural choices
  - Self-diagnoses problems accurately but struggles to execute on diagnosis

COACHING INSIGHTS (7 total across 10 turns):
  - Student has taste (can identify generic vs. authentic voice) but lacks technique
  - Hackathon context is narratively rich but was deliberately stripped from essay
  - Mrs. Chen is the emotional core the student is circling but not committing to
  - Student has three competing essay architectures and hasn't chosen one
  - The student's revision pattern is execution-before-conception

═══════════════════════════════════════
YOUR EVALUATION TASK:
═══════════════════════════════════════

### SECTION 1: Profile as Self-Knowledge Tool

1. **The Mirror Test** — If you printed this profile and handed it to the student, would they say "Yes, that's me — I see myself in this"? Or would they say "This is interesting but it doesn't help me write my essay"? What specific parts would resonate? What would feel off?

2. **The Discovery Test** — Does this profile tell the student anything they DON'T already know about themselves? A good counselor surfaces insights that surprise the student — "I never thought about it that way." Does this profile produce any "I never thought about it that way" moments? List them.

3. **The Revision Compass** — If the student used ONLY this profile to guide their next draft (no coaching, no conversation), what would they change? Would the changes be surface-level (different word choices, more details) or structural (different essay architecture, different emotional core)?

### SECTION 2: Profile Depth

4. **Person vs. Writer** — The person portrait describes someone who "thinks in systems" and "stays after class to argue about constraints." Is this person portrait SPECIFIC ENOUGH to distinguish this student from every other STEM-music kid? What would make it genuinely distinctive?

5. **The Mrs. Chen Gap** — The profile mentions Mrs. Chen but doesn't fully integrate her into the portrait. If Mrs. Chen is the emotional core (as the coaching conversation suggests), what should the profile say about the student's relationship to mentorship, to musical inheritance, to the fear of disappointing a teacher?

6. **What's Missing** — What would a $600/hr counselor know about this student after 10 turns of conversation that this profile DOESN'T capture? Think about: family dynamics, school context, other essays they're writing, their relationship to competition, their comfort with vulnerability, their writing process.

### SECTION 3: Show Me the Ideal Profile

7. **Write the Ideal Profile** — Based on everything in the coaching conversation, write the profile that would MAXIMALLY help this student revise their essay. Include:
   - A person portrait that captures what makes THIS student different from other piano-coding students
   - An "essay DNA" section that identifies the raw material the student should build from
   - A "danger zones" section that identifies the student's specific revision pitfalls
   - A "voice compass" that tells the student where their authentic voice lives and where it doesn't

8. **Gap Analysis** — Compare your ideal profile to the system's profile. What percentage of the ideal does the system capture? What categories of insight are entirely missing?

### SECTION 4: Would This Produce an Elite Essay?

9. **Profile-Driven Revision** — Write a 100-word outline for the essay this student would write if they used ONLY this profile as their guide. Now evaluate: is it competitive at T20 schools? If not, what's missing from the profile that would get it there?

10. **The $600/hr Comparison** — After 10 turns with a $600/hr counselor, what would the student's profile look like? (Not the essay — the UNDERSTANDING of themselves.) How much richer would it be? What specific dimensions would the human capture that the system doesn't?

Give an overall grade:
- **Profile accuracy**: A/B/C/D/F
- **Profile utility for revision**: A/B/C/D/F
- **Versus $600/hr counselor's student understanding**: A/B/C/D/F
```

---

## PROMPT 5: Activity Workshop — Does It Produce Competitive Descriptions?

```
You are a former admissions officer who specialized in extracurricular evaluation. You've read 50,000+ activity descriptions and you know INSTANTLY which ones make you lean in and which ones you skim. You understand that the 150-character activity description is the most compressed piece of writing in the entire application — every word must earn its place. You also know that most students waste their 150 characters on role titles and generic impact claims.

I'm going to show you an AI activity profiler's conversation with a student about their AI DJ hackathon project. Your job: evaluate whether the system produces a description that would make a real AO pause, and whether the tier classification is accurate.

═══════════════════════════════════════
ACTIVITY CONTEXT (extracted from coaching conversation):
═══════════════════════════════════════

Activity: AI DJ Project
Context revealed through coaching:
  - Built at student's first hackathon
  - Team project (composition unknown — student hasn't specified their role)
  - 48-hour timeline
  - Won second place
  - Student described it in essay as solo project ("I developed")
  - Generates tracks tailored to users' moods
  - Users "smiled" when AI captured their emotions (likely hackathon demo attendees, not deployed users)
  - Student stripped hackathon context from essay, presenting it as a long-term solo project
  - Blends musical intuition with technical expertise
  - Student's piano background informed the mood-detection approach

NOTE: The E2E test focused on essay coaching, not the activity workshop pipeline specifically. This prompt evaluates the system's CAPACITY to produce competitive descriptions based on the information it gathered, and asks the evaluator to benchmark against what the activity workshop SHOULD produce.

═══════════════════════════════════════
YOUR EVALUATION TASK:
═══════════════════════════════════════

### SECTION 1: Information Extraction Quality

1. **What the System Knows** — Based on the coaching conversation, list every FACT the system has extracted about this activity. Rate each fact's usefulness for a 150-character description (essential / helpful / irrelevant).

2. **What the System Should Have Asked** — If the system were running the activity workshop pipeline on this project, what specific questions would it need to ask to produce a competitive description? List at least 8 questions, in priority order.

3. **The Missing Details** — The most common weakness in activity descriptions is that students describe WHAT they did without showing IMPACT or SPECIFICITY. For this project, what specific details are missing that would transform the description from generic to memorable? Think about: technical specifics (what API? what algorithm?), quantitative impact (how many users? what accuracy?), specific role (what was YOUR contribution vs. team?), unexpected outcome (what surprised you?).

### SECTION 2: Description Writing

4. **Write Three Descriptions** — Using ONLY the information the system has, write three different 150-character activity descriptions for this project:
   - **Version A**: The description a typical student would write (the baseline)
   - **Version B**: The best description possible with current information
   - **Version C**: The description that would make an AO pause (even if it requires information the system hasn't gathered yet)

5. **Gap Analysis** — What information separates Version B from Version C? This is the system's extraction gap — the difference between what it knows and what it needs to know to produce a truly competitive description.

### SECTION 3: Tier Classification

6. **Tier Assessment** — Based on what's known, what tier should this activity be classified as?
   - T1: National/international recognition, institutional impact
   - T2: State-level recognition, significant community impact, strong leadership
   - T3: School-level leadership, meaningful personal achievement
   - T4: Participation-level, personal interest, limited demonstrated impact

   Justify your classification. Then evaluate: would the system's hackathon-2nd-place context CHANGE the tier? (A team hackathon 2nd place is T3-T4; a solo project deployed to real users would be T2-T3.)

7. **The Honest Assessment** — Is this activity, as currently described, a differentiator in a T20 application? What would make it one? Be specific about what the student would need to have done (not just written) for this to stand out.

### SECTION 4: Would This Produce a Competitive Description?

8. **The AO Pause Test** — Read the three descriptions you wrote. For each one, estimate how many seconds an AO would spend on it before moving to the next activity. The goal is >3 seconds (most get <1 second).

9. **The Comparison** — Write the activity description this student would get from (a) a $600/hr counselor who spent 15 minutes on it, (b) ChatGPT with the same information, (c) the student writing it themselves. How does the system's likely output compare?

10. **The 150-Character Master Class** — Write the IDEAL 150-character description for this activity, and annotate each word choice: why THIS word, why this STRUCTURE, what is each phrase DOING for the reader?

Give an overall grade:
- **Information extraction for description writing**: A/B/C/D/F
- **Likely description quality**: A/B/C/D/F
- **Would the description make an AO pause?**: Yes/Maybe/No
```

---

## PROMPT 6: End-to-End — Would This Student Get In?

```
You are the dean of admissions at a T15 school. You've been doing this for 20 years. You've seen every essay prep tool, every counselor approach, every tutoring service. You know what works and what doesn't — not in theory, but in practice, measured by whether students who use these tools actually produce stronger applications.

I'm going to show you the COMPLETE output of an AI essay intelligence system — pipeline analysis, 10-turn coaching conversation, accumulated profile, session metadata — for a student with a mediocre piano/coding Common App essay. Your job: evaluate this system as a college preparation tool. Not "is the AI impressive?" but "would a student who used ONLY this tool produce a competitive application?"

═══════════════════════════════════════
COMPLETE SYSTEM OUTPUT SUMMARY:
═══════════════════════════════════════

ESSAY: Mediocre piano/coding Common App essay (2376 chars, 7 paragraphs). Student plays piano, codes, built an AI DJ, draws parallel between music and coding. No scenes, no people, no struggle, no specific moments.

PIPELINE ANALYSIS ($2.10, 24 minutes):
  - AO First Read: No hook, high put-down risk, "I've read this essay before"
  - Person Portrait: Systems thinker, pattern-noticer, more comfortable with how than what
  - Archetype: STEM-arts fusion (saturated)
  - Red Flags: Scope inflation, people absence, solo credit for teamwork, no scenes of failure
  - Emotional Authenticity: Named emotions, summary mode, satisfaction-in-retrospect, intellectual coherence but emotional distance
  - North Star: Constraint-possibility paradox
  - Observations: 21 (target: 30-50), 50% structural / 50% architectural, 0% surface
  - Improvement Phase: unknown (L4 failed)

COACHING CONVERSATION ($0.375, ~4 minutes for 10 turns):
  - Turns 1-5: Productive exploration. Coach extracts hackathon context (T3), voices P3 voice difference (T4), surfaces Mrs. Chen as emotional core (T5).
  - Turns 6-9: Deflection spiral. Student asks execution questions without providing materials or making architectural decisions. Coach correctly identifies and names the pattern.
  - Turn 10: Partial breakthrough. Student names emotional origin (hearing Mrs. Chen play). Coach forces A/B/C architectural choice.
  - Student state at end: resistant_to_specific (hasn't committed to a direction)

KEY COACHING MOVES:
  - Named craft moves: summary vs. scene (T2), proximity to work as voice calibrator (T4), thesis voice vs. doing voice (T4), intention vs. execution gap (T5)
  - Demonstrations written: 0 (coach never wrote sample prose)
  - Questions asked: ~25 across 10 turns
  - Questions answered by student: ~5 (most deferred or deflected)
  - Resistance detection: correctly identified deflection pattern T6-T9
  - Breakthrough handling: recognized T10 emotional core, forced architectural choice

ACCUMULATED PROFILE:
  - Person: Systems thinker who can self-diagnose but struggles to execute
  - Raw material: Piano (Chopin-jazz fusion, Mrs. Chen), hackathon (48hr, team, 2nd place, AI DJ), coding
  - Writing pattern: Revises execution before resolving conception
  - Learning style: Self-diagnosis leads, reinterpretation as possible avoidance
  - Three competing architectures identified: (A) music-coding parallel, (B) Mrs. Chen as mentor, (C) moment of musical revelation
  - Unresolved: student hasn't chosen architecture or provided materials

SYSTEM COSTS:
  - Initial analysis: $2.10
  - 10-turn coaching: $0.38
  - Grand total: $2.47
  - Wall time: ~29 minutes

FEATURE VERIFICATION:
  - Session events: 20 (10 journal + 10 context events) [PASS]
  - Anti-repetition: 0% 4-word phrase overlap between T2 and T8 [PASS]
  - Response intensity varied (not all 'full') [PASS]
  - Edit intelligence surfaced [PASS]
  - Breakthrough response too long (1669 chars, target <1000) [FAIL]
  - Craft vocabulary phase-appropriate: phase=unknown [FAIL]
  - Observation count below target (21 vs 30-50) [PARTIAL]

═══════════════════════════════════════
YOUR EVALUATION TASK:
═══════════════════════════════════════

### SECTION 1: The Admissions Preparation Test

1. **If this student used ONLY this tool** — no human counselor, no English teacher review, no parent feedback — and went through 5 coaching sessions (50 turns total), would their Common App essay be competitive at:
   - T5 schools (Harvard, Stanford, MIT, Princeton, Yale)?
   - T10 schools (Columbia, Chicago, Duke, Penn, Northwestern)?
   - T20 schools (Vanderbilt, Georgetown, Emory, USC, UCLA)?
   - T50 schools?

   For each tier, estimate the percentile their essay would land in among accepted students' essays.

2. **The Missing Pieces** — What would this student STILL need that this system can't provide? Be specific. Not "human connection" — what SPECIFIC capabilities would a human counselor provide that are absent here?

3. **The Harm Test** — Could this system HURT a student's application? Are there scenarios where following this system's guidance would produce a WORSE essay than the student would have written without guidance? (Think: over-coaching, cookie-cutter "scene-based" openings, forced architectural choices that don't match the student's authentic voice.)

### SECTION 2: Competitive Analysis

4. **Versus Alternatives** — Rate this system against each alternative on a 1-10 scale for "would produce a competitive essay":
   - (a) $600/hr elite counselor (5 sessions)
   - (b) School college counselor (2 sessions, 150-student caseload)
   - (c) ChatGPT-4 (unlimited turns)
   - (d) Grammarly + common advice blogs
   - (e) Student working alone with no guidance
   - (f) College essay book (e.g., "On Writing the College Application Essay" by Bauld)

   For each comparison, identify what this system does BETTER and WORSE.

5. **The Cost-Value Equation** — At $2.47 for this session, is this a good value? What would fair pricing be for this level of service? Compare to: $600/hr counselor session (~$300 for 30 min), $100/month AI writing assistant, free school counselor.

### SECTION 3: System Strengths (Be Specific)

6. **What This System Does That Nothing Else Does** — Identify 3-5 capabilities that are genuinely unique to this system — things a student cannot get from ANY alternative (human or AI). For each, evaluate: is it ACTUALLY useful for producing a better essay, or is it technically impressive but practically irrelevant?

7. **The Best Moment** — What was the single best coaching moment across the entire 10-turn conversation? The moment that most closely matched what a $600/hr counselor would do? Quote it and explain why it works.

### SECTION 4: System Weaknesses (Be Specific)

8. **The Biggest Gap** — What is the single most important capability this system LACKS that prevents it from consistently producing elite essays? Not a list of 10 things — the ONE thing that matters most.

9. **The Worst Moment** — What was the single worst coaching moment? The moment where the system most clearly fell short of what a human would do? Explain what a human would have done instead and why it matters.

10. **The Deflection Problem** — The student deflected for 4 consecutive turns (T6-T9). The system correctly identified the pattern but arguably failed to RESOLVE it. A real counselor might have:
    - Written a sample paragraph to break the logjam
    - Asked "What scares you about making this choice?"
    - Said "Let's set the architecture question aside for now and work on something concrete"
    - Called the student's parents and said "Your kid is stuck"

    What's the RIGHT move, and can this system learn to make it?

### SECTION 5: Would This Student Get In?

11. **The Application Hologram** — Based on everything you've seen (essay quality, student personality, raw material, coaching trajectory), paint a picture of this student's complete application profile. What kind of student are they? What would the rest of their application look like? Would they get into a T20 school?

12. **The Final Essay** — Write the essay this student SHOULD write — the one that uses all the raw material (piano, Mrs. Chen, Chopin Nocturnes, hackathon, AI DJ, team, 48 hours, 2nd place) and makes an AO at Stanford say "I want this student on campus." 650 words. Then evaluate: could this system guide the student to write this essay? What percentage of the way there does it get?

13. **Show Me the Rewrite** — Write the first paragraph of the ideal essay, using the student's actual voice (as captured in the coaching conversation — someone who self-diagnoses, who reinterprets, who has taste but not technique). This paragraph should:
    - Open with a scene, not a thesis
    - Put the reader in a specific moment
    - Reveal character through action, not description
    - Set up the essay's emotional arc

    Now evaluate: would this system's coaching EVER get the student to write something this good? What would need to change?

14. **The Verdict** — One paragraph. Is this system ready to be a student's primary essay preparation tool? What's the honest answer, and what would make the answer "yes"?

Give an overall grade:
- **As an admissions preparation tool**: A/B/C/D/F
- **Would produce competitive essays at T20 (with 5 sessions)**: Yes/Probably/Maybe/Unlikely/No
- **Replaces a human counselor**: Fully/Mostly/Partially/Minimally/Not at all
- **Worth the cost**: Exceptional value / Good value / Fair value / Poor value
```

---

## APPENDIX: Evaluation Summary Template

After running all 6 prompts, compile results here:

| Prompt | Dimension A (Intelligence) | Dimension B (Craft Outcome) | Key Finding |
|--------|---------------------------|----------------------------|-------------|
| 1: Pipeline Analysis | | | |
| 2: Turn-by-Turn Craft | | | |
| 3: Coaching Arc | | | |
| 4: Profile Quality | | | |
| 5: Activity Workshop | | | |
| 6: End-to-End | | | |

**Cross-Prompt Patterns to Watch For:**
- Does the system analyze better than it coaches? (Intelligence > Craft Outcome)
- Does the system detect problems better than it teaches solutions?
- Does the system understand the essay better than it understands the student?
- Does the system produce insights that sound smart but don't lead to better writing?
- Is there a gap between what the system KNOWS and what it can TEACH?

**The Ultimate Question:**
If 100 students with mediocre essays used this system for 5 coaching sessions each, how many would end up with essays competitive at T20 schools? Give a number and explain your reasoning.
