import { join } from "node:path";
import {
  ThemeConfigSchema,
  getTheme,
  type Theme,
  type ThemeColors,
  type ThemeConfig,
} from "../models/theme.ts";

let currentTheme: Theme | null = null;

/**
 * Load theme from .tuizlet/theme.json
 */
export async function loadTheme(tuizletDir: string): Promise<Theme> {
  const themePath = join(tuizletDir, "theme.json");

  try {
    const file = Bun.file(themePath);
    if (await file.exists()) {
      const content = await file.json();
      const config = ThemeConfigSchema.parse(content);

      // Get base theme
      const baseTheme = getTheme(config.theme);

      // Merge custom colors if provided
      if (config.customColors) {
        currentTheme = {
          ...baseTheme,
          colors: {
            ...baseTheme.colors,
            ...config.customColors,
          },
        };
      } else {
        currentTheme = baseTheme;
      }
    } else {
      // No theme file, use default
      currentTheme = getTheme("default");
    }
  } catch (error) {
    // Invalid theme file, use default
    console.error("Error loading theme:", error);
    currentTheme = getTheme("default");
  }

  return currentTheme;
}

/**
 * Get the current loaded theme (or default if not loaded)
 */
export function getCurrentTheme(): Theme {
  if (!currentTheme) {
    currentTheme = getTheme("default");
  }
  return currentTheme;
}

/**
 * Get theme colors (shorthand)
 */
export function getColors(): ThemeColors {
  return getCurrentTheme().colors;
}
