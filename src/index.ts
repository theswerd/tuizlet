import {
  ASCIIFont,
  Box,
  createCliRenderer,
  Text,
  TextAttributes,
  type KeyEvent,
} from "@opentui/core";
import { findTuizletDir, loadAllQuizzes, findQuizById, type LoadedQuiz } from "./services/quiz-loader.ts";
import { runLearnCommand } from "./commands/learn.ts";
import { loadTheme, getColors } from "./services/theme-loader.ts";

const args = process.argv.slice(2);
const command = args[0];
const quizArg = args[1];

const renderer = await createCliRenderer({ exitOnCtrlC: true });
const keyHandler = (renderer as any)._keyHandler;

function clearScreen() {
  for (const child of renderer.root.getChildren()) {
    renderer.root.remove(child.id);
  }
}

async function main() {
  if (command === "learn") {
    await handleLearn(quizArg);
  } else if (command === "help" || command === "--help" || command === "-h") {
    showHelp();
  } else if (command) {
    showError(`Unknown command: ${command}`);
  } else {
    await showHome();
  }
}

async function showHome() {
  // Find .tuizlet directory
  const tuizletDir = await findTuizletDir();

  if (!tuizletDir) {
    showError("No .tuizlet directory found.\nCreate a .tuizlet/quizzes/ folder with quiz JSON files.");
    return;
  }

  // Load theme
  await loadTheme(tuizletDir);

  // Load all quizzes
  const quizzes = await loadAllQuizzes(tuizletDir);

  if (quizzes.length === 0) {
    showError("No quizzes found in .tuizlet/quizzes/");
    return;
  }

  // Show interactive menu
  await showQuizMenu(quizzes);
}

interface MenuOption {
  id: string;
  label: string;
  subtitle?: string;
  cardCount: number;
  quizzes: LoadedQuiz[];
}

async function showQuizMenu(quizzes: LoadedQuiz[]) {
  // Build menu options
  const options: MenuOption[] = [];

  // Add "All Quizzes" option if there's more than one quiz
  if (quizzes.length > 1) {
    const totalCards = quizzes.reduce((sum, q) => sum + q.quiz.cards.length, 0);
    options.push({
      id: "all",
      label: "All Quizzes (Mixed)",
      subtitle: `${quizzes.length} quizzes combined`,
      cardCount: totalCards,
      quizzes: quizzes,
    });
  }

  // Add individual quizzes
  for (const q of quizzes) {
    options.push({
      id: q.id,
      label: q.quiz.metadata.title,
      subtitle: q.quiz.metadata.description,
      cardCount: q.quiz.cards.length,
      quizzes: [q],
    });
  }

  let selectedIndex = 0;

  const render = () => {
    const colors = getColors();
    clearScreen();
    renderer.root.add(
      Box(
        { flexDirection: "column", padding: 1, flexGrow: 1 },
        // Header
        Box(
          { alignItems: "center", marginBottom: 1 },
          ASCIIFont({ font: "tiny", text: "Tuizlet" }),
        ),
        Text({ content: "Select a quiz to start learning", attributes: TextAttributes.DIM }),
        Text({ content: "" }),
        // Quiz list
        ...options.map((option, index) => {
          const isSelected = index === selectedIndex;
          const prefix = isSelected ? " ▸ " : "   ";
          const fg = isSelected ? colors.primary : undefined;
          const attrs = isSelected ? TextAttributes.BOLD : TextAttributes.NONE;

          return Box(
            { flexDirection: "column", marginBottom: index < options.length - 1 ? 1 : 0 },
            Text({
              content: `${prefix}${option.label}`,
              fg,
              attributes: attrs,
            }),
            Text({
              content: `     ${option.cardCount} cards`,
              attributes: TextAttributes.DIM,
              fg: isSelected ? colors.primary : undefined,
            }),
          );
        }),
        // Footer
        Text({ content: "" }),
        Box(
          { flexDirection: "row", gap: 2 },
          Text({ content: "↑↓ Navigate", attributes: TextAttributes.DIM }),
          Text({ content: "Enter Select", attributes: TextAttributes.DIM }),
          Text({ content: "q Quit", attributes: TextAttributes.DIM }),
        ),
      ),
    );
  };

  render();

  return new Promise<void>((resolve) => {
    const handleKey = async (event: KeyEvent) => {
      const key = event.name.toLowerCase();

      if (key === "up") {
        selectedIndex = selectedIndex <= 0 ? options.length - 1 : selectedIndex - 1;
        render();
      } else if (key === "down") {
        selectedIndex = selectedIndex >= options.length - 1 ? 0 : selectedIndex + 1;
        render();
      } else if (key === "return" || key === "enter") {
        keyHandler.off("keypress", handleKey);
        const selected = options[selectedIndex]!;
        await runLearnCommand(renderer, selected.quizzes, selected.label);
        // After learning, show menu again
        render();
        keyHandler.on("keypress", handleKey);
      } else if (key === "q") {
        keyHandler.off("keypress", handleKey);
        process.exit(0);
      }
    };

    keyHandler.on("keypress", handleKey);
  });
}

async function handleLearn(quizId?: string) {
  // Find .tuizlet directory
  const tuizletDir = await findTuizletDir();

  if (!tuizletDir) {
    showError("No .tuizlet directory found. Create one with quizzes inside.");
    return;
  }

  // Load all quizzes
  const quizzes = await loadAllQuizzes(tuizletDir);

  if (quizzes.length === 0) {
    showError("No quizzes found in .tuizlet/quizzes/");
    return;
  }

  let selectedQuizzes: LoadedQuiz[];
  let title: string;

  if (quizId) {
    // Find specific quiz
    const found = findQuizById(quizzes, quizId);
    if (!found) {
      showError(`Quiz not found: ${quizId}`);
      showAvailableQuizzes(quizzes);
      return;
    }
    selectedQuizzes = [found];
    title = found.quiz.metadata.title;
  } else {
    // Use all quizzes
    selectedQuizzes = quizzes;
    title = quizzes.length > 1 ? "All Quizzes" : quizzes[0]!.quiz.metadata.title;
  }

  // Run learn mode
  await runLearnCommand(renderer, selectedQuizzes, title);

  // Exit cleanly
  process.exit(0);
}

function showHelp() {
  clearScreen();
  renderer.root.add(
    Box(
      { flexDirection: "column", padding: 1 },
      Text({ content: "Tuizlet - A terminal quiz experience", attributes: TextAttributes.BOLD }),
      Text({ content: "" }),
      Text({ content: "Usage: tuizlet [command] [options]" }),
      Text({ content: "" }),
      Text({ content: "Commands:", attributes: TextAttributes.BOLD }),
      Text({ content: "  (none)        Show interactive quiz menu" }),
      Text({ content: "  learn [quiz]  Start learning a specific quiz" }),
      Text({ content: "  help          Show this help message" }),
      Text({ content: "" }),
      Text({ content: "Examples:", attributes: TextAttributes.BOLD }),
      Text({ content: "  tuizlet                    Interactive quiz selection" }),
      Text({ content: "  tuizlet learn              Learn all quizzes mixed" }),
      Text({ content: "  tuizlet learn spanish      Learn a quiz matching 'spanish'" }),
      Text({ content: "" }),
      Text({ content: "Quiz files are loaded from .tuizlet/quizzes/ in the current directory." }),
    ),
  );
}

function showError(message: string) {
  clearScreen();
  renderer.root.add(
    Box(
      { flexDirection: "column", padding: 1 },
      Text({ content: "Error", attributes: TextAttributes.BOLD, fg: "#ef4444" }),
      Text({ content: "" }),
      Text({ content: message }),
      Text({ content: "" }),
      Text({ content: "Press Ctrl+C to exit", attributes: TextAttributes.DIM }),
    ),
  );
}

function showAvailableQuizzes(quizzes: LoadedQuiz[]) {
  renderer.root.add(
    Box(
      { flexDirection: "column", padding: 1 },
      Text({ content: "" }),
      Text({ content: "Available quizzes:", attributes: TextAttributes.BOLD }),
      ...quizzes.map((q) =>
        Text({ content: `  ${q.id} - ${q.quiz.metadata.title}` })
      ),
    ),
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
