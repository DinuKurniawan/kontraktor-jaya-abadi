// Gambar aman: tampilkan placeholder rapi bila sumber gambar gagal dimuat.
import { ImageOff } from "lucide-react";
import { useState } from "react";

export default function ImageWithFallback({ src, alt = "", className = "", placeholderClassName = "", ...props }) {
  const [failed, setFailed] = useState(false);

  if (failed || !src) {
    return (
      <div className={`flex items-center justify-center bg-cream-deep text-ink-light ${placeholderClassName || className}`} role="img" aria-label="Gambar tidak tersedia">
        <ImageOff size={24} aria-hidden="true" />
      </div>
    );
  }

  return <img src={src} alt={alt} className={className} onError={() => setFailed(true)} {...props} />;
}
