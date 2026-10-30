// Placeholder halaman publik — diganti halaman asli pada iterasi berikutnya
import { Link } from "react-router-dom";
import Container from "../../components/public/Container.jsx";
import Breadcrumb from "../../components/public/Breadcrumb.jsx";
import PillButton from "../../components/public/PillButton.jsx";

export default function PublicPlaceholder({ title, crumbs = [] }) {
  return (
    <div className="bg-cream">
      <Container className="min-h-[50vh] py-16 sm:py-24">
        {crumbs.length > 0 && <Breadcrumb items={crumbs} />}
        <h1 className="mt-4 font-jakarta text-4xl font-extrabold text-ink sm:text-5xl">
          {title}
        </h1>
        <p className="mt-3 max-w-md text-ink-soft">
          Halaman ini masih dalam pengerjaan. Konten aslinya akan menyusul.
        </p>
        <div className="mt-8">
          <PillButton variant="primary" to="/">Kembali ke Beranda</PillButton>
        </div>
      </Container>
      <div className="h-32 bg-cream-deep" aria-hidden />
    </div>
  );
}

// 404 — gaya sama, tanpa breadcrumb
export function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center bg-cream text-center">
      <p className="font-jakarta text-7xl font-extrabold text-brand">404</p>
      <h1 className="mt-2 font-jakarta text-2xl font-extrabold text-ink">Halaman tidak ditemukan</h1>
      <p className="mt-2 text-sm text-ink-soft">Tautan yang Anda buka tidak ada atau sudah dipindahkan.</p>
      <div className="mt-6">
        <PillButton variant="dark" to="/">Kembali ke Beranda</PillButton>
      </div>
    </div>
  );
}
