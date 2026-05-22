import "react-native-url-polyfill/auto";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://vagmdsmzvpccdkyamgam.supabase.co";
const supabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZhZ21kc216dnBjY2RreWFtZ2FtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkzNzgyMTIsImV4cCI6MjA5NDk1NDIxMn0.EOEjJCKYxYX4Yht-mb-YKNGYkCqcrVUPBuvCbl-gJ5c";

export const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
