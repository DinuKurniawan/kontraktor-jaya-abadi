/* Peta lokasi kecil untuk detail proyek dengan koordinat yang valid. */
import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({ iconRetinaUrl: markerIcon2x, iconUrl: markerIcon, shadowUrl: markerShadow });

export default function ProjectLocationMap({ latitude, longitude, title, location }) {
  const point = [Number(latitude), Number(longitude)];
  if (!point.every(Number.isFinite)) return null;

  return (
    <div className="overflow-hidden rounded-2xl border border-ink/10 bg-cream-deep shadow-soft">
      <MapContainer center={point} zoom={14} scrollWheelZoom={false} className="h-64 w-full" aria-label={`Peta lokasi ${title}`}>
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxZoom={19}
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        />
        <Marker position={point} title={title}>
          <Popup>
            <strong>{title}</strong>
            {location && <><br />{location}</>}
          </Popup>
        </Marker>
      </MapContainer>
    </div>
  );
}
