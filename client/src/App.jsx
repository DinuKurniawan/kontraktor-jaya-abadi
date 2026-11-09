// Peta rute — semua halaman di React.lazy (code-split per halaman, Suspense skeleton)
import { Component, Suspense, lazy } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import AdminLayout from "./components/admin/AdminLayout.jsx";
import ProtectedRoute from "./routes/ProtectedRoute.jsx";
import RoleRoute from "./routes/RoleRoute.jsx";
import Skeleton from "./components/ui/Skeleton.jsx";
import { useRealtime } from "./hooks/useRealtime.js";

const L = (importer) => lazy(importer);

// Publik
const PublicLayout = L(() => import("./components/public/PublicLayout.jsx"));
const HomePage = L(() => import("./pages/public/HomePage.jsx"));
const AboutPage = L(() => import("./pages/public/AboutPage.jsx"));
const ServicesPage = L(() => import("./pages/public/ServicePages.jsx").then((m) => ({ default: m.ServicesPage })));
const ServiceDetailPage = L(() => import("./pages/public/ServicePages.jsx").then((m) => ({ default: m.ServiceDetailPage })));
const ProjectsPage = L(() => import("./pages/public/ProjectPages.jsx").then((m) => ({ default: m.ProjectsPage })));
const ProjectDetailPage = L(() => import("./pages/public/ProjectPages.jsx").then((m) => ({ default: m.ProjectDetailPage })));
const ArticlesPage = L(() => import("./pages/public/BlogPage.jsx"));
const ArticleDetailPage = L(() => import("./pages/public/BlogDetailPage.jsx"));
const ContactPage = L(() => import("./pages/public/ContactPage.jsx"));
const NotFound = L(() => import("./pages/public/PublicPlaceholder.jsx").then((m) => ({ default: m.NotFound })));

// Admin
const AdminLogin = L(() => import("./pages/admin/Login.jsx"));
const Dashboard = L(() => import("./pages/admin/Dashboard.jsx"));
const AdminProjects = L(() => import("./pages/admin/Projects.jsx"));
const ProjectForm = L(() => import("./pages/admin/ProjectForm.jsx"));
const AdminServices = L(() => import("./pages/admin/Services.jsx"));
const ServiceForm = L(() => import("./pages/admin/ServiceForm.jsx"));
const ServicePackagesAdmin = L(() => import("./pages/admin/ServicePackages.jsx"));
const Categories = L(() => import("./pages/admin/Categories.jsx"));
const Posts = L(() => import("./pages/admin/Posts.jsx"));
const PostForm = L(() => import("./pages/admin/PostForm.jsx"));
const Tags = L(() => import("./pages/admin/Tags.jsx"));
const Testimonials = L(() => import("./pages/admin/Testimonials.jsx"));
const Team = L(() => import("./pages/admin/Team.jsx"));
const Partners = L(() => import("./pages/admin/Partners.jsx"));
const Certificates = L(() => import("./pages/admin/Certificates.jsx"));
const Faqs = L(() => import("./pages/admin/Faqs.jsx"));
const Features = L(() => import("./pages/admin/Features.jsx"));
const ProcessSteps = L(() => import("./pages/admin/ProcessSteps.jsx"));
const BeforeAfter = L(() => import("./pages/admin/BeforeAfter.jsx"));
const EstimatePrices = L(() => import("./pages/admin/EstimatePrices.jsx"));
const Milestones = L(() => import("./pages/admin/Milestones.jsx"));
const CoreValues = L(() => import("./pages/admin/CoreValues.jsx"));
const Gallery = L(() => import("./pages/admin/Gallery.jsx"));
const Subscribers = L(() => import("./pages/admin/Subscribers.jsx"));
const HeroSlides = L(() => import("./pages/admin/HeroSlides.jsx"));
const Messages = L(() => import("./pages/admin/Messages.jsx"));
const Branches = L(() => import("./pages/admin/Branches.jsx"));
const Media = L(() => import("./pages/admin/Media.jsx"));
const Settings = L(() => import("./pages/admin/Settings.jsx"));
const Users = L(() => import("./pages/admin/Users.jsx"));
const ChangePassword = L(() => import("./pages/admin/ChangePassword.jsx"));
const PlaceholderPage = L(() => import("./components/admin/PlaceholderPage.jsx"));

// Fallback loading skeleton
const Loading = (
  <div className="flex min-h-[60vh] items-center justify-center bg-cream lg:bg-surface" role="status" aria-live="polite" aria-label="Memuat halaman">
    <Skeleton className="h-10 w-56" rounded="rounded-full" />
  </div>
);

class PublicErrorBoundary extends Component {
  constructor(props) { super(props); this.state = { hasError: false }; }
  static getDerivedStateFromError() { return { hasError: true }; }
  render() {
    if (this.state.hasError) return <main className="mx-auto flex min-h-[60vh] max-w-2xl flex-col items-start justify-center gap-4 px-5"><h1 className="font-jakarta text-3xl font-extrabold">Halaman belum dapat dimuat</h1><p>Coba muat ulang halaman beberapa saat lagi.</p><button type="button" onClick={() => window.location.reload()} className="rounded-full bg-brand px-5 py-3 font-bold text-white">Muat ulang</button></main>;
    return this.props.children;
  }
}

export default function App() {
  // Pasang listener SSE real-time untuk otomatis me-refresh data tanpa reload
  useRealtime();

  return (
    <PublicErrorBoundary>
      <Suspense fallback={Loading}>
      <Routes>
        {/* Halaman publik ber-layout */}
        <Route element={<PublicLayout />}>
          <Route index element={<HomePage />} />
          <Route path="tentang" element={<AboutPage />} />
          <Route path="layanan" element={<ServicesPage />} />
          <Route path="layanan/:slug" element={<ServiceDetailPage />} />
          <Route path="proyek" element={<ProjectsPage />} />
          <Route path="proyek/:slug" element={<ProjectDetailPage />} />
          <Route path="artikel" element={<ArticlesPage />} />
          <Route path="artikel/:slug" element={<ArticleDetailPage />} />
          <Route path="kontak" element={<ContactPage />} />
          <Route path="*" element={<NotFound />} />
        </Route>

        {/* Satu-satunya rute admin publik */}
        <Route path="/admin/login" element={<AdminLogin />} />

        {/* Seluruh area admin wajib login */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="proyek" element={<AdminProjects />} />
          <Route path="proyek/baru" element={<ProjectForm />} />
          <Route path="proyek/:id/edit" element={<ProjectForm />} />
          <Route path="layanan" element={<AdminServices />} />
          <Route path="layanan/baru" element={<ServiceForm />} />
          <Route path="layanan/:id/edit" element={<ServiceForm />} />
          <Route path="layanan/:id/paket" element={<ServicePackagesAdmin />} />
          <Route path="kategori" element={<Categories />} />
          <Route path="artikel" element={<Posts />} />
          <Route path="tags" element={<Tags />} />
          <Route path="artikel/baru" element={<PostForm />} />
          <Route path="artikel/:id/edit" element={<PostForm />} />
          <Route path="posts" element={<Posts />} />
          <Route path="posts/baru" element={<PostForm />} />
          <Route path="posts/:id/edit" element={<PostForm />} />
          <Route path="testimoni" element={<Testimonials />} />
          <Route path="tim" element={<Team />} />
          <Route path="partners" element={<Partners />} />
          <Route path="certificates" element={<Certificates />} />
          <Route path="faqs" element={<Faqs />} />
          <Route path="features" element={<Features />} />
          <Route path="process-steps" element={<ProcessSteps />} />
          <Route path="before-after" element={<BeforeAfter />} />
          <Route path="estimate-prices" element={<EstimatePrices />} />
          <Route path="milestones" element={<Milestones />} />
          <Route path="core-values" element={<CoreValues />} />
          <Route path="gallery" element={<Gallery />} />
          <Route path="subscribers" element={<Subscribers />} />
          <Route path="hero-slider" element={<HeroSlides />} />
          <Route path="pesan" element={<Messages />} />
          <Route path="branches" element={<Branches />} />
          <Route path="media" element={<Media />} />
          <Route path="pengaturan" element={<Settings />} />
          <Route path="akun" element={<ChangePassword />} />
          {/* Khusus SUPER_ADMIN */}
          <Route
            path="pengguna"
            element={
              <RoleRoute roles={["SUPER_ADMIN"]}>
                <Users />
              </RoleRoute>
            }
          />
          <Route path="*" element={<PlaceholderPage title="Halaman tidak ditemukan" />} />
        </Route>

        <Route path="*" element={<Navigate to="/admin/login" replace />} />
      </Routes>
      </Suspense>
    </PublicErrorBoundary>
  );
}
