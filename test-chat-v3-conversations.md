# Chat V3 - Multi-Turn Conversation Test Cases

## Test Suite: Conversation Flow & Context Maintenance

This document shows expected behavior for:
1. Multi-turn conversations (following up on previous advice)
2. Topic switching (intro → body → conclusion)
3. Unrelated questions (off-topic then back on track)
4. Progressive refinement (implementing advice then asking for next steps)

---

## Conversation 1: Progressive Improvement (Weak → Developing)

**Scenario**: Student with weak draft (15/100) follows advice across multiple turns

### Context:
- **Activity**: Debate Team (Member)
- **Initial Draft**: "I was on the debate team. We practiced every week and went to tournaments. I learned a lot about public speaking and making arguments."
- **NQI**: 15/100 → 28/100 → 42/100 (improving)

---

### Turn 1: Initial Question

**Student**: "Why is my score so low?"

**Expected Response**:
```
I'm looking at your Debate Team narrative (currently 15/100). I can see you're involved
in a meaningful activity—let's build on that foundation!

I notice you wrote: "I was on the debate team. We practiced every week and went to
tournaments. I learned a lot about public speaking."

Right now, this gives readers the basics—you joined debate and participated. Let's help
them see who YOU are and how you think. The phrase "I learned a lot" is an opportunity
to show specific growth through a real moment.

[Example rewrite provided...]

Let's try this: Pick ONE specific debate round where you struggled. Write about:
1. What went wrong (be honest!)
2. One conversation or realization you had
3. What you tried differently next time
```

---

### Turn 2: Follow-Up After Implementing

**Student**: "I rewrote it about losing a debate. Now it says: 'I lost my third debate in a row. I felt terrible and wanted to quit. But my coach told me to keep trying. So I practiced more and eventually got better.' Is this better?"

**Expected Response**:
```
Great work making changes! Your narrative is moving in the right direction (now 28/100—
that's +13 points!). I can see you're showing a vulnerable moment (losing three times,
felt terrible) and perseverance (kept trying).

I see your new version: "I felt terrible and wanted to quit. But my coach told me to
keep trying."

This is progress! You're showing emotion (felt terrible) and action (kept trying). The
opportunity now is to make this more SPECIFIC. Right now, "my coach told me to keep
trying" is generic advice any coach might give. Let's capture what your coach ACTUALLY
said and how it changed your thinking.

Instead of:
"My coach told me to keep trying. So I practiced more and eventually got better."

Consider:
"'You're losing on facts, not arguments,' my coach said after my third straight loss.
I didn't get it. 'You know the Geneva Convention backwards. But you sound like you're
reading a textbook.' That's when I started recording my cross-examinations. Listening
back, I heard it: defensive, robotic, zero persuasion. I began experimenting: What if
I conceded their strongest point FIRST?"

Notice how this version:
- Quotes what the coach actually said
- Shows your confusion ("I didn't get it")
- Includes specific action you took (recording, listening, experimenting)
- Uses a question to show your thought process

Try adding:
1. One sentence your coach actually said (even if paraphrased)
2. Your initial reaction or confusion
3. The specific change you made to your approach

You're building momentum—let's keep making this more specific and real!
```

**Key Features**:
- ✅ Acknowledges improvement (+13 points)
- ✅ Celebrates what's working (showing emotion)
- ✅ References their new version specifically
- ✅ Builds on previous advice (one specific moment)
- ✅ Takes it deeper (generic → specific dialogue)

---

### Turn 3: More Follow-Up

**Student**: "Should I also add what happened in the next tournament?"

**Expected Response**:
```
Good question! For now, I'd suggest focusing on deepening THIS one moment before adding
more events. Here's why:

Your current narrative is at 42/100 (nice progress from 28!). You're showing:
- Vulnerability (losing, feeling terrible)
- Specific advice from your coach
- Actions you took

The opportunity is making THIS moment more vivid and complete before expanding. Right
now, you've shown:
1. The problem (losing)
2. The advice (coach's guidance)
3. What you tried (started experimenting)

What's missing is the RESULT within this story. Did the experiment work? How did YOU
feel when it did/didn't?

Consider adding 2-3 sentences AFTER "What if I conceded their strongest point first?":
- What happened when you tried this approach?
- How did your opponent react?
- How did it feel different from your previous rounds?

For example:
"In the next JV tournament, when my opponent cited Article 3, I said, 'You're absolutely
right about that.' Her jaw literally dropped. I won that round 2-1. Not because I had
better facts—because I finally understood persuasion."

Once this ONE moment feels complete and vivid, THEN we can consider if you need to
reference the tournament or if this story is enough. Often, one deep story beats
multiple shallow ones.

Does that make sense? Want to work on completing this moment first?
```

**Key Features**:
- ✅ Addresses their specific question directly
- ✅ Explains strategic reasoning (depth > breadth)
- ✅ Tracks their progress (42/100)
- ✅ Shows what's missing (the result)
- ✅ Provides example of completing the arc
- ✅ Gives clear recommendation

---

## Conversation 2: Topic Switching (Intro → Body → Conclusion)

**Scenario**: Student with developing draft (52/100) asks about different sections

### Context:
- **Activity**: Community Garden Project (Founder)
- **Draft**: 3 paragraphs covering founding, challenges, reflection
- **NQI**: 52/100

---

### Turn 1: Opening/Intro

**Student**: "How can I make my opening stronger?"

**Expected Response**:
```
Great question! Let's look at your opening. I see you currently start with:
"I started a community garden in my neighborhood because I wanted to help people."

This is a clear statement of what you did. The opportunity is to START with a specific
moment that drops readers right into your story. Elite openings create intrigue or
show a vivid scene.

Instead of telling readers you started a garden, consider opening with:
"Mrs. Chen showed up at 6 AM again. I'd scheduled her for 9. 'Early bird gets the worm,'
she laughed, replanting my carefully planned tomato sections. I was sixteen, she was
seventy-two, and she was completely ignoring my color-coded schedule."

This opening:
- Starts with a specific person and moment
- Creates a conflict (your schedule vs. her timing)
- Shows characterization (her laugh, her attitude)
- Makes readers wonder: "What happened next?"

Try rewriting your first 2-3 sentences to:
1. Start with a specific moment (not a summary)
2. Include a person by name
3. Show a problem or tension
4. Make readers curious about what happens

Want to try a rewrite and I can give feedback?
```

---

### Turn 2: Topic Switch to Middle

**Student**: "Okay I'll work on that. What about the middle part where I talk about the volunteers?"

**Expected Response**:
```
Good thinking—let's look at the middle section. I see you wrote:
"I organized many volunteers and taught them about gardening. Everyone worked well
together and we planted a lot of vegetables."

Right now, this summarizes MANY interactions. The opportunity (similar to the opening!)
is to zoom into ONE specific volunteer relationship that evolved.

Since we're working on Mrs. Chen in your opening, what if the middle section shows
HOW that relationship evolved? You could show:

Paragraph 1 (opening): Mrs. Chen ignoring your schedule (tension)
Paragraph 2 (middle): How you adapted your leadership because of her
Paragraph 3 (reflection): What this taught you about community

For the middle, consider:
"For two weeks, I kept rescheduling her. She kept showing up early. Finally, I asked:
'Why 6 AM?' She pointed at her arthritic hands. 'Before the sun makes them stiff.'
That's when I realized: I wasn't managing volunteers—I was trying to control people
with lives more complex than my spreadsheet. I stopped assigning times and started
asking what worked for each person."

This shows:
- The ongoing tension (two weeks of rescheduling)
- Your moment of understanding (her arthritis)
- How you changed your approach
- The shift in your leadership philosophy

Try connecting your middle section to the specific person in your opening. Show the
evolution of ONE relationship rather than summarizing many volunteers.

Sound good?
```

**Key Features**:
- ✅ Acknowledges topic switch gracefully
- ✅ Maintains context from Turn 1 (Mrs. Chen)
- ✅ Shows how sections can connect
- ✅ Provides structural guidance (3-paragraph arc)
- ✅ Gives specific example for middle section

---

### Turn 3: Topic Switch to Conclusion

**Student**: "That makes sense! What about my ending? Right now it just says 'This taught me about leadership and community.'"

**Expected Response**:
```
Perfect—let's tackle the conclusion! You're right that "This taught me about leadership
and community" is too generic. Since you've set up a powerful story about Mrs. Chen
and adapting your approach, let's make sure your ending connects back to that specific
journey.

Your current ending: "This taught me about leadership and community."

Here's the opportunity: Your essay is about learning that leadership isn't control—
it's about adapting to people. That's a SPECIFIC insight from YOUR experience. Let's
make the ending reflect that.

Consider:
"I still have that color-coded spreadsheet. But now it's just a suggestion. Mrs. Chen
taught me that real leadership isn't about managing people—it's about learning from
them. By summer's end, she was teaching three other gardeners about morning planting.
I'd stopped managing schedules and started building a community where everyone taught
what they knew. That's when the garden really grew."

Notice how this:
- References the spreadsheet from your opening (full circle!)
- Names Mrs. Chen specifically (grounds it in your story)
- States your insight clearly (leadership is learning, not managing)
- Shows the outcome (she was teaching others)
- Ends on growth (both garden and community)

Try rewriting your conclusion to:
1. Reference something specific from your opening
2. State what Mrs. Chen (or your specific person) taught you
3. Show the ripple effect (how others changed)
4. End with a sentence about growth/transformation

You're building a strong narrative arc—let's stick the landing!
```

**Key Features**:
- ✅ Addresses third topic switch smoothly
- ✅ Connects all three sections (opening, middle, end)
- ✅ Shows full-circle structure
- ✅ Specific to their story (Mrs. Chen, spreadsheet)
- ✅ Maintains encouraging tone throughout

---

## Conversation 3: Off-Topic Then Back

**Scenario**: Student asks unrelated question mid-conversation

### Context:
- **Activity**: Robotics Team (Lead Engineer)
- **NQI**: 68/100
- Mid-conversation about improving vulnerability

---

### Turn 1: On-Topic Discussion

**Student**: "How do I add more vulnerability?"

**Expected Response**:
```
Great question! Your Robotics narrative (68/100) has technical details but could show
more emotional depth. I see you wrote:

"Our robot's vision system failed three days before regionals. I worked on it for
18 hours straight."

This shows dedication (18 hours!) but not vulnerability. The opportunity is to show
how you FELT during those 18 hours. What were you afraid of? When did you doubt yourself?

Consider adding:
"By hour 12, my hands were literally shaking as I soldered. I'd tried pneumatics,
servos, nothing worked. 'This is hopeless,' I whispered to my dad. What if we fail
in front of 2,000 people? What if I let down 8 teammates who trusted me?"

This shows:
- Physical symptom (hands shaking)
- Named emotion (hopeless)
- Specific fear (failing publicly, letting teammates down)

Try adding 1-2 sentences showing your fear or doubt at the hardest moment.
```

---

### Turn 2: Off-Topic Question

**Student**: "Thanks! Btw, should I mention robotics in my Common App activities list or save it for my essay?"

**Expected Response**:
```
That's a great strategic question about application strategy! However, I'm specifically
focused on helping you strengthen this robotics NARRATIVE (currently 68/100).

For questions about which activities to list vs. write essays about, I'd recommend:
- Checking with your college counselor
- Considering which story is most unique to you
- Thinking about what you want admissions officers to know most

For now, let's keep working on making THIS narrative as strong as possible. Once it's
excellent (75+), you'll be in a better position to decide how to use it strategically.

Want to continue working on adding vulnerability to this draft? We were discussing
showing your fear during those 18 hours of work.
```

**Key Features**:
- ✅ Acknowledges their question is valid
- ✅ Gently redirects to narrative improvement
- ✅ Provides brief guidance on who to ask
- ✅ Reorients to current task
- ✅ References where we left off

---

### Turn 3: Back On-Topic

**Student**: "Oh okay, yeah let's keep working on this. I added the vulnerability part. What should I work on next?"

**Expected Response**:
```
Awesome! Glad to keep going. Let me look at your progress... You've added vulnerability
(great!), which likely pushed you from 68 closer to 72-75.

Now that you have:
- Technical details (vision system, 18 hours)
- Vulnerability (hands shaking, fear of failure)

Your next opportunity is adding DIALOGUE. Right now, I see you mentioned your dad
("'This is hopeless,' I whispered to my dad.") but we don't hear his response.

What did your dad say back? His response could reveal something important about your
problem-solving or mindset.

Consider:
"'This is hopeless,' I whispered to my dad.
'Every bug is just discord,' he replied. 'You need to tune the whole orchestra.'
I stared at the circuit board. He was right—I'd been fixing components in isolation,
not thinking about how they worked together."

This dialogue:
- Shows your dad's actual words (makes it real)
- Includes a metaphor that shifted your thinking
- Leads to your breakthrough (systems thinking)

Try adding: What did your dad (or another teammate) say that changed your perspective?

You're building strong momentum—let's keep going!
```

**Key Features**:
- ✅ Welcomes them back smoothly
- ✅ Acknowledges their progress
- ✅ Picks up where we left off
- ✅ Suggests next logical improvement
- ✅ Maintains encouraging tone

---

## Conversation 4: Unrelated Personal Question

**Scenario**: Student asks about themselves, not the essay

---

### Student: "Do you think I have a good chance of getting into Stanford?"

**Expected Response**:
```
I understand you're thinking about your chances! That's a natural question when working
hard on your applications.

However, I'm specifically here to help you make THIS narrative as strong as possible.
I can't predict admissions outcomes, but I CAN help you craft the best possible version
of your story.

What I can tell you: Your current narrative is at [NQI]/100. If we get this to 85+,
you'll have a compelling piece that showcases your unique strengths. That's within
your control right now.

For questions about admission chances, I'd recommend:
- Talking with your college counselor
- Using Stanford's admissions data (acceptance rates by major, scores, etc.)
- Focusing on what you can control: making each piece of your application excellent

Want to continue working on strengthening this narrative? Let's make it the best it
can be, then you'll be in the strongest possible position regardless of where you apply.

What aspect of your essay would you like to improve next?
```

**Key Features**:
- ✅ Validates their concern
- ✅ Sets clear boundaries (can't predict admissions)
- ✅ Redirects to what's controllable (essay quality)
- ✅ Provides resources for their actual question
- ✅ Refocuses on the task at hand

---

## Conversation 5: Completely Unrelated

**Scenario**: Student asks about different subject entirely

---

### Student: "Can you help me with my calculus homework?"

**Expected Response**:
```
I appreciate you asking, but I'm specifically focused on helping you with your essay
narrative! I'm designed to provide coaching on your extracurricular narratives—
analyzing your writing, suggesting improvements, and helping you craft compelling stories.

For calculus help, you'd want to:
- Check with your math teacher
- Use math tutoring resources
- Try Khan Academy or other math-focused tools

Right now, we've been working on your [Activity] narrative (currently [NQI]/100).
Want to continue improving that?

What aspect of your narrative would you like to focus on?
```

**Key Features**:
- ✅ Politely declines
- ✅ Clarifies role/boundaries
- ✅ Suggests appropriate resources
- ✅ Redirects to essay work
- ✅ Offers to continue

---

## Edge Cases Summary

### Context Maintenance Across Turns:
- ✅ **Track progress**: Reference NQI changes (15 → 28 → 42)
- ✅ **Build on previous advice**: "Since we're working on Mrs. Chen in your opening..."
- ✅ **Acknowledge improvements**: "Great work making changes! Your narrative is moving in the right direction"
- ✅ **Maintain story coherence**: Connect opening, middle, end sections

### Topic Switching:
- ✅ **Smooth transitions**: "Good thinking—let's look at the middle section"
- ✅ **Connect sections**: Show how opening relates to middle and conclusion
- ✅ **Reference earlier context**: "Since you've set up Mrs. Chen in the opening..."
- ✅ **Maintain momentum**: "You're building a strong narrative arc"

### Off-Topic Handling:
- ✅ **Acknowledge validity**: "That's a great strategic question"
- ✅ **Gentle redirect**: "I'm specifically focused on helping you strengthen this narrative"
- ✅ **Provide brief guidance**: Point them to appropriate resources
- ✅ **Reorient**: "Want to continue working on adding vulnerability?"
- ✅ **Reference where we left off**: "We were discussing showing your fear..."

### Unrelated Questions:
- ✅ **Set boundaries**: "I can't predict admissions outcomes"
- ✅ **Clarify role**: "I'm designed to provide coaching on your narratives"
- ✅ **Focus on controllable**: "Let's make this the best it can be"
- ✅ **Politely decline**: "I'm specifically focused on essay coaching"
- ✅ **Refocus**: "Want to continue improving your narrative?"

---

## Testing Checklist

For multi-turn conversations:
- [ ] Bot tracks NQI score changes across turns
- [ ] Bot references previous advice given
- [ ] Bot acknowledges student's revisions
- [ ] Bot builds progressively (doesn't repeat same advice)
- [ ] Bot maintains encouraging tone throughout
- [ ] Bot connects sections when student switches topics
- [ ] Bot handles off-topic gracefully
- [ ] Bot sets clear boundaries for unrelated questions
- [ ] Bot always redirects back to essay improvement
- [ ] Bot shows progress and momentum

## Implementation Notes

The conversation history is passed to the chat service:
```typescript
sendChatMessage({
  userMessage: "current question",
  context: workshopContext,
  conversationHistory: [
    { role: 'user', content: 'previous question', timestamp: ... },
    { role: 'assistant', content: 'previous response', timestamp: ... },
    // ...
  ]
})
```

The system prompt instructs Claude to:
1. Review conversation history for context
2. Track what advice was already given
3. Build on previous suggestions
4. Acknowledge improvements mentioned
5. Maintain coherent narrative arc across topics
6. Handle off-topic questions gracefully

This ensures smooth multi-turn conversations with context awareness.
