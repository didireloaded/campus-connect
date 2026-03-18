# Anonymous Interaction System

## Core Principle

Anonymous ≠ untraceable.

Users never see each other's real identities in anonymous contexts, but the platform always knows who posted what. This enables moderation while preserving the user experience of anonymity.

---

## 1. Anonymous Posting

### How It Works
When a user posts anonymously:
- `user_id` is stored in the DB (hidden from all public queries)
- `alias` field is populated with a generated name (e.g. "MidnightLion")
- `is_anonymous = true` on the post record
- Public queries return the alias, not the user's real username or avatar

### Alias Consistency
The same user gets the same alias within a 24-hour window per content type:
- Same person's confession posts today → same alias
- Same person's spotted posts today → same alias
- Resets the next day

```sql
-- Deterministic alias: hash(user_id + content_type + current_date)
-- Store in a lookup table for the day:

CREATE TABLE daily_aliases (
  user_id      UUID REFERENCES profiles(id),
  content_type TEXT,
  alias_date   DATE,
  alias        TEXT NOT NULL,
  PRIMARY KEY (user_id, content_type, alias_date)
);
```

```ts
// Get or create today's alias for this user+type
const getDailyAlias = async (userId: string, contentType: string): Promise<string> => {
  const today = new Date().toISOString().split('T')[0];
  const { data } = await supabase
    .from('daily_aliases')
    .select('alias')
    .eq('user_id', userId)
    .eq('content_type', contentType)
    .eq('alias_date', today)
    .maybeSingle();

  if (data) return data.alias;

  const alias = generateAlias(); // see launch-readiness-checklist.md
  await supabase.from('daily_aliases').insert({ user_id: userId, content_type: contentType, alias_date: today, alias });
  return alias;
};
```

### Important Rule
Admin moderation panels show real `user_id` and username. The public never does.

---

## 2. Comment Threads

### Structure
Comments are threaded to one level (flat threading recommended — avoid deep nesting on mobile).

```sql
CREATE TABLE post_comments (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id           UUID REFERENCES posts(id) ON DELETE CASCADE,
  user_id           UUID REFERENCES profiles(id),
  is_anonymous      BOOLEAN DEFAULT false,
  alias             TEXT,               -- if anonymous
  parent_comment_id UUID REFERENCES post_comments(id), -- nullable for top-level
  content           TEXT NOT NULL,
  created_at        TIMESTAMPTZ DEFAULT now()
);
```

### UX Rule
Maximum one level of nesting (comment → reply). Do not allow replies-to-replies. This keeps conversations readable on small screens.

---

## 3. Reply Notifications

### Trigger Conditions
- Someone replies to a post you created (anonymous or not)
- Someone replies to a comment you left

### Implementation
On comment insert, fire a notification to the original post author (and parent comment author if a reply):

```sql
-- Supabase trigger on post_comments INSERT
CREATE OR REPLACE FUNCTION notify_on_comment()
RETURNS TRIGGER AS $$
BEGIN
  -- Notify post author
  INSERT INTO notifications (user_id, actor_id, type, reference_id)
  SELECT p.user_id, NEW.user_id, 'comment', NEW.post_id
  FROM posts p
  WHERE p.id = NEW.post_id AND p.user_id != NEW.user_id;

  -- Notify parent comment author (if this is a reply)
  IF NEW.parent_comment_id IS NOT NULL THEN
    INSERT INTO notifications (user_id, actor_id, type, reference_id)
    SELECT pc.user_id, NEW.user_id, 'reply', NEW.id
    FROM post_comments pc
    WHERE pc.id = NEW.parent_comment_id AND pc.user_id != NEW.user_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

---

## 4. Peek Feature (Location Switching)

### Description
Users can temporarily view another campus's feed in read-only mode.

### Rules
- Read-only: cannot post, comment, react, or RSVP while peeking
- No limit on peek duration, but a cooldown of 5 minutes between switching campuses
- User's home campus is never changed

### Implementation
```sql
ALTER TABLE profiles
  ADD COLUMN peek_university_id UUID REFERENCES universities(id);
  -- NULL means currently viewing home campus
```

```ts
// In feed queries: use peek_university_id if set, else university_id
const activeUniId = profile.peek_university_id ?? profile.university_id;
const isPeeking = !!profile.peek_university_id;

// Show banner when peeking:
// "👀 Viewing [NUST] — Read only. Tap to return to your campus."
```

---

## 5. Radius Control

### Description
Controls how far from campus coordinates content is included.

### Options
| Radius | Use Case |
|---|---|
| 5km | Tight local community feel |
| 10km | Surrounding neighborhood included |
| 25km | Greater metropolitan area |
| 50km | Regional reach |

### Recommendation
Lock the default at 10km for most campuses. Do not allow users to expand beyond 25km — it dilutes the campus-specific feel that makes these apps work.

```sql
-- Content with GPS filtering (applies to events, marketplace, rides)
SELECT * FROM events
WHERE university_id = :uni_id
  AND (
    latitude IS NULL  -- include events without coordinates
    OR (
      6371 * acos(
        cos(radians(:campus_lat)) * cos(radians(latitude))
        * cos(radians(longitude) - radians(:campus_lng))
        + sin(radians(:campus_lat)) * sin(radians(latitude))
      ) <= :radius_km
    )
  );
```

---

## 6. Safety & Moderation

### Tools Available

| Tool | Purpose |
|---|---|
| Report system | Community flags content |
| AI content filter | Auto-flags harmful content on insert |
| Downvote system | Community quality signal |
| Shadow banning | Reduce visibility without alerting user |
| Temporary suspension | 7-day posting ban |
| Account ban | Permanent, admin only |

### Report Flow
```
User taps Report → selects reason → submitted to reports table
                  ↓
Supabase trigger checks if reports >= 3
                  ↓
Yes → set moderation_status = 'flagged', reduce score
                  ↓
Admin sees flagged content in dashboard
                  ↓
Admin approves (restore) or removes (set status = 'removed')
```

### Reports Table
```sql
CREATE TABLE reports (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id  UUID REFERENCES profiles(id),
  content_type TEXT,            -- 'post', 'comment', 'confession', 'spotted', etc.
  content_id   UUID,
  reason       TEXT CHECK (reason IN ('spam', 'harassment', 'explicit', 'doxxing', 'misinformation', 'other')),
  status       TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'dismissed')),
  created_at   TIMESTAMPTZ DEFAULT now()
);
```

---

## 7. Direct Messaging

### Description
Private messages between users, triggered from posts or profiles.

### Anonymous DM Mode
When opening a DM from an anonymous post, the thread is opened with a temporary alias for the anonymous party. Neither party sees the other's real identity until they choose to reveal it.

```sql
CREATE TABLE direct_messages (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id   UUID NOT NULL,       -- groups messages into conversations
  sender_id   UUID REFERENCES profiles(id),
  receiver_id UUID REFERENCES profiles(id),
  content     TEXT NOT NULL,
  sender_alias TEXT,               -- set if sender wants anonymity
  is_anonymous BOOLEAN DEFAULT false,
  created_at  TIMESTAMPTZ DEFAULT now(),
  read        BOOLEAN DEFAULT false
);

CREATE TABLE dm_threads (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_a       UUID REFERENCES profiles(id),
  user_b       UUID REFERENCES profiles(id),
  listing_id   UUID,               -- optional: tied to a marketplace listing
  created_at   TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_a, user_b)
);
```

---

## 8. Reputation Score

### Description
A soft reputation system that rewards good participation without creating a competitive leaderboard.

### Points
| Action | Points |
|---|---|
| Upvote received on a lecture note | +1 |
| Post gets 10+ reactions | +2 |
| Study group session completed | +1 |
| Report dismissed (false report) | -1 |
| Post removed for violations | -5 |

```sql
ALTER TABLE profiles ADD COLUMN reputation_score INTEGER DEFAULT 0;

-- Update on upvote insert:
UPDATE profiles SET reputation_score = reputation_score + 1
WHERE id = (SELECT uploader_id FROM lecture_notes WHERE id = NEW.note_id);
```

### Display
Shown as a small number on the user's public profile. Not shown in anonymous contexts. Not a leaderboard.

---

## 9. Saved Posts

```sql
CREATE TABLE saved_posts (
  user_id    UUID REFERENCES profiles(id),
  post_id    UUID,
  post_type  TEXT,  -- 'feed', 'confession', 'spotted', 'wall'
  saved_at   TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (user_id, post_id)
);
```

Users can bookmark any post. Accessible from Profile → Saved tab.

---

## 10. Engagement Loop

This is the system that drives user retention:

```
1. User posts anonymously (low barrier to entry)
       ↓
2. Others engage (upvotes, comments, reactions)
       ↓
3. Original poster gets a notification
       ↓
4. They return to the app to see the reaction
       ↓
5. While they're in the app, they scroll and engage with other content
       ↓
6. The feed stays fresh (expiry system, time decay)
       ↓
7. Score/streak adds a quiet reward signal
       ↓
8. Quality is maintained (AI moderation + reports)
       ↓
Back to step 1
```

Every feature in the system should support at least one step of this loop.

---

## 11. Campus Verification

### Email Domain Verification
```ts
const CAMPUS_DOMAINS: Record<string, string> = {
  'mail.uc.edu': 'University of Cincinnati',
  'student.unam.edu.na': 'University of Namibia',
  'nust.na': 'NUST Namibia',
};

const validateUniversityEmail = (email: string): string | null => {
  const domain = email.split('@')[1];
  return CAMPUS_DOMAINS[domain] || null;
};
```

### GPS Zone Validation (Optional)
On first signup, optionally confirm the user is physically on or near campus:
- Check if current GPS coordinates are within 5km of campus centroid
- If not on campus, fall back to email verification only
- Never block signup based on location — it's a soft validation

---

## 12. Anonymous Heatmap

Shows aggregate activity density across campus without revealing individual users.

```sql
-- Grid-based aggregation (100m × 100m cells)
-- Round coordinates to 3 decimal places (~100m precision)
SELECT
  ROUND(latitude::NUMERIC, 3)  AS lat_cell,
  ROUND(longitude::NUMERIC, 3) AS lng_cell,
  COUNT(*)                      AS activity_count
FROM (
  SELECT latitude, longitude FROM posts     WHERE university_id = :uni_id AND created_at > now() - INTERVAL '2 hours' AND latitude IS NOT NULL
  UNION ALL
  SELECT latitude, longitude FROM events    WHERE university_id = :uni_id AND event_date > now() - INTERVAL '2 hours'
) AS activity
GROUP BY lat_cell, lng_cell
HAVING COUNT(*) >= 2  -- minimum threshold to show a cell (prevents single-user identification)
ORDER BY activity_count DESC;
```
