// OfficeMapClient — render embed Google Maps langsung tanpa delay.
export default function OfficeMapClient({ branch }) {
  const latitude = Number(branch?.latitude);
  const longitude = Number(branch?.longitude);
  const hasCoordinates = Number.isFinite(latitude) && Number.isFinite(longitude);

  const googleMapsUrl =
    branch?.mapEmbedUrl ||
    (hasCoordinates ? `https://www.google.com/maps?q=${latitude},${longitude}&output=embed` : null);

  if (googleMapsUrl) {
    return (
      <iframe
        key={branch?.id || googleMapsUrl}
        src={googleMapsUrl}
        title={`Peta lokasi ${branch?.name || "Kantor"}`}
        loading="eager"
        className="h-full min-h-[22rem] w-full border-0 lg:min-h-[36rem]"
        referrerPolicy="no-referrer-when-downgrade"
        allowFullScreen
      />
    );
  }

  return (
    <div className="flex h-full min-h-[22rem] items-center justify-center bg-cream-deep px-6 text-center text-sm text-ink-light lg:min-h-[36rem]">
      Peta kantor belum tersedia.
    </div>
  );
}
