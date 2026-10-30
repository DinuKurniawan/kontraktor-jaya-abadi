// Keunggulan perusahaan — pakai IconListAdmin (ikon, judul, deskripsi, urutan, publish)
import IconListAdmin from "../../components/admin/IconListAdmin.jsx";

export default function Features() {
  return (
    <IconListAdmin
      endpoint="/admin/features"
      queryKey="features"
      title="Keunggulan"
      addLabel="Tambah Keunggulan"
      emptyTitle="Belum ada keunggulan"
    />
  );
}
