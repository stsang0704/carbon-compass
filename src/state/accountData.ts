import { supabase } from "../lib/supabase";
import { parseProfile, type Profile } from "./profile";

export type AccountRecord = {
  displayName: string;
  footprint: Profile | null;
};

export async function fetchAccount(userId: string): Promise<{ record: AccountRecord | null; error: string | null }> {
  if (!supabase) return { record: null, error: "Supabase is not configured." };
  const { data, error } = await supabase
    .from("profiles")
    .select("display_name, footprint")
    .eq("id", userId)
    .maybeSingle();
  if (error) return { record: null, error: error.message };
  if (!data) return { record: { displayName: "", footprint: null }, error: null };
  const row = data as { display_name?: unknown; footprint?: unknown };
  return {
    record: {
      displayName: typeof row.display_name === "string" ? row.display_name : "",
      footprint: parseProfile(row.footprint),
    },
    error: null,
  };
}

export async function saveFootprint(userId: string, profile: Profile): Promise<string | null> {
  if (!supabase) return "Supabase is not configured.";
  const footprint = parseProfile(profile);
  if (!footprint) return "This footprint is incomplete, so it was kept on this device and not sent to your account.";
  const { data, error } = await supabase
    .from("profiles")
    .upsert({ id: userId, footprint, updated_at: new Date().toISOString() }, { onConflict: "id" })
    .select("id");
  if (error) return error.message;
  if (!data?.length) return "Your account did not confirm the save, so the footprint was kept on this device.";
  return null;
}

export async function saveDisplayName(userId: string, displayName: string): Promise<string | null> {
  if (!supabase) return "Supabase is not configured.";
  const { error } = await supabase.from("profiles").upsert(
    { id: userId, display_name: displayName, updated_at: new Date().toISOString() },
    { onConflict: "id" },
  );
  if (error) return error.message;
  const { error: metaError } = await supabase.auth.updateUser({ data: { display_name: displayName } });
  return metaError?.message ?? null;
}
