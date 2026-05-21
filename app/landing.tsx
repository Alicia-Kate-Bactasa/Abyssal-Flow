import WaveBackground from "@/components/WaveBackground";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState, type ReactElement } from "react";
import {
    Animated,
    Dimensions,
    Keyboard,
    KeyboardAvoidingView,
    Platform,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View,
} from "react-native";

const { height } = Dimensions.get("window");
const TOTAL_STEPS = 14;

// ─── Cycle length bounds (Step 9) ────────────────────────────────────────────
const ITEM_HEIGHT = 32;
const VISIBLE_ITEMS = 7;
const MIN_CYCLE_LENGTH = 20;
const MAX_CYCLE_LENGTH = 45;
const DEFAULT_CYCLE_LENGTH = 28;

// ─── Calendar constants (Step 8) ─────────────────────────────────────────────
const DAYS = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}
function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}
function buildMonthWeeks(year: number, month: number) {
  const firstDay = getFirstDayOfMonth(year, month);
  const daysInMonth = getDaysInMonth(year, month);
  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, index) => index + 1),
  ];

  while (cells.length < 42) cells.push(null);

  const weeks: (number | null)[][] = [];
  for (let index = 0; index < 42; index += 7) {
    weeks.push(cells.slice(index, index + 7));
  }

  return weeks;
}
function formatShortDate(date: Date) {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const year = String(date.getFullYear()).slice(-2);
  return `${month}/${day}/${year}`;
}

// ─── Data sets ───────────────────────────────────────────────────────────────
const CONDITIONS = [
  { id: "pcos", label: "PCOS" },
  { id: "endometriosis", label: "Endometriosis" },
  { id: "fibroids", label: "Uterine Fibroids" },
  { id: "thyroid", label: "Thyroid Disorder" },
  { id: "none", label: "None of the above" },
];
const CHECKUP_OPTIONS = [
  { id: "yes", label: "Yes, regularly" },
  { id: "sometimes", label: "Only when there is an issue" },
  { id: "no", label: "No, not recently" },
];
const MEDICATIONS = [
  { id: "birth_control", label: "Birth Control (Pill, Patch, Ring)" },
  { id: "hormonal", label: "Hormonal Supplements" },
  { id: "painkillers", label: "Painkillers for cramps" },
  { id: "none", label: "None" },
];
const FLOW_OPTIONS = [
  { id: "light", label: "Light (Spotting or minimal)" },
  { id: "medium", label: "Medium (Steady)" },
  { id: "heavy", label: "Heavy (Frequent changes needed)" },
];
const SYMPTOMS = [
  { id: "cramps", label: "Abdominal Cramps" },
  { id: "bloating", label: "Bloating" },
  { id: "breast", label: "Breast Tenderness" },
  { id: "backpain", label: "Back Pain" },
  { id: "acne", label: "Acne / Breakouts" },
  { id: "headaches", label: "Headaches" },
];
const MOODS = [
  { id: "anxiety", label: "Increased Anxiety" },
  { id: "irritability", label: "Irritability" },
  { id: "lowmood", label: "Low Mood / Sadness" },
  { id: "fatigue", label: "Fatigue / Exhaustion" },
  { id: "nochange", label: "No significant change" },
];
const FOODS = [
  { id: "sweet", label: "Sweet (Chocolates/Candy)" },
  { id: "salty", label: "Salty (Chips/Fries)" },
  { id: "savory", label: "Savory (Heavy Meals)" },
  { id: "spicy", label: "Spicy (Hot foods)" },
];
const CYCLE_REGULARITY = [
  { id: "regular", label: "Regular", description: "Happens around the same time" },
  { id: "irregular", label: "Irregular", description: "Difficult to predict" },
];

// ─── Reusable animated hook ───────────────────────────────────────────────────
function useStepAnimation() {
  const titleOpacity = useRef(new Animated.Value(1)).current;
  const subtitleOpacity = useRef(new Animated.Value(1)).current;
  const bodyOpacity = useRef(new Animated.Value(1)).current;
  const buttonOpacity = useRef(new Animated.Value(1)).current;

  const run = useCallback((extraAnims: Animated.CompositeAnimation[] = []) => {
    Animated.stagger(150, [
      Animated.timing(titleOpacity, { toValue: 0, duration: 1, useNativeDriver: true }),
      Animated.parallel([
        Animated.timing(titleOpacity, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(subtitleOpacity, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(bodyOpacity, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(buttonOpacity, { toValue: 1, duration: 700, useNativeDriver: true }),
      ]),
      ...extraAnims,
    ]).start();
  }, [bodyOpacity, buttonOpacity, subtitleOpacity, titleOpacity]);

  return useMemo(
    () => ({ titleOpacity, subtitleOpacity, bodyOpacity, buttonOpacity, run }),
    [bodyOpacity, buttonOpacity, run, subtitleOpacity, titleOpacity],
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function RadioList({
  options,
  selected,
  onSelect,
  multi = false,
}: {
  options: { id: string; label: string }[];
  selected: string | string[];
  onSelect: (id: string) => void;
  multi?: boolean;
}) {
  const isSelected = (id: string) =>
    multi ? (selected as string[]).includes(id) : selected === id;

  return (
    <>
      {options.map((opt) => {
        const sel = isSelected(opt.id);
        return (
          <TouchableOpacity
            activeOpacity={1}
            key={opt.id}
            style={[s.optionRow, sel && s.optionRowSelected]}
            onPress={() => onSelect(opt.id)}
          >
            <View style={[s.radioDot, sel && s.radioDotSelected]}>
              {sel && <View style={s.radioDotInner} />}
            </View>
            <Text style={[s.optionLabel, sel && s.optionLabelSelected]}>{opt.label}</Text>
          </TouchableOpacity>
        );
      })}
    </>
  );
}

// ─── Animated water icon (Step 14) ───────────────────────────────────────────
function WaterIcon() {
  const wave1 = useRef(new Animated.Value(0)).current;
  const wave2 = useRef(new Animated.Value(0)).current;
  const wave3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animateWave = (anim: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.timing(anim, { toValue: 6, duration: 800, delay, useNativeDriver: true }),
          Animated.timing(anim, { toValue: 0, duration: 800, useNativeDriver: true }),
        ]),
      );
    animateWave(wave1, 0).start();
    animateWave(wave2, 200).start();
    animateWave(wave3, 400).start();
  }, [wave1, wave2, wave3]);

  return (
    <View style={s.waterIconContainer}>
      {[wave1, wave2, wave3].map((anim, i) => (
        <Animated.View key={i} style={[s.waveLine, { transform: [{ translateY: anim }] }]}>
          <View style={s.waveShape} />
        </Animated.View>
      ))}
    </View>
  );
}

// ─── Progress bar ─────────────────────────────────────────────────────────────
function ProgressBar({ step }: { step: number }) {
  const progress = useRef(new Animated.Value((step - 1) / TOTAL_STEPS)).current;

  useEffect(() => {
    Animated.timing(progress, {
      toValue: step / TOTAL_STEPS,
      duration: 350,
      useNativeDriver: false,
    }).start();
  }, [progress, step]);

  return (
    <View style={s.progressTrack}>
      <Animated.View
        style={[
          s.progressFill,
          {
            width: progress.interpolate({
              inputRange: [0, 1],
              outputRange: ["0%", "100%"],
            }),
          },
        ]}
      />
    </View>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function LandingScreen() {
  const router = useRouter();
  const [step, setStep] = useState(1);

  // Collected data
  const [nickname, setNickname] = useState("");
  const [birthday, setBirthday] = useState("");
  const [birthdayPickerOpen, setBirthdayPickerOpen] = useState(false);
  const [birthdayViewYear, setBirthdayViewYear] = useState(() => new Date().getFullYear() - 20);
  const [birthdayViewMonth, setBirthdayViewMonth] = useState(() => new Date().getMonth());
  const [cycleRegularity, setCycleRegularity] = useState<string | null>(null);
  const [healthHistory, setHealthHistory] = useState<string[]>([]);
  const [medicalCheckups, setMedicalCheckups] = useState<string | null>(null);
  const [medications, setMedications] = useState<string[]>([]);
  const [selectedDates, setSelectedDates] = useState<string[]>([]);
  const [cycleLength, setCycleLength] = useState(DEFAULT_CYCLE_LENGTH);
  const [typicalFlow, setTypicalFlow] = useState<string | null>(null);
  const [symptoms, setSymptoms] = useState<string[]>([]);
  const [moods, setMoods] = useState<string[]>([]);
  const [comfortFood, setComfortFood] = useState<string[]>([]);

  // Calendar state (Step 8)
  const now = new Date();
  const [currentYear, setCurrentYear] = useState(now.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(now.getMonth());

  const anim = useStepAnimation();

  // Animate on step change
  useEffect(() => {
    anim.run();
  }, [anim, step]);

  // ── Navigation helpers ──────────────────────────────────────────────────────
  const goNext = () => {
    if (step < TOTAL_STEPS) setStep((s) => s + 1);
    else router.replace("/dashboard");
  };
  const goBack = () => {
    if (step > 1) setStep((s) => s - 1);
    else router.back();
  };

  // ── Multi-select helpers ────────────────────────────────────────────────────
  const toggleMulti = (
    id: string,
    list: string[],
    setList: (v: string[]) => void,
    exclusiveId?: string,
  ) => {
    if (id === exclusiveId) {
      setList([exclusiveId]);
      return;
    }
    const withoutExclusive = exclusiveId ? list.filter((i) => i !== exclusiveId) : list;
    if (withoutExclusive.includes(id)) {
      setList(withoutExclusive.filter((i) => i !== id));
    } else {
      setList([...withoutExclusive, id]);
    }
  };

  // ── Calendar helpers (Step 8) ───────────────────────────────────────────────
  const toggleDate = (day: number) => {
    const key = `${currentYear}-${currentMonth}-${day}`;
    setSelectedDates((prev) =>
      prev.includes(key) ? prev.filter((d) => d !== key) : [...prev, key],
    );
  };
  const isDateSelected = (day: number) =>
    selectedDates.includes(`${currentYear}-${currentMonth}-${day}`);

  const selectBirthday = (day: number) => {
    const chosen = new Date(birthdayViewYear, birthdayViewMonth, day);
    setBirthday(formatShortDate(chosen));
    setBirthdayPickerOpen(false);
  };

  const renderBirthdayGrid = () => {
    const weeks = buildMonthWeeks(birthdayViewYear, birthdayViewMonth);
    return weeks.map((week, weekIndex) => (
      <View key={weekIndex} style={s.dayGridRow}>
        {week.map((day, cellIndex) => {
          if (!day) {
            return <View key={`birthday-empty-${cellIndex}`} style={s.dayCell} />;
          }
          const isSelected = birthday === formatShortDate(new Date(birthdayViewYear, birthdayViewMonth, day));
          return (
            <TouchableOpacity
              activeOpacity={1}
              key={`${birthdayViewYear}-${birthdayViewMonth}-${day}`}
              style={[s.dayCell, isSelected && s.dayCellSelected]}
              onPress={() => selectBirthday(day)}
            >
              <Text style={[s.dayNumber, isSelected && s.dayNumberSelected]}>{day}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    ));
  };

  const renderCalendarDays = () => {
    const daysInMonth = getDaysInMonth(currentYear, currentMonth);
    const firstDay = getFirstDayOfMonth(currentYear, currentMonth);
    const cells: ReactElement[] = [];
    for (let i = 0; i < firstDay; i++) {
      cells.push(<View key={`e${i}`} style={s.dayCell} />);
    }
    for (let day = 1; day <= daysInMonth; day++) {
      const sel = isDateSelected(day);
      cells.push(
        <TouchableOpacity
          activeOpacity={1}
          key={day}
          style={[s.dayCell, sel && s.dayCellSelected]}
          onPress={() => toggleDate(day)}
        >
          <Text style={[s.dayNumber, sel && s.dayNumberSelected]}>{day}</Text>
        </TouchableOpacity>,
      );
    }
    return cells;
  };

  // ── canProceed per step ─────────────────────────────────────────────────────
  const canProceed = (): boolean => {
    switch (step) {
      case 1: return !!nickname.trim();
      case 2: return !!birthday.trim();
      case 3: return true;
      case 4: return !!cycleRegularity;
      case 5: return healthHistory.length > 0;
      case 6: return !!medicalCheckups;
      case 7: return medications.length > 0;
      case 8: return true; // calendar optional
      case 9: return true;
      case 10: return !!typicalFlow;
      case 11: return symptoms.length > 0;
      case 12: return moods.length > 0;
      case 13: return comfortFood.length > 0;
      case 14: return true;
      default: return false;
    }
  };

  // ── Step title & subtitle ───────────────────────────────────────────────────
  const stepMeta: Record<number, { title: string; subtitle?: string }> = {
    1: { title: "Welcome to Abyssal Flow!", subtitle: "What should we call you?" },
    2: { title: "Your Birthday", subtitle: "This helps us understand your cycle better." },
    3: { title: "Our Purpose", subtitle: undefined },
    4: { title: "Cycle Regularity", subtitle: "Is your period usually regular?" },
    5: { title: "Health History", subtitle: "Have you been diagnosed with any of the following?" },
    6: { title: "Medical Checkups", subtitle: "Do you see a doctor or OB-GYN regularly for your period health?" },
    7: { title: "Current Medications", subtitle: "Are you taking any of these?" },
    8: { title: "Your Recent History", subtitle: "Tap the dates of your last period. The more logs you provide, the more accurate our prediction becomes." },
    9: { title: "Cycle Length", subtitle: "On average, how many days are there from the start of one period to the start of the next?" },
    10: { title: "Typical Flow", subtitle: "How would you describe your heaviest days?" },
    11: { title: "Common Symptoms", subtitle: "What do you usually experience?" },
    12: { title: "Emotional Currents", subtitle: "How does your cycle typically impact your mood?" },
    13: { title: "Favorite Comfort Food", subtitle: "What is your go-to snack during your period?" },
    14: { title: "Predicting Your Flow...", subtitle: "We are analyzing your history and symptoms to map out your next cycle." },
  };

  const meta = stepMeta[step];

  // ── Render step body ────────────────────────────────────────────────────────
  const renderBody = () => {
    switch (step) {
      // Step 1 – Nickname
      case 1:
        return (
          <Animated.View style={[s.inputWrapper, { opacity: anim.bodyOpacity }]}>
            <TextInput
              style={s.input}
              placeholder="Enter Nickname..."
              placeholderTextColor="rgba(255, 252, 252, 0.66)"
              value={nickname}
              onChangeText={setNickname}
              autoCorrect={false}
              autoCapitalize="none"
            />
          </Animated.View>
        );

      // Step 2 – Birthday
      case 2:
        return (
          <Animated.View style={[s.birthdayPickerShell, { opacity: anim.bodyOpacity }]}> 
            <TouchableOpacity
              activeOpacity={1}
              style={s.birthdayField}
              onPress={() => setBirthdayPickerOpen((visible) => !visible)}
            >
              <Text style={[s.birthdayFieldText, !birthday && s.birthdayFieldPlaceholder]}>
                {birthday || "MM/DD/YY"}
              </Text>
              <Ionicons
                name={birthdayPickerOpen ? "chevron-up" : "chevron-down"}
                size={18}
                color="#B5D6EE"
              />
            </TouchableOpacity>

            {birthdayPickerOpen ? (
              <View style={s.birthdayCalendarCard}>
                <View style={s.calendarHeader}>
                  <TouchableOpacity
                    activeOpacity={1}
                    onPress={() => {
                      if (birthdayViewMonth === 0) {
                        setBirthdayViewMonth(11);
                        setBirthdayViewYear((year) => year - 1);
                      } else {
                        setBirthdayViewMonth((month) => month - 1);
                      }
                    }}
                    style={s.navButton}
                  >
                    <Text style={s.navArrow}>‹</Text>
                  </TouchableOpacity>
                  <Text style={s.monthLabel}>
                    {MONTHS[birthdayViewMonth]} {birthdayViewYear}
                  </Text>
                  <TouchableOpacity
                    activeOpacity={1}
                    onPress={() => {
                      if (birthdayViewMonth === 11) {
                        setBirthdayViewMonth(0);
                        setBirthdayViewYear((year) => year + 1);
                      } else {
                        setBirthdayViewMonth((month) => month + 1);
                      }
                    }}
                    style={s.navButton}
                  >
                    <Text style={s.navArrow}>›</Text>
                  </TouchableOpacity>
                </View>
                <View style={s.dayHeaders}>
                  {DAYS.map((day) => (
                    <Text key={day} style={s.dayHeader}>
                      {day}
                    </Text>
                  ))}
                </View>
                <View style={s.dayGrid}>{renderBirthdayGrid()}</View>
              </View>
            ) : null}
          </Animated.View>
        );

      // Step 3 – Purpose info
      case 3:
        return (
          <Animated.View style={{ opacity: anim.bodyOpacity }}>
            <Text style={[s.bodyText, { textAlign: "center" }]}>
              Abyssal Flow is dedicated to tracking your menstrual cycle and symptoms.
            </Text>
          </Animated.View>
        );

      // Step 4 – Cycle regularity
      case 4:
        return (
          <Animated.View style={[s.listContainer, { opacity: anim.bodyOpacity }]}>
            {CYCLE_REGULARITY.map((opt) => {
              const sel = cycleRegularity === opt.id;
              return (
                <TouchableOpacity
                  activeOpacity={1}
                  key={opt.id}
                  style={[s.cardOption, sel && s.cardOptionSelected]}
                  onPress={() => setCycleRegularity(opt.id)}
                >
                  <Text style={s.cardLabel}>{opt.label}</Text>
                  <Text style={s.cardDescription}>{opt.description}</Text>
                </TouchableOpacity>
              );
            })}
          </Animated.View>
        );

      // Step 5 – Health history (multi)
      case 5:
        return (
          <Animated.View style={[s.listContainer, { opacity: anim.bodyOpacity }]}>
            <RadioList
              options={CONDITIONS}
              selected={healthHistory}
              onSelect={(id) => toggleMulti(id, healthHistory, setHealthHistory, "none")}
              multi
            />
          </Animated.View>
        );

      // Step 6 – Medical checkups (single)
      case 6:
        return (
          <Animated.View style={[s.listContainer, { opacity: anim.bodyOpacity }]}>
            <RadioList
              options={CHECKUP_OPTIONS}
              selected={medicalCheckups ?? ""}
              onSelect={setMedicalCheckups}
            />
          </Animated.View>
        );

      // Step 7 – Medications (multi)
      case 7:
        return (
          <Animated.View style={[s.listContainer, { opacity: anim.bodyOpacity }]}>
            <RadioList
              options={MEDICATIONS}
              selected={medications}
              onSelect={(id) => toggleMulti(id, medications, setMedications, "none")}
              multi
            />
          </Animated.View>
        );

      // Step 8 – Calendar
      case 8:
        return (
          <Animated.View style={[s.calendar, { opacity: anim.bodyOpacity }]}>
            <View style={s.calendarHeader}>
              <TouchableOpacity
                activeOpacity={1}
                onPress={() => {
                  if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear((y) => y - 1); }
                  else setCurrentMonth((m) => m - 1);
                }}
                style={s.navButton}
              >
                <Text style={s.navArrow}>‹</Text>
              </TouchableOpacity>
              <Text style={s.monthLabel}>{MONTHS[currentMonth]} {currentYear}</Text>
              <TouchableOpacity
                activeOpacity={1}
                onPress={() => {
                  if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear((y) => y + 1); }
                  else setCurrentMonth((m) => m + 1);
                }}
                style={s.navButton}
              >
                <Text style={s.navArrow}>›</Text>
              </TouchableOpacity>
            </View>
            <View style={s.dayHeaders}>
              {DAYS.map((d) => <Text key={d} style={s.dayHeader}>{d}</Text>)}
            </View>
            <View style={s.dayGrid}>{renderCalendarDays()}</View>
          </Animated.View>
        );

      // Step 9 – Cycle length picker
      case 9:
        return (
          <Animated.View style={[s.cycleLengthShell, { opacity: anim.bodyOpacity }]}> 
            <View style={s.cycleLengthCard}>
              <TouchableOpacity
                activeOpacity={1}
                style={s.cycleLengthButton}
                onPress={() => setCycleLength((value) => Math.max(MIN_CYCLE_LENGTH, value - 1))}
              >
                <Ionicons name="remove" size={22} color="#EAF4FF" />
              </TouchableOpacity>

              <View style={s.cycleLengthValueWrap}>
                <Text style={s.cycleLengthValue}>{cycleLength}</Text>
                <Text style={s.cycleLengthLabel}>days</Text>
              </View>

              <TouchableOpacity
                activeOpacity={1}
                style={s.cycleLengthButton}
                onPress={() => setCycleLength((value) => Math.min(MAX_CYCLE_LENGTH, value + 1))}
              >
                <Ionicons name="add" size={22} color="#EAF4FF" />
              </TouchableOpacity>
            </View>
            <Text style={s.cycleLengthHint}>
              Tap the controls to fine-tune your average cycle length.
            </Text>
          </Animated.View>
        );

      // Step 10 – Typical flow
      case 10:
        return (
          <Animated.View style={[s.listContainer, { opacity: anim.bodyOpacity }]}>
            <RadioList
              options={FLOW_OPTIONS}
              selected={typicalFlow ?? ""}
              onSelect={setTypicalFlow}
            />
          </Animated.View>
        );

      // Step 11 – Symptoms (multi)
      case 11:
        return (
          <Animated.View style={[s.listContainer, { opacity: anim.bodyOpacity }]}>
            <RadioList
              options={SYMPTOMS}
              selected={symptoms}
              onSelect={(id) => toggleMulti(id, symptoms, setSymptoms)}
              multi
            />
          </Animated.View>
        );

      // Step 12 – Moods (multi)
      case 12:
        return (
          <Animated.View style={[s.listContainer, { opacity: anim.bodyOpacity }]}>
            <RadioList
              options={MOODS}
              selected={moods}
              onSelect={(id) => toggleMulti(id, moods, setMoods, "nochange")}
              multi
            />
          </Animated.View>
        );

      // Step 13 – Comfort food (multi)
      case 13:
        return (
          <Animated.View style={[s.listContainer, { opacity: anim.bodyOpacity }]}>
            <RadioList
              options={FOODS}
              selected={comfortFood}
              onSelect={(id) => toggleMulti(id, comfortFood, setComfortFood)}
              multi
            />
          </Animated.View>
        );

      // Step 14 – Predicting / finish
      case 14:
        return (
          <Animated.View style={[{ opacity: anim.bodyOpacity }, s.waterIconWrapper]}>
            <WaterIcon />
          </Animated.View>
        );

      default:
        return null;
    }
  };

  // ─── Step 3 disclaimer footer ─────────────────────────────────────────────
  const renderDisclaimer = () => {
    if (step !== 3) return null;
    return (
      <Text style={s.disclaimerText}>
        Disclaimer: If you are currently pregnant, please note that
        pregnancy-specific features are coming soon.
      </Text>
    );
  };

  // ─── Layout helpers ────────────────────────────────────────────────────────
  const isCentered = [3, 8, 9, 14].includes(step);
  const needsKeyboard = [1, 2].includes(step);

  const Inner = (
    <View style={styles.innerContainer}>
      {/* Content */}
      <View style={[s.content, isCentered && s.contentCentered]}>
        {/* Title */}
        <Animated.Text
          style={[
            s.title,
            isCentered && s.titleCentered,
            { opacity: anim.titleOpacity },
          ]}
        >
          {meta.title}
        </Animated.Text>

        {/* Subtitle */}
        {meta.subtitle && (
          <Animated.Text
            style={[
              s.subtitle,
              isCentered && s.subtitleCentered,
              { opacity: anim.subtitleOpacity },
            ]}
          >
            {meta.subtitle}
          </Animated.Text>
        )}

        {/* Body */}
        {renderBody()}
      </View>

      {/* Footer */}
      <Animated.View style={[s.buttonContainer, { opacity: anim.buttonOpacity }]}>
        {renderDisclaimer()}
        <TouchableOpacity
          activeOpacity={1}
          style={[s.button, !canProceed() && s.buttonDisabled]}
          onPress={() => { if (canProceed()) goNext(); }}
        >
          <Text style={s.buttonText}>{step === TOTAL_STEPS ? "Get Started" : "Next"}</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );

  return (
    <LinearGradient
      colors={["#041539", "#26466D"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={styles.gradient}
    >
      <StatusBar barStyle="light-content" />
      <WaveBackground />

      {/* Progress bar */}
      <View style={s.progressContainer}>
        <ProgressBar step={step} />
      </View>

      {/* Back button */}
      <TouchableOpacity activeOpacity={1} onPress={goBack} style={s.backButton}>
        <Ionicons name="chevron-back" size={28} color="#FFFFFF" />
      </TouchableOpacity>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        {needsKeyboard ? (
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            {Inner}
          </TouchableWithoutFeedback>
        ) : (
          Inner
        )}
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  gradient: { flex: 1 },
  scrollContainer: { flexGrow: 1 },
  innerContainer: { flex: 1, justifyContent: "space-between" },
});

const s = StyleSheet.create({
  // Progress
  progressContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 20,
    paddingTop: Platform.OS === "ios" ? 52 : 32,
    paddingHorizontal: 16,
  },
  progressTrack: {
    height: 3,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 2,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#6DB4D8",
    borderRadius: 2,
  },

  // Back button
  backButton: {
    position: "absolute",
    top: 60,
    left: 16,
    zIndex: 10,
    padding: 8,
  },

  // Content
  content: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 28,
    paddingTop: height * 0.08,
  },
  contentCentered: {
    alignItems: "center",
    paddingHorizontal: 35,
  },

  // Typography
  title: {
    fontFamily: Platform.OS === "ios" ? "Georgia" : "serif",
    fontSize: 28,
    lineHeight: 44,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 10,
  },
  titleCentered: {
    textAlign: "center",
    fontSize: 27,
    marginBottom: 16,
  },
  subtitle: {
    fontFamily: Platform.OS === "ios" ? "Georgia" : "serif",
    fontSize: 15,
    lineHeight: 22,
    letterSpacing: 0.8,
    color: "#E1F2FF",
    marginBottom: 24,
  },
  subtitleCentered: {
    textAlign: "center",
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0.5,
    marginBottom: 28,
    paddingHorizontal: 10,
  },
  bodyText: {
    fontFamily: Platform.OS === "ios" ? "Georgia" : "serif",
    fontSize: 15,
    lineHeight: 24,
    letterSpacing: 0.8,
    color: "#E1F2FF",
  },

  // Text input
  inputWrapper: {
    backgroundColor: "transparent",
    borderRadius: 28,
    paddingHorizontal: 20,
    height: 55,
    justifyContent: "center",
    borderWidth: 0.7,
    borderColor: "rgba(181,230,255,0.42)",
    shadowColor: "transparent",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  input: {
    fontFamily: Platform.OS === "ios" ? "Georgia" : "serif",
    fontSize: 15,
    color: "#FFFFFF",
  },

  // Card options (step 4)
  cardOption: {
    backgroundColor: "transparent",
    borderRadius: 24,
    padding: 16,
    borderWidth: 0.7,
    borderColor: "rgba(181,230,255,0.42)",
    marginBottom: 12,
  },
  cardOptionSelected: { borderColor: "#6DB4D8" },
  cardLabel: {
    fontFamily: Platform.OS === "ios" ? "Georgia" : "serif",
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
    marginBottom: 4,
  },
  cardDescription: {
    fontFamily: Platform.OS === "ios" ? "Georgia" : "serif",
    fontSize: 13,
    color: "#E1F2FF",
  },

  // Radio list
  listContainer: { width: "100%", gap: 10 },
  optionRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "transparent",
    borderRadius: 24,
    height: 55,
    paddingHorizontal: 14,
    borderWidth: 0.7,
    borderColor: "rgba(181,230,255,0.42)",
    marginBottom: 10,
  },
  optionRowSelected: { borderColor: "#6DB4D8" },
  radioDot: {
    width: 19,
    height: 18,
    borderRadius: 10,
    backgroundColor: "transparent",
    borderWidth: 0.7,
    borderColor: "rgba(225,242,255,0.5)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },
  radioDotSelected: { borderColor: "#6DB4D8" },
  radioDotInner: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#FFFFFF" },
  optionLabel: {
    flex: 1,
    fontFamily: Platform.OS === "ios" ? "Georgia" : "serif",
    fontSize: 15,
    fontWeight: "300",
    color: "#FFFFFF",
    textAlign: "left",
  },
  optionLabelSelected: { fontWeight: "600" },

  // Calendar
  calendar: {
    backgroundColor: "transparent",
    borderRadius: 24,
    padding: 20,
    borderWidth: 0.7,
    borderColor: "rgba(181,230,255,0.42)",
    shadowColor: "transparent",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
    width: "100%",
  },
  calendarHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  navButton: { padding: 4 },
  navArrow: { color: "#B5BEC6", fontSize: 22, fontWeight: "300", lineHeight: 22 },
  monthLabel: {
    fontFamily: Platform.OS === "ios" ? "Georgia" : "serif",
    fontSize: 14,
    fontWeight: "600",
    color: "#FFFFFF",
    letterSpacing: 0.5,
  },
  dayHeaders: { flexDirection: "row", justifyContent: "space-between", marginBottom: 10 },
  dayHeader: {
    width: 30,
    textAlign: "center",
    fontFamily: Platform.OS === "ios" ? "Georgia" : "serif",
    fontSize: 8,
    fontWeight: "600",
    letterSpacing: 1.5,
    color: "#B5BEC6",
  },
  dayGrid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", rowGap: 8 },
  dayCell: { width: 30, height: 30, borderRadius: 15, justifyContent: "center", alignItems: "center", borderWidth: 0.7, borderColor: "transparent" },
  dayCellSelected: { backgroundColor: "#ff4343" },
  dayNumber: {
    fontFamily: Platform.OS === "ios" ? "Georgia" : "serif",
    fontSize: 10,
    fontWeight: "600",
    color: "#FFFFFF",
    textAlign: "center",
  },
  dayNumberSelected: { color: "#FFFFFF" },

  birthdayPickerShell: {
    width: "100%",
  },
  birthdayField: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "transparent",
    borderRadius: 20,
    paddingHorizontal: 18,
    height: 52,
    borderWidth: 0.7,
    borderColor: "rgba(181,230,255,0.42)",
  },
  birthdayFieldText: {
    flex: 1,
    fontFamily: Platform.OS === "ios" ? "Georgia" : "serif",
    fontSize: 15,
    color: "#FFFFFF",
  },
  birthdayFieldPlaceholder: {
    color: "rgba(255, 252, 252, 0.66)",
  },
  birthdayCalendarCard: {
    marginTop: 12,
    borderRadius: 22,
    padding: 16,
    borderWidth: 0.7,
    borderColor: "rgba(181,230,255,0.34)",
    backgroundColor: "rgba(9, 28, 58, 0.58)",
  },
  dayGridRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },

  cycleLengthShell: {
    width: "100%",
    alignItems: "center",
  },
  cycleLengthCard: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 18,
    paddingHorizontal: 16,
    borderRadius: 28,
    borderWidth: 0.7,
    borderColor: "rgba(181,230,255,0.42)",
    backgroundColor: "rgba(9, 28, 58, 0.42)",
  },
  cycleLengthButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 0.7,
    borderColor: "rgba(181,230,255,0.34)",
    backgroundColor: "rgba(255,255,255,0.04)",
  },
  cycleLengthValueWrap: {
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
  },
  cycleLengthValue: {
    fontFamily: Platform.OS === "ios" ? "Georgia" : "serif",
    fontSize: 34,
    fontWeight: "700",
    color: "#FFFFFF",
    lineHeight: 40,
  },
  cycleLengthLabel: {
    fontFamily: Platform.OS === "ios" ? "Georgia" : "serif",
    fontSize: 12,
    color: "rgba(225,242,255,0.72)",
    letterSpacing: 0.6,
    marginTop: 2,
  },
  cycleLengthHint: {
    marginTop: 10,
    color: "rgba(225,242,255,0.72)",
    fontSize: 11,
    lineHeight: 16,
    textAlign: "center",
    fontFamily: Platform.OS === "ios" ? "Georgia" : "serif",
  },

  // Picker (step 9)
  pickerWrapper: {
    width: 200,
    height: ITEM_HEIGHT * VISIBLE_ITEMS,
    justifyContent: "center",
    alignItems: "center",
  },
  selectionHighlight: {
    position: "absolute",
    top: ITEM_HEIGHT * Math.floor(VISIBLE_ITEMS / 2),
    left: 0,
    right: 0,
    height: ITEM_HEIGHT,
    backgroundColor: "rgba(113,113,113,0.25)",
    borderRadius: 8,
    zIndex: 1,
  },
  flatList: { width: "100%", height: ITEM_HEIGHT * VISIBLE_ITEMS },
  flatListContent: { paddingVertical: ITEM_HEIGHT * Math.floor(VISIBLE_ITEMS / 2) },
  pickerItem: { height: ITEM_HEIGHT, justifyContent: "center", alignItems: "center" },
  pickerItemSelected: {},
  pickerItemText: {
    fontFamily: Platform.OS === "ios" ? "Georgia" : "serif",
    fontSize: 13,
    letterSpacing: 0.7,
    color: "rgba(225,242,255,0.45)",
    fontWeight: "400",
  },
  pickerItemTextSelected: { color: "#a9c6ff", fontWeight: "600", fontSize: 15 },

  // Water icon (step 14)
  waterIconWrapper: { marginBottom: 28, alignItems: "center" },
  waterIconContainer: { width: 80, height: 74, justifyContent: "center", alignItems: "center", gap: 10 },
  waveLine: { width: 80, height: 12, justifyContent: "center", alignItems: "center" },
  waveShape: { width: 80, height: 8, borderRadius: 4, backgroundColor: "#FFFFFF", opacity: 0.9 },

  // Checkmark (step 15)
  checkmark: {
    fontSize: 64,
    color: "#FFFFFF",
    marginBottom: 12,
    lineHeight: 72,
    textAlign: "center",
  },

  // Disclaimer (step 3)
  disclaimerText: {
    fontFamily: Platform.OS === "ios" ? "Georgia" : "serif",
    fontSize: 11,
    lineHeight: 18,
    color: "#6DB4D8",
    textAlign: "center",
    marginBottom: 25,
    opacity: 0.8,
    paddingHorizontal: 10,
  },

  // Button
  buttonContainer: {
    alignItems: "center",
    paddingBottom: height * 0.09,
    paddingHorizontal: 30,
  },
  button: {
    backgroundColor: "transparent",
    borderRadius: 50,
    width: 206,
    height: 47,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 0.7,
    borderColor: "rgba(181,230,255,0.55)",
    shadowColor: "transparent",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  buttonDisabled: { opacity: 0.5 },
  buttonText: {
    fontFamily: Platform.OS === "ios" ? "Georgia" : "serif",
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
    letterSpacing: 1,
  },
});