import React from 'react';
import { motion } from 'motion/react';
import { cn } from '@/lib/utils';
import { MessageBubble } from './MessageBubble';

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
    <div className={cn("flex flex-col w-full", className)}>
      {messages.map((message) => (
        <motion.div
          key={message.id}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        >
          <MessageBubble
            role={message.role}
            content={message.content}
          />
        </motion.div>
      ))}
    </div>
  );
}
