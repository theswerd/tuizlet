import { z } from "zod";
import { IdSchema, FuzzyMatchConfigSchema, TagSchema, MetadataSchema } from "./common.ts";

// ============================================================================
// Card Content
// ============================================================================

/**
 * The front side of a card (the prompt/question)
 */
export const CardFrontSchema = z.object({
  /** Primary text to display */
  text: z.string().min(1),
  /** Optional hint that can be revealed */
  hint: z.string().optional(),
  /** Optional image path (relative to quiz file) */
  image: z.string().optional(),
  /** Optional audio path for pronunciation */
  audio: z.string().optional(),
});
export type CardFront = z.infer<typeof CardFrontSchema>;

/**
 * The back side of a card (the answer)
 */
export const CardBackSchema = z.object({
  /** Primary correct answer */
  text: z.string().min(1),
  /** Alternative acceptable answers */
  alternatives: z.array(z.string()).default([]),
  /** Optional explanation shown after answering */
  explanation: z.string().optional(),
  /** Optional example usage */
  example: z.string().optional(),
  /** Optional image path */
  image: z.string().optional(),
  /** Optional audio path */
  audio: z.string().optional(),
});
export type CardBack = z.infer<typeof CardBackSchema>;

/**
 * A flashcard/term in a quiz set
 */
export const CardSchema = z.object({
  /** Unique identifier within the quiz */
  id: IdSchema,
  /** The front of the card (prompt) */
  front: CardFrontSchema,
  /** The back of the card (answer) */
  back: CardBackSchema,
  /** Override fuzzy matching config for this specific card */
  matchConfig: FuzzyMatchConfigSchema.optional(),
  /** Tags for filtering/categorization within the quiz */
  tags: z.array(TagSchema).default([]),
  /** Arbitrary metadata */
  metadata: MetadataSchema,
});
export type Card = z.infer<typeof CardSchema>;
