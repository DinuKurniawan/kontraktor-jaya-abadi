// Katalog design system website publik — rute /_ui-public (sementara, untuk pengembangan)
import { Hammer, Building2, Ruler, Paintbrush } from "lucide-react";
import Container from "../components/public/Container.jsx";
import SectionHeading from "../components/public/SectionHeading.jsx";
import PillButton from "../components/public/PillButton.jsx";
import ProjectCard from "../components/public/ProjectCard.jsx";
import ServiceCard from "../components/public/ServiceCard.jsx";
import ArticleCard from "../components/public/ArticleCard.jsx";
import TestimonialCard from "../components/public/TestimonialCard.jsx";
import Breadcrumb from "../components/public/Breadcrumb.jsx";
import PublicSkeleton from "../components/public/PublicSkeleton.jsx";

const IMG = "https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=800&q=70";

export default function UICatalog() {
  return (
    <div className="space-y-16 bg-cream py-12 font-jakarta text-ink">
      {/* Token */}
      <section>
        <Container>
          <h1 className="text-3xl font-extrabold sm:text-4xl">
            Design System <span className="text-brand">Publik</span> — Jaya Abadi
          </h1>
          <p className="mt-2 max-w-xl text-sm text-ink-soft">
            Krem hangat #FBF5F0, aksen oranye #F26B3A, hitam hangat #1C1917. Font Plus Jakarta Sans.
            Kartu rounded-2xl, tombol pill, jarak antar section lega.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            {[
              ["brand", "#F26B3A"],
              ["brand-dark", "#D9501F"],
              ["brand-soft", "#FDE8DE"],
              ["cream", "#FBF5F0"],
              ["cream-deep", "#F3E9E0"],
              ["ink", "#1C1917"],
              ["ink-soft", "#57534E"],
              ["ink-light", "#A8A29E"],
            ].map(([name, hex]) => (
              <div key={name} className="w-32 overflow-hidden rounded-xl border border-ink/10 bg-white">
                <div className="h-12" style={{ background: hex }} />
                <div className="px-2.5 py-1.5 text-[10px]">
                  <p className="font-bold">{name}</p>
                  <p className="text-ink-light">{hex}</p>
                </div>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* Buttons */}
      <section>
        <Container>
          <h2 className="mb-5 text-xl font-extrabold">PillButton</h2>
          <div className="flex flex-wrap items-center gap-3 rounded-2xl bg-cream-deep p-6">
            <PillButton variant="primary">Mulai Konsultasi</PillButton>
            <PillButton variant="dark">Lihat Proyek</PillButton>
            <PillButton variant="outline">Hubungi Kami</PillButton>
            <PillButton variant="primary" to="/admin">Sebagai Link</PillButton>
            <PillButton variant="primary" disabled>Disabled</PillButton>
          </div>
        </Container>
      </section>

      {/* SectionHeading */}
      <section>
        <Container>
          <h2 className="mb-5 text-xl font-extrabold">SectionHeading</h2>
          <SectionHeading
            title={<>Proyek <span className="text-brand">Pilihan</span></>}
            to="#"
          />
        </Container>
      </section>

      {/* ProjectCard */}
      <section className="bg-cream-deep py-12">
        <Container>
          <h2 className="mb-5 text-xl font-extrabold">ProjectCard</h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <ProjectCard title="Rumah Tinggal Modern 2 Lantai" location="Bekasi" category="Rumah Tinggal" image={IMG} />
            <ProjectCard title="Renovasi Kantor PT Maju" location="Jakarta Selatan" image={IMG} />
            <ProjectCard title="Gudang Logistik 1.200 m²" location="Cikarang" category="Gudang" />
          </div>
        </Container>
      </section>

      {/* ServiceCard */}
      <section>
        <Container>
          <h2 className="mb-5 text-xl font-extrabold">ServiceCard</h2>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <ServiceCard icon={Building2} title="Konstruksi Bangunan" description="Pembangunan rumah, ruko, dan gudang dari nol." />
            <ServiceCard icon={Hammer} title="Renovasi" description="Perombakan & perbaikan struktur tanpa drama." />
            <ServiceCard icon={Ruler} title="Desain & RAB" description="Denah, 3D, dan estimasi biaya transparan." />
            <ServiceCard icon={Paintbrush} title="Finishing" description="Cat, plafon, keramik presisi rapi." />
          </div>
        </Container>
      </section>

      {/* ArticleCard */}
      <section>
        <Container>
          <h2 className="mb-5 text-xl font-extrabold">ArticleCard</h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <ArticleCard title="5 Tahapan Membangun Rumah dari Nol" category="Tips" date="12 Okt 2026" readTime={4} image={IMG} />
            <ArticleCard title="Cara Membaca RAB Kontraktor" category="Panduan" date="3 Okt 2026" readTime={6} image={IMG} />
            <ArticleCard title="Renovasi Dapur Budget 30 Juta" date="28 Sep 2026" readTime={3} />
          </div>
        </Container>
      </section>

      {/* TestimonialCard */}
      <section className="bg-cream-deep py-12">
        <Container>
          <h2 className="mb-5 text-xl font-extrabold">TestimonialCard</h2>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <TestimonialCard name="Budi Santoso" role="Direktur" company="PT Maju" rating={5} content="Pengerjaan cepat, rapi, dan sesuai RAB. Komunikasi tiap minggu sangat membantu." />
            <TestimonialCard name="Sari Wulandari" role="Ibu Rumah Tangga" rating={4} content="Renovasi dapur selesai 3 minggu. Hasil melebihi ekspektasi, tim sopan dan bersih." avatar={IMG} />
          </div>
        </Container>
      </section>

      {/* Breadcrumb + Skeleton */}
      <section>
        <Container className="space-y-10">
          <div>
            <h2 className="mb-5 text-xl font-extrabold">Breadcrumb</h2>
            <Breadcrumb items={[{ label: "Proyek", to: "#" }, { label: "Rumah Tinggal Modern" }]} />
          </div>
          <div>
            <h2 className="mb-5 text-xl font-extrabold">PublicSkeleton</h2>
            <div className="overflow-hidden rounded-2xl border border-ink/10">
              <PublicSkeleton />
            </div>
          </div>
        </Container>
      </section>
    </div>
  );
}
