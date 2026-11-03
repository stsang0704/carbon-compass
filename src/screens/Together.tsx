import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import {
  Car,
  ChartColumn,
  ChevronLeft,
  ChevronRight,
  Droplet,
  Heart,
  House,
  Info,
  Leaf,
  MessageCircle,
  MoreHorizontal,
  Send,
  Shirt,
  TreeDeciduous,
  UserRoundPlus,
  UsersRound,
  type LucideIcon,
} from "lucide-react";
import {
  clonePosts,
  communityStats,
  sampleCircle,
  samplePosts,
  storyKindLabel,
  type AvatarTone,
  type SampleComment,
  type SamplePost,
} from "../data/together";
import { recommendationById } from "../data/recommendations";
import {
  canShowTrees,
  formatCarbon,
  formatEnergy,
  formatGasolineGallons,
  formatTreeCount,
  formatWater,
} from "../model/format";
import type { Category } from "../model/types";

type LiveComment = {
  id: string;
  author: string;
  initial: string;
  tone: AvatarTone;
  time: string;
  body: string;
  hearts: number;
  hearted: boolean;
  replies: LiveComment[];
};
type LivePost = Omit<SamplePost, "comments"> & {
  hearted: boolean;
  encouraged: boolean;
  comments: LiveComment[];
};

type Screen = "home" | "post" | "communities";
type Origin = "home" | "communities";

const categories: Category[] = ["food", "travel", "home", "stuff"];

const categoryVisual: Record<Category, { label: string; icon: LucideIcon }> = {
  food: { label: "Food", icon: Leaf },
  travel: { label: "Travel", icon: Car },
  home: { label: "Home", icon: House },
  stuff: { label: "Clothing", icon: Shirt },
};

type Props = {
  onSeeChange: (category: Category) => void;
};

export function Together({ onSeeChange }: Props) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [posts, setPosts] = useState<LivePost[]>(() => clonePosts(samplePosts).map(toLive));
  const [screen, setScreen] = useState<Screen>("home");
  const [origin, setOrigin] = useState<Origin>("home");
  const [postId, setPostId] = useState<string | null>(null);
  const [community, setCommunity] = useState<Category | "all">("all");
  const [showAllActivity, setShowAllActivity] = useState(false);
  const [impactOpen, setImpactOpen] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);

  useEffect(() => {
    rootRef.current?.closest(".view-pane")?.scrollTo({ top: 0 });
  }, [screen, postId, community]);

  const post = posts.find((item) => item.id === postId) ?? null;
  const circle = new Set<string>(sampleCircle.friendNames);
  const exploringCount = posts.filter((item) => item.countsAsExploring && circle.has(item.author)).length;
  const activity = posts.filter((item) => item.inActivity);
  const visibleActivity = showAllActivity ? activity : activity.slice(0, 3);

  function openPost(id: string, from: Origin) {
    setOrigin(from);
    setPostId(id);
    setScreen("post");
  }

  function openCommunities(next: Category | "all") {
    setCommunity(next);
    setScreen("communities");
  }

  function updatePost(id: string, change: (current: LivePost) => LivePost) {
    setPosts((current) => current.map((item) => (item.id === id ? change(item) : item)));
  }

  return (
    <div className="together" ref={rootRef}>
      {screen === "home" ? (
        <TogetherHome
          activity={visibleActivity}
          canShowAll={activity.length > 3 && !showAllActivity}
          exploringCount={exploringCount}
          impactOpen={impactOpen}
          inviteOpen={inviteOpen}
          onImpact={() => setImpactOpen((open) => !open)}
          onInvite={() => setInviteOpen((open) => !open)}
          onOpenPost={(id) => openPost(id, "home")}
          onSeeAll={() => setShowAllActivity(true)}
          onCommunity={openCommunities}
        />
      ) : null}
      {screen === "communities" ? (
        <Communities
          posts={posts.filter((item) => item.inCommunity)}
          category={community}
          onCategory={setCommunity}
          onBack={() => setScreen("home")}
          onOpenPost={(id) => openPost(id, "communities")}
        />
      ) : null}
      {screen === "post" && post ? (
        <PostDetail
          post={post}
          onBack={() => setScreen(origin)}
          onSeeChange={onSeeChange}
          onHeart={() =>
            updatePost(post.id, (current) => ({
              ...current,
              hearted: !current.hearted,
              hearts: current.hearts + (current.hearted ? -1 : 1),
            }))
          }
          onEncourage={() =>
            updatePost(post.id, (current) => ({ ...current, encouraged: !current.encouraged }))
          }
          onHeartComment={(commentId) =>
            updatePost(post.id, (current) => ({
              ...current,
              comments: mapComments(current.comments, commentId, (comment) => ({
                ...comment,
                hearted: !comment.hearted,
                hearts: comment.hearts + (comment.hearted ? -1 : 1),
              })),
            }))
          }
          onComment={(body, parentId) =>
            updatePost(post.id, (current) => ({
              ...current,
              comments: parentId
                ? addReply(current.comments, parentId, newComment(body))
                : [...current.comments, newComment(body)],
            }))
          }
        />
      ) : null}
    </div>
  );
}

function TogetherHome({
  activity,
  canShowAll,
  exploringCount,
  impactOpen,
  inviteOpen,
  onImpact,
  onInvite,
  onOpenPost,
  onSeeAll,
  onCommunity,
}: {
  activity: LivePost[];
  canShowAll: boolean;
  exploringCount: number;
  impactOpen: boolean;
  inviteOpen: boolean;
  onImpact: () => void;
  onInvite: () => void;
  onOpenPost: (id: string) => void;
  onSeeAll: () => void;
  onCommunity: (category: Category | "all") => void;
}) {
  const achieved = formatCarbon(sampleCircle.achievedCarbonKg);
  const potential = formatCarbon(sampleCircle.potentialCarbonKg);
  const water = formatWater(sampleCircle.waterLiters);
  const energy = formatEnergy(sampleCircle.energyKwh);
  const trees = canShowTrees(sampleCircle.achievedCarbonKg)
    ? formatTreeCount(sampleCircle.achievedCarbonKg)
    : "";
  const gallons = formatGasolineGallons(sampleCircle.achievedCarbonKg);

  return (
    <>
      <header className="together-home-head">
        <div>
          <h2>Together</h2>
          <p className="together-sub">Small changes feel bigger together.</p>
        </div>
        <button
          className="together-icon-btn"
          type="button"
          aria-expanded={inviteOpen}
          aria-label="About inviting friends"
          onClick={onInvite}
        >
          <UserRoundPlus size={22} strokeWidth={1.75} absoluteStrokeWidth />
        </button>
      </header>
      {inviteOpen ? (
        <p className="together-note">
          Inviting people is not part of this prototype. The friends here are sample characters, not connected accounts.
        </p>
      ) : null}

      <section className="together-impact" aria-labelledby="collective-impact">
        <div className="together-impact-title">
          <h3 id="collective-impact">Our collective impact</h3>
          <button
            className="together-info"
            type="button"
            aria-expanded={impactOpen}
            aria-label="How to read this sample"
            onClick={onImpact}
          >
            <Info size={15} strokeWidth={1.75} absoluteStrokeWidth />
          </button>
        </div>
        <div className="together-impact-hero">
          <div>
            <p className="together-impact-value">
              {achieved.value} <span>{achieved.unit} CO₂e</span>
            </p>
            <p className="together-impact-line">A sample of emissions saved together this month.</p>
          </div>
          <ImpactScene />
        </div>
        <p className="together-potential">
          {potential.value} {potential.unit} CO₂e is still only potential. Exploring a change is not counted above.
        </p>
        <div className="together-metrics">
          {trees ? <Metric icon={TreeDeciduous} value={trees} label="trees worth" /> : null}
          <Metric icon={Car} value={gallons} label="gallons of gas" />
          <Metric icon={Droplet} value={water.value} label="liters of water" />
        </div>
        {impactOpen ? (
          <p className="together-note together-note-in">
            These figures are a sample illustration, not your progress and not verified savings. Trees use this app's
            60 kg CO₂e per urban tree. Gallons use 8.89 kg CO₂e per gallon of gasoline. Water ({water.value} {water.unit})
            and energy ({energy.value} {energy.unit}) are separate sample totals. They are not converted from the carbon
            figure. Selecting a change in Explore does not add to this number.
          </p>
        ) : null}
        <div className="together-circle">
          <span className="together-avatars" aria-hidden="true">
            {sampleCircle.friendNames.map((name) => {
              const person = samplePosts.find((item) => item.author === name);
              return (
                <span key={name} className={`together-avatar tone-${person?.tone ?? "sage"}`}>
                  {person?.initial ?? name.slice(0, 1)}
                </span>
              );
            })}
          </span>
          <p>
            <strong>{sampleCircle.friendNames.length} friends participating</strong>
            <span>{exploringCount} lifestyle changes being explored</span>
          </p>
        </div>
      </section>

      <section className="together-block" aria-labelledby="friend-activity">
        <div className="together-block-head">
          <h3 id="friend-activity">Friend activity</h3>
          {canShowAll ? (
            <button className="together-text" type="button" onClick={onSeeAll}>
              See all
            </button>
          ) : null}
        </div>
        <ul className="together-feed">
          {activity.map((item) => (
            <li key={item.id}>
              <button className="together-activity" type="button" onClick={() => onOpenPost(item.id)}>
                <Avatar name={item.author} initial={item.initial} tone={item.tone} />
                <span className="together-activity-copy">
                  <span className="together-activity-name">
                    {item.author} <time>{item.time}</time>
                  </span>
                  <span className="together-activity-line">
                    <KindIcon kind={item.kind} />
                    {item.activity}
                  </span>
                </span>
                <ChevronRight size={18} strokeWidth={1.75} absoluteStrokeWidth aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      </section>

      <section className="together-block" aria-labelledby="find-people">
        <div className="together-find-head">
          <span className="together-glyph together-glyph-food" aria-hidden="true">
            <UsersRound size={20} strokeWidth={1.75} absoluteStrokeWidth />
          </span>
          <div>
            <h3 id="find-people">Find your people</h3>
            <p className="together-sub">Explore topic-based communities to share experiences and get tips.</p>
          </div>
        </div>
        <div className="together-topics">
          {categories.map((id) => {
            const visual = categoryVisual[id];
            const Icon = visual.icon;
            return (
              <button key={id} className={`together-topic together-topic-${id}`} type="button" onClick={() => onCommunity(id)}>
                <span className={`together-glyph together-glyph-${id}`}>
                  <Icon size={22} strokeWidth={1.75} absoluteStrokeWidth />
                </span>
                <span className="together-topic-name">{visual.label}</span>
                <span className="together-topic-meta">{communityStats[id].posts} posts</span>
              </button>
            );
          })}
        </div>
      </section>
    </>
  );
}

function Communities({
  posts,
  category,
  onCategory,
  onBack,
  onOpenPost,
}: {
  posts: LivePost[];
  category: Category | "all";
  onCategory: (category: Category | "all") => void;
  onBack: () => void;
  onOpenPost: (id: string) => void;
}) {
  const shown = categories.filter((id) => category === "all" || id === category);

  return (
    <>
      <ScreenBar title="Communities" onBack={onBack} />
      <section className="together-banner">
        <div>
          <h3>Learn, share, and grow together.</h3>
          <p>Practical tips, questions, and stories for everyday life.</p>
        </div>
        <BannerPeople />
      </section>
      <p className="together-sample-line">Sample communities. The people and post counts are not real.</p>
      <div className="together-chips" data-no-swipe>
        <FilterChip active={category === "all"} onClick={() => onCategory("all")}>
          All
        </FilterChip>
        {categories.map((id) => (
          <FilterChip key={id} active={category === id} tone={id} onClick={() => onCategory(id)}>
            {categoryVisual[id].label}
          </FilterChip>
        ))}
      </div>
      {shown.map((id) => {
        const stories = posts.filter((item) => item.category === id);
        const featured = stories.find((item) => item.featured) ?? stories[0];
        const previews = category === "all" ? (featured ? [featured] : []) : stories;
        if (!featured || previews.length === 0) return null;
        const stats = communityStats[id];
        const visual = categoryVisual[id];
        const Icon = visual.icon;
        return (
          <article key={id} className={`together-community together-community-${id}`}>
            <button
              className="together-community-head"
              type="button"
              onClick={() => (category === "all" ? onCategory(id) : onOpenPost(featured.id))}
            >
              <span className={`together-glyph together-glyph-${id}`}>
                <Icon size={22} strokeWidth={1.75} absoluteStrokeWidth />
              </span>
              <span>
                <span className="together-community-title">{visual.label}</span>
                <span className="together-topic-meta">
                  {stats.posts} posts · {stats.members} members
                </span>
              </span>
              <ChevronRight size={18} strokeWidth={1.75} absoluteStrokeWidth aria-hidden="true" />
            </button>
            {previews.map((item) => (
              <button key={item.id} className="together-preview" type="button" onClick={() => onOpenPost(item.id)}>
                <span className="together-preview-who">
                  <Avatar name={item.author} initial={item.initial} tone={item.tone} small />
                  <span>
                    {item.author} <time>{item.time}</time>
                  </span>
                </span>
                <span className="together-preview-title">{item.title ?? item.activity}</span>
                <span className="together-preview-body">{item.body}</span>
                <span className="together-preview-stats">
                  <MessageCircle size={15} strokeWidth={1.75} absoluteStrokeWidth aria-hidden="true" />
                  {countComments(item.comments)}
                  <Heart size={15} strokeWidth={1.75} absoluteStrokeWidth aria-hidden="true" />
                  {item.hearts}
                </span>
              </button>
            ))}
          </article>
        );
      })}
    </>
  );
}

function PostDetail({
  post,
  onBack,
  onSeeChange,
  onHeart,
  onEncourage,
  onHeartComment,
  onComment,
}: {
  post: LivePost;
  onBack: () => void;
  onSeeChange: (category: Category) => void;
  onHeart: () => void;
  onEncourage: () => void;
  onHeartComment: (id: string) => void;
  onComment: (body: string, parentId: string | null) => void;
}) {
  const [draft, setDraft] = useState("");
  const [replyTo, setReplyTo] = useState<{ id: string; author: string } | null>(null);
  const [aboutOpen, setAboutOpen] = useState(false);
  const rec = post.recId ? recommendationById(post.recId) : null;

  function submit(event: FormEvent) {
    event.preventDefault();
    const body = draft.trim();
    if (!body) return;
    onComment(body, replyTo?.id ?? null);
    setDraft("");
    setReplyTo(null);
  }

  return (
    <>
      <ScreenBar
        title="Friend's Post"
        onBack={onBack}
        action={
          <button
            className="together-icon-btn"
            type="button"
            aria-expanded={aboutOpen}
            aria-label="About this sample story"
            onClick={() => setAboutOpen((open) => !open)}
          >
            <MoreHorizontal size={22} strokeWidth={1.75} absoluteStrokeWidth />
          </button>
        }
      />
      {aboutOpen ? (
        <p className="together-note">
          This is a sample story. Commenting or sending encouragement stays on this device and does not add the change
          to your plan.
        </p>
      ) : null}
      <article className="together-post">
        <header className="together-post-who">
          <Avatar name={post.author} initial={post.initial} tone={post.tone} />
          <span>
            <span className="together-activity-name">{post.author}</span>
            <time>{post.time}</time>
          </span>
        </header>
        <p className="together-change">
          <KindIcon kind={post.kind} />
          {storyKindLabel[post.kind]}
          {post.changeName ? `: ${post.changeName}` : ""}
        </p>
        {post.title ? <h3>{post.title}</h3> : null}
        <p className="together-body">{post.body}</p>
        {post.showPicture ? <TacoPicture /> : null}
        <div className="together-reactions">
          <button
            className={`together-react ${post.hearted ? "is-on" : ""}`}
            type="button"
            aria-pressed={post.hearted}
            onClick={onHeart}
          >
            <Heart size={18} strokeWidth={1.75} absoluteStrokeWidth aria-hidden="true" />
            {post.hearts}
          </button>
          <span className="together-react together-react-quiet">
            <MessageCircle size={18} strokeWidth={1.75} absoluteStrokeWidth aria-hidden="true" />
            {countComments(post.comments)}
          </span>
          <button
            className={`together-encourage ${post.encouraged ? "is-on" : ""}`}
            type="button"
            aria-pressed={post.encouraged}
            onClick={onEncourage}
          >
            {post.encouraged ? "Encouragement sent" : "Send encouragement"}
          </button>
        </div>
        {rec && post.category ? (
          <div className="together-discover">
            <p className="together-discover-note">Reading, commenting, or reacting does not add this to your plan.</p>
            <button className="together-see" type="button" onClick={() => onSeeChange(post.category as Category)}>
              See it in Explore
            </button>
          </div>
        ) : null}
      </article>

      <section className="together-comments" aria-labelledby="post-comments">
        <h3 id="post-comments">Comments</h3>
        <ul>
          {post.comments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              onHeart={onHeartComment}
              onReply={(id, author) => setReplyTo({ id, author })}
            />
          ))}
        </ul>
      </section>

      <form className="together-composer" onSubmit={submit}>
        {replyTo ? (
          <p className="together-replying">
            Replying to {replyTo.author}
            <button type="button" onClick={() => setReplyTo(null)}>
              Cancel
            </button>
          </p>
        ) : null}
        <div className="together-composer-row">
          <input
            aria-label={replyTo ? `Reply to ${replyTo.author}` : "Comment"}
            placeholder={replyTo ? `Reply to ${replyTo.author}…` : "Share a comment or ask a question…"}
            value={draft}
            data-no-swipe
            onChange={(event) => setDraft(event.target.value)}
          />
          <button className="together-send" type="submit" aria-label="Send comment" disabled={!draft.trim()}>
            <Send size={18} strokeWidth={1.75} absoluteStrokeWidth />
          </button>
        </div>
      </form>
    </>
  );
}

function CommentItem({
  comment,
  nested = false,
  onHeart,
  onReply,
}: {
  comment: LiveComment;
  nested?: boolean;
  onHeart: (id: string) => void;
  onReply: (id: string, author: string) => void;
}) {
  return (
    <li className={nested ? "is-reply" : undefined}>
      <article className="together-comment">
        <Avatar name={comment.author} initial={comment.initial} tone={comment.tone} small />
        <div>
          <p className="together-activity-name">
            {comment.author} <time>{comment.time}</time>
          </p>
          <p>{comment.body}</p>
          <p className="together-comment-actions">
            {!nested ? (
              <button type="button" onClick={() => onReply(comment.id, comment.author)}>
                Reply
              </button>
            ) : null}
            <button type="button" aria-pressed={comment.hearted} onClick={() => onHeart(comment.id)}>
              <Heart size={14} strokeWidth={1.75} absoluteStrokeWidth aria-hidden="true" />
              {comment.hearts}
            </button>
          </p>
        </div>
      </article>
      {comment.replies.length > 0 ? (
        <ul>
          {comment.replies.map((reply) => (
            <CommentItem key={reply.id} comment={reply} nested onHeart={onHeart} onReply={onReply} />
          ))}
        </ul>
      ) : null}
    </li>
  );
}

function ScreenBar({ title, onBack, action }: { title: string; onBack: () => void; action?: ReactNode }) {
  return (
    <div className="together-bar">
      <button className="together-icon-btn" type="button" onClick={onBack} aria-label="Back">
        <ChevronLeft size={24} strokeWidth={1.75} absoluteStrokeWidth />
      </button>
      <h2>{title}</h2>
      {action ?? <span className="together-icon-spacer" />}
    </div>
  );
}

function FilterChip({
  active,
  tone,
  children,
  onClick,
}: {
  active: boolean;
  tone?: Category;
  children: string;
  onClick: () => void;
}) {
  return (
    <button
      className={`together-chip ${active ? "is-active" : ""} ${tone ? `together-chip-${tone}` : ""}`}
      type="button"
      aria-pressed={active}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

function Metric({ icon: Icon, value, label }: { icon: LucideIcon; value: string; label: string }) {
  return (
    <p className="together-metric">
      <Icon size={16} strokeWidth={1.75} absoluteStrokeWidth aria-hidden="true" />
      <span>
        <strong>{value}</strong>
        <span>{label}</span>
      </span>
    </p>
  );
}

function KindIcon({ kind }: { kind: LivePost["kind"] }) {
  const Icon = kind === "tip" || kind === "question" ? MessageCircle : kind === "check-in" ? ChartColumn : Leaf;
  return <Icon className="together-kind-icon" size={15} strokeWidth={1.75} absoluteStrokeWidth aria-hidden="true" />;
}

function ImpactScene() {
  return (
    <svg className="together-scene" viewBox="0 0 96 118" aria-hidden="true">
      <circle cx="58" cy="78" r="32" fill="#c9ecd9" />
      <ellipse cx="58" cy="78" rx="14" ry="32" fill="none" stroke="#71C39E" strokeWidth="1.6" />
      <path d="M26 78h64" fill="none" stroke="#71C39E" strokeWidth="1.6" />
      <path d="M32 64c8 5 16 5 26 0" fill="none" stroke="#8fd4b4" strokeWidth="1.6" />
      <path d="M30 92c10 5 18 5 30 0" fill="none" stroke="#8fd4b4" strokeWidth="1.6" />
      <path d="M46 72c-2-18-8-28-16-40" fill="none" stroke="#32966b" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M30 34c-12-2-18-12-16-20 12 2 18 10 16 20z" fill="#71C39E" />
      <path d="M30 36c12-8 22-10 28-18-8 14-16 18-28 18z" fill="#9ad8bc" />
    </svg>
  );
}

function BannerPeople() {
  return (
    <svg className="together-people" viewBox="0 0 108 78" aria-hidden="true">
      <path d="M78 22h16a8 8 0 0 1 8 8v10a8 8 0 0 1-8 8h-8l-6 6v-6h-2a8 8 0 0 1-8-8V30a8 8 0 0 1 8-8z" fill="#e4d7f4" />
      <circle cx="34" cy="28" r="12" fill="#d7efe4" />
      <path d="M16 66c2-14 10-20 18-20s16 6 18 20" fill="#d7efe4" />
      <circle cx="58" cy="26" r="13" fill="#e7d9f6" />
      <path d="M38 66c2-16 12-22 20-22s18 6 20 22" fill="#e7d9f6" />
      <circle cx="80" cy="30" r="11" fill="#f6e3b4" />
      <path d="M64 66c2-12 10-18 16-18s14 6 16 18" fill="#f6e3b4" />
    </svg>
  );
}

function TacoPicture() {
  return (
    <div className="together-picture" role="img" aria-label="Sample illustration of tofu tacos">
      <svg viewBox="0 0 320 168" aria-hidden="true">
        <ellipse cx="160" cy="128" rx="118" ry="22" fill="#e7d3b0" />
        <ellipse cx="160" cy="118" rx="108" ry="36" fill="#fffaf3" />
        <path d="M78 96c18-34 42-48 62-48 8 22 8 48 0 78-22-6-44-16-62-30z" fill="#e2b15a" />
        <path d="M92 78c16 8 28 28 30 48-16 2-32-6-42-18 2-12 6-22 12-30z" fill="#f3d48a" />
        <circle cx="108" cy="92" r="6" fill="#c47a3a" />
        <circle cx="122" cy="100" r="5" fill="#c47a3a" />
        <circle cx="112" cy="108" r="5" fill="#a85a4a" />
        <path d="M100 86c8 2 14 8 16 14" fill="none" stroke="#7d4ea3" strokeWidth="3" strokeLinecap="round" />
        <path d="M116 84c6 6 8 14 6 20" fill="none" stroke="#6aaa72" strokeWidth="3" strokeLinecap="round" />
        <path d="M186 92c16-36 46-50 68-46-6 24-18 48-40 70-16-4-28-12-28-24z" fill="#e2b15a" />
        <path d="M204 78c18 6 30 28 32 50-18 4-34-4-46-16 2-14 6-26 14-34z" fill="#f3d48a" />
        <circle cx="214" cy="96" r="6" fill="#c47a3a" />
        <circle cx="230" cy="104" r="5" fill="#c47a3a" />
        <circle cx="220" cy="112" r="5" fill="#a85a4a" />
        <path d="M208 88c10 2 16 10 18 18" fill="none" stroke="#7d4ea3" strokeWidth="3" strokeLinecap="round" />
        <path d="M228 86c6 6 8 16 4 24" fill="none" stroke="#6aaa72" strokeWidth="3" strokeLinecap="round" />
        <path d="M248 118c10 8 16 8 24 2 2 10-6 16-16 16-8 0-14-6-8-18z" fill="#b7d36a" />
      </svg>
    </div>
  );
}

function Avatar({
  name,
  initial,
  tone,
  small = false,
}: {
  name: string;
  initial: string;
  tone: AvatarTone;
  small?: boolean;
}) {
  return (
    <span className={`together-avatar tone-${tone} ${small ? "is-small" : ""}`} aria-hidden="true" title={name}>
      {initial}
    </span>
  );
}

function toLive(post: SamplePost): LivePost {
  return { ...post, hearted: false, encouraged: false, comments: post.comments.map(toLiveComment) };
}

function toLiveComment(comment: SampleComment): LiveComment {
  return { ...comment, hearted: false, replies: comment.replies.map(toLiveComment) };
}

function newComment(body: string): LiveComment {
  return {
    id: `you-${Date.now()}`,
    author: "You",
    initial: "Y",
    tone: "mint",
    time: "Just now",
    body,
    hearts: 0,
    hearted: false,
    replies: [],
  };
}

function mapComments(comments: LiveComment[], id: string, change: (comment: LiveComment) => LiveComment): LiveComment[] {
  return comments.map((comment) => {
    if (comment.id === id) return change(comment);
    return { ...comment, replies: mapComments(comment.replies, id, change) };
  });
}

function addReply(comments: LiveComment[], parentId: string, reply: LiveComment): LiveComment[] {
  return comments.map((comment) => {
    if (comment.id === parentId) return { ...comment, replies: [...comment.replies, reply] };
    return { ...comment, replies: addReply(comment.replies, parentId, reply) };
  });
}

function countComments(comments: LiveComment[]): number {
  return comments.reduce((sum, comment) => sum + 1 + countComments(comment.replies), 0);
}
