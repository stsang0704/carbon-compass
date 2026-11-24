import type { RecId } from "./recommendations";
import type { Category } from "../model/types";

/** Fictional circle shown on the collective card. Not the signed-in person. */
export const sampleCircle = {
  achievedCarbonKg: 245,
  potentialCarbonKg: 80,
  waterLiters: 31_000,
  energyKwh: 420,
  friendNames: ["Alex", "Jamie", "Lina", "Maya"],
} as const;

export const communityStats: Record<Category, { posts: number; members: number }> = {
  food: { posts: 128, members: 412 },
  travel: { posts: 64, members: 231 },
  home: { posts: 52, members: 168 },
  stuff: { posts: 37, members: 144 },
};

export type AvatarTone = "sage" | "sand" | "lilac" | "rose" | "mint" | "sky";

export type StoryKind = "exploring" | "tip" | "check-in" | "question" | "experience";

export type SampleComment = {
  id: string;
  author: string;
  initial: string;
  tone: AvatarTone;
  time: string;
  body: string;
  hearts: number;
  replies: SampleComment[];
};

export type SamplePost = {
  id: string;
  author: string;
  initial: string;
  tone: AvatarTone;
  time: string;
  category: Category | null;
  kind: StoryKind;
  /** Shown on the activity card. */
  activity: string;
  /** Short name used beside the story kind, such as "Meatless Monday". */
  changeName?: string;
  /** Counted in "changes being explored" for the sample circle. Not an achieved reduction. */
  countsAsExploring: boolean;
  recId?: RecId;
  title?: string;
  body: string;
  showPicture?: boolean;
  hearts: number;
  inActivity: boolean;
  inCommunity: boolean;
  featured?: boolean;
  comments: SampleComment[];
};

export const storyKindLabel: Record<StoryKind, string> = {
  exploring: "Trying a change",
  tip: "A tip",
  "check-in": "A check-in",
  question: "A question",
  experience: "An experience",
};

export const samplePosts: SamplePost[] = [
  {
    id: "alex-monday",
    author: "Alex",
    initial: "A",
    tone: "sage",
    time: "2h ago",
    category: "food",
    kind: "exploring",
    activity: "Started trying Meatless Monday",
    changeName: "Meatless Monday",
    countsAsExploring: true,
    recId: "food-meatless-monday",
    body: "I tried tofu tacos for the first time. Honestly it was easier and tastier than I expected. Does anyone have other easy recipes they recommend?",
    showPicture: true,
    hearts: 12,
    inActivity: true,
    inCommunity: true,
    comments: [
      {
        id: "jamie-on-alex",
        author: "Jamie",
        initial: "J",
        tone: "sand",
        time: "1h ago",
        body: "These sound so good. I love using chickpeas for tacos too. Super easy and affordable.",
        hearts: 3,
        replies: [
          {
            id: "alex-on-jamie",
            author: "Alex",
            initial: "A",
            tone: "sage",
            time: "45m ago",
            body: "Chickpeas are a great idea. I will try that next Monday.",
            hearts: 1,
            replies: [],
          },
        ],
      },
      {
        id: "lina-on-alex",
        author: "Lina",
        initial: "L",
        tone: "lilac",
        time: "1h ago",
        body: "I have been doing Meatless Monday for a few weeks. Happy to share a couple of easy recipes if you want them.",
        hearts: 2,
        replies: [],
      },
      {
        id: "maya-on-alex",
        author: "Maya",
        initial: "M",
        tone: "rose",
        time: "45m ago",
        body: "I am thinking of trying this. Thanks for sharing what it was actually like.",
        hearts: 1,
        replies: [],
      },
    ],
  },
  {
    id: "jamie-waste",
    author: "Jamie",
    initial: "J",
    tone: "sand",
    time: "5h ago",
    category: "food",
    kind: "tip",
    activity: "Shared a tip for reducing food waste",
    changeName: "reducing food waste",
    countsAsExploring: true,
    recId: "food-waste-less",
    body: "I started putting a smaller serving out and keeping the rest for the next day. Less goes in the bin, and tomorrow's lunch is already started.",
    hearts: 6,
    inActivity: true,
    inCommunity: true,
    comments: [
      {
        id: "lina-on-jamie",
        author: "Lina",
        initial: "L",
        tone: "lilac",
        time: "3h ago",
        body: "The smaller serving idea is the part I can picture doing on a weeknight.",
        hearts: 1,
        replies: [],
      },
    ],
  },
  {
    id: "lina-october",
    author: "Lina",
    initial: "L",
    tone: "lilac",
    time: "1d ago",
    category: null,
    kind: "check-in",
    activity: "Checked in for October",
    countsAsExploring: false,
    body: "October check-in is in. I kept the changes that already felt easy and left the rest for later. It is a note to myself, not a score.",
    hearts: 4,
    inActivity: true,
    inCommunity: false,
    comments: [
      {
        id: "alex-on-lina",
        author: "Alex",
        initial: "A",
        tone: "sage",
        time: "20h ago",
        body: "I like that you kept the easy ones. That is the pace I am trying for too.",
        hearts: 1,
        replies: [],
      },
    ],
  },
  {
    id: "maya-repair",
    author: "Maya",
    initial: "M",
    tone: "rose",
    time: "2d ago",
    category: "stuff",
    kind: "exploring",
    activity: "Started trying a sweater repair",
    changeName: "a sweater repair",
    countsAsExploring: true,
    recId: "clothes-repair",
    title: "Mending instead of replacing",
    body: "I sewed up a small hole in a sweater I already love. It took one evening, and I did not need a new one. If you have tried a simple mend, I would like to hear what worked.",
    hearts: 5,
    inActivity: true,
    inCommunity: true,
    featured: true,
    comments: [
      {
        id: "jamie-on-maya",
        author: "Jamie",
        initial: "J",
        tone: "sand",
        time: "1d ago",
        body: "A ladder stitch worked on a sock for me. Nothing fancy, and it held.",
        hearts: 2,
        replies: [],
      },
    ],
  },
  {
    id: "sarah-meals",
    author: "Sarah",
    initial: "S",
    tone: "mint",
    time: "3h ago",
    category: "food",
    kind: "question",
    activity: "Asked for easy plant-based meals",
    changeName: "a plant-based meal",
    countsAsExploring: false,
    recId: "food-plant-meal",
    title: "Easy plant-based meal ideas?",
    body: "I am trying to eat less meat, and I am running out of ideas. What are some of your go-to meals that are quick and affordable?",
    hearts: 24,
    inActivity: false,
    inCommunity: true,
    featured: true,
    comments: [
      {
        id: "alex-on-sarah",
        author: "Alex",
        initial: "A",
        tone: "sage",
        time: "2h ago",
        body: "Tofu tacos have been my easiest one so far. Beans, salsa, and whatever vegetables are already in the fridge.",
        hearts: 4,
        replies: [],
      },
    ],
  },
  {
    id: "kevin-flights",
    author: "Kevin",
    initial: "K",
    tone: "lilac",
    time: "1d ago",
    category: "travel",
    kind: "question",
    activity: "Asked about flying less",
    changeName: "fewer flights",
    countsAsExploring: false,
    recId: "travel-flights",
    title: "Tips for flying less?",
    body: "I love traveling and want to be more mindful about flights. How do you plan a trip, or find a closer alternative, without feeling like you have to stop traveling?",
    hearts: 17,
    inActivity: false,
    inCommunity: true,
    featured: true,
    comments: [
      {
        id: "lina-on-kevin",
        author: "Lina",
        initial: "L",
        tone: "sky",
        time: "18h ago",
        body: "I pick one trip I really want and make the others a train ride or a weekend closer to home. It still feels like a trip.",
        hearts: 3,
        replies: [],
      },
    ],
  },
  {
    id: "sam-thermostat",
    author: "Sam",
    initial: "S",
    tone: "sand",
    time: "3d ago",
    category: "home",
    kind: "experience",
    activity: "Tried a slightly cooler evening",
    changeName: "a cooler evening",
    countsAsExploring: false,
    recId: "home-thermostat",
    title: "A slightly cooler evening",
    body: "I turned the heat down a little in the evening. The apartment is still comfortable, and a sweater was enough. It felt like a small next step, not a test.",
    hearts: 9,
    inActivity: false,
    inCommunity: true,
    featured: true,
    comments: [
      {
        id: "maya-on-sam",
        author: "Maya",
        initial: "M",
        tone: "rose",
        time: "2d ago",
        body: "The sweater part is what made it feel doable to me.",
        hearts: 1,
        replies: [],
      },
    ],
  },
  {
    id: "nora-soup",
    author: "Nora",
    initial: "N",
    tone: "mint",
    time: "1h ago",
    category: "food",
    kind: "experience",
    activity: "Shared a Sunday soup",
    changeName: "a plant-based meal",
    countsAsExploring: false,
    recId: "food-plant-meal",
    title: "Sunday soup",
    body: "Made a big pot of carrot soup on Sunday. We ate it for three dinners, and I did not order takeout once.",
    showPicture: true,
    hearts: 21,
    inActivity: false,
    inCommunity: true,
    comments: [
      {
        id: "elena-on-nora",
        author: "Elena",
        initial: "E",
        tone: "rose",
        time: "40m ago",
        body: "That sounds cozy. Did you freeze any of it?",
        hearts: 2,
        replies: [
          {
            id: "nora-on-elena",
            author: "Nora",
            initial: "N",
            tone: "mint",
            time: "25m ago",
            body: "Two containers. Thursday lunch is already handled.",
            hearts: 1,
            replies: [],
          },
        ],
      },
      {
        id: "owen-on-nora",
        author: "Owen",
        initial: "O",
        tone: "sand",
        time: "30m ago",
        body: "I did a bean soup last week and it lasted forever.",
        hearts: 1,
        replies: [],
      },
    ],
  },
  {
    id: "chris-bike",
    author: "Chris",
    initial: "C",
    tone: "sky",
    time: "4h ago",
    category: "travel",
    kind: "experience",
    activity: "Biked a short errand",
    changeName: "a short trip by bike",
    countsAsExploring: false,
    recId: "travel-walk",
    title: "Biked the short errand",
    body: "Left the car and biked to the hardware store. It took about ten minutes, and I skipped the parking loop.",
    showPicture: true,
    hearts: 14,
    inActivity: false,
    inCommunity: true,
    comments: [
      {
        id: "hannah-on-chris",
        author: "Hannah",
        initial: "H",
        tone: "lilac",
        time: "3h ago",
        body: "Ten minutes is exactly the trip I keep driving. Trying this tomorrow.",
        hearts: 2,
        replies: [],
      },
      {
        id: "priya-on-chris",
        author: "Priya",
        initial: "P",
        tone: "sage",
        time: "2h ago",
        body: "The parking part is what got me. I hate circling the block.",
        hearts: 1,
        replies: [],
      },
    ],
  },
  {
    id: "priya-sweater",
    author: "Priya",
    initial: "P",
    tone: "sage",
    time: "8h ago",
    category: "home",
    kind: "experience",
    activity: "Turned the heat down a notch",
    changeName: "a cooler evening",
    countsAsExploring: false,
    recId: "home-thermostat",
    title: "Sweater instead of the heat",
    body: "Turned the heat down a notch and pulled on a sweater. The apartment is fine, and the mug of tea helps.",
    showPicture: true,
    hearts: 9,
    inActivity: false,
    inCommunity: true,
    comments: [
      {
        id: "sam-on-priya",
        author: "Sam",
        initial: "S",
        tone: "sand",
        time: "6h ago",
        body: "The sweater is the only reason I can turn ours down.",
        hearts: 1,
        replies: [],
      },
    ],
  },
  {
    id: "elena-patch",
    author: "Elena",
    initial: "E",
    tone: "rose",
    time: "1d ago",
    category: "stuff",
    kind: "experience",
    activity: "Patched a sweatshirt",
    changeName: "a clothing repair",
    countsAsExploring: false,
    recId: "clothes-repair",
    title: "Patched a sweatshirt",
    body: "The elbow on my favorite sweatshirt was wearing through, so I stitched a little patch. Still soft, and I did not buy a new one.",
    showPicture: true,
    hearts: 16,
    inActivity: false,
    inCommunity: true,
    comments: [
      {
        id: "maya-on-elena",
        author: "Maya",
        initial: "M",
        tone: "rose",
        time: "20h ago",
        body: "A patch on the elbow is the one I always need. Yours looks sturdy.",
        hearts: 2,
        replies: [],
      },
      {
        id: "jamie-on-elena",
        author: "Jamie",
        initial: "J",
        tone: "sand",
        time: "18h ago",
        body: "I keep a little thread kit in the junk drawer now. It has saved two shirts.",
        hearts: 1,
        replies: [],
      },
    ],
  },
  {
    id: "owen-leftovers",
    author: "Owen",
    initial: "O",
    tone: "sand",
    time: "2d ago",
    category: "food",
    kind: "tip",
    activity: "Packed leftovers for lunch",
    changeName: "less food waste",
    countsAsExploring: false,
    recId: "food-waste-less",
    title: "Leftovers for lunch",
    body: "Packed last night's rice and beans for lunch. Nothing fancy, but I was not standing in front of the fridge at one.",
    hearts: 7,
    inActivity: false,
    inCommunity: true,
    comments: [
      {
        id: "nora-on-owen",
        author: "Nora",
        initial: "N",
        tone: "mint",
        time: "1d ago",
        body: "Rice and beans is my whole lunch plan this week.",
        hearts: 1,
        replies: [],
      },
    ],
  },
  {
    id: "hannah-market",
    author: "Hannah",
    initial: "H",
    tone: "lilac",
    time: "3d ago",
    category: "travel",
    kind: "experience",
    activity: "Walked to the market",
    changeName: "a short walk",
    countsAsExploring: false,
    recId: "travel-walk",
    title: "Walked to the market",
    body: "Walked to the Saturday market instead of driving. It is two neighborhoods over, and I only bought what I could carry.",
    hearts: 4,
    inActivity: false,
    inCommunity: true,
    comments: [
      {
        id: "chris-on-hannah",
        author: "Chris",
        initial: "C",
        tone: "sky",
        time: "2d ago",
        body: "Carrying only what fits in a bag is the part I forget.",
        hearts: 1,
        replies: [],
      },
    ],
  },
];

/** Demonstration figures for the Together homepage. Not a calculate() result. */
export const sampleHome = {
  friends: 12,
  moreFriends: 9,
  changesTried: 28,
  avoided: "−1.4 tCO₂e",
} as const;

export type ActivityScene = "salad" | "waste" | "mend" | "bike" | "flights" | "thermostat";
export type PortraitId = "alex" | "jamie" | "maya" | "lina" | "sarah" | "kevin" | "sam";
export type ActivityFeed = "friends" | "community";

export type HomeActivity = {
  id: string;
  postId: string;
  author: string;
  portrait: PortraitId;
  title: string;
  category: Category;
  recId: RecId;
  scene: ActivityScene;
  feed: ActivityFeed;
  caption?: string;
  /** Project-local demo photo, or a signed URL on a real story. Not required. */
  photoUrl?: string | null;
  photoAlt?: string;
  hearts?: number;
  letter?: string;
  /** Local demonstration post. Never written to Supabase. */
  sample?: boolean;
};

export const homeActivities: HomeActivity[] = [
  {
    id: "alex-lunches",
    postId: "alex-monday",
    author: "Alex",
    portrait: "alex",
    title: "Plant-based lunches",
    category: "food",
    recId: "food-plant-meal",
    scene: "salad",
    feed: "friends",
  },
  {
    id: "jamie-waste",
    postId: "jamie-waste",
    author: "Jamie",
    portrait: "jamie",
    title: "Less food waste",
    category: "food",
    recId: "food-waste-less",
    scene: "waste",
    feed: "friends",
  },
  {
    id: "maya-mend",
    postId: "maya-repair",
    author: "Maya",
    portrait: "maya",
    title: "Mending a sweater",
    category: "stuff",
    recId: "clothes-repair",
    scene: "mend",
    feed: "friends",
  },
  {
    id: "lina-ride",
    postId: "lina-october",
    author: "Lina",
    portrait: "lina",
    title: "Walking short trips",
    category: "travel",
    recId: "travel-walk",
    scene: "bike",
    feed: "friends",
  },
  {
    id: "sarah-meals",
    postId: "sarah-meals",
    author: "Sarah",
    portrait: "sarah",
    title: "Easy plant meals",
    category: "food",
    recId: "food-plant-meal",
    scene: "salad",
    feed: "community",
  },
  {
    id: "kevin-flights",
    postId: "kevin-flights",
    author: "Kevin",
    portrait: "kevin",
    title: "Fewer flights",
    category: "travel",
    recId: "travel-flights",
    scene: "flights",
    feed: "community",
  },
  {
    id: "sam-evening",
    postId: "sam-thermostat",
    author: "Sam",
    portrait: "sam",
    title: "A cooler evening",
    category: "home",
    recId: "home-thermostat",
    scene: "thermostat",
    feed: "community",
  },
  {
    id: "maya-community",
    postId: "maya-repair",
    author: "Maya",
    portrait: "maya",
    title: "Repairing clothes",
    category: "stuff",
    recId: "clothes-repair",
    scene: "mend",
    feed: "community",
  },
];

/**
 * Local Community examples for user testing. These are not members of Carbon Compass
 * and are not inserted into Supabase. Photos are files in public/sample-stories,
 * downloaded from Unsplash under the Unsplash License:
 * - soup.jpg: Ella Olsson, https://unsplash.com/photos/fxJTl_gDh28
 * - bike.jpg: miguel sinisterra, https://unsplash.com/photos/XYsEm8u2JZI
 * - sweater.jpg: Svitlana, https://unsplash.com/photos/kwE6ohZccSs
 * - sewing.jpg: BBC Creative, https://unsplash.com/photos/DeYfkesUXcc
 */
const samplePhoto = (file: string) => `${import.meta.env.BASE_URL}sample-stories/${file}`;

export const communityPhotoSamples: HomeActivity[] = [
  {
    id: "sample-nora-soup",
    postId: "nora-soup",
    author: "Nora",
    portrait: "sarah",
    letter: "N",
    title: "Sunday soup",
    caption: "Made a big pot of carrot soup on Sunday. We ate it for three dinners, and I did not order takeout once.",
    category: "food",
    recId: "food-plant-meal",
    scene: "salad",
    feed: "community",
    photoUrl: samplePhoto("soup.jpg"),
    photoAlt: "A bowl of orange soup topped with herbs and seeds.",
    hearts: 21,
    sample: true,
  },
  {
    id: "sample-chris-bike",
    postId: "chris-bike",
    author: "Chris",
    portrait: "kevin",
    letter: "C",
    title: "Biked the short errand",
    caption: "Left the car and biked to the hardware store. It took about ten minutes, and I skipped the parking loop.",
    category: "travel",
    recId: "travel-walk",
    scene: "bike",
    feed: "community",
    photoUrl: samplePhoto("bike.jpg"),
    photoAlt: "A bicycle parked beside a building.",
    hearts: 14,
    sample: true,
  },
  {
    id: "sample-owen-leftovers",
    postId: "owen-leftovers",
    author: "Owen",
    portrait: "alex",
    title: "Leftovers for lunch",
    caption: "Packed last night's rice and beans for lunch. Nothing fancy, but I was not standing in front of the fridge at one.",
    category: "food",
    recId: "food-waste-less",
    scene: "salad",
    feed: "community",
    hearts: 7,
    sample: true,
  },
  {
    id: "sample-priya-sweater",
    postId: "priya-sweater",
    author: "Priya",
    portrait: "lina",
    letter: "P",
    title: "Sweater instead of the heat",
    caption: "Turned the heat down a notch and pulled on a sweater. The apartment is fine, and the mug of tea helps.",
    category: "home",
    recId: "home-thermostat",
    scene: "thermostat",
    feed: "community",
    photoUrl: samplePhoto("sweater.jpg"),
    photoAlt: "A knit sweater and blanket beside a mug.",
    hearts: 9,
    sample: true,
  },
  {
    id: "sample-hannah-market",
    postId: "hannah-market",
    author: "Hannah",
    portrait: "lina",
    title: "Walked to the market",
    caption: "Walked to the Saturday market instead of driving. It is two neighborhoods over, and I only bought what I could carry.",
    category: "travel",
    recId: "travel-walk",
    scene: "bike",
    feed: "community",
    hearts: 4,
    sample: true,
  },
  {
    id: "sample-elena-patch",
    postId: "elena-patch",
    author: "Elena",
    portrait: "maya",
    letter: "E",
    title: "Patched a sweatshirt",
    caption: "The elbow on my favorite sweatshirt was wearing through, so I stitched a little patch. Still soft, and I did not buy a new one.",
    category: "stuff",
    recId: "clothes-repair",
    scene: "mend",
    feed: "community",
    photoUrl: samplePhoto("sewing.jpg"),
    photoAlt: "Hands stitching a small mend in a cream sweatshirt.",
    hearts: 16,
    sample: true,
  },
];

export function clonePosts(posts: SamplePost[]): SamplePost[] {
  return posts.map((post) => ({
    ...post,
    comments: post.comments.map(cloneComment),
  }));
}

function cloneComment(comment: SampleComment): SampleComment {
  return { ...comment, replies: comment.replies.map(cloneComment) };
}
