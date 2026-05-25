const DAY_MS = 1000 * 60 * 60 * 24;

const MAX_WITHIN_PERIOD_GAP = 2;

const pad2 = (v: number) => String(v).padStart(2, "0");
export const formatDateKey = (date: Date) =>
  `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;

const parseDateKey = (key: string) => {
  const [y, m, d] = key.split("-").map((p) => Number(p));
  return new Date(y, m - 1, d);
};

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
    const diff = Math.round((next.getTime() - prev.getTime()) / DAY_MS);
    if (diff <= MAX_WITHIN_PERIOD_GAP) current.push(key);
    else {
      runs.push(current);
      current = [key];
    }
  }
  if (current.length) runs.push(current);
  return runs;
};

const isValidCycleInterval = (days: number) => days >= 21 && days <= 45;

const average = (values: number[]) =>
  Math.round(values.reduce((s, v) => s + v, 0) / values.length || 0);

const weightedMean = (values: number[]) => {
  if (!values.length) return 0;
  let weightSum = 0;
  let total = 0;
  for (let i = 0; i < values.length; i++) {
    const v = values[i];
    const w = Math.pow(0.6, values.length - 1 - i);
    total += v * w;
    weightSum += w;
  }
  return Math.round(total / weightSum || 0);
};

const getIntervalsFromStarts = (starts: Date[]) =>
  starts
    .slice(1)
    .map((date, idx) =>
      Math.round((date.getTime() - starts[idx].getTime()) / DAY_MS),
    )
    .filter((d) => d > 0);

const calculateCycleLength = (starts: Date[], baseLength: number) => {
  if (starts.length < 2) return baseLength;
  const intervals = getIntervalsFromStarts(starts).filter(isValidCycleInterval);
  if (!intervals.length) return baseLength;
  const recent = intervals.slice(-6);
  const estimate = weightedMean(recent);
  return Math.max(21, Math.min(45, estimate || baseLength));
};

export function computeCycleStats(
  periodDates: Record<string, true>,
  baseCycleLength = 28,
) {
  const keys = Object.keys(periodDates || {});
  if (!keys.length) {
    return {
      avgCycleLength: baseCycleLength,
      avgPeriodLength: 5,
      cycleLength: baseCycleLength,
    };
  }

  const runs = buildPeriodRuns(keys);
  const starts = runs.map((r) => parseDateKey(r[0]));
  const diffs = getIntervalsFromStarts(starts).filter(isValidCycleInterval);
  const avgCycleLength = diffs.length
    ? average(diffs.slice(-6))
    : baseCycleLength;
  const cycleLength = calculateCycleLength(starts, baseCycleLength);

  let avgPeriodLength = 5;
  if (runs.length) {
    const runLengths = runs.map((run) => {
      const first = parseDateKey(run[0]);
      const last = parseDateKey(run[run.length - 1]);
      return Math.round((last.getTime() - first.getTime()) / DAY_MS) + 1;
    });
    avgPeriodLength = Math.max(
      1,
      Math.round(runLengths.reduce((s, v) => s + v, 0) / runLengths.length),
    );
  }

  return { avgCycleLength, avgPeriodLength, cycleLength };
}

export default computeCycleStats;
