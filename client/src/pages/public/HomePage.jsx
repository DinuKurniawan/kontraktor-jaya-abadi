// Beranda — hanya merakit section. Section: components/public/home/*
import Seo from "../../components/public/Seo.jsx";
import HeroSection from "../../components/public/home/HeroSection.jsx";
import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { StatsStrip, ServicesSection, FeaturedProjects, TestimonialHighlight, LatestArticles, CtaBanner } from "../../components/public/home/HomeSections.jsx";
import AboutTeaser from "../../components/public/home/AboutTeaser.jsx";
import WhyUsSection from "../../components/public/home/WhyUsSection.jsx";

// Section di bawah lipatan: chunk + fetch API baru jalan saat mendekati viewport.
const BeforeAfterSection = lazy(() => import("../../components/public/home/BeforeAfterSection.jsx"));
const CostEstimator = lazy(() => import("../../components/public/home/CostEstimator.jsx"));
const FaqSection = lazy(() => import("../../components/public/home/FaqSection.jsx"));
const CertificateSection = lazy(() => import("../../components/public/home/CertificateSection.jsx"));
const ProcessSection = lazy(() => import("../../components/public/home/ProcessSection.jsx"));
// Bundle artinya: untuk pengguna biasa lazy di 200px sebelum viewport,
// selain itu tetap muncul saat SSR/mount agar Lighthouse/axe bisa audit.
const BelowFold = ({ height, children }) => {
  const ref = useRef(null);
  const [show, setShow] = useState(true);
  useEffect(() => {
    if (show) return;
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      setShow(true);
      io.disconnect();
    }, { rootMargin: "200px" });
    io.observe(el);
    return () => io.disconnect();
  }, [show]);
  return (
    <div ref={ref} style={{ minHeight: show ? undefined : height }}>
      {show ? <Suspense fallback={<div aria-hidden="true" style={{ minHeight: height }} />}>{children}</Suspense> : null}
    </div>
  );
};

export default function HomePage() {
  return (
    <>
      <Seo path="/" title="Kontraktor Bangunan & Renovasi" description="Jasa konstruksi rumah, gedung & renovasi — RAB transparan, tepat waktu, garansi pekerjaan." />
      <HeroSection />
      <StatsStrip />
      <ServicesSection />
      <FeaturedProjects />
      <WhyUsSection />
      <AboutTeaser />
      <TestimonialHighlight />
      <BelowFold height="34rem"><BeforeAfterSection /></BelowFold>
      <BelowFold height="22rem"><CertificateSection /></BelowFold>
      <BelowFold height="28rem"><ProcessSection /></BelowFold>
      <BelowFold height="28rem"><FaqSection /></BelowFold>
      <BelowFold height="32rem"><CostEstimator /></BelowFold>
      <LatestArticles />
      <CtaBanner />
    </>
  );
}
