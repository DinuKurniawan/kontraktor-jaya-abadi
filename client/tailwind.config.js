/** @type {import('tailwindcss').Config} */
// Design token CMS Admin — mengikuti referensi dashboard (sidebar biru, kartu putih, surface abu-biru)
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#4361D8", // biru utama (sidebar, header kartu, tombol)
          dark: "#3450C2",
          soft: "#EEF1FB", // biru pucat untuk latar elemen sekunder
        },
        surface: "#EDF1F9", // abu-biru muda — latar halaman admin
        border: "#E3E8F2",
        text: {
          DEFAULT: "#333F54",
          muted: "#8792A6",
        },
        success: { DEFAULT: "#22C55E", soft: "#E7F8EF" },
        warning: { DEFAULT: "#E9A23B", soft: "#FDF3E3" },
        danger: { DEFAULT: "#EF4444", soft: "#FDECEC" },

        // ===== Design token website publik (krem hangat + oranye konstruksi) =====
        brand: {
          DEFAULT: "#B4400F", // oranye aksen WCAG AA (>= 4.5:1 di atas krem/putih dan di bawah teks putih)
          dark: "#9A3412",
          soft: "#FDE8DE", // oranye pucat untuk chip/latar
          strong: "#9A3412", // oranye pekat untuk teks kecil di atas krem
          light: "#FF8A5B", // oranye terang untuk teks di atas latar gelap (bg-ink) — 7.53:1
        },
        cream: {
          DEFAULT: "#FBF5F0", // latar hangat halaman publik
          deep: "#F3E9E0", // latar section selang-seling
        },
        ink: {
          DEFAULT: "#1C1917", // hitam hangat: judul & tombol pill
          soft: "#57534E", // body text (>= 4.5:1)
          light: "#6F6862", // caption/meta WCAG AA (>= 4.58:1 di atas cream-deep, >= 5.07:1 di atas cream)
        },
      },
      fontFamily: {
        sans: ["Inter", '"Inter Fallback"', "ui-sans-serif", "system-ui", "sans-serif"],
        display: ["Poppins", '"Poppins Fallback"', "Inter", "sans-serif"],
        jakarta: ['"Plus Jakarta Sans"', '"Plus Jakarta Sans Fallback"', "ui-sans-serif", "system-ui", "sans-serif"],
      },
      boxShadow: {
        soft: "0 8px 24px rgba(67, 97, 216, 0.08)",
        "soft-lg": "0 16px 40px rgba(67, 97, 216, 0.16)",
      },
    },
  },
  plugins: [],
};
