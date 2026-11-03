import Button from "./Button.jsx";
import Modal from "./Modal.jsx";

// Dialog konfirmasi aksi berisiko (hapus, dst.) — dibangun di atas Modal
export default function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title = "Konfirmasi",
  message = "Apakah Anda yakin?",
  confirmLabel = "Hapus",
  confirmVariant = "danger",
  loading = false,
  children,
}) {
  return (
    <Modal
      open={open}
      onClose={loading ? undefined : onClose}
      title={title}
      size="sm"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Batal
          </Button>
          <Button variant={confirmVariant} loading={loading} onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      <p className="text-sm text-text">{message}</p>
      {children}
    </Modal>
  );
}
