import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";

export default function AuthLayout() {
  return (
    <>
      <Stack>
        <Stack.Screen
          name="login"
          options={{
            headerShown: false,
            animation: "none",
          }}
        />
        <Stack.Screen
          name="signup"
          options={{
            headerShown: false,
            animation: "default",
          }}
        />
      </Stack>
      <StatusBar style="light" />
    </>
  );
}
