import { CycleDataProvider, useCycleData } from "@/hooks/use-cycle-store";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Tabs } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
  useWindowDimensions,
} from "react-native";
import Svg, { Path } from "react-native-svg";

const C = {
  bar: "rgba(0, 23, 83, 0.65)",
  activeCircle: "#2A5CA8",
  icon: "#FFFFFF",
  inactiveDim: "rgba(255,255,255,0.55)",
  modalBg: "#071A3E",
  periodRed: "#D93025",
  periodRedTranslucent: "rgba(217, 48, 37, 0.25)",
  symptomBlue: "#0E2D5A",
};

const TAB_BAR_HEIGHT = 65;
const TAB_BAR_BOTTOM = 35;

function AddButton({ isOpen, isFocused }: { isOpen: boolean; isFocused: boolean }) {
  const progress = useRef(new Animated.Value(isOpen ? 1 : 0)).current;

  useEffect(() => {
    Animated.spring(progress, {
      toValue: isOpen ? 1 : 0,
      useNativeDriver: true,
      tension: 100,
      friction: 8,
    }).start();
  }, [isOpen, progress]);

  const rotate = progress.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "135deg"] });

  return (
    <Animated.View style={{ transform: [{ rotate }] }}>
      <Ionicons name="add" size={32} color={isFocused ? C.icon : C.inactiveDim} />
    </Animated.View>
  );
}

function TabBarItem({ route, index, activeIndex, onPress, modalOpen }: any) {
  const isFocused = activeIndex === index;
  const isAdd = route.name === "add";
  const translateY = useRef(new Animated.Value(isFocused ? -28 : 0)).current;

  useEffect(() => {
    Animated.spring(translateY, {
      toValue: isFocused ? -28 : 0,
      useNativeDriver: true,
      tension: 110,
      friction: 6,
    }).start();
  }, [isFocused, translateY]);

  let iconName: any = "";
  if (route.name === "dashboard") iconName = "water-outline";
  if (route.name === "insights") iconName = "bar-chart-outline";
  if (route.name === "calendar") iconName = "calendar-outline";
  if (route.name === "profile") iconName = "person-outline";

  return (
    <Pressable onPress={onPress} style={styles.tabButton} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
      <Animated.View style={{ transform: [{ translateY }] }}>
        {isAdd ? (
          <AddButton isOpen={modalOpen} isFocused={isFocused} />
        ) : (
          <Ionicons name={iconName} size={24} color={isFocused ? C.icon : C.inactiveDim} />
        )}
      </Animated.View>
    </Pressable>
  );
}

function CustomTabBar({ state, navigation, modalOpen, setModalOpen }: any) {
  const { width } = useWindowDimensions();
  const barWidth = width - 40;
  const tabWidth = barWidth / 5;
  
  const activeIndex = modalOpen ? 2 : state.index;
  const slideAnim = useRef(new Animated.Value(activeIndex)).current;

  const SVG_WIDTH = barWidth * 4;
  const CX = SVG_WIDTH / 2;

  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: activeIndex,
      useNativeDriver: true,
      tension: 85,
      friction: 8,
    }).start();
  }, [activeIndex, slideAnim]);

  const svgTranslateX = slideAnim.interpolate({
    inputRange: [0, 1, 2, 3, 4],
    outputRange: [
      tabWidth * 0.5 - CX,
      tabWidth * 1.5 - CX,
      tabWidth * 2.5 - CX,
      tabWidth * 3.5 - CX,
      tabWidth * 4.5 - CX,
    ],
  });

  const indicatorTranslateX = slideAnim.interpolate({
    inputRange: [0, 1, 2, 3, 4],
    outputRange: [
      tabWidth * 0 + tabWidth / 2 - 28,
      tabWidth * 1 + tabWidth / 2 - 28,
      tabWidth * 2 + tabWidth / 2 - 28,
      tabWidth * 3 + tabWidth / 2 - 28,
      tabWidth * 4 + tabWidth / 2 - 28,
    ],
  });

  const path = `
    M 0 0
    L ${CX - 60} 0
    C ${CX - 25} 0, ${CX - 32} 38, ${CX} 38
    C ${CX + 32} 38, ${CX + 25} 0, ${CX + 60} 0
    L ${SVG_WIDTH} 0
    L ${SVG_WIDTH} ${TAB_BAR_HEIGHT}
    L 0 ${TAB_BAR_HEIGHT}
    Z
  `;

  return (
    <View style={[styles.customTabBarContainer, { width: barWidth }]}>
      <View style={styles.maskContainer}>
        <Animated.View style={[StyleSheet.absoluteFill, { transform: [{ translateX: svgTranslateX }] }]}>
          <Svg width={SVG_WIDTH} height={TAB_BAR_HEIGHT} style={styles.svgBackground}>
            <Path d={path} fill={C.bar} />
          </Svg>
        </Animated.View>
      </View>

      <Animated.View
        style={[
          styles.slidingIndicator,
          { transform: [{ translateX: indicatorTranslateX }] },
        ]}
      />

      <View style={styles.tabButtonsContainer}>
        {state.routes.map((route: any, index: number) => {
          const onPress = () => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

            if (route.name === "add") {
              setModalOpen(!modalOpen);
              return;
            }
            if (modalOpen) setModalOpen(false);

            const event = navigation.emit({ type: "tabPress", target: route.key, canPreventDefault: true });
            if (state.index !== index && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          return (
            <TabBarItem
              key={route.key}
              route={route}
              index={index}
              activeIndex={activeIndex}
              onPress={onPress}
              modalOpen={modalOpen}
            />
          );
        })}
      </View>
    </View>
  );
}

const DAY_HEADERS = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

function getMonthMeta(year: number, month: number) {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  return { firstDay, daysInMonth };
}

function buildWeeks(offset: number, total: number): (number | null)[][] {
  const cells: (number | null)[] = [...Array(offset).fill(null), ...Array.from({ length: total }, (_, i) => i + 1)];
  while (cells.length < 42) cells.push(null);
  const weeks: (number | null)[][] = [];
  for (let i = 0; i < 42; i += 7) weeks.push(cells.slice(i, i + 7));
  return weeks;
}

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function CalendarSection({ year, month, selectedDays, predictedDays, hasChanges, onToggleDay, onPrevMonth, onNextMonth }: any) {
  const { firstDay, daysInMonth } = getMonthMeta(year, month);
  const weeks = buildWeeks(firstDay, daysInMonth);

  return (
    <View style={styles.calSection}>
      <Text style={styles.sectionHeader}>Edit Period</Text>
      <View style={styles.monthNav}>
        <TouchableOpacity onPress={onPrevMonth} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="chevron-back" size={18} color="#A0B4D0" />
        </TouchableOpacity>
        <Text style={styles.monthTitle}>{MONTH_NAMES[month]} {year}</Text>
        <TouchableOpacity onPress={onNextMonth} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="chevron-forward" size={18} color="#A0B4D0" />
        </TouchableOpacity>
      </View>
      <View style={styles.calRow}>
        {DAY_HEADERS.map((d) => <Text key={d} style={styles.dayHeader}>{d}</Text>)}
      </View>
      {weeks.map((week, wi) => (
        <View key={wi} style={styles.calRow}>
          {week.map((day, di) => {
            const isPeriod = day !== null && selectedDays.includes(day);
            const isPredicted = day !== null && predictedDays.includes(day) && !isPeriod;
            return (
              <View key={di} style={styles.dayCell}>
                {day !== null ? (
                  <Pressable
                    onPress={() => onToggleDay(day)}
                    style={[styles.dayInner, isPredicted && styles.dayPredicted, isPeriod && styles.dayPeriod]}
                  >
                    <Text style={[styles.dayText, isPredicted && styles.dayTextPredicted, isPeriod && styles.dayTextPeriod]}>{day}</Text>
                  </Pressable>
                ) : <View style={styles.dayInner} />}
              </View>
            );
          })}
        </View>
      ))}
    </View>
  );
}

const MOODS = ["Happy", "Sad", "Sensitive", "Angry", "Calm", "Anxious", "Energetic", "Apathetic"];
const SYMPTOMS = ["Cramps", "Bloating", "Headache", "Acne", "Backache", "Tender Breasts", "Nausea", "Fatigue", "Cravings"];
const TODAY = new Date();
const INITIAL_YEAR = TODAY.getFullYear();
const INITIAL_MONTH = TODAY.getMonth();

function AddModal({ visible, onClose }: { visible: boolean; onClose: () => void; }) {
  const {
    getPeriodDaysForMonth, getPredictedDaysForMonth, setPeriodDatesForMonth, recalcPredictions, logMoodSymptoms,
  } = useCycleData();
  const [viewYear, setViewYear] = useState(INITIAL_YEAR);
  const [viewMonth, setViewMonth] = useState(INITIAL_MONTH);
  const [draftDays, setDraftDays] = useState<number[]>([]);
  const [savedDays, setSavedDays] = useState<number[]>([]);
  const [selectedMoods, setSelectedMoods] = useState<string[]>([]);
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);

  useEffect(() => {
    if (visible) {
      const today = new Date();
      setViewYear(today.getFullYear());
      setViewMonth(today.getMonth());
      setSelectedMoods([]);
      setSelectedSymptoms([]);
    }
  }, [visible]);

  useEffect(() => {
    if (!visible) return;
    const days = getPeriodDaysForMonth(viewYear, viewMonth);
    setDraftDays(days);
    setSavedDays(days);
  }, [visible, viewMonth, viewYear, getPeriodDaysForMonth]);

  const predictedDays = getPredictedDaysForMonth(viewYear, viewMonth);
  const hasChanges = JSON.stringify([...draftDays].sort()) !== JSON.stringify([...savedDays].sort());
  const hasLogSelection = selectedMoods.length > 0 || selectedSymptoms.length > 0;

  const handleToggleDay = (day: number) => setDraftDays((prev) => prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]);
  const handlePrevMonth = () => { if (viewMonth === 0) { setViewYear((y) => y - 1); setViewMonth(11); } else setViewMonth((m) => m - 1); };
  const handleNextMonth = () => { if (viewMonth === 11) { setViewYear((y) => y + 1); setViewMonth(0); } else setViewMonth((m) => m + 1); };

  const handleSave = () => {
    setPeriodDatesForMonth(viewYear, viewMonth, draftDays);
    recalcPredictions();
    setSavedDays(draftDays);
    onClose();
  };

  const handleClose = () => { setDraftDays(savedDays); onClose(); };
  const toggleSelected = (value: string, setSelected: any) => setSelected((prev: string[]) => prev.includes(value) ? prev.filter((item: string) => item !== value) : [...prev, value]);

  const handleLog = () => {
    logMoodSymptoms(new Date(), selectedMoods, selectedSymptoms);
    setSelectedMoods([]);
    setSelectedSymptoms([]);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent onRequestClose={handleClose}>
      <TouchableWithoutFeedback onPress={handleClose}><View style={styles.overlay} /></TouchableWithoutFeedback>
      <View style={styles.modalCard}>
        <CalendarSection
          year={viewYear} month={viewMonth} selectedDays={draftDays} predictedDays={predictedDays}
          hasChanges={hasChanges} onToggleDay={handleToggleDay} onPrevMonth={handlePrevMonth} onNextMonth={handleNextMonth}
        />
        <Pressable onPress={hasChanges ? handleSave : undefined} style={[styles.saveBtn, !hasChanges && styles.saveBtnDim]}>
          <Ionicons name="checkmark-circle-outline" size={16} color={hasChanges ? "#E8F4FF" : "#4A6A8A"} style={{ marginRight: 6 }} />
          <Text style={[styles.saveBtnText, !hasChanges && styles.saveBtnTextDim]}>Save Changes</Text>
        </Pressable>
        <View style={styles.divider} />
        <View style={styles.logSection}>
          <Text style={styles.sectionHeader}>Moods</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.logRow}>
            {MOODS.map((mood) => {
              const active = selectedMoods.includes(mood);
              return (
                <Pressable key={mood} style={[styles.logCircle, active && styles.logCircleActive]} onPress={() => toggleSelected(mood, setSelectedMoods)}>
                  <Text style={[styles.logText, active && styles.logTextActive]}>{mood.slice(0, 2).toUpperCase()}</Text>
                </Pressable>
              );
            })}
          </ScrollView>
          <Text style={styles.sectionHeader}>Symptoms</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.logRow}>
            {SYMPTOMS.map((symptom) => {
              const active = selectedSymptoms.includes(symptom);
              return (
                <Pressable key={symptom} style={[styles.logCircle, active && styles.logCircleActive]} onPress={() => toggleSelected(symptom, setSelectedSymptoms)}>
                  <Text style={[styles.logText, active && styles.logTextActive]}>{symptom.split(" ").map((word) => word[0]).join("").toUpperCase()}</Text>
                </Pressable>
              );
            })}
          </ScrollView>
          <Pressable onPress={hasLogSelection ? handleLog : undefined} style={[styles.logBtn, !hasLogSelection && styles.logBtnDim]}>
            <Text style={[styles.logBtnText, !hasLogSelection && styles.logBtnTextDim]}>Log</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

export default function TabLayout() {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <CycleDataProvider>
      <Tabs tabBar={(props) => <CustomTabBar {...props} modalOpen={modalOpen} setModalOpen={setModalOpen} />} screenOptions={{ headerShown: false }}>
        <Tabs.Screen name="dashboard" />
        <Tabs.Screen name="insights" />
        <Tabs.Screen name="add" />
        <Tabs.Screen name="calendar" />
        <Tabs.Screen name="profile" />
      </Tabs>
      <AddModal visible={modalOpen} onClose={() => setModalOpen(false)} />
    </CycleDataProvider>
  );
}

const styles = StyleSheet.create({
  customTabBarContainer: {
    position: "absolute",
    bottom: TAB_BAR_BOTTOM,
    alignSelf: "center",
    height: TAB_BAR_HEIGHT,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 18,
    elevation: 12,
  },
  maskContainer: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: TAB_BAR_HEIGHT / 2,
    overflow: "hidden",
  },
  svgBackground: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  tabButtonsContainer: {
    flexDirection: "row",
    height: TAB_BAR_HEIGHT,
    alignItems: "center",
    width: "100%",
  },
  tabButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    height: "100%",
  },
  slidingIndicator: {
    position: "absolute",
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: C.activeCircle,
    top: -24,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "transparent",
  },
  modalCard: {
    position: "absolute",
    bottom: TAB_BAR_BOTTOM + TAB_BAR_HEIGHT + 32,
    left: 12,
    right: 12,
    backgroundColor: "rgba(8, 29, 83, 0.96)",
    borderRadius: 24,
    paddingTop: 18,
    paddingBottom: 16,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.28,
    shadowRadius: 20,
    elevation: 10,
  },
  calSection: { marginBottom: 4 },
  sectionHeader: { color: "#A0B4D0", fontSize: 11, letterSpacing: 0.8, textTransform: "uppercase", textAlign: "center", marginBottom: 10 },
  monthNav: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 10, paddingHorizontal: 6 },
  monthTitle: { color: "#E8F4FF", fontSize: 15, fontWeight: "600", letterSpacing: 0.3 },
  calRow: { flexDirection: "row", justifyContent: "space-around", marginBottom: 2 },
  dayHeader: { flex: 1, textAlign: "center", color: "#5A7A9A", fontSize: 10, fontWeight: "600", letterSpacing: 0.4, marginBottom: 4 },
  dayCell: { flex: 1, alignItems: "center", paddingVertical: 2 },
  dayInner: { width: 30, height: 30, borderRadius: 15, alignItems: "center", justifyContent: "center" },
  dayPeriod: { backgroundColor: C.periodRed },
  dayPredicted: { backgroundColor: C.periodRedTranslucent, borderWidth: 1, borderColor: "rgba(217, 48, 37, 0.4)" },
  dayText: { color: "#C8D8EC", fontSize: 13 },
  dayTextPeriod: { color: "#FFF", fontWeight: "700" },
  dayTextPredicted: { color: "#FFF" },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: "rgba(100,181,246,0.15)", marginVertical: 14, marginHorizontal: 4 },
  logSection: { marginBottom: 4 },
  logRow: { flexDirection: "row", gap: 10, paddingHorizontal: 4, paddingBottom: 12 },
  logCircle: { width: 48, height: 48, borderRadius: 24, backgroundColor: C.symptomBlue, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "rgba(74,144,217,0.3)" },
  logCircleActive: { backgroundColor: "#64B5F6", borderColor: "#64B5F6" },
  logText: { color: "#ebf4ff", fontSize: 11, fontWeight: "600", letterSpacing: 0.6 },
  logTextActive: { color: "#001753" },
  logBtn: { marginTop: 4, backgroundColor: "transparent", borderRadius: 16, paddingVertical: 10, paddingHorizontal: 12, alignItems: "center", alignSelf: "center", width: 88, borderWidth: 0.2, borderColor: "rgba(232,244,255,0.55)" },
  logBtnDim: { opacity: 0.3 },
  logBtnText: { color: "#E8F4FF", fontSize: 12, fontWeight: "600", letterSpacing: 0.6 },
  logBtnTextDim: { color: "#a9bfd4" },
  saveBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", marginTop: 14, alignSelf: "center", width: 160, paddingVertical: 11, paddingHorizontal: 14, borderRadius: 24, backgroundColor: "transparent",
    borderWidth: 0.2, borderColor: "rgba(232,244,255,0.55)",
  },
  saveBtnDim: { opacity: 0.45 },
  saveBtnText: { color: "#E8F4FF", fontSize: 13, fontWeight: "600", letterSpacing: 0.5 },
  saveBtnTextDim: { color: "#4A6A8A" },
});