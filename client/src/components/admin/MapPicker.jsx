/*
 * MapPicker — pilih titik (lat, lng) di peta Leaflet.
 * - Klik peta / drag marker untuk memindah pin.
 * - "Cari alamat" pakai Nominatim (OpenStreetMap, gratis, tanpa key).
 * Import CSS leaflet di sini (Vite memproses CSS dari node_modules).
 */
import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";
import { MapPin, Search } from "lucide-react";
import Button from "../ui/Button.jsx";

// Vite tidak menyelesaikan URL ikon default Leaflet dari CSS — set manual.
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({ iconRetinaUrl: markerIcon2x, iconUrl: markerIcon, shadowUrl: markerShadow });

const DEFAULT_CENTER = [-6.2, 106.8166]; // Jakarta

export default function MapPicker({ lat, lng, onChange }) {
  const ref = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const [q, setQ] = useState("");
  const [searching, setSearching] = useState(false);
  const [err, setErr] = useState("");

  // Init peta sekali
  useEffect(() => {
    if (!ref.current || mapRef.current) return;
    const has = lat != null && lng != null && Number.isFinite(Number(lat)) && Number.isFinite(Number(lng));
    const center = has ? [Number(lat), Number(lng)] : DEFAULT_CENTER;
    const map = L.map(ref.current).setView(center, has ? 16 : 11);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map);
    const marker = has
      ? L.marker(center, { draggable: true }).addTo(map)
      : null;
    if (marker) marker.on("dragend", () => emit(marker.getLatLng()));
    map.on("click", (e) => {
      if (!markerRef.current) {
        const m = L.marker(e.latlng, { draggable: true }).addTo(map);
        m.on("dragend", () => emit(m.getLatLng()));
        markerRef.current = m;
      } else {
        markerRef.current.setLatLng(e.latlng);
      }
      emit(e.latlng);
    });
    mapRef.current = { map, marker };
    markerRef.current = marker;
    return () => { map.remove(); mapRef.current = null; markerRef.current = null; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sinkron dari luar (reset form edit)
  useEffect(() => {
    const h = mapRef.current;
    if (!h || lat == null || lng == null) return;
    const pos = [Number(lat), Number(lng)];
    if (!markerRef.current) {
      const m = L.marker(pos, { draggable: true }).addTo(h.map);
      m.on("dragend", () => emit(m.getLatLng()));
      markerRef.current = m;
    } else markerRef.current.setLatLng(pos);
    h.map.setView(pos, 16);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lat, lng]);

  const emit = ({ lat: la, lng: ln }) => {
    onChange?.({
      lat: Number(la.toFixed(6)),
      lng: Number(ln.toFixed(6)),
    });
  };

  // Geocoding alamat → titik pertama (Nominatim, tanpa API key)
  const cari = async () => {
    if (!q.trim() || searching) return;
    setSearching(true);
    setErr("");
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=id&accept-language=id&q=${encodeURIComponent(q)}`);
      const hits = await res.json();
      if (!hits?.length) { setErr("Alamat tidak ditemukan — coba kata kunci lebih detail."); return; }
      const { lat, lon, display_name } = hits[0];
      const h = mapRef.current;
      h.map.setView([+lat, +lon], 16);
      if (!markerRef.current) {
        const m = L.marker([+lat, +lon], { draggable: true }).addTo(h.map);
        m.on("dragend", () => emit(m.getLatLng()));
        markerRef.current = m;
      } else markerRef.current.setLatLng([+lat, +lon]);
      emit({ lat: +lat, lng: +lon });
      setQ(display_name.split(",").slice(0, 2).join(",") ); // ringkas
    } catch {
      setErr("Gagal menghubungi layanan peta — coba lagi.");
    } finally {
      setSearching(false);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <input value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), cari())}
            placeholder="Cari alamat / nama tempat…" aria-label="Cari alamat"
            className="w-full rounded-xl border border-border bg-white py-2 pl-9 pr-3 text-sm outline-none transition focus:border-primary" />
        </div>
        <Button type="button" variant="soft" size="sm" onClick={cari} loading={searching}>Cari</Button>
      </div>
      {err && <p role="alert" className="text-xs text-danger">{err}</p>}
      <div ref={ref} className="h-64 w-full overflow-hidden rounded-xl border border-border" aria-label="Peta pilih lokasi" />
      <p className="flex items-center gap-1.5 text-xs text-text-muted">
        <MapPin size={12} />
        {lat != null && lng != null ? `Titik: ${lat}, ${lng}` : "Klik peta untuk menandai lokasi proyek."}
      </p>
    </div>
  );
}
