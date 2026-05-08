import React from "react";
import { StyleSheet, Dimensions } from "react-native";
import Svg, {
  Path,
  Defs,
  LinearGradient as SvgLinearGradient,
  Stop,
} from "react-native-svg";

export default function WaveBackground() {
  const { width, height } = Dimensions.get("window");

  return (
    <Svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      style={StyleSheet.absoluteFill}
    >
      <Defs>
        <SvgLinearGradient id="waveGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <Stop offset="0%" stopColor="#0a1929" stopOpacity="1" />
          <Stop offset="40%" stopColor="#1a4d6d" stopOpacity="1" />
          <Stop offset="70%" stopColor="#2a6b8d" stopOpacity="1" />
          <Stop offset="100%" stopColor="#4a9bb8" stopOpacity="1" />
        </SvgLinearGradient>
      </Defs>

      <Path
        d={`M 0,${height * 0.3} Q ${width * 0.25},${height * 0.25} ${width * 0.5},${height * 0.3} T ${width},${height * 0.3} L ${width},${height} L 0,${height} Z`}
        fill="url(#waveGradient)"
      />
      <Path
        d={`M 0,${height * 0.4} Q ${width * 0.25},${height * 0.35} ${width * 0.5},${height * 0.4} T ${width},${height * 0.4} L ${width},${height} L 0,${height} Z`}
        fill="#1a5a7d"
        opacity="0.6"
      />
      <Path
        d={`M 0,${height * 0.5} Q ${width * 0.25},${height * 0.45} ${width * 0.5},${height * 0.5} T ${width},${height * 0.5} L ${width},${height} L 0,${height} Z`}
        fill="#2a7a9d"
        opacity="0.4"
      />
    </Svg>
  );
}
