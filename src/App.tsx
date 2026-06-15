import React, { useState, useEffect, useRef } from "react";
import {
  Radio,
  Sparkles,
  Zap,
  Cpu,
  Volume2,
  VolumeX,
  Smartphone,
  Menu,
  ShieldCheck,
  ChevronRight,
  Calculator,
  Lock,
  Plus
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { auth, googleAuthProvider, OperationType, handleFirestoreError } from "./lib/firebase.ts";
import { db } from "./lib/firebase.ts";
import { collection, query, where, getDocs, doc, setDoc } from "firebase/firestore";
import { signInWithPopup, signOut, onAuthStateChanged, User } from "firebase/auth";

import { Episode, Team, Fixture, MatchEvent, Standing, NewsItem, UserPreferences, AdSlot } from "./types.ts";
import {
  WORLD_CUP_TEAMS,
  INITIAL_FIXTURES,
  INITIAL_MATCH_EVENTS,
  INITIAL_STANDINGS,
  INITIAL_NEWS_ITEMS,
  INITIAL_SPONSORS,
  MOCK_METRICS,
  INITIAL_EPISODES
} from "./data.ts";

import NowFeed from "./components/NowFeed.tsx";
import ShowsTab from "./components/ShowsTab.tsx";
import LiveTab from "./components/LiveTab.tsx";
import MyFeedTab from "./components/MyFeedTab.tsx";
import MoreTab from "./components/MoreTab.tsx";
import AdminTab from "./components/AdminTab.tsx";

export default function App() {
  // Navigation tabs
  const [activeTab, setActiveTab] = useState<"now" | "shows" | "live" | "my-feed" | "more" | "admin">("now");

  // Authentication State
  const [user, setUser] = useState<User | null>(null);
  const [checkingAuth, setCheckingAuth] = useState<boolean>(true);

  // Core Data Lists
  const [episodes, setEpisodes] = useState<Episode[]>(INITIAL_EPISODES);
  const [fixtures, setFixtures] = useState<Fixture[]>(INITIAL_FIXTURES);
  const [matchEvents, setMatchEvents] = useState<MatchEvent[]>(INITIAL_MATCH_EVENTS);
  const [newsItems, setNewsItems] = useState<NewsItem[]>(INITIAL_NEWS_ITEMS);
  const [sponsors, setSponsors] = useState<AdSlot[]>(INITIAL_SPONSORS);

  const [selectedEpisode, setSelectedEpisode] = useState<Episode | null>(INITIAL_EPISODES[0]);
  const [currentSegmentIndex, setCurrentSegmentIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [ttsMode, setTtsMode] = useState<boolean>(false); // false: fast web tts, true: Gemini high quality
  const [synthesizing, setSynthesizing] = useState<boolean>(false);

  // Sound speed setting (0.8x-2x)
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1.0);

  // Audio nodes referrers
  const currentSpeechUtterance = useRef<SpeechSynthesisUtterance | null>(null);
  const currentAudioSource = useRef<AudioBufferSourceNode | null>(null);
  const currentAudioCtx = useRef<AudioContext | null>(null);

  // Stadium pink noise/bandpass ambiance sweeper
  const [isAmbianceOn, setIsAmbianceOn] = useState<boolean>(false);
  const [ambianceVolume, setAmbianceVolume] = useState<number>(15);
  const ambianceNode = useRef<{ noiseSource: AudioBufferSourceNode; gainNode: GainNode } | null>(null);
  const stadiumAudioCtx = useRef<AudioContext | null>(null);

  // Admin and configuration state
  const [feedKilled, setFeedKilled] = useState<boolean>(false);
  const [lowDataMode, setLowDataMode] = useState<boolean>(false);
  const [quietHours, setQuietHours] = useState<boolean>(false);
  const [bannedTerms, setBannedTerms] = useState<string>(
    "DO NOT USE THE RAW TRADEMARKS 'FIFA' OR 'FIFA WORLD CUP' WITHOUT PROPER FAIR USE DECLARATIONS. ALWAYS PREPEND STATISTIC REVIEWS WITH RESPONSIBLE GAMING CAUTIONS."
  );

  // Original ROI states (rendered as nested Advanced tools in the More settings/Console tab)
  const [monthlyEpisodes, setMonthlyEpisodes] = useState<number>(30);
  const [audienceReach, setAudienceReach] = useState<number>(50000);
  const [sponsorshipCpm, setSponsorshipCpm] = useState<number>(25);
  const [midrollSpots, setMidrollSpots] = useState<number>(2);
  const [premiumSubscribers, setPremiumSubscribers] = useState<number>(1000);
  const [subscriberFee, setSubscriberFee] = useState<number>(4.99);

  // Standard user profiles
  const [userPrefs, setUserPrefs] = useState<UserPreferences>({
    languages: ["English"],
    followedTeamIds: ["usa", "mex"],
    showPrefs: {},
    tier: "free",
    savedSegmentIds: [],
    history: []
  });

  // Action alerts
  const [notification, setNotification] = useState<{ text: string; type: "success" | "info" | "error" } | null>(null);

  // Synchronize dynamic background ticking events (resembling goals/foul events live)
  useEffect(() => {
    const clockInterval = setInterval(() => {
      // Every 30 seconds, simulate another 1 minute pass on live matches
      setFixtures((prev) =>
        prev.map((f) => {
          if (f.status === "live" && f.minute !== undefined) {
            const nextMin = f.minute + 1;
            if (nextMin >= 90) {
              // Conclude
              showNotification(`🏆 Match Completed! Full time whistle for ${WORLD_CUP_TEAMS.find(t=>t.id===f.teamHomeId)?.name} vs ${WORLD_CUP_TEAMS.find(t=>t.id===f.teamAwayId)?.name}`, "info");
              return { ...f, status: "completed", minute: undefined };
            }
            
            // Random goal scoring chance
            if (Math.random() > 0.88) {
              const scoreHome = Math.random() > 0.5;
              const scorerId = scoreHome ? f.teamHomeId : f.teamAwayId;
              const scorerName = scoreHome ? "Christian Pulisic" : "Santiago Giménez";
              
              // Register MatchEvent
              const newEv: MatchEvent = {
                id: `ev-${Date.now()}`,
                matchId: f.id,
                minute: nextMin,
                type: "goal",
                playerName: scorerName,
                teamId: scorerId
              };
              setMatchEvents((old) => [newEv, ...old]);

              // Trigger Audio goals cheer soundboard
              triggerGoalCheer();

              return {
                ...f,
                minute: nextMin,
                homeScore: scoreHome ? (f.homeScore || 0) + 1 : f.homeScore,
                awayScore: !scoreHome ? (f.awayScore || 0) + 1 : f.awayScore
              };
            }
            return { ...f, minute: nextMin };
          }
          return f;
        })
      );
    }, 15000);

    return () => clearInterval(clockInterval);
  }, []);

  // Monitor Auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (usr) => {
      setUser(usr);
      setCheckingAuth(false);
      fetchEpisodes(usr);
    });
    return () => {
      unsubscribe();
      stopAllAudio();
      stopAmbiance();
    };
  }, []);

  // Track state playback changes
  useEffect(() => {
    if (isPlaying && selectedEpisode && !feedKilled) {
      playCurrentSegment();
    } else {
      stopAllAudio();
    }
  }, [isPlaying, currentSegmentIndex, selectedEpisode, feedKilled]);

  const showNotification = (text: string, type: "success" | "info" | "error" = "info") => {
    setNotification({ text, type });
    setTimeout(() => {
      setNotification((prev) => (prev?.text === text ? null : prev));
    }, 5000);
  };

  // List dynamic profiles
  const fetchEpisodes = async (currentUser: User | null = auth.currentUser) => {
    try {
      let serverEpisodes: Episode[] = [];
      try {
        const response = await fetch("/api/episodes");
        if (response.ok) {
          serverEpisodes = await response.json();
        }
      } catch (e) {
        console.warn("REST fetch fallback:", e);
      }

      let firestoreEpisodes: Episode[] = [];
      if (currentUser) {
        try {
          const q = query(
            collection(db, "episodes"),
            where("userId", "==", currentUser.uid)
          );
          const querySnapshot = await getDocs(q);
          if (querySnapshot) {
            firestoreEpisodes = querySnapshot.docs.map((docSnap) => {
              const data = docSnap.data();
              return {
                id: docSnap.id,
                title: data.title,
                matchName: data.matchName,
                language: data.language || "English",
                tone: data.tone || "Dramatic",
                segments: data.segments,
                durationSeconds: data.durationSeconds || 60,
                showType: data.showType || "preview",
                relatedTeamIds: data.relatedTeamIds || ["usa"],
                createdAt: data.createdAt,
                tier: data.tier || "free"
              } as Episode;
            });
            // Sort
            firestoreEpisodes.sort(
              (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            );
          }
        } catch (dbErr) {
          console.warn("Client fallback Firestore list:", dbErr);
        }
      }

      const merged = [
        ...INITIAL_EPISODES,
        ...serverEpisodes.filter((s) => !INITIAL_EPISODES.some((i) => i.id === s.id)),
        ...firestoreEpisodes.filter((f) => !INITIAL_EPISODES.some((i) => i.id === f.id))
      ];
      setEpisodes(merged);
    } catch (err) {
      console.error(err);
    }
  };

  const stopAllAudio = () => {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    if (currentAudioSource.current) {
      try {
        currentAudioSource.current.stop();
      } catch (e) {}
      currentAudioSource.current = null;
    }
  };

  const handlePlayPause = () => {
    if (feedKilled) {
      showNotification("Playback locked. Emergency Operator Kill Switch is Active.", "error");
      return;
    }
    setIsPlaying(!isPlaying);
  };

  // Advanced play loop advance
  const handleNextSegment = () => {
    if (!selectedEpisode) return;
    if (currentSegmentIndex < selectedEpisode.segments.length - 1) {
      setCurrentSegmentIndex((prev) => prev + 1);
    } else {
      // Queue next episode in directory list for standard endless continuous playback
      const currIdx = episodes.findIndex((e) => e.id === selectedEpisode.id);
      if (currIdx !== -1 && currIdx < episodes.length - 1) {
        setSelectedEpisode(episodes[currIdx + 1]);
        setCurrentSegmentIndex(0);
        showNotification(`Show complete. Advancing to next station broadcast segment: ${episodes[currIdx + 1].title}`, "info");
      } else {
        // Recycle back to start
        setSelectedEpisode(episodes[0]);
        setCurrentSegmentIndex(0);
        showNotification("Recycling station playlist stream...", "info");
      }
    }
  };

  const handlePrevSegment = () => {
    if (currentSegmentIndex > 0) {
      setCurrentSegmentIndex((prev) => prev - 1);
    }
  };

  const handleRestartEpisode = () => {
    stopAllAudio();
    setCurrentSegmentIndex(0);
    setTimeout(() => setIsPlaying(true), 100);
  };

  const playCurrentSegment = async () => {
    if (!selectedEpisode || feedKilled) return;
    const segment = selectedEpisode.segments[currentSegmentIndex];
    if (!segment) return;

    stopAllAudio();

    if (ttsMode) {
      setSynthesizing(true);
      try {
        const headers: HeadersInit = { "Content-Type": "application/json" };
        if (auth.currentUser) {
          const idToken = await auth.currentUser.getIdToken();
          headers["Authorization"] = `Bearer ${idToken}`;
        }

        const response = await fetch("/api/generate-speech", {
          method: "POST",
          headers,
          body: JSON.stringify({ text: segment.text, voice: segment.voice })
        });

        if (response.ok) {
          const data = await response.json();
          setSynthesizing(false);
          if (data.useBrowserSpeech) {
            speakWithBrowserSpeech(segment.text, segment.voice);
          } else if (data.audio) {
            playPcmAudio(data.audio);
          } else {
            speakWithBrowserSpeech(segment.text, segment.voice);
          }
        } else {
          throw new Error();
        }
      } catch (e) {
        setSynthesizing(false);
        speakWithBrowserSpeech(segment.text, segment.voice);
      }
    } else {
      speakWithBrowserSpeech(segment.text, segment.voice);
    }
  };

  const playPcmAudio = (base64: string) => {
    try {
      const binary = atob(base64);
      const len = binary.length;
      const buffer = new ArrayBuffer(len);
      const view = new DataView(buffer);
      for (let i = 0; i < len; i++) {
        view.setUint8(i, binary.charCodeAt(i));
      }

      const pcm16 = new Int16Array(buffer);
      const float32 = new Float32Array(pcm16.length);
      for (let i = 0; i < pcm16.length; i++) {
        float32[i] = pcm16[i] / 32768;
      }

      if (!currentAudioCtx.current) {
        currentAudioCtx.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      }

      const ctx = currentAudioCtx.current;
      const audioBuffer = ctx.createBuffer(1, float32.length, 24000);
      audioBuffer.getChannelData(0).set(float32);

      const source = ctx.createBufferSource();
      source.buffer = audioBuffer;
      source.playbackRate.value = playbackSpeed; // Apply playback speed
      source.connect(ctx.destination);

      source.onended = () => {
        if (isPlaying) {
          handleNextSegment();
        }
      };

      currentAudioSource.current = source;
      source.start(0);
    } catch (e) {
      speakWithBrowserSpeech(
        selectedEpisode!.segments[currentSegmentIndex].text,
        selectedEpisode!.segments[currentSegmentIndex].voice
      );
    }
  };

  const speakWithBrowserSpeech = (text: string, voiceName: string) => {
    const synth = window.speechSynthesis;
    if (!synth) {
      handleNextSegment();
      return;
    }

    synth.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = playbackSpeed; // Apply chosen speed multiplier

    if (voiceName === "Zephyr") {
      utterance.pitch = 0.95;
    } else if (voiceName === "Kore") {
      utterance.pitch = 1.15;
    } else if (voiceName === "Puck") {
      utterance.pitch = 0.85;
    }

    const voices = synth.getVoices();
    if (selectedEpisode?.language === "Spanish") {
      const v = voices.find((x) => x.lang.startsWith("es"));
      if (v) utterance.voice = v;
    } else if (selectedEpisode?.language === "Portuguese") {
      const v = voices.find((x) => x.lang.startsWith("pt"));
      if (v) utterance.voice = v;
    }

    utterance.onend = () => {
      // Proceed checks
      if (isPlaying) {
        handleNextSegment();
      }
    };

    utterance.onerror = () => {
      setTimeout(() => {
        if (isPlaying) handleNextSegment();
      }, 3000);
    };

    currentSpeechUtterance.current = utterance;
    synth.speak(utterance);
  };

  // Web Audio Crowd Synthesizers
  const startAmbiance = () => {
    try {
      if (!stadiumAudioCtx.current) {
        stadiumAudioCtx.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = stadiumAudioCtx.current;
      if (ctx.state === "suspended") ctx.resume();

      const bufferSize = 10 * ctx.sampleRate;
      const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);

      let lastOut = 0.0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        output[i] = (lastOut + 0.02 * white) / 1.02;
        lastOut = output[i];
        output[i] *= 4.5;
      }

      const noiseSource = ctx.createBufferSource();
      noiseSource.buffer = noiseBuffer;
      noiseSource.loop = true;

      const filter = ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.value = 240;

      const osc = ctx.createOscillator();
      osc.frequency.value = 0.15;

      const oscGain = ctx.createGain();
      oscGain.gain.value = 0.04;

      const gainNode = ctx.createGain();
      gainNode.gain.value = ambianceVolume / 400;

      osc.connect(oscGain);
      oscGain.connect(gainNode.gain);
      noiseSource.connect(filter);
      filter.connect(gainNode);
      gainNode.connect(ctx.destination);

      noiseSource.start(0);
      osc.start(0);

      ambianceNode.current = { noiseSource, gainNode };
      setIsAmbianceOn(true);
      showNotification("🔊 Stadium background murmur synthesis active.", "success");
    } catch (e) {
      console.warn(e);
    }
  };

  const stopAmbiance = () => {
    if (ambianceNode.current) {
      try {
        ambianceNode.current.noiseSource.stop();
      } catch (e) {}
      ambianceNode.current = null;
      setIsAmbianceOn(false);
      showNotification("🔇 Stadium feedback muted.", "info");
    }
  };

  const handleAmbianceVolumeChange = (v: number) => {
    setAmbianceVolume(v);
    if (ambianceNode.current) {
      ambianceNode.current.gainNode.gain.setValueAtTime(v / 400, stadiumAudioCtx.current!.currentTime);
    }
  };

  const triggerGoalCheer = () => {
    try {
      if (!stadiumAudioCtx.current) {
        stadiumAudioCtx.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = stadiumAudioCtx.current;
      if (ctx.state === "suspended") ctx.resume();

      const bufferSize = 3.5 * ctx.sampleRate;
      const cheerBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = cheerBuffer.getChannelData(0);

      let lastOut = 0.0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        data[i] = (lastOut + 0.12 * white) / 1.12;
        lastOut = data[i];
      }

      const source = ctx.createBufferSource();
      source.buffer = cheerBuffer;

      const filter = ctx.createBiquadFilter();
      filter.type = "bandpass";
      filter.frequency.setValueAtTime(320, ctx.currentTime);
      filter.Q.value = 1.2;

      const gainNode = ctx.createGain();
      gainNode.gain.setValueAtTime(0.01, ctx.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.35, ctx.currentTime + 0.35);
      gainNode.gain.exponentialRampToValueAtTime(0.02, ctx.currentTime + 3.4);

      filter.frequency.linearRampToValueAtTime(750, ctx.currentTime + 0.5);
      filter.frequency.exponentialRampToValueAtTime(330, ctx.currentTime + 3.3);

      source.connect(filter);
      filter.connect(gainNode);
      gainNode.connect(ctx.destination);

      source.start(0);
      showNotification("⚽ GOOOAL ROAR SWELLS IN STADIUM DESK!", "success");
    } catch (e) {
      console.warn(e);
    }
  };

  // Manual trigger episode from operator pane
  const handleManualTriggerEp = async (matchName: string, showType: string, tone: string) => {
    showNotification("Queuing generator thread...", "info");
    try {
      const headers: HeadersInit = { "Content-Type": "application/json" };
      if (auth.currentUser) {
        const token = await auth.currentUser.getIdToken();
        headers["Authorization"] = `Bearer ${token}`;
      }

      // Prepend banned terms guardrails
      const customStats = `[OPERATOR RULES: ${bannedTerms}]. Provide a specialized ${showType} script.`;

      const resObj = await fetch("/api/generate-episode", {
        method: "POST",
        headers,
        body: JSON.stringify({
          matchName,
          language: userPrefs.languages[0] || "English",
          tone,
          stats: customStats
        })
      });

      if (resObj.ok) {
        const newEp: Episode = await resObj.json();
        newEp.showType = showType as any;
        newEp.relatedTeamIds = ["usa", "mex"]; // general coverage

        // Save if user is logged in
        if (auth.currentUser) {
          try {
            await setDoc(doc(db, "episodes", newEp.id), {
              title: newEp.title,
              matchName: newEp.matchName,
              language: newEp.language,
              tone: newEp.tone,
              segments: newEp.segments,
              durationSeconds: newEp.durationSeconds,
              userId: auth.currentUser.uid,
              createdAt: new Date().toISOString(),
              showType: newEp.showType,
              relatedTeamIds: newEp.relatedTeamIds
            });
          } catch (dbErr) {
            console.warn("Soft persistence failing in cloud:", dbErr);
          }
        }

        setEpisodes((prev) => [newEp, ...prev]);
        setSelectedEpisode(newEp);
        setCurrentSegmentIndex(0);
        showNotification(`Production Complete: "${newEp.title}" is live!`, "success");
        setActiveTab("now");
      } else {
        throw new Error();
      }
    } catch (e) {
      showNotification("Writer failed. Falling back to sandbox templates.", "error");
    }
  };

  const handleSignInGoogle = async () => {
    try {
      showNotification("Connecting Google Sign-In...", "info");
      const res = await signInWithPopup(auth, googleAuthProvider);
      showNotification(`Welcome, ${res.user.displayName}! Access validated.`, "success");
    } catch (err: any) {
      showNotification(`Google Auth Failed: ${err.message}`, "error");
    }
  };

  const handleSignOutGoogle = async () => {
    try {
      await signOut(auth);
      showNotification("Signed out securely.", "success");
    } catch (err) {
      showNotification("Signed out error.", "error");
    }
  };

  // Original ROI calculations
  const calculateFinancials = () => {
    const totalChars = 3 * 180 * monthlyEpisodes;
    const ttsCost = Math.max(1, (totalChars / 1000) * 0.015);
    const hostCost = audienceReach < 100000 ? 25 : 520;
    const musicCost = audienceReach < 100000 ? 15 : 120;
    
    const totalCosts = ttsCost + hostCost + musicCost + 50;

    const streamsPerEp = audienceReach / (monthlyEpisodes || 1);
    const adRev = (streamsPerEp / 1000) * sponsorshipCpm * midrollSpots * monthlyEpisodes;
    const premiumRev = premiumSubscribers * subscriberFee;

    const grossRevenues = adRev + premiumRev + (audienceReach < 100000 ? 150 : 2200);
    const netProfits = grossRevenues - totalCosts;
    const margin = grossRevenues > 0 ? (netProfits / grossRevenues) * 100 : 0;

    return {
      totalCosts: Math.round(totalCosts),
      grossRevenues: Math.round(grossRevenues),
      netProfits: Math.round(netProfits),
      margin: Math.round(margin)
    };
  };

  const financials = calculateFinancials();

  return (
    <div className="min-h-screen bg-[#FDFEFE] text-black font-sans antialiased selection:bg-[#CCFF00] selection:text-black p-3 md:p-6 lg:p-8">
      
      {/* DOUBLE BORDER MODERN BRUTALIST FRAME */}
      <div className="mx-auto max-w-7xl min-h-[92vh] bg-[#F5F5F5] border-8 border-black flex flex-col justify-between overflow-hidden shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] relative">
        
        <div>
          {/* ACTION BANNER NOTIFICATIONS */}
          <AnimatePresence>
            {notification && (
              <motion.div
                initial={{ opacity: 0, y: -24 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -24 }}
                onClick={() => setNotification(null)}
                className={`fixed top-6 left-1/2 -translate-x-1/2 z-50 px-6 py-4 border-4 border-black font-black uppercase text-xs tracking-tight shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] cursor-pointer flex items-center space-x-3.5 ${
                  notification.type === "success"
                    ? "bg-[#CCFF00] text-black"
                    : notification.type === "error"
                    ? "bg-red-500 text-white"
                    : "bg-white text-black"
                }`}
              >
                <Zap className="h-5 w-5 shrink-0 animate-pulse stroke-[3px]" />
                <span>{notification.text}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* MAIN BRANDED BRUTALIST HEADER */}
          <header className="border-b-4 border-black bg-black text-white p-4 sticky top-0 z-40">
            <div className="flex flex-col lg:flex-row justify-between items-center gap-4">
              
              {/* BRAND */}
              <div className="flex items-center space-x-3.5">
                <div className="border-3 border-[#CCFF00] bg-black p-2.5 shadow-[3px_3px_0px_0px_rgba(204,255,0,0.6)]">
                  <Radio className="h-6 w-6 text-[#CCFF00] stroke-[2.5px]" />
                </div>
                <div className="text-left">
                  <span className="text-[9px] uppercase font-mono tracking-widest text-[#CCFF00] font-black block">
                    🏟️ World Cup MatchDay Audio // Continuous Playback
                  </span>
                  <h1 className="text-xl md:text-2xl font-black italic tracking-tighter uppercase leading-none mt-0.5">
                    MatchDay Radio // North America 2026
                  </h1>
                </div>
              </div>

              {/* TABS DIRECTORY */}
              <div className="flex flex-wrap items-center gap-2.5 justify-center">
                <nav className="flex flex-wrap gap-1.5 justify-center text-xs">
                  {[
                    { id: "now", label: "Now Playing Feed" },
                    { id: "shows", label: "Shows & Teams" },
                    { id: "live", label: "Live match room" },
                    { id: "my-feed", label: "My Feed config" },
                    { id: "more", label: "More & Legal" }
                  ].map((tab) => {
                    const isSelected = activeTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`px-3 py-2 border-2 border-black font-black uppercase text-[10px] tracking-tight hover:-translate-y-0.5 shadow-[2px_2px_0px_0px_rgba(204,255,0,0.3)] transition-all cursor-pointer ${
                          isSelected
                            ? "bg-[#CCFF00] text-black"
                            : "bg-white text-black hover:bg-neutral-100"
                        }`}
                      >
                        {tab.label}
                      </button>
                    );
                  })}
                </nav>

                {/* AUTH CONTROLS */}
                {checkingAuth ? (
                  <div className="text-[10px] font-mono text-neutral-400">Loading auth...</div>
                ) : user ? (
                  <div className="flex items-center bg-[#CCFF00] text-black p-1 text-[10px] border-2 border-black font-black uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                    <span className="px-2 truncate max-w-[80px]">{user.displayName || "User"}</span>
                    <button
                      onClick={handleSignOutGoogle}
                      className="px-2 py-1 bg-black text-white hover:bg-red-500 cursor-pointer transition-colors"
                    >
                      Out
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={handleSignInGoogle}
                    className="px-3 py-2 bg-white text-black text-[10px] font-black border-2 border-black hover:bg-black hover:text-[#CCFF00] cursor-pointer"
                  >
                    Google Login
                  </button>
                )}
              </div>

            </div>
          </header>

          {/* DYNAMIC SOUNDBOARD PANEL (Directly accessible as drawer on Now Playing or Shows) */}
          <div className="bg-white border-b-4 border-black px-6 py-4 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center space-x-4">
              <span className="text-[10px] font-mono uppercase font-black text-neutral-500">
                🔉 Direct Soundboard:
              </span>
              <button
                onClick={triggerGoalCheer}
                className="px-3.5 py-1.5 bg-black text-[#CCFF00] border-2 border-black font-bold uppercase text-[10px] hover:bg-neutral-800 transition-all cursor-pointer shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-0.5"
              >
                ⚽ Trigger goal roar!
              </button>

              {/* Dynamic Crowd Ambiance toggle */}
              <div className="flex items-center space-x-2 bg-neutral-100 border border-black p-1">
                <span className="font-bold text-[9px] uppercase px-1">Ambiance:</span>
                <button
                  onClick={() => {
                    if (isAmbianceOn) {
                      stopAmbiance();
                    } else {
                      startAmbiance();
                    }
                  }}
                  className={`px-2 py-0.5 text-[9px] border font-black uppercase ${
                    isAmbianceOn ? "bg-emerald-600 text-white border-transparent" : "bg-white text-black border-black"
                  }`}
                >
                  {isAmbianceOn ? "On" : "Off"}
                </button>
              </div>
            </div>

            {/* Stadium volume slider */}
            {isAmbianceOn && (
              <div className="flex items-center space-x-2">
                <span className="text-[9px] font-mono uppercase text-zinc-500">Swell Volume:</span>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={ambianceVolume}
                  onChange={(e) => handleAmbianceVolumeChange(Number(e.target.value))}
                  className="w-24 accent-[#CCFF00] h-1 border border-black outline-none"
                />
                <span className="font-mono text-[9px] font-bold text-black">{ambianceVolume}%</span>
              </div>
            )}
          </div>

          {/* TAB CONTENTS STAGE */}
          <main className="p-4 md:p-6 lg:p-8 flex-1 min-h-[56vh]">
            <AnimatePresence mode="wait">
              {activeTab === "now" && (
                <NowFeed
                  episodes={episodes}
                  selectedEpisode={selectedEpisode}
                  setSelectedEpisode={setSelectedEpisode}
                  currentSegmentIndex={currentSegmentIndex}
                  setCurrentSegmentIndex={setCurrentSegmentIndex}
                  isPlaying={isPlaying}
                  setIsPlaying={setIsPlaying}
                  handlePlayPause={handlePlayPause}
                  handleNextSegment={handleNextSegment}
                  handlePrevSegment={handlePrevSegment}
                  handleRestartEpisode={handleRestartEpisode}
                  ttsMode={ttsMode}
                  setTtsMode={setTtsMode}
                  synthesizing={synthesizing}
                  playbackSpeed={playbackSpeed}
                  setPlaybackSpeed={setPlaybackSpeed}
                  showNotification={showNotification}
                  userPrefs={userPrefs}
                  setUserPrefs={setUserPrefs}
                />
              )}

              {activeTab === "shows" && (
                <ShowsTab
                  episodes={episodes}
                  onPlayEpisode={(ep) => {
                    setSelectedEpisode(ep);
                    setCurrentSegmentIndex(0);
                    setIsPlaying(true);
                    setActiveTab("now");
                  }}
                  userPrefs={userPrefs}
                  onToggleFollowTeam={(teamId) => {
                    setUserPrefs((prev) => {
                      const isF = prev.followedTeamIds.includes(teamId);
                      const updated = isF
                        ? prev.followedTeamIds.filter((id) => id !== teamId)
                        : [...prev.followedTeamIds, teamId];
                      return { ...prev, followedTeamIds: updated };
                    });
                    showNotification("Follow status updated for dynamic feed scoring.", "success");
                  }}
                  fixtures={fixtures}
                  newsItems={newsItems}
                />
              )}

              {activeTab === "live" && (
                <LiveTab
                  fixtures={fixtures}
                  matchEvents={matchEvents}
                  episodes={episodes}
                  onPlayEpisode={(ep) => {
                    setSelectedEpisode(ep);
                    setCurrentSegmentIndex(0);
                    setIsPlaying(true);
                    setActiveTab("now");
                  }}
                  userPrefs={userPrefs}
                  showNotification={showNotification}
                />
              )}

              {activeTab === "my-feed" && (
                <MyFeedTab
                  userPrefs={userPrefs}
                  setUserPrefs={setUserPrefs}
                  episodes={episodes}
                  onPlayEpisode={(ep) => {
                    setSelectedEpisode(ep);
                    setCurrentSegmentIndex(0);
                    setIsPlaying(true);
                    setActiveTab("now");
                  }}
                  showNotification={showNotification}
                />
              )}

              {activeTab === "more" && (
                <div className="space-y-8">
                  <MoreTab
                    lowDataMode={lowDataMode}
                    setLowDataMode={setLowDataMode}
                    quietHours={quietHours}
                    setQuietHours={setQuietHours}
                    showNotification={showNotification}
                    onNavigateToAdmin={() => setActiveTab("admin")}
                  />

                  {/* NESTED ROI SCALING CALCULATOR (ORIGINAL AS ADVANCED PRESET TOOL) */}
                  <div className="bg-white border-4 border-black p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] text-left">
                    <span className="text-[9px] font-mono uppercase tracking-widest text-[#CCFF00] bg-black px-2 py-0.5 font-bold mb-1.5 inline-block">
                      // Original Advanced scaling tool variables
                    </span>
                    <h3 className="text-xl font-black uppercase tracking-tight italic border-b border-neutral-300 pb-3 mb-6">
                      Coaxial Business scaling ROI calculator
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-6 border-b border-neutral-200">
                      <div className="space-y-4">
                        <div>
                          <label className="flex justify-between text-xs font-bold uppercase text-neutral-600 mb-1">
                            <span>Episodes Per Month</span>
                            <span className="font-mono text-black">{monthlyEpisodes} eps</span>
                          </label>
                          <input
                            type="range"
                            min="5"
                            max="100"
                            value={monthlyEpisodes}
                            onChange={(e) => setMonthlyEpisodes(Number(e.target.value))}
                            className="w-full accent-black h-1 border border-black"
                          />
                        </div>

                        <div>
                          <label className="flex justify-between text-xs font-bold uppercase text-neutral-600 mb-1">
                            <span>Audience Monthly Downloads</span>
                            <span className="font-mono text-black">{audienceReach.toLocaleString()}</span>
                          </label>
                          <input
                            type="range"
                            min="1000"
                            max="500000"
                            step="1000"
                            value={audienceReach}
                            onChange={(e) => setAudienceReach(Number(e.target.value))}
                            className="w-full accent-black h-1 border border-black"
                          />
                        </div>

                        <div>
                          <label className="flex justify-between text-xs font-bold uppercase text-neutral-600 mb-1">
                            <span>Premium Subscribers base</span>
                            <span className="font-mono text-black">{premiumSubscribers.toLocaleString()} users</span>
                          </label>
                          <input
                            type="range"
                            min="10"
                            max="10000"
                            step="10"
                            value={premiumSubscribers}
                            onChange={(e) => setPremiumSubscribers(Number(e.target.value))}
                            className="w-full accent-black h-1 border border-black"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        {[
                          { label: "Sponsorship cpm fee", value: `$${sponsorshipCpm} /CPM` },
                          { label: "Sponsorship spots per ep", value: `${midrollSpots} Ad Roll` },
                          { label: "Calculated Gross System Costs", value: `$${financials.totalCosts}/mo` },
                          { label: "Calculated Gross Revenues", value: `$${financials.grossRevenues.toLocaleString()}/mo` },
                          { label: "Net Profit Margin ratio", value: `${financials.margin}%` },
                          { label: "Net Monthly profit projections", value: `$${financials.netProfits.toLocaleString()}/mo` },
                        ].map((item, idx) => (
                          <div key={idx} className="p-3 border-2 border-black bg-neutral-50">
                            <span className="text-[10px] text-neutral-500 font-bold uppercase block leading-tight">{item.label}</span>
                            <p className="text-sm font-black text-black mt-1 uppercase italic tracking-tight">{item.value}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "admin" && (
                <AdminTab
                  metrics={MOCK_METRICS}
                  episodes={episodes}
                  fixtures={fixtures}
                  newsItems={newsItems}
                  setNewsItems={setNewsItems}
                  sponsors={sponsors}
                  setSponsors={setSponsors}
                  onPauseWholeFeed={stopAllAudio}
                  feedKilled={feedKilled}
                  setFeedKilled={setFeedKilled}
                  onManualTriggerEp={handleManualTriggerEp}
                  showNotification={showNotification}
                  bannedTerms={bannedTerms}
                  setBannedTerms={setBannedTerms}
                />
              )}
            </AnimatePresence>
          </main>
        </div>

        {/* BRUTALIST ALIGNED FOOTER DESCRIPTOR */}
        <footer className="border-t-4 border-black bg-[#CCFF00] text-black text-xs font-bold uppercase p-4 text-center tracking-tight flex flex-col md:flex-row justify-between items-center gap-3">
          <span>MatchDay Radio Terminal // 2026 Men's Football tournament coverage</span>
          <span className="font-mono text-[10px] font-black tracking-widest text-[#000000]/60">// SECURE LOCAL HOST BIND: 3000</span>
        </footer>

      </div>
    </div>
  );
}
