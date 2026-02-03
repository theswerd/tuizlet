import { z } from "zod";
import { IdSchema, FuzzyMatchConfigSchema } from "./common.ts";

// ============================================================================
// Base Question Schema
// ============================================================================

const BaseQuestionSchema = z.object({
  /** Reference to the card this question is for */
  cardId: IdSchema,
  /** Optional time limit in seconds */
  timeLimit: z.number().positive().optional(),
});

// ============================================================================
// Multiple Choice Question
// ============================================================================

export const MultipleChoiceOptionSchema = z.object({
  /** Unique ID for this option */
  id: z.string(),
  /** Display text */
  text: z.string(),
  /** Whether this is a correct answer */
  isCorrect: z.boolean(),
});
export type MultipleChoiceOption = z.infer<typeof MultipleChoiceOptionSchema>;

export const MultipleChoiceQuestionSchema = BaseQuestionSchema.extend({
  type: z.literal("multiple-choice"),
  /** The question prompt */
  prompt: z.string(),
  /** Available options (shuffled at runtime) */
  options: z.array(MultipleChoiceOptionSchema).min(2).max(8),
  /** Allow multiple correct answers */
  allowMultiple: z.boolean().default(false),
});
export type MultipleChoiceQuestion = z.infer<typeof MultipleChoiceQuestionSchema>;

// ============================================================================
// Text Input Question (Exact/Fuzzy Match)
// ============================================================================

export const TextInputQuestionSchema = BaseQuestionSchema.extend({
  type: z.literal("text-input"),
  /** The question prompt */
  prompt: z.string(),
  /** Expected correct answer(s) */
  correctAnswers: z.array(z.string()).min(1),
  /** Fuzzy matching configuration */
  matchConfig: FuzzyMatchConfigSchema.optional(),
  /** Placeholder text for input field */
  placeholder: z.string().optional(),
  /** Maximum input length */
  maxLength: z.number().positive().optional(),
});
export type TextInputQuestion = z.infer<typeof TextInputQuestionSchema>;

// ============================================================================
// True/False Question
// ============================================================================

export const TrueFalseQuestionSchema = BaseQuestionSchema.extend({
  type: z.literal("true-false"),
  /** The statement to evaluate */
  statement: z.string(),
  /** The correct answer */
  correctAnswer: z.boolean(),
});
export type TrueFalseQuestion = z.infer<typeof TrueFalseQuestionSchema>;

// ============================================================================
// Fill in the Blank Question
// ============================================================================

export const FillBlankQuestionSchema = BaseQuestionSchema.extend({
  type: z.literal("fill-blank"),
  /** Text with {{blank}} placeholders */
  textWithBlanks: z.string(),
  /** Correct answers for each blank, in order */
  blanks: z
    .array(
      z.object({
        /** Accepted answers for this blank */
        answers: z.array(z.string()).min(1),
        /** Match config for this specific blank */
        matchConfig: FuzzyMatchConfigSchema.optional(),
      })
    )
    .min(1),
});
export type FillBlankQuestion = z.infer<typeof FillBlankQuestionSchema>;

// ============================================================================
// Matching Question (Match pairs)
// ============================================================================

export const MatchingPairSchema = z.object({
  id: z.string(),
  left: z.string(),
  right: z.string(),
});
export type MatchingPair = z.infer<typeof MatchingPairSchema>;

export const MatchingQuestionSchema = BaseQuestionSchema.extend({
  type: z.literal("matching"),
  /** Instruction text */
  prompt: z.string(),
  /** Pairs to match */
  pairs: z.array(MatchingPairSchema).min(2).max(10),
});
export type MatchingQuestion = z.infer<typeof MatchingQuestionSchema>;

// ============================================================================
// Discriminated Union of All Question Types
// ============================================================================

export const QuestionSchema = z.discriminatedUnion("type", [
  MultipleChoiceQuestionSchema,
  TextInputQuestionSchema,
  TrueFalseQuestionSchema,
  FillBlankQuestionSchema,
  MatchingQuestionSchema,
]);
export type Question = z.infer<typeof QuestionSchema>;

/**
 * All supported question type identifiers
 */
export const QuestionTypes = [
  "multiple-choice",
  "text-input",
  "true-false",
  "fill-blank",
  "matching",
] as const;
export type QuestionType = (typeof QuestionTypes)[number];

// ============================================================================
// Question Generation Config (per quiz)
// ============================================================================

/**
 * Configuration for how questions are generated from cards
 */
export const QuestionGenerationConfigSchema = z.object({
  /** Which question types to use */
  types: z.array(z.enum(QuestionTypes)).default(["multiple-choice", "text-input"]),
  /** Weights for each type (higher = more likely) */
  typeWeights: z.record(z.enum(QuestionTypes), z.number().positive()).optional(),
  /** Whether to ask term -> definition and definition -> term */
  bidirectional: z.boolean().default(true),
  /** Number of options for multiple choice */
  multipleChoiceOptions: z.number().int().min(2).max(8).default(4),
  /** Default fuzzy match config for text input */
  defaultMatchConfig: FuzzyMatchConfigSchema.optional(),
});
export type QuestionGenerationConfig = z.infer<typeof QuestionGenerationConfigSchema>;
