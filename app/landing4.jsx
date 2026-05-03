import React, { useRef, useEffect, useState } from 'react';
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

// Calendar icon using Views
const CalendarIcon = ({ filled = false }) => (
  <View style={styles.calendarIcon}>
    {/* Icon body */}
    <View style={[styles.calendarBody, filled && styles.calendarBodyFilled]}>
      {/* Top bar */}
      <View style={styles.calendarTopBar} />
      {/* Grid dots */}
      <View style={styles.calendarGrid}>
        {[...Array(6)].map((_, i) => (
          <View key={i} style={styles.calendarDot} />
        ))}
      </View>
    </View>
    {/* Two pin tops */}
    <View style={[styles.calendarPin, { left: '28%' }]} />
    <View style={[styles.calendarPin, { left: '62%' }]} />
  </View>
);

const OPTIONS = [
  {
    id: 'regular',
    label: 'Regular',
    description: 'Happens around the same time',
    filled: false,
  },
  {
    id: 'irregular',
    label: 'Irregular',
    description: 'Predicting it is difficult',
    filled: true,
  },
];

export default function Landing4() {
  const params = useLocalSearchParams();
  const [selected, setSelected] = useState(null);

  const titleOpacity = useRef(new Animated.Value(0)).current;
  const titleY = useRef(new Animated.Value(24)).current;
  const cardsOpacity = useRef(new Animated.Value(0)).current;
  const buttonOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.stagger(150, [
      Animated.parallel([
        Animated.timing(titleOpacity, { toValue: 1, duration: 600, useNativeDriver: true }),
        Animated.timing(titleY, { toValue: 0, duration: 600, useNativeDriver: true }),
      ]),
      Animated.timing(cardsOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.timing(buttonOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
    ]).start();
  }, []);

  const handleNext = () => {
    router.push({ pathname: '/landing5', params: { ...params, rhythm: selected } });
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
          Your Rhythm
        </Animated.Text>

        {/* Subtitle */}
        <Animated.Text style={[styles.subtitle, { opacity: titleOpacity }]}>
          Is your period usually regular?
        </Animated.Text>

        {/* Option Cards */}
        <Animated.View style={[styles.cardsContainer, { opacity: cardsOpacity }]}>
          {OPTIONS.map((option) => {
            const isSelected = selected === option.id;
            return (
              <TouchableOpacity
                key={option.id}
                style={[styles.card, isSelected && styles.cardSelected]}
                onPress={() => setSelected(option.id)}
                activeOpacity={0.8}
              >
                {/* Icon circle */}
                <View style={styles.iconCircle}>
                  <CalendarIcon filled={option.filled} />
                </View>
                {/* Text */}
                <View style={styles.cardText}>
                  <Text style={styles.cardLabel}>{option.label}</Text>
                  <Text style={styles.cardDescription}>{option.description}</Text>
                </View>
              </TouchableOpacity>
            );
          })}

          {/* I don't know yet */}
          <TouchableOpacity
            style={[styles.dontKnowCard, selected === 'unknown' && styles.cardSelected]}
            onPress={() => setSelected('unknown')}
            activeOpacity={0.8}
          >
            <Text style={styles.dontKnowText}>I don't know yet</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>

      {/* Next Button */}
      <Animated.View style={[styles.buttonContainer, { opacity: buttonOpacity }]}>
        <TouchableOpacity
          style={[styles.button, !selected && styles.buttonDisabled]}
          onPress={handleNext}
          activeOpacity={0.8}
        >
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
    paddingHorizontal: 28,
  },
  title: {
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    fontSize: 27,
    lineHeight: 44,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
    fontSize: 15,
    lineHeight: 20,
    letterSpacing: 0.7,
    color: '#E1F2FF',
    textAlign: 'center',
    marginBottom: 28,
  },

  // Cards
  cardsContainer: {
    width: '100%',
    gap: 12,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 12,
    paddingVertical: 16,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  cardSelected: {
    borderColor: '#6DB4D8',
  },
  iconCircle: {
    width: 65,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#001242',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  cardText: {
    flex: 1,
  },
  cardLabel: {
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    fontSize: 18,
    fontWeight: '500',
    color: '#001242',
    marginBottom: 4,
  },
  cardDescription: {
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
    fontSize: 11,
    lineHeight: 15,
    letterSpacing: 0.5,
    color: '#001242',
  },

  // Calendar icon styles
  calendarIcon: {
    width: 33,
    height: 33,
    position: 'relative',
    justifyContent: 'flex-end',
  },
  calendarBody: {
    width: 28,
    height: 26,
    borderRadius: 3,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    overflow: 'hidden',
    marginTop: 6,
  },
  calendarBodyFilled: {
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  calendarTopBar: {
    height: 7,
    backgroundColor: '#FFFFFF',
    opacity: 0.5,
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 2,
    gap: 2,
  },
  calendarDot: {
    width: 5,
    height: 5,
    borderRadius: 1,
    backgroundColor: '#FFFFFF',
    opacity: 0.7,
  },
  calendarPin: {
    position: 'absolute',
    top: 0,
    width: 4,
    height: 8,
    borderRadius: 2,
    backgroundColor: '#FFFFFF',
  },

  // Don't know card
  dontKnowCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    height: 37,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  dontKnowText: {
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    fontSize: 12,
    color: '#001242',
    fontWeight: '500',
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