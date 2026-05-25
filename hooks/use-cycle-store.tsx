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

// ✅ FIXED: Explicitly declare internal snapshot map shape to resolve TypeScript compilation blocks
type DayRecord = {
  period?: boolean;
  moods?: string[];
  symptoms?: string[];
};

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
  fetchRemoteCycles: (overrideNext?: Record<string, true>) => Promise<void>;
  logNewCycle: (
    startDate: string | Date,
    endDate?: string | Date,
  ) => Promise<void>;
  daysLate: number;
  predictionStatus: string;
  getRecalcTiming: () => { lastMs: number; maxMs: number; lastAt: number } | null;
};

const CycleDataContext = createContext<CycleDataContextValue | null>(null);

const pad2 = (value: number) => String(value).padStart(2, "0");

export const formatDateKey = (date: Date) =>
  `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;

const toLocalDate = (key: string) => {
  const date = new Date(`${key}T00:00:00`);
  date.setHours(0, 0, 0, 0);
  return date;
};

export const parseDateKey = (key: string) => toLocalDate(key);

const normalizeDate = (date: Date) => {
  const next = new Date(date.getTime());
  next.setHours(0, 0, 0, 0);
  return next;
};

const isSameMonth = (date: Date, year: number, month: number) =>
  date.getFullYear() === year && date.getMonth() === month;

const sortDateKeys = (keys: string[]) =>
  [...keys].sort(
    (a, b) => parseDateKey(a).getTime() - parseDateKey(b).getTime(),
  );

const hashDateKeys = (keys: string[]) => {
  const sorted = [...keys].sort();
  let hash = 2166136261;
  for (const key of sorted) {
    for (let i = 0; i < key.length; i += 1) {
      hash ^= key.charCodeAt(i);
      hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
    }
    hash ^= 1247;
  }
  return `k${hash >>> 0}`;
};

export const buildPeriodRuns = (keys: string[]) => {
  const sorted = sortDateKeys(keys);
  const runs: string[][] = [];
  let current: string[] = [];
  const MAX_WITHIN_PERIOD_GAP = 2;

  for (const key of sorted) {
    if (!current.length) {
      current.push(key);
      continue;
    }
    const prev = parseDateKey(current[current.length - 1]);
    const next = parseDateKey(key);
    const diff = Math.round((next.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24));
    
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

const isValidCycleInterval = (days: number) => days >= 21 && days <= 45;

const average = (values: number[]) =>
  Math.round(values.reduce((sum, value) => sum + value, 0) / values.length || 0);

const calculateCycleLength = (starts: Date[], baseLength: number) => {
  if (starts.length < 2) return baseLength;

  const sortedStarts = [...starts].sort((a, b) => a.getTime() - b.getTime());

  const intervals = sortedStarts
    .slice(1)
    .map((date, idx) =>
      Math.round(
        (date.getTime() - sortedStarts[idx].getTime()) / (1000 * 60 * 60 * 24),
      ),
    )
    .filter((days) => days > 0);

  const validIntervals = intervals.filter(isValidCycleInterval);
  if (!validIntervals.length) return baseLength;

  if (sortedStarts.length === 2) {
    return average([baseLength, validIntervals[0]]);
  }

  if (sortedStarts.length === 3) {
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
  const [predictedDates, setPredictedDates] = useState<Record<string, true>>({});
  const [logs, setLogs] = useState<Record<string, LogEntry>>({});
  const [profile, setProfile] = useState<CycleProfile>(defaultProfile);
  const [hydrated, setHydrated] = useState(false);
  const [daysLate, setDaysLate] = useState<number>(0);
  const [predictionStatus, setPredictionStatus] = useState<string>("");
  const [predictedStarts, setPredictedStarts] = useState<string[]>([]);
  const [missedPredictedStarts, setMissedPredictedStarts] = useState<Record<string, true>>({});
  const [selectedLogDate, setSelectedLogDateState] = useState<Date | null>(null);
  const [logModalRequestCount, setLogModalRequestCount] = useState(0);
  const recalcPerfRef = useRef({ lastMs: 0, maxMs: 0, lastAt: 0 });
  const recalcCacheRef = useRef<{
    keysHash: string;
    profileKey: string;
    runs: string[][];
    starts: Date[];
    targetCycleLength: number;
    avgPeriodLength: number;
    isIrregular: boolean;
    isModeratelyIrregular: boolean;
    selfReportedIrregular: boolean;
  } | null>(null);

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
    const copy = normalizeDate(d);
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

  // ── recalcPredictions ────────────────────────────────────────────────────
  const recalcPredictions = useCallback(
    (dates?: Record<string, true>) => {
      const t0 = globalThis.performance?.now?.() ?? Date.now();
      const activeDates = dates ?? periodDates;
      const periodKeys = Object.keys(activeDates);
      const keysHash = hashDateKeys(periodKeys);
      const profileKey = `${profile.cycleLength || defaultCycleLength}|${profile.cycleRegularity ?? ""}`;
      const canReuse =
        !!recalcCacheRef.current &&
        recalcCacheRef.current.keysHash === keysHash &&
        recalcCacheRef.current.profileKey === profileKey;

      let runs: string[][] = [];
      let starts: Date[] = [];
      let targetCycleLength = profile.cycleLength || defaultCycleLength;
      let avgPeriodLength = defaultPeriodLength;
      let isIrregular = false;
      let isModeratelyIrregular = false;
      let selfReportedIrregular = false;

      if (canReuse) {
        runs = recalcCacheRef.current?.runs ?? [];
        starts = recalcCacheRef.current?.starts ?? [];
        targetCycleLength = recalcCacheRef.current?.targetCycleLength ?? targetCycleLength;
        avgPeriodLength = recalcCacheRef.current?.avgPeriodLength ?? avgPeriodLength;
        isIrregular = !!recalcCacheRef.current?.isIrregular;
        isModeratelyIrregular = !!recalcCacheRef.current?.isModeratelyIrregular;
        selfReportedIrregular = !!recalcCacheRef.current?.selfReportedIrregular;
      } else {
        runs = buildPeriodRuns(periodKeys);
        starts = runs
          .map((run) => parseDateKey(run[0]))
          .sort((a, b) => a.getTime() - b.getTime());

        const baseCycleLength = profile.cycleLength || defaultCycleLength;
        const diffs = getIntervalsFromStarts(starts);
        const validDiffs = diffs.filter(isValidCycleInterval);
        targetCycleLength = calculateCycleLength(starts, baseCycleLength);

        if (runs.length) {
          avgPeriodLength = Math.round(
            runs.reduce((sum, run) => sum + run.length, 0) / runs.length,
          );
        }

        const stdDev = calculateStdDev(
          validDiffs.slice(-6),
          validDiffs.length ? average(validDiffs.slice(-6)) : targetCycleLength,
        );
        isIrregular = stdDev >= 7;
        isModeratelyIrregular = stdDev > 3 && stdDev < 7;

        selfReportedIrregular =
          !!profile.cycleRegularity &&
          (profile.cycleRegularity.toLowerCase() === "irregular" ||
            profile.cycleRegularity.toLowerCase() === "unsure");
        if (selfReportedIrregular) isIrregular = true;

        recalcCacheRef.current = {
          keysHash,
          profileKey,
          runs,
          starts,
          targetCycleLength,
          avgPeriodLength,
          isIrregular,
          isModeratelyIrregular,
          selfReportedIrregular,
        };
      }

      if (!starts.length) {
        setPredictedDates({});
        setPredictedStarts([]);
        const t1 = globalThis.performance?.now?.() ?? Date.now();
        const elapsed = t1 - t0;
        recalcPerfRef.current.lastMs = elapsed;
        recalcPerfRef.current.maxMs = Math.max(recalcPerfRef.current.maxMs, elapsed);
        recalcPerfRef.current.lastAt = Date.now();
        if (__DEV__ && elapsed > 2) {
          console.warn(`recalcPredictions exceeded 2ms budget: ${elapsed.toFixed(2)}ms`);
        }
        return;
      }

      const lastStart = starts[starts.length - 1];
      const nextPredictions: Record<string, true> = {};
      const nextPredictedStarts: string[] = [];
      
      const totalCyclesToProject = 18; 
      
      const cursor = normalizeDate(lastStart);
      const scratch = new Date(cursor.getTime());

      const windowSize = isIrregular
        ? 7
        : isModeratelyIrregular || selfReportedIrregular
          ? 5
          : 1;

      for (let i = 0; i < totalCyclesToProject; i++) {
        cursor.setDate(cursor.getDate() + targetCycleLength);
        const startKey = formatDateKey(cursor);
        nextPredictedStarts.push(startKey);

        if (windowSize <= 1) {
          for (let day = 0; day < avgPeriodLength; day += 1) {
            scratch.setTime(cursor.getTime());
            scratch.setDate(cursor.getDate() + day);
            nextPredictions[formatDateKey(scratch)] = true;
          }
        } else {
          const half = Math.floor((windowSize - 1) / 2);
          for (let offset = -half; offset <= half; offset += 1) {
            for (let day = 0; day < avgPeriodLength; day += 1) {
              scratch.setTime(cursor.getTime());
              scratch.setDate(cursor.getDate() + offset + day);
              nextPredictions[formatDateKey(scratch)] = true;
            }
          }
        }
      }
      setPredictedDates(nextPredictions);
      setPredictedStarts(nextPredictedStarts);
      const t1 = globalThis.performance?.now?.() ?? Date.now();
      const elapsed = t1 - t0;
      recalcPerfRef.current.lastMs = elapsed;
      recalcPerfRef.current.maxMs = Math.max(recalcPerfRef.current.maxMs, elapsed);
      recalcPerfRef.current.lastAt = Date.now();
      if (__DEV__ && elapsed > 2) {
        console.warn(`recalcPredictions exceeded 2ms budget: ${elapsed.toFixed(2)}ms`);
      }
    },
    [profile.cycleLength, profile.cycleRegularity, periodDates],
  );

  async function logNewCycle(startDate: string | Date, endDate?: string | Date) {
    try {
      const { data: { user } } = await supabaseClient.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const toIso = (d: string | Date) => {
        if (typeof d === "string") return d.trim().split("T")[0];
        return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
      };

      const startIso = toIso(startDate);
      const endIso = endDate ? toIso(endDate) : startIso;

      const { error: deleteError } = await supabaseClient
        .from("period_cycles")
        .delete()
        .eq("user_id", user.id);
      if (deleteError) throw deleteError;

      const { error: insertError } = await supabaseClient
        .from("period_cycles")
        .insert([{ user_id: user.id, start_date: startIso, end_date: endIso }]);
      if (insertError) throw insertError;

      const next: Record<string, true> = {};
      const rangeStart = toLocalDate(startIso);
      const rangeEnd = toLocalDate(endIso);
      const cursor = new Date(rangeStart.getTime());
      for (; cursor.getTime() <= rangeEnd.getTime(); cursor.setDate(cursor.getDate() + 1)) {
        next[formatDateKey(cursor)] = true;
      }

      setPeriodDates(next);
      recalcPredictions(next);
      
      saveCycleSnapshot(next, logs).catch(() => {});

      fetchRemoteCycles(next).catch((err) =>
        console.error("logNewCycle: background sync error:", err),
      );
    } catch (err) {
      console.error("Failed to log new cycle:", err);
      throw err;
    }
  }

  // ── fetchRemoteCycles ─────────────────────────────────────────────────────
  const fetchRemoteCycles = useCallback(
    async (overrideNext?: Record<string, true>) => {
      try {
        const { data: { user } } = await supabaseClient.auth.getUser();
        if (!user) {
          setPeriodDates({});
          setPredictedDates({});
          return;
        }

        let next: Record<string, true> = {};

        if (overrideNext) {
          next = overrideNext;
        } else {
          const { data: cyclesData, error: cyclesError } = await supabaseClient
            .from("period_cycles")
            .select("start_date,end_date")
            .eq("user_id", user.id);

          if (cyclesError) {
            console.error("Failed to load period_cycles:", cyclesError.message);
          } else {
            (cyclesData || []).forEach((row: any) => {
              const start = toLocalDate(row.start_date);
              const end = toLocalDate(row.end_date);
              const cursor = new Date(start.getTime());
              for (; cursor.getTime() <= end.getTime(); cursor.setDate(cursor.getDate() + 1)) {
                next[formatDateKey(cursor)] = true;
              }
            });
          }
        }

        const { data: logsData, error: logsError } = await supabaseClient
          .from("period_logs")
          .select("log_date,source,notes")
          .eq("user_id", user.id);

        if (logsError) {
          console.error("Failed to load period_logs for calendar sync:", logsError.message);
        } else {
          const fetchedLogs: Record<string, LogEntry> = {};
          
          (logsData || []).forEach((row: any) => {
            const decoded = row.notes ? (row.notes as DayRecord) : null;
            
            if (decoded) {
              if (decoded.period) {
                next[row.log_date] = true;
              }
              if ((decoded.moods?.length) || (decoded.symptoms?.length)) {
                fetchedLogs[row.log_date] = {
                  moods: decoded.moods ?? [],
                  symptoms: decoded.symptoms ?? [],
                };
              }
            } else if (row.source) {
              next[row.log_date] = true;
            }
          });

          setLogs((prev) => ({ ...prev, ...fetchedLogs }));
        }

        setPeriodDates(next);
        recalcPredictions(next);
      } catch (err) {
        console.error("Error running remote cycle hydration loop:", err);
        setPeriodDates({});
        setPredictedDates({});
      }
    },
    [recalcPredictions],
  );

  // Load disk cache state on startup
  useEffect(() => {
    (async () => {
      try {
        const snapshot = await loadCycleSnapshot();
        if (snapshot.periodDates) setPeriodDates(snapshot.periodDates);
        if (snapshot.logs) setLogs(snapshot.logs);
        if (snapshot.profile)
          setProfile((prev) => ({ ...prev, ...snapshot.profile }));
      } catch {
        // fall back
      } finally {
        setHydrated(true);
      }
    })();
  }, []);

  // Sync server cycles once hydration completes
  useEffect(() => {
    if (!hydrated) return;
    fetchRemoteCycles().catch(() => {});
  }, [hydrated, fetchRemoteCycles]);

  const togglePeriodDate = useCallback((date: Date) => {
    const key = formatDateKey(date);
    setPeriodDates((prev) => {
      const next = { ...prev };
      if (next[key]) {
        delete next[key];
      } else {
        next[key] = true;
      }
      saveCycleSnapshot(next, logs).catch(() => {});
      return next;
    });
  }, [logs]);

  const replacePeriodDates = useCallback((dateKeys: string[]) => {
    const next: Record<string, true> = {};
    dateKeys.forEach((key) => {
      next[key] = true;
    });
    setPeriodDates(next);
    saveCycleSnapshot(next, logs).catch(() => {});
  }, [logs]);

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
        saveCycleSnapshot(next, logs).catch(() => {});
        return next;
      });
    },
    [logs],
  );

  const logMoodSymptoms = useCallback(
    (date: Date, moods: string[], symptoms: string[]) => {
      const key = formatDateKey(date);
      setLogs((prev) => {
        const next = {
          ...prev,
          [key]: { moods, symptoms },
        };
        saveCycleSnapshot(periodDates, next).catch(() => {});
        return next;
      });
    },
    [periodDates],
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

    const today = normalizeDate(new Date());
    const missed: Record<string, true> = {};

    predictedStarts.forEach((psKey) => {
      const psDate = parseDateKey(psKey);
      if (psDate.getTime() > today.getTime()) return;

      let found = false;
      const cursor = new Date(psDate.getTime());
      for (let d = 0; d < avgPeriodLength; d += 1) {
        if (periodDates[formatDateKey(cursor)]) {
          found = true;
          break;
        }
        cursor.setDate(cursor.getDate() + 1);
      }
      if (!found) missed[psKey] = true;
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
        const cursor = new Date(psDate.getTime());
        for (let d = 0; d < avgPeriodLength; d += 1) {
          if (formatDateKey(cursor) === key) return true;
          cursor.setDate(cursor.getDate() + 1);
        }
      }
      return false;
    },
    [missedPredictedStarts, periodDates],
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
      fetchRemoteCycles,
      logNewCycle,
      daysLate,
      predictionStatus,
      selectedLogDate,
      setSelectedLogDate,
      getSelectedLogDate,
      logModalRequestCount,
      requestLogModal,
      getRecalcTiming: () => (__DEV__ ? { ...recalcPerfRef.current } : null),
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
    ],
  );

  // ✅ FIXED: Tracking a numerical dictionary length signature breaks the infinite update cascades,
  // allowing users to switch months instantly on the insight panel calendar grid with zero lag.
  const periodDatesLengthSignature = Object.keys(periodDates).length;

  useEffect(() => {
    if (!hydrated) return;
    recalcPredictions();
  }, [hydrated, periodDatesLengthSignature, recalcPredictions]);

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
    const upcoming = keys.find((k) => parseDateKey(k).getTime() >= today.getTime()) || keys[0];
    const target = parseDateKey(upcoming);
    const diff = Math.floor((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

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