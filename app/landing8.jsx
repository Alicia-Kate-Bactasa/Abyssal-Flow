import WaveBackground from "@/components/WaveBackground";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter, usePathname } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const { height } = Dimensions.get("window");

const DAYS = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year, month) {
  return new Date(year, month, 1).getDay();
}

export default function Landing8() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useLocalSearchParams();

  const now = new Date();
  const [currentYear, setCurrentYear] = useState(now.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(now.getMonth());
  const [selectedDates, setSelectedDates] = useState([]);

  const titleOpacity = useRef(new Animated.Value(0)).current;
  const titleY = useRef(new Animated.Value(24)).current;
  const subtitleOpacity = useRef(new Animated.Value(0)).current;
  const calendarOpacity = useRef(new Animated.Value(0)).current;
  const buttonOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.stagger(150, [
      Animated.parallel([
        Animated.timing(titleOpacity, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(titleY, {
          toValue: 0,
          duration: 600,
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(subtitleOpacity, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(calendarOpacity, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(buttonOpacity, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const goToPrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  const goToNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };

  const toggleDate = (day) => {
    const dateKey = `${currentYear}-${currentMonth}-${day}`;
    setSelectedDates((prev) =>
      prev.includes(dateKey)
        ? prev.filter((d) => d !== dateKey)
        : [...prev, dateKey],
    );
  };

  const isSelected = (day) => {
    const dateKey = `${currentYear}-${currentMonth}-${day}`;
    return selectedDates.includes(dateKey);
  };

  const renderCalendarDays = () => {
    const daysInMonth = getDaysInMonth(currentYear, currentMonth);
    const firstDay = getFirstDayOfMonth(currentYear, currentMonth);
    const cells = [];

    // Empty cells before first day
    for (let i = 0; i < firstDay; i++) {
      cells.push(<View key={`empty-${i}`} style={styles.dayCell} />);
    }

    // Day cells
    for (let day = 1; day <= daysInMonth; day++) {
      const selected = isSelected(day);
      cells.push(
        <TouchableOpacity
          key={day}
          style={[styles.dayCell, selected && styles.dayCellSelected]}
          onPress={() => toggleDate(day)}
          activeOpacity={0.7}
        >
          <Text
            style={[styles.dayNumber, selected && styles.dayNumberSelected]}
          >
            {day}
          </Text>
        </TouchableOpacity>,
      );
    }

    return cells;
  };

  return (
    <LinearGradient
      colors={["#041539", "#26466D"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={styles.gradient}
    >
      <StatusBar barStyle="light-content" />

      {/* ── Background ── */}
      <WaveBackground />

      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons name="chevron-back" size={28} color="#FFFFFF" />
        </TouchableOpacity>

        <View style={styles.innerContainer}>
          {/* ── Content ── */}
          <View style={styles.content}>
            {/* Title */}
            <Animated.Text
              style={[
                styles.title,
                { opacity: titleOpacity, transform: [{ translateY: titleY }] },
              ]}
            >
              Your Recent History
            </Animated.Text>

            {/* Subtitle */}
            <Animated.Text
              style={[styles.subtitle, { opacity: subtitleOpacity }]}
            >
              Tap the dates of your last period. The more logs you provide, the
              more accurate our prediction becomes.
            </Animated.Text>

            {/* Calendar */}
            <Animated.View
              style={[styles.calendar, { opacity: calendarOpacity }]}
            >
              {/* Month navigation */}
              <View style={styles.calendarHeader}>
                <TouchableOpacity
                  onPress={goToPrevMonth}
                  style={styles.navButton}
                >
                  <Text style={styles.navArrow}>‹</Text>
                </TouchableOpacity>
                <Text style={styles.monthLabel}>
                  {MONTHS[currentMonth]} {currentYear}
                </Text>
                <TouchableOpacity
                  onPress={goToNextMonth}
                  style={styles.navButton}
                >
                  <Text style={styles.navArrow}>›</Text>
                </TouchableOpacity>
              </View>

              {/* Day headers */}
              <View style={styles.dayHeaders}>
                {DAYS.map((d) => (
                  <Text key={d} style={styles.dayHeader}>
                    {d}
                  </Text>
                ))}
              </View>

              {/* Day grid */}
              <View style={styles.dayGrid}>{renderCalendarDays()}</View>
            </Animated.View>
          </View>

          {/* ── Next Button ── */}
          <Animated.View
            style={[styles.buttonContainer, { opacity: buttonOpacity }]}
          >
            <TouchableOpacity
              style={[
                styles.button,
                selectedDates.length === 0 && styles.buttonDisabled,
              ]}
              onPress={() => {
                router.push({
                  pathname: "/landing9",
                  params: { ...params, periodDates: selectedDates.join("|") },
                });
              }}
              activeOpacity={0.8}
            >
              <Text style={styles.buttonText}>Next</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
  },
  innerContainer: {
    flex: 1,
    justifyContent: "space-between",
  },
  backButton: {
    position: "absolute",
    top: 60,
    left: 16,
    zIndex: 10,
    padding: 8,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 28,
    paddingTop: height * 0.08,
  },
  title: {
    fontFamily: Platform.OS === "ios" ? "Georgia" : "serif",
    fontSize: 27,
    lineHeight: 44,
    fontWeight: "700",
    color: "#FFFFFF",
    textAlign: "center",
    marginBottom: 12,
  },
  subtitle: {
    fontFamily: Platform.OS === "ios" ? "Courier New" : "monospace",
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0.5,
    color: "#E1F2FF",
    textAlign: "center",
    marginBottom: 28,
    paddingHorizontal: 10,
  },

  // Calendar
  calendar: {
    backgroundColor: "#001242",
    borderRadius: 12,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 2, height: 16 },
    shadowOpacity: 0.09,
    shadowRadius: 19,
    elevation: 8,
  },
  calendarHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  navButton: {
    padding: 4,
  },
  navArrow: {
    color: "#B5BEC6",
    fontSize: 22,
    fontWeight: "300",
    lineHeight: 22,
  },
  monthLabel: {
    fontFamily: Platform.OS === "ios" ? "System" : "sans-serif",
    fontSize: 14,
    fontWeight: "600",
    color: "#FFFFFF",
    letterSpacing: 0.5,
  },

  // Day headers row
  dayHeaders: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  dayHeader: {
    width: 30,
    textAlign: "center",
    fontFamily: Platform.OS === "ios" ? "System" : "sans-serif",
    fontSize: 10,
    fontWeight: "600",
    letterSpacing: 1.5,
    color: "#B5BEC6",
  },

  // Day grid
  dayGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: 8,
  },
  dayCell: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
  },
  dayCellSelected: {
    backgroundColor: "#1BA2E6",
  },
  dayNumber: {
    fontFamily: Platform.OS === "ios" ? "System" : "sans-serif",
    fontSize: 14,
    fontWeight: "600",
    color: "#FFFFFF",
    textAlign: "center",
  },
  dayNumberSelected: {
    color: "#001242",
  },

  // Button
  buttonContainer: {
    alignItems: "center",
    paddingBottom: height * 0.09,
  },
  button: {
    backgroundColor: "#001242",
    borderRadius: 50,
    width: 206,
    height: 47,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#6DB4D8",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 5,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    fontFamily: Platform.OS === "ios" ? "Georgia" : "serif",
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
    letterSpacing: 1,
  },
});
