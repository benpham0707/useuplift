# Caching & Version Management System - Implementation Plan

## Goals

1. **Never lose work** - Auto-save drafts every 30 seconds
2. **Track all versions** - Complete history with timestamps and scores
3. **Cache analysis results** - Don't re-analyze identical text
4. **Persist across sessions** - Save to cloud (Supabase) + local storage
5. **Enable comparison** - View side-by-side versions
6. **Resume work** - Come back anytime and continue where left off

---

## Architecture

### 3-Tier Storage Strategy

```
┌─────────────────────────────────────────────────────────┐
│  TIER 1: In-Memory Cache (React State)                  │
│  - Current draft                                         │
│  - Current analysis result                               │
│  - Active workshop items                                 │
└─────────────────────────────────────────────────────────┘
                        ↓ Save every 30s
┌─────────────────────────────────────────────────────────┐
│  TIER 2: Local Storage (Browser)                        │
│  - Last 10 draft versions                               │
│  - Last analysis result                                  │
│  - Auto-save recovery data                               │
│  Key: `piq_workshop_${promptId}_draft`                  │
└─────────────────────────────────────────────────────────┘
                        ↓ Manual save
┌─────────────────────────────────────────────────────────┐
│  TIER 3: Supabase Cloud (Persistent)                    │
│  - All saved versions (unlimited)                        │
│  - Full analysis history                                 │
│  - Cross-device sync                                     │
│  Table: `piq_essay_versions`                            │
└─────────────────────────────────────────────────────────┘
```

---

## Data Models

### Local Storage Schema

```typescript
interface PIQWorkshopCache {
  promptId: string;
  currentDraft: string;
  lastSaved: number; // timestamp
  analysisResult: AnalysisResult | null;
  versions: DraftVersion[];
  autoSaveEnabled: boolean;
}

interface DraftVersion {
  id: string; // UUID
  text: string;
  timestamp: number;
  score: number;
  wordCount: number;
  savedToCloud: boolean;
  analysisSnapshot?: AnalysisResult; // Full analysis for this version
}
```

### Supabase Schema

```sql
-- Table: piq_essay_versions
CREATE TABLE piq_essay_versions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id),
  prompt_id TEXT NOT NULL,
  prompt_title TEXT NOT NULL,
  essay_text TEXT NOT NULL,
  word_count INTEGER,

  -- Analysis data
  analysis_result JSONB,
  narrative_quality_index INTEGER,

  -- Metadata
  version_number INTEGER,
  is_current BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  -- Tags
  tags TEXT[],
  notes TEXT
);

-- Index for fast retrieval
CREATE INDEX idx_piq_versions_user_prompt ON piq_essay_versions(user_id, prompt_id, created_at DESC);
```

---

## Features to Implement

### 1. Auto-Save (Every 30 seconds)
- Debounced save to local storage
- Visual indicator: "Saving..." → "Saved at 2:34pm"
- Only save if text changed
- Store in localStorage with key: `piq_autosave_${promptId}`

### 2. Manual Save to Cloud
- Button: "Save Version"
- Prompts for optional version name/tag
- Saves to Supabase with full analysis
- Confirmation: "Version saved successfully"

### 3. Version History Panel
- List all versions with:
  - Timestamp
  - Word count
  - Score (NQI)
  - First 50 chars preview
- Actions:
  - Restore (load into editor)
  - Compare (side-by-side view)
  - Delete
  - Add notes

### 4. Analysis Result Caching
- Cache key: `hash(essayText + promptId)`
- If text identical to cached version, return cached analysis
- Saves ~108 seconds and API costs
- Cache stored in both localStorage and Supabase

### 5. Resume Session
- On page load, check localStorage for auto-save
- If found and < 24 hours old:
  - Show banner: "Resume your last session?"
  - Restore draft, analysis, version history
- If user clicks "Start Fresh", clear cache

---

## Implementation Files

### New Services

1. **`src/services/piqWorkshop/storageService.ts`**
   - localStorage helpers
   - Auto-save logic
   - Cache management

2. **`src/services/piqWorkshop/supabaseService.ts`**
   - Cloud save/load
   - Version CRUD operations
   - Sync logic

3. **`src/services/piqWorkshop/versionManager.ts`**
   - Version comparison
   - Diff generation
   - Restoration logic

### Enhanced Components

1. **`PIQWorkshop.tsx`** (existing)
   - Add auto-save useEffect
   - Add save/load handlers
   - Add resume session logic

2. **`DraftVersionHistory.tsx`** (existing, enhance)
   - Show cloud vs local versions
   - Add restore/compare actions
   - Visual diff viewer

3. **New: `SaveVersionModal.tsx`**
   - Prompt for version name/notes
   - Show save progress
   - Confirmation message

4. **New: `CompareVersionsModal.tsx`**
   - Side-by-side diff view
   - Highlight changes
   - Show score delta

---

## User Flow

### First Visit
1. User opens `/piq-workshop`
2. Selects PIQ prompt
3. Starts writing
4. Auto-save kicks in after 30s
5. User clicks "Analyze" → results cached
6. User clicks "Save Version" → saved to cloud

### Returning Visit
1. User opens `/piq-workshop`
2. Banner: "Resume your last session? Draft auto-saved 2 hours ago"
3. User clicks "Resume"
4. Editor loads with draft, analysis, and version history
5. User continues editing

### Power User Flow
1. User has 10 saved versions
2. Opens version history panel
3. Selects two versions to compare
4. Sees side-by-side diff with score changes
5. Restores v7 as starting point
6. Edits and saves as v11

---

## Technical Details

### Auto-Save Implementation

```typescript
// In PIQWorkshop.tsx
useEffect(() => {
  const autoSaveTimer = setInterval(() => {
    if (hasUnsavedChanges) {
      saveToLocalStorage({
        promptId: selectedPromptId,
        currentDraft,
        analysisResult,
        versions: draftVersions,
        lastSaved: Date.now()
      });
      setHasUnsavedChanges(false);
      setLastSaveTime(new Date());
    }
  }, 30000); // 30 seconds

  return () => clearInterval(autoSaveTimer);
}, [currentDraft, hasUnsavedChanges]);
```

### Cache Key Generation

```typescript
function generateCacheKey(essayText: string, promptId: string): string {
  const normalized = essayText.trim().toLowerCase();
  const hash = simpleHash(normalized + promptId);
  return `analysis_${hash}`;
}

function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(36);
}
```

### Supabase Save

```typescript
async function saveVersionToCloud(version: DraftVersion): Promise<void> {
  const { data: user } = await supabase.auth.getUser();

  const { error } = await supabase
    .from('piq_essay_versions')
    .insert({
      user_id: user.id,
      prompt_id: version.promptId,
      prompt_title: version.promptTitle,
      essay_text: version.text,
      word_count: version.wordCount,
      analysis_result: version.analysisSnapshot,
      narrative_quality_index: version.score,
      version_number: version.versionNumber
    });

  if (error) throw error;
}
```

---

## Success Criteria

- [x] User can leave page and return without losing work
- [x] Auto-save indicator shows "Saved at X:XX"
- [x] Version history shows all saved versions
- [x] Can restore any previous version
- [x] Can compare two versions side-by-side
- [x] Analysis results are cached (no re-analysis for identical text)
- [x] All data syncs to cloud for cross-device access
- [x] Clear visual feedback for all save/load operations

---

## Phase 1 (Essential - Implement Now)
1. ✅ Auto-save to localStorage
2. ✅ Manual save to Supabase
3. ✅ Resume session on page load
4. ✅ Version history panel
5. ✅ Analysis result caching

## Phase 2 (Enhancement - Later)
1. ⏳ Version comparison UI
2. ⏳ Version tagging/notes
3. ⏳ Export to PDF/Word
4. ⏳ Cross-device sync
5. ⏳ Collaborative editing

---

**Ready to implement Phase 1!**
