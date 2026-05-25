import { supabaseClient } from "@/lib/supabase";
import React, { createContext, useContext, useEffect, useState } from "react";

type User = {
  id: string;
  nickname: string;
  username?: string;
  description?: string;
  avatar_url?: string;
};

type UserContextType = {
  user: User;
  setNickname: (name: string) => void;
  setUsername: (name: string) => void;
  updateUser: (updates: Partial<User>) => Promise<void>;
};

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User>({
    id: "",
    nickname: "",
    username: undefined,
    description: "",
    avatar_url: undefined,
  });

  // Load user data on startup
  useEffect(() => {
    let active = true;

    const fetchUser = async () => {
      try {
        const {
          data: { user: authUser },
        } = await supabaseClient.auth.getUser();
        if (!authUser) return;

        // Fetch the REAL profile from the table, not just metadata
        const { data: profile } = await supabaseClient
          .from("profiles")
          .select("*")
          .eq("id", authUser.id)
          .single();

        if (profile) {
          setUser({
            id: profile.id,
            nickname: profile.nickname || "",
            description: profile.description || "",
            avatar_url: profile.avatar_url || "",
          });
        }
      } catch (err) {
        console.error("Error fetching profile:", err);
      }
    };

    fetchUser();

    const { data: authListener } = supabaseClient.auth.onAuthStateChange(
      (_event, session) => {
        if (session?.user) {
          const metadata = session.user.user_metadata;
          setUser({
            id: session.user.id,
            nickname: metadata.nickname ?? "",
            username: metadata.username,
            description: metadata.description ?? "",
            avatar_url: metadata.avatar_url ?? "",
          });
        }
      },
    );

    return () => {
      active = false;
      authListener.subscription.unsubscribe();
    };
  }, []);

  const setNickname = (name: string) =>
    setUser((u) => ({ ...u, nickname: name }));
  const setUsername = (name: string) =>
    setUser((u) => ({ ...u, username: name }));

  // THIS IS THE NEW "DOOR" TO SUPABASE
  const updateUser = async (updates: Partial<User>) => {
    try {
      setUser((prev) => ({ ...prev, ...updates }));

      const {
        data: { user: authUser },
      } = await supabaseClient.auth.getUser();
      if (!authUser) throw new Error("No user logged in");

      // Only send columns that actually exist in your table
      // If 'description' is missing in Supabase, remove it from this object:
      const dbUpdates = {
        nickname: updates.nickname,
        description: updates.description,
        // username: updates.username // Only uncomment if this column exists in Supabase
      };

      const { error } = await supabaseClient
        .from("profiles")
        .update(dbUpdates)
        .eq("id", authUser.id);

      if (error) throw error;
      console.log("Database updated successfully");
    } catch (err) {
      console.error("Failed to update database:", err);
    }
  };

  return (
    <UserContext.Provider
      value={{ user, setNickname, setUsername, updateUser }}
    >
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
