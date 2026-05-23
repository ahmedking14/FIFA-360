"use client";

import { useState, useCallback } from "react";
import { Venue } from "@/types";
import { Phone, PhoneCall, CheckCircle, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface CallStep {
  venue: Venue;
  status: "pending" | "calling" | "done" | "failed";
  duration?: number;
}

interface Props {
  venues: Venue[];
  onComplete: () => void;
}

function CallRow({ step, index, total }: { step: CallStep; index: number; total: number }) {
  const statusColor =
    step.status === "done"
      ? "#ccff00"
      : step.status === "failed"
        ? "#ff3b30"
        : step.status === "calling"
          ? "#60a5fa"
          : "#7a8a75";

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      className="flex items-center gap-3 py-2.5"
      style={{ borderBottom: index < total - 1 ? "1px solid rgba(255,255,255,0.05)" : undefined }}
    >
      <div
        className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
        style={{
          background: `${statusColor}18`,
          border: `1px solid ${statusColor}35`,
          boxShadow: step.status === "calling" ? `0 0 12px ${statusColor}30` : undefined,
        }}
      >
        {step.status === "calling" && <PhoneCall className="w-3.5 h-3.5 animate-pulse" style={{ color: statusColor }} />}
        {step.status === "done" && <CheckCircle className="w-3.5 h-3.5" style={{ color: statusColor }} />}
        {(step.status === "failed" || step.status === "pending") && (
          <Phone className="w-3.5 h-3.5" style={{ color: statusColor }} />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div
          className="text-xs font-bold truncate"
          style={{ color: step.status === "pending" ? "#7a8a75" : "#f5f9f3" }}
        >
          {step.venue.name}
        </div>
        <div className="text-[10px] mt-0.5" style={{ color: statusColor }}>
          {step.status === "calling" && "Calling venue…"}
          {step.status === "done" && `Verified · ${step.duration}s`}
          {step.status === "failed" && "No answer — skipped"}
          {step.status === "pending" && "Queued"}
        </div>
      </div>

      {step.status === "calling" && <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" style={{ color: "#60a5fa" }} />}
      {step.status === "done" && (
        <span
          className="text-[9px] font-mono font-bold px-2 py-0.5 rounded-full shrink-0"
          style={{ background: "rgba(204,255,0,0.12)", border: "1px solid rgba(204,255,0,0.28)", color: "#ccff00" }}
        >
          LIVE
        </span>
      )}
    </motion.div>
  );
}

export function ConciergeCallSimulator({ venues, onComplete }: Props) {
  const [steps, setSteps] = useState<CallStep[]>(venues.map((v) => ({ venue: v, status: "pending" })));
  const [started, setStarted] = useState(false);
  const [finished, setFinished] = useState(false);

  const runCalls = useCallback(async () => {
    setStarted(true);
    setSteps(venues.map((v) => ({ venue: v, status: "pending" })));

    for (let i = 0; i < venues.length; i++) {
      setSteps((prev) => prev.map((s, idx) => (idx === i ? { ...s, status: "calling" } : s)));
      const duration = 1400 + Math.random() * 1800;
      await new Promise((r) => setTimeout(r, duration));
      const ok = Math.random() > 0.12;
      setSteps((prev) =>
        prev.map((s, idx) =>
          idx === i ? { ...s, status: ok ? "done" : "failed", duration: Math.round(duration / 1000) } : s
        )
      );
      if (i < venues.length - 1) await new Promise((r) => setTimeout(r, 400));
    }
    setFinished(true);
  }, [venues]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-3xl p-4 space-y-3.5 overflow-hidden relative"
      style={{
        background: "linear-gradient(145deg, rgba(204,255,0,0.1) 0%, rgba(10,18,8,0.92) 55%)",
        border: "1px solid rgba(204,255,0,0.28)",
        boxShadow: "0 0 40px rgba(204,255,0,0.06), inset 0 1px 0 rgba(255,255,255,0.05)",
      }}
    >
      <div className="flex items-center gap-3">
        <div
          className="w-11 h-11 rounded-2xl flex items-center justify-center font-mono font-extrabold text-[10px]"
          style={{
            background: "rgba(204,255,0,0.14)",
            border: "1px solid rgba(204,255,0,0.35)",
            color: "#ccff00",
            boxShadow: started && !finished ? "0 0 18px rgba(204,255,0,0.25)" : undefined,
          }}
        >
          {started && !finished ? <PhoneCall className="w-5 h-5 animate-pulse" /> : "MC"}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-extrabold" style={{ color: "#f5f9f3" }}>
            Venue Concierge <span className="gradient-text-neon">Calls</span>
          </p>
          <p className="text-[10px] mt-0.5 leading-relaxed" style={{ color: "#7a8a75" }}>
            {finished
              ? "Rankings refreshed with live RSVP & capacity intel"
              : started
                ? "Outbound calls in progress…"
                : "Signature differentiator — verify every shortlisted venue before you go"}
          </p>
        </div>
        <span className="chip chip-neon flex-shrink-0" style={{ fontSize: "8px" }}>
          #1 Feature
        </span>
      </div>

      <div
        className="rounded-xl px-3 max-h-44 overflow-y-auto"
        style={{ background: "rgba(5,9,3,0.55)", border: "1px solid rgba(255,255,255,0.06)" }}
      >
        {steps.map((step, i) => (
          <CallRow key={step.venue.id} step={step} index={i} total={steps.length} />
        ))}
      </div>

      <AnimatePresence mode="wait">
        {!started ? (
          <motion.button
            key="start"
            whileTap={{ scale: 0.97 }}
            onClick={runCalls}
            className="w-full py-3 rounded-2xl text-xs font-extrabold flex items-center justify-center gap-2 cursor-pointer"
            style={{
              background: "#ccff00",
              color: "#060b03",
              boxShadow: "0 4px 18px rgba(204,255,0,0.32)",
            }}
          >
            <Phone className="w-4 h-4" />
            Run Concierge Calls ({venues.length})
          </motion.button>
        ) : finished ? (
          <motion.button
            key="done"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            whileTap={{ scale: 0.97 }}
            onClick={onComplete}
            className="w-full py-3 rounded-2xl text-xs font-extrabold cursor-pointer"
            style={{
              background: "rgba(204,255,0,0.12)",
              border: "1px solid rgba(204,255,0,0.35)",
              color: "#ccff00",
            }}
          >
            View Verified Venue Ranking →
          </motion.button>
        ) : null}
      </AnimatePresence>

      {!started && (
        <p className="text-center text-[9px] font-mono" style={{ color: "rgba(255,255,255,0.22)" }}>
          Demo · Simulated outbound calls with pre-loaded venue intel
        </p>
      )}
    </motion.div>
  );
}
