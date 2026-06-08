/**
 * Reads every EssayRecord in corpus/external/essays/ and every transcript in
 * corpus/external/transcripts/, asks Claude (Sonnet) to extract structured
 * HeuristicRecord rows tied back to the source.
 *
 * One heuristic = one transferable taste rule with a verbatim quote anchor.
 */

import * as fs from "node:fs";
import * as path from "node:path";
import Anthropic from "@anthropic-ai/sdk";
import type { EssayRecord, HeuristicRecord, HeuristicTag } from "../../src/services/essayIntelligence/corpus/external/schemas";

const ESSAYS_ROOT = path.resolve(
  __dirname,
  "../../src/services/essayIntelligence/corpus/external/essays",
);
const TRANSCRIPTS_ROOT = path.resolve(
  __dirname,
  "../../src/services/essayIntelligence/corpus/external/transcripts",
);
const OUT = path.resolve(
  __dirname,
  "../../src/services/essayIntelligence/corpus/external/heuristics/heuristics.jsonl",
);

const TAGS: HeuristicTag[] = [
  "opener", "closer", "voice", "structure", "authenticity",
  "school_fit", "ao_fatigue", "ao_delight", "ao_suspicion",
  "howler", "landing", "cliche", "anti_pattern",
];

const SYSTEM = `You are extracting transferable TASTE HEURISTICS from college admissions
essays + their officer commentary, OR from a transcript of a named
admissions dean speaking publicly.

A heuristic is a transferable rule of thumb a top-tier counselor would
articulate. Examples:
- "Openers that name a setting and then state a feeling about it ('I love
   the smell of the lab') signal exposition over discovery and lose AO
   attention by sentence three." (anti_pattern, opener, ao_fatigue)
- "Voice authenticity rises when sentence rhythm varies — short follow-up
   to a long observation reads as thinking happening live." (voice, landing)

Output STRICT JSON: {"heuristics": [...]} where each item is:
{
  "applies_to": [tag, ...],   // pick from: ${TAGS.join(", ")}
  "pattern": "what the heuristic recognizes",
  "judgment": "what a top counselor concludes when this pattern fires",
  "school_specific": "school name or null",
  "confidence": 0.0..1.0,     // how strongly the source supports it
  "quote": "verbatim quote from the AO commentary or transcript that grounds this heuristic"
}

Rules:
- Heuristic MUST be grounded in an explicit AO/dean statement. No inferences.
- If the AO commentary is vague ("we loved this"), output zero heuristics.
- Prefer fewer, sharper heuristics over many vague ones.
- Quote must be verbatim from the source material.`;

async function extractFromEssay(client: Anthropic, e: EssayRecord): Promise<HeuristicRecord[]> {
  if (e.ao_commentary.length === 0) return [];
  const payload = `SCHOOL: ${e.school_destination}
PERSPECTIVE: ${e.annotation_perspective}

ESSAY (verbatim):
${e.essay_text}

AO COMMENTARY:
${e.ao_commentary.map((c) => `- (${c.scope}) ${c.text}`).join("\n")}`;

  const res = await client.messages.create({
    model: "claude-sonnet-4-5-20250929",
    max_tokens: 3000,
    system: SYSTEM,
    messages: [{ role: "user", content: payload }],
  });
  const block = res.content.find((b) => b.type === "text") as { text: string } | undefined;
  if (!block) return [];
  try {
    const m = block.text.match(/\{[\s\S]*\}/);
    if (!m) return [];
    const parsed = JSON.parse(m[0]);
    return (parsed.heuristics ?? []).map((h: any, idx: number): HeuristicRecord => ({
      id: `${e.id}_h${idx}`,
      source_id: e.source_id,
      applies_to: h.applies_to,
      pattern: h.pattern,
      judgment: h.judgment,
      school_specific: h.school_specific ?? undefined,
      confidence: h.confidence ?? 0.6,
      quote: h.quote,
      source_url: e.source_url,
      perspective: e.annotation_perspective,
    }));
  } catch {
    return [];
  }
}

async function main() {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.error("ANTHROPIC_API_KEY required");
    process.exit(1);
  }
  const client = new Anthropic({ apiKey });
  fs.mkdirSync(path.dirname(OUT), { recursive: true });

  const essayFiles = fs.existsSync(ESSAYS_ROOT)
    ? fs.readdirSync(ESSAYS_ROOT).filter((f) => f.endsWith(".json"))
    : [];

  console.log(`Extracting from ${essayFiles.length} essays...`);
  const stream = fs.createWriteStream(OUT, { flags: "w" });
  let count = 0;

  for (const f of essayFiles) {
    const essay: EssayRecord = JSON.parse(
      fs.readFileSync(path.join(ESSAYS_ROOT, f), "utf8"),
    );
    const heuristics = await extractFromEssay(client, essay);
    heuristics.forEach((h) => {
      stream.write(JSON.stringify(h) + "\n");
      count++;
    });
    if (count % 25 === 0) console.log(`  extracted ${count} so far...`);
  }
  stream.end();
  console.log(`Wrote ${count} heuristics → ${OUT}`);
  console.log("Next: dedupe-heuristics.ts");
}

main();
