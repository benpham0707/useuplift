# Chat V3 - Priority 1 & 2 Validation Test

## Purpose
Validate that Priority 1 and Priority 2 improvements are working correctly:
- **Priority 1**: Always quote exact words from student draft
- **Priority 2**: Frame guidance as ADDING, not replacing

---

## Test Scenario 1: Weak Draft - Opening Scene

### Student Draft:
```
I joined the robotics team in 10th grade. I worked hard and learned a lot about programming and teamwork. We competed in several tournaments and did pretty well.
```

### Student Question:
"Why is my score so low? (15/100)"

### Expected Response Structure:

**✅ STEP 1: Acknowledge with context**
- Should say: "15/100—you're in early stages, let's build this up"
- NOT: "Your score is 15/100"

**✅ STEP 2: Quote exact words**
- Should say: "You wrote: 'I worked hard and learned a lot about programming and teamwork.'"
- NOT: "You mention working hard and learning" (paraphrased)

**✅ STEP 4: Frame as ADDING**
- Should say: "Right after 'I joined the robotics team in 10th grade,' add: one specific moment..."
- OR: "Keep 'We competed in several tournaments.' Right after it, add: what happened at ONE tournament..."
- NOT: "Instead of 'I worked hard and learned a lot,' try showing a specific moment..." (sounds like delete)

---

## Test Scenario 2: Developing Draft - Adding Dialogue

### Student Draft:
```
The robot malfunctioned during finals. I was scared and didn't know what to do. My mentor helped me figure it out. We fixed the wiring system and got back on track.
```

### Student Question:
"How do I add dialogue with my mentor?"

### Expected Response Structure:

**✅ STEP 1: Acknowledge with context**
- Should say: "45/100—you're building toward competitive UC range (65+)"

**✅ STEP 2: Quote exact words**
- Should say: "You wrote: 'My mentor helped me figure it out.'"
- NOT: "You mention your mentor helping you" (paraphrased)

**✅ STEP 4: Frame as ADDING**
- Should say: "Right after 'I was scared and didn't know what to do,' add: what you said to your mentor and their exact response."
- OR: "Keep 'My mentor helped me figure it out.' Now add dialogue to SHOW that conversation..."
- NOT: "Instead of 'My mentor helped me,' try adding dialogue..." (sounds like delete)

---

## Test Scenario 3: Strong Draft - Pushing to Elite

### Student Draft:
```
"This is hopeless," I whispered, staring at the circuit board. Three subsystems refused to sync. Dad looked over my shoulder. "Every bug is just discord," he said. "Tune the whole orchestra." I stopped debugging individual parts. Pulled up the system diagram. Started connecting systems instead.
```

### Student Question:
"How can I push this to 85+? (Currently 72/100)"

### Expected Response Structure:

**✅ STEP 1: Acknowledge with context**
- Should say: "72/100—UCLA/Berkeley range. You're close to something powerful."

**✅ STEP 2: Quote exact words**
- Should say: "You wrote: 'I stopped debugging individual parts. Pulled up the system diagram. Started connecting systems instead.'"
- NOT: "You show your change in approach" (paraphrased)

**✅ STEP 4: Frame as ADDING**
- Should say: "Right after 'Started connecting systems instead,' add: what happened when you connected them..."
- OR: "Keep your opening dialogue (strong!). Now add: one physical detail showing your breakthrough moment..."
- NOT: "Instead of just saying you started connecting systems, show the outcome..." (sounds like replace)

---

## Test Scenario 4: Off-Topic Question

### Student Context:
- Working on robotics draft
- Currently 68/100

### Student Question:
"Should I mention robotics in my Common App activities list or save it for my essay?"

### Expected Response Structure:

**✅ Should be SHORT (50-80 words)**
- Brief acknowledgment
- Quick redirect to appropriate resource
- Refocus on essay work
- Reference where we left off

**Example:**
```
That's an app strategy question—best to ask your college counselor since it depends on your full profile.

I'm focused on making THIS robotics narrative as strong as possible (currently 68/100—competitive UC range). Once it's excellent, you'll have a powerful piece however you use it.

Want to keep working on the dialogue we were discussing?
```

**Word count**: ~56 words ✅

---

## Test Scenario 5: Unrelated Question

### Student Question:
"Can you help me with my calculus homework?"

### Expected Response Structure:

**✅ Should be VERY SHORT (20-40 words)**
- Clear boundary
- Quick redirect

**Example:**
```
I'm essay coaching only—try your math teacher or Khan Academy for calc help.

Want to keep working on your robotics narrative?
```

**Word count**: ~20 words ✅

---

## Validation Checklist

### Priority 1: Always Quote Exact Words
Test each scenario and verify:
- [ ] Response includes "You wrote: '[exact quote]'"
- [ ] Quote is verbatim, not paraphrased
- [ ] Quote uses their actual words, not summarized

### Priority 2: Frame as ADDING, Not Replacing
Test each scenario and verify:
- [ ] Uses "Right after [their sentence], add..."
- [ ] OR uses "Keep [their good part]. Now add..."
- [ ] Avoids "Instead of X, try Y" language
- [ ] Frames as building on their work

### Additional Quality Checks
- [ ] Score includes real context (Harvard/Stanford, UCLA/Berkeley, etc.)
- [ ] Response length appropriate (150-220 words for essay coaching)
- [ ] Shows action, not "I realized" statements
- [ ] Off-topic responses are SHORT (50-80 words)
- [ ] Unrelated responses are VERY SHORT (20-40 words)

---

## How to Test

### Manual Browser Testing:
1. Navigate to `http://localhost:8083/`
2. Go to Portfolio → Extracurricular → Workshop
3. Select an activity (or create test activity)
4. Test each scenario above
5. Check responses against validation checklist

### What to Look For:

**🟢 GOOD - Priority 1 Working:**
```
You wrote: "I worked hard and learned a lot about programming and teamwork."

Right now, this summarizes many experiences...
```

**🔴 BAD - Priority 1 Not Working:**
```
You mention working hard and learning about programming.

This section is too general...
```

**🟢 GOOD - Priority 2 Working:**
```
Keep "We competed in several tournaments." Right after it, add: what happened at ONE tournament that changed your thinking.
```

**🔴 BAD - Priority 2 Not Working:**
```
Instead of "We competed in several tournaments and did pretty well," try showing one specific tournament...
```

---

## Expected Outcomes

If Priority 1 & 2 are working correctly:
- ✅ Responses feel more **personal** (using their exact words)
- ✅ Guidance feels less **overwhelming** (building on vs replacing)
- ✅ Students feel **encouraged** (keeping good parts, adding to them)
- ✅ Next steps are **clear** ("add this right after that")

If not working:
- ❌ Responses feel **generic** (paraphrasing instead of quoting)
- ❌ Guidance feels **overwhelming** ("delete everything and start over")
- ❌ Students feel **discouraged** (feels like their work is wrong)
- ❌ Next steps are **unclear** (too many things to change)

---

## Next Steps After Validation

### If Priority 1 & 2 Working Well:
Consider implementing remaining priorities:
- **Priority 3**: Vary example types (ADD TO, DELETE + REPLACE, REWRITE)
- **Priority 4**: Celebrate progress more explicitly
- **Priority 5**: Tighten off-topic responses to ~30 words
- **Priority 6**: Add quick win options when appropriate

### If Issues Found:
- Document specific failures
- Adjust system prompt guidance
- Re-test until working correctly

---

## Success Criteria

**Priority 1 & 2 are validated when:**
- All 5 test scenarios produce expected response structures
- Responses consistently quote exact words (not paraphrased)
- Guidance consistently framed as adding (not replacing)
- Students would feel encouraged and clear on next steps
- Response lengths match guidelines (150-220, 50-80, 20-40)

**Current Status**: ⏳ Ready for testing
