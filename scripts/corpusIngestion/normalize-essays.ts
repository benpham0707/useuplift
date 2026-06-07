/**
 * Reads raw HTML in corpus/external/raw/<source_id>/ and emits normalized
 * EssayRecord JSON files into corpus/external/essays/.
 *
 * Uses a tiny HTML→text strip + Claude (Haiku) for AO-commentary segmentation
 * because AO commentary is interleaved with essay text in highly variable
 * markup across schools. Cost target: <$3 for all five S-tier sources.
 */

import * as fs from "node:fs";
import * as path from "node:path";
import Anthropic from "@anthropic-ai/sdk";
import type { EssayRecord, AOCommentary } from "../../src/services/essayIntelligence/corpus/external/schemas";

const RAW_ROOT = path.resolve(
  __dirname,
  "../../src/services/essayIntelligence/corpus/external/raw",
);
const OUT_ROOT = path.resolve(
  __dirname,
  "../../src/services/essayIntelligence/corpus/external/essays",
);

const SCHOOL_BY_SOURCE: Record<string, string> = {
  jhu_etw: "Johns Hopkins University",
  tufts_etw: "Tufts University",
  conncoll_etw: "Connecticut College",
  hamilton_etw: "Hamilton College",
  mit_blogs_essay_tag: "MIT",
};

function htmlToText(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<nav[\s\S]*?<\/nav>/gi, "")
    .replace(/<footer[\s\S]*?<\/footer>/gi, "")
    .replace(/<header[\s\S]*?<\/header>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim();
}

const SEGMENT_PROMPT = `You are extracting structured records from a school admissions
"Essays That Worked" page. Output STRICT JSON only, no prose.

Goal: identify ONE student essay and the admissions officer's commentary
on it. If the page has multiple essays, output an array. If it has none
(navigation/landing page), output {"essays":[]}.

Output schema:
{
  "essays": [
    {
      "prompt": string | null,
      "essay_text": string,
      "ao_commentary": [{"text": string, "scope": "essay"|"paragraph"|"sentence"}],
      "archetype_hints": string[]
    }
  ]
}

Rules:
- essay_text = the student's actual essay, verbatim, no AO commentary mixed in
- ao_commentary = ONLY commentary attributable to the admissions office
  (often labeled "Why this essay worked", "Admissions Officer Notes", or similar)
- DO NOT invent commentary. If the page has no AO commentary, return ao_commentary: []
- archetype_hints = short tags the AO uses to describe the essay
  (e.g. "intellectual curiosity", "community service", "identity")
- If the page is navigation/index/listing only, return {"essays":[]}`;

async function segment(client: Anthropic, text: string): Promise<{ essays: any[] }> {
  if (text.length < 400 || text.length > 60_000) return { essays: [] };
  const res = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 4000,
    system: SEGMENT_PROMPT,
    messages: [{ role: "user", content: text.slice(0, 50_000) }],
  });
  const block = res.content.find((b) => b.type === "text") as { text: string } | undefined;
  if (!block) return { essays: [] };
  try {
    const m = block.text.match(/\{[\s\S]*\}/);
    return m ? JSON.parse(m[0]) : { essays: [] };
  } catch {
    return { essays: [] };
  }
}

async function main() {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.error("ANTHROPIC_API_KEY required");
    process.exit(1);
  }
  const client = new Anthropic({ apiKey });
  fs.mkdirSync(OUT_ROOT, { recursive: true });

  const sources = fs.existsSync(RAW_ROOT) ? fs.readdirSync(RAW_ROOT) : [];
  let totalEssays = 0;

  for (const sourceId of sources) {
    const dir = path.join(RAW_ROOT, sourceId);
    if (!fs.statSync(dir).isDirectory()) continue;
    const files = fs.readdirSync(dir).filter((f) => f.endsWith(".html"));
    console.log(`[${sourceId}] ${files.length} pages`);

    for (const file of files) {
      const html = fs.readFileSync(path.join(dir, file), "utf8");
      const text = htmlToText(html);
      const { essays } = await segment(client, text);

      essays.forEach((e: any, idx: number) => {
        if (!e.essay_text || e.essay_text.length < 200) return;
        const id = `${sourceId}_${file.replace(/\.html$/, "")}_${idx}`;
        const record: EssayRecord = {
          id,
          source_id: sourceId,
          school_destination: SCHOOL_BY_SOURCE[sourceId] ?? "Unknown",
          prompt: e.prompt ?? undefined,
          essay_text: e.essay_text,
          ao_commentary: (e.ao_commentary ?? []).map(
            (c: any): AOCommentary => ({
              text: c.text,
              attributed_to: SCHOOL_BY_SOURCE[sourceId] + " Admissions",
              scope: c.scope ?? "essay",
            }),
          ),
          annotation_perspective: "ao",
          archetype_hints: e.archetype_hints ?? [],
          outcome: "admitted",
          source_url: "", // will be backfilled from raw filename mapping
        };
        fs.writeFileSync(
          path.join(OUT_ROOT, `${id}.json`),
          JSON.stringify(record, null, 2),
        );
        totalEssays++;
      });
    }
  }

  console.log(`Normalized ${totalEssays} essays into ${OUT_ROOT}`);
}

main();
