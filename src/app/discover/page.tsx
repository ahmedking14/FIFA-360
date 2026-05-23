"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/store/appStore";
import { MATCHES } from "@/data/matches";
import { getVenuesForMatch } from "@/data/venues";
import { Venue, Match } from "@/types";
import {
  Search, Compass, ShieldCheck, MapPin, Users, Flame,
  Star, AlertTriangle, ChevronDown, Clock, Zap, PhoneCall,
  CheckCircle2, Loader2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

type Filter = "All" | "Verified Only" | "Near Me";
type RsvpStatus = "idle" | "calling" | "confirmed" | "full";

const FILTER_COLORS: Record<Filter, { text: string; bg: string; border: string }> = {
  "All":          { text: "#ccff00",  bg: "rgba(204,255,0,0.12)",   border: "rgba(204,255,0,0.3)" },
  "Verified Only":{ text: "#60a5fa",  bg: "rgba(96,165,250,0.1)",   border: "rgba(96,165,250,0.28)" },
  "Near Me":      { text: "#f59e0b",  bg: "rgba(245,158,11,0.1)",   border: "rgba(245,158,11,0.28)" },
};

function RSVPCaller({ matchName }: { matchName: string }) {
  const [statuses, setStatuses] = useState<Record<string, RsvpStatus>>({});
  const venues = getVenuesForMatch(
    MATCHES.find((m) => m.status === "live")?.id ?? MATCHES[0].id
  ).slice(0, 3);

  const handleRSVP = (id: string) => {
    if (statuses[id]) return;
    setStatuses((p) => ({ ...p, [id]: "calling" }));
    setTimeout(() => {
      setStatuses((p) => ({
        ...p,
        [id]: Math.random() > 0.25 ? "confirmed" : "full",
      }));
    }, 1800 + Math.random() * 800);
  };

  const allDone = venues.length > 0 && venues.every((v) => statuses[v.id] === "confirmed" || statuses[v.id] === "full");

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{
        background: "linear-gradient(160deg, rgba(204,255,0,0.06) 0%, rgba(10,18,8,0.88) 100%)",
        border: "1px solid rgba(204,255,0,0.2)",
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.05)",
      }}
    >
      {/* Header */}
      <div
        className="px-4 pt-4 pb-3 flex items-center justify-between gap-3"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{
              background: "rgba(204,255,0,0.12)",
              border: "1px solid rgba(204,255,0,0.3)",
              boxShadow: "0 0 12px rgba(204,255,0,0.1)",
            }}
          >
            <PhoneCall className="w-4.5 h-4.5" style={{ color: "#ccff00", width: 18, height: 18 }} />
          </div>
          <div>
            <p className="text-[13px] font-extrabold leading-tight" style={{ color: "#f5f9f3" }}>
              RSVP Caller
            </p>
            <p className="text-[10px] font-mono mt-0.5" style={{ color: "#7a8a75" }}>
              Live availability check · {matchName}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          {allDone ? (
            <span className="chip chip-green">
              <CheckCircle2 className="w-3 h-3" />
              Done
            </span>
          ) : (
            <span className="chip chip-neon">
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: "#ccff00", animation: "live-pulse 1.4s infinite" }} />
              Lines Open
            </span>
          )}
        </div>
      </div>

      {/* Venue RSVP rows */}
      <div className="p-3 space-y-2">
        {venues.map((v, i) => {
          const status = statuses[v.id] ?? "idle";
          return (
            <motion.div
              key={v.id}
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.08 }}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl"
              style={{
                background: status === "confirmed"
                  ? "rgba(204,255,0,0.06)"
                  : status === "full"
                  ? "rgba(255,59,48,0.05)"
                  : "rgba(255,255,255,0.03)",
                border: status === "confirmed"
                  ? "1px solid rgba(204,255,0,0.18)"
                  : status === "full"
                  ? "1px solid rgba(255,59,48,0.18)"
                  : "1px solid rgba(255,255,255,0.05)",
              }}
            >
              {/* Rank */}
              <div className="rank-badge flex-shrink-0">#{i + 1}</div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-[12px] font-bold truncate" style={{ color: "#f5f9f3" }}>{v.name}</p>
                <p className="text-[9.5px] font-mono mt-0.5" style={{ color: "#7a8a75" }}>
                  {v.density} density · {v.departureCountdown}m away
                </p>
              </div>

              {/* Status / CTA */}
              <div className="flex-shrink-0">
                {status === "idle" && (
                  <button
                    onClick={() => handleRSVP(v.id)}
                    className="chip chip-neon cursor-pointer"
                    style={{ padding: "5px 12px", fontSize: "9.5px" }}
                  >
                    RSVP
                  </button>
                )}
                {status === "calling" && (
                  <span className="chip chip-amber">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    Calling…
                  </span>
                )}
                {status === "confirmed" && (
                  <span className="chip chip-green">
                    <CheckCircle2 className="w-3 h-3" />
                    Confirmed
                  </span>
                )}
                {status === "full" && (
                  <span className="chip chip-live">Fully Booked</span>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

export default function DiscoverPage() {
  const router = useRouter();
  const { selectedMatch, setSelectedMatch, setSelectedVenue } = useAppStore();

  const [query,      setQuery]      = useState("");
  const [filter,     setFilter]     = useState<Filter>("All");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [loading,    setLoading]    = useState(false);

  const activeMatch = selectedMatch ?? MATCHES.find((m) => m.status === "live") ?? MATCHES[0];
  const venues = getVenuesForMatch(activeMatch.id);

  const filtered = venues.filter((v) => {
    const q = query.toLowerCase();
    const hit =
      v.name.toLowerCase().includes(q) ||
      v.address.toLowerCase().includes(q) ||
      v.affiliation.toLowerCase().includes(q);
    if (filter === "Verified Only") return hit && v.trustLevel !== "community";
    if (filter === "Near Me")       return hit && (v.distanceKm ?? 99) <= 1.5;
    return hit;
  });

  useEffect(() => {
    setLoading(true);
    setExpandedId(null);
    const t = setTimeout(() => setLoading(false), 650);
    return () => clearTimeout(t);
  }, [activeMatch.id]);

  const handleMatchSelect = useCallback((m: Match) => {
    setSelectedMatch(m);
    setSelectedVenue(null);
  }, [setSelectedMatch, setSelectedVenue]);

  const handleVenueRoute = useCallback((v: Venue, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedVenue(v);
    router.push("/route");
  }, [setSelectedVenue, router]);

  const densityColor = (d: string) => {
    if (d === "Packed")  return "#ff3b30";
    if (d === "High")    return "#f59e0b";
    if (d === "Medium")  return "#ccff00";
    return "#7a8a75";
  };

  const densityPct = (d: string) => ({ "Packed": 96, "High": 78, "Medium": 55, "Low": 32 }[d] ?? 50);

  return (
    <div className="page-enter pb-6">
      <div className="page-container pt-5 space-y-5">

        {/* ══ RSVP Caller — Signature Feature ══ */}
        <RSVPCaller
          key={activeMatch.id}
          matchName={`${activeMatch.homeTeam} vs ${activeMatch.awayTeam}`}
        />

        {/* ══ Section header ══ */}
        <div className="flex items-center justify-between">
          <div className="label-mono flex items-center gap-1.5">
            <Compass className="w-3 h-3" style={{ color: "#ccff00" }} />
            Select Fixture
          </div>
          <span className="chip chip-neon">
            {MATCHES.filter((m) => m.status === "live").length > 0 ? "⚡ Live Now" : `${MATCHES.length} Fixtures`}
          </span>
        </div>

        {/* ══ Match Picker ══ */}
        <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
          {MATCHES.map((match, i) => {
            const isSel = activeMatch.id === match.id;
            return (
              <motion.button
                key={match.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => handleMatchSelect(match)}
                className="relative flex-shrink-0 w-64 rounded-2xl text-left cursor-pointer select-none overflow-hidden"
                style={{
                  padding: "14px 16px",
                  background: isSel
                    ? `linear-gradient(160deg, ${match.homeColor}18 0%, ${match.awayColor}12 100%), rgba(20,32,16,0.9)`
                    : "rgba(10,18,8,0.65)",
                  border: isSel
                    ? "1px solid rgba(204,255,0,0.35)"
                    : "1px solid rgba(255,255,255,0.055)",
                  boxShadow: isSel ? "0 10px 28px rgba(0,0,0,0.45)" : "none",
                }}
              >
                {/* Top gradient accent */}
                {isSel && (
                  <div
                    className="absolute top-0 left-0 right-0 h-0.5"
                    style={{
                      background: `linear-gradient(90deg, ${match.homeColor}, #ccff00 50%, ${match.awayColor})`,
                      opacity: 0.85,
                    }}
                  />
                )}

                {/* League + status */}
                <div className="flex items-center justify-between mb-3">
                  <span className="chip chip-sage" style={{ fontSize: "8.5px" }}>{match.league}</span>
                  {match.status === "live" ? (
                    <span className="chip chip-live">
                      <span className="w-1.5 h-1.5 rounded-full" style={{ background: "#ff3b30", animation: "live-pulse 1.4s infinite" }} />
                      {match.minute}′
                    </span>
                  ) : match.status === "finished" ? (
                    <span className="chip chip-sage">FT</span>
                  ) : (
                    <span className="chip chip-amber">
                      <Clock className="w-2.5 h-2.5" /> {match.time}
                    </span>
                  )}
                </div>

                {/* Teams */}
                <div className="space-y-2">
                  {([
                    { team: match.homeTeam, flag: match.homeFlag, color: match.homeColor, score: match.scoreHome },
                    { team: match.awayTeam, flag: match.awayFlag, color: match.awayColor, score: match.scoreAway },
                  ] as const).map(({ team, flag, color, score }, ti) => (
                    <div key={ti} className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-[18px] leading-none flex-shrink-0">{flag}</span>
                        <span className="text-[13px] font-semibold truncate" style={{ color: isSel ? "#f5f9f3" : "#9aaa93" }}>
                          {team}
                        </span>
                      </div>
                      {match.status !== "upcoming" && (
                        <span className="text-sm font-mono font-extrabold flex-shrink-0" style={{ color: isSel ? color || "#f5f9f3" : "#9aaa93" }}>
                          {score}
                        </span>
                      )}
                    </div>
                  ))}
                </div>

                {/* Footer */}
                <div
                  className="flex items-center justify-between mt-3 pt-2.5 text-[9px] font-mono"
                  style={{ borderTop: "1px solid rgba(255,255,255,0.05)", color: "#7a8a75" }}
                >
                  <span>📍 {match.venueCity}</span>
                  <span style={{ color: isSel ? "#ccff00" : "#7a8a75" }}>{match.tournament.replace("FIFA ", "")}</span>
                </div>
              </motion.button>
            );
          })}
        </div>

        {/* ══ Search + Filters ══ */}
        <div
          className="rounded-2xl p-4 space-y-3"
          style={{ background: "rgba(10,18,8,0.55)", border: "1px solid rgba(255,255,255,0.05)" }}
        >
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "#7a8a75" }} />
            <input
              type="text"
              placeholder="Search venues, areas, affiliations…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full py-2.5 pl-9 pr-4 rounded-xl text-xs outline-none transition-all"
              style={{
                background: "rgba(5,9,3,0.8)",
                border: "1px solid rgba(255,255,255,0.07)",
                color: "#f5f9f3",
                fontFamily: "var(--font-sans)",
              }}
              onFocus={(e) => (e.target.style.borderColor = "rgba(204,255,0,0.4)")}
              onBlur={(e)  => (e.target.style.borderColor = "rgba(255,255,255,0.07)")}
            />
          </div>
          <div className="flex gap-2 overflow-x-auto no-scrollbar">
            {(["All", "Verified Only", "Near Me"] as Filter[]).map((f) => {
              const col    = FILTER_COLORS[f];
              const active = filter === f;
              return (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className="flex-shrink-0 px-3.5 py-1.5 rounded-full text-[10px] font-semibold transition-all cursor-pointer select-none"
                  style={active ? {
                    background: col.bg, color: col.text, border: `1px solid ${col.border}`,
                  } : {
                    background: "rgba(20,32,16,0.7)", color: "#7a8a75",
                    border: "1px solid rgba(255,255,255,0.06)",
                  }}
                >
                  {f}
                </button>
              );
            })}
          </div>
        </div>

        {/* ══ Verified Venue Ranking header ══ */}
        <div id="venue_list_anchor" className="flex items-center justify-between scroll-mt-24">
          <div className="flex items-center gap-2">
            <span className="label-mono">Verified Venue Ranking</span>
            <span className="chip chip-blue" style={{ fontSize: "8px" }}>{filtered.length} hubs</span>
          </div>
          <div className="flex items-center gap-1 text-[9.5px] font-mono" style={{ color: "#7a8a75" }}>
            <Flame className="w-3 h-3" style={{ color: "#f59e0b" }} />
            By Atmosphere
          </div>
        </div>

        {/* ══ Skeleton ══ */}
        {loading ? (
          <div className="space-y-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="rounded-2xl animate-shimmer" style={{ height: 110, border: "1px solid rgba(255,255,255,0.05)" }} />
            ))}
          </div>

        ) : filtered.length === 0 ? (
          <div
            className="rounded-2xl py-12 px-6 text-center flex flex-col items-center"
            style={{ background: "rgba(10,18,8,0.5)", border: "1px dashed rgba(255,255,255,0.1)" }}
          >
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4" style={{ background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.25)" }}>
              <AlertTriangle className="w-6 h-6" style={{ color: "#f59e0b" }} />
            </div>
            <h4 className="text-sm font-bold mb-1.5" style={{ color: "#f5f9f3" }}>No venues found</h4>
            <p className="text-xs max-w-xs leading-relaxed" style={{ color: "#7a8a75" }}>
              No supporter lounges match&nbsp;<em>&ldquo;{query}&rdquo;</em>&nbsp;for this fixture.
            </p>
            <button
              onClick={() => { setQuery(""); setFilter("All"); }}
              className="mt-5 chip chip-neon cursor-pointer"
              style={{ padding: "6px 16px", borderRadius: "9999px" }}
            >
              Reset Search
            </button>
          </div>

        ) : (
          <div className="space-y-3">
            {filtered.map((venue, idx) => {
              const isOpen = expandedId === venue.id;
              const dc     = densityColor(venue.density);
              const dPct   = densityPct(venue.density);

              return (
                <motion.div
                  key={venue.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05, duration: 0.3, ease: [0.22,1,0.36,1] }}
                  onClick={() => setExpandedId(isOpen ? null : venue.id)}
                  className="rounded-2xl cursor-pointer overflow-hidden relative"
                  style={{
                    background: isOpen ? "rgba(20,32,16,0.88)" : "rgba(10,18,8,0.6)",
                    border: isOpen ? "1px solid rgba(204,255,0,0.28)" : "1px solid rgba(255,255,255,0.048)",
                    boxShadow: isOpen ? "0 14px 36px rgba(0,0,0,0.5)" : "none",
                    transition: "background 0.22s, border-color 0.22s",
                  }}
                >
                  {/* Density accent bar */}
                  <div
                    className="absolute left-0 top-0 bottom-0 w-0.5 rounded-l-2xl"
                    style={{ background: `linear-gradient(to bottom, ${dc}, ${dc}44)` }}
                  />

                  <div className="p-4 pl-5">
                    {/* Card header */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1.5">
                          <div className="rank-badge">#{idx + 1}</div>
                          <h4 className="text-[13.5px] font-bold leading-tight truncate" style={{ color: "#f5f9f3" }}>
                            {venue.name}
                          </h4>
                          {venue.trustLevel !== "community" && (
                            <ShieldCheck className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "#60a5fa" }} aria-label="Verified" />
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] font-mono" style={{ color: "#7a8a75" }}>
                          <span className="flex items-center gap-1">
                            <MapPin className="w-2.5 h-2.5" style={{ color: "#ccff00" }} />
                            {venue.distanceKm} km
                          </span>
                          <span className="flex items-center gap-1">
                            <Users className="w-2.5 h-2.5" style={{ color: "#ccff00" }} />
                            {venue.density}
                          </span>
                          <span className="px-1.5 py-0.5 rounded-md text-[9.5px]" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.07)", color: "#9aaa93" }}>
                            {venue.affiliation}
                          </span>
                        </div>
                      </div>

                      {/* Atmosphere badge + bar */}
                      <div className="flex flex-col items-end gap-1 flex-shrink-0">
                        <div
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-[12px] font-mono font-bold"
                          style={{ background: `${dc}18`, border: `1px solid ${dc}44`, color: dc }}
                        >
                          <Flame className="w-3.5 h-3.5" />
                          {venue.confidence}%
                        </div>
                        <div className="w-12 h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.07)" }}>
                          <div className="h-full rounded-full" style={{ width: `${dPct}%`, background: `linear-gradient(90deg, ${dc}88, ${dc})` }} />
                        </div>
                      </div>
                    </div>

                    {/* Stars + route time */}
                    <div className="flex items-center gap-2 mt-2.5 text-[10px] font-mono" style={{ color: "#7a8a75" }}>
                      <div className="flex" style={{ color: "#fbbf24" }}>
                        {[1,2,3,4,5].map((s) => <Star key={s} className="w-3 h-3 fill-current" />)}
                      </div>
                      <span style={{ color: "#c5d0c1" }}>{venue.rating}</span>
                      <span>·</span>
                      <span>{venue.routeTime}</span>
                    </div>

                    {/* Collapsed: RSVP concierge teaser */}
                    {!isOpen && (
                      <div
                        className="mt-2.5 px-3 py-2 rounded-xl flex items-start gap-2"
                        style={{ background: "rgba(204,255,0,0.04)", border: "1px solid rgba(204,255,0,0.1)" }}
                      >
                        <span className="flex-shrink-0 text-[9px] font-mono font-bold px-1.5 py-0.5 rounded" style={{ background: "rgba(204,255,0,0.12)", color: "#ccff00" }}>
                          RSVP
                        </span>
                        <p className="text-[11px] leading-relaxed line-clamp-1" style={{ color: "#9aaa93" }}>
                          {venue.conciergeInsight}
                        </p>
                      </div>
                    )}

                    {/* Expand chevron */}
                    <ChevronDown
                      className="absolute top-4 right-4 w-4 h-4 transition-transform duration-200"
                      style={{ color: "rgba(255,255,255,0.2)", transform: isOpen ? "rotate(180deg)" : "rotate(0deg)" }}
                    />

                    {/* ─ Expanded concierge panel ─ */}
                    <AnimatePresence>
                      {isOpen && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.28, ease: [0.22,1,0.36,1] }}
                          className="overflow-hidden"
                        >
                          <div className="mt-4 pt-4 space-y-4" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                            {/* RSVP Concierge box */}
                            <div
                              className="rounded-xl p-3.5 flex gap-3"
                              style={{
                                background: "rgba(5,9,3,0.75)",
                                border: "1px solid rgba(204,255,0,0.16)",
                                boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04)",
                              }}
                            >
                              <div
                                className="flex-shrink-0 flex items-center justify-center rounded-lg text-[9px] font-mono font-extrabold"
                                style={{ width: 30, height: 30, background: "rgba(204,255,0,0.1)", border: "1px solid rgba(204,255,0,0.3)", color: "#ccff00", letterSpacing: "0.05em" }}
                              >
                                MC
                              </div>
                              <div className="flex-1">
                                <span className="block text-[9.5px] font-mono font-bold uppercase mb-1" style={{ color: "#ccff00", letterSpacing: "0.15em" }}>
                                  Concierge Intelligence
                                </span>
                                <p className="text-xs leading-relaxed" style={{ color: "#d8e8d4" }}>{venue.conciergeInsight}</p>
                              </div>
                            </div>

                            {/* Insights */}
                            <div className="space-y-2.5">
                              <span className="block text-[9.5px] font-mono font-bold uppercase" style={{ color: "#f59e0b", letterSpacing: "0.15em" }}>⚡ Atmosphere & Amenities</span>
                              <ul className="space-y-2">
                                {venue.insights.map((insight, i) => (
                                  <li key={i} className="flex items-start gap-2.5 text-[11.5px] leading-relaxed" style={{ color: "#b0bfac" }}>
                                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: "#ccff00", boxShadow: "0 0 4px #ccff0066" }} />
                                    {insight}
                                  </li>
                                ))}
                              </ul>
                            </div>

                            {/* Density timeline */}
                            <div className="space-y-2">
                              <div className="flex justify-between text-[9px] font-mono uppercase" style={{ color: "#7a8a75" }}>
                                <span>Crowd Density Timeline</span>
                                <span style={{ color: dc }}>{venue.density} Peak</span>
                              </div>
                              <div className="flex gap-1.5 items-end h-7">
                                {([12, 35, 65, 100, 82] as const).map((h, i) => (
                                  <div key={i} className="flex-1">
                                    <div
                                      className="w-full rounded-sm density-bar"
                                      style={{
                                        height: `${h}%`,
                                        background: i === 3 ? `linear-gradient(to top, ${dc}aa, ${dc})` : h > 50 ? "rgba(204,255,0,0.2)" : "rgba(255,255,255,0.07)",
                                        boxShadow: i === 3 ? `0 0 8px ${dc}55` : "none",
                                      }}
                                    />
                                  </div>
                                ))}
                              </div>
                              <div className="flex justify-between text-[8px] font-mono" style={{ color: "rgba(255,255,255,0.2)" }}>
                                {["Pre", "K-30", "K-15", "K·O", "+45"].map((t) => <span key={t}>{t}</span>)}
                              </div>
                            </div>

                            {/* CTAs */}
                            <div className="flex gap-2 pt-0.5">
                              <button
                                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-semibold transition-colors"
                                style={{ background: "rgba(255,255,255,0.055)", border: "1px solid rgba(255,255,255,0.09)", color: "#b0bfac" }}
                                onClick={(e) => e.stopPropagation()}
                              >
                                <Users className="w-4 h-4" style={{ color: "#ccff00" }} />
                                Share Plan
                              </button>
                              <button
                                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-extrabold transition-all"
                                style={{ background: "#ccff00", color: "#060b03", boxShadow: "0 4px 14px rgba(204,255,0,0.28)" }}
                                onClick={(e) => handleVenueRoute(venue, e)}
                              >
                                <Zap className="w-4 h-4" />
                                Get Directions
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
