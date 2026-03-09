import React, { useRef, useEffect } from "react";
import { motion } from "motion/react";
import { Copy, ThumbsUp, Sparkles } from "lucide-react";

interface Message {
  id: string;
  role: 'user' | 'ai';
  content: string;
}

const exampleMessages: Message[] = [
  { id: '1', role: 'user', content: 'Hi there, I\'m currently working on a fiction book. Can you start by asking me a few key questions to help me get started? Ask me questions one at a time.' },
  { id: '2', role: 'ai', content: 'A worthy endeavor. Let us weave the tapestry of your world together. We must first establish the anchor of your reality.\n\nWhat is the **core truth or central premise** of this narrative? Is it a dystopian descent, a cyberpunk thriller, or a galactic enigma?' },
  { id: '3', role: 'user', content: 'It is a sci-fi mystery set within the neon depths of a cyberpunk city.' },
  { id: '4', role: 'ai', content: 'An excellent foundation. The neon lights cast long shadows where secrets breed. Now, we must define the rules of this realm.\n\nHow do the **technological advancements** of this city directly manipulate the lives of its denizens or the nature of your mystery?\n\nConsider the following paradigms:\n* Are sentient artificial minds walking among them?\n* Does the eye of surveillance ever close?\n* How deep is the chasm between the elite and the forgotten?' },
];

export const MessageDisplay: React.FC = () => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, []);

  return (
    <div ref={scrollRef} className="flex flex-col space-y-6">
      {exampleMessages.map((message, index) => {
        const isUser = message.role === 'user';

        return (
          <motion.div
            key={message.id}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.05 }}
            className="group flex w-full flex-col"
          >
            {isUser ? (
              // User: Gradient celestial bubble
              <div className="ml-auto max-w-[80%] rounded-2xl bg-gradient-to-br from-purple-600 to-cyan-600 px-5 py-3.5 shadow-[0_4px_20px_rgba(168,85,247,0.25)]">
                <div className="text-[14.5px] leading-relaxed text-white">
                  {message.content}
                </div>
              </div>
            ) : (
              // AI: Cloud-glass card
              <div className="relative flex w-full gap-3 max-w-[95%]">
                <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-cyan-100 to-purple-100 border border-white shadow-sm">
                  <Sparkles className="h-4 w-4 text-cyan-600" />
                </div>

                <div className="flex-1 space-y-2 rounded-2xl bg-white/60 px-5 py-4 backdrop-blur-md border border-white/80 shadow-sm">
                  <div className="prose prose-sm max-w-none break-words text-slate-700 prose-p:leading-[1.7] prose-strong:font-semibold prose-strong:text-purple-700 prose-ul:my-2 prose-ul:pl-4 prose-li:my-0.5 prose-li:marker:text-cyan-500">
                    {message.content.split('\n').map((line, pIndex) => {
                      if (line.trim().startsWith('* ')) {
                        return <ul key={pIndex}><li>{line.replace('* ', '')}</li></ul>;
                      }
                      if (line.trim() === '') return <div key={pIndex} className="h-2" />;
                      return (
                        <p key={pIndex} className="m-0">
                          {line.split('**').map((part, partIndex) =>
                            partIndex % 2 === 0 ? part : <strong key={partIndex}>{part}</strong>
                          )}
                        </p>
                      );
                    })}
                  </div>

                  <div className="flex items-center gap-1.5 opacity-0 transition-opacity duration-200 group-hover:opacity-100 pt-1">
                    <button className="flex items-center justify-center rounded-md p-1.5 text-slate-400 hover:bg-purple-50 hover:text-purple-600">
                      <Copy className="h-3.5 w-3.5" />
                    </button>
                    <button className="flex items-center justify-center rounded-md p-1.5 text-slate-400 hover:bg-cyan-50 hover:text-cyan-600">
                      <ThumbsUp className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        );
      })}
    </div>
  );
};
