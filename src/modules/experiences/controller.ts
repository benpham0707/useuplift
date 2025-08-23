import type { Request, Response, NextFunction } from "express";
import { supabaseAdmin } from "@/supabase/admin";
import { CreateExperienceSchema } from "@/schemas/experience";
import { randomUUID } from "crypto";
import { z } from "zod";

export const create = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).auth?.userId as string | undefined;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const input = CreateExperienceSchema.parse(req.body);

    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles").select("id").eq("user_id", userId).single();
    if (profileError || !profile) throw profileError || new Error("Profile not found");

    const expId = randomUUID();

    const { error: insertError } = await supabaseAdmin.from("experiences").insert({
      id: expId,
      profile_id: profile.id,
      title: input.title,
      organization: input.organization,
      type: input.category,
      start_date: input.startDate,
      end_date: input.endDate ?? null,
      is_ongoing: input.isOngoing ?? false,
      time_commitment: input.timeCommitment,
      total_hours: input.totalHours ?? null,
      description: input.description,
      responsibilities: input.responsibilities ?? [],
      achievements: input.achievements ?? [],
      challenges: input.challenges ?? [],
      metrics: input.metrics ?? {},
      skills_demonstrated: (input.skills ?? []).map((name) => ({ name })),
      verification_url: input.verificationUrl || null,
      supervisor_name: input.supervisorName || null,
      can_contact: input.canContact ?? false,
    });
    if (insertError) throw insertError;

    if (input.skills?.length) {
      const rows = input.skills.map((skill) => ({
        profile_id: profile.id,
        skill,
        category: "soft",
        confidence: 0.6,
        source_type: "experience",
        source_id: expId,
      }));
      await supabaseAdmin.from("profile_skills").insert(rows);
    }

    await supabaseAdmin.from("profile_events").insert({
      profile_id: profile.id,
      event_type: "experience_added",
      event_data: { experienceId: expId, category: input.category },
    });

    return res.json({ ok: true, id: expId });
  } catch (e) {
    return next(e);
  }
};

export const list = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).auth?.userId as string | undefined;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles").select("id").eq("user_id", userId).single();
    if (profileError || !profile) throw profileError || new Error("Profile not found");

    const { data, error } = await supabaseAdmin
      .from("experiences")
      .select("id, type, title, organization, start_date, end_date, is_ongoing, total_hours")
      .eq("profile_id", profile.id)
      .order("start_date", { ascending: false });
    if (error) throw error;

    return res.json({ items: data ?? [] });
  } catch (e) {
    return next(e);
  }
};

export const update = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).auth?.userId as string | undefined;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });
    const expId = req.params.id;

    // Allow partial updates based on the create schema
    const partial = (CreateExperienceSchema as any).partial().parse(req.body) as Partial<z.infer<typeof CreateExperienceSchema>>;

    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles").select("id").eq("user_id", userId).single();
    if (profileError || !profile) throw profileError || new Error("Profile not found");

    const updateColumns: Record<string, any> = {};
    if (partial.category !== undefined) updateColumns.type = partial.category;
    if (partial.title !== undefined) updateColumns.title = partial.title;
    if (partial.organization !== undefined) updateColumns.organization = partial.organization;
    if (partial.startDate !== undefined) updateColumns.start_date = partial.startDate;
    if (partial.endDate !== undefined) updateColumns.end_date = partial.endDate;
    if (partial.isOngoing !== undefined) updateColumns.is_ongoing = partial.isOngoing;
    if (partial.timeCommitment !== undefined) updateColumns.time_commitment = partial.timeCommitment;
    if (partial.totalHours !== undefined) updateColumns.total_hours = partial.totalHours;
    if (partial.description !== undefined) updateColumns.description = partial.description;
    if (partial.responsibilities !== undefined) updateColumns.responsibilities = partial.responsibilities;
    if (partial.achievements !== undefined) updateColumns.achievements = partial.achievements;
    if (partial.challenges !== undefined) updateColumns.challenges = partial.challenges;
    if (partial.metrics !== undefined) updateColumns.metrics = partial.metrics;
    if (partial.skills !== undefined) updateColumns.skills_demonstrated = partial.skills.map((name) => ({ name }));
    if (partial.verificationUrl !== undefined) updateColumns.verification_url = partial.verificationUrl || null;
    if (partial.supervisorName !== undefined) updateColumns.supervisor_name = partial.supervisorName || null;
    if (partial.canContact !== undefined) updateColumns.can_contact = partial.canContact;

    if (Object.keys(updateColumns).length === 0) return res.json({ ok: true });

    const { error } = await supabaseAdmin
      .from("experiences")
      .update(updateColumns)
      .eq("id", expId)
      .eq("profile_id", profile.id);
    if (error) throw error;

    await supabaseAdmin.from("profile_events").insert({
      profile_id: profile.id,
      event_type: "experience_updated",
      event_data: { experienceId: expId, fields: Object.keys(updateColumns) },
    });

    return res.json({ ok: true, id: expId });
  } catch (e) {
    return next(e);
  }
};


