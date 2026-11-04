/*
 * ServiceProcess — reuse ProcessSection (beranda) untuk halaman /layanan.
 * Menampilkan satu chip "Semua" pada halaman layanan.
 * id="alur" supaya sub-navigasi "Alur" punya target section yang nyata.
 */
import ProcessSection from "../home/ProcessSection.jsx";
export default function ServiceProcess({ services }) {
  return <ProcessSection services={services} id="alur" />;
}
