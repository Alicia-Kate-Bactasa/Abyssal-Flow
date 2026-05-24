import { supabaseClient } from "@/lib/supabase";

export type OnboardingPayload = {
  nickname: string;
  birthday: string; // ISO date string 'YYYY-MM-DD'
  periodDates: string[]; // ['YYYY-MM-DD', ...]
  cycleRegularity: "regular" | "irregular" | "unsure";
  cycleLength: number;
  typicalFlow: "light" | "medium" | "heavy" | "very_heavy";
  medicalCheckups: "regular" | "occasional" | "never" | "unsure";
  healthHistoryIds: number[]; // FK ids from lk_health_history
  medicationIds: number[];
  symptomIds: number[];
  moodIds: number[];
  comfortFoodIds: number[];
};

export async function submitOnboarding(
  payload: OnboardingPayload,
): Promise<void> {
  console.log(
    "PAYLOAD BEING SENT TO SUPABASE:",
    JSON.stringify(payload, null, 2),
  );
  // 1 — Resolve the current user. Session is guaranteed active at this point.
  const {
    data: { user },
    error: userErr,
  } = await supabaseClient.auth.getUser();
  if (userErr || !user) throw new Error("Not authenticated");
  const uid = user.id;

  // ── 2: Update scalar fields on the profiles row ──────────────────────────
  const { error: profileErr } = await supabaseClient
    .from("profiles")
    .update({
      nickname: payload.nickname,
      birthday: payload.birthday,
      cycle_regularity: payload.cycleRegularity,
      cycle_length: payload.cycleLength,
      typical_flow: payload.typicalFlow,
      medical_checkups: payload.medicalCheckups,
      onboarding_done: true,
      updated_at: new Date().toISOString(),
    })
    .eq("id", uid);
  if (profileErr) throw profileErr;

  // ── 3: Insert period_cycles (The Clean Method) ───────────────────
  if (payload.periodDates.length > 0) {
    const DAY_MS = 1000 * 60 * 60 * 24;

    function groupDatesToCycles(dates: string[]) {
      const sorted = [...dates].sort();
      const cycles: { start_date: string; end_date: string }[] = [];
      if (!sorted.length) return cycles;

      let curStart = sorted[0];
      let curEnd = sorted[0];

      for (let i = 1; i < sorted.length; i++) {
        const prev = new Date(curEnd);
        const next = new Date(sorted[i]);
        const diff = Math.round((next.getTime() - prev.getTime()) / DAY_MS);
        if (diff === 1) {
          curEnd = sorted[i];
        } else {
          cycles.push({ start_date: curStart, end_date: curEnd });
          curStart = sorted[i];
          curEnd = sorted[i];
        }
      }
      cycles.push({ start_date: curStart, end_date: curEnd });
      return cycles;
    }

    const cycles = groupDatesToCycles(payload.periodDates);

    // Delete existing cycles for this user and insert the new set
    const { error: delErr } = await supabaseClient
      .from("period_cycles")
      .delete()
      .eq("user_id", uid);
    if (delErr) throw delErr;

    if (cycles.length) {
      const insertRows = cycles.map((c) => ({
        user_id: uid,
        start_date: c.start_date,
        end_date: c.end_date,
      }));

      const { error: insErr } = await supabaseClient
        .from("period_cycles")
        .insert(insertRows);
      if (insErr) throw insErr;
    }
  }

  // ── 4: Upsert join-table rows for all multi-selects ──────────────────────
  async function replaceJoinRows(table: string, ids: number[]) {
    const { error: delErr } = await supabaseClient
      .from(table)
      .delete()
      .eq("user_id", uid);
    if (delErr) throw delErr;

    if (ids.length === 0) return;

    const { error: insErr } = await supabaseClient
      .from(table)
      .insert(ids.map((item_id) => ({ user_id: uid, item_id })));
    if (insErr) throw insErr;
  }

  await replaceJoinRows("profile_health_history", payload.healthHistoryIds);
  await replaceJoinRows("profile_medications", payload.medicationIds);
  await replaceJoinRows("profile_symptoms", payload.symptomIds);
  await replaceJoinRows("profile_moods", payload.moodIds);
  await replaceJoinRows("profile_comfort_food", payload.comfortFoodIds);
}
