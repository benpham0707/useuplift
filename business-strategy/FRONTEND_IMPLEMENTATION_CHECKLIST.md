# Frontend Implementation Checklist

## Overview
This document outlines the specific changes needed to implement the new pricing strategy ($79.99/400 credits, $199.99/1200 credits) with parent-focused conversion messaging throughout the frontend.

---

## 1. PRICING PAGES - Update Pricing Structure

### Files to Update:
- `src/components/Pricing.tsx` (Landing page pricing section)
- `src/pages/Pricing.tsx` (Dedicated pricing page)

### Current State:
```
FREE: 10 credits
Pro Plan: $10/month (100 credits/month subscription)
Pay As You Go: $5-50 (50-500 credits slider)
```

### New State:
```
FREE: 10 credits
Starter: $79.99 (400 credits, one-time)
Full Season ⭐: $199.99 (1200 credits, one-time)
```

### Key Changes:
1. **Remove subscription model** (monthly/yearly toggle)
2. **Remove pay-as-you-go slider** (fixed tiers only)
3. **Update pricing display**:
   - Middle card: "$79.99" (was "$10/mo")
   - Right card: "$199.99" with "Most Popular" badge (was Pay As You Go)
4. **Update credit amounts**:
   - Starter: 400 credits (was 100/month)
   - Full Season: 1200 credits (was 50-500 slider)

### Code Pattern for New Cards:

```tsx
{/* Starter Tier */}
<Card className="...">
  <CardHeader>
    <CardTitle>Starter</CardTitle>
    <CardDescription>Perfect for 5-7 essays</CardDescription>
  </CardHeader>
  <CardContent>
    <div className="flex items-baseline gap-2">
      <span className="text-5xl font-bold">$79.99</span>
      <span className="text-muted-foreground">one-time</span>
    </div>
    <p className="text-sm text-muted-foreground">
      400 credits for working on your first few Common App essays
    </p>
    <ul className="space-y-3 text-sm">
      <li className="flex items-start gap-2">
        <Check className="h-4 w-4 text-primary" />
        <span className="font-medium">400 Credits</span>
      </li>
      <li className="flex items-start gap-2">
        <Check className="h-4 w-4 text-primary" />
        <span>~5-7 complete essay workshops</span>
      </li>
      <li className="flex items-start gap-2">
        <Check className="h-4 w-4 text-primary" />
        <span>Teaching-based AI (not writing for you)</span>
      </li>
      <li className="flex items-start gap-2">
        <Check className="h-4 w-4 text-primary" />
        <span>Anti-AI convergence protection</span>
      </li>
    </ul>
  </CardContent>
  <CardFooter>
    <Button
      className="w-full"
      size="lg"
      onClick={() => handleCheckout('starter_400')}
    >
      Get Started - $79.99
    </Button>
  </CardFooter>
</Card>

{/* Full Season Tier - MOST POPULAR */}
<Card className="border-2 border-primary shadow-xl transform md:-translate-y-4">
  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
    <Badge className="bg-primary">Most Popular</Badge>
  </div>
  <CardHeader>
    <CardTitle className="flex items-center gap-2">
      Full Season ⭐
      <Sparkles className="h-5 w-5" />
    </CardTitle>
    <CardDescription>Complete Common App support</CardDescription>
  </CardHeader>
  <CardContent>
    <div className="flex items-baseline gap-2">
      <span className="text-5xl font-bold text-red-500">$199.99</span>
      <span className="text-muted-foreground">one-time</span>
    </div>
    <p className="text-sm text-green-600 font-medium">
      vs. $3,000-12,000 for private college counseling
    </p>
    <p className="text-sm text-muted-foreground mt-2">
      Everything you need for all Common App essays (main + supplementals)
    </p>
    <ul className="space-y-3 text-sm">
      <li className="flex items-start gap-2">
        <Check className="h-4 w-4 text-primary" />
        <span className="font-medium">1200 Credits</span>
      </li>
      <li className="flex items-start gap-2">
        <Check className="h-4 w-4 text-primary" />
        <span>Complete all essays (main + 10-15 supplementals)</span>
      </li>
      <li className="flex items-start gap-2">
        <Check className="h-4 w-4 text-primary" />
        <span>500+ credible sources (1000+ hours research)</span>
      </li>
      <li className="flex items-start gap-2">
        <Check className="h-4 w-4 text-primary" />
        <span>Teaching methodology (Socratic coaching)</span>
      </li>
      <li className="flex items-start gap-2">
        <Check className="h-4 w-4 text-primary" />
        <span>Voice preservation system</span>
      </li>
    </ul>
  </CardContent>
  <CardFooter>
    <Button
      className="w-full"
      size="lg"
      onClick={() => handleCheckout('full_season_1200')}
    >
      Get Full Season - $199.99
    </Button>
  </CardFooter>
</Card>
```

---

## 2. CREATE OUT-OF-CREDITS MODAL

### New File to Create:
`src/components/OutOfCreditsModal.tsx`

### Purpose:
**THE MOST CRITICAL CONVERSION MOMENT** - When user runs out of free credits (or any credits), show strategic conversion popup.

### Implementation Guide:
Reference these documents for complete specifications:
- `business-strategy/LOVABLE_CONVERSION_CONTENT_STRATEGY.md` (WHAT to show)
- `business-strategy/LOVABLE_SCANNABLE_CONVERSION_LAYOUT.md` (HOW to present it)

### Key Features:
1. **Expandable Accordions** for each section (collapsed by default)
2. **At-a-glance headlines** for 10-second scan
3. **Progress messaging** showing improvements made with free credits
4. **Pricing cards** (always visible, not collapsed)
5. **Trust elements**: 30-day guarantee, 2,500+ students accepted

### When to Show:
- User tries to run analysis but has < 6 credits
- User tries to send chat message but has < 1 credit
- User clicks "Get More Credits" button in Navigation

### Component Structure:
```tsx
interface OutOfCreditsModalProps {
  isOpen: boolean;
  onClose: () => void;
  creditsRemaining: number;
  creditsUsed: number;
  // Optional: pass context about what they achieved
  improvementsShown?: string[];
}

export default function OutOfCreditsModal({
  isOpen,
  onClose,
  creditsRemaining,
  creditsUsed,
  improvementsShown
}: OutOfCreditsModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="text-center space-y-2 pb-4 border-b">
          <h2 className="text-2xl font-bold">
            🏆 You're Making Great Progress!
          </h2>
          <p className="text-muted-foreground">
            {creditsUsed} credits used • {creditsRemaining} remaining
          </p>
        </div>

        {/* Expandable Sections */}
        <Accordion type="single" collapsible className="space-y-3">
          {/* Value Comparison Section */}
          <AccordionItem value="value">
            <AccordionTrigger className="hover:no-underline">
              <div className="flex items-center gap-2 text-left">
                <span className="text-2xl">💰</span>
                <div>
                  <div className="font-semibold">$199.99 vs $3,000+ Tutoring</div>
                  <div className="text-sm text-muted-foreground">
                    Same quality, 94% less cost
                  </div>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              {/* Detailed comparison table */}
            </AccordionContent>
          </AccordionItem>

          {/* Why Different Section */}
          <AccordionItem value="different">
            <AccordionTrigger className="hover:no-underline">
              <div className="flex items-center gap-2 text-left">
                <span className="text-2xl">🎓</span>
                <div>
                  <div className="font-semibold">Research-Backed Teaching (Not AI)</div>
                  <div className="text-sm text-muted-foreground">
                    We teach, we don't write for you
                  </div>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              {/* Anti-AI messaging, teaching methodology */}
            </AccordionContent>
          </AccordionItem>

          {/* Social Proof Section */}
          <AccordionItem value="proof">
            <AccordionTrigger className="hover:no-underline">
              <div className="flex items-center gap-2 text-left">
                <span className="text-2xl">⭐</span>
                <div>
                  <div className="font-semibold">2,500+ Students Accepted to Top Schools</div>
                  <div className="text-sm text-muted-foreground">
                    Based on proven methodology
                  </div>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              {/* Success stories, research depth */}
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        {/* Pricing Cards - ALWAYS VISIBLE */}
        <div className="space-y-4 pt-6 border-t">
          <h3 className="text-lg font-semibold text-center">Choose Your Plan</h3>
          <div className="grid md:grid-cols-2 gap-4">
            {/* Starter Card */}
            <Card className="border-2">
              <CardHeader>
                <CardTitle>Starter</CardTitle>
                <div className="text-3xl font-bold">$79.99</div>
                <p className="text-sm text-muted-foreground">400 credits</p>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li className="flex gap-2">
                    <Check className="h-4 w-4 text-primary" />
                    5-7 complete essays
                  </li>
                </ul>
              </CardContent>
              <CardFooter>
                <Button className="w-full">Get Starter</Button>
              </CardFooter>
            </Card>

            {/* Full Season Card - EMPHASIZED */}
            <Card className="border-2 border-primary bg-primary/5">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <Badge>RECOMMENDED</Badge>
              </div>
              <CardHeader>
                <CardTitle>Full Season ⭐</CardTitle>
                <div className="text-3xl font-bold text-primary">$199.99</div>
                <p className="text-sm text-green-600">Save $160 vs Starter</p>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li className="flex gap-2">
                    <Check className="h-4 w-4 text-primary" />
                    All Common App essays
                  </li>
                  <li className="flex gap-2">
                    <Check className="h-4 w-4 text-primary" />
                    10-15 supplementals
                  </li>
                </ul>
              </CardContent>
              <CardFooter>
                <Button className="w-full" size="lg">Get Full Season</Button>
              </CardFooter>
            </Card>
          </div>
        </div>

        {/* Footer: Guarantee + Maybe Later */}
        <div className="space-y-3 pt-4 border-t">
          <Accordion type="single" collapsible>
            <AccordionItem value="guarantee">
              <AccordionTrigger>
                🔒 30-Day Money-Back Guarantee
              </AccordionTrigger>
              <AccordionContent>
                {/* Guarantee details */}
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          <Button variant="ghost" className="w-full" onClick={onClose}>
            Maybe later
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

---

## 3. NAVIGATION - Update Credit Display

### File to Update:
`src/components/Navigation.tsx`

### Changes:
1. **Show credit count** prominently in header
2. **Add "Get More Credits" button** that opens OutOfCreditsModal
3. **Remove any subscription status** display (no more monthly plan)

### Example Pattern:
```tsx
{user && (
  <div className="flex items-center gap-3">
    {/* Credit Display */}
    <div className="flex items-center gap-2 px-3 py-1.5 bg-secondary rounded-full">
      <Zap className="h-4 w-4 text-primary" />
      <span className="font-medium">{credits ?? 0}</span>
      <span className="text-xs text-muted-foreground">credits</span>
    </div>

    {/* Get More Credits Button */}
    <Button
      size="sm"
      variant="outline"
      onClick={() => setShowOutOfCreditsModal(true)}
    >
      Get More
    </Button>
  </div>
)}
```

---

## 4. WORKSHOP COMPONENTS - Check Credits Before Action

### Files to Update:
- Any component that triggers analysis (costs 6 credits)
- Any component that sends chat messages (costs 1 credit)

### Pattern:
```tsx
const handleAnalysis = async () => {
  // Check if user has enough credits
  if (credits < 6) {
    setShowOutOfCreditsModal(true);
    return;
  }

  // Proceed with analysis
  // ...
};

const handleChatMessage = async () => {
  // Check if user has enough credits
  if (credits < 1) {
    setShowOutOfCreditsModal(true);
    return;
  }

  // Proceed with chat
  // ...
};
```

---

## 5. BACKEND INTEGRATION - Update Checkout Handler

### File to Update:
`src/pages/Pricing.tsx` (handleCheckout function)

### Current Checkout Types:
```typescript
'pro_monthly' | 'pro_yearly' | 'addon_{amount}'
```

### New Checkout Types:
```typescript
'starter_400' | 'full_season_1200'
```

### Updated Handler:
```typescript
const handleCheckout = async (type: 'starter_400' | 'full_season_1200') => {
  if (!user) {
    navigate('/auth');
    return;
  }

  try {
    setProcessingType(type);
    const token = await getToken();

    const response = await apiFetch('/api/v1/billing/checkout', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type, // 'starter_400' or 'full_season_1200'
        successUrl: `${window.location.origin}/pricing?success=true`,
        cancelUrl: `${window.location.origin}/pricing?canceled=true`,
      }),
    });

    if (!response.ok) throw new Error('Checkout failed');

    const { url } = await response.json();
    if (url) window.location.href = url;
  } catch (error) {
    console.error('Checkout error:', error);
  } finally {
    setProcessingType(null);
  }
};
```

**Note**: Backend API at `/api/v1/billing/checkout` needs to handle these new product types. This is outside frontend scope but coordinate with backend team.

---

## 6. MESSAGING UPDATES - Parent-Focused Copy

### Throughout All Components:

#### OLD MESSAGING (Remove):
- "Portfolio scans"
- "Deep essay reviews"
- "PIQ analyses"
- "UC Personal Insight Questions"
- Generic student-focused language

#### NEW MESSAGING (Use):
- "Common App essays" (main + supplementals)
- "Teaching methodology" / "We teach, not write"
- "Anti-AI convergence"
- "Research-backed" / "500+ credible sources"
- "Voice preservation"
- "$3,000-12,000 tutoring" comparison
- Parent-focused value language

### Example Replacements:

**OLD**:
```tsx
<p>Get 10 free credits for 2 full PIQ analyses</p>
```

**NEW**:
```tsx
<p>Get 10 free credits to try our teaching-based workshop</p>
```

**OLD**:
```tsx
<p>Perfect for all 8 UC PIQs</p>
```

**NEW**:
```tsx
<p>Perfect for all Common App essays (main + supplementals)</p>
```

---

## 7. TRUST ELEMENTS - Add Throughout

### Locations to Add:
- Landing page hero section
- Pricing page above cards
- OutOfCreditsModal
- Footer

### Trust Elements to Include:

```tsx
{/* Research Credibility */}
<div className="flex items-center gap-2 text-sm text-muted-foreground">
  <BookOpen className="h-4 w-4" />
  <span>Built on 500+ credible sources, 1000+ hours of research</span>
</div>

{/* Success Metric */}
<div className="flex items-center gap-2 text-sm text-muted-foreground">
  <GraduationCap className="h-4 w-4" />
  <span>Helped 2,500+ students get accepted to top universities</span>
</div>

{/* Money-Back Guarantee */}
<div className="flex items-center gap-2 text-sm text-green-600">
  <Shield className="h-4 w-4" />
  <span>30-Day Money-Back Guarantee</span>
</div>

{/* Anti-AI Badge */}
<Badge variant="outline" className="gap-1">
  <Check className="h-3 w-3" />
  Anti-AI Convergence Protection
</Badge>
```

---

## 8. ANALYTICS TRACKING

### Events to Track:
```typescript
// When OutOfCreditsModal is shown
trackEvent('out_of_credits_modal_shown', {
  credits_remaining: creditsRemaining,
  credits_used: creditsUsed,
});

// When user clicks pricing card
trackEvent('pricing_card_clicked', {
  plan: 'starter_400' | 'full_season_1200',
  location: 'modal' | 'pricing_page',
});

// When user expands accordion section
trackEvent('conversion_section_expanded', {
  section: 'value' | 'different' | 'proof' | 'guarantee',
});

// When checkout initiated
trackEvent('checkout_initiated', {
  plan: 'starter_400' | 'full_season_1200',
  price: 79.99 | 199.99,
});
```

---

## Implementation Priority

### Phase 1 (Critical - Do First):
1. ✅ Update pricing on `src/pages/Pricing.tsx` and `src/components/Pricing.tsx`
2. ✅ Create `src/components/OutOfCreditsModal.tsx` with expandable accordions
3. ✅ Update `src/components/Navigation.tsx` credit display
4. ✅ Add credit checks before workshop actions

### Phase 2 (Important - Do Next):
5. ✅ Update all messaging (replace PIQ → Common App, add parent-focused copy)
6. ✅ Add trust elements throughout landing page
7. ✅ Update backend checkout handler for new product types

### Phase 3 (Polish - Do Last):
8. ✅ Add analytics tracking
9. ✅ A/B test different conversion copy
10. ✅ Monitor conversion rates and iterate

---

## Success Metrics

### Target Conversion Rates:
- **Free → Paid**: 30% (baseline goal)
- **Out of Credits Modal → Purchase**: 50%+ (critical conversion point)
- **Starter vs Full Season**: 60% choose Full Season (higher LTV)

### Monitor:
- Time to first purchase after signup
- Modal show → purchase rate
- Tier selection distribution
- Credits usage patterns

---

## Files Summary

### Files to CREATE:
- `src/components/OutOfCreditsModal.tsx`

### Files to UPDATE:
- `src/components/Pricing.tsx`
- `src/pages/Pricing.tsx`
- `src/components/Navigation.tsx`
- Any workshop/analysis components (credit checks)

### Files to REFERENCE:
- `business-strategy/LOVABLE_CONVERSION_CONTENT_STRATEGY.md`
- `business-strategy/LOVABLE_SCANNABLE_CONVERSION_LAYOUT.md`
- `business-strategy/MASTER_PRICING_STRATEGY.md`

---

## Questions for Backend Team

1. **Stripe Product IDs**: What are the product IDs for `starter_400` and `full_season_1200`?
2. **Credit Provisioning**: How are credits added to user profile after successful purchase?
3. **Webhook Handling**: Is the webhook set up to handle one-time purchases (not just subscriptions)?
4. **Referral System**: Is the $20 referral discount + 50 credit reward implemented?
5. **Free Credits**: Confirmed 10 free credits on signup (not 15)?
6. **Credit Costs**: Confirmed 6 credits per analysis, 1 credit per chat message?

---

## Next Steps

1. **Review this checklist** with the team
2. **Create OutOfCreditsModal component** first (highest impact)
3. **Update pricing pages** second
4. **Test end-to-end flow**: Signup → Use free credits → See modal → Purchase → Continue
5. **Monitor conversion rates** and iterate on messaging
