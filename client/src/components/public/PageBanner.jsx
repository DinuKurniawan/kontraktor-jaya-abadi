// Banner judul halaman publik + breadcrumb — latar krem, garis bawah oranye
import Container from "./Container.jsx";
import Breadcrumb from "./Breadcrumb.jsx";

export default function PageBanner({ title, crumbs = [], description }) {
  return (
    <div className="bg-cream-deep pb-12 pt-14 sm:pb-14 sm:pt-16">
      <Container>
        <Breadcrumb items={crumbs} />
        <h1 className="mt-4 font-jakarta text-4xl font-extrabold text-ink sm:text-5xl">
          {title}
        </h1>
        {description && <p className="mt-3 max-w-xl text-ink-soft">{description}</p>}
      </Container>
    </div>
  );
}
