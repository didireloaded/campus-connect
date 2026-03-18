# Campus Updates

## What It Is

A structured information hub inside Campus Connect that shows students what is officially happening at their university. Not a social feed — a calm, trustworthy information board.

> "If something important happens, it will be in this app."

That belief is what builds long-term retention.

---

## Where It Lives

**Recommended:** Discover → Campus Life section

**Alternative (if you want it to feel important):** Give it its own tab in the bottom nav, replacing Explore.

---

## What the Screen Shows

### Layout

**Header:**
```
[University Logo]  UNAM Updates
"Latest official updates and announcements"
                              🔔 3 unread
```

**Filter tabs (horizontal):**
```
All   |   Official   |   Social   |   Events
```

---

### Section 1 — Latest (Priority)
2–3 highest-priority items. Always at the top.

```
🔔 Latest
┌────────────────────────────────────────┐
│ Registration Opens Monday              │
│ Semester 2 registration begins next    │
│ week for all enrolled students.        │
│                                        │
│ Source: UNAM Website  •  2h ago        │
└────────────────────────────────────────┘
```

### Section 2 — Official Announcements
University-sourced content: notices, policy changes, academic updates.

```
🏛️ Official
┌──────────────────┐  ┌──────────────────┐
│ Library Hours    │  │ Exam Timetable   │
│ Extended During  │  │ Released for     │
│ Exams            │  │ Semester 2       │
└──────────────────┘  └──────────────────┘
```

### Section 3 — From Social Media
Instagram/Facebook posts from official university accounts.

```
🌐 Social
┌────────────────────────────────────────┐
│ [Image preview]                        │
│ Caption preview (truncated)...         │
│ Source: @unam_namibia  •  5h ago       │
│ [View Post →]                          │
└────────────────────────────────────────┘
```

### Section 4 — Events & Notices
Upcoming dates and deadlines from the university calendar.

```
📅 Events & Notices
Open Day – Friday
Career Fair – Next Week
Graduation Ceremony – 15 March
```

---

## Card Design Spec

All update cards follow this pattern:
- Soft background (`#FAFAFA` light / `#1F2937` dark)
- Subtle shadow
- Rounded corners (12px)
- Small coloured source label
- Compact — not full-width post style
- Unread: slightly brighter with a small dot indicator
- Read: slightly faded

---

## How the Data Works

### Architecture
```
External Sources
      ↓
Backend Fetch Job (cron, every 15–30 min)
      ↓
Clean + AI summarize (optional)
      ↓
campus_updates table in Supabase
      ↓
App fetches from Supabase only
```

**The app never fetches directly from external sources.** All ingestion happens server-side.

---

### Data Sources

**Option A — RSS Feed (best, if available):**
```ts
const fetchRSS = async (universitySlug: string) => {
  const rssUrl = RSS_FEEDS[universitySlug]; // e.g. https://unam.edu.na/rss
  const res = await fetch(rssUrl);
  const xml = await res.text();
  const items = parseRSS(xml); // use 'rss-parser' npm package
  return items.map(item => ({
    title: item.title,
    content: item.contentSnippet,
    source_url: item.link,
    source_type: 'website',
    created_at: item.pubDate,
  }));
};
```

**Option B — Instagram (via Meta Graph API):**
```ts
const fetchInstagram = async (pageId: string, accessToken: string) => {
  const res = await fetch(
    `https://graph.facebook.com/${pageId}/media?fields=caption,media_url,timestamp&access_token=${accessToken}`
  );
  const data = await res.json();
  return data.data.map((post: any) => ({
    title: post.caption?.slice(0, 80) || 'Instagram post',
    content: post.caption,
    image_url: post.media_url,
    source_type: 'social',
    created_at: post.timestamp,
  }));
};
```

**Option C — Manual curation (simplest to start):**
University admin pastes content directly into an admin panel inside the app. No scraping, no APIs.

---

### Edge Function: `fetch-campus-updates`

```ts
// supabase/functions/fetch-campus-updates/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

serve(async () => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  // 1. Fetch from configured sources
  const updates = await fetchAllSources();

  // 2. Optional: AI summary pass
  const cleaned = await Promise.all(updates.map(summarize));

  // 3. Upsert into DB (source_url as unique key to prevent duplicates)
  await supabase.from('campus_updates').upsert(cleaned, {
    onConflict: 'source_url',
    ignoreDuplicates: true,
  });

  return new Response('OK');
});
```

**Cron schedule:** Add to `supabase/config.toml`:
```toml
[functions.fetch-campus-updates]
schedule = "*/30 * * * *"  # every 30 minutes
```

---

### AI Cleanup (Optional but Recommended)

Raw content is often verbose or formatted oddly. A quick summarization pass helps.

```ts
const summarize = async (item: RawUpdate): Promise<CleanUpdate> => {
  if (item.content.length < 200) return item; // skip short content

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'x-api-key': Deno.env.get('ANTHROPIC_API_KEY')! },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 100,
      messages: [{
        role: 'user',
        content: `Summarize this university announcement in one clear sentence (max 120 chars): "${item.content}"`
      }]
    })
  });
  const data = await res.json();
  return { ...item, content: data.content[0].text };
};
```

---

## Database Schema

```sql
CREATE TABLE campus_updates (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  university_id UUID REFERENCES universities(id),
  title         TEXT NOT NULL,
  content       TEXT,
  source        TEXT,              -- 'UNAM Website', '@unam_namibia', etc.
  source_type   TEXT CHECK (source_type IN ('website', 'social', 'manual', 'event')),
  source_url    TEXT UNIQUE,       -- prevents duplicate ingestion
  image_url     TEXT,
  created_at    TIMESTAMPTZ,       -- original publish time from source
  inserted_at   TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX ON campus_updates(university_id, created_at DESC);
```

---

## Badge System

### How It Works

No push notifications. Just a quiet badge count on the tab/section icon.

```sql
-- Unread count
SELECT COUNT(*) FROM campus_updates
WHERE university_id = :uni_id
  AND created_at > (
    SELECT last_updates_seen_at FROM profiles WHERE id = :user_id
  );

-- Reset badge when user opens the Updates screen
UPDATE profiles
SET last_updates_seen_at = now()
WHERE id = :user_id;
```

### UI
```
Discover tab:  (no badge — too many sub-features)
Campus Updates section header:  🔔 3
```

Show the unread count next to the "Campus Updates" section title on the Discover page.

---

## Frontend Query

```ts
// src/services/campusUpdatesService.ts

export const fetchUpdates = async (universityId: string, filter = 'all') => {
  const query = supabase
    .from('campus_updates')
    .select('*')
    .eq('university_id', universityId)
    .order('created_at', { ascending: false })
    .limit(40);

  if (filter !== 'all') query.eq('source_type', filter);

  const { data, error } = await query;
  if (error) throw error;
  return data;
};

export const markUpdatesRead = async (userId: string) => {
  await supabase
    .from('profiles')
    .update({ last_updates_seen_at: new Date().toISOString() })
    .eq('id', userId);
};
```

---

## Why This Feature Matters

Social apps come and go. But an app students associate with **official, reliable information** becomes a habit.

This feature makes Campus Connect feel:
- Official
- Trustworthy
- Essential

Students start saying: "Check the app — it'll be posted there."

That is how you build daily active users who aren't just scrolling for entertainment.

---

## Acceptance Criteria
- [ ] Updates screen shows four sections: Latest, Official, Social, Events
- [ ] Filter tabs (All / Official / Social / Events) work correctly
- [ ] Backend cron job fetches new content every 30 minutes
- [ ] Duplicate URLs are ignored on upsert
- [ ] Unread badge count shown on Campus Updates section header
- [ ] Badge resets when user opens the screen
- [ ] Content is filtered by university_id
- [ ] Screen feels calm and structured (not like a social feed)
