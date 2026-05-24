import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { loadCycleSnapshot, saveCycleSnapshot } from "../lib/cycle-sync";

export type LogEntry = {
  moods: string[];
  symptoms: string[];
};

export type CycleProfile = {
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
  recalcPredictions: () => void;
  logMoodSymptoms: (date: Date, moods: string[], symptoms: string[]) => void;
  updateProfile: (patch: Partial<CycleProfile>) => void;
  setCycleLength: (length: number) => void;
  getPeriodDaysForMonth: (year: number, month: number) => number[];
  getPredictedDaysForMonth: (year: number, month: number) => number[];
  getLogsForDate: (date: Date) => LogEntry | null;
  getLatestPeriodStart: () => Date | null;
  getCycleStats: () => { avgCycleLength: number; avgPeriodLength: number; cycleLength: number };
  getSymptomFrequencyForMonth: (year: number, month: number) =>
    { label: string; count: number }[];
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
  [...keys].sort((a, b) => parseDateKey(a).getTime() - parseDateKey(b).getTime());

const buildPeriodRuns = (keys: string[]) => {
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
const STORAGE_KEY = "@abyssal_cycle_data";

const defaultProfile: CycleProfile = {
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

  useEffect(() => {
    (async () => {
      try {
        const snapshot = await loadCycleSnapshot();
        if (snapshot.periodDates) setPeriodDates(snapshot.periodDates);
        if (snapshot.logs) setLogs(snapshot.logs);
        if (snapshot.profile) setProfile((prev) => ({ ...prev, ...snapshot.profile }));
      } catch {
        // ignore storage errors and fall back to defaults
      } finally {
        setHydrated(true);
      }
    })();
  }, []);

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

  const replacePeriodDates = useCallback((dateKeys: string[]) => {
    const next: Record<string, true> = {};
    dateKeys.forEach((key) => {
      next[key] = true;
    });
    setPeriodDates(next);
  }, []);

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

  const recalcPredictions = useCallback(() => {
    const periodKeys = Object.keys(periodDates);
    const runs = buildPeriodRuns(periodKeys);
    const starts = runs.map((run) => parseDateKey(run[0]));

    let avgCycleLength = defaultCycleLength;
    if (starts.length >= 2) {
      const diffs = starts
        .slice(1)
        .map((date, idx) =>
          Math.round(
            (date.getTime() - starts[idx].getTime()) / (1000 * 60 * 60 * 24),
          ),
        )
        .filter((diff) => diff > 0);
      if (diffs.length) {
        avgCycleLength = Math.round(
          diffs.reduce((sum, val) => sum + val, 0) / diffs.length,
        );
      }
    }

    const cycleLength = starts.length >= 2 ? avgCycleLength : profile.cycleLength;

    let avgPeriodLength = defaultPeriodLength;
    if (runs.length) {
      avgPeriodLength = Math.round(
        runs.reduce((sum, run) => sum + run.length, 0) / runs.length,
      );
    }

    const lastStart = starts.length
      ? starts[starts.length - 1]
      : new Date();

    const nextPredictions: Record<string, true> = {};
    const monthsAhead = 18;
    let cursor = new Date(lastStart);

    for (let i = 0; i < monthsAhead; i += 1) {
      cursor = new Date(cursor.getFullYear(), cursor.getMonth(), cursor.getDate() + cycleLength);
      for (let day = 0; day < avgPeriodLength; day += 1) {
        const predicted = new Date(
          cursor.getFullYear(),
          cursor.getMonth(),
          cursor.getDate() + day,
        );
        nextPredictions[formatDateKey(predicted)] = true;
      }
    }

    setPredictedDates(nextPredictions);
  }, [periodDates, profile.cycleLength]);

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

    let avgCycleLength = defaultCycleLength;
    if (starts.length >= 2) {
      const diffs = starts
        .slice(1)
        .map((date, idx) =>
          Math.round(
            (date.getTime() - starts[idx].getTime()) / (1000 * 60 * 60 * 24),
          ),
        )
        .filter((diff) => diff > 0);
      if (diffs.length) {
        avgCycleLength = Math.round(
          diffs.reduce((sum, val) => sum + val, 0) / diffs.length,
        );
      }
    }

    const cycleLength = starts.length >= 2 ? avgCycleLength : profile.cycleLength;

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
      getPeriodDaysForMonth,
      getPredictedDaysForMonth,
      getLogsForDate,
      getLatestPeriodStart,
      getCycleStats,
      getSymptomFrequencyForMonth,
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
    ],
  );

  useEffect(() => {
    if (!hydrated) return;
    recalcPredictions();
  }, [hydrated, periodDates, profile.cycleLength, recalcPredictions]);

  return (
    <CycleDataContext.Provider value={value}>
      {children}
    </CycleDataContext.Provider>
  );
}

export function useCycleData() {
  const context = useContext(CycleDataContext);
  if (!context) throw new Error("useCycleData must be used within CycleDataProvider");
  return context;
}
