#!/usr/bin/env node
/**
 * notion-sync.mjs
 *
 * Bidirectional sync between MVP_Launch_Plan.md and a Notion database.
 *
 * Usage:
 *   node scripts/notion-sync.mjs push                # GitHub → Notion (checkbox state)
 *   node scripts/notion-sync.mjs pull                # Notion → GitHub (checkbox state)
 *   node scripts/notion-sync.mjs update-descriptions # Backfill page body content
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

/**
 * Parses MVP_Launch_Plan.md and returns:
 *   lines   — raw lines array (for reconstruction)
 *   items   — checklist items with metadata
 *   meta    — per-subsection metadata: { [subsection]: { time, deliverable, notes } }
 */
function parseMarkdown(content) {
  const lines = content.split('\n');
  const items = [];
  const meta = {}; // subsection → { time, deliverable, notes[] }

  let section = '';
  let subsection = '';
  let inCodeBlock = false;
  let codeLines = [];
  let codeSubsection = '';

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Track code blocks so we can attach them to subsections
    if (line.startsWith('```')) {
      if (!inCodeBlock) {
        inCodeBlock = true;
        codeLines = [];
        codeSubsection = subsection;
      } else {
        inCodeBlock = false;
        const key = codeSubsection || section;
        if (!meta[key]) meta[key] = {};
        meta[key].codeBlock = codeLines.join('\n');
        codeLines = [];
      }
      continue;
    }
    if (inCodeBlock) { codeLines.push(line); continue; }

    // Section headers
    if (line.startsWith('### ')) {
      section = line.slice(4).replace(/\s*\(.*?\)\s*$/, '').trim();
      subsection = '';
      continue;
    }
    if (line.startsWith('#### ')) {
      subsection = line
        .slice(5)
        .replace(/\s*\(.*?\)\s*$/, '')
        .replace(/^Day \d+(?:-\d+)?:\s*/, '')
        .trim();
      continue;
    }

    // Section metadata lines
    const key = subsection || section;
    if (!meta[key]) meta[key] = {};

    const timeMatch = line.match(/\*\*Time:\s*(.*?)\*\*/);
    if (timeMatch) { meta[key].time = timeMatch[1].trim(); continue; }

    const deliverableMatch = line.match(/\*\*Deliverable:\*\*\s*(.*)/);
    if (deliverableMatch) { meta[key].deliverable = deliverableMatch[1].trim(); continue; }

    // Checklist items
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

  return { lines, items, meta };
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
// Page body builder
// ---------------------------------------------------------------------------

function buildPageBlocks(item, meta) {
  const key = item.subsection !== 'General' ? item.subsection : item.section;
  const m = meta[key] || {};

  const blocks = [];

  // Context callout: section → subsection
  const breadcrumb = item.subsection !== 'General' && item.subsection !== item.section
    ? `${item.section}  ›  ${item.subsection}`
    : item.section;

  blocks.push({
    object: 'block',
    type: 'callout',
    callout: {
      rich_text: [{ type: 'text', text: { content: breadcrumb } }],
      icon: { type: 'emoji', emoji: '📍' },
      color: 'gray_background',
    },
  });

  // Time + Deliverable
  if (m.time || m.deliverable) {
    if (m.time) {
      blocks.push({
        object: 'block',
        type: 'paragraph',
        paragraph: {
          rich_text: [
            { type: 'text', text: { content: '⏱ Estimated time: ' }, annotations: { bold: true } },
            { type: 'text', text: { content: m.time } },
          ],
        },
      });
    }
    if (m.deliverable) {
      blocks.push({
        object: 'block',
        type: 'paragraph',
        paragraph: {
          rich_text: [
            { type: 'text', text: { content: '🎯 Goal: ' }, annotations: { bold: true } },
            { type: 'text', text: { content: m.deliverable } },
          ],
        },
      });
    }
  }

  // Code block if present (e.g. DB schema for check-ins section)
  if (m.codeBlock) {
    blocks.push({ object: 'block', type: 'divider', divider: {} });
    blocks.push({
      object: 'block',
      type: 'code',
      code: {
        rich_text: [{ type: 'text', text: { content: m.codeBlock } }],
        language: 'sql',
      },
    });
  }

  // Empty notes section for manual additions
  blocks.push({ object: 'block', type: 'divider', divider: {} });
  blocks.push({
    object: 'block',
    type: 'heading_3',
    heading_3: {
      rich_text: [{ type: 'text', text: { content: 'Notes' } }],
    },
  });
  blocks.push({
    object: 'block',
    type: 'paragraph',
    paragraph: { rich_text: [] }, // empty — user fills this in Notion
  });

  return blocks;
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

// Notion rate limit is 3 req/s — small delay between bulk writes
function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

// ---------------------------------------------------------------------------
// Push: GitHub → Notion (GitHub wins on conflict)
// ---------------------------------------------------------------------------

async function push() {
  console.log('→ Pushing GitHub → Notion');
  await ensureSchema();

  const content = readFileSync(MD_PATH, 'utf8');
  const { lines, items, meta } = parseMarkdown(content);

  const pages = await getAllNotionPages();
  const notionById = new Map(pages.map(p => [p.id, p]));

  let mdChanged = false;

  for (const item of items) {
    if (!item.notionPageId) {
      console.log(`  + Creating: "${item.text}"`);
      const page = await notion.pages.create({
        parent: { database_id: NOTION_DATABASE_ID },
        properties: {
          Name: { title: [{ text: { content: item.text } }] },
          Done: { checkbox: item.checked },
          Section: { select: { name: item.section } },
          Subsection: { select: { name: item.subsection } },
        },
        children: buildPageBlocks(item, meta),
      });
      item.notionPageId = page.id;
      mdChanged = true;
      await sleep(350);
    } else if (notionById.has(item.notionPageId)) {
      const page = notionById.get(item.notionPageId);
      if (notionPageDone(page) !== item.checked) {
        console.log(`  ~ Updating: "${item.text}" → ${item.checked}`);
        await notion.pages.update({
          page_id: item.notionPageId,
          properties: { Done: { checkbox: item.checked } },
        });
        await sleep(350);
      }
    } else {
      // Page ID in markdown but deleted from Notion — recreate
      console.log(`  + Recreating: "${item.text}"`);
      const page = await notion.pages.create({
        parent: { database_id: NOTION_DATABASE_ID },
        properties: {
          Name: { title: [{ text: { content: item.text } }] },
          Done: { checkbox: item.checked },
          Section: { select: { name: item.section } },
          Subsection: { select: { name: item.subsection } },
        },
        children: buildPageBlocks(item, meta),
      });
      item.notionPageId = page.id;
      mdChanged = true;
      await sleep(350);
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

  const itemByPageId = new Map(
    items.filter(i => i.notionPageId).map(i => [i.notionPageId, i])
  );

  const pages = await getAllNotionPages();
  let changed = false;

  for (const page of pages) {
    const item = itemByPageId.get(page.id);
    if (!item) continue;

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
// Update descriptions: backfill page body on existing pages
// ---------------------------------------------------------------------------

async function updateDescriptions() {
  console.log('📝 Updating page descriptions in Notion');

  const content = readFileSync(MD_PATH, 'utf8');
  const { items, meta } = parseMarkdown(content);

  let count = 0;
  for (const item of items) {
    if (!item.notionPageId) continue;

    // Clear existing blocks then append fresh ones
    const existing = await notion.blocks.children.list({ block_id: item.notionPageId });
    for (const block of existing.results) {
      await notion.blocks.delete({ block_id: block.id });
      await sleep(200);
    }

    await notion.blocks.children.append({
      block_id: item.notionPageId,
      children: buildPageBlocks(item, meta),
    });

    count++;
    process.stdout.write(`\r  ✓ Updated ${count}/${items.filter(i => i.notionPageId).length}`);
    await sleep(350);
  }

  console.log('\n  ✓ All descriptions updated');
}

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------

const mode = process.argv[2];
if (mode === 'push') {
  push().catch(err => { console.error(err); process.exit(1); });
} else if (mode === 'pull') {
  pull().catch(err => { console.error(err); process.exit(1); });
} else if (mode === 'update-descriptions') {
  updateDescriptions().catch(err => { console.error(err); process.exit(1); });
} else {
  console.error('Usage: node scripts/notion-sync.mjs push|pull|update-descriptions');
  process.exit(1);
}
