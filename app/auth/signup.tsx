import WaveBackground from "@/components/WaveBackground";
import { OceanColors } from "@/constants/theme";
import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
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

  const handleSignup = async () => {
    if (!termsAccepted) {
      alert("Please accept the Terms of Service and Privacy Policy");
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
              <TextInput
                style={styles.input}
                placeholder="Username"
                placeholderTextColor="rgba(255,255,255,0.6)"
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
                editable={!loading}
              />
            </View>

            {}
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

            {}
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

            {/* Confirm Password Input */}
            <View style={styles.inputContainer}>
              <MaterialIcons
                name="lock-outline"
                size={20}
                color={OceanColors.white}
                style={styles.inputIcon}
              />
              <TextInput
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
                    size={16}
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
    paddingVertical: 24,
    zIndex: 1,
  },
  logoSection: {
    alignItems: "center",
    justifyContent: "flex-start",
    width: "100%",
    height: 194,
    marginBottom: 8,
    position: "relative",
  },
  logoImage: {
    width: 185,
    height: 185,
    position: "absolute",
    top: 0,
  },
  brandName: {
    fontSize: 18,
    fontFamily: Platform.OS === "ios" ? "Georgia" : "serif",
    color: OceanColors.textSecondary,
    letterSpacing: 1,
    position: "absolute",
    top: 181,
  },
  heading: {
    fontSize: 32,
    fontFamily: Platform.OS === "ios" ? "Georgia" : "serif",
    color: OceanColors.white,
    marginBottom: 32,
    textAlign: "center",
    fontWeight: "700",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "transparent",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(181,230,255,0.45)",
    paddingHorizontal: 16,
    marginBottom: 16,
    height: 50,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    fontFamily: Platform.OS === "ios" ? "Georgia" : "serif",
    color: OceanColors.white,
  },
  checkboxContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 24,
    paddingHorizontal: 4,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
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
    fontSize: 12,
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
    paddingVertical: 14,
    alignItems: "center",
    alignSelf: "center",
    width: 180,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "rgba(181,230,255,0.7)",
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  signupButtonText: {
    color: OceanColors.white,
    fontSize: 16,
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
    fontSize: 14,
    fontFamily: Platform.OS === "ios" ? "Georgia" : "serif",
  },
  loginLink: {
    color: OceanColors.cyan,
    fontSize: 14,
    fontFamily: Platform.OS === "ios" ? "Georgia" : "serif",
    textDecorationLine: "underline",
  },
});
