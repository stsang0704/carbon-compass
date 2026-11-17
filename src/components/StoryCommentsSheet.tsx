import { useEffect, useState, type FormEvent } from "react";
import { createPortal } from "react-dom";
import {
  addStoryComment,
  deleteStoryComment,
  groupComments,
  updateStoryComment,
  type StoryComment,
  type StoryThread,
} from "../state/storyComments";

type Props = {
  storyId: string;
  title: string;
  userId: string | null;
  live: StoryComment[];
  demo: StoryThread[];
  loadError: string | null;
  onClose: () => void;
  onLiveChange: (comments: StoryComment[]) => void;
};

export function StoryCommentsSheet({
  storyId,
  title,
  userId,
  live,
  demo,
  loadError,
  onClose,
  onLiveChange,
}: Props) {
  const [draft, setDraft] = useState("");
  const [replyTo, setReplyTo] = useState<StoryComment | null>(null);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState("");
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const threads = groupComments(live.filter((comment) => comment.storyId === storyId));
  const shell = document.querySelector('.destination[aria-label="Together"]');
  const canReply = Boolean(userId);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!userId) {
      setError("Sign in to comment.");
      return;
    }
    setSending(true);
    setError(null);
    const result = await addStoryComment({
      storyId,
      authorId: userId,
      body: draft,
      parentId: replyTo?.id ?? null,
    });
    setSending(false);
    if (result.error || !result.comment) {
      setError(result.error ?? "The comment was not saved.");
      return;
    }
    onLiveChange([...live, result.comment]);
    setDraft("");
    setReplyTo(null);
  }

  async function saveEdit(id: string) {
    setSending(true);
    setError(null);
    const result = await updateStoryComment(id, editDraft);
    setSending(false);
    if (result.error || !result.comment) {
      setError(result.error ?? "The comment was not updated.");
      return;
    }
    const saved = result.comment;
    onLiveChange(live.map((comment) => (comment.id === id ? saved : comment)));
    setEditingId(null);
  }

  async function remove(id: string) {
    setSending(true);
    setError(null);
    const result = await deleteStoryComment(id);
    setSending(false);
    if (result.error || !result.comment) {
      setError(result.error ?? "The comment was not deleted.");
      return;
    }
    const saved = result.comment;
    onLiveChange(live.map((comment) => (comment.id === id ? saved : comment)));
    setConfirmDeleteId(null);
  }

  const sheet = (
    <div className="story-sheet-layer">
      <button className="story-sheet-backdrop" type="button" aria-label="Close comments" onClick={onClose} />
      <section className="story-sheet" role="dialog" aria-modal="true" aria-labelledby="story-comments-title">
        <header className="story-sheet-head">
          <div>
            <p className="quiet">Sample story</p>
            <h3 id="story-comments-title">{title}</h3>
          </div>
          <button className="story-sheet-close" type="button" onClick={onClose} aria-label="Close">
            ×
          </button>
        </header>
        <div className="story-sheet-scroll">
          <p className="quiet">
            Notes marked Demo are sample text, not messages from real people. Anyone signed in can reply to member comments.
          </p>
          {loadError ? <p className="auth-error">{loadError}</p> : null}
          {demo.length > 0 ? (
            <div className="story-thread-group">
              <h4>Demo notes</h4>
              {demo.map((thread) => (
                <CommentThread key={thread.id} thread={thread} userId={null} />
              ))}
            </div>
          ) : null}
          <div className="story-thread-group">
            <h4>From members</h4>
            {threads.length === 0 ? <p className="quiet">No member comments yet.</p> : null}
            {threads.map((thread) => (
              <CommentThread
                key={thread.id}
                thread={thread}
                userId={userId}
                canReply={canReply}
                onReply={setReplyTo}
                editingId={editingId}
                editDraft={editDraft}
                confirmDeleteId={confirmDeleteId}
                onEditDraft={setEditDraft}
                onStartEdit={(comment) => {
                  setEditingId(comment.id);
                  setEditDraft(comment.body);
                  setConfirmDeleteId(null);
                }}
                onCancelEdit={() => setEditingId(null)}
                onSaveEdit={saveEdit}
                onAskDelete={setConfirmDeleteId}
                onDelete={remove}
              />
            ))}
          </div>
        </div>
        <form className="story-composer" onSubmit={submit}>
          {replyTo ? (
            <p className="story-replying">
              Replying to {replyTo.deletedAt ? "a deleted comment" : replyTo.authorName}
              <button className="text-button" type="button" onClick={() => setReplyTo(null)}>
                Cancel
              </button>
            </p>
          ) : null}
          {error ? <p className="auth-error">{error}</p> : null}
          <label className="story-composer-field">
            <textarea
              aria-label="Comment"
              value={draft}
              maxLength={500}
              rows={2}
              placeholder="Ask a question or share an idea..."
              onChange={(event) => setDraft(event.target.value)}
            />
          </label>
          <button className="btn-primary" type="submit" disabled={sending || draft.trim().length === 0 || !userId}>
            {sending ? "Sending…" : "Send"}
          </button>
        </form>
      </section>
    </div>
  );

  return createPortal(sheet, shell ?? document.body);
}

function CommentThread({
  thread,
  userId,
  canReply,
  onReply,
  editingId,
  editDraft,
  confirmDeleteId,
  onEditDraft,
  onStartEdit,
  onCancelEdit,
  onSaveEdit,
  onAskDelete,
  onDelete,
}: {
  thread: StoryThread;
  userId: string | null;
  canReply?: boolean;
  onReply?: (comment: StoryComment) => void;
  editingId?: string | null;
  editDraft?: string;
  confirmDeleteId?: string | null;
  onEditDraft?: (value: string) => void;
  onStartEdit?: (comment: StoryComment) => void;
  onCancelEdit?: () => void;
  onSaveEdit?: (id: string) => void;
  onAskDelete?: (id: string | null) => void;
  onDelete?: (id: string) => void;
}) {
  return (
    <article className="story-thread">
      <CommentRow
        comment={thread}
        userId={userId}
        canReply={canReply}
        onReply={onReply}
        editingId={editingId}
        editDraft={editDraft}
        confirmDeleteId={confirmDeleteId}
        onEditDraft={onEditDraft}
        onStartEdit={onStartEdit}
        onCancelEdit={onCancelEdit}
        onSaveEdit={onSaveEdit}
        onAskDelete={onAskDelete}
        onDelete={onDelete}
      />
      {thread.replies.length > 0 ? (
        <div className="story-replies">
          {thread.replies.map((reply) => (
            <CommentRow
              key={reply.id}
              comment={reply}
              userId={userId}
              editingId={editingId}
              editDraft={editDraft}
              confirmDeleteId={confirmDeleteId}
              onEditDraft={onEditDraft}
              onStartEdit={onStartEdit}
              onCancelEdit={onCancelEdit}
              onSaveEdit={onSaveEdit}
              onAskDelete={onAskDelete}
              onDelete={onDelete}
            />
          ))}
        </div>
      ) : null}
    </article>
  );
}

function CommentRow({
  comment,
  userId,
  canReply,
  onReply,
  editingId,
  editDraft,
  confirmDeleteId,
  onEditDraft,
  onStartEdit,
  onCancelEdit,
  onSaveEdit,
  onAskDelete,
  onDelete,
}: {
  comment: StoryComment;
  userId: string | null;
  canReply?: boolean;
  onReply?: (comment: StoryComment) => void;
  editingId?: string | null;
  editDraft?: string;
  confirmDeleteId?: string | null;
  onEditDraft?: (value: string) => void;
  onStartEdit?: (comment: StoryComment) => void;
  onCancelEdit?: () => void;
  onSaveEdit?: (id: string) => void;
  onAskDelete?: (id: string | null) => void;
  onDelete?: (id: string) => void;
}) {
  const deleted = Boolean(comment.deletedAt);
  const mine = Boolean(userId) && comment.authorId === userId && !comment.demo && !deleted;
  const editing = editingId === comment.id && !deleted;
  const confirming = confirmDeleteId === comment.id;
  const initial = deleted ? "" : comment.authorName.trim().charAt(0).toUpperCase() || "M";
  return (
    <div className="story-comment">
      <span className={`story-avatar ${comment.demo ? "is-demo" : ""}`} aria-hidden="true">
        {initial}
      </span>
      <div>
        <p className="story-comment-meta">
          {deleted ? null : <strong>{comment.authorName}</strong>}
          <span>{comment.demo ? comment.timeLabel : formatWhen(comment.createdAt, deleted ? comment.createdAt : comment.updatedAt)}</span>
          {comment.demo ? <span className="story-demo-tag">Demo</span> : null}
        </p>
        {editing ? (
          <div className="story-edit">
            <textarea value={editDraft ?? ""} maxLength={500} rows={3} onChange={(event) => onEditDraft?.(event.target.value)} />
            <div className="story-row-actions">
              <button className="text-button" type="button" onClick={() => onSaveEdit?.(comment.id)}>
                Save
              </button>
              <button className="text-button" type="button" onClick={onCancelEdit}>
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <p className="story-comment-body">{deleted ? "This comment was deleted" : comment.body}</p>
        )}
        {canReply && !comment.parentId && !comment.demo && !editing ? (
          <div className="story-row-actions">
            <button className="text-button" type="button" onClick={() => onReply?.(comment)}>
              Reply
            </button>
          </div>
        ) : null}
        {mine && !editing ? (
          <div className="story-row-actions">
            {confirming ? (
              <>
                <button className="text-button" type="button" onClick={() => onDelete?.(comment.id)}>
                  Delete
                </button>
                <button className="text-button" type="button" onClick={() => onAskDelete?.(null)}>
                  Keep
                </button>
              </>
            ) : (
              <>
                <button className="text-button" type="button" onClick={() => onStartEdit?.(comment)}>
                  Edit
                </button>
                <button className="text-button" type="button" onClick={() => onAskDelete?.(comment.id)}>
                  Delete
                </button>
              </>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function formatWhen(createdAt: string, updatedAt: string): string {
  const created = new Date(createdAt);
  if (Number.isNaN(created.getTime())) return "";
  const edited = updatedAt && updatedAt !== createdAt;
  const delta = Date.now() - created.getTime();
  const minutes = Math.round(delta / 60000);
  let label = "Just now";
  if (minutes >= 1 && minutes < 60) label = `${minutes}m ago`;
  else if (minutes >= 60 && minutes < 60 * 24) label = `${Math.round(minutes / 60)}h ago`;
  else if (minutes >= 60 * 24 && minutes < 60 * 24 * 7) label = `${Math.round(minutes / (60 * 24))}d ago`;
  else if (minutes >= 60 * 24 * 7) label = created.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  return edited ? `${label} · edited` : label;
}
