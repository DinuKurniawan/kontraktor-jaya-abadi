// Langkah alur kerja — pakai IconListAdmin (ikon, judul, deskripsi, urutan, publish)
import IconListAdmin from "../../components/admin/IconListAdmin.jsx";

export default function ProcessSteps() {
  return (
    <IconListAdmin
      endpoint="/admin/process-steps"
      queryKey="process-steps"
      title="Langkah Alur Kerja"
      addLabel="Tambah Langkah"
      emptyTitle="Belum ada langkah alur"
    />
  );
}
