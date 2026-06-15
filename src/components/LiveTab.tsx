import React, { useState, useEffect, useRef } from "react";
import {
  Radio,
  Zap,
  Volume2,
  Clock,
  ChevronLeft,
  Tv,
  ArrowRight,
  ShieldAlert,
  BellRing,
  Goal
} from "lucide-react";
import { Fixture, MatchEvent, Team, Episode } from "../types";
import { WORLD_CUP_TEAMS, INITIAL_MATCH_EVENTS } from "../data";

interface LiveTabProps {
  fixtures: Fixture[];
  matchEvents: MatchEvent[];
  episodes: Episode[];
  onPlayEpisode: (ep: Episode) => void;
  userPrefs: { followedTeamIds: string[] };
  showNotification: (text: string, type: "success" | "info" | "error") => void;
}

export default function LiveTab({
  fixtures,
  matchEvents,
  episodes,
  onPlayEpisode,
  userPrefs,
  showNotification,
}: LiveTabProps) {
  const [selectedMatch, setSelectedMatch] = useState<Fixture | null>(null);
  const [autoInterrupt, setAutoInterrupt] = useState(true);
  const [tickerComm, setTickerComm] = useState<string[]>([]);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const liveMatches = fixtures.filter((f) => f.status === "live");
  const otherMatches = fixtures.filter((f) => f.status !== "live");

  // Get home/away teams
  const getTeam = (teamId: string): Team | undefined => {
    return WORLD_CUP_TEAMS.find((t) => t.id === teamId);
  };

  // Sync real-time commentary simulation when inside a live room
  useEffect(() => {
    if (selectedMatch) {
      // Seed initial messages
      const teamHome = getTeam(selectedMatch.teamHomeId)?.name;
      const teamAway = getTeam(selectedMatch.teamAwayId)?.name;

      setTickerComm([
        `[00'] Kickoff! MetLife referee blows the whistle. ${teamHome} vs ${teamAway} is underway generically.`,
        `[14'] GOOOAL to USA! Christian Pulisic fires with brilliant speed.`,
        `[38'] Yellow card to Mexico's Edson Álvarez for a reckless sliding block.`,
        `[45'] Half-time whistle blown. Managers heading to locker corridors.`,
        `[54'] EQUALIZER! Santiago Giménez heads down standard Brazilian style!`,
        `[68'] GOAL TO USA! Ricardo Pepi scores again from near-post!`,
        `[74'] Active Live status checked. High midfield press ongoing.`
      ]);
    }
  }, [selectedMatch]);

  // Simulate commentary expansion ticker tick
  useEffect(() => {
    if (selectedMatch && selectedMatch.status === "live") {
      const interval = setInterval(() => {
        const minutes = Math.floor(Math.random() * 15) + 75;
        const events = [
          `[${minutes}'] Tactical substitute warming up beside team banners.`,
          `[${minutes}'] Stunning cross-field pass blocked at key moments!`,
          `[${minutes}'] Corner kick conceded. Physical play inside the penalty box.`,
          `[${minutes}'] Fans chanting aggressively under MetLife venue floodlights.`
        ];
        const selectedText = events[Math.floor(Math.random() * events.length)];
        setTickerComm((prev) => [...prev, selectedText]);

        // Auto interrupt simulation for dynamic goal alerts if followed
        if (autoInterrupt && Math.random() > 0.65) {
          const isFollowedHome = userPrefs.followedTeamIds.includes(selectedMatch.teamHomeId);
          const isFollowedAway = userPrefs.followedTeamIds.includes(selectedMatch.teamHomeId);
          if (isFollowedHome || isFollowedAway) {
            showNotification(`⚽ GOOAL SCORING INTERRUPT Alert for your followed team!`, "success");
            // Highlight a live pulse episode
            const livePulse = episodes.find((ep) => ep.showType === "live-pulse");
            if (livePulse) {
              onPlayEpisode(livePulse);
            }
          }
        }
      }, 9000);

      return () => clearInterval(interval);
    }
  }, [selectedMatch, autoInterrupt, userPrefs.followedTeamIds]);

  // Scroll to bottom of ticker
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [tickerComm]);

  // Specific events for selected match
  const activeMatchEvents = selectedMatch
    ? matchEvents.filter((ev) => ev.matchId === selectedMatch.id)
    : [];

  // Filter dynamic pulse shows for active match
  const activeMatchPulseShows = selectedMatch
    ? episodes.filter(
        (ep) =>
          ep.showType === "live-pulse" &&
          (ep.relatedTeamIds.includes(selectedMatch.teamHomeId) ||
            ep.relatedTeamIds.includes(selectedMatch.teamAwayId))
      )
    : [];

  return (
    <div className="space-y-8 animate-fade-in text-black">
      {selectedMatch ? (
        /* LIVE AUDIO ROOM PORTAL */
        <div className="bg-white border-4 border-black p-6 md:p-8 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
          <button
            onClick={() => setSelectedMatch(null)}
            className="mb-6 inline-flex items-center space-x-1 px-3 py-1.5 border-2 border-black bg-neutral-100 font-bold uppercase text-[10px] hover:bg-black hover:text-white transition-all cursor-pointer"
          >
            <ChevronLeft className="h-4 w-4" />
            <span>Exit Live Match Room</span>
          </button>

          {/* Real-time Match Score Header */}
          <div className="bg-black text-white p-6 border-4 border border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex flex-col md:flex-row justify-between items-center gap-6 mb-8">
            <div className="flex items-center space-x-4">
              <span className="text-4xl">🏟️</span>
              <div>
                <span className="text-[#CCFF00] font-mono text-[10px] font-bold uppercase block tracking-wider">
                  {selectedMatch.stage} // {selectedMatch.venue}
                </span>
                <span className="text-xs uppercase font-mono font-bold text-neutral-400 block mt-0.5">
                  Live Match Channel ID: {selectedMatch.id}
                </span>
              </div>
            </div>

            {/* Score board */}
            <div className="flex items-center space-x-8">
              <div className="text-center">
                <span className="text-4xl block font-black mb-1">
                  {getTeam(selectedMatch.teamHomeId)?.badgeUrl}
                </span>
                <span className="text-sm font-black uppercase tracking-wider">
                  {getTeam(selectedMatch.teamHomeId)?.name}
                </span>
              </div>

              <div className="bg-neutral-850 px-6 py-3 border border-neutral-700 text-center min-w-[120px]">
                <p className="text-3xl font-black font-mono tracking-widest text-[#CCFF00]">
                  {selectedMatch.status === "scheduled"
                    ? "VS"
                    : `${selectedMatch.homeScore} - ${selectedMatch.awayScore}`}
                </p>
                {selectedMatch.status === "live" && (
                  <span className="text-[10px] text-red-500 font-mono font-black animate-pulse uppercase flex items-center justify-center gap-1 mt-1">
                    <span className="h-1.5 w-1.5 bg-red-500 rounded-full inline-block shrink-0 animate-ping" />
                    LIVE // {selectedMatch.minute}'
                  </span>
                )}
              </div>

              <div className="text-center">
                <span className="text-4xl block font-black mb-1">
                  {getTeam(selectedMatch.teamAwayId)?.badgeUrl}
                </span>
                <span className="text-sm font-black uppercase tracking-wider">
                  {getTeam(selectedMatch.teamAwayId)?.name}
                </span>
              </div>
            </div>

            {/* Notification and goal interrupts slider widget */}
            <div className="flex items-center space-x-3.5 bg-neutral-900 p-2.5 border border-neutral-700">
              <BellRing className="h-4.5 w-4.5 text-[#CCFF00]" />
              <div className="text-left">
                <span className="text-[9px] font-black uppercase tracking-wider text-[#CCFF00] block">Goal Interruptions</span>
                <span className="text-[8px] font-mono text-neutral-400 block">Flash override active</span>
              </div>
              <button
                onClick={() => {
                  setAutoInterrupt(!autoInterrupt);
                  showNotification(
                    autoInterrupt 
                      ? "Deactivated Live Goal interruptions stream overrides." 
                      : "Goal interrupts enabled. We will auto play live alerts as they hit!",
                    "info"
                  );
                }}
                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer border border-neutral-600 transition-colors duration-200 outline-none ${
                  autoInterrupt ? "bg-[#CCFF00]" : "bg-neutral-700"
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-4 w-4 transform bg-white transition duration-200 ${
                    autoInterrupt ? "translate-x-4" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Channel: Live Pulse Audio Stream */}
            <div className="lg:col-span-8 space-y-6">
              
              <div className="border-4 border border-black bg-neutral-50 p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                <div className="flex items-center justify-between border-b border-neutral-300 pb-3.5 mb-5">
                  <h4 className="font-extrabold text-sm uppercase text-black flex items-center">
                    <Radio className="h-4.5 w-4.5 text-red-500 mr-2 animate-pulse shrink-0" />
                    Live Pulse Update Feed
                  </h4>
                  <span className="font-mono text-[9px] bg-black text-[#CCFF00] px-2 py-0.5 font-bold uppercase shrink-0">
                    Always-On Ticker Streams
                  </span>
                </div>

                <p className="text-xs text-neutral-600 font-bold uppercase leading-relaxed mb-4">
                  Listen to direct, energetic narration blocks reporting MetLife events. Clicking elements on the moments strip plays back specific audio segment clips instantly.
                </p>

                {activeMatchPulseShows.length > 0 ? (
                  <div className="space-y-3.5">
                    {activeMatchPulseShows.map((ep) => (
                      <div
                        key={ep.id}
                        onClick={() => {
                          onPlayEpisode(ep);
                          showNotification(`Replaying Live Pulse segment: ${ep.title}`, "info");
                        }}
                        className="p-3.5 bg-white border-2 border-black hover:bg-[#CCFF00]/10 flex justify-between items-center cursor-pointer font-bold uppercase text-xs"
                      >
                        <div className="flex items-center space-x-3 shrink-1">
                          <Volume2 className="h-4.5 w-4.5 text-black shrink-0" />
                          <span className="font-black italic line-clamp-1">{ep.title}</span>
                        </div>
                        <span className="text-[9px] font-mono bg-black text-[#CCFF00] px-2 py-1 shrink-0">
                          Listen ~{ep.durationSeconds}s
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 border-2 border-dashed border-neutral-200 text-center text-[10px] text-zinc-500 font-mono uppercase">
                    // Waiting for match events to dynamically trigger pulse segments.
                  </div>
                )}
              </div>

              {/* Key Moments Replay strip */}
              <div className="border-4 border border-black bg-neutral-50 p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                <h4 className="font-black text-xs uppercase mb-3.5 flex items-center">
                  <Zap className="h-4 w-4 mr-2 text-yellow-600 shrink-0" />
                  Key Moments Flashbacks
                </h4>

                <div className="flex flex-wrap gap-3">
                  {activeMatchEvents.length > 0 ? (
                    activeMatchEvents.map((ev) => (
                      <button
                        key={ev.id}
                        onClick={() => {
                          // Play the preview/live-pulse episode
                          const matchPulse = episodes.find((ep) => ep.showType === "live-pulse");
                          if (matchPulse) {
                            onPlayEpisode(matchPulse);
                            showNotification(`Replaying moment commentary: ${ev.playerName} [${ev.minute}']`, "success");
                          } else {
                            showNotification(`Sound bite simulated for [${ev.minute}']`, "info");
                          }
                        }}
                        className="px-3.5 py-2.5 border-2 border-black bg-white hover:bg-[#CCFF00]/15 hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] font-bold text-xs uppercase cursor-pointer flex items-center space-x-2 shrink-0 rounded-none transition-all"
                      >
                        <Goal className="h-4 w-4 text-emerald-600" />
                        <span>
                          {ev.playerName} ({ev.minute}') {ev.type === "goal" ? "🥅 goal!" : "🟨 Card"}
                        </span>
                      </button>
                    ))
                  ) : (
                    <p className="text-[10px] font-mono text-zinc-650 uppercase">// Pre-match Warmups. No events loaded.</p>
                  )}
                </div>
              </div>

            </div>

            {/* Right Channel: Real-Time scrolling commentary ticker */}
            <div className="lg:col-span-4 bg-black text-white p-5 border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex flex-col justify-between h-[420px] relative">
              <div className="border-b border-neutral-800 pb-3.5 mb-3">
                <span className="h-2 w-2 bg-red-500 rounded-full inline-block mr-1.5 animate-ping" />
                <span className="text-[10px] font-mono font-black uppercase text-red-500 tracking-wider">
                  Live Wire play-by-play narrative
                </span>
              </div>

              {/* Scrolling ticker */}
              <div 
                ref={scrollRef}
                className="flex-1 overflow-y-auto space-y-4 pr-1 font-mono text-[11px] leading-relaxed text-zinc-300"
              >
                {tickerComm.map((line, idx) => (
                  <div key={idx} className="border-l border-neutral-700 pl-2">
                    <span className="text-[#CCFF00] font-black mr-1">//</span> {line}
                  </div>
                ))}
              </div>

              <div className="border-t border-neutral-850 pt-3.5 mt-3 text-center text-[9px] text-[#CCFF00] font-mono tracking-widest uppercase animate-pulse">
                // System Connected // Synced stream Active
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* LIVE LIST OF WORLD CUP FIXTURES */
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* Live matches Column */}
          <div className="md:col-span-2 space-y-6">
            <h3 className="font-mono text-xs uppercase font-extrabold tracking-widest text-[#CCFF00] bg-black p-3.5 border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex justify-between items-center">
              <span>⚽ ACTIVE TEAMS CURRENTLY LIVE ON PITCH</span>
              <span className="px-2.5 py-0.5 text-[9px] bg-red-650 text-white animate-pulse rounded-none">
                {liveMatches.length} Matches Active
              </span>
            </h3>

            {liveMatches.length > 0 ? (
              <div className="space-y-6">
                {liveMatches.map((f) => {
                  const home = getTeam(f.teamHomeId);
                  const away = getTeam(f.teamAwayId);
                  return (
                    <div
                      key={f.id}
                      onClick={() => setSelectedMatch(f)}
                      className="bg-white border-4 border-black p-6 hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 cursor-pointer transition-all gap-4 text-black text-left relative"
                    >
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div className="space-y-1.5 flex-1">
                          <div className="flex items-center space-x-2.5">
                            <span className="text-[10px] font-mono bg-black text-[#CCFF00] px-1.5 py-0.5 font-bold uppercase">
                              {f.stage} // {f.group}
                            </span>
                            <span className="text-[9px] font-mono text-neutral-500 font-extrabold flex items-center">
                              <Clock className="h-3 w-3 mr-1" />
                              Minute: {f.minute}'
                            </span>
                          </div>

                          <div className="flex items-center space-x-6 py-2">
                            <div className="flex items-center space-x-2">
                              <span className="text-3xl shrink-0 leading-none">{home?.badgeUrl}</span>
                              <span className="font-black text-lg text-black uppercase tracking-tight">{home?.name}</span>
                            </div>
                            <span className="font-mono text-xl font-black bg-neutral-100 border border-black px-2.5 text-center leading-normal">
                              {f.homeScore} - {f.awayScore}
                            </span>
                            <div className="flex items-center space-x-2">
                              <span className="font-black text-lg text-black uppercase tracking-tight">{away?.name}</span>
                              <span className="text-3xl shrink-0 leading-none">{away?.badgeUrl}</span>
                            </div>
                          </div>

                          <p className="text-[10px] text-neutral-500 font-bold uppercase mt-1">{f.venue}</p>
                        </div>
                        
                        <button className="px-4 py-3 bg-[#CCFF00] border-2 border-black font-black uppercase text-xs shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] shrink-0 cursor-pointer flex items-center">
                          <span>Enter Room</span>
                          <ArrowRight className="h-4.5 w-4.5 ml-1.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-12 border-4 border-black border-dashed bg-neutral-50 text-center text-xs text-neutral-500 font-bold uppercase">
                // No matches currently live on pitch side. Select scheduled ones below to explore.
              </div>
            )}
          </div>

          {/* Scheduled & Completed Match list */}
          <div className="space-y-6">
            <h3 className="font-mono text-xs uppercase font-extrabold tracking-widest text-[#CCFF00] bg-black p-3.5 border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              📅 UPCOMING FIXTURES / COMPLETED HISTORY
            </h3>

            <div className="space-y-4">
              {otherMatches.map((f) => {
                const home = getTeam(f.teamHomeId);
                const away = getTeam(f.teamAwayId);
                return (
                  <div
                    key={f.id}
                    onClick={() => {
                      setSelectedMatch(f);
                      showNotification(`Consulting archive for pre-match/recap setups in ${home?.name} match.`, "info");
                    }}
                    className="p-4 border-2 border-black bg-white hover:bg-[#CCFF00]/5 text-black text-left cursor-pointer font-bold uppercase text-xs relative transition-all"
                  >
                    <div className="flex justify-between items-center text-[9px] font-mono text-neutral-500 mb-1.5">
                      <span>{f.stage} // Group {f.group}</span>
                      <span className={`px-1 rounded-none text-[8px] font-black ${
                        f.status === "completed" ? "bg-slate-300 text-slate-800" : "bg-[#CCFF00] text-black"
                      }`}>
                        {f.status}
                      </span>
                    </div>

                    <h4 className="font-black text-neutral-800 flex justify-between items-center gap-2 py-0.5 leading-none">
                      <span>{home?.badgeUrl} {home?.name}</span>
                      <span className="font-mono bg-neutral-200 px-1 text-[10px] min-w-8 text-center py-0.5 border border-neutral-400">
                        {f.status === "completed" ? `${f.homeScore} - ${f.awayScore}` : "VS"}
                      </span>
                      <span>{away?.name} {away?.badgeUrl}</span>
                    </h4>

                    <p className="text-[9px] text-zinc-500 font-semibold font-mono mt-2">{f.kickoffTime}</p>
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
