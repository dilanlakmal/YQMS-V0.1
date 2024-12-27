/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      height: {
       '128': '32rem',  // 512px
        '144': '36rem',  // 576px
        '160': '40rem',  // 640px
        '176': '44rem',  // 704px
        '192': '48rem',  // 768px
        '208': '52rem',  // 832px
        '224': '56rem',  // 896px
        '240': '60rem',  // 960px
        '256': '64rem',  // 1024px
        '272': '68rem',  // 1088px
        '288': '72rem',  // 1152px
        '304': '76rem',  // 1216px
        '320': '80rem',  // 1280px
      },
    },
  },
    
  variants: {},

  plugins: [],
}
