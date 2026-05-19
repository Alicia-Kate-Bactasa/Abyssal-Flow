/**
 * Abyssal Flow - Ocean themed colors
 */

import { Platform } from 'react-native';

// Ocean theme colors
const oceanDeepBlue = '#0B1F3C';
const oceanCyan = '#5BA3D0';
const oceanLight = '#A8D8EA';
const oceanAccent = '#2C5282';

export const Colors = {
  light: {
    text: '#FFFFFF',
    background: '#0B1F3C',
    tint: '#5BA3D0',
    icon: '#A8D8EA',
    tabIconDefault: '#A8D8EA',
    tabIconSelected: '#5BA3D0',
  },
  dark: {
    text: '#FFFFFF',
    background: '#0B1F3C',
    tint: '#5BA3D0',
    icon: '#A8D8EA',
    tabIconDefault: '#A8D8EA',
    tabIconSelected: '#5BA3D0',
  },
};

// Ocean theme specific colors
export const OceanColors = {
  deepBlue: oceanDeepBlue,
  cyan: oceanCyan,
  light: oceanLight,
  accent: oceanAccent,
  white: '#FFFFFF',
  inputBg: '#FFFFFF',
  inputText: '#333333',
  buttonBg: '#0B0F2C',
  buttonText: '#FFFFFF',
  textSecondary: '#A8D8EA',
};

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
