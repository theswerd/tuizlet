import { readdir, stat } from "node:fs/promises";
import { join, basename } from "node:path";
import { safeParseQuizFile, type Quiz } from "../models/index.ts";

export interface LoadedQuiz {
  quiz: Quiz;
  path: string;
  id: string;
}

/**
 * Find the .tuizlet directory starting from cwd and walking up
 */
export async function findTuizletDir(startDir: string = process.cwd()): Promise<string | null> {
  let dir = startDir;
  const root = "/";

  while (dir !== root) {
    const tuizletPath = join(dir, ".tuizlet");
    try {
      const stats = await stat(tuizletPath);
      if (stats.isDirectory()) {
        return tuizletPath;
      }
    } catch {
      // Directory doesn't exist, continue
    }
    dir = join(dir, "..");
  }

  return null;
}

/**
 * Recursively find all .json files in a directory
 */
async function findJsonFiles(dir: string): Promise<string[]> {
  const files: string[] = [];

  try {
    const entries = await readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = join(dir, entry.name);
      if (entry.isDirectory()) {
        const nested = await findJsonFiles(fullPath);
        files.push(...nested);
      } else if (entry.isFile() && entry.name.endsWith(".json")) {
        files.push(fullPath);
      }
    }
  } catch {
    // Directory doesn't exist or can't be read
  }

  return files;
}

/**
 * Load all quizzes from the .tuizlet/quizzes directory
 */
export async function loadAllQuizzes(tuizletDir: string): Promise<LoadedQuiz[]> {
  const quizzesDir = join(tuizletDir, "quizzes");
  const jsonFiles = await findJsonFiles(quizzesDir);
  const quizzes: LoadedQuiz[] = [];

  for (const filePath of jsonFiles) {
    try {
      const content = await Bun.file(filePath).json();
      const result = safeParseQuizFile(content);

      if (result.success) {
        const id = result.data.id ?? basename(filePath, ".json");
        quizzes.push({
          quiz: result.data,
          path: filePath,
          id,
        });
      }
    } catch {
      // Skip invalid files
    }
  }

  return quizzes;
}

/**
 * Find a quiz by ID (partial match supported)
 */
export function findQuizById(quizzes: LoadedQuiz[], searchId: string): LoadedQuiz | null {
  // Exact match first
  const exact = quizzes.find((q) => q.id === searchId);
  if (exact) return exact;

  // Partial match (starts with)
  const partial = quizzes.find((q) => q.id.toLowerCase().startsWith(searchId.toLowerCase()));
  if (partial) return partial;

  // Fuzzy match (contains)
  const fuzzy = quizzes.find((q) => q.id.toLowerCase().includes(searchId.toLowerCase()));
  return fuzzy ?? null;
}
