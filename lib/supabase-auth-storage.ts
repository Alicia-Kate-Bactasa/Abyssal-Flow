import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

const webStorage =
  Platform.OS === "web" && typeof globalThis.localStorage !== "undefined"
    ? globalThis.localStorage
    : null;

export const supabaseAuthStorage = {
  async getItem(key: string) {
    if (webStorage) {
      return webStorage.getItem(key);
    }
    return SecureStore.getItemAsync(key);
  },
  async setItem(key: string, value: string) {
    if (webStorage) {
      webStorage.setItem(key, value);
      return;
    }
    await SecureStore.setItemAsync(key, value);
  },
  async removeItem(key: string) {
    if (webStorage) {
      webStorage.removeItem(key);
      return;
    }
    await SecureStore.deleteItemAsync(key);
  },
};
