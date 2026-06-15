import React, { useState } from "react";
import {
  Mic,
  Smile,
  Shield,
  HelpCircle,
  FileText,
  Radio,
  Rss,
  TrendingUp,
  Bookmark,
  Sparkles,
  Users,
  Search,
  Check,
  ChevronRight,
  ChevronLeft
} from "lucide-react";
import { Episode, Team, Fixture, NewsItem } from "../types";
import { WORLD_CUP_TEAMS, INITIAL_FIXTURES } from "../data";

interface ShowsTabProps {
  episodes: Episode[];
  onPlayEpisode: (ep: Episode) => void;
  userPrefs: { followedTeamIds: string[] };
  onToggleFollowTeam: (teamId: string) => void;
  fixtures: Fixture[];
  newsItems: NewsItem[];
}

interface ShowTypeDefinition {
  id: string;
  title: string;
  desc: string;
  duration: string;
  icon: any;
}

const BROADCAST_SHOW_TYPES: ShowTypeDefinition[] = [
  { id: "preview", title: "Match Preview", desc: "Lineups, form analysis, and head-to-head score projections.", duration: "3-5 min", icon: Sparkles },
  { id: "live-pulse", title: "Live Pulse Update", desc: "Urgent single-voice flash alerts synced with live goals and cards.", duration: "45-90 sec", icon: Radio },
  { id: "recap", title: "Full-Time Recap", desc: "Structured final reviews, shot conversions, and Man of the Match awards.", duration: "3-4 min", icon: FileText },
  { id: "round-up", title: "Daily Round-Up", desc: "Magazine-style end of day wrap combining massive tournament storylines.", duration: "6-10 min", icon: Rss },
  { id: "explainer", title: "Group standings Explainer", desc: "Qualification scenarios and detailed tie-breaker calculations.", duration: "2-3 min", icon: HelpCircle },
  { id: "team-show", title: "Team Channel Show", desc: "Focussed narratives regarding individual team setups.", duration: "3-5 min", icon: Users },
  { id: "predictions", title: "Prediction & Odds", desc: "Tactical match odds, bookmakers analysis, with responsible gaming warnings.", duration: "2-4 min", icon: TrendingUp },
  { id: "mailbag", title: "Fan Mailbag Room", desc: "Interactive host response answers for hot takes submitted live.", duration: "2-3 min", icon: Smile },
  { id: "bulletin", title: "Breaking Bulletin Desk", desc: "Urgent announcements of injuries, sudden suspensions or key events.", duration: "30-60 sec", icon: Shield },
];

export default function ShowsTab({
  episodes,
  onPlayEpisode,
  userPrefs,
  onToggleFollowTeam,
  fixtures,
  newsItems,
}: ShowsTabProps) {
  const [selectedShowType, setSelectedShowType] = useState<string | null>(null);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [teamSearchQuery, setTeamSearchQuery] = useState("");

  const filteredTeamList = WORLD_CUP_TEAMS.filter((team) =>
    team.name.toLowerCase().includes(teamSearchQuery.toLowerCase())
  );

  // Shows related to selected show type
  const activeTypeShows = episodes.filter(
    (ep) => !selectedShowType || ep.showType === selectedShowType
  );

  // Filter shows, news, and fixtures when in Team Channel mode
  const teamShows = selectedTeam
    ? episodes.filter((ep) => ep.relatedTeamIds.includes(selectedTeam.id))
    : [];

  const teamFixtures = selectedTeam
    ? fixtures.filter(
        (f) => f.teamHomeId === selectedTeam.id || f.teamAwayId === selectedTeam.id
      )
    : [];

  const teamNews = selectedTeam
    ? newsItems.filter((n) => n.relatedTeamIds.includes(selectedTeam.id))
    : [];

  // Mock follower counts
  const getFollowerCount = (teamId: string) => {
    // Standard deterministic mock based on id
    const hash = teamId.charCodeAt(0) + teamId.charCodeAt(1) || 120;
    const isFollowed = userPrefs.followedTeamIds.includes(teamId);
    return (hash * 1450) + (isFollowed ? 1 : 0);
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {selectedTeam ? (
        /* TEAM DETAIL VIEW CHANNEL */
        <div className="bg-white border-4 border-black p-6 md:p-8 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
          <button
            onClick={() => setSelectedTeam(null)}
            className="mb-6 inline-flex items-center space-x-1 px-3 py-1.5 border-2 border-black bg-neutral-100 font-bold uppercase text-[10px] hover:bg-black hover:text-white transition-all cursor-pointer"
          >
            <ChevronLeft className="h-4 w-4" />
            <span>Back to directory</span>
          </button>

          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b-4 border-black pb-6 mb-6 gap-4">
            <div className="flex items-center space-x-4">
              <span className="text-6xl select-none" role="img" aria-label={selectedTeam.name}>
                {selectedTeam.badgeUrl}
              </span>
              <div>
                <span className="text-[10px] font-mono uppercase bg-black text-[#CCFF00] px-2 py-0.5 font-bold mb-1 block w-max">
                  Group {selectedTeam.group} Channel
                </span>
                <h2 className="text-3xl md:text-4xl font-black uppercase tracking-tight italic text-black">
                  {selectedTeam.name}
                </h2>
                <div className="flex items-center space-x-3.5 text-xs text-neutral-600 font-bold mt-1">
                  <span className="flex items-center">
                    <Users className="h-4 w-4 mr-1 text-black" />
                    {getFollowerCount(selectedTeam.id).toLocaleString()} Fans on Radio
                  </span>
                </div>
              </div>
            </div>

            {/* In-place Follow trigger */}
            <button
              onClick={() => onToggleFollowTeam(selectedTeam.id)}
              className={`px-5 py-3 border-3 border-black font-black uppercase text-xs tracking-tight shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-y-0.5 cursor-pointer ${
                userPrefs.followedTeamIds.includes(selectedTeam.id)
                  ? "bg-[#CCFF00] text-black"
                  : "bg-white text-black hover:bg-neutral-100"
              }`}
            >
              {userPrefs.followedTeamIds.includes(selectedTeam.id) ? (
                <span className="flex items-center gap-1.5">
                  <Check className="h-4 w-4 stroke-[3px]" /> Following Channel
                </span>
              ) : (
                "+ Follow Team Channel"
              )}
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Primary Channel Broadcast Feed */}
            <div className="lg:col-span-2 space-y-6">
              <h3 className="font-mono text-xs uppercase text-zinc-400 font-extrabold tracking-widest border-b-2 border-black pb-2">
                📡 EXCLUSIVE DYNAMIC AUDIO PROGRAMMING
              </h3>

              {teamShows.length > 0 ? (
                <div className="space-y-4">
                  {teamShows.map((ep) => (
                    <div
                      key={ep.id}
                      onClick={() => onPlayEpisode(ep)}
                      className="p-4 border-2 border-black bg-neutral-50 hover:bg-[#CCFF00]/10 hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] cursor-pointer transition-all flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
                    >
                      <div className="space-y-1">
                        <span className="text-[9px] font-mono uppercase bg-black text-[#CCFF00] px-1.5 py-0.5 font-bold">
                          {ep.showType}
                        </span>
                        <h4 className="text-sm font-black uppercase tracking-tight text-black italic">
                          {ep.title}
                        </h4>
                        <p className="text-xs text-neutral-600 font-medium">Auto-narrated script ~{ep.durationSeconds}s</p>
                      </div>
                      <button className="px-3.5 py-2.5 bg-black text-[#CCFF00] font-black text-xs uppercase cursor-pointer shrink-0">
                        📻 Listen Now
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 border-2 border-dashed border-neutral-300 text-center text-xs text-neutral-500 font-bold uppercase">
                  // No specific script generated yet. Trigger a preview from the AI Writer!
                </div>
              )}
            </div>

            {/* Sidebar fixtures news */}
            <div className="space-y-6">
              {/* Team specific fixture card */}
              <div className="border-2 border-black bg-neutral-50 p-4">
                <h4 className="font-mono text-[10px] uppercase font-black text-neutral-400 mb-3 border-b border-neutral-200 pb-1.5">
                  ⚽ Match Day Status
                </h4>
                {teamFixtures.length > 0 ? (
                  <div className="space-y-3.5">
                    {teamFixtures.map((f) => {
                      const home = WORLD_CUP_TEAMS.find((t) => t.id === f.teamHomeId);
                      const away = WORLD_CUP_TEAMS.find((t) => t.id === f.teamAwayId);
                      return (
                        <div key={f.id} className="text-xs border-b border-neutral-200 pb-2.5 last:border-0 last:pb-0">
                          <div className="flex justify-between items-center font-bold mb-1">
                            <span className="font-black text-neutral-500 uppercase">{f.stage}</span>
                            <span className="font-mono bg-black text-[#CCFF00] px-1">
                              {f.status}
                            </span>
                          </div>
                          <p className="font-black text-sm text-black flex items-center justify-between gap-2 py-0.5">
                            <span>{home?.badgeUrl} {home?.name}</span>
                            <span className="font-mono text-neutral-500 bg-neutral-200 px-1 inline-block text-center min-w-8">
                              {f.status !== "scheduled" ? `${f.homeScore} - ${f.awayScore}` : "VS"}
                            </span>
                            <span>{away?.name} {away?.badgeUrl}</span>
                          </p>
                          <p className="text-[9px] text-zinc-500 mt-1 font-semibold">{f.venue}</p>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-[10px] font-mono text-neutral-500 uppercase">// No fixtures scheduled.</div>
                )}
              </div>

              {/* Verified news list */}
              <div className="border-2 border-black bg-neutral-50 p-4">
                <h4 className="font-mono text-[10px] uppercase font-black text-neutral-400 mb-3 border-b border-neutral-200 pb-1.5">
                  📰 Live Wire News Coverage
                </h4>
                {teamNews.length > 0 ? (
                  <div className="space-y-4">
                    {teamNews.map((news) => (
                      <div key={news.id} className="text-xs space-y-1">
                        <h5 className="font-black text-black leading-tight">{news.headline}</h5>
                        <p className="text-[10px] text-neutral-600 leading-normal font-semibold">{news.body}</p>
                        <span className="text-[8px] font-mono bg-neutral-200 text-neutral-700 px-1">{news.source}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-[10px] text-zinc-500 font-mono uppercase">// No verified wire announcements.</div>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* MASTER BROWSE DIRECTORY */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left panel: show formats filter */}
          <div className="lg:col-span-8 bg-white border-4 border border-black p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] text-black">
            <span className="text-[9px] font-mono uppercase tracking-widest text-neutral-400 font-bold mb-1 block">
              // MatchDay Audio directories
            </span>
            <h2 className="text-2xl font-black uppercase tracking-tight italic border-b-2 border-black pb-4 mb-6">
              Browse AI Audio Show Formats
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {BROADCAST_SHOW_TYPES.map((sh) => {
                const ShowIcon = sh.icon;
                const isFiltered = selectedShowType === sh.id;
                return (
                  <div
                    key={sh.id}
                    onClick={() => {
                      setSelectedShowType(isFiltered ? null : sh.id);
                    }}
                    className={`p-4 border-2 border-black text-left cursor-pointer transition-all ${
                      isFiltered
                        ? "bg-[#CCFF00] shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]"
                        : "bg-neutral-50 hover:bg-neutral-100"
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2 text-[#CCFF00]">
                      <div className="p-2 border border-black bg-black text-current">
                        <ShowIcon className="h-4.5 w-4.5 text-[#CCFF00] stroke-[2.5px]" />
                      </div>
                      <span className="text-[10px] font-mono font-bold bg-black text-white px-1.5 py-0.5">
                        {sh.duration}
                      </span>
                    </div>

                    <h4 className="text-sm font-black uppercase tracking-tight italic mb-1 text-black">
                      {sh.title}
                    </h4>
                    <p className="text-[11px] text-neutral-700 leading-normal font-semibold font-sans">
                      {sh.desc}
                    </p>
                  </div>
                );
              })}
            </div>

            {/* FILTER REVEALS AVAILABLE CHANNELS */}
            {selectedShowType && (
              <div className="mt-8 border-t-2 border-black pt-6 animate-fade-in">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-mono text-xs uppercase font-black text-neutral-600">
                    Showing format: {selectedShowType} ({activeTypeShows.length} Hits)
                  </h3>
                  <button
                    onClick={() => setSelectedShowType(null)}
                    className="text-[10px] font-black uppercase underline hover:text-[#CCFF00]"
                  >
                    Clear Filter
                  </button>
                </div>

                {activeTypeShows.length > 0 ? (
                  <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                    {activeTypeShows.map((ep) => (
                      <div
                        key={ep.id}
                        onClick={() => onPlayEpisode(ep)}
                        className="p-3 border-2 border-black bg-[#CCFF00]/5 hover:bg-[#CCFF00]/15 flex justify-between items-center cursor-pointer text-xs font-bold uppercase"
                      >
                        <div className="space-y-0.5">
                          <p className="font-extrabold text-[#CCFF00] bg-black px-1.5 w-max text-[9px] mb-1">{ep.matchName}</p>
                          <h4 className="font-black text-black italic text-sm">{ep.title}</h4>
                        </div>
                        <button className="px-3.5 py-2.5 bg-black text-[#CCFF00] font-black text-[10px] tracking-tight shrink-0 cursor-pointer">
                          Listen
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-xs font-mono text-neutral-500 uppercase py-6 border border-dashed border-neutral-300">
                    // No episodes saved yet matching format. Trigger generation from the studio!
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Right panel: 48 team channels list with follow triggers */}
          <div className="lg:col-span-4 bg-white border-4 border border-black p-5 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] text-black">
            <h2 className="text-lg font-black uppercase tracking-tight italic border-b-2 border-black pb-3.5 mb-4 flex items-center justify-between">
              <span>🏟️ 48 Team Channels</span>
              <span className="text-[10px] font-mono bg-black text-white px-2 py-0.5">WC26 Edition</span>
            </h2>

            {/* Search Input */}
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500 stroke-[2.5px]" />
              <input
                type="text"
                placeholder="Search teams..."
                value={teamSearchQuery}
                onChange={(e) => setTeamSearchQuery(e.target.value)}
                className="w-full bg-[#F0F0F0] border-2 border-black pl-9 pr-4 py-2 text-xs font-black uppercase tracking-tight placeholder-neutral-500 focus:bg-white outline-none rounded-none"
              />
            </div>

            <div className="space-y-2.5 max-h-[580px] overflow-y-auto pr-1">
              {filteredTeamList.map((team) => {
                const isFollowed = userPrefs.followedTeamIds.includes(team.id);
                return (
                  <div
                    key={team.id}
                    className="p-3 border-2 border-black bg-neutral-50 flex items-center justify-between hover:bg-neutral-100 transition-all text-xs font-bold uppercase text-neutral-800"
                  >
                    <div
                      onClick={() => setSelectedTeam(team)}
                      className="flex items-center space-x-3 cursor-pointer flex-1"
                    >
                      <span className="text-3xl select-none" role="img" aria-label={team.name}>
                        {team.badgeUrl}
                      </span>
                      <div className="text-left">
                        <h4 className="font-extrabold text-black hover:underline line-clamp-1">
                          {team.name}
                        </h4>
                        <span className="text-[8px] font-mono text-neutral-500 block">
                          Group {team.group} // {getFollowerCount(team.id)} fans
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => onToggleFollowTeam(team.id)}
                      className={`p-2 border border-black rounded-none transition-all cursor-pointer ${
                        isFollowed ? "bg-[#CCFF00]" : "bg-white hover:bg-neutral-100"
                      }`}
                      title={isFollowed ? "Following" : "Follow"}
                    >
                      {isFollowed ? (
                        <Check className="h-3.5 w-3.5 text-black stroke-[3px]" />
                      ) : (
                        <span className="text-[9px] font-black uppercase tracking-tighter px-0.5">+ Follow</span>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
