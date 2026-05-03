import { router } from 'expo-router';
import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Animated,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';

const { width, height } = Dimensions.get('window');

// Simple sparkle SVG-like component using Views
const Sparkle = ({ style, size = 'large' }) => {
  const opacity = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const twinkle = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 800 + Math.random() * 700,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.2,
          duration: 800 + Math.random() * 700,
          useNativeDriver: true,
        }),
      ])
    );
    twinkle.start();
    return () => twinkle.stop();
  }, []);

  const s = size === 'large' ? 18 : 11;

  return (
    <Animated.View style={[styles.sparkleContainer, style, { opacity, width: s * 2, height: s * 2 }]}>
      {/* Horizontal bar */}
      <View style={[styles.sparkleBar, { width: s * 2, height: 2, top: s - 1, left: 0 }]} />
      {/* Vertical bar */}
      <View style={[styles.sparkleBar, { width: 2, height: s * 2, top: 0, left: s - 1 }]} />
      {/* Diagonal 1 */}
      <View
        style={[
          styles.sparkleBar,
          {
            width: s * 1.2,
            height: 1.5,
            top: s - 0.75,
            left: s * 0.4,
            transform: [{ rotate: '45deg' }],
          },
        ]}
      />
      {/* Diagonal 2 */}
      <View
        style={[
          styles.sparkleBar,
          {
            width: s * 1.2,
            height: 1.5,
            top: s - 0.75,
            left: s * 0.4,
            transform: [{ rotate: '-45deg' }],
          },
        ]}
      />
    </Animated.View>
  );
};

export default function LandingScreen({ navigation }) {
  const [nickname, setNickname] = useState('');

  // Fade-in animations
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const titleY = useRef(new Animated.Value(24)).current;
  const subtitleOpacity = useRef(new Animated.Value(0)).current;
  const inputOpacity = useRef(new Animated.Value(0)).current;
  const buttonOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.stagger(150, [
      Animated.parallel([
        Animated.timing(titleOpacity, { toValue: 1, duration: 600, useNativeDriver: true }),
        Animated.timing(titleY, { toValue: 0, duration: 600, useNativeDriver: true }),
      ]),
      Animated.timing(subtitleOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.timing(inputOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.timing(buttonOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
    ]).start();
  }, []);

  const handleNext = () => {
    if (nickname.trim()) {
      router.push({ pathname: '/landing2', params: { nickname } });
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar barStyle="light-content" />

      {/* ── Background layers ── */}
      {/* Top ellipse */}
      <View style={styles.ellipse4} />
      {/* Left ellipse */}
      <View style={styles.ellipse6} />
      {/* Bottom-right ellipse */}
      <View style={styles.ellipse5} />
      {/* Mid-right semi-transparent ellipse */}
      <View style={styles.ellipse7} />
      {/* Dark overlay */}
      <View style={styles.overlay} />

      {/* ── Sparkles ── */}
      <Sparkle style={{ position: 'absolute', top: height * 0.14, left: width * 0.08 }} size="large" />
      <Sparkle style={{ position: 'absolute', top: height * 0.03, left: width * 0.88 }} size="small" />
      <Sparkle style={{ position: 'absolute', top: height * 0.31, left: width * 0.87 }} size="large" />
      <Sparkle style={{ position: 'absolute', top: height * 0.35, left: width * 0.89 }} size="small" />
      <Sparkle style={{ position: 'absolute', top: height * 0.51, left: width * 0.04 }} size="large" />
      <Sparkle style={{ position: 'absolute', top: height * 0.52, left: width * 0.01 }} size="small" />
      <Sparkle style={{ position: 'absolute', top: height * 0.70, left: width * 0.83 }} size="small" />
      <Sparkle style={{ position: 'absolute', top: height * 0.72, left: width * 0.85 }} size="small" />
      <Sparkle style={{ position: 'absolute', top: height * 0.89, left: width * 0.03 }} size="large" />
      <Sparkle style={{ position: 'absolute', top: height * 0.94, left: width * 0.84 }} size="small" />

      {/* ── Content ── */}
      <View style={styles.content}>
        {/* Title */}
        <Animated.Text
          style={[
            styles.title,
            { opacity: titleOpacity, transform: [{ translateY: titleY }] },
          ]}
        >
          Welcome to Abyssal Flow!
        </Animated.Text>

        {/* Subtitle */}
        <Animated.Text style={[styles.subtitle, { opacity: subtitleOpacity }]}>
          What should we call you?
        </Animated.Text>

        {/* Input */}
        <Animated.View style={[styles.inputWrapper, { opacity: inputOpacity }]}>
          <TextInput
            style={styles.input}
            placeholder="Enter Nickname..."
            placeholderTextColor="rgba(0,0,0,0.45)"
            value={nickname}
            onChangeText={setNickname}
            autoCorrect={false}
            autoCapitalize="none"
          />
        </Animated.View>
      </View>

      {/* ── Next Button ── */}
      <Animated.View style={[styles.buttonContainer, { opacity: buttonOpacity }]}>
        <TouchableOpacity
          style={[styles.button, !nickname.trim() && styles.buttonDisabled]}
          onPress={handleNext}
          activeOpacity={0.8}
        >
          <Text style={styles.buttonText}>Next</Text>
        </TouchableOpacity>
      </Animated.View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#001242',
  },

  // ── Background ellipses ──
  ellipse4: {
    position: 'absolute',
    width: width * 1.0,
    height: height * 0.32,
    borderRadius: 999,
    backgroundColor: '#437D9A',
    top: -height * 0.01,
    left: -width * 0.13,
  },
  ellipse6: {
    position: 'absolute',
    width: width * 0.52,
    height: height * 0.61,
    borderRadius: 999,
    backgroundColor: '#4F7F97',
    left: -width * 0.03,
    top: height * 0.47,
  },
  ellipse5: {
    position: 'absolute',
    width: width * 0.68,
    height: height * 0.33,
    borderRadius: 999,
    backgroundColor: '#034C71',
    left: width * 0.51,
    top: height * 0.71,
    opacity: 0.8,
  },
  ellipse7: {
    position: 'absolute',
    width: width * 0.66,
    height: height * 0.31,
    borderRadius: 999,
    backgroundColor: 'rgba(109,172,209,0.35)',
    left: width * 0.47,
    top: height * 0.36,
  },
  overlay: {
    position: 'absolute',
    width: width + 80,
    height: height + 80,
    left: -40,
    top: -40,
    backgroundColor: 'rgba(0,18,66,0.50)',
    borderRadius: 18,
    // backdrop blur not supported in RN without expo-blur;
    // the overlay tint achieves the same dark effect
  },

  // ── Sparkle ──
  sparkleContainer: {
    position: 'absolute',
  },
  sparkleBar: {
    position: 'absolute',
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 2,
  },

  // ── Content ──
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 28,
    paddingTop: height * 0.08,
  },
  title: {
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    fontSize: 28,
    lineHeight: 44,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 10,
  },
  subtitle: {
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
    fontSize: 15,
    lineHeight: 22,
    letterSpacing: 0.8,
    color: '#E1F2FF',
    marginBottom: 24,
  },
  inputWrapper: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    paddingHorizontal: 20,
    height: 55,
    justifyContent: 'center',
    // Glow border effect
    shadowColor: '#6DB4D8',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
    elevation: 6,
  },
  input: {
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
    fontSize: 15,
    color: '#000000',
  },

  // ── Button ──
  buttonContainer: {
    alignItems: 'center',
    paddingBottom: height * 0.09,
  },
  button: {
    backgroundColor: '#001242',
    borderRadius: 50,
    width: 206,
    height: 47,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#6DB4D8',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 5,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    letterSpacing: 1,
  },
});