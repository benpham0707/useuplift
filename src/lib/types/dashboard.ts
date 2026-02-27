/**
 * Dashboard Type Definitions
 *
 * Comprehensive TypeScript interfaces for the Uplift Dashboard Home
 * All fields are strictly typed - no any types allowed
 */

// ============================================
// Enums
// ============================================

export enum QuestTool {
  Journal = 'Journal',
  Scanner = 'Scanner',
  Workshop = 'Workshop',
  PIQ = 'PIQ',
  Insights = 'Insights',
  Schools = 'Schools'
}

export enum EventType {
  Deadline = 'deadline',
  Milestone = 'milestone',
  Appointment = 'appointment',
  Reminder = 'reminder'
}

export enum EventUrgency {
  Overdue = 'overdue',
  Today = 'today',
  ThisWeek = 'this_week',
  Upcoming = 'upcoming'
}

export enum StatTrend {
  Up = 'up',
  Down = 'down',
  Stable = 'stable'
}

export enum CharacterTitle {
  FreshmanExplorer = 'Freshman Explorer',
  RisingScholar = 'Rising Scholar',
  StrategicThinker = 'Strategic Thinker',
  AdmissionsContender = 'Admissions Contender',
  EliteApplicant = 'Elite Applicant'
}

// ============================================
// Core Interfaces
// ============================================

/**
 * Individual quest item
 */
export interface Quest {
  id: string;
  title: string;
  description: string;
  tool: QuestTool;
  completed: boolean;
  completed_at?: string; // ISO date string
  route?: string; // Where to navigate when clicked
}

/**
 * Daily quests for a specific date
 */
export interface DailyQuests {
  id: string;
  user_id: string;
  quest_date: string; // YYYY-MM-DD
  quests: Quest[];
  completed_count: number;
  credits_earned: number;
  created_at: string;
  updated_at: string;
}

/**
 * User streak tracking
 */
export interface UserStreak {
  id: string;
  user_id: string;
  current_streak: number;
  longest_streak: number;
  last_quest_date: string | null; // YYYY-MM-DD
  total_credits_earned: number;
  updated_at: string;
}

/**
 * Character stats with level thresholds
 * Level 1: Freshman Explorer (0 XP)
 * Level 2: Rising Scholar (100 XP)
 * Level 3: Strategic Thinker (250 XP)
 * Level 4: Admissions Contender (500 XP)
 * Level 5: Elite Applicant (1000 XP)
 */
export interface CharacterStats {
  id: string;
  user_id: string;
  narrative_score: number; // 0-100
  impact_score: number; // 0-100
  academics_score: number; // 0-100
  curiosity_score: number; // 0-100
  network_score: number; // 0-100
  narrative_prev: number;
  impact_prev: number;
  academics_prev: number;
  curiosity_prev: number;
  network_prev: number;
  level: number; // 1-5
  xp: number;
  title: CharacterTitle;
  updated_at: string;
}

/**
 * Calendar event
 */
export interface DashboardEvent {
  id: string;
  user_id: string;
  title: string;
  event_date: string; // ISO date string
  event_type: EventType;
  urgency: EventUrgency;
  related_link?: string;
  description?: string;
  is_completed: boolean;
  created_at: string;
}

/**
 * AI-generated portfolio suggestion
 */
export interface PortfolioSuggestion {
  id: string;
  user_id: string;
  category: string;
  suggestion_text: string;
  related_tool: string;
  related_link?: string;
  is_dismissed: boolean;
  created_at: string;
}

/**
 * Writing progress tracking
 */
export interface WritingProgress {
  current_score: number;
  target_score: number;
  gap: number;
  trend: StatTrend;
  last_updated?: string;
  target_school?: string;
}

/**
 * Quick action button
 */
export interface QuickAction {
  id: string;
  label: string;
  icon: string; // Icon name
  route: string;
  description?: string;
}

/**
 * Stat display with trend
 */
export interface StatWithTrend {
  name: string;
  current: number;
  previous: number;
  trend: StatTrend;
  suggestion?: string;
}

// ============================================
// Aggregate Types
// ============================================

/**
 * Complete dashboard data
 */
export interface DashboardData {
  dailyQuests?: DailyQuests;
  streak?: UserStreak;
  characterStats?: CharacterStats;
  events: DashboardEvent[];
  suggestions: PortfolioSuggestion[];
  writingProgress?: WritingProgress;
  portfolioScore?: number;
}

// ============================================
// Helper Types
// ============================================

/**
 * Level threshold definition
 */
export interface LevelThreshold {
  level: number;
  title: CharacterTitle;
  xpRequired: number;
}

/**
 * Level thresholds constant
 */
export const LEVEL_THRESHOLDS: LevelThreshold[] = [
  { level: 1, title: CharacterTitle.FreshmanExplorer, xpRequired: 0 },
  { level: 2, title: CharacterTitle.RisingScholar, xpRequired: 100 },
  { level: 3, title: CharacterTitle.StrategicThinker, xpRequired: 250 },
  { level: 4, title: CharacterTitle.AdmissionsContender, xpRequired: 500 },
  { level: 5, title: CharacterTitle.EliteApplicant, xpRequired: 1000 }
];

/**
 * Get the next level threshold
 */
export function getNextLevelThreshold(currentXP: number): LevelThreshold | null {
  for (const threshold of LEVEL_THRESHOLDS) {
    if (currentXP < threshold.xpRequired) {
      return threshold;
    }
  }
  return null; // Max level reached
}

/**
 * Get current level from XP
 */
export function getCurrentLevel(xp: number): LevelThreshold {
  let current = LEVEL_THRESHOLDS[0];
  for (const threshold of LEVEL_THRESHOLDS) {
    if (xp >= threshold.xpRequired) {
      current = threshold;
    }
  }
  return current;
}

/**
 * Calculate stat trend
 */
export function calculateStatTrend(current: number, previous: number): StatTrend {
  if (current > previous) return StatTrend.Up;
  if (current < previous) return StatTrend.Down;
  return StatTrend.Stable;
}

/**
 * Calculate event urgency based on date
 */
export function calculateEventUrgency(eventDate: string | Date): EventUrgency {
  const now = new Date();
  const event = new Date(eventDate);
  const diffTime = event.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return EventUrgency.Overdue;
  if (diffDays === 0) return EventUrgency.Today;
  if (diffDays <= 7) return EventUrgency.ThisWeek;
  return EventUrgency.Upcoming;
}

/**
 * Format relative date text
 */
export function formatRelativeDate(date: string | Date): string {
  const now = new Date();
  const target = new Date(date);
  const diffTime = target.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Tomorrow';
  if (diffDays === -1) return 'Yesterday';
  if (diffDays > 0 && diffDays <= 7) return `In ${diffDays} days`;
  if (diffDays < 0) return `${Math.abs(diffDays)} days ago`;

  // Format as MM/DD for dates further out
  const month = target.getMonth() + 1;
  const day = target.getDate();
  return `${month}/${day}`;
}