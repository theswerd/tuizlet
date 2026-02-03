import { z } from "zod";

// ============================================================================
// Common ID and Timestamp Schemas
// ============================================================================

/**
 * Unique identifier schema - uses nanoid format or UUID
 */
export const IdSchema = z.string().min(1).max(64);
export type Id = z.infer<typeof IdSchema>;

/**
 * ISO 8601 timestamp schema
 */
export const TimestampSchema = z.string().datetime();
export type Timestamp = z.infer<typeof TimestampSchema>;

/**
 * Unix epoch milliseconds (for faster comparisons in algorithms)
 */
export const EpochMsSchema = z.number().int().nonnegative();
export type EpochMs = z.infer<typeof EpochMsSchema>;

/**
 * Duration in milliseconds (for response times)
 */
export const DurationMsSchema = z.number().int().nonnegative();
export type DurationMs = z.infer<typeof DurationMsSchema>;

// ============================================================================
// Spaced Repetition Support
// ============================================================================

/**
 * Mastery level from 0-5 (SM-2 algorithm compatible)
 * 0 = Complete blackout, no recall
 * 1 = Incorrect response, but upon seeing correct answer, remembered
 * 2 = Incorrect response, but correct answer seemed easy to recall
 * 3 = Correct response with serious difficulty
 * 4 = Correct response after hesitation
 * 5 = Perfect response with no hesitation
 */
export const MasteryLevelSchema = z.number().int().min(0).max(5);
export type MasteryLevel = z.infer<typeof MasteryLevelSchema>;

/**
 * Ease factor for SM-2 algorithm (default 2.5, min 1.3)
 */
export const EaseFactorSchema = z.number().min(1.3).max(5.0).default(2.5);
export type EaseFactor = z.infer<typeof EaseFactorSchema>;

/**
 * Interval in days for next review
 */
export const IntervalDaysSchema = z.number().nonnegative().default(0);
export type IntervalDays = z.infer<typeof IntervalDaysSchema>;

// ============================================================================
// Fuzzy Matching Configuration
// ============================================================================

/**
 * Configuration for text comparison/fuzzy matching
 * Useful for languages with accented characters (Spanish, French, etc.)
 */
export const FuzzyMatchConfigSchema = z.object({
  /** Ignore case differences */
  ignoreCase: z.boolean().default(true),
  /** Ignore accent marks (e.g., treat 'e' and 'é' as equivalent) */
  ignoreAccents: z.boolean().default(false),
  /** Ignore leading/trailing whitespace */
  trimWhitespace: z.boolean().default(true),
  /** Ignore multiple spaces (collapse to single) */
  normalizeWhitespace: z.boolean().default(true),
  /** Allow minor typos (Levenshtein distance threshold) */
  allowTypoDistance: z.number().int().min(0).max(3).default(0),
  /** Accept alternative answers */
  acceptAlternatives: z.boolean().default(true),
});
export type FuzzyMatchConfig = z.infer<typeof FuzzyMatchConfigSchema>;

// ============================================================================
// Tags and Metadata
// ============================================================================

/**
 * Tag for categorization
 */
export const TagSchema = z.string().min(1).max(50);
export type Tag = z.infer<typeof TagSchema>;

/**
 * Generic metadata that can be attached to quizzes/cards
 */
export const MetadataSchema = z.record(z.string(), z.unknown()).optional();
export type Metadata = z.infer<typeof MetadataSchema>;
