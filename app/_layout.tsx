import {
    DarkTheme,
    DefaultTheme,
    ThemeProvider,
} from "@react-navigation/native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import "react-native-reanimated";

import { useColorScheme } from "@/hooks/use-color-scheme";

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="landing" options={{ headerShown: false }} />
        <Stack.Screen name="landing1" options={{ headerShown: false }} />
        <Stack.Screen name="landing2" options={{ headerShown: false }} />
        <Stack.Screen name="landing3" options={{ headerShown: false }} />
        <Stack.Screen name="landing4" options={{ headerShown: false }} />
        <Stack.Screen name="landing5" options={{ headerShown: false }} />
        <Stack.Screen name="landing6" options={{ headerShown: false }} />
        <Stack.Screen name="landing7" options={{ headerShown: false }} />
        <Stack.Screen name="landing8" options={{ headerShown: false }} />
        <Stack.Screen name="landing9" options={{ headerShown: false }} />
        <Stack.Screen name="landing10" options={{ headerShown: false }} />
        <Stack.Screen name="landing11" options={{ headerShown: false }} />
        <Stack.Screen name="landing12" options={{ headerShown: false }} />
        <Stack.Screen name="landing13" options={{ headerShown: false }} />
        <Stack.Screen name="landing14" options={{ headerShown: false }} />
        <Stack.Screen name="landing15" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="modal"
          options={{ presentation: "modal", title: "Modal" }}
        />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
