/*
 * ComparisonTable — "Mengapa Jaya Abadi?": tabel dua kolom (Jaya Abadi vs
 * Kontraktor Biasa), 6 baris ikon centang/silang, kolom kami disorot oranye
 * lembut; mobile: kartu bertumpuk. Data: GET /api/public/features bila ≥1 —
 * dipakai sebagai baris (title = aspek, description = nilai kami); sisanya statis.
 */
import { useQuery } from "@tanstack/react-query";
import { Check, X } from "lucide-react";
import api from "../../../lib/axios.js";
import Container from "../Container.jsx";

const STATIC_ROWS = [
  ["RAB transparan", "RAB terperinci hingga item, bisa diaudit kapan saja", "Anggaran global, sering muncul biaya tambahan"],
  ["Laporan progres mingguan", "Laporan berkala + dokumentasi foto tiap minggu", "Update hanya bila diminta atau saat bermasalah"],
  ["Garansi pekerjaan", "Garansi retensi — kami kembali bila ada cacat", "Sulit dikejar setelah serah terima"],
  ["Tenaga bersertifikat", "Mandor & pekerja terlatih bersertifikat", "Kompetensi bervariasi, tanpa standar"],
  ["Keselamatan kerja (K3)", "APD wajib, prosedur K3 di setiap lokasi", "Sering diabaikan di proyek kecil"],
  ["Jadwal tertulis", "Timeline kontraktual dengan milestone terukur", "Jadwal informal, mudah bergeser"],
];

export default function ComparisonTable() {
  const { data } = useQuery({
    queryKey: ["public-features"],
    queryFn: async () => (await api.get("/public/features")).data.data,
  });
  // Bila CMS punya features ≥6, pakai title sebagai aspek (deskripsi = kolom kami)
  const base = (data?.length ?? 0) >= 6
    ? data.slice(0, 6).map((f, i) => [f.title, f.description || STATIC_ROWS[i][1], STATIC_ROWS[i][2]])
    : (data?.length > 0 && data.length < 6 ? STATIC_ROWS : STATIC_ROWS);

  return (
    <section className="bg-cream py-16 sm:py-20">
      <Container>
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-bold uppercase tracking-widest text-brand">Perbandingan</p>
          <h2 className="mt-2 font-jakarta text-3xl font-extrabold text-ink sm:text-4xl">Mengapa <span className="text-brand">Jaya Abadi?</span></h2>
        </div>

        {/* Desktop: tabel */}
        <div className="mt-10 hidden overflow-hidden rounded-3xl border border-ink/8 bg-white shadow-soft md:block">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-ink/8">
                <th scope="col" className="p-5 font-jakarta font-bold text-ink-soft">Aspek</th>
                <th scope="col" className="bg-brand-soft/70 p-5 font-jakarta font-extrabold text-brand-dark">Jaya Abadi</th>
                <th scope="col" className="p-5 font-jakarta font-bold text-ink-soft">Kontraktor Biasa</th>
              </tr>
            </thead>
            <tbody>
              {base.map(([aspek, kami, biasa]) => (
                <tr key={aspek} className="border-b border-ink/5 last:border-0">
                  <th scope="row" className="p-5 font-jakarta font-bold text-ink">{aspek}</th>
                  <td className="bg-brand-soft/70 p-5 text-ink">
                    <span className="flex items-start gap-2"><Check size={16} className="mt-0.5 shrink-0 text-brand" /> {kami}</span>
                  </td>
                  <td className="p-5 text-ink-light">
                    <span className="flex items-start gap-2"><X size={16} className="mt-0.5 shrink-0 text-red-400" /> {biasa}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile: kartu bertumpuk */}
        <div className="mt-10 space-y-4 md:hidden">
          {base.map(([aspek, kami, biasa]) => (
            <div key={aspek} className="overflow-hidden rounded-2xl border border-ink/8 bg-white shadow-soft">
              <div className="bg-brand-soft/70 px-4 py-3">
                <p className="flex items-center gap-2 font-jakarta font-bold text-ink">
                  <Check size={16} className="text-brand" /> {aspek}
                </p>
                <p className="mt-1 pl-6 text-sm text-ink">{kami}</p>
              </div>
              <p className="flex items-start gap-2 px-4 py-3 text-sm text-ink-light">
                <X size={15} className="mt-0.5 shrink-0 text-red-400" /> {biasa}
              </p>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
