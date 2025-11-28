/**
 * AI Coach Preview Section
 * 
 * Shows the AI Essay Coach in action - the conversational experience
 * Demonstrates the depth and quality of feedback
 */

import { motion } from 'motion/react';
import { 
  MessageSquare, 
  Send, 
  RefreshCw,
  Sparkles,
  User
} from 'lucide-react';

const AICoachPreview = () => {
  const chatMessages = [
    {
      role: "assistant" as const,
      content: "Your current opening eats up 47 words just to say \"I started a club and learned things.\" That's pure setup. But \"I paced the front of room 204, clearing my throat for the third time in thirty seconds\" drops us directly into your world in 18 words. That's a 29-word savings right there.\n\nHere's the beautiful part: your analytical voice—\"What was the 'profit' I was looking for?\"—stays exactly the same. We're not changing your sophisticated framework at all. We're just grounding it in that one vulnerable moment where you had to actually DELIVER those theories to real people."
    },
    {
      role: "user" as const,
      content: "Why does the throat-clearing detail work better than explaining Schumpeter?"
    },
    {
      role: "assistant" as const,
      content: "The throat-clearing detail works because it shows the gap between intellectual confidence (you knew Schumpeter cold) and leadership reality (standing in front of peers is terrifying). That tension makes everything that follows—your discoveries about profit, risk, discovery—feel earned instead of theoretical.\n\nSchumpeter in your opening says \"I read books.\" Throat-clearing says \"I was about to find out if any of this actually worked.\" Admissions officers read thousands of essays about what students learned. They remember the ones where they felt something."
    }
  ];

  return (
    <section className="py-24 bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div 
          className="text-center max-w-3xl mx-auto mb-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <div className="inline-flex items-center gap-2 rounded-full border bg-secondary/50 px-4 py-1.5 text-sm font-medium mb-6">
            <MessageSquare className="h-4 w-4 text-primary" />
            AI Essay Coach
          </div>
          
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Feedback that actually teaches
          </h2>
          
          <p className="text-xl text-muted-foreground leading-relaxed">
            Not just "make it more specific." Our AI coach explains WHY certain changes work, 
            shows you exactly HOW to implement them, and helps you understand the principles behind great writing.
          </p>
        </motion.div>

        {/* Chat Preview */}
        <motion.div 
          className="max-w-3xl mx-auto"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
        >
          <div className="bg-card rounded-2xl border shadow-xl overflow-hidden">
            {/* Chat Header */}
            <div className="px-6 py-4 border-b bg-muted/30 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center">
                  <MessageSquare className="h-5 w-5 text-white" />
                </div>
                <div>
                  <div className="font-semibold">AI Essay Coach</div>
                  <div className="text-xs text-muted-foreground">Ask me anything about your Inspiring Academic Subject narrative</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <RefreshCw className="h-4 w-4 text-muted-foreground" />
              </div>
            </div>

            {/* Messages */}
            <div className="p-6 space-y-6 max-h-[500px] overflow-y-auto">
              {chatMessages.map((msg, i) => (
                <motion.div
                  key={i}
                  className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.3 + i * 0.15 }}
                >
                  <div className={`flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center ${
                    msg.role === 'assistant' 
                      ? 'bg-gradient-to-br from-violet-500 to-indigo-600' 
                      : 'bg-primary'
                  }`}>
                    {msg.role === 'assistant' 
                      ? <Sparkles className="h-4 w-4 text-white" />
                      : <User className="h-4 w-4 text-primary-foreground" />
                    }
                  </div>
                  <div className={`flex-1 max-w-[85%] ${msg.role === 'user' ? 'text-right' : ''}`}>
                    <div className={`inline-block p-4 rounded-2xl text-sm leading-relaxed ${
                      msg.role === 'assistant'
                        ? 'bg-muted text-foreground rounded-tl-sm'
                        : 'bg-primary text-primary-foreground rounded-tr-sm'
                    }`}>
                      {msg.content.split('\n\n').map((para, j) => (
                        <p key={j} className={j > 0 ? 'mt-3' : ''}>{para}</p>
                      ))}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Input Preview */}
            <div className="px-6 py-4 border-t bg-muted/20">
              <div className="flex items-center gap-3">
                <div className="flex-1 bg-background border rounded-xl px-4 py-3 text-sm text-muted-foreground">
                  Ask me about your score, issues, or how to improve...
                </div>
                <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center cursor-pointer hover:bg-primary/90 transition-colors">
                  <Send className="h-4 w-4 text-primary-foreground" />
                </div>
              </div>
              <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
                <span>Press Enter to send, Shift+Enter for new line</span>
                <span className="flex items-center gap-1">
                  <Sparkles className="h-3 w-3" />
                  1 credit per message
                </span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Supporting Points */}
        <motion.div 
          className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto mt-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5 }}
        >
          {[
            { title: "Contextual", desc: "Knows your full essay, your score, and exactly which issues need fixing" },
            { title: "Specific", desc: "Gives concrete rewrites and examples, not vague suggestions" },
            { title: "Educational", desc: "Explains the WHY so you learn to write better, not just get one essay done" }
          ].map((point, i) => (
            <div key={i} className="text-center p-4">
              <div className="font-semibold mb-1">{point.title}</div>
              <p className="text-sm text-muted-foreground">{point.desc}</p>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default AICoachPreview;
