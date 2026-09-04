import type { Config } from "tailwindcss";
const config: Config = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: { extend: {
    colors: { d2d3: { crimson: "#CD0947", navy: "#15324A" } },
    fontFamily: { sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"] },
  } },
  plugins: [],
};
export default config;
