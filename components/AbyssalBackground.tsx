import React from "react";
import { View, Dimensions, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Svg, { Path } from "react-native-svg";

interface AbyssalBackgroundProps {
  children?: React.ReactNode;
  middleLayer?: React.ReactNode;
}

const AbyssalBackground: React.FC<AbyssalBackgroundProps> = ({
  children,
  middleLayer,
}) => {
  const { width, height } = Dimensions.get("window");
  const waveHeight = height * 0.5;

  return (
    <View style={styles.container}>
      <View style={StyleSheet.absoluteFill}>
        {/* 1. Top Section (Dark Blue) */}
        <LinearGradient
          colors={["#04122B", "#143867"]}
          style={{ height: waveHeight }}
        />

        {/* 2. THE MIDDLE LAYER (The Moon Dial) */}
        {/* Z-index 1 keeps it below the wave */}
        <View style={[StyleSheet.absoluteFill, { zIndex: 1 }]}>
          {middleLayer}
        </View>

        {/* 3. THE WAVE LAYER */}
        {/* zIndex 50 and elevation 50 guarantee this covers the glowing moon! */}
        <View
          pointerEvents="none"
          style={{ flex: 1, marginTop: -120, zIndex: 50, elevation: 50 }}
        >
          <Svg width={width} height={180} viewBox={`0 0 ${width} 180`}>
            <Path
              d={`
                M 0, 90
                C ${width * 0.3}, -30 ${width * 0.7}, 210 ${width}, 90
                L ${width}, 180
                L 0, 180
                Z
              `}
              fill="#64B5F6"
            />
          </Svg>
          <LinearGradient
            colors={["#64B5F6", "#215A88"]}
            style={{ flex: 1, marginTop: -2 }}
          />
        </View>
      </View>

      <View style={styles.contentLayer} pointerEvents="box-none">
        {children}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#04122B" },
  contentLayer: { flex: 1, zIndex: 100 }, // Ensures text is always on top
});

export default AbyssalBackground;
