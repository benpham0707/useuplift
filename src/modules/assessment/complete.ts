import type { Request, Response, NextFunction } from "express";
import { CompleteAssessmentSchema } from "@/schemas/assessment";
import { supabaseAdmin } from "@/supabase/admin";
import { randomUUID } from "crypto";

export async function completeAssessment(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = (req as any).auth?.userId as string | undefined;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const input = CompleteAssessmentSchema.parse(req.body);

    // 1) ensure profile
    const { data: prof, error: pErr } = await supabaseAdmin
      .from("profiles").select("id").eq("user_id", userId).maybeSingle();
    if (pErr) throw pErr;
    let profileId = prof?.id as string | undefined;
    if (!profileId) {
      const { data: created, error } = await supabaseAdmin
        .from("profiles")
        .insert({
          user_id: userId,
          user_context: "high_school_11th",
          status: "initial"
        })
        .select("id").single();
      if (error) throw error;
      profileId = created.id;
    }

    // Academic records functionality removed for current schema - using academic_journey table instead
    const gpaNum = parseGPA(input.gpa);
    const { error: aErr } = await supabaseAdmin.from("academic_journey").upsert({
      profile_id: profileId,
      current_grade: input.academicLevel,
      gpa: gpaNum ?? null
    }, { onConflict: "profile_id" });
    if (aErr) throw aErr;

    // 3) update profile goals/constraints + completion bump
    const goals = {
      primaryGoal: "exploring_options",
      desiredOutcomes: input.goals,
      timelineUrgency: "flexible"
    } as any;

    const constraints = {
      needsFinancialAid: ["high","moderate"].includes(input.financialBand),
      financialBand: input.financialBand,
      challenges: input.challenges
    } as any;

    const completion_details = {
      overall: 0.35,
      sections: { basic: 1, goals: 1, academic: 1, enrichment: 0, experience: 0 }
    } as any;

    const { error: uErr } = await supabaseAdmin.from("profiles").update({
      goals,
      constraints,
      completion_score: 0.35,
      completion_details
    }).eq("id", profileId);
    if (uErr) throw uErr;

    // Assessment sessions functionality removed for current schema
    // const sessionId = randomUUID();
    // const { error: sErr } = await supabaseAdmin.from("assessment_sessions").insert({
    //   id: sessionId,
    //   profile_id: profileId,
    //   session_type: "initial",
    //   total_questions: 5,
    //   questions_answered: 5,
    //   completion_rate: 1,
    //   responses: {
    //     academicLevel: input.academicLevel,
    //     gpa: input.gpa ?? null,
    //     goals: input.goals,
    //     challenges: input.challenges,
    //     financialBand: input.financialBand
    //   },
    //   insights: {}
    // });
    // if (sErr) throw sErr;

    // Event logging removed for current schema
    // await supabaseAdmin.from("profile_events").insert({
    //   profile_id: profileId,
    //   event_type: "assessment_completed",
    //   event_data: { sessionId, financialBand: input.financialBand }
    // });

    res.json({ ok: true, profileId });
  } catch (e) {
    next(e);
  }
}

function parseGPA(s?: string) {
  if (!s) return null as number | null;
  const cleaned = String(s).trim().toLowerCase();
  if (cleaned.includes("not")) return null;
  const pct = cleaned.endsWith("%");
  const num = Number(cleaned.replace(/[,%]/g, ""));
  if (Number.isNaN(num)) return null;
  if (pct) return +(Math.min(Math.max(num, 0), 100) / 25).toFixed(2);
  return +num.toFixed(2);
}



