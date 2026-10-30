import Card from "../ui/Card.jsx";
import EmptyState from "../ui/EmptyState.jsx";

// Halaman sementara — diganti halaman CRUD asli saat modulnya dibuat
export default function PlaceholderPage({ title, description = "Halaman ini akan dibangun pada tahap berikutnya." }) {
  return (
    <div className="space-y-6">
      <h1 className="font-display text-xl font-semibold text-text">{title}</h1>
      <Card>
        <EmptyState title="Halaman belum dibangun" description={description} />
      </Card>
    </div>
  );
}
