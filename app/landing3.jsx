import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Animated,
  StatusBar,
  Platform,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';

const { width, height } = Dimensions.get('window');

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
    <Animated.View style={[{ position: 'absolute', width: s * 2, height: s * 2 }, style, { opacity }]}>
      <View style={[styles.sparkleBar, { width: s * 2, height: 2, top: s - 1, left: 0 }]} />
      <View style={[styles.sparkleBar, { width: 2, height: s * 2, top: 0, left: s - 1 }]} />
      <View style={[styles.sparkleBar, { width: s * 1.2, height: 1.5, top: s - 0.75, left: s * 0.4, transform: [{ rotate: '45deg' }] }]} />
      <View style={[styles.sparkleBar, { width: s * 1.2, height: 1.5, top: s - 0.75, left: s * 0.4, transform: [{ rotate: '-45deg' }] }]} />
    </Animated.View>
  );
};

export default function Landing3() {
  const { nickname, birthYear } = useLocalSearchParams();

  const titleOpacity = useRef(new Animated.Value(0)).current;
  const titleY = useRef(new Animated.Value(24)).current;
  const bodyOpacity = useRef(new Animated.Value(0)).current;
  const disclaimerOpacity = useRef(new Animated.Value(0)).current;
  const buttonOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.stagger(150, [
      Animated.parallel([
        Animated.timing(titleOpacity, { toValue: 1, duration: 600, useNativeDriver: true }),
        Animated.timing(titleY, { toValue: 0, duration: 600, useNativeDriver: true }),
      ]),
      Animated.timing(bodyOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.timing(disclaimerOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.timing(buttonOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
    ]).start();
  }, []);

  const handleNext = () => {
    router.push({ pathname: '/landing4', params: { nickname, birthYear } });
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" />

      {/* Background ellipses */}
      <View style={styles.ellipse4} />
      <View style={styles.ellipse6} />
      <View style={styles.ellipse5} />
      <View style={styles.ellipse7} />
      <View style={styles.overlay} />

      {/* Sparkles */}
      <Sparkle style={{ top: height * 0.07, left: width * 0.88 }} size="small" />
      <Sparkle style={{ top: height * 0.14, left: width * 0.08 }} size="large" />
      <Sparkle style={{ top: height * 0.31, left: width * 0.87 }} size="large" />
      <Sparkle style={{ top: height * 0.35, left: width * 0.89 }} size="small" />
      <Sparkle style={{ top: height * 0.51, left: width * 0.04 }} size="large" />
      <Sparkle style={{ top: height * 0.52, left: width * 0.01 }} size="small" />
      <Sparkle style={{ top: height * 0.70, left: width * 0.83 }} size="small" />
      <Sparkle style={{ top: height * 0.72, left: width * 0.85 }} size="small" />
      <Sparkle style={{ top: height * 0.89, left: width * 0.03 }} size="large" />
      <Sparkle style={{ top: height * 0.94, left: width * 0.84 }} size="small" />

      {/* Back button */}
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()} activeOpacity={0.7}>
        <Text style={styles.backArrow}>←</Text>
      </TouchableOpacity>

      {/* Main content */}
      <View style={styles.content}>
        {/* Title */}
        <Animated.Text
          style={[styles.title, { opacity: titleOpacity, transform: [{ translateY: titleY }] }]}
        >
          Our Purpose
        </Animated.Text>

        {/* Body text */}
        <Animated.Text style={[styles.body, { opacity: bodyOpacity }]}>
          Abyssal Flow is dedicated to tracking your menstrual cycle and symptoms.
        </Animated.Text>
      </View>

      {/* Disclaimer */}
      <Animated.Text style={[styles.disclaimer, { opacity: disclaimerOpacity }]}>
        Disclaimer: If you are currently pregnant, please note that pregnancy-specific features are coming soon.
      </Animated.Text>

      {/* Next Button */}
      <Animated.View style={[styles.buttonContainer, { opacity: buttonOpacity }]}>
        <TouchableOpacity style={styles.button} onPress={handleNext} activeOpacity={0.8}>
          <Text style={styles.buttonText}>Next</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#001242',
  },
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
  },
  sparkleBar: {
    position: 'absolute',
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 2,
  },

  // Back button
  backButton: {
    position: 'absolute',
    top: 48,
    left: 20,
    zIndex: 10,
    padding: 8,
  },
  backArrow: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '300',
  },

  // Content
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  title: {
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    fontSize: 27,
    lineHeight: 44,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 20,
  },
  body: {
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
    fontSize: 15,
    lineHeight: 22,
    letterSpacing: 0.7,
    color: '#E1F2FF',
    textAlign: 'center',
  },

  // Disclaimer
  disclaimer: {
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
    fontSize: 10,
    lineHeight: 14,
    letterSpacing: 0.5,
    color: '#62A6FF',
    textAlign: 'center',
    paddingHorizontal: 40,
    marginBottom: 24,
  },

  // Button
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
  buttonText: {
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    letterSpacing: 1,
  },
});