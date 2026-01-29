# Debugging Workshop Items Not Showing

## Issue Description
Workshop items/issues are not being properly identified and listed in the UI after analysis completes.

## What to Check

### 1. Browser Console Logs
After clicking "Analyze" and waiting for completion, check the console for:

```
📦 Workshop Items: X
🔍 Workshop item categories: [...]
   - opening_hook: 6/10, X issues found
   - character_development: 2/10, X issues found
   ...
```

**Key Question**: Do the workshop item categories match the dimension names?

### 2. Expected Behavior

From the backend test (test-piq-integration.ts), we saw:
- **4 workshop items** returned
- Categories: `"structural_clarity"`, `"prompt_responsiveness"`, `"stakes_tension"`, `"insight_depth"`

But the rubric dimensions have names like:
- `"opening_hook"`, `"character_development"`, `"stakes_tension"`, etc.

### 3. Potential Problem

The workshop items have `rubric_category` field that might not match the `dimension_name` field from rubricDimensionDetails.

**Example mismatch**:
```typescript
// Workshop item:
{
  rubric_category: "structural_clarity"  // ❌ Doesn't match any dimension
}

// Rubric dimension:
{
  dimension_name: "opening_hook"  // ✅ This exists
}
```

If they don't match, the filter on line 334 will return 0 issues:
```typescript
const issuesForDimension = (result.workshopItems || [])
  .filter(item => item.rubric_category === dim.dimension_name);
```

## Solution if Categories Don't Match

We need to either:

1. **Map the categories** - Create a mapping between backend categories and frontend dimension names
2. **Show all workshop items separately** - Display workshop items in a separate section, not grouped by dimension
3. **Fix the backend** - Ensure rubric_category matches dimension_name

## Test Data to Share

Please share from browser console:
1. The full list of workshop item categories
2. The full list of dimension names
3. How many issues were found for each dimension

This will tell us exactly what the mismatch is.
