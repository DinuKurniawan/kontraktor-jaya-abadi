// Beranda — hanya merakit section. Section: components/public/home/*
import Seo from "../../components/public/Seo.jsx";
import HeroSection from "../../components/public/home/HeroSection.jsx";
import { StatsStrip, ServicesSection, FeaturedProjects, TestimonialHighlight, LatestArticles, CtaBanner } from "../../components/public/home/HomeSections.jsx";
import AboutTeaser from "../../components/public/home/AboutTeaser.jsx";
import WhyUsSection from "../../components/public/home/WhyUsSection.jsx";
import BeforeAfterSection from "../../components/public/home/BeforeAfterSection.jsx";
import ProcessSection from "../../components/public/home/ProcessSection.jsx";
import CostEstimator from "../../components/public/home/CostEstimator.jsx";
import CertificateSection from "../../components/public/home/CertificateSection.jsx";
import FaqSection from "../../components/public/home/FaqSection.jsx";

export default function HomePage() {
  return (
    <>
      <Seo path="/" description="Jasa konstruksi rumah, gedung & renovasi — RAB transparan, tepat waktu, garansi pekerjaan." />
      <HeroSection />
      <StatsStrip />
      <ServicesSection />
      <FeaturedProjects />
      <WhyUsSection />
      <AboutTeaser />
      <TestimonialHighlight />
      <BeforeAfterSection />
      <CertificateSection />
      <ProcessSection />
      <FaqSection />
      <CostEstimator />
      <LatestArticles />
      <CtaBanner />
    </>
  );
}
