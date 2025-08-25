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

    // Map wizard payload to normalized personal_information table
    const basic = input.basicInfo;
    const demo = input.demographics;
    const fam = input.familyContext;

    const formerNames = (basic.formerLegalNames || "")
      .split(/[,;\n]/)
      .map(s => s.trim())
      .filter(Boolean);

    const genderIdentity: string | null =
      basic.genderIdentity === "self-describe"
        ? (basic.genderSelfDescribe || "self-describe")
        : basic.genderIdentity;

    const pronouns: string | null =
      basic.pronouns === "other"
        ? (basic.pronounsSelfDescribe || "other")
        : basic.pronouns;

    const raceEthnicity: string[] = (() => {
      const values = [...(demo.raceEthnicity || [])];
      if (values.includes("other") && demo.raceOther) {
        values.push(`other:${demo.raceOther}`);
      }
      return values as string[];
    })();

    const hispanicBackground: string | null = demo.hispanicLatino === "yes"
      ? (demo.hispanicBackground === "other"
          ? (demo.hispanicOther || "other")
          : demo.hispanicBackground || null)
      : null;

    const livingSituation: string | null = fam.livingSituation === "other"
      ? (fam.livingSituationOther ? `other:${fam.livingSituationOther}` : "other")
      : fam.livingSituation;

    const parentGuardians = [
      fam.parent1 ? {
        relationship: fam.parent1.relationship,
        education_level: fam.parent1.educationLevel,
        occupation_category: fam.parent1.occupationCategory,
        contact_email: fam.parent1.contactEmail || null,
        contact_phone: fam.parent1.contactPhone || null,
      } : null,
      fam.parent2 ? {
        relationship: fam.parent2.relationship || null,
        education_level: fam.parent2.educationLevel || null,
        occupation_category: fam.parent2.occupationCategory || null,
        contact_email: fam.parent2.contactEmail || null,
        contact_phone: fam.parent2.contactPhone || null,
      } : null,
    ].filter(Boolean);

    const siblings = (fam.numberOfSiblings != null || fam.siblingsEducation)
      ? {
          count: fam.numberOfSiblings ?? null,
          education_summary: fam.siblingsEducation || null,
        }
      : null;

    const firstGen: boolean | null = fam.firstGenerationStatus === "yes"
      ? true
      : fam.firstGenerationStatus === "no"
        ? false
        : null;

    const personalInfoRow: any = {
      profile_id: prof.id,
      first_name: basic.legalFirstName,
      last_name: basic.legalLastName,
      preferred_name: basic.preferredName || null,
      date_of_birth: basic.dateOfBirth || null,
      primary_email: basic.primaryEmail || null,
      primary_phone: basic.primaryPhone || null,
      secondary_phone: basic.secondaryPhone || null,
      pronouns,
      gender_identity: genderIdentity,
      permanent_address: basic.permanentAddress || null,
      alternate_address: basic.alternateAddress || null,
      place_of_birth: basic.placeOfBirth || null,
      hispanic_latino: demo.hispanicLatino,
      hispanic_background: hispanicBackground,
      race_ethnicity: raceEthnicity,
      citizenship_status: demo.citizenshipStatus,
      primary_language: demo.primaryLanguageHome,
      other_languages: demo.otherLanguages || [],
      years_in_us: demo.yearsInUS ?? null,
      former_names: formerNames,
      living_situation: livingSituation,
      household_size: demo.householdSize,
      household_income: demo.householdIncome,
      parent_guardians: parentGuardians,
      siblings,
      first_gen: firstGen,
    };

    // Upsert into personal_information (update if exists, else insert)
    const { data: existingPI, error: piFetchErr } = await supabaseAdmin
      .from("personal_information")
      .select("id")
      .eq("profile_id", prof.id)
      .maybeSingle();
    if (piFetchErr) throw piFetchErr;

    if (existingPI?.id) {
      const { error: piUpdateErr } = await supabaseAdmin
        .from("personal_information")
        .update(personalInfoRow)
        .eq("id", existingPI.id as string);
      if (piUpdateErr) throw piUpdateErr;
    } else {
      const { error: piInsertErr } = await supabaseAdmin
        .from("personal_information")
        .insert(personalInfoRow);
      if (piInsertErr) throw piInsertErr;
    }

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



