import { useRouter, useLocalSearchParams } from "expo-router";
import React, { useRef, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Animated,
  StatusBar,
  Platform,
} from "react-native";
import WaveBackground from "@/components/WaveBackground";

const { height, width } = Dimensions.get("window");

// Animated water waves icon
const WaterIcon = () => {
  const wave1 = useRef(new Animated.Value(0)).current;
  const wave2 = useRef(new Animated.Value(0)).current;
  const wave3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animateWave = (anim, delay) =>
      Animated.loop(
        Animated.sequence([
          Animated.timing(anim, { toValue: 6, duration: 800, delay, useNativeDriver: true }),
          Animated.timing(anim, { toValue: 0, duration: 800, useNativeDriver: true }),
        ])
      );

    animateWave(wave1, 0).start();
    animateWave(wave2, 200).start();
    animateWave(wave3, 400).start();
  }, []);

  return (
    <View style={styles.waterIconContainer}>
      {[wave1, wave2, wave3].map((anim, i) => (
        <Animated.View
          key={i}
          style={[styles.waveLine, { transform: [{ translateY: anim }] }]}
        >
          {/* Wave shape using border radius */}
          <View style={styles.waveShape} />
        </Animated.View>
      ))}
    </View>
  );
};

export default function Landing14() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const titleOpacity = useRef(new Animated.Value(0)).current;
  const titleY = useRef(new Animated.Value(24)).current;
  const subtitleOpacity = useRef(new Animated.Value(0)).current;
  const iconOpacity = useRef(new Animated.Value(0)).current;
  const buttonOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.stagger(150, [
      Animated.timing(iconOpacity, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.parallel([
        Animated.timing(titleOpacity, { toValue: 1, duration: 600, useNativeDriver: true }),
        Animated.timing(titleY, { toValue: 0, duration: 600, useNativeDriver: true }),
      ]),
      Animated.timing(subtitleOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.timing(buttonOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <View style={styles.gradient}>
      <StatusBar barStyle="light-content" />

      {/* ── Background ── */}
      <WaveBackground />

      <View style={styles.innerContainer}>

        {/* ── Content ── */}
        <View style={styles.content}>

          {/* Water icon */}
          <Animated.View style={[styles.iconWrapper, { opacity: iconOpacity }]}>
            <WaterIcon />
          </Animated.View>

          {/* Title */}
          <Animated.Text
            style={[styles.title, { opacity: titleOpacity, transform: [{ translateY: titleY }] }]}
          >
            Predicting Your Flow...
          </Animated.Text>

          {/* Subtitle */}
          <Animated.Text style={[styles.subtitle, { opacity: subtitleOpacity }]}>
            We are analyzing your history and symptoms to map out your next cycle.
          </Animated.Text>

        </View>

        {/* ── Next Button ── */}
        <Animated.View style={[styles.buttonContainer, { opacity: buttonOpacity }]}>
          <TouchableOpacity
            style={styles.button}
            onPress={() => {
              router.push({ pathname: "/landing15", params });
            }}
            activeOpacity={0.8}
          >
            <Text style={styles.buttonText}>Next</Text>
          </TouchableOpacity>
        </Animated.View>

      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  innerContainer: {
    flex: 1,
    justifyContent: "space-between",
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 28,
    paddingTop: height * 0.08,
  },

  // Water icon
  iconWrapper: {
    marginBottom: 28,
  },
  waterIconContainer: {
    width: 80,
    height: 74,
    justifyContent: "center",
    alignItems: "center",
    gap: 10,
  },
  waveLine: {
    width: 80,
    height: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  waveShape: {
    width: 80,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#FFFFFF",
    opacity: 0.9,
  },

  // Text
  title: {
    fontFamily: Platform.OS === "ios" ? "Georgia" : "serif",
    fontSize: 27,
    lineHeight: 44,
    fontWeight: "700",
    color: "#FFFFFF",
    textAlign: "center",
    marginBottom: 16,
  },
  subtitle: {
    fontFamily: Platform.OS === "ios" ? "Courier New" : "monospace",
    fontSize: 15,
    lineHeight: 20,
    letterSpacing: 0.7,
    color: "#E1F2FF",
    textAlign: "center",
    paddingHorizontal: 20,
  },

  // Button
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
  buttonText: {
    fontFamily: Platform.OS === "ios" ? "Georgia" : "serif",
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
    letterSpacing: 1,
  },
});