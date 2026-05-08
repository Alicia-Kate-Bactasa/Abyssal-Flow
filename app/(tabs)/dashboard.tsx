import React, { useRef, useEffect, useCallback, useState } from "react";
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

const { width, height } = Dimensions.get("window");

const MOON_SIZE = width * 0.85;
const WRAPPER_SIZE = width * 1.6;
const DAY_CIRCLE_RADIUS = MOON_SIZE / 2 + 25;

// The exact center coordinates of your moon dial on the screen
const DIAL_CENTER_X = width / 2;
const DIAL_CENTER_Y = height * 0.28 + WRAPPER_SIZE / 2;

const DECAY_DECELERATION = 0.9965;
const WEEKDAYS = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

// ==========================================
// 1. THE MINI-COMPONENT (Infinite Momentum Dial)
// ==========================================
const CircularCalendarDial = ({
  onDayChange,
}: {
  onDayChange: (day: number) => void;
}) => {
  const [viewDate, setViewDate] = useState(new Date());

  const currentYear = viewDate.getFullYear();
  const currentMonth = viewDate.getMonth();
  const currentDay = new Date().getDate();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

  const angleSlice = 360 / daysInMonth;

  const isCurrentMonth =
    new Date().getMonth() === currentMonth &&
    new Date().getFullYear() === currentYear;
  const initialRotationAngle = isCurrentMonth
    ? -(currentDay - 1) * angleSlice
    : 0;

  const rotationAngle = useRef(
    new Animated.Value(initialRotationAngle),
  ).current;
  const currentAngleRef = useRef(initialRotationAngle);

  // NEW: Tracks the exact radian angle of your finger on the previous frame
  const previousAngleRef = useRef(0);

  const inactivityTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastTickRef = useRef(Math.round(initialRotationAngle / angleSlice));

  useEffect(() => {
    const id = rotationAngle.addListener(({ value }) => {
      currentAngleRef.current = value;

      const tick = Math.round(-value / angleSlice);
      if (tick !== lastTickRef.current) {
        lastTickRef.current = tick;
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        const liveDay = tick + 1;
        if (liveDay >= 1 && liveDay <= daysInMonth) {
          onDayChange(liveDay);
        }
      }
    });
    return () => rotationAngle.removeListener(id);
  }, [angleSlice, daysInMonth, onDayChange, rotationAngle]);

  const snapToNearest = useCallback(
    (fromVelocityDegPerMs = 0) => {
      const raw = currentAngleRef.current;
      const snapped = Math.round(raw / angleSlice) * angleSlice;

      Animated.spring(rotationAngle, {
        toValue: snapped,
        velocity: fromVelocityDegPerMs,
        useNativeDriver: true,
        tension: 60,
        friction: 10,
      }).start(({ finished }) => {
        if (finished) {
          const landedIndex = Math.round(-snapped / angleSlice);
          if (landedIndex >= daysInMonth) {
            setViewDate(new Date(currentYear, currentMonth + 1, 1));
            rotationAngle.setValue(0);
          } else if (landedIndex < 0) {
            const prevDays = new Date(currentYear, currentMonth, 0).getDate();
            setViewDate(new Date(currentYear, currentMonth - 1, 1));
            rotationAngle.setValue(-(prevDays - 1) * (360 / prevDays));
          }
          startInactivityTimer();
        }
      });
    },
    [angleSlice, daysInMonth, currentYear, currentMonth, rotationAngle],
  );

  const resetToToday = useCallback(() => {
    const today = new Date();
    setViewDate(today);
    const targetDays = new Date(
      today.getFullYear(),
      today.getMonth() + 1,
      0,
    ).getDate();
    const targetAngle = -(today.getDate() - 1) * (360 / targetDays);

    Animated.spring(rotationAngle, {
      toValue: targetAngle,
      useNativeDriver: true,
      tension: 40,
      friction: 8,
    }).start();
  }, [rotationAngle]);

  const startInactivityTimer = useCallback(() => {
    if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
    inactivityTimer.current = setTimeout(resetToToday, 5000);
  }, [resetToToday]);

  useEffect(() => {
    startInactivityTimer();
    return () => {
      if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
    };
  }, [startInactivityTimer]);

  const panResponder = useRef(
    PanResponder.create({
      // Claim the gesture if the user moves their finger in ANY direction by 5 pixels
      onMoveShouldSetPanResponder: (_evt, gs) => {
        const distance = Math.sqrt(gs.dx * gs.dx + gs.dy * gs.dy);
        return distance > 5;
      },
      onStartShouldSetPanResponder: () => false,

      onPanResponderGrant: (_evt, gs) => {
        if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
        rotationAngle.stopAnimation((stoppedAt) => {
          currentAngleRef.current = stoppedAt;
        });

        // Calculate the exact starting angle using Math.atan2
        const rx = gs.x0 - DIAL_CENTER_X;
        const ry = gs.y0 - DIAL_CENTER_Y;
        previousAngleRef.current = Math.atan2(ry, rx);
      },

      onPanResponderMove: (_evt, gs) => {
        // Calculate the new angle on this frame
        const rx = gs.moveX - DIAL_CENTER_X;
        const ry = gs.moveY - DIAL_CENTER_Y;
        const currentAngle = Math.atan2(ry, rx);

        // Find out how many radians the finger moved
        let deltaAngle = currentAngle - previousAngleRef.current;

        // Fix the math wrap-around (when crossing the left side of the circle)
        if (deltaAngle > Math.PI) deltaAngle -= 2 * Math.PI;
        if (deltaAngle < -Math.PI) deltaAngle += 2 * Math.PI;

        // Convert radians to degrees and add it to our wheel!
        const deltaDeg = deltaAngle * (180 / Math.PI);
        currentAngleRef.current += deltaDeg;
        rotationAngle.setValue(currentAngleRef.current);

        // Save this angle for the next frame
        previousAngleRef.current = currentAngle;
      },

      onPanResponderRelease: (_evt, gs) => {
        const rx = gs.moveX - DIAL_CENTER_X;
        const ry = gs.moveY - DIAL_CENTER_Y;
        const rSquared = rx * rx + ry * ry;

        // Angular Velocity Physics Formula: ω = (r_x * v_y - r_y * v_x) / r^2
        let angularVelocityRadPerMs = 0;
        if (rSquared > 0) {
          angularVelocityRadPerMs = (rx * gs.vy - ry * gs.vx) / rSquared;
        }

        const velocityDegPerMs = angularVelocityRadPerMs * (180 / Math.PI);

        Animated.decay(rotationAngle, {
          velocity: velocityDegPerMs,
          deceleration: DECAY_DECELERATION,
          useNativeDriver: true,
        }).start(({ finished }) => {
          if (finished) {
            snapToNearest(0);
          }
        });
      },

      onPanResponderTerminate: () => {
        snapToNearest(0);
      },
    }),
  ).current;

  const rotateInterpolate = rotationAngle.interpolate({
    inputRange: [-10000, 10000],
    outputRange: ["-10000deg", "10000deg"],
  });

  const generateDayElements = () => {
    const days = [];
    for (let day = 1; day <= daysInMonth; day++) {
      const angle = (day - 1) * angleSlice - 90;
      const radians = (angle * Math.PI) / 180;
      const x = Math.cos(radians) * DAY_CIRCLE_RADIUS;
      const y = Math.sin(radians) * DAY_CIRCLE_RADIUS;

      const dateForDay = new Date(currentYear, currentMonth, day);
      const dayName = WEEKDAYS[dateForDay.getDay()];

      days.push(
        <View
          key={`${currentYear}-${currentMonth}-${day}`}
          style={[
            styles.dayContainer,
            {
              top: WRAPPER_SIZE / 2 - 30,
              left: WRAPPER_SIZE / 2 - 30,
              transform: [
                { translateX: x },
                { translateY: y },
                { rotate: `${angle + 90}deg` },
              ],
            },
          ]}
        >
          <Text style={styles.weekdayLabel}>{dayName}</Text>
          <View style={styles.dayNumberCircle}>
            <Text style={styles.dayNumberText}>{day}</Text>
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
        <View style={styles.moonGlowCore} pointerEvents="none" />
        {generateDayElements()}
      </Animated.View>
    </View>
  );
};

// ==========================================
// 2. THE MAIN SCREEN EXPORT
// ==========================================
export default function Dashboard() {
  const [activeDay, setActiveDay] = useState(new Date().getDate());
  const [footerDate] = useState(new Date());

  return (
    <AbyssalBackground
      middleLayer={
        <View style={styles.moonWrapper}>
          <CircularCalendarDial onDayChange={setActiveDay} />
        </View>
      }
    >
      <View style={styles.contentOverlay} pointerEvents="box-none">
        <View style={styles.header} pointerEvents="box-none">
          <Text style={styles.greeting}>Hello, ishie!</Text>
          <Text style={styles.subGreeting}>your period is in 4 days</Text>
          <View style={styles.divider} />
          <Text style={styles.phaseTitle}>Current Phase: Luteal</Text>
          <Text style={styles.phaseDescription}>
            The ocean deepens under fading light. Your energy slows as your body
            prepares to reset. Take things gently today.
          </Text>
        </View>

        <View style={styles.bottomInfo} pointerEvents="none">
          <Text style={styles.bigDayText}>DAY {activeDay}</Text>
          <Text style={styles.ofCycle}>of cycle</Text>
          <Text style={styles.monthFooter}>
            {footerDate
              .toLocaleString("default", { month: "long" })
              .toUpperCase()}
          </Text>
        </View>
      </View>
    </AbyssalBackground>
  );
}

// ==========================================
// 3. STYLES (Untouched)
// ==========================================
const styles = StyleSheet.create({
  moonWrapper: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
  },
  contentOverlay: {
    flex: 1,
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 130,
    zIndex: 100,
  },
  header: {
    alignItems: "center",
    paddingHorizontal: 40,
  },
  greeting: {
    fontFamily: "Georgia",
    fontSize: 32,
    color: "white",
    marginBottom: 8,
  },
  subGreeting: {
    fontFamily: "monospace",
    fontSize: 14,
    color: "#E1F2FF",
    letterSpacing: 1,
  },
  divider: {
    width: width * 0.6,
    height: 1,
    backgroundColor: "rgba(255,255,255,0.2)",
    marginVertical: 25,
  },
  phaseTitle: {
    fontFamily: "Georgia",
    fontSize: 18,
    color: "white",
    marginBottom: 12,
  },
  phaseDescription: {
    fontFamily: "monospace",
    fontSize: 11,
    textAlign: "center",
    color: "#E1F2FF",
    lineHeight: 16,
    opacity: 0.8,
  },
  dialContainer: {
    position: "absolute",
    top: height * 0.28,
    width: WRAPPER_SIZE,
    height: WRAPPER_SIZE,
    alignItems: "center",
    justifyContent: "center",
  },
  calendarMoonWrapper: {
    width: WRAPPER_SIZE,
    height: WRAPPER_SIZE,
    borderRadius: WRAPPER_SIZE / 2,
    justifyContent: "center",
    alignItems: "center",
  },
  moonGlowCore: {
    position: "absolute",
    width: MOON_SIZE,
    height: MOON_SIZE,
    borderRadius: MOON_SIZE / 2,
    backgroundColor: "#FFFFFF",
    shadowColor: "#FFFFFF",
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 50,
    shadowOpacity: 0.8,
    elevation: 30,
  },
  dayContainer: {
    position: "absolute",
    alignItems: "center",
    width: 60,
    height: 60,
    justifyContent: "center",
  },
  weekdayLabel: {
    color: "white",
    fontSize: 9,
    fontFamily: "monospace",
    marginBottom: 2,
    opacity: 0.7,
  },
  dayNumberCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: "center",
    alignItems: "center",
  },
  dayNumberText: {
    color: "white",
    fontSize: 18,
    fontFamily: "Georgia",
  },
  bottomInfo: {
    alignItems: "center",
    marginBottom: 60,
  },
  bigDayText: {
    fontFamily: "Georgia",
    fontSize: 52,
    color: "white",
    letterSpacing: 2,
  },
  ofCycle: {
    fontFamily: "monospace",
    fontSize: 14,
    color: "white",
    opacity: 0.8,
    marginTop: -5,
  },
  monthFooter: {
    fontFamily: "monospace",
    fontSize: 12,
    color: "white",
    marginTop: 30,
    letterSpacing: 3,
    opacity: 0.7,
  },
});
