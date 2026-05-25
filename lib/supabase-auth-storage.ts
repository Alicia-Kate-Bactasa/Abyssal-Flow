import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

export const supabaseAuthStorage = {
  async getItem(key: string) {
    if (Platform.OS === "web") {
      if (typeof localStorage !== "undefined") return localStorage.getItem(key);
      return null;
    }
    try {
      return await AsyncStorage.getItem(key);
    } catch (e) {
      console.error("AsyncStorage getItem error:", e);
      return null;
    }
  },

  async setItem(key: string, value: string) {
    if (Platform.OS === "web") {
      if (typeof localStorage !== "undefined") localStorage.setItem(key, value);
      return;
    }
    try {
      await AsyncStorage.setItem(key, value);
    } catch (e) {
      console.error("AsyncStorage setItem error:", e);
    }
  },

  async removeItem(key: string) {
    if (Platform.OS === "web") {
      if (typeof localStorage !== "undefined") localStorage.removeItem(key);
      return;
    }
    try {
      await AsyncStorage.removeItem(key);
    } catch (e) {
      console.error("AsyncStorage removeItem error:", e);
    }
  },
};
