import { supabaseClient } from "@/lib/supabase";
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
    let active = true;

    (async () => {
      try {
        const { data } = await supabaseClient.auth.getUser();
        if (!active) return;
        const nickname =
          (data.user?.user_metadata?.username as string | undefined) ??
          (data.user?.user_metadata?.nickname as string | undefined) ??
          "";
        if (nickname) setUser({ nickname });
      } catch {
        // ignore
      }
    })();

    const { data } = supabaseClient.auth.onAuthStateChange((_event, session) => {
      const nickname =
        (session?.user?.user_metadata?.username as string | undefined) ??
        (session?.user?.user_metadata?.nickname as string | undefined) ??
        "";
      setUser({ nickname });
    });

    return () => {
      active = false;
      try {
        data.subscription.unsubscribe();
      } catch {
        // ignore
      }
    };
  }, []);

  const setNickname = (name: string) => setUser((u) => ({ ...u, nickname: name }));

  return <UserContext.Provider value={{ user, setNickname }}>{children}</UserContext.Provider>;
}

export function useUser() {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error("useUser must be used within UserProvider");
  return ctx;
}

export default UserProvider;
