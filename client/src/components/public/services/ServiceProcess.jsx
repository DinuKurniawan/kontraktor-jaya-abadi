/*
 * ServiceProcess — reuse ProcessSection (beranda) untuk halaman /layanan.
 * Menambah chip filter "Semua / per layanan" bila ada langkah tertaut layanan.
 */
import ProcessSection from "../home/ProcessSection.jsx";
export default function ServiceProcess({ services }) {
  return <ProcessSection services={services} />;
}
