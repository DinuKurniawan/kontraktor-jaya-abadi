/*
 * Reveal — animasi masuk saat elemen terlihat (fade + naik, sekali saja).
 * Hormati prefers-reduced-motion langsung tampil tanpa animasi.
 */
import { useEffect, useRef, useState } from "react";

export default function Reveal({ as: Tag = "div", className = "", children, delay = 0 }) {
  const ref = useRef(null);
  const [show, setShow] = useState(false);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    setReduced(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setShow(true); io.disconnect(); } },
      { threshold: 0.12 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <Tag ref={ref} className={className}
      style={{
        opacity: show || reduced ? 1 : 0,
        transform: show || reduced ? "none" : "translateY(24px)",
        transition: `opacity 0.6s ease-out ${delay}ms, transform 0.6s ease-out ${delay}ms`,
      }}>
      {children}
    </Tag>
  );
}
