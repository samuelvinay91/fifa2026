export interface SpeechLine {
  speaker: string;
  text: string;
  voice: "Kore" | "Puck" | "Charon" | "Fenrir" | "Zephyr" | string;
  role: "Anchor" | "Analyst" | "Reporter" | "Expert" | string;
}

export interface Episode {
  id: string;
  title: string;
  matchName: string;
  language: string;
  tone: string;
  segments: SpeechLine[];
  durationSeconds: number;
  showType: "preview" | "live-pulse" | "recap" | "round-up" | "explainer" | "team-show" | "predictions" | "mailbag" | "bulletin";
  relatedTeamIds: string[];
  relatedMatchId?: string;
  createdAt: string;
  expiresAt?: string;
  isSponsored?: boolean;
  isAd?: boolean;
  tier: "free" | "premium";
  audioUrl?: string; // empty if using synthesis
  transcript?: string;
}

export interface Fixture {
  id: string;
  teamHomeId: string;
  teamAwayId: string;
  kickoffTime: string;
  venue: string;
  stage: string;
  group: string;
  status: "scheduled" | "live" | "completed";
  homeScore?: number;
  awayScore?: number;
  minute?: number;
}

export interface MatchEvent {
  id: string;
  matchId: string;
  minute: number;
  type: "goal" | "card" | "pen" | "ht" | "ft";
  playerName: string;
  teamId: string;
}

export interface Standing {
  groupId: string;
  teamId: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  gd: number;
  points: number;
}

export interface Team {
  id: string;
  name: string;
  badgeUrl: string;
  group: string;
}

export interface NewsItem {
  id: string;
  headline: string;
  body: string;
  source: string;
  verified: boolean;
  publishedAt: string;
  relatedTeamIds: string[];
}

export interface UserPreferences {
  languages: string[];
  followedTeamIds: string[];
  showPrefs: Record<string, boolean>; // showType -> isInterested
  tier: "free" | "premium";
  savedSegmentIds: string[];
  history: string[];
}

export interface AdSlot {
  id: string;
  type: "preroll" | "midroll" | "banner" | "sponsoredSegment";
  creativeUrl?: string;
  audioUrl?: string;
  clickUrl: string;
  sponsorName: string;
  geoRules?: string[];
  startDate: string;
  endDate: string;
}

export interface MetricSummary {
  dau: number;
  concurrent: number;
  listeningMins: number;
  completionRate: number;
  conversions: number;
  impressions: number;
  fillRate: number;
  registeredUsers: number;
}
