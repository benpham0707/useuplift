import React from 'react';
import { motion } from 'motion/react';
import { Sparkles, User } from 'lucide-react';
import { cn } from '@/lib/utils';

export type Role = 'user' | 'assistant';

export interface Message {
  id: string;
  role: Role;
  content: React.ReactNode;
}

interface MessageDisplayProps {
  messages: Message[];
  className?: string;
}

export function MessageDisplay({ messages, className }: MessageDisplayProps) {
  return (
    <div className={cn("flex flex-col gap-6 w-full", className)}>
      {messages.map((message) => (
        <MessageBubble key={message.id} message={message} />
      ))}
    </div>
  );
}

function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === 'user';

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className={cn(
        "flex w-full group",
        isUser ? "justify-end pl-8" : "justify-start pr-8"
      )}
    >
      <div className={cn("flex gap-2 max-w-[92%] items-end", isUser ? "flex-row-reverse" : "flex-row")}>

        {/* Avatar */}
        <div className="flex-shrink-0 z-10 mb-0.5">
          {isUser ? (
            <div className="w-8 h-8 rounded-full bg-white/60 backdrop-blur-md flex items-center justify-center border border-white shadow-sm">
              <User className="w-4 h-4 text-cyan-700" />
            </div>
          ) : (
            <div className="relative flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-cyan-50 to-purple-50 border border-white shadow-[0_0_15px_rgba(168,85,247,0.2)]">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
                className="absolute inset-0 rounded-full border border-dashed border-cyan-400/50"
              />
              <Sparkles className="w-4 h-4 text-purple-600 drop-shadow-sm" />
            </div>
          )}
        </div>

        {/* Message bubble */}
        <div
          className={cn(
            "relative overflow-hidden",
            isUser
              ? "rounded-[1.5rem] rounded-br-sm"
              : "rounded-[1.5rem] rounded-bl-sm"
          )}
        >
          <div
            className={cn(
              "relative px-5 py-4 text-[15px] leading-relaxed",
              isUser ? "text-white" : "text-slate-800"
            )}
          >
            {isUser && (
              <>
                <div className="absolute -inset-1 bg-gradient-to-br from-cyan-400/50 to-purple-500/50 blur-lg rounded-[1.5rem] -z-10 opacity-80 group-hover:opacity-100 transition-opacity" />
                <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/85 to-purple-500/85 backdrop-blur-md rounded-[1.5rem] rounded-br-sm border border-white/40 shadow-sm -z-10" />
              </>
            )}

            {!isUser && (
              <>
                <div className="absolute -inset-1 bg-gradient-to-br from-purple-300/40 via-white/10 to-cyan-200/40 blur-lg rounded-[1.5rem] -z-10 opacity-80 group-hover:opacity-100 transition-opacity" />
                <div className="absolute inset-0 bg-white/70 backdrop-blur-xl rounded-[1.5rem] rounded-bl-sm border border-white/80 shadow-[0_0_15px_rgba(168,85,247,0.08)] -z-10" />
              </>
            )}

            <div className={cn(
              "relative z-10",
              isUser && "font-medium tracking-wide [text-shadow:0_1px_2px_rgba(0,0,0,0.15)]",
              !isUser && "prose prose-sm prose-slate prose-strong:text-purple-700 prose-strong:font-semibold prose-p:leading-relaxed prose-ul:my-2 prose-li:my-0.5"
            )}>
              {typeof message.content === 'string' ? (
                <p className="m-0">{message.content}</p>
              ) : (
                message.content
              )}
            </div>
          </div>
        </div>

      </div>
    </motion.div>
  );
}
