# Luna Cloud Mascot — Nano Banana 2 Prompt Sheet

> **Purpose:** Generate consistent emotion variants of Luna while preserving character identity.
> **Tool:** Nano Banana 2 | **Settings:** 2K resolution, 4 iterations, 1:1 aspect ratio
> **Critical:** Use the REFERENCE feature on the original neutral image for EVERY variant to lock visual consistency.

---

## Why Variants Drift (and How to Fix It)

The original prompt works because every detail reinforces one specific look. When you rewrite for emotions, you accidentally drop constraints and Nano Banana 2 fills the gaps with its defaults (realistic, detailed faces, etc.).

**Rules:**
1. **Never rewrite the prompt** — copy the IDENTITY BLOCK verbatim, then append the EMOTION LINE
2. **Always reference the original neutral image** — click REFERENCE on your best neutral result before generating any variant
3. **Keep emotion modifiers SHORT** — one sentence max. The more you describe the emotion, the more the model deviates from the base design
4. **Never add:** mouth, body, arms, legs, realistic features, detailed facial features, nose, teeth, eyebrows as separate elements

---

## Identity Block (COPY THIS EXACTLY — DO NOT MODIFY)

```
Cute floating cloud character, just a single round puffy cloud with two big expressive glowing purple-blue eyes shining from inside like lanterns behind soft fog. Wispy cloud tendrils on top like messy fluffy hair drifting upward. No mouth, no body, no arms, no legs. Just a round luminous cloud face. Primarily soft white cloud material with a gentle lavender-purple inner glow at the center. Fluffy billowing edges with small wisps trailing off. The eyes are big, round, and full of warmth and curiosity, Pixar animated film style. Volumetric 3D cloud rendering, soft studio lighting. Centered composition. Pure clean white background, nothing touching edges. No text. No other objects.
```

---

## Lean Variant Set (7 Variants)

We generate **7 variants**, not 10. After honest audit:
- **Proud** merges into **Happy** (differentiate at runtime via burst duration/glow)
- **Surprised** merges into **Happy** (differentiate via quick scale-pop burst)
- **Concerned** is cut entirely — showing a worried mascot at a struggling student feels judgmental. Use **Encouraging** for all "student needs support" moments instead.
- **Sleepy** kept (pending idle-timeout detection wiring)

Active variants: Neutral · Thinking · Focused · Happy · Encouraging · Curious · Sleepy

## Emotion Variant Prompts

For each variant below, the format is:

```
[IDENTITY BLOCK — paste verbatim from above]

[EMOTION LINE — append after the identity block]
```

### 1. Neutral / Idle (Original)
No emotion line needed — use the identity block as-is. This is your reference image for all others.

### 2. Thinking / Processing
```
The eyes are glancing slightly upward with a contemplative, wondering expression. A small glowing purple-lavender lightbulb floats just above the cloud with its filament softly lit. Two or three tiny translucent question marks drift around the lightbulb like thought bubbles. The wispy hair tendrils on top of the cloud are slightly more active, curling upward with a hint of extra motion. The inner lavender glow pulses slightly brighter.
```

### 3. Happy / Celebrating
```
The eyes are wide open, bright, and beaming with pure joy — the inner purple-blue glow intensified and radiating warmth. The wispy hair tendrils bounce upward with extra energy. Tiny sparkles or star-shaped glints float around the cloud like confetti. The whole cloud seems slightly puffier and more buoyant.
```

### 4. Encouraging / Supportive
```
The eyes are shaped into a gentle smile — the lower eyelids lifted so the eyes become soft upturned crescents, like joyful half-moons crinkling with warmth. A reassuring grin made of eyes alone. The inner lavender-purple glow now carries a soft rose-gold and honey-amber undertone woven through it — warm but still inside the purple family, never orange or yellow. A gentle radiant halo of rose-gold-lavender light emanates outward from the cloud like a quiet embrace of warm aura. The wispy hair tendrils on top curve slightly outward and downward around the sides of the face, framing it softly like a comforting hood. The cloud leans very slightly forward, attentive and close, as if leaning in to listen. Everything about the cloud is lifted, bright, and radiant — never dim, never drooping, never muted. The feeling is "I'm here with you, you've got this."
```
**Why this works:** Encouragement is the hardest emotion for a mouthless/armless character. Key signifiers: (1) smile-eyes = universal mouthless-mascot positive cue, (2) rose-gold *inside* the lavender palette = warmth without breaking the cool identity, (3) expanding halo = emanating warmth (not dim), (4) tendrils curving as a hood = embracing gesture, (5) forward lean = "I'm paying attention to you", (6) anti-drift directive ("never dim, never drooping") blocks the sad/gloomy drift that the old prompt produced.

### 5. Focused / Analyzing
```
The eyes are slightly narrowed with intense concentration, the purple-blue glow sharper and more defined. A faint ring of light encircles one eye like a monocle or scanning HUD. The cloud wisps are pulled in tighter, more compact and still.
```

### ~~6. Surprised / Impressed~~ (CUT — handled by Happy with a quick scale-pop burst)

### ~~7. Concerned / Worried~~ (CUT — use Encouraging for all support moments; worried mascot reads as judgment)

### ~~8. Proud / Satisfied~~ (CUT — handled by Happy with sustained warm glow)

### 6. Curious / Intrigued
```
The eyes are wide and tilted slightly, one bigger than the other, with an inquisitive asymmetric look. The cloud is leaning very slightly to one side as if peering at something. A few wisps extend forward like antennae sensing. The inner glow flickers gently with interest.
```

### 7. Sleepy / Idle-Rest
```
The eyes are droopy, half-closed crescents with a soft dim glow. The wispy hair tendrils hang loosely and drift lazily. The inner lavender glow is at its dimmest, like embers. Tiny z-shaped sparkles float away from the cloud. The whole cloud appears slightly deflated and settled.
```

---

## Workflow for Each Variant

```
1. Open Nano Banana 2
2. Find your BEST neutral Luna result
3. Click REFERENCE on that image
4. Paste the IDENTITY BLOCK (verbatim, no changes)
5. Add a blank line, then paste the EMOTION LINE for the variant you want
6. Settings: 2K, 4 iterations, 1:1
7. Generate → pick best → download
8. Repeat for next emotion
```

## After All Variants Are Generated

For animated transitions between states (e.g., neutral → thinking → happy):
1. Use Kling 3.0 with start frame = one emotion, end frame = another
2. Keep transitions short (2-3 seconds)
3. Extract frames with ffmpeg as WebP
4. Map frame sequences to coaching states in the ChatHeader component

See `docs/PREMIUM_WEBSITE_MASTER_GUIDE.md` for the full video generation + frame extraction pipeline.

---

## Coaching State → Emotion Mapping (Lean 7-Variant Set)

| Coaching State | Luna Emotion | Burst / Notes |
|---|---|---|
| Idle / waiting for input | **Neutral** | Default pose, gentle idle loop |
| Extended idle (timeout) | **Sleepy** | Swaps in after N seconds of inactivity |
| Reading essay / analyzing | **Focused** | Fires during analysis pipeline (highest traffic) |
| Generating feedback | **Thinking** | LLM processing — lightbulb + ? marks |
| Delivering praise | **Happy** | Quick bounce burst |
| Big improvement detected | **Happy** | Stronger scale-pop burst (ex-Surprised) |
| Session complete | **Happy** | Sustained warm glow (ex-Proud) |
| Delivering critique | **Encouraging** | Warm nightlight glow |
| Student struggling | **Encouraging** | Same — warmth, not worry (don't use Concerned) |
| Asking a question | **Curious** | Head-tilt, antennae wisps |
