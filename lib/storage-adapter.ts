import * as SecureStore from 'expo-secure-store';

const KEY_PREFIX = '@abyssal_secure:';

export const storage = {
  async getItem(key: string) {
    try {
      const v = await SecureStore.getItemAsync(KEY_PREFIX + key);
      return v ?? null;
    } catch {
      return null;
    }
  },
  async setItem(key: string, value: string) {
    try {
      await SecureStore.setItemAsync(KEY_PREFIX + key, value, { keychainService: 'abyssal' });
    } catch {
      // ignore
    }
  },
  async removeItem(key: string) {
    try {
      await SecureStore.deleteItemAsync(KEY_PREFIX + key);
    } catch {
      // ignore
    }
  },
};

export default storage;
