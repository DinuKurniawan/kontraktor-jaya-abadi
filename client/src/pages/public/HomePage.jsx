// Beranda — hanya merakit section. Section: components/public/home/*
import Seo from "../../components/public/Seo.jsx";
import HeroSection from "../../components/public/home/HeroSection.jsx";
import { lazy, Suspense } from "react";
import { StatsStrip, ServicesSection, FeaturedProjects, TestimonialHighlight, LatestArticles, CtaBanner } from "../../components/public/home/HomeSections.jsx";
import AboutTeaser from "../../components/public/home/AboutTeaser.jsx";
import WhyUsSection from "../../components/public/home/WhyUsSection.jsx";
import ProcessSection from "../../components/public/home/ProcessSection.jsx";
import CertificateSection from "../../components/public/home/CertificateSection.jsx";

// Section di bawah lipatan: pisah chunk supaya JS awal beranda lebih kecil.
const BeforeAfterSection = lazy(() => import("../../components/public/home/BeforeAfterSection.jsx"));
const CostEstimator = lazy(() => import("../../components/public/home/CostEstimator.jsx"));
const FaqSection = lazy(() => import("../../components/public/home/FaqSection.jsx"));
// Placeholder berukuran tetap: chunk menyusul tanpa menggeser layout (CLS 0).
const BelowFold = ({ height, children }) => <Suspense fallback={<div aria-hidden="true" style={{ minHeight: height }} />}>{children}</Suspense>;

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
      <CertificateSection />
      <ProcessSection />
      <BelowFold height="28rem"><FaqSection /></BelowFold>
      <BelowFold height="32rem"><CostEstimator /></BelowFold>
      <LatestArticles />
      <CtaBanner />
    </>
  );
}
