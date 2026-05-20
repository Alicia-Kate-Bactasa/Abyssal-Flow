import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Easing,
  PanResponder,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Svg, { Path } from "react-native-svg";

const { width, height } = Dimensions.get("window");

const CYCLE_LENGTH = 28;

const MOON_SIZE = width * 0.74;
const WRAPPER_SIZE = width * 1.6;
const DAY_CIRCLE_RADIUS = MOON_SIZE / 2 + 25;
const INDICATOR_SIZE = 30;
const INDICATOR_OFFSET = 8;
const MOON_INSET = 8;


const DIAL_CENTER_X = width / 2;
const DIAL_CENTER_Y = height * 0.28 + WRAPPER_SIZE / 2;
const DECAY_DECELERATION = 0.9965;
const WEEKDAYS = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

type PhaseKey = "menstrual" | "follicular" | "ovulation" | "luteal";

type PhaseConfig = {
  key: PhaseKey;
  gradientColors: [string, string];
  gradientLocations: [number, number];
  subGreeting: string;
  title: string;
  description: string;
  moonColor: string;
  waveColors: [string, string];
  wavePoints: [number, number, number, number, number, number, number];
};

const getCycleDay = (day: number) => ((day - 1) % CYCLE_LENGTH) + 1;

const getPhaseKey = (cycleDay: number): PhaseKey => {
  if (cycleDay <= 5) return "menstrual";
  if (cycleDay <= 13) return "follicular";
  if (cycleDay <= 17) return "ovulation";
  return "luteal";
};

const PHASE_ORDER: PhaseKey[] = [
  "menstrual",
  "follicular",
  "ovulation",
  "luteal",
];

const PHASE_RANGES: Record<PhaseKey, [number, number]> = {
  menstrual: [1, 5],
  follicular: [6, 13],
  ovulation: [14, 17],
  luteal: [18, 28],
};

const getNextPhaseRange = (cycleDay: number) => {
  const current = getPhaseKey(cycleDay);
  const nextIndex = (PHASE_ORDER.indexOf(current) + 1) % PHASE_ORDER.length;
  const nextKey = PHASE_ORDER[nextIndex];
  return { key: nextKey, range: PHASE_RANGES[nextKey] };
};

const WAVE_X = {
  c1: width * 0.2,
  c2: width * 0.4,
  mid: width * 0.55,
  c3: width * 0.7,
  c4: width * 0.88,
};

const buildWavePath = (
  points: [number, number, number, number, number, number, number],
) => {
  const [startY, c1y, c2y, midY, c3y, c4y, endY] = points;
  return `
    M 0, ${startY}
    C ${WAVE_X.c1}, ${c1y} ${WAVE_X.c2}, ${c2y} ${WAVE_X.mid}, ${midY}
    C ${WAVE_X.c3}, ${c3y} ${WAVE_X.c4}, ${c4y} ${width}, ${endY}
    L ${width}, 180
    L 0, 180
    Z
  `;
};

const interpolateWavePoints = (
  from: [number, number, number, number, number, number, number],
  to: [number, number, number, number, number, number, number],
  t: number,
) => from.map((value, index) => value + (to[index] - value) * t) as
  [number, number, number, number, number, number, number];

const PHASES: Record<PhaseKey, PhaseConfig> = {
  menstrual: {
    key: "menstrual",
    gradientColors: ["#001047", "#01001D"],
    gradientLocations: [0, 1],
    subGreeting: "you're on your period",
    title: "Current Phase: Menstrual",
    description:
      "The ocean turns stormy and deep. Your body is shedding and resetting with quiet intensity. Rest and go gently.",
    moonColor: "#FFFFFF",
    waveColors: ["#001958", "#001047"],
    wavePoints: [110, 30, 210, 120, 40, 200, 110],
  },
  follicular: {
    key: "follicular",
    gradientColors: ["#FF5A79", "#FFB129"],
    gradientLocations: [0.25, 0.92],
    subGreeting: "your period is in [X] days",
    title: "Current Phase: Follicular",
    description:
      "Warm light returns to the water as your energy gently rebuilds. A quiet sense of renewal begins to rise.",
    moonColor: "#FFD768",
    waveColors: ["#FFB86A", "#FF8A7C"],
    wavePoints: [132, 124, 140, 130, 120, 138, 132],
  },
  ovulation: {
    key: "ovulation",
    gradientColors: ["#9EE8FF", "#00B2FF"],
    gradientLocations: [0.06, 0.78],
    subGreeting: "your period is in [X] days",
    title: "Current Phase: Ovulation",
    description:
      "The ocean is bright and open under full light. Energy peaks and everything feels more alive and connected. Step into your energy.",
    moonColor: "#FFE79A",
    waveColors: ["#6CC4FF", "#49A9E6"],
    wavePoints: [134, 126, 140, 132, 124, 138, 134],
  },
  luteal: {
    key: "luteal",
    gradientColors: ["#2C77B8", "#003457"],
    gradientLocations: [0.1, 0.78],
    subGreeting: "your period is in [X] days",
    title: "Current Phase: Luteal",
    description:
      "The ocean deepens under fading light. Your energy slows as your body prepares to reset. Take things gently today.",
    moonColor: "#FFFFFF",
    waveColors: ["#1E5E8F", "#0B3B5E"],
    wavePoints: [120, 80, 170, 120, 95, 140, 120],
  },
};

// ==========================================
// 1. THE MINI-COMPONENT (Infinite Momentum Dial)
// ==========================================
const CircularCalendarDial = ({
  onDayChange,
  onDateChange,
  activeDay,
  moonColor,
  anchorCycleDay,
}: {
  onDayChange: (day: number) => void;
  onDateChange: (date: Date) => void;
  activeDay: number;
  moonColor: string;
  anchorCycleDay: number;
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

  const rotationAngle = useRef(new Animated.Value(initialRotationAngle)).current;
  const currentAngleRef = useRef(initialRotationAngle);

  
  const previousAngleRef = useRef(0);

  const inactivityTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastTickRef = useRef(Math.round(initialRotationAngle / angleSlice));

  useEffect(() => {
    onDateChange(viewDate);
  }, [onDateChange, viewDate]);

  const normalizeAngleToMonth = useCallback(
    (value: number) => {
      let nextYear = currentYear;
      let nextMonth = currentMonth;
      let nextDays = new Date(currentYear, currentMonth + 1, 0).getDate();
      let nextSlice = 360 / nextDays;
      let tick = Math.round(-value / nextSlice);

      while (tick >= nextDays) {
        tick -= nextDays;
        nextMonth += 1;
        if (nextMonth > 11) {
          nextMonth = 0;
          nextYear += 1;
        }
        nextDays = new Date(nextYear, nextMonth + 1, 0).getDate();
        nextSlice = 360 / nextDays;
        value = -tick * nextSlice;
      }

      while (tick < 0) {
        nextMonth -= 1;
        if (nextMonth < 0) {
          nextMonth = 11;
          nextYear -= 1;
        }
        nextDays = new Date(nextYear, nextMonth + 1, 0).getDate();
        nextSlice = 360 / nextDays;
        tick += nextDays;
        value = -tick * nextSlice;
      }

      return {
        year: nextYear,
        month: nextMonth,
        dayIndex: tick,
        angle: value,
      };
    },
    [currentMonth, currentYear],
  );

  useEffect(() => {
    const id = rotationAngle.addListener(({ value }) => {
      const normalized = normalizeAngleToMonth(value);
      if (
        normalized.month !== currentMonth ||
        normalized.year !== currentYear
      ) {
        setViewDate(new Date(normalized.year, normalized.month, 1));
        rotationAngle.setValue(normalized.angle);
        currentAngleRef.current = normalized.angle;
        lastTickRef.current = normalized.dayIndex;
        const liveDay = normalized.dayIndex + 1;
        onDayChange(liveDay);
        onDateChange(new Date(normalized.year, normalized.month, liveDay));
        return;
      }

      currentAngleRef.current = value;
      const tick = Math.round(-value / angleSlice);
      if (tick !== lastTickRef.current) {
        lastTickRef.current = tick;
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        const liveDay = tick + 1;
        if (liveDay >= 1 && liveDay <= daysInMonth) {
          onDayChange(liveDay);
          onDateChange(new Date(currentYear, currentMonth, liveDay));
        }
      }
    });
    return () => rotationAngle.removeListener(id);
  }, [
    angleSlice,
    currentMonth,
    currentYear,
    daysInMonth,
    normalizeAngleToMonth,
    onDateChange,
    onDayChange,
    rotationAngle,
  ]);

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
          const normalized = normalizeAngleToMonth(snapped);
          if (
            normalized.month !== currentMonth ||
            normalized.year !== currentYear
          ) {
            setViewDate(new Date(normalized.year, normalized.month, 1));
            onDateChange(new Date(normalized.year, normalized.month, 1));
            rotationAngle.setValue(normalized.angle);
            currentAngleRef.current = normalized.angle;
          }
          startInactivityTimer();
        }
      });
    },
    [
      angleSlice,
      currentMonth,
      currentYear,
      onDateChange,
      normalizeAngleToMonth,
      rotationAngle,
      startInactivityTimer,
    ],
  );

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
       
        const rx = gs.moveX - DIAL_CENTER_X;
        const ry = gs.moveY - DIAL_CENTER_Y;
        const currentAngle = Math.atan2(ry, rx);

    
        let deltaAngle = currentAngle - previousAngleRef.current;

     
        if (deltaAngle > Math.PI) deltaAngle -= 2 * Math.PI;
        if (deltaAngle < -Math.PI) deltaAngle += 2 * Math.PI;

    
        const deltaDeg = deltaAngle * (180 / Math.PI);
        currentAngleRef.current += deltaDeg;
        rotationAngle.setValue(currentAngleRef.current);

   
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
    const nextPhase = getNextPhaseRange(anchorCycleDay);
    for (let day = 1; day <= daysInMonth; day++) {
      const angle = (day - 1) * angleSlice - 90;
      const radians = (angle * Math.PI) / 180;
      const x = Math.cos(radians) * DAY_CIRCLE_RADIUS;
      const y = Math.sin(radians) * DAY_CIRCLE_RADIUS;

      const dateForDay = new Date(currentYear, currentMonth, day);
      const dayName = WEEKDAYS[dateForDay.getDay()];
      const cycleDay = getCycleDay(day);
      const isNextPhaseDay =
        cycleDay >= nextPhase.range[0] && cycleDay <= nextPhase.range[1];
      const isActiveDay = day === activeDay;

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
            {isNextPhaseDay && !isActiveDay ? (
              <View style={styles.nextPhaseMarker} />
            ) : null}
          </View>
        </View>,
      );
    }
    return days;
  };

  return (
    <View style={styles.dialContainer}>
      <View
        style={[
          styles.dialIndicator,
          {
            width: INDICATOR_SIZE,
            height: INDICATOR_SIZE,
            borderRadius: INDICATOR_SIZE / 2,
            top:
              WRAPPER_SIZE / 2 -
              DAY_CIRCLE_RADIUS -
              INDICATOR_SIZE / 2 +
              INDICATOR_OFFSET,
            left: WRAPPER_SIZE / 2 - INDICATOR_SIZE / 2,
          },
        ]}
        pointerEvents="none"
      />
      <View
        style={[
          styles.moonGlowCore,
          {
              backgroundColor: moonColor,
            top: (WRAPPER_SIZE - MOON_SIZE) / 2 + MOON_INSET,
            left: (WRAPPER_SIZE - MOON_SIZE) / 2,
          },
        ]}
        pointerEvents="none"
      />
      <Animated.View
        style={[
          styles.calendarMoonWrapper,
          {
            width: WRAPPER_SIZE,
            height: WRAPPER_SIZE,
            borderRadius: WRAPPER_SIZE / 2,
            transform: [{ rotate: rotateInterpolate }],
          },
        ]}
        {...panResponder.panHandlers}
      >
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
  const [footerDate, setFooterDate] = useState(new Date());
  const cycleDay = getCycleDay(activeDay);
  const phaseKey = getPhaseKey(cycleDay);
  const phase = PHASES[phaseKey];
  const daysUntilPeriod = CYCLE_LENGTH - cycleDay + 1;
  const anchorCycleDayRef = useRef(getCycleDay(new Date().getDate()));

  const [previousPhaseKey, setPreviousPhaseKey] = useState<PhaseKey>(phaseKey);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const waveMorphAnim = useRef(new Animated.Value(1)).current;
  const waveFromRef = useRef(phase.wavePoints);
  const waveToRef = useRef(phase.wavePoints);
  const [wavePath, setWavePath] = useState(buildWavePath(phase.wavePoints));

  useEffect(() => {
    if (phaseKey !== previousPhaseKey) {
      fadeAnim.setValue(0);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }).start(() => {
        setPreviousPhaseKey(phaseKey);
      });
      waveFromRef.current = PHASES[previousPhaseKey].wavePoints;
      waveToRef.current = PHASES[phaseKey].wavePoints;
      waveMorphAnim.setValue(0);
      Animated.timing(waveMorphAnim, {
        toValue: 1,
        duration: 650,
        easing: Easing.inOut(Easing.cubic),
        useNativeDriver: false,
      }).start();
    }
  }, [
    fadeAnim,
    phaseKey,
    previousPhaseKey,
    waveMorphAnim,
  ]);

  useEffect(() => {
    const id = waveMorphAnim.addListener(({ value }) => {
      const points = interpolateWavePoints(
        waveFromRef.current,
        waveToRef.current,
        value,
      );
      setWavePath(buildWavePath(points));
    });
    return () => waveMorphAnim.removeListener(id);
  }, [waveMorphAnim]);

  const previousPhase = PHASES[previousPhaseKey];
  const subGreetingText =
    phase.key === "menstrual"
      ? phase.subGreeting
      : phase.subGreeting.replace("[X]", String(daysUntilPeriod));

  return (
    <View style={styles.screen}>
      <LinearGradient
        colors={previousPhase.gradientColors}
        locations={previousPhase.gradientLocations}
        style={StyleSheet.absoluteFill}
      />
      <Animated.View style={[StyleSheet.absoluteFill, { opacity: fadeAnim }]}>
        <LinearGradient
          colors={phase.gradientColors}
          locations={phase.gradientLocations}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>

      <View style={styles.moonWrapper}>
        <CircularCalendarDial
          onDayChange={setActiveDay}
          onDateChange={setFooterDate}
          activeDay={activeDay}
          moonColor={phase.moonColor}
          anchorCycleDay={anchorCycleDayRef.current}
        />
      </View>

      <View style={styles.waveLayer} pointerEvents="none">
        <Svg width={width} height={180} viewBox={`0 0 ${width} 180`}>
          <Path d={wavePath} fill={phase.waveColors[0]} />
        </Svg>
        <LinearGradient colors={phase.waveColors} style={styles.waveFill} />
      </View>

      <View style={styles.contentOverlay} pointerEvents="box-none">
        <View style={styles.header} pointerEvents="box-none">
          <Text style={styles.greeting}>Hello, ishie!</Text>
          <Text style={styles.subGreeting}>{subGreetingText}</Text>
          <View style={styles.divider} />
          <Text style={styles.phaseTitle}>{phase.title}</Text>
          <Text style={styles.phaseDescription}>{phase.description}</Text>
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
    </View>
  );
}

// ==========================================
// 3. STYLES (Untouched)
// ==========================================
const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#01001D",
  },
  waveLayer: {
    position: "absolute",
    left: 0,
    right: 0,
    top: height * 0.48,
    bottom: 0,
    zIndex: 20,
  },
  waveFill: {
    flex: 1,
    marginTop: -2,
  },
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
    top: height * 0.23,
    width: WRAPPER_SIZE,
    height: WRAPPER_SIZE,
    alignItems: "center",
    justifyContent: "center",
  },
  dialIndicator: {
    position: "absolute",
    width: INDICATOR_SIZE,
    height: INDICATOR_SIZE,
    borderRadius: INDICATOR_SIZE / 2,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.4)",
    backgroundColor: "transparent",
    top:
      WRAPPER_SIZE / 2 - DAY_CIRCLE_RADIUS - INDICATOR_SIZE / 2 + INDICATOR_OFFSET,
    left: WRAPPER_SIZE / 2 - INDICATOR_SIZE / 2,
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
  nextPhaseMarker: {
    position: "absolute",
    bottom: 1,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.5)",
  },
  dayNumberText: {
    color: "white",
    fontSize: 18,
    fontFamily: "Georgia",
  },
  bottomInfo: {
    alignItems: "center",
    marginBottom: 30,
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
    marginTop: 40,
    letterSpacing: 3,
    opacity: 0.7,
  },
});
