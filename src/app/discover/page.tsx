"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/store/appStore";
import { MATCHES } from "@/data/matches";
import { getVenuesForMatch } from "@/data/venues";
import { Venue, Match } from "@/types";
import {
  Search, Compass, ShieldCheck, MapPin, Users, Flame,
  ExternalLink, Star, AlertTriangle, ChevronDown, Clock, Zap,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { ConciergeCallSimulator } from "@/components/ConciergeCallSimulator";

type Filter = "All" | "Verified Only" | "Near Me";

const FILTER_COLORS: Record<Filter, { text: string; bg: string; border: string }> = {
  "All":          { text: "#ccff00",  bg: "rgba(204,255,0,0.12)",   border: "rgba(204,255,0,0.3)" },
  "Verified Only":{ text: "#60a5fa",  bg: "rgba(96,165,250,0.1)",   border: "rgba(96,165,250,0.28)" },
  "Near Me":      { text: "#f59e0b",  bg: "rgba(245,158,11,0.1)",   border: "rgba(245,158,11,0.28)" },
};

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

  const densityPct  = (d: string) => ({ "Packed": 96, "High": 78, "Medium": 55, "Low": 32 }[d] ?? 50);

  const callTargets = filtered.slice(0, 5);

  const scrollToRankings = () => {
    document.getElementById("venue_list_anchor")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="page-enter pb-6">
      <div className="page-container pt-5 space-y-5">

        {/* ══ Signature: Venue Concierge Calls ══ */}
        <div id="concierge_calls_anchor">
          <ConciergeCallSimulator
            key={`${activeMatch.id}-${callTargets.length}`}
            venues={callTargets.length > 0 ? callTargets : venues.slice(0, 5)}
            onComplete={scrollToRankings}
          />
        </div>

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
                    ? `1px solid rgba(204,255,0,0.35)`
                    : "1px solid rgba(255,255,255,0.055)",
                  boxShadow: isSel ? "0 10px 28px rgba(0,0,0,0.45)" : "none",
                }}
              >
                {/* Top neon accent line */}
                {isSel && (
                  <div
                    className="absolute top-0 left-0 right-0 h-0.5"
                    style={{
                      background: `linear-gradient(90deg, ${match.homeColor}, #ccff00 50%, ${match.awayColor})`,
                      opacity: 0.8,
                    }}
                  />
                )}

                {/* League + status row */}
                <div className="flex items-center justify-between mb-3">
                  <span
                    className="chip chip-sage"
                    style={{ fontSize: "8.5px" }}
                  >
                    {match.league}
                  </span>
                  {match.status === "live" ? (
                    <span className="chip chip-live">
                      <span
                        className="w-1.5 h-1.5 rounded-full"
                        style={{ background: "#ff3b30", animation: "live-pulse 1.4s infinite" }}
                      />
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
                        <span
                          className="text-[13px] font-semibold truncate"
                          style={{ color: isSel ? "#f5f9f3" : "#9aaa93" }}
                        >
                          {team}
                        </span>
                      </div>
                      {match.status !== "upcoming" && (
                        <span
                          className="text-sm font-mono font-extrabold flex-shrink-0"
                          style={{ color: isSel ? color || "#f5f9f3" : "#9aaa93" }}
                        >
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
                  <span style={{ color: isSel ? "#ccff00" : "#7a8a75" }}>
                    {match.tournament.replace("FIFA ", "")}
                  </span>
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
          {/* Search bar */}
          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
              style={{ color: "#7a8a75" }}
            />
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

          {/* Filter pills */}
          <div className="flex gap-2 overflow-x-auto no-scrollbar">
            {(["All", "Verified Only", "Near Me"] as Filter[]).map((f) => {
              const col = FILTER_COLORS[f];
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

        {/* ══ List header — Verified Venue Ranking ══ */}
        <div id="venue_list_anchor" className="flex items-center justify-between scroll-mt-24">
          <div className="flex items-center gap-2">
            <span className="label-mono">Verified Venue Ranking</span>
            <span className="chip chip-blue" style={{ fontSize: "8px" }}>
              {filtered.length} hubs
            </span>
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
              <div
                key={i}
                className="rounded-2xl animate-shimmer"
                style={{ height: 110, border: "1px solid rgba(255,255,255,0.05)" }}
              />
            ))}
          </div>

        ) : filtered.length === 0 ? (
          /* ══ Empty state ══ */
          <div
            className="rounded-2xl py-12 px-6 text-center flex flex-col items-center"
            style={{ background: "rgba(10,18,8,0.5)", border: "1px dashed rgba(255,255,255,0.1)" }}
          >
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4"
              style={{ background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.25)" }}
            >
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
          /* ══ Venue Cards ══ */
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
                    background: isOpen
                      ? "rgba(20,32,16,0.88)"
                      : "rgba(10,18,8,0.6)",
                    border: isOpen
                      ? "1px solid rgba(204,255,0,0.28)"
                      : "1px solid rgba(255,255,255,0.048)",
                    boxShadow: isOpen ? "0 14px 36px rgba(0,0,0,0.5)" : "none",
                    transition: "background 0.22s, border-color 0.22s",
                  }}
                >
                  {/* Density accent bar — left side */}
                  <div
                    className="absolute left-0 top-0 bottom-0 w-0.5 rounded-l-2xl"
                    style={{ background: `linear-gradient(to bottom, ${dc}, ${dc}44)` }}
                  />

                  <div className="p-4 pl-5">
                    {/* ─ Card header ─ */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">

                        {/* Name row */}
                        <div className="flex items-center gap-2 mb-1.5">
                          <div className="rank-badge">#{idx + 1}</div>
                          <h4
                            className="text-[13.5px] font-bold leading-tight truncate"
                            style={{ color: "#f5f9f3" }}
                          >
                            {venue.name}
                          </h4>
                          {venue.trustLevel !== "community" && (
                            <ShieldCheck
                              className="w-3.5 h-3.5 flex-shrink-0"
                              style={{ color: "#60a5fa" }}
                              aria-label="Verified"
                            />
                          )}
                        </div>

                        {/* Meta row */}
                        <div
                          className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] font-mono"
                          style={{ color: "#7a8a75" }}
                        >
                          <span className="flex items-center gap-1">
                            <MapPin className="w-2.5 h-2.5" style={{ color: "#ccff00" }} />
                            {venue.distanceKm} km
                          </span>
                          <span className="flex items-center gap-1">
                            <Users className="w-2.5 h-2.5" style={{ color: "#ccff00" }} />
                            {venue.density}
                          </span>
                          <span
                            className="px-1.5 py-0.5 rounded-md text-[9.5px]"
                            style={{
                              background: "rgba(255,255,255,0.05)",
                              border: "1px solid rgba(255,255,255,0.07)",
                              color: "#9aaa93",
                            }}
                          >
                            {venue.affiliation}
                          </span>
                        </div>
                      </div>

                      {/* Atmosphere badge */}
                      <div className="flex flex-col items-end gap-1 flex-shrink-0">
                        <div
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-[12px] font-mono font-bold"
                          style={{
                            background: `${dc}18`,
                            border: `1px solid ${dc}44`,
                            color: dc,
                          }}
                        >
                          <Flame className="w-3.5 h-3.5" />
                          {venue.confidence}%
                        </div>
                        {/* Mini density bar */}
                        <div
                          className="w-12 h-1.5 rounded-full overflow-hidden"
                          style={{ background: "rgba(255,255,255,0.07)" }}
                        >
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${dPct}%`,
                              background: `linear-gradient(90deg, ${dc}88, ${dc})`,
                            }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Stars + rating */}
                    <div className="flex items-center gap-2 mt-2.5 text-[10px] font-mono" style={{ color: "#7a8a75" }}>
                      <div className="flex" style={{ color: "#fbbf24" }}>
                        {[1,2,3,4,5].map((s) => (
                          <Star key={s} className="w-3 h-3 fill-current" />
                        ))}
                      </div>
                      <span style={{ color: "#c5d0c1" }}>{venue.rating}</span>
                      <span style={{ color: "#7a8a75" }}>·</span>
                      <span>{venue.routeTime}</span>
                    </div>

                    {/* Collapsed: concierge teaser */}
                    {!isOpen && (
                      <div
                        className="mt-2.5 px-3 py-2 rounded-xl flex items-start gap-2"
                        style={{
                          background: "rgba(204,255,0,0.04)",
                          border: "1px solid rgba(204,255,0,0.1)",
                        }}
                      >
                        <span
                          className="flex-shrink-0 text-[9px] font-mono font-bold px-1.5 py-0.5 rounded"
                          style={{ background: "rgba(204,255,0,0.12)", color: "#ccff00" }}
                        >
                          MC
                        </span>
                        <p className="text-[11px] leading-relaxed line-clamp-1" style={{ color: "#9aaa93" }}>
                          {venue.conciergeInsight}
                        </p>
                      </div>
                    )}

                    {/* Expand chevron */}
                    <ChevronDown
                      className="absolute top-4 right-4 w-4 h-4 transition-transform duration-200"
                      style={{
                        color: "rgba(255,255,255,0.2)",
                        transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
                      }}
                    />

                    {/* ─ Expanded panel ─ */}
                    <AnimatePresence>
                      {isOpen && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.28, ease: [0.22,1,0.36,1] }}
                          className="overflow-hidden"
                        >
                          <div
                            className="mt-4 pt-4 space-y-4"
                            style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
                          >
                            {/* Concierge insight box */}
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
                                style={{
                                  width: 30, height: 30,
                                  background: "rgba(204,255,0,0.1)",
                                  border: "1px solid rgba(204,255,0,0.3)",
                                  color: "#ccff00",
                                  letterSpacing: "0.05em",
                                }}
                              >
                                MC
                              </div>
                              <div className="flex-1">
                                <span
                                  className="block text-[9.5px] font-mono font-bold uppercase mb-1"
                                  style={{ color: "#ccff00", letterSpacing: "0.15em" }}
                                >
                                  Concierge Insight
                                </span>
                                <p className="text-xs leading-relaxed" style={{ color: "#d8e8d4" }}>
                                  {venue.conciergeInsight}
                                </p>
                              </div>
                            </div>

                            {/* Insights list */}
                            <div className="space-y-2.5">
                              <span
                                className="block text-[9.5px] font-mono font-bold uppercase"
                                style={{ color: "#f59e0b", letterSpacing: "0.15em" }}
                              >
                                ⚡ Atmosphere & Amenities
                              </span>
                              <ul className="space-y-2">
                                {venue.insights.map((insight, i) => (
                                  <li
                                    key={i}
                                    className="flex items-start gap-2.5 text-[11.5px] leading-relaxed"
                                    style={{ color: "#b0bfac" }}
                                  >
                                    <span
                                      className="mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0"
                                      style={{ background: "#ccff00", boxShadow: "0 0 4px #ccff0066" }}
                                    />
                                    {insight}
                                  </li>
                                ))}
                              </ul>
                            </div>

                            {/* Crowd density timeline */}
                            <div className="space-y-2">
                              <div
                                className="flex justify-between text-[9px] font-mono uppercase"
                                style={{ color: "#7a8a75" }}
                              >
                                <span>Crowd Density Timeline</span>
                                <span style={{ color: dc }}>{venue.density} Peak</span>
                              </div>

                              {/* Bars */}
                              <div className="flex gap-1.5 items-end h-7">
                                {([12, 35, 65, 100, 82] as const).map((h, i) => {
                                  const labels = ["Pre", "K-30", "K-15", "K·O", "+45"];
                                  const isKO   = i === 3;
                                  return (
                                    <div
                                      key={i}
                                      className="flex-1 flex flex-col items-center gap-0.5"
                                    >
                                      <div
                                        className="w-full rounded-sm density-bar"
                                        style={{
                                          height: `${h}%`,
                                          background: isKO
                                            ? `linear-gradient(to top, ${dc}aa, ${dc})`
                                            : h > 50
                                            ? "rgba(204,255,0,0.2)"
                                            : "rgba(255,255,255,0.07)",
                                          boxShadow: isKO ? `0 0 8px ${dc}55` : "none",
                                        }}
                                      />
                                    </div>
                                  );
                                })}
                              </div>
                              <div className="flex justify-between text-[8px] font-mono" style={{ color: "rgba(255,255,255,0.2)" }}>
                                {["Pre", "K-30", "K-15", "K·O", "+45"].map((t) => (
                                  <span key={t}>{t}</span>
                                ))}
                              </div>
                            </div>

                            {/* CTA row */}
                            <div className="flex gap-2 pt-0.5">
                              <button
                                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-semibold transition-colors"
                                style={{
                                  background: "rgba(255,255,255,0.055)",
                                  border: "1px solid rgba(255,255,255,0.09)",
                                  color: "#b0bfac",
                                }}
                                onClick={(e) => e.stopPropagation()}
                              >
                                <Users className="w-4 h-4" style={{ color: "#ccff00" }} />
                                Share Plan
                              </button>
                              <button
                                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-extrabold transition-all"
                                style={{
                                  background: "#ccff00",
                                  color: "#060b03",
                                  boxShadow: "0 4px 14px rgba(204,255,0,0.28)",
                                }}
                                onClick={(e) => handleVenueRoute(venue, e)}
                              >
                                <Zap className="w-4 h-4" />
                                Transit Route
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

      {/* ══ FAB ══ */}
      <div className="fixed bottom-[calc(var(--bottom-nav-height)+14px)] right-4 z-40">
        <motion.button
          whileTap={{ scale: 0.93 }}
          onClick={() => document.getElementById("concierge_calls_anchor")?.scrollIntoView({ behavior: "smooth" })}
          className="flex items-center gap-2 px-5 py-3 rounded-full text-xs font-extrabold shadow-2xl cursor-pointer select-none"
          style={{
            background: "#ccff00",
            color: "#060b03",
            boxShadow: "0 0 24px rgba(204,255,0,0.4), 0 8px 20px rgba(0,0,0,0.3)",
          }}
        >
          <ExternalLink className="w-4 h-4" />
          Concierge Calls
        </motion.button>
      </div>
    </div>
  );
}
