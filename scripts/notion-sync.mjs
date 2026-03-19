#!/usr/bin/env node
/**
 * notion-sync.mjs
 *
 * Bidirectional sync between MVP_Launch_Plan.md and a Notion database.
 *
 * Usage:
 *   node scripts/notion-sync.mjs push   # GitHub → Notion
 *   node scripts/notion-sync.mjs pull   # Notion → GitHub
 *
 * Required env vars:
 *   NOTION_TOKEN        - Notion integration secret
 *   NOTION_DATABASE_ID  - Target Notion database ID
 */

import { Client } from '@notionhq/client';
import { readFileSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { config } from 'dotenv';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const MD_PATH = join(ROOT, 'MVP_Launch_Plan.md');

// Load .env when running locally (GitHub Actions uses secrets instead)
config({ path: join(ROOT, '.env') });

const { NOTION_TOKEN, NOTION_DATABASE_ID } = process.env;
if (!NOTION_TOKEN) throw new Error('Missing NOTION_TOKEN');
if (!NOTION_DATABASE_ID) throw new Error('Missing NOTION_DATABASE_ID');

const notion = new Client({ auth: NOTION_TOKEN });

// Matches: `- [x] Task text <!-- notion:uuid -->`
//      or: `- [ ] Task text`
const ITEM_RE = /^(\s*)-\s*\[([ xX])\]\s*(.*?)(?:\s*<!--\s*notion:([0-9a-f-]{36})\s*-->)?\s*$/;

// ---------------------------------------------------------------------------
// Parsing
// ---------------------------------------------------------------------------

function parseMarkdown(content) {
  const lines = content.split('\n');
  const items = [];
  let section = '';
  let subsection = '';

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.startsWith('### ')) {
      section = line.slice(4).replace(/\s*\(.*?\)\s*$/, '').trim();
      subsection = '';
    } else if (line.startsWith('#### ')) {
      subsection = line
        .slice(5)
        .replace(/\s*\(.*?\)\s*$/, '')
        .replace(/^Day \d+(?:-\d+)?:\s*/, '')
        .trim();
    }
    const m = line.match(ITEM_RE);
    if (m) {
      items.push({
        lineIdx: i,
        indent: m[1],
        checked: m[2].trim().toLowerCase() === 'x',
        text: m[3].trim(),
        notionPageId: m[4] || null,
        section: section || 'General',
        subsection: subsection || 'General',
      });
    }
  }
  return { lines, items };
}

function buildMarkdown(lines, items) {
  const out = [...lines];
  for (const item of items) {
    const cb = item.checked ? 'x' : ' ';
    const id = item.notionPageId ? ` <!-- notion:${item.notionPageId} -->` : '';
    out[item.lineIdx] = `${item.indent}- [${cb}] ${item.text}${id}`;
  }
  return out.join('\n');
}

// ---------------------------------------------------------------------------
// Notion helpers
// ---------------------------------------------------------------------------

async function ensureSchema() {
  try {
    await notion.databases.update({
      database_id: NOTION_DATABASE_ID,
      properties: {
        Done: { checkbox: {} },
        Section: { select: {} },
        Subsection: { select: {} },
      },
    });
  } catch (e) {
    console.warn('Schema update warning (may already exist):', e.message);
  }
}

async function getAllNotionPages() {
  const pages = [];
  let cursor;
  do {
    const res = await notion.databases.query({
      database_id: NOTION_DATABASE_ID,
      ...(cursor ? { start_cursor: cursor } : {}),
      page_size: 100,
    });
    pages.push(...res.results);
    cursor = res.has_more ? res.next_cursor : null;
  } while (cursor);
  return pages;
}

function notionPageDone(page) {
  return page.properties?.Done?.checkbox ?? false;
}

// ---------------------------------------------------------------------------
// Push: GitHub → Notion (GitHub wins on conflict)
// ---------------------------------------------------------------------------

async function push() {
  console.log('→ Pushing GitHub → Notion');
  await ensureSchema();

  const content = readFileSync(MD_PATH, 'utf8');
  const { lines, items } = parseMarkdown(content);

  // Build set of known page IDs so we can detect deleted pages
  const pages = await getAllNotionPages();
  const notionById = new Map(pages.map(p => [p.id, p]));

  let mdChanged = false;

  for (const item of items) {
    if (!item.notionPageId) {
      // New item — create in Notion
      console.log(`  + Creating: "${item.text}"`);
      const page = await notion.pages.create({
        parent: { database_id: NOTION_DATABASE_ID },
        properties: {
          Name: { title: [{ text: { content: item.text } }] },
          Done: { checkbox: item.checked },
          Section: { select: { name: item.section } },
          Subsection: { select: { name: item.subsection } },
        },
      });
      item.notionPageId = page.id;
      mdChanged = true;
    } else if (notionById.has(item.notionPageId)) {
      const page = notionById.get(item.notionPageId);
      if (notionPageDone(page) !== item.checked) {
        // GitHub wins — update Notion to match markdown
        console.log(`  ~ Updating: "${item.text}" → ${item.checked}`);
        await notion.pages.update({
          page_id: item.notionPageId,
          properties: { Done: { checkbox: item.checked } },
        });
      }
    } else {
      // Page ID in markdown but not found in Notion (was deleted) — recreate
      console.log(`  + Recreating: "${item.text}"`);
      const page = await notion.pages.create({
        parent: { database_id: NOTION_DATABASE_ID },
        properties: {
          Name: { title: [{ text: { content: item.text } }] },
          Done: { checkbox: item.checked },
          Section: { select: { name: item.section } },
          Subsection: { select: { name: item.subsection } },
        },
      });
      item.notionPageId = page.id;
      mdChanged = true;
    }
  }

  if (mdChanged) {
    writeFileSync(MD_PATH, buildMarkdown(lines, items), 'utf8');
    console.log('  ✓ Wrote notion IDs back to markdown');
  } else {
    console.log('  ✓ No structural changes needed');
  }
}

// ---------------------------------------------------------------------------
// Pull: Notion → GitHub (Notion wins on conflict)
// ---------------------------------------------------------------------------

async function pull() {
  console.log('← Pulling Notion → GitHub');

  const content = readFileSync(MD_PATH, 'utf8');
  const { lines, items } = parseMarkdown(content);

  // Map notionPageId → item for fast lookup
  const itemByPageId = new Map(
    items.filter(i => i.notionPageId).map(i => [i.notionPageId, i])
  );

  const pages = await getAllNotionPages();
  let changed = false;

  for (const page of pages) {
    const item = itemByPageId.get(page.id);
    if (!item) continue; // In Notion but not in markdown — skip (push handles creation)

    const notionDone = notionPageDone(page);
    if (notionDone !== item.checked) {
      console.log(`  ~ "${item.text}": ${item.checked} → ${notionDone}`);
      item.checked = notionDone;
      changed = true;
    }
  }

  if (changed) {
    writeFileSync(MD_PATH, buildMarkdown(lines, items), 'utf8');
    console.log('  ✓ Updated markdown from Notion');
  } else {
    console.log('  ✓ No changes from Notion');
  }
}

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------

const mode = process.argv[2];
if (mode === 'push') {
  push().catch(err => { console.error(err); process.exit(1); });
} else if (mode === 'pull') {
  pull().catch(err => { console.error(err); process.exit(1); });
} else {
  console.error('Usage: node scripts/notion-sync.mjs push|pull');
  process.exit(1);
}
