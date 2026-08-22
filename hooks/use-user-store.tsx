import { getCachedAuthUser } from "../lib/auth-session";
import { supabaseClient } from "../lib/supabase";
import React, { createContext, useContext, useEffect, useState } from "react";
import * as SecureStore from "expo-secure-store";
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
    const clearOldData = async () => {
      await SecureStore.deleteItemAsync("user_data"); // Use your actual storage key here
    };
    clearOldData();
    const fetchFreshProfile = async () => {
      try {
        const authUser = await getCachedAuthUser();
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

    fetchFreshProfile();

    const { data: authListener } = supabaseClient.auth.onAuthStateChange(
      async (_event, session) => {
        if (session?.user) {
          // CALL THE DATABASE, NOT THE METADATA
          const { data: profile } = await supabaseClient
            .from("profiles")
            .select("id, nickname, description, avatar_url")
            .eq("id", session.user.id)
            .single();

          if (profile) {
            setUser({
              id: session.user.id,
              nickname: profile.nickname || "",
              description: profile.description || "",
              avatar_url: profile.avatar_url || "",
            });
          }
        } else {
          // Clear user on logout
          setUser({
            id: "",
            nickname: "",
            description: "",
            avatar_url: undefined,
          });
        }
      },
    );

    return () => {
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
        data: { session },
      } = await supabaseClient.auth.getSession();
      const authUser = session?.user;
      if (!authUser) throw new Error("No user logged in");

      // Only send columns that actually exist in your table
      // If 'description' is missing in Supabase, remove it from this object:
      const dbUpdates = {
        nickname: updates.nickname,
        description: updates.description,
        avatar_url: updates.avatar_url,
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
