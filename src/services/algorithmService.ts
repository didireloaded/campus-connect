// src/services/algorithmService.ts
// Campus Connect Feed & Trending Algorithm

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ScoredContent {
  created_at: string;
  likes_count?: number | null;
  comments_count?: number | null;
  joins_count?: number | null;
  views_count?: number | null;
  content_type?: ContentType;
  event_date?: string | null;
  expires_at?: string | null;
}

export type ContentType =
  | 'post'
  | 'event'
  | 'confession'
  | 'spotted'
  | 'wall'
  | 'marketplace'
  | 'study_group'
  | 'lecture_note'
  | 'job'
  | 'poll';

export type TimeWindow = 'morning' | 'afternoon' | 'evening';

// ─── Recency ──────────────────────────────────────────────────────────────────

export function calculateRecency(createdAt: string): number {
  const hours = (Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60);
  return 1 / (hours + 1);
}

// ─── Engagement ───────────────────────────────────────────────────────────────

export function calculateEngagement(content: ScoredContent): number {
  return (
    (content.likes_count || 0) * 1 +
    (content.comments_count || 0) * 2 +
    (content.joins_count || 0) * 3 +
    (content.views_count || 0) * 0.5
  );
}

// ─── Trending Score ───────────────────────────────────────────────────────────

export function calculateTrendingScore(content: ScoredContent): number {
  const engagement = calculateEngagement(content);
  const hours = (Date.now() - new Date(content.created_at).getTime()) / (1000 * 60 * 60);
  return engagement / (hours + 2);
}

// ─── Boost Score ──────────────────────────────────────────────────────────────

export function calculateBoost(content: ScoredContent): number {
  let boost = 0;

  // Upcoming events boost
  if (content.event_date) {
    const hoursUntilEvent =
      (new Date(content.event_date).getTime() - Date.now()) / (1000 * 60 * 60);
    if (hoursUntilEvent > 0 && hoursUntilEvent <= 24) boost += 1.0;
  }

  // New marketplace listing boost (< 2 hours old)
  if (content.content_type === 'marketplace') {
    const hoursOld = (Date.now() - new Date(content.created_at).getTime()) / (1000 * 60 * 60);
    if (hoursOld < 2) boost += 0.5;
  }

  // Time-of-day boost
  boost += getTimeBoost(content.content_type);

  return boost;
}

// ─── Time Context ─────────────────────────────────────────────────────────────

export function getTimeWindow(): TimeWindow {
  const hour = new Date().getHours();
  if (hour >= 6 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 18) return 'afternoon';
  return 'evening';
}

const TIME_BOOSTS: Record<TimeWindow, ContentType[]> = {
  morning: ['study_group', 'lecture_note', 'job', 'event'],
  afternoon: ['marketplace', 'post', 'event'],
  evening: ['event', 'confession', 'spotted', 'wall'],
};

export function getTimeBoost(contentType: ContentType | undefined): number {
  if (!contentType) return 0;
  const window = getTimeWindow();
  return TIME_BOOSTS[window].includes(contentType) ? 0.5 : 0;
}

// ─── Feed Score ───────────────────────────────────────────────────────────────

export function calculateFeedScore(content: ScoredContent): number {
  const recency = calculateRecency(content.created_at);
  const engagement = calculateEngagement(content);
  const boost = calculateBoost(content);

  return 0.4 * recency + 0.3 * engagement + 0.1 * boost;
}

// ─── Personalization Boost ────────────────────────────────────────────────────

export function calculatePersonalizedScore(
  content: ScoredContent,
  userInterests: Partial<Record<ContentType, number>>
): number {
  const base = calculateFeedScore(content);
  const interestCount = userInterests[content.content_type as ContentType] || 0;
  const personalBoost = interestCount > 3 ? 0.2 : 0;
  return base + personalBoost;
}

// ─── Filter Helpers ───────────────────────────────────────────────────────────

export function filterExpired<T extends ScoredContent>(items: T[]): T[] {
  return items.filter((item) => {
    if (!item.expires_at) return true;
    return new Date(item.expires_at) > new Date();
  });
}

export function filterByAge<T extends ScoredContent>(items: T[], maxAgeHours: number): T[] {
  const cutoff = Date.now() - maxAgeHours * 60 * 60 * 1000;
  return items.filter((item) => new Date(item.created_at).getTime() > cutoff);
}

// ─── Sort Helpers ─────────────────────────────────────────────────────────────

export function sortByFeedScore<T extends ScoredContent>(items: T[]): T[] {
  return [...items].sort(
    (a, b) => calculateFeedScore(b) - calculateFeedScore(a)
  );
}

export function sortByTrending<T extends ScoredContent>(items: T[]): T[] {
  return [...items].sort(
    (a, b) => calculateTrendingScore(b) - calculateTrendingScore(a)
  );
}

export function sortByPersonalized<T extends ScoredContent>(
  items: T[],
  userInterests: Partial<Record<ContentType, number>>
): T[] {
  return [...items].sort(
    (a, b) =>
      calculatePersonalizedScore(b, userInterests) -
      calculatePersonalizedScore(a, userInterests)
  );
}
