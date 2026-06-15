import React, { useState } from "react";
import {
  TrendingUp,
  Database,
  RefreshCw,
  Zap,
  Globe,
  BellRing,
  AlertTriangle,
  Play,
  Check,
  Plus,
  Trash2,
  List,
  Edit,
  Save
} from "lucide-react";
import { Episode, Fixture, NewsItem, AdSlot, MetricSummary } from "../types";
import { WORLD_CUP_TEAMS, MOCK_METRICS } from "../data";

interface AdminTabProps {
  metrics: MetricSummary;
  episodes: Episode[];
  fixtures: Fixture[];
  newsItems: NewsItem[];
  setNewsItems: React.Dispatch<React.SetStateAction<NewsItem[]>>;
  sponsors: AdSlot[];
  setSponsors: React.Dispatch<React.SetStateAction<AdSlot[]>>;
  onPauseWholeFeed: () => void;
  feedKilled: boolean;
  setFeedKilled: (killed: boolean) => void;
  onManualTriggerEp: (matchName: string, showType: string, tone: string) => void;
  showNotification: (text: string, type: "success" | "info" | "error") => void;
  bannedTerms: string;
  setBannedTerms: (terms: string) => void;
}

export default function AdminTab({
  metrics,
  episodes,
  fixtures,
  newsItems,
  setNewsItems,
  sponsors,
  setSponsors,
  onPauseWholeFeed,
  feedKilled,
  setFeedKilled,
  onManualTriggerEp,
  showNotification,
  bannedTerms,
  setBannedTerms,
}: AdminTabProps) {
  // Manual generator state
  const [genMatch, setGenMatch] = useState(fixtures[0]?.id || "match-1");
  const [genType, setGenType] = useState("preview");
  const [genTone, setGenTone] = useState("Energetic");

  // New sponsor state
  const [newSponsorName, setNewSponsorName] = useState("");
  const [newSponsorType, setNewSponsorType] = useState<"banner" | "preroll" | "midroll">("banner");
  const [newSponsorLink, setNewSponsorLink] = useState("");

  const handleCreateSponsor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSponsorName || !newSponsorLink) {
      showNotification("Please set all sponsor fields.", "error");
      return;
    }
    const slug: AdSlot = {
      id: `spon-user-${Date.now()}`,
      type: newSponsorType,
      sponsorName: newSponsorName,
      clickUrl: newSponsorLink,
      startDate: new Date().toISOString().split("T")[0],
      endDate: "2026-07-20"
    };
    setSponsors((prev) => [...prev, slug]);
    showNotification(`Sponsorship campaign for "${newSponsorName}" created successfully.`, "success");
    setNewSponsorName("");
    setNewSponsorLink("");
  };

  const handleApproveNews = (newsId: string) => {
    setNewsItems((prev) =>
      prev.map((n) => (n.id === newsId ? { ...n, verified: true } : n))
    );
    showNotification("News item verified, published, & added to automated narrative queues.", "success");
  };

  const handleDeleteNews = (newsId: string) => {
    setNewsItems((prev) => prev.filter((n) => n.id !== newsId));
    showNotification("News item rejected and removed from system queues.", "info");
  };

  const handleTriggerKillSwitch = () => {
    setFeedKilled(!feedKilled);
    if (!feedKilled) {
      onPauseWholeFeed();
      showNotification("🚨 GLOBAL EMERGENCY FEED KILL SWITCH TRIGGERED! Playback suspended immediately.", "error");
    } else {
      showNotification("✅ Global feed services restored. Continuous playlist standby active.", "success");
    }
  };

  const handleTriggerManualEp = () => {
    const fixtureObj = fixtures.find((f) => f.id === genMatch);
    const homeName = WORLD_CUP_TEAMS.find((t) => t.id === fixtureObj?.teamHomeId)?.name || "USA";
    const awayName = WORLD_CUP_TEAMS.find((t) => t.id === fixtureObj?.teamAwayId)?.name || "Canada";
    const matchNameText = `${homeName} vs ${awayName}`;

    onManualTriggerEp(matchNameText, genType, genTone);
    showNotification(`Queued production thread for manual script generation on "${matchNameText}"`, "success");
  };

  const unverifiedNews = newsItems.filter((n) => !n.verified);

  return (
    <div className="space-y-8 animate-fade-in text-black text-left">
      {/* KILL SWITCH HEADER ALERT */}
      <div className={`p-6 border-4 flex flex-col md:flex-row justify-between items-center gap-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] ${
        feedKilled ? "bg-red-500 border-black text-white" : "bg-white border-black text-black"
      }`}>
        <div className="flex items-center space-x-4">
          <AlertTriangle className={`h-11 w-11 ${feedKilled ? "text-white animate-bounce" : "text-red-500"}`} />
          <div>
            <h2 className="text-xl font-black uppercase tracking-tight italic leading-none">
              {feedKilled ? "🚨 FEED SYSTEM DISABLED VIA OPERATOR KILLED STATE" : "Live Transmission Central Hub"}
            </h2>
            <p className="text-[10px] uppercase font-mono mt-2 font-bold opacity-80 leading-normal">
              {feedKilled 
                ? "Immediate mute overrides applied over all guest streams. All playback holds." 
                : "Standard automated broadcast system online. AI narrator streaming matches."}
            </p>
          </div>
        </div>

        <button
          onClick={handleTriggerKillSwitch}
          className={`px-6 py-4.5 border-4 border-black font-black uppercase text-sm tracking-widest shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-0.5 cursor-pointer ${
            feedKilled
              ? "bg-[#CCFF00] text-black hover:bg-white"
              : "bg-red-650 text-white hover:bg-black"
          }`}
        >
          {feedKilled ? "RE-ACTIVATE FEED SERVICES" : "TRIGGER SYSTEM KILL SWITCH"}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left main grids: Metrics, Generators */}
        <div className="lg:col-span-8 space-y-8">
          
          {/* Section 2: Metrics Dashboard */}
          <div className="bg-white border-4 border-black p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
            <span className="text-[9px] font-mono uppercase tracking-widest text-neutral-400 font-bold block mb-1">
              // Section 2 Database Metrics
            </span>
            <h3 className="text-xl font-black uppercase tracking-tight italic border-b-2 border-black pb-3.5 mb-6 flex justify-between items-center">
              <span>📊 Real-Time Operations Telemetry</span>
              <span className="text-[9px] font-mono bg-neutral-100 hover:bg-neutral-200 border border-black px-2 py-0.5 cursor-pointer flex items-center">
                <RefreshCw className="h-3 w-3 mr-1 animate-spin" /> Auto-Syncing
              </span>
            </h3>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: "Active listeners DAU", val: metrics.dau.toLocaleString(), meta: "40% completes rate" },
                { label: "Live concurrent hosts", val: metrics.concurrent.toLocaleString(), meta: "+14% peak hours" },
                { label: "Completion Average mins", val: `${metrics.listeningMins}m`, meta: "per session limit" },
                { label: "Subscription converts", val: `${metrics.conversions}%`, meta: "free &rarr; gold" },
                { label: "Ad impressions", val: metrics.impressions.toLocaleString(), meta: "Pre/Mid rolls" },
                { label: "Sponsor fill rate", val: `${metrics.fillRate}%`, meta: "98% target" },
                { label: "Cohort Retention Rate", val: "D1: 42% / D7: 28%", meta: "User cohort" },
                { label: "Registered Broadcasters", val: metrics.registeredUsers.toString(), meta: "Secure auth profiles" },
              ].map((m, idx) => (
                <div key={idx} className="p-4 border-2 border-black bg-neutral-50 flex flex-col justify-between">
                  <span className="text-[10px] text-neutral-500 font-bold uppercase leading-tight">{m.label}</span>
                  <p className="text-2xl font-black my-1.5 text-black italic tracking-tighter">{m.val}</p>
                  <span className="text-[9px] font-mono text-neutral-600 bg-neutral-200/50 px-1 py-0.5 w-max tracking-wide">{m.meta}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Manual generation trigger panel */}
          <div className="bg-white border-4 border-black p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
            <span className="text-[9px] font-mono uppercase tracking-widest text-neutral-400 font-bold block mb-1">
              // Section 13 Manual Orchestrator
            </span>
            <h3 className="text-xl font-black uppercase tracking-tight italic border-b-2 border-black pb-3.5 mb-5">
              Force Manual Dynamic Content Generation
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
              <div>
                <label className="block text-[10px] font-mono uppercase font-black text-neutral-500 mb-1">
                  1. Select Fixture
                </label>
                <select
                  value={genMatch}
                  onChange={(e) => setGenMatch(e.target.value)}
                  className="w-full bg-[#F0F0F0] border-2 border-black p-2 text-xs font-black uppercase outline-none focus:bg-white cursor-pointer"
                >
                  {fixtures.map((f) => {
                    const home = WORLD_CUP_TEAMS.find((t) => t.id === f.teamHomeId)?.name || "USA";
                    const away = WORLD_CUP_TEAMS.find((t) => t.id === f.teamAwayId)?.name || "Canada";
                    return (
                      <option key={f.id} value={f.id}>
                        {home} vs {away} ({f.group})
                      </option>
                    );
                  })}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-mono uppercase font-black text-neutral-500 mb-1">
                  2. Select Format
                </label>
                <select
                  value={genType}
                  onChange={(e) => setGenType(e.target.value)}
                  className="w-full bg-[#F0F0F0] border-2 border-black p-2 text-xs font-black uppercase outline-none focus:bg-white cursor-pointer"
                >
                  <option value="preview">Match Preview (3-5 min)</option>
                  <option value="live-pulse">Live Pulse (45-90 sec)</option>
                  <option value="recap">Full-Time Recap (3-4 min)</option>
                  <option value="predictions">Prediction & Odds (2-4 min)</option>
                  <option value="mailbag">Fan Mailbag (2-3 min)</option>
                  <option value="bulletin">Breaking News Bulletin</option>
                </select>
              </div>

              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="block text-[10px] font-mono uppercase font-black text-neutral-500 mb-1">
                    3. Tone choice
                  </label>
                  <select
                    value={genTone}
                    onChange={(e) => setGenTone(e.target.value)}
                    className="w-full bg-[#F0F0F0] border-2 border-black p-2 text-xs font-black uppercase outline-none focus:bg-white cursor-pointer"
                  >
                    <option value="Energetic">Energetic</option>
                    <option value="Dramatic">Dramatic</option>
                    <option value="Casual">Casual</option>
                    <option value="Analytical">Analytical</option>
                  </select>
                </div>

                <button
                  onClick={handleTriggerManualEp}
                  className="bg-[#CCFF00] text-black border-2 border-black p-2 hover:bg-black hover:text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-0.5 cursor-pointer text-xs font-black uppercase"
                >
                  Generate
                </button>
              </div>
            </div>
          </div>

          {/* Section 12 Banned Terms config */}
          <div className="bg-white border-4 border-black p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
            <span className="text-[9px] font-mono uppercase tracking-widest text-[#CCFF00] bg-black px-2 py-0.5 font-bold mb-1 block w-max">
              // Section 12 Guardrails
            </span>
            <h3 className="text-xl font-black uppercase tracking-tight italic border-b-2 border-black pb-3.5 mb-4">
              Configure Banned Terms & Compliance Rules Block
            </h3>
            <p className="text-xs text-neutral-600 font-bold uppercase leading-relaxed mb-4">
              These hard constraint instructions are explicitly prepended to every single LLM prompt call request, preventing copyright violations or fraudulent representation.
            </p>

            <textarea
              value={bannedTerms}
              onChange={(e) => setBannedTerms(e.target.value)}
              rows={4}
              className="w-full bg-[#F0F0F0] border-2 border-black p-3 text-xs font-mono font-bold uppercase outline-none focus:bg-white resize-none"
            />
            <div className="flex justify-between items-center mt-3 text-[10px] font-bold text-neutral-500 uppercase">
              <span>Guardrails active: Strict compliance</span>
              <button
                onClick={() => showNotification("Compliance guardrails updated in central memory.", "success")}
                className="underline hover:text-black"
              >
                Save Guardrules
              </button>
            </div>
          </div>

        </div>

        {/* Right side drawers: News Verification & Sponsorship Creator */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Breaking News pipeline */}
          <div className="bg-white border-4 border-black p-5 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
            <h3 className="font-black text-xs uppercase border-b-2 border-black pb-3 mb-4 flex items-center justify-between">
              <span>📰 Wire Desk approval Queue</span>
              <span className="text-[9px] font-mono text-neutral-500 font-semibold">{unverifiedNews.length} Pending</span>
            </h3>

            {unverifiedNews.length > 0 ? (
              <div className="space-y-4">
                {unverifiedNews.map((news) => (
                  <div key={news.id} className="p-3 border-2 border-black bg-neutral-50 space-y-2">
                    <div className="flex justify-between items-center text-[8px] font-mono text-neutral-500">
                      <span>Source: {news.source}</span>
                      <span className="text-red-500 font-bold">Unverified</span>
                    </div>
                    <h5 className="font-extrabold text-xs text-black leading-tight uppercase">
                      {news.headline}
                    </h5>
                    <p className="text-[10px] text-neutral-700 leading-normal font-semibold">
                      {news.body}
                    </p>

                    <div className="flex gap-2 pt-2 border-t border-neutral-300">
                      <button
                        onClick={() => handleApproveNews(news.id)}
                        className="flex-1 py-1.5 bg-black text-[#CCFF00] font-black text-[9px] uppercase cursor-pointer"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleDeleteNews(news.id)}
                        className="flex-1 py-1.5 border border-black hover:bg-red-50 text-red-650 font-black text-[9px] uppercase cursor-pointer"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[10px] text-zinc-500 font-mono uppercase text-center py-6 border border-dashed border-neutral-300">
                // News wire desk cleared. All items are verified.
              </p>
            )}
          </div>

          {/* Sponsors campaign dashboard */}
          <div className="bg-white border-4 border-black p-5 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
            <h3 className="font-black text-xs uppercase border-b-2 border-black pb-3 mb-4">
              Sponsorship & Campaigns manager
            </h3>

            {/* List current */}
            <div className="space-y-2 mb-4 max-h-24 overflow-y-auto pr-1">
              {sponsors.map((sp) => (
                <div key={sp.id} className="p-2 border border-black hover:bg-neutral-100 flex items-center justify-between text-[10px] font-mono leading-none">
                  <span className="font-black truncate max-w-[120px]">{sp.sponsorName}</span>
                  <span className="bg-black text-white px-1 uppercase text-[8px]">{sp.type}</span>
                </div>
              ))}
            </div>

            <form onSubmit={handleCreateSponsor} className="space-y-3 pt-3 border-t border-neutral-200">
              <div>
                <label className="block text-[9px] font-mono uppercase font-black text-neutral-500 mb-1">
                  Campaign Title / Sponsor Name
                </label>
                <input
                  type="text"
                  value={newSponsorName}
                  onChange={(e) => setNewSponsorName(e.target.value)}
                  placeholder="Adidas Super Cup"
                  className="w-full bg-[#F0F0F0] border-2 border-black p-1.5 text-xs font-black uppercase outline-none focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[9px] font-mono uppercase font-black text-neutral-500 mb-1">
                    Slot Type
                  </label>
                  <select
                    value={newSponsorType}
                    onChange={(e: any) => setNewSponsorType(e.target.value)}
                    className="w-full bg-[#F0F0F0] border-2 border-black p-1 text-xs font-black uppercase outline-none focus:bg-white cursor-pointer"
                  >
                    <option value="banner">Banner Image</option>
                    <option value="preroll">Pre-Roll Audio</option>
                    <option value="midroll">Mid-Roll Ad</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[9px] font-mono uppercase font-black text-neutral-500 mb-1">
                    Target Geolocation
                  </label>
                  <select
                    defaultValue="global"
                    className="w-full bg-[#F0F0F0] border-2 border-black p-1 text-xs font-black uppercase outline-none focus:bg-white cursor-pointer"
                  >
                    <option value="global">Global (No gates)</option>
                    <option value="us">US Only</option>
                    <option value="ca">North America</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[9px] font-mono uppercase font-black text-neutral-500 mb-1">
                  Partner Landing Link URL
                </label>
                <input
                  type="text"
                  value={newSponsorLink}
                  onChange={(e) => setNewSponsorLink(e.target.value)}
                  placeholder="https://adidas.example.com"
                  className="w-full bg-[#F0F0F0] border-2 border-black p-1.5 text-xs font-bold outline-none focus:bg-white"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-black text-[#CCFF00] font-black uppercase text-xs shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] cursor-pointer"
              >
                + Deploy Sponsorship Campaign
              </button>
            </form>
          </div>

        </div>

      </div>
    </div>
  );
}
