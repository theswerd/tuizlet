/**
 * Normalize text for comparison
 */
function normalizeText(text: string, ignoreAccents: boolean): string {
  let normalized = text.trim().toLowerCase();

  // Normalize whitespace
  normalized = normalized.replace(/\s+/g, " ");

  // Remove accents if configured
  if (ignoreAccents) {
    normalized = normalized.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  }

  return normalized;
}

/**
 * Calculate Levenshtein distance between two strings
 */
function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0]![j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i]![j] = matrix[i - 1]![j - 1]!;
      } else {
        matrix[i]![j] = Math.min(
          matrix[i - 1]![j - 1]! + 1, // substitution
          matrix[i]![j - 1]! + 1,     // insertion
          matrix[i - 1]![j]! + 1      // deletion
        );
      }
    }
  }

  return matrix[b.length]![a.length]!;
}

export interface MatchOptions {
  /** Ignore case differences (default: true) */
  ignoreCase?: boolean;
  /** Ignore accent marks (default: true for Spanish, etc.) */
  ignoreAccents?: boolean;
  /** Allow typos within this Levenshtein distance (default: 1) */
  allowTypoDistance?: number;
}

export interface MatchResult {
  /** Whether the answer is correct */
  isCorrect: boolean;
  /** Whether it was an exact match */
  isExact: boolean;
  /** The distance from the correct answer (0 = exact) */
  distance: number;
  /** Which correct answer it matched (if any) */
  matchedAnswer?: string;
}

/**
 * Check if user input matches any of the correct answers
 */
export function matchAnswer(
  userInput: string,
  correctAnswers: string[],
  options: MatchOptions = {}
): MatchResult {
  const {
    ignoreCase = true,
    ignoreAccents = true,
    allowTypoDistance = 1,
  } = options;

  const normalizedInput = ignoreCase
    ? normalizeText(userInput, ignoreAccents)
    : userInput.trim();

  let bestMatch: MatchResult = {
    isCorrect: false,
    isExact: false,
    distance: Infinity,
  };

  for (const answer of correctAnswers) {
    const normalizedAnswer = ignoreCase
      ? normalizeText(answer, ignoreAccents)
      : answer.trim();

    // Check exact match
    if (normalizedInput === normalizedAnswer) {
      return {
        isCorrect: true,
        isExact: true,
        distance: 0,
        matchedAnswer: answer,
      };
    }

    // Check fuzzy match
    const distance = levenshteinDistance(normalizedInput, normalizedAnswer);

    if (distance < bestMatch.distance) {
      bestMatch = {
        isCorrect: distance <= allowTypoDistance,
        isExact: false,
        distance,
        matchedAnswer: distance <= allowTypoDistance ? answer : undefined,
      };
    }
  }

  return bestMatch;
}
