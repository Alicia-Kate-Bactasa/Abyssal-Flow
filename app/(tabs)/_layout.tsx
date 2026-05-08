// app/(tabs)/_layout.tsx
import { Tabs } from "expo-router";
import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Text,
  Pressable,
  Platform,
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";

// ─── Colours ──────────────────────────────────────────────────────────────────
const C = {
  bar: "#001242",
  activeCircle: "#2A5CA8",
  icon: "#FFFFFF",
  inactiveDim: "rgba(255,255,255,0.55)",
  modalBg: "#071A3E",
  periodRed: "#D93025",
  periodRedTranslucent: "rgba(217, 48, 37, 0.25)", // New translucent highlight
  symptomBlue: "#0E2D5A",
  symptomIcon: "#4A90D9",
  caret: "#071A3E",
};

// ─── Layout Constants ─────────────────────────────────────────────────────────
const TAB_BAR_HEIGHT = 70;
const TAB_BAR_BOTTOM = 16;
const CARET = 12;

// ─── TabIcon ──────────────────────────────────────────────────────────────────
function TabIcon({
  name,
  focused,
  size = 24,
}: {
  name: React.ComponentProps<typeof Ionicons>["name"];
  focused: boolean;
  size?: number;
}) {
  return (
    <View style={[styles.iconWrap, focused && styles.iconWrapActive]}>
      <Ionicons
        name={name}
        size={size}
        color={focused ? C.icon : C.inactiveDim}
      />
    </View>
  );
}

// ─── AddButton ────────────────────────────────────────────────────────────────
function AddButton({ isOpen }: { isOpen: boolean }) {
  return (
    <View style={styles.addBtnOuter}>
      <View style={[styles.addBtnGlow, isOpen && styles.addBtnGlowActive]} />
      <View style={[styles.addBtnInner, isOpen && styles.addBtnInnerActive]}>
        <Ionicons name={isOpen ? "close" : "add"} size={32} color={C.icon} />
      </View>
    </View>
  );
}

// ─── Calendar (interactive) ───────────────────────────────────────────────────
const DAY_HEADERS = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

function getMonthMeta(year: number, month: number) {
  const firstDay = new Date(year, month, 1).getDay(); // 0=Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  return { firstDay, daysInMonth };
}

function buildWeeks(offset: number, total: number): (number | null)[][] {
  const cells: (number | null)[] = [
    ...Array(offset).fill(null),
    ...Array.from({ length: total }, (_, i) => i + 1),
  ];

  // Force exactly 42 cells total (6 weeks x 7 days)
  while (cells.length < 42) {
    cells.push(null);
  }

  const weeks: (number | null)[][] = [];
  for (let i = 0; i < 42; i += 7) {
    weeks.push(cells.slice(i, i + 7));
  }

  return weeks;
}

const MONTH_NAMES = [
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

type CalendarSectionProps = {
  year: number;
  month: number;
  selectedDays: number[];
  predictedDays: number[]; // Added to track original predictions
  hasChanges: boolean; // Added to trigger highlight
  onToggleDay: (day: number) => void;
  onPrevMonth: () => void;
  onNextMonth: () => void;
};

function CalendarSection({
  year,
  month,
  selectedDays,
  predictedDays,
  hasChanges,
  onToggleDay,
  onPrevMonth,
  onNextMonth,
}: CalendarSectionProps) {
  const { firstDay, daysInMonth } = getMonthMeta(year, month);
  const weeks = buildWeeks(firstDay, daysInMonth);

  return (
    <View style={styles.calSection}>
      <Text style={styles.sectionHeader}>Edit Period</Text>

      <View style={styles.monthNav}>
        <TouchableOpacity
          onPress={onPrevMonth}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="chevron-back" size={18} color="#A0B4D0" />
        </TouchableOpacity>
        <Text style={styles.monthTitle}>
          {MONTH_NAMES[month]} {year}
        </Text>
        <TouchableOpacity
          onPress={onNextMonth}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="chevron-forward" size={18} color="#A0B4D0" />
        </TouchableOpacity>
      </View>

      <View style={styles.calRow}>
        {DAY_HEADERS.map((d) => (
          <Text key={d} style={styles.dayHeader}>
            {d}
          </Text>
        ))}
      </View>

      {weeks.map((week, wi) => (
        <View key={wi} style={styles.calRow}>
          {week.map((day, di) => {
            const isPeriod = day !== null && selectedDays.includes(day);
            const isPredicted =
              day !== null && predictedDays.includes(day) && !isPeriod;

            return (
              <View key={di} style={styles.dayCell}>
                {day !== null ? (
                  <Pressable
                    onPress={() => onToggleDay(day)}
                    style={[
                      styles.dayInner,
                      isPredicted && styles.dayPredicted,
                      isPeriod && styles.dayPeriod,
                    ]}
                  >
                    <Text
                      style={[
                        styles.dayText,
                        isPredicted && styles.dayTextPredicted,
                        isPeriod && styles.dayTextPeriod,
                      ]}
                    >
                      {day}
                    </Text>
                  </Pressable>
                ) : (
                  /* THIS IS THE FIX: An empty 30x30 view props up the empty days! */
                  <View style={styles.dayInner} />
                )}
              </View>
            );
          })}
        </View>
      ))}
    </View>
  );
}

// ─── Symptoms ─────────────────────────────────────────────────────────────────
type Symptom = {
  label: string;
  icon: React.ComponentProps<typeof MaterialCommunityIcons>["name"];
};
const SYMPTOMS: Symptom[] = [
  { label: "flirty", icon: "emoticon-wink-outline" },
  { label: "sad", icon: "emoticon-cry-outline" },
  { label: "angry", icon: "emoticon-angry-outline" },
  { label: "happy", icon: "emoticon-happy-outline" },
  { label: "hungry", icon: "food-fork-drink" },
];

function SymptomsSection() {
  const [selected, setSelected] = useState<string | null>(null);
  const toggle = (label: string) =>
    setSelected((s) => (s === label ? null : label));

  // Fix: Properly split the array so it doesn't render all 5 items twice!
  const chunkedSymptoms = [
    SYMPTOMS.slice(0, 3), // Row 1: First 3
    SYMPTOMS.slice(3, 5), // Row 2: Last 2
  ];

  return (
    <View style={styles.sympSection}>
      <Text style={styles.sectionHeader}>Log Mood/Symptoms</Text>
      {chunkedSymptoms.map((rowItems, rowIdx) => (
        <View key={rowIdx} style={styles.sympRow}>
          {rowItems.map((s) => {
            const active = selected === s.label;
            return (
              <Pressable
                key={s.label}
                style={styles.sympItem}
                onPress={() => toggle(s.label)} // Fix: Now completely clickable!
              >
                <View
                  style={[styles.sympCircle, active && styles.sympCircleActive]}
                >
                  <MaterialCommunityIcons
                    name={s.icon}
                    size={26}
                    color={active ? C.bar : C.symptomIcon}
                  />
                </View>
                <Text style={styles.sympLabel}>{s.label}</Text>
              </Pressable>
            );
          })}
        </View>
      ))}
    </View>
  );
}

// ─── Add Modal ────────────────────────────────────────────────────────────────
const TODAY = new Date();
const INITIAL_YEAR = TODAY.getFullYear();
const INITIAL_MONTH = TODAY.getMonth();
const INITIAL_PERIOD_DAYS = [17, 18, 19, 20]; // Mock predicted days for the current month

function AddModal({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) {
  const [viewYear, setViewYear] = useState(INITIAL_YEAR);
  const [viewMonth, setViewMonth] = useState(INITIAL_MONTH);

  useEffect(() => {
    if (visible) {
      const today = new Date();
      setViewYear(today.getFullYear());
      setViewMonth(today.getMonth());
    }
  }, [visible]);

  const [selectionMap, setSelectionMap] = useState<Record<string, number[]>>({
    [`${INITIAL_YEAR}-${INITIAL_MONTH}`]: [...INITIAL_PERIOD_DAYS],
  });
  const [savedMap, setSavedMap] = useState<Record<string, number[]>>({
    [`${INITIAL_YEAR}-${INITIAL_MONTH}`]: [...INITIAL_PERIOD_DAYS],
  });

  const monthKey = `${viewYear}-${viewMonth}`;
  const selectedDays = selectionMap[monthKey] ?? [];
  const savedDays = savedMap[monthKey] ?? [];

  // We identify the initial predictions strictly for the default mock month
  const isCurrentOrFutureMonth =
    viewYear > INITIAL_YEAR ||
    (viewYear === INITIAL_YEAR && viewMonth >= INITIAL_MONTH);
  const predictedDays = isCurrentOrFutureMonth ? INITIAL_PERIOD_DAYS : [];

  const hasChanges =
    JSON.stringify([...selectedDays].sort()) !==
    JSON.stringify([...savedDays].sort());

  const handleToggleDay = (day: number) => {
    setSelectionMap((prev) => {
      const current = prev[monthKey] ?? [];
      const next = current.includes(day)
        ? current.filter((d) => d !== day)
        : [...current, day];
      return { ...prev, [monthKey]: next };
    });
  };

  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewYear((y) => y - 1);
      setViewMonth(11);
    } else setViewMonth((m) => m - 1);
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewYear((y) => y + 1);
      setViewMonth(0);
    } else setViewMonth((m) => m + 1);
  };

  const handleSave = () => {
    setSavedMap((prev) => ({ ...prev, [monthKey]: [...selectedDays] }));
    onClose();
  };

  const handleClose = () => {
    setSelectionMap(savedMap); // reset unsaved tweaks
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={handleClose}
    >
      {/* Clicking overlay closes it */}
      <TouchableWithoutFeedback onPress={handleClose}>
        <View style={styles.overlay} />
      </TouchableWithoutFeedback>

      {/* Removed pointerEvents="box-none" so card absorbs internal taps safely! */}
      <View style={styles.modalCard}>
        <CalendarSection
          year={viewYear}
          month={viewMonth}
          selectedDays={selectedDays}
          predictedDays={predictedDays}
          hasChanges={hasChanges}
          onToggleDay={handleToggleDay}
          onPrevMonth={handlePrevMonth}
          onNextMonth={handleNextMonth}
        />

        <Pressable
          onPress={hasChanges ? handleSave : undefined}
          style={[styles.saveBtn, !hasChanges && styles.saveBtnDim]}
        >
          <Ionicons
            name="checkmark-circle-outline"
            size={16}
            color={hasChanges ? "#E8F4FF" : "#4A6A8A"}
            style={{ marginRight: 6 }}
          />
          <Text
            style={[styles.saveBtnText, !hasChanges && styles.saveBtnTextDim]}
          >
            Save Changes
          </Text>
        </Pressable>

        <View style={styles.divider} />
        <SymptomsSection />
        <View style={styles.caretShape} />
      </View>
    </Modal>
  );
}

// ─── Root Layout ──────────────────────────────────────────────────────────────
export default function TabLayout() {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarShowLabel: false,
          tabBarStyle: styles.tabBar,
          tabBarItemStyle: {
            justifyContent: "center",
            alignItems: "center",
            height: TAB_BAR_HEIGHT,
          },
          tabBarActiveTintColor: C.icon,
          tabBarInactiveTintColor: C.inactiveDim,
          tabBarHideOnKeyboard: true,
        }}
      >
        <Tabs.Screen
          name="dashboard"
          options={{
            tabBarIcon: ({ focused }) => (
              <TabIcon name="water-outline" focused={focused} />
            ),
          }}
        />
        <Tabs.Screen
          name="insights"
          options={{
            tabBarIcon: ({ focused }) => (
              <TabIcon name="bar-chart-outline" focused={focused} />
            ),
          }}
        />
        <Tabs.Screen
          name="add"
          options={{
            tabBarButton: (props) => {
              return (
                <TouchableOpacity
                  activeOpacity={1}
                  onPress={() => setModalOpen(!modalOpen)}
                  style={[props.style, { top: -25 }]}
                  hitSlop={{ top: 30, bottom: 20, left: 20, right: 20 }}
                >
                  <AddButton isOpen={modalOpen} />
                </TouchableOpacity>
              );
            },
          }}
        />
        <Tabs.Screen
          name="calendar"
          options={{
            tabBarIcon: ({ focused }) => (
              <TabIcon name="calendar-outline" focused={focused} />
            ),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            tabBarIcon: ({ focused }) => (
              <TabIcon name="person-outline" focused={focused} />
            ),
          }}
        />
      </Tabs>
      <AddModal visible={modalOpen} onClose={() => setModalOpen(false)} />
    </>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const ADD_SIZE = 52;
const GLOW_SIZE = ADD_SIZE + 16;

const styles = StyleSheet.create({
  tabBar: {
    position: "absolute",
    bottom: TAB_BAR_BOTTOM,
    left: 20,
    right: 20,
    height: TAB_BAR_HEIGHT,
    backgroundColor: C.bar,
    borderRadius: 40,
    borderTopWidth: 0,
    paddingBottom: 0,
    paddingTop: 0,
    overflow: "visible",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 18,
    elevation: 12,
  },
  iconWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
    transform: [{ translateY: 12 }],
  },
  iconWrapActive: {
    backgroundColor: C.activeCircle,
  },
  addBtnOuter: {
    width: GLOW_SIZE,
    height: GLOW_SIZE,
    alignItems: "center",
    justifyContent: "center",
  },
  addBtnGlow: {
    position: "absolute",
    width: GLOW_SIZE,
    height: GLOW_SIZE,
    borderRadius: GLOW_SIZE / 2,
    backgroundColor: "rgba(100,181,246,0.12)",
  },
  addBtnGlowActive: {
    backgroundColor: "rgba(100,181,246,0.25)",
  },
  addBtnInner: {
    width: ADD_SIZE,
    height: ADD_SIZE,
    borderRadius: ADD_SIZE / 2,
    backgroundColor: "#0E3460",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "rgba(100,181,246,0.4)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.45,
    shadowRadius: 8,
    elevation: 10,
  },
  addBtnInnerActive: {
    backgroundColor: "#163E70",
    borderColor: "rgba(100,181,246,0.75)",
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(1,8,24,0.72)",
  },
  modalCard: {
    position: "absolute",
    bottom: TAB_BAR_BOTTOM + TAB_BAR_HEIGHT + 10,
    left: 12,
    right: 12,
    backgroundColor: C.modalBg,
    borderRadius: 20,
    paddingTop: 18,
    paddingBottom: 18,
    paddingHorizontal: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.6,
    shadowRadius: 32,
    elevation: 20,
  },
  caretShape: {
    position: "absolute",
    bottom: -CARET,
    alignSelf: "center",
    width: 0,
    height: 0,
    borderLeftWidth: CARET,
    borderRightWidth: CARET,
    borderTopWidth: CARET,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderTopColor: C.caret,
  },
  calSection: { marginBottom: 4 },
  sectionHeader: {
    color: "#A0B4D0",
    fontSize: 11,
    letterSpacing: 0.8,
    textTransform: "uppercase",
    textAlign: "center",
    marginBottom: 10,
  },
  monthNav: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
    paddingHorizontal: 6,
  },
  monthTitle: {
    color: "#E8F4FF",
    fontSize: 15,
    fontWeight: "600",
    letterSpacing: 0.3,
  },
  calRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 2,
  },
  dayHeader: {
    flex: 1,
    textAlign: "center",
    color: "#5A7A9A",
    fontSize: 10,
    fontWeight: "600",
    letterSpacing: 0.4,
    marginBottom: 4,
  },
  dayCell: { flex: 1, alignItems: "center", paddingVertical: 2 },
  dayInner: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  dayPeriod: { backgroundColor: C.periodRed },
  dayPredicted: {
    backgroundColor: C.periodRedTranslucent, // Triggers when altering dates
    borderWidth: 1,
    borderColor: "rgba(217, 48, 37, 0.4)",
  },
  dayText: { color: "#C8D8EC", fontSize: 13 },
  dayTextPeriod: { color: "#FFF", fontWeight: "700" },
  dayTextPredicted: { color: "#FFF" },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: "rgba(100,181,246,0.15)",
    marginVertical: 14,
    marginHorizontal: 4,
  },
  sympSection: { marginBottom: 4 },
  sympRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 10,
  },
  sympItem: { alignItems: "center", gap: 5 },
  sympCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: C.symptomBlue,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(74,144,217,0.3)",
  },
  sympCircleActive: { backgroundColor: "#64B5F6", borderColor: "#64B5F6" },
  sympLabel: {
    color: "#7A9DBF",
    fontSize: 10,
    textAlign: "center",
    letterSpacing: 0.2,
  },
  saveBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 14,
    marginHorizontal: 20,
    paddingVertical: 11,
    borderRadius: 24,
    backgroundColor: "#1A5FA8",
    shadowColor: "#1A5FA8",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.45,
    shadowRadius: 10,
    elevation: 6,
  },
  saveBtnDim: {
    backgroundColor: "#0C1F3A",
    shadowOpacity: 0,
    elevation: 0,
  },
  saveBtnText: {
    color: "#E8F4FF",
    fontSize: 13,
    fontWeight: "600",
    letterSpacing: 0.5,
  },
  saveBtnTextDim: {
    color: "#4A6A8A",
  },
});
