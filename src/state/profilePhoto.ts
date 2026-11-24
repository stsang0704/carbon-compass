import { supabase } from "../lib/supabase";

const bucket = "profile-photos";
const maxBytes = 5 * 1024 * 1024;
const signedForSeconds = 60 * 60 * 6;

const extensions: Record<string, "jpg" | "png" | "webp"> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export type ProfilePhoto = {
  path: string | null;
  url: string | null;
};

export function profilePhotoError(file: File): string | null {
  if (!extensions[file.type]) return "Use a JPEG, PNG, or WebP photo.";
  if (file.size <= 0) return "That photo is empty.";
  if (file.size > maxBytes) return "Choose a photo under 5 MB.";
  return null;
}

export async function loadProfilePhoto(): Promise<ProfilePhoto> {
  if (!supabase) return { path: null, url: null };
  const { data, error } = await supabase.from("profiles").select("avatar_path").maybeSingle();
  if (error || !data) return { path: null, url: null };
  const path = photoPath(data.avatar_path);
  if (!path) return { path: null, url: null };
  return { path, url: await signedUrl(path) };
}

export async function saveProfilePhoto(
  userId: string,
  file: File,
  previousPath: string | null,
): Promise<{ photo: ProfilePhoto; error: string | null }> {
  if (!supabase) return { photo: { path: previousPath, url: null }, error: "Supabase is not configured." };
  const fileError = profilePhotoError(file);
  if (fileError) return { photo: { path: previousPath, url: null }, error: fileError };

  const path = `${userId}/avatar.${extensions[file.type]}`;
  const { error: uploadError } = await supabase.storage.from(bucket).upload(path, file, {
    contentType: file.type,
    upsert: true,
  });
  if (uploadError) {
    return { photo: { path: previousPath, url: null }, error: setupHint(uploadError.message) };
  }

  const { error: updateError } = await supabase
    .from("profiles")
    .update({ avatar_path: path, updated_at: new Date().toISOString() })
    .eq("id", userId);
  if (updateError) {
    if (path !== previousPath) await supabase.storage.from(bucket).remove([path]);
    return { photo: { path: previousPath, url: null }, error: setupHint(updateError.message) };
  }

  if (previousPath && previousPath !== path) {
    await supabase.storage.from(bucket).remove([previousPath]);
  }
  return { photo: { path, url: await signedUrl(path) }, error: null };
}

export async function removeProfilePhoto(userId: string, path: string | null): Promise<string | null> {
  if (!supabase) return "Supabase is not configured.";
  const { error } = await supabase
    .from("profiles")
    .update({ avatar_path: null, updated_at: new Date().toISOString() })
    .eq("id", userId);
  if (error) return setupHint(error.message);
  if (path) await supabase.storage.from(bucket).remove([path]);
  return null;
}

function photoPath(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}

async function signedUrl(path: string): Promise<string | null> {
  if (!supabase) return null;
  const { data } = await supabase.storage.from(bucket).createSignedUrl(path, signedForSeconds);
  return data?.signedUrl ?? null;
}

function setupHint(message: string): string {
  if (/avatar_path|profile-photos|row-level security|permission|bucket|not found/i.test(message)) {
    return "Profile photos need the profile photo setup in Supabase. Your name and footprint were not changed.";
  }
  return message;
}
