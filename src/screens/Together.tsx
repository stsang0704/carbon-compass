import { useEffect, useId, useRef, useState } from "react";
import { CategoryGlyph } from "../components/CategoryBreakdown";
import { CommentGlyph, CheckGlyph, ChevronGlyph, HeartGlyph, PlusGlyph, Portrait, SceneArt, StatCloud, StatLeaf, StatPeople } from "../components/Illustrations";
import { PhoneShell } from "../components/PhoneShell";
import { StoryCommentsSheet } from "../components/StoryCommentsSheet";
import type { RecId } from "../data/recommendations";
import { homeActivities, sampleHome, type ActivityFeed, type HomeActivity } from "../data/together";
import type { Category } from "../model/types";
import { useAuth } from "../state/auth";
import { demoCommentCount, demoThreads, fetchStoryComments, type StoryComment } from "../state/storyComments";

const categoryLabel: Record<Category, string> = {
  food: "Food",
  travel: "Travel",
  home: "Home",
  stuff: "Clothing",
};

type Props = {
  selected: RecId[];
  onTry: (id: RecId) => void;
  onBrowse: (category: Category) => void;
};

const storyIds = [...new Set(homeActivities.map((item) => item.postId))];

export function Together({ selected, onTry, onBrowse }: Props) {
  const { session } = useAuth();
  const rootRef = useRef<HTMLDivElement>(null);
  const [feed, setFeed] = useState<ActivityFeed>("friends");
  const [hearted, setHearted] = useState<Record<string, boolean>>({});
  const [liveComments, setLiveComments] = useState<StoryComment[]>([]);
  const [commentError, setCommentError] = useState<string | null>(null);
  const [openStory, setOpenStory] = useState<HomeActivity | null>(null);
  const cards = homeActivities.filter((item) => item.feed === feed);

  useEffect(() => {
    rootRef.current?.closest(".view-pane")?.scrollTo({ top: 0 });
  }, [feed]);

  useEffect(() => {
    let cancel = false;
    void fetchStoryComments(storyIds).then((result) => {
      if (cancel) return;
      setLiveComments(result.comments);
      setCommentError(result.error);
    });
    return () => {
      cancel = true;
    };
  }, []);

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
        <article className="calc cc-sample-card" aria-label="Sample community snapshot">
          <p className="quiet">Sample</p>
          <div className="cc-snapshot-row">
            <div className="cc-avatars">
              <Portrait id="maya" />
              <Portrait id="alex" />
              <Portrait id="sam" />
              <span className="cc-more">+{sampleHome.moreFriends}</span>
            </div>
            <span className="cc-rule" aria-hidden="true" />
            <div className="cc-stats">
              <p>
                <StatPeople className="cc-stat-icon" />
                <span>
                  <strong>{sampleHome.friends}</strong>
                  <span>Friends</span>
                </span>
              </p>
              <p>
                <StatLeaf className="cc-stat-icon" />
                <span>
                  <strong>{sampleHome.changesTried}</strong>
                  <span>Changes tried</span>
                </span>
              </p>
            </div>
          </div>
        </article>

        <section className="rec-section" aria-labelledby="trying-heading">
          <div className="cc-block-head">
            <div>
              <h3 id="trying-heading">What others are trying</h3>
              <p className="quiet">Sample stories</p>
            </div>
            <FeedMenu value={feed} onChange={setFeed} />
          </div>
          <ActivityCarousel
            key={feed}
            cards={cards}
            hearted={hearted}
            selected={selected}
            commentCounts={commentCounts(liveComments)}
            onHeart={(id) => setHearted((current) => ({ ...current, [id]: !current[id] }))}
            onTry={onTry}
            onComments={setOpenStory}
          />
        </section>

        <section className="rec-section" aria-labelledby="new-heading">
          <h3 id="new-heading">Try something new</h3>
          <div className="category-tiles">
            <CategoryTile category="food" label="Food" onBrowse={onBrowse} />
            <CategoryTile category="travel" label="Travel" onBrowse={onBrowse} />
            <CategoryTile category="home" label="Home" onBrowse={onBrowse} />
            <CategoryTile category="stuff" label="Clothing" onBrowse={onBrowse} />
          </div>
        </section>

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
      </PhoneShell>
      {openStory ? (
        <StoryCommentsSheet
          storyId={openStory.postId}
          title={openStory.title}
          userId={session?.user.id ?? null}
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

function ActivityCarousel({
  cards,
  hearted,
  selected,
  commentCounts,
  onHeart,
  onTry,
  onComments,
}: {
  cards: HomeActivity[];
  hearted: Record<string, boolean>;
  selected: RecId[];
  commentCounts: Record<string, number>;
  onHeart: (id: string) => void;
  onTry: (id: RecId) => void;
  onComments: (card: HomeActivity) => void;
}) {
  const [index, setIndex] = useState(0);
  const safe = Math.min(index, Math.max(cards.length - 1, 0));
  const card = cards[safe];
  if (!card) return null;

  return (
    <div className="cc-carousel">
      <ActivityCard
        card={card}
        hearted={Boolean(hearted[card.id])}
        trying={selected.includes(card.recId)}
        commentCount={commentCounts[card.postId] ?? demoCommentCount(card.postId)}
        onHeart={() => onHeart(card.id)}
        onTry={() => onTry(card.recId)}
        onComments={() => onComments(card)}
      />
      <div className="cc-dots" role="tablist" aria-label="Sample activities">
        {cards.map((item, dot) => (
          <button
            key={item.id}
            className={dot === safe ? "is-active" : ""}
            type="button"
            role="tab"
            aria-selected={dot === safe}
            aria-label={`${item.author} is trying ${item.title}`}
            onClick={() => setIndex(dot)}
          />
        ))}
      </div>
    </div>
  );
}

function ActivityCard({
  card,
  hearted,
  trying,
  commentCount,
  onHeart,
  onTry,
  onComments,
}: {
  card: HomeActivity;
  hearted: boolean;
  trying: boolean;
  commentCount: number;
  onHeart: () => void;
  onTry: () => void;
  onComments: () => void;
}) {
  return (
    <article className={`calc cc-activity cc-activity-${card.category}`}>
      <div className="cc-card-top">
        <div className="cc-card-copy">
          <Portrait id={card.portrait} className="cc-card-portrait" />
          <div>
            <p className="quiet">{card.author} is trying</p>
            <p className="plant-title">{card.title}</p>
            <span className={`rec-share-tag cc-tag cc-tag-${card.category}`}>
              <CategoryGlyph id={card.category} size={14} />
              {categoryLabel[card.category]}
            </span>
          </div>
        </div>
        <SceneArt scene={card.scene} className="cc-scene" />
      </div>
      <div className="cc-card-actions">
        <button
          className={`cc-heart ${hearted ? "is-on" : ""}`}
          type="button"
          aria-pressed={hearted}
          aria-label={hearted ? `Encouragement sent to ${card.author}` : `Encourage ${card.author}`}
          onClick={onHeart}
        >
          <HeartGlyph filled={hearted} />
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

function commentCounts(comments: StoryComment[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const id of storyIds) counts[id] = demoCommentCount(id);
  for (const comment of comments) counts[comment.storyId] = (counts[comment.storyId] ?? 0) + 1;
  return counts;
}

function CategoryTile({
  category,
  label,
  onBrowse,
}: {
  category: Category;
  label: string;
  onBrowse: (category: Category) => void;
}) {
  return (
    <button className={`category-tile category-tile-${category}`} type="button" onClick={() => onBrowse(category)}>
      <CategoryGlyph id={category} size={22} />
      {label}
    </button>
  );
}
