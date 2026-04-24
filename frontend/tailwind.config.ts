import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        status: {
          todo: "#facc15",
          "in-progress": "#3b82f6",
          done: "#22c55e",
        },
        priority: {
          low: "#9ca3af",
          medium: "#f97316",
          high: "#ef4444",
        },
      },
    },
  },
  plugins: [],
};

export default config;
