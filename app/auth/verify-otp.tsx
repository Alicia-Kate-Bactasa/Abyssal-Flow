import WaveBackground from "@/components/WaveBackground";
import { OceanColors } from "@/constants/theme";
import { supabaseClient } from "@/lib/supabase";
import { MaterialIcons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  TextInput as RNTextInput,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Alert,
} from "react-native";

export default function VerifyOtpScreen() {
  const { email } = useLocalSearchParams<{ email: string }>();
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const { width, height } = Dimensions.get("window");

  const TinySpeck = ({
    top,
    left,
    opacity,
  }: {
    top: number;
    left: number;
    opacity: number;
  }) => <View style={[styles.speck, { top, left, opacity }]} />;

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

  const handleVerify = async () => {
    if (otp.length !== 8)
      return Alert.alert("Wait!", "Please enter the 6-digit code.");

    setLoading(true);
    const { error } = await supabaseClient.auth.verifyOtp({
      email,
      token: otp,
      type: "signup",
    });
    setLoading(false);

    if (error) return Alert.alert("Verification failed", error.message);

    // Success! Send them to the onboarding landing page
    router.replace("/landing");
  };

  const handleResend = async () => {
    await supabaseClient.auth.resend({ type: "signup", email });
    Alert.alert("Sent!", "A new code is swimming to your inbox.");
  };

  return (
    <View style={styles.container}>
      <WaveBackground />
      <BackgroundSparkles />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.container}
      >
        <View style={styles.content}>
          <Text style={styles.heading}>Check your inbox</Text>
          <Text style={styles.subtext}>
            We sent an 8-digit code to{"\n"}
            <Text style={{ color: OceanColors.cyan }}>
              {email || "your email"}
            </Text>
          </Text>

          <View style={styles.inputContainer}>
            <MaterialIcons
              name="dialpad"
              size={20}
              color={OceanColors.white}
              style={styles.inputIcon}
            />
            <RNTextInput
              style={styles.input}
              placeholder="000000"
              placeholderTextColor="rgba(255,255,255,0.6)"
              value={otp}
              onChangeText={setOtp}
              keyboardType="number-pad"
              maxLength={6}
              editable={!loading}
            />
          </View>

          <TouchableOpacity
            activeOpacity={1}
            style={[styles.verifyButton, loading && styles.buttonDisabled]}
            onPress={handleVerify}
            disabled={loading}
          >
            <Text style={styles.verifyButtonText}>
              {loading ? "Verifying..." : "Verify Code"}
            </Text>
          </TouchableOpacity>

          <View style={styles.resendContainer}>
            <Text style={styles.resendText}>Didn't get the code? </Text>
            <TouchableOpacity activeOpacity={1} onPress={handleResend}>
              <Text style={styles.resendLink}>Resend.</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: "center",
    zIndex: 1,
  },
  speck: {
    position: "absolute",
    width: 1,
    height: 1,
    borderRadius: 0.5,
    backgroundColor: "rgba(255,255,255,0.92)",
    shadowColor: "rgba(255,255,255,0.9)",
    shadowRadius: 10,
    shadowOpacity: 1,
  },
  heading: {
    fontSize: 28,
    fontFamily: Platform.OS === "ios" ? "Georgia" : "serif",
    color: OceanColors.white,
    marginBottom: 12,
    textAlign: "center",
    fontWeight: "700",
  },
  subtext: {
    fontSize: 14,
    fontFamily: Platform.OS === "ios" ? "Georgia" : "serif",
    color: OceanColors.textSecondary,
    marginBottom: 32,
    textAlign: "center",
    lineHeight: 22,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "transparent",
    borderRadius: 20,
    borderWidth: 0.7,
    borderColor: "rgba(181,230,255,0.45)",
    paddingHorizontal: 14,
    marginBottom: 24,
    height: 52,
  },
  inputIcon: { marginRight: 12 },
  input: {
    flex: 1,
    fontSize: 20,
    fontFamily: Platform.OS === "ios" ? "Georgia" : "serif",
    color: OceanColors.white,
    letterSpacing: 4,
  },
  verifyButton: {
    backgroundColor: "transparent",
    borderRadius: 999,
    paddingVertical: 12,
    alignItems: "center",
    alignSelf: "center",
    width: 152,
    marginBottom: 24,
    borderWidth: 0.7,
    borderColor: "rgba(181,230,255,0.7)",
  },
  buttonDisabled: { opacity: 0.5 },
  verifyButtonText: {
    color: OceanColors.white,
    fontSize: 14,
    fontFamily: Platform.OS === "ios" ? "Georgia" : "serif",
    letterSpacing: 0.5,
  },
  resendContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  resendText: {
    color: OceanColors.textSecondary,
    fontSize: 12,
    fontFamily: Platform.OS === "ios" ? "Georgia" : "serif",
  },
  resendLink: {
    color: OceanColors.cyan,
    fontSize: 12,
    fontFamily: Platform.OS === "ios" ? "Georgia" : "serif",
    textDecorationLine: "underline",
  },
});
