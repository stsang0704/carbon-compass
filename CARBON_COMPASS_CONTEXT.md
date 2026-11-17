# Carbon Compass — project handoff

Last reviewed against the codebase on 14 November 2026. The shell is Together, Explore, and My Impact. Email accounts through Supabase are in the app, but the `profiles` table had not been created in the linked project yet. This document describes **what is actually implemented**. Planned or leftover work is labeled as such.

On-screen headings and product names are not always the same. Where they differ, both are listed. If this file and the code disagree, trust the code and update this file.

Do not commit, push, or deploy unless the user asks. Do not change `calculate()` unless the user asks. Do not delete unused files unless the user asks. Do not put the Supabase service-role key in the frontend, in git, or in this file. `.env.local` is gitignored and already holds the project URL and the public publishable key. Do not finish a survey, save a check-in, toggle **Try this change**, or log out during a visual check. Those actions write or clear `localStorage` key `carbon-compass-profile`. Logging out is supposed to clear that device cache after a successful save to the account.

---

## 1. Project overview

**Purpose:** Help people who want to reduce their environmental impact but do not know where to start.

**Audience:** Individuals estimating an ordinary lifestyle year (food, travel, home, clothing). Not a full carbon audit, a utility-bill tool, or a competitive score.

**Design philosophy:** Progress over perfection. Language should encourage meaningful action without guilt, judgment, warning colors, or competition. The later visual pass asked for a warmer, friendlier, softer, more bubbly feel: warm ivory page, mint headers, white cards, generous radii, and soft shadows. Selected lifestyle changes are **potential** savings. Only the original survey and later monthly check-in answers change the estimated footprint that Your Progress tracks.

**Course context:** RISD CTC 3000. Phone-first React web app.

**Core flow:** Logged out, the app opens on the email Welcome / Log in screen. After a session exists, a saved footprint opens **Together**. A signed-in person with no footprint sees the original product Welcome, then the 8-question survey, then the three destinations.

- **Together** — the default homepage inside the shell. Sample community snapshot, sample activity cards, Lucide category tiles, and a labeled sample collective total. The people and the −1.4 tCO₂e figure are still samples. Accounts do not turn this into a real friend feed.
- **Explore** — a short personal action list, a category browser with an unsaved trial, and hypothetical savings from selected actions.
- **My Impact** — two views: **My Footprint** (the original survey year) and **Your Progress** (survey plus monthly check-ins).

An earlier plan for a bottom nav of My Footprint, Explore, and Your Impact was replaced. Do not put My Footprint back in the bottom nav. Explore and My Impact both have more than one view, so both use tabs, swipe, and dots. Together does not.

---

## 2. Current implementation

These features are in the running app.

### Accounts

Implemented in the client. The Supabase project answers on the Auth API. As of 14 November 2026, `public.profiles` was missing (`PGRST205`), so display name and footprint sync cannot succeed until `supabase/profiles.sql` is run in the SQL editor.

- Logged out: `AuthGate.tsx` on the mint `PhoneShell`. Email and password log in, **Create account**, and **Forgot password**. Sign up asks for display name, email, and a password of at least 6 characters. If Supabase returns no session, the screen says to check email. A password-recovery link opens `ResetPassword`.
- Signed in: the session is restored by `@supabase/supabase-js` (`persistSession`, `autoRefreshToken`, `detectSessionInUrl`). The app shell is not mounted until that session exists.
- `Account.tsx` opens from the Lucide `UserRound` button at the top right of `AppShell` (`.account-launch`). It shows the display name and email, edits the name, and has a **Log out** button. Log out calls `supabase.auth.signOut({ scope: "local" })`.
- Log out does not delete the auth user. It tries to save the current footprint to `profiles.footprint` first. If that save fails, the person stays signed in and sees an error, so the device cache is not cleared before the account copy exists.
- After a successful log out, `clearProfile()` removes `carbon-compass-profile` from this browser and the screen returns to Welcome / Log in. Signing in again loads `profiles.footprint` when that row has one. If the remote footprint is empty and this browser still has a local profile, that local profile is uploaded. That is how an existing on-device footprint becomes the first account’s data.
- Switching from one user id to another also clears the device cache before the next account is loaded.
- No avatar upload, no in-app account deletion, and no friend graph. Email comes from `session.user.email`. The display name is `profiles.display_name`, also copied into user metadata.
- Env names: `VITE_SUPABASE_URL` (project origin only, no `/rest/v1/`) and `VITE_SUPABASE_ANON_KEY` (the public publishable key). `.env.example` lists the names. Restart `npm run dev` after changing `.env.local`.

### Welcome and survey

- `Welcome.tsx` is the product intro after sign-in, when there is no footprint yet. It uses a Lucide `Leaf`, not an emoji. **Next.** starts the survey.
- `Baseline.tsx` is the 8-question survey. `editing: false` is onboarding (back goes to that product Welcome; done **replaces** the profile, including check-ins). `editing: true` is Edit My Footprint (back returns to My Footprint; done replaces `baseline`, recomputes overrides from the still-selected actions, and **keeps** check-ins, history, and `selectedRecIds`).
- A signed-in person whose account or browser already has a footprint opens the shell on **Together**.
- There is no Start over control. Log out is not a reset of the account’s saved footprint.

Survey questions, in order:

1. Diet mix (plants / chicken-pork / fish / beef-lamb) — must sum to 100%
2. Food waste (rarely / sometimes / often)
3. Miles driven per week (optional number)
4. Round-trip flights per year (optional number)
5. Home size: Apartment, Small house, Larger house, or Other + custom text
6. Winter temperature (C or F)
7. New clothing items per season
8. Online orders per month

Not asked (still on `Answers` because recommendations and the model need them):

- `heatSource` — defaults to `"gas"`; `"unknown"` also maps to gas
- `showerMinutes` — null uses the EPA-typical 8 minutes
- `insulationFactor` — 1 until an insulation recommendation is applied to the **scenario**, not the check-in
- `secondhandShare` — 0 until a secondhand recommendation is applied to the scenario

Blank numeric fields use **typical U.S. defaults** from `assumptions` (100 miles/week, 2 flights, 66°F, 6 clothes/season, 4 orders/month). The Browse trial treats a cleared number as the baseline value so an empty field does not jump to the typical default while the person is editing.

### Emissions calculation

`calculate(answers)` in `src/model/calculate.ts` is the only source of lifestyle kg. Carbon is the primary metric. Water and energy are still computed on the lines and shown in Sources. They are not the footprint or impact heroes. Equivalences are calculate-then-map. Never invent a kg number to make a nicer tree, gallon, or mile headline. Details are in section 6. The visual passes, the My Footprint merge, the U.S. chart, and Together did not change `calculate()`, factors, or survey questions.

### Personalized recommendations

18 actions in `src/data/recommendations.ts`. For You shows only the top 3 from `personalizedRecommendations(baseline, [], 3)`. Browse lists the rest of a category, sortable by **Largest cut** (`"savings"`) or **Easiest** (`"ease"`, then savings). **Try this change** adds the id to `selectedRecIds` and stores overrides. It does not change `baseline`, check-ins, or Your Progress. Catalog is in section 6.

`RecommendationCard` is compact on purpose. The face shows a `CategoryGlyph`, the title, an Easy / Moderate / Hard pill, a short share tag (`~12% of a typical U.S. year`, from `shareOfTypicalYear`’s percent, not its long sentence), and the kg figure. **How to start**, **Why it helps**, the recommendation note, and “Overlapping cuts are counted once.” open when the card is tapped. There is no `showWhy` prop and no “Added to your impact” confirmation line. The button still reads **Try this change.** or **Trying this ✓**.

### My Footprint

One page, `Compass.tsx`, the only view in the footprint destination. `calculate(baseline)` only. There are no Overview / Understand tabs, no swipe, and no page dots.

Order on the page:

1. Green header (`PhoneShell`, still passed `heroTone="teal"`, which only adds the unused class `is-teal`). Kicker “My Footprint,” line “Estimated annual footprint,” large serif annual CO₂e figure. There is no insight paragraph under the hero.
2. **Understand your footprint** (`Sources.tsx` with `embedded`). There is no lede sentence. Then:
   - **U.S. comparison** (`UsCompareChart`): a horizontal bar chart. “Your estimate” is mint `#71C39E`. “Typical U.S. year” is muted `#D5CEC2`. Both bars share the longer value. Labels and `formatCarbonPerYear` values sit above each bar. Subtitle: “How your estimate compares.” One takeaway uses the existing `lifestyleCompare` percent and direction, for example “Your estimate is about 689% above this model's typical U.S. year.” Near (under 5%) says the estimate is close to this model's typical U.S. year. The long comparison paragraph and the “not a verdict” disclaimer are not on this card. The factor steps remain inside Sources.
   - **Gasoline**: a number tile, `≈ {formatGasolineGallons}` and the caption “gallons.” The “not fuel you burned” sentence is only in the Sources gasoline steps.
   - An expandable **Where the numbers come from** that embeds `SourceSheet` (methods, assumptions, Includes / Leaves out, source links). Recommendation-share and selected-change notes are omitted (`omitRecommendationNotes`). The summary is sticky inside `.view-pane`. See “Sticky sources heading” below.
3. Category cards titled **By category**. Expanding a row lists the impact lines and can open Browse for that category. The largest category gets a chip from `footprintFocus` when one line is at least half of that category, for example **Mostly flights**. `footprintInsight` still builds the old sentence and is covered by tests, but Compass does not render it.
4. **Explore** opens For You. **Edit My Footprint** opens the survey.

`Sources.tsx` still contains a standalone `PhoneShell` titled “Understand” for the non-embedded, unfocused path, and a focused-habit `SourceSheet` path. `App.tsx` does not render either. Compass always passes `embedded` and does not pass a habit id. For You, Browse, Potential Impact, and Your Progress each have a “Where the numbers come from” button. `showSources()` sets `sourcesOpen` and opens My Footprint pane 0. The embedded disclosure then opens and scrolls into view (`scrollIntoView`, `block: "nearest"`).

### Explore

**For You** (`Plan.tsx`, pane 0): the three greedy marginal actions, using the compact `RecommendationCard`. Caption: “Largest cuts first. Adding one does not change your footprint.” The averages disclaimer is not on this screen. Header action label is **Potential Impact** and opens Explore pane 2. The old “Reduce your impact” filter list is gone.

**Browse** (`Explore.tsx`, pane 1): four pastel category tiles (Food, Travel, Home, Clothing), not a `<select>`. The pressed tile uses `aria-pressed` and an inset Deep Forest ring. A local draft (not the profile) drives hypothetical amounts inside a closed `<details class="trial-disclosure" data-no-swipe>` titled **Try a different amount**. The summary still says “A possible change only. Nothing here is saved.” Food waste and home type are dropdowns. Miles, flights, winter °F, clothes, and orders are a slider plus a number field. Diet uses `HabitControl` / `DietControl`. When the draft differs from baseline, `CategoryBreakdown` with `before` set appears (colored remaining footprint, adjacent grey reduction). There is no trial sentence and no caption above those bars. **Reset this trial** restores the baseline amounts. The trial is not written to `localStorage` and does not mark anything achieved. Below that, actions in the category can still be added to the plan. Sort options: **Largest cut** (`"savings"`) and **Easiest** (`"ease"`, then savings). The header action also says **Potential Impact** and opens pane 2.

**Potential Impact** (`Mix.tsx` `view="potential"`, pane 2): hypothetical savings only. See section 6. Empty state: heading “Start with one change.”, “Nothing selected yet.”, and **Open your action plan** (opens For You, Explore pane 0). With selections: a “{count} selected” count, `savedEquivalence` as the hero number when there is a saving, `formatCarbonSaved` under it, selected-change rows with `CategoryGlyph` and Remove, then category bars titled **Your Potential Savings**. The averages disclaimer and the “Small individual choices…” closer are not on this screen. If selections exist but the combined saving is not positive, the heading is “Selected.”

### Your Impact

`Mix.tsx` `view="progress"` is My Impact pane 1, so it shares that destination’s tabs, swipe, and two dots. On-screen kicker is still **Your Impact**. Heading is **Your Progress**. There is no lede under the heading. It shows `ProgressChart`, then three stat blocks (Original, the latest check-in month or “Current”, and Change), then one `effortMessage`. With no check-ins, the chart is the baseline point plus “Check in to add the next point.” **Monthly Check-in** is a primary button. **Previous month** is a two-bar chart (earlier month in the muted bar, latest month in mint) and appears only when **two or more check-ins** exist. The takeaway is the existing `monthCompare` line. Selected actions are not included.

This destination is not the app’s start screen.

### Monthly Check-in

`CheckIn.tsx` is a full screen outside the shell, opened from Your Progress. Phases: survey (the same 8 questions), reflect, results, saved. Back from the first survey step, and done after save, return to **Your Progress** (`impact` pane 1). Reflections never enter `calculate()`. If nothing is selected, the reflect step says: “No changes are selected yet. You can still save this month's lifestyle update.” Selected rows use `CategoryGlyph`. The results hero is the draft annual figure only. The body is `FootprintBars` plus one line, “Saves one snapshot for {month}.” or “Updates {month}.” The saved screen shows that figure, one `effortMessage`, the saved answers, and any reflections. It does not repeat the averages disclaimer or a second comparison paragraph. One snapshot per calendar month. Details are in section 6.

### Together (homepage)

`Together.tsx` is the only view in the Together destination, and it is the screen a saved footprint opens on. It is one AppShell pane, so it has no tabs, swipe, or dots. It uses the same mint `PhoneShell` hero as the other pages. `.cc-home .hero h2` overrides the global serif heading to Source Sans 3, 18px, weight 650, white: “Better together.” The lede is “Small changes, shared journeys.”

On the page, in order:

1. A pale mint sample card (`sampleHome`): portraits, **+9**, **12 Friends**, **28 Changes tried**. Labeled **Sample**.
2. **What others are trying.** A Friends / Community menu swaps `homeActivities`. Each card has a portrait, a sample title, a category tag with a 14px Lucide `CategoryGlyph`, and a small scene drawing from `Illustrations.tsx` (`SceneArt`: salad, waste, mend, bike, flights, or house). Hearts are React state only. **Try it too** calls `toggleRec`, so the action is saved as a potential change and the button becomes **Trying this**. It does not change the baseline, check-ins, or Your Progress.
3. **Try something new.** Four pastel category tiles, the same classes as Explore. Icons are Lucide `Leaf`, `Car`, `House`, and `Shirt` at the Explore tile size (36px circle, 20px stroke). Home and Clothing circles are transparent so the icon sits on the tile. Tiles call `onBrowse` and open Explore Browse. They do not use the custom salad, bicycle, house, or shirt illustrations.
4. **Our impact together.** Another sample card: **28 Changes tried** and **−1.4 tCO₂e**, labeled **Sample estimate**. That string is `sampleHome.avoided`. It is not a `calculate()` result.

`sampleCircle` (245 kg, 80 kg, 31,000 L, 420 kWh) and `samplePosts` are still in `src/data/together.ts`. They are not mounted by `Together.tsx`. Do not put that older collective card, post thread, or community browser back on the homepage unless the user asks. There is no comment screen. Real friends, posts, and notifications are not built. Accounts do not connect the signed-in person to these sample people.

### Sticky sources heading

The scroll container is `.view-pane`, not the page. `.sources-disclosure` uses `overflow: clip` so the rounded card clips without becoming the sticky scroll container (`overflow: hidden` would). The summary is `position: sticky`, `top: env(safe-area-inset-top)` on mobile and `top: 12px` at ≥ 480px so it clears the phone corner. A `summary::before` in the page color covers the 12px gap on desktop. The summary sticks only while its `<details>` section is in view, then scrolls away with that section. It does not cover the green header or the bottom nav.

Collapsing while the heading is stuck does not use the native close, which jumps the scroll. `Sources.tsx` `onSummaryClick` prevents the native toggle, smooth-scrolls `.view-pane` back to the summary’s in-flow top, then closes on `scrollend`. A pointer or wheel cancels the return and leaves it open. Reduced motion snaps. If the heading is already in view, the native toggle is used.

### Persistence and shell foundations

- `localStorage` key `carbon-compass-profile`, with migration from older answer shapes (`src/state/profile.ts`). While signed in, the same JSON is written to `profiles.footprint`. Log out clears the device key after that save succeeds.
- Supabase Auth session storage is separate and is owned by `@supabase/supabase-js`. Do not treat that session as the footprint.
- PWA registration in `main.tsx` (`vite-plugin-pwa`). `AuthProvider` wraps `App`.
- Desktop phone frame about 393×`min(852px, 100dvh - 32px)` at viewport ≥ 480px; full-width below that. Inside the shell, `#root` does not scroll; each `.view-pane` does.
- Confidence badges are **removed** from factors, types, and the sources UI. Includes / Leaves out remain.
- No React Router. Screen state is in `src/App.tsx`.

---

## 3. Navigation (implemented)

Three earlier plans were built and then replaced. Do not restore any of them unless the user asks.

1. **Exactly two swipeable views in every destination**, with Potential and Progress both under Your Impact.
2. **My Footprint as two panes**, Overview and Understand, with tabs, swipe, and two dots.
3. **My Footprint as its own bottom-nav tab, beside Your Impact.** That four-tab shell was replaced. My Footprint now lives inside My Impact.

Current shell:

`AppShell` (`src/components/AppShell.tsx`) keeps all three destinations mounted. Inactive ones use the `hidden` attribute, and `.destination[hidden] { display: none }`. Each destination remembers its pane. `PaneIndex` is a number. Labels live on the destination table in `AppShell`, not as a second copy of the screens. A `UserRound` button (`.account-launch`) sits at the top right of the shell and opens Profile / Settings. `.view-tabs` has extra right padding so that button does not cover the last tab label.

| Destination | Bottom-nav icon | Panes | Chrome |
|---|---|---|---|
| Together | Lucide `UsersRound` | 0 only: `Together.tsx` | No tabs, no dots, no swipe. Friends / Community is a menu on the page, not a pane. |
| Explore | Lucide `Compass` | 0 For You (`Plan.tsx`), 1 Browse (`Explore.tsx`), 2 Potential Impact (`Mix.tsx` `view="potential"`) | Tabs, swipe, three dots. Tab row has class `view-tabs is-wide`. |
| My Impact | Lucide `ChartColumn` | 0 My Footprint (`Compass.tsx`), 1 Your Progress (`Mix.tsx` `view="progress"`) | Tabs, swipe, two dots. |

Bottom nav is a 3-column grid (`repeat(3, minmax(0, 1fr))`). Labels are 12px. Icons are Lucide outlines at size 22, stroke 1.75, `absoluteStrokeWidth`, drawn directly on the bar. There is no circle behind a nav icon. The active tab is a soft mint pill. Inactive tabs sit on the warm ivory bar. Together, Explore, and My Impact all use the mint `PhoneShell` hero. Together’s title is the smaller sans override described above.

### Swipe, tabs, and dots

Used only when `labels.length > 1`. That is Explore and My Impact. Together is a single pane.

- Track is `width: 100%`. Each pane is `flex: 0 0 100%`. The transform is inline `translateX(-${index * 100}%)` of that track. Do not switch to a percentage of a 300%-wide track. Explore pane 2 is `-200%` of the stage width.
- Swipe threshold is 56px and `|dx| >= |dy|`. Swipes do not wrap. Tabs do wrap with ArrowLeft/Right/Up/Down. Home and End jump to the ends. Roving `tabIndex` is on the tab buttons.
- A swipe is ignored when `scrollTop` changes by more than 8px, or when the target is inside `input, textarea, select, button, a, svg, canvas, label, summary, [data-no-swipe]`.
- Touch uses touch events. Mouse and pen use pointer events, and pointer handlers return early for `pointerType === "touch"`, so one gesture is not handled twice.
- After a real swipe, the following click is suppressed for about 400ms.
- `prefers-reduced-motion: reduce` disables the track transition.

Panel ids exist only for multi-pane destinations: `panel-for-you`, `panel-browse`, `panel-potential-impact`, `panel-my-footprint`, and `panel-your-progress`. Together has no panel id. `#panel-overview` is no longer rendered. A leftover CSS rule `#panel-overview .footprint-insight` does nothing.

### Other paths

- My Footprint **Explore** opens For You (`explore`, 0). “See changes in …” sets `browseCategory` and opens Browse (`explore`, 1).
- For You and Browse **Potential Impact** opens `explore`, 2.
- Empty Potential **Open your action plan** opens `explore`, 0.
- Check-in back and done open Your Progress (`impact`, 1).
- `showSources()` opens My Footprint (`impact`, 0) with the disclosure expanded and scrolled into view.
- Together category tiles set `browseCategory` and open Browse (`explore`, 1). They do not toggle a recommendation. **Try it too** does call `toggleRec`.

---

## 4. Current progress

### Completed

- Welcome, survey, calculation, sources, 18 recommendations, localStorage, PWA, phone frame.
- Three-destination bottom nav: Together, Explore, My Impact. Tabs, swipe, and dots appear where a destination has more than one view. That is Explore and My Impact.
- For You (top 3), Browse category tiles and unsaved trial, Potential Impact under Explore.
- Compact recommendation cards. How and why open on tap.
- Your Progress chart, three stat blocks, one effort line, previous-month bars only after two check-ins.
- Monthly Check-in with before/after bars, reflections that do not affect kg, one snapshot per month.
- Lucide category icons: Food `Leaf`, Travel `Car`, Home `House`, Clothing `Shirt`. Welcome uses `Leaf`. Bottom nav uses `UsersRound`, `Compass`, and `ChartColumn`. The account button uses `UserRound`.
- Phase 5 interaction polish: swipe does not fight sliders, charts, or buttons; keyboard tabs; reduced motion.
- Warmer visual system in section 5: ivory page, mint headers, white cards, pill primary buttons, pastel category cards, difficulty-badge swap, smaller By category icons, bottom nav without icon circles.
- My Footprint combined into one scrollable page. Overview and Understand are no longer separate screens.
- U.S. comparison is a two-bar chart. Gasoline is a number tile. The largest category can show a “Mostly …” chip.
- Sticky **Where the numbers come from** heading, including a smooth return when it is collapsed while stuck.
- Together homepage: sample snapshot, sample activity carousel, Lucide category tiles, and a labeled −1.4 tCO₂e sample card. Not a real social network.
- Email sign-up, log in, email confirmation handoff, password reset, persistent session, profile settings, and log out. The client is wired. The `profiles` table still has to be created in Supabase.
- Shorter visual pass on Explore, Potential Impact, Your Progress, check-in results, and Together. Survey questions, friend stories, and the sources methodology stay written.

### Partially implemented

- **Sources** explains factors, the typical lifestyle year, and gasoline inside the disclosure. The face of Understand your footprint is now the chart and the gasoline tile. It still does not explain, in that section, how a check-in updates the progress chart or why a selected action stays hypothetical.
- **`history`** is still written on every profile save (`withMonthRecord` stores `scenarioKg` from the selected-recommendation scenario). The Progress UI does not read it.
- **Water and energy** are calculated and available in Sources, and are off the footprint and impact heroes. Together’s water and energy figures are separate sample constants, not `calculate()` output.
- **Reflections** are stored on the snapshot and do not change the footprint. That is intentional, not a missing calculator hook.
- **Together** is still a sample feed. Sign-in does not create friends, posts, or a shared community. Hearts stay in memory. **Try it too** only stores a potential action.
- **Accounts** persist the session and, once `profiles` exists, the display name and footprint JSON. Avatar upload and account deletion are not built. Logout cannot finish safely until the footprint save succeeds.
- **Legacy components** are still in the repo and are not routed. See section 7.
- **`heroTone="teal"` / `.is-teal`** is still passed by Compass and has no CSS. Every hero that uses `PhoneShell` uses the same mint fill. Together does not use that hero. Do not treat the class as a color switch.
- **`Sources.tsx` standalone Understand screen** remains in the file and is not mounted by `App.tsx`.
- **`footprintInsight`** still returns the old sentence for tests. The page uses `footprintFocus` as a chip instead.

### Not built

- A Start over / reset-profile control.
- Survey questions for heat source, showers, EVs, or transit mode.
- Contrails, utility-bill heating, or a nutrition diary.
- Adoption tracking that would turn a selected action into a completed reduction.
- The `profiles` table in the linked Supabase project. `supabase/profiles.sql` is written and has not been applied. Until it is, name and footprint sync return an error.
- Real friend connections or community posts. Accounts are identity and footprint storage only.
- An in-app explanation, beyond the existing sources steps, of how check-ins differ from selected actions.
- Any further numbered phase. Do not start the next item unless the user asks. Do not split My Footprint back into two swipeable screens unless the user asks. Do not restore the three-destination, two-views-each shell.

---

## 5. Visual design

Single stylesheet: `src/styles.css`. Fonts: **Fraunces Variable** (headings, including the large footprint number) and **Source Sans 3 Variable** (UI), loaded in `main.tsx`.

The look the user asked for, and that is now in the CSS: warmer, friendlier, softer, and more bubbly. Do not revert to the 23 October palette (off-white page `#F8FBF6`, forest-green My Footprint-only hero `#327C62`, mint heroes with Deep Forest text and decorative circles) unless the user asks.

### Brand tokens (`:root`)

```css
--green: #4fc59b;        /* Fresh Mint — sliders and the updated check-in bar. Not the page header. */
--green-deep: #146b4e;   /* accessible mint — focus, tab underline, active dot, active nav icon */
--forest: #173e38;       /* Deep Forest — primary text, primary buttons */
--forest-soft: #3e5c55;  /* secondary text and inactive nav */
--cream: #ffffff;        /* card surfaces. The name is historical; it is no longer the page color. */
--page: #faf7f0;         /* Warm Ivory — page, tab bar, bottom nav */
--card: #ffffff;
--shadow: 0 8px 24px rgba(88, 64, 36, 0.08);
--sand: #dff5e6;         /* Pale Green */
--mint: #dff5e6;         /* Pale Green — secondary buttons, active nav pill, Easy badge */
--fog: #dff5e6;
--lime: #c9ea83;         /* Soft Lime — Hard difficulty badge */
--carbon: #146b4e;
--water: #5d8f9a;        /* metric color, not a category */
--energy: #c4924a;       /* metric color */
--teal: #327c62;         /* leftover token. Not the live hero fill. */
--insight-pale: #eaf5ed; /* leftover token. The insight card is white. */
```

Header fill is the literal `#71C39E` on `.hero`, not a token. It applies to every `PhoneShell` hero, including Together, the auth screens, settings, the survey, check-in, My Footprint, Explore, Your Progress, and `SourceSheet`. Together only overrides the hero title size. The page behind the cards stays Warm Ivory.

- Background `#71C39E`. One solid color. No gradient.
- `.hero::before` and `.hero::after` set `content: none`. No decorative circles on any hero.
- Header text is `#FFFFFF`: kicker, count, headings, lede, units, close, icon buttons, text buttons, and savings lines inside a hero.
- Radius `0 0 36px 36px`. Padding bottom 28px. The large footprint number stays Fraunces at 46px (`.hero-gallons`).
- `h2` weight is 500, line-height 1.16, letter-spacing -0.02em. `.calc h3` weight is 500.

White on `#71C39E` is below the usual text-contrast guideline. Deep Forest `#173E38` on `#71C39E` would pass. The user kept white titles. Do not darken the header unless they ask.

Body text stays Deep Forest on Warm Ivory. Primary buttons are Deep Forest with white text, pill radius `999px`, shadow `0 8px 16px rgba(23, 62, 56, 0.12)`. Secondary buttons and the active nav pill are Pale Green with Deep Forest text. Focus rings, the tab underline, active dots, and the active nav icon use `#146B4E`. Inactive dots are `rgba(23, 62, 56, 0.22)`.

### Cards and spacing

- Page background is Warm Ivory. Content cards are white (`--cream` / `--card`).
- Shared card radius is about 24px (plant cards, calc cards, recommendation cards, share cards). The sources disclosure is 22px. Inputs and selects are about 20px. The active nav item is 20px.
- Stage padding is 22px. Stage and stage-body gap is 18px.
- Shadow is `var(--shadow)`. The desktop phone-frame shadow is warm brown, not forest green.
- The largest source is a chip on the By category card (`footprintFocus`), for example “Mostly flights.” The old `.footprint-insight` sentence is not rendered. CSS for that class can remain. Do not put the paragraph back unless the user asks.
- U.S. comparison bars: the user’s bar is `#71C39E`, the typical-year bar is `#D5CEC2`, and the track is `#F3EFE6`. Rounded ends. The same bar treatment is reused for Previous month on Your Progress.

### Difficulty badges

Scoped to `.difficulty-easy`, `.difficulty-moderate`, and `.difficulty-hard` on recommendation cards only. Labels and which actions are easy, moderate, or hard did not change. Easy was not swapped.

| Label | Look |
|---|---|
| Easy | Pale green `--mint` `#DFF5E6`, no border |
| Moderate | `#D7E6DF` with a 1px inset `#146B4E` outline |
| Hard | Soft lime `--lime` `#C9EA83`, no border |

Do not swap Hard and Moderate again. Do not apply these fills to other UI.

### Two category palettes

Shared lifestyle colors, used on potential bars, selected-change glyphs, check-in glyphs, and anywhere that is not a My Footprint share card:

| Category | Code id | Color | Pale circle |
|---|---|---|---|
| Food | `food` | `#3F8F6B` `--food` | `#E8F3EA` `--food-soft` |
| Travel | `travel` | `#9575B8` `--travel` | `#F0EAF6` `--travel-soft` |
| Home | `home` | `#A77B58` `--home` | `#E4EEF0` `--home-soft` |
| Clothing | `stuff` | `#C76D70` `--stuff` | `#F8EEEE` `--stuff-soft` |

My Footprint **By category** cards only (`.breakdown-share-*` in `CategoryBreakdown` `ShareBreakdown`). Potential bars use `breakdown-card` without the share class, so they keep the shared palette and the white card. Do not restyle potential bars to the share-card size.

| Category | Card | Icon circle (darker than the card) | Accent (icon and bar fill) |
|---|---|---|---|
| Travel | `#F0EAF9` `--travel-card` | `#E2D8F1` `--travel-circle` | `#9673BC` `--travel-accent` |
| Food | `#E6F4E9` `--food-card` | `#D4EBDC` `--food-circle` | `#32966B` `--food-accent` |
| Home | `#FFF1D6` `--home-card` | `#F6E3B4` `--home-circle` | `#E99A16` `--home-accent` |
| Clothing | `#FCE8E8` `--stuff-card` | `#F6D6D6` `--stuff-circle` | `#E96363` `--stuff-accent` |

Share-card layout, exact sizes:

- Card radius 24px.
- Circle 64×64. Lucide icon 36×36 (`size={36}` plus CSS width/height/min/max so the 40px default `.glyph-outline svg` rule does not win). Stroke 1.75 with `absoluteStrokeWidth`. Centered. No white disc behind the icon.
- Gap between circle and text is 16px.
- Title on one line. Emissions value and percentage on the next line (`28 t · 52%`).
- Bar height 8px, rounded ends. Tracks are a translucent version of the accent.
- Card text stays Deep Forest.

The Home share-card icon is `--home` `#A77B58` on the pale yellow circle `--home-circle`. The Home share-card bar still uses `--home-accent` `#E99A16`. Do not enlarge these icons. An earlier pass made them dominate the card; 64×64 and 36×36 is the requested size.

Category tiles on Explore and Together use a 36×36 circle and a 20×20 Lucide stroke. Home and Clothing tile circles are `background: transparent` (`.category-tile .glyph-home` and `.glyph-stuff`) so the brown house and coral shirt sit on the pastel tile. Food and Travel still use their pale circles, which are close to the tile color. Do not put custom illustrations back in those tiles. Activity-card scenes in `Illustrations.tsx` are separate and still drawn.

Other `CategoryGlyph` uses (check-in rows, potential rows) stay on the 48×48 circle and 40×40 svg. Default `iconSize` is 40.

### Bars and charts

- **Share bars** (My Footprint By category): one accent-colored segment. Width is that category’s share of the total, with a minimum visible width when the share is above 0.
- **Potential bars** (`.bar-potential`, when `CategoryBreakdown` gets `before`): colored `.is-next` is the hypothetical remaining footprint using the shared category color; adjacent `.is-cut` is `#b7b1a6` and is the potential reduction. Together they represent the original category amount. Used on Potential Impact and the Browse trial. All four categories are shown. Grey `#b7b1a6` is a data color, not a brand beige. It is not a CSS variable.
- **Check-in bars** (`FootprintBars`): grey `#b7b1a6` for the previous footprint, brand mint `#4FC59B` (`--green`) for the updated footprint, same scale. The updated bar stays green when the footprint rises. Do not retarget `--green` to the page header.
- **Progress chart** (`ProgressChart.tsx`): line `#146B4E`, check-in dots `#4FC59B`, baseline dots `#8EAEA0`, dot stroke `#173E38`, labels `#3E5C55`, grid `rgba(23, 62, 56, 0.12)`. Y-axis is tonnes CO₂e. Not a category chart. Do not recolor it as part of a category-card change.

### Icons

| Where | Icon |
|---|---|
| Bottom nav, Together | `UsersRound` |
| Bottom nav, Explore | `Compass` |
| Bottom nav, My Impact | `ChartColumn` |
| Account button | `UserRound` |
| Category, Travel | `Car` |
| Category, Food | `Leaf` |
| Category, Home | `House` |
| Category, Clothing | `Shirt` |
| Welcome | `Leaf` |

`CategoryGlyph` in `CategoryBreakdown.tsx` is the shared category icon. Emoji remains only in unused `ImpactTrio.tsx` and `MetricStrips.tsx`. Do not spread emoji into live screens.

### Layout conventions

- Mobile-first. At ≥ 480px the app is a rounded 393px phone on the Warm Ivory page.
- Affirmative, non-judgmental copy. The averages disclaimer stays inside Sources. It is not repeated on For You, Potential Impact, or the check-in results screen.
- Do not restyle into a cold dashboard or a competitive leaderboard.
- Diet-mix swatches in `src/data/diet.ts` are a separate set (`#3F8F6B`, `#C4924A`, `#5D8F9A`, `#C17B62`). The donut gap stroke in `DietControl.tsx` is `#FFFFFF` so it matches the white control card. They are not the lifestyle category palette.

---

## 6. Calculation rules

### What produces kilograms

All lifestyle kg comes from **`calculate(answers)`**. Eight impact lines, then totals and `byCategory`:

| Line | Habits | Carbon model (simplified) |
|---|---|---|
| Your diet | `dietShare` | 21 meals/week × 52 × 0.1 kg portion, split by %. Poore & Nemecek-style kg CO₂e/kg (beef 99.48, poultry 9.87, pork 12.31, fish 13.63, plant 0.53). Chicken/pork is averaged. |
| Food thrown out | `foodWaste` | Extra share of the diet line: rarely 5%, sometimes 15%, often 30% |
| Driving | `milesPerWeek` | weekly × 52 × **0.393 kg CO₂e/mile** (EPA gasoline car/light truck) |
| Flights | `flightsPerYear` | trips × **2,000 passenger-miles** × EPA flight factor. Contrails excluded. |
| Heating the home | `homeType`, `winterTempF`, plus `heatSource`, `insulationFactor` | Assumed annual heating load by size (apartment 4,500 / small 11,000 / larger 18,000 kWh) × insulation × 3% per °F vs 66°F typical. Gas vs resistance/heat pump. The degree adjustment is not capped. |
| Showers | `showerMinutes`, `heatSource` | 8 min typical, 2.1 gal/min, 0.67 showers/day, heat water 70°F |
| New clothes | `clothesPerSeason`, `secondhandShare` | items × 4 seasons × 0.4 kg garment, half cotton / half polyester WRAP factors; secondhand share drops fiber |
| Online orders | `ordersPerMonth` | count × 12 × 1.075 kg CO₂e per parcel. **The product inside the box is not included.** |

Home **Other** text is classified in `src/data/home.ts` onto apartment / small / larger by keywords. Unrecognized text still lands on one of those three loads.

### Potential savings versus estimated progress

These must stay separate.

**Potential savings** (For You cards, Browse action cards, Potential Impact hero and category bars, Browse trial bars):

- `recommendationSavedKg(baseline, rec)` = carbon(baseline) − carbon(apply that one rec to baseline)
- For You card kg is the **marginal** amount from `personalizedRecommendations` (what that action still adds after the higher-ranked ones)
- Combined Potential hero: `calculate(baseline)` minus `calculate(scenario)`
- Row kg: `attributedSavedKg` so overlapping levers are not added twice
- Browse trial bars: `calculate(local draft)` versus `calculate(baseline)`. The draft is not the selected-rec scenario and is not saved.
- `potentialCategoryBar(originalKg, scenarioKg)` in `src/model/potentialBar.ts`: savings = max(0, original − scenario); colored % = remaining / original; grey % = reduction / original. If the trial is higher than the original, savings clamp to 0. If savings exceed the original category, the bar stops at 100% grey and `inconsistent` is true.
- Denominator for “percent of a comparable average person”: `typicalUsLifestyleKg()` = `calculate(starterAnswers)` (about 6.9 t / 6,859 kg). The EPA inventory per person (about 19 t) is Sources background only.
- A recommendation is eligible when isolated savings are at least 1 kg.
- Trees only when the saving is at least 60 kg (one whole tree). Otherwise the hero uses miles of driving avoided.
- Gasoline equivalence uses 8.89 kg CO₂e per gallon. Driving equivalence uses 0.393 kg per mile.
- **Selecting an action is not adoption.** It must not move Your Progress, the progress chart, or the previous-month card.

**Updated estimated footprint** (Your Progress and Monthly Check-in):

- `footprintKg(answers)` = `calculate(answers).totals.carbon`
- Original baseline = `calculate(profile.baseline)`
- A check-in point = `calculate(snapshot.answers)`, not the stored `carbonKg` and not `history.scenarioKg`
- Current footprint = the latest check-in, or the original baseline if none exist
- Percent change = `(current − original) / original × 100`
- Previous-month card = latest check-in kg versus the check-in before it, only when both exist. `previousCheckInCompare` reuses `monthCompare` by putting the earlier check-in kg in the `scenarioKg` field. That field is a container here. It is not the selected-rec scenario.
- Reflection choices never enter `calculate()`
- Check-in answers are copied from the latest saved survey (`answersForCheckIn`: this month’s snapshot if it exists, otherwise the latest check-in, otherwise `baseline`), not from recommendation overrides
- My Footprint shows `calculate(baseline)`, not the selected-rec scenario and not the latest check-in
- The U.S. chart uses the same `lifestyleCompare` percent and direction. It does not introduce a new baseline. A World-average third bar was discussed and was not built.
- Together’s “Our impact together” card does not call `calculate()`. The on-screen figure is the constant `sampleHome.avoided` (`−1.4 tCO₂e`). `sampleCircle` still holds 245 kg, 80 kg, 31,000 L, and 420 kWh, but that older card is not mounted. Hearts do not change the sample total. **Try it too** does write `selectedRecIds`. Viewing or hearting a card does not.

### Ranking and stacking

`personalizedRecommendations(baseline, [], 3)` is greedy on remaining carbon and is ranked from the survey, so the top 3 stay put while actions are tried. Passing the selected ids would drop tried actions out of the three. For You does not do that.

`applyRecommendations` applies recs in catalog order. A further thermostat drop replaces the slight thermostat. One-fewer clothes drops repair. Repair will not cut a second item if clothes are already below baseline.

`sortRecommendations` orders a category list by isolated savings, or by easy → moderate → hard and then savings.

For You card kg is marginal. A Browse card for the same action shows isolated potential. Overlapping diet or travel actions make the stacked Potential total smaller than the sum of the isolated cards.

### Recommendation catalog (18)

| id | Title | Difficulty | What it changes |
|---|---|---|---|
| `food-waste-less` | Waste less food at home | Easy | waste step down |
| `food-one-beef` | Replace one beef or lamb meal a week | Easy | dietShare beef → plant (~1/21 of week) |
| `food-plant-meal` | Try a plant-based meal | Easy | shiftTowardPlants one meal |
| `food-meatless-monday` | Try Meatless Monday | Moderate | three meals toward plants |
| `food-mostly-plant` | Eat mostly plant-based meals | Hard | 40 points toward plants |
| `food-occasional-beef` | Make beef and lamb an occasional choice | Hard | beef above 5% → plant |
| `travel-combine` | Combine errands | Easy | miles × 0.85 |
| `travel-walk` | Walk or cycle a short trip | Easy | miles − 10 |
| `travel-transit` | Replace regular car journeys with public transport | Moderate | miles × 0.5 |
| `travel-flights` | Take fewer flights | Moderate | flights − 1 |
| `home-showers` | Take shorter showers | Easy | showerMinutes = 6 |
| `home-thermostat` | Lower winter thermostat slightly | Easy | −3°F from baseline (floor 50°F) |
| `home-thermostat-further` | Reduce winter thermostat further | Moderate | −6°F from baseline |
| `home-insulation` | Improve home insulation | Hard | insulationFactor = 0.85 |
| `clothes-one-fewer` | Buy one fewer new item this season | Easy | items − 1 |
| `clothes-repair` | Repair an item you already own | Easy | items − 1, does not stack with one-fewer |
| `clothes-fewer` | Buy fewer new clothes regularly | Moderate | floor(items / 2) |
| `clothes-secondhand` | Choose secondhand more often | Moderate | secondhandShare = 50% |

### Monthly snapshots

`CheckInSnapshot` in `src/model/checkin.ts`:

```ts
{
  month: "YYYY-MM";
  answers: Answers;          // updated survey, including hidden heat/shower/insulation fields
  carbonKg: number;          // calculate(answers) at save time
  selectedRecIds: RecId[];   // copy of what was selected; not applied to the footprint
  reflections: Partial<Record<RecId, ReflectionChoice>>;
}
```

`ReflectionChoice` is `"not-yet" | "trying" | "habit"`. On screen: “Not yet, but I'd like to.”, “Yes, I'm giving it a try!”, “Yes, it's become a regular habit.”

Stored on the profile as `checkIns`, via `recordCheckIn` → `upsertCheckIn`. One entry per month. A later save in the same month replaces that entry and keeps earlier months. Display math recomputes with `calculate(snapshot.answers)`.

The before/after chart freezes “previous” when the check-in screen opens (`startingKg`) and updates “updated” from the live draft. That session direction can differ from the versus-baseline sentence. `previousCheckIn` ignores a snapshot already stored for the month being edited.

`surveyProgress(baseline, checkIns, baselineMonth)` feeds `ProgressChart`. It prepends the original survey, then recomputes each check-in with `calculate`. It does not read `history` or selected recommendations.

`effortMessage` strings, used once under the Your Progress stat blocks and once on the saved check-in card:

- Decrease: “Your efforts are adding up! Small changes can make a meaningful difference.”
- Same or unavailable: “Every step counts. Change takes time, and there's always something new to explore.”
- Increase: “There's always room to grow. Every month is another opportunity to try something different.”

### Profile shape

```ts
{
  baseline: Answers;             // original survey year. Edit My Footprint can replace it.
  overrides: Partial<Answers>;   // applied recommendation scenario (potential)
  selectedRecIds: RecId[];
  history: { month: "YYYY-MM"; scenarioKg: number }[]; // selected-rec scenario, NOT check-ins
  checkIns: CheckInSnapshot[];
  baselineMonth: string | null;  // "YYYY-MM" of the original survey, when known
}
```

`scenarioOf(profile)` = baseline with overrides. `recordCheckIn` does not change `baseline`, `overrides`, or `selectedRecIds`.

`baselineMonth` is set to the current month when a new survey is finished. Editing the survey does not reset it. Older profiles without the field use the earliest `history` month if one exists. The chart label falls back to “Baseline” when no month is known.

`withMonthRecord` still writes `history[].scenarioKg` on each profile save. **The Progress UI does not read `history`.** Do not plot it as progress.

`finishBaseline` replaces the whole profile (empty overrides, selections, history, and check-ins). `editBaseline` does not.

---

## 7. Technical context

**Stack:** Vite 6, React 19, TypeScript, no router, `lucide-react` ^1.59.0, `@supabase/supabase-js` ^2.119.0, Vitest, `vite-plugin-pwa`. Package name `carbon-compass` 0.1.0.

```bash
npm run dev      # Vite. Prefer http://localhost:5173/ if it is already running. Do not start a second server. Restart it after changing .env.local.
npm test         # vitest run
npm run build    # tsc --noEmit && vite build
npm run icons    # scripts/make-icons.mjs
```

`npm run build` typechecks with `noUnusedLocals`. The PWA service-worker step can fail inside a sandbox (“Unable to write the service worker file”); rerun the build outside the sandbox if that happens. That failure is environmental, not a type error.

### Files

```
src/
  App.tsx                 Auth gate, screen state, shell mapping, profile sync, rec toggle, check-in save, edit survey
  main.tsx                React mount, AuthProvider, fonts, PWA service worker
  styles.css              All visual styling and color tokens
  lib/supabase.ts         Browser client from the two public env vars. Null when they are missing.
  screens/
    AuthGate.tsx          Logged-out welcome, sign up, forgot password, and the new-password screen
    Account.tsx           Profile / Settings: name, email, save name, log out
    Welcome.tsx           Product intro after sign-in when no footprint exists yet
    Baseline.tsx          8-question survey; also Edit My Footprint
    Compass.tsx           My Footprint page. Embeds Sources. Still passes heroTone="teal".
    Sources.tsx           Understand section when embedded. Standalone Understand screen is unused.
    Plan.tsx              Explore → For You
    Explore.tsx           Explore → Browse
    Mix.tsx               Explore → Potential Impact, and Your Impact → Your Progress
    CheckIn.tsx           Monthly Check-in (outside the shell)
    Together.tsx          Together homepage: sample snapshot, activity cards, category tiles, sample total
    Experiment.tsx        LEGACY — not routed
  components/
    AppShell.tsx          Bottom nav, account button, and tabs/swipe/dots only when a destination has 2+ labels
    Illustrations.tsx     Portraits, hearts, and Together activity-card scenes. Not the category tiles.
    PhoneShell.tsx        Hero + body. heroTone "teal" adds class is-teal, which has no color rules.
    RecommendationCard.tsx
    CategoryBreakdown.tsx Share cards, potential bars, CategoryGlyph
    FootprintBars.tsx     Check-in before/after bars
    ProgressChart.tsx     Your Progress line
    UsCompareChart.tsx    Horizontal U.S. comparison bars
    SourceSheet.tsx
    HabitControl.tsx
    DietControl.tsx
    CompassRose.tsx       LEGACY — old hex colors, unused
    MetricStrips.tsx      LEGACY
    ImpactTrio.tsx        LEGACY
    SavingsBanner.tsx     LEGACY
  data/
    habits.ts             Questions, starter/blank answers, ease/further helpers
    factors.ts            EPA / food / fiber numbers and assumptions
    diet.ts               Diet mix and donut colors
    home.ts               Apartment / Small / Larger / Other
    recommendations.ts    18 actions, apply, ranking, stacking, sort
    together.ts           Sample homepage figures, activity cards, and unused older posts
  model/
    types.ts              Answers, categories, footprint types. No confidence field.
    calculate.ts          Pure annual footprint. Also exports unused bestSmallMove().
    format.ts             Units, gasoline, trees, miles
    compare.ts            Typical U.S. lifestyle compare
    potentialBar.ts
    insight.ts
    progress.ts           Month helpers. history scenarioKg is not the progress chart.
    checkin.ts            Snapshots, progress points, effort copy
  state/
    profile.ts            Load, save, migrate, parseProfile, recordCheckIn, withMonthRecord, clearProfile
    auth.tsx              Session, recovery flag, AuthProvider
    accountData.ts        Fetch and save display name and footprint JSON
```

Also: `index.html`, `vite.config.ts`, `scripts/make-icons.mjs`, `public/favicon.svg`, `supabase/profiles.sql`, `.env.example`. `.env.local` is local only.

Tests: `calculate.test.ts`, `recommendations.test.ts`, `checkin.test.ts`, `profile.test.ts`, `potentialBar.test.ts`, `insight.test.ts`. There are no CSS tests. Add or update Vitest when changing `calculate`, `format`, `compare`, `potentialBar`, `progress`, `checkin`, `insight`, or recommendations.

`App.tsx` screen names, after a session exists: `welcome`, `baseline` (`editing` boolean), `app`, `check-in`, `account`. Logged out, `AuthGate` replaces those screens. A recovery session shows `ResetPassword` first.

### Legacy code (not in the current flow)

`Experiment.tsx`, `CompassRose.tsx`, `MetricStrips.tsx`, `ImpactTrio.tsx`, `SavingsBanner.tsx`, and `bestSmallMove()` in `calculate.ts`. Do not assume they are user-facing. Do not delete them unless the user asks. `CompassRose.tsx` still contains the old cream/forest hexes. Leave it alone.

The non-embedded branch of `Sources.tsx` and the unused `.is-teal` class are leftover paths, not a second live screen. Leave them unless the user asks to remove them.

### How to verify UI

Open `http://localhost:5173/` at phone width. Without a session the first screen is Welcome / Log in, not Together. Inside the shell, scroll `.view-pane`, not the page. Inactive destinations stay in the DOM, so `querySelector('.hero')` can hit a hidden hero. Scope to the visible destination, for example `.destination[aria-label="My Impact"]` or `#panel-potential-impact`. Together has no panel id. Do not click **Try this change**, finish a survey, save a check-in, or log out during a visual check. Those actions write or clear `carbon-compass-profile`.

The in-IDE browser screenshot tool has returned a stale frame while the accessibility tree was current. Prefer a fresh CDP `Page.captureScreenshot`, or confirm with `getBoundingClientRect` / computed style, before trusting a screenshot.

---

## 8. Outstanding issues

Do not treat these as bugs to fix unless the user asks. Several are intentional model limits.

### Product gaps

- Sources still does not explain, on the face of Understand your footprint, how a check-in updates the progress chart or why a selected action stays hypothetical. The factor steps, typical-year method, and gasoline note remain inside the disclosure.
- Together’s on-screen −1.4 tCO₂e is `sampleHome.avoided`, not the user’s `calculate()` result. Do not mix it into My Footprint or Your Progress. The unused `sampleCircle` constants are also not live totals.
- `public.profiles` was missing on 14 November 2026. Sign-up can create an auth user, but saving a name or footprint, and a safe log out when a footprint exists, need the SQL file run first.
- Vercel environment variables and the production redirect URL are not confirmed in the repo. Local redirect expected by the client is `window.location.origin`.
- Reflections do not change `calculate()`.
- There is no Start over control. Finishing a brand-new survey replaces the profile. Edit My Footprint does not wipe check-ins.
- `history` is still written and is easy to confuse with `checkIns`.
- The on-screen category heading is “By category,” not “Carbon Impact.”
- Home’s By category icon (`#E99A16` on `#F6E3B4`) is below a 3:1 contrast guideline. The palette was requested this way.
- White header text on `#71C39E` fails the usual contrast guideline. The user kept white titles on every `PhoneShell` header, including Together.
- Greedy ranking calls `calculate` many times. Fine at 18 recommendations.
- `#panel-overview .footprint-insight` and `.is-teal` no longer change anything visible.

### Calculation behavior to report, not silently change

- Blank survey numbers become typical U.S. defaults. A 100% beef share is about 109 kg of beef a year before the waste uplift, so occasional-beef savings can be very large and can exceed 100% of the ~6.9 t typical year.
- Heating’s +3% per °F is not capped.
- Each flight is modeled as a 2,000-mile domestic round trip. “Take fewer flights” subtracts one.
- No heat-source or shower question. Gas and 8 minutes are the defaults. `insulationFactor` and `secondhandShare` stay at the baseline until a recommendation is applied to the scenario.
- Home Other keyword mapping can mis-classify unusual text.
- Driving is gasoline at 0.393 kg/mile. No electric vehicles. No contrails.
- Orders exclude the product. Secondhand fiber is zero only when `secondhandShare` is set.
- Some energy totals are derived from carbon with a diesel stand-in. Carbon is the primary metric.
- Heating loads are assumed kWh by home size, not a utility bill.
- Diet is 21 × 100 g meals, not a nutrition diary.
- The typical U.S. lifestyle year (~6.9 t) is not the EPA inventory per person (~19 t).
- For You kg is marginal. Browse kg for the same action is isolated. The stacked Potential total can be smaller than the sum of the cards.
- A Browse trial must not save, change `baseline`, or mark an action achieved. Adding an action still requires **Try this change**.

---

## 9. Next steps

There is **no phase in progress**. The work below is already in the code:

1. Foundations: survey, `calculate`, sources, recommendations, persistence, PWA.
2. Potential savings, Your Progress, and Monthly Check-in.
3. Three-destination shell.
4. UX polish: swipe versus controls, disclosures, Lucide icons, keyboard, reduced motion.
5. Navigation correction: Potential Impact is Explore’s third view. Your Impact is only Your Progress.
6. An intermediate color pass (mint heroes, then a forest-green My Footprint-only hero and Overview pastels) was **replaced** by the warmer system in section 5. Do not restore `#327C62`, `#F8FBF6`, or decorative hero circles.
7. Warmer visual system: Warm Ivory page, `#71C39E` headers with white text on `PhoneShell` pages, white cards, pill buttons, pastel share cards with darker circles, exact 64×64 / 36×36 By category icons, Hard/Moderate badge swap, bottom nav without icon circles. Together uses that same header, with a smaller sans title.
8. My Footprint is one scrollable page: header, Understand your footprint (U.S. chart, gasoline tile, sticky sources), By category. No insight paragraph. No Overview/Understand tabs or dots.
9. Together is the first bottom-nav destination and the default homepage. It is a local illustrated prototype. Sample totals are not `calculate()` results. **Try it too** only stores a potential action.
10. The shorter visual pass is in the code: compact change cards, category tiles, stat blocks, and shorter heroes. Survey questions, friend stories, and the sources methodology stay written on purpose.

**Current phase:** accounts are in the client and blocked on one Supabase step.

**Recommended next task:** run `supabase/profiles.sql` in the Supabase SQL editor, then test sign up, email confirmation, log in, the top-right profile page, log out, and log in again. Confirm the name and footprint return, and that a second person on the same browser does not see the first person’s cache. Do not change `calculate()`, Explore, My Impact, or the Together layout as part of that test. Do not start friend feeds or community posts until that round trip works.

After that, only if the user asks: add copy inside **Understand your footprint** that explains how a monthly check-in updates the progress chart and why selected actions stay hypothetical. That explanation is not written yet.

### Decisions a new chat must keep

1. The bottom nav label is **My Impact**. Its views are My Footprint, then Your Progress. Potential Impact lives under Explore. Do not revive a separate Your Impact tab.
2. Selected actions are hypothetical. They never count as achieved reductions and never move the progress chart.
3. Your Progress uses the original survey and monthly check-ins only. Do not plot `history.scenarioKg`.
4. Monthly Check-in uses `FootprintBars`. Your Progress uses `ProgressChart`. One snapshot per calendar month.
5. Keep the three effort messages. No guilt, warning colors for an increase, or competition.
6. `calculate(answers)` is the only source of kg. Equivalences use the published factors above. Trees only at ≥ 60 kg.
7. On-screen compare percentages use the typical lifestyle year. The EPA ~19 t figure stays in Sources.
8. My Footprint shows the starting survey year, not the scenario and not the latest check-in.
9. A Browse trial is local React state.
10. Category icons stay the Lucide set above. By category cards stay on the `--*-card` / `--*-circle` / `--*-accent` tokens at 64×64 circles and 36×36 icons. Other category UI stays on `--food`, `--travel`, `--home`, and `--stuff`.
11. Every `PhoneShell` header is solid `#71C39E` with white text and no decorative circles, including Together. Together’s hero title is the smaller sans override. Do not restore a forest-green My Footprint-only hero or Deep Forest text on mint.
12. Page background stays Warm Ivory `#FAF7F0`. Cards stay white. Primary text stays `#173E38`. Primary button text is white.
13. The bottom nav is Together, Explore, and My Impact. Together is the default when a saved profile opens. My Footprint is the first view inside My Impact, and Your Progress is the second. Explore and My Impact both use tabs, swipe, and dots. Do not put My Footprint back in the bottom nav, and do not add Overview/Understand tabs inside My Footprint.
14. Together sample numbers stay labeled as samples. The live total is `−1.4 tCO₂e`, not the unused 245 kg card. Hearting a card must not call `toggleRec`. **Try it too** may. Category tiles only open Browse.
15. Difficulty badges: Easy pale green, Moderate pale with a dark outline, Hard solid lime. Do not swap them again, and do not restyle other chips to match.
16. Do not commit, push, or deploy unless the user asks.
17. Accounts use the public Supabase key only. Log out clears the device footprint after the account save succeeds. Do not delete the auth user from the client. Do not describe the `profiles` table as created until a query succeeds.

### How to work in a new chat

- Read this file first, then the files in section 7 that the task will touch.
- Inspect the code before rewriting. Treat the code as newer than this file if they disagree.
- Verify UI in the browser after visual or flow changes.
- If a new request conflicts with section 9, follow the user’s new instruction and say which decision changed.
