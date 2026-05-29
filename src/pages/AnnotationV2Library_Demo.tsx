/**
 * AnnotationV2 Library — student's essay home base.
 *
 * Route: /annotation-v2-demo/library
 *
 * Premium "writer's studio" view of every essay in progress: featured
 * hero for the active draft, grouped grid of remaining essays, and a
 * portfolio strip showing what an admissions officer sees when they
 * read these together.
 *
 * Design idiom matches AnnotationV2Demo:
 *   • Purple → cyan brand gradient on the spark mark
 *   • Phase color tokens (foundation amber, architecture blue, craft
 *     purple, polish emerald, distinction rose) for badges + gauges
 *   • Tier color tokens (needs-work red, improve yellow, strength green)
 *     for status chips
 *   • Soft glass surface (white/80, backdrop-blur-2xl, slate hairlines)
 */

import * as React from 'react';
import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles, Plus, Search, Filter as FilterIcon, ChevronRight, ArrowRight,
  FileText, Lock, Clock, Layers, BookOpen, GraduationCap, Compass,
  Eye, Target, Pencil, Shield, AlertCircle, CheckCircle2, Star,
  TrendingUp, Globe, Settings, Bell,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import '@/components/annotation-v2/workshop.css';

// ═══════════════════════════════════════════
// Types & Mock Data
// ═══════════════════════════════════════════

type EssayPhase = 'foundation' | 'architecture' | 'craft' | 'polish' | 'distinction';
type EssayStatus = 'drafting' | 'analyzing' | 'analyzed' | 'stale' | 'submitted';
type EssayCategory = 'common-app' | 'supplement' | 'piq' | 'scholarship';

interface MockEssay {
  id: string;
  category: EssayCategory;
  school: string;
  schoolMark: string;
  schoolHue: string;          // accent hue for the school monogram
  promptLabel: string;        // "Personal Statement", "Roommate Essay", "Why Stanford"
  promptPreview: string;      // first sentence of the prompt itself
  title: string;              // student's working title or first line
  opening: string;            // first paragraph or strong opening sentence
  wordCount: number;
  wordLimit: number;
  phase: EssayPhase | null;
  eqi: number | null;
  status: EssayStatus;
  insightCount: number;
  protectedStrengths: number;
  lastEditedMinutesAgo: number;
  nextMove?: string;          // top-priority next action from roadmap
}

// Featured essay = the one the user is currently working on (most recent edit).
const MOCK_ESSAYS: MockEssay[] = [
  {
    id: 'common-app-ps',
    category: 'common-app',
    school: 'Common App',
    schoolMark: 'CA',
    schoolHue: '250 70% 60%',
    promptLabel: 'Personal Statement',
    promptPreview: 'Some students have a background, identity, interest, or talent so meaningful...',
    title: 'The Translator',
    opening: 'The fluorescent lights of the hospital waiting room hummed a frequency that matched the tremor in my hands. I was sixteen, holding a clipboard that asked me to be an adult.',
    wordCount: 487,
    wordLimit: 650,
    phase: 'craft',
    eqi: 78,
    status: 'analyzed',
    insightCount: 14,
    protectedStrengths: 3,
    lastEditedMinutesAgo: 11,
    nextMove: 'Rewrite the thesis in P4 so the insight emerges from experience rather than announcement.',
  },
  {
    id: 'stanford-roommate',
    category: 'supplement',
    school: 'Stanford',
    schoolMark: 'S',
    schoolHue: '355 75% 56%',
    promptLabel: 'Roommate Essay',
    promptPreview: 'Virtually all Stanford students live on campus. Write a note to your future roommate...',
    title: 'Untitled',
    opening: "I should warn you upfront: I'm the kind of person who alphabetizes spice racks and color-codes calendars. Not because I love organization, but because chaos in childhood made order feel like safety.",
    wordCount: 142,
    wordLimit: 250,
    phase: 'foundation',
    eqi: 54,
    status: 'analyzed',
    insightCount: 8,
    protectedStrengths: 1,
    lastEditedMinutesAgo: 73,
    nextMove: 'Anchor the abstraction ("chaos in childhood") to a single concrete memory.',
  },
  {
    id: 'yale-curiosity',
    category: 'supplement',
    school: 'Yale',
    schoolMark: 'Y',
    schoolHue: '220 75% 50%',
    promptLabel: 'What inspires you?',
    promptPreview: 'Reflect on a source of inspiration in your intended area of study...',
    title: 'The Architecture of Systems',
    opening: 'My favorite paper of the past year was not about medicine — it was about how the New York City subway was redesigned to serve the people it had previously failed. Reading it, I recognized my own kitchen-table research from a different angle.',
    wordCount: 198,
    wordLimit: 200,
    phase: 'architecture',
    eqi: 71,
    status: 'stale',
    insightCount: 10,
    protectedStrengths: 2,
    lastEditedMinutesAgo: 1440,
    nextMove: 'Edits since last analysis — re-run to refresh the read.',
  },
  {
    id: 'uc-piq-leadership',
    category: 'piq',
    school: 'UC PIQ',
    schoolMark: 'UC',
    schoolHue: '35 85% 55%',
    promptLabel: 'Leadership Experience',
    promptPreview: 'Describe an example of your leadership experience in which you have positively influenced others...',
    title: 'Untitled',
    opening: '',
    wordCount: 0,
    wordLimit: 350,
    phase: null,
    eqi: null,
    status: 'drafting',
    insightCount: 0,
    protectedStrengths: 0,
    lastEditedMinutesAgo: 60 * 24 * 2,
  },
  {
    id: 'princeton-engaged',
    category: 'supplement',
    school: 'Princeton',
    schoolMark: 'P',
    schoolHue: '15 85% 50%',
    promptLabel: 'Civic Engagement',
    promptPreview: 'Tell us about an issue or activity that is important to you and what you have done about it...',
    title: "The 3 AM Phone Calls",
    opening: 'It started with one insurance call I overheard from the kitchen. By the time I was a junior, I had built a folder of templates that other immigrant families in our building borrowed when their own calls went badly.',
    wordCount: 251,
    wordLimit: 250,
    phase: 'polish',
    eqi: 85,
    status: 'analyzed',
    insightCount: 6,
    protectedStrengths: 4,
    lastEditedMinutesAgo: 60 * 6,
    nextMove: 'You\'re one word over — see Roadmap for the highest-leverage 1-word cut.',
  },
  {
    id: 'harvard-additional',
    category: 'supplement',
    school: 'Harvard',
    schoolMark: 'H',
    schoolHue: '355 75% 38%',
    promptLabel: 'Additional Essay',
    promptPreview: 'You may write on a topic of your choice...',
    title: 'Translation Toolkit (submitted)',
    opening: 'I keep a Google Doc called "Phrases I had to look up at 14." It started as a survival mechanism. It became a record of everything the American medical system assumes you already know.',
    wordCount: 643,
    wordLimit: 650,
    phase: 'distinction',
    eqi: 91,
    status: 'submitted',
    insightCount: 0,
    protectedStrengths: 0,
    lastEditedMinutesAgo: 60 * 24 * 9,
  },
];

// ═══════════════════════════════════════════
// Design tokens — matched to AnnotationV2Demo
// ═══════════════════════════════════════════

const PHASE_TOKENS: Record<EssayPhase, { dot: string; text: string; bg: string; label: string }> = {
  foundation:   { dot: 'hsl(35, 85%, 60%)',  text: 'hsl(35, 85%, 38%)',  bg: 'hsla(35, 85%, 60%, 0.12)',  label: 'Foundation'   },
  architecture: { dot: 'hsl(220, 70%, 65%)', text: 'hsl(220, 70%, 42%)', bg: 'hsla(220, 70%, 65%, 0.12)', label: 'Architecture' },
  craft:        { dot: 'hsl(250, 70%, 60%)', text: 'hsl(250, 70%, 42%)', bg: 'hsla(250, 70%, 60%, 0.12)', label: 'Craft'        },
  polish:       { dot: 'hsl(160, 70%, 55%)', text: 'hsl(160, 70%, 32%)', bg: 'hsla(160, 70%, 55%, 0.12)', label: 'Polish'       },
  distinction:  { dot: 'hsl(350, 75%, 65%)', text: 'hsl(350, 75%, 42%)', bg: 'hsla(350, 75%, 65%, 0.12)', label: 'Distinction'  },
};

const STATUS_TOKENS: Record<EssayStatus, { label: string; text: string; bg: string; ring: string; icon: React.ReactNode }> = {
  drafting:  { label: 'Drafting',         text: 'hsl(220, 14%, 46%)', bg: 'hsl(220, 14%, 96%)',           ring: 'hsl(220, 14%, 88%)', icon: <Pencil className="w-3 h-3" /> },
  analyzing: { label: 'Analyzing…',       text: 'hsl(250, 70%, 42%)', bg: 'hsla(250, 70%, 60%, 0.12)',    ring: 'hsla(250, 70%, 60%, 0.30)', icon: <Sparkles className="w-3 h-3" /> },
  analyzed:  { label: 'Analyzed',         text: 'hsl(160, 60%, 30%)', bg: 'hsla(160, 65%, 42%, 0.10)',    ring: 'hsla(160, 65%, 42%, 0.30)', icon: <CheckCircle2 className="w-3 h-3" /> },
  stale:     { label: 'Edits since read', text: 'hsl(32, 88%, 38%)',  bg: 'hsla(42, 92%, 50%, 0.12)',     ring: 'hsla(42, 92%, 50%, 0.32)', icon: <AlertCircle className="w-3 h-3" /> },
  submitted: { label: 'Submitted',        text: 'hsl(220, 8%, 38%)',  bg: 'hsl(220, 8%, 95%)',            ring: 'hsl(220, 8%, 86%)', icon: <Lock className="w-3 h-3" /> },
};

const CATEGORY_TOKENS: Record<EssayCategory, { label: string; icon: React.ReactNode }> = {
  'common-app':  { label: 'Common App',       icon: <FileText className="w-3.5 h-3.5" /> },
  supplement:    { label: 'Supplements',      icon: <BookOpen className="w-3.5 h-3.5" /> },
  piq:           { label: 'UC PIQs',          icon: <GraduationCap className="w-3.5 h-3.5" /> },
  scholarship:   { label: 'Scholarship',      icon: <Star className="w-3.5 h-3.5" /> },
};

function formatRelative(minutesAgo: number): string {
  if (minutesAgo < 1) return 'just now';
  if (minutesAgo < 60) return `${Math.round(minutesAgo)}m ago`;
  const hours = minutesAgo / 60;
  if (hours < 24) return `${Math.round(hours)}h ago`;
  const days = hours / 24;
  if (days < 30) return `${Math.round(days)}d ago`;
  return `${Math.round(days / 30)}mo ago`;
}

// ═══════════════════════════════════════════
// School monogram chip — single source of truth for visual identity
// ═══════════════════════════════════════════

function SchoolMark({ mark, hue, size = 'md' }: { mark: string; hue: string; size?: 'sm' | 'md' | 'lg' }) {
  const dim = size === 'lg' ? 'w-12 h-12 text-[15px]' : size === 'sm' ? 'w-7 h-7 text-[10px]' : 'w-9 h-9 text-[12px]';
  return (
    <div
      className={cn('relative rounded-xl flex items-center justify-center font-bold tracking-tight shadow-sm', dim)}
      style={{
        background: `linear-gradient(135deg, hsl(${hue} / 0.95), hsl(${hue} / 0.78))`,
        color: 'white',
        boxShadow: `0 6px 14px -6px hsl(${hue} / 0.55), 0 0 0 1px hsl(${hue} / 0.10) inset`,
      }}
    >
      <span className="relative z-10">{mark}</span>
      <span
        className="absolute -inset-px rounded-xl opacity-40 blur-md -z-10"
        style={{ background: `hsl(${hue})` }}
      />
    </div>
  );
}

// ═══════════════════════════════════════════
// Mini EQI gauge — circular ring, matches Workshop toolbar
// ═══════════════════════════════════════════

function EqiGauge({ value, size = 'md' }: { value: number | null; size?: 'sm' | 'md' | 'lg' }) {
  const dim = size === 'lg' ? 64 : size === 'sm' ? 28 : 40;
  const stroke = size === 'lg' ? 3.5 : size === 'sm' ? 2 : 2.5;
  const r = 18 - stroke;
  const circ = 2 * Math.PI * r;
  const dash = value !== null ? (value / 100) * circ : 0;
  const color = value === null
    ? 'hsl(220, 10%, 78%)'
    : value >= 80 ? 'hsl(160,70%,50%)'
    : value >= 60 ? 'hsl(35,85%,55%)'
    : 'hsl(350,75%,60%)';
  const textColor = value === null
    ? 'hsl(220, 10%, 60%)'
    : value >= 80 ? 'hsl(160,70%,32%)'
    : value >= 60 ? 'hsl(35,85%,38%)'
    : 'hsl(350,75%,42%)';

  return (
    <div className="relative flex items-center justify-center" style={{ width: dim, height: dim }}>
      <svg className="absolute inset-0 -rotate-90" viewBox="0 0 36 36" width={dim} height={dim}>
        <circle cx="18" cy="18" r={r} fill="none" stroke="hsl(0,0%,93%)" strokeWidth={stroke} />
        <motion.circle
          cx="18" cy="18" r={r} fill="none"
          stroke={color} strokeWidth={stroke} strokeLinecap="round"
          initial={{ strokeDasharray: `0 ${circ}` }}
          animate={{ strokeDasharray: `${dash} ${circ}` }}
          transition={{ duration: 1.2, ease: 'easeOut', delay: 0.15 }}
        />
      </svg>
      <span
        className={cn(
          'relative tabular-nums font-bold',
          size === 'lg' ? 'text-[20px]' : size === 'sm' ? 'text-[10px]' : 'text-sm',
        )}
        style={{ color: textColor }}
      >
        {value === null ? '–' : value}
      </span>
    </div>
  );
}

// ═══════════════════════════════════════════
// Page Header — brand strip + portfolio summary
// ═══════════════════════════════════════════

function PageHeader({ portfolioEqi, draftsActive }: { portfolioEqi: number; draftsActive: number }) {
  return (
    <header className="relative z-20 border-b border-slate-200/40 bg-white/70 backdrop-blur-2xl">
      {/* Slow aurora sweep — same idiom as workshop toolbar */}
      <motion.div
        animate={{ x: ['110%', '-110%'] }}
        transition={{ repeat: Infinity, duration: 18, ease: 'linear' }}
        className="absolute inset-0 z-[-1] pointer-events-none overflow-hidden"
      >
        <div className="absolute -top-1/2 left-0 h-[200%] w-56 bg-gradient-to-r from-transparent via-[hsl(250,70%,60%,0.06)] to-transparent skew-x-[-15deg]" />
      </motion.div>

      <div className="max-w-[1440px] mx-auto px-8 py-4 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-4">
          <div className="relative group">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[hsl(250,70%,60%)] to-[hsl(185,80%,55%)] flex items-center justify-center shadow-md shadow-purple-500/20 transition-shadow group-hover:shadow-purple-500/35">
              <Sparkles className="w-5 h-5 text-white" strokeWidth={2} />
            </div>
            <div className="absolute -inset-1 rounded-2xl bg-gradient-to-br from-purple-400 to-cyan-400 opacity-20 blur-md -z-10" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2.5">
              <h1 className="text-[15px] font-bold text-slate-800 tracking-tight">Your Essays</h1>
              <div className="h-3.5 w-px bg-slate-200" />
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-[0.12em]">Application Studio</span>
            </div>
            <span className="text-[11px] text-slate-500 mt-0.5">Six essays open · Fall 2026 cycle</span>
          </div>
        </div>

        {/* Center: search */}
        <div className="flex-1 max-w-md mx-12">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search essays, prompts, schools…"
              className="w-full pl-9 pr-3 py-2 text-[12.5px] rounded-xl bg-slate-50/80 border border-slate-150 placeholder:text-slate-400 text-slate-700 outline-none focus:bg-white focus:border-purple-200 focus:ring-2 focus:ring-purple-100 transition"
            />
          </div>
        </div>

        {/* Right: portfolio + utilities */}
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-purple-50/60 border border-purple-100/60">
            <Shield className="w-3 h-3 text-purple-500" />
            <span className="text-[10px] font-semibold uppercase tracking-wider text-purple-600">Portfolio</span>
            <EqiGauge value={portfolioEqi} size="sm" />
          </div>
          <button className="relative p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-50 transition" aria-label="Notifications">
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-[hsl(350,75%,60%)]" />
          </button>
          <button className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-50 transition" aria-label="Settings">
            <Settings className="w-4 h-4" />
          </button>
          <div className="h-6 w-px bg-slate-150 mx-1" />
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center text-[11px] font-bold text-slate-600">TP</div>
        </div>
      </div>
    </header>
  );
}

// ═══════════════════════════════════════════
// Featured Essay Hero — the active draft, top of the page
// ═══════════════════════════════════════════

function FeaturedEssay({ essay, onOpen }: { essay: MockEssay; onOpen: () => void }) {
  const phaseTok = essay.phase ? PHASE_TOKENS[essay.phase] : null;
  const statusTok = STATUS_TOKENS[essay.status];
  const wordPct = Math.min(essay.wordCount / essay.wordLimit, 1);

  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="relative overflow-hidden rounded-3xl border border-slate-200/60 bg-gradient-to-br from-white via-[#fbfaff] to-[#f5f3ff]"
      style={{ boxShadow: '0 20px 60px -30px hsla(250, 70%, 60%, 0.35), 0 1px 0 0 hsla(0, 0%, 100%, 0.8) inset' }}
    >
      {/* Ambient halos */}
      <div className="absolute -top-32 -right-24 w-96 h-96 rounded-full bg-gradient-to-br from-purple-200/40 to-cyan-200/30 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -left-24 w-96 h-96 rounded-full bg-gradient-to-br from-rose-100/30 to-purple-100/30 blur-3xl pointer-events-none" />

      <div className="relative grid grid-cols-12 gap-10 px-10 py-9">
        {/* LEFT — context + preview */}
        <div className="col-span-7 flex flex-col gap-5">
          <div className="flex items-center gap-2.5">
            <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-purple-500">Currently writing</span>
            <div className="h-3 w-px bg-purple-200" />
            <div className="flex items-center gap-1.5 text-[10.5px] text-slate-500">
              <Clock className="w-3 h-3 text-slate-400" />
              <span>Last edit {formatRelative(essay.lastEditedMinutesAgo)}</span>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <SchoolMark mark={essay.schoolMark} hue={essay.schoolHue} size="lg" />
            <div className="flex-1 min-w-0">
              <div className="text-[10.5px] font-semibold uppercase tracking-wider text-slate-500">
                {essay.school} · {essay.promptLabel}
              </div>
              <h2 className="text-[28px] font-bold text-slate-900 tracking-[-0.02em] leading-[1.1] mt-1">
                {essay.title}
              </h2>
              <p className="text-[12px] text-slate-400 italic mt-1.5 truncate">&ldquo;{essay.promptPreview}&rdquo;</p>
            </div>
          </div>

          {/* Opening preview */}
          <div className="border-l-2 border-purple-200/70 pl-4 py-1">
            <p className="text-[14px] text-slate-700 leading-[1.7] line-clamp-3">{essay.opening}</p>
          </div>

          {/* Next move from the workshop */}
          {essay.nextMove && (
            <div className="flex items-start gap-2.5 px-4 py-3 rounded-xl bg-white/70 border border-purple-100/60">
              <Target className="w-3.5 h-3.5 text-purple-500 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <div className="text-[9.5px] font-semibold uppercase tracking-wider text-purple-600 mb-0.5">Your next move</div>
                <p className="text-[12.5px] text-slate-700 leading-snug">{essay.nextMove}</p>
              </div>
            </div>
          )}

          {/* CTA row */}
          <div className="flex items-center gap-3 pt-1">
            <button
              onClick={onOpen}
              className="group relative flex items-center gap-2 px-5 py-2.5 rounded-xl text-[13px] font-semibold text-white bg-gradient-to-r from-[hsl(250,70%,60%)] to-[hsl(185,80%,55%)] shadow-md shadow-purple-500/25 transition-all hover:shadow-purple-500/40 hover:scale-[1.015] active:scale-[0.99]"
            >
              <Pencil className="w-3.5 h-3.5" />
              Resume in Workshop
              <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
            </button>
            <button className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-[12.5px] font-medium text-slate-600 hover:text-slate-900 hover:bg-white/70 transition">
              <Eye className="w-3.5 h-3.5" />
              View read-only
            </button>
          </div>
        </div>

        {/* RIGHT — vital stats column */}
        <div className="col-span-5 flex flex-col justify-between gap-5">
          {/* EQI + phase headline */}
          <div className="flex items-center justify-between gap-6 rounded-2xl bg-white/70 border border-slate-200/50 px-5 py-4">
            <div className="flex items-center gap-4">
              <EqiGauge value={essay.eqi} size="lg" />
              <div>
                <div className="text-[9.5px] font-bold uppercase tracking-[0.14em] text-slate-400">Essay Quality</div>
                <div className="text-[12.5px] text-slate-700 mt-1 leading-snug max-w-[180px]">
                  Strong structural spine. Voice signals are landing. Thesis delivery is the next lift.
                </div>
              </div>
            </div>
          </div>

          {/* Phase + status pair */}
          <div className="grid grid-cols-2 gap-3">
            {/* Phase */}
            {phaseTok && (
              <div
                className="flex items-center gap-2.5 px-3.5 py-3 rounded-xl border"
                style={{ background: phaseTok.bg, borderColor: `${phaseTok.dot}25` }}
              >
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full rounded-full opacity-60" style={{ background: phaseTok.dot, animation: 'phase-pulse 3s ease-in-out infinite' }} />
                  <span className="relative inline-flex rounded-full h-2 w-2" style={{ background: phaseTok.dot }} />
                </span>
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider" style={{ color: phaseTok.text }}>{phaseTok.label}</div>
                  <div className="text-[9.5px]" style={{ color: phaseTok.text, opacity: 0.7 }}>Phase</div>
                </div>
              </div>
            )}
            {/* Status */}
            <div
              className="flex items-center gap-2 px-3.5 py-3 rounded-xl border"
              style={{ background: statusTok.bg, borderColor: statusTok.ring }}
            >
              <span style={{ color: statusTok.text }}>{statusTok.icon}</span>
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wider" style={{ color: statusTok.text }}>{statusTok.label}</div>
                <div className="text-[9.5px]" style={{ color: statusTok.text, opacity: 0.7 }}>
                  {essay.insightCount} insights · {essay.protectedStrengths} strengths
                </div>
              </div>
            </div>
          </div>

          {/* Word progress */}
          <div className="rounded-xl bg-white/70 border border-slate-200/50 px-5 py-4">
            <div className="flex items-baseline justify-between mb-2.5">
              <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">Word count</span>
              <span className="text-[13px] text-slate-700 tabular-nums font-semibold">
                {essay.wordCount}<span className="text-slate-300 font-normal">/{essay.wordLimit}</span>
              </span>
            </div>
            <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${wordPct * 100}%` }}
                transition={{ duration: 1, ease: 'easeOut', delay: 0.2 }}
                style={{ background: wordPct > 0.95 ? 'hsl(350,75%,60%)' : wordPct > 0.75 ? 'hsl(35,85%,55%)' : 'hsl(160,70%,50%)' }}
              />
            </div>
            <p className="text-[10px] text-slate-500 mt-2">
              {wordPct > 0.95 ? 'At the ceiling — every word has to earn its place.' : `${essay.wordLimit - essay.wordCount} words of room to deepen specific moments.`}
            </p>
          </div>
        </div>
      </div>
    </motion.section>
  );
}

// ═══════════════════════════════════════════
// Standard Essay Card — used in the grouped grid
// ═══════════════════════════════════════════

function EssayCard({ essay, onOpen, delay = 0 }: { essay: MockEssay; onOpen: () => void; delay?: number }) {
  const phaseTok = essay.phase ? PHASE_TOKENS[essay.phase] : null;
  const statusTok = STATUS_TOKENS[essay.status];
  const wordPct = essay.wordLimit > 0 ? Math.min(essay.wordCount / essay.wordLimit, 1) : 0;
  const isEmpty = essay.status === 'drafting' && essay.wordCount === 0;
  const isSubmitted = essay.status === 'submitted';

  return (
    <motion.button
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1], delay }}
      whileHover={isSubmitted ? undefined : { y: -3 }}
      onClick={onOpen}
      className={cn(
        'group relative text-left rounded-2xl border bg-white/80 backdrop-blur-sm overflow-hidden transition-all',
        isSubmitted
          ? 'border-slate-200/60 opacity-90'
          : 'border-slate-200/60 hover:border-purple-200/70 hover:shadow-[0_18px_40px_-22px_hsla(250,70%,60%,0.45)]',
      )}
    >
      {/* Subtle gradient sheen on hover */}
      {!isSubmitted && (
        <div className="absolute inset-0 bg-gradient-to-br from-purple-50/0 via-purple-50/0 to-cyan-50/0 group-hover:from-purple-50/30 group-hover:to-cyan-50/20 transition-all duration-500 pointer-events-none" />
      )}

      <div className={cn(
        'relative p-5 flex flex-col gap-3.5 min-h-[244px]',
        isSubmitted && 'grayscale-[0.35]',
      )}>
        {/* Top row: school + status */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <SchoolMark mark={essay.schoolMark} hue={essay.schoolHue} size="md" />
            <div className="flex flex-col min-w-0">
              <span className="text-[10.5px] font-semibold uppercase tracking-wider text-slate-500 truncate">{essay.school}</span>
              <span className="text-[11px] text-slate-400 truncate">{essay.promptLabel}</span>
            </div>
          </div>
          <div
            className="flex items-center gap-1.5 px-2 py-1 rounded-lg border text-[9.5px] font-semibold uppercase tracking-wider whitespace-nowrap"
            style={{ background: statusTok.bg, color: statusTok.text, borderColor: statusTok.ring }}
          >
            <span>{statusTok.icon}</span>
            <span>{statusTok.label}</span>
          </div>
        </div>

        {/* Title + EQI row */}
        <div className="flex items-start justify-between gap-3">
          <h3 className={cn(
            'text-[16px] font-semibold tracking-tight leading-snug',
            isEmpty ? 'text-slate-400 italic' : 'text-slate-900',
          )}>
            {essay.title}
          </h3>
          {essay.eqi !== null && (
            <div className="flex-shrink-0 -mt-1">
              <EqiGauge value={essay.eqi} size="sm" />
            </div>
          )}
        </div>

        {/* Opening or empty hint */}
        {isEmpty ? (
          <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-slate-50/80 border border-dashed border-slate-200 flex-1">
            <Pencil className="w-3 h-3 text-slate-400" />
            <span className="text-[11.5px] text-slate-500">Tap to start drafting — paste, type, or upload.</span>
          </div>
        ) : (
          <p className="text-[12.5px] text-slate-600 leading-[1.6] line-clamp-3 flex-1">{essay.opening}</p>
        )}

        {/* Footer: phase + words + time, all on one line */}
        <div className="flex items-center gap-2.5 pt-1 mt-auto">
          {phaseTok && (
            <div
              className="flex items-center gap-1.5 px-2 py-1 rounded-md text-[9.5px] font-bold uppercase tracking-wider whitespace-nowrap"
              style={{ background: phaseTok.bg, color: phaseTok.text }}
            >
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: phaseTok.dot }} />
              {phaseTok.label}
            </div>
          )}
          {!phaseTok && !isEmpty && (
            <div className="text-[9.5px] font-semibold uppercase tracking-wider text-slate-400 px-2 py-1 rounded-md bg-slate-50 whitespace-nowrap">Not analyzed</div>
          )}
          <div className="flex-1 min-w-0" />
          {essay.wordLimit > 0 && (
            <span className="text-[10px] text-slate-400 tabular-nums font-medium whitespace-nowrap">
              {essay.wordCount}/{essay.wordLimit} · {formatRelative(essay.lastEditedMinutesAgo)}
            </span>
          )}
        </div>

        {/* Word progress hairline */}
        {essay.wordLimit > 0 && (
          <div className="h-[3px] w-full bg-slate-100 rounded-full overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(wordPct * 100, 100)}%` }}
              transition={{ duration: 0.9, ease: 'easeOut', delay: 0.1 + delay }}
              style={{
                background: isSubmitted
                  ? 'hsl(220, 10%, 70%)'
                  : wordPct > 0.99 ? 'hsl(350,75%,60%)'
                  : wordPct > 0.75 ? 'hsl(35,85%,55%)'
                  : isEmpty ? 'hsl(220,10%,80%)'
                  : 'hsl(185,80%,55%)',
              }}
            />
          </div>
        )}

        {/* Hover affordance */}
        {!isSubmitted && (
          <div className="absolute top-5 right-5 opacity-0 group-hover:opacity-100 translate-x-1 group-hover:translate-x-0 transition-all duration-300 pointer-events-none">
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center shadow-md">
              <ArrowRight className="w-3 h-3 text-white" />
            </div>
          </div>
        )}
      </div>
    </motion.button>
  );
}

// ═══════════════════════════════════════════
// "+ New Essay" card — slots into the grid
// ═══════════════════════════════════════════

function NewEssayCard({ delay = 0 }: { delay?: number }) {
  return (
    <motion.button
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1], delay }}
      whileHover={{ y: -3 }}
      className="group relative text-left rounded-2xl border-2 border-dashed border-slate-200 bg-white/40 hover:border-purple-300/80 hover:bg-purple-50/20 transition-all min-h-[228px] flex flex-col items-center justify-center gap-3 p-6"
    >
      <div className="relative">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-100 to-cyan-100 flex items-center justify-center group-hover:from-purple-500 group-hover:to-cyan-500 transition-all duration-300">
          <Plus className="w-5 h-5 text-purple-500 group-hover:text-white transition-colors" strokeWidth={2.5} />
        </div>
        <div className="absolute -inset-1 rounded-2xl bg-gradient-to-br from-purple-300 to-cyan-300 opacity-0 group-hover:opacity-30 blur-md -z-10 transition-opacity" />
      </div>
      <div className="text-center">
        <div className="text-[13px] font-semibold text-slate-700 group-hover:text-purple-700 transition-colors">Add an essay</div>
        <div className="text-[11px] text-slate-400 mt-0.5">Common App, supplement, PIQ, or scholarship</div>
      </div>
    </motion.button>
  );
}

// ═══════════════════════════════════════════
// Category section — header + grid
// ═══════════════════════════════════════════

function CategorySection({
  category,
  essays,
  onOpen,
  showNew,
}: {
  category: EssayCategory;
  essays: MockEssay[];
  onOpen: (id: string) => void;
  showNew?: boolean;
}) {
  const tok = CATEGORY_TOKENS[category];
  return (
    <section>
      <div className="flex items-center gap-2.5 mb-4">
        <div className="w-7 h-7 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-500">
          {tok.icon}
        </div>
        <h2 className="text-[12.5px] font-bold uppercase tracking-[0.14em] text-slate-700">{tok.label}</h2>
        <div className="text-[11px] text-slate-400">· {essays.length}</div>
        <div className="flex-1 h-px bg-slate-100 ml-2" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {essays.map((e, i) => (
          <EssayCard key={e.id} essay={e} onOpen={() => onOpen(e.id)} delay={i * 0.04} />
        ))}
        {showNew && <NewEssayCard delay={essays.length * 0.04} />}
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════
// Filter chip row
// ═══════════════════════════════════════════

type FilterMode = 'all' | 'active' | 'stale' | 'submitted';

function FilterBar({ mode, onMode, counts }: { mode: FilterMode; onMode: (m: FilterMode) => void; counts: Record<FilterMode, number> }) {
  const chips: Array<{ id: FilterMode; label: string }> = [
    { id: 'all', label: 'All essays' },
    { id: 'active', label: 'In progress' },
    { id: 'stale', label: 'Needs re-read' },
    { id: 'submitted', label: 'Submitted' },
  ];
  return (
    <div className="flex items-center justify-between gap-3 mb-7">
      <div className="flex items-center gap-1.5">
        {chips.map((c) => {
          const active = mode === c.id;
          return (
            <motion.button
              key={c.id}
              onClick={() => onMode(c.id)}
              whileHover={!active ? { scale: 1.02 } : undefined}
              className={cn(
                'relative flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11.5px] font-semibold transition-colors',
                active ? 'text-white' : 'text-slate-500 hover:text-slate-800',
              )}
            >
              {active && (
                <motion.div
                  layoutId="libraryFilterIndicator"
                  className="absolute inset-0 rounded-full bg-gradient-to-r from-[hsl(250,70%,60%)] to-[hsl(185,80%,55%)] shadow-sm shadow-purple-500/25"
                  transition={{ type: 'spring', bounce: 0.18, duration: 0.45 }}
                />
              )}
              <span className="relative z-10">{c.label}</span>
              <span className={cn('relative z-10 tabular-nums', active ? 'text-white/80' : 'text-slate-400')}>{counts[c.id]}</span>
            </motion.button>
          );
        })}
      </div>
      <div className="flex items-center gap-1.5 text-[11.5px] text-slate-500">
        <FilterIcon className="w-3.5 h-3.5" />
        <span>Sorted by recent</span>
        <ChevronRight className="w-3 h-3 rotate-90 text-slate-400" />
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════
// Portfolio Pulse — narrow side strip on wide screens
// ═══════════════════════════════════════════

function PortfolioPulse({ portfolioEqi, draftCount, themes }: {
  portfolioEqi: number;
  draftCount: number;
  themes: Array<{ theme: string; appearsIn: number }>;
}) {
  return (
    <aside className="hidden xl:flex flex-col gap-4 w-[280px] shrink-0 sticky top-24 self-start">
      {/* Coherence card */}
      <div className="rounded-2xl border border-purple-100/60 bg-gradient-to-br from-white via-[#fbfaff] to-[#f3efff] p-5 overflow-hidden relative">
        <div className="absolute -top-12 -right-12 w-32 h-32 rounded-full bg-purple-200/30 blur-2xl pointer-events-none" />
        <div className="flex items-center gap-2 mb-3 relative">
          <Compass className="w-3.5 h-3.5 text-purple-500" />
          <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-purple-600">Portfolio Pulse</span>
        </div>
        <p className="text-[12.5px] text-slate-700 leading-[1.65] relative">
          Across your drafts, the system reads a consistent <em className="text-purple-700 not-italic font-semibold">systems-thinker</em> voice. Stanford and UC PIQ are pulling away from the spine — worth a coherence pass.
        </p>
      </div>

      {/* Recurring themes */}
      <div className="rounded-2xl border border-slate-200/60 bg-white/80 p-5">
        <div className="flex items-center gap-2 mb-3">
          <Layers className="w-3.5 h-3.5 text-cyan-500" />
          <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-600">Recurring threads</span>
        </div>
        <div className="space-y-2">
          {themes.map((t) => (
            <div key={t.theme} className="flex items-center gap-2.5">
              <div className="flex-1 min-w-0">
                <div className="text-[12px] text-slate-700 truncate">{t.theme}</div>
                <div className="h-[3px] bg-slate-100 rounded-full overflow-hidden mt-1">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-purple-400"
                    style={{ width: `${(t.appearsIn / draftCount) * 100}%` }}
                  />
                </div>
              </div>
              <div className="text-[10.5px] text-slate-400 tabular-nums whitespace-nowrap">{t.appearsIn}/{draftCount}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Portfolio cycle progress */}
      <div className="rounded-2xl border border-slate-200/60 bg-white/80 p-5">
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
          <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-600">Cycle progress</span>
        </div>
        <div className="flex items-baseline gap-1.5 mb-3">
          <span className="text-2xl font-bold text-slate-800 tabular-nums">2</span>
          <span className="text-[11px] text-slate-400">of 7 submitted</span>
        </div>
        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-cyan-400"
            initial={{ width: 0 }}
            animate={{ width: '28%' }}
            transition={{ duration: 1.1, ease: 'easeOut', delay: 0.3 }}
          />
        </div>
        <div className="flex items-center justify-between mt-2.5 text-[10.5px] text-slate-400">
          <span>Today</span>
          <span>Jan 1 deadline</span>
        </div>
      </div>

      {/* Help footer */}
      <div className="flex items-center gap-2 text-[11px] text-slate-400 pl-2">
        <Globe className="w-3 h-3" />
        <span>Coach is online · 24/7</span>
      </div>
    </aside>
  );
}

// ═══════════════════════════════════════════
// Main Page
// ═══════════════════════════════════════════

export default function AnnotationV2LibraryDemo() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<FilterMode>('all');

  // Featured = the essay edited most recently (and not submitted).
  const featured = useMemo(() => {
    return [...MOCK_ESSAYS]
      .filter((e) => e.status !== 'submitted')
      .sort((a, b) => a.lastEditedMinutesAgo - b.lastEditedMinutesAgo)[0];
  }, []);

  const rest = useMemo(() => MOCK_ESSAYS.filter((e) => e.id !== featured?.id), [featured]);

  const filteredRest = useMemo(() => {
    if (filter === 'all') return rest;
    if (filter === 'active') return rest.filter((e) => e.status === 'drafting' || e.status === 'analyzed' || e.status === 'analyzing');
    if (filter === 'stale') return rest.filter((e) => e.status === 'stale');
    return rest.filter((e) => e.status === 'submitted');
  }, [rest, filter]);

  const grouped = useMemo(() => {
    const g: Record<EssayCategory, MockEssay[]> = { 'common-app': [], supplement: [], piq: [], scholarship: [] };
    for (const e of filteredRest) g[e.category].push(e);
    return g;
  }, [filteredRest]);

  const counts: Record<FilterMode, number> = useMemo(() => ({
    all: rest.length,
    active: rest.filter((e) => e.status === 'drafting' || e.status === 'analyzed' || e.status === 'analyzing').length,
    stale: rest.filter((e) => e.status === 'stale').length,
    submitted: rest.filter((e) => e.status === 'submitted').length,
  }), [rest]);

  const portfolioEqi = useMemo(() => {
    const scored = MOCK_ESSAYS.filter((e) => e.eqi !== null);
    if (scored.length === 0) return 0;
    return Math.round(scored.reduce((acc, e) => acc + (e.eqi ?? 0), 0) / scored.length);
  }, []);

  const handleOpen = (_id: string) => {
    // All cards open the same workshop demo for now — the real product would
    // route by essay id.
    navigate('/annotation-v2-demo');
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-white via-[#fafaff] to-[#fdf9ff]">
      <PageHeader portfolioEqi={portfolioEqi} draftsActive={counts.active} />

      <ScrollArea className="h-[calc(100vh-65px)]">
        <div className="max-w-[1440px] mx-auto px-8 py-8 flex gap-8">
          {/* MAIN COLUMN */}
          <div className="flex-1 min-w-0 flex flex-col gap-10">
            {/* Featured */}
            {featured && (
              <FeaturedEssay essay={featured} onOpen={() => handleOpen(featured.id)} />
            )}

            {/* Filters + grouped grid */}
            <div>
              <FilterBar mode={filter} onMode={setFilter} counts={counts} />

              <AnimatePresence mode="wait">
                <motion.div
                  key={filter}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.2 }}
                  className="flex flex-col gap-10"
                >
                  {(['common-app', 'supplement', 'piq', 'scholarship'] as EssayCategory[]).map((cat) => {
                    const essays = grouped[cat];
                    if (essays.length === 0 && cat !== 'supplement') return null;
                    return (
                      <CategorySection
                        key={cat}
                        category={cat}
                        essays={essays}
                        onOpen={handleOpen}
                        showNew={cat === 'supplement'}
                      />
                    );
                  })}
                </motion.div>
              </AnimatePresence>
            </div>

            <footer className="pt-4 pb-8 flex items-center justify-between text-[11px] text-slate-400">
              <span>Drafts saved locally + synced to the cloud every 5s.</span>
              <a href="/annotation-v2-demo" className="hover:text-purple-600 transition flex items-center gap-1">
                Workshop demo <ArrowRight className="w-3 h-3" />
              </a>
            </footer>
          </div>

          {/* PORTFOLIO SIDEBAR */}
          <PortfolioPulse
            portfolioEqi={portfolioEqi}
            draftCount={MOCK_ESSAYS.length}
            themes={[
              { theme: 'Translation as power', appearsIn: 4 },
              { theme: 'Systems thinking', appearsIn: 5 },
              { theme: 'Invisible labor', appearsIn: 3 },
              { theme: 'Inherited responsibility', appearsIn: 3 },
            ]}
          />
        </div>
      </ScrollArea>
    </div>
  );
}
