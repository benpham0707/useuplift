import { supabase } from "@/integrations/supabase/safeClient";
import { apiFetch } from "@/lib/utils";

export async function createExperience(payload: any) {
  const session = await supabase.auth.getSession();
  const token = session.data.session?.access_token;
  const res = await apiFetch("/api/v1/experiences", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    credentials: "include",
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Failed to create experience");
  return res.json();
}

export async function listExperiences() {
  const session = await supabase.auth.getSession();
  const token = session.data.session?.access_token;
  const res = await apiFetch("/api/v1/experiences", {
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    credentials: "include",
  });
  if (!res.ok) throw new Error("Failed to load experiences");
  return res.json() as Promise<{ items: Array<{ id: string; type: string }> }>;
}

export function computeExpProgress(items: { type: string }[]) {
  const categories = new Set(items.map((i) => i.type));
  const covered = ["work", "volunteer", "school_activity", "project"].filter((c) =>
    categories.has(c)
  ).length;
  return covered * 25;
}


