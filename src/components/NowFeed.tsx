import React, { useState, useEffect, useRef } from "react";
import {
  Play,
  Pause,
  RotateCcw,
  SkipForward,
  Bookmark,
  Share2,
  Trash2,
  Volume2,
  Sliders,
  Sparkles,
  Zap,
  Car,
  Clock,
  ExternalLink,
  Cpu,
  BookmarkCheck,
  Smartphone
} from "lucide-react";
import { Episode, UserPreferences } from "../types";
import { INITIAL_SPONSORS } from "../data";

interface NowFeedProps {
  episodes: Episode[];
  selectedEpisode: Episode | null;
  setSelectedEpisode: (ep: Episode) => void;
  currentSegmentIndex: number;
  setCurrentSegmentIndex: (idx: number) => void;
  isPlaying: boolean;
  setIsPlaying: (playing: boolean) => void;
  handlePlayPause: () => void;
  handleNextSegment: () => void;
  handlePrevSegment: () => void;
  handleRestartEpisode: () => void;
  ttsMode: boolean;
  setTtsMode: (mode: boolean) => void;
  synthesizing: boolean;
  playbackSpeed: number;
  setPlaybackSpeed: (speed: number) => void;
  showNotification: (text: string, type: "success" | "info" | "error") => void;
  userPrefs: UserPreferences;
  setUserPrefs: React.Dispatch<React.SetStateAction<UserPreferences>>;
}

export default function NowFeed({
  episodes,
  selectedEpisode,
  setSelectedEpisode,
  currentSegmentIndex,
  setCurrentSegmentIndex,
  isPlaying,
  setIsPlaying,
  handlePlayPause,
  handleNextSegment,
  handlePrevSegment,
  handleRestartEpisode,
  ttsMode,
  setTtsMode,
  synthesizing,
  playbackSpeed,
  setPlaybackSpeed,
  showNotification,
  userPrefs,
  setUserPrefs
}: NowFeedProps) {
  const [carPlayMode, setCarPlayMode] = useState(false);
  const [sleepTimerTime, setSleepTimerTime] = useState<number | null>(null); // minutes
  const [secondsRemaining, setSecondsRemaining] = useState<number | null>(null);
  const sleepTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Filter out any episodes that the user marked "Not Interested"
  const tunedEpisodes = episodes.filter(
    (ep) => !userPrefs.history.includes(`hidden_${ep.id}`)
  );

  // Inject Ads/Sponsorship slots between episodes for free tier
  const isPremium = userPrefs.tier === "premium";
  const finalQueue: (Episode | { id: string; title: string; isAd: boolean; sponsorName: string; clickUrl: string })[] = [];

  tunedEpisodes.forEach((ep, idx) => {
    finalQueue.push(ep);
    // Insert an ad after every 2 normal episodes if not premium
    if (!isPremium && (idx + 1) % 2 === 0) {
      finalQueue.push({
        id: `ad-slot-${idx}`,
        title: "Puma Kickers — Unleash Generational Speeds on the Pitch Side!",
        isAd: true,
        sponsorName: "Puma Kickers",
        clickUrl: "https://puma.example.com",
      });
    }
  });

  // Handle active countdown for Sleep Timer
  useEffect(() => {
    if (secondsRemaining !== null && isPlaying) {
      const interval = setInterval(() => {
        setSecondsRemaining((prev) => {
          if (prev === null || prev <= 1) {
            clearInterval(interval);
            setIsPlaying(false);
            showNotification("⏱️ Sleep timer completed. Playback suspended.", "info");
            return null;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [secondsRemaining, isPlaying]);

  const handleStartSleepTimer = (minutes: number) => {
    setSleepTimerTime(minutes);
    setSecondsRemaining(minutes * 60);
    showNotification(`⏱️ Sleep timer set for ${minutes} minutes.`, "success");
  };

  const handleStopSleepTimer = () => {
    setSleepTimerTime(null);
    setSecondsRemaining(null);
    showNotification("⏱️ Sleep timer canceled.", "info");
  };

  const toggleSaveEpisode = (epId: string) => {
    const isSaved = userPrefs.savedSegmentIds.includes(epId);
    setUserPrefs((prev) => {
      const updated = isSaved
        ? prev.savedSegmentIds.filter((id) => id !== epId)
        : [...prev.savedSegmentIds, epId];
      return { ...prev, savedSegmentIds: updated };
    });
    showNotification(
      isSaved ? "Removed from saved segments." : "Saved offline successfully (simulated)!",
      "success"
    );
  };

  const handleNotInterested = (epId: string) => {
    setUserPrefs((prev) => ({
      ...prev,
      history: [...prev.history, `hidden_${epId}`]
    }));
    showNotification("Hidden show. We will tune your feed to serve less of this.", "info");
    // If the hidden episode was playing, advance or stop
    if (selectedEpisode?.id === epId) {
      handleNextSegment();
    }
  };

  const shareEpisode = (ep: Episode) => {
    const shareText = `Listening to "${ep.title}" covering ${ep.matchName} on MatchDay Radio (Generically broadcasting North America 2026)!`;
    navigator.clipboard.writeText(shareText);
    showNotification("📋 Copied shareable link to clipboard!", "success");
  };

  const activeIndexInQueue = finalQueue.findIndex(
    (item) => !item.isAd && (item as Episode).id === selectedEpisode?.id
  );

  return (
    <div className="relative">
      {/* CarPlay Mode Overlay */}
      {carPlayMode && (
        <div className="fixed inset-0 bg-[#121212] z-50 text-white flex flex-col justify-between p-8 border-t-8 border-[#CCFF00]">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3 text-white">
              <Car className="h-10 w-10 text-[#CCFF00] animate-pulse" />
              <span className="font-black text-xl uppercase tracking-widest">// DECK MODE: CAR</span>
            </div>
            <button
              onClick={() => setCarPlayMode(false)}
              className="px-6 py-3 border-4 border-white text-white font-black hover:bg-white hover:text-black uppercase text-sm selection:bg-[#CCFF00]"
            >
              Exit Vehicle View
            </button>
          </div>

          <div className="text-center space-y-4 max-w-2xl mx-auto">
            <span className="bg-[#CCFF00] text-black px-4 py-1.5 font-bold uppercase text-sm rounded-none border-2 border-black">
              {selectedEpisode?.matchName || "2026 Tournament Channel"}
            </span>
            <h2 className="text-4xl sm:text-5xl font-black uppercase tracking-tight italic text-white leading-tight">
              {selectedEpisode?.title || "Station Standby"}
            </h2>
            <p className="text-xl text-neutral-400 font-mono tracking-wide">
              Segment {currentSegmentIndex + 1} of {selectedEpisode?.segments.length || 0}
            </p>
          </div>

          <div className="flex flex-col items-center space-y-6">
            <div className="flex items-center space-x-8">
              <button
                onClick={handlePrevSegment}
                disabled={currentSegmentIndex === 0}
                className="p-8 border-4 border-white bg-neutral-900 rounded-full text-white hover:bg-white hover:text-black disabled:opacity-30 cursor-pointer"
              >
                <RotateCcw className="h-8 w-8 transform -scale-x-100" />
              </button>

              <button
                onClick={handlePlayPause}
                className="p-12 bg-[#CCFF00] text-black border-4 border-black rounded-full hover:bg-white hover:text-black hover:scale-105 transition-all text-6xl cursor-pointer shadow-[0px_0px_30px_rgba(204,255,0,0.4)]"
              >
                {isPlaying ? <Pause className="h-14 w-14 fill-black" /> : <Play className="h-14 w-14 fill-black translate-x-1" />}
              </button>

              <button
                onClick={handleNextSegment}
                className="p-8 border-4 border-white bg-neutral-900 rounded-full text-white hover:bg-white hover:text-black cursor-pointer"
              >
                <SkipForward className="h-8 w-8" />
              </button>
            </div>

            <p className="text-sm font-mono text-[#CCFF00] animate-pulse">
              // Pitchside voices synced natively to {selectedEpisode?.language}
            </p>
          </div>
        </div>
      )}

      {/* Main Broadcast Deck screen alignment */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Side: Active Card */}
        <div className="lg:col-span-8 space-y-6">
          <div className="relative bg-white border-4 border border-black p-6 sm:p-8 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] text-black">
            
            {/* Header section with live indicator, tts toggle */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b-2 border-black pb-6 mb-6 gap-4">
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <span className={`px-2.5 py-1 text-[10px] tracking-wider uppercase font-mono font-black border-2 border-black ${
                    isPlaying ? "bg-red-500 text-white animate-pulse" : "bg-neutral-200 text-neutral-800"
                  }`}>
                    {isPlaying ? "● ON AIR" : "■ STATION STANDBY"}
                  </span>
                  {selectedEpisode?.isSponsored && (
                    <span className="bg-[#CCFF00] text-black border-2 border-black px-2.5 py-1 text-[10px] uppercase font-bold">
                      Sponsored Segment
                    </span>
                  )}
                  {secondsRemaining !== null && (
                    <span className="bg-neutral-850 text-white text-[10px] font-mono px-2 py-0.5 border border-black flex items-center">
                      <Clock className="h-3 w-3 mr-1 animate-spin" />
                      Timer: {Math.floor(secondsRemaining / 60)}m {secondsRemaining % 60}s
                    </span>
                  )}
                </div>

                <h2 className="text-3xl font-black uppercase tracking-tighter text-black italic leading-tight">
                  {selectedEpisode?.title}
                </h2>

                <p className="text-sm text-black mt-2.5 flex flex-wrap items-center gap-1.5 font-bold">
                  <span className="bg-[#CCFF00] border border-black px-2 py-0.5 font-black uppercase text-xs">⚽ {selectedEpisode?.matchName}</span>
                  <span className="bg-white border border-black px-2 py-0.5 text-xs font-black uppercase">{selectedEpisode?.language} Show</span>
                  <span className="bg-neutral-100 border border-black px-2 py-0.5 text-xs font-mono font-bold uppercase">{selectedEpisode?.showType} Tag</span>
                </p>
              </div>

              {/* Speech Engine Configuration */}
              <div className="flex items-center bg-[#F0F0F0] p-2 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                <div className="flex flex-col text-right mr-3 text-black">
                  <span className="text-[11px] font-black uppercase tracking-tight flex items-center justify-end">
                    <Cpu className="h-3.5 w-3.5 mr-1 text-black" />
                    AI Voices
                  </span>
                  <span className="text-[9px] font-mono font-bold text-neutral-600">Gemini Synthesis</span>
                </div>
                <button
                  onClick={() => {
                    setTtsMode(!ttsMode);
                    showNotification(
                      !ttsMode 
                        ? "Connecting to ultra-realistic Gemini TTS Voice Synthesis."
                        : "Switched to standard fast browser speech synthesis.",
                      "info"
                    );
                  }}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer border-2 border-black transition-colors duration-200 focus:outline-none ${
                    ttsMode ? "bg-[#CCFF00]" : "bg-neutral-300"
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform border border-black bg-white shadow transition duration-200 ${
                      ttsMode ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* EQ Animation Stage */}
            <div className="relative h-28 w-full bg-black border-4 border-black flex items-center justify-center overflow-hidden mb-6">
              {isPlaying ? (
                <div className="flex items-end gap-[3px] h-16">
                  {Array.from({ length: 48 }).map((_, i) => {
                    const randomDur = 0.4 + Math.random() * 0.7;
                    const randomDelay = Math.random() * 0.4;
                    return (
                      <div
                        key={i}
                        style={{
                          animation: `soundwave-bounce ${randomDur}s ease-in-out infinite alternate ${randomDelay}s`,
                          height: synthesizing ? "4px" : "10px"
                        }}
                        className={`w-1 ${synthesizing ? "bg-neutral-800" : "bg-[#CCFF00]"}`}
                      />
                    );
                  })}
                </div>
              ) : (
                <div className="flex items-end gap-[3px] h-2">
                  {Array.from({ length: 48 }).map((_, i) => (
                    <div key={i} className="w-1 h-1 bg-neutral-800" />
                  ))}
                </div>
              )}

              {synthesizing && (
                <div className="absolute inset-0 bg-black/90 flex flex-col justify-center items-center">
                  <div className="h-6 w-6 border-3 border-[#CCFF00] border-t-transparent animate-spin mb-2" />
                  <span className="text-[10px] font-mono font-black text-[#CCFF00] tracking-widest animate-pulse">
                    GENERATING DYNAMIC SPEECH OVER COAXIAL STREAM...
                  </span>
                </div>
              )}
            </div>

            {/* Primary Console Dashboard controls */}
            <div className="flex flex-col sm:flex-row justify-between items-center bg-[#F0F0F0] p-4 border-2 border-black gap-4 mb-6">
              <div className="flex items-center space-x-2">
                <button
                  onClick={handlePrevSegment}
                  disabled={currentSegmentIndex === 0}
                  className="p-2.5 border border-black bg-white text-black hover:bg-neutral-100 disabled:opacity-45 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-0.5 cursor-pointer"
                >
                  <RotateCcw className="h-4 w-4 transform -scale-x-100" />
                </button>

                <button
                  onClick={handlePlayPause}
                  className="p-4 bg-[#CCFF00] text-black border-2 border-black hover:bg-black hover:text-[#CCFF00] transition-all shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] cursor-pointer"
                >
                  {isPlaying ? <Pause className="h-5 w-5 fill-current" /> : <Play className="h-5 w-5 fill-current translate-x-0.5" />}
                </button>

                <button
                  onClick={handleNextSegment}
                  className="p-2.5 border border-black bg-white text-black hover:bg-neutral-100 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-0.5 cursor-pointer"
                >
                  <SkipForward className="h-4 w-4" />
                </button>
              </div>

              {/* Progress Slider */}
              <div className="w-full sm:w-1/3 flex flex-col">
                <div className="flex justify-between items-center text-[10px] text-neutral-500 font-mono mb-1">
                  <span>Show Timeline</span>
                  <span>Segment {currentSegmentIndex + 1} of {selectedEpisode?.segments.length || 0}</span>
                </div>
                <div className="h-2 w-full bg-neutral-350 border border-black rounded-none overflow-hidden">
                  <div
                    className="h-full bg-black transition-all"
                    style={{
                      width: `${selectedEpisode ? ((currentSegmentIndex + 1) / selectedEpisode.segments.length) * 100 : 0}%`
                    }}
                  />
                </div>
              </div>

              {/* Action utility indicators */}
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => selectedEpisode && toggleSaveEpisode(selectedEpisode.id)}
                  title="Save show offline"
                  className="p-2 border border-black bg-white hover:bg-neutral-100 rounded-none cursor-pointer"
                >
                  {selectedEpisode && userPrefs.savedSegmentIds.includes(selectedEpisode.id) ? (
                    <BookmarkCheck className="h-4 w-4 text-emerald-600" />
                  ) : (
                    <Bookmark className="h-4 w-4" />
                  )}
                </button>
                <button
                  onClick={() => selectedEpisode && shareEpisode(selectedEpisode)}
                  title="Share show link"
                  className="p-2 border border-black bg-white hover:bg-neutral-100 rounded-none cursor-pointer"
                >
                  <Share2 className="h-4 w-4" />
                </button>
                <button
                  onClick={() => selectedEpisode && handleNotInterested(selectedEpisode.id)}
                  title="Tune/Filter this kind of segment"
                  className="p-2 border border-black bg-white text-red-650 hover:bg-red-50 rounded-none cursor-pointer"
                >
                  <Trash2 className="h-4 w-4 text-red-650" />
                </button>
              </div>
            </div>

            {/* Utility features: CarPlay Speed Sleep */}
            <div className="flex flex-wrap gap-4 items-center justify-between border-t-2 border-black pt-5 text-xs text-slate-700">
              <div className="flex items-center space-x-4">
                {/* CarPlay mode Button */}
                <button
                  onClick={() => setCarPlayMode(true)}
                  className="flex items-center space-x-2 px-3 py-1.5 border border-black bg-white font-bold uppercase text-[10px] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 cursor-pointer"
                >
                  <Car className="h-4 w-4 text-neutral-800" />
                  <span>Car Mode</span>
                </button>

                {/* Sleep Timer button widgets */}
                <div className="flex items-center space-x-1 bg-white border border-black p-1">
                  <Clock className="h-3.5 w-3.5 text-neutral-800 mr-1 ml-0.5" />
                  <span className="font-bold text-[10px] uppercase mr-1.5">Timer:</span>
                  {sleepTimerTime ? (
                    <button
                      onClick={handleStopSleepTimer}
                      className="px-1.5 py-0.5 bg-red-500 text-white font-mono uppercase text-[9px]"
                    >
                      Off
                    </button>
                  ) : (
                    [5, 15, 30].map((min) => (
                      <button
                        key={min}
                        onClick={() => handleStartSleepTimer(min)}
                        className="px-1.5 py-0.5 bg-neutral-200 hover:bg-black hover:text-white font-mono text-[9px]"
                      >
                        {min}m
                      </button>
                    ))
                  )}
                </div>
              </div>

              {/* Playback speed selector */}
              <div className="flex items-center space-x-2 bg-white border border-black p-1">
                <Sliders className="h-3.5 w-3.5 text-neutral-800 ml-0.5" />
                <span className="font-bold text-[10px] uppercase mr-1.5">Speed:</span>
                {[0.8, 1.0, 1.2, 1.5, 2.0].map((spd) => (
                  <button
                    key={spd}
                    onClick={() => {
                      setPlaybackSpeed(spd);
                      showNotification(`Playback speed set to ${spd}x`, "info");
                    }}
                    className={`px-1.5 py-0.5 font-mono text-[9px] ${
                      playbackSpeed === spd ? "bg-[#CCFF00] text-black font-black" : "bg-neutral-200"
                    }`}
                  >
                    {spd}x
                  </button>
                ))}
              </div>
            </div>

            {/* Subscriptions promo banner */}
            {!isPremium && (
              <div className="mt-8 bg-gradient-to-r from-black to-neutral-850 text-white p-4 flex flex-col sm:flex-row justify-between items-center gap-4">
                <div>
                  <h4 className="font-black text-[#CCFF00] text-xs uppercase tracking-wider flex items-center">
                    <Zap className="h-4 w-4 mr-1 stroke-[3px]" />
                    Go Premium for Ad-Free Continuous Playback
                  </h4>
                  <p className="text-[11px] text-neutral-300 mt-1">
                    Get early access to match bulletins, offline downloads, and zero audio ad delays.
                  </p>
                </div>
                <div className="text-right text-[#CCFF00] font-mono text-xs uppercase font-black tracking-wide border-2 border-[#CCFF00] px-3 py-1 bg-black shrink-0">
                  Only $4.99/mo
                </div>
              </div>
            )}
            
            {/* Disclaimer for Prebuilt Betting elements */}
            {selectedEpisode?.showType === "predictions" && (
              <div className="mt-6 border-2 border-red-500/20 bg-red-500/5 p-3.5 text-[10px] text-red-750 font-bold uppercase flex items-start space-x-2">
                <span className="shrink-0 font-black px-1.5 bg-red-650 text-white text-[9px]">CAUTION</span>
                <span>Predictions and stats are for entertainment only; this is not betting advice. Play responsibly and consult licensed sources.</span>
              </div>
            )}

          </div>

          {/* SCRIPT TIMELINE PANEL */}
          <div className="bg-white border-4 border-black p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
            <div className="flex justify-between items-center border-b-2 border-black pb-4 mb-4">
              <h3 className="font-black flex items-center space-x-2 uppercase text-xs tracking-wider">
                <span>🔊 CURRENT TRACK TRANSMISSION SCRIPT</span>
              </h3>
              <span className="text-[10px] font-mono text-neutral-500">// VOICE OVER THE AIR</span>
            </div>

            <div className="space-y-4">
              {selectedEpisode?.segments.map((seg, idx) => {
                const isActive = idx === currentSegmentIndex;
                return (
                  <div
                    key={idx}
                    onClick={() => {
                      setCurrentSegmentIndex(idx);
                      setIsPlaying(true);
                    }}
                    className={`p-4 border-2 transition-all cursor-pointer ${
                      isActive 
                        ? "bg-[#CCFF00]/10 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]" 
                        : "bg-neutral-50 border-neutral-300 hover:border-black"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <span className="font-black uppercase text-xs italic">{seg.speaker}</span>
                        <span className="text-[8px] font-mono bg-black text-white px-1.5 py-0.5">{seg.role}</span>
                      </div>
                      <span className="text-[9px] font-mono text-neutral-500">Voice ID: {seg.voice}</span>
                    </div>
                    <p className="text-xs text-neutral-800 leading-relaxed font-semibold">{seg.text}</p>
                    
                    {isActive && isPlaying && (
                      <div className="flex items-center space-x-1.5 justify-end mt-2">
                        <span className="h-1.5 w-1.5 bg-black animate-ping" />
                        <span className="text-[8px] font-mono font-black uppercase text-black">transmitting...</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Side: Endless Queue & Sponsor Banners */}
        <div className="lg:col-span-4 space-y-6">
          {/* SPONSOR BANNER TAPPABLE CARD */}
          <div className="bg-white border-4 border-black p-5 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
            <span className="text-[9px] font-mono uppercase tracking-widest text-neutral-400 font-bold block mb-1">
              // Premium Partner Advertisement
            </span>
            <a
              href="https://soccergear.example.com/discount2026"
              target="_blank"
              rel="noreferrer"
              className="group block relative border-2 border-black overflow-hidden"
            >
              <img
                src={INITIAL_SPONSORS[0].creativeUrl}
                alt="Sponsor discount"
                className="w-full h-24 object-cover group-hover:scale-105 duration-200"
              />
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 duration-200 transition-opacity flex justify-center items-center text-white text-xs font-black uppercase">
                Visit Partner Desk &rarr;
              </div>
            </a>
            <div className="flex justify-between items-center mt-2.5 text-[10px] font-bold text-neutral-700">
              <span className="uppercase tracking-tight">Supplied by {INITIAL_SPONSORS[0].sponsorName}</span>
              <span className="flex items-center text-[#CCFF00] bg-black px-1.5 py-0.5">Ad <ExternalLink className="h-3.5 w-3.5 ml-1 inline text-current" /></span>
            </div>
          </div>

          {/* Endless Queue Widget */}
          <div className="bg-white border-4 border-black p-5 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
            <div className="flex items-center justify-between border-b-2 border-black pb-3 mb-4">
              <h3 className="font-black text-xs uppercase tracking-wider flex items-center">
                <Volume2 className="h-4.5 w-4.5 mr-1.5" />
                Never-Ending Playlist Feed
              </h3>
              <span className="text-[9px] font-bold bg-neutral-100 border border-black py-0.5 px-2 font-mono">
                {finalQueue.length} Tracks
              </span>
            </div>

            <div className="space-y-3 max-h-[460px] overflow-y-auto pr-1">
              {finalQueue.map((item, index) => {
                const isSelected = !item.isAd && (item as Episode).id === selectedEpisode?.id;
                
                if (item.isAd) {
                  return (
                    <div
                      key={item.id}
                      className="p-3 border-2 border-dashed border-red-400 bg-red-50/40 relative text-left"
                    >
                      <div className="flex justify-between items-center text-[9px] font-mono text-red-500 font-bold">
                        <span>SPONSOR BULLETIN (FREE FEED)</span>
                        <span className="px-1 bg-red-600 text-white rounded-none">Ad Slot</span>
                      </div>
                      <h4 className="text-xs font-black mt-1 uppercase text-neutral-800 leading-tight">
                        {item.title}
                      </h4>
                      <p className="text-[9px] text-neutral-500 font-mono mt-1">// Auto-skipped for Premium subscribers.</p>
                    </div>
                  );
                }

                const ep = item as Episode;
                return (
                  <div
                    key={ep.id}
                    onClick={() => {
                      setSelectedEpisode(ep);
                      setCurrentSegmentIndex(0);
                      setIsPlaying(true);
                      showNotification(`Now playing continuous track: ${ep.title}`, "info");
                    }}
                    className={`p-3.5 border-2 text-left cursor-pointer transition-all ${
                      isSelected
                        ? "bg-[#CCFF00]/15 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] -translate-y-0.5"
                        : "bg-white border-neutral-200 hover:border-black"
                    }`}
                  >
                    <div className="flex justify-between items-start text-[8px] font-mono font-bold uppercase mb-1">
                      <span className={ep.id.startsWith("db") ? "text-red-500" : "text-neutral-500"}>
                        {ep.id.startsWith("db") ? "🤖 generated profile" : "📰 tournament preset"}
                      </span>
                      <span>~{ep.durationSeconds}s</span>
                    </div>

                    <h4 className={`text-xs font-black uppercase tracking-tight line-clamp-1 ${
                      isSelected ? "italic text-black" : "text-neutral-800"
                    }`}>
                      {ep.title}
                    </h4>

                    <div className="flex justify-between items-center mt-2 text-[9px] font-bold font-mono text-neutral-600">
                      <span>⚽ {ep.matchName}</span>
                      <span className="bg-black text-white px-1 leading-normal uppercase">{ep.language}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
