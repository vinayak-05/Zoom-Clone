/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        zoom: {
          blue: "#0B5CFF",
          "blue-hover": "#0845BF",
          orange: "#FF742E",
          "orange-hover": "#E56322",
          text: "#232333",
          muted: "#747487",
          border: "#E4E4EB",
          bg: "#F7F7FA",
          dark: "#1C1C1C",
          "dark-bar": "#232323",
          "dark-tile": "#2E2E38",
          red: "#E02828",
          "red-hover": "#C51F1F",
          green: "#0E8A16",
        },
      },
      fontFamily: {
        sans: ["Lato", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "sans-serif"],
      },
      borderRadius: {
        zoom: "8px",
      },
      boxShadow: {
        zoom: "0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px 0 rgba(0, 0, 0, 0.03)",
        "zoom-card": "0 2px 8px 0 rgba(0, 0, 0, 0.06)",
        "zoom-modal": "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)",
      },
    },
  },
  plugins: [],
};
