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

// Calendar icon removed - using simple text buttons instead
export default function Landing4() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [selected, setSelected] = useState(null);

  // Fade-in animations
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const titleY = useRef(new Animated.Value(24)).current;
  const subtitleOpacity = useRef(new Animated.Value(0)).current;
  const optionsOpacity = useRef(new Animated.Value(0)).current;
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
      Animated.timing(optionsOpacity, {
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

  const options = [
    {
      id: "regular",
      label: "Regular",
      description: "Happens around the same time",
    },
    {
      id: "irregular",
      label: "Irregular",
      description: "Difficult to predict",
    },
  ];

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
                  Cycle Regularity
                </Animated.Text>

                {/* Subtitle */}
                <Animated.Text
                  style={[styles.subtitle, { opacity: subtitleOpacity }]}
                >
                  Is your period usually regular?
                </Animated.Text>

                {/* Options */}
                <Animated.View
                  style={[styles.optionsContainer, { opacity: optionsOpacity }]}
                >
                  {options.map((option) => (
                    <TouchableOpacity
                      key={option.id}
                      style={[
                        styles.optionButton,
                        selected === option.id && styles.optionButtonSelected,
                      ]}
                      onPress={() => setSelected(option.id)}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.optionLabel}>{option.label}</Text>
                      <Text style={styles.optionDescription}>
                        {option.description}
                      </Text>
                    </TouchableOpacity>
                  ))}
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
                        pathname: "/landing5",
                        params: { ...params, cycleRegularity: selected },
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
  optionsContainer: {
    gap: 12,
    marginBottom: 24,
  },
  optionButton: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 16,
    borderWidth: 2,
    borderColor: "transparent",
  },
  optionButtonSelected: {
    borderColor: "#6DB4D8",
  },
  optionLabel: {
    fontFamily: Platform.OS === "ios" ? "Georgia" : "serif",
    fontSize: 16,
    fontWeight: "600",
    color: "#001242",
    marginBottom: 4,
  },
  optionDescription: {
    fontFamily: Platform.OS === "ios" ? "System" : "sans-serif",
    fontSize: 13,
    color: "rgba(0,18,66,0.7)",
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
