import type { Config } from "tailwindcss";

const config: Config = {
  // Disable Tailwind's CSS reset so it doesn't conflict with MUI's
  // CssBaseline. We only use Tailwind for utility classes (flex, grid,
  // gap, spacing, etc.) alongside MUI components.
  corePlugins: {
    preflight: false,
  },
  content: [
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
};

export default config;
