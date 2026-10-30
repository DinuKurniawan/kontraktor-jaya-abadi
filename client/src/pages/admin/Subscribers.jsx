// Admin: daftar pelanggan newsletter — tabel + ekspor CSV
import { useQuery } from "@tanstack/react-query";
import { Download } from "lucide-react";
import api from "../../lib/axios.js";
import Card from "../../components/ui/Card.jsx";

export default function Subscribers() {
  const { data, isLoading } = useQuery({
    queryKey: ["admin-subscribers"],
    queryFn: async () => (await api.get("/admin/subscribers")).data.data,
  });
  const rows = data ?? [];

  // Ekspor CSV di sisi klien — data kecil, tak perlu endpoint
  const exportCsv = () => {
    const csv = "email,created_at\n" + rows.map((r) => `${r.email},${r.createdAt}`).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const a = Object.assign(document.createElement("a"), { href: url, download: "subscribers.csv" });
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-xl font-semibold text-text">Pelanggan Newsletter</h1>
        <button type="button" onClick={exportCsv} disabled={rows.length === 0}
          className="inline-flex items-center gap-2 rounded-lg bg-ink px-4 py-2.5 text-sm font-semibold text-cream transition hover:opacity-90 disabled:opacity-50">
          <Download size={15} /> Ekspor CSV
        </button>
      </div>

      {isLoading ? (
        <p className="text-sm text-gray-500">Memuat…</p>
      ) : (
        <Card>
          {rows.length === 0 ? (
            <p className="p-6 text-sm text-gray-500">Belum ada pelanggan.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-border text-xs uppercase text-gray-500">
                  <tr><th className="px-5 py-3">Email</th><th className="px-5 py-3">Tanggal daftar</th></tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.id} className="border-b border-border/60 last:border-0">
                      <td className="px-5 py-3 font-medium text-text">{r.email}</td>
                      <td className="px-5 py-3 text-gray-500">{new Date(r.createdAt).toLocaleString("id-ID")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
