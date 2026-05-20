import { formatDateKey, parseDateKey, useCycleData } from "@/hooks/use-cycle-store";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useMemo, useState } from "react";
import {
  Dimensions,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { width } = Dimensions.get("window");
const WEEKDAYS = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

const buildMonthRange = (center: Date, pastMonths: number, futureMonths: number) => {
  const start = new Date(center.getFullYear(), center.getMonth() - pastMonths, 1);
  const total = pastMonths + futureMonths + 1;
  return Array.from({ length: total }, (_, index) => {
    const date = new Date(start.getFullYear(), start.getMonth() + index, 1);
    return { year: date.getFullYear(), month: date.getMonth() };
  });
};

const buildWeeks = (year: number, month: number) => {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  while (cells.length < 42) cells.push(null);

  const weeks: (number | null)[][] = [];
  for (let i = 0; i < 42; i += 7) {
    weeks.push(cells.slice(i, i + 7));
  }
  return weeks;
};

const formatMonthLabel = (year: number, month: number) =>
  new Date(year, month, 1).toLocaleString("default", {
    month: "long",
    year: "numeric",
  });

const buildPeriodRuns = (keys: string[]) => {
  const sorted = [...keys].sort(
    (a, b) => parseDateKey(a).getTime() - parseDateKey(b).getTime(),
  );
  const runs: string[][] = [];
  let current: string[] = [];

  sorted.forEach((key) => {
    if (!current.length) {
      current.push(key);
      return;
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
  });

  if (current.length) runs.push(current);
  return runs;
};

export default function CalendarScreen() {
  const insets = useSafeAreaInsets();
  const {
    periodDates,
    predictedDates,
    replacePeriodDates,
    recalcPredictions,
    getCycleStats,
  } = useCycleData();
  const [activeSegment, setActiveSegment] = useState<"calendar" | "pattern">(
    "calendar",
  );
  const [draftDates, setDraftDates] = useState<Record<string, true>>(periodDates);

  useEffect(() => {
    setDraftDates(periodDates);
  }, [periodDates]);

  const months = useMemo(() => buildMonthRange(new Date(), 24, 24), []);
  const periodKeys = useMemo(() => Object.keys(periodDates), [periodDates]);
  const draftKeys = useMemo(() => Object.keys(draftDates), [draftDates]);
  const hasChanges = useMemo(() => {
    if (periodKeys.length !== draftKeys.length) return true;
    const lookup = new Set(periodKeys);
    return draftKeys.some((key) => !lookup.has(key));
  }, [draftKeys, periodKeys]);

  const cycleStats = getCycleStats();

  const cyclePatternRows = useMemo(() => {
    const runs = buildPeriodRuns(periodKeys);
    const starts = runs.map((run) => parseDateKey(run[0]));
    if (starts.length < 2) return [];
    return starts.slice(1).map((date, index) => {
      const prev = starts[index];
      const length = Math.round(
        (date.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24),
      );
      return {
        label: `${formatMonthLabel(date.getFullYear(), date.getMonth())}: ${length} days`,
      };
    });
  }, [periodKeys]);

  const toggleDraftDate = (year: number, month: number, day: number) => {
    const key = formatDateKey(new Date(year, month, day));
    setDraftDates((prev) => {
      const next = { ...prev };
      if (next[key]) {
        delete next[key];
      } else {
        next[key] = true;
      }
      return next;
    });
  };

  const handleSave = () => {
    replacePeriodDates(draftKeys);
    recalcPredictions();
  };

  return (
    <LinearGradient colors={["#04122B", "#1A2E5A"]} style={styles.container}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: 20 + insets.top, paddingBottom: 140 + insets.bottom },
        ]}
      >
        <Text style={styles.headerTitle}>Calendar</Text>

        <View style={styles.segmentedControl}>
          <Pressable
            onPress={() => setActiveSegment("calendar")}
            style={[
              styles.segment,
              activeSegment === "calendar" && styles.segmentActive,
            ]}
          >
            <Text
              style={
                activeSegment === "calendar"
                  ? styles.segmentTextActive
                  : styles.segmentText
              }
            >
              Calendar
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setActiveSegment("pattern")}
            style={[
              styles.segment,
              activeSegment === "pattern" && styles.segmentActive,
            ]}
          >
            <Text
              style={
                activeSegment === "pattern"
                  ? styles.segmentTextActive
                  : styles.segmentText
              }
            >
              Cycle Pattern
            </Text>
          </Pressable>
        </View>

        <View style={styles.analyticsCard}>
          <View style={styles.analyticsRow}>
            <Text style={styles.analyticsLabel}>Average cycle length</Text>
            <Text style={styles.analyticsValue}>{cycleStats.avgCycleLength} days</Text>
          </View>
          <View style={styles.analyticsRow}>
            <Text style={styles.analyticsLabel}>Average period length</Text>
            <Text style={styles.analyticsValue}>{cycleStats.avgPeriodLength} days</Text>
          </View>
        </View>

        {activeSegment === "calendar" ? (
          <>
            {months.map(({ year, month }) => {
              const monthLabel = formatMonthLabel(year, month);
              const weeks = buildWeeks(year, month);
              const predictedKeys = new Set(
                Object.keys(predictedDates).filter((key) => {
                  const date = parseDateKey(key);
                  return date.getFullYear() === year && date.getMonth() === month;
                }),
              );
              return (
                <View key={`${year}-${month}`} style={styles.monthCard}>
                  <Text style={styles.monthTitle}>{monthLabel}</Text>
                  <View style={styles.weekRow}>
                    {WEEKDAYS.map((label) => (
                      <Text key={label} style={styles.weekday}>
                        {label}
                      </Text>
                    ))}
                  </View>
                  {weeks.map((week, index) => (
                    <View key={index} style={styles.weekRow}>
                      {week.map((day, cellIndex) => {
                        if (!day) {
                          return <View key={`empty-${cellIndex}`} style={styles.dayCell} />;
                        }
                        const key = formatDateKey(new Date(year, month, day));
                        const isPeriod = !!draftDates[key];
                        const isPredicted = predictedKeys.has(key) && !isPeriod;
                        return (
                          <Pressable
                            key={key}
                            style={[
                              styles.dayCell,
                              isPredicted && styles.predictedDay,
                              isPeriod && styles.periodDay,
                            ]}
                            onPress={() => toggleDraftDate(year, month, day)}
                          >
                            <Text
                              style={[
                                styles.dayText,
                                isPredicted && styles.predictedDayText,
                                isPeriod && styles.periodDayText,
                              ]}
                            >
                              {day}
                            </Text>
                          </Pressable>
                        );
                      })}
                    </View>
                  ))}
                </View>
              );
            })}

            {hasChanges ? (
              <Pressable style={styles.saveButton} onPress={handleSave}>
                <Text style={styles.saveButtonText}>Save Changes</Text>
              </Pressable>
            ) : null}
          </>
        ) : (
          <>
            <Text style={styles.sectionTitle}>Cycle Pattern</Text>
            {cyclePatternRows.length ? (
              cyclePatternRows.map((row, index) => (
                <View key={`${row.label}-${index}`} style={styles.cycleRow}>
                  <Text style={styles.cycleLabel}>{row.label}</Text>
                  <View style={styles.cycleBar}>
                    <View style={styles.cycleRed} />
                    <View style={styles.cycleBlue} />
                  </View>
                </View>
              ))
            ) : (
              <Text style={styles.emptyStateText}>
                Log at least two cycles to see history.
              </Text>
            )}
          </>
        )}
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: {
    paddingHorizontal: 20,
  },
  headerTitle: {
    color: "#FFFFFF",
    fontSize: 20,
    marginBottom: 12,
  },
  segmentedControl: {
    flexDirection: "row",
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 999,
    padding: 4,
    marginBottom: 16,
  },
  segment: {
    flex: 1,
    paddingVertical: 6,
    borderRadius: 999,
    alignItems: "center",
  },
  segmentActive: {
    backgroundColor: "rgba(255,255,255,0.15)",
  },
  segmentText: { color: "rgba(255,255,255,0.6)", fontSize: 12 },
  segmentTextActive: { color: "#FFFFFF", fontSize: 12 },
  analyticsCard: {
    backgroundColor: "rgba(19,33,75,0.7)",
    borderRadius: 20,
    padding: 14,
    marginBottom: 16,
  },
  analyticsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  analyticsLabel: { color: "rgba(255,255,255,0.7)", fontSize: 12 },
  analyticsValue: { color: "#FFFFFF", fontSize: 12 },
  monthCard: {
    backgroundColor: "rgba(19,33,75,0.65)",
    borderRadius: 18,
    padding: 14,
    marginBottom: 16,
  },
  monthTitle: {
    color: "#FFFFFF",
    textAlign: "center",
    marginBottom: 10,
  },
  weekRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  weekday: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 10,
    width: (width - 80) / 7,
    textAlign: "center",
  },
  dayCell: {
    width: (width - 80) / 7,
    height: 26,
    borderRadius: 13,
    justifyContent: "center",
    alignItems: "center",
  },
  predictedDay: {
    backgroundColor: "rgba(209, 27, 27, 0.25)",
    borderWidth: 1,
    borderColor: "rgba(209, 27, 27, 0.45)",
  },
  dayText: { color: "#FFFFFF", fontSize: 12 },
  predictedDayText: { color: "#FFD6D6" },
  periodDay: { backgroundColor: "#D11B1B" },
  periodDayText: { color: "#FFFFFF", fontWeight: "bold" },
  sectionTitle: {
    color: "#FFFFFF",
    fontSize: 14,
    marginBottom: 12,
  },
  saveButton: {
    alignSelf: "center",
    marginBottom: 30,
    backgroundColor: "#1A5FA8",
    borderRadius: 18,
    paddingHorizontal: 24,
    paddingVertical: 10,
  },
  saveButtonText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 0.6,
  },
  cycleRow: {
    marginBottom: 12,
  },
  cycleLabel: { color: "#FFFFFF", fontSize: 12, marginBottom: 6 },
  cycleBar: {
    flexDirection: "row",
    height: 14,
    borderRadius: 999,
    overflow: "hidden",
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  cycleRed: { flex: 3, backgroundColor: "#C21616" },
  cycleBlue: { flex: 2, backgroundColor: "#4EA6FF" },
  emptyStateText: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 12,
    textAlign: "center",
    marginTop: 12,
  },
});
