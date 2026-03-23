---
name: scroll-video-website
description: Build premium scroll-driven animated websites from video files. Extracts video frames with ffmpeg and creates professional landing pages where scrolling controls video playback. Use when the user wants to build animated product pages, scroll-driven video sites, or Apple-style landing pages with video-to-scroll animations.
---

# Scroll-Driven Video Website Builder

Build premium, scroll-driven animated websites from video files. The core technique: extract video frames → map frames to scroll position → create a professional landing page where scrolling controls the animation.

---

## Core Architecture

### How It Works

1. **Video → Frames**: Use `ffmpeg` to extract every frame from the input video as optimized WebP images
2. **Frames → Scroll Map**: Each frame is mapped to a scroll position — scrolling forward advances the animation, scrolling backward reverses it
3. **Canvas Rendering**: A fixed `<canvas>` element draws the current frame based on scroll position, creating buttery-smooth video-as-scroll
4. **Layered Sections**: Text, stats, CTAs, and other content are layered on top of/around the canvas, triggered by scroll position

### File Structure

```
project/
├── index.html          # Single-page entry
├── css/
│   └── styles.css      # All styles (custom properties, animations, responsive)
├── js/
│   ├── app.js          # Main orchestrator
│   ├── scroll-video.js # Frame extraction, canvas rendering, scroll binding
│   └── animations.js   # Intersection observers, reveal animations, parallax
├── frames/             # Extracted video frames (frame-001.webp, frame-002.webp, ...)
└── assets/             # Any additional images, fonts, icons
```

### Tech Stack (No Build Tools)

- **Pure HTML/CSS/JS** — no React, no bundler, no npm. Opens directly in browser.
- **Canvas API** for frame rendering
- **Intersection Observer** for scroll-triggered animations
- **CSS Custom Properties** for theming
- **Google Fonts** via CDN for typography

---

## Step-by-Step Build Process

### Phase 1: Planning (ALWAYS do this first)

Before writing any code, create a plan that covers:

1. **Brand Identity**: Product name, tagline, color palette (1 dominant + 1 accent), 2 Google Fonts (display + body)
2. **Video Analysis**: Watch/analyze the video — what's happening? What's the narrative arc? What moments are dramatic?
3. **Section Map**: Plan 5-7 scroll sections that align with video moments:
   - Hero (video start frame visible, brand intro)
   - Product Reveal (animation begins as user scrolls)
   - Feature Highlights (2-4 features with text appearing alongside key video moments)
   - Stats/Social Proof
   - CTA (final frame visible, strong call to action)
4. **Scroll Budget**: Map approximate scroll percentages to video moments and text reveals
5. **Animation Inventory**: List every animation (text reveals, parallax, counter animations, etc.)

### Phase 2: Frame Extraction

```bash
# Check if ffmpeg is available
which ffmpeg || brew install ffmpeg

# Create frames directory
mkdir -p frames

# Extract all frames as optimized WebP
# -q:v 80 balances quality and file size
ffmpeg -i INPUT_VIDEO.mp4 -vf "scale=1920:-1" -q:v 80 frames/frame-%04d.webp

# Count frames for scroll mapping
ls frames/ | wc -l
```

**Critical details:**
- Output format MUST be WebP (not PNG/JPG) — dramatically smaller files, critical for web performance
- Scale to max 1920px width — larger is wasteful, smaller loses quality on desktop
- Use 4-digit padding (`%04d`) for proper sorting
- Note the total frame count — you'll need this for scroll mapping

### Phase 3: Scroll-Video Engine

The core JavaScript module that binds video frames to scroll position:

```javascript
// scroll-video.js — Core scroll-to-frame engine

class ScrollVideoPlayer {
  constructor(config) {
    this.canvas = document.getElementById(config.canvasId);
    this.ctx = this.canvas.getContext('2d');
    this.frameCount = config.frameCount;
    this.framePath = config.framePath; // e.g., 'frames/frame-'
    this.frameExtension = config.frameExtension || '.webp';
    this.frameDigits = config.frameDigits || 4;
    this.scrollStart = config.scrollStart || 0;    // scroll % where animation begins
    this.scrollEnd = config.scrollEnd || 1;         // scroll % where animation ends
    this.frames = [];
    this.currentFrame = 0;
    this.loaded = false;
    this.loadedCount = 0;
  }

  // Preload all frames into Image objects for instant rendering
  async preloadFrames(onProgress) {
    const promises = [];
    for (let i = 1; i <= this.frameCount; i++) {
      const img = new Image();
      const num = String(i).padStart(this.frameDigits, '0');
      img.src = `${this.framePath}${num}${this.frameExtension}`;
      promises.push(new Promise((resolve) => {
        img.onload = () => {
          this.loadedCount++;
          if (onProgress) onProgress(this.loadedCount / this.frameCount);
          resolve();
        };
        img.onerror = resolve; // Don't block on missing frames
      }));
      this.frames.push(img);
    }
    await Promise.all(promises);
    this.loaded = true;
    this.resizeCanvas();
    this.renderFrame(0);
  }

  resizeCanvas() {
    if (!this.frames[0]) return;
    const ratio = this.frames[0].naturalWidth / this.frames[0].naturalHeight;
    this.canvas.width = this.canvas.offsetWidth * window.devicePixelRatio;
    this.canvas.height = this.canvas.width / ratio;
    this.canvas.style.height = `${this.canvas.offsetWidth / ratio}px`;
  }

  renderFrame(index) {
    const frame = this.frames[Math.min(index, this.frames.length - 1)];
    if (!frame || !frame.complete) return;
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.drawImage(frame, 0, 0, this.canvas.width, this.canvas.height);
    this.currentFrame = index;
  }

  // Call this on scroll — maps scroll position to frame index
  onScroll(scrollProgress) {
    if (!this.loaded) return;
    // Clamp scroll to the configured range
    const normalized = Math.max(0, Math.min(1,
      (scrollProgress - this.scrollStart) / (this.scrollEnd - this.scrollStart)
    ));
    const frameIndex = Math.round(normalized * (this.frameCount - 1));
    if (frameIndex !== this.currentFrame) {
      this.renderFrame(frameIndex);
    }
  }
}
```

**Key principles:**
- **Preload ALL frames** before hiding the loading screen — no lazy loading, frames must be instant
- **Use `requestAnimationFrame`** for scroll handler to prevent jank
- **`devicePixelRatio`** scaling for sharp rendering on Retina displays
- **Resize handler** to keep canvas responsive

### Phase 4: Scroll Orchestration

```javascript
// app.js — Main scroll orchestrator

document.addEventListener('DOMContentLoaded', () => {
  const player = new ScrollVideoPlayer({
    canvasId: 'product-canvas',
    frameCount: TOTAL_FRAME_COUNT,
    framePath: 'frames/frame-',
    scrollStart: 0.05,  // Animation starts at 5% scroll
    scrollEnd: 0.65,    // Animation ends at 65% scroll
  });

  // Loading screen with progress
  const loader = document.getElementById('loader');
  const progressBar = document.getElementById('load-progress');

  player.preloadFrames((progress) => {
    progressBar.style.width = `${progress * 100}%`;
    if (progress >= 1) {
      loader.classList.add('loaded');
      document.body.classList.add('ready');
    }
  });

  // Scroll handler with rAF throttle
  let ticking = false;
  window.addEventListener('scroll', () => {
    if (!ticking) {
      requestAnimationFrame(() => {
        const scrollProgress = window.scrollY / (document.body.scrollHeight - window.innerHeight);
        player.onScroll(scrollProgress);
        updateTextAnimations(scrollProgress);
        ticking = false;
      });
      ticking = true;
    }
  });
});
```

### Phase 5: Section Design Patterns

#### Pattern A: Hero with Loading Screen

```html
<!-- Loading screen — shown while frames preload -->
<div id="loader" class="loader">
  <div class="loader-content">
    <h1 class="loader-brand">BRAND NAME</h1>
    <div class="load-progress-track">
      <div id="load-progress" class="load-progress-bar"></div>
    </div>
  </div>
</div>

<!-- Hero section -->
<section class="hero">
  <div class="hero-content">
    <h1 class="hero-title">PRODUCT NAME</h1>
    <p class="hero-tagline">Tagline goes here</p>
    <div class="scroll-indicator">
      <span>Scroll to explore</span>
      <div class="scroll-arrow"></div>
    </div>
  </div>
  <canvas id="product-canvas" class="product-canvas"></canvas>
</section>
```

#### Pattern B: Feature Reveal (Text + Video Side-by-Side)

```html
<section class="feature-section" data-scroll-reveal>
  <div class="feature-content">
    <!-- Text on left (or right), canvas continues on opposite side -->
    <div class="feature-text">
      <span class="feature-label">01</span>
      <h2 class="feature-title">Feature Name</h2>
      <p class="feature-description">Description that reveals as user scrolls into this section.</p>
    </div>
  </div>
</section>
```

#### Pattern C: Stats Counter

```html
<section class="stats-section" data-scroll-reveal>
  <div class="stats-grid">
    <div class="stat" data-target="2400" data-suffix="RPM">
      <span class="stat-value">0</span>
      <span class="stat-label">Motor Speed</span>
    </div>
    <!-- More stats... -->
  </div>
</section>
```

#### Pattern D: Final CTA

```html
<section class="cta-section">
  <div class="cta-content">
    <h2 class="cta-title">The last [product] you'll ever need.</h2>
    <p class="cta-subtitle">Starting at $X</p>
    <a href="#" class="cta-button">Pre-Order Now</a>
  </div>
</section>
```

### Phase 6: CSS Architecture

```css
/* === DESIGN SYSTEM === */
:root {
  /* Brand Colors — set per project */
  --color-bg: #000000;
  --color-text: #ffffff;
  --color-accent: #ff2d2d;       /* Bold accent — NOT subtle */
  --color-text-muted: #888888;
  --color-surface: #0a0a0a;

  /* Typography — ALWAYS use Google Fonts, never system fonts */
  --font-display: 'CHOSEN_DISPLAY_FONT', sans-serif;
  --font-body: 'CHOSEN_BODY_FONT', sans-serif;

  /* Spacing */
  --section-padding: clamp(4rem, 10vh, 8rem);
  --content-max-width: 1400px;
}

/* === GLOBAL === */
* { margin: 0; padding: 0; box-sizing: border-box; }
html { scroll-behavior: smooth; }
body {
  background: var(--color-bg);
  color: var(--color-text);
  font-family: var(--font-body);
  overflow-x: hidden;
}

/* === LOADING SCREEN === */
.loader {
  position: fixed;
  inset: 0;
  z-index: 9999;
  background: var(--color-bg);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: opacity 0.8s ease, visibility 0.8s ease;
}
.loader.loaded {
  opacity: 0;
  visibility: hidden;
  pointer-events: none;
}
.load-progress-track {
  width: 200px;
  height: 2px;
  background: var(--color-surface);
  margin-top: 1rem;
}
.load-progress-bar {
  height: 100%;
  background: var(--color-accent);
  width: 0%;
  transition: width 0.3s ease;
}

/* === CANVAS === */
.product-canvas {
  position: sticky;
  top: 0;
  width: 100%;
  height: 100vh;
  object-fit: contain;
  z-index: 1;
}

/* === SCROLL-TRIGGERED REVEALS === */
[data-scroll-reveal] {
  opacity: 0;
  transform: translateY(40px);
  transition: opacity 0.8s ease, transform 0.8s ease;
}
[data-scroll-reveal].revealed {
  opacity: 1;
  transform: translateY(0);
}

/* === FEATURE SECTIONS OVER CANVAS === */
.feature-section {
  position: relative;
  z-index: 2;
  min-height: 100vh;
  display: flex;
  align-items: center;
  padding: var(--section-padding) 2rem;
}
.feature-text {
  max-width: 500px;
  /* Position on one side — canvas visible on the other */
}

/* === BACKGROUND TEXT (watermark effect) === */
.bg-text {
  position: absolute;
  font-size: clamp(4rem, 15vw, 12rem);
  font-family: var(--font-display);
  font-weight: 900;
  color: rgba(255, 255, 255, 0.03);
  text-transform: uppercase;
  white-space: nowrap;
  pointer-events: none;
  z-index: 0;
}

/* === STAT COUNTERS === */
.stat-value {
  font-size: clamp(2rem, 5vw, 4rem);
  font-family: var(--font-display);
  font-weight: 700;
  color: var(--color-accent);
}

/* === CTA === */
.cta-button {
  display: inline-block;
  padding: 1rem 3rem;
  background: var(--color-accent);
  color: var(--color-text);
  text-decoration: none;
  font-family: var(--font-display);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}
.cta-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 40px rgba(var(--color-accent-rgb), 0.3);
}
```

### Phase 7: Animation Library

```javascript
// animations.js — Reusable scroll-triggered animations

// Intersection Observer for reveal animations
function initScrollReveals() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('revealed');
      }
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -50px 0px' });

  document.querySelectorAll('[data-scroll-reveal]').forEach(el => observer.observe(el));
}

// Animated number counters
function initCounters() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const el = entry.target;
        const target = parseInt(el.dataset.target);
        const suffix = el.dataset.suffix || '';
        animateCounter(el.querySelector('.stat-value'), target, suffix);
        observer.unobserve(el);
      }
    });
  }, { threshold: 0.5 });

  document.querySelectorAll('.stat').forEach(el => observer.observe(el));
}

function animateCounter(el, target, suffix, duration = 2000) {
  const start = performance.now();
  function update(now) {
    const progress = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
    el.textContent = Math.round(eased * target).toLocaleString() + (suffix ? ` ${suffix}` : '');
    if (progress < 1) requestAnimationFrame(update);
  }
  requestAnimationFrame(update);
}

// Parallax text that moves at different scroll speeds
function initParallax() {
  const elements = document.querySelectorAll('[data-parallax]');
  window.addEventListener('scroll', () => {
    requestAnimationFrame(() => {
      elements.forEach(el => {
        const speed = parseFloat(el.dataset.parallax) || 0.5;
        const rect = el.getBoundingClientRect();
        const offset = (rect.top - window.innerHeight / 2) * speed;
        el.style.transform = `translateY(${offset}px)`;
      });
    });
  });
}

// Staggered reveal for child elements
function initStaggeredReveals() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const children = entry.target.querySelectorAll('[data-stagger-child]');
        children.forEach((child, i) => {
          child.style.transitionDelay = `${i * 0.15}s`;
          child.classList.add('revealed');
        });
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.2 });

  document.querySelectorAll('[data-stagger-parent]').forEach(el => observer.observe(el));
}
```

---

## Design Rules (Non-Negotiable)

### Visual Design

1. **Background MUST be solid black (#000000)** — the product video needs to blend seamlessly into the page. No grays, no dark blues, no gradients on the body.
2. **Product video area must have NO visible borders or frames** — it should float in the black space as if it's part of the page itself.
3. **Typography hierarchy is king** — massive display headings (clamp 3rem to 8rem), refined body text. Never use the same size for two different roles.
4. **One accent color, used sparingly** — for CTAs, stat numbers, feature labels. NOT for large background areas.
5. **Text must be effortlessly readable** — high contrast against black, generous line-height (1.5+ for body), comfortable max-width (60-70ch for paragraphs).
6. **Watermark/background text** — large, nearly invisible text (opacity 0.02-0.04) behind sections adds depth without distraction.
7. **Generous whitespace** — sections need breathing room. min-height: 100vh for major sections. Don't crowd the product.

### Scroll & Animation

8. **Frame preloading is mandatory** — show a branded loading screen with progress bar. NEVER show an empty canvas or broken animation.
9. **Canvas must be `position: sticky; top: 0`** — this keeps the video locked in viewport while content scrolls over/beside it.
10. **Scroll budget**: Give the video animation at least 60% of total scroll height. The animation IS the experience.
11. **Feature text must appear WHILE the relevant video moment is visible** — if feature #2 talks about what happens at 50% of the video, it must scroll into view around 50% scroll position. Test this.
12. **Scroll-triggered text reveals** must use Intersection Observer with appropriate thresholds (0.15-0.3) — not scroll position math. This ensures they work regardless of viewport size.
13. **All animations must be GPU-accelerated** — only animate `transform` and `opacity`. Never animate `top`, `left`, `width`, `height`, or `margin`.
14. **Smooth, eased transitions** — minimum 0.6s duration for reveals, ease or cubic-bezier timing. Nothing should feel abrupt.

### Layout

15. **Canvas on one side (2/3 width), text on the other (1/3)** for feature sections — unless the user specifies a different layout. This prevents text from covering the product.
16. **Hero section**: Full-width canvas with centered text overlay, text fades out as scroll begins.
17. **Mobile**: Canvas goes full-width, text sections become full-width below. The scroll-to-frame still works but text doesn't overlap canvas.

### Performance

18. **WebP frames only** — not PNG, not JPG. WebP is 25-35% smaller at equivalent quality.
19. **Max frame width: 1920px** — scale down during extraction if source is larger.
20. **Frame quality: 75-85** (ffmpeg `-q:v` or `-quality` flag) — balances visual quality with file size.
21. **Total frames directory should be under 50MB** if possible — for reasonable load times.
22. **Loading screen must show actual progress** — not a fake spinner. Use the preload callback.

---

## Iteration Workflow

After the first build, iterate with the user:

1. **Test locally first** — always serve via a local HTTP server (`python3 -m http.server` or `npx serve`)
2. **Check scroll timing** — the #1 issue is text appearing too early or too late relative to the video moment
3. **Check feature visibility** — every feature section must be fully readable while its video moment is on screen
4. **Check transitions** — scroll up AND down. Animations should work in both directions
5. **Check loading** — frame preload must complete before scroll is enabled
6. **Mobile test** — resize to 375px width and verify layout doesn't break

### Common Fixes

| Problem | Solution |
|---------|----------|
| Feature text appears too late | Decrease the scroll trigger threshold OR move the section higher in the HTML |
| Video animation too fast | Increase the scroll height of the video container (make it taller) |
| Video animation too slow | Decrease scroll height or reduce frame count |
| Text unreadable over video | Add a semi-transparent gradient overlay between canvas and text |
| Jank during scroll | Ensure rAF throttling, check frame preload completed |
| Canvas blank on deploy | Frames not included in deploy — check .gitignore, verify frames directory is pushed |
| Mobile layout broken | Switch to single-column, canvas full-width above text |

---

## Deployment Checklist

When pushing to GitHub + Vercel (or similar):

1. **Frames MUST be committed** — they are NOT in .gitignore. Without frames, the animation disappears.
2. **No build step needed** — this is static HTML/CSS/JS. Vercel/Netlify will serve it as-is.
3. **Verify after deploy** — load the production URL and scroll through the entire page. The #1 deploy failure is missing frames.
4. **Set cache headers** — frames should have long cache TTL (they never change).

---

## Video Source Tips

For users creating their own videos:

- **Black background is critical** — the video background must match the page background (#000) for seamless blending
- **No shadows, reflections, or environmental lighting** that would create visible edges against the black page
- **16:9 aspect ratio** works best for desktop layouts
- **2-5 second videos** are ideal — longer videos = more frames = larger downloads
- **Dramatic reveal animations** work best: product rotating, deconstructing, assembling, transforming, X-ray views
- **AI video tools**: Kling, Runway, Pika, Luma — generate start frame + end frame images, then animate between them
- **Two-video technique**: Video 1 reveals the product (e.g., rotation), Video 2 shows a feature (e.g., X-ray view). Extract frames from both and chain them in the scroll timeline.

---

## Quality Bar

The output should feel like an Apple product page, a premium automotive brand site, or a high-end tech startup launch page. If it doesn't feel premium, iterate. Key indicators of premium feel:

- Loading screen sets the mood before anything appears
- First scroll creates a "wow" moment as the product materializes
- Text appears with smooth choreography, not all at once
- The product is always the hero — text supports, never competes
- Every interaction feels intentional and polished
- The page has rhythm — moments of density and moments of space
