// OfficeMapClient — implementasi Leaflet/OSM atau fallback embed Google Maps.
import { useEffect } from "react";
import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({ iconRetinaUrl: markerIcon2x, iconUrl: markerIcon, shadowUrl: markerShadow });

function MapFocus({ branch }) {
  const map = useMap();
  useEffect(() => {
    const point = [Number(branch.latitude), Number(branch.longitude)];
    map.setView(point, 14, { animate: true });
  }, [branch, map]);
  return null;
}

export default function OfficeMapClient({ branch }) {
  const latitude = Number(branch?.latitude);
  const longitude = Number(branch?.longitude);
  const hasCoordinates = Number.isFinite(latitude) && Number.isFinite(longitude);

  if (hasCoordinates) {
    const point = [latitude, longitude];
    return (
      <MapContainer key={branch.id} center={point} zoom={14} scrollWheelZoom={false} className="h-full min-h-[22rem] w-full" aria-label={`Peta lokasi ${branch.name}`}>
        <MapFocus branch={branch} />
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxZoom={19}
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        />
        <Marker position={point} title={branch.name}>
          <Popup>
            <strong>{branch.name}</strong>
            <br />
            {branch.address}, {branch.city}
          </Popup>
        </Marker>
      </MapContainer>
    );
  }

  if (branch?.mapEmbedUrl) {
    return <iframe src={branch.mapEmbedUrl} title={`Peta ${branch.name}`} loading="lazy" className="h-full min-h-[22rem] w-full border-0" referrerPolicy="no-referrer-when-downgrade" allowFullScreen />;
  }

  return <div className="flex h-full min-h-[22rem] items-center justify-center bg-cream-deep px-6 text-center text-sm text-ink-light">Peta kantor belum tersedia.</div>;
}
