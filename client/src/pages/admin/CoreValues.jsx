// CoreValues — kartu dengan IconListAdmin generic (ikon, judul, deskripsi, urutan, publish)
import IconListAdmin from "../../components/admin/IconListAdmin.jsx";

export default function CoreValues() {
  return (
    <IconListAdmin
      endpoint="/admin/core-values"
      queryKey="core-values"
      title="Nilai Perusahaan"
      addLabel="Tambah Nilai"
      emptyTitle="Belum ada nilai perusahaan"
    />
  );
}
