import {
  Box,
  Text,
  TextAttributes,
  type Renderer,
  type KeyEvent,
} from "@opentui/core";
import type { LoadedQuiz } from "../services/quiz-loader.ts";
import type { Card } from "../models/index.ts";
import { getColors } from "../services/theme-loader.ts";
import { matchAnswer } from "../services/text-matcher.ts";

// ============================================================================
// Types
// ============================================================================

export type LearnMode = "multiple-choice" | "type-answer" | "mixed";

interface Question {
  card: Card;
  prompt: string;
  correctAnswers: string[];
  direction: "front-to-back" | "back-to-front";
  mode: "multiple-choice" | "type-answer";
  options?: { id: string; text: string; isCorrect: boolean }[];
}

interface LearnState {
  questions: Question[];
  currentIndex: number;
  // Multiple choice state
  selectedOption: number;
  // Type answer state
  typedAnswer: string;
  // Common state
  answered: boolean;
  correct: number;
  incorrect: number;
  showingResult: boolean;
  lastAnswerCorrect: boolean;
  correctAnswer: string;
}

// ============================================================================
// Helpers
// ============================================================================

function clearScreen(renderer: Renderer) {
  for (const child of renderer.root.getChildren()) {
    renderer.root.remove(child.id);
  }
}

function shuffle<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function generateId(): string {
  return Math.random().toString(36).substring(2, 10);
}

// ============================================================================
// Question Generation
// ============================================================================

function generateQuestions(cards: Card[], mode: LearnMode): Question[] {
  const questions: Question[] = [];
  const shuffledCards = shuffle(cards);

  for (const card of shuffledCards) {
    // Determine question mode
    let questionMode: "multiple-choice" | "type-answer";
    if (mode === "mixed") {
      questionMode = Math.random() < 0.5 ? "multiple-choice" : "type-answer";
    } else {
      questionMode = mode;
    }

    // Front to back
    questions.push(createQuestion(card, shuffledCards, "front-to-back", questionMode));

    // Back to front
    const backMode = mode === "mixed"
      ? (Math.random() < 0.5 ? "multiple-choice" : "type-answer")
      : mode;
    questions.push(createQuestion(card, shuffledCards, "back-to-front", backMode));
  }

  return shuffle(questions);
}

function createQuestion(
  card: Card,
  allCards: Card[],
  direction: "front-to-back" | "back-to-front",
  mode: "multiple-choice" | "type-answer"
): Question {
  const prompt = direction === "front-to-back"
    ? `What is "${card.front.text}"?`
    : `What is "${card.back.text}"?`;

  const correctAnswer = direction === "front-to-back" ? card.back.text : card.front.text;
  const alternatives = direction === "front-to-back"
    ? card.back.alternatives ?? []
    : [];

  const correctAnswers = [correctAnswer, ...alternatives];

  const question: Question = {
    card,
    prompt,
    correctAnswers,
    direction,
    mode,
  };

  // Generate options for multiple choice
  if (mode === "multiple-choice") {
    const otherCards = allCards.filter((c) => c.id !== card.id);
    const wrongCards = shuffle(otherCards).slice(0, Math.min(3, otherCards.length));
    const wrongAnswers = wrongCards.map((c) =>
      direction === "front-to-back" ? c.back.text : c.front.text
    );

    const options = [
      { id: generateId(), text: correctAnswer, isCorrect: true },
      ...wrongAnswers.map((text) => ({ id: generateId(), text, isCorrect: false })),
    ];

    question.options = shuffle(options);
  }

  return question;
}

// ============================================================================
// Mode Selection
// ============================================================================

export async function selectLearnMode(renderer: Renderer): Promise<LearnMode | null> {
  const keyHandler = (renderer as any)._keyHandler;
  const colors = getColors();

  const modes: { id: LearnMode; label: string; description: string }[] = [
    { id: "multiple-choice", label: "Multiple Choice", description: "Pick from 4 options" },
    { id: "type-answer", label: "Type Answer", description: "Type the answer yourself" },
    { id: "mixed", label: "Mixed", description: "Random mix of both modes" },
  ];

  let selectedIndex = 0;

  const render = () => {
    clearScreen(renderer);
    renderer.root.add(
      Box(
        { flexDirection: "column", padding: 1, flexGrow: 1 },
        Text({ content: "Select Mode", attributes: TextAttributes.BOLD }),
        Text({ content: "" }),
        ...modes.map((mode, index) => {
          const isSelected = index === selectedIndex;
          const prefix = isSelected ? " ▸ " : "   ";
          const fg = isSelected ? colors.primary : undefined;
          const attrs = isSelected ? TextAttributes.BOLD : TextAttributes.NONE;

          return Box(
            { flexDirection: "column", marginBottom: 1 },
            Text({ content: `${prefix}${mode.label}`, fg, attributes: attrs }),
            Text({
              content: `     ${mode.description}`,
              attributes: TextAttributes.DIM,
              fg: isSelected ? colors.primary : undefined,
            }),
          );
        }),
        Text({ content: "" }),
        Box(
          { flexDirection: "row", gap: 2 },
          Text({ content: "↑↓ Navigate", attributes: TextAttributes.DIM }),
          Text({ content: "Enter Select", attributes: TextAttributes.DIM }),
          Text({ content: "Esc Back", attributes: TextAttributes.DIM }),
        ),
      ),
    );
  };

  render();

  return new Promise((resolve) => {
    const handleKey = (event: KeyEvent) => {
      const key = event.name.toLowerCase();

      if (key === "up") {
        selectedIndex = selectedIndex <= 0 ? modes.length - 1 : selectedIndex - 1;
        render();
      } else if (key === "down") {
        selectedIndex = selectedIndex >= modes.length - 1 ? 0 : selectedIndex + 1;
        render();
      } else if (key === "return" || key === "enter") {
        keyHandler.off("keypress", handleKey);
        resolve(modes[selectedIndex]!.id);
      } else if (key === "escape") {
        keyHandler.off("keypress", handleKey);
        resolve(null);
      }
    };

    keyHandler.on("keypress", handleKey);
  });
}

// ============================================================================
// Main Learn Command
// ============================================================================

export async function runLearnCommand(
  renderer: Renderer,
  loadedQuizzes: LoadedQuiz[],
  title: string
): Promise<void> {
  // Select mode
  const mode = await selectLearnMode(renderer);
  if (!mode) return; // User cancelled

  // Collect all cards from all quizzes
  const allCards: Card[] = [];
  for (const { quiz } of loadedQuizzes) {
    allCards.push(...quiz.cards);
  }

  if (allCards.length === 0) {
    renderError(renderer, "No cards found in the selected quizzes.");
    return;
  }

  // Generate questions
  const questions = generateQuestions(allCards, mode);

  if (questions.length === 0) {
    renderError(renderer, "No questions could be generated from these quizzes.");
    return;
  }

  const state: LearnState = {
    questions,
    currentIndex: 0,
    selectedOption: -1,
    typedAnswer: "",
    answered: false,
    correct: 0,
    incorrect: 0,
    showingResult: false,
    lastAnswerCorrect: false,
    correctAnswer: "",
  };

  // Initial render
  render(renderer, state, title);

  // Handle keyboard input
  const keyHandler = (renderer as any)._keyHandler;

  return new Promise((resolve) => {
    const handleKey = (event: KeyEvent) => {
      const keyName = event.name.toLowerCase();
      const currentQuestion = state.questions[state.currentIndex];

      if (state.currentIndex >= state.questions.length) {
        keyHandler.off("keypress", handleKey);
        resolve();
        return;
      }

      if (state.showingResult) {
        state.showingResult = false;
        state.currentIndex++;
        state.selectedOption = -1;
        state.typedAnswer = "";
        state.answered = false;
        render(renderer, state, title);
        return;
      }

      if (!currentQuestion) return;

      if (currentQuestion.mode === "multiple-choice") {
        handleMultipleChoiceKey(event, state, renderer, title);
      } else {
        handleTypeAnswerKey(event, state, renderer, title);
      }
    };

    keyHandler.on("keypress", handleKey);
  });
}

function handleMultipleChoiceKey(
  event: KeyEvent,
  state: LearnState,
  renderer: Renderer,
  title: string
) {
  const keyName = event.name.toLowerCase();
  const currentQuestion = state.questions[state.currentIndex]!;
  const numOptions = currentQuestion.options?.length ?? 0;

  let optionIndex = -1;

  if (keyName >= "1" && keyName <= "4") {
    optionIndex = parseInt(keyName) - 1;
  } else if (keyName >= "a" && keyName <= "d") {
    optionIndex = keyName.charCodeAt(0) - "a".charCodeAt(0);
  } else if (keyName === "up") {
    state.selectedOption = state.selectedOption <= 0 ? numOptions - 1 : state.selectedOption - 1;
    render(renderer, state, title);
    return;
  } else if (keyName === "down") {
    state.selectedOption = state.selectedOption >= numOptions - 1 ? 0 : state.selectedOption + 1;
    render(renderer, state, title);
    return;
  } else if ((keyName === "return" || keyName === "enter") && state.selectedOption >= 0) {
    optionIndex = state.selectedOption;
  }

  if (optionIndex >= 0 && optionIndex < numOptions && !state.answered) {
    state.selectedOption = optionIndex;
    state.answered = true;

    const selectedOpt = currentQuestion.options![optionIndex]!;
    state.lastAnswerCorrect = selectedOpt.isCorrect;
    state.correctAnswer = currentQuestion.correctAnswers[0]!;

    if (selectedOpt.isCorrect) {
      state.correct++;
    } else {
      state.incorrect++;
    }

    state.showingResult = true;
    render(renderer, state, title);
  }
}

function handleTypeAnswerKey(
  event: KeyEvent,
  state: LearnState,
  renderer: Renderer,
  title: string
) {
  const keyName = event.name.toLowerCase();
  const currentQuestion = state.questions[state.currentIndex]!;

  if (keyName === "backspace") {
    state.typedAnswer = state.typedAnswer.slice(0, -1);
    render(renderer, state, title);
  } else if (keyName === "return" || keyName === "enter") {
    if (state.typedAnswer.trim().length > 0) {
      state.answered = true;

      const result = matchAnswer(state.typedAnswer, currentQuestion.correctAnswers, {
        ignoreCase: true,
        ignoreAccents: true,
        allowTypoDistance: 1,
      });

      state.lastAnswerCorrect = result.isCorrect;
      state.correctAnswer = currentQuestion.correctAnswers[0]!;

      if (result.isCorrect) {
        state.correct++;
      } else {
        state.incorrect++;
      }

      state.showingResult = true;
      render(renderer, state, title);
    }
  } else if (event.name.length === 1 && !event.ctrl && !event.meta) {
    // Regular character input
    state.typedAnswer += event.name;
    render(renderer, state, title);
  } else if (keyName === "space") {
    state.typedAnswer += " ";
    render(renderer, state, title);
  }
}

// ============================================================================
// Rendering
// ============================================================================

function render(renderer: Renderer, state: LearnState, quizTitle: string): void {
  clearScreen(renderer);

  if (state.currentIndex >= state.questions.length) {
    renderComplete(renderer, state, quizTitle);
    return;
  }

  const currentQuestion = state.questions[state.currentIndex]!;

  if (currentQuestion.mode === "multiple-choice") {
    renderMultipleChoice(renderer, state, quizTitle);
  } else {
    renderTypeAnswer(renderer, state, quizTitle);
  }
}

function renderMultipleChoice(renderer: Renderer, state: LearnState, quizTitle: string): void {
  const colors = getColors();
  const current = state.questions[state.currentIndex]!;
  const progress = `${state.currentIndex + 1}/${state.questions.length}`;

  renderer.root.add(
    Box(
      { flexDirection: "column", padding: 1, flexGrow: 1 },
      // Header
      Box(
        { flexDirection: "row", justifyContent: "space-between", marginBottom: 1 },
        Text({ content: quizTitle, attributes: TextAttributes.BOLD }),
        Box(
          { flexDirection: "row", gap: 2 },
          Text({ content: progress, attributes: TextAttributes.DIM }),
          Text({ content: `✓ ${state.correct}`, fg: colors.success }),
          Text({ content: `✗ ${state.incorrect}`, fg: colors.error }),
        ),
      ),
      // Question
      Box(
        { marginBottom: 1 },
        Text({ content: current.prompt }),
      ),
      // Options
      ...(current.options ?? []).map((option, index) => {
        const number = index + 1;
        let prefix = `  ${number}. `;
        let attrs = TextAttributes.NONE;
        let suffix = "";
        let fg: string | undefined;

        if (state.answered) {
          if (option.isCorrect) {
            suffix = " ✓";
            attrs = TextAttributes.BOLD;
            fg = colors.success;
          } else if (index === state.selectedOption) {
            suffix = " ✗";
            fg = colors.error;
          } else {
            attrs = TextAttributes.DIM;
          }
        } else if (index === state.selectedOption) {
          prefix = ` ▸${number}. `;
          attrs = TextAttributes.BOLD;
          fg = colors.primary;
        }

        return Box(
          { marginLeft: 1 },
          Text({ content: `${prefix}${option.text}${suffix}`, attributes: attrs, fg }),
        );
      }),
      // Instructions
      Box(
        { marginTop: 2 },
        state.showingResult
          ? Text({ content: "Press any key to continue...", attributes: TextAttributes.DIM })
          : Text({ content: "Press 1-4, a-d, or ↑↓ + Enter", attributes: TextAttributes.DIM }),
      ),
    ),
  );
}

function renderTypeAnswer(renderer: Renderer, state: LearnState, quizTitle: string): void {
  const colors = getColors();
  const current = state.questions[state.currentIndex]!;
  const progress = `${state.currentIndex + 1}/${state.questions.length}`;

  const inputDisplay = state.typedAnswer || (state.answered ? "" : "");
  const cursor = state.answered ? "" : "▌";

  renderer.root.add(
    Box(
      { flexDirection: "column", padding: 1, flexGrow: 1 },
      // Header
      Box(
        { flexDirection: "row", justifyContent: "space-between", marginBottom: 1 },
        Text({ content: quizTitle, attributes: TextAttributes.BOLD }),
        Box(
          { flexDirection: "row", gap: 2 },
          Text({ content: progress, attributes: TextAttributes.DIM }),
          Text({ content: `✓ ${state.correct}`, fg: colors.success }),
          Text({ content: `✗ ${state.incorrect}`, fg: colors.error }),
        ),
      ),
      // Question
      Box(
        { marginBottom: 1 },
        Text({ content: current.prompt }),
      ),
      // Input field
      Box(
        { marginBottom: 1, marginLeft: 1 },
        state.answered
          ? Box(
              { flexDirection: "column" },
              Text({
                content: `Your answer: ${state.typedAnswer}`,
                fg: state.lastAnswerCorrect ? colors.success : colors.error,
                attributes: TextAttributes.BOLD,
              }),
              state.lastAnswerCorrect
                ? Text({ content: "✓ Correct!", fg: colors.success })
                : Box(
                    { flexDirection: "column" },
                    Text({ content: "✗ Incorrect", fg: colors.error }),
                    Text({ content: `Correct answer: ${state.correctAnswer}`, fg: colors.success }),
                  ),
            )
          : Text({
              content: `> ${inputDisplay}${cursor}`,
              fg: colors.primary,
              attributes: TextAttributes.BOLD,
            }),
      ),
      // Instructions
      Box(
        { marginTop: 2 },
        state.showingResult
          ? Text({ content: "Press any key to continue...", attributes: TextAttributes.DIM })
          : Text({ content: "Type your answer and press Enter", attributes: TextAttributes.DIM }),
      ),
    ),
  );
}

function renderComplete(renderer: Renderer, state: LearnState, quizTitle: string): void {
  const colors = getColors();
  const total = state.correct + state.incorrect;
  const percentage = total > 0 ? Math.round((state.correct / total) * 100) : 0;
  const scoreColor = percentage >= 80 ? colors.success : percentage >= 60 ? colors.warning : colors.error;

  renderer.root.add(
    Box(
      { flexDirection: "column", alignItems: "center", justifyContent: "center", flexGrow: 1 },
      Text({ content: "Session Complete!", attributes: TextAttributes.BOLD, fg: colors.secondary }),
      Text({ content: "" }),
      Text({ content: quizTitle, attributes: TextAttributes.DIM }),
      Text({ content: "" }),
      Text({ content: `Score: ${state.correct}/${total} (${percentage}%)`, fg: scoreColor, attributes: TextAttributes.BOLD }),
      Box(
        { flexDirection: "row", gap: 2 },
        Text({ content: `✓ ${state.correct}`, fg: colors.success }),
        Text({ content: `✗ ${state.incorrect}`, fg: colors.error }),
      ),
      Text({ content: "" }),
      Text({ content: "Press any key to continue...", attributes: TextAttributes.DIM }),
    ),
  );
}

function renderError(renderer: Renderer, message: string): void {
  renderer.root.add(
    Box(
      { flexDirection: "column", alignItems: "center", justifyContent: "center", flexGrow: 1 },
      Text({ content: "Error", attributes: TextAttributes.BOLD }),
      Text({ content: "" }),
      Text({ content: message }),
    ),
  );
}
