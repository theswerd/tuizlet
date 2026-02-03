import { z } from "zod";
import { IdSchema, TimestampSchema, TagSchema, FuzzyMatchConfigSchema } from "./common.ts";
import { CardSchema } from "./card.ts";
import { QuestionGenerationConfigSchema } from "./question.ts";

// ============================================================================
// Quiz Schema Version (for migrations)
// ============================================================================

export const QuizSchemaVersionSchema = z.literal(1);
export type QuizSchemaVersion = z.infer<typeof QuizSchemaVersionSchema>;

// ============================================================================
// Quiz Metadata
// ============================================================================

export const QuizMetadataSchema = z.object({
  /** Display title */
  title: z.string().min(1).max(200),
  /** Optional description */
  description: z.string().max(2000).optional(),
  /** Author name or identifier */
  author: z.string().optional(),
  /** Language of the content (ISO 639-1 code) */
  language: z.string().length(2).optional(),
  /** Target language for translations (e.g., Spanish vocab) */
  targetLanguage: z.string().length(2).optional(),
  /** Creation timestamp */
  createdAt: TimestampSchema,
  /** Last modification timestamp */
  updatedAt: TimestampSchema.optional(),
  /** Version string for user reference */
  version: z.string().optional(),
  /** Tags for categorization and search */
  tags: z.array(TagSchema).default([]),
  /** Source URL or reference */
  source: z.string().url().optional(),
  /** Difficulty level (1-5) */
  difficulty: z.number().int().min(1).max(5).optional(),
  /** Estimated study time in minutes */
  estimatedMinutes: z.number().positive().optional(),
});
export type QuizMetadata = z.infer<typeof QuizMetadataSchema>;

// ============================================================================
// Complete Quiz Schema (what's stored in JSON files)
// ============================================================================

/**
 * Complete quiz set loaded from a JSON file
 */
export const QuizSchema = z.object({
  /** Schema version for migration support */
  $schema: QuizSchemaVersionSchema.optional(),
  /** Unique identifier (defaults to filename if not provided) */
  id: IdSchema.optional(),
  /** Quiz metadata */
  metadata: QuizMetadataSchema,
  /** Default fuzzy matching config for all cards */
  defaultMatchConfig: FuzzyMatchConfigSchema.optional(),
  /** Question generation configuration */
  questionConfig: QuestionGenerationConfigSchema.optional(),
  /** The cards/terms in this quiz */
  cards: z.array(CardSchema).min(1),
});
export type Quiz = z.infer<typeof QuizSchema>;

// ============================================================================
// Quiz Index Entry (for listing available quizzes)
// ============================================================================

/**
 * Lightweight quiz info for displaying in quiz list
 * Generated from scanning quiz files, not stored
 */
export const QuizIndexEntrySchema = z.object({
  /** Quiz ID */
  id: IdSchema,
  /** File path relative to quizzes directory */
  path: z.string(),
  /** Quiz metadata */
  metadata: QuizMetadataSchema,
  /** Number of cards */
  cardCount: z.number().int().nonnegative(),
  /** File modification timestamp */
  fileModified: TimestampSchema,
});
export type QuizIndexEntry = z.infer<typeof QuizIndexEntrySchema>;

// ============================================================================
// Quiz Collection (for organizing multiple quizzes)
// ============================================================================

export const QuizCollectionSchema = z.object({
  /** Collection ID */
  id: IdSchema,
  /** Display name */
  name: z.string(),
  /** Description */
  description: z.string().optional(),
  /** Quiz IDs in this collection */
  quizIds: z.array(IdSchema),
  /** Creation timestamp */
  createdAt: TimestampSchema,
});
export type QuizCollection = z.infer<typeof QuizCollectionSchema>;
