/**
 * Scrapes school-published "Essays That Worked" pages into raw HTML.
 * S-tier school sources only — see corpus/external/sources.json.
 *
 * Storage: src/services/essayIntelligence/corpus/external/raw/<source_id>/
 * (gitignored; copyright belongs to the originating school)
 */

import * as fs from "node:fs";
import * as path from "node:path";

const RAW_ROOT = path.resolve(
  __dirname,
  "../../src/services/essayIntelligence/corpus/external/raw",
);

const TARGETS: { source_id: string; entry_url: string; index_selectors: string[] }[] = [
  {
    source_id: "jhu_etw",
    entry_url: "https://apply.jhu.edu/application-process/essays-that-worked/",
    index_selectors: ["a[href*='essays-that-worked']"],
  },
  {
    source_id: "tufts_etw",
    entry_url:
      "https://admissions.tufts.edu/blogs/inside-admissions/category/essays-that-worked/",
    index_selectors: ["article a", "h2 a"],
  },
  {
    source_id: "conncoll_etw",
    entry_url: "https://www.conncoll.edu/admission/apply/essays-that-worked/",
    index_selectors: ["a[href*='essays-that-worked']", ".content a"],
  },
  {
    source_id: "hamilton_etw",
    entry_url: "https://www.hamilton.edu/admission/apply/essays-that-worked",
    index_selectors: ["a[href*='essay']", ".content a"],
  },
  {
    source_id: "mit_blogs_essay_tag",
    entry_url: "https://mitadmissions.org/blogs/category/applying-to-mit/the-essays/",
    index_selectors: ["article a", "h2 a"],
  },
];

async function fetchText(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: {
      "User-Agent":
        "uplift-corpus-ingest/1.0 (research; contact: tue.w.pham@gmail.com)",
    },
  });
  if (!res.ok) throw new Error(`${url} → ${res.status}`);
  return res.text();
}

function extractLinks(html: string, baseUrl: string): string[] {
  const out = new Set<string>();
  const hrefRe = /href=["']([^"']+)["']/gi;
  let m: RegExpExecArray | null;
  const base = new URL(baseUrl);
  while ((m = hrefRe.exec(html))) {
    try {
      const u = new URL(m[1], base);
      if (u.hostname === base.hostname) out.add(u.toString());
    } catch {
      /* skip */
    }
  }
  return [...out];
}

async function ingestTarget(target: (typeof TARGETS)[number]) {
  const dir = path.join(RAW_ROOT, target.source_id);
  fs.mkdirSync(dir, { recursive: true });

  console.log(`[${target.source_id}] index → ${target.entry_url}`);
  const indexHtml = await fetchText(target.entry_url);
  fs.writeFileSync(path.join(dir, "_index.html"), indexHtml);

  const allLinks = extractLinks(indexHtml, target.entry_url);
  const candidates = allLinks.filter((u) =>
    /essay|admiss|blog/i.test(u),
  );

  console.log(`[${target.source_id}] ${candidates.length} candidate links`);

  let saved = 0;
  for (const url of candidates) {
    const slug = url.replace(/[^a-z0-9]+/gi, "_").slice(-180);
    const out = path.join(dir, `${slug}.html`);
    if (fs.existsSync(out)) continue;
    try {
      const html = await fetchText(url);
      fs.writeFileSync(out, html);
      saved++;
      await new Promise((r) => setTimeout(r, 800));
    } catch (e) {
      console.warn(`[${target.source_id}] skip ${url}: ${(e as Error).message}`);
    }
  }
  console.log(`[${target.source_id}] saved ${saved} pages`);
}

async function main() {
  fs.mkdirSync(RAW_ROOT, { recursive: true });
  for (const t of TARGETS) {
    try {
      await ingestTarget(t);
    } catch (e) {
      console.error(`[${t.source_id}] FAILED:`, (e as Error).message);
    }
  }
  console.log("Done. Next: npx tsx scripts/corpusIngestion/normalize-essays.ts");
}

main();
