import { OceanColors } from "@/constants/theme";
import { MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
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
      router.replace("/landing1");
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
    <LinearGradient
      colors={["#041539", "#26466D"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={styles.gradient}
    >
      <View style={styles.blurOverlay} pointerEvents="none" />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.container}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.content}>
            {/* Logo/Brand Section */}
            <View style={styles.logoSection}>
              <View style={styles.logo}>
                <MaterialIcons
                  name="water-drop"
                  size={40}
                  color={OceanColors.cyan}
                />
              </View>
              <Text style={styles.brandName}>Abyssal Flow</Text>
            </View>

            {/* Main Heading */}
            <Text style={styles.heading}>Dive in</Text>

            {/* Username Input */}
            <View style={styles.inputContainer}>
              <MaterialIcons
                name="person-outline"
                size={20}
                color={OceanColors.inputText}
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="Username"
                placeholderTextColor="#999"
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
                color={OceanColors.inputText}
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="Email"
                placeholderTextColor="#999"
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
                color={OceanColors.inputText}
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="Password"
                placeholderTextColor="#999"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                editable={!loading}
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                disabled={!password}
              >
                <MaterialIcons
                  name={showPassword ? "visibility" : "visibility-off"}
                  size={20}
                  color={OceanColors.inputText}
                />
              </TouchableOpacity>
            </View>

            {/* Confirm Password Input */}
            <View style={styles.inputContainer}>
              <MaterialIcons
                name="lock-outline"
                size={20}
                color={OceanColors.inputText}
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="Confirm password"
                placeholderTextColor="#999"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showConfirmPassword}
                editable={!loading}
              />
              <TouchableOpacity
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                disabled={!confirmPassword}
              >
                <MaterialIcons
                  name={showConfirmPassword ? "visibility" : "visibility-off"}
                  size={20}
                  color={OceanColors.inputText}
                />
              </TouchableOpacity>
            </View>

            {/* Terms Checkbox */}
            <View style={styles.checkboxContainer}>
              <TouchableOpacity
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
              style={[styles.signupButton, loading && styles.buttonDisabled]}
              onPress={() => router.push("/landing1")}
              disabled={loading}
            >
              <Text style={styles.signupButtonText}>
                {loading ? "Signing Up..." : "Sign Up"}
              </Text>
            </TouchableOpacity>

            {/* Login Link */}
            <View style={styles.loginContainer}>
              <Text style={styles.loginText}>Already have an account? </Text>
              <TouchableOpacity onPress={handleLoginNavigation}>
                <Text style={styles.loginLink}>Dive Back In.</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  blurOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(4, 21, 57, 0.18)",
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
  },
  content: {
    paddingHorizontal: 24,
    paddingVertical: 40,
    zIndex: 1,
  },
  logoSection: {
    alignItems: "center",
    marginBottom: 40,
  },
  logo: {
    marginBottom: 12,
  },
  brandName: {
    fontSize: 18,
    fontWeight: "600",
    color: OceanColors.textSecondary,
    letterSpacing: 1,
  },
  heading: {
    fontSize: 32,
    fontWeight: "700",
    color: OceanColors.white,
    marginBottom: 32,
    textAlign: "center",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: OceanColors.inputBg,
    borderRadius: 12,
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
    color: OceanColors.inputText,
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
  },
  checkboxChecked: {
    backgroundColor: OceanColors.cyan,
    borderColor: OceanColors.cyan,
  },
  termsText: {
    flex: 1,
    color: OceanColors.textSecondary,
    fontSize: 12,
    lineHeight: 18,
  },
  termsLink: {
    color: OceanColors.cyan,
    textDecorationLine: "underline",
  },
  signupButton: {
    backgroundColor: OceanColors.buttonBg,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    marginBottom: 24,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  signupButtonText: {
    color: OceanColors.buttonText,
    fontSize: 16,
    fontWeight: "700",
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
  },
  loginLink: {
    color: OceanColors.cyan,
    fontSize: 14,
    fontWeight: "600",
    textDecorationLine: "underline",
  },
});
