# MCP Server Setup Context Document

**Purpose:** Complete handoff document for continuing MCP server setup in a new chat
**Created:** December 17, 2025
**Status:** Partially Complete - Need Manual Steps

---

## CURRENT STATE SUMMARY

### What Has Been Done ✅

1. **Cursor MCP Config Created** (`~/.cursor/mcp.json`)
   - Memory server configured
   - Filesystem server configured (pointing to project)
   - GitHub server configured (needs token)
   - PostgreSQL server configured (needs connection string)
   - Sequential-thinking server configured

2. **Project MCP Config Created** (`/Users/tuepham/uplift-final-final-18698-62030/.mcp.json`)
   - Same servers as Cursor config
   - For Claude CLI compatibility

3. **Claude CLI Settings Created** (`~/.claude/settings.json`)
   - All MCP servers enabled
   - Permissions configured
   - Project MCP servers auto-enabled

4. **Directory Structure Created**
   - `~/.claude/` directory exists
   - `/Users/tuepham/uplift-final-final-18698-62030/.claude/memory/` created

### What Still Needs To Be Done ❌

1. **Set Environment Variables** (USER ACTION REQUIRED)
   - `GITHUB_TOKEN` - GitHub Personal Access Token
   - `SUPABASE_DB_URL` - Supabase PostgreSQL connection string

2. **Restart Cursor** (USER ACTION REQUIRED)
   - MCP servers won't load until Cursor is restarted

3. **Test MCP Connections** (AFTER RESTART)
   - Verify each server connects properly
   - Debug any connection issues

4. **Optional: Create CLAUDE.md Project Context**
   - Persistent project context file
   - Was started but user interrupted

---

## CONFIGURATION FILES CREATED

### 1. Cursor MCP Config (`~/.cursor/mcp.json`)

```json
{
  "mcpServers": {
    "memory": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-memory"]
    },
    "filesystem": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-filesystem",
        "/Users/tuepham/uplift-final-final-18698-62030"
      ]
    },
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "${GITHUB_TOKEN}"
      }
    },
    "postgres": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-postgres"],
      "env": {
        "DATABASE_URL": "${SUPABASE_DB_URL}"
      }
    },
    "sequential-thinking": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-sequential-thinking"]
    }
  }
}
```

### 2. Project MCP Config (`/Users/tuepham/uplift-final-final-18698-62030/.mcp.json`)

Same as above - created for Claude CLI compatibility.

### 3. Claude CLI Settings (`~/.claude/settings.json`)

```json
{
  "enableAllProjectMcpServers": true,
  "permissions": {
    "allow": [
      "Bash(npm:*)",
      "Bash(npx:*)",
      "Bash(node:*)",
      "Bash(git:*)",
      "Bash(supabase:*)",
      "Read(**)",
      "Write(**)",
      "Edit(**)"
    ],
    "deny": [
      "Read(.env)",
      "Read(**/secrets/**)",
      "Read(**/*.pem)",
      "Read(**/*.key)"
    ]
  },
  "mcpServers": {
    "memory": { "enabled": true },
    "filesystem": { "enabled": true },
    "github": { "enabled": true },
    "postgres": { "enabled": true },
    "sequential-thinking": { "enabled": true }
  }
}
```

---

## ENVIRONMENT VARIABLES NEEDED

### 1. GitHub Token (`GITHUB_TOKEN`)

**How to create:**
1. Go to https://github.com/settings/tokens
2. Click "Generate new token" → "Fine-grained personal access token"
3. Set name: "Cursor MCP"
4. Set expiration: 90 days (or custom)
5. Select repository: `benpham0707/uplift-final-final-18698-62030`
6. Permissions needed:
   - `Contents`: Read and write
   - `Issues`: Read and write
   - `Pull requests`: Read and write
   - `Metadata`: Read-only
7. Click "Generate token"
8. Copy the token (starts with `github_pat_`)

**Where to set:**
```bash
# Option 1: Add to shell profile (~/.zshrc or ~/.bashrc)
export GITHUB_TOKEN="github_pat_xxxxxxxxxxxx"

# Option 2: Add to project .env (not recommended - secrets in repo)
GITHUB_TOKEN=github_pat_xxxxxxxxxxxx

# Option 3: Set in Cursor settings (if supported)
```

### 2. Supabase Database URL (`SUPABASE_DB_URL`)

**How to get:**
1. Go to https://supabase.com/dashboard
2. Select project: `zclaplpkuvxkrdwsgrul`
3. Go to Settings → Database
4. Find "Connection string" section
5. Copy the "URI" format connection string
6. Replace `[YOUR-PASSWORD]` with your actual database password

**Format:**
```
postgresql://postgres:[PASSWORD]@db.zclaplpkuvxkrdwsgrul.supabase.co:5432/postgres
```

**Where to set:**
```bash
# Add to shell profile (~/.zshrc or ~/.bashrc)
export SUPABASE_DB_URL="postgresql://postgres:YOUR_PASSWORD@db.zclaplpkuvxkrdwsgrul.supabase.co:5432/postgres"
```

---

## MANUAL STEPS FOR USER

### Step 1: Set Environment Variables

```bash
# Open your shell profile
nano ~/.zshrc  # or ~/.bashrc

# Add these lines at the end:
export GITHUB_TOKEN="your_github_token_here"
export SUPABASE_DB_URL="postgresql://postgres:YOUR_PASSWORD@db.zclaplpkuvxkrdwsgrul.supabase.co:5432/postgres"

# Save and reload
source ~/.zshrc
```

### Step 2: Restart Cursor

1. Quit Cursor completely (Cmd+Q on Mac)
2. Reopen Cursor
3. Open the project folder

### Step 3: Verify MCP Servers (In New Chat)

After restarting, ask Claude in a new chat:
```
Can you check if the MCP servers are connected? Try using the memory server to store something, and the filesystem server to list files in the project.
```

---

## MCP SERVERS EXPLAINED

| Server | Purpose | What It Enables |
|--------|---------|-----------------|
| **memory** | Persistent memory across sessions | Claude remembers project context, decisions, preferences |
| **filesystem** | Read/write files in project | Enhanced file navigation and search |
| **github** | GitHub API access | PR management, issue tracking, code review |
| **postgres** | Database introspection | Schema awareness, table structure, relationships |
| **sequential-thinking** | Complex reasoning | Better multi-step problem solving |

---

## TROUBLESHOOTING

### MCP Servers Not Loading

1. **Check if environment variables are set:**
   ```bash
   echo $GITHUB_TOKEN
   echo $SUPABASE_DB_URL
   ```

2. **Check Cursor MCP config syntax:**
   ```bash
   cat ~/.cursor/mcp.json | python3 -m json.tool
   ```

3. **Check Cursor logs:**
   - Open Cursor
   - Help → Toggle Developer Tools
   - Check Console tab for MCP errors

### GitHub Server Not Connecting

1. **Verify token is valid:**
   ```bash
   curl -H "Authorization: token $GITHUB_TOKEN" https://api.github.com/user
   ```

2. **Check token permissions:**
   - Go to https://github.com/settings/tokens
   - Click on your token
   - Verify repository access and permissions

### PostgreSQL Server Not Connecting

1. **Test connection directly:**
   ```bash
   psql "$SUPABASE_DB_URL"
   ```

2. **Check if password is correct:**
   - Go to Supabase Dashboard → Settings → Database
   - Reset database password if needed

3. **Check if IP is allowed:**
   - Supabase may block certain IPs
   - Check Database Settings → Network restrictions

### Memory Server Issues

1. **Check if npx can run the server:**
   ```bash
   npx -y @modelcontextprotocol/server-memory --help
   ```

2. **Clear npx cache if needed:**
   ```bash
   npx clear-npx-cache
   ```

---

## PROJECT CONTEXT FOR CLAUDE

### About the Uplift Project

**Uplift** is an AI-powered college application platform:
- **Frontend:** React 18 + Vite + shadcn/ui + Tailwind
- **Backend:** Express.js on port 8789
- **Database:** Supabase PostgreSQL (project: zclaplpkuvxkrdwsgrul)
- **Auth:** Clerk
- **AI:** Anthropic Claude + OpenAI
- **Payments:** Stripe

**Key Features:**
- Essay analysis with 11-dimension rubric
- Portfolio strength assessment
- Common App workshop (multi-stage teaching)
- Fraud prevention (zero-tolerance)
- Credit-based billing

**Project Structure:**
```
/Users/tuepham/uplift-final-final-18698-62030/
├── src/
│   ├── services/           # Business logic (20+ services)
│   ├── core/               # Analysis engines
│   ├── components/         # React components (200+)
│   ├── pages/              # Route pages (28)
│   └── http/               # Express server
├── supabase/               # Database migrations
├── tests/                  # Test files (85+)
└── docs/                   # Documentation
```

**Database Tables (16+):**
- profiles, essays, essay_analysis_reports
- experiences_activities, portfolio_analytics
- fraud_flags, devices, credit_transactions
- And more...

---

## NEXT STEPS FOR NEW CHAT

When you start a new chat, paste this prompt:

```
I'm setting up MCP servers for my Uplift project. Here's the current state:

**Done:**
- Cursor MCP config at ~/.cursor/mcp.json (5 servers configured)
- Project .mcp.json created
- Claude CLI settings at ~/.claude/settings.json
- Directory structure created

**Need to complete:**
1. I need to set GITHUB_TOKEN and SUPABASE_DB_URL environment variables
2. Restart Cursor
3. Test that all MCP servers connect properly

**My project:**
- Path: /Users/tuepham/uplift-final-final-18698-62030
- Supabase project ID: zclaplpkuvxkrdwsgrul
- GitHub repo: benpham0707/uplift-final-final-18698-62030

Please help me:
1. Verify my environment variables are set correctly
2. Test each MCP server connection
3. Create a CLAUDE.md project context file so you remember my project
4. Show me how to use the MCP servers effectively

I want the most optimal vibe coding setup.
```

---

## QUICK REFERENCE COMMANDS

```bash
# Check environment variables
echo $GITHUB_TOKEN
echo $SUPABASE_DB_URL

# Validate Cursor MCP config
cat ~/.cursor/mcp.json | python3 -m json.tool

# Test GitHub token
curl -H "Authorization: token $GITHUB_TOKEN" https://api.github.com/user

# Test Supabase connection
psql "$SUPABASE_DB_URL" -c "SELECT current_database();"

# Reload shell profile
source ~/.zshrc

# Clear npx cache (if server install fails)
npx clear-npx-cache

# List MCP servers (Claude CLI)
claude mcp list
```

---

## SUMMARY

**What's configured:** 5 MCP servers (memory, filesystem, github, postgres, sequential-thinking)

**What you need to do:**
1. Set `GITHUB_TOKEN` environment variable
2. Set `SUPABASE_DB_URL` environment variable
3. Restart Cursor
4. Test connections in new chat

**Time needed:** ~10-15 minutes

**After setup benefits:**
- Persistent memory across sessions
- Direct GitHub integration
- Database schema awareness
- Enhanced file navigation
- Better complex reasoning

---

*This document contains everything needed to continue MCP setup in a new chat.*
