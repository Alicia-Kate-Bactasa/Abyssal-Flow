import { supabaseClient } from "@/lib/supabase";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { loadCycleSnapshot, saveCycleSnapshot } from "../lib/cycle-sync";

export type LogEntry = {
  moods: string[];
  symptoms: string[];
};

export type CycleProfile = {
  nickname: string;
  birthday: string;
  cycleRegularity: string | null;
  healthHistory: string[];
  medicalCheckups: string | null;
  medications: string[];
  typicalFlow: string | null;
  symptoms: string[];
  moods: string[];
  comfortFood: string[];
  cycleLength: number;
};

type CycleDataContextValue = {
  periodDates: Record<string, true>;
  predictedDates: Record<string, true>;
  logs: Record<string, LogEntry>;
  profile: CycleProfile;
  togglePeriodDate: (date: Date) => void;
  replacePeriodDates: (dateKeys: string[]) => void;
  setPeriodDatesForMonth: (year: number, month: number, days: number[]) => void;
  recalcPredictions: (dates?: Record<string, true>) => void;
  logMoodSymptoms: (date: Date, moods: string[], symptoms: string[]) => void;
  updateProfile: (patch: Partial<CycleProfile>) => void;
  setCycleLength: (length: number) => void;
  getPeriodDaysForMonth: (year: number, month: number) => number[];
  getPredictedDaysForMonth: (year: number, month: number) => number[];
  getLogsForDate: (date: Date) => LogEntry | null;
  getLatestPeriodStart: () => Date | null;
  getCycleStats: () => {
    avgCycleLength: number;
    avgPeriodLength: number;
    cycleLength: number;
  };
  getSymptomFrequencyForMonth: (
    year: number,
    month: number,
  ) => { label: string; count: number }[];
  selectedLogDate: Date | null;
  setSelectedLogDate: (d: Date | null) => void;
  getSelectedLogDate: () => Date | null;
  logModalRequestCount: number;
  requestLogModal: () => void;
  predictedStarts: string[];
  missedPredictedStarts: Record<string, true>;
  isDateInMissedPredictedWindow: (date: Date) => boolean;
  resetStore: () => void;
  fetchRemoteCycles: () => Promise<void>;
  logNewCycle: (
    startDate: string | Date,
    endDate?: string | Date,
  ) => Promise<void>;
  daysLate: number;
  predictionStatus: string;
};

const CycleDataContext = createContext<CycleDataContextValue | null>(null);

const pad2 = (value: number) => String(value).padStart(2, "0");

export const formatDateKey = (date: Date) =>
  `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;

export const parseDateKey = (key: string) => {
  const [year, month, day] = key.split("-").map((part) => Number(part));
  return new Date(year, month - 1, day);
};

const isSameMonth = (date: Date, year: number, month: number) =>
  date.getFullYear() === year && date.getMonth() === month;

const sortDateKeys = (keys: string[]) =>
  [...keys].sort(
    (a, b) => parseDateKey(a).getTime() - parseDateKey(b).getTime(),
  );

/**
 * Groups period date-keys into contiguous "runs" (periods).
 * Gaps of <= MAX_WITHIN_PERIOD_GAP days are treated as the same period
 * (accounts for users forgetting to log a day mid-period).
 */
const MAX_WITHIN_PERIOD_GAP = 2; // days
export const buildPeriodRuns = (keys: string[]) => {
  const sorted = sortDateKeys(keys);
  const runs: string[][] = [];
  let current: string[] = [];

  for (const key of sorted) {
    if (!current.length) {
      current.push(key);
      continue;
    }
    const prev = parseDateKey(current[current.length - 1]);
    const next = parseDateKey(key);
    const diff = Math.round(
      (next.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24),
    );
    if (diff <= MAX_WITHIN_PERIOD_GAP) {
      current.push(key);
    } else {
      runs.push(current);
      current = [key];
    }
  }
  if (current.length) runs.push(current);
  return runs;
};

const defaultCycleLength = 28;
const defaultPeriodLength = 5;
const STORAGE_KEY = "@abyssal_cycle_data";

// WIDENED TO ACCEPT REALITY (14 to 60 days)
const isValidCycleInterval = (days: number) => days >= 14 && days <= 60;

const average = (values: number[]) =>
  Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);

/** Exponentially-weighted mean; more recent intervals have higher weight. */
const weightedMean = (values: number[]) => {
  if (!values.length) return 0;
  let weightSum = 0;
  let total = 0;
  for (let i = 0; i < values.length; i++) {
    const v = values[i];
    // weight more recent values higher
    const w = Math.pow(0.6, values.length - 1 - i);
    total += v * w;
    weightSum += w;
  }
  return Math.round(total / weightSum);
};

const calculateCycleLength = (starts: Date[], baseLength: number) => {
  if (starts.length < 2) return baseLength;

  const intervals = starts
    .slice(1)
    .map((date, idx) =>
      Math.round(
        (date.getTime() - starts[idx].getTime()) / (1000 * 60 * 60 * 24),
      ),
    )
    .filter((days) => days > 0);

  const validIntervals = intervals.filter(isValidCycleInterval);
  if (!validIntervals.length) return baseLength;

  const recent = validIntervals.slice(-6);
  const estimate = weightedMean(recent);
  // ALLOW PREDICTIONS TO SHIFT DRASTICALLY (14 to 60 days)
  return Math.max(14, Math.min(60, estimate || baseLength));
};

const calculateStdDev = (values: number[], mean: number) => {
  if (!values.length) return 0;
  const variance =
    values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / values.length;
  return Math.sqrt(variance);
};

const getIntervalsFromStarts = (starts: Date[]) =>
  starts
    .slice(1)
    .map((date, idx) =>
      Math.round(
        (date.getTime() - starts[idx].getTime()) / (1000 * 60 * 60 * 24),
      ),
    )
    .filter((days) => days > 0);

const defaultProfile: CycleProfile = {
  nickname: "",
  birthday: "",
  cycleRegularity: null,
  healthHistory: [],
  medicalCheckups: null,
  medications: [],
  typicalFlow: null,
  symptoms: [],
  moods: [],
  comfortFood: [],
  cycleLength: defaultCycleLength,
};

export function CycleDataProvider({ children }: { children: React.ReactNode }) {
  const [periodDates, setPeriodDates] = useState<Record<string, true>>({});
  const [predictedDates, setPredictedDates] = useState<Record<string, true>>(
    {},
  );
  const [logs, setLogs] = useState<Record<string, LogEntry>>({});
  const [profile, setProfile] = useState<CycleProfile>(defaultProfile);
  const [hydrated, setHydrated] = useState(false);
  const [daysLate, setDaysLate] = useState<number>(0);
  const [predictionStatus, setPredictionStatus] = useState<string>("");
  const [predictedStarts, setPredictedStarts] = useState<string[]>([]);
  const [missedPredictedStarts, setMissedPredictedStarts] = useState<
    Record<string, true>
  >({});
  const [selectedLogDate, setSelectedLogDateState] = useState<Date | null>(
    null,
  );
  const [logModalRequestCount, setLogModalRequestCount] = useState(0);

  // Mirror periodDates in a ref so background async callbacks can read
  // the latest value without stale closures.
  const periodDatesRef = useRef<Record<string, true>>({});
  const localModifiedAtRef = useRef<number>(0);

  // Reset everything to defaults (clears in-memory and persisted snapshot)
  const resetStore = useCallback(() => {
    setPeriodDates({});
    setPredictedDates({});
    setLogs({});
    setProfile(defaultProfile);
    try {
      // best-effort clear persisted snapshot
      saveCycleSnapshot({}, {});
    } catch {
      // ignore
    }
  }, []);

  const setSelectedLogDate = useCallback((d: Date | null) => {
    if (!d) {
      setSelectedLogDateState((prev) => (prev === null ? prev : null));
      return;
    }
    const copy = new Date(d);
    copy.setHours(0, 0, 0, 0);
    setSelectedLogDateState((prev) => {
      if (prev && formatDateKey(prev) === formatDateKey(copy)) {
        return prev;
      }
      return copy;
    });
  }, []);

  const getSelectedLogDate = useCallback(
    () => (selectedLogDate ? new Date(selectedLogDate) : null),
    [selectedLogDate],
  );
  const requestLogModal = useCallback(() => {
    setLogModalRequestCount((count) => count + 1);
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const snapshot = await loadCycleSnapshot();
        if (snapshot.periodDates) setPeriodDates(snapshot.periodDates);
        if (snapshot.logs) setLogs(snapshot.logs);
        if (snapshot.profile)
          setProfile((prev) => ({ ...prev, ...snapshot.profile }));
        // No persistent localModifiedAt storage available here; use in-memory ref
        localModifiedAtRef.current = 0;
      } catch {
        // ignore storage errors and fall back to defaults
      } finally {
        setHydrated(true);
      }
    })();
  }, []);

  // fetchRemoteCycles moved below recalcPredictions to avoid TDZ

  // keep ref in sync with state for background tasks
  useEffect(() => {
    periodDatesRef.current = periodDates;
  }, [periodDates]);

  useEffect(() => {
    if (!hydrated) return;
    (async () => {
      try {
        await saveCycleSnapshot(periodDates, logs);
      } catch {
        // ignore storage errors
      }
    })();
  }, [hydrated, periodDates, logs]);

  // REWIRED TO INSTANTLY TRIGGER CLOUD SAVE AND MATH RECALCULATION
  const togglePeriodDate = useCallback(
    (date: Date) => {
      const key = formatDateKey(date);
      let updatedDates: Record<string, true> = {};

      setPeriodDates((prev) => {
        const next = { ...prev };
        if (next[key]) {
          delete next[key];
        } else {
          next[key] = true;
        }
        updatedDates = next;
        recalcPredictions(next); // 1. Instantly update math locally
        return next;
      });

      // 2. Instantly save the alteration to the cloud
      supabaseClient.auth.getUser().then(({ data }) => {
        if (data?.user) {
          syncPeriodDatesToServer(updatedDates, logs, data.user.id).catch(
            console.error,
          );
        }
      });
    },
    [logs],
  );

  // replacePeriodDates and setPeriodDatesForMonth implementations are
  // declared later (after recalcPredictions) to avoid referencing
  // recalcPredictions before its declaration.

  const getPeriodDaysForMonth = useCallback(
    (year: number, month: number) =>
      sortDateKeys(Object.keys(periodDates))
        .map(parseDateKey)
        .filter((date) => isSameMonth(date, year, month))
        .map((date) => date.getDate()),
    [periodDates],
  );

  const getPredictedDaysForMonth = useCallback(
    (year: number, month: number) =>
      sortDateKeys(Object.keys(predictedDates))
        .map(parseDateKey)
        .filter((date) => isSameMonth(date, year, month))
        .map((date) => date.getDate()),
    [predictedDates],
  );

  /**
   * Recompute predictions from an authoritative set of period dates.
   * Pass `dates` explicitly when calling right after a state update to avoid
   * reading stale closed-over state (React state updates are async).
   */
  const recalcPredictions = useCallback(
    (dates?: Record<string, true>) => {
      const activeDates = dates ?? periodDates;
      const periodKeys = Object.keys(activeDates);
      const runs = buildPeriodRuns(periodKeys);
      const starts = runs.map((run) => parseDateKey(run[0]));

      if (!starts.length) {
        setPredictedDates({});
        setPredictedStarts([]);
        setMissedPredictedStarts({});
        return;
      }

      const baseCycleLength = profile.cycleLength || defaultCycleLength;
      const diffs = getIntervalsFromStarts(starts);
      const validDiffs = diffs.filter(isValidCycleInterval);
      const targetCycleLength = calculateCycleLength(starts, baseCycleLength);

      // Avg period length: use contiguous logged days per run
      let avgPeriodLength = defaultPeriodLength;
      if (runs.length) {
        const runLengths = runs.map((run) => {
          const first = parseDateKey(run[0]);
          const last = parseDateKey(run[run.length - 1]);
          return (
            Math.round(
              (last.getTime() - first.getTime()) / (1000 * 60 * 60 * 24),
            ) + 1
          );
        });
        avgPeriodLength = Math.max(
          1,
          Math.round(runLengths.reduce((s, v) => s + v, 0) / runLengths.length),
        );
      }

      const stdDev = calculateStdDev(
        validDiffs.slice(-6),
        validDiffs.length ? average(validDiffs.slice(-6)) : targetCycleLength,
      );
      let isIrregular = stdDev >= 7;
      const isModeratelyIrregular = stdDev > 3 && stdDev < 7;

      const selfReportedIrregular =
        !!profile.cycleRegularity &&
        (profile.cycleRegularity.toLowerCase() === "irregular" ||
          profile.cycleRegularity.toLowerCase() === "unsure");
      if (selfReportedIrregular) isIrregular = true;

      const hasHormonalMeds = (profile.medications ?? []).some(
        (m) =>
          typeof m === "string" &&
          (m.toLowerCase().includes("birth") ||
            m.toLowerCase().includes("horm")),
      );

      const lastStart = starts[starts.length - 1];
      const nextPredictions: Record<string, true> = {};
      const nextPredictedStarts: string[] = [];
      const monthsAhead = 18;
      let cursor = new Date(lastStart);

      // Wider window for irregular users; hormonal meds narrow window
      const windowSize = hasHormonalMeds
        ? 1
        : isIrregular
          ? 7
          : isModeratelyIrregular
            ? 5
            : 1;

      for (let i = 0; i < monthsAhead; i += 1) {
        cursor = new Date(
          cursor.getFullYear(),
          cursor.getMonth(),
          cursor.getDate() + targetCycleLength,
        );
        nextPredictedStarts.push(formatDateKey(cursor));

        if (windowSize <= 1) {
          for (let day = 0; day < avgPeriodLength; day += 1) {
            const predicted = new Date(
              cursor.getFullYear(),
              cursor.getMonth(),
              cursor.getDate() + day,
            );
            nextPredictions[formatDateKey(predicted)] = true;
          }
        } else {
          const half = Math.floor((windowSize - 1) / 2);
          for (let offset = -half; offset <= half; offset += 1) {
            for (let day = 0; day < avgPeriodLength; day += 1) {
              const predicted = new Date(
                cursor.getFullYear(),
                cursor.getMonth(),
                cursor.getDate() + offset + day,
              );
              nextPredictions[formatDateKey(predicted)] = true;
            }
          }
        }
      }

      // Compute missed predicted starts inline so it's always in sync
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const missed: Record<string, true> = {};
      nextPredictedStarts.forEach((psKey) => {
        const psDate = parseDateKey(psKey);
        if (psDate.getTime() > today.getTime()) return;
        let found = false;
        for (let d = 0; d < avgPeriodLength; d += 1) {
          const checkKey = formatDateKey(
            new Date(
              psDate.getFullYear(),
              psDate.getMonth(),
              psDate.getDate() + d,
            ),
          );
          if (activeDates[checkKey]) {
            found = true;
            break;
          }
        }
        if (!found) missed[psKey] = true;
      });

      setPredictedDates(nextPredictions);
      setPredictedStarts(nextPredictedStarts);
      setMissedPredictedStarts(missed);
    },
    [
      periodDates,
      profile.cycleLength,
      profile.cycleRegularity,
      profile.medications,
    ],
  );

  // Fetch cycles and logs from Supabase (authoritative)
  const fetchRemoteCycles = useCallback(async () => {
    const PREFER_LOCAL_GRACE_MS = 10000; // 10s
    const localAge = Date.now() - localModifiedAtRef.current;
    const preferLocal = localAge < PREFER_LOCAL_GRACE_MS;

    try {
      const {
        data: { user },
      } = await supabaseClient.auth.getUser();
      if (!user) {
        setPeriodDates({});
        setPredictedDates({});
        setLogs({});
        return;
      }

      // If a very recent local edit exists, prefer local state to avoid
      // overwriting optimistic edits while the server catches up.
      if (preferLocal) {
        recalcPredictions(periodDatesRef.current);
        return;
      }

      // 1. Fetch period dates from period_cycles
      const { data: cyclesData, error: cyclesError } = await supabaseClient
        .from("period_cycles")
        .select("start_date,end_date")
        .eq("user_id", user.id);

      if (cyclesError) {
        console.error("Failed to load period_cycles:", cyclesError);
        setPeriodDates({});
        setPredictedDates({});
      } else {
        const next: Record<string, true> = {};
        (cyclesData || []).forEach((row: any) => {
          const start = new Date(row.start_date);
          const end = new Date(row.end_date);
          for (
            let d = new Date(start);
            d.getTime() <= end.getTime();
            d.setDate(d.getDate() + 1)
          ) {
            next[formatDateKey(new Date(d))] = true;
          }
        });
        setPeriodDates(next);
        recalcPredictions(next);
      }

      // 2. Fetch moods and symptoms from period_logs
      const { data: logsData, error: logsError } = await supabaseClient
        .from("period_logs")
        .select("log_date, notes")
        .eq("user_id", user.id);

      if (logsError) {
        console.error("Failed to load period_logs for notes:", logsError);
      } else if (logsData) {
        const serverLogs: Record<string, LogEntry> = {};
        logsData.forEach((row: any) => {
          if (row.notes) {
            serverLogs[row.log_date] = {
              moods: row.notes.moods || [],
              symptoms: row.notes.symptoms || [],
            };
          }
        });
        setLogs(serverLogs);
      }
    } catch (err) {
      console.error("Error fetching remote data:", err);
      setPeriodDates({});
      setPredictedDates({});
    }
  }, [recalcPredictions]);

  // When the local snapshot has been loaded, fetch server cycles if a user is signed in
  useEffect(() => {
    if (!hydrated) return;
    (async () => {
      try {
        await fetchRemoteCycles();
      } catch (err) {
        // fetchRemoteCycles logs errors
      }
    })();
  }, [hydrated]);

  // Now that recalcPredictions is defined, provide implementations
  // for replacePeriodDates, setPeriodDatesForMonth, and logNewCycle.
  const replacePeriodDates = useCallback(
    (dateKeys: string[]) => {
      const next: Record<string, true> = {};
      dateKeys.forEach((key) => {
        next[key] = true;
      });
      setPeriodDates(next);
      // update predictions immediately
      recalcPredictions(next);

      // persist immediately (snapshot + background sync)
      supabaseClient.auth.getUser().then(({ data }) => {
        if (data?.user) {
          syncPeriodDatesToServer(next, logs, data.user.id).catch(
            console.error,
          );
        } else {
          saveCycleSnapshot(next, logs).catch(console.error);
        }
      });
    },
    [logs, recalcPredictions],
  );

  const setPeriodDatesForMonth = useCallback(
    (year: number, month: number, days: number[]) => {
      // Compute next synchronously
      setPeriodDates((prev) => {
        const next = { ...prev };
        Object.keys(next).forEach((key) => {
          const date = parseDateKey(key);
          if (isSameMonth(date, year, month)) delete next[key];
        });
        days.forEach((day) => {
          const key = formatDateKey(new Date(year, month, day));
          next[key] = true;
        });
        // Trigger synchronous prediction update
        recalcPredictions(next);
        return next;
      });

      // Background persist using latest ref
      supabaseClient.auth.getUser().then(({ data }) => {
        const currentNext = periodDatesRef.current;
        if (data?.user) {
          syncPeriodDatesToServer(currentNext, logs, data.user.id).catch(
            console.error,
          );
        } else {
          saveCycleSnapshot(currentNext, logs).catch(console.error);
        }
      });
    },
    [logs, recalcPredictions],
  );

  async function logNewCycle(
    startDate: string | Date,
    endDate?: string | Date,
  ) {
    try {
      const {
        data: { user },
      } = await supabaseClient.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // STRICTLY USE LOCAL DATES TO PREVENT TIMEZONE SHIFTING
      const startIso = formatDateKey(
        typeof startDate === "string" ? new Date(startDate) : startDate,
      );
      const endIso = endDate
        ? formatDateKey(
            typeof endDate === "string" ? new Date(endDate) : endDate,
          )
        : startIso;

      // 1) Optimistic local merge so UI updates immediately.
      const toDate = (d: string | Date) => {
        const dt = typeof d === "string" ? new Date(d) : new Date(d);
        dt.setHours(0, 0, 0, 0);
        return dt;
      };
      const start = toDate(startDate);
      const end = toDate(endDate ?? startDate);
      const optimisticNext = { ...periodDatesRef.current };
      for (
        let d = new Date(start);
        d.getTime() <= end.getTime();
        d.setDate(d.getDate() + 1)
      ) {
        optimisticNext[formatDateKey(new Date(d))] = true;
      }
      setPeriodDates(optimisticNext);
      recalcPredictions(optimisticNext);

      // 2) Background server sync: upsert the canonical run and sync full map
      // (fire-and-forget)
      syncPeriodDatesToServer(optimisticNext, logs, user.id).catch(
        console.error,
      );

      // Also upsert the canonical single cycle row for analytics/compat
      supabaseClient
        .from("period_cycles")
        .upsert(
          [
            {
              user_id: user.id,
              start_date: startIso,
              end_date: endIso,
            },
          ],
          { onConflict: "user_id,start_date" },
        )
        .then(({ error }) => {
          if (error)
            console.error("[logNewCycle] server insert error:", error.message);
        });
    } catch (err) {
      console.error("Failed to log new cycle:", err);
      throw err;
    }
  }

  // ---------------------------------------------------------------------------
  // Background persistence helpers
  // ---------------------------------------------------------------------------

  async function syncPeriodDatesToServer(
    next: Record<string, true>,
    logsArg: Record<string, LogEntry>,
    userId: string,
  ): Promise<void> {
    try {
      // Persist local snapshot first
      await saveCycleSnapshot(next, logsArg);
      // Stamp local modified time (in-memory)
      localModifiedAtRef.current = Date.now();

      if (!Object.keys(next).length) {
        await supabaseClient
          .from("period_cycles")
          .delete()
          .eq("user_id", userId);
        return;
      }

      // Upsert contiguous runs as start/end rows
      const runs = buildPeriodRuns(Object.keys(next));
      const upsertRows = runs.map((run) => ({
        user_id: userId,
        start_date: run[0],
        end_date: run[run.length - 1],
      }));

      const { error: upsertErr } = await supabaseClient
        .from("period_cycles")
        .upsert(upsertRows, { onConflict: "user_id,start_date" });
      if (upsertErr) {
        console.error(
          "[syncPeriodDatesToServer] upsert error:",
          upsertErr.message,
        );
        return;
      }

      // Delete stale server rows not present locally
      const { data: existing } = await supabaseClient
        .from("period_cycles")
        .select("start_date")
        .eq("user_id", userId);
      const activeStarts = new Set(runs.map((r) => r[0]));
      const staleStarts = (existing ?? [])
        .map((r: any) => r.start_date as string)
        .filter((s) => !activeStarts.has(s));
      if (staleStarts.length) {
        await supabaseClient
          .from("period_cycles")
          .delete()
          .eq("user_id", userId)
          .in("start_date", staleStarts);
      }
    } catch (err) {
      console.error("[syncPeriodDatesToServer] unexpected error:", err);
    }
  }

  const isDateInMissedPredictedWindow = useCallback(
    (date: Date) => {
      const runs = buildPeriodRuns(Object.keys(periodDates));
      let avgPeriodLength = defaultPeriodLength;
      if (runs.length) {
        avgPeriodLength = Math.round(
          runs.reduce((sum, run) => sum + run.length, 0) / runs.length,
        );
      }
      const key = formatDateKey(date);
      for (const psKey of Object.keys(missedPredictedStarts)) {
        const psDate = parseDateKey(psKey);
        for (let d = 0; d < avgPeriodLength; d += 1) {
          const k = formatDateKey(
            new Date(
              psDate.getFullYear(),
              psDate.getMonth(),
              psDate.getDate() + d,
            ),
          );
          if (k === key) return true;
        }
      }
      return false;
    },
    [missedPredictedStarts, periodDates],
  );

  // Compute ovulation and fertile window for a predicted period start date.
  // Returns null if ovulation is suppressed (e.g., hormonal birth control).
  const getFertileWindow = useCallback(
    (predictedStart: Date) => {
      const meds = profile.medications || [];
      const hasHormonal = meds.some(
        (m) =>
          m.toLowerCase().includes("birth") || m.toLowerCase().includes("horm"),
      );
      if (hasHormonal) return null;

      const ovulation = new Date(predictedStart);
      ovulation.setDate(ovulation.getDate() - 14);
      const start = new Date(ovulation);
      start.setDate(start.getDate() - 5);
      const end = new Date(ovulation);
      end.setDate(end.getDate() + 1);
      return { ovulation, fertileStart: start, fertileEnd: end };
    },
    [profile.medications],
  );

  const logMoodSymptoms = useCallback(
    async (date: Date, moods: string[], symptoms: string[]) => {
      const key = formatDateKey(date);
      const notesPayload = { moods, symptoms };

      // Optimistically update the UI so it feels instant to the user
      setLogs((prev) => ({
        ...prev,
        [key]: notesPayload,
      }));

      try {
        const {
          data: { user },
          error: userErr,
        } = await supabaseClient.auth.getUser();

        if (userErr || !user) {
          console.error("Not authenticated");
          return;
        }

        // Persist to the database
        const { error } = await supabaseClient.from("period_logs").upsert(
          {
            user_id: user.id,
            log_date: key,
            notes: notesPayload,
          },
          {
            onConflict: "user_id,log_date",
          },
        );

        if (error) throw error;
      } catch (err) {
        console.error("Failed to persist notes to database:", err);
      }
    },
    [],
  );

  const updateProfile = useCallback((patch: Partial<CycleProfile>) => {
    setProfile((prev) => ({ ...prev, ...patch }));
  }, []);

  const setCycleLength = useCallback((length: number) => {
    setProfile((prev) => ({
      ...prev,
      cycleLength: Math.max(20, Math.min(45, Math.round(length))),
    }));
  }, []);

  const getLogsForDate = useCallback(
    (date: Date) => logs[formatDateKey(date)] ?? null,
    [logs],
  );

  const getLatestPeriodStart = useCallback(() => {
    const runs = buildPeriodRuns(Object.keys(periodDates));
    if (!runs.length) return null;
    return parseDateKey(runs[runs.length - 1][0]);
  }, [periodDates]);

  const getCycleStats = useCallback(() => {
    const periodKeys = Object.keys(periodDates);
    const runs = buildPeriodRuns(periodKeys);
    const starts = runs.map((run) => parseDateKey(run[0]));
    const baseCycleLength = profile.cycleLength || defaultCycleLength;
    const diffs = getIntervalsFromStarts(starts);
    const validDiffs = diffs.filter(isValidCycleInterval);
    const avgCycleLength = validDiffs.length
      ? average(validDiffs.slice(-6))
      : baseCycleLength;
    const cycleLength = calculateCycleLength(starts, baseCycleLength);

    let avgPeriodLength = defaultPeriodLength;
    if (runs.length) {
      avgPeriodLength = Math.round(
        runs.reduce((sum, run) => sum + run.length, 0) / runs.length,
      );
    }

    return { avgCycleLength, avgPeriodLength, cycleLength };
  }, [periodDates, profile.cycleLength]);

  const getSymptomFrequencyForMonth = useCallback(
    (year: number, month: number) => {
      const tally = new Map<string, number>();
      Object.entries(logs).forEach(([key, entry]) => {
        const date = parseDateKey(key);
        if (!isSameMonth(date, year, month)) return;
        entry.symptoms.forEach((symptom) => {
          tally.set(symptom, (tally.get(symptom) ?? 0) + 1);
        });
      });
      return Array.from(tally.entries())
        .map(([label, count]) => ({ label, count }))
        .sort((a, b) => b.count - a.count);
    },
    [logs],
  );

  const value = useMemo(
    () => ({
      periodDates,
      predictedDates,
      logs,
      profile,
      togglePeriodDate,
      replacePeriodDates,
      setPeriodDatesForMonth,
      recalcPredictions,
      logMoodSymptoms,
      updateProfile,
      setCycleLength,
      predictedStarts,
      missedPredictedStarts,
      isDateInMissedPredictedWindow,
      getPeriodDaysForMonth,
      getPredictedDaysForMonth,
      getLogsForDate,
      getLatestPeriodStart,
      getCycleStats,
      getSymptomFrequencyForMonth,
      resetStore,
      getFertileWindow,
      fetchRemoteCycles,
      logNewCycle,
      daysLate,
      predictionStatus,
      selectedLogDate,
      setSelectedLogDate,
      getSelectedLogDate,
      logModalRequestCount,
      requestLogModal,
    }),
    [
      periodDates,
      predictedDates,
      logs,
      profile,
      togglePeriodDate,
      replacePeriodDates,
      setPeriodDatesForMonth,
      recalcPredictions,
      logMoodSymptoms,
      updateProfile,
      setCycleLength,
      getPeriodDaysForMonth,
      getPredictedDaysForMonth,
      getLogsForDate,
      getLatestPeriodStart,
      getCycleStats,
      getSymptomFrequencyForMonth,
      resetStore,
      fetchRemoteCycles,
      logNewCycle,
      daysLate,
      predictionStatus,
      selectedLogDate,
      setSelectedLogDate,
      getSelectedLogDate,
      logModalRequestCount,
      requestLogModal,
      getFertileWindow,
    ],
  );

  useEffect(() => {
    if (!hydrated) return;
    // Pass the authoritative periodDates map to avoid relying on
    // `recalcPredictions` identity in the effect deps which can
    // change when other profile fields update and cause loops.
    recalcPredictions(periodDates);
  }, [hydrated, periodDates]);

  // Compute lateness/status based on next predicted START
  useEffect(() => {
    if (!predictedStarts.length) {
      setPredictionStatus("Unknown");
      setDaysLate(0);
      return;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const upcoming =
      predictedStarts.find(
        (k) => parseDateKey(k).getTime() >= today.getTime(),
      ) || predictedStarts[predictedStarts.length - 1];
    const target = parseDateKey(upcoming);
    const diff = Math.floor(
      (target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
    );

    if (diff > 0) {
      setPredictionStatus(`Arriving in ${diff} Days`);
      setDaysLate(0);
    } else if (diff === 0) {
      setPredictionStatus("Arriving today");
      setDaysLate(0);
    } else {
      const late = Math.abs(diff);
      setPredictionStatus(`${late} Days Late`);
      setDaysLate(late);
    }
  }, [predictedStarts]);

  return (
    <CycleDataContext.Provider value={value}>
      {children}
    </CycleDataContext.Provider>
  );
}

export function useCycleData() {
  const context = useContext(CycleDataContext);
  if (!context)
    throw new Error("useCycleData must be used within CycleDataProvider");
  return context;
}
