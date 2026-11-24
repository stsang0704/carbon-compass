import { ImagePlus } from "lucide-react";
import { useEffect, useId, useState, type FormEvent } from "react";
import type { Category } from "../model/types";
import { photoFileError, publishCommunityStory, type CommunityStory } from "../state/communityStories";

const categories: { id: Category; label: string }[] = [
  { id: "food", label: "Food" },
  { id: "travel", label: "Travel" },
  { id: "home", label: "Home" },
  { id: "stuff", label: "Clothing" },
];

type Props = {
  userId: string;
  authorName: string;
  onClose: () => void;
  onPublished: (story: CommunityStory) => void;
};

export function ShareStorySheet({ userId, authorName, onClose, onPublished }: Props) {
  const titleId = useId();
  const captionId = useId();
  const fileId = useId();
  const [title, setTitle] = useState("");
  const [caption, setCaption] = useState("");
  const [category, setCategory] = useState<Category>("food");
  const [photo, setPhoto] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!photo) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(photo);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [photo]);

  function choosePhoto(file: File | null) {
    if (!file) return;
    const fileError = photoFileError(file);
    if (fileError) {
      setError(fileError);
      return;
    }
    setError(null);
    setPhoto(file);
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);
    const result = await publishCommunityStory({ userId, authorName, title, caption, category, photo });
    setBusy(false);
    if (result.error || !result.story) {
      setError(result.error ?? "The story could not be shared.");
      return;
    }
    onPublished(result.story);
  }

  return (
    <div className="story-sheet-layer">
      <button className="story-sheet-backdrop" type="button" aria-label="Close share sheet" onClick={onClose} />
      <form className="story-sheet cc-share-sheet" onSubmit={submit}>
        <header className="story-sheet-head">
          <div>
            <p className="quiet">Optional photo</p>
            <h3>Share a change</h3>
          </div>
          <button className="story-sheet-close" type="button" onClick={onClose} aria-label="Close">
            ×
          </button>
        </header>
        <div className="story-sheet-scroll">
          <label className="cc-share-field" htmlFor={titleId}>
            Title
            <input
              id={titleId}
              value={title}
              maxLength={80}
              required
              placeholder="What are you trying?"
              onChange={(event) => setTitle(event.target.value)}
            />
          </label>
          <div className="cc-share-categories" role="group" aria-label="Category">
            {categories.map((item) => (
              <button
                key={item.id}
                className={`cc-share-category ${category === item.id ? "is-on" : ""}`}
                type="button"
                aria-pressed={category === item.id}
                onClick={() => setCategory(item.id)}
              >
                {item.label}
              </button>
            ))}
          </div>
          <label className="cc-share-field" htmlFor={captionId}>
            Caption
            <textarea
              id={captionId}
              value={caption}
              maxLength={280}
              rows={3}
              placeholder="Add a note, or leave this blank"
              onChange={(event) => setCaption(event.target.value)}
            />
          </label>
          <div className="cc-share-photo">
            <input
              id={fileId}
              className="cc-share-file"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={(event) => {
                choosePhoto(event.target.files?.[0] ?? null);
                event.target.value = "";
              }}
            />
            <label className="cc-photo-button" htmlFor={fileId}>
              <ImagePlus size={18} strokeWidth={1.75} aria-hidden="true" />
              {photo ? "Replace photo" : "Add a photo"}
            </label>
            {previewUrl ? (
              <figure className="cc-photo-preview">
                <img src={previewUrl} alt="Selected photo preview" />
                <button className="text-button" type="button" onClick={() => setPhoto(null)}>
                  Remove photo
                </button>
              </figure>
            ) : (
              <p className="quiet">A photo is optional. JPEG, PNG, or WebP, under 5 MB.</p>
            )}
          </div>
          {error ? <p className="cc-share-error">{error}</p> : null}
        </div>
        <div className="cc-share-submit">
          <button className="btn-primary" type="submit" disabled={busy || title.trim().length === 0}>
            {busy ? "Sharing…" : "Share"}
          </button>
        </div>
      </form>
    </div>
  );
}
