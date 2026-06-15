import React, { useState } from "react";
import {
  Settings,
  ShieldAlert,
  HelpCircle,
  Play,
  Moon,
  Database,
  Lock,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  Award
} from "lucide-react";

interface MoreTabProps {
  lowDataMode: boolean;
  setLowDataMode: (mode: boolean) => void;
  quietHours: boolean;
  setQuietHours: (hours: boolean) => void;
  showNotification: (text: string, type: "success" | "info" | "error") => void;
  onNavigateToAdmin: () => void;
}

export default function MoreTab({
  lowDataMode,
  setLowDataMode,
  quietHours,
  setQuietHours,
  showNotification,
  onNavigateToAdmin,
}: MoreTabProps) {
  const [supportName, setSupportName] = useState("");
  const [supportMsg, setSupportMsg] = useState("");

  const handleSendTicket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!supportName || !supportMsg) {
      showNotification("Please set both ticket fields.", "error");
      return;
    }
    showNotification("🎟️ Support Ticket Submitted successfully. Team will respond within 4 hrs.", "success");
    setSupportName("");
    setSupportMsg("");
  };

  return (
    <div className="space-y-8 animate-fade-in text-black text-left">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Side: Dynamic settings parameters */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-white border-4 border border-black p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
            <span className="text-[9px] font-mono uppercase tracking-widest text-neutral-400 font-bold block mb-1">
              // Control Terminal Preset
            </span>
            <h2 className="text-xl font-black uppercase tracking-tight italic border-b border-neutral-300 pb-3 mb-6">
              Streaming & Playback Settings
            </h2>

            <div className="space-y-4">
              {/* Low Data Mode */}
              <div className="p-4 border-2 border-black bg-neutral-50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-xs font-bold uppercase text-neutral-850">
                <div>
                  <h4 className="font-extrabold flex items-center">
                    <Database className="h-4.5 w-4.5 mr-1.5" />
                    Activate Low Data Audio Encoding
                  </h4>
                  <p className="text-[10px] text-zinc-500 leading-normal font-semibold font-mono mt-0.5 normal-case">
                    Reduces bitrate resolution to conserve mobile data quotas (ideal for highway commuting).
                  </p>
                </div>
                <button
                  onClick={() => {
                    setLowDataMode(!lowDataMode);
                    showNotification(
                      !lowDataMode 
                        ? "Bitrate throttled down to efficient 48kbps. Listening data conserved." 
                        : "High fidelity audio encoding restored (128kbps stereo streams).",
                      "info"
                    );
                  }}
                  className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer border border-black transition-colors duration-200 outline-none ${
                    lowDataMode ? "bg-[#CCFF00]" : "bg-neutral-300"
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-4 w-4 transform bg-white transition duration-200 ${
                      lowDataMode ? "translate-x-4" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>

              {/* Quiet Hours Block */}
              <div className="p-4 border-2 border-black bg-neutral-50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-xs font-bold uppercase text-neutral-850">
                <div>
                  <h4 className="font-extrabold flex items-center">
                    <Moon className="h-4.5 w-4.5 mr-1.5" />
                    Scheduled Sleep / Quiet Hours block
                  </h4>
                  <p className="text-[10px] text-zinc-500 leading-normal font-semibold font-mono mt-0.5 normal-case">
                    Suspends audible goal interrupts and alarms between 22:00 and 07:00 local time.
                  </p>
                </div>
                <button
                  onClick={() => {
                    setQuietHours(!quietHours);
                    showNotification(
                      !quietHours 
                        ? "Do Not Disturb active. Goal alarms will be pushed silently." 
                        : "Do Not Disturb disabled. Bulletins will audit in real-time.",
                      "info"
                    );
                  }}
                  className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer border border-black transition-colors duration-200 outline-none ${
                    quietHours ? "bg-[#CCFF00]" : "bg-neutral-300"
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-4 w-4 transform bg-white transition duration-200 ${
                      quietHours ? "translate-x-4" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* Legal disclaimers matrix */}
          <div className="bg-white border-4 border border-black p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
            <span className="text-[9px] font-mono uppercase tracking-widest text-[#CCFF00] bg-black px-2 py-0.5 font-bold mb-1.5 inline-block">
              // Compliance & Legal Disclosures Matrix
            </span>
            <h2 className="text-xl font-black uppercase tracking-tight italic border-b border-neutral-300 pb-3 mb-4 flex items-center space-x-2">
              <ShieldAlert className="h-5 w-5 text-black stroke-[2.5px] " />
              <span>Hard Rules of Journalistic Broadcasting</span>
            </h2>

            <div className="space-y-4 text-xs text-neutral-700 leading-relaxed font-semibold">
              <div className="border-l-3 border-[#CCFF00] pl-3">
                <h4 className="font-extrabold text-black uppercase mb-1">1. Descriptive Fair Use & Affiliation Bounds</h4>
                <p>
                  This dynamic radio audio application holds <strong>no official affiliation</strong> with FIFA, the FIFA World Cup, or tournament organizers. All tournament mentions are purely descriptive commentary and journalistic critiques. Every match review and preview complies with Fair Use regulations in North America.
                </p>
              </div>

              <div className="border-l-3 border-[#CCFF00] pl-3">
                <h4 className="font-extrabold text-black uppercase mb-1">2. Spoken and Written Betting Guidelines</h4>
                <p>
                  All sports prediction segments, odds references, and statistical break-downs are developed strictly for analytical entertainment. Every audio broadcast ends with a clear disclaimer stating: <em>"Predictions are for entertainment only; this is not betting advice."</em> Please gamble responsibly.
                </p>
              </div>

              <div className="border-l-3 border-[#CCFF00] pl-3">
                <h4 className="font-extrabold text-black uppercase mb-1">3. Licensed Royalty-Free Music Beds</h4>
                <p>
                  We are strictly committed to copyright compliance. This app uses <strong>solely licensed</strong> audio stingers, intro beds, and background crowd simulation generators. No raw direct broadcasting commentators, commentary clips, or Stadium feeds are rebroadcast from television networks.
                </p>
              </div>

              <div className="border-l-3 border-[#CCFF00] pl-3">
                <h4 className="font-extrabold text-black uppercase mb-1">4. Data Deletion (GDPR/DPDP) & Child Safety</h4>
                <p>
                  We collect no Personally Identifiable Information except registered email, when upgraded. Standard client state is isolated anonymously on device. You can clear and destroy all local history references using Settings anytime. Content contains zero profanity.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Admin Portal Gate & Support ticket submissions */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* SECURE ADMIN GATE */}
          <div className="bg-white border-4 border-black p-5 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] text-center">
            <span className="text-[10px] font-mono tracking-widest text-red-500 font-extrabold uppercase animate-pulse block mb-1">
              // Restricted Operator Portal
            </span>
            <div className="p-3 border-2 border-black bg-neutral-50 inline-block mb-3.5">
              <Lock className="h-6 w-6 text-black" />
            </div>
            <h3 className="font-black text-black text-sm uppercase tracking-wider mb-2">
              Operator Hub Console
            </h3>
            <p className="text-[10px] text-zinc-650 font-bold leading-normal uppercase mb-5">
              Dedicated admin workstation to inspect live streams metrics, manually queue dynamic scripts generator, and trigger the entire feed system kill switch.
            </p>

            <button
              onClick={onNavigateToAdmin}
              className="w-full py-3 bg-red-500 text-white font-black uppercase text-xs shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] cursor-pointer hover:bg-black hover:text-[#CCFF00] hover:shadow-[3px_3px_0px_0px_rgba(204,255,0,0.4)] active:translate-y-0.5 transition-all flex items-center justify-center space-x-1"
            >
              <span>Access Operator Hub</span>
              <ChevronRight className="h-4.5 w-4.5" />
            </button>
          </div>

          {/* Support desk form */}
          <div className="bg-white border-4 border-black p-5 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
            <h3 className="font-black text-xs uppercase border-b-2 border-black pb-3.5 mb-4 flex items-center justify-between">
              <span>🎟️ Broadcasting Ticket Desk</span>
              <span className="text-[9px] font-mono text-neutral-500 font-semibold">// SUPPORT</span>
            </h3>

            <form onSubmit={handleSendTicket} className="space-y-4">
              <div>
                <label className="block text-[10px] font-mono uppercase font-black text-neutral-500 mb-1">
                  Full Name / Callsign
                </label>
                <input
                  type="text"
                  value={supportName}
                  onChange={(e) => setSupportName(e.target.value)}
                  placeholder="Mike Broadcaster"
                  className="w-full bg-[#F0F0F0] border-2 border-black p-2 text-xs font-black uppercase outline-none focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono uppercase font-black text-neutral-500 mb-1">
                  Message Description
                </label>
                <textarea
                  value={supportMsg}
                  onChange={(e) => setSupportMsg(e.target.value)}
                  placeholder="Inquire or note feedback..."
                  rows={3}
                  className="w-full bg-[#F0F0F0] border-2 border-black p-2 text-xs font-black uppercase outline-none focus:bg-white resize-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-black text-[#CCFF00] font-black uppercase text-xs shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] cursor-pointer"
              >
                Submit Ticket
              </button>
            </form>
          </div>

        </div>

      </div>
    </div>
  );
}
