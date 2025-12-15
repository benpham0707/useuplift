# Out of Credits Popup - Design Specification for Lovable
## Complete Implementation Guide

**Date**: December 11, 2025
**Purpose**: Convert free users to paying customers at the critical moment
**Target Conversion**: 50%+ when user runs out of credits

---

## 🎯 OVERVIEW

This popup appears when a user has **0 credits remaining** and tries to continue working. This is THE most important conversion moment - the user literally wants to continue but can't.

**Current State**: User has mock design with wrong pricing/structure
**Goal**: Replace with optimized conversion-focused design

---

## 📋 WHAT TO SHOW (Priority Order)

### 1. Header: Celebrate Progress
```
ICON: 🏆 Trophy (48px, gold color #F59E0B)
HEADLINE: "You're Making Great Progress!"
FONT: 32px, bold, center aligned
COLOR: #111827 (dark gray)
```

---

### 2. Personalized Progress Message
```
TEXT:
"You've used all 10 free credits, but your essay is improving!

✓ Fixed {issuesFixed} of {totalIssues} issues
✓ Spark score: {initialScore} → {currentScore} (+{improvement} points!)
🎯 Keep going to reach {targetScore}+ (competitive for {college})"

VARIABLES TO REPLACE:
- {issuesFixed}: e.g., 1
- {totalIssues}: e.g., 3
- {initialScore}: e.g., 52
- {currentScore}: e.g., 58
- {improvement}: e.g., 6 (calculated: currentScore - initialScore)
- {targetScore}: e.g., 70 (based on college tier)
- {college}: e.g., "Stanford" or "top schools"

FONT: 18px, regular
COLOR: #6B7280 (medium gray)
LINE HEIGHT: 1.6
ALIGN: Center
```

---

### 3. Credits Warning
```
TEXT: "⚠️ 0 credits remaining"
FONT: 16px, semibold
COLOR: #F59E0B (orange warning)
BACKGROUND: #FEF3C7 (light yellow)
PADDING: 8px 16px
BORDER RADIUS: 6px
ALIGN: Center
MARGIN: 16px 0
```

---

### 4. Section Header
```
TEXT: "Choose Your Plan to Continue:"
FONT: 20px, semibold
COLOR: #374151
ALIGN: Center
MARGIN: 24px 0 16px
```

---

### 5. Pricing Cards (Side-by-Side)

#### LAYOUT:
```
Desktop: 2 columns (50/50 split with gap)
Mobile: Stack vertically (Full Season on TOP)
Gap: 16px between cards
Container padding: 24px
Background: #F9FAFB (light gray surface)
Border radius: 12px
```

---

#### CARD A: STARTER
```
┌────────────────────────────────┐
│         STARTER                │
│                                │
│         $79.99                 │
│                                │
│      400 Credits               │
│      $0.20 per credit          │
│                                │
│      PERFECT FOR:              │
│      • 5-7 essays              │
│      • Early Decision          │
│      • Testing Uplift          │
│                                │
│      [Get Starter →]           │
└────────────────────────────────┘

DESIGN SPECS:
├─ Background: White (#FFFFFF)
├─ Border: 1px solid #E5E7EB
├─ Border radius: 8px
├─ Padding: 20px
├─ Text align: Center

HEADER "STARTER":
├─ Font: 14px, bold, uppercase
├─ Color: #6B7280
├─ Letter spacing: 0.05em

PRICE "$79.99":
├─ Font: 36px, bold
├─ Color: #111827
├─ Margin: 12px 0

"400 Credits":
├─ Font: 18px, semibold
├─ Color: #374151

"$0.20 per credit":
├─ Font: 14px, regular
├─ Color: #6B7280
├─ Margin bottom: 16px

"PERFECT FOR:" (section header):
├─ Font: 12px, bold, uppercase
├─ Color: #9CA3AF
├─ Margin: 16px 0 8px

BULLET POINTS:
├─ Font: 14px, regular
├─ Color: #4B5563
├─ Line height: 1.8
├─ Left aligned (within centered card)

BUTTON:
├─ Background: White
├─ Border: 2px solid #2563EB
├─ Color: #2563EB
├─ Font: 16px, semibold
├─ Padding: 12px 24px
├─ Border radius: 6px
├─ Width: 100%
├─ Margin top: 16px
├─ Hover: Background #EEF2FF, slight lift
```

---

#### CARD B: FULL SEASON (HIGHLIGHTED)
```
┌────────────────────────────────┐
│  FULL SEASON ⭐ BEST VALUE     │
│                                │
│         $199.99                │
│                                │
│      1,200 Credits             │
│      $0.17 per credit BEST!    │
│                                │
│      PERFECT FOR:              │
│      • 15+ essays              │
│      • Complete season         │
│      • All 8-12 schools        │
│                                │
│      [Get Full Season →]       │
└────────────────────────────────┘

DESIGN SPECS:
├─ Background: #EEF2FF (light blue tint) ⭐
├─ Border: 2px solid #2563EB (thicker, blue)
├─ Border radius: 8px
├─ Padding: 20px
├─ Box shadow: 0 4px 8px rgba(37,99,235,0.15)
├─ Transform: scale(1.02) on desktop (slightly larger)
├─ Text align: Center

BADGE (top right corner):
├─ Text: "⭐ BEST VALUE"
├─ Background: #2563EB
├─ Color: White
├─ Font: 10px, bold, uppercase
├─ Padding: 4px 12px
├─ Border radius: 12px
├─ Position: Absolute, top: 12px, right: 12px

HEADER "FULL SEASON ⭐ BEST VALUE":
├─ Font: 14px, bold, uppercase
├─ Color: #2563EB (blue, not gray)
├─ Letter spacing: 0.05em

PRICE "$199.99":
├─ Font: 36px, bold
├─ Color: #111827
├─ Margin: 12px 0

"1,200 Credits":
├─ Font: 18px, semibold
├─ Color: #374151

"$0.17 per credit BEST!":
├─ Font: 14px, semibold (not regular!)
├─ Color: #2563EB (blue to emphasize)
├─ Margin bottom: 16px

"PERFECT FOR:" (section header):
├─ Font: 12px, bold, uppercase
├─ Color: #6B7280
├─ Margin: 16px 0 8px

BULLET POINTS:
├─ Font: 14px, regular
├─ Color: #4B5563
├─ Line height: 1.8
├─ Left aligned (within centered card)

BUTTON (PRIMARY):
├─ Background: #2563EB (brand blue) ⭐
├─ Color: White
├─ Font: 16px, semibold
├─ Padding: 12px 24px
├─ Border radius: 6px
├─ Width: 100%
├─ Margin top: 16px
├─ Box shadow: 0 2px 4px rgba(37,99,235,0.2)
├─ Hover: Background #1D4ED8 (darker), lift with shadow
└─ Hover transform: translateY(-2px)
```

---

### 6. Social Proof Section
```
TEXT:
"💡 Most students choose Full Season
Compare: $199.99 vs $200-500 per tutor session"

CONTAINER:
├─ Background: Transparent
├─ Padding: 16px 0
├─ Margin: 16px 0
├─ Border top: 1px solid #E5E7EB
├─ Border bottom: 1px solid #E5E7EB

LINE 1 "💡 Most students...":
├─ Font: 14px, medium
├─ Color: #6B7280
├─ Align: Center

LINE 2 "Compare: $199.99...":
├─ Font: 14px, regular
├─ Color: #9CA3AF
├─ Align: Center
```

---

### 7. Trust Badge (Footer)
```
TEXT:
"🔒 30-Day Money-Back Guarantee
Not satisfied? Full refund, no questions asked.

✓ 2,500+ students accepted to top colleges
✓ 95% of parents say 'worth every penny'"

CONTAINER:
├─ Background: #F3F4F6 (light gray)
├─ Padding: 16px 24px
├─ Border radius: 8px
├─ Margin: 24px 0 16px

"🔒 30-Day Money-Back Guarantee":
├─ Font: 14px, bold
├─ Color: #374151
├─ Margin bottom: 4px

"Not satisfied? Full refund...":
├─ Font: 13px, regular
├─ Color: #6B7280
├─ Margin bottom: 12px

CHECKMARKS:
├─ Font: 13px, regular
├─ Color: #6B7280
├─ Line height: 1.8
├─ Each on separate line
```

---

### 8. Secondary Action
```
TEXT: "Maybe later"
TYPE: Link (not button)
FONT: 14px, medium
COLOR: #9CA3AF (light gray)
HOVER: Underline, color #6B7280
ALIGN: Center
MARGIN: 16px 0 0
CURSOR: Pointer

ACTION: Closes modal, shows sticky bottom bar instead
```

---

## 🎨 MODAL CONTAINER SPECS

```
DESKTOP:
├─ Width: 700px
├─ Height: Auto (content-based)
├─ Max height: 90vh (scrollable if needed)
├─ Position: Fixed, centered (50% top, 50% left, transform translate)
├─ Background: White
├─ Border radius: 16px
├─ Box shadow: 0 20px 25px -5px rgba(0,0,0,0.1),
│              0 10px 10px -5px rgba(0,0,0,0.04)
├─ Padding: 32px
├─ Z-index: 1000

MOBILE:
├─ Width: 95vw
├─ Padding: 20px
├─ Border radius: 12px
├─ Max height: 95vh (scrollable)

BACKDROP:
├─ Background: rgba(0,0,0,0.7)
├─ Backdrop filter: blur(5px)
├─ Position: Fixed, covers full screen
├─ Z-index: 999
├─ Click outside: DOES NOT close (force choice)

CLOSE BUTTON (X):
├─ Position: Absolute, top: 16px, right: 16px
├─ Size: 32px × 32px
├─ Color: #9CA3AF
├─ Hover: #6B7280
├─ Icon: X (close icon)
├─ Click: Closes modal (same as "Maybe later")
```

---

## 📱 MOBILE RESPONSIVE CHANGES

```
BREAKPOINT: < 640px (mobile)

CHANGES:
1. Cards stack vertically (not side-by-side)
   ├─ Full Season card on TOP (prioritize)
   ├─ Starter card below
   └─ Both full width

2. Modal padding reduced (32px → 20px)

3. Font sizes slightly smaller:
   ├─ Headline: 32px → 28px
   ├─ Price: 36px → 32px
   └─ Body text: 18px → 16px

4. Buttons full width (already specified)

5. Remove scale effect on Full Season card
   (Scale 1.02 looks weird on mobile)

6. Reduce gap between cards (16px → 12px)

7. Progress message line height: 1.6 → 1.7
   (better readability on small screens)
```

---

## 🎬 ANIMATION SPECS

```
MODAL APPEAR:
├─ Backdrop: Fade in (opacity 0 → 1, 200ms)
├─ Modal: Scale + fade in
│   └─ From: opacity 0, scale 0.95
│   └─ To: opacity 1, scale 1.0
│   └─ Duration: 300ms
│   └─ Easing: ease-out

BUTTON HOVER:
├─ Duration: 150ms
├─ Easing: ease-in-out
├─ Effects:
│   ├─ Starter: Background color change
│   └─ Full Season: Background darken + lift (translateY -2px)

MODAL CLOSE:
├─ Reverse of appear
├─ Duration: 200ms
└─ Easing: ease-in
```

---

## 🔄 USER FLOW

### When User Clicks "Get Starter"
```
1. Close modal with fade-out animation
2. Navigate to /checkout?tier=starter
3. Pre-fill checkout with Starter tier
4. Show order summary: $79.99, 400 credits
```

### When User Clicks "Get Full Season"
```
1. Close modal with fade-out animation
2. Navigate to /checkout?tier=fullseason
3. Pre-fill checkout with Full Season tier
4. Show order summary: $199.99, 1200 credits
```

### When User Clicks "Maybe Later" or X
```
1. Close modal with fade-out animation
2. Return to workshop page
3. Show sticky bottom bar:
   ┌────────────────────────────────────────────┐
   │ ⚠️ You're out of credits.                  │
   │ [Upgrade to continue →]                    │
   └────────────────────────────────────────────┘

   BAR SPECS:
   ├─ Background: #FEF3C7 (light yellow)
   ├─ Border top: 2px solid #F59E0B
   ├─ Padding: 12px 20px
   ├─ Position: Sticky bottom
   ├─ Z-index: 50
   ├─ Button: Same style as Full Season button
   └─ Click: Reopens modal
```

---

## 📊 WHAT TO REMOVE FROM CURRENT DESIGN

### ❌ REMOVE THESE ELEMENTS:

1. **"Pro Plan 100/mo"** subscription option
   - We don't do subscriptions
   - Confuses the offering

2. **"Quick Top-Up 50 credits"** for $5
   - Don't tempt small purchases
   - Lowers ARPU
   - Doesn't align with strategy

3. **"Premium Privileges" feature list**
   - Generic, not compelling
   - Replace with value comparison to tutors

4. **"Get Pro Access" button**
   - Too generic
   - Use tier-specific CTAs

5. **"Analysis: 5 credits • Chat: 1 credit" at bottom**
   - Not relevant at this moment
   - User already knows the costs

6. **"SAVE 50%" badge on Pro Plan**
   - No subscription tiers

---

## ✅ IMPLEMENTATION CHECKLIST

```
CONTENT:
☐ Replace headline with "You're Making Great Progress!"
☐ Add personalized progress message (dynamic data)
☐ Show "0 credits remaining" warning
☐ Remove subscription/Pro Plan option
☐ Remove Quick Top-Up option
☐ Add Starter tier ($79.99, 400 credits)
☐ Add Full Season tier ($199.99, 1200 credits)
☐ Highlight Full Season (blue background, badge, larger)
☐ Add social proof ("Most students choose...")
☐ Add comparison to tutors
☐ Add 30-day guarantee
☐ Add acceptance stats (2,500+ students)
☐ Add parent testimonial stat (95%)

DESIGN:
☐ Trophy icon at top (gold color)
☐ Center-aligned layout
☐ Side-by-side cards (desktop)
☐ Stacked cards with Full Season on top (mobile)
☐ Blue highlight on Full Season card
☐ "BEST VALUE" badge on Full Season
☐ Primary button style on Full Season
☐ Secondary button style on Starter
☐ Trust badge footer section
☐ "Maybe later" link at bottom
☐ Close X button (top right)

FUNCTIONALITY:
☐ Modal appears when credits = 0
☐ Close button works (closes modal)
☐ "Maybe later" works (closes modal)
☐ Click outside does NOT close (force choice)
☐ "Get Starter" navigates to checkout (tier=starter)
☐ "Get Full Season" navigates to checkout (tier=fullseason)
☐ After closing, show sticky bottom bar
☐ Sticky bar "Upgrade" button reopens modal
☐ Mobile responsive (cards stack)
☐ Animations smooth (fade in/out, scale)

DATA PERSONALIZATION:
☐ Pull issuesFixed from user data
☐ Pull totalIssues from user data
☐ Pull initialScore from first analysis
☐ Pull currentScore from latest analysis
☐ Calculate improvement (currentScore - initialScore)
☐ Determine targetScore based on college tier
☐ Pull college name from user profile

ANALYTICS:
☐ Track modal impressions
☐ Track button clicks (Starter vs Full Season)
☐ Track "Maybe later" clicks
☐ Track time spent on modal
☐ Track conversion rate (modal → purchase)
☐ Track tier mix (% choosing each)
```

---

## 🎯 SUCCESS CRITERIA

```
METRICS TO HIT:
├─ Conversion rate: 50%+ (users who see modal → purchase)
├─ Tier mix: 60% Full Season, 40% Starter
├─ Time to decision: 30-60 seconds average
├─ Abandonment: <30% click "Maybe later"
└─ Return rate: 30% who close modal return to upgrade

IF NOT HITTING TARGETS:
├─ A/B test headline variations
├─ A/B test price display
├─ A/B test social proof messaging
├─ Increase Full Season visual prominence
└─ Add urgency element (deadline countdown if applicable)
```

---

## 🚀 FINAL NOTES FOR LOVABLE

**This is THE most important conversion moment in the entire product.**

The user has:
- ✅ Signed up (invested)
- ✅ Uploaded essay (effort)
- ✅ Seen analysis (saw issues)
- ✅ Started fixing (made progress)
- ❌ Run out of credits (frustrated)

They WANT to continue but CAN'T. This is maximum purchase intent.

**Design priorities:**
1. Celebrate their progress (positive framing)
2. Show it's working (score improved)
3. Create urgency (issues left to fix)
4. Make choice easy (2 clear options)
5. Build trust (guarantee, social proof)
6. Guide to best option (highlight Full Season)

**Get this right and you'll convert 50%+ of free users to paying customers.**

The entire business model depends on this modal. Make it perfect. 🎯
