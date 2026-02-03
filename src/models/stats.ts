import { z } from "zod";
import { IdSchema, TimestampSchema, DurationMsSchema } from "./common.ts";

// ============================================================================
// Card Statistics
// ============================================================================

/**
 * Computed statistics for a single card
 */
export const CardStatsSchema = z.object({
  cardId: IdSchema,
  /** Accuracy as percentage (0-100) */
  accuracy: z.number().min(0).max(100),
  /** Total attempts */
  totalAttempts: z.number().int().nonnegative(),
  /** Correct attempts */
  correctAttempts: z.number().int().nonnegative(),
  /** Average response time (ms) */
  avgResponseTimeMs: DurationMsSchema,
  /** Current streak */
  currentStreak: z.number().int().nonnegative(),
  /** Best streak */
  bestStreak: z.number().int().nonnegative(),
  /** Mastery level (0-5) */
  masteryLevel: z.number().int().min(0).max(5),
  /** Days until next review (negative if overdue) */
  daysUntilReview: z.number().int().optional(),
  /** Learning status */
  status: z.enum(["new", "learning", "review", "mastered", "overdue"]),
});
export type CardStats = z.infer<typeof CardStatsSchema>;

// ============================================================================
// Quiz Statistics
// ============================================================================

/**
 * Computed statistics for a quiz
 */
export const QuizStatsSchema = z.object({
  quizId: IdSchema,
  /** Total cards in quiz */
  totalCards: z.number().int().nonnegative(),
  /** Cards never studied */
  newCards: z.number().int().nonnegative(),
  /** Cards in learning phase */
  learningCards: z.number().int().nonnegative(),
  /** Cards in review phase */
  reviewCards: z.number().int().nonnegative(),
  /** Cards fully mastered */
  masteredCards: z.number().int().nonnegative(),
  /** Cards overdue for review */
  overdueCards: z.number().int().nonnegative(),
  /** Overall accuracy (0-100) */
  overallAccuracy: z.number().min(0).max(100),
  /** Total study time (ms) */
  totalStudyTimeMs: DurationMsSchema,
  /** Total sessions */
  totalSessions: z.number().int().nonnegative(),
  /** Average session duration (ms) */
  avgSessionDurationMs: DurationMsSchema,
  /** Completion percentage (mastered / total) */
  completionPercent: z.number().min(0).max(100),
  /** First studied date */
  firstStudied: TimestampSchema.optional(),
  /** Last studied date */
  lastStudied: TimestampSchema.optional(),
  /** Estimated review time today (minutes) */
  estimatedReviewMinutes: z.number().nonnegative(),
});
export type QuizStats = z.infer<typeof QuizStatsSchema>;

// ============================================================================
// Session Statistics
// ============================================================================

/**
 * Statistics for the current/recent session
 */
export const SessionStatsSchema = z.object({
  /** Session ID */
  sessionId: IdSchema,
  /** Duration so far (ms) */
  durationMs: DurationMsSchema,
  /** Questions answered */
  questionsAnswered: z.number().int().nonnegative(),
  /** Correct answers */
  correctCount: z.number().int().nonnegative(),
  /** Incorrect answers */
  incorrectCount: z.number().int().nonnegative(),
  /** Current accuracy (0-100) */
  accuracy: z.number().min(0).max(100),
  /** Current streak */
  currentStreak: z.number().int().nonnegative(),
  /** Best streak this session */
  bestStreak: z.number().int().nonnegative(),
  /** Average response time (ms) */
  avgResponseTimeMs: DurationMsSchema,
  /** Cards remaining in queue */
  cardsRemaining: z.number().int().nonnegative(),
  /** Progress percentage (0-100) */
  progressPercent: z.number().min(0).max(100),
});
export type SessionStats = z.infer<typeof SessionStatsSchema>;

// ============================================================================
// Historical Statistics (Time-series data)
// ============================================================================

/**
 * Daily study statistics for tracking over time
 */
export const DailyStatsSchema = z.object({
  /** Date in YYYY-MM-DD format */
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  /** Number of sessions */
  sessions: z.number().int().nonnegative(),
  /** Cards reviewed */
  cardsReviewed: z.number().int().nonnegative(),
  /** Total correct answers */
  correctCount: z.number().int().nonnegative(),
  /** Total incorrect answers */
  incorrectCount: z.number().int().nonnegative(),
  /** Time spent studying (ms) */
  studyTimeMs: DurationMsSchema,
  /** New cards learned */
  newCardsLearned: z.number().int().nonnegative(),
  /** Cards mastered */
  cardsMastered: z.number().int().nonnegative(),
});
export type DailyStats = z.infer<typeof DailyStatsSchema>;

/**
 * Aggregated historical statistics
 */
export const HistoricalStatsSchema = z.object({
  /** Daily statistics (last N days) */
  daily: z.array(DailyStatsSchema).default([]),
  /** Total lifetime statistics */
  lifetime: z.object({
    /** Total sessions ever */
    totalSessions: z.number().int().nonnegative(),
    /** Total cards reviewed ever */
    totalCardsReviewed: z.number().int().nonnegative(),
    /** Total correct answers ever */
    totalCorrect: z.number().int().nonnegative(),
    /** Total time spent (ms) */
    totalTimeMs: DurationMsSchema,
    /** Longest day streak */
    longestDayStreak: z.number().int().nonnegative(),
    /** Current day streak */
    currentDayStreak: z.number().int().nonnegative(),
    /** Total quizzes studied */
    quizzesStudied: z.number().int().nonnegative(),
    /** Total cards mastered */
    totalCardsMastered: z.number().int().nonnegative(),
    /** Member since */
    memberSince: TimestampSchema,
  }),
  /** Computed trends */
  trends: z
    .object({
      /** Accuracy trend (last 7 days vs previous 7) */
      accuracyTrend: z.number(), // positive = improving
      /** Study time trend */
      studyTimeTrend: z.number(),
      /** Cards per day trend */
      cardsPerDayTrend: z.number(),
    })
    .optional(),
});
export type HistoricalStats = z.infer<typeof HistoricalStatsSchema>;

// ============================================================================
// Weak Cards Analysis
// ============================================================================

/**
 * Analysis of weak/difficult cards
 */
export const WeakCardAnalysisSchema = z.object({
  /** Card ID */
  cardId: IdSchema,
  /** Quiz ID */
  quizId: IdSchema,
  /** Card front text (for display) */
  frontText: z.string(),
  /** Why it's considered weak */
  reasons: z.array(
    z.enum([
      "low-accuracy", // Below threshold accuracy
      "slow-response", // Takes too long to answer
      "frequent-lapses", // Often forgotten after learning
      "low-mastery", // Low mastery level
      "overdue", // Significantly overdue for review
      "recent-mistakes", // Made mistakes recently
    ])
  ),
  /** Accuracy percentage */
  accuracy: z.number().min(0).max(100),
  /** Number of lapses */
  lapses: z.number().int().nonnegative(),
  /** Priority score (higher = needs more attention) */
  priorityScore: z.number().min(0).max(100),
});
export type WeakCardAnalysis = z.infer<typeof WeakCardAnalysisSchema>;
