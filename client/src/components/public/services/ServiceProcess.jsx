/*
 * ServiceProcess — reuse ProcessSection (beranda) untuk halaman /layanan.
 * Menampilkan satu chip "Semua" pada halaman layanan.
 */
import ProcessSection from "../home/ProcessSection.jsx";
export default function ServiceProcess({ services }) {
  return <ProcessSection services={services} />;
}
