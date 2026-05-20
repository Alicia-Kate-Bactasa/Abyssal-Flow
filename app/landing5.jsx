import WaveBackground from "@/components/WaveBackground";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
    Animated,
    Dimensions,
    Keyboard,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View,
} from "react-native";

const { height } = Dimensions.get("window");

const CONDITIONS = [
  { id: "pcos", label: "PCOS" },
  { id: "endometriosis", label: "Endometriosis" },
  { id: "fibroids", label: "Uterine Fibroids" },
  { id: "thyroid", label: "Thyroid Disorder" },
  { id: "none", label: "None of the above" },
];

export default function Landing5() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [selected, setSelected] = useState([]);

  // Fade-in animations
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const titleY = useRef(new Animated.Value(24)).current;
  const subtitleOpacity = useRef(new Animated.Value(0)).current;
  const listOpacity = useRef(new Animated.Value(0)).current;
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
      Animated.timing(listOpacity, {
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

  const handleSelect = (id) => {
    if (id === "none") {
      // If "None of the above" is selected, deselect everything else
      setSelected(["none"]);
      return;
    }
    setSelected((prev) => {
      // Remove "none" if another option is picked
      const withoutNone = prev.filter((i) => i !== "none");
      if (withoutNone.includes(id)) {
        return withoutNone.filter((i) => i !== id);
      }
      return [...withoutNone, id];
    });
  };

  const handleNext = () => {
    if (selected.length > 0) {
      router.push({
        pathname: "/landing6",
        params: { ...params, healthHistory: selected },
      });
    }
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

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={styles.innerContainer}>
              {/* ── Content ── */}
              <View style={styles.content}>
                {/* Title */}
                <Animated.Text
                  style={[
                    styles.title,
                    {
                      opacity: titleOpacity,
                      transform: [{ translateY: titleY }],
                    },
                  ]}
                >
                  Health History
                </Animated.Text>

                {/* Subtitle */}
                <Animated.Text
                  style={[styles.subtitle, { opacity: subtitleOpacity }]}
                >
                  Have you been diagnosed with any of the following?
                </Animated.Text>

                {/* Options list */}
                <Animated.View
                  style={[styles.listContainer, { opacity: listOpacity }]}
                >
                  {CONDITIONS.map((condition) => {
                    const isSelected = selected.includes(condition.id);
                    return (
                      <TouchableOpacity
                        key={condition.id}
                        style={[
                          styles.optionRow,
                          isSelected && styles.optionRowSelected,
                        ]}
                        onPress={() => handleSelect(condition.id)}
                        activeOpacity={0.8}
                      >
                        {/* Radio dot */}
                        <View
                          style={[
                            styles.radioDot,
                            isSelected && styles.radioDotSelected,
                          ]}
                        >
                          {isSelected && <View style={styles.radioDotInner} />}
                        </View>
                        <Text
                          style={[
                            styles.optionLabel,
                            isSelected && styles.optionLabelSelected,
                          ]}
                        >
                          {condition.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </Animated.View>
              </View>

              {/* ── Next Button ── */}
              <Animated.View
                style={[styles.buttonContainer, { opacity: buttonOpacity }]}
              >
                <TouchableOpacity
                  style={[
                    styles.button,
                    selected.length === 0 && styles.buttonDisabled,
                  ]}
                  onPress={handleNext}
                  activeOpacity={0.8}
                >
                  <Text style={styles.buttonText}>Next</Text>
                </TouchableOpacity>
              </Animated.View>
            </View>
          </TouchableWithoutFeedback>
        </ScrollView>
      </KeyboardAvoidingView>
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
  content: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 28,
    paddingTop: height * 0.08,
  },
  title: {
    fontFamily: Platform.OS === "ios" ? "Georgia" : "serif",
    fontSize: 28,
    lineHeight: 44,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 10,
  },
  subtitle: {
    fontFamily: Platform.OS === "ios" ? "Courier New" : "monospace",
    fontSize: 15,
    lineHeight: 22,
    letterSpacing: 0.8,
    color: "#E1F2FF",
    marginBottom: 24,
  },
  listContainer: {
    width: "100%",
    gap: 10,
  },
  optionRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    height: 55, // Increased height slightly to match the text boxes from other pages
    paddingHorizontal: 14,
    borderWidth: 2,
    borderColor: "transparent",
    marginBottom: 10,
  },
  optionRowSelected: {
    borderColor: "#6DB4D8",
  },
  radioDot: {
    width: 19,
    height: 18,
    borderRadius: 10,
    backgroundColor: "#001242",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },
  radioDotSelected: {
    backgroundColor: "#1A5FA8",
  },
  radioDotInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#FFFFFF",
  },
  optionLabel: {
    flex: 1,
    fontFamily: Platform.OS === "ios" ? "Georgia" : "serif",
    fontSize: 15,
    fontWeight: "300",
    color: "#001242",
    textAlign: "left", // Looks better aligned to the left next to the radio button
  },
  optionLabelSelected: {
    fontWeight: "600",
  },
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
