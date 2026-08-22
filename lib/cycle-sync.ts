import { getCachedAuthUser } from "./auth-session";
import { supabaseClient } from "./supabase";
import type { CycleProfile, LogEntry } from "../hooks/use-cycle-store";

type DayRecord = {
  period?: boolean;
  moods?: string[];
  symptoms?: string[];
};

// 1. We added moods and symptoms to the expected Supabase response
type SupabaseRow = {
  log_date: string;
  source: string | null;
  moods: string[] | null;
  symptoms: string[] | null;
};

const HEALTH_ID_TO_KEY: Record<number, string> = {
  1: "pcos",
  2: "endometriosis",
  3: "fibroids",
  4: "thyroid",
  5: "none",
};

const MEDICATION_ID_TO_KEY: Record<number, string> = {
  1: "birth_control",
  2: "hormonal",
  3: "painkillers",
  4: "none",
};

const SYMPTOM_ID_TO_KEY: Record<number, string> = {
  1: "cramps",
  2: "bloating",
  3: "breast",
  4: "backpain",
  5: "acne",
  6: "headaches",
};

const MOOD_ID_TO_KEY: Record<number, string> = {
  1: "anxiety",
  2: "irritability",
  3: "lowmood",
  4: "fatigue",
  5: "nochange",
};

const FOOD_ID_TO_KEY: Record<number, string> = {
  1: "sweet",
  2: "salty",
  3: "savory",
  4: "spicy",
};

const decodeRowSource = (source: string | null) => {
  if (!source) return { period: true } as DayRecord;
  if (source === "manual" || source === "period") return { period: true };

  try {
    const parsed = JSON.parse(source) as DayRecord;
    return parsed;
  } catch {
    return { period: source.includes("period") };
  }
};

const buildStoredRows = (
  periodDates: Record<string, true>,
  logs: Record<string, LogEntry>,
) => {
  const rows = new Map<string, DayRecord>();

  Object.keys(periodDates).forEach((dateKey) => {
    rows.set(dateKey, { period: true });
  });

  Object.entries(logs).forEach(([dateKey, entry]) => {
    rows.set(dateKey, {
      ...(rows.get(dateKey) ?? {}),
      moods: entry.moods,
      symptoms: entry.symptoms,
    });
  });

  // 2. We send "manual" to keep the Bouncer happy, and send the moods/symptoms
  // directly to your brand new columns!
  return Array.from(rows.entries()).map(([log_date, record]) => ({
    log_date,
    source: "manual",
    moods: record.moods ?? [],
    symptoms: record.symptoms ?? [],
  }));
};

const safeAuthUserId = async () => {
  const user = await getCachedAuthUser();
  return user?.id ?? null;
};

export async function loadCycleSnapshot() {
  const userId = await safeAuthUserId();
  if (!userId) {
    return {
      nickname: "",
      profile: {},
      periodDates: {} as Record<string, true>,
      logs: {} as Record<string, LogEntry>,
    };
  }

  // 3. We explicitly ask Supabase to return the new moods and symptoms columns
  const [
    profileResult,
    periodResult,
    healthResult,
    medicationResult,
    symptomResult,
    moodResult,
    foodResult,
  ] = await Promise.all([
    supabaseClient
      .from("profiles")
      .select(
        "nickname,birthday,cycle_regularity,cycle_length,typical_flow,medical_checkups",
      )
      .eq("id", userId)
      .maybeSingle(),
    supabaseClient
      .from("period_logs")
      .select("log_date,source,moods,symptoms")
      .eq("user_id", userId),
    supabaseClient
      .from("profile_health_history")
      .select("item_id")
      .eq("user_id", userId),
    supabaseClient
      .from("profile_medications")
      .select("item_id")
      .eq("user_id", userId),
    supabaseClient
      .from("profile_symptoms")
      .select("item_id")
      .eq("user_id", userId),
    supabaseClient
      .from("profile_moods")
      .select("item_id")
      .eq("user_id", userId),
    supabaseClient
      .from("profile_comfort_food")
      .select("item_id")
      .eq("user_id", userId),
  ]);

  const periodDates: Record<string, true> = {};
  const logs: Record<string, LogEntry> = {};

  (periodResult.data ?? []).forEach((row: SupabaseRow) => {
    const decoded = decodeRowSource(row.source);
    if (decoded.period) {
      periodDates[row.log_date] = true;
    }

    // 4. We pull from the new columns directly!
    const rowMoods = row.moods ?? [];
    const rowSymptoms = row.symptoms ?? [];

    // We keep the 'decoded' fallback just in case you have old historical data
    const finalMoods = rowMoods.length ? rowMoods : (decoded.moods ?? []);
    const finalSymptoms = rowSymptoms.length
      ? rowSymptoms
      : (decoded.symptoms ?? []);

    if (finalMoods.length || finalSymptoms.length) {
      logs[row.log_date] = {
        moods: finalMoods,
        symptoms: finalSymptoms,
      };
    }
  });

  const profile = {
    birthday: profileResult.data?.birthday ?? "",
    cycleRegularity: profileResult.data?.cycle_regularity ?? null,
    healthHistory: (healthResult.data ?? [])
      .map((row) => HEALTH_ID_TO_KEY[row.item_id as number])
      .filter(Boolean),
    medicalCheckups: profileResult.data?.medical_checkups ?? null,
    medications: (medicationResult.data ?? [])
      .map((row) => MEDICATION_ID_TO_KEY[row.item_id as number])
      .filter(Boolean),
    typicalFlow: profileResult.data?.typical_flow ?? null,
    symptoms: (symptomResult.data ?? [])
      .map((row) => SYMPTOM_ID_TO_KEY[row.item_id as number])
      .filter(Boolean),
    moods: (moodResult.data ?? [])
      .map((row) => MOOD_ID_TO_KEY[row.item_id as number])
      .filter(Boolean),
    comfortFood: (foodResult.data ?? [])
      .map((row) => FOOD_ID_TO_KEY[row.item_id as number])
      .filter(Boolean),
    cycleLength: Number(profileResult.data?.cycle_length) || 28,
  } as Partial<CycleProfile>;

  return {
    nickname: profileResult.data?.nickname ?? "",
    profile,
    periodDates,
    logs,
  };
}

export async function saveCycleSnapshot(
  periodDates: Record<string, true>,
  logs: Record<string, LogEntry>,
) {
  const userId = await safeAuthUserId();
  if (!userId) return; // Silent fail if not logged in

  const rows = buildStoredRows(periodDates, logs);
  const { data: existingRows, error: loadError } = await supabaseClient
    .from("period_logs")
    .select("log_date")
    .eq("user_id", userId);

  if (loadError) {
    console.error("Failed to read period logs before save:", loadError.message);
    return;
  }

  // 5. We map the data straight into your new columns!
  const { error: upsertError } = rows.length
    ? await supabaseClient.from("period_logs").upsert(
        rows.map((row) => ({
          user_id: userId,
          log_date: row.log_date,
          source: row.source,
          moods: row.moods,
          symptoms: row.symptoms,
        })),
        { onConflict: "user_id,log_date" },
      )
    : { error: null };

  if (upsertError) {
    console.error("Failed to save period logs:", upsertError.message);
    return;
  }

  const currentKeys = new Set(rows.map((row) => row.log_date));
  const staleKeys = (existingRows ?? [])
    .map((row) => row.log_date)
    .filter((logDate) => !currentKeys.has(logDate));

  if (!staleKeys.length) return;

  const { error: deleteError } = await supabaseClient
    .from("period_logs")
    .delete()
    .eq("user_id", userId)
    .in("log_date", staleKeys);

  if (deleteError) {
    console.error("Failed to prune stale period logs:", deleteError.message);
  }
}

export const trackerLookupIds = {};
