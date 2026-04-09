# Premium Website Master Guide: $100K UI/UX from AI

> Comprehensive workflow synthesized from multiple video sources. The goal: combine every technique into a repeatable pipeline for building premium, scroll-driven animated websites that look like they cost $100K.

---

## Table of Contents

1. [The 5-Step Pipeline](#the-5-step-pipeline)
2. [Step 1: Brand Identity Extraction](#step-1-brand-identity-extraction)
3. [Step 2: AI Asset Generation (Nano Banana 2)](#step-2-ai-asset-generation)
4. [Step 3: Video Generation (Kling 3.0)](#step-3-video-generation)
5. [Step 4: Website Build (Claude Code + Skills)](#step-4-website-build)
6. [Step 5: Multi-Page, SEO, Deploy](#step-5-multi-page-seo-deploy)
7. [Advanced Techniques](#advanced-techniques)
8. [Critical Quality Notes](#critical-quality-notes)
9. [Performance Optimization Playbook](#performance-optimization-playbook)
10. [Deployment Playbook](#deployment-playbook)
11. [Tools & Resources Inventory](#tools--resources-inventory)
12. [Skill Architecture Plan](#skill-architecture-plan)

---

## The 5-Step Pipeline

```
1. BRAND IDENTITY    ──►  2. AI ASSETS         ──►  3. VIDEO GENERATION
   (Firecrawl.dev)          (Nano Banana 2)           (Kling 3.0)
   Colors, logos,            Assembled view            Start frame + End frame
   typography, tone          Exploded view             → Transition video
                             Reference technique       7 seconds, 16:9
                                    │
                                    ▼
4. WEBSITE BUILD     ◄──  3b. FRAME EXTRACTION
   (Claude Code +           (ffmpeg → WebP)
    Design Skills)           Scroll-to-frame binding
   Scroll-stop hero          Canvas rendering
   Feature sections          rAF throttling
   Mobile responsive
         │
         ▼
5. MULTI-PAGE + SEO + DEPLOY
   Match design language     SEO audit skill
   across all pages          Vercel/Netlify
   Structured data           Custom domain
   Analytics                 GitHub repo
```

---

## Step 1: Brand Identity Extraction

### The Problem
Without understanding the brand's visual DNA (colors, typography, logo style, tone), AI-generated websites look generic. Brand extraction is the **beating heart** of the website.

### Using Firecrawl.dev

1. Go to [firecrawl.dev](https://firecrawl.dev)
2. Navigate to **Scrape** > **Markdown** > **Branding**
3. Enter the target website URL
4. Downloads complete brand assets: colors, fonts, logos, tone, content structure

### What to Extract
| Asset | Why It Matters | How to Use |
|-------|---------------|------------|
| **Primary colors** | Color scheme consistency | CSS custom properties |
| **Logo(s)** | Brand recognition | Hero, nav, favicon |
| **Typography** | Font personality | Google Fonts match |
| **Tone of voice** | Copy consistency | Prompt context for Claude |
| **Content structure** | Information hierarchy | Section planning |
| **Imagery style** | Visual consistency | Nano Banana prompt context |

### API Integration Note
Firecrawl has an API — this entire step can be automated into a Claude Code skill for scale. Extract → JSON → feed directly into website build prompts.

### Manual Alternative
If no existing site: create a brand brief with:
- Product/company name and tagline
- 1 dominant color + 1 accent color
- 2 Google Fonts (display + body)
- Tone keywords (e.g., "premium", "minimal", "bold")
- Logo file

---

## Step 2: AI Asset Generation

### Nano Banana 2 Settings (Critical)

| Setting | Value | Why |
|---------|-------|-----|
| **Aspect ratio** | 16:9 | Matches website hero layout |
| **Resolution** | Minimum 2K | 1K looks amateur ("some kid with PowerPoint") |
| **Iterations** | 4 | Spar with it — more options = better final pick |
| **Background** | Clean white, NOTHING touching edges | Essential for web integration — dirty edges ruin the look |

### The Two-Image Technique

You need TWO versions of the same scene:

1. **Assembled view** — The complete product/scene, intact
2. **Exploded/deconstructed view** — Same elements scattered, flying apart

**Critical workflow:**
```
1. Generate ASSEMBLED image first (complete scene)
2. Pick the best iteration
3. Click REFERENCE on that image
4. Generate EXPLODED version referencing the assembled one
   → This ensures visual consistency between start and end states
```

### Prompt Engineering for Assets

**For the assembled view:**
- Describe the complete scene
- Specify brand elements (logo, colors)
- Attach the actual logo image as reference
- Attach reference photos of real products (e.g., the actual van, the actual building)
- Always specify: "clean white background, nothing touching edges"

**For the exploded view:**
- Reference the assembled image
- Describe the explosion direction and energy
- Maintain brand color consistency
- Specify: "same elements as reference, scattered/exploded outward"

### Quality Filtering
- Generate 4 iterations minimum
- Check: Does the logo appear correctly? Are brand colors present?
- Check: Is the background truly clean (no artifacts at edges)?
- Check: Does it look like a premium 3D render, not a flat illustration?

---

## Step 3: Video Generation

### Kling 3.0 via Hixsfield

**Setup:**
- Platform: Hixsfield (or direct API)
- Model: Kling 3.0
- Duration: 5-7 seconds
- Aspect ratio: 16:9
- Quality: 1080p minimum

**The Frame Method:**
```
1. Upload START frame (assembled image)
2. Upload END frame (exploded image)
3. Paste the video transition prompt (generated by Claude Code skill)
4. Settings: NO multi-shot, NO enhance (unnecessary for this use case)
5. Generate
```

### Prompt Template for Video Transitions
```
Smooth, cinematic transition from assembled [PRODUCT/SCENE] to exploded view.
Elements should fly outward in all directions with physics-based motion.
Maintain consistent lighting and color palette throughout.
Camera remains static. Background stays clean white.
Professional product reveal animation style.
```

### Tips for Better Videos
- **Generate 3-4 versions** — pick the best transition
- **The scroll animation is only as good as the start and finish images** — invest time in Step 2
- **For rotating objects** (globe, product): "Center of mass should not move, just rotating perfectly on its axis"
- **For exploding views**: "Explode in all directions including vertically and horizontally, none should go outside bounds of the video"
- Cost per generation: ~7.5 credits on Hixsfield (~$3-4 per video)

### Alternative: Hero Background Video
Instead of scroll-driven animation, you can use the video as a **background loop** in the hero section:
- Place as `<video>` element behind hero content
- Apply **inward masking gradient** so edges fade into the site background
- Works great for ambient movement (rotating globe, floating particles, slow pan)

### Cost Breakdown
| Component | Cost |
|-----------|------|
| Nano Banana 2 images | ~$1-2 (4 iterations x 2 versions) |
| Kling 3.0 video (x3) | ~$10-12 |
| Claude Code tokens | ~$1-2 |
| Hosting | $0 (Vercel/Netlify free tier) |
| **Total per website** | **~$12-16** |

---

## Step 4: Website Build

### Two Approaches

#### Approach A: From Scratch with Design Skill
Use the **Taste Skill** (high-end design principles) + **Scroll-Stop Builder Skill**:

```
1. Activate Claude Code
2. /scroll-stop-builder (or equivalent skill)
3. Provide: brand brief, assembled image, video file
4. Claude builds MVP with scroll-stopping animation
5. Iterate on smoothness, timing, mobile responsiveness
```

**Key skill:** The "Taste Skill" standardizes spacing, luxury looks, typography hierarchy, and layout patterns so Claude one-shots premium-looking sites from simple bullet point descriptions.

#### Approach B: HTML Scaffold from Existing Site
**This is the secret weapon for selling to businesses:**

```
1. Go to an HTML extractor tool (Google "HTML website extractor")
2. Enter the client's existing website URL
3. Download as HTML
4. Drop the HTML file into your Claude Code project
5. Prompt: "I've downloaded the HTML from the original website. 
   Recreate it with the new copy and scroll-stopping animation 
   included. Grab their logo and typography so it looks and feels 
   like the original website."
```

**Why this works:**
- You keep the client's existing information architecture
- Their logo, fonts, and color scheme are preserved
- You ADD the premium scroll-stop animation as the "wow factor"
- The result feels familiar to the client but dramatically elevated
- One-shot quality is much higher because Claude has a structural reference

**Critical details for scaffold approach:**
- Make sure to grab their actual logo
- Preserve their typography (font families)
- Keep navigation structure
- Add the scroll-stop video as a VALUE-ADD, not a replacement
- Mobile optimize the result

### Permission Mode
When building, use `Shift+Tab` to switch to **"Edit Automatically"** mode in Claude Code — this runs much faster than ask-before-edit mode. Only use ask-before-edit if you need precise control.

### Two-Video Integration Pattern
For maximum impact, use TWO video assets:

1. **Hero header video** — ambient background (looping, masked with gradient)
2. **Scroll-stop video** — frame-by-frame extraction tied to scroll position

```
Hero Section:
  └── Background: <video> element with inward masking gradient
  └── Overlay: Brand text, CTA button

Scroll Section (below hero):
  └── Canvas: Frame-by-frame from exploding view video
  └── Overlay: Feature text reveals synced to scroll position
```

### The Frame Extraction Pipeline
```bash
# Extract frames from video
mkdir -p frames
ffmpeg -i video.mp4 -vf "scale=1920:-1" -q:v 80 frames/frame-%04d.webp

# Count total frames (needed for scroll mapping)
ls frames/ | wc -l
```

Then Claude Code builds the JavaScript scroll-to-frame engine (see existing `scroll-video-website` skill for the full engine code).

---

## Step 5: Multi-Page, SEO, Deploy

### Adding Multiple Pages

Prompt Claude with:
```
Look at my current site and understand the existing design language.
Ask me which pages I want to create.
For each page, match the existing design EXACTLY.
Add full SEO optimization.
Include structured data.
Make it fully responsive.
Update the navigation across all pages.
After creating all pages, run a full SEO audit giving me a report.
Show me what's optimized and any ranking improvements.
```

This creates pages that:
- Share the SAME design system (CSS custom properties, fonts, spacing)
- Have cross-linked navigation
- Include unique titles, meta descriptions, OG tags, Twitter cards
- Include JSON-LD structured data
- Are fully responsive

### SEO Optimization

Use an SEO skill with Claude Code:
```
/seo-strategy
```

The audit covers:
- Homepage + all internal pages
- robots.txt and sitemap analysis
- Page-by-page breakdown (titles, meta, headings, content)
- Sitewide technical issues
- Internal linking analysis
- Keyword strategy
- Action plan with high-impact items
- Implementation checklist

**Output:** Full HTML report with scores, organized by priority.

### Deployment

#### Option A: Vercel (Recommended for Production)
```
1. Connect to GitHub (create repo)
2. Connect to Vercel (API token)
3. Prompt: "Create a GitHub repo, publish it, then create a website on Vercel"
4. Custom domain: Vercel dashboard > Domains > Add
5. Analytics: Enable in Vercel dashboard, add tracking code
6. Speed Insights: Available on free plan
```

**Vercel MCP setup:**
```
1. vercel.com/account/settings/tokens → Create token
2. In Claude Code: "Add Vercel MCP with this API key"
3. @ reference mcp_config when prompting
4. Now Claude can deploy directly
```

#### Option B: Netlify (Free, Simpler)
```
1. Prompt: "Make it live on Netlify"
2. One-click deploy
3. Free plan: unlimited deploys, global CDN, 300 credits/month
4. Custom domain available
```

#### Analytics Integration
After deployment:
```
1. Copy the Vercel analytics code snippet
2. Prompt: "I would like analytics on my website in Vercel please" 
   and paste the code
3. Get: visitor counts, page views, speed insights, geographic data
```

---

## Advanced Techniques

### 1. HTML Scaffold Replication
Extract the HTML structure of ANY premium website and rebuild it with your own content + scroll-stop animations. This gives you a structural reference that dramatically improves one-shot quality.

**Tools:** Google "HTML website extractor" — download as HTML → drop into Claude Code

### 2. Reference Image Chaining
In Nano Banana 2, generate image A → reference A when generating image B. This ensures visual consistency across your assembled and exploded views.

### 3. Iterative Performance Optimization
After the initial build, run 3-4 rounds of:
```
"Hey, make it faster"
"The gradient isn't strong enough between sections — fix it"
"Mobile optimize the site"
```
Each round Claude optimizes differently (compression, preloading, responsive fixes).

**Real example:** Video compressed from 5.3MB → 252KB in one optimization pass.

### 4. Two-Video Architecture
- Video 1: Hero background (looping ambient)
- Video 2: Scroll-driven feature reveal (frame extraction)
- Masking gradient between them for seamless transition

### 5. Locomotive Scroll + Frame Scrubbing
Claude Code may implement locomotive scroll sequences automatically. The frame extraction approach (video → WebP frames → canvas) is faster than playing a video element tied to scroll.

### 6. Mouse-Position Effects
Video backgrounds can be tied to mouse position for subtle parallax/movement effects. Claude Code sometimes adds this automatically.

---

## Critical Quality Notes

### Image Generation
- **MINIMUM 2K resolution** — anything less looks amateur
- **4 iterations** — always generate multiple options
- **Clean white background** — NOTHING touching edges
- **Reference the assembled image** when generating the exploded version
- **Include actual logo + reference photos** for brand-specific results

### Video Generation
- **Generate 3-4 video versions** — pick the best one
- **Start and finish images determine everything** — invest time here
- **7 seconds** is ideal for scroll-stop animations
- **16:9 aspect ratio** for website hero sections
- **1080p minimum** quality

### Website Build
- **Typography hierarchy is king** — massive display headings, refined body text
- **One accent color, used sparingly** — CTAs, stat numbers, labels only
- **Generous whitespace** — sections need breathing room
- **Loading screen with real progress bar** — NEVER show empty canvas
- **Sticky canvas** — `position: sticky; top: 0` for video lock during scroll
- **GPU-accelerated animations only** — transform and opacity, never layout properties
- **Feature text MUST sync with video moments** — the #1 quality issue

### Mobile
- **Always mobile optimize** — run "mobile optimize" 3-4 times iteratively
- **Single-column layout on mobile** — canvas full-width, text below
- **Test at 375px width** — the iPhone baseline

### Performance
- **WebP frames only** — 25-35% smaller than PNG/JPG
- **Max frame width: 1920px**
- **Preload ALL frames** before enabling scroll
- **rAF throttle** on scroll handlers
- **Compress hero video aggressively** — it's background ambiance, not the star
- **Target: <50MB total frames directory**

---

## Performance Optimization Playbook

### The "Make It Faster" Loop
After initial build, iterate:
```
Round 1: "Make it load significantly faster"
  → Claude extracts frames as optimized JPEGs, adds preloading
  → Video → frame extraction (eliminates video decode overhead)

Round 2: "Still a little laggy, optimize more"
  → Claude compresses frames further, adds lazy loading for below-fold
  → Reduces frame count (skip every other frame for distant scroll regions)

Round 3: "Compress the hero header video too"
  → Claude compresses from multi-MB to <500KB
  → Adds proper cache headers

Round 4: "Make the gradient transitions smoother"
  → Claude adjusts gradient strength between sections
  → Fixes any visual seam between video and page background
```

### Key Compression Techniques
| Asset | Before | After | Technique |
|-------|--------|-------|-----------|
| Hero video | 5.3MB | 252KB | FFmpeg re-encode, lower bitrate |
| Frame images | PNG | WebP | Format conversion, quality 75-85 |
| Total frames dir | 100MB+ | <50MB | Reduced resolution, quality tuning |
| CSS/JS | Unminified | Minified | Standard minification |

---

## Deployment Playbook

### Vercel Setup (Full)
```bash
# 1. Create GitHub repo
gh repo create my-website --public --source=. --push

# 2. Install Vercel CLI
npm i -g vercel

# 3. Deploy
vercel --prod

# 4. Add custom domain
# Vercel dashboard > Project > Domains > Add
```

### Netlify Setup (Quick)
```bash
# 1. Install Netlify CLI
npm i -g netlify-cli

# 2. Deploy
netlify deploy --prod --dir=.
```

### Post-Deploy Checklist
- [ ] Scroll through entire page on production URL
- [ ] Verify all frames load (the #1 deploy failure)
- [ ] Test mobile responsiveness
- [ ] Check loading screen appears with real progress
- [ ] Verify analytics tracking
- [ ] Test all navigation links (multi-page)
- [ ] Run Lighthouse audit (aim for 90+ on all scores)

---

## Tools & Resources Inventory

| Tool | Purpose | Cost | Notes |
|------|---------|------|-------|
| **Firecrawl.dev** | Brand extraction | Free tier + API | Automate with Claude skill |
| **Nano Banana 2** | AI image generation | Per-generation | 2K+, 4 iterations, 16:9 |
| **Kling 3.0** | AI video generation | ~$3-4/video | Via Hixsfield or API |
| **Claude Code** | Website build + deploy | Subscription | Skills-based workflow |
| **FFmpeg** | Frame extraction | Free | `brew install ffmpeg` |
| **Vercel** | Hosting + analytics | Free tier | Global CDN, custom domains |
| **Netlify** | Hosting (alternative) | Free tier | Simpler, fewer features |
| **GitHub** | Code hosting | Free | Required for Vercel deploy |
| **HTML Extractor** | Scaffold extraction | Free (web tool) | Google "HTML website extractor" |

### Claude Code Skills Needed
1. **scroll-video-website** (EXISTING) — Frame extraction + scroll-to-canvas engine
2. **Asset Generation Skill** — Prompt engineering for Nano Banana 2 images
3. **SEO Optimization Skill** — Full site SEO audit and optimization
4. **Brand Extraction Skill** — Firecrawl API integration for automated brand scraping
5. **Taste/Design Skill** — High-end design principles for one-shot premium look

---

## Skill Architecture Plan

### Ultimate Skill: Premium Website Builder

The goal is to combine ALL techniques into a single, comprehensive skill that orchestrates the entire pipeline.

```
/premium-website-builder

Phases:
1. BRAND     → Extract or define brand identity
2. ASSETS    → Generate assembled + exploded views with Nano Banana 2
3. VIDEO     → Guide video generation with Kling 3.0
4. BUILD     → Construct scroll-driven website with all design principles
5. OPTIMIZE  → Performance, mobile, SEO
6. DEPLOY    → GitHub + Vercel/Netlify + analytics + domain
7. ITERATE   → Guided improvement loop
```

### Key Principles for the Skill
- **Design principles baked in** (spacing, typography hierarchy, color usage)
- **Frame extraction automated** (ffmpeg commands generated)
- **Loading screen mandatory** (with real progress bar)
- **Mobile responsive by default** (not as afterthought)
- **SEO from the start** (meta tags, structured data, OG tags)
- **Two-video support** (hero background + scroll-driven)
- **HTML scaffold support** (extract and rebuild from existing sites)
- **Iterative optimization built into workflow** (not one-shot-and-done)

---

## Research Findings (Agent Synthesis)

### Taste Skill Design Principles (What Makes One-Shot Sites Premium)

The "Taste Skill" (attributed to Leon / @leonidas_ai, 16-year-old developer) encodes **design constraints as system-level instructions**. The core insight: you don't need to be a designer if you encode taste as rules.

**The 5 Premium Principles:**

1. **Whitespace is structural, not decorative**
   - Minimum 80px section padding, generous line-height (1.6-1.8 for body)
   - Amateur sites cram content; premium sites let it breathe

2. **Typography hierarchy over color**
   - 2 fonts max (display + body). Size ratio matters more than color
   - 4.5rem+ hero headings, 1.125rem body minimum
   - Weight contrast (300 vs 700) creates hierarchy without visual noise

3. **Muted, intentional color palettes**
   - 1 accent color max
   - Backgrounds in 95-98% lightness range (not pure white)
   - Dark modes: #0a0a0a, NOT #000000
   - Saturated colors scream amateur

4. **Micro-interactions signal quality**
   - Subtle hover transforms (scale 1.02, NOT 1.1)
   - 300ms cubic-bezier transitions
   - Cursor changes on interactive elements
   - The "feel" of clicking matters

5. **Real layout patterns**
   - Bento grids, asymmetric two-column splits
   - Overlapping elements with negative margins
   - Sticky sections
   - AVOID centered-single-column-everything

> **The premium vs. amateur gap comes down to: restraint, spacing, and motion subtlety.**

### Modern Scroll Animation Stack (2026)

| Technology | Status | Best For |
|-----------|--------|----------|
| **CSS `animation-timeline: scroll()`** | Production-ready (Chrome/Edge) | Simple scroll-triggered animations, progressive enhancement |
| **GSAP ScrollTrigger** | Production standard | Complex sequences, pinning, scrubbing |
| **Lenis** | Active, replaces Locomotive Scroll | Smooth scrolling library (Locomotive is DEAD since 2023) |
| **Canvas frame scrubbing** | Apple-style | Video-to-scroll animations |
| **Intersection Observer** | Native, universal | Reveal animations, lazy loading |

**GSAP ScrollTrigger Non-Obvious Tips:**
- Use `scrub: 0.5` (NOT `true`) — gives smooth interpolation without jank
- `pin` + `anticipatePin` prevents layout jumps
- `ScrollTrigger.batch()` for repeated elements
- `matchMedia` within ScrollTrigger for responsive breakpoints

**Frame Scrubbing Secret:** Don't snap to nearest frame — **blend between two adjacent frames** for smooth interpolation. Use `requestAnimationFrame` with scroll position, not scroll events directly.

### Video Generation Tool Comparison

| Tool | Best For | Quality | Cost |
|------|----------|---------|------|
| **Kling 3.0** (Kuaishou) | Start/end frame transitions, product reveals | High | ~$3-4/video (credit-based) |
| **Runway Gen-3 Alpha** | Highest quality, camera control, motion brush | Highest | ~$5-10/video |
| **Luma Dream Machine** | 3D-aware generation, object rotation, 360 views | High | Varies |
| **Pika 2.0** | Quick iterations, style consistency | Medium-High | ~$2-3/video |
| **Stable Video Diffusion** | Open source, local, batch processing | Variable | Free (compute costs) |

**Kling Prompt Engineering:**
- Be specific about camera: "slow dolly in," "orbital pan left to right," "static camera with subject motion"
- Describe PHYSICAL motion, not abstract concepts
- Keep prompts under ~200 words, front-load the most important motion
- Use negative prompts: "no morphing, no distortion, no sudden cuts"

**Note:** Higgsfield is a SEPARATE product from Kling (focused on human-centric video). The videos may use Higgsfield as a UI wrapper, but they are independent platforms.

### Advanced Performance Techniques

**Video Encoding (for hero background):**
- Dual encode: H.265 (Safari) + VP9 (Chrome) with `<source>` fallbacks
- CRF 28-32 for aggressive compression
- Never autoplay files over 3MB on mobile

**Frame Sequences:**
- Extract at 1x display resolution (not 2x) — saves 75% file size
- WebP at quality 80 (sweet spot)
- AVIF saves 30% more than WebP but 10x encode time — use for hero assets only
- **Preload first 10 frames, lazy-load the rest** (not all-at-once)
- `<link rel="preload" as="image">` for above-fold hero images
- `fetchpriority="high"` on LCP element

**CDN:**
- Immutable cache headers (1 year) with content hashing in filenames
- Cloudflare R2 or Bunny CDN for cost-effective frame serving

**Mobile Optimization:**
- Serve HALF the frames (30 instead of 60)
- Reduce canvas resolution by 50%
- Or replace scroll animations with simple fade-ins below 768px
- Test on real 4G (not just throttled desktop)

### HTML Scaffold Extraction (Best Practices)

**Tools:**
- Browser DevTools: "Copy > Copy outerHTML" on sections you admire
- **SingleFile** browser extension: captures entire pages with inlined CSS
- Web-based HTML extractors (search "HTML website extractor")

**Key Principle:** Extract **structure and spacing ratios**, not pixels. Convert px to rem/vw proportions.

**Prompt pattern for scaffold use:**
```
Replicate this layout structure and spacing. 
Replace all content with [your content]. 
Modernize the CSS to use grid/flexbox.
Preserve the typography hierarchy and whitespace ratios.
```

### SEO for Premium Sites

- **SSR or pre-rendering is mandatory** for SEO. Consider Astro (static) or Next.js (SSR) over pure client-rendered SPA
- Semantic HTML: one `<h1>`, logical heading hierarchy, `<main>`, `<article>`, `<section>`
- **Core Web Vitals targets:** LCP under 2.5s (preload hero), CLS near 0 (explicit dimensions on images/video), INP under 200ms
- Structured data (JSON-LD) for business sites gives rich snippets with minimal effort
- Generate sitemap, use `history.pushState` for real URLs on SPAs

### Firecrawl API Integration

```javascript
// Node.js SDK
import FirecrawlApp from '@mendable/firecrawl-js';
const app = new FirecrawlApp({ apiKey: 'your-key' });

// Scrape brand assets
const result = await app.scrapeUrl('https://example.com', {
  formats: ['markdown'],
  // Extract branding: colors, fonts, logos
});
```
- REST API + Node.js SDK available
- Usage-based pricing (credits per page)
- Free tier for testing
- Can be automated into a Claude Code skill for brand extraction at scale

---

---

## The "Flip Book" Mental Model (Video 3 Deep Dive)

This is the clearest explanation of WHY we extract frames instead of using video:

```
Video file → Extract ALL frames → Load frames individually on scroll = "Flip Book"

Why not just play a video on scroll?
→ Videos are designed for TIME-based playback, not SCROLL-based
→ Frame extraction gives INSTANT access to any frame at any scroll position
→ Pre-loaded WebP frames = buttery smooth, no buffering, no decode lag
→ ~180 frames is fine with preloading + WebP compression
```

### Background Matching Rule (CRITICAL)

> **The image background MUST match the website background color.** If your website is dark, generate on dark. If white, generate on white. Claude Code can adjust after the fact, but white-image-on-black-site fundamentally doesn't work.

The goal is the **floating illusion** — the product appears to hover in the page, with no visible image edges. This only works when backgrounds match perfectly.

**Practical implications:**
- Black website → generate images with pure black background
- White website → generate images with pure white background
- The image is a SQUARE — edges exist. Matching backgrounds hide them
- You CAN have different colors per section (hero = dark, scroll section = white) — just match per-section

### Creative Transition Ideas (Beyond Deconstruct/Explode)

| Transition Type | Example | When to Use |
|----------------|---------|-------------|
| **Deconstruction** | Keyboard pulls apart into keys | Hardware, products with visible components |
| **X-Ray reveal** | Headphones become transparent | Electronics, showing inner engineering |
| **Build from nothing** | Architecture rises from white void | Construction, design, creation stories |
| **Rotation/orbit** | Globe spinning on axis | Global products, 360 views |
| **Scale reveal** | Macro zoom into microscopic detail | Precision products, science, materials |
| **Assembly** | Components fly together | Manufacturing, teamwork narratives |

> **Lifted from Apple:** They do motion → X-ray on AirPods. Study Apple product pages for transition inspiration.

### Video Prompt Writing Hack

Don't struggle with prompts — **drop both images into Claude and ask it to write the transition prompt:**

```
"Hey, I have these two images. Write me a prompt for a video 
that smoothly transitions from the first to the second."
```

Claude understands the visual context and writes better transition prompts than you'd write manually.

### Key Settings Reminders

| Setting | Value | Why |
|---------|-------|-----|
| **Enhance prompt** | OFF (always decline) | Enhancement adds complexity that reduces crispness |
| **Transition style** | Simple/continuous | "We don't want crazy twisting — keeps crispness" |
| **Video resolution** | 1080p default | Upscale if targeting large screens, or shrink display size |
| **Plan mode** | ON in Claude Code | Always plan before building |

### Post-Build Iteration Patterns

Common first-pass issues and how to fix them:

| Issue | Fix Prompt |
|-------|-----------|
| Scroll takes too many swipes | "Make the scroll animation faster — it takes 8 scrolls, should be 3-4" |
| Overlay cards too thin/light | "Make the feature cards weightier with drop shadows, keep them visible longer" |
| Animation too big for screen | "Shrink the scroll animation canvas — it's too large for desktop" |
| Background mismatch visible | "Match the animation background exactly to the section background color" |
| Text hard to read over animation | "Add semi-transparent backdrop to text overlapping the animation" |

### Design Inspiration Sources

For finding premium website reference designs:
- **[Godly.website](https://godly.website)** — curated premium web design
- **[Dribbble](https://dribbble.com)** — designer portfolios and concepts
- **Perplexity/Claude** — ask "show me premium product landing pages for [category]"
- **Apple product pages** — the gold standard for scroll-driven animations
- **Screenshots + CSS** — bring actual references into Claude Code for context

### Voice-Dump Prompting

Instead of carefully crafting prompts, just **turn on voice and brain dump**:
```
"Hey, I want a keyboard product landing page. I don't want it to 
look like AI slop. Take a look at the MD file, take a look at the 
MP4, and I want the scroll animation. Also ask me any questions."
```
Claude Code handles the structure — you provide the vision and constraints.

### Tech Stack Note
Video 3 uses **Next.js + Tailwind** (vs. pure HTML/CSS/JS in the existing scroll skill). Both work — Next.js adds routing, SSR for SEO, component structure. Pure HTML is simpler for single-page sites.

---

## Source Videos Reference

### Video 1: Jack Roberts — "Build Premium Websites with Claude Code + Nano Banana 2"
- **Focus:** AnyVan brand example, Firecrawl brand extraction, Nano Banana 2 images, Kling 3.0 video, HTML scaffold technique, multi-page SEO, Vercel deployment
- **Key unique technique:** HTML extraction from existing websites as scaffold
- **Key unique technique:** Firecrawl.dev for automated brand extraction
- **Key unique technique:** Multi-page creation matching design language + SEO audit

### Video 2: Anonymous — "4 Websites in 15 Minutes with 3D Scroll Effects"
- **Focus:** Interior design example, Taste Skill, one-shot design, Kling 3.0 exploding views, two-video architecture, performance optimization, Netlify deploy
- **Key unique technique:** Two-video architecture (hero background + scroll-driven)
- **Key unique technique:** Iterative "make it faster" optimization loop
- **Key unique technique:** Mouse-position tied video backgrounds
- **Key quote:** "A few years back, this would be $5,000-$10,000 a pop. Now you can do it in 10 minutes for $2-3 in tokens."

### Video 3: "3D Scroll Animations with Claude Code + Nano Banana 2"
- **Focus:** Keyboard/headphones examples, flip book mental model, background matching, creative transitions, best practices MD file
- **Key unique technique:** The "flip book" explanation — WHY frames > video for scroll
- **Key unique technique:** Background matching rule (image bg MUST match site bg)
- **Key unique technique:** Drop both images into Claude to auto-generate video prompt
- **Key unique technique:** Creative transition types beyond deconstruct (X-ray, build-from-nothing, assembly)
- **Key insight:** "Don't enhance the prompt" — simplicity keeps transitions crisp
- **Key insight:** Voice-dump prompting works great for Claude Code

---

## Notes for Uplift Application

### Chat Demo Header — Animated Mascot
- **Approach:** Use Nano Banana 2 to generate Luna essay coach character/mascot
- **Placeholder** for now in the chat header (another chat handling this)
- **Eventually:** Animated character using the same assembled→exploded→video pipeline
- **Integration:** The mascot video/animation will be embedded in the chat UI, not a full-page scroll-driven site
- **Technique adaptation:** Instead of scroll-driven, the mascot could be:
  - Idle animation loop (subtle movement)
  - State-driven animation (different frames for different coaching states)
  - Reaction animations (triggered by user actions)

### Potential for Uplift Landing Page
The full pipeline could be used to rebuild the Uplift marketing/landing page with:
- Brand extraction from existing site
- AI-generated hero assets
- Scroll-driven product demo animation
- Multi-page with full SEO
- Premium $100K look and feel
