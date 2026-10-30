import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { AlertCircle, Eye, EyeOff } from "lucide-react";
import Button from "../../components/ui/Button.jsx";
import { FieldWrap, fieldClass } from "../../components/ui/Input.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import ScreenLoader from "../../components/admin/ScreenLoader.jsx";

const loginSchema = z.object({
  email: z.email("Format email tidak valid"),
  password: z.string().min(1, "Password wajib diisi"),
});

// Ilustrasi kanan: foto proyek + overlay biru (sesuai design system)
function LoginIllustration() {
  return (
    <div className="relative hidden overflow-hidden lg:block">
      <img
        src="https://picsum.photos/seed/ja-login-proyek/1000/1400"
        alt="Proyek konstruksi Jaya Abadi"
        className="absolute inset-0 h-full w-full object-cover"
      />
      {/* Overlay biru dari token design system */}
      <div className="absolute inset-0 bg-primary/85" aria-hidden />
      <div className="relative flex h-full flex-col justify-end p-10 text-white">
        <p className="font-display text-2xl font-semibold leading-snug">
          Membangun dengan standar tertinggi.
        </p>
        <p className="mt-2 max-w-sm text-sm text-white/75">
          Kelola proyek, layanan, dan konten situs Jaya Abadi dari satu tempat.
        </p>
      </div>
    </div>
  );
}

// Halaman login admin — dua kolom: form (kiri) + ilustrasi (kanan)
export default function Login() {
  const { user, isLoading, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || "/admin";
  const [showPassword, setShowPassword] = useState(false);
  const [apiError, setApiError] = useState(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(loginSchema), defaultValues: { email: "", password: "" } });

  // Sudah login → langsung dashboard (atau halaman asal)
  if (isLoading) return <ScreenLoader />;
  if (user) return <Navigate to={from} replace />;

  const onSubmit = async (values) => {
    setApiError(null);
    try {
      await login(values);
      navigate(from, { replace: true });
    } catch (err) {
      // Tampilkan pesan dari API (401 kredensial salah, 403 akun nonaktif, dsb.)
      setApiError(err.response?.data?.message ?? "Gagal masuk — periksa koneksi lalu coba lagi");
    }
  };

  return (
    <div className="grid min-h-screen bg-surface lg:grid-cols-2">
      {/* Kolom kiri: form */}
      <div className="flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-md">
          {/* Logo & judul */}
          <div className="mb-8 text-center lg:text-left">
            <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-primary font-display text-lg font-semibold text-white shadow-soft">
              JA
            </span>
            <h1 className="mt-4 font-display text-2xl font-semibold text-text">Masuk ke CMS Admin</h1>
            <p className="mt-1 text-sm text-text-muted">Jaya Abadi — kontraktor bangunan, renovasi & interior.</p>
          </div>

          {apiError && (
            <div className="mb-4 flex items-start gap-2 rounded-xl bg-danger-soft px-4 py-3 text-sm text-danger" role="alert">
              <AlertCircle size={16} className="mt-0.5 shrink-0" />
              {apiError}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            <div>
              <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-text">
                Email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="nama@jayaabadi.co.id"
                aria-invalid={!!errors.email}
                className={fieldClass(errors.email)}
                {...register("email")}
              />
              {errors.email && <p className="mt-1.5 text-xs text-danger">{errors.email.message}</p>}
            </div>

            <FieldWrap id="password" label="Password" error={errors.password?.message}>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  aria-invalid={!!errors.password}
                  className={`${fieldClass(errors.password)} pr-11`}
                  {...register("password")}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-2 text-text-muted transition hover:bg-surface hover:text-text"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </FieldWrap>

            <Button type="submit" loading={isSubmitting} className="w-full">
              {isSubmitting ? "Memproses…" : "Masuk"}
            </Button>
          </form>

          <p className="mt-6 text-center text-xs text-text-muted">Sesi aktif 7 hari — disimpan dalam cookie aman.</p>
        </div>
      </div>

      {/* Kolom kanan: ilustrasi (hanya desktop) */}
      <LoginIllustration />
    </div>
  );
}
