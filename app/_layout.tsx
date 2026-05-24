import React, { useEffect } from "react";
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import "react-native-reanimated";

import { useColorScheme } from "@/hooks/use-color-scheme";
import { CycleDataProvider, useCycleData } from "@/hooks/use-cycle-store";
import { supabaseClient } from "@/lib/supabase";
import UserProvider from "@/hooks/use-user-store";

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <UserProvider>
      <CycleDataProvider>
        {/* Auth watcher runs inside CycleDataProvider so it can access cycle store */}
        <AuthWatcher />
        <ThemeProvider
          value={colorScheme === "dark" ? DarkTheme : DefaultTheme}
        >
          <Stack>
            <Stack.Screen name="index" options={{ headerShown: false }} />
            <Stack.Screen name="landing" options={{ headerShown: false }} />
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen
              name="modal"
              options={{ presentation: "modal", title: "Modal" }}
            />
          </Stack>
          <StatusBar style="auto" />
        </ThemeProvider>
      </CycleDataProvider>
    </UserProvider>
  );
}

function AuthWatcher() {
  const { resetStore, fetchRemoteCycles } = useCycleData();

  useEffect(() => {
    const { data } = supabaseClient.auth.onAuthStateChange(
      (_event, session) => {
        if (!session) {
          // user logged out — clear cycle-related in-memory state
          try {
            resetStore();
          } catch (err) {
            // ignore
          }
          return;
        }

        // user logged in or session restored — fetch authoritative cycles
        try {
          fetchRemoteCycles();
        } catch (err) {
          // ignore fetch errors here; fetchRemoteCycles logs them
        }
      },
    );

    return () => {
      try {
        data.subscription.unsubscribe();
      } catch {
        // ignore
      }
    };
  }, [resetStore]);

  return null;
}
