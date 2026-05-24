import { supabaseClient } from "@/lib/supabase";
import React, { createContext, useContext, useEffect, useState } from "react";

type User = {
  nickname: string;
  username?: string;
};

type UserContextType = {
  user: User;
  setNickname: (name: string) => void;
  setUsername: (name: string) => void;
};

const USER_STORAGE_KEY = "@abyssal_user";

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User>({ nickname: "", username: undefined });

  useEffect(() => {
    let active = true;

    (async () => {
      try {
        const { data } = await supabaseClient.auth.getUser();
        if (!active) return;
        const username = data.user?.user_metadata?.username as string | undefined;
        const nickname = data.user?.user_metadata?.nickname as string | undefined;
        setUser({ nickname: nickname ?? "", username });
      } catch {
        // ignore
      }
    })();

    const { data } = supabaseClient.auth.onAuthStateChange((_event, session) => {
      const username = session?.user?.user_metadata?.username as string | undefined;
      const nickname = session?.user?.user_metadata?.nickname as string | undefined;
      setUser({ nickname: nickname ?? "", username });
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
  const setUsername = (name: string) => setUser((u) => ({ ...u, username: name }));

  return (
    <UserContext.Provider value={{ user, setNickname, setUsername }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error("useUser must be used within UserProvider");
  return ctx;
}

export default UserProvider;
