import type { Card, Quiz, MultipleChoiceQuestion, MultipleChoiceOption } from "../models/index.ts";

/**
 * Shuffle an array in place (Fisher-Yates)
 */
function shuffle<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/**
 * Generate a unique ID
 */
function generateId(): string {
  return Math.random().toString(36).substring(2, 10);
}

export interface GeneratedQuestion {
  question: MultipleChoiceQuestion;
  card: Card;
  /** Whether this asks for the back given the front (true) or front given back (false) */
  direction: "front-to-back" | "back-to-front";
}

export interface QuestionGeneratorOptions {
  /** Number of options per question (default: 4) */
  numOptions?: number;
  /** Whether to generate bidirectional questions (default: true) */
  bidirectional?: boolean;
  /** Shuffle the cards (default: true) */
  shuffle?: boolean;
}

/**
 * Generate multiple choice questions from a quiz
 */
export function generateMultipleChoiceQuestions(
  quiz: Quiz,
  options: QuestionGeneratorOptions = {}
): GeneratedQuestion[] {
  return generateMultipleChoiceQuestionsFromCards(quiz.cards, options);
}

/**
 * Generate multiple choice questions from an array of cards
 */
export function generateMultipleChoiceQuestionsFromCards(
  cards: Card[],
  options: QuestionGeneratorOptions = {}
): GeneratedQuestion[] {
  const { numOptions = 4, bidirectional = true, shuffle: shouldShuffle = true } = options;

  const cardList = shouldShuffle ? shuffle(cards) : cards;
  const questions: GeneratedQuestion[] = [];

  for (const card of cardList) {
    // Front to back: "What is [front]?" -> answer is back
    questions.push(generateQuestion(card, cardList, "front-to-back", numOptions));

    // Back to front: "What is [back]?" -> answer is front
    if (bidirectional) {
      questions.push(generateQuestion(card, cardList, "back-to-front", numOptions));
    }
  }

  return shouldShuffle ? shuffle(questions) : questions;
}

function generateQuestion(
  targetCard: Card,
  allCards: Card[],
  direction: "front-to-back" | "back-to-front",
  numOptions: number
): GeneratedQuestion {
  const prompt =
    direction === "front-to-back"
      ? `What is "${targetCard.front.text}"?`
      : `What is "${targetCard.back.text}"?`;

  const correctAnswer = direction === "front-to-back" ? targetCard.back.text : targetCard.front.text;

  // Get wrong answers from other cards
  const otherCards = allCards.filter((c) => c.id !== targetCard.id);
  const wrongCards = shuffle(otherCards).slice(0, numOptions - 1);

  const wrongAnswers = wrongCards.map((c) =>
    direction === "front-to-back" ? c.back.text : c.front.text
  );

  // Build options
  const options: MultipleChoiceOption[] = [
    { id: generateId(), text: correctAnswer, isCorrect: true },
    ...wrongAnswers.map((text) => ({ id: generateId(), text, isCorrect: false })),
  ];

  // Shuffle options so correct answer isn't always first
  const shuffledOptions = shuffle(options);

  const question: MultipleChoiceQuestion = {
    type: "multiple-choice",
    cardId: targetCard.id,
    prompt,
    options: shuffledOptions,
    allowMultiple: false,
  };

  return { question, card: targetCard, direction };
}

/**
 * Get the correct option from a multiple choice question
 */
export function getCorrectOption(question: MultipleChoiceQuestion): MultipleChoiceOption | undefined {
  return question.options.find((o) => o.isCorrect);
}
