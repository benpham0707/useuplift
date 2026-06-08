# PIQ Workshop Database Deployment Guide

## 🎯 Quick Start

**Time Required:** 5-10 minutes
**Prerequisites:** Access to Supabase Dashboard

---

## Step 1: Open Supabase SQL Editor

1. Go to: https://supabase.com/dashboard/project/zclaplpkuvxkrdwsgrul/sql/new
2. Make sure you're logged in to your Supabase account
3. You should see an empty SQL editor

---

## Step 2: Copy Migration File

1. Open the file: `MIGRATIONS_TO_RUN.sql` in this project
2. Select **ALL** content (Cmd+A / Ctrl+A)
3. Copy to clipboard (Cmd+C / Ctrl+C)

---

## Step 3: Paste and Run

1. Paste the entire content into the Supabase SQL Editor (Cmd+V / Ctrl+V)
2. Review the SQL (optional - you can see it creates tables, policies, etc.)
3. Click the **"Run"** button (or press Cmd+Enter / Ctrl+Enter)
4. Wait for execution to complete (should take 5-10 seconds)

---

## Step 4: Verify Success

You should see a success message. Run these verification queries to confirm:

### Query 1: Check Tables Created
```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name LIKE '%essay%'
ORDER BY table_name;
```

**Expected Result:** Should show 4 tables:
- `essay_analysis_reports`
- `essay_coaching_plans`
- `essay_revision_history`
- `essays`

### Query 2: Check New Columns
```sql
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'essay_analysis_reports'
  AND column_name IN ('voice_fingerprint', 'experience_fingerprint', 'workshop_items', 'full_analysis_result');
```

**Expected Result:** Should show 4 rows with JSONB columns:
- `voice_fingerprint` - jsonb
- `experience_fingerprint` - jsonb
- `workshop_items` - jsonb
- `full_analysis_result` - jsonb

### Query 3: Check RLS Policies
```sql
SELECT tablename, policyname
FROM pg_policies
WHERE tablename IN ('essays', 'essay_analysis_reports', 'essay_revision_history', 'essay_coaching_plans')
ORDER BY tablename, policyname;
```

**Expected Result:** Should show multiple policies with "Clerk:" prefix

### Query 4: Check user_id is TEXT
```sql
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'essays'
  AND column_name = 'user_id';
```

**Expected Result:** Should show:
- `user_id` - text (not uuid)

---

## Step 5: Test the Application

1. **Sign in** to the application with Clerk
2. **Navigate** to PIQ Workshop
3. **Select a prompt** and write some text
4. **Click "Save"** - should see "Saving..." then "Saved" indicator
5. **Refresh the page** - your work should still be there (loaded from database)
6. **Open on another device** (optional) - should see same data

---

## 🚨 Troubleshooting

### Error: "relation already exists"
**Meaning:** Tables already exist (safe to ignore)
**Action:** Migration is idempotent, this is expected if running multiple times

### Error: "column already exists"
**Meaning:** Columns already added (safe to ignore)
**Action:** Migration is idempotent, this is expected

### Error: "policy already exists"
**Meaning:** RLS policies already created
**Action:** The migration drops existing policies before recreating, this should not happen

### Error: "permission denied"
**Meaning:** Not enough permissions
**Action:** Make sure you're using the correct Supabase project and have admin access

### Save button shows "Error"
**Possible causes:**
1. **Not signed in** - Sign in with Clerk first
2. **RLS policy issue** - Check that Clerk JWT template is configured correctly
3. **Network issue** - Check browser console for errors

**Debug steps:**
1. Open browser DevTools (F12)
2. Go to Console tab
3. Click "Save" button
4. Look for error messages (🔴 red text)
5. Share the error with your developer

---

## 📊 What This Migration Does

### Creates 4 Core Tables:
1. **essays** - Stores essay drafts and metadata
2. **essay_analysis_reports** - Stores analysis results and scores
3. **essay_revision_history** - Tracks all versions over time
4. **essay_coaching_plans** - Stores coaching suggestions

### Adds 4 New Columns to essay_analysis_reports:
1. **voice_fingerprint** - Voice analysis (sentence structure, vocabulary, tone)
2. **experience_fingerprint** - Uniqueness dimensions and anti-patterns
3. **workshop_items** - Surgical fix suggestions
4. **full_analysis_result** - Complete analysis object for archival

### Security Features:
- **Row Level Security (RLS)** enabled on all tables
- **Clerk JWT authentication** - Only see your own data
- **Proper indexes** for fast queries
- **Database triggers** for auto-versioning

---

## 🎉 Success Indicators

After successful deployment, you should have:
- ✅ All 4 essay tables created
- ✅ 4 new JSONB columns in essay_analysis_reports
- ✅ RLS policies with "Clerk:" prefix
- ✅ user_id converted from UUID to TEXT
- ✅ Save button works and shows "Saved" status
- ✅ Work persists across page refreshes
- ✅ Cross-device sync works

---

## 🔄 Next Steps

After successful deployment:

1. **Test save/load flow**
   - Write essay → Save → Refresh → Verify data persists

2. **Test analysis flow**
   - Run analysis → Verify score shows → Save → Refresh → Verify analysis persists

3. **Test cross-device**
   - Save on device 1 → Open on device 2 → Verify same data

4. **Report any issues**
   - Check browser console for errors
   - Note exact error messages
   - Share screenshots if helpful

---

## 📝 Migration File Details

**File:** `MIGRATIONS_TO_RUN.sql`
**Size:** 471 lines
**Safe to run multiple times:** Yes (idempotent)
**Destructive operations:** Only drops/recreates RLS policies (safe)
**Data loss risk:** None - only adds columns and tables

---

## 🔐 Security Notes

This migration:
- ✅ Preserves all existing data
- ✅ Only adds new functionality
- ✅ Maintains data isolation between users
- ✅ Uses industry-standard RLS patterns
- ✅ No hardcoded credentials or secrets

The "destructive operation" warning from Supabase refers to dropping and recreating RLS policies, which is **safe and expected**.

---

## 📞 Support

If you encounter issues:
1. Check the Troubleshooting section above
2. Review browser console for error messages
3. Share specific error messages with your team
4. Include context: what you were doing when error occurred

---

## ✅ Deployment Checklist

Before deploying:
- [ ] Logged into Supabase Dashboard
- [ ] Have `MIGRATIONS_TO_RUN.sql` file ready
- [ ] Verified Clerk authentication is configured

During deployment:
- [ ] Copied entire migration file
- [ ] Pasted into SQL Editor
- [ ] Clicked "Run" button
- [ ] Saw success message

After deployment:
- [ ] Ran verification queries
- [ ] All 4 tables exist
- [ ] 4 new columns added
- [ ] RLS policies have "Clerk:" prefix
- [ ] Tested save button in UI
- [ ] Tested data persistence

---

## 🎯 Ready to Deploy?

1. Open: https://supabase.com/dashboard/project/zclaplpkuvxkrdwsgrul/sql/new
2. Copy: `MIGRATIONS_TO_RUN.sql`
3. Paste & Run
4. Verify with queries above
5. Test in UI

**You're all set!** 🚀
