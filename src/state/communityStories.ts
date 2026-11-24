import { supabase } from "../lib/supabase";
import type { Category } from "../model/types";

const bucket = "story-photos";
const maxBytes = 5 * 1024 * 1024;

const extensions: Record<string, "jpg" | "png" | "webp"> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export type CommunityStory = {
  id: string;
  authorId: string;
  authorName: string;
  title: string;
  caption: string;
  category: Category;
  photoUrl: string | null;
  createdAt: string;
};

type StoryRow = {
  id: string;
  author_id: string;
  author_name: string;
  title: string;
  caption: string;
  category: string;
  photo_path: string | null;
  created_at: string;
};

export function photoFileError(file: File): string | null {
  if (!extensions[file.type]) return "Use a JPEG, PNG, or WebP photo.";
  if (file.size > maxBytes) return "Choose a photo under 5 MB.";
  return null;
}

export async function fetchCommunityStories(): Promise<{ stories: CommunityStory[]; error: string | null }> {
  if (!supabase) return { stories: [], error: null };
  const { data, error } = await supabase
    .from("community_stories")
    .select("id, author_id, author_name, title, caption, category, photo_path, created_at")
    .order("created_at", { ascending: false });
  if (error) return { stories: [], error: error.message };
  const rows = (data ?? []) as StoryRow[];
  const paths = rows.flatMap((row) => (row.photo_path ? [row.photo_path] : []));
  const signed = new Map<string, string>();
  if (paths.length > 0) {
    const { data: files } = await supabase.storage.from(bucket).createSignedUrls(paths, 60 * 60);
    for (const file of files ?? []) {
      if (file.path && file.signedUrl) signed.set(file.path, file.signedUrl);
    }
  }
  return {
    stories: rows.filter(isStoryCategory).map((row) => ({
      id: row.id,
      authorId: row.author_id,
      authorName: row.author_name || "Someone",
      title: row.title,
      caption: row.caption,
      category: row.category,
      photoUrl: row.photo_path ? signed.get(row.photo_path) ?? null : null,
      createdAt: row.created_at,
    })),
    error: null,
  };
}

export async function publishCommunityStory(input: {
  userId: string;
  authorName: string;
  title: string;
  caption: string;
  category: Category;
  photo: File | null;
}): Promise<{ story: CommunityStory | null; error: string | null }> {
  if (!supabase) return { story: null, error: "Supabase is not configured." };
  const title = input.title.trim();
  const caption = input.caption.trim();
  if (!title) return { story: null, error: "Add a short title before sharing." };
  if (title.length > 80) return { story: null, error: "Keep the title under 80 characters." };
  if (caption.length > 280) return { story: null, error: "Keep the caption under 280 characters." };
  if (input.photo) {
    const fileError = photoFileError(input.photo);
    if (fileError) return { story: null, error: fileError };
  }

  const id = crypto.randomUUID();
  const extension = input.photo ? extensions[input.photo.type] : null;
  const photoPath = extension ? `${input.userId}/${id}.${extension}` : null;

  if (input.photo && photoPath) {
    const { error: uploadError } = await supabase.storage.from(bucket).upload(photoPath, input.photo, {
      contentType: input.photo.type,
      upsert: false,
    });
    if (uploadError) return { story: null, error: uploadError.message };
  }

  const { error: anchorError } = await supabase.from("sample_stories").insert({
    id,
    is_sample: false,
    author_id: input.userId,
  });
  if (anchorError) {
    await removePhoto(photoPath);
    return { story: null, error: setupHint(anchorError.message) };
  }

  const { error: storyError } = await supabase.from("community_stories").insert({
    id,
    author_id: input.userId,
    author_name: input.authorName.slice(0, 80),
    title,
    caption,
    category: input.category,
    photo_path: photoPath,
  });
  if (storyError) {
    await supabase.from("sample_stories").delete().eq("id", id);
    await removePhoto(photoPath);
    return { story: null, error: setupHint(storyError.message) };
  }

  let photoUrl: string | null = null;
  if (photoPath) {
    const { data } = await supabase.storage.from(bucket).createSignedUrl(photoPath, 60 * 60);
    photoUrl = data?.signedUrl ?? null;
  }

  return {
    story: {
      id,
      authorId: input.userId,
      authorName: input.authorName || "You",
      title,
      caption,
      category: input.category,
      photoUrl,
      createdAt: new Date().toISOString(),
    },
    error: null,
  };
}

function isStoryCategory(row: StoryRow): row is StoryRow & { category: Category } {
  return row.category === "food" || row.category === "travel" || row.category === "home" || row.category === "stuff";
}

async function removePhoto(path: string | null) {
  if (!supabase || !path) return;
  await supabase.storage.from(bucket).remove([path]);
}

function setupHint(message: string): string {
  if (/community_stories|sample_stories|story-photos|row-level security|permission/i.test(message)) {
    return "Photo sharing needs the story photo setup in Supabase. The sample stories are unchanged.";
  }
  return message;
}
