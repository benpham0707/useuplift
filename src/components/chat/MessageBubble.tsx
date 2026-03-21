import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { motion } from "motion/react";
import { Sparkles, User } from "lucide-react";
import { cn } from "@/lib/utils";

// --- CVA Definitions: Layout & Aesthetics ---

const messageRowVariants = cva(
  "flex w-full items-end gap-4 mb-8 group",
  {
    variants: {
      role: {
        assistant: "flex-row",
        user: "flex-row-reverse",
      },
    },
    defaultVariants: {
      role: "assistant",
    },
  }
);

const messageBubbleVariants = cva(
  "relative px-6 py-5 text-[16px] leading-[1.75] tracking-[0.01em] transition-all duration-300",
  {
    variants: {
      role: {
        assistant: [
          // Solid, highly readable system panel (anchor)
          "max-w-[85%]",
          "bg-white",
          "text-slate-800",
          "rounded-[20px] rounded-bl-sm",
          "border border-[hsl(250_70%_80%_/_0.5)]",
          "shadow-[0_8px_30px_-6px_hsl(250_70%_60%_/_0.08)]",
          "[&_p]:mb-4 [&_p:last-child]:mb-0",
          "[&_strong]:font-semibold [&_strong]:text-[hsl(250_70%_50%)]",
          "selection:bg-[hsl(185_80%_55%_/_0.2)] selection:text-[hsl(250_70%_40%)]",
        ],
        user: [
          // True Holographic Glass — premium card
          "max-w-[75%]",
          "bg-white/30",
          "backdrop-blur-xl",
          "text-slate-800 font-medium",
          "rounded-[20px] rounded-br-sm",
          // Physical glass edge and thick shadow
          "border border-white/60",
          "shadow-[0_12px_40px_-10px_rgba(31,38,135,0.15)]",
          "ring-1 ring-inset ring-white/40",
          "[&_p]:mb-4 [&_p:last-child]:mb-0",
          "selection:bg-[hsl(250_70%_60%_/_0.2)] selection:text-[hsl(250_70%_40%)]",
        ],
      },
    },
    defaultVariants: {
      role: "assistant",
    },
  }
);

const avatarVariants = cva(
  "flex h-10 w-10 shrink-0 items-center justify-center rounded-full shadow-sm ring-4 ring-white relative z-10",
  {
    variants: {
      role: {
        assistant: "bg-[hsl(250_70%_95%)] border border-[hsl(250_70%_80%)] text-[hsl(250_70%_60%)]",
        user: "bg-white/80 backdrop-blur-sm border border-[hsl(185_80%_85%)] text-[hsl(185_80%_55%)] shadow-[inset_0_1px_2px_rgba(255,255,255,0.9)]",
      },
    },
    defaultVariants: {
      role: "assistant",
    },
  }
);

// --- Component Interface ---

export interface MessageBubbleProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof messageRowVariants> {
  content: string | React.ReactNode;
  role: "assistant" | "user";
}

// --- Implementation ---

export function MessageBubble({
  content,
  role,
  className,
  ...props
}: MessageBubbleProps) {
  return (
    <div className={cn(messageRowVariants({ role }), className)} {...props}>
      {/* Avatar */}
      <motion.div
        whileHover={{ scale: 1.05 }}
        transition={{ type: "spring", stiffness: 400, damping: 17 }}
        className={cn(avatarVariants({ role }))}
      >
        {role === "assistant" ? (
          <Sparkles className="h-[18px] w-[18px]" strokeWidth={2} />
        ) : (
          <User className="h-[18px] w-[18px]" strokeWidth={2} />
        )}
      </motion.div>

      {/* Bubble */}
      <motion.div className={cn(messageBubbleVariants({ role }), "overflow-hidden")}>
        {/* True Holographic Foil layers — only on user bubble */}
        {role === "user" && (
          <>
            {/* LAYER 1: Iridescent Pools — ambient holographic colors via color-burn blending */}
            <div
              className="absolute inset-0 z-0 pointer-events-none mix-blend-color-burn opacity-60"
              style={{
                background: `
                  radial-gradient(120% 120% at 100% 0%, hsla(185, 80%, 55%, 0.4) 0%, transparent 60%),
                  radial-gradient(120% 120% at 0% 100%, hsla(280, 90%, 65%, 0.3) 0%, transparent 60%),
                  radial-gradient(100% 100% at 50% 50%, hsla(250, 70%, 65%, 0.2) 0%, transparent 80%)
                `,
              }}
              aria-hidden="true"
            />

            {/* LAYER 2: Conic Facets — sweeping planes of light mimicking faceted crinkles */}
            <div
              className="absolute inset-0 z-0 pointer-events-none mix-blend-overlay opacity-90"
              style={{
                background: `
                  conic-gradient(from 120deg at 70% 30%, transparent 0, rgba(255,255,255,0.8) 10deg, transparent 35deg),
                  conic-gradient(from 260deg at 20% 80%, transparent 0, hsla(185, 80%, 70%, 0.5) 15deg, transparent 45deg),
                  conic-gradient(from 45deg at 50% -10%, transparent 0, rgba(255,255,255,0.6) 20deg, transparent 60deg)
                `,
              }}
              aria-hidden="true"
            />

            {/* LAYER 3: Sharp Crinkles — ultra-thin intersecting specular highlights */}
            <div
              className="absolute inset-0 z-0 pointer-events-none mix-blend-plus-lighter opacity-70"
              style={{
                background: `
                  linear-gradient(115deg, transparent 25%, rgba(255,255,255,0.9) 25.5%, hsla(185, 80%, 60%, 0.4) 26%, transparent 27%),
                  linear-gradient(45deg, transparent 65%, hsla(280, 90%, 70%, 0.5) 65.2%, rgba(255,255,255,0.8) 65.6%, transparent 66%),
                  linear-gradient(165deg, transparent 40%, rgba(255,255,255,0.4) 40.2%, transparent 40.8%)
                `,
              }}
              aria-hidden="true"
            />

            {/* LAYER 4: 3D Glass Rim — catch-light on the physical top/left edge */}
            <div
              className="absolute inset-0 rounded-[inherit] shadow-[inset_1px_1px_3px_rgba(255,255,255,0.9),_inset_-1px_-1px_3px_rgba(0,0,0,0.05)] z-0 pointer-events-none"
              aria-hidden="true"
            />
          </>
        )}

        {/* Text content — elevated above holographic layers */}
        <div className="relative z-10 break-words drop-shadow-sm">{content}</div>
      </motion.div>
    </div>
  );
}
