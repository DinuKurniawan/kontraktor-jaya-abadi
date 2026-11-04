// Gambar dengan rasio tetap dan placeholder aman saat sumber gagal dimuat.
import { useEffect, useRef, useState } from "react";
import { ImageOff } from "lucide-react";

const RATIO_VALUES = {
  "4/3": "4 / 3",
  "16/9": "16 / 9",
  "1/1": "1 / 1",
  "4/5": "4 / 5",
};

export default function AspectImage({
  src,
  alt = "",
  ratio = "4/3",
  fit = "cover",
  position = "center",
  priority = false,
  className = "",
}) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  const imgRef = useRef(null);
  const ratioValue = RATIO_VALUES[ratio] ?? RATIO_VALUES["4/3"];

  // Gambar dari cache browser bisa selesai dimuat sebelum event onLoad
  // terpasang (mis. saat pindah halaman tanpa reload). Cek `complete`
  // langsung supaya gambar tidak tertahan di opacity-0.
  useEffect(() => {
    const el = imgRef.current;
    if (el && el.complete && el.naturalWidth > 0) {
      setLoaded(true);
      setFailed(false);
      return;
    }
    setLoaded(false);
    setFailed(false);
  }, [src]);

  return (
    <div
      className={`relative overflow-hidden bg-gradient-to-br from-cream-deep via-cream to-brand/10 ${className}`}
      style={{ aspectRatio: ratioValue }}
    >
      {failed || !src ? (
        <div className="absolute inset-0 flex items-center justify-center text-brand/45" role="img" aria-label="Gambar tidak tersedia">
          <ImageOff size={28} aria-hidden="true" />
        </div>
      ) : (
        <img
          ref={imgRef}
          src={src}
          alt={alt}
          loading={priority ? undefined : "lazy"}
          decoding="async"
          fetchPriority={priority ? "high" : undefined}
          onLoad={() => setLoaded(true)}
          onError={() => setFailed(true)}
          className={`absolute inset-0 h-full w-full transition-opacity duration-300 ${loaded ? "opacity-100" : "opacity-0"}`}
          style={{ objectFit: fit, objectPosition: position }}
        />
      )}
    </div>
  );
}
