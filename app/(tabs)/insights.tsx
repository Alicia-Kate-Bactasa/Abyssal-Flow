import { formatDateKey, parseDateKey, useCycleData } from "@/hooks/use-cycle-store";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React, { useMemo, useState } from "react";
import {
  Dimensions,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { width } = Dimensions.get("window");
const WEEKDAYS = ["S", "M", "T", "W", "T", "F", "S"];

const buildWeeks = (year: number, month: number) => {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const prevMonthDays = new Date(year, month, 0).getDate();

  const cells = [];

  for (let i = firstDay - 1; i >= 0; i--) {
    cells.push({ day: prevMonthDays - i, isCurrentMonth: false, monthOffset: -1 });
  }

  for (let i = 1; i <= daysInMonth; i++) {
    cells.push({ day: i, isCurrentMonth: true, monthOffset: 0 });
  }

  let nextMonthDay = 1;
  while (cells.length < 42) {
    cells.push({ day: nextMonthDay++, isCurrentMonth: false, monthOffset: 1 });
  }

  const weeks = [];
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
  const [currentViewDate, setCurrentViewDate] = useState(new Date());

  const cycleStats = getCycleStats();
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

  const handlePrevMonth = () => {
    setCurrentViewDate((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentViewDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const renderCalendar = () => {
    const year = currentViewDate.getFullYear();
    const month = currentViewDate.getMonth();
    const monthLabel = formatMonthLabel(year, month);
    const weeks = buildWeeks(year, month);

    return (
      <View style={styles.calendarCard}>
        <View style={styles.monthHeader}>
          <TouchableOpacity onPress={handlePrevMonth} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Ionicons name="chevron-back" size={20} color="#4EA6FF" />
          </TouchableOpacity>
          
          <Text style={styles.monthLabel}>{monthLabel}</Text>
          
          <TouchableOpacity onPress={handleNextMonth} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Ionicons name="chevron-forward" size={20} color="#4EA6FF" />
          </TouchableOpacity>
        </View>

        <View style={styles.weekRow}>
          {WEEKDAYS.map((letter, idx) => (
            <Text key={`${letter}-${idx}`} style={styles.weekdayLabel}>
              {letter}
            </Text>
          ))}
        </View>
        
        {weeks.map((week, index) => (
          <View key={index} style={styles.weekRow}>
            {week.map((cell, cellIndex) => {
              const targetDate = new Date(year, month + cell.monthOffset, cell.day);
              const dateKey = formatDateKey(targetDate);
              const isPeriod = !!periodDates[dateKey];
              const isPredicted = !!predictedDates[dateKey] && !isPeriod;
              const isSelected =
                selectedDate.getFullYear() === targetDate.getFullYear() &&
                selectedDate.getMonth() === targetDate.getMonth() &&
                selectedDate.getDate() === targetDate.getDate();

              return (
                <Pressable
                  key={`${index}-${cellIndex}`}
                  onPress={() => setSelectedDate(targetDate)}
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
                      !cell.isCurrentMonth && styles.outOfMonthText,
                      isPredicted && styles.dayTextPredicted,
                      isPeriod && styles.dayTextPeriod,
                    ]}
                  >
                    {cell.day}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        ))}
      </View>
    );
  };

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
        
        {renderCalendar()}

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
  monthHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
    paddingHorizontal: 10,
  },
  monthLabel: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
  },
  weekRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  weekdayLabel: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 10,
    width: (width - 90) / 7,
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
  outOfMonthText: { color: "rgba(255,255,255,0.3)" },
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