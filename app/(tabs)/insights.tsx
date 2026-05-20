import { formatDateKey, parseDateKey, useCycleData } from "@/hooks/use-cycle-store";
import { LinearGradient } from "expo-linear-gradient";
import React, { useMemo, useState } from "react";
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
const WEEKDAYS = ["S", "M", "T", "W", "T", "F", "S"];

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

const getContextMessage = (moods: string[], symptoms: string[]) => {
  if (symptoms.includes("Bloating")) return "Hydrate well to help with bloating.";
  if (symptoms.includes("Cramps")) return "Warm compresses can ease cramping.";
  if (moods.includes("Energetic")) return "Your energy is high today.";
  if (moods.includes("Anxious")) return "Gentle breathing can help ease anxiety.";
  return "Keep tracking to unlock more insights.";
};

export default function InsightsScreen() {
  const insets = useSafeAreaInsets();
  const {
    periodDates,
    predictedDates,
    getCycleStats,
    getLogsForDate,
    getSymptomFrequencyForMonth,
  } = useCycleData();
  const [selectedDate, setSelectedDate] = useState(new Date());

  const cycleStats = getCycleStats();
  const months = useMemo(() => buildMonthRange(new Date(), 24, 24), []);
  const selectedLog = getLogsForDate(selectedDate);
  const moods = selectedLog?.moods ?? [];
  const symptoms = selectedLog?.symptoms ?? [];
  const contextMessage = getContextMessage(moods, symptoms);

  const currentMonthFrequency = getSymptomFrequencyForMonth(
    selectedDate.getFullYear(),
    selectedDate.getMonth(),
  ).slice(0, 3);

  const nextPredictedDate = useMemo(() => {
    const keys = Object.keys(predictedDates)
      .sort((a, b) => parseDateKey(a).getTime() - parseDateKey(b).getTime())
      .filter((key) => parseDateKey(key).getTime() >= new Date().getTime());
    return keys.length ? parseDateKey(keys[0]) : null;
  }, [predictedDates]);

  const phasePredictionText = nextPredictedDate
    ? `Next predicted period starts ${nextPredictedDate.toLocaleDateString("default", {
        month: "short",
        day: "numeric",
      })}.`
    : "Log more dates to unlock predictions.";

  const moodPatternText = moods.length
    ? `Recent mood focus: ${moods.slice(0, 2).join(" & ")}.`
    : "Log a mood to see patterns across your cycle.";

  return (
    <LinearGradient colors={["#061736", "#1E3A78"]} style={styles.container}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: 20 + insets.top, paddingBottom: 140 + insets.bottom },
        ]}
      >
        <Text style={styles.title}>Tidal Summary</Text>

        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Average cycle length</Text>
            <Text style={styles.summaryValue}>{cycleStats.avgCycleLength} days</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Average period length</Text>
            <Text style={styles.summaryValue}>{cycleStats.avgPeriodLength} days</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Phase prediction</Text>
            <Text style={styles.summaryValue}>{phasePredictionText}</Text>
          </View>
        </View>

        <Text style={styles.subTitle}>Cycle Calendar</Text>
        {months.map(({ year, month }) => {
          const weeks = buildWeeks(year, month);
          return (
            <View key={`${year}-${month}`} style={styles.calendarCard}>
              <Text style={styles.monthLabel}>{formatMonthLabel(year, month)}</Text>
              <View style={styles.weekRow}>
                {WEEKDAYS.map((letter, idx) => (
                  <Text key={`${letter}-${idx}`} style={styles.weekdayLabel}>
                    {letter}
                  </Text>
                ))}
              </View>
              {weeks.map((week, index) => (
                <View key={index} style={styles.weekRow}>
                  {week.map((day, cellIndex) => {
                    if (!day) {
                      return <View key={`empty-${cellIndex}`} style={styles.dayChip} />;
                    }
                    const dateKey = formatDateKey(new Date(year, month, day));
                    const isPeriod = !!periodDates[dateKey];
                    const isPredicted = !!predictedDates[dateKey] && !isPeriod;
                    const isSelected =
                      selectedDate.getFullYear() === year &&
                      selectedDate.getMonth() === month &&
                      selectedDate.getDate() === day;
                    return (
                      <Pressable
                        key={dateKey}
                        onPress={() => setSelectedDate(new Date(year, month, day))}
                        style={[
                          styles.dayChip,
                          isPredicted && styles.dayChipPredicted,
                          isPeriod && styles.dayChipPeriod,
                          isSelected && styles.dayChipSelected,
                        ]}
                      >
                        <Text
                          style={[
                            styles.dayText,
                            isPredicted && styles.dayTextPredicted,
                            isPeriod && styles.dayTextPeriod,
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

        <Text style={styles.sectionHeader}>Logged Moods</Text>
        <View style={styles.iconRow}>
          {moods.length ? (
            moods.map((mood) => (
              <View key={mood} style={styles.iconChip}>
                <Text style={styles.iconText}>{mood.slice(0, 2).toUpperCase()}</Text>
              </View>
            ))
          ) : (
            <Text style={styles.emptyStateText}>No moods logged.</Text>
          )}
        </View>

        <Text style={styles.sectionHeader}>Logged Symptoms</Text>
        <View style={styles.iconRow}>
          {symptoms.length ? (
            symptoms.map((symptom) => (
              <View key={symptom} style={styles.iconChip}>
                <Text style={styles.iconText}>
                  {symptom
                    .split(" ")
                    .map((word) => word[0])
                    .join("")
                    .toUpperCase()}
                </Text>
              </View>
            ))
          ) : (
            <Text style={styles.emptyStateText}>No symptoms logged.</Text>
          )}
        </View>

        <View style={styles.insightCardWide}>
          <Text style={styles.insightText}>{contextMessage}</Text>
        </View>

        <Text style={styles.sectionHeader}>Symptom Frequency</Text>
        <View style={styles.frequencyCard}>
          {currentMonthFrequency.length ? (
            currentMonthFrequency.map((entry) => (
              <View key={entry.label} style={styles.frequencyRow}>
                <Text style={styles.frequencyLabel}>{entry.label}</Text>
                <View style={styles.frequencyBarTrack}>
                  <View
                    style={[
                      styles.frequencyBarFill,
                      { width: `${Math.min(100, entry.count * 25)}%` },
                    ]}
                  />
                </View>
              </View>
            ))
          ) : (
            <Text style={styles.emptyStateText}>No symptoms logged this month.</Text>
          )}
        </View>

        <Text style={styles.sectionHeader}>Mood Patterns</Text>
        <View style={styles.insightCardWide}>
          <Text style={styles.insightText}>{moodPatternText}</Text>
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: {
    paddingHorizontal: 20,
  },
  title: {
    color: "#FFFFFF",
    textAlign: "center",
    fontSize: 16,
    marginBottom: 12,
  },
  summaryCard: {
    backgroundColor: "rgba(23,44,92,0.8)",
    borderRadius: 18,
    padding: 14,
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  summaryLabel: { color: "rgba(255,255,255,0.7)", fontSize: 12 },
  summaryValue: { color: "#FFFFFF", fontSize: 12 },
  subTitle: {
    color: "#FFFFFF",
    fontSize: 14,
    marginBottom: 8,
  },
  calendarCard: {
    backgroundColor: "rgba(23,44,92,0.7)",
    borderRadius: 16,
    padding: 12,
    marginBottom: 16,
  },
  monthLabel: {
    color: "#FFFFFF",
    fontSize: 12,
    textAlign: "center",
    marginBottom: 8,
  },
  weekRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  weekdayLabel: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 10,
    width: (width - 80) / 7,
    textAlign: "center",
  },
  dayChip: {
    width: (width - 90) / 7,
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 6,
  },
  dayChipSelected: {
    borderWidth: 1,
    borderColor: "#A8D8EA",
  },
  dayChipPeriod: { backgroundColor: "#D11B1B" },
  dayChipPredicted: {
    backgroundColor: "rgba(209, 27, 27, 0.25)",
    borderWidth: 1,
    borderColor: "rgba(209, 27, 27, 0.5)",
  },
  dayText: { color: "#FFFFFF", fontSize: 12 },
  dayTextPeriod: { color: "#FFFFFF", fontWeight: "bold" },
  dayTextPredicted: { color: "#FFD6D6" },
  sectionHeader: {
    color: "#FFFFFF",
    fontSize: 13,
    marginBottom: 10,
  },
  iconRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 18,
  },
  iconChip: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#4AA3FF",
    alignItems: "center",
    justifyContent: "center",
  },
  iconText: { color: "#FFFFFF", fontSize: 16 },
  insightCardWide: {
    backgroundColor: "rgba(23,44,92,0.8)",
    borderRadius: 18,
    padding: 14,
    marginBottom: 12,
  },
  insightText: { color: "#FFFFFF", fontSize: 11 },
  frequencyCard: {
    backgroundColor: "rgba(23,44,92,0.8)",
    borderRadius: 18,
    padding: 12,
    marginBottom: 18,
  },
  frequencyRow: {
    marginBottom: 10,
  },
  frequencyLabel: {
    color: "#FFFFFF",
    fontSize: 11,
    marginBottom: 6,
  },
  frequencyBarTrack: {
    height: 6,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.12)",
    overflow: "hidden",
  },
  frequencyBarFill: {
    height: 6,
    borderRadius: 999,
    backgroundColor: "#4EA6FF",
  },
  emptyStateText: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 12,
  },
});
