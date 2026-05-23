"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useAppStore } from "@/store/appStore";
import { MATCHES, getNextMatch } from "@/data/matches";
import { Match, MatchEvent } from "@/types";
import {
  Radio, Trophy, Calendar, Sparkles, Plus, Play, Pause, RefreshCw,
  AlertTriangle, AlertCircle, ChevronRight, Bell, BellRing, ArrowRight,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const SIMULATED_EVENTS: Omit<MatchEvent, "minute">[] = [
  { type: "goal",   team: "Mexico",    player: "H. Lozano",       summary: "GOLAZO! Lozano equalizes with a flying header. It's level again!" },
  { type: "yellow", team: "Argentina", player: "L. Messi",        summary: "Messi booked for dissent after disputing a throw-in call. Rare card." },
  { type: "red",    team: "Mexico",    player: "J. Corona",       summary: "RED CARD! Corona receives a second yellow for a reckless foul. Mexico down to 10!" },
  { type: "goal",   team: "Argentina", player: "L. Messi",        summary: "MESSI MAGIC! He curls a free-kick into the top corner. Argentina lead!" },
  { type: "sub",    team: "Argentina", player: "Di María → Mac Allister", summary: "Mac Allister on for Di María as Scaloni looks to protect the lead." },
];

const EVENT_STYLES: Record<string, { border: string; bg: string; dot: string; icon: string; label: string }> = {
  goal:     { border: "rgba(204,255,0,0.3)",   bg: "rgba(204,255,0,0.06)",   dot: "#ccff00",  icon: "⚽", label: "Goal" },
  yellow:   { border: "rgba(251,191,36,0.3)",  bg: "rgba(251,191,36,0.06)",  dot: "#fbbf24",  icon: "🟨", label: "Yellow" },
  red:      { border: "rgba(255,59,48,0.3)",   bg: "rgba(255,59,48,0.06)",   dot: "#ff3b30",  icon: "🟥", label: "Red Card" },
  sub:      { border: "rgba(96,165,250,0.25)", bg: "rgba(96,165,250,0.05)",  dot: "#60a5fa",  icon: "🔄", label: "Sub" },
  halftime: { border: "rgba(167,139,250,0.22)",bg: "rgba(167,139,250,0.04)", dot: "#a78bfa",  icon: "⏱", label: "Half Time" },
  fulltime: { border: "rgba(255,255,255,0.12)",bg: "rgba(255,255,255,0.03)", dot: "#7a8a75",  icon: "🏁", label: "Full Time" },
  kickoff:  { border: "rgba(204,255,0,0.15)",  bg: "rgba(204,255,0,0.03)",   dot: "#ccff00",  icon: "🏟", label: "Kick Off" },
  var:      { border: "rgba(245,158,11,0.25)", bg: "rgba(245,158,11,0.05)",  dot: "#f59e0b",  icon: "📺", label: "VAR" },
};

function getEventStyle(type: string) {
  return EVENT_STYLES[type] ?? EVENT_STYLES.kickoff;
}

export default function LivePage() {
  const { selectedMatch, setSelectedMatch } = useAppStore();

  const [activeMatch, setActiveMatch] = useState<Match>(
    selectedMatch ?? MATCHES.find((m) => m.status === "live") ?? MATCHES[0]
  );
  const [timeline, setTimeline] = useState<MatchEvent[]>([...(activeMatch.events ?? [])].reverse());
  const [simMin,     setSimMin]     = useState<number>(parseInt(activeMatch.minute ?? "74") || 0);
  const [playing,    setPlaying]    = useState(true);
  const [pushOptIn,  setPushOptIn]  = useState(false);
  const simRef = useRef<NodeJS.Timeout | null>(null);

  const isLive    = activeMatch.status === "live";
  const nextMatch = getNextMatch(activeMatch.id);

  useEffect(() => {
    if (selectedMatch) {
      setActiveMatch(selectedMatch);
      setTimeline([...(selectedMatch.events ?? [])].reverse());
      setSimMin(parseInt(selectedMatch.minute ?? "0") || 0);
    }
  }, [selectedMatch]);

  useEffect(() => {
    if (playing && isLive) {
      simRef.current = setInterval(() => {
        setSimMin((p) => {
          if (p >= 90) { setPlaying(false); return 90; }
          return p + 1;
        });
      }, 5000);
    } else if (simRef.current) {
      clearInterval(simRef.current);
    }
    return () => { if (simRef.current) clearInterval(simRef.current); };
  }, [playing, isLive]);

  const triggerEvent = useCallback(() => {
    const min    = Math.min(simMin + Math.floor(Math.random() * 3) + 1, 90);
    setSimMin(min);
    const random = SIMULATED_EVENTS[Math.floor(Math.random() * SIMULATED_EVENTS.length)];
    setTimeline((prev) => [{ ...random, minute: String(min) }, ...prev]);
  }, [simMin]);

  const reset = useCallback(() => {
    setSimMin(74);
    setTimeline([...(activeMatch.events ?? [])].reverse());
    setPlaying(true);
  }, [activeMatch]);

  const handleMatchSelect = useCallback((m: Match) => {
    setSelectedMatch(m);
    setActiveMatch(m);
    setTimeline([...(m.events ?? [])].reverse());
    setSimMin(parseInt(m.minute ?? "0") || 0);
    setPlaying(m.status === "live");
  }, [setSelectedMatch]);

  // Progress bar (0-90)
  const progressPct = Math.min(100, Math.round((simMin / 90) * 100));

  return (
    <div className="page-enter pb-6">
      <div className="page-container pt-5 space-y-4">

        {/* ══ Live Score Header ══ */}
        <div
          className="relative rounded-3xl overflow-hidden"
          style={{
            padding: "22px 20px",
            background: isLive
              ? `linear-gradient(160deg, ${activeMatch.homeColor}22 0%, rgba(10,18,8,0.9) 45%, ${activeMatch.awayColor}18 100%), rgba(12,20,9,0.85)`
              : "rgba(12,20,9,0.75)",
            border: isLive ? "1px solid rgba(255,59,48,0.2)" : "1px solid rgba(255,255,255,0.065)",
            boxShadow: isLive ? "0 0 60px rgba(255,59,48,0.05)" : "0 20px 40px rgba(0,0,0,0.3)",
          }}
        >
          {/* Inner glass highlight */}
          <div
            className="absolute top-0 left-0 right-0 h-px"
            style={{ background: `linear-gradient(90deg, ${activeMatch.homeColor}44, rgba(255,255,255,0.06) 50%, ${activeMatch.awayColor}44)` }}
          />

          {/* League + status */}
          <div className="flex items-center justify-between mb-5">
            <span
              className="flex items-center gap-1.5 text-[10px] font-mono font-medium px-2.5 py-1 rounded-lg"
              style={{
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.07)",
                color: "#b0bfac",
              }}
            >
              <Trophy className="w-3.5 h-3.5" style={{ color: "#ccff00" }} />
              {activeMatch.league} · {activeMatch.tournament.replace("FIFA ", "")}
            </span>

            {isLive ? (
              <span
                className="neon-pulse-live flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-mono font-bold uppercase"
                style={{
                  background: "rgba(255,59,48,0.16)",
                  border: "1px solid rgba(255,59,48,0.32)",
                  color: "#ff5e54",
                }}
              >
                <Radio className="w-3.5 h-3.5 animate-live-dot" /> Live
              </span>
            ) : activeMatch.status === "finished" ? (
              <span className="chip chip-sage">Full Time</span>
            ) : (
              <span className="chip chip-amber">⏰ {activeMatch.time}</span>
            )}
          </div>

          {/* Score row */}
          <div className="flex items-center justify-between">
            {/* Home */}
            <div className="flex-1 flex flex-col items-center gap-2">
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl"
                style={{
                  background: `${activeMatch.homeColor}22`,
                  border: `1.5px solid ${activeMatch.homeColor}55`,
                  boxShadow: `0 0 18px ${activeMatch.homeColor}22`,
                }}
              >
                {activeMatch.homeFlag}
              </div>
              <div className="text-center">
                <p className="text-[13px] font-bold tracking-tight" style={{ color: "#f5f9f3" }}>
                  {activeMatch.homeTeam}
                </p>
                <p className="text-[9.5px] font-mono" style={{ color: "#7a8a75" }}>Home</p>
              </div>
            </div>

            {/* Score */}
            <div className="px-2 flex flex-col items-center gap-2">
              {activeMatch.status !== "upcoming" ? (
                <>
                  <div className="flex items-center gap-2">
                    <motion.span
                      key={activeMatch.scoreHome}
                      initial={{ scale: 1.4, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="text-[52px] font-mono font-extrabold leading-none"
                      style={{
                        color: "#f5f9f3",
                        textShadow: isLive ? `0 0 24px ${activeMatch.homeColor}44` : "none",
                      }}
                    >
                      {activeMatch.scoreHome}
                    </motion.span>
                    <span
                      className="text-2xl font-mono font-bold gradient-text-neon"
                    >
                      :
                    </span>
                    <motion.span
                      key={activeMatch.scoreAway}
                      initial={{ scale: 1.4, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="text-[52px] font-mono font-extrabold leading-none"
                      style={{
                        color: "#f5f9f3",
                        textShadow: isLive ? `0 0 24px ${activeMatch.awayColor}44` : "none",
                      }}
                    >
                      {activeMatch.scoreAway}
                    </motion.span>
                  </div>
                  {isLive && (
                    <div
                      className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-mono font-bold"
                      style={{
                        background: "rgba(5,9,3,0.9)",
                        border: "1px solid rgba(204,255,0,0.28)",
                        color: "#ccff00",
                        boxShadow: "0 0 10px rgba(204,255,0,0.12)",
                      }}
                    >
                      <span className="w-2 h-2 rounded-full animate-ping" style={{ background: "#ccff00" }} />
                      {simMin}′
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center space-y-1.5">
                  <div
                    className="px-5 py-2.5 rounded-xl text-sm font-mono font-bold"
                    style={{
                      background: "rgba(5,9,3,0.8)",
                      border: "1px solid rgba(255,255,255,0.07)",
                      color: "#f5f9f3",
                    }}
                  >
                    {activeMatch.time}
                  </div>
                  <p className="text-[10px] font-mono" style={{ color: "#f59e0b" }}>Pre-match</p>
                </div>
              )}
            </div>

            {/* Away */}
            <div className="flex-1 flex flex-col items-center gap-2">
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl"
                style={{
                  background: `${activeMatch.awayColor}22`,
                  border: `1.5px solid ${activeMatch.awayColor}55`,
                  boxShadow: `0 0 18px ${activeMatch.awayColor}22`,
                }}
              >
                {activeMatch.awayFlag}
              </div>
              <div className="text-center">
                <p className="text-[13px] font-bold tracking-tight" style={{ color: "#f5f9f3" }}>
                  {activeMatch.awayTeam}
                </p>
                <p className="text-[9.5px] font-mono" style={{ color: "#7a8a75" }}>Away</p>
              </div>
            </div>
          </div>

          {/* Progress bar (live only) */}
          {isLive && (
            <div className="mt-5">
              <div
                className="w-full h-1 rounded-full overflow-hidden"
                style={{ background: "rgba(255,255,255,0.07)" }}
              >
                <div
                  className="h-full rounded-full transition-all duration-1000"
                  style={{
                    width: `${progressPct}%`,
                    background: "linear-gradient(90deg, #ccff00, #a3e800)",
                    boxShadow: "0 0 8px rgba(204,255,0,0.5)",
                  }}
                />
              </div>
              <div className="flex justify-between mt-1 text-[8.5px] font-mono" style={{ color: "rgba(255,255,255,0.2)" }}>
                <span>0′</span><span>45′</span><span>90′</span>
              </div>
            </div>
          )}

          {/* Venue */}
          <div
            className="mt-4 pt-3 text-center text-[11px] font-mono"
            style={{ borderTop: "1px solid rgba(255,255,255,0.055)", color: "#7a8a75" }}
          >
            🏟️&nbsp;
            <span style={{ color: "#c5d0c1", fontWeight: 600 }}>{activeMatch.venueName}</span>
            <span className="ml-2">{activeMatch.venueCity}</span>
          </div>

          {/* One-tap push opt-in */}
          <motion.button
            type="button"
            whileTap={{ scale: 0.98 }}
            onClick={() => setPushOptIn(true)}
            className="mt-4 w-full flex items-center justify-center gap-2 py-3 rounded-2xl text-xs font-extrabold cursor-pointer transition-all"
            style={
              pushOptIn
                ? {
                    background: "rgba(204,255,0,0.12)",
                    border: "1px solid rgba(204,255,0,0.35)",
                    color: "#ccff00",
                    boxShadow: "0 0 16px rgba(204,255,0,0.12)",
                  }
                : {
                    background: "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    color: "#f5f9f3",
                  }
            }
          >
            {pushOptIn ? (
              <>
                <BellRing className="w-4 h-4" />
                Live push alerts on — goals &amp; cards incoming
              </>
            ) : (
              <>
                <Bell className="w-4 h-4" style={{ color: "#ccff00" }} />
                One-tap: enable live push alerts
              </>
            )}
          </motion.button>
        </div>

        {/* ══ Next match handoff (retention) ══ */}
        {nextMatch && (
          <motion.button
            type="button"
            whileTap={{ scale: 0.985 }}
            onClick={() => handleMatchSelect(nextMatch)}
            className="w-full text-left rounded-2xl p-4 flex items-center gap-3 cursor-pointer group"
            style={{
              background: "linear-gradient(120deg, rgba(204,255,0,0.1) 0%, rgba(10,18,8,0.85) 100%)",
              border: "1px solid rgba(204,255,0,0.28)",
              boxShadow: "0 0 28px rgba(204,255,0,0.06)",
            }}
          >
            <div
              className="flex-shrink-0 w-11 h-11 rounded-xl flex items-center justify-center"
              style={{ background: "rgba(204,255,0,0.12)", border: "1px solid rgba(204,255,0,0.3)" }}
            >
              <ArrowRight className="w-5 h-5" style={{ color: "#ccff00" }} />
            </div>
            <div className="flex-1 min-w-0">
              <span className="label-mono" style={{ color: "#ccff00" }}>
                Next Match Handoff
              </span>
              <p className="text-[13px] font-bold mt-0.5 truncate" style={{ color: "#f5f9f3" }}>
                {nextMatch.homeFlag} {nextMatch.homeTeam} vs {nextMatch.awayTeam} {nextMatch.awayFlag}
              </p>
              <p className="text-[10px] font-mono mt-0.5" style={{ color: "#7a8a75" }}>
                {nextMatch.venueCity} · {nextMatch.time}
                {nextMatch.status === "live" ? " · Live now" : ""}
              </p>
            </div>
            <ChevronRight
              className="w-5 h-5 flex-shrink-0 opacity-50 group-hover:opacity-100 transition-opacity"
              style={{ color: "#ccff00" }}
            />
          </motion.button>
        )}

        {/* ══ Simulator ══ */}
        {isLive && (
          <div
            className="rounded-2xl p-4"
            style={{ background: "rgba(10,18,8,0.55)", border: "1px solid rgba(255,255,255,0.06)" }}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="label-mono flex items-center gap-1.5">
                <Sparkles className="w-3 h-3" style={{ color: "#ccff00" }} />
                Interactive Demo
              </span>
              <span className="text-[9.5px] font-mono" style={{ color: "#7a8a75" }}>5 s = 1 match minute</span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setPlaying((p) => !p)}
                className="flex items-center gap-1.5 py-2 px-3.5 rounded-xl text-xs font-bold font-mono transition-all cursor-pointer"
                style={playing
                  ? { background: "rgba(245,158,11,0.12)", border: "1px solid rgba(245,158,11,0.3)", color: "#fbbf24" }
                  : { background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#b0bfac" }
                }
              >
                {playing
                  ? <><Pause  className="w-3.5 h-3.5 fill-current" /> Pause</>
                  : <><Play   className="w-3.5 h-3.5 fill-current" /> Resume</>}
              </button>
              <button
                onClick={triggerEvent}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-extrabold transition-all cursor-pointer"
                style={{
                  background: "#ccff00",
                  color: "#060b03",
                  boxShadow: "0 3px 12px rgba(204,255,0,0.25)",
                }}
              >
                <Plus className="w-4 h-4" /> Trigger Event
              </button>
              <button
                onClick={reset}
                className="w-10 h-10 flex items-center justify-center rounded-xl transition-colors cursor-pointer"
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", color: "#7a8a75" }}
                title="Reset"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ══ Timeline ══ */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <span className="label-mono">Match Timeline</span>
            <span
              className="chip chip-sage"
              style={{ fontSize: "8.5px" }}
            >
              {timeline.length} events
            </span>
          </div>

          {!isLive && activeMatch.status === "upcoming" ? (
            <div
              className="rounded-2xl py-10 px-6 text-center"
              style={{ background: "rgba(10,18,8,0.5)", border: "1px dashed rgba(255,255,255,0.1)" }}
            >
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-4"
                style={{ background: "rgba(204,255,0,0.08)", border: "1px solid rgba(204,255,0,0.2)" }}
              >
                <Calendar className="w-6 h-6" style={{ color: "#ccff00" }} />
              </div>
              <h4 className="text-xs font-bold uppercase mb-1" style={{ color: "#f5f9f3" }}>Timeline Not Active</h4>
              <p className="text-[11px] max-w-xs mx-auto leading-relaxed" style={{ color: "#7a8a75" }}>
                Kicks off at {activeMatch.time}. Check back for real-time updates.
              </p>
            </div>
          ) : (
            <div className="relative border-l ml-4 pl-5 space-y-3 pt-1" style={{ borderColor: "rgba(255,255,255,0.07)" }}>
              <AnimatePresence initial={false}>
                {timeline.map((evt, idx) => {
                  const s = getEventStyle(evt.type);
                  return (
                    <motion.div
                      key={`${evt.minute}-${idx}`}
                      initial={{ opacity: 0, x: -12, scale: 0.96 }}
                      animate={{ opacity: 1, x: 0, scale: 1 }}
                      transition={{ duration: 0.28, ease: [0.22,1,0.36,1], delay: idx < 3 ? idx * 0.04 : 0 }}
                      className="relative group"
                    >
                      {/* Minute node */}
                      <div
                        className="absolute -left-[33px] top-0 w-7 h-7 rounded-full flex items-center justify-center font-mono text-[9px] font-bold border-2"
                        style={{ background: "#060b03", borderColor: s.dot, color: s.dot }}
                      >
                        {evt.minute}
                      </div>

                      {/* Event card */}
                      <div
                        className="rounded-xl p-3.5 transition-transform group-hover:translate-x-0.5"
                        style={{
                          background: s.bg,
                          border: `1px solid ${s.border}`,
                          boxShadow: `inset 0 1px 0 rgba(255,255,255,0.03)`,
                        }}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm">{s.icon}</span>
                          <span className="chip" style={{ background: `${s.dot}18`, color: s.dot, border: `1px solid ${s.dot}33`, fontSize: "8px" }}>
                            {s.label}
                          </span>
                          {evt.type === "yellow" && <AlertTriangle className="w-3.5 h-3.5" style={{ color: "#fbbf24" }} />}
                          {evt.type === "red"    && <AlertCircle   className="w-3.5 h-3.5" style={{ color: "#ff3b30" }} />}
                        </div>
                        <p className="text-xs font-semibold" style={{ color: "#f5f9f3" }}>
                          {evt.player ?? (evt.type.charAt(0).toUpperCase() + evt.type.slice(1))}
                          {evt.team && (
                            <span className="ml-1.5 font-normal text-[10px]" style={{ color: "#7a8a75" }}>
                              ({evt.team})
                            </span>
                          )}
                        </p>
                        <p className="text-[11px] mt-1 leading-relaxed" style={{ color: "#9aaa93" }}>
                          {evt.summary}
                        </p>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </div>

        {/* ══ Next Match Handoff ══ */}
        {nextMatch && (
          <div>
            <div className="label-mono flex items-center gap-1.5 mb-3">🔜 Up Next — Handoff</div>
            <motion.button
              whileTap={{ scale: 0.985 }}
              onClick={() => handleMatchSelect(nextMatch)}
              className="w-full text-left rounded-2xl overflow-hidden cursor-pointer"
              style={{
                background: `linear-gradient(155deg, ${nextMatch.homeColor}20 0%, rgba(10,18,8,0.9) 50%, ${nextMatch.awayColor}16 100%)`,
                border: `1px solid ${nextMatch.homeColor}40`,
                boxShadow: "0 12px 32px rgba(0,0,0,0.4)",
              }}
            >
              <div className="h-0.5" style={{ background: `linear-gradient(90deg, ${nextMatch.homeColor}, #ccff00 50%, ${nextMatch.awayColor})` }} />
              <div className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="chip chip-amber">🗓 Next Fixture · {nextMatch.time}</span>
                  <span className="chip chip-sage">{nextMatch.league}</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <div className="flex flex-col items-center gap-2 flex-1">
                    <div className="w-14 h-14 rounded-xl flex items-center justify-center text-[28px]"
                      style={{ background: `${nextMatch.homeColor}22`, border: `1.5px solid ${nextMatch.homeColor}44` }}>
                      {nextMatch.homeFlag}
                    </div>
                    <span className="text-[12px] font-bold text-center" style={{ color: "#f5f9f3" }}>{nextMatch.homeTeam}</span>
                  </div>
                  <div className="flex flex-col items-center gap-1.5 px-2">
                    <span className="text-[11px] font-mono font-bold" style={{ color: "#7a8a75" }}>vs</span>
                    <div className="px-3 py-1 rounded-xl text-xs font-mono font-bold"
                      style={{ background: "rgba(5,9,3,0.8)", border: "1px solid rgba(255,255,255,0.07)", color: "#f5f9f3" }}>
                      {nextMatch.time}
                    </div>
                    <span className="text-[9.5px] font-mono" style={{ color: "#f59e0b" }}>Pre-match hubs open</span>
                  </div>
                  <div className="flex flex-col items-center gap-2 flex-1">
                    <div className="w-14 h-14 rounded-xl flex items-center justify-center text-[28px]"
                      style={{ background: `${nextMatch.awayColor}22`, border: `1.5px solid ${nextMatch.awayColor}44` }}>
                      {nextMatch.awayFlag}
                    </div>
                    <span className="text-[12px] font-bold text-center" style={{ color: "#f5f9f3" }}>{nextMatch.awayTeam}</span>
                  </div>
                </div>
                <div className="mt-4 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-extrabold"
                  style={{ background: "rgba(204,255,0,0.12)", border: "1px solid rgba(204,255,0,0.28)", color: "#ccff00" }}>
                  <ArrowRight className="w-4 h-4" />
                  Switch to this fixture — find venues now
                </div>
              </div>
            </motion.button>
          </div>
        )}

        {/* ══ All Fixtures ══ */}
        <div className="pt-1">
          <div className="label-mono flex items-center gap-1.5 mb-3">🗓 All Fixtures</div>
          <div className="space-y-2">
            {MATCHES.filter((m) => m.id !== activeMatch.id).map((match) => (
              <motion.button
                key={match.id}
                whileTap={{ scale: 0.985 }}
                onClick={() => handleMatchSelect(match)}
                className="w-full text-left rounded-2xl p-3.5 flex items-center justify-between transition-all cursor-pointer group"
                style={{ background: "rgba(10,18,8,0.55)", border: "1px solid rgba(255,255,255,0.055)" }}
              >
                <div className="flex-1 min-w-0">
                  <span className="label-mono">{match.league}</span>
                  <p className="text-[12.5px] font-bold mt-0.5" style={{ color: "#f5f9f3" }}>
                    {match.homeFlag} {match.homeTeam} vs {match.awayTeam} {match.awayFlag}
                  </p>
                  <p className="text-[10px] font-mono mt-0.5" style={{ color: "#7a8a75" }}>
                    {match.venueCity} · {match.time}
                    {match.status === "finished" && " · FT"}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {match.status === "finished" ? (
                    <span className="text-[11px] font-mono font-bold px-2.5 py-1.5 rounded-lg flex-shrink-0"
                      style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.07)", color: "#9aaa93" }}>
                      {match.scoreHome}–{match.scoreAway}
                    </span>
                  ) : match.status === "live" ? (
                    <span className="chip chip-live">Live</span>
                  ) : (
                    <span className="chip chip-sage">Hub 🏟</span>
                  )}
                  <ChevronRight className="w-4 h-4 opacity-30 group-hover:opacity-60 transition-opacity" style={{ color: "#ccff00" }} />
                </div>
              </motion.button>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
