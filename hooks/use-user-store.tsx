import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState } from "react";

type User = {
  nickname: string;
};

type UserContextType = {
  user: User;
  setNickname: (name: string) => void;
};

const USER_STORAGE_KEY = "@abyssal_user";

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User>({ nickname: "" });

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(USER_STORAGE_KEY);
        if (raw) setUser(JSON.parse(raw));
      } catch (e) {
        // ignore
      }
    })();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
      } catch (e) {
        // ignore
      }
    })();
  }, [user]);

  const setNickname = (name: string) => setUser((u) => ({ ...u, nickname: name }));

  return <UserContext.Provider value={{ user, setNickname }}>{children}</UserContext.Provider>;
}

export function useUser() {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error("useUser must be used within UserProvider");
  return ctx;
}

export default UserProvider;
