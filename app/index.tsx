import React from "react";
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  Image,
} from "react-native";
import { Link } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import Svg, {
  Path,
  Defs,
  LinearGradient as SvgLinearGradient,
  Stop,
} from "react-native-svg";

const STARS = [
  { top: 60, left: 28, size: 14, opacity: 0.9, rotate: "10deg" },
  { top: 110, left: 48, size: 8, opacity: 0.7, rotate: "0deg" },
  { top: 40, left: 220, size: 10, opacity: 0.85, rotate: "-8deg" },
  { top: 180, left: 300, size: 12, opacity: 0.6, rotate: "5deg" },
  { top: 140, left: 80, size: 6, opacity: 0.6, rotate: "0deg" },
];

const WaveBackground = () => {
  const { width, height } = Dimensions.get("window");

  return (
    <Svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      style={StyleSheet.absoluteFill}
    >
      <Defs>
        <SvgLinearGradient id="waveGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <Stop offset="0%" stopColor="#0a1929" stopOpacity="1" />
          <Stop offset="40%" stopColor="#1a4d6d" stopOpacity="1" />
          <Stop offset="70%" stopColor="#2a6b8d" stopOpacity="1" />
          <Stop offset="100%" stopColor="#4a9bb8" stopOpacity="1" />
        </SvgLinearGradient>
      </Defs>

      {/* Background */}
      <Path
        d={`M 0,${height * 0.3} Q ${width * 0.25},${height * 0.25} ${width * 0.5},${height * 0.3} T ${width},${height * 0.3} L ${width},${height} L 0,${height} Z`}
        fill="url(#waveGradient)"
      />

      {/* First wave layer */}
      <Path
        d={`M 0,${height * 0.4} Q ${width * 0.25},${height * 0.35} ${width * 0.5},${height * 0.4} T ${width},${height * 0.4} L ${width},${height} L 0,${height} Z`}
        fill="#1a5a7d"
        opacity="0.6"
      />

      {/* Second wave layer */}
      <Path
        d={`M 0,${height * 0.5} Q ${width * 0.25},${height * 0.45} ${width * 0.5},${height * 0.5} T ${width},${height * 0.5} L ${width},${height} L 0,${height} Z`}
        fill="#2a7a9d"
        opacity="0.4"
      />
    </Svg>
  );
};

export default function LoginPage() {
  return (
    <View style={styles.gradient}>
      <WaveBackground />
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        {/* Decorative stars */}
        {STARS.map((s, i) => (
          <Text
            key={i}
            style={[
              styles.star,
              {
                top: s.top,
                left: s.left,
                fontSize: s.size,
                opacity: s.opacity,
                transform: [{ rotate: s.rotate }],
              },
            ]}
          >
            ✦
          </Text>
        ))}

        <View style={styles.logoContainer}>
          <Image
            source={require("../assets/images/abyssal-logo.png")}
            style={styles.logo}
            resizeMode="contain" // This ensures your logo doesn't get stretched!
          />
          <Text style={styles.logoText}>Abyssal Flow</Text>
        </View>

        <View style={styles.formContainer}>
          <Text style={styles.title}>Return to the Deep</Text>

          {/* Email Text Box */}
          <View style={styles.inputWrapper}>
            <Ionicons
              name="mail-outline"
              size={20}
              color="#4A5568"
              style={styles.icon}
            />
            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor="#A0AEC0"
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          {/* Password Text Box */}
          <View style={styles.inputWrapper}>
            <Ionicons
              name="lock-closed-outline"
              size={20}
              color="#4A5568"
              style={styles.icon}
            />
            <TextInput
              style={styles.input}
              placeholder="Password"
              placeholderTextColor="#A0AEC0"
              secureTextEntry
            />
          </View>

          {/* Forgot Password Link */}
          <TouchableOpacity style={styles.forgotWrapper}>
            <Text style={styles.forgotText}>Forgot Password?</Text>
          </TouchableOpacity>

          {/* Log In Button */}
          <TouchableOpacity style={styles.loginButton}>
            <Text style={styles.loginButtonText}>Log In</Text>
          </TouchableOpacity>
        </View>

        {/* Bottom Footer Link */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>New to the depths? </Text>
          <Link href="/register" asChild>
            <TouchableOpacity>
              <Text style={styles.footerLink}>Start Your Journey.</Text>
            </TouchableOpacity>
          </Link>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  container: {
    flex: 1,
    justifyContent: "space-between",
  },
  star: {
    position: "absolute",
    color: "#ffffff",
    textShadowColor: "rgba(255,255,255,0.12)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 6,
  },

  logoContainer: {
    height: 220,
    marginTop: 40, // Adjust this up or down to move the logo
    alignItems: "center", // Centers the logo horizontally
    justifyContent: "flex-start",
    flexDirection: "column",
  },
  logo: {
    width: 400, // Change this to make the logo wider/thinner
    height: 310, // Change this to make the logo taller/shorter
  },
  logoText: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginTop: -125,
    textAlign: "center",
    marginLeft: 12,
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
    letterSpacing: 2,
  },

  formContainer: {
    paddingHorizontal: 30,
    width: "100%",
    marginTop: 0, // Pull the form up a bit to overlap with the logo
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 30,
    textAlign: "center",
    fontFamily: Platform.OS === "ios" ? "Iowan Old Style" : "serif",
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 25,
    marginBottom: 20,
    paddingHorizontal: 15,
    height: 55,
  },
  icon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: "#0A192F",
    height: "100%",
  },
  forgotWrapper: {
    alignItems: "center",
    marginBottom: 30,
  },
  forgotText: {
    color: "#8EADC8",
    fontSize: 14,
    textDecorationLine: "underline",
  },
  loginButton: {
    backgroundColor: "#0B1B3D",
    borderRadius: 25,
    height: 55,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
  },
  loginButtonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "bold",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingBottom: 100,
  },
  footerText: {
    color: "#FFFFFF",
    fontSize: 14,
  },
  footerLink: {
    color: "#8EADC8",
    fontSize: 14,
    textDecorationLine: "underline",
  },
});
