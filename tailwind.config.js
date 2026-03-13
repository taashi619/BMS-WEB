export default {
  content: ["./index.html", "./src/**/*.{ts,tsx,js,jsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: "#17b09c", // primary
          dark: "#00897B",
        },
        bg: {
          DEFAULT: "#F5F5F7",
        },
        text: {
          main: "#222222",
          secondary: "#666666",
        },
        status: {
          available: "#2E7D32",
          booked: "#C62828",
        },
      },
    },
  },
  plugins: [],
};
