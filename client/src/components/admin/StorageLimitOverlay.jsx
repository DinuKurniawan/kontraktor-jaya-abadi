import { HardDrive, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Modal from "../ui/Modal.jsx";
import Button from "../ui/Button.jsx";

const formatBytes = (bytes = 0) => bytes >= 1024 ** 3
  ? `${(bytes / 1024 ** 3).toFixed(2)} GB`
  : `${Math.ceil(bytes / 1024 ** 2)} MB`;

// Shown only after server rejects an upload; server remains the billing-safe authority.
export default function StorageLimitOverlay({ error, onClose }) {
  const navigate = useNavigate();
  const details = error?.response?.data?.errors;
  const open = error?.response?.status === 507 && details?.code === "STORAGE_LIMIT_REACHED";

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Batas storage sudah penuh"
      footer={<Button onClick={() => { onClose(); navigate("/admin/media"); }}><Trash2 size={16} /> Kelola media</Button>}
    >
      <div className="space-y-4">
        <div className="flex gap-3 rounded-xl bg-danger/10 p-4 text-danger">
          <HardDrive className="mt-0.5 shrink-0" size={22} />
          <p className="text-sm font-medium">Upload diblokir. Tidak ada file baru dikirim ke Supabase.</p>
        </div>
        <p className="text-sm text-text-muted">
          Terpakai <strong className="text-text">{formatBytes(details?.usedBytes)}</strong> dari batas <strong className="text-text">{formatBytes(details?.limitBytes)}</strong>.
          Hapus media yang tidak dipakai, lalu coba lagi.
        </p>
      </div>
    </Modal>
  );
}
