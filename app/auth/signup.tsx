import WaveBackground from "@/components/WaveBackground";
import { OceanColors } from "@/constants/theme";
import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  Dimensions,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  TextInput as RNTextInput,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function SignupScreen() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [termsAlertVisible, setTermsAlertVisible] = useState(false);

  const { width, height } = Dimensions.get("window");

  const TinySpeck = ({ top, left, opacity }: { top: number; left: number; opacity: number }) => {
    return <View style={[styles.speck, { top, left, opacity }]} />;
  };

  const BackgroundSparkles = () => {
    const specks = useMemo(
      () => Array.from({ length: 60 }, (_, idx) => ({ id: idx, top: Math.random() * height, left: Math.random() * width, opacity: 0.25 + Math.random() * 0.45 })),
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

  const handleSignup = async () => {
    if (!termsAccepted) {
      setTermsAlertVisible(true);
      return;
    }

    if (password !== confirmPassword) {
      alert("Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      // TODO: Implement actual signup logic
      console.log("Signup:", { username, email, password });
      // After successful signup, navigate to main app
      router.push("/landing");
    } catch (error) {
      console.error("Signup error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLoginNavigation = () => {
    router.back();
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
                source={require("@/assets/images/abyssal-logo.png")}
                style={styles.logoImage}
                resizeMode="contain"
              />
              <Text style={styles.brandName}>Abyssal Flow</Text>
            </View>

            {/* Main Heading */}
            <Text style={styles.heading}>Dive in</Text>

            {/* Username Input */}
            <View style={styles.inputContainer}>
              <MaterialIcons
                name="person-outline"
                size={20}
                color={OceanColors.white}
                style={styles.inputIcon}
              />
              <RNTextInput
                style={styles.input}
                placeholder="Username"
                placeholderTextColor="rgba(255,255,255,0.6)"
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
                editable={!loading}
              />
            </View>

            
            <View style={styles.inputContainer}>
              <MaterialIcons
                name="mail-outline"
                size={20}
                color={OceanColors.white}
                style={styles.inputIcon}
              />
              <RNTextInput
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

            
            <View style={styles.inputContainer}>
              <MaterialIcons
                name="lock-outline"
                size={20}
                color={OceanColors.white}
                style={styles.inputIcon}
              />
              <RNTextInput
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

            {/* Confirm Password Input */}
            <View style={styles.inputContainer}>
              <MaterialIcons
                name="lock-outline"
                size={20}
                color={OceanColors.white}
                style={styles.inputIcon}
              />
              <RNTextInput
                style={styles.input}
                placeholder="Confirm password"
                placeholderTextColor="rgba(255,255,255,0.6)"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showConfirmPassword}
                editable={!loading}
              />
              <TouchableOpacity
                activeOpacity={1}
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                disabled={!confirmPassword}
              >
                <MaterialIcons
                  name={showConfirmPassword ? "visibility" : "visibility-off"}
                  size={20}
                  color={OceanColors.white}
                />
              </TouchableOpacity>
            </View>

            {/* Terms Checkbox */}
            <View style={styles.checkboxContainer}>
              <TouchableOpacity
                activeOpacity={1}
                style={[
                  styles.checkbox,
                  termsAccepted && styles.checkboxChecked,
                ]}
                onPress={() => setTermsAccepted(!termsAccepted)}
                disabled={loading}
              >
                {termsAccepted && (
                  <MaterialIcons
                    name="check"
                    size={14}
                    color={OceanColors.white}
                  />
                )}
              </TouchableOpacity>
              <Text style={styles.termsText}>
                By diving in, you agree to our{" "}
                <Text style={styles.termsLink}>
                  Terms of Service and Privacy Policy.
                </Text>
              </Text>
            </View>

            {/* Sign Up Button */}
            <TouchableOpacity
              activeOpacity={1}
              style={[styles.signupButton, loading && styles.buttonDisabled]}
              onPress={handleSignup}
              disabled={loading}
            >
              <Text style={styles.signupButtonText}>
                {loading ? "Signing Up..." : "Sign Up"}
              </Text>
            </TouchableOpacity>

            {/* Login Link */}
            <View style={styles.loginContainer}>
              <Text style={styles.loginText}>Already have an account? </Text>
              <TouchableOpacity activeOpacity={1} onPress={handleLoginNavigation}>
                <Text style={styles.loginLink}>Dive Back In.</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <Modal
        transparent
        visible={termsAlertVisible}
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => setTermsAlertVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Terms Required</Text>
            <Text style={styles.modalCopy}>
              Please accept the Terms of Service and Privacy Policy to continue.
            </Text>
            <TouchableOpacity
              activeOpacity={1}
              style={styles.modalButton}
              onPress={() => setTermsAlertVisible(false)}
            >
              <Text style={styles.modalButtonText}>Understood</Text>
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
    paddingTop: 28,
  },
  content: {
    paddingHorizontal: 24,
    paddingVertical: 20,
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
    width: 150,
    height: 150,
    position: "absolute",
    top: 0,
  },
  brandName: {
    fontSize: 16,
    fontFamily: Platform.OS === "ios" ? "Georgia" : "serif",
    color: OceanColors.textSecondary,
    letterSpacing: 1,
    position: "absolute",
    top: 153,
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
  checkboxContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 20,
    paddingHorizontal: 4,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 0.75,
    borderColor: OceanColors.cyan,
    borderRadius: 4,
    marginRight: 12,
    marginTop: 2,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
  },
  checkboxChecked: {
    borderColor: OceanColors.cyan,
  },
  termsText: {
    flex: 1,
    color: OceanColors.textSecondary,
    fontSize: 11,
    fontFamily: Platform.OS === "ios" ? "Georgia" : "serif",
    lineHeight: 18,
  },
  termsLink: {
    color: OceanColors.cyan,
    textDecorationLine: "underline",
  },
  signupButton: {
    backgroundColor: "transparent",
    borderRadius: 999,
    paddingVertical: 12,
    alignItems: "center",
    alignSelf: "center",
    width: 152,
    marginBottom: 20,
    borderWidth: 0.7,
    borderColor: "rgba(181,230,255,0.7)",
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  signupButtonText: {
    color: OceanColors.white,
    fontSize: 14,
    fontFamily: Platform.OS === "ios" ? "Georgia" : "serif",
    letterSpacing: 0.5,
  },
  loginContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  loginText: {
    color: OceanColors.textSecondary,
    fontSize: 12,
    fontFamily: Platform.OS === "ios" ? "Georgia" : "serif",
  },
  loginLink: {
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
