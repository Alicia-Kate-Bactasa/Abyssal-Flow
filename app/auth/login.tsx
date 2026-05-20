import WaveBackground from "@/components/WaveBackground";
import { OceanColors } from "@/constants/theme";
import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setLoading(true);
    try {
      // TODO: Implement actual login logic
      console.log('Login:', { email, password });
      // After successful login, navigate to main app
      router.replace('/dashboard');
    } catch (error) {
      console.error('Login error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSignupNavigation = () => {
    router.push('/auth/signup');
  };

  return (
    <View style={styles.container}>
      <WaveBackground />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardContainer}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
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
          <Text style={styles.heading}>Return to the Deep</Text>

          {/* Email Input */}
          <View style={styles.inputContainer}>
            <MaterialIcons name="mail-outline" size={20} color={OceanColors.white} style={styles.inputIcon} />
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
            <MaterialIcons name="lock-outline" size={20} color={OceanColors.white} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Password"
              placeholderTextColor="rgba(255,255,255,0.6)"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              editable={!loading}
            />
            <TouchableOpacity activeOpacity={1} onPress={() => setShowPassword(!showPassword)} disabled={!password}>
              <MaterialIcons
                name={showPassword ? 'visibility' : 'visibility-off'}
                size={20}
                color={OceanColors.white}
              />
            </TouchableOpacity>
          </View>

          {/* Forgot Password Link */}
          <TouchableOpacity activeOpacity={1} style={styles.forgotPasswordContainer}>
            <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
          </TouchableOpacity>

          {/* Login Button */}
          <TouchableOpacity
            activeOpacity={1}
            style={[styles.loginButton, loading && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={loading}
          >
            <Text style={styles.loginButtonText}>{loading ? 'Logging In...' : 'Log In'}</Text>
          </TouchableOpacity>

          {/* Sign Up Link */}
          <View style={styles.signupContainer}>
            <Text style={styles.signupText}>New to the depths? </Text>
            <TouchableOpacity activeOpacity={1} onPress={handleSignupNavigation}>
              <Text style={styles.signupLink}>Start Your Journey.</Text>
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
    justifyContent: 'flex-start',
    paddingTop: 28,
  },
  content: {
    paddingHorizontal: 24,
    paddingVertical: 24,
    zIndex: 1,
  },
  logoSection: {
    alignItems: 'center',
    justifyContent: 'flex-start',
    width: '100%',
    height: 194,
    marginBottom: 8,
    position: 'relative',
  },
  logoImage: {
    width: 185,
    height: 185,
    position: 'absolute',
    top: 0,
  },
  brandName: {
    fontSize: 18,
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    color: OceanColors.textSecondary,
    letterSpacing: 1,
    position: 'absolute',
    top: 181,
  },
  heading: {
    fontSize: 32,
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    color: OceanColors.white,
    marginBottom: 32,
    textAlign: 'center',
    fontWeight: '700',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'transparent',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(181,230,255,0.45)',
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
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    color: OceanColors.white,
  },
  forgotPasswordContainer: {
    alignItems: 'flex-end',
    marginBottom: 24,
  },
  forgotPasswordText: {
    color: OceanColors.textSecondary,
    fontSize: 13,
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    textDecorationLine: 'underline',
  },
  loginButton: {
    backgroundColor: 'transparent',
    borderRadius: 999,
    paddingVertical: 14,
    alignItems: 'center',
    alignSelf: 'center',
    width: 180,
    marginBottom: 40,
    borderWidth: 1,
    borderColor: 'rgba(181,230,255,0.7)',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  loginButtonText: {
    color: OceanColors.white,
    fontSize: 16,
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    letterSpacing: 0.5,
  },
  signupContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  signupText: {
    color: OceanColors.textSecondary,
    fontSize: 14,
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },
  signupLink: {
    color: OceanColors.cyan,
    fontSize: 14,
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    textDecorationLine: 'underline',
  },
});
