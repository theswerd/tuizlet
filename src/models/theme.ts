import { z } from "zod";

/**
 * Color values - hex strings
 */
export const ColorSchema = z.string().regex(/^#[0-9a-fA-F]{6}$/);
export type Color = z.infer<typeof ColorSchema>;

/**
 * Theme color palette
 */
export const ThemeColorsSchema = z.object({
  /** Primary accent color - used for selections, highlights */
  primary: ColorSchema,
  /** Secondary accent color */
  secondary: ColorSchema,
  /** Success color - correct answers */
  success: ColorSchema,
  /** Error color - wrong answers */
  error: ColorSchema,
  /** Warning color - medium scores */
  warning: ColorSchema,
  /** Muted/dim text color */
  muted: ColorSchema,
  /** Text color */
  text: ColorSchema,
});
export type ThemeColors = z.infer<typeof ThemeColorsSchema>;

/**
 * Complete theme definition
 */
export const ThemeSchema = z.object({
  /** Theme name */
  name: z.string(),
  /** Theme description */
  description: z.string().optional(),
  /** Color palette */
  colors: ThemeColorsSchema,
});
export type Theme = z.infer<typeof ThemeSchema>;

/**
 * User theme configuration file
 */
export const ThemeConfigSchema = z.object({
  /** Active theme name or "custom" */
  theme: z.string().default("default"),
  /** Custom color overrides (merged with active theme) */
  customColors: ThemeColorsSchema.partial().optional(),
});
export type ThemeConfig = z.infer<typeof ThemeConfigSchema>;

// ============================================================================
// Default Theme Presets
// ============================================================================

export const themes: Record<string, Theme> = {
  default: {
    name: "Default",
    description: "Clean blue theme",
    colors: {
      primary: "#38bdf8",   // sky blue
      secondary: "#a78bfa", // violet
      success: "#22c55e",   // green
      error: "#ef4444",     // red
      warning: "#eab308",   // yellow
      muted: "#737373",     // gray
      text: "#ffffff",      // white
    },
  },

  ocean: {
    name: "Ocean",
    description: "Deep sea blues and teals",
    colors: {
      primary: "#06b6d4",   // cyan
      secondary: "#0ea5e9", // sky
      success: "#14b8a6",   // teal
      error: "#f43f5e",     // rose
      warning: "#fbbf24",   // amber
      muted: "#64748b",     // slate
      text: "#f0f9ff",      // sky-50
    },
  },

  forest: {
    name: "Forest",
    description: "Natural greens and earth tones",
    colors: {
      primary: "#22c55e",   // green
      secondary: "#84cc16", // lime
      success: "#10b981",   // emerald
      error: "#dc2626",     // red
      warning: "#ca8a04",   // yellow-600
      muted: "#6b7280",     // gray
      text: "#ecfdf5",      // emerald-50
    },
  },

  sunset: {
    name: "Sunset",
    description: "Warm oranges and pinks",
    colors: {
      primary: "#f97316",   // orange
      secondary: "#ec4899", // pink
      success: "#84cc16",   // lime
      error: "#dc2626",     // red
      warning: "#fbbf24",   // amber
      muted: "#78716c",     // stone
      text: "#fff7ed",      // orange-50
    },
  },

  purple: {
    name: "Purple Rain",
    description: "Rich purples and violets",
    colors: {
      primary: "#a855f7",   // purple
      secondary: "#ec4899", // pink
      success: "#22d3ee",   // cyan
      error: "#f43f5e",     // rose
      warning: "#fbbf24",   // amber
      muted: "#71717a",     // zinc
      text: "#faf5ff",      // purple-50
    },
  },

  monochrome: {
    name: "Monochrome",
    description: "Classic black and white",
    colors: {
      primary: "#ffffff",   // white
      secondary: "#d4d4d4", // neutral-300
      success: "#a3a3a3",   // neutral-400
      error: "#737373",     // neutral-500
      warning: "#a3a3a3",   // neutral-400
      muted: "#525252",     // neutral-600
      text: "#fafafa",      // neutral-50
    },
  },

  dracula: {
    name: "Dracula",
    description: "Popular dark theme colors",
    colors: {
      primary: "#bd93f9",   // purple
      secondary: "#ff79c6", // pink
      success: "#50fa7b",   // green
      error: "#ff5555",     // red
      warning: "#f1fa8c",   // yellow
      muted: "#6272a4",     // comment
      text: "#f8f8f2",      // foreground
    },
  },

  nord: {
    name: "Nord",
    description: "Arctic, north-bluish color palette",
    colors: {
      primary: "#88c0d0",   // nord8 - frost
      secondary: "#81a1c1", // nord9
      success: "#a3be8c",   // nord14 - green
      error: "#bf616a",     // nord11 - red
      warning: "#ebcb8b",   // nord13 - yellow
      muted: "#4c566a",     // nord3
      text: "#eceff4",      // nord6
    },
  },

  solarized: {
    name: "Solarized",
    description: "Ethan Schoonover's precision colors",
    colors: {
      primary: "#268bd2",   // blue
      secondary: "#2aa198", // cyan
      success: "#859900",   // green
      error: "#dc322f",     // red
      warning: "#b58900",   // yellow
      muted: "#586e75",     // base01
      text: "#fdf6e3",      // base3
    },
  },

  rose: {
    name: "Rose Garden",
    description: "Soft pinks and roses",
    colors: {
      primary: "#fb7185",   // rose-400
      secondary: "#f472b6", // pink-400
      success: "#4ade80",   // green-400
      error: "#f87171",     // red-400
      warning: "#fbbf24",   // amber-400
      muted: "#a1a1aa",     // zinc-400
      text: "#fff1f2",      // rose-50
    },
  },
};

/**
 * Get a theme by name, falls back to default
 */
export function getTheme(name: string): Theme {
  return themes[name] ?? themes.default!;
}

/**
 * Get list of available theme names
 */
export function getThemeNames(): string[] {
  return Object.keys(themes);
}
