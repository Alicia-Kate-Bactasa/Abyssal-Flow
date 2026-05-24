import {
  formatDateKey,
  parseDateKey,
  useCycleData,
} from "@/hooks/use-cycle-store";
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
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
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

const buildPeriodRuns = (keys: string[]) => {
  const sorted = [...keys].sort(
    (a, b) => parseDateKey(a).getTime() - parseDateKey(b).getTime(),
  );
  const runs: string[][] = [];
  let current: string[] = [];

  sorted.forEach((key) => {
    if (!current.length) {
      current.push(key);
      return;
    }
    const prev = parseDateKey(current[current.length - 1]);
    const next = parseDateKey(key);
    const diff = (next.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24);
    if (diff === 1) {
      current.push(key);
    } else {
      runs.push(current);
      current = [key];
    }
  });

  if (current.length) runs.push(current);
  return runs;
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
      {specks.slice(0, 20).map((s) => (
        <TinySpeck key={s.id} top={s.top} left={s.left} opacity={s.opacity} />
      ))}
    </View>
  );
};

type MonthItemProps = {
  year: number;
  month: number;
  draftDates: Record<string, true>;
  predictedDates: Record<string, true>;
  onToggleDay: (year: number, month: number, day: number) => void;
};

const MonthItem = React.memo(
  ({
    year,
    month,
    draftDates,
    predictedDates,
    onToggleDay,
  }: MonthItemProps) => {
    const weeks = useMemo(() => buildWeeks(year, month), [month, year]);

    return (
      <View style={styles.monthGrid}>
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
              const key = formatDateKey(targetDate);
              const isPeriod = !!draftDates[key];
              const isPredicted = predictedDates[key] && !isPeriod;
              const todayKey = formatDateKey(new Date());
              const isToday = key === todayKey;

              return (
                <Pressable
                  key={`${index}-${cellIndex}`}
                  style={[
                    styles.dayChip,
                    isPredicted && styles.dayChipPredicted,
                    isPeriod && styles.dayChipPeriod,
                    isToday && styles.dayChipSelected,
                  ]}
                  onPress={() =>
                    onToggleDay(
                      targetDate.getFullYear(),
                      targetDate.getMonth(),
                      cell.day,
                    )
                  }
                >
                  <Text
                    style={[
                      styles.dayText,
                      isPredicted && styles.dayTextPredicted,
                      isPeriod && styles.dayTextPeriod,
                      isToday && styles.dayTextSelected,
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
  },
);

MonthItem.displayName = "MonthItem";

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
          toValue: 5,
          duration: 2500,
          useNativeDriver: false,
        }),
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 2500,
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
          textShadowColor: "rgba(255, 255, 255, 0.6)",
          textShadowOffset: { width: 0, height: 0 },
          textShadowRadius: glowAnim,
        },
      ]}
    >
      {children}
    </Animated.Text>
  );
};

export default function CalendarScreen() {
  const insets = useSafeAreaInsets();
  const {
    periodDates,
    predictedDates,
    replacePeriodDates,
    recalcPredictions,
    getCycleStats,
  } = useCycleData();

  const [activeSegment, setActiveSegment] = useState<"calendar" | "pattern">(
    "calendar",
  );
  const [draftDates, setDraftDates] =
    useState<Record<string, true>>(periodDates);
  const [currentHeaderDate, setCurrentHeaderDate] = useState(new Date());

  const slideAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    setDraftDates(periodDates);
  }, [periodDates]);

  const periodKeys = useMemo(() => Object.keys(periodDates), [periodDates]);
  const draftKeys = useMemo(() => Object.keys(draftDates), [draftDates]);

  const hasChanges = useMemo(() => {
    if (periodKeys.length !== draftKeys.length) return true;
    const lookup = new Set(periodKeys);
    return draftKeys.some((key) => !lookup.has(key));
  }, [draftKeys, periodKeys]);

  const cycleStats = getCycleStats();

  const cyclePatternRows = useMemo(() => {
    const runs = buildPeriodRuns(periodKeys);
    const starts = runs.map((run) => parseDateKey(run[0]));
    if (starts.length < 2) return [];
    return starts.slice(1).map((date, index) => {
      const prev = starts[index];
      const length = Math.round(
        (date.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24),
      );
      return {
        label: `${formatMonthLabel(date.getFullYear(), date.getMonth())} Cycle`,
        length: length,
      };
    });
  }, [periodKeys]);

  const toggleDraftDate = useCallback(
    (targetYear: number, targetMonth: number, day: number) => {
      Haptics.selectionAsync();
      const key = formatDateKey(new Date(targetYear, targetMonth, day));
      setDraftDates((prev) => {
        const next = { ...prev };
        if (next[key]) {
          delete next[key];
        } else {
          next[key] = true;
        }
        return next;
      });
    },
    [],
  );

  const handleSave = () => {
    replacePeriodDates(draftKeys);
    recalcPredictions();
  };

  const handleTabSwitch = (tab: "calendar" | "pattern") => {
    if (activeSegment === tab) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setActiveSegment(tab);
    Animated.spring(slideAnim, {
      toValue: tab === "calendar" ? 0 : 1,
      useNativeDriver: false,
      tension: 40,
      friction: 7,
    }).start();
  };

  const monthsData = useMemo(() => {
    const data = [];
    const today = new Date();
    for (let i = -12; i <= 12; i++) {
      data.push({
        id: `month-${i}`,
        year: today.getFullYear(),
        month: today.getMonth() + i,
      });
    }
    return data;
  }, []);

  const onViewableItemsChanged = useCallback(({ viewableItems }: any) => {
    if (viewableItems && viewableItems.length > 0) {
      const item = viewableItems[0].item;
      setCurrentHeaderDate(new Date(item.year, item.month, 1));
    }
  }, []);

  const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 50 }).current;

  const renderMonthItem = useCallback(
    ({ item }: { item: { year: number; month: number } }) => (
      <MonthItem
        year={item.year}
        month={item.month}
        draftDates={draftDates}
        predictedDates={predictedDates}
        onToggleDay={toggleDraftDate}
      />
    ),
    [draftDates, predictedDates, toggleDraftDate],
  );

  return (
    <LinearGradient colors={["#061736", "#1E3A78"]} style={styles.container}>
      <BackgroundSparkles />
      <View
        style={[
          styles.content,
          { paddingTop: 20 + insets.top, paddingBottom: insets.bottom },
        ]}
      >
        <PulsingHeading style={styles.headerTitleGlow}>
          Cosmic Chart
        </PulsingHeading>

        <View style={styles.segmentedControl}>
          <Animated.View
            style={[
              styles.segmentActiveBg,
              {
                left: slideAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: ["2%", "48%"],
                }),
              },
            ]}
          />
          <Pressable
            onPress={() => handleTabSwitch("calendar")}
            style={styles.segment}
          >
            <Text style={styles.segmentText}>Tide Tracker</Text>
          </Pressable>
          <Pressable
            onPress={() => handleTabSwitch("pattern")}
            style={styles.segment}
          >
            <Text style={styles.segmentText}>Deep Patterns</Text>
          </Pressable>
        </View>

        <View style={styles.analyticsCard}>
          <View style={styles.analyticsRow}>
            <Text style={styles.analyticsLabel}>Average cycle length</Text>
            <Text style={styles.analyticsValue}>
              {cycleStats.avgCycleLength} tides
            </Text>
          </View>
          <View style={styles.analyticsRow}>
            <Text style={styles.analyticsLabel}>Average flow duration</Text>
            <Text style={styles.analyticsValue}>
              {cycleStats.avgPeriodLength} tides
            </Text>
          </View>
        </View>

        {activeSegment === "calendar" ? (
          <View style={styles.calendarWrapper}>
            <View style={styles.calendarCard}>
              <View style={styles.monthHeader}>
                <PulsingHeading style={styles.monthLabelGlow}>
                  {formatMonthLabel(
                    currentHeaderDate.getFullYear(),
                    currentHeaderDate.getMonth(),
                  )}
                </PulsingHeading>
              </View>

              <View style={styles.weekdayRow}>
                {WEEKDAYS.map((label, idx) => (
                  <Text key={`${label}-${idx}`} style={styles.weekday}>
                    {label}
                  </Text>
                ))}
              </View>

              <View style={styles.flatListContainer}>
                <FlatList
                  data={monthsData}
                  keyExtractor={(item) => item.id}
                  renderItem={renderMonthItem}
                  showsVerticalScrollIndicator={false}
                  initialScrollIndex={12}
                  getItemLayout={(data, index) => ({
                    length: 240,
                    offset: 240 * index,
                    index,
                  })}
                  onViewableItemsChanged={onViewableItemsChanged}
                  viewabilityConfig={viewabilityConfig}
                  removeClippedSubviews
                  windowSize={5}
                  initialNumToRender={3}
                  maxToRenderPerBatch={3}
                  updateCellsBatchingPeriod={50}
                />
              </View>
            </View>

            {hasChanges && (
              <Pressable style={styles.saveButton} onPress={handleSave}>
                <Text style={styles.saveButtonText}>Seal Cosmic Path</Text>
              </Pressable>
            )}
          </View>
        ) : (
          <ScrollView
            style={styles.patternWrapper}
            showsVerticalScrollIndicator={false}
          >
            <PulsingHeading style={styles.sectionHeaderGlow}>
              Echoes of Past Tides
            </PulsingHeading>
            {cyclePatternRows.length ? (
              cyclePatternRows.map((row, index) => (
                <View key={`${row.label}-${index}`} style={styles.cycleRow}>
                  <Text style={styles.cycleLabel}>{row.label}</Text>
                  <View style={styles.cycleLabelRight}>
                    <Text style={styles.cycleValue}>{row.length} tides</Text>
                  </View>
                  <View style={styles.cycleBar}>
                    <LinearGradient
                      colors={[
                        "rgba(255,255,255,0.3)",
                        "rgba(255,255,255,0.05)",
                      ]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={[styles.cycleGlowTrack, { flex: 2 }]}
                    />
                    <LinearGradient
                      colors={["rgba(255,255,255,0.02)", "transparent"]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={{ flex: Math.max(1, row.length - 2) }}
                    />
                  </View>
                </View>
              ))
            ) : (
              <Text style={styles.emptyStateText}>
                Chart at least two tides to reveal history.
              </Text>
            )}
          </ScrollView>
        )}
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1 },
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
  headerTitleGlow: {
    fontFamily: "Georgia",
    fontSize: 16,
    letterSpacing: 0.5,
    marginBottom: 20,
    textAlign: "center",
    color: "#FFFFFF",
  },
  sectionHeaderGlow: {
    fontFamily: "Georgia",
    fontSize: 13,
    marginBottom: 16,
    color: "#FFFFFF",
  },
  monthLabelGlow: {
    fontFamily: "Georgia",
    fontSize: 14,
    textAlign: "center",
    color: "#FFFFFF",
  },
  segmentedControl: {
    flexDirection: "row",
    backgroundColor: "rgba(23,44,92,0.4)",
    borderRadius: 999,
    padding: 4,
    marginBottom: 16,
    marginHorizontal: 20,
    borderWidth: 0.3,
    borderColor: "rgba(255,255,255,0.3)",
    position: "relative",
  },
  segmentActiveBg: {
    position: "absolute",
    width: "50%",
    height: "100%",
    top: 4,
    backgroundColor: "rgba(255,255,255,0.12)",
    borderRadius: 999,
    borderWidth: 0.3,
    borderColor: "rgba(255,255,255,0.35)",
  },
  segment: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 2,
  },
  segmentText: { color: "#FFFFFF", fontSize: 12 },
  analyticsCard: {
    backgroundColor: "rgba(23,44,92,0.5)",
    borderRadius: 22,
    padding: 16,
    marginBottom: 20,
    marginHorizontal: 20,
    borderWidth: 0.3,
    borderColor: "rgba(255,255,255,0.4)",
  },
  analyticsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
    borderBottomWidth: 0.3,
    borderBottomColor: "rgba(255,255,255,0.1)",
    paddingBottom: 6,
  },
  analyticsLabel: { color: "rgba(255,255,255,0.8)", fontSize: 13 },
  analyticsValue: { color: "#FFFFFF", fontSize: 13 },
  calendarWrapper: {
    alignItems: "center",
    width: width,
    paddingHorizontal: 20,
    flex: 1,
  },
  calendarCard: {
    width: "100%",
    backgroundColor: "rgba(23,44,92,0.5)",
    borderRadius: 20,
    padding: 14,
    borderWidth: 0.3,
    borderColor: "rgba(255,255,255,0.4)",
  },
  monthHeader: {
    alignItems: "center",
    marginBottom: 16,
  },
  weekdayRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  weekday: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 11,
    width: (width - 70) / 7,
    textAlign: "center",
  },
  flatListContainer: {
    height: 240,
  },
  monthGrid: {
    height: 240,
    justifyContent: "flex-start",
  },
  weekRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  dayChip: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "transparent",
  },
  dayChipSelected: {
    borderWidth: 1.2,
    borderColor: "rgba(255,255,255,0.9)",
    backgroundColor: "transparent",
  },
  dayChipPeriod: {
    backgroundColor: "#ff4b4b",
    borderWidth: 0,
  },
  dayChipPredicted: {
    backgroundColor: "#ff7070",
    borderWidth: 0,
  },
  dayText: { color: "#FFFFFF", fontSize: 13, fontWeight: "700" },
  dayTextSelected: { color: "#FFFFFF", fontWeight: "700" },
  outOfMonthText: { color: "rgba(255,255,255,0.2)" },
  dayTextPeriod: { color: "#FFFFFF", fontWeight: "bold" },
  dayTextPredicted: { color: "rgba(255,255,255,0.7)" },
  saveButton: {
    marginTop: 20,
    backgroundColor: "rgba(23,44,92,0.6)",
    borderWidth: 0.3,
    borderColor: "#FFFFFF",
    borderRadius: 18,
    paddingHorizontal: 28,
    paddingVertical: 12,
  },
  saveButtonText: {
    color: "#FFFFFF",
    fontSize: 13,
    letterSpacing: 0.5,
  },
  patternWrapper: {
    paddingHorizontal: 20,
    width: "100%",
    flex: 1,
  },
  cycleRow: {
    backgroundColor: "rgba(23,44,92,0.5)",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 0.3,
    borderColor: "rgba(255,255,255,0.4)",
  },
  cycleLabel: { color: "rgba(255,255,255,0.9)", fontSize: 13, marginBottom: 8 },
  cycleLabelRight: { position: "absolute", top: 16, right: 16 },
  cycleValue: { color: "#FFFFFF", fontSize: 13 },
  cycleBar: {
    flexDirection: "row",
    height: 6,
    borderRadius: 3,
    overflow: "hidden",
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 0.3,
    borderColor: "rgba(255,255,255,0.1)",
  },
  cycleGlowTrack: {
    shadowColor: "#FFFFFF",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 3,
  },
  emptyStateText: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 12,
    textAlign: "center",
    marginTop: 20,
    fontStyle: "italic",
  },
});
