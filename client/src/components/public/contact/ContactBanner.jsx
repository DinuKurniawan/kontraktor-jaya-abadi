// ContactBanner — judul kontak, subjudul, dan status kantor utama.
import Container from "../Container.jsx";
import Breadcrumb from "../Breadcrumb.jsx";
import OpenStatusBadge from "./OpenStatusBadge.jsx";

export default function ContactBanner({ branch }) {
  return (
    <section className="bg-cream-deep pb-10 pt-14 sm:pb-12 sm:pt-16">
      <Container>
        <Breadcrumb items={[{ label: "Kontak" }]} />
        <div className="mt-5 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-2xl">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand">Jaya Abadi</p>
            <h1 className="mt-3 font-jakarta text-4xl font-extrabold leading-tight text-ink sm:text-5xl">Hubungi <span className="text-brand">Kami</span></h1>
            <p className="mt-3 max-w-xl text-base leading-relaxed text-ink-soft sm:text-lg">Diskusikan proyek Anda — kami siap membantu dari konsultasi awal hingga serah terima.</p>
          </div>
          {branch && <OpenStatusBadge openingHours={branch.openingHours} />}
        </div>
      </Container>
    </section>
  );
}
