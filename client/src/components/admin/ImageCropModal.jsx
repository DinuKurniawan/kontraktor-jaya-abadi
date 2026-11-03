// Pemotong gambar sederhana berbasis canvas tanpa dependency tambahan.
import { useEffect, useRef, useState } from "react";
import { Move, ZoomIn } from "lucide-react";
import Modal from "../ui/Modal.jsx";
import Button from "../ui/Button.jsx";
import { toast } from "../ui/Toast.jsx";

const PRESETS = {
  "4/3": { width: 1200, height: 900 },
  "16/9": { width: 1920, height: 1080 },
};

export default function ImageCropModal({ open, src, ratio = "4/3", onClose, onSave }) {
  const [image, setImage] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const dragStart = useRef(null);
  const viewportRef = useRef(null);
  const canvasRef = useRef(null);
  const preset = PRESETS[ratio] ?? PRESETS["4/3"];

  useEffect(() => {
    if (!open || !src) return undefined;
    const next = new Image();
    next.crossOrigin = "anonymous";
    next.onload = () => { setImage(next); setZoom(1); setOffset({ x: 0, y: 0 }); };
    next.onerror = () => { setImage(null); toast.error("Gambar tidak dapat dibuka untuk dipotong"); };
    next.src = src;
    return () => { next.onload = null; next.onerror = null; };
  }, [open, src]);

  const getLayout = () => {
    const viewport = viewportRef.current;
    if (!viewport || !image) return null;
    const width = viewport.clientWidth;
    const height = width * (preset.height / preset.width);
    const scale = Math.max(width / image.naturalWidth, height / image.naturalHeight) * zoom;
    return { width, height, scale };
  };

  const onPointerDown = (event) => {
    event.currentTarget.setPointerCapture?.(event.pointerId);
    dragStart.current = { x: event.clientX - offset.x, y: event.clientY - offset.y };
    setDragging(true);
  };
  const onPointerMove = (event) => {
    if (!dragging || !dragStart.current) return;
    setOffset({ x: event.clientX - dragStart.current.x, y: event.clientY - dragStart.current.y });
  };
  const stopDragging = () => { setDragging(false); dragStart.current = null; };

  const saveCrop = async () => {
    const layout = getLayout();
    if (!layout || !image) return;
    const canvas = canvasRef.current;
    canvas.width = preset.width;
    canvas.height = preset.height;
    const context = canvas.getContext("2d");
    const drawnWidth = image.naturalWidth * layout.scale;
    const drawnHeight = image.naturalHeight * layout.scale;
    const x = (layout.width - drawnWidth) / 2 + offset.x;
    const y = (layout.height - drawnHeight) / 2 + offset.y;
    context.drawImage(image, -x * (preset.width / layout.width), -y * (preset.height / layout.height), drawnWidth * (preset.width / layout.width), drawnHeight * (preset.height / layout.height));
    canvas.toBlob(async (blob) => {
      if (!blob) return toast.error("Gagal membuat hasil potongan");
      await onSave(new File([blob], `layanan-${Date.now()}.webp`, { type: "image/webp" }));
    }, "image/webp", 0.8);
  };

  const layout = getLayout();
  const imageStyle = layout && image ? {
    width: `${image.naturalWidth * layout.scale}px`,
    height: `${image.naturalHeight * layout.scale}px`,
    left: `calc(50% - ${image.naturalWidth * layout.scale / 2}px + ${offset.x}px)`,
    top: `calc(50% - ${image.naturalHeight * layout.scale / 2}px + ${offset.y}px)`,
  } : {};

  return (
    <Modal open={open} onClose={onClose} title={`Potong gambar ${ratio === "16/9" ? "hero 16:9" : "kartu 4:3"}`} size="lg" footer={<><Button variant="outline" onClick={onClose}>Batal</Button><Button onClick={saveCrop} disabled={!image}>Potong &amp; Gunakan</Button></>}>
      <div className="space-y-4">
        <p className="flex items-center gap-2 text-xs text-text-muted"><Move size={14} /> Geser gambar, lalu atur zoom untuk memilih area.</p>
        <div
          ref={viewportRef}
          className="relative mx-auto max-w-2xl cursor-grab touch-none overflow-hidden rounded-xl bg-ink/10 active:cursor-grabbing"
          style={{ aspectRatio: ratio.replace("/", " /") }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={stopDragging}
          onPointerCancel={stopDragging}
        >
          {image && <img src={src} alt="Pratinjau potongan" className="absolute max-w-none select-none" style={imageStyle} draggable={false} />}
          <div className="pointer-events-none absolute inset-0 ring-2 ring-white/80 ring-inset" />
        </div>
        <label className="flex items-center gap-3 text-sm text-text">
          <ZoomIn size={16} className="text-primary" />
          <input type="range" min="1" max="3" step="0.01" value={zoom} onChange={(event) => setZoom(Number(event.target.value))} className="w-full accent-primary" aria-label="Zoom gambar" />
        </label>
        <canvas ref={canvasRef} className="hidden" />
      </div>
    </Modal>
  );
}
