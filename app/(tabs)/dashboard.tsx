import React, { useRef, useEffect, useCallback } from "react";
import {
  View,
  StyleSheet,
  Animated,
  PanResponder,
  Text,
  Dimensions,
} from "react-native";
import * as Haptics from "expo-haptics";
import AbyssalBackground from "../../components/AbyssalBackground";

const { width } = Dimensions.get("window");

const MOON_SIZE = width * 0.7;
const WRAPPER_SIZE = width * 1.4;
const DAY_CIRCLE_RADIUS = MOON_SIZE / 2 + 35;

// ==========================================
// 1. THE MINI-COMPONENT
// ==========================================
const CircularCalendarDial = () => {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();
  const currentDay = now.getDate();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const monthName = now
    .toLocaleString("default", { month: "long" })
    .toUpperCase();

  const angleSlice = 360 / daysInMonth;
  const initialRotationAngle = -(currentDay - 1) * angleSlice;

  const rotationAngle = useRef(
    new Animated.Value(initialRotationAngle),
  ).current;

  // NEW: This ref tracks the EXACT live angle of the wheel to prevent jumping
  const currentAngleRef = useRef(initialRotationAngle);
  const inactivityTimer = useRef<number | null>(null);

  // --- HAPTIC & LIVE ANGLE TRACKER ---
  useEffect(() => {
    let lastTick = Math.round(initialRotationAngle / angleSlice);
    const listenerId = rotationAngle.addListener(({ value }) => {
      currentAngleRef.current = value; // Continuously update our live tracker!

      const currentTick = Math.round(value / angleSlice);
      if (currentTick !== lastTick) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        lastTick = currentTick;
      }
    });
    return () => rotationAngle.removeListener(listenerId);
  }, []);

  const resetToToday = useCallback(() => {
    Animated.spring(rotationAngle, {
      toValue: initialRotationAngle,
      useNativeDriver: true,
      tension: 40,
      friction: 8,
    }).start();
  }, [rotationAngle, initialRotationAngle]);

  const startInactivityTimer = useCallback(() => {
    if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
    inactivityTimer.current = setTimeout(() => {
      resetToToday();
    }, 5000);
  }, [resetToToday]);

  useEffect(() => {
    startInactivityTimer();
    return () => {
      if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
    };
  }, [startInactivityTimer]);

  // --- RESPONSIVE PAN RESPONDER ---
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        if (inactivityTimer.current) clearTimeout(inactivityTimer.current);

        // NEW: Stop the wheel instantly if the user grabs it while it's snapping
        rotationAngle.stopAnimation();

        // NEW: Use the perfectly accurate live ref for the offset
        rotationAngle.setOffset(currentAngleRef.current);
        rotationAngle.setValue(0);
      },
      onPanResponderMove: (evt, gestureState) => {
        // Slowed down the speed to 0.5 for a "heavier", smoother feel
        const rotationSpeed = 0.5;
        rotationAngle.setValue(gestureState.dx * rotationSpeed);
      },
      onPanResponderRelease: () => {
        rotationAngle.flattenOffset();

        // Use the live ref to calculate the snap!
        const snapAngle =
          Math.round(currentAngleRef.current / angleSlice) * angleSlice;

        Animated.spring(rotationAngle, {
          toValue: snapAngle,
          useNativeDriver: true,
          tension: 60,
          friction: 8,
        }).start(({ finished }) => {
          if (finished) {
            startInactivityTimer();
          }
        });
      },
    }),
  ).current;

  const rotateInterpolate = rotationAngle.interpolate({
    inputRange: [-3600, 3600],
    outputRange: ["-3600deg", "3600deg"],
  });

  const generateDayElements = () => {
    const days = [];
    for (let day = 1; day <= daysInMonth; day++) {
      const angle = (day - 1) * angleSlice - 90;
      const radians = (angle * Math.PI) / 180;
      const x = Math.cos(radians) * DAY_CIRCLE_RADIUS;
      const y = Math.sin(radians) * DAY_CIRCLE_RADIUS;
      const isToday = day === currentDay;

      days.push(
        <View
          key={day}
          style={[
            styles.dayContainer,
            {
              top: WRAPPER_SIZE / 2 - 25,
              left: WRAPPER_SIZE / 2 - 25,
              transform: [
                { translateX: x },
                { translateY: y },
                { rotate: `${angle + 90}deg` },
              ],
            },
          ]}
        >
          <View style={[styles.dayCircle, isToday && styles.dayCircleActive]}>
            <Text style={[styles.dayText, isToday && styles.dayTextActive]}>
              {day}
            </Text>
          </View>
        </View>,
      );
    }
    return days;
  };

  return (
    <View style={styles.dialContainer}>
      <Animated.View
        style={[
          styles.calendarMoonWrapper,
          { transform: [{ rotate: rotateInterpolate }] },
        ]}
        {...panResponder.panHandlers}
      >
        <View style={styles.moon} />
        {generateDayElements()}
      </Animated.View>
      <Text style={styles.monthIndicator}>
        {monthName} {currentYear}
      </Text>
    </View>
  );
};

// ==========================================
// 2. THE MAIN SCREEN EXPORT
// ==========================================
export default function Dashboard() {
  return (
    <AbyssalBackground
      middleLayer={
        <View style={styles.moonWrapper}>
          <CircularCalendarDial />
        </View>
      }
    >
      <View style={styles.topSection}>
        <View style={styles.headerContent}>
          <Text style={styles.greeting}>Hello, ishie!</Text>
          <Text style={styles.subGreeting}>your period is in 4 days</Text>
          <View style={styles.separator} />
          <Text style={styles.phaseTitle}>Current Phase: Luteal</Text>
        </View>
      </View>

      <View style={styles.bottomSection}>
        <View style={styles.bottomContent}>
          <Text style={styles.dayNumber}>DAY 20</Text>
          <Text style={styles.dayLabel}>of cycle</Text>
        </View>
      </View>
    </AbyssalBackground>
  );
}

// ==========================================
// 3. STYLES
// ==========================================
const styles = StyleSheet.create({
  topSection: { flex: 1.2 },
  moonWrapper: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    // REMOVED zIndex: 10 so it properly hides behind the wave!
  },
  bottomSection: { flex: 1 },

  dialContainer: {
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  calendarMoonWrapper: {
    width: WRAPPER_SIZE,
    height: WRAPPER_SIZE,
    borderRadius: WRAPPER_SIZE / 2,
    position: "relative",
  },
  moon: {
    width: MOON_SIZE,
    height: MOON_SIZE,
    borderRadius: MOON_SIZE / 2,
    backgroundColor: "#FFFFFF",
    shadowColor: "#FFFFFF",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 20,
    elevation: 15,
    position: "absolute",
    top: (WRAPPER_SIZE - MOON_SIZE) / 2,
    left: (WRAPPER_SIZE - MOON_SIZE) / 2,
  },
  dayContainer: {
    position: "absolute",
    width: 50,
    height: 50,
    justifyContent: "center",
    alignItems: "center",
  },
  dayCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "transparent",
  },
  dayCircleActive: { backgroundColor: "#1A237E" },
  dayText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#A0B4D0",
    textAlign: "center",
  },
  dayTextActive: { color: "#FFFFFF", fontSize: 15, fontWeight: "700" },
  monthIndicator: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
    marginTop: 30,
    letterSpacing: 3,
    fontFamily: "monospace",
  },

  // Typography Styles
  headerContent: {
    alignItems: "center",
    marginTop: 80,
  },
  greeting: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#FFFFFF",
    letterSpacing: 1,
  },
  subGreeting: {
    fontSize: 16,
    color: "#A0B4D0",
    marginTop: 5,
    marginBottom: 15,
  },
  separator: {
    width: 40,
    height: 2,
    backgroundColor: "#64B5F6",
    marginBottom: 15,
    borderRadius: 2,
  },
  phaseTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFFFFF",
    letterSpacing: 1.5,
    textTransform: "uppercase",
  },
  bottomContent: {
    flex: 1,
    justifyContent: "flex-end",
    alignItems: "center",
    paddingBottom: 40,
  },
  dayNumber: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#FFFFFF",
    letterSpacing: 2,
  },
  dayLabel: {
    fontSize: 14,
    color: "#E0E0E0",
    letterSpacing: 1,
    marginTop: 2,
    textTransform: "uppercase",
  },
});
