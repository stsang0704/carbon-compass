import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { CategoryGlyph } from "../components/CategoryBreakdown";
import { CommentGlyph, CheckGlyph, ChevronGlyph, HeartGlyph, PlusGlyph, Portrait, SceneArt, StatCloud, StatPeople } from "../components/Illustrations";
import { PhoneShell } from "../components/PhoneShell";
import { ProfileMark } from "../components/ProfileMark";
import { ShareStorySheet } from "../components/ShareStorySheet";
import { StoryCommentsSheet } from "../components/StoryCommentsSheet";
import type { RecId } from "../data/recommendations";
import { communityPhotoSamples, homeActivities, sampleHome, type ActivityFeed, type ActivityScene, type HomeActivity } from "../data/together";
import type { Category } from "../model/types";
import { useAuth } from "../state/auth";
import { fetchCommunityStories, type CommunityStory } from "../state/communityStories";
import { demoCommentCount, demoThreads, fetchStoryComments, type StoryComment } from "../state/storyComments";

const categoryLabel: Record<Category, string> = {
  food: "Food",
  travel: "Travel",
  home: "Home",
  stuff: "Clothing",
};

type Props = {
  selected: RecId[];
  profilePhotoUrl: string | null;
  onTry: (id: RecId) => void;
  onBrowse: (category: Category) => void;
};

const storyIds = [...new Set([...homeActivities, ...communityPhotoSamples].map((item) => item.postId))];

const sceneForCategory: Record<Category, ActivityScene> = {
  food: "salad",
  travel: "bike",
  home: "thermostat",
  stuff: "mend",
};

const recForCategory: Record<Category, RecId> = {
  food: "food-plant-meal",
  travel: "travel-walk",
  home: "home-thermostat",
  stuff: "clothes-repair",
};

type FeedCard = HomeActivity & {
  photoUrl?: string | null;
  authorId?: string;
};

export function Together({ selected, profilePhotoUrl, onTry }: Props) {
  const { session } = useAuth();
  const rootRef = useRef<HTMLDivElement>(null);
  const [feed, setFeed] = useState<ActivityFeed>("friends");
  const [hearted, setHearted] = useState<Record<string, boolean>>({});
  const [liveComments, setLiveComments] = useState<StoryComment[]>([]);
  const [commentError, setCommentError] = useState<string | null>(null);
  const [openStory, setOpenStory] = useState<FeedCard | null>(null);
  const [stories, setStories] = useState<CommunityStory[]>([]);
  const [sharing, setSharing] = useState(false);
  const [shareHost, setShareHost] = useState<HTMLElement | null>(null);
  const shared = feed === "community" ? stories.map(storyCard) : [];
  const samples = feed === "community" ? communityPhotoSamples : [];
  const saved = homeActivities
    .filter((item) => item.feed === feed)
    .map((item) => (feed === "community" ? { ...item, sample: true } : item));
  const cards: FeedCard[] = [...shared, ...samples, ...saved];
  const counts = commentCounts(liveComments, stories.map((story) => story.id));

  useEffect(() => {
    rootRef.current?.closest(".view-pane")?.scrollTo({ top: 0 });
  }, [feed]);

  useEffect(() => {
    const host = rootRef.current?.closest(".app-shell");
    setShareHost(host instanceof HTMLElement ? host : null);
  }, []);

  useEffect(() => {
    let cancel = false;
    void fetchCommunityStories().then((result) => {
      if (!cancel && !result.error) setStories(result.stories);
    });
    return () => {
      cancel = true;
    };
  }, []);

  const commentKey = [...storyIds, ...stories.map((story) => story.id)].join("|");
  useEffect(() => {
    let cancel = false;
    void fetchStoryComments(commentKey.split("|").filter(Boolean)).then((result) => {
      if (cancel) return;
      setLiveComments(result.comments);
      setCommentError(result.error);
    });
    return () => {
      cancel = true;
    };
  }, [commentKey]);

  return (
    <div className="cc-home" ref={rootRef}>
      <PhoneShell
        hero={
          <>
            <h2>Better together.</h2>
            <p className="lede">Small changes, shared journeys.</p>
          </>
        }
      >
        <article className="calc cc-sample-card" aria-label="Sample collective impact">
          <p className="quiet">Sample</p>
          <h3>Our impact together</h3>
          <div className="cc-impact-stats">
            <p>
              <StatPeople className="cc-stat-icon" />
              <span>
                <strong>{sampleHome.changesTried}</strong>
                <span>Changes tried</span>
              </span>
            </p>
            <span className="cc-rule" aria-hidden="true" />
            <p>
              <StatCloud className="cc-stat-icon" />
              <span>
                <strong>{sampleHome.avoided}</strong>
                <span>Sample estimate</span>
              </span>
            </p>
          </div>
        </article>

        <section className="rec-section cc-trying" aria-labelledby="trying-heading">
          <h3 id="trying-heading">What others are trying</h3>
          <p className="quiet">{feed === "community" ? "Posts marked Sample are examples." : "Sample stories"}</p>
          <div className="cc-trying-tools">
            <FeedMenu value={feed} onChange={setFeed} />
            {session ? (
              <button className="btn-secondary cc-share-open" type="button" onClick={() => setSharing(true)}>
                Share a change
              </button>
            ) : null}
          </div>
          <div className="cc-story-feed">
            {cards.map((card) => (
              <ActivityCard
                key={card.id}
                card={card}
                hearted={Boolean(hearted[card.id])}
                trying={selected.includes(card.recId)}
                profilePhotoUrl={card.authorId && card.authorId === session?.user.id ? profilePhotoUrl : null}
                commentCount={counts[card.postId] ?? demoCommentCount(card.postId)}
                onHeart={() => setHearted((current) => ({ ...current, [card.id]: !current[card.id] }))}
                onTry={() => onTry(card.recId)}
                onComments={() => setOpenStory(card)}
              />
            ))}
          </div>
        </section>
      </PhoneShell>
      {sharing && session
        ? createPortal(
            <ShareStorySheet
              userId={session.user.id}
              authorName={authorLabel(session.user.user_metadata?.display_name, session.user.email)}
              onClose={() => setSharing(false)}
              onPublished={(story) => {
                setStories((current) => [story, ...current.filter((item) => item.id !== story.id)]);
                setFeed("community");
                setSharing(false);
              }}
            />,
            shareHost ?? rootRef.current ?? document.body,
          )
        : null}
      {openStory ? (
        <StoryCommentsSheet
          storyId={openStory.postId}
          title={openStory.title}
          userId={session?.user.id ?? null}
          profilePhotoUrl={profilePhotoUrl}
          live={liveComments}
          demo={demoThreads(openStory.postId)}
          loadError={commentError}
          onClose={() => setOpenStory(null)}
          onLiveChange={setLiveComments}
        />
      ) : null}
    </div>
  );
}

function FeedMenu({ value, onChange }: { value: ActivityFeed; onChange: (feed: ActivityFeed) => void }) {
  const [open, setOpen] = useState(false);
  const menuId = useId();
  const label = value === "friends" ? "Friends" : "Community";

  return (
    <div className="cc-feed">
      <button
        className="cc-feed-button"
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((current) => !current)}
      >
        {label}
        <ChevronGlyph />
      </button>
      {open ? (
        <ul className="cc-feed-menu" id={menuId} role="listbox" aria-label="Whose activity">
          {(["friends", "community"] as const).map((id) => (
            <li key={id} role="presentation">
              <button
                type="button"
                role="option"
                aria-selected={value === id}
                onClick={() => {
                  onChange(id);
                  setOpen(false);
                }}
              >
                {id === "friends" ? "Friends" : "Community"}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

function ActivityCard({
  card,
  hearted,
  trying,
  commentCount,
  profilePhotoUrl,
  onHeart,
  onTry,
  onComments,
}: {
  card: FeedCard;
  hearted: boolean;
  trying: boolean;
  commentCount: number;
  profilePhotoUrl: string | null;
  onHeart: () => void;
  onTry: () => void;
  onComments: () => void;
}) {
  const encouragement = card.hearts == null ? null : card.hearts + (hearted ? 1 : 0);
  return (
    <article className={`calc cc-activity cc-activity-${card.category}`}>
      <div className="cc-card-top">
        <div className="cc-card-copy">
          {profilePhotoUrl ? (
            <span className="cc-letter has-photo">
              <ProfileMark
                url={profilePhotoUrl}
                className="cc-user-photo"
                alt=""
                fallback={<span>{card.letter ?? "?"}</span>}
              />
            </span>
          ) : card.letter ? (
            <span className="cc-letter" aria-hidden="true">
              {card.letter}
            </span>
          ) : (
            <Portrait id={card.portrait} className="cc-card-portrait" />
          )}
          <div>
            <p className="quiet">{card.sample ? `Sample · ${card.author} is trying` : `${card.author} is trying`}</p>
            <p className="plant-title">{card.title}</p>
            <span className={`rec-share-tag cc-tag cc-tag-${card.category}`}>
              <CategoryGlyph id={card.category} size={14} />
              {categoryLabel[card.category]}
            </span>
          </div>
        </div>
        {card.photoUrl ? null : <SceneArt scene={card.scene} className="cc-scene" />}
      </div>
      {card.photoUrl ? <img className="cc-story-photo" src={card.photoUrl} alt={card.photoAlt ?? card.title} /> : null}
      {card.caption ? <p className="cc-story-caption">{card.caption}</p> : null}
      <div className="cc-card-actions">
        <button
          className={`cc-heart ${hearted ? "is-on" : ""} ${encouragement != null ? "has-count" : ""}`}
          type="button"
          aria-pressed={hearted}
          aria-label={
            encouragement == null
              ? hearted
                ? `Encouragement sent to ${card.author}`
                : `Encourage ${card.author}`
              : hearted
                ? `${encouragement} encouragements, including yours, for ${card.author}`
                : `${encouragement} encouragements for ${card.author}`
          }
          onClick={onHeart}
        >
          <HeartGlyph filled={hearted} />
          {encouragement != null ? <span>{encouragement}</span> : null}
        </button>
        <button
          className={`cc-comment ${commentCount > 0 ? "has-count" : ""}`}
          type="button"
          aria-label={commentCount > 0 ? `${commentCount} comments on ${card.title}` : `Comment on ${card.title}`}
          onClick={onComments}
        >
          <CommentGlyph />
          {commentCount > 0 ? <span>{commentCount}</span> : null}
        </button>
        <button className={`btn-primary cc-try ${trying ? "is-on" : ""}`} type="button" aria-pressed={trying} onClick={onTry}>
          {trying ? <CheckGlyph /> : <PlusGlyph />}
          {trying ? "Trying this" : "Try it too"}
        </button>
      </div>
    </article>
  );
}

function commentCounts(comments: StoryComment[], extraIds: string[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const id of storyIds) counts[id] = demoCommentCount(id);
  for (const id of extraIds) counts[id] = demoCommentCount(id);
  for (const comment of comments) counts[comment.storyId] = (counts[comment.storyId] ?? 0) + 1;
  return counts;
}

function storyCard(story: CommunityStory): FeedCard {
  const letter = story.authorName.trim().slice(0, 1).toUpperCase() || "?";
  return {
    id: story.id,
    postId: story.id,
    author: story.authorName,
    portrait: "alex",
    letter,
    authorId: story.authorId,
    title: story.title,
    caption: story.caption,
    photoUrl: story.photoUrl,
    category: story.category,
    recId: recForCategory[story.category],
    scene: sceneForCategory[story.category],
    feed: "community",
  };
}

function authorLabel(name: unknown, email: string | undefined): string {
  if (typeof name === "string" && name.trim()) return name.trim();
  const local = email?.split("@")[0]?.trim();
  return local || "You";
}

