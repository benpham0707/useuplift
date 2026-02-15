

## Fix: Restore the Missing `.env` File

### What We'll Do
Create the `.env` file in the project root with the three required Vite environment variables:

```
VITE_SUPABASE_PROJECT_ID="wrppjajhxiftzddeeqsk"
VITE_SUPABASE_URL="https://wrppjajhxiftzddeeqsk.supabase.co"
VITE_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndycHBqYWpoeGlmdHpkZGVlcXNrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzExMTI2NTcsImV4cCI6MjA4NjY4ODY1N30.cFgyAcfDn6e15KYr_xpiLwfgyUJyOSlE9PoHD3aXhhs"
```

### Why
The file was deleted, so Vite has no environment variables to inject at build time, causing the `supabaseUrl is required` crash and blank screen.

### Safety
These are publishable (public) client-side keys. RLS policies protect data server-side.

### Expected Result
The app loads without the blank screen error.

