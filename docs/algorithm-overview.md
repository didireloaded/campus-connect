# Algorithm System — Overview

## What This System Powers

- Home Feed ranking
- Campus Buzz (trending)
- Feature-specific discovery (notes, events, marketplace)
- Light personalization

Designed around four principles: campus isolation, time sensitivity, engagement signals, and simplicity. No ML required. Works from 100 to 100,000+ users without breaking.

---

## Core Principles

1. All content is filtered by university first — no cross-campus bleed
2. New content is prioritized by default
3. Engagement (likes, comments, joins) increases visibility
4. Content decays naturally over time — old posts stop competing
5. Personalization is lightweight — track behavior, not identity

---

## Core Formula

```
score = (recency_weight   × recency_score)
      + (engagement_weight × engagement_score)
      + (relevance_weight  × relevance_score)
      + (boost_weight      × boost_score)
```

---

## Default Weights

| Weight | Value | Reason |
|---|---|---|
| `recency_weight` | 0.4 | Time is the primary signal early-stage |
| `engagement_weight` | 0.3 | Proven content rises naturally |
| `relevance_weight` | 0.2 | Light personalisation |
| `boost_weight` | 0.1 | Contextual nudges (upcoming events, etc.) |

Weights can be adjusted per content type. Events might have higher recency weight; lecture notes might have higher engagement weight.

---

## Score Components

### Recency Score
```
recency_score = 1 / (hours_since_post + 1)
```
A post from 1 hour ago scores 0.5. A post from 23 hours ago scores ~0.04. Natural decay without cutoffs.

### Engagement Score
```
engagement_score =
    (likes_count    × 1)
  + (comments_count × 2)
  + (joins_count    × 3)
  + (views_count    × 0.5)
```
Comments and joins are weighted higher than likes because they require more intent.

### Relevance Score
```
relevance_score =
    1.0  if same university
  + 0.5  if user has interacted with similar content type
  + 0.3  if content matches user's declared major/interests
```

### Boost Score
```
boost_score =
  +1.0  if event is in the next 24 hours
  +1.0  if study group session starts within 6 hours
  +0.5  if marketplace item posted in last 2 hours
  +0.5  if content type matches time-of-day context (see time-context.md)
```

---

## Final Score Calculation

```
score =
    (0.4 × recency_score)
  + (0.3 × engagement_score)
  + (0.2 × relevance_score)
  + (0.1 × boost_score)
```

---

## Implementation Options

### Option 1: Pure SQL (Simplest)
Compute the score inside a SQL view or function. Fastest for read performance.

### Option 2: Backend / Service Layer
Fetch raw data and calculate scores in TypeScript before rendering. More flexible.

### Option 3: Hybrid (Recommended)
- Basic filtering (university, date range, not expired) in SQL
- Score calculation in a TypeScript service layer
- Sort and slice before sending to client

See `algorithm-service.ts` and `supabase-queries.sql` for implementation.

---

## Database Requirements

### Required columns on all scored content tables
```sql
created_at      TIMESTAMPTZ  -- for recency
likes_count     INTEGER      -- engagement
comments_count  INTEGER      -- engagement
joins_count     INTEGER      -- engagement (events, groups)
views_count     INTEGER      -- engagement (soft signal)
university_id   UUID         -- campus isolation
```

### Optional columns
```sql
boost_score     NUMERIC      -- manual boost by admin
interest_tag    TEXT         -- category label for personalization
report_count    INTEGER      -- for anti-spam scoring
```

### Required Indexes
```sql
CREATE INDEX ON posts(university_id, created_at DESC);
CREATE INDEX ON events(university_id, event_date);
CREATE INDEX ON marketplace_items(university_id, created_at DESC);
CREATE INDEX ON lecture_notes(university_id, upvotes DESC);
```

---

## Files in This System

| File | Purpose |
|---|---|
| `algorithm-overview.md` | This file — system design and weights |
| `feed-algorithm.md` | Home feed specific scoring |
| `campus-buzz-algorithm.md` | Trending content algorithm |
| `personalization.md` | User interest tracking |
| `time-context.md` | Time-of-day content boosting |
| `content-lifecycle.md` | Expiry and decay rules |
| `anti-spam.md` | Rate limiting and abuse prevention |
| `algorithm-service.ts` | TypeScript implementation (ready to use) |
| `supabase-queries.sql` | SQL functions and queries |
