import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Crew Up 공식 BI
        brand: {
          DEFAULT: "#2F6BFF", // Primary
          dark: "#1E54E6", // 그라데이션·hover용 딥블루
        },
        crew: {
          blue: "#2F6BFF",
          dark: "#111827", // 텍스트 다크 잉크
        },
      },
    },
  },
  plugins: [],
};

export default config;
