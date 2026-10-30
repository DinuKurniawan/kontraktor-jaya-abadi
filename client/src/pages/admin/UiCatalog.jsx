import { useState } from "react";
import { Inbox, Plus } from "lucide-react";
import Button from "../../components/ui/Button.jsx";
import Input from "../../components/ui/Input.jsx";
import Textarea from "../../components/ui/Textarea.jsx";
import Select from "../../components/ui/Select.jsx";
import Switch from "../../components/ui/Switch.jsx";
import Badge from "../../components/ui/Badge.jsx";
import Modal from "../../components/ui/Modal.jsx";
import ConfirmDialog from "../../components/ui/ConfirmDialog.jsx";
import Card from "../../components/ui/Card.jsx";
import Pagination from "../../components/ui/Pagination.jsx";
import EmptyState from "../../components/ui/EmptyState.jsx";
import Skeleton from "../../components/ui/Skeleton.jsx";
import { toast } from "../../components/ui/Toast.jsx";

// Katalog komponen design system — halaman sementara untuk pengembangan
export default function UiCatalog() {
  const [switchOn, setSwitchOn] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [page, setPage] = useState(5);

  return (
    <div className="min-h-screen p-6 lg:p-10">
      <div className="mx-auto max-w-6xl space-y-6">
        {/* Banner gaya hero referensi */}
        <div className="rounded-2xl bg-primary px-6 py-8 text-white shadow-soft">
          <h1 className="font-display text-2xl font-semibold">Design System — CMS Admin</h1>
          <p className="mt-1 text-sm text-white/80">
            Katalog komponen <code className="rounded bg-white/15 px-1.5 py-0.5">/admin/_ui</code> · Jaya Abadi · hanya untuk pengembangan
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Button */}
          <Card title="Button" actions={<Badge variant="info">4 varian</Badge>}>
            <div className="flex flex-wrap items-center gap-2">
              <Button>Primary</Button>
              <Button variant="soft">Soft</Button>
              <Button variant="outline">Outline</Button>
              <Button variant="danger">Danger</Button>
              <Button disabled>Disabled</Button>
              <Button loading>Loading</Button>
            </div>
            <div className="mt-3 flex items-center gap-2">
              <Button size="sm" variant="soft">Kecil</Button>
              <Button size="sm" variant="outline">Kecil outline</Button>
            </div>
          </Card>

          {/* Badge */}
          <Card title="Badge">
            <div className="flex flex-wrap gap-2">
              <Badge>Info</Badge>
              <Badge variant="success">Aktif</Badge>
              <Badge variant="warning">Menunggu</Badge>
              <Badge variant="danger">Nonaktif</Badge>
              <Badge variant="neutral">Arsip</Badge>
            </div>
          </Card>

          {/* Form controls */}
          <Card title="Input, Textarea, Select">
            <div className="grid gap-4 sm:grid-cols-2">
              <Input label="Nama proyek" placeholder="Contoh: Jaya Tower" />
              <Input label="Email" type="email" placeholder="nama@perusahaan.id" error="Format email tidak valid" />
              <Select label="Status" defaultValue="">
                <option value="" disabled>
                  Pilih status
                </option>
                <option>Planning</option>
                <option>Ongoing</option>
                <option>Completed</option>
              </Select>
              <Input label="Dengan hint" placeholder="1990-01-01" hint="Format: Tanggal-Bulan-Tahun" />
            </div>
            <div className="mt-4">
              <Textarea label="Ringkasan" placeholder="Tulis ringkasan singkat…" />
            </div>
          </Card>

          {/* Switch + Modal + Confirm */}
          <Card title="Switch, Modal, ConfirmDialog">
            <div className="space-y-4">
              <Switch checked={switchOn} onChange={setSwitchOn} label="Tampilkan di halaman depan" />
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" onClick={() => setModalOpen(true)}>
                  Buka Modal
                </Button>
                <Button variant="danger" onClick={() => setConfirmOpen(true)}>
                  Hapus Data
                </Button>
              </div>
            </div>
          </Card>

          {/* Pagination */}
          <Card title="Pagination">
            <Pagination page={page} totalPages={12} onChange={setPage} />
            <p className="mt-3 text-center text-xs text-text-muted">
              Halaman aktif: {page} dari 12 (elipsis otomatis di tepi & tengah)
            </p>
          </Card>

          {/* EmptyState */}
          <Card title="EmptyState">
            <EmptyState
              icon={Inbox}
              title="Belum ada proyek"
              description="Proyek yang dibuat akan muncul di sini."
              action={
                <Button size="sm" variant="soft">
                  <Plus size={14} /> Tambah Proyek
                </Button>
              }
            />
          </Card>

          {/* Skeleton */}
          <Card title="Skeleton">
            <div className="flex items-center gap-3">
              <Skeleton className="h-12 w-12" rounded="rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-3.5 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
            <Skeleton className="mt-4 h-24 w-full" />
          </Card>

          {/* Toast */}
          <Card title="Toast">
            <div className="flex flex-wrap gap-2">
              <Button variant="soft" onClick={() => toast.success("Proyek berhasil disimpan")}>
                Success
              </Button>
              <Button variant="outline" onClick={() => toast.error("Gagal menyimpan data")}>
                Error
              </Button>
              <Button variant="primary" onClick={() => toast.info("Sinkronisasi berjalan…")}>
                Info
              </Button>
            </div>
            <p className="mt-3 text-xs text-text-muted">Toast muncul di kanan bawah, hilang otomatis 3,5 detik.</p>
          </Card>

          {/* Kartu header biru — contoh kombinasi murni utilitas */}
          <Card title="Kartu Header Biru" headerVariant="primary" actions={<Plus size={16} />}>
            <p className="text-sm text-text">
              Kartu dengan header biru (<code className="rounded bg-surface px-1">headerVariant="primary"</code>) seperti kartu profil pada
              referensi. Kartu putih, sudut rounded-2xl, shadow lembut.
            </p>
          </Card>
        </div>
      </div>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Contoh Modal"
        footer={
          <>
            <Button variant="outline" onClick={() => setModalOpen(false)}>
              Batal
            </Button>
            <Button
              onClick={() => {
                setModalOpen(false);
                toast.success("Data tersimpan");
              }}
            >
              Simpan
            </Button>
          </>
        }
      >
        <p className="text-sm text-text">
          Konten modal. Tutup dengan tombol ✕, klik overlay, atau tekan <kbd className="rounded border border-border bg-surface px-1.5 py-0.5 text-xs">Esc</kbd>.
        </p>
      </Modal>

      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={() => {
          setConfirmOpen(false);
          toast.success("Data berhasil dihapus");
        }}
        title="Hapus proyek?"
        message="Proyek yang dihapus beserta foto-fotonya tidak dapat dikembalikan."
      />
    </div>
  );
}
