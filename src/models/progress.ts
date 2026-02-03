import { z } from "zod";
import {
  IdSchema,
  TimestampSchema,
  EpochMsSchema,
  DurationMsSchema,
  MasteryLevelSchema,
  EaseFactorSchema,
  IntervalDaysSchema,
} from "./common.ts";
import { QuestionTypes } from "./question.ts";

// ============================================================================
// Individual Attempt Record
// ============================================================================

/**
 * A single attempt at answering a question
 */
export const AttemptSchema = z.object({
  /** When this attempt occurred */
  timestamp: TimestampSchema,
  /** Was the answer correct? */
  correct: z.boolean(),
  /** Time taken to answer in milliseconds */
  responseTimeMs: DurationMsSchema,
  /** The question type used */
  questionType: z.enum(QuestionTypes),
  /** User's response (for review/debugging) */
  userResponse: z.string().optional(),
  /** Self-reported confidence (1-5) if applicable */
  confidence: z.number().int().min(1).max(5).optional(),
  /** Whether a hint was used */
  usedHint: z.boolean().default(false),
});
export type Attempt = z.infer<typeof AttemptSchema>;

// ============================================================================
// Per-Card Progress
// ============================================================================

/**
 * Learning progress for a single card
 */
export const CardProgressSchema = z.object({
  /** Reference to the card */
  cardId: IdSchema,
  /** All attempts on this card */
  attempts: z.array(AttemptSchema).default([]),

  // === Aggregate Statistics ===
  /** Total times this card has been shown */
  timesSeen: z.number().int().nonnegative().default(0),
  /** Total times answered correctly */
  timesCorrect: z.number().int().nonnegative().default(0),
  /** Current streak of correct answers */
  currentStreak: z.number().int().nonnegative().default(0),
  /** Best streak ever achieved */
  bestStreak: z.number().int().nonnegative().default(0),
  /** Timestamp of last review */
  lastSeen: TimestampSchema.optional(),
  /** Average response time in ms */
  avgResponseTimeMs: DurationMsSchema.optional(),

  // === Spaced Repetition Data (SM-2 compatible) ===
  /** Current mastery level (0-5) */
  masteryLevel: MasteryLevelSchema.default(0),
  /** Ease factor for interval calculation */
  easeFactor: EaseFactorSchema,
  /** Current interval in days */
  intervalDays: IntervalDaysSchema,
  /** Number of consecutive successful reviews */
  repetitions: z.number().int().nonnegative().default(0),
  /** Next scheduled review date (epoch ms for easy comparison) */
  nextReviewAt: EpochMsSchema.optional(),

  // === Learning State ===
  /** Whether card is in "learning" mode vs "review" mode */
  isLearning: z.boolean().default(true),
  /** Number of times card has been "lapsed" (forgotten after learning) */
  lapses: z.number().int().nonnegative().default(0),
});
export type CardProgress = z.infer<typeof CardProgressSchema>;

// ============================================================================
// Per-Quiz Progress
// ============================================================================

/**
 * Overall progress for a quiz set
 */
export const QuizProgressSchema = z.object({
  /** Reference to the quiz */
  quizId: IdSchema,
  /** Progress for each card in the quiz */
  cards: z.record(IdSchema, CardProgressSchema).default({}),

  // === Aggregate Statistics ===
  /** Total study sessions on this quiz */
  totalSessions: z.number().int().nonnegative().default(0),
  /** Total time spent studying (ms) */
  totalTimeMs: DurationMsSchema.default(0),
  /** Timestamp of first study */
  firstStudied: TimestampSchema.optional(),
  /** Timestamp of most recent study */
  lastStudied: TimestampSchema.optional(),
  /** Number of cards fully mastered (level 5) */
  cardsMastered: z.number().int().nonnegative().default(0),
  /** Number of cards currently in learning */
  cardsLearning: z.number().int().nonnegative().default(0),
  /** Number of cards never seen */
  cardsNew: z.number().int().nonnegative().default(0),
});
export type QuizProgress = z.infer<typeof QuizProgressSchema>;

// ============================================================================
// Complete User Progress (stored in user-data/progress.json)
// ============================================================================

export const UserProgressSchemaVersionSchema = z.literal(1);

/**
 * All user progress data
 */
export const UserProgressSchema = z.object({
  /** Schema version for migrations */
  $schema: UserProgressSchemaVersionSchema.optional(),
  /** User identifier (for future multi-user support) */
  userId: IdSchema.default("default"),
  /** Progress per quiz */
  quizzes: z.record(IdSchema, QuizProgressSchema).default({}),
  /** Global statistics */
  global: z
    .object({
      /** Total study sessions across all quizzes */
      totalSessions: z.number().int().nonnegative().default(0),
      /** Total cards reviewed across all quizzes */
      totalCardsReviewed: z.number().int().nonnegative().default(0),
      /** Total time spent studying (ms) */
      totalTimeMs: DurationMsSchema.default(0),
      /** Longest streak of consecutive days studied */
      longestDayStreak: z.number().int().nonnegative().default(0),
      /** Current streak of consecutive days studied */
      currentDayStreak: z.number().int().nonnegative().default(0),
      /** Last date studied (YYYY-MM-DD format) */
      lastStudyDate: z.string().optional(),
    })
    .default({}),
  /** Last modified timestamp */
  updatedAt: TimestampSchema,
});
export type UserProgress = z.infer<typeof UserProgressSchema>;
