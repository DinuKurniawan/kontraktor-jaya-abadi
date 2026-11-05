// ProjectGallery — justified rows: gambar utuh tanpa crop, baris terisi penuh,
// tinggi seragam per baris, pagination 6 per halaman, klik buka lightbox.
import { useEffect, useRef, useState } from "react";
import Pagination from "../Pagination.jsx";

const PER_PAGE = 6;
const ROW_H_DESKTOP = 200; // px
const ROW_H_MOBILE = 140;

// Clamp rasio agar panorama/sangat tinggi tidak merusak baris
const clampRatio = (r) => Math.min(2.5, Math.max(0.5, r));

function GalleryCard({ photo, index, alt, onOpen }) {
  const initial =
    photo.width && photo.height
      ? photo.width / photo.height
      : photo.aspectRatio || 4 / 3;
  const [ratio, setRatio] = useState(clampRatio(initial));

  const handleLoad = (e) => {
    const { naturalWidth: w, naturalHeight: h } = e.currentTarget;
    if (w && h) {
      const r = clampRatio(w / h);
      if (Math.abs(r - ratio) > 0.01) setRatio(r);
    }
  };

  return (
    <button
      type="button"
      onClick={() => onOpen?.(index)}
      aria-label={`Perbesar ${alt}`}
      className="group relative overflow-hidden rounded-2xl"
      style={{
        flexGrow: ratio,
        flexBasis: `calc(var(--row-h) * ${ratio})`,
        aspectRatio: `${ratio}`,
      }}
    >
      <img
        src={photo.url}
        alt={alt}
        loading="lazy"
        onLoad={handleLoad}
        className="block h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
      />
    </button>
  );
}

export default function ProjectGallery({ images = [], title = "", onOpen }) {
  const [page, setPage] = useState(1);
  const sectionRef = useRef(null);
  const single = images.length === 1;
  const totalPages = Math.max(1, Math.ceil(images.length / PER_PAGE));
  const offset = images.length > PER_PAGE ? (page - 1) * PER_PAGE : 0;
  const visible = images.slice(offset, offset + PER_PAGE);

  useEffect(() => { setPage(1); }, [images.length]);

  const changePage = (next) => {
    setPage(next);
    const el = sectionRef.current;
    if (el && el.getBoundingClientRect().top < 0) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <section ref={sectionRef} className="scroll-mt-24" aria-labelledby="galeri-proyek">
      <h2 id="galeri-proyek" className="font-jakarta text-2xl font-extrabold text-ink">
        Galeri <span className="text-brand">proyek</span>
      </h2>

      {single ? (
        <div className="mt-5">
          <button
            type="button"
            onClick={() => onOpen?.(0)}
            aria-label={`Perbesar ${visible[0]?.caption || title}`}
            className="group block w-full overflow-hidden rounded-2xl"
          >
            <img
              src={visible[0]?.url}
              alt={visible[0]?.caption || `${title} — foto 1`}
              loading="lazy"
              className="block h-auto w-full transition-transform duration-300 group-hover:scale-[1.03]"
            />
          </button>
        </div>
      ) : (
        <div
          className="mt-5 flex flex-wrap gap-2 [--row-h:140px] sm:[--row-h:200px] after:grow-[10] after:content-['']"
        >
          {visible.map((photo, i) => {
            const index = offset + i;
            return (
              <GalleryCard
                key={`${photo.url}-${index}`}
                photo={photo}
                index={index}
                alt={photo.caption || `${title} — foto ${index + 1}`}
                onOpen={onOpen}
              />
            );
          })}
        </div>
      )}

      {images.length > PER_PAGE && (
        <div className="mt-6">
          <Pagination page={page} totalPages={totalPages} onChange={changePage} label="Paginasi galeri proyek" />
        </div>
      )}
    </section>
  );
}
