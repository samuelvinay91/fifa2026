import React, { useState } from "react";
import {
  Sparkles,
  Check,
  Bookmark,
  Volume2,
  BellRing,
  Award,
  Zap,
  Trash2,
  Crown
} from "lucide-react";
import { Episode, Team, UserPreferences } from "../types";
import { WORLD_CUP_TEAMS } from "../data";

interface MyFeedTabProps {
  userPrefs: UserPreferences;
  setUserPrefs: React.Dispatch<React.SetStateAction<UserPreferences>>;
  episodes: Episode[];
  onPlayEpisode: (ep: Episode) => void;
  showNotification: (text: string, type: "success" | "info" | "error") => void;
}

const ALL_LANGUAGES = [
  { id: "English", label: "English", flag: "🇬🇧" },
  { id: "Spanish", label: "Español", flag: "🇪🇸" },
  { id: "Portuguese", label: "Português", flag: "🇵🇹" },
  { id: "Hindi", label: "हिन्दी", flag: "🇮🇳" },
  { id: "Arabic", label: "العربية", flag: "🇸🇦" },
  { id: "French", label: "Français", flag: "🇫🇷" },
];

export default function MyFeedTab({
  userPrefs,
  setUserPrefs,
  episodes,
  onPlayEpisode,
  showNotification,
}: MyFeedTabProps) {
  const [paywallActive, setPaywallActive] = useState(false);

  // Filter saved segments
  const savedSegments = episodes.filter((ep) =>
    userPrefs.savedSegmentIds.includes(ep.id)
  );

  const handleToggleLanguage = (langId: string) => {
    setUserPrefs((prev) => {
      const isAlreadyPicked = prev.languages.includes(langId);
      let updated: string[];

      if (isAlreadyPicked) {
        // Must keep at least one primary
        if (prev.languages.length === 1) {
          showNotification("Must keep at least one primary broadcast language.", "error");
          return prev;
        }
        updated = prev.languages.filter((l) => l !== langId);
        showNotification(`Removed ${langId} from selection.`, "info");
      } else {
        updated = [...prev.languages, langId];
        showNotification(`Added ${langId} as broadcast choice! Feed updated.`, "success");
      }

      return { ...prev, languages: updated };
    });
  };

  const handleToggleShowPref = (showType: string) => {
    setUserPrefs((prev) => {
      const currentVal = prev.showPrefs[showType] !== false; // default true
      const updatedPrefs = { ...prev.showPrefs, [showType]: !currentVal };
      showNotification(
        `Preference saved. You will now see ${!currentVal ? "more" : "less"} of ${showType} items.`,
        "success"
      );
      return { ...prev, showPrefs: updatedPrefs };
    });
  };

  const simulateCheckout = () => {
    setUserPrefs((prev) => ({
      ...prev,
      tier: prev.tier === "premium" ? "free" : "premium"
    }));
    const newTier = userPrefs.tier === "premium" ? "FREE" : "PREMIUM GOLD";
    showNotification(`Subscription upgraded! Welcome to ${newTier} tier. Ad-preemption active.`, "success");
    setPaywallActive(false);
  };

  // List of followed teams
  const followedTeams = WORLD_CUP_TEAMS.filter((t) =>
    userPrefs.followedTeamIds.includes(t.id)
  );

  return (
    <div className="space-y-8 animate-fade-in text-black text-left">
      {/* Dynamic pricing plans / Premium Paywall overlay widget and details */}
      {paywallActive ? (
        <div className="bg-gradient-to-r from-neutral-900 to-black text-white p-6 md:p-8 border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <div className="flex justify-between items-start border-b border-neutral-800 pb-4 mb-6">
            <div className="flex items-center space-x-2.5 text-white">
              <Crown className="h-7 w-7 text-[#CCFF00] animate-bounce shrink-0" />
              <h3 className="text-xl font-black uppercase tracking-widest leading-none">
                // Subscriber portal checkout
              </h3>
            </div>
            <button
              onClick={() => setPaywallActive(false)}
              className="text-xs font-mono text-[#CCFF00] underline hover:text-white cursor-pointer"
            >
              Cancel
            </button>
          </div>

          <div className="max-w-xl">
            <h4 className="text-2xl font-black uppercase italic tracking-tight text-[#CCFF00]">
              MatchDay Radio Premium — Unlimited Access Pass
            </h4>
            <p className="text-xs text-neutral-400 mt-2 font-mono">
              Remove ads entirely. Ensure earliest recap processing, offline caching permissions, high-quality stream bitrates and special daily summaries.
            </p>

            <div className="mt-6 border-2 border-neutral-700 bg-neutral-950 p-4 space-y-3.5 mb-8">
              <div className="flex justify-between font-bold text-xs">
                <span>Monthly Broadcast Pass</span>
                <span className="text-[#CCFF00]">$4.99 / mo</span>
              </div>
              <div className="border-t border-neutral-800 pt-3 flex justify-between font-bold text-xs">
                <span>Account Tier status</span>
                <span className="text-neutral-400">Guest Anonymous</span>
              </div>
            </div>

            <div className="flex flex-wrap gap-4">
              <button
                onClick={simulateCheckout}
                className="px-6 py-3.5 bg-[#CCFF00] text-black font-black uppercase text-xs tracking-tight shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-y-0.5 cursor-pointer"
              >
                Simulate Purchase
              </button>
              <button
                onClick={() => setPaywallActive(false)}
                className="px-6 py-3.5 border border-neutral-700 hover:bg-neutral-850 font-bold uppercase text-xs cursor-pointer"
              >
                Go back
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left panel: preferences configuration */}
          <div className="lg:col-span-8 space-y-6">
            {/* Account Information banner */}
            <div className="bg-white border-4 border border-black p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] flex flex-col sm:flex-row justify-between items-center gap-4">
              <div className="flex items-center space-x-3.5">
                <div className="p-3 border-2 border-black bg-black text-[#CCFF00]">
                  <Award className="h-6 w-6 stroke-[2px]" />
                </div>
                <div>
                  <h3 className="font-black text-lg uppercase tracking-tight italic">
                    Account Status: {userPrefs.tier === "premium" ? "★ Premium Pass" : "Standard Tier"}
                  </h3>
                  <p className="text-xs text-neutral-600 font-semibold uppercase mt-0.5 font-mono">
                    {userPrefs.tier === "premium" ? "Ad-Free Streaming Unlocked" : "Includes Ad Breaks"}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setPaywallActive(true)}
                className="px-4 py-2.5 bg-black text-[#CCFF00] font-black uppercase text-xs hover:bg-neutral-850 tracking-tight shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-0.5 cursor-pointer"
              >
                {userPrefs.tier === "premium" ? "Manage Subscription Plan" : "★ Go Premium - $4.99"}
              </button>
            </div>

            {/* Pick Languages panel */}
            <div className="bg-white border-4 border border-black p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
              <h3 className="font-black text-sm uppercase tracking-wider italic border-b border-neutral-300 pb-3 mb-4">
                🌍 Select Language Preferences (Pick Many)
              </h3>
              <p className="text-xs text-neutral-600 font-bold uppercase leading-relaxed mb-4">
                Scripts are authored and generated natively in each selected language for a completely natural tone and flow.
              </p>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {ALL_LANGUAGES.map((lang) => {
                  const isPicked = userPrefs.languages.includes(lang.id);
                  return (
                    <button
                      key={lang.id}
                      onClick={() => handleToggleLanguage(lang.id)}
                      className={`p-3 border-2 border-black font-black uppercase text-xs flex justify-between items-center cursor-pointer transition-all ${
                        isPicked 
                          ? "bg-[#CCFF00] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] -translate-y-0.5" 
                          : "bg-neutral-50 hover:bg-neutral-100"
                      }`}
                    >
                      <span className="flex items-center space-x-2">
                        <span className="text-xl leading-none select-none">{lang.flag}</span>
                        <span>{lang.label}</span>
                      </span>
                      {isPicked && <Check className="h-4.5 w-4.5 text-black stroke-[3.1px]" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Show preferences slider */}
            <div className="bg-white border-4 border border-black p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
              <h3 className="font-black text-sm uppercase tracking-wider italic border-b border-neutral-300 pb-3 mb-4">
                🎛️ Dynamic Show Toggles (Feed Tuning)
              </h3>
              <p className="text-xs text-neutral-600 font-bold uppercase leading-relaxed mb-4">
                Hide or emphasize specific content types on the continuous Now playlist.
              </p>

              <div className="space-y-3">
                {[
                  { id: "predictions", label: "Emphasis on Betting & Predictions Odds Shows" },
                  { id: "mailbag", label: "Include Fan Mailbag Conversation Rooms" },
                  { id: "bulletin", label: "Breaking News Hot Bulletins" },
                  { id: "explainer", label: "Standings Qualification scenarios explained" }
                ].map((pref) => {
                  const isInterested = userPrefs.showPrefs[pref.id] !== false; // defaults true
                  return (
                    <div key={pref.id} className="p-3 border-2 border-black bg-neutral-50 flex items-center justify-between text-xs font-bold uppercase text-neutral-700">
                      <span>{pref.label}</span>
                      <button
                        onClick={() => handleToggleShowPref(pref.id)}
                        className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer border border-black transition-colors duration-200 outline-none ${
                          isInterested ? "bg-[#CCFF00]" : "bg-neutral-350"
                        }`}
                      >
                        <span
                          className={`pointer-events-none inline-block h-4 w-4 transform bg-white transition duration-200 ${
                            isInterested ? "translate-x-4" : "translate-x-0"
                          }`}
                        />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right panel: followed teams list and saved audio segments */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* Followed teams overview */}
            <div className="bg-white border-4 border-black p-5 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
              <div className="border-b border-neutral-300 pb-3 mb-3">
                <h3 className="font-black text-xs uppercase flex items-center">
                  <Check className="h-4 w-4 mr-1 text-[#CCFF00] stroke-[4px]" />
                  Followed Team Channels
                </h3>
              </div>

              {followedTeams.length > 0 ? (
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {followedTeams.map((team) => (
                    <div key={team.id} className="p-2 border border-black hover:bg-neutral-100 flex items-center justify-between text-xs font-bold uppercase text-neutral-800">
                      <span className="flex items-center space-x-2">
                        <span>{team.badgeUrl}</span>
                        <span>{team.name}</span>
                      </span>
                      <button
                        onClick={() => {
                          setUserPrefs((prev) => ({
                            ...prev,
                            followedTeamIds: prev.followedTeamIds.filter((id) => id !== team.id)
                          }));
                          showNotification(`Unfollowed ${team.name} channel.`, "info");
                        }}
                        className="text-red-650 hover:underline text-[9px] font-mono font-semibold"
                      >
                        [unfollow]
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[10px] text-zinc-500 font-mono uppercase text-center py-4 border border-dashed border-neutral-300">
                  // No followed teams. Follow teams under Shows tab to prioritize stories.
                </p>
              )}
            </div>

            {/* Offline Saved audio lists */}
            <div className="bg-white border-4 border-black p-5 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
              <div className="border-b border-neutral-300 pb-3 mb-3">
                <h3 className="font-black text-xs uppercase flex items-center">
                  <Bookmark className="h-4.5 w-4.5 mr-1.5" />
                  Saved Offline Library
                </h3>
              </div>

              {savedSegments.length > 0 ? (
                <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                  {savedSegments.map((ep) => (
                    <div
                      key={ep.id}
                      onClick={() => onPlayEpisode(ep)}
                      className="p-3 border-2 border-black bg-neutral-50 hover:bg-[#CCFF00]/10 flex flex-col justify-between items-start text-[10px] font-bold uppercase text-neutral-800 cursor-pointer text-left"
                    >
                      <h4 className="font-black leading-tight mb-2 line-clamp-1">{ep.title}</h4>
                      <div className="flex justify-between items-center w-full mt-1.5 border-t border-neutral-200 pt-2 font-mono text-[9px]">
                        <span>⚽ {ep.matchName}</span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setUserPrefs((prev) => ({
                              ...prev,
                              savedSegmentIds: prev.savedSegmentIds.filter((id) => id !== ep.id)
                            }));
                            showNotification("Deleted show form library cache.", "success");
                          }}
                          className="text-red-650 hover:text-red-800"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[10px] text-zinc-500 font-mono uppercase text-center py-4 border border-dashed border-neutral-350">
                  // Caching library empty. Use the save buttons in Now player to save files.
                </p>
              )}
            </div>

          </div>

        </div>
      )}
    </div>
  );
}
