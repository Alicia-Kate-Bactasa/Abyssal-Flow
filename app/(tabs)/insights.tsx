import {
  formatDateKey,
  parseDateKey,
  useCycleData,
} from "@/hooks/use-cycle-store";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { width, height } = Dimensions.get("window");
const WEEKDAYS = ["S", "M", "T", "W", "T", "F", "S"];

const buildWeeks = (year: number, month: number) => {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const prevMonthDays = new Date(year, month, 0).getDate();

  const cells = [];

  for (let i = firstDay - 1; i >= 0; i--) {
    cells.push({
      day: prevMonthDays - i,
      isCurrentMonth: false,
      monthOffset: -1,
    });
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

const DAY_MS = 1000 * 60 * 60 * 24;

const getCycleDayFromDates = (
  anchor: Date,
  date: Date,
  cycleLength: number,
) => {
  const anchorUtc = Date.UTC(
    anchor.getFullYear(),
    anchor.getMonth(),
    anchor.getDate(),
  );
  const dateUtc = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
  return (
    (Math.max(0, Math.floor((dateUtc - anchorUtc) / DAY_MS)) % cycleLength) + 1
  );
};

const getPhaseKey = (cycleDay: number, cycleLength: number) => {
  const menstrualEnd = Math.max(4, Math.round(cycleLength * 0.18));
  const follicularEnd = Math.max(
    menstrualEnd + 1,
    Math.round(cycleLength * 0.46),
  );
  const ovulationEnd = Math.max(
    follicularEnd + 1,
    Math.round(cycleLength * 0.61),
  );

  if (cycleDay <= menstrualEnd) return "menstrual";
  if (cycleDay <= follicularEnd) return "follicular";
  if (cycleDay <= ovulationEnd) return "ovulation";
  return "luteal";
};

const getContextMessage = (
  moods: string[],
  symptoms: string[],
  profile: {
    cycleRegularity: string | null;
    medicalCheckups: string | null;
    typicalFlow: string | null;
    healthHistory: string[];
    medications: string[];
    comfortFood: string[];
    symptoms: string[];
    moods: string[];
  },
) => {
  if (symptoms.includes("Bloating"))
    return "The tide surges. Drink more water to find your center.";
  if (symptoms.includes("Cramps"))
    return "Currents are swift. Rest in the ocean's gentle embrace.";
  if (moods.includes("Energetic"))
    return "You are a radiant pearl of energy today.";
  if (moods.includes("Anxious"))
    return "The sea is deep. Breathe deeply to calm the inner waters.";
  if (profile.cycleRegularity === "irregular")
    return "Your cycle may shift more often, so every log sharpens the forecast.";
  if (profile.typicalFlow === "heavy")
    return "Your heavier flow notes will help shape clearer tide predictions.";
  if (profile.medicalCheckups === "never")
    return "Keep logging your cycle so the forecast can stay accurate between checkups.";
  if (profile.healthHistory.includes("pcos"))
    return "Your PCOS history can help the forecast stay tuned to longer cycle shifts.";
  if (profile.healthHistory.includes("endometriosis"))
    return "Your endometriosis history helps keep the tide guidance grounded in real patterns.";
  if (profile.medications.includes("birth_control"))
    return "Your medication profile can help explain cycle changes and soften the forecast gaps.";
  if (profile.comfortFood.includes("sweet"))
    return "Sweet cravings are another signal your cycle pattern can learn from.";
  if (
    profile.symptoms.includes("cramps") ||
    profile.symptoms.includes("bloating")
  )
    return "Your saved symptom profile can help tune future tide guidance.";
  if (profile.moods.includes("anxiety") || profile.moods.includes("lowmood"))
    return "Your mood profile is tracked to help surface calmer guidance.";
  return "Chart your path across the cosmic ocean of cycle insights.";
};

const TinySpeck = ({
  top,
  left,
  opacity,
}: {
  top: number;
  left: number;
  opacity: number;
}) => {
  return <View style={[styles.speck, { top, left, opacity }]} />;
};

const BackgroundSparkles = () => {
  const specks = useMemo(() => {
    return Array.from({ length: 60 }, (_, idx) => ({
      id: idx,
      top: Math.random() * height,
      left: Math.random() * width,
      opacity: 0.25 + Math.random() * 0.45,
    }));
  }, []);

  return (
    <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
      {specks.map((s) => (
        <TinySpeck key={s.id} top={s.top} left={s.left} opacity={s.opacity} />
      ))}
    </View>
  );
};

// Component for the pulsing text shadow on headings
const PulsingHeading = ({
  style,
  children,
}: {
  style: any;
  children: React.ReactNode;
}) => {
  const glowAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 6,
          duration: 2000,
          useNativeDriver: false,
        }),
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: false,
        }),
      ]),
    ).start();
  }, [glowAnim]);

  return (
    <Animated.Text
      style={[
        style,
        {
          textShadowColor: "rgba(255, 255, 255, 0.7)",
          textShadowOffset: { width: 0, height: 0 },
          textShadowRadius: glowAnim,
        },
      ]}
    >
      {children}
    </Animated.Text>
  );
};

export default function InsightsScreen() {
  const insets = useSafeAreaInsets();
  const {
    periodDates,
    predictedDates,
    getCycleStats,
    getLatestPeriodStart,
    getLogsForDate,
    getSymptomFrequencyForMonth,
    profile,
    setSelectedLogDate,
  } = useCycleData();

  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [currentViewDate, setCurrentViewDate] = useState<Date>(new Date());

  // When period data changes, default the selection to the latest recorded period start
  useEffect(() => {
    const latest = getLatestPeriodStart();
    if (latest) {
      setSelectedDate(latest);
      setCurrentViewDate(new Date(latest.getFullYear(), latest.getMonth(), 1));
    }
  }, [getLatestPeriodStart, periodDates]);

  useEffect(() => {
    try {
      if (setSelectedLogDate) setSelectedLogDate(selectedDate);
    } catch {
      // ignore
    }
  }, [selectedDate, setSelectedLogDate]);

  const cycleStats = getCycleStats();
  const selectedLog = getLogsForDate(selectedDate);
  const moods = selectedLog?.moods ?? [];
  const symptoms = selectedLog?.symptoms ?? [];
  const contextMessage = getContextMessage(moods, symptoms, profile);

  const currentMonthFrequency = getSymptomFrequencyForMonth(
    selectedDate.getFullYear(),
    selectedDate.getMonth(),
  ).slice(0, 3);

  const latestPeriodStart = getLatestPeriodStart();

  const nextPredictedDate = useMemo(() => {
    const keys = Object.keys(predictedDates)
      .sort((a, b) => parseDateKey(a).getTime() - parseDateKey(b).getTime())
      .filter((key) => parseDateKey(key).getTime() >= new Date().getTime());
    return keys.length ? parseDateKey(keys[0]) : null;
  }, [predictedDates]);

  const currentPhase = useMemo(() => {
    if (!latestPeriodStart) return "Unknown Depth";

    const cycleLength = cycleStats.cycleLength;
    const cycleDay = getCycleDayFromDates(
      latestPeriodStart,
      new Date(),
      cycleLength,
    );
    const phaseKey = getPhaseKey(cycleDay, cycleLength);

    if (phaseKey === "menstrual") return "Abyssal Flow (Menstruation)";
    if (phaseKey === "follicular") return "Rising Tide (Follicular)";
    if (phaseKey === "ovulation") return "Crest (Ovulation)";
    return "Ebbing Tide (Luteal)";
  }, [cycleStats.cycleLength, latestPeriodStart]);

  const phasePredictionText = nextPredictedDate
    ? `Currents shift around ${nextPredictedDate.toLocaleDateString("default", {
        month: "short",
        day: "numeric",
      })}.`
    : "The cosmic path is unknown.";

  const handlePrevMonth = () => {
    setCurrentViewDate(
      (prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1),
    );
  };

  const handleNextMonth = () => {
    setCurrentViewDate(
      (prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1),
    );
  };

  const renderCalendar = () => {
    const year = currentViewDate.getFullYear();
    const month = currentViewDate.getMonth();
    const monthLabel = formatMonthLabel(year, month);
    const weeks = buildWeeks(year, month);

    return (
      <View style={styles.calendarCard}>
        <View style={styles.monthHeader}>
          <TouchableOpacity
            onPress={handlePrevMonth}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="chevron-back" size={18} color="#FFFFFF" />
          </TouchableOpacity>

          <PulsingHeading style={styles.monthLabelGlow}>
            {monthLabel}
          </PulsingHeading>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <TouchableOpacity
              onPress={() => {
                setCurrentViewDate(new Date());
                setSelectedDate(new Date());
              }}
              style={styles.smallTodayButton}
            >
              <Text style={styles.smallTodayText}>Today</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleNextMonth}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              style={{ marginLeft: 8 }}
            >
              <Ionicons name="chevron-forward" size={18} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
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
              if (!cell.isCurrentMonth) {
                return (
                  <View key={`${index}-${cellIndex}`} style={styles.dayChip} />
                );
              }

              const targetDate = new Date(
                year,
                month + cell.monthOffset,
                cell.day,
              );
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
      <BackgroundSparkles />
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: 20 + insets.top, paddingBottom: 140 + insets.bottom },
        ]}
      >
        <PulsingHeading style={styles.titleGlow}>
          Oceanic Summary
        </PulsingHeading>

        <View style={styles.summaryCard}>
          <PulsingHeading style={styles.subTitleGlow}>
            Celestial Currents
          </PulsingHeading>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Current Tide Phase</Text>
            <Text style={styles.summaryValue}>{currentPhase}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Oceanic Cycle Length</Text>
            <Text style={styles.summaryValue}>
              {cycleStats.avgCycleLength} days
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Tide Flow Duration</Text>
            <Text style={styles.summaryValue}>
              {cycleStats.avgPeriodLength} days
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Forecast</Text>
            <Text style={styles.summaryValue}>{phasePredictionText}</Text>
          </View>
        </View>

        {renderCalendar()}

        <Text style={styles.dashboardNote}>
          This calendar is for viewing cycles only. To edit logs, go to Calendar Dashboard.
        </Text>

        {/* Dynamic Daily Summary based on Calendar Selection */}
        <View style={styles.summaryCard}>
          <PulsingHeading style={styles.subTitleGlow}>
            Daily Dive:{" "}
            {selectedDate.toLocaleDateString("default", {
              month: "short",
              day: "numeric",
            })}
          </PulsingHeading>
          {moods.length > 0 || symptoms.length > 0 ? (
            <>
              {moods.length > 0 && (
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Auras (Moods)</Text>
                  <Text style={styles.summaryValue}>{moods.join(", ")}</Text>
                </View>
              )}
              {symptoms.length > 0 && (
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Echoes (Symptoms)</Text>
                  <Text style={styles.summaryValue}>{symptoms.join(", ")}</Text>
                </View>
              )}
            </>
          ) : (
            <Text style={styles.emptyStateText}>
              Waters were undisturbed on this day.
            </Text>
          )}
        </View>

        <View style={styles.frequencyCard}>
          <PulsingHeading style={styles.sectionHeaderGlow}>
            Echo Frequency (This Month)
          </PulsingHeading>
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
            <Text style={styles.emptyStateText}>
              No echoes logged this month.
            </Text>
          )}
        </View>

        <View style={styles.insightCardWide}>
          <Text style={styles.insightText}>{contextMessage}</Text>
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
  // Speck styling
  speck: {
    position: "absolute",
    width: 1.5,
    height: 1.5,
    backgroundColor: "#FFFFFF",
    borderRadius: 1,
    shadowColor: "#FFFFFF",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 3,
  },
  // Heading text styles (smaller, Georgia)
  titleGlow: {
    fontFamily: "Georgia",
    fontSize: 16,
    letterSpacing: 0.5,
    marginBottom: 20,
    textAlign: "center",
    color: "#FFFFFF",
  },
  dashboardNote: {
    color: "rgba(255,255,255,0.65)",
    fontSize: 11,
    lineHeight: 15,
    textAlign: "center",
    marginBottom: 16,
    fontFamily: "monospace",
  },
  subTitleGlow: {
    fontFamily: "Georgia",
    fontSize: 14,
    marginBottom: 14,
    color: "#FFFFFF",
  },
  sectionHeaderGlow: {
    fontFamily: "Georgia",
    fontSize: 13,
    marginBottom: 12,
    color: "#FFFFFF",
  },
  monthLabelGlow: {
    fontFamily: "Georgia",
    fontSize: 15,
    textAlign: "center",
    color: "#FFFFFF",
  },
  smallTodayButton: {
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
  },
  smallTodayText: {
    color: "#E1F2FF",
    fontSize: 11,
    fontFamily: "monospace",
  },
  // Layout and Card styles
  summaryCard: {
    backgroundColor: "rgba(23,44,92,0.5)",
    borderRadius: 22,
    padding: 18,
    marginBottom: 22,
    borderWidth: 0.3,
    borderColor: "rgba(255,255,255,0.4)",
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
    borderBottomWidth: 0.3,
    borderBottomColor: "rgba(255,255,255,0.2)",
    paddingBottom: 4,
  },
  summaryLabel: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 13,
    fontWeight: "normal",
  },
  summaryValue: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "normal",
    maxWidth: "50%",
    textAlign: "right",
  },
  calendarCard: {
    backgroundColor: "rgba(23,44,92,0.5)",
    borderRadius: 20,
    padding: 14,
    marginBottom: 20,
    borderWidth: 0.3,
    borderColor: "rgba(255,255,255,0.4)",
  },
  monthHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
    paddingHorizontal: 12,
  },
  weekRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  weekdayLabel: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 11,
    fontWeight: "normal",
    width: (width - 90) / 7,
    textAlign: "center",
  },
  dayChip: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
    backgroundColor: "transparent",
  },
  dayChipSelected: {
    borderWidth: 1.2,
    borderColor: "rgba(255,255,255,0.95)",
    backgroundColor: "transparent",
  },
  dayChipPeriod: {
    borderWidth: 0,
    backgroundColor: "#ff5e5e",
  },
  dayChipPredicted: {
    borderWidth: 0,
    backgroundColor: "#ff7777",
  },
  dayText: { color: "#FFFFFF", fontSize: 13, fontWeight: "700" },
  dayTextSelected: { color: "#FFFFFF", fontWeight: "700" },
  outOfMonthText: { color: "rgba(255,255,255,0.3)" },
  dayTextPeriod: { color: "#FFFFFF", fontWeight: "bold" },
  dayTextPredicted: { color: "rgba(255,255,255,0.7)" },
  insightCardWide: {
    backgroundColor: "rgba(23,44,92,0.5)",
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    borderWidth: 0.3,
    borderColor: "rgba(255,255,255,0.4)",
  },
  insightText: { color: "#FFFFFF", fontSize: 13, lineHeight: 18 },
  frequencyCard: {
    backgroundColor: "rgba(23,44,92,0.5)",
    borderRadius: 22,
    padding: 14,
    marginBottom: 20,
    borderWidth: 0.3,
    borderColor: "rgba(255,255,255,0.4)",
  },
  frequencyRow: {
    marginBottom: 12,
  },
  frequencyLabel: {
    color: "#FFFFFF",
    fontSize: 12,
    marginBottom: 7,
    fontWeight: "normal",
  },
  frequencyBarTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: "rgba(255,255,255,0.1)",
    overflow: "hidden",
  },
  frequencyBarFill: {
    height: 6,
    borderRadius: 3,
    backgroundColor: "#FFFFFF",
  },
  emptyStateText: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 13,
    fontStyle: "italic",
    textAlign: "center",
    marginTop: 6,
  },
});
