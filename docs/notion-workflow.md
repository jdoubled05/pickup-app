# Notion Workflow

This project uses a bidirectional sync between `MVP_Launch_Plan.md` and a Notion database, plus a Notion MCP server that lets Claude Code (VS Code) query Notion directly.

---

## Setup

### Required secrets

| Variable | Where used |
|---|---|
| `NOTION_TOKEN` | `.env` (local) + GitHub Actions secret |
| `NOTION_DATABASE_ID` | `.env` (local) + GitHub Actions secret |

Both are already configured. If you need to re-add them:
- **GitHub:** repo → Settings → Secrets and variables → Actions
- **Local:** add to `.env` at the project root

### Notion MCP server (Claude Code ↔ Notion)

The MCP server lets Claude Code read and update Notion pages directly without any manual steps.

Config lives in `.mcp.json` (gitignored — contains your token). It's already set up. To verify it's active:

1. Restart Claude Code (VS Code)
2. Type `/mcp` — you should see `notion` listed as a connected server

If it's missing, recreate `.mcp.json` at the project root:

```json
{
  "mcpServers": {
    "notion": {
      "command": "npx",
      "args": ["-y", "@notionhq/notion-mcp-server"],
      "env": {
        "OPENAPI_MCP_HEADERS": "{\"Authorization\": \"Bearer YOUR_NOTION_TOKEN\", \"Notion-Version\": \"2022-06-28\"}"
      }
    }
  }
}
```

---

## How the sync works

### GitHub → Notion (automatic)

Triggered on every push to `main` that touches `MVP_Launch_Plan.md`.

- Checklist items that are new get created as Notion pages
- Checkbox state changes sync to Notion (GitHub wins on conflict)
- New pages get their Notion page ID written back to the markdown as `<!-- notion:uuid -->` comments (committed with `[skip ci]`)

### Notion → GitHub (automatic, every 30 min)

A scheduled GitHub Action polls Notion for checkbox changes and commits them back to `MVP_Launch_Plan.md` with `[skip ci]`.

You can also trigger it manually: GitHub → Actions → "Sync checklist from Notion" → Run workflow.

### Loop prevention

Both sync directions use `[skip ci]` in bot commits, so they never trigger each other.

---

## Claude Web → Claude Code handoff

This is the primary use case for the MCP server.

**The workflow:**

1. Open a Code task in Notion
2. Chat with Claude Web about what needs to be implemented
3. Ask Claude Web to write an implementation plan into the **Claude Instructions** section of the page
4. Set the task's **Status** to `Ready for Code`
5. Switch to VS Code and tell Claude Code:
   > *"Check Notion for my next Ready for Code task and implement it"*
6. Claude Code reads the page directly via MCP — no file intermediary, always fresh

**What Claude Code can do via MCP:**
- Query for tasks filtered by Status, Type, Section
- Read the full page body including Claude Web's instructions
- Update the Status (e.g. mark In Progress or Done)
- Add notes back to the page after completing work

**Example prompts for Claude Code:**
- `"Check Notion for tasks with Status = Ready for Code"`
- `"Read the Claude Instructions on the [task name] Notion page"`
- `"Mark the check-in expiration task as Done in Notion"`

---

## Database structure

| Property | Type | Values |
|---|---|---|
| Name | Title | Task text |
| Done | Checkbox | Syncs with `- [x]` in markdown |
| Section | Select | From `###` headers in markdown |
| Subsection | Select | From `####` headers in markdown |
| Type | Select | `Code` / `Testing` / `Admin` |

### Type classification

- **Code** — requires writing or changing app code
- **Testing** — QA, device testing, TestFlight/beta
- **Admin** — setup, config, store submission, legal, metrics

---

## npm scripts

```bash
npm run notion:push         # Push markdown → Notion (checkbox state + new items)
npm run notion:pull         # Pull Notion → markdown (checkbox state)
npm run notion:descriptions # Refresh page body content on all pages
npm run notion:types        # Backfill Type property on all pages
npm run notion:repair       # Re-populate Section, Subsection, Type (use if columns go blank)
```

---

## GitHub Actions

| Workflow | Trigger | What it does |
|---|---|---|
| `sync-to-notion.yml` | Push to `main` touching `MVP_Launch_Plan.md` | Pushes checkbox changes and new items to Notion |
| `sync-from-notion.yml` | Cron every 30 min + manual | Pulls checkbox changes from Notion back to markdown |

---

## Troubleshooting

**Section/Subsection columns went blank**
Run `npm run notion:repair` — this re-populates all three derived properties (Section, Subsection, Type) from the markdown source of truth.

**MCP server not showing in `/mcp`**
Restart Claude Code. If still missing, check that `.mcp.json` exists at the project root and that `enabledMcpjsonServers: ["notion"]` is in `.claude/settings.local.json`.

**Sync not triggering on push**
Check that the commit message doesn't contain `[skip ci]`. The GitHub Actions workflow ignores those commits to prevent loops.

**Notion page ID disappeared from markdown**
Run `npm run notion:push` — it will recreate the Notion page and write the new ID back.
