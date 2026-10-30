/*
 * Reveal — wrapper animasi masuk saat elemen terlihat (IntersectionObserver).
 * Pakai: <Reveal className="..."><Child/></Reveal>; fallback timer agar tak
 * mungkin konten tak muncul (sama dengan pola count-up di HomeSections).
 */
import { useEffect, useRef, useState } from "react";

export default function Reveal({ as: Tag = "div", className = "", delay = 0, children, ...rest }) {
  const ref = useRef(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const start = () => setShown(true);
    const io = "IntersectionObserver" in window
      ? new IntersectionObserver(([e]) => e.isIntersecting && (start(), io.disconnect()), { threshold: 0.15 })
      : null;
    io?.observe(el);
    const fb = setTimeout(start, 2500);
    return () => { clearTimeout(fb); io?.disconnect(); };
  }, []);

  return (
    <Tag ref={ref} className={`transition-all duration-700 ease-out ${shown ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"} ${className}`}
      style={{ transitionDelay: `${delay}ms` }} {...rest}>
      {children}
    </Tag>
  );
}
