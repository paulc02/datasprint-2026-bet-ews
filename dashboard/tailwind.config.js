/** @type {import('tailwindcss').Config} */
const v = (n) => `var(--${n})`;
export default {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: v("bg"), "bg-soft": v("bg-soft"), surface: v("surface"), "surface-2": v("surface-2"),
        line: v("border"), "line-strong": v("border-strong"),
        fg: v("text"), "fg-2": v("text-2"), muted: v("muted"),
        accent: v("accent"), "accent-2": v("accent-2"), "accent-soft": v("accent-soft"), "accent-ink": v("accent-ink"),
        red: v("red"), "red-soft": v("red-soft"), amber: v("amber"), "amber-soft": v("amber-soft"),
        green: v("green"), "green-soft": v("green-soft"), grid: v("grid"),
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "-apple-system", "Segoe UI", "Roboto", "sans-serif"],
        mono: ["'JetBrains Mono'", "ui-monospace", "SFMono-Regular", "Menlo", "Consolas", "monospace"],
      },
    },
  },
  plugins: [],
};
