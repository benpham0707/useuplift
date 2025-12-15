# 🎯 MASTER PROMPT: Common App Workshop Frontend

**For**: Lovable AI
**Task**: Build college-specific essay workshop UI
**Backend**: 100% Complete - Just import and use!
**Your Job**: Build beautiful, responsive UI components

---

## 📚 Quick Reference

**Full Guide**: See `LOVABLE_FRONTEND_ONLY_GUIDE.md` for complete specs

**Backend Files** (Import these - don't modify):
- `src/data/commonAppColleges.ts` - 3 colleges with research
- `src/data/commonAppSupplementalTypes.ts` - 14 essay types
- `src/services/commonAppWorkshop/commonAppAnalysisService.ts` - Analysis API

**Clone Base**: Start from `src/pages/PIQWorkshop.tsx`

---

## 🎯 What You're Building

A college essay workshop where students:
1. Select college (Stanford/Harvard/MIT)
2. Select supplemental essay
3. Write essay & get **college-specific** feedback
4. See core values, preferences, type guidance

**Key**: Everything is tailored to each college's unique values and priorities.

---

## 📦 6 Components to Build

### 1. `CommonAppCollegeNav.tsx` - College/Essay Navigation
```typescript
import { COMMON_APP_COLLEGES, getCollege } from '@/data/commonAppColleges';

// Shows: [< Prev] | Stanford: Why Stanford? [▼] | [Next >]
// Dots for colleges (3 total)
// Dropdown shows supplementals with status badges
```

### 2. `CoreValuesCard.tsx` - Weighted Values Display
```typescript
import { getCollegeCoreValues } from '@/data/commonAppColleges';

// Shows: 4 values with weights (40%, 25%, 20%, 15%)
// Progress bars with scores
// Color coded: Green (85+), Yellow (70-84), Red (<70)
// Expandable for details
```

### 3. `CollegePreferencesGuide.tsx` - What College Loves/Hates
```typescript
import { getCollege } from '@/data/commonAppColleges';
const prefs = college.preferences;

// Shows:
// ✅ What Stanford loves (essay_priorities)
// ❌ What to avoid (red_flags)
// 🎯 Tone preferences
```

### 4. `EssayTypeGuide.tsx` - Type-Specific Guidance
```typescript
import { getSupplemental } from '@/data/commonAppColleges';
import { getSupplementalTypeInfo } from '@/data/commonAppSupplementalTypes';

// Shows:
// 📖 Required elements
// ⚠️  Common pitfalls
// 🌟 Elite patterns (90+ essays)
```

### 5. `CrossCollegeComparison.tsx` - Compare Colleges (Modal)
```typescript
import { COMMON_APP_COLLEGES } from '@/data/commonAppColleges';

// Shows side-by-side:
// Stanford vs Harvard vs MIT
// Different priorities, weights, word limits
// Helps students understand uniqueness
```

### 6. `CommonAppWorkshop.tsx` - Main Workshop Page
```typescript
// Clone from: src/pages/PIQWorkshop.tsx
// Add college-specific components
// Update navigation, analysis calls
```

---

## 🎨 Visual Design

**Colors**:
- Green (#10B981): Excellent (85-100)
- Yellow (#F59E0B): Good (70-84)
- Red (#EF4444): Needs work (<70)
- Purple (#8B5CF6): Brand primary

**Components**: Use shadcn/ui (Card, Button, Badge, etc.)

**Spacing**: `gap-6` between sections, `p-6` card padding

**Responsive**: Mobile (<640px), Tablet (640-1024px), Desktop (>1024px)

---

## 📋 Data Examples

### Get College:
```typescript
import { getCollege } from '@/data/commonAppColleges';

const stanford = getCollege('stanford');
// Returns:
{
  id: 'stanford',
  name: 'Stanford University',
  coreValues: [
    { name: 'Intellectual Vitality', weight: 40, ... },
    { name: 'Impact & Leadership', weight: 25, ... },
    // 2 more...
  ],
  supplementals: [
    { id: 'stanford_why_stanford', title: 'Why Stanford?', wordLimit: 250, ... },
    // 2 more...
  ],
  preferences: {
    essay_priorities: ['Intellectual vitality', ...],
    red_flags: ['Classroom-bounded learning', ...],
    preferred_tone: ['Authentic', 'Curious', ...],
    avoid_tone: ['Trying to impress', ...]
  }
}
```

### Get Analysis Results:
```typescript
import { analyzeCommonAppEssay, MOCK_ANALYSIS_RESULT } from '@/services/commonAppWorkshop/commonAppAnalysisService';

// For development, use mock:
const result = MOCK_ANALYSIS_RESULT;

// Returns:
{
  analysis: { narrative_quality_index: 75, ... },
  collegeSpecific: {
    core_values_alignment: [
      {
        value_name: 'Intellectual Vitality',
        weight: 40,
        current_score: 72,
        gap: -13,
        how_to_improve: [...],
        evidence_present: [...],
        evidence_missing: [...]
      },
      // 3 more values...
    ],
    preference_violations: [...],
    elite_patterns_missing: [...]
  }
}
```

---

## 🚀 Build Order (4 Days)

### Day 1: Foundation
1. Clone `PIQWorkshop.tsx` → `CommonAppWorkshop.tsx`
2. Create `CommonAppCollegeNav.tsx`
3. Add routing: `/common-app-workshop/:collegeId/:supplementalId`
4. Test navigation

### Day 2: College Features
1. Create `CoreValuesCard.tsx`
2. Create `CollegePreferencesGuide.tsx`
3. Create `EssayTypeGuide.tsx`
4. Test data displays

### Day 3: Comparison & Integration
1. Create `CrossCollegeComparison.tsx`
2. Integrate all into main page
3. Add loading/error states
4. Mobile responsive

### Day 4: Polish & Test
1. Test all colleges/supplementals
2. Mobile testing
3. Performance optimization
4. Final polish

---

## ✅ Success Criteria

**Must Have**:
- ✅ Navigate colleges & supplementals
- ✅ Core values show with scores
- ✅ Preferences display correctly
- ✅ Type guidance accurate
- ✅ Mobile responsive
- ✅ Matches design system

**Nice to Have**:
- ✅ Comparison modal
- ✅ Smooth animations
- ✅ Loading skeletons
- ✅ Keyboard shortcuts

---

## 📖 Full Documentation

**Detailed Guide**: `LOVABLE_FRONTEND_ONLY_GUIDE.md`
- Complete component specs
- All data structures
- Visual layouts
- Test scenarios
- Mobile designs

**Backend Reference**: `COMMON_APP_BACKEND_CONFIG_COMPLETE.md`
- How data is structured
- API contracts
- Database schema

---

## 🎯 Start Here

1. Read `LOVABLE_FRONTEND_ONLY_GUIDE.md` (10 min)
2. Examine `src/data/commonAppColleges.ts` (see data structure)
3. Look at `src/pages/PIQWorkshop.tsx` (your base to clone)
4. Start with Day 1 tasks
5. Build incrementally, test each component

**You have everything you need - just build the UI!** 🎨

All backend logic is done. Focus on making it beautiful, responsive, and user-friendly.
