/**
 * /vapor-demo
 *
 * Isolated sandbox for the "Genie from the Lamp" vapor-stream animation.
 * Scroll down to watch each message materialize.
 * Press R (or click the button) to replay all animations.
 *
 * Nothing in this file touches the live chat implementation.
 */

import React, { useCallback, useState } from "react";
import { VaporChatMessage } from "@/components/chat/VaporChatMessage";

// ---------------------------------------------------------------------------
// Sample conversation
// ---------------------------------------------------------------------------

const CONVERSATION = [
  {
    id: "1",
    role: "sage" as const,
    content:
      "Your Common App essay opens with a powerful image, but the transition into your sophomore year feels abrupt. What was the emotional pivot point you were trying to capture there?",
  },
  {
    id: "2",
    role: "user" as const,
    content:
      "I wanted to show the moment I realized my mom's cooking wasn't just food — it was how she remembered home. But I think I jumped too fast into the backstory.",
  },
  {
    id: "3",
    role: "sage" as const,
    content:
      "That's exactly the insight admissions officers are hungry for. The specific, irreplaceable detail. Right now the essay tells us the realization happened; it doesn't let us experience it alongside you. What did you see, smell, or feel in that exact moment?",
  },
  {
    id: "4",
    role: "user" as const,
    content:
      "She was frying shallots and I watched the steam curl up and disappear into nothing. I don't know why but that felt like the right metaphor — things that vanish but leave a trace.",
  },
  {
    id: "5",
    role: "sage" as const,
    content:
      "The steam curling and vanishing — that's your essay's spine. That single image earns the emotional weight you're trying to carry for the next five paragraphs. Lead with it. Everything else is context in service of that steam.",
  },
  {
    id: "6",
    role: "user" as const,
    content: "Should I literally open with that sentence then?",
  },
  {
    id: "7",
    role: "sage" as const,
    content:
      "Try it and see how it breathes. A strong opening image does two things: it gives the reader a sensory anchor, and it creates a question — why does this matter to you? Your steam image does both. Write two versions: one that opens with it, one that builds toward it. The better one will be obvious on the third read.",
  },
] as const;

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function VaporChatDemo() {
  // Key trick: changing the key unmounts/remounts all messages → replays
  const [replayKey, setReplayKey] = useState(0);

  const replay = useCallback(() => setReplayKey((k) => k + 1), []);

  return (
    <div
      className="min-h-screen w-full"
      style={{
        background:
          "radial-gradient(ellipse at 60% 0%, hsl(250 35% 10%) 0%, hsl(235 25% 7%) 60%)",
      }}
    >
      {/* ── Sticky header ── */}
      <header
        className="sticky top-0 z-50 flex items-center justify-between px-6 py-4 border-b border-white/8"
        style={{ backdropFilter: "blur(20px)", background: "rgba(15,12,24,0.75)" }}
      >
        <div>
          <p className="text-xs font-mono text-[hsl(185_70%_55%)] uppercase tracking-widest mb-0.5">
            Animation Sandbox
          </p>
          <h1 className="text-white font-semibold text-base leading-tight">
            Vapor Stream · Message Morph Demo
          </h1>
        </div>
        <button
          onClick={replay}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white/80 border border-white/15 transition-all hover:border-white/30 hover:text-white active:scale-95"
          style={{ background: "rgba(255,255,255,0.06)" }}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-3.5 h-3.5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
            <path d="M3 3v5h5" />
          </svg>
          Replay
        </button>
      </header>

      {/* ── Scroll hint ── */}
      <div className="flex justify-center pt-10 pb-2">
        <p className="text-xs text-white/30 tracking-wide">
          ↓ scroll slowly — animation is tied to scroll position
        </p>
      </div>

      {/* ── Message feed ── */}
      <main
        key={replayKey}
        className="max-w-2xl mx-auto px-6 pt-6 pb-[80vh]"
      >
        {/* Top spacer — gives the first message room to scroll into */}
        <div className="h-[40vh]" />
        {CONVERSATION.map((msg) => (
          <VaporChatMessage
            key={msg.id}
            id={msg.id}
            role={msg.role}
            content={msg.content}
          />
        ))}

        {/* Breathing room at the end */}
        <div className="h-32 flex items-center justify-center">
          <p className="text-xs text-white/20 font-mono">
            — end of conversation —
          </p>
        </div>
      </main>
    </div>
  );
}
