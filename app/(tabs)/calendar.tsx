import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import {
    Dimensions,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";

const { width } = Dimensions.get("window");

const MONTHS = [
  { name: "September 2021", days: 30, periodDays: [16, 17, 18, 19, 20] },
  { name: "September 2021", days: 30, periodDays: [16, 17, 18, 19, 20] },
  { name: "September 2021", days: 30, periodDays: [16, 17, 18, 19, 20] },
];

const WEEKDAYS = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

const chunkWeeks = (days: number) => {
  const weeks: number[][] = [];
  let week: number[] = [];
  for (let day = 1; day <= days; day += 1) {
    week.push(day);
    if (week.length === 7) {
      weeks.push(week);
      week = [];
    }
  }
  if (week.length) weeks.push(week);
  return weeks;
};

const CalendarMonth = ({
  name,
  days,
  periodDays,
}: {
  name: string;
  days: number;
  periodDays: number[];
}) => (
  <View style={styles.monthCard}>
    <Text style={styles.monthTitle}>{name}</Text>
    <View style={styles.weekRow}>
      {WEEKDAYS.map((label) => (
        <Text key={label} style={styles.weekday}>
          {label}
        </Text>
      ))}
    </View>
    {chunkWeeks(days).map((week, index) => (
      <View key={index} style={styles.weekRow}>
        {week.map((day) => {
          const isPeriod = periodDays.includes(day);
          return (
            <View
              key={day}
              style={[styles.dayCell, isPeriod && styles.periodDay]}
            >
              <Text
                style={[styles.dayText, isPeriod && styles.periodDayText]}
              >
                {day}
              </Text>
            </View>
          );
        })}
      </View>
    ))}
  </View>
);

const CycleRow = ({ label }: { label: string }) => (
  <View style={styles.cycleRow}>
    <Text style={styles.cycleLabel}>{label}</Text>
    <View style={styles.cycleBar}>
      <View style={styles.cycleRed} />
      <View style={styles.cycleBlue} />
    </View>
  </View>
);

export default function CalendarScreen() {
  return (
    <LinearGradient colors={["#04122B", "#1A2E5A"]} style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.headerTitle}>Calendar</Text>

        <View style={styles.segmentedControl}>
          <View style={[styles.segment, styles.segmentActive]}>
            <Text style={styles.segmentTextActive}>Calendar</Text>
          </View>
          <View style={styles.segment}>
            <Text style={styles.segmentText}>Cycle Pattern</Text>
          </View>
        </View>

        <View style={styles.analyticsCard}>
          <View style={styles.analyticsRow}>
            <Text style={styles.analyticsLabel}>Average cycle length</Text>
            <Text style={styles.analyticsValue}>27 days</Text>
          </View>
          <View style={styles.analyticsRow}>
            <Text style={styles.analyticsLabel}>Last period date</Text>
            <Text style={styles.analyticsValue}>April 5</Text>
          </View>
          <View style={styles.analyticsRow}>
            <Text style={styles.analyticsLabel}>Next predicted period</Text>
            <Text style={styles.analyticsValue}>May 15, 2026</Text>
          </View>
        </View>

        {MONTHS.map((month, index) => (
          <CalendarMonth
            key={`${month.name}-${index}`}
            name={month.name}
            days={month.days}
            periodDays={month.periodDays}
          />
        ))}

        <Text style={styles.sectionTitle}>Cycle Pattern</Text>
        {Array.from({ length: 5 }, (_, index) => (
          <CycleRow key={index} label="January: 27 days" />
        ))}
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: {
    paddingVertical: 20,
    paddingHorizontal: 20,
    paddingBottom: 140,
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
  dayText: { color: "#FFFFFF", fontSize: 12 },
  periodDay: { backgroundColor: "#D11B1B" },
  periodDayText: { color: "#FFFFFF", fontWeight: "bold" },
  sectionTitle: {
    color: "#FFFFFF",
    fontSize: 14,
    marginBottom: 12,
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
});
