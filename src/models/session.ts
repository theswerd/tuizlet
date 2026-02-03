import { z } from "zod";
import { IdSchema, TimestampSchema, EpochMsSchema, DurationMsSchema } from "./common.ts";
import { QuestionSchema, QuestionTypes } from "./question.ts";
import { AttemptSchema } from "./progress.ts";

// ============================================================================
// Study Mode
// ============================================================================

/**
 * Different modes of studying
 */
export const StudyModes = [
  "learn", // Focus on new/unfamiliar cards
  "review", // Spaced repetition review of due cards
  "test", // Timed test mode, no hints
  "practice", // Free practice, any card
  "cram", // Review all cards regardless of schedule
  "mistakes", // Focus on previously missed cards
] as const;
export type StudyMode = (typeof StudyModes)[number];

export const StudyModeSchema = z.enum(StudyModes);

// ============================================================================
// Session Configuration
// ============================================================================

/**
 * Configuration for a study session
 */
export const SessionConfigSchema = z.object({
  /** Study mode */
  mode: StudyModeSchema.default("learn"),
  /** Maximum number of cards to study (0 = unlimited) */
  cardLimit: z.number().int().nonnegative().default(0),
  /** Maximum session duration in minutes (0 = unlimited) */
  timeLimitMinutes: z.number().int().nonnegative().default(0),
  /** Question types to use */
  questionTypes: z.array(z.enum(QuestionTypes)).optional(),
  /** Whether to shuffle cards */
  shuffle: z.boolean().default(true),
  /** Whether to allow hints */
  allowHints: z.boolean().default(true),
  /** Whether to show immediate feedback */
  showFeedback: z.boolean().default(true),
  /** Focus on specific tags */
  filterTags: z.array(z.string()).optional(),
  /** Only review cards with mastery level at or below this */
  maxMasteryLevel: z.number().int().min(0).max(5).optional(),
});
export type SessionConfig = z.infer<typeof SessionConfigSchema>;

// ============================================================================
// Session Question State
// ============================================================================

/**
 * State of a question within a session
 */
export const SessionQuestionStateSchema = z.object({
  /** The question being asked */
  question: QuestionSchema,
  /** Index in the session queue */
  index: z.number().int().nonnegative(),
  /** When this question was presented */
  presentedAt: EpochMsSchema.optional(),
  /** Current status */
  status: z.enum(["pending", "active", "answered", "skipped"]).default("pending"),
  /** The attempt record if answered */
  attempt: AttemptSchema.optional(),
});
export type SessionQuestionState = z.infer<typeof SessionQuestionStateSchema>;

// ============================================================================
// Active Study Session
// ============================================================================

/**
 * An active study session (held in memory during study)
 */
export const StudySessionSchema = z.object({
  /** Unique session identifier */
  id: IdSchema,
  /** Quiz being studied */
  quizId: IdSchema,
  /** Session configuration */
  config: SessionConfigSchema,
  /** When the session started */
  startedAt: TimestampSchema,
  /** When the session ended (if completed) */
  endedAt: TimestampSchema.optional(),
  /** Current status */
  status: z.enum(["active", "paused", "completed", "abandoned"]).default("active"),

  // === Question Queue ===
  /** Queue of questions for this session */
  questions: z.array(SessionQuestionStateSchema).default([]),
  /** Current question index */
  currentIndex: z.number().int().nonnegative().default(0),

  // === Running Statistics ===
  /** Cards seen this session */
  cardsSeen: z.number().int().nonnegative().default(0),
  /** Correct answers this session */
  correctCount: z.number().int().nonnegative().default(0),
  /** Incorrect answers this session */
  incorrectCount: z.number().int().nonnegative().default(0),
  /** Skipped questions */
  skippedCount: z.number().int().nonnegative().default(0),
  /** Total time spent answering (ms) */
  totalAnswerTimeMs: DurationMsSchema.default(0),
  /** Hints used this session */
  hintsUsed: z.number().int().nonnegative().default(0),
});
export type StudySession = z.infer<typeof StudySessionSchema>;

// ============================================================================
// Session Summary (persisted after session ends)
// ============================================================================

/**
 * Summary of a completed study session
 */
export const SessionSummarySchema = z.object({
  /** Session identifier */
  sessionId: IdSchema,
  /** Quiz studied */
  quizId: IdSchema,
  /** Study mode used */
  mode: StudyModeSchema,
  /** When session started */
  startedAt: TimestampSchema,
  /** When session ended */
  endedAt: TimestampSchema,
  /** Total duration (ms) */
  durationMs: DurationMsSchema,

  // === Results ===
  /** Total questions presented */
  totalQuestions: z.number().int().nonnegative(),
  /** Correct answers */
  correctCount: z.number().int().nonnegative(),
  /** Incorrect answers */
  incorrectCount: z.number().int().nonnegative(),
  /** Skipped questions */
  skippedCount: z.number().int().nonnegative(),
  /** Accuracy percentage (0-100) */
  accuracy: z.number().min(0).max(100),
  /** Average response time (ms) */
  avgResponseTimeMs: DurationMsSchema,
  /** Cards that were learned (new -> learning) */
  cardsLearned: z.number().int().nonnegative().default(0),
  /** Cards that were mastered this session */
  cardsMastered: z.number().int().nonnegative().default(0),
});
export type SessionSummary = z.infer<typeof SessionSummarySchema>;

// ============================================================================
// Session History (stored in user progress)
// ============================================================================

export const SessionHistorySchema = z.object({
  /** Summaries of past sessions, newest first */
  sessions: z.array(SessionSummarySchema).default([]),
  /** Maximum sessions to keep in history */
  maxHistory: z.number().int().positive().default(100),
});
export type SessionHistory = z.infer<typeof SessionHistorySchema>;
