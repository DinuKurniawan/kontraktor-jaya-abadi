// Blok placeholder berkedip saat memuat data
export default function Skeleton({ className = "h-4 w-full", rounded = "rounded-lg", ...props }) {
  return <div className={`animate-pulse bg-primary-soft ${rounded} ${className}`} {...props} />;
}
