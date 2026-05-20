import WaveBackground from "@/components/WaveBackground";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter, usePathname } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
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

const OPTIONS = [
  { id: "light", label: "Light (Spotting or minimal)" },
  { id: "medium", label: "Medium (Steady)" },
  { id: "heavy", label: "Heavy (Frequent changes needed)" },
];

export default function Landing10() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useLocalSearchParams();
  const [selected, setSelected] = useState(null);

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
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <Ionicons name="chevron-back" size={28} color="#FFFFFF" />
          </TouchableOpacity>
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
                  Typical Flow
                </Animated.Text>

                {/* Subtitle */}
                <Animated.Text
                  style={[styles.subtitle, { opacity: subtitleOpacity }]}
                >
                  How would you describe your heaviest days?
                </Animated.Text>

                {/* Options */}
                <Animated.View
                  style={[styles.listContainer, { opacity: listOpacity }]}
                >
                  {OPTIONS.map((option) => {
                    const isSelected = selected === option.id;
                    return (
                      <TouchableOpacity
                        key={option.id}
                        style={[
                          styles.optionRow,
                          isSelected && styles.optionRowSelected,
                        ]}
                        onPress={() => setSelected(option.id)}
                        activeOpacity={0.8}
                      >
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
                          {option.label}
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
                  style={[styles.button, !selected && styles.buttonDisabled]}
                  onPress={() => {
                    if (selected) {
                      router.push({
                        pathname: "/landing11",
                        params: { ...params, typicalFlow: selected },
                      });
                    }
                  }}
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
    fontSize: 15,
    lineHeight: 20,
    letterSpacing: 0.7,
    color: "#E1F2FF",
    textAlign: "center",
    marginBottom: 28,
    paddingHorizontal: 10,
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
    height: 55,
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
    textAlign: "left",
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
