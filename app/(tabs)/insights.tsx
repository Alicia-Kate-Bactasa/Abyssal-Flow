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

const QUICK_INSIGHTS = [
  { title: "You feel happiest during ovulation", icon: "🙂" },
  { title: "Low energy appears 3 days before period", icon: "🍽️" },
  { title: "You feel happiest during ovulation", icon: "🙂" },
  { title: "Low energy appears 3 days before period", icon: "🍽️" },
];

const CALENDAR_DAYS = Array.from({ length: 30 }, (_, index) => index + 1);
const PERIOD_DAYS = [17, 18, 19, 20];

export default function InsightsScreen() {
  return (
    <LinearGradient colors={["#061736", "#1E3A78"]} style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Tidal Summary</Text>

        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Average cycle length</Text>
            <Text style={styles.summaryValue}>27 days</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Last period date</Text>
            <Text style={styles.summaryValue}>April 5</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Next predicted period</Text>
            <Text style={styles.summaryValue}>May 15, 2026</Text>
          </View>
        </View>

        <Text style={styles.subTitle}>September 2021</Text>
        <View style={styles.calendarCard}>
          <View style={styles.weekRow}>
            {"SMTWTFS".split("").map((letter) => (
              <Text key={letter} style={styles.weekdayLabel}>
                {letter}
              </Text>
            ))}
          </View>
          <View style={styles.daysGrid}>
            {CALENDAR_DAYS.map((day) => {
              const isPeriod = PERIOD_DAYS.includes(day);
              return (
                <View
                  key={day}
                  style={[styles.dayChip, isPeriod && styles.dayChipPeriod]}
                >
                  <Text
                    style={[styles.dayText, isPeriod && styles.dayTextPeriod]}
                  >
                    {day}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>

        <Text style={styles.sectionHeader}>Log Mood/Symptoms</Text>
        <View style={styles.iconRow}>
          {Array.from({ length: 8 }, (_, index) => (
            <View key={index} style={styles.iconChip}>
              <Text style={styles.iconText}>🙂</Text>
            </View>
          ))}
        </View>

        <View style={styles.insightGrid}>
          {QUICK_INSIGHTS.map((insight, index) => (
            <View key={index} style={styles.insightCard}>
              <Text style={styles.insightIcon}>{insight.icon}</Text>
              <Text style={styles.insightText}>{insight.title}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: {
    padding: 20,
    paddingBottom: 140,
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
  daysGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  dayChip: {
    width: (width - 90) / 7,
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 6,
  },
  dayChipPeriod: { backgroundColor: "#D11B1B" },
  dayText: { color: "#FFFFFF", fontSize: 12 },
  dayTextPeriod: { color: "#FFFFFF", fontWeight: "bold" },
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
  insightGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  insightCard: {
    width: "48%",
    backgroundColor: "rgba(23,44,92,0.8)",
    borderRadius: 18,
    padding: 14,
    marginBottom: 12,
  },
  insightIcon: { fontSize: 18, marginBottom: 6 },
  insightText: { color: "#FFFFFF", fontSize: 11 },
});
