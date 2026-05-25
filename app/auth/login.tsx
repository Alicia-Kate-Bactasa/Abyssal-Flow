import WaveBackground from "@/components/WaveBackground";
import { OceanColors } from "@/constants/theme";
import { supabaseClient } from "@/lib/supabase";
import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  Dimensions,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [forgotPasswordVisible, setForgotPasswordVisible] = useState(false);

  const { width, height } = Dimensions.get("window");

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
    const specks = useMemo(
      () =>
        Array.from({ length: 60 }, (_, idx) => ({
          id: idx,
          top: Math.random() * height,
          left: Math.random() * width,
          opacity: 0.25 + Math.random() * 0.45,
        })),
      [],
    );

    return (
      <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
        {specks.map((s) => (
          <TinySpeck key={s.id} top={s.top} left={s.left} opacity={s.opacity} />
        ))}
      </View>
    );
  };

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      alert("Please enter both email and password");
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabaseClient.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (error) {
        alert(`Login failed: ${error.message}`);
        return;
      }
      router.replace("/dashboard");
    } catch (err) {
      console.error("Login error:", err);
      alert("Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSignupNavigation = () => {
    router.push("/auth/signup");
  };

  const handleForgotPassword = () => {
    setForgotPasswordVisible(false);
  };

  return (
    <View style={styles.container}>
      <WaveBackground />
      <BackgroundSparkles />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardContainer}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.content}>
            {/* Logo/Brand Section */}
            <View style={styles.logoSection}>
              <Image
                source={require("@/assets/images/finalestLogo.png")}
                style={styles.logoImage}
                resizeMode="contain"
              />
            </View>

            {/* Main Heading */}
            <Text style={styles.heading}>Return to the Deep</Text>

            {/* Email Input */}
            <View style={styles.inputContainer}>
              <MaterialIcons
                name="mail-outline"
                size={20}
                color={OceanColors.white}
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="Email"
                placeholderTextColor="rgba(255,255,255,0.6)"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                editable={!loading}
              />
            </View>

            {/* Password Input */}
            <View style={styles.inputContainer}>
              <MaterialIcons
                name="lock-outline"
                size={20}
                color={OceanColors.white}
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="Password"
                placeholderTextColor="rgba(255,255,255,0.6)"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                editable={!loading}
              />
              <TouchableOpacity
                activeOpacity={1}
                onPress={() => setShowPassword(!showPassword)}
                disabled={!password}
              >
                <MaterialIcons
                  name={showPassword ? "visibility" : "visibility-off"}
                  size={20}
                  color={OceanColors.white}
                />
              </TouchableOpacity>
            </View>

            {/* Forgot Password Link */}

            {/* Login Button */}
            <TouchableOpacity
              activeOpacity={1}
              style={[
                styles.loginButton,
                (loading || !email.trim() || !password) &&
                  styles.buttonDisabled,
              ]}
              onPress={handleLogin}
              disabled={loading || !email.trim() || !password}
            >
              <Text style={styles.loginButtonText}>
                {loading ? "Logging In..." : "Log In"}
              </Text>
            </TouchableOpacity>

            {/* Sign Up Link */}
            <View style={styles.signupContainer}>
              <Text style={styles.signupText}>New to the depths? </Text>
              <TouchableOpacity
                activeOpacity={1}
                onPress={handleSignupNavigation}
              >
                <Text style={styles.signupLink}>Start Your Journey.</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <Modal
        transparent
        visible={forgotPasswordVisible}
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => setForgotPasswordVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Reset Password</Text>
            <Text style={styles.modalCopy}>
              Enter your email and we will send a recovery link.
            </Text>
            <TouchableOpacity
              activeOpacity={1}
              style={styles.modalButton}
              onPress={() => setForgotPasswordVisible(false)}
            >
              <Text style={styles.modalButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardContainer: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "flex-start",
    paddingTop: 44,
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 36,
    paddingBottom: 24,
    zIndex: 1,
  },
  logoSection: {
    alignItems: "center",
    justifyContent: "flex-start",
    width: "100%",
    height: 160,
    marginBottom: 8,
    position: "relative",
  },
  logoImage: {
    width: 176,
    height: 176,
    position: "absolute",
    top: -4,
  },
  speck: {
    position: "absolute",
    width: 1,
    height: 1,
    borderRadius: 0.5,
    backgroundColor: "rgba(255,255,255,0.92)",
    shadowColor: "rgba(255,255,255,0.9)",
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 10,
    shadowOpacity: 1,
    elevation: 1,
  },
  heading: {
    fontSize: 28,
    fontFamily: Platform.OS === "ios" ? "Georgia" : "serif",
    color: OceanColors.white,
    marginBottom: 24,
    textAlign: "center",
    fontWeight: "700",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "transparent",
    borderRadius: 20,
    borderWidth: 0.7,
    borderColor: "rgba(181,230,255,0.45)",
    paddingHorizontal: 14,
    marginBottom: 14,
    height: 46,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 15,
    fontFamily: Platform.OS === "ios" ? "Georgia" : "serif",
    color: OceanColors.white,
  },
  forgotPasswordContainer: {
    alignItems: "flex-end",
    marginBottom: 20,
  },
  forgotPasswordText: {
    color: OceanColors.textSecondary,
    fontSize: 12,
    fontFamily: Platform.OS === "ios" ? "Georgia" : "serif",
    textDecorationLine: "underline",
  },
  loginButton: {
    backgroundColor: "transparent",
    borderRadius: 999,
    paddingVertical: 12,
    alignItems: "center",
    alignSelf: "center",
    width: 152,
    marginBottom: 28,
    borderWidth: 0.7,
    borderColor: "rgba(181,230,255,0.7)",
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  loginButtonText: {
    color: OceanColors.white,
    fontSize: 14,
    fontFamily: Platform.OS === "ios" ? "Georgia" : "serif",
    letterSpacing: 0.5,
  },
  signupContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  signupText: {
    color: OceanColors.textSecondary,
    fontSize: 12,
    fontFamily: Platform.OS === "ios" ? "Georgia" : "serif",
  },
  signupLink: {
    color: OceanColors.cyan,
    fontSize: 12,
    fontFamily: Platform.OS === "ios" ? "Georgia" : "serif",
    textDecorationLine: "underline",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(6, 12, 28, 0.86)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 22,
  },
  modalCard: {
    width: "100%",
    maxWidth: 320,
    borderRadius: 24,
    borderWidth: 0.7,
    borderColor: "rgba(181,230,255,0.34)",
    backgroundColor: "rgba(4, 18, 43, 0.96)",
    paddingHorizontal: 18,
    paddingVertical: 18,
  },
  modalTitle: {
    color: OceanColors.white,
    fontSize: 18,
    fontFamily: Platform.OS === "ios" ? "Georgia" : "serif",
    marginBottom: 10,
  },
  modalCopy: {
    color: OceanColors.textSecondary,
    fontSize: 12,
    lineHeight: 18,
    fontFamily: Platform.OS === "ios" ? "Georgia" : "serif",
    marginBottom: 16,
  },
  modalButton: {
    alignSelf: "flex-end",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 0.7,
    borderColor: "rgba(181,230,255,0.45)",
  },
  modalButtonText: {
    color: OceanColors.white,
    fontSize: 12,
    fontFamily: Platform.OS === "ios" ? "Georgia" : "serif",
  },
});
