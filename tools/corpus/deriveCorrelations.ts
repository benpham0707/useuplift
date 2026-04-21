/**
 * tools/corpus/deriveCorrelations.ts
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * DERIVATION SCRIPT — Architecture C correlation generator.
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Reads:
 *   - TOP_TIER_CRAFT_MOVES (move.sourceEssays = co-occurrence signal)
 *   - ESSAY_ARCHETYPES (loadBearingMoveIds + structuralStages = cluster signal)
 *
 * Produces TWO artifacts:
 *   1. derivedCorrelations.json — full list sorted alphabetically (determinism,
 *      git-diff stability, integrity test consumption).
 *   2. derivedCorrelationsByMove.json — per-move retrieval index sorted by
 *      totalScore DESC (zero-cost retrieval at query time).
 *
 * Determinism: same inputs → byte-identical output (except `derivedAt` ISO
 * timestamp). Verified by test-derivation-correctness.ts.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * SCORING (see corpusTypes.ts DerivedCorrelation jsdoc for full spec)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 *   archetypeScore ∈ {0, 2, 4, 5}
 *   attestationScore ∈ {0, 1, 2, 3}
 *   proximityScore ∈ {0, 1, 2}
 *   totalScore = sum, clamped [0, 10]
 *
 *   strong-correlation: totalScore ≥ 6 OR archetypeScore ≥ 5
 *   suggested-pairing: totalScore ≥ 4
 *   dropped: totalScore < 4
 *
 * Run: `npx tsx tools/corpus/deriveCorrelations.ts`
 */

import { createHash } from 'node:crypto';
import { writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { TOP_TIER_CRAFT_MOVES } from '../../src/services/essayIntelligence/corpus/topTierCraftMoves';
import { ESSAY_ARCHETYPES } from '../../src/services/essayIntelligence/corpus/essayArchetypes';
import type {
  CraftMove,
  EssayArchetype,
  DerivedCorrelation,
  DerivedCorrelationsArtifact,
  PerMoveCorrelationIndex,
  CorpusEssayId,
} from '../../src/services/essayIntelligence/corpus/corpusTypes';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const SCRIPT_VERSION = '2.0.0'; // v2 scoring
const TOTAL_SCORE_DROP_THRESHOLD = 4;
const STRONG_TIER_TOTAL_THRESHOLD = 6;
const STRONG_TIER_ARCHETYPE_AUTO_PROMOTE = 5;

// ─────────────────────────────────────────────────────────────────────────
// Step 1: Build per-essay → moves index (for co-occurrence lookups)
// ─────────────────────────────────────────────────────────────────────────

interface EssayMovePresence {
  moveId: string;
  paragraphs: number[];
}

function buildPerEssayMoveIndex(moves: CraftMove[]): Map<CorpusEssayId, EssayMovePresence[]> {
  const index = new Map<CorpusEssayId, EssayMovePresence[]>();
  const sortedMoves = [...moves].sort((a, b) => a.id.localeCompare(b.id));

  for (const move of sortedMoves) {
    for (const src of move.sourceEssays) {
      const existing = index.get(src.essayId) ?? [];
      const existingPresence = existing.find((p) => p.moveId === move.id);
      if (existingPresence) {
        if (!existingPresence.paragraphs.includes(src.paragraph)) {
          existingPresence.paragraphs.push(src.paragraph);
          existingPresence.paragraphs.sort((a, b) => a - b);
        }
      } else {
        existing.push({ moveId: move.id, paragraphs: [src.paragraph] });
      }
      index.set(src.essayId, existing);
    }
  }

  for (const [essay, moveList] of index) {
    moveList.sort((a, b) => a.moveId.localeCompare(b.moveId));
    index.set(essay, moveList);
  }

  return index;
}

// ─────────────────────────────────────────────────────────────────────────
// Step 2: Build detailed archetype-membership index per move
//
// For each move, record: which archetypes it's load-bearing in, which stages
// of which archetypes it's in as required, which as optional. This is the
// data that drives archetypeScore.
// ─────────────────────────────────────────────────────────────────────────

interface MoveArchetypeMembership {
  archetypeId: string;
  isLoadBearing: boolean;
  /** IDs of stages where this move is in requiredMoveIds. */
  inRequiredStages: string[];
  /** IDs of stages where this move is in optionalMoveIds. */
  inOptionalStages: string[];
}

function buildArchetypeMembershipIndex(): Map<string, MoveArchetypeMembership[]> {
  const index = new Map<string, MoveArchetypeMembership[]>();
  const sortedArchetypes = [...ESSAY_ARCHETYPES].sort((a, b) => a.id.localeCompare(b.id));

  for (const arch of sortedArchetypes) {
    // Skip reserved archetypes — no data to contribute
    if (arch.provenance === 'pending-hopkins-reviews') continue;

    // Gather all move IDs appearing anywhere in this archetype
    const allMoveIds = new Set<string>();
    for (const id of arch.loadBearingMoveIds) allMoveIds.add(id);
    for (const stage of arch.structuralStages) {
      for (const id of stage.requiredMoveIds) {
        if (!id.endsWith('-OPTIONAL')) allMoveIds.add(id);
      }
      for (const id of stage.optionalMoveIds) {
        if (!id.endsWith('-OPTIONAL')) allMoveIds.add(id);
      }
    }

    for (const moveId of allMoveIds) {
      const membership: MoveArchetypeMembership = {
        archetypeId: arch.id,
        isLoadBearing: arch.loadBearingMoveIds.includes(moveId),
        inRequiredStages: [],
        inOptionalStages: [],
      };
      for (const stage of arch.structuralStages) {
        if (stage.requiredMoveIds.includes(moveId)) {
          membership.inRequiredStages.push(stage.stageName);
        }
        if (stage.optionalMoveIds.includes(moveId)) {
          membership.inOptionalStages.push(stage.stageName);
        }
      }
      const existing = index.get(moveId) ?? [];
      existing.push(membership);
      index.set(moveId, existing);
    }
  }

  // Sort each move's archetype list for determinism
  for (const [moveId, memberships] of index) {
    memberships.sort((a, b) => a.archetypeId.localeCompare(b.archetypeId));
    index.set(moveId, memberships);
  }

  return index;
}

// ─────────────────────────────────────────────────────────────────────────
// Step 3: Scoring functions
// ─────────────────────────────────────────────────────────────────────────

/**
 * Compute archetype-cluster score for a move pair (0-5).
 * Takes MAX across all shared archetypes (best overlap wins).
 */
function computeArchetypeScore(
  membershipsA: MoveArchetypeMembership[],
  membershipsB: MoveArchetypeMembership[],
): { score: number; sharedArchetypes: string[] } {
  let maxScore = 0;
  const sharedSet = new Set<string>();

  const byArchetypeA = new Map(membershipsA.map((m) => [m.archetypeId, m]));

  for (const memB of membershipsB) {
    const memA = byArchetypeA.get(memB.archetypeId);
    if (!memA) continue;

    sharedSet.add(memB.archetypeId);

    // Same stage required-membership for BOTH → 5
    const sharedRequiredStage = memA.inRequiredStages.some((s) =>
      memB.inRequiredStages.includes(s),
    );

    // Both load-bearing in this archetype → 5
    if (memA.isLoadBearing && memB.isLoadBearing) {
      maxScore = Math.max(maxScore, 5);
      continue;
    }
    if (sharedRequiredStage) {
      maxScore = Math.max(maxScore, 5);
      continue;
    }
    // One load-bearing, other in required stage of same archetype → 4
    const aStronger = memA.isLoadBearing || memA.inRequiredStages.length > 0;
    const bStronger = memB.isLoadBearing || memB.inRequiredStages.length > 0;
    if (aStronger && bStronger) {
      maxScore = Math.max(maxScore, 4);
      continue;
    }
    // Both appear in same archetype (at least one in optional or similar) → 2
    maxScore = Math.max(maxScore, 2);
  }

  const sharedArchetypes = [...sharedSet].sort();
  return { score: maxScore, sharedArchetypes };
}

/** Compute attestation score (0-3) based on essay count. */
function computeAttestationScore(attestingEssayCount: number): number {
  if (attestingEssayCount >= 4) return 3;
  if (attestingEssayCount === 3) return 2;
  if (attestingEssayCount === 2) return 1;
  return 0;
}

/** Compute proximity score (0-2) from minimum paragraph distance observed. */
function computeProximityScore(minDistance: number): number {
  if (minDistance === 0) return 2;
  if (minDistance <= 2) return 1;
  return 0;
}

function tierFromScore(totalScore: number, archetypeScore: number): 'strong-correlation' | 'suggested-pairing' | null {
  if (totalScore >= STRONG_TIER_TOTAL_THRESHOLD || archetypeScore >= STRONG_TIER_ARCHETYPE_AUTO_PROMOTE) {
    return 'strong-correlation';
  }
  if (totalScore >= TOTAL_SCORE_DROP_THRESHOLD) {
    return 'suggested-pairing';
  }
  return null;
}

// ─────────────────────────────────────────────────────────────────────────
// Step 4: Compute correlations for every move pair
// ─────────────────────────────────────────────────────────────────────────

function computeMinParagraphDistance(aParagraphs: number[], bParagraphs: number[]): number {
  let min = Number.POSITIVE_INFINITY;
  for (const a of aParagraphs) {
    for (const b of bParagraphs) {
      const d = Math.abs(a - b);
      if (d < min) min = d;
    }
  }
  return min === Number.POSITIVE_INFINITY ? -1 : min;
}

function computeCorrelations(
  moves: CraftMove[],
  essayIndex: Map<CorpusEssayId, EssayMovePresence[]>,
  membershipIndex: Map<string, MoveArchetypeMembership[]>,
): DerivedCorrelation[] {
  const correlations: DerivedCorrelation[] = [];
  const sortedMoveIds = moves.map((m) => m.id).sort();

  for (let i = 0; i < sortedMoveIds.length; i++) {
    for (let j = i + 1; j < sortedMoveIds.length; j++) {
      const idA = sortedMoveIds[i];
      const idB = sortedMoveIds[j];

      // Archetype score (works even for pairs with no co-occurrence)
      const membershipsA = membershipIndex.get(idA) ?? [];
      const membershipsB = membershipIndex.get(idB) ?? [];
      const { score: archetypeScore, sharedArchetypes } = computeArchetypeScore(
        membershipsA,
        membershipsB,
      );

      // Co-occurrence evidence (may be empty — that's fine)
      const coOccurrences: Array<{ essayId: CorpusEssayId; minParagraphDistance: number }> = [];
      let minDistanceAnywhere = Number.POSITIVE_INFINITY;

      for (const [essayId, moveList] of essayIndex) {
        const aPresence = moveList.find((p) => p.moveId === idA);
        const bPresence = moveList.find((p) => p.moveId === idB);
        if (!aPresence || !bPresence) continue;
        const dist = computeMinParagraphDistance(aPresence.paragraphs, bPresence.paragraphs);
        coOccurrences.push({ essayId, minParagraphDistance: dist });
        if (dist >= 0 && dist < minDistanceAnywhere) minDistanceAnywhere = dist;
      }
      coOccurrences.sort((a, b) => a.essayId.localeCompare(b.essayId));

      const attestingEssays: CorpusEssayId[] = coOccurrences.map((c) => c.essayId);
      const attestationScore = computeAttestationScore(attestingEssays.length);
      const proximityScore =
        minDistanceAnywhere === Number.POSITIVE_INFINITY
          ? 0
          : computeProximityScore(minDistanceAnywhere);

      const totalScore = Math.min(archetypeScore + attestationScore + proximityScore, 10);

      const tier = tierFromScore(totalScore, archetypeScore);
      if (tier === null) continue;

      correlations.push({
        moveIdA: idA,
        moveIdB: idB,
        coOccurrences,
        sharedArchetypes,
        attestingEssays,
        archetypeScore,
        attestationScore,
        proximityScore,
        totalScore,
        tier,
      });
    }
  }

  correlations.sort((a, b) => {
    return a.moveIdA.localeCompare(b.moveIdA) || a.moveIdB.localeCompare(b.moveIdB);
  });

  return correlations;
}

// ─────────────────────────────────────────────────────────────────────────
// Step 5: Build per-move retrieval index (sorted by totalScore DESC)
// ─────────────────────────────────────────────────────────────────────────

function buildPerMoveIndex(
  correlations: DerivedCorrelation[],
  allMoveIds: string[],
): PerMoveCorrelationIndex['byMove'] {
  const byMove: PerMoveCorrelationIndex['byMove'] = {};

  for (const moveId of [...allMoveIds].sort()) {
    byMove[moveId] = { strongCorrelations: [], suggestedCorrelations: [] };
  }

  for (const corr of correlations) {
    const entryForA = {
      moveId: corr.moveIdB,
      totalScore: corr.totalScore,
      archetypeScore: corr.archetypeScore,
      attestationScore: corr.attestationScore,
      proximityScore: corr.proximityScore,
      sharedArchetypes: corr.sharedArchetypes,
      attestingEssayCount: corr.attestingEssays.length,
    };
    const entryForB = {
      moveId: corr.moveIdA,
      totalScore: corr.totalScore,
      archetypeScore: corr.archetypeScore,
      attestationScore: corr.attestationScore,
      proximityScore: corr.proximityScore,
      sharedArchetypes: corr.sharedArchetypes,
      attestingEssayCount: corr.attestingEssays.length,
    };

    const bucketForA = corr.tier === 'strong-correlation' ? 'strongCorrelations' : 'suggestedCorrelations';
    byMove[corr.moveIdA][bucketForA].push(entryForA);
    byMove[corr.moveIdB][bucketForA].push(entryForB);
  }

  // Sort each move's arrays: totalScore DESC, archetypeScore DESC, moveId ASC
  const sortFn = (a: typeof byMove[string]['strongCorrelations'][0], b: typeof a) => {
    if (a.totalScore !== b.totalScore) return b.totalScore - a.totalScore;
    if (a.archetypeScore !== b.archetypeScore) return b.archetypeScore - a.archetypeScore;
    return a.moveId.localeCompare(b.moveId);
  };
  for (const key of Object.keys(byMove)) {
    byMove[key].strongCorrelations.sort(sortFn);
    byMove[key].suggestedCorrelations.sort(sortFn);
  }

  return byMove;
}

// ─────────────────────────────────────────────────────────────────────────
// Step 6: Hash inputs, compose artifacts, write
// ─────────────────────────────────────────────────────────────────────────

function computeSourceHash(moves: CraftMove[], archetypes: EssayArchetype[]): string {
  const sortedMoveIds = moves.map((m) => m.id).sort();
  const payload = sortedMoveIds
    .map((id) => {
      const m = moves.find((x) => x.id === id)!;
      const srcs = m.sourceEssays.map((s) => `${s.essayId}:${s.paragraph}`).sort().join(',');
      return `${id}|${srcs}`;
    })
    .join('\n');

  const archSig = [...archetypes]
    .sort((a, b) => a.id.localeCompare(b.id))
    .map((a) => {
      const stageData = a.structuralStages
        .map((s) => `${s.stageName}:req=${[...s.requiredMoveIds].sort().join('/')}|opt=${[...s.optionalMoveIds].sort().join('/')}`)
        .join(';');
      return `${a.id}|load=${[...a.loadBearingMoveIds].sort().join(',')}|stages=${stageData}`;
    })
    .join('\n');

  return createHash('sha256').update(`${payload}\n---\n${archSig}`).digest('hex');
}

function main(): void {
  console.log('[deriveCorrelations] v2 — reading corpus...');

  const essayIndex = buildPerEssayMoveIndex(TOP_TIER_CRAFT_MOVES);
  console.log(`[deriveCorrelations] essay index: ${essayIndex.size} essays`);

  const membershipIndex = buildArchetypeMembershipIndex();
  console.log(`[deriveCorrelations] archetype membership index: ${membershipIndex.size} moves`);

  const correlations = computeCorrelations(TOP_TIER_CRAFT_MOVES, essayIndex, membershipIndex);

  const strongCount = correlations.filter((c) => c.tier === 'strong-correlation').length;
  const suggestedCount = correlations.filter((c) => c.tier === 'suggested-pairing').length;

  // Distribution diagnostic
  const byTotalScore = new Map<number, number>();
  for (const c of correlations) {
    byTotalScore.set(c.totalScore, (byTotalScore.get(c.totalScore) ?? 0) + 1);
  }
  const distLine = [...byTotalScore.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([score, count]) => `s${score}=${count}`)
    .join(' ');

  console.log(`[deriveCorrelations] ${correlations.length} correlations (strong=${strongCount}, suggested=${suggestedCount})`);
  console.log(`[deriveCorrelations] score distribution: ${distLine}`);

  const sourceHash = computeSourceHash(TOP_TIER_CRAFT_MOVES, [...ESSAY_ARCHETYPES]);
  const derivedAt = new Date().toISOString();

  const primaryArtifact: DerivedCorrelationsArtifact = {
    sourceHash,
    derivedAt,
    scriptVersion: SCRIPT_VERSION,
    correlations,
    stats: {
      totalPairsConsidered:
        (TOP_TIER_CRAFT_MOVES.length * (TOP_TIER_CRAFT_MOVES.length - 1)) / 2,
      correlationsAboveThreshold: correlations.length,
      strongCorrelations: strongCount,
      suggestedPairings: suggestedCount,
    },
  };

  const perMoveIndex = buildPerMoveIndex(
    correlations,
    TOP_TIER_CRAFT_MOVES.map((m) => m.id),
  );

  const retrievalArtifact: PerMoveCorrelationIndex = {
    sourceHash,
    derivedAt,
    scriptVersion: SCRIPT_VERSION,
    byMove: perMoveIndex,
  };

  const outputDir = join(__dirname, '..', '..', 'src', 'services', 'essayIntelligence', 'corpus');
  const primaryPath = join(outputDir, 'derivedCorrelations.json');
  const retrievalPath = join(outputDir, 'derivedCorrelationsByMove.json');

  writeFileSync(primaryPath, JSON.stringify(primaryArtifact, null, 2) + '\n', 'utf-8');
  writeFileSync(retrievalPath, JSON.stringify(retrievalArtifact, null, 2) + '\n', 'utf-8');

  console.log(`[deriveCorrelations] wrote ${primaryPath}`);
  console.log(`[deriveCorrelations] wrote ${retrievalPath}`);
  console.log(`[deriveCorrelations] sourceHash: ${sourceHash.slice(0, 16)}...`);
}

main();
