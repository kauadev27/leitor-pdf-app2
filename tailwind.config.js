/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        // Paleta definida no design (mockups do Figma)
        cream: "#FAF6F0", // fundo claro
        charcoal: "#1C1B1A", // fundo escuro
        terracota: {
          DEFAULT: "#C96F4A",
          light: "#E3A98A",
          dark: "#A85A3A",
        },
        sage: "#7A8B6F",
        ink: "#2B2420", // texto principal (claro)
        "ink-dark": "#EDE7DE", // texto principal (escuro)
        muted: "#8C8377", // texto secundário
        highlight: {
          yellow: "#F2CB6C",
          blue: "#8FB4D9",
          pink: "#E3A3A3",
          green: "#A8C9A1",
        },
      },
      fontFamily: {
        sans: ["Manrope", "Inter", "system-ui", "sans-serif"],
        reading: ["Lora", "Georgia", "serif"],
      },
      borderRadius: {
        card: "12px",
      },
    },
  },
  plugins: [],
};
