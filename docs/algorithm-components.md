# Feed Algorithm

## Purpose
Rank content for the Home screen. Balances recency and engagement to keep the feed fresh and rewarding.

---

## Inputs
- `created_at` — when the content was posted
- `likes_count`, `comments_count`, `joins_count` — engagement signals
- `university_id` — campus isolation
- User interaction history — for relevance boost

---

## Step 1: Recency Score
```
recency_score = 1 / (hours_since_post + 1)
```
Examples: 0 hours → 1.0, 1 hour → 0.5, 24 hours → 0.04

---

## Step 2: Engagement Score
```
engagement_score =
    (likes_count    × 1)
  + (comments_count × 2)
  + (joins_count    × 3)
```

---

## Step 3: Relevance Score
```
relevance_score =
    1.0  if same university (always true after university filter)
  + 0.5  if user interacted with similar content in last 7 days
```

---

## Step 4: Boost Score
```
boost_score =
  +1.0  if event_date is within next 24 hours
  +1.0  if study group session within 6 hours
  +0.5  if marketplace listing < 2 hours old
```

---

## Final Score
```
score = (0.4 × recency_score)
      + (0.3 × engagement_score)
      + (0.2 × relevance_score)
      + (0.1 × boost_score)
```

---

## Query Pattern
```sql
-- Fetch raw, score in service layer
SELECT * FROM posts
WHERE university_id = :user_university_id
  AND created_at > now() - INTERVAL '72 hours'
ORDER BY created_at DESC
LIMIT 50;
-- Then sortByFeedScore(data) in TypeScript
```

---
---

# Campus Buzz — Trending Algorithm

## Purpose
Surface the most active content across the campus right now. Used in the Campus Buzz section of the Discover page.

---

## Formula
```
trend_score = engagement_score / time_decay
```

---

## Engagement Score
```
engagement_score =
    likes_count
  + (comments_count × 2)
  + (joins_count    × 3)
  + (views_count    × 0.5)
```

---

## Time Decay
```
time_decay = hours_since_post + 2
```
The `+2` prevents very new content with zero engagement from scoring infinitely high.

---

## Full Formula
```
trend_score =
  (likes + comments×2 + joins×3 + views×0.5)
  / (hours_since_post + 2)
```

---

## Behaviour
- New + active content rises quickly
- Old content fades naturally — no manual curation needed
- A post with 50 reactions from 1 hour ago beats a post with 200 reactions from 2 days ago

---

## Content Types in Campus Buzz
Apply to any content table with engagement fields:
- Confessions
- Spotted
- Events
- Marketplace items
- Polls
- Wall posts

---

## Union Query (Campus Buzz Feed)
```sql
SELECT 'confession' AS type, id, content AS title, created_at,
  calculate_trending_score(likes_count, comments_count, 0, views_count, created_at) AS trend_score
FROM confessions WHERE university_id = :uni_id

UNION ALL

SELECT 'event', id, title, created_at,
  calculate_trending_score(likes_count, comments_count, attendee_count, views_count, created_at)
FROM events WHERE university_id = :uni_id AND event_date > now()

UNION ALL

SELECT 'spotted', id, title, created_at,
  calculate_trending_score(
    (SELECT COUNT(*) FROM spotted_reactions WHERE post_id = spotted_posts.id),
    (SELECT COUNT(*) FROM spotted_comments WHERE post_id = spotted_posts.id),
    0, 0, created_at
  )
FROM spotted_posts WHERE university_id = :uni_id AND expires_at > now()

ORDER BY trend_score DESC
LIMIT 20;
```

---
---

# Personalization System

## Goal
Light personalization without complexity. No ML, no overfitting, no recommendation black box.

---

## What to Track

Store a simple interaction log per user:
```sql
CREATE TABLE user_interactions (
  user_id       UUID REFERENCES profiles(id),
  content_type  TEXT,  -- 'marketplace', 'study_groups', 'events', etc.
  action        TEXT,  -- 'view', 'click', 'join', 'comment', 'like'
  created_at    TIMESTAMPTZ DEFAULT now()
);
```

---

## Interest Categories
```
marketplace
study_groups
events
confessions
jobs
spotted
lecture_notes
```

---

## Interest Score Calculation
```
interest_score[category] = COUNT(interactions WHERE content_type = category AND created_at > now() - 7 days)
```

---

## Boost Logic
```ts
const PERSONALIZATION_THRESHOLD = 3; // minimum interactions to trigger boost

const boost = (item, userInterests) => {
  const category = item.content_type;
  const score = userInterests[category] || 0;
  return score > PERSONALIZATION_THRESHOLD ? 0.2 : 0;
};
```

---

## Final Score with Personalization
```
final_score = base_score + (interest_score × 0.2)
```

---

## Important Constraints
- Never boost more than 20% above base score
- No cross-university personalization
- Clear interaction history after 30 days (prevents stale preferences)
- Never infer identity from interest patterns

---
---

# Time-Based Context System

## Purpose
Adapt what gets promoted based on time of day. Students have different needs at 8am vs 10pm.

---

## Morning (06:00–12:00)
Boost:
- Study Groups (morning sessions)
- Lecture Notes (before class)
- Jobs & Internships (professional mindset)
- Events happening today

`boost_score += 0.5` for these categories during this window.

---

## Afternoon (12:00–18:00)
Boost:
- Marketplace (free time to browse)
- Campus Buzz (high activity period)
- Ride Share (going home)
- Events starting this evening

---

## Evening / Night (18:00–02:00)
Boost:
- Events (social hours)
- Confessions (peak posting time)
- Spotted (peak posting time)
- Wall posts

---

## Implementation
```ts
// src/utils/timeContext.ts

type TimeWindow = 'morning' | 'afternoon' | 'evening';

export function getTimeWindow(): TimeWindow {
  const hour = new Date().getHours();
  if (hour >= 6  && hour < 12) return 'morning';
  if (hour >= 12 && hour < 18) return 'afternoon';
  return 'evening';
}

const TIME_BOOSTS: Record<TimeWindow, string[]> = {
  morning:   ['study_groups', 'lecture_notes', 'jobs', 'events'],
  afternoon: ['marketplace', 'campus_buzz', 'rides', 'events'],
  evening:   ['events', 'confessions', 'spotted', 'wall'],
};

export function getTimeBoost(contentType: string): number {
  const window = getTimeWindow();
  return TIME_BOOSTS[window].includes(contentType) ? 0.5 : 0;
}
```

---
---

# Content Lifecycle Rules

Rules for how content ages, expires, and changes visibility over time.

---

## Confessions
- **Expires:** 24 hours after creation
- **Query filter:** `WHERE expires_at > now()`
- **On expiry:** Set `visible = false` (preserve for moderation, don't delete)

---

## Spotted
- **Expires:** 24–48 hours (user chooses at creation, default 24h)
- Same expiry logic as confessions

---

## Wall Posts
- **Expires:** 24 hours
- Same expiry logic

---

## Help Requests
- **Expires:** 6–12 hours (user chooses at creation, default 6h)
- Can be manually marked "Resolved" before expiry

---

## Events
- **Before start:** Boost score increases as event_date approaches
- **After end:** Filter from active feed (`WHERE event_date > now()`)
- **Preserve:** Keep in user's "Attended" history permanently

---

## Marketplace Items
- **Active window:** 30 days
- **After 30 days:** Auto-expire unless seller renews
- **After sold:** Immediately hidden from browse feed

---

## Study Groups
- **Session boost:** `boost_score += 1.0` in the 6 hours before a scheduled session
- **After session:** Group remains active (unlike events); only deleted by creator or admin

---

## Jobs & Internships
- **Active:** Until deadline
- **Boost:** Increases as deadline approaches (urgency)
- **After deadline:** Automatically hidden from feed

---

## Polls
- **Default expiry:** 48 hours
- **Custom:** Creator can set 24h, 48h, or 7 days
- **After expiry:** Show results only, no more voting

---

## Lecture Notes
- **No expiry:** Notes are permanent resources
- **Visibility decay:** Notes older than 6 months drop in default sort (recency weight decreases)
- **Upvoted notes:** Immune to age decay — high-upvoted notes stay visible indefinitely

---
---

# Anti-Spam System

## Post Limits (DB-enforced)

| Content Type | Daily Limit |
|---|---|
| Feed posts | 5 per user |
| Confessions | 5 per user |
| Spotted | 3 per user |
| Marketplace listings | 3 per user |
| Polls | 2 per user |
| Events | 2 per user |
| Comments | 20 per hour |

---

## Duplicate Detection
Prevent identical or near-identical content posted in quick succession:
```sql
-- Reject if same user posted same content in last 10 minutes
SELECT COUNT(*) FROM posts
WHERE user_id = NEW.user_id
  AND content = NEW.content
  AND created_at > now() - INTERVAL '10 minutes';
-- If count > 0, raise exception
```

---

## Report Threshold
```
IF report_count >= 3 THEN
  reduce score by 50%

IF report_count >= 7 THEN
  hide from feed (moderation_status = 'flagged')
  notify admin
```

---

## Shadow Reduction
When a user is flagged:
- Their content is still visible to them
- In feed queries, deprioritize by sorting flagged users' content last
- They do not receive a notification or warning

```sql
-- In feed ORDER BY clause:
ORDER BY
  CASE WHEN u.shadow_reduced THEN 0 ELSE 1 END DESC,
  score DESC
```

---

## Escalation Levels
1. **Shadow reduce** — posts visible but deprioritized
2. **Temporary suspension** — 7-day posting ban
3. **Permanent ban** — admin decision only, requires multiple severe violations

---

## Bot Detection Signals
Flag an account for review if:
- Posts > 10 times within 1 hour
- Identical comment posted on 5+ posts in quick succession
- New account (< 24h old) posts > 3 times in first hour
