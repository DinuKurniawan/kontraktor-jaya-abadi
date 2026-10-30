// Skeleton publik — kartu foto, kartu teks, heading
import Container from "./Container.jsx";

function Block({ className }) {
  return <div className={`animate-pulse rounded-2xl bg-cream-deep ${className}`} />;
}

export default function PublicSkeleton() {
  return (
    <div className="space-y-12 bg-cream py-12">
      <Block className="mx-5 h-10 w-72" />
      <Container>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="space-y-3">
              <Block className="aspect-[4/3] w-full" />
              <Block className="h-4 w-3/4" />
              <Block className="h-3 w-1/2" />
            </div>
          ))}
        </div>
      </Container>
    </div>
  );
}
