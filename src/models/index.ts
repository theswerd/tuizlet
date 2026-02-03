// Re-export all models from a single entry point

// Common types
export * from "./common.ts";

// Core models
export * from "./card.ts";
export * from "./question.ts";
export * from "./quiz.ts";

// Progress tracking
export * from "./progress.ts";
export * from "./session.ts";

// Statistics
export * from "./stats.ts";

// Theming
export * from "./theme.ts";

// Utility functions for working with schemas
import { QuizSchema } from "./quiz.ts";
import { UserProgressSchema } from "./progress.ts";

/**
 * Parse and validate a quiz JSON file
 */
export function parseQuizFile(json: unknown) {
  return QuizSchema.parse(json);
}

/**
 * Safely parse a quiz file with error handling
 */
export function safeParseQuizFile(json: unknown) {
  return QuizSchema.safeParse(json);
}

/**
 * Parse and validate user progress JSON
 */
export function parseUserProgress(json: unknown) {
  return UserProgressSchema.parse(json);
}

/**
 * Safely parse user progress with error handling
 */
export function safeParseUserProgress(json: unknown) {
  return UserProgressSchema.safeParse(json);
}
