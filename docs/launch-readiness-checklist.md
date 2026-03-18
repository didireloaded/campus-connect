# Launch Readiness & Production Checklist

A practical guide to everything that must be in place before Campus Connect goes live. Covers onboarding, content seeding, moderation, performance, and growth strategy.

---

## 1. Onboarding That Doesn't Kill Momentum

Most apps lose users here. Every unnecessary screen kills a signup.

**Rules:**
- 3–5 screens maximum
- University selection on screen 1 — no waiting
- Land straight into content after signup
- Never show an empty feed — ever

**Screen flow:**
```
1. Welcome splash + "Get Started"
2. Pick your university (2×2 grid, logo per school)
3. Email + name (or continue with Google)
4. Quick profile: major + year (optional but shown)
5. → Home Feed (seeded content already visible)
```

**Empty state prevention:** seed content before any user signs up (see Section 2).

---

## 2. Cold Start Content (Critical)

If users open the app and see nothing, the app dies. This is not optional.

**What to seed before launch:**

| Content Type | Minimum Count | Notes |
|---|---|---|
| Confessions | 15–20 | Fun, relatable campus topics |
| Spotted posts | 10–15 | Wholesome, mysterious, funny mix |
| Marketplace items | 10–15 | Textbooks, electronics, clothing |
| Events | 5–8 | Real or plausible upcoming events |
| Polls | 5 | Opinion-based, easy to vote on |
| Wall posts | 10–15 | Anonymous, lightweight observations |

**Total target:** 50–80 pieces of seeded content per campus before launch.

**How to seed:**
- Create a small internal team (2–3 people) who post as real early users
- Do NOT use fake accounts with obvious bot behavior
- Vary posting times across 48–72 hours before launch so content looks organic

---

## 3. Alias Generator

Anonymous names must feel fun and memorable — not random strings.

**Bad:** `User4729`, `Anon_882`, `Guest_01`

**Good:** `MidnightLion`, `CampusGhost`, `SilentOwl`, `NeonTiger`, `CosmicBear`

**Format:** `[Adjective][Animal/Noun][Optional 2-digit number]`

**Word banks:**

Adjectives:
```
Midnight, Cosmic, Silent, Neon, Crystal, Shadow, Velvet, Lunar, Electric, Phantom,
Wandering, Mystic, Golden, Crimson, Frozen, Blazing, Hollow, Distant, Secret, Wild
```

Nouns:
```
Lion, Owl, Bear, Tiger, Fox, Wolf, Hawk, Panda, Raven, Falcon,
Ghost, Comet, Storm, Flame, Echo, Drift, Spark, Mist, Wave, Cipher
```

**Implementation:**
```ts
// src/utils/aliasGenerator.ts

const adjectives = ['Midnight', 'Cosmic', 'Silent', 'Neon', 'Wandering', ...];
const nouns = ['Lion', 'Owl', 'Bear', 'Tiger', 'Fox', 'Ghost', ...];

export function generateAlias(): string {
  const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  const num = Math.random() > 0.5 ? Math.floor(Math.random() * 99) : '';
  return `${adj}${noun}${num}`;
}
```

**Consistency rule:** The same user gets the same alias within a 24-hour window on the same content type (confessions, wall, spotted). This makes threaded conversations feel cohesive without exposing identity.

---

## 4. Content Expiry System

Expiry creates urgency (FOMO) and keeps the feed fresh. Without it, old content clogs the feed forever.

| Content Type | Expiry | Reason |
|---|---|---|
| Confessions | 24 hours | Core anonymous mechanic |
| Spotted | 24–48 hours | Relevance window |
| Wall posts | 24 hours | Keeps it ephemeral |
| Help requests | 6–12 hours | Time-sensitive by nature |
| Marketplace | 30 days | Items may still be available |
| Events | Auto-hides after end time | Past events add noise |
| Polls | Creator-defined (default 48h) | |

**Implementation:**
```sql
-- All time-limited tables have expires_at column
-- A scheduled function or cron job runs every hour:

UPDATE confessions SET visible = false
WHERE expires_at < now() AND visible = true;

-- Or filter at query time (simpler, recommended):
SELECT * FROM confessions
WHERE expires_at > now()
ORDER BY created_at DESC;
```

**Edge Function (Supabase):** Set up a `cleanup-expired-content` function that runs on a cron schedule. It doesn't delete rows (preserve for moderation), it sets a `visible` flag to `false`.

---

## 5. Rate Limiting

Prevent spam before it becomes a problem. Implement from day one.

| Action | Limit | Window |
|---|---|---|
| Posts (feed, wall, confessions, spotted) | 5 per user | Per 24 hours |
| Comments | 20 per user | Per 1 hour |
| Marketplace listings | 3 per user | Per 24 hours |
| Poll creation | 2 per user | Per 24 hours |
| Event creation | 2 per user | Per 24 hours |
| Report submissions | 10 per user | Per 24 hours |

**Implementation options:**

Option A — DB trigger (simple):
```sql
CREATE OR REPLACE FUNCTION check_post_rate_limit()
RETURNS TRIGGER AS $$
DECLARE count INT;
BEGIN
  SELECT COUNT(*) INTO count
  FROM posts
  WHERE user_id = NEW.user_id
    AND created_at > now() - INTERVAL '24 hours';

  IF count >= 5 THEN
    RAISE EXCEPTION 'Rate limit: max 5 posts per day';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER post_rate_limit
BEFORE INSERT ON posts
FOR EACH ROW EXECUTE FUNCTION check_post_rate_limit();
```

Option B — Frontend check (fast UX):
```ts
const checkRateLimit = async (userId: string, table: string, maxCount: number, windowHours: number) => {
  const { count } = await supabase
    .from(table)
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('created_at', new Date(Date.now() - windowHours * 3600 * 1000).toISOString());

  return count >= maxCount;
};
```

Use **both**: frontend check for fast UX feedback, DB trigger as the hard guard.

---

## 6. Shadow Moderation

Never ban users visibly unless absolutely necessary. Shadow reduction keeps the platform stable without public drama.

**How it works:**
- Flagged users' posts are still visible to them
- But their posts appear lower in feeds for everyone else
- They don't know their visibility has been reduced
- They don't rage-quit or complain publicly

**Trigger conditions:**
- User receives 3+ reports in 7 days
- Post flagged by AI moderation as `severity: high`
- Admin manually flags the account

**Implementation:**
```sql
ALTER TABLE users
  ADD COLUMN shadow_reduced BOOLEAN DEFAULT false,
  ADD COLUMN shadow_reduced_at TIMESTAMPTZ;

-- In feed query: deprioritize shadow-reduced users
ORDER BY
  CASE WHEN u.shadow_reduced THEN 0 ELSE 1 END DESC,
  score DESC
```

**Escalation path:**
1. Shadow reduce (silent, reversible)
2. Temporary suspension (7 days)
3. Permanent ban (manual admin action only)

---

## 7. "First 100 Users" Strategy

This matters more than any feature. The first 100 users create the energy that attracts the next 1,000.

**Who to target first:**

| Role | Why |
|---|---|
| Student council / leaders | Formal reach + credibility |
| Campus influencers | Social reach (Instagram, TikTok) |
| Party/event organizers | Create real events in the app |
| Residence hall leaders | Captive audience in dorms |
| Active WhatsApp group admins | Already organizing students |

**Activation tactics:**
- Give early users a "Founding Member" badge on their profile
- Ask them to post 3 things before inviting friends (seeds the feed)
- Create a private WhatsApp group for early adopters to give feedback
- Host a physical "App Launch" event at the campus union and demo live

**Goal:** Before public launch, have 50 real users actively posting so the feed looks alive.

---

## 8. Event Loop (Growth Engine)

Events are the most powerful organic growth driver. Build everything around this loop:

```
Event announced → students post about it
→ others see and RSVP
→ event buzz spreads
→ new users download to see what's happening
→ they RSVP and post
→ loop continues
```

**How to activate:**
1. Partner with event organizers before launch to list their events first
2. When an event hits 10+ RSVPs, auto-promote it to "Featured" in the feed
3. The day before an event, send a push notification to RSVPs: "Your event is tomorrow!"
4. After the event, prompt attendees: "How was [Event Name]? Post about it."

**The flywheel effect:** Events create posts → posts create notifications → notifications bring users back → returning users create more content.

---

## 9. Light Gamification

Small psychological rewards that encourage participation. Do not overdo it — heavy gamification feels like a chore.

**What to implement:**

| Feature | Implementation |
|---|---|
| Score / reputation | +1 per upvote received on notes, posts |
| Active streak | "🔥 3 days active" shown on profile |
| "Active Now" indicator | Green dot on avatar if last active < 15 min |
| Founding Member badge | One-time badge for first 100 signups |

**What to avoid:**
- ❌ Leaderboards (creates unhealthy competition)
- ❌ Complex point systems (cognitive load)
- ❌ Badges for everything (devalues the system)
- ❌ Levels / ranks (feels like a game, not a campus tool)

**Streak implementation:**
```sql
-- Track last_active_date on profiles
-- On any app open, update:
UPDATE profiles
SET last_active = now(),
    streak_days = CASE
      WHEN last_active::date = current_date - 1 THEN streak_days + 1
      WHEN last_active::date = current_date THEN streak_days
      ELSE 1
    END
WHERE id = auth.uid();
```

---

## 10. Offline Handling

Students on campus often have unstable WiFi and poor mobile data. The app must not feel broken offline.

**What to cache:**
- Last 20 posts from the feed (React Query cache)
- User's own profile data
- Active marketplace listings the user browsed
- Study group messages from the last 24h

**What to do when offline:**
- Show cached content with a subtle "Last updated X min ago" banner
- Disable post/comment inputs with tooltip: "You're offline. Connect to post."
- Queue failed uploads and retry automatically when connection returns

**Implementation (React Query):**
```ts
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,   // 5 min
      cacheTime: 30 * 60 * 1000,  // 30 min (serves as offline cache)
      retry: 2,
    },
  },
});
```

**Upload queue (for posts/images):**
```ts
// Store failed uploads in AsyncStorage
// On app foreground, check the queue and retry
```

---

## 11. Error UX

Error messages are a product decision, not just engineering. Bad error messages lose users.

**Never show:**
- "Something went wrong"
- "Error 500"
- "Undefined is not a function"
- A blank white screen

**Always show:**
- What failed (specific)
- What the user can do (actionable)
- A retry option (where possible)

**Examples:**

| Situation | Bad | Good |
|---|---|---|
| Feed fails to load | "Error loading data" | "Couldn't load posts. Tap to retry." |
| Image upload fails | "Upload failed" | "Couldn't upload photo. Check your connection and try again." |
| Post fails to send | "Error" | "Your post didn't go through. We saved a draft — tap to retry." |
| Login fails | "Invalid credentials" | "Wrong email or password. Need help? Reset your password." |

---

## 12. Feature Gating

Don't show everything at once. A complex app on day one overwhelms new users.

**Unlock schedule:**

| Week | Features Active |
|---|---|
| Week 1 | Home feed, The Wall, Confessions, Events |
| Week 2 | Marketplace, Lost & Found, Spotted |
| Week 3 | Study Groups, Lecture Notes, Ride Share |
| Week 4 | Polls, Jobs, Clubs, Campus Updates |

**How to gate (simple version):**
```ts
// utils/featureFlags.ts
export const FEATURES = {
  marketplace:    true,  // toggle false to hide
  studyGroups:    true,
  lectureNotes:   false, // not live yet
  campusUpdates:  false,
};

// In Discover page:
{FEATURES.lectureNotes && <DiscoverCard label="Lecture Notes" ... />}
```

Store flags in a `feature_flags` table in Supabase so you can toggle without a deployment.

---

## 13. Analytics

You cannot improve what you don't measure. Track from day one.

**Metrics to track:**

| Metric | Why It Matters |
|---|---|
| Daily Active Users (DAU) | Core health signal |
| D1 / D7 / D30 retention | Are users coming back? |
| Posts per user per day | Engagement quality |
| Time in app per session | Stickiness |
| Most used features | Where to invest |
| Drop-off in signup flow | Where users abandon onboarding |

**Tools:**

Option A — PostHog (recommended, self-hostable, free tier):
```ts
import PostHog from 'posthog-react-native';
PostHog.capture('post_created', { type: 'confession', university: 'UNAM' });
```

Option B — Supabase logs + custom analytics table:
```sql
CREATE TABLE analytics_events (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID,
  event_name TEXT,
  properties JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

**Key events to capture:**
- `signup_completed`, `onboarding_step_{n}`
- `post_created`, `comment_created`, `reaction_added`
- `feature_opened` (marketplace, study_groups, etc.)
- `session_started`, `session_ended`

---

## 14. Performance

A slow app feels broken even if the code is correct.

**Frontend:**
- Paginate all feeds (20 items per page, infinite scroll)
- Lazy load images with `expo-image` (already in the codebase)
- Use `FlatList` with `getItemLayout` for fixed-height items
- Memoize `renderItem` with `useCallback`
- Use skeleton loaders, never blank space

**Database:**
```sql
-- These indexes are critical:
CREATE INDEX ON posts(university_id, created_at DESC);
CREATE INDEX ON events(university_id, event_date);
CREATE INDEX ON marketplace_items(university_id, created_at DESC);
CREATE INDEX ON lecture_notes(university_id, upvotes DESC);
```

**Images:**
- Compress before upload (use `browser-image-compression` or `expo-image-manipulator`)
- Target: max 500KB per image
- Use Supabase Storage CDN URLs, never direct file paths

**Target metrics:**
- Feed loads in < 1.5s on 4G
- Images load in < 800ms
- Post creation confirms in < 1s

---

## 15. Identity Without Identity

This is the core tension that makes anonymous campus apps work: users are anonymous but still feel like themselves.

**How it works:**
- The alias is random but consistent within a session/day
- Upvotes and comments accrue to the alias, not the person
- But the user privately knows it was them — that's the quiet reward
- Over time, regulars become recognizable through *behavior*, not names

**The balance:**
```
Too anonymous → no accountability → becomes toxic
Too identified → no freedom → people self-censor
```

**The sweet spot:**
- Alias that persists for a day (feels like a character)
- Real user_id stored privately (enables moderation)
- No way to search by identity (no social graph)
- But behavior (posting style, topics, timing) creates a soft fingerprint

This is not a bug — it's the feature that keeps people coming back.
