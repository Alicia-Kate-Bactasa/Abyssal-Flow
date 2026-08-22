import { supabaseClient } from "./supabase";

export async function getCachedAuthUser() {
  const { data, error } = await supabaseClient.auth.getSession();
  if (error) return null;
  return data.session?.user ?? null;
}