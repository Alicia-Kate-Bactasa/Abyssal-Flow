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
  replacePeriodDates: (newDates: Record<string, true>) => Promise<void>;
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
    const diff = (next.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24);
    if (diff === 1) {
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

const isValidCycleInterval = (days: number) => days >= 21 && days <= 35;

const average = (values: number[]) =>
  Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);

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

  if (starts.length === 2) {
    return average([baseLength, validIntervals[0]]);
  }

  if (starts.length === 3) {
    return average([baseLength, ...validIntervals.slice(0, 2)]);
  }

  const recent = validIntervals.slice(-6);
  return recent.length ? average(recent) : baseLength;
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

  // ─── Write-lock: blocks fetchRemoteCycles while a save is in-flight ────────
  // When replacePeriodDates starts, it sets this to true. fetchRemoteCycles
  // will bail out immediately if it finds this true, preventing it from
  // pulling stale (pre-upsert) data from Supabase and wiping local state.
  // The lock is released only after the Supabase upsert settles.
  const saveInFlightRef = useRef(false);

  const resetStore = useCallback(() => {
    setPeriodDates({});
    setPredictedDates({});
    setLogs({});
    setProfile(defaultProfile);
    try {
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
        if (snapshot.profile)
          setProfile((prev) => ({ ...prev, ...snapshot.profile }));
        // NOTE: We intentionally do NOT restore periodDates from the
        // cycle-sync snapshot here. Period dates are the source of truth in
        // period_cycles and are loaded via fetchRemoteCycles below.
        if (snapshot.logs) setLogs(snapshot.logs);
      } catch {
        // ignore
      } finally {
        setHydrated(true);
      }
    })();
  }, []);

  const recalcPredictions = useCallback(
    (dates?: Record<string, true>) => {
      const activeDates = dates ?? periodDates;
      const periodKeys = Object.keys(activeDates);
      const runs = buildPeriodRuns(periodKeys);
      const starts = runs.map((run) => parseDateKey(run[0]));

      if (!starts.length) {
        setPredictedDates({});
        setPredictedStarts([]);
        return;
      }

      const baseCycleLength = profile.cycleLength || defaultCycleLength;
      const diffs = getIntervalsFromStarts(starts);
      const validDiffs = diffs.filter(isValidCycleInterval);
      const targetCycleLength = calculateCycleLength(starts, baseCycleLength);

      let avgPeriodLength = defaultPeriodLength;
      if (runs.length) {
        avgPeriodLength = Math.round(
          runs.reduce((sum, run) => sum + run.length, 0) / runs.length,
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

      const lastStart = starts[starts.length - 1];
      const nextPredictions: Record<string, true> = {};
      const nextPredictedStarts: string[] = [];
      const monthsAhead = 18;
      let cursor = new Date(lastStart);

      const windowSize = isIrregular
        ? 7
        : isModeratelyIrregular || selfReportedIrregular
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
      setPredictedDates(nextPredictions);
      setPredictedStarts(nextPredictedStarts);
    },
    [
      periodDates,
      profile.cycleLength,
      profile.cycleRegularity,
      profile.medications,
    ],
  );

  // ─── replacePeriodDates ─────────────────────────────────────────────────────
  // Single source of truth for all period-date mutations that need cloud sync.
  // Acquires saveInFlightRef before any async work so fetchRemoteCycles
  // cannot race and overwrite state while the upsert is pending.
  const replacePeriodDates = useCallback(
    async (newDates: Record<string, true>) => {
      // 1. Acquire write-lock BEFORE touching any state.
      saveInFlightRef.current = true;

      // 2. Optimistic local update so the UI reflects changes immediately.
      setPeriodDates(newDates);
      recalcPredictions(newDates);

      try {
        const {
          data: { user },
        } = await supabaseClient.auth.getUser();
        if (!user) return;

        // 3. Group individual dates into contiguous runs for storage.
        const keys = Object.keys(newDates);
        const runs = buildPeriodRuns(keys);

        const rowsToInsert = runs.map((run) => ({
          user_id: user.id,
          start_date: run[0],
          end_date: run[run.length - 1],
          source: "manual",
        }));

        // 4. Delete-then-upsert is the safest replace pattern for Supabase.
        //    We await each step so we never release the lock on a partial write.
        await supabaseClient
          .from("period_cycles")
          .delete()
          .eq("user_id", user.id);

        if (rowsToInsert.length > 0) {
          await supabaseClient.from("period_cycles").upsert(rowsToInsert);
        }
      } catch (err) {
        console.error("Cloud sync failed:", err);
        // State is already updated optimistically — don't revert so the user
        // doesn't see a confusing flash. The next fetchRemoteCycles (e.g. on
        // next app open) will reconcile if the write partially failed.
      } finally {
        // 5. Release write-lock only after the Supabase round-trip finishes.
        saveInFlightRef.current = false;
      }
    },
    [recalcPredictions],
  );

  // ─── logNewCycle ────────────────────────────────────────────────────────────
  const logNewCycle = useCallback(
    async (startDate: string | Date, endDate?: string | Date) => {
      try {
        const toIso = (d: string | Date) => {
          const dt = typeof d === "string" ? new Date(d + "T00:00:00") : d;
          dt.setHours(0, 0, 0, 0);
          return `${dt.getFullYear()}-${pad2(dt.getMonth() + 1)}-${pad2(dt.getDate())}`;
        };

        const startIso = toIso(startDate);
        const endIso = endDate ? toIso(endDate) : startIso;

        const next: Record<string, true> = { ...periodDates };
        const rangeStart = new Date(startIso + "T00:00:00");
        const rangeEnd = new Date(endIso + "T00:00:00");

        for (
          let d = new Date(rangeStart);
          d.getTime() <= rangeEnd.getTime();
          d.setDate(d.getDate() + 1)
        ) {
          next[formatDateKey(new Date(d))] = true;
        }

        await replacePeriodDates(next);
      } catch (err) {
        console.error("Failed to log new cycle:", err);
        throw err;
      }
    },
    [periodDates, replacePeriodDates],
  );

  // ─── fetchRemoteCycles ──────────────────────────────────────────────────────
  // Guarded by BOTH an in-flight lock (fetchInFlightRef) and the write-lock
  // (saveInFlightRef). If a save is happening, bail immediately — the local
  // state is already correct and the cloud will catch up on the next fetch.
  const fetchInFlightRef = useRef(false);

  const fetchRemoteCycles = useCallback(async () => {
    // Hard bail if a save is in progress — local state is the truth right now.
    if (saveInFlightRef.current) return;
    if (fetchInFlightRef.current) return;

    fetchInFlightRef.current = true;
    try {
      const {
        data: { user },
      } = await supabaseClient.auth.getUser();

      if (!user) return;

      const { data, error } = await supabaseClient
        .from("period_cycles")
        .select("start_date,end_date")
        .eq("user_id", user.id);

      if (error) {
        console.error("Failed to load period_cycles:", error);
        return;
      }

      // One final check: if a save started while we were awaiting, discard
      // the remote result — it may predate the in-flight upsert.
      if (saveInFlightRef.current) return;

      const next: Record<string, true> = {};
      (data || []).forEach((row: any) => {
        const [sy, sm, sd] = (row.start_date as string).split("-").map(Number);
        const [ey, em, ed] = (row.end_date as string).split("-").map(Number);
        const start = new Date(sy, sm - 1, sd);
        const end = new Date(ey, em - 1, ed);
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
    } catch (err) {
      console.error("Error fetching period cycles:", err);
    } finally {
      fetchInFlightRef.current = false;
    }
  }, [recalcPredictions]);

  const initialFetchDoneRef = useRef(false);
  useEffect(() => {
    if (!hydrated) return;
    if (initialFetchDoneRef.current) return;
    initialFetchDoneRef.current = true;
    fetchRemoteCycles().catch(() => {
      initialFetchDoneRef.current = false;
    });
  }, [hydrated, fetchRemoteCycles]);

  // ─── Persist logs (NOT periodDates) to cycle-sync on change ────────────────
  // We only sync logs here — period dates are managed exclusively via
  // period_cycles / replacePeriodDates to avoid the two-table conflict that
  // caused the original amnesia bug.
  useEffect(() => {
    if (!hydrated) return;
    (async () => {
      try {
        // Pass empty periodDates so saveCycleSnapshot touches only
        // the logs columns, not period_logs rows.
        await saveCycleSnapshot({}, logs);
      } catch {
        // ignore
      }
    })();
  }, [hydrated, logs]);

  const togglePeriodDate = useCallback((date: Date) => {
    const key = formatDateKey(date);
    setPeriodDates((prev) => {
      if (prev[key]) {
        const next = { ...prev };
        delete next[key];
        return next;
      }
      return { ...prev, [key]: true };
    });
  }, []);

  // ─── setPeriodDatesForMonth ─────────────────────────────────────────────────
  // Kept for in-memory use by the AddModal calendar, but callers must call
  // replacePeriodDates(nextDates) to persist — see _layout.tsx.
  const setPeriodDatesForMonth = useCallback(
    (year: number, month: number, days: number[]) => {
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
        return next;
      });
    },
    [],
  );

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

  useEffect(() => {
    if (!predictedStarts.length) {
      setMissedPredictedStarts({});
      return;
    }

    const runs = buildPeriodRuns(Object.keys(periodDates));
    let avgPeriodLength = defaultPeriodLength;
    if (runs.length) {
      avgPeriodLength = Math.round(
        runs.reduce((sum, run) => sum + run.length, 0) / runs.length,
      );
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const missed: Record<string, true> = {};

    predictedStarts.forEach((psKey) => {
      const psDate = parseDateKey(psKey);
      if (psDate.getTime() > today.getTime()) return;

      let found = false;
      for (let d = 0; d < avgPeriodLength; d += 1) {
        const key = formatDateKey(
          new Date(
            psDate.getFullYear(),
            psDate.getMonth(),
            psDate.getDate() + d,
          ),
        );
        if (periodDates[key]) {
          found = true;
          break;
        }
      }
      if (!found) {
        missed[psKey] = true;
      }
    });

    setMissedPredictedStarts(missed);
  }, [predictedStarts, periodDates]);

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
    (date: Date, moods: string[], symptoms: string[]) => {
      const key = formatDateKey(date);
      setLogs((prev) => ({
        ...prev,
        [key]: { moods, symptoms },
      }));
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
    recalcPredictions();
  }, [hydrated, periodDates, recalcPredictions]);

  useEffect(() => {
    const keys = Object.keys(predictedDates).sort(
      (a, b) => parseDateKey(a).getTime() - parseDateKey(b).getTime(),
    );
    if (!keys.length) {
      setPredictionStatus("Unknown");
      setDaysLate(0);
      return;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const upcoming =
      keys.find((k) => parseDateKey(k).getTime() >= today.getTime()) || keys[0];
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
  }, [predictedDates]);

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
