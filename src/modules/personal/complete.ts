import type { Request, Response, NextFunction } from "express";
import { supabaseAdmin } from "@/supabase/admin";
import { PersonalCompleteSchema } from "@/schemas/personal";

export async function completePersonal(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = (req as any).auth?.userId as string | undefined;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const input = PersonalCompleteSchema.parse(req.body);

    // Load profile
    const { data: prof, error: pErr } = await supabaseAdmin
      .from("profiles")
      .select("id, demographics, completion_details, completion_score")
      .eq("user_id", userId)
      .single();
    if (pErr || !prof) throw pErr || new Error("profile_not_found");

    // Merge demographics with new structure
    const demographics = {
      ...(prof.demographics as any ?? {}),
      personalInfo: {
        basicInfo: input.basicInfo,
        demographics: input.demographics,
        familyContext: input.familyContext,
        communications: input.communications,
      }
    } as any;

    // Bump completion
    const details = (prof.completion_details as any) ?? { overall: 0, sections: { basic: 0, goals: 0, academic: 0, enrichment: 0, experience: 0 } };
    const nextDetails = { ...details, sections: { ...details.sections, basic: 1 } };
    const nextScore = Math.max(Number(prof.completion_score ?? 0), 0.6);

    const { error: uErr } = await supabaseAdmin
      .from("profiles")
      .update({ demographics, completion_details: nextDetails, completion_score: nextScore })
      .eq("id", prof.id);
    if (uErr) throw uErr;

    // Event logging removed for current schema
    
    res.json({ ok: true, profileId: prof.id });
  } catch (e) {
    next(e);
  }
}

async function currentGradeOrDefault(profileId: string) {
  // Academic records functionality removed - using academic_journey table
  // const { data } = await supabaseAdmin
  //   .from("academic_records")
  //   .select("current_grade")
  //   .eq("profile_id", profileId)
  //   .maybeSingle();
  // return data?.current_grade ?? null;
  return null;
}



