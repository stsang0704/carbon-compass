import { samplePosts, type SampleComment } from "../data/together";
import { supabase } from "../lib/supabase";

export type StoryComment = {
  id: string;
  storyId: string;
  authorId: string;
  parentId: string | null;
  body: string;
  authorName: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  demo: boolean;
  timeLabel?: string;
};

export type StoryThread = StoryComment & { replies: StoryComment[] };

const columns = "id, story_id, author_id, parent_id, body, author_name, created_at, updated_at, deleted_at";

export function demoThreads(storyId: string): StoryThread[] {
  const post = samplePosts.find((item) => item.id === storyId);
  if (!post) return [];
  return post.comments.map((comment) => demoThread(storyId, comment));
}

export function demoCommentCount(storyId: string): number {
  return demoThreads(storyId).reduce((sum, thread) => sum + 1 + thread.replies.length, 0);
}

export function groupComments(rows: StoryComment[]): StoryThread[] {
  const tops = rows.filter((row) => !row.parentId);
  const used = new Set(tops.map((row) => row.id));
  const threads = tops.map((top) => ({
    ...top,
    replies: rows.filter((row) => row.parentId === top.id),
  }));
  for (const row of rows) {
    if (!row.parentId || used.has(row.parentId)) continue;
    threads.push({ ...row, parentId: null, replies: [] });
  }
  return threads;
}

export async function fetchStoryComments(storyIds: string[]): Promise<{ comments: StoryComment[]; error: string | null }> {
  if (!supabase) return { comments: [], error: "Supabase is not configured." };
  if (storyIds.length === 0) return { comments: [], error: null };
  const { data, error } = await supabase
    .from("story_comments")
    .select(columns)
    .in("story_id", storyIds)
    .order("created_at", { ascending: true });
  if (error) return { comments: [], error: commentError(error.message) };
  return { comments: (data ?? []).map(parseComment), error: null };
}

export async function addStoryComment(input: {
  storyId: string;
  authorId: string;
  body: string;
  parentId?: string | null;
}): Promise<{ comment: StoryComment | null; error: string | null }> {
  if (!supabase) return { comment: null, error: "Supabase is not configured." };
  const body = input.body.trim();
  if (!body) return { comment: null, error: "Write a comment first." };
  const { data, error } = await supabase
    .from("story_comments")
    .insert({
      story_id: input.storyId,
      author_id: input.authorId,
      parent_id: input.parentId ?? null,
      body,
    })
    .select(columns)
    .single();
  if (error) return { comment: null, error: commentError(error.message) };
  return { comment: parseComment(data), error: null };
}

export async function updateStoryComment(id: string, body: string): Promise<{ comment: StoryComment | null; error: string | null }> {
  if (!supabase) return { comment: null, error: "Supabase is not configured." };
  const next = body.trim();
  if (!next) return { comment: null, error: "Write a comment first." };
  const { data, error } = await supabase.from("story_comments").update({ body: next }).eq("id", id).select(columns).single();
  if (error) return { comment: null, error: commentError(error.message) };
  return { comment: parseComment(data), error: null };
}

export async function deleteStoryComment(id: string): Promise<{ comment: StoryComment | null; error: string | null }> {
  if (!supabase) return { comment: null, error: "Supabase is not configured." };
  const { data, error } = await supabase
    .from("story_comments")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id)
    .select(columns)
    .single();
  if (error) return { comment: null, error: commentError(error.message) };
  return { comment: parseComment(data), error: null };
}

function demoThread(storyId: string, comment: SampleComment): StoryThread {
  return {
    ...demoComment(storyId, comment, null),
    replies: comment.replies.map((reply) => demoComment(storyId, reply, `demo-${comment.id}`)),
  };
}

function demoComment(storyId: string, comment: SampleComment, parentId: string | null): StoryComment {
  return {
    id: `demo-${comment.id}`,
    storyId,
    authorId: "",
    parentId,
    body: comment.body,
    authorName: comment.author,
    createdAt: "",
    updatedAt: "",
    deletedAt: null,
    demo: true,
    timeLabel: comment.time,
  };
}

function commentError(message: string): string {
  if (/story_comments|sample_stories|schema cache/i.test(message)) {
    return "Comments are not saved yet. Run supabase/story_comments.sql in the Supabase SQL editor.";
  }
  if (/only the story author can reply/i.test(message)) {
    return "Replies are still limited to the story author. Run the updated supabase/story_comments.sql in the Supabase SQL editor.";
  }
  if (/replies answer one comment on the same story/i.test(message)) {
    return "A reply has to answer a comment on this same story.";
  }
  return message;
}

function parseComment(row: unknown): StoryComment {
  const record = row as {
    id?: unknown;
    story_id?: unknown;
    author_id?: unknown;
    parent_id?: unknown;
    body?: unknown;
    author_name?: unknown;
    created_at?: unknown;
    updated_at?: unknown;
    deleted_at?: unknown;
  };
  return {
    id: String(record.id ?? ""),
    storyId: String(record.story_id ?? ""),
    authorId: String(record.author_id ?? ""),
    parentId: typeof record.parent_id === "string" ? record.parent_id : null,
    body: typeof record.body === "string" ? record.body : "",
    authorName: typeof record.author_name === "string" && record.author_name.trim() ? record.author_name : "Member",
    createdAt: typeof record.created_at === "string" ? record.created_at : "",
    updatedAt: typeof record.updated_at === "string" ? record.updated_at : "",
    deletedAt: typeof record.deleted_at === "string" ? record.deleted_at : null,
    demo: false,
  };
}
