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
