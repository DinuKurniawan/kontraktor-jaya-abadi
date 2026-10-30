// Ubah password sendiri — diakses dari dropdown profil
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { ArrowLeft, KeyRound } from "lucide-react";
import api from "../../lib/axios.js";
import Card from "../../components/ui/Card.jsx";
import Button from "../../components/ui/Button.jsx";
import Input from "../../components/ui/Input.jsx";
import { toast } from "../../components/ui/Toast.jsx";

const schema = z
  .object({
    currentPassword: z.string().min(1, "Password saat ini wajib diisi"),
    newPassword: z.string().min(8, "Password baru minimal 8 karakter"),
    confirm: z.string(),
  })
  .refine((d) => d.newPassword === d.confirm, { path: ["confirm"], message: "Konfirmasi password tidak sama" })
  .refine((d) => d.newPassword !== d.currentPassword, { path: ["newPassword"], message: "Password baru harus berbeda dari yang lama" });

export default function ChangePassword() {
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(schema), defaultValues: { currentPassword: "", newPassword: "", confirm: "" } });

  const mutation = useMutation({
    mutationFn: (payload) => api.put("/auth/change-password", payload),
    onSuccess: () => {
      toast.success("Password berhasil diubah");
      reset();
      navigate("/admin");
    },
    onError: (err) => toast.error(err.response?.data?.message ?? "Gagal mengubah password"),
  });

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-xl font-semibold text-text">Ubah Password</h1>
        <button type="button" onClick={() => navigate(-1)} className="inline-flex items-center gap-1.5 text-sm font-medium text-text-muted transition hover:text-primary">
          <ArrowLeft size={15} /> Kembali
        </button>
      </div>

      <Card title="Keamanan Akun" headerVariant="primary">
        <form onSubmit={handleSubmit((v) => mutation.mutate(v))} className="space-y-4" noValidate>
          <Input label="Password Saat Ini" type="password" autoComplete="current-password" error={errors.currentPassword?.message} {...register("currentPassword")} />
          <Input label="Password Baru" type="password" autoComplete="new-password" hint="Minimal 8 karakter" error={errors.newPassword?.message} {...register("newPassword")} />
          <Input label="Konfirmasi Password Baru" type="password" autoComplete="new-password" error={errors.confirm?.message} {...register("confirm")} />
          <Button type="submit" loading={mutation.isPending || isSubmitting} className="w-full">
            <KeyRound size={16} /> Simpan Password Baru
          </Button>
        </form>
      </Card>
    </div>
  );
}
