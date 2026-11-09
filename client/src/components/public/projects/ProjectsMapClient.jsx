/*
 * Implementasi peta proyek — react-leaflet + OpenStreetMap.
 * Marker dikelompokkan agar tetap mudah dibaca saat titik berdekatan.
 */
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { LocateFixed, MapPinned } from "lucide-react";
import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "react-leaflet-cluster/dist/assets/MarkerCluster.css";
import "react-leaflet-cluster/dist/assets/MarkerCluster.Default.css";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";
import api from "../../../lib/axios.js";

const SERVER = (import.meta.env.VITE_API_URL || "http://localhost:4000/api").replace(/\/api$/, "");
const DEFAULT_CENTER = [-6.25, 106.85];
const img = (p) => (!p ? "" : p.startsWith("http") ? p : `${SERVER}${p}`);

// Ikon bawaan Leaflet perlu diarahkan ke asset yang diproses Vite.
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({ iconRetinaUrl: markerIcon2x, iconUrl: markerIcon, shadowUrl: markerShadow });

function getBounds(points) {
  return L.latLngBounds(points.map((point) => [point.latitude, point.longitude]));
}

function MapViewport({ points, focusRequest }) {
  const map = useMap();

  const focusAll = () => {
    if (points.length === 0) {
      map.setView(DEFAULT_CENTER, 9);
      return;
    }
    map.fitBounds(getBounds(points).pad(0.25), { maxZoom: 12, animate: true });
  };

  useEffect(() => {
    focusAll();
    // Fit ulang setiap hasil filter berubah.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [points]);

  useEffect(() => {
    if (focusRequest > 0) focusAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusRequest]);

  return null;
}

function PopupContent({ project }) {
  return (
    <div className="w-52">
      {project.coverImage && (
        <img
          src={img(project.coverImage)}
          alt={project.title}
          width="320"
          height="180"
          className="h-24 w-full rounded-lg object-cover"
        />
      )}
      <p className="mt-2 line-clamp-2 font-jakarta text-sm font-bold text-ink">{project.title}</p>
      {project.location && <p className="mt-1 text-xs text-ink-soft">{project.location}</p>}
      <Link to={`/proyek/${project.slug}`} className="mt-2 inline-flex text-xs font-bold text-brand hover:underline">
        Lihat detail →
      </Link>
    </div>
  );
}

export default function ProjectsMap({ q = "", layanan = "", tahun = "", kategori = "", status = "" }) {
  const [focusRequest, setFocusRequest] = useState(0);

  const { data, isLoading, isError } = useQuery({
    // Tidak memakai page/limit: peta selalu mengambil seluruh titik hasil filter.
    queryKey: ["public-projects-map", { q, layanan, tahun, kategori, status }],
    staleTime: 60_000,
    queryFn: async () => (await api.get("/public/projects/map", {
      params: {
        search: q || undefined,
        service: layanan || undefined,
        year: tahun || undefined,
        category: kategori || undefined,
        status: status || undefined,
      },
    })).data.data,
  });

  const points = useMemo(
    () => (data ?? [])
      .filter((project) => project.latitude != null && project.longitude != null)
      .map((project) => ({ ...project, latitude: Number(project.latitude), longitude: Number(project.longitude) }))
      .filter((project) => Number.isFinite(project.latitude) && Number.isFinite(project.longitude)),
    [data]
  );

  const showOverlay = isLoading || isError || points.length === 0;

  return (
    <div className="relative mt-8 overflow-hidden rounded-2xl border border-ink/10 bg-cream-deep">
      <MapContainer
        center={DEFAULT_CENTER}
        zoom={9}
        scrollWheelZoom={false}
        className="h-[420px] w-full sm:h-[520px]"
        aria-label="Peta sebaran proyek"
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxZoom={19}
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        />
        <MapViewport points={points} focusRequest={focusRequest} />
        <MarkerClusterGroup chunkedLoading showCoverageOnHover={false}>
          {points.map((project) => (
            <Marker key={project.id} position={[project.latitude, project.longitude]} title={project.title}>
              <Popup closeButton>
                <PopupContent project={project} />
              </Popup>
            </Marker>
          ))}
        </MarkerClusterGroup>
      </MapContainer>

      {!isLoading && !isError && points.length > 0 && (
        <>
          <span className="absolute left-3 top-3 z-[1000] rounded-full bg-white/95 px-3 py-1.5 text-[11px] font-bold text-ink shadow-soft">
            {points.length} proyek di peta
          </span>
          <button
            type="button"
            onClick={() => setFocusRequest((value) => value + 1)}
            className="absolute right-3 top-3 z-[1000] inline-flex items-center gap-1.5 rounded-full bg-ink px-3 py-1.5 text-[11px] font-bold text-cream shadow-soft transition hover:bg-brand"
          >
            <LocateFixed size={13} /> Fokus ke semua
          </button>
        </>
      )}

      {showOverlay && (
        <div className="absolute inset-0 z-[1000] flex items-center justify-center bg-cream/80 p-6 backdrop-blur-[1px]">
          {isLoading ? (
            <p className="text-sm font-semibold text-ink-soft">Memuat titik proyek…</p>
          ) : (
            <div className="max-w-xs rounded-2xl bg-white p-5 text-center shadow-soft">
              <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-cream-deep text-ink-light">
                <MapPinned size={20} />
              </span>
              <p className="mt-3 font-jakarta text-sm font-bold text-ink">
                {isError ? "Peta gagal dimuat" : "Belum ada proyek di peta"}
              </p>
              <p className="mt-1 text-xs text-ink-light">
                {isError ? "Coba muat ulang halaman." : "Tidak ada proyek dengan koordinat pada filter ini."}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
