import {
  formatDateKey,
  parseDateKey,
  useCycleData,
} from "@/hooks/use-cycle-store";
import { useUser } from "@/hooks/use-user-store";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Animated,
  Dimensions,
  Easing,
  PanResponder,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Svg, { Path } from "react-native-svg";

const { width, height } = Dimensions.get("window");

const MOON_SIZE = width * 0.74;
const WRAPPER_SIZE = width * 1.6;
const DAY_CIRCLE_RADIUS = MOON_SIZE / 2 + 25;
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

const DAY_MS = 1000 * 60 * 60 * 24;

const getDaysBetween = (start: Date, end: Date) => {
  const startUtc = Date.UTC(
    start.getFullYear(),
    start.getMonth(),
    start.getDate(),
  );
  const endUtc = Date.UTC(end.getFullYear(), end.getMonth(), end.getDate());
  return Math.floor((endUtc - startUtc) / DAY_MS);
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
) =>
  from.map((value, index) => value + (to[index] - value) * t) as [
    number,
    number,
    number,
    number,
    number,
    number,
    number,
  ];

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
    wavePoints: [132, 110, 160, 140, 120, 150, 132],
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
    wavePoints: [120, 70, 175, 125, 75, 155, 120],
  },
};

const TinySpeck = ({
  top,
  left,
  opacity,
  size,
}: {
  top: number;
  left: number;
  opacity: number;
  size: number;
}) => {
  return (
    <View
      style={[styles.speck, { top, left, opacity, width: size, height: size }]}
    />
  );
};

const BackgroundSparkles = () => {
  const specks = useMemo(
    () =>
      Array.from({ length: 48 }, (_, idx) => ({
        id: idx,
        top: Math.random() * height * 0.88,
        left: Math.random() * width,
        opacity: 0.22 + Math.random() * 0.33,
        size: 1 + Math.random() * 0.9,
      })),
    [],
  );

  return (
    <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
      {specks.map((speck) => (
        <TinySpeck
          key={speck.id}
          top={speck.top}
          left={speck.left}
          opacity={speck.opacity}
          size={speck.size}
        />
      ))}
    </View>
  );
};

// ==========================================
// 1. THE MINI-COMPONENT (Infinite Momentum Dial)
// ==========================================
const CircularCalendarDial = ({
  onDayChange,
  onDateChange,
  activeDay,
  moonColor,
  onProvideReset,
}: {
  onDayChange: (day: number) => void;
  onDateChange: (date: Date) => void;
  activeDay: number;
  moonColor: string;
  onProvideReset?: (fn: () => void) => void;
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

  const previousAngleRef = useRef(0);

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

  useEffect(() => {
    if (onProvideReset) onProvideReset(resetToToday);
  }, [onProvideReset, resetToToday]);

  const snapToNearest = useCallback(
    (fromVelocityDegPerMs = 0) => {
      const raw = currentAngleRef.current;
      const snapped = Math.round(raw / angleSlice) * angleSlice;
      const normalized = normalizeAngleToMonth(snapped);
      const snappedDay = normalized.dayIndex + 1;

      Animated.spring(rotationAngle, {
        toValue: snapped,
        velocity: fromVelocityDegPerMs,
        useNativeDriver: true,
        tension: 60,
        friction: 10,
      }).start(({ finished }) => {
        if (finished) {
          if (
            normalized.month !== currentMonth ||
            normalized.year !== currentYear
          ) {
            setViewDate(new Date(normalized.year, normalized.month, 1));
            onDateChange(new Date(normalized.year, normalized.month, 1));
            rotationAngle.setValue(normalized.angle);
            currentAngleRef.current = normalized.angle;
          }
          onDayChange(snappedDay);
          const snappedDate = new Date(
            normalized.year,
            normalized.month,
            snappedDay,
          );
          onDateChange(snappedDate);
        }
      });
    },
    [
      angleSlice,
      currentMonth,
      currentYear,
      onDateChange,
      onDayChange,
      normalizeAngleToMonth,
      rotationAngle,
    ],
  );

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_evt, gs) => {
          const distance = Math.sqrt(gs.dx * gs.dx + gs.dy * gs.dy);
          return distance > 5;
        },
        onStartShouldSetPanResponder: () => false,

        onPanResponderGrant: (_evt, gs) => {
          rotationAngle.stopAnimation((stoppedAt) => {
            currentAngleRef.current = stoppedAt;
          });

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
    [
      currentMonth,
      currentYear,
      normalizeAngleToMonth,
      angleSlice,
      daysInMonth,
      rotationAngle,
      snapToNearest,
    ],
  );

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
          <View
            style={[
              styles.dayNumberCircle,
              isActiveDay && styles.dayNumberCircleActive,
            ]}
          >
            <Text style={styles.dayNumberText}>{day}</Text>
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
  const cycleData = useCycleData() as any;
  const {
    getCycleStats,
    getLatestPeriodStart,
    daysLate,
    requestLogModal,
    setSelectedLogDate,
    periodDates,
    predictedDates,
    predictedStarts,
    isDateInMissedPredictedWindow,
  } = cycleData;
  const { user } = useUser();
  const [resetToTodayFn, setResetToTodayFn] = useState<(() => void) | null>(
    null,
  );
  const [activeDay, setActiveDay] = useState(new Date().getDate());
  const [footerDate, setFooterDate] = useState(new Date());

  useEffect(() => {
    try {
      if (typeof setSelectedLogDate === "function") {
        setSelectedLogDate(footerDate);
      }
    } catch {
      // ignore
    }
  }, [footerDate, setSelectedLogDate]);

  const cycleStats = getCycleStats();
  const latestPeriodStart = getLatestPeriodStart();
  const prevLatestStartRef = useRef<string | null>(null);

  useEffect(() => {
    const newKey = latestPeriodStart ? formatDateKey(latestPeriodStart) : null;
    if (newKey !== prevLatestStartRef.current) {
      prevLatestStartRef.current = newKey;
      setFooterDate(new Date());
      setActiveDay(new Date().getDate());
      if (resetToTodayFn) resetToTodayFn();
    }
  }, [latestPeriodStart, resetToTodayFn]);

  const cycleLength = cycleStats.cycleLength;
  const rawGreetingName =
    (cycleData.profile?.nickname && cycleData.profile.nickname.trim()) ||
    (user.nickname && user.nickname.trim()) ||
    (user.username && user.username.trim()) ||
    "";
  const greetingName =
    rawGreetingName &&
    !/^[-\s]+$/.test(rawGreetingName) &&
    rawGreetingName.toLowerCase() !== "profile"
      ? rawGreetingName
      : "there";

  // =========================================================
  // THE NEW, PERFECTLY SYNCED PHASE LOGIC
  // =========================================================
  const targetKey = formatDateKey(footerDate);

  // 1. Explicitly check the store to see if this is a real or predicted period day
  const isLoggedPeriodDay = Boolean(periodDates?.[targetKey]);
  const isPredictedPeriodDay = Boolean(predictedDates?.[targetKey]);
  const isExplicitMenstrual = isLoggedPeriodDay || isPredictedPeriodDay;
  const isMissed =
    typeof isDateInMissedPredictedWindow === "function"
      ? isDateInMissedPredictedWindow(footerDate)
      : false;

  // 2. Find the closest actual anchor period start
  const loggedKeys = Object.keys(periodDates || {}).sort();
  const pastLogged = loggedKeys.filter((k) => k <= targetKey);
  let anchorDate: Date | null = null;

  if (pastLogged.length > 0) {
    let lastDay = pastLogged[pastLogged.length - 1];
    let d = parseDateKey(lastDay);
    while (true) {
      const prev = new Date(d);
      prev.setDate(prev.getDate() - 1);
      if (periodDates?.[formatDateKey(prev)]) d = prev;
      else break;
    }
    anchorDate = d;
  }

  // 3. Jump to future predicted anchors if scrolling forward
  if (predictedStarts && predictedStarts.length > 0) {
    const pastPredicted = [...predictedStarts]
      .sort()
      .filter((k) => k <= targetKey);
    if (pastPredicted.length > 0) {
      const latestPredicted = parseDateKey(
        pastPredicted[pastPredicted.length - 1],
      );
      if (!anchorDate || latestPredicted.getTime() > anchorDate.getTime()) {
        anchorDate = latestPredicted;
      }
    }
  }

  // 4. Calculate the real Cycle Day
  let cycleDay = 1;
  if (anchorDate) {
    if (footerDate.getTime() >= anchorDate.getTime()) {
      cycleDay = getDaysBetween(anchorDate, footerDate) + 1;
    } else {
      const diff = getDaysBetween(anchorDate, footerDate);
      const remainder = diff % cycleLength;
      cycleDay = remainder === 0 ? 1 : cycleLength + remainder + 1;
    }
  }

  // 5. Determine the Phase matching the calendar exactly
  // 5. Determine the Phase matching the calendar exactly
  let phaseKey: PhaseKey = "luteal";

  // IF IT IS LOGGED OR PREDICTED, IT IS MENSTRUAL. PERIOD.
  if (isLoggedPeriodDay || isPredictedPeriodDay) {
    phaseKey = "menstrual";
  }
  // ONLY USE APPROXIMATION MATH IF IT IS NOT A PERIOD DAY
  else {
    // We only use the estimation math for Follicular/Ovulation/Luteal
    const menstrualEnd = Math.max(4, Math.round(cycleLength * 0.18));
    const follicularEnd = Math.max(
      menstrualEnd + 1,
      Math.round(cycleLength * 0.46),
    );
    const ovulationEnd = Math.max(
      follicularEnd + 1,
      Math.round(cycleLength * 0.61),
    );

    if (cycleDay <= menstrualEnd)
      phaseKey = "menstrual"; // Safety fallback
    else if (cycleDay <= follicularEnd) phaseKey = "follicular";
    else if (cycleDay <= ovulationEnd) phaseKey = "ovulation";
    else if (isMissed)
      phaseKey = "luteal"; // Missed windows are only considered if not menstrual
    else phaseKey = "luteal";
  }

  const phase = PHASES[phaseKey];
  const daysUntilPeriod = cycleLength - cycleDay + 1;

  // =========================================================

  const [previousPhaseKey, setPreviousPhaseKey] = useState<PhaseKey>(phaseKey);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const waveMorphAnim = useRef(new Animated.Value(1)).current;
  const waveFromRef = useRef(phase.wavePoints);
  const waveToRef = useRef(phase.wavePoints);
  const [wavePath, setWavePath] = useState(buildWavePath(phase.wavePoints));

  const handleProvideReset = useCallback((fn: () => void) => {
    setResetToTodayFn(() => fn);
  }, []);

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
  }, [fadeAnim, phaseKey, previousPhaseKey, waveMorphAnim]);

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
          onProvideReset={handleProvideReset}
        />
      </View>

      <BackgroundSparkles />

      <View style={styles.waveLayer} pointerEvents="none">
        <Svg width={width} height={180} viewBox={`0 0 ${width} 180`}>
          <Path d={wavePath} fill={phase.waveColors[0]} />
        </Svg>
        <LinearGradient colors={phase.waveColors} style={styles.waveFill} />
      </View>

      <View style={styles.contentOverlay} pointerEvents="box-none">
        <View style={styles.header} pointerEvents="box-none">
          <Text style={styles.greeting}>Hello, {greetingName}!</Text>
          {daysLate > 0 && !isLoggedPeriodDay ? (
            <Text style={styles.delayed}>
              {daysLate === 1
                ? "1 day period delayed"
                : `${daysLate} days period delayed`}
            </Text>
          ) : (
            <Text style={styles.subGreeting}>{subGreetingText}</Text>
          )}
          <View style={styles.divider} />
          <Text style={styles.phaseTitle}>{phase.title}</Text>
          <Text style={styles.phaseDescription}>{phase.description}</Text>
        </View>

        <View style={styles.bottomInfo} pointerEvents="box-none">
          <View style={styles.bottomPrimaryCluster}>
            {resetToTodayFn ? (
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => resetToTodayFn && resetToTodayFn()}
                style={styles.smallTodayButton}
              >
                <Text style={styles.smallTodayText}>Today</Text>
              </TouchableOpacity>
            ) : null}
            <Text style={styles.bigDayText}>DAY {cycleDay}</Text>
            <Text style={styles.ofCycle}>of cycle</Text>
          </View>
          <Text style={styles.monthFooter}>
            {footerDate
              .toLocaleString("default", { month: "long" })
              .toUpperCase()}
          </Text>
          {phaseKey === "menstrual" || daysLate > 0 ? (
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => {
                try {
                  requestLogModal?.();
                } catch {
                  // ignore
                }
              }}
              style={styles.logPeriodButton}
            >
              <Text style={styles.logPeriodText}>Log period</Text>
            </TouchableOpacity>
          ) : null}
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
  speck: {
    position: "absolute",
    borderRadius: 0.5,
    backgroundColor: "rgba(255,255,255,0.92)",
    shadowColor: "rgba(255,255,255,0.95)",
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 8,
    shadowOpacity: 0.65,
    elevation: 1,
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
  delayed: {
    fontFamily: "georgia",
    fontSize: 10,
    color: "rgb(255, 255, 255)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    overflow: "hidden",
    letterSpacing: 0.4,
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
  backToTodayButton: {
    position: "absolute",
    right: 16,
    top: 16,
    zIndex: 250,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
  },
  backToTodayText: {
    color: "#E1F2FF",
    fontSize: 12,
    fontFamily: "monospace",
  },
  dialIndicator: {
    position: "absolute",
    width: 0,
    height: 0,
    opacity: 0,
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
    backgroundColor: "transparent",
  },
  dayNumberCircleActive: {
    backgroundColor: "transparent",
    borderWidth: 0.3,
    borderColor: "rgba(255,255,255,0.85)",
  },
  dayNumberText: {
    color: "white",
    fontSize: 18,
    fontFamily: "Georgia",
  },
  bottomInfo: {
    position: "relative",
    alignItems: "center",
    marginBottom: 18,
  },
  bottomPrimaryCluster: {
    alignItems: "center",
    transform: [{ translateY: -20 }],
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
    marginTop: 16,
    letterSpacing: 3,
    opacity: 0.7,
  },
  smallTodayButton: {
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    marginBottom: 2,
  },
  smallTodayText: {
    color: "#E1F2FF",
    fontSize: 11,
    fontFamily: "monospace",
  },
  logPeriodButton: {
    position: "absolute",
    bottom: -24,
    alignSelf: "center",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 0.4,
    borderColor: "rgba(255,255,255,0.22)",
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  logPeriodText: {
    color: "#FFFFFF",
    fontSize: 10,
    letterSpacing: 0.5,
    fontFamily: "monospace",
  },
});
