// Seed data awal Jaya Abadi — idempotent: aman dijalankan berulang (upsert / cek-lalu-tulis)
import "dotenv/config";
import bcrypt from "bcrypt";
import prisma from "../src/config/prisma.js";

// Helper URL gambar placeholder (picsum)
const IMG = (seed, w = 1200, h = 800) => `https://picsum.photos/seed/${seed}/${w}/${h}`;

const slugify = (s) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

const ADMIN_EMAIL = "admin@jayaabadi.co.id";
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD;

if (!ADMIN_PASSWORD) {
  console.error("❌ SEED_ADMIN_PASSWORD tidak diatur di server/.env");
  process.exit(1);
}

// Upsert generik untuk model tanpa unique constraint (cek dulu secara manual)
async function upsertBy(model, key, data) {
  const found = await prisma[model].findFirst({ where: key });
  if (found) {
    await prisma[model].update({ where: { id: found.id }, data });
    return found.id;
  }
  const created = await prisma[model].create({ data });
  return created.id;
}

async function main() {
  // 1. User SUPER_ADMIN
  const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 10);
  const admin = await prisma.user.upsert({
    where: { email: ADMIN_EMAIL },
    update: {
      name: "Super Admin",
      role: "SUPER_ADMIN",
      isActive: true,
      position: "Direktur Utama",
      photo: IMG("ja-author-super-admin", 400, 400),
    },
    create: {
      name: "Super Admin",
      email: ADMIN_EMAIL,
      password: passwordHash,
      role: "SUPER_ADMIN",
      isActive: true,
      position: "Direktur Utama",
      photo: IMG("ja-author-super-admin", 400, 400),
    },
  });
  console.log("✅ User:", admin.email);

  // 2. Kategori (upsert by slug)
  const categories = [
    ["Gedung", "PROJECT"],
    ["Rumah Tinggal", "PROJECT"],
    ["Renovasi", "PROJECT"],
    ["Interior", "PROJECT"],
    ["Infrastruktur", "PROJECT"],
    ["Tips Konstruksi", "POST"],
    ["Berita", "POST"],
    ["Proyek", "POST"],
  ];
  const catId = {};
  for (const [name, type] of categories) {
    const cat = await prisma.category.upsert({
      where: { slug: slugify(name) },
      update: { name, type },
      create: { name, slug: slugify(name), type },
    });
    catId[cat.slug] = cat.id;
  }
  console.log("✅ Kategori:", categories.length);

  // 3. Tag artikel (upsert by slug)
  const tags = [
    ["Panduan Konstruksi", "panduan-konstruksi"],
    ["Manajemen Proyek", "manajemen-proyek"],
    ["Desain Interior", "desain-interior"],
    ["Renovasi", "renovasi"],
    ["Material", "material"],
    ["Keberlanjutan", "keberlanjutan"],
    ["Berita Jaya Abadi", "berita-jaya-abadi"],
    ["Inspirasi Hunian", "inspirasi-hunian"],
  ];
  const tagId = {};
  for (const [name, slug] of tags) {
    const tag = await prisma.tag.upsert({
      where: { slug },
      update: { name },
      create: { name, slug },
    });
    tagId[slug] = tag.id;
  }
  console.log("✅ Tag artikel:", tags.length);

  // 4. Layanan (upsert by slug)
  const serviceCategories = [
    { name: "Konstruksi", slug: "konstruksi", sortOrder: 0 },
    { name: "Renovasi", slug: "renovasi", sortOrder: 1 },
    { name: "Desain & Interior", slug: "desain-interior", sortOrder: 2 },
    { name: "Pengawasan", slug: "pengawasan", sortOrder: 3 },
  ];
  const serviceCategoryId = {};
  for (const category of serviceCategories) {
    const row = await prisma.serviceCategory.upsert({
      where: { slug: category.slug },
      update: category,
      create: category,
    });
    serviceCategoryId[category.slug] = row.id;
  }
  console.log("✅ Kategori layanan:", serviceCategories.length);

  const services = [
    {
      title: "Konstruksi Bangunan",
      shortDesc: "Pembangunan gedung perkantoran, komersial, dan perumahan dari nol.",
      description:
        "Layanan konstruksi bangunan baru dari tahap perencanaan hingga serah terima kunci. Kami menangani gedung perkantoran, ruko, hotel, dan perumahan dengan tim struktural berpengalaman, pengendalian mutu bertahap, serta laporan progres mingguan.",
      icon: "building-2",
      image: IMG("ja-layanan-konstruksi"),
      categoryId: serviceCategoryId.konstruksi,
    },
    {
      title: "Renovasi Bangunan",
      shortDesc: "Renovasi total maupun parsial: rumah, ruko, kantor, dan hotel.",
      description:
        "Renovasi dan penataan ulang bangunan berdiri — mulai perbaikan struktur, pertukangan listrik dan air, hingga penataan fasad dan beranda. Untuk penghuni tetap aktif, pekerjaan dibagi per tahap agar aktivitas tidak terganggu.",
      icon: "hammer",
      image: IMG("ja-layanan-renovasi"),
      categoryId: serviceCategoryId.renovasi,
    },
    {
      title: "Desain & Interior",
      shortDesc: "Desain interior fisik untuk hunian, kantor, dan ruang komersial.",
      description:
        "Perancangan dan pemasangan interior lengkap: partisi, plafon, lantai, furniture custom, tata cahaya, dan akustik. Tim desainer kami bekerja dari moodboard dan konsep 3D hingga pemasangan di lapangan.",
      icon: "sofa",
      image: IMG("ja-layanan-interior"),
      categoryId: serviceCategoryId["desain-interior"],
    },
    {
      title: "Pengawasan Proyek",
      shortDesc: "Konsultan pengawas independen untuk mutu, jadwal, dan anggaran.",
      description:
        "Layanan konsultan pengawas independen yang memastikan kontraktor pelaksana patuh terhadap gambar rencana. Cakupannya inspeksi material, pengujian struktural, laporan berjenjang, dan verifikasi termin pembayaran.",
      icon: "clipboard-check",
      image: IMG("ja-layanan-pengawasan"),
      categoryId: serviceCategoryId.pengawasan,
    },
  ];
  for (const [i, s] of services.entries()) {
    const data = { ...s, slug: slugify(s.title), sortOrder: i };
    await prisma.service.upsert({
      where: { slug: data.slug },
      update: data,
      create: data,
    });
  }
  console.log("✅ Layanan:", services.length);

  // 4. Proyek contoh (upsert by slug, campuran status, 2 featured)
  const projects = [
    {
      title: "Perkantoran Jaya Tower",
      slug: "perkantoran-jaya-tower",
      category: "gedung",
      summary: "Menara perkantoran 8 lantai dengan konsep hemat energi di kawasan TB Simatupang.",
      description:
        "Gedung perkantoran 8 lantai seluas 12.500 m² dengan fasad kaca low-e hemat energi dan tata cahaya alami dari lobi hingga lantai kerja. Building management system terpadu dan konsep green building kami tangani sejak tahap desain, sehingga biaya operasional klien jauh lebih efisien.",
      location: "Jakarta Selatan",
      clientName: "PT Maju Investama",
      year: 2025,
      value: "Rp 18,5 M",
      status: "ONGOING",
      coverImage: IMG("ja-proyek-jaya-tower"),
      isFeatured: true,
      area: 12500,
      durationMonths: 20,
      floors: 8,
      startDate: new Date("2025-03-01"),
      endDate: null,
      architect: "Studio Arsitek Nusantara",
      videoUrl: "https://www.youtube.com/watch?v=ABvUTcVqfMY",
      challenge: "Lahan sempit di kawasan padat TB Simatupang dengan akses mobil biffo terbatas dan jam kerja ketat dari pengelola kawasan.",
      solution: "Metode top-down untuk basement, pengecoran malam hari di luar jam kawasan, dan Just-in-Time material agar lahan kerja tetap lega.",
      result: "Progres 60% tepat jadwal tanpa satu pun teguran keselamatan dari pengelola kawasan.",
      highlights: ["Fasad low-e hemat energi", "Metode top-down basement", "BMS terpadu", "Target green building"],
      tags: ["highrise", "perkantoran", "green-building"],
      latitude: -6.2915,
      longitude: 106.8004,
    },
    {
      title: "Perumahan Citra Residence",
      slug: "perumahan-citra-residence",
      category: "rumah-tinggal",
      summary: "48 unit hunian tipe 36/60 dan 45/90 dengan taman tematik di Bogor.",
      description:
        "Pembangunan 48 unit rumah dua lantai dengan saluran drainase, taman tematik, dan fasilitas bermain anak. Material lokal yang tahan iklim Bogor kami pilih agar murah perawatannya, dan tata letak cluster dirancang bebas genangan.",
      location: "Bogor",
      clientName: "PT Citra Land Property",
      year: 2024,
      value: "Rp 12 M",
      status: "COMPLETED",
      coverImage: IMG("ja-proyek-citra-residence"),
      isFeatured: false,
      area: 8400,
      durationMonths: 14,
      floors: 2,
      startDate: new Date("2023-06-01"),
      endDate: new Date("2024-08-15"),
      architect: "Biro Desain Habitate",
      videoUrl: null,
      challenge: "Lahan berkontur dan rawan genangan; 48 unit harus serah terima sebelum Lebaran dengan budget tetap.",
      solution: "Terracing kontur, kolam retensi komunal, dan penjadwalan paralel per blok 8 unit dengan QC bertahap.",
      result: "48 unit serah terima 3 minggu lebih awal; klaim retensi 0 di masa pemeliharaan.",
      highlights: ["Bebas genangan", "Serah terima lebih awal", "Material lokal low-maintenance"],
      tags: ["cluster", "hunian", "bogor"],
      latitude: -6.595,
      longitude: 106.8166,
    },
    {
      title: "Renovasi Hotel Anggrek",
      slug: "renovasi-hotel-anggrek",
      category: "renovasi",
      summary: "Penataan total 120 kamar hotel bintang 3 tanpa menutup operasional.",
      description:
        "Renovasi 120 kamar dan wajah hotel berlangsung per lantai agar operasional tetap berjalan. Cakupannya pergantian pipa air dan instalasi listrik, lantai baru, penataan lobby dan restoran, hingga pengecatan tahan rayap di area basement.",
      location: "Bandung",
      clientName: "Hotel Anggrek Indonesia",
      year: 2024,
      value: "Rp 3,2 M",
      status: "COMPLETED",
      coverImage: IMG("ja-proyek-hotel-anggrek"),
      isFeatured: true,
      area: 6500,
      durationMonths: 8,
      floors: 6,
      startDate: new Date("2024-01-10"),
      endDate: new Date("2024-09-20"),
      architect: null,
      videoUrl: "https://www.youtube.com/watch?v=ab_2_bHt_GE",
      challenge: "Hotel tetap beroperasi: 120 kamar harus tetap bisa dijual selama renovasi berlangsung.",
      solution: "Rotasi per lantai (maks 2 lantai aktif dikerjakan), barrier akustik, dan jadwal bising di luar jam tidur tamu.",
      result: "Occupancy hanya turun 9% selama 8 bulan; hotel membuka kembali lantai executive lebih cepat dari rencana.",
      highlights: ["Zero full-closure", "Rotasi per lantai", "Instalasi air & listrik baru"],
      tags: ["renovasi", "hospitality", "bandung"],
      latitude: -6.9147,
      longitude: 107.6098,
    },
    {
      title: "Kantor Ruang Bersama Kolektif",
      slug: "kantor-ruang-bersama-kolektif",
      category: "interior",
      summary: "Interior 800 m² untuk ruang kerja bersama: 120 meja dan 8 ruang rapat.",
      description:
        "Perancangan interior co-working space 800 m² dengan partisi akustik di ruang rapat, furniture custom dari kayu daur ulang, dan penerangan otomatis yang mengikuti jam operasional.",
      location: "Jakarta Pusat",
      clientName: "PT Kolektif Nusantara",
      year: 2026,
      value: "Rp 2,8 M",
      status: "ONGOING",
      coverImage: IMG("ja-proyek-kolektif"),
      isFeatured: false,
      area: 800,
      durationMonths: 4,
      floors: 1,
      startDate: new Date("2026-02-01"),
      endDate: null,
      architect: null,
      videoUrl: null,
      challenge: "Bangunan eksisting bersejarah dengan kolom struktural yang tidak boleh disentuh, sementara brief menuntut layout terbuka 120 meja.",
      solution: "Furniture custom mengalir mengikuti grid kolom dan partisi akustik yang memanfaatkan posisi kolom sebagai pemisah alami ruang.",
      result: "Layout terbuka tercapai tanpa satu pun modifikasi struktur.",
      highlights: ["Furniture kayu daur ulang", "Partisi akustik", "Lighting otomatis"],
      tags: ["interior", "coworking", "adaptive-reuse"],
      latitude: -6.1995,
      longitude: 106.8243,
    },
    {
      title: "Jembatan Desa Sukamaju",
      slug: "jembatan-desa-sukamaju",
      category: "infrastruktur",
      summary: "Jembatan beton bertulang 45 m untuk 2.800 penduduk Desa Sukamaju.",
      description:
        "Pembangunan jembatan beton bertulang bentang 45 meter untuk menggantikan jembatan kayu darurat yang rusak terkena banjir. Pekerjaan mencakup dua pilar ganda, penguatan jalan pendekat, dan lampu penerangan tenaga surya.",
      location: "Sukabumi",
      clientName: "Pemerintah Kabupaten Sukabumi",
      year: 2026,
      value: "Rp 4,1 M",
      status: "PLANNING",
      coverImage: IMG("ja-proyek-jembatan"),
      isFeatured: false,
      area: null,
      durationMonths: 6,
      floors: null,
      startDate: new Date("2026-05-01"),
      endDate: null,
      architect: null,
      videoUrl: null,
      challenge: "Akses vinjek hanya lewat jalan desa sempit; bentang 45 m membutuhkan alat berat yang tidak muat lewat.",
      solution: "Perakitan girder di lokasi dengan mobile crane ringan dan penjadwalan pengangkutan material pagi hari saat jalan sepi.",
      result: "Perencanaan detail engineering disetujui Dinas Bina Marga Kabupaten.",
      highlights: ["Bentang 45 m", "Lampu tenaga surya", "Pilar ganda anti-rembes"],
      tags: ["infrastruktur", "jembatan", "desa"],
      latitude: -6.9214,
      longitude: 106.9271,
    },
    {
      title: "Gedung Sekolah Harapan Bangsa",
      slug: "gedung-sekolah-harapan-bangsa",
      category: "gedung",
      summary: "Sekolah 3 lantai berisi 24 ruang kelas plus asrama guru.",
      description:
        "Pembangunan gedung sekolah 3 lantai berisi 24 ruang kelas, laboratorium, perpustakaan, dan asrama guru. Struktur dirancang tahan gempa dengan pembesian berkerumun di titik kolom dan sesuai render SNI.",
      location: "Tangerang",
      clientName: "Yayasan Harapan Bangsa",
      year: 2026,
      value: "Rp 6,8 M",
      status: "PLANNING",
      coverImage: IMG("ja-proyek-sekolah"),
      isFeatured: false,
      area: 5600,
      durationMonths: 12,
      floors: 3,
      startDate: new Date("2026-07-01"),
      endDate: null,
      architect: "Biro Desain Habitate",
      videoUrl: null,
      challenge: "Jadwal harus bergantian dengan tahun ajaran: pembangunan tidak boleh mengganggu kelas aktif di gedung lama berdampingan.",
      solution: "Sekat area kerja dengan hoarding tertinggi 4 m, rute alat berat terpisah dari rute siswa, dan pengecoran getar di luar jam ujian.",
      result: "Tender DED + konstruksi dimenangkan dengan skedulasi aman untuk 1.200 siswa.",
      highlights: ["Struktur tahan gempa", "24 ruang kelas", "Asrama guru terpadu"],
      tags: ["pendidikan", "gedung", "tangerang"],
      latitude: -6.1783,
      longitude: 106.6319,
    },
  ];
  for (const p of projects) {
    const { category, ...data } = p;
    const payload = {
      ...data,
      slug: p.slug,
      categoryId: catId[category],
      isPublished: true,
    };
    await prisma.project.upsert({
      where: { slug: p.slug },
      update: payload,
      create: payload,
    });
  }
  console.log("✅ Proyek:", projects.length);

  // 4b. Konten layanan: ruang lingkup, paket harga, FAQ, relasi proyek
  const svc = {};
  for (const s of services) svc[slugify(s.title)] = await prisma.service.findUnique({ where: { slug: slugify(s.title) } });
  const projId = {};
  for (const p of projects) projId[p.slug] = (await prisma.project.findUnique({ where: { slug: p.slug } }))?.id;

  const SERVICE_CONTENT = {
    "konstruksi-bangunan": {
      startingPrice: 4500000,
      heroImage: IMG("ja-proyek-jaya-tower"),
      longDescription:
        "Layanan konstruksi bangunan mencakup perencanaan teknis, pengadaan material, pelaksanaan struktur hingga arsitektur, serta serah terima kunci. Setiap proyek dikelola manajer khusus dengan laporan progres mingguan, kontrol mutu 47 poin, dan RAB terperinci yang bisa diaudit kapan saja.",
      projects: ["perkantoran-jaya-tower", "perumahan-citra-residence", "gedung-sekolah-harapan-bangsa"],
      scopes: [
        ["Struktur & Pondasi", "Perhitungan dan pemasangan pondasi, kolom, balok, dan pelat pasangan.", "blocks"],
        ["Arsitektur & Finish", "Pekerjaan dinding, plafon, lantai, kusen, dan pengecatan akhir.", "paintbrush"],
        ["MEP (Mekanikal-Elektrikal-Plumbing)", "Instalasi listrik, air bersih dan kotor, HVAC, dan proteksi petir.", "plug-zap"],
        ["Site Management", "Pengelolaan lapangan, K3, perkakas, dan laporan mingguan.", "hard-hat"],
        ["Serah Terima & Garansi", "Punch list, retensi pekerjaan, dan garansi cacat.", "badge-check"],
      ],
      packages: [
        { name: "Standar", desc: "Bahan kualitas baik, cocok untuk hunian dan ruko.", from: 4500000, unit: "per m²", features: ["Struktur beton bertulang SNI", "Keramik 60x60 standar", "Saniter merk nasional", "Garansi struktur 5 tahun"], popular: false },
        { name: "Premium", desc: "Material pilihan premium dan desain fasad yang lebih kaya.", from: 6500000, unit: "per m²", features: ["Semua fitur Paket Standar", "Granit & kuarsa premium", "Kusen aluminium powder-coated", "Smart home dasar", "Garansi struktur 10 tahun"], popular: true },
        { name: "Kustom Plus", desc: "Bangunan khusus: fasad kaca, BMS, dan green building.", from: 8500000, unit: "per m²", features: ["Konsultasi arsitek senior", "Fasad kaca low-e", "Building management system", "Simulasi energi gedung", "Dukungan 24/7"], popular: false },
      ],
      faqs: [
        ["Berapa lama pembangunan gedung 3 lantai?", "Umumnya 8-12 bulan tergantung luas dan kompleksitas. Timeline tertulis terlampir di kontrak dengan milestone bulanan."],
        ["Apakah bisa mulai dengan RAB dari desain kita sendiri?", "Bisa. Kami kerjakan RAB terperinci dari gambar desain milik Anda tanpa biaya tambahan."],
        ["Bagaimana sistem pembayarannya?", "Termin per milestone pekerjaan — pembayaran berikutnya baru ditagih setelah milestone disidang dan disetujui."],
      ],
    },
    "renovasi-bangunan": {
      startingPrice: 2500000,
      heroImage: IMG("ja-proyek-hotel-anggrek"),
      longDescription:
        "Jasa renovasi total maupun parsial dijalankan dengan perencanaan tahapan ketat, terutama untuk bangunan yang masih ditempati. Pekerjaan meliputi perbaikan struktur, kebocoran, instalasi, hingga pembenahan fasad — dengan area kerja tertutup agar debu tidak menyebar ke ruang lain.",
      projects: ["renovasi-hotel-anggrek"],
      scopes: [
        ["Perbaikan Struktur", "Penguatan balok/kolom, perbaikan pondasi dan dinding retak.", "wrench"],
        ["Sistem Air & Listrik", "Penggantian total pipa, instalasi listrik, dan grounding.", "plug-zap"],
        ["Fasad & Atap", "Pengecatan, waterproofing, dan perbaikan atap.", "paintbrush"],
        ["Interior Renovasi", "Penataan ulang ruang, lantai baru, dan pasangan ulang.", "sofa"],
      ],
      packages: [
        { name: "Perbaikan Ringan", desc: "Cat ulang, plafon, lantai, dan perbaikan bocor.", from: 2500000, unit: "per m²", features: ["Survey & estimasi gratis", "Cat dinding interior", "Perbaikan plafon", "Selesai 7-21 hari"], popular: false },
        { name: "Renovasi Menyeluruh", desc: "Semua bagian bangunan dengan penggantian instalasi.", from: 4000000, unit: "per m²", features: ["Semua perbaikan ringan", "Instalasi air + listrik baru", "Waterproofing basah", "Garansi bocor 2 tahun", "Timeline per lantai"], popular: true },
        { name: "Restorasi Total", desc: "Bangunan tua: penggalian ulang, struktur, dan desain baru.", from: 6000000, unit: "per m²", features: ["Semua fitur renovasi menyeluruh", "Perbaikan struktur", "Desain ulang ruang", "Pengawasan khusus"], popular: false },
      ],
      faqs: [
        ["Apakah renovasi bisa dilakukan tanpa mengosongkan rumah?", "Bisa. Pekerjaan dibagi per zona dan tahap, dengan penutup proteksi debu dan jadwal bising yang disepakati."],
        ["Bagaimana kalau saat pembongkaran ternyata ada kerusakan tersembunyi?", "Segera kami laporkan dengan foto, ada prosedur variasi kerja dengan harga yang disetujui lebih dahulu sebelum dilaksanakan."],
        ["Apakah ada garansi hasil renovasi?", "Ada — garansi 2 tahun untuk kebocoran dan 1 tahun untuk pekerjaan interior."],
      ],
    },
    "desain-interior": {
      startingPrice: 1500000,
      heroImage: IMG("ja-proyek-kolektif"),
      longDescription:
        "Layanan desain & interior mencakup konsultasi konsep, moodboard, visualisasi 3D, hingga pelaksanaan pemasangan. Kami utamakan ergonomi, tata cahaya, dan material yang mudah dirawat — cocok untuk hunian, kantor, kafe, dan retail.",
      projects: ["kantor-ruang-bersama-kolektif"],
      scopes: [
        ["Konsultasi & Konsep 3D", "Moodboard, denah tata ruang, dan render 3D revisi sampai cocok.", "pen-tool"],
        ["Partition & Plafon", "Gypsum, partisi akustik, dan desain plafon list.", "layout-panel-top"],
        ["Furniture Custom", "Meja, lemari, dapur, dan wardrobe custom ukuran ruang.", "armchair"],
        ["Tata Cahaya & Audio", "Penerangan otomatis, lampu aksen, dan akustik ruang.", "lightbulb"],
      ],
      packages: [
        { name: "Dapur & Interior Ruang", desc: "Satu area utama: dapur, ruang tamu, atau kamar anak.", from: 1500000, unit: "per m²", features: ["Desain 2D + 3D", "Furniture custom", "Pemasangan rapi", "Revisi desain 2x"], popular: false },
        { name: "Rumah Lengkap", desc: "Semua ruang privat dan publik dalam satu kontrak.", from: 2000000, unit: "per m²", features: ["Semua fitur Dapur & Interior Ruang", "Tata cahaya lengkap", "Wardrobe seluruh kamar", "Dapur set lengkap", "Supervisi akhir pekan"], popular: true },
        { name: "Komersial & Kantor", desc: "Identitas visual, akustik, dan furniture profesional.", from: 2800000, unit: "per m²", features: ["Konsultasi brand fit-out", "Partisi akustik", "Furniture kustom korporat", "Integrasi audio-visual", "Pemeliharaan 6 bulan"], popular: false },
      ],
      faqs: [
        ["Apakah desain 3D dikenakan biaya terpisah?", "Tidak — desain dan visualisasi sudah termasuk untuk paket manapun."],
        ["Berapa lama pengerjaan interior rumah tipe 45?", "Umumnya 30-45 hari kerja setelah desain disetujui."],
      ],
    },
    "pengawasan-proyek": {
      startingPrice: 2500000,
      heroImage: IMG("ja-proyek-jembatan"),
      longDescription:
        "Sebagai konsultan pengawas independen, kami mewakili pemilik proyek mengawasi mutu, jadwal, dan anggaran kontraktor pelaksana. Hasil pengawasan berupa laporan berjenjang harian-mingguan-bulanan, catatan inspeksi, dan rekomendasi termin pembayaran.",
      projects: ["perkantoran-jaya-tower", "jembatan-desa-sukamaju"],
      scopes: [
        ["Inspeksi Material", "Verifikasi kualitas material datang vs spesifikasi RAB.", "package-check"],
        ["Pengujian Struktur", "Slump test, tes beton, dan uji daya dukung tanah.", "flask-conical"],
        ["Kontrol Jadwal & Anggaran", "Kurva-S, kurva progress fisik vs RAB, menghadap klien.", "calendar-clock"],
        ["Laporan Berjenjang", "Laporan harian, mingguan, dan bulanan — plus dokumentasi foto.", "clipboard-list"],
      ],
      packages: [
        { name: "Pengawasan Perminggu", desc: "Kunjungan terjadwal + laporan mingguan.", from: 2500000, unit: "per kunjungan", features: ["Inspeksi mingguan", "Laporan foto", "Catatan temuan"], popular: false, unit: "per bulan" },
        { name: "Pengawasan Penuh", desc: "Tim pengawas di lokasi setiap hari kerja.", from: 12000000, unit: "per bulan", features: ["Pengawas harian di lokasi", "Laporan harian & mingguan", "Verifikasi termin", "Koordinasi kurva-S"], popular: true, unit: "per bulan" },
        { name: "Pengawas + Konsultan Desain", desc: "Pengawasan plus review desain teknis milik Anda.", from: 18000000, unit: "per bulan", features: ["Semua fitur Pengawasan Penuh", "Review shop drawing", "Audit RAB kontraktor"], popular: false },
      ],
      faqs: [
        ["Apakah pengawasan bisa untuk proyek yang sudah berjalan?", "Bisa — kami mulai dengan audit kondisi awal dan progress fisik terkini."],
        ["Apa bedanya pengawas dengan manajer proyek?", "Pengawas mewakili pemilik (owner) mengontrol kontraktor; manajer proyek bertindak atas kontraktor pelaksana."]
      ],
    },
  };

  for (const [slugP, content] of Object.entries(SERVICE_CONTENT)) {
    const s = svc[slugP];
    if (!s) continue;
    await prisma.service.update({
      where: { id: s.id },
      data: {
        heroImage: content.heroImage,
        longDescription: content.longDescription,
        startingPrice: content.startingPrice,
        isFeatured: true,
        metaTitle: `${s.title} — Jaya Abadi Kontraktor`,
        metaDescription: s.shortDesc,
      },
    });
    // Ruang lingkup — direset agar seed tetap idempotent
    await prisma.serviceScope.deleteMany({ where: { serviceId: s.id } });
    await prisma.serviceScope.createMany({
      data: content.scopes.map(([title, description, icon], i) => ({ serviceId: s.id, title, description, icon, sortOrder: i })),
    });
    // Paket harga
    await prisma.servicePackage.deleteMany({ where: { serviceId: s.id } });
    await prisma.servicePackage.createMany({
      data: content.packages.map((p, i) => ({
        serviceId: s.id, name: p.name, description: p.desc, priceFrom: p.from,
        priceUnit: p.unit ?? "per m²", features: p.features, isPopular: !!p.popular,
        sortOrder: i, isPublished: true,
      })),
    });
    // FAQ terkait layanan
    await prisma.faq.deleteMany({ where: { serviceId: s.id } });
    await prisma.faq.createMany({
      data: content.faqs.map(([question, answer], i) => ({ serviceId: s.id, question, answer, sortOrder: i, isPublished: true })),
    });
    // Relasi proyek → layanan
    for (const slugR of content.projects) {
      if (projId[slugR]) await prisma.project.update({ where: { id: projId[slugR] }, data: { serviceId: s.id } });
    }
  }
  const scopeTotal = await prisma.serviceScope.count();
  const pkgTotal = await prisma.servicePackage.count();
  console.log(`✅ Konten layanan: scopes ${scopeTotal}, packages ${pkgTotal}`);

  // 5. Testimoni (idempotent via cek nama)
  const testimonials = [
    {
      name: "Rina Wijaya",
      position: "Direktur Operasional",
      company: "PT Maju Investama",
      content:
        "Jaya Abadi selesai membangun gedung kantor kami dua pekan lebih cepat dari jadwal. Komunikasi laporan mingguan membuat kami selalu tahu progres terbaru.",
      rating: 5,
      avatar: IMG("ja-testi-rina", 300, 300),
    },
    {
      name: "Budi Santoso",
      position: "Owner",
      company: "Hotel Anggrek Indonesia",
      content:
        "Renovasi hotel berjalan tanpa satu kamar pun yang gagal disewakan. Tim bekerja sangat disiplin dan menjaga kebersihan area kerja.",
      rating: 5,
      avatar: IMG("ja-testi-budi", 300, 300),
    },
    {
      name: "Maya Kusuma",
      position: "Manajer Proyek",
      company: "PT Citra Land Property",
      content:
        "48 unit rumah selesai dengan mutu seragam. Detail finishing rapi dan serah terima ke pembeli berjalan lancar.",
      rating: 4,
      avatar: IMG("ja-testi-maya", 300, 300),
    },
  ];
  for (const t of testimonials) {
    await upsertBy("testimonial", { name: t.name }, t);
  }
  console.log("✅ Testimoni:", testimonials.length);

  // 6. Anggota tim (idempotent via cek nama)
  const team = [
    {
      name: "Agus Hartanto",
      position: "Direktur Utama",
      bio: "Lebih dari 20 tahun di dunia konstruksi, memimpin proyek gedung bertingkat dan infrastruktur sejak 2006.",
      photo: IMG("ja-tim-agus", 400, 400),
      department: "MANAJEMEN",
      email: "agus@jayaabadi.co.id",
      linkedin: "https://linkedin.com/in/agus-hartanto",
    },
    {
      name: "Dewi Lestari",
      position: "Direktur Operasional",
      bio: "Praktisi manajemen proyek bersertifikat PMI yang menjaga jadwal dan anggaran tetap sesuai target.",
      photo: IMG("ja-tim-dewi", 400, 400),
      department: "MANAJEMEN",
      email: "dewi@jayaabadi.co.id",
      linkedin: "https://linkedin.com/in/dewi-lestari",
    },
    {
      name: "Rendra Mahesa",
      position: "Kepala Teknik",
      bio: "Insinyur sipil spesialis struktural dengan 15 tahun pengalaman menangani bangunan tahan gempa.",
      photo: IMG("ja-tim-rendra", 400, 400),
      department: "TEKNIK",
      email: "rendra@jayaabadi.co.id",
    },
    {
      name: "Sinta Permata",
      position: "Manajer Proyek Interior",
      bio: "Ahli interior komersial yang sudah menangani lebih dari 60 proyek kantor dan ruang usaha.",
      photo: IMG("ja-tim-sinta", 400, 400),
      department: "ARSITEK_INTERIOR",
      email: "sinta@jayaabadi.co.id",
      instagram: "https://instagram.com/sintapermata",
    },
  ];
  for (const [i, t] of team.entries()) {
    await upsertBy("teamMember", { name: t.name }, { ...t, sortOrder: i, isPublished: true });
  }
  console.log("✅ Tim:", team.length);

  // 7. Hero slide (idempotent via cek judul)
  const heroSlides = [
    {
      title: "Membangun Hunian & Bisnis Anda dengan Standar Tertinggi",
      subtitle: "Lebih dari 200 proyek konstruksi, renovasi, dan interior selesai tepat jadwal.",
      image: IMG("ja-hero-1"),
      ctaLabel: "Lihat Karya Kami",
      ctaUrl: "/proyek",
    },
    {
      title: "Renovasi Tanpa Drama",
      subtitle: "Tim ahli dengan laporan progres mingguan dan garansi mutu.",
      image: IMG("ja-hero-2"),
      ctaLabel: "Konsultasi Gratis",
      ctaUrl: "/kontak",
    },
    {
      title: "Dari Desain hingga Serah Terima",
      subtitle: "Layanan lengkap: konstruksi, renovasi, interior, dan pengawasan proyek.",
      image: IMG("ja-hero-3"),
      ctaLabel: "Layanan Kami",
      ctaUrl: "/layanan",
    },
  ];
  for (const [i, h] of heroSlides.entries()) {
    await upsertBy("heroSlide", { title: h.title }, { ...h, sortOrder: i });
  }
  console.log("✅ Hero slide:", heroSlides.length);

  // 9. Artikel (upsert by slug) — 12 artikel, 3 unggulan
  const posts = [
    {
      title: "5 Tips Memilih Kontraktor yang Tepat",
      slug: "5-tips-memilih-kontraktor-yang-tepat",
      category: "tips-konstruksi",
      excerpt: "Banyak keluhan proyek bisa dicegah. Pastikan lima hal ini sebelum menandatangani kontrak kerja.",
      content: "Banyak keluhan tentang proyek bermuara pada pemilihan kontraktor yang tergesa-gesa. Cek legalitas, portofolio, ruang lingkup kerja, komunikasi, dan kualitas material sebelum menandatangani kontrak. Kontraktor yang baik melaporkan progres secara reguler dan terbuka terhadap pertanyaan klien.",
      tags: ["panduan-konstruksi", "manajemen-proyek"],
      isFeatured: true,
      viewCount: 284,
      metaTitle: "5 Tips Memilih Kontraktor yang Tepat — Jaya Abadi",
      metaDescription: "Panduan praktis memilih kontraktor terpercaya dengan kontrak jelas, progres transparan, dan mutu terukur.",
      readTime: 4,
    },
    {
      title: "Jaya Abadi Menang Tender Jembatan Desa Sukamaju",
      slug: "jaya-abadi-menang-tender-jembatan-sukamaju",
      category: "berita",
      excerpt: "Tim kami dipercaya Pemkab Sukabumi untuk membangun jembatan beton 45 meter.",
      content: "Setelah masa pra-kualifikasi yang ketat, Jaya Abadi resmi menang tender pembangunan jembatan beton bertulang di Desa Sukamaju, Sukabumi. Pengerjaan mencakup pilar ganda, penguatan jalan pendekat, dan lampu tenaga surya untuk akses publik yang lebih aman.",
      tags: ["berita-jaya-abadi", "manajemen-proyek", "keberlanjutan"],
      isFeatured: true,
      viewCount: 412,
      metaTitle: "Jaya Abadi Menang Tender Jembatan Sukamaju",
      metaDescription: "Kabar terbaru proyek jembatan beton 45 meter Jaya Abadi di Desa Sukamaju, Sukabumi.",
      readTime: 3,
    },
    {
      title: "Kilas Balik: Selesainya Perumahan Citra Residence",
      slug: "kilas-balik-perumahan-citra-residence",
      category: "proyek",
      excerpt: "48 unit rumah dua lantai di Bogor rampung tepat waktu berkat perencanaan material yang matang.",
      content: "Proyek Citra Residence dimulai Februari 2024 dan selesai pada Desember 2024. Kuncinya ada pada perencanaan material yang dipesan bergelombang sesuai progres, sehingga tidak ada penumpukan maupun penundaan karena menunggu kiriman.",
      tags: ["inspirasi-hunian", "material", "manajemen-proyek"],
      isFeatured: true,
      viewCount: 367,
      metaTitle: "Kilas Balik Citra Residence — Jaya Abadi",
      metaDescription: "Cerita penyelesaian 48 unit rumah Citra Residence di Bogor dengan perencanaan material yang matang.",
      readTime: 3,
    },
    {
      title: "RAB Konstruksi Transparan: Komponen yang Wajib Dicek",
      slug: "rab-konstruksi-transparan-komponen-wajib-dicek",
      category: "tips-konstruksi",
      excerpt: "Pahami komponen RAB agar anggaran pembangunan mudah dipantau sejak awal.",
      content: "Rencana Anggaran Biaya yang baik memisahkan pekerjaan persiapan, struktur, arsitektur, utilitas, dan pekerjaan akhir. Mintalah satuan, volume, harga material, upah, serta asumsi perubahan agar setiap angka dapat ditinjau bersama.",
      tags: ["panduan-konstruksi", "material", "manajemen-proyek"],
      viewCount: 198,
      metaTitle: "Cara Membaca RAB Konstruksi dengan Transparan",
      metaDescription: "Pelajari komponen RAB konstruksi supaya anggaran proyek dapat dipantau dan dibahas dengan jelas.",
      readTime: 4,
    },
    {
      title: "Memilih Material Lantai untuk Area dengan Aktivitas Tinggi",
      slug: "memilih-material-lantai-area-aktivitas-tinggi",
      category: "tips-konstruksi",
      excerpt: "Perbandingan pertimbangan daya tahan, perawatan, dan tampilan untuk lantai komersial.",
      content: "Area dengan lalu lintas tinggi membutuhkan material yang tahan abrasi, mudah dirawat, dan aman saat basah. Keramik homogen, vinyl komersial, dan batu alam memiliki karakter berbeda sehingga pilihan harus mengikuti pola aktivitas ruang.",
      tags: ["material", "desain-interior"],
      viewCount: 156,
      metaTitle: "Panduan Memilih Material Lantai Komersial",
      metaDescription: "Pertimbangan memilih material lantai yang awet, aman, dan mudah dirawat untuk area aktivitas tinggi.",
      readTime: 4,
    },
    {
      title: "Tren Interior Kantor yang Mendukung Kolaborasi",
      slug: "tren-interior-kantor-mendukung-kolaborasi",
      category: "proyek",
      excerpt: "Ruang kerja fleksibel membantu tim berkolaborasi tanpa mengorbankan fokus dan kenyamanan.",
      content: "Interior kantor modern menggabungkan ruang terbuka, bilik fokus, ruang rapat kecil, dan area informal. Perencanaan akustik, pencahayaan, serta jalur sirkulasi menjadi kunci agar ruang fleksibel tetap nyaman digunakan sepanjang hari.",
      tags: ["desain-interior", "keberlanjutan"],
      viewCount: 241,
      metaTitle: "Tren Interior Kantor untuk Kolaborasi Tim",
      metaDescription: "Inspirasi penataan interior kantor fleksibel yang seimbang antara kolaborasi, fokus, dan kenyamanan.",
      readTime: 4,
    },
    {
      title: "Renovasi Rumah Bertahap Tanpa Mengganggu Aktivitas Keluarga",
      slug: "renovasi-rumah-bertahap-tanpa-mengganggu-keluarga",
      category: "proyek",
      excerpt: "Strategi membagi pekerjaan renovasi rumah agar keluarga tetap dapat beraktivitas nyaman.",
      content: "Renovasi rumah yang dihuni perlu dibagi menjadi zona dan tahapan kerja. Mulailah dari area servis, siapkan jalur sementara untuk listrik dan air, lalu sepakati jam kerja serta prosedur kebersihan dengan tim pelaksana.",
      tags: ["renovasi", "inspirasi-hunian", "manajemen-proyek"],
      viewCount: 329,
      metaTitle: "Tips Renovasi Rumah Bertahap untuk Keluarga",
      metaDescription: "Cara merencanakan renovasi rumah bertahap agar pekerjaan rapi dan aktivitas keluarga tetap berjalan.",
      readTime: 3,
    },
    {
      title: "Mengapa Pengawasan Proyek Menjaga Anggaran Tetap Terkendali",
      slug: "mengapa-pengawasan-proyek-menjaga-anggaran",
      category: "berita",
      excerpt: "Pengawasan rutin membantu menemukan deviasi mutu, jadwal, dan biaya sebelum terlambat.",
      content: "Pengawasan bukan sekadar memeriksa hasil akhir. Inspeksi material, pencatatan volume, dan laporan progres berkala membuat keputusan koreksi dapat diambil lebih cepat dan mengurangi pekerjaan ulang yang membebani anggaran.",
      tags: ["manajemen-proyek", "berita-jaya-abadi"],
      viewCount: 275,
      metaTitle: "Peran Pengawasan dalam Mengendalikan Anggaran Proyek",
      metaDescription: "Alasan pengawasan proyek penting untuk menjaga mutu, jadwal, dan anggaran konstruksi tetap terkendali.",
      readTime: 3,
    },
    {
      title: "Membangun Rumah Hemat Energi dari Tahap Desain",
      slug: "membangun-rumah-hemat-energi-tahap-desain",
      category: "proyek",
      excerpt: "Strategi desain pasif dan material tepat dapat menekan konsumsi energi rumah.",
      content: "Rumah hemat energi dimulai dari orientasi bangunan, bukaan silang, pelindung matahari, dan pemilihan material selubung. Sistem lampu dan sanitasi yang efisien kemudian melengkapi strategi pasif tersebut.",
      tags: ["keberlanjutan", "inspirasi-hunian", "material"],
      viewCount: 221,
      metaTitle: "Panduan Desain Rumah Hemat Energi",
      metaDescription: "Langkah desain pasif dan pemilihan material untuk membangun rumah yang lebih hemat energi.",
      readTime: 4,
    },
    {
      title: "Checklist Serah Terima Bangunan untuk Pemilik",
      slug: "checklist-serah-terima-bangunan-pemilik",
      category: "tips-konstruksi",
      excerpt: "Gunakan checklist sederhana untuk memeriksa bangunan sebelum serah terima.",
      content: "Pemeriksaan serah terima mencakup struktur terlihat, finishing, pintu dan jendela, instalasi listrik, sanitasi, kebocoran, serta dokumen garansi. Catat setiap temuan dengan lokasi dan foto agar tindak lanjut mudah dilacak.",
      tags: ["panduan-konstruksi", "manajemen-proyek"],
      viewCount: 174,
      metaTitle: "Checklist Serah Terima Bangunan",
      metaDescription: "Daftar pemeriksaan penting sebelum pemilik menerima bangunan dari kontraktor.",
      readTime: 3,
    },
    {
      title: "Mengenal Tahapan Renovasi Fasad dan Atap",
      slug: "mengenal-tahapan-renovasi-fasad-dan-atap",
      category: "proyek",
      excerpt: "Kenali urutan pemeriksaan dan pekerjaan agar renovasi fasad serta atap lebih aman.",
      content: "Renovasi fasad dan atap dimulai dari audit kondisi, pengamanan area, pembongkaran terukur, perbaikan struktur, dan pemasangan lapisan pelindung. Urutan ini mencegah kerusakan baru akibat air dan cuaca selama pekerjaan.",
      tags: ["renovasi", "material", "inspirasi-hunian"],
      viewCount: 143,
      metaTitle: "Tahapan Renovasi Fasad dan Atap Rumah",
      metaDescription: "Urutan aman renovasi fasad dan atap mulai dari audit kondisi hingga lapisan pelindung.",
      readTime: 4,
    },
    {
      title: "Jaya Abadi Perkuat Standar Mutu melalui Laporan Mingguan",
      slug: "jaya-abadi-perkuat-standar-mutu-laporan-mingguan",
      category: "berita",
      excerpt: "Laporan progres mingguan membuat klien dapat mengikuti mutu dan kemajuan pekerjaan secara terbuka.",
      content: "Laporan mingguan Jaya Abadi merangkum pekerjaan selesai, rencana pekan berikutnya, kendala, dokumentasi lapangan, dan status anggaran. Format yang konsisten membantu tim dan klien mengambil keputusan berdasarkan data.",
      tags: ["berita-jaya-abadi", "manajemen-proyek"],
      viewCount: 188,
      metaTitle: "Standar Mutu Jaya Abadi dan Laporan Progres Mingguan",
      metaDescription: "Bagaimana laporan progres mingguan membantu menjaga mutu dan transparansi proyek Jaya Abadi.",
      readTime: 3,
    },
  ];
  for (const p of posts) {
    const { category, tags: postTags, ...data } = p;
    const payload = {
      ...data,
      authorId: admin.id,
      categoryId: catId[category],
      coverImage: IMG(`ja-post-${p.slug}`),
      isPublished: true,
      publishedAt: new Date(),
    };
    const post = await prisma.post.upsert({
      where: { slug: p.slug },
      update: payload,
      create: payload,
    });
    await prisma.postTag.deleteMany({ where: { postId: post.id } });
    const tagRows = postTags.map((slug) => tagId[slug]).filter(Boolean).map((id) => ({ postId: post.id, tagId: id }));
    if (tagRows.length) await prisma.postTag.createMany({ data: tagRows, skipDuplicates: true });
  }
  console.log("✅ Artikel:", posts.length);

  // 9. SiteSetting default (upsert by key)
  const settings = {
    company_name: "Jaya Abadi",
    company_address: "Jl. Raya Merdeka No. 88, Tangerang Selatan, Banten 15320",
    company_phone: "(021) 555-0123",
    company_email: "halo@jayaabadi.co.id",
    company_whatsapp: "6281234567890",
    work_hours: "Senin–Jumat 08.00–17.00, Sabtu 08.00–14.00",
    contact_response_time: "15 menit",
    about_text:
      "Jaya Abadi adalah perusahaan kontraktor yang berdiri sejak 2006, bergerak di bidang konstruksi bangunan, renovasi, interior, dan pengawasan proyek. Lebih dari 200 proyek telah kami rampungkan untuk klien perumahan, hotel, perkantoran, dan pemerintahan dengan standar mutu serta ketepatan waktu.",
    about_vision:
      "Menjadi kontraktor nasional terdepan yang membangun ruang hidup dan bekerja dengan mutu unggul serta berkelanjutan.",
    about_mission:
      "Menghadirkan hasil kerja konstruksi yang aman, rapi, dan tepat waktu.\nMengedepankan komunikasi terbuka dan laporan proyek yang transparan.\nMengembangkan kompetensi tim dan mitra lokal secara berkelanjutan.\nMenjalankan usaha dengan integritas dan tanggung jawab sosial.",
    stat_years_experience: "20",
    stat_completed_projects: "200",
    stat_clients: "150",
    stat_experts: "80",
    // Konten halaman Tentang Kami
    about_headline: "Membangun Kepercayaan Sejak 2006",
    about_story:
      "Berawal dari tim kecil pengecoran lantai di Tangerang pada 2006, Jaya Abadi tumbuh menjadi kontraktor umum yang dipercaya mengerjakan lebih dari 200 proyek — dari rumah tinggal hingga menara perkantoran. Kami bertumbuh bukan dengan mengejar kuantitas, melainkan menjaga janji yang tertulis di kontrak: mutu yang terukur, jadwal yang ditepati, dan RAB yang bisa diaudit kapan saja.\n\nHari ini lebih dari 80 tenaga ahli dan karyawan tetap bergabung dalam tim kami, didukung sistem kontrol mutu 47 poin dan laporan progres mingguan yang kami kirim ke setiap klien.",
    about_image: IMG("ja-about-tim"),
    // Placeholder: ganti dengan video profil resmi Jaya Abadi.
    // ID di bawah = time-lapse konstruksi resmi EarthCam (thumbnail valid).
    about_video_url: "https://www.youtube.com/watch?v=ab_2_bHt_GE",
    director_name: "Agus Hartanto",
    director_position: "Direktur Utama",
    director_photo: IMG("ja-direktur-agus", 600, 600),
    director_quote: "Bangunan yang baik lahir dari kebiasaan kecil yang dijaga setiap hari: jujur pada angka, disiplin pada jadwal.",
    director_message:
      "Terima kasih telah mempercayakan proyek kepada kami. Seperti yang telah kami buktikan selama lebih dari 18 tahun, setiap rupiah yang Anda keluarkan akan tercatat jelas dan setiap tenggat akan kami jaga. Keputusan membangun adalah keputusan besar — mari kita diskusikan dengan data, bukan janji.",
    legal_nib: "1023001123456",
    legal_sbu: "SBU-0123-KU-KONSTRUKSI-2023 (BG001)",
    legal_npwp: "01.234.567.8-901.000",
    legal_address: "Jl. Raya Merdeka No. 88, Tangerang Selatan, Banten 15320",
  };
  for (const [key, value] of Object.entries(settings)) {
    await prisma.siteSetting.upsert({ where: { key }, update: { value }, create: { key, value } });
  }
  console.log("✅ SiteSetting:", Object.keys(settings).length);

  // 10. Cabang kantor (2) — idempotent via cek nama
  const standardHours = [
    { hari: "Senin", buka: "08:00", tutup: "17:00", libur: false },
    { hari: "Selasa", buka: "08:00", tutup: "17:00", libur: false },
    { hari: "Rabu", buka: "08:00", tutup: "17:00", libur: false },
    { hari: "Kamis", buka: "08:00", tutup: "17:00", libur: false },
    { hari: "Jumat", buka: "08:00", tutup: "17:00", libur: false },
    { hari: "Sabtu", buka: "08:00", tutup: "14:00", libur: false },
    { hari: "Minggu", buka: "", tutup: "", libur: true },
  ];
  const branches = [
    {
      name: "Kantor Pusat Tangerang Selatan",
      address: "Jl. Raya Merdeka No. 88",
      city: "Tangerang Selatan",
      phone: "(021) 555-0123",
      whatsapp: "6281234567890",
      email: "halo@jayaabadi.co.id",
      latitude: -6.3016,
      longitude: 106.7042,
      mapEmbedUrl: "https://www.google.com/maps?q=-6.3016,106.7042&output=embed",
      openingHours: standardHours,
      photo: IMG("ja-branch-tangerang", 1000, 700),
      isMain: true,
      sortOrder: 0,
    },
    {
      name: "Cabang Bandung",
      address: "Jl. Buah Batu No. 120",
      city: "Bandung",
      phone: "(022) 700-4455",
      whatsapp: "6281234567890",
      email: "bandung@jayaabadi.co.id",
      latitude: -6.9475,
      longitude: 107.6323,
      mapEmbedUrl: "https://www.google.com/maps?q=-6.9475,107.6323&output=embed",
      openingHours: standardHours,
      photo: IMG("ja-branch-bandung", 1000, 700),
      isMain: false,
      sortOrder: 1,
    },
  ];
  for (const branch of branches) {
    await upsertBy("branch", { name: branch.name }, { ...branch, isPublished: true });
  }
  console.log("✅ Cabang:", branches.length);

  // 11. Mitra (8) — idempotent via cek nama
  const partners = [
    ["PT Bangun Perkasa", true], ["PT Sinar Beton", true], ["PT Karya Utama", true],
    ["CV Tropikindo", true], ["PT Adhi Material", true], ["PT Graha Estetika", false],
    ["PT Cakrawala Teknik", true], ["CV Mitra Kencana", false],
  ];
  for (const [i, [name, pub]] of partners.entries()) {
    await upsertBy("partner", { name }, { name, website: "https://example.co.id", sortOrder: i, isPublished: pub });
  }
  console.log("✅ Mitra:", partners.length);

  // 11. Sertifikat (4)
  const certificates = [
    { title: "SBU Konstruksi Gedung", issuer: "LPJK", year: 2022 },
    { title: "ISO 9001:2015", issuer: "BSI", year: 2023 },
    { title: "ISO 14001:2015", issuer: "BSI", year: 2024 },
    { title: "Sertifikat SMK3", issuer: "Kemnaker RI", year: 2024 },
  ];
  for (const [i, c] of certificates.entries()) {
    await upsertBy("certificate", { title: c.title }, { ...c, sortOrder: i, isPublished: true });
  }
  console.log("✅ Sertifikat:", certificates.length);

  // 12. FAQ (6)
  const faqs = [
    ["Apakah bisa konsultasi desain terlebih dulu?", "Bisa. Konsultasi awal dan survei lokasi gratis untuk area Jakarta, Bogor, Depok, Tangerang, dan Bekasi."],
    ["Berapa lama masa garansi pekerjaan?", "Garansi struktur 5 tahun dan garansi finishing 1 tahun, tercantum langsung pada kontrak kerja."],
    ["Bagaimana skema pembayarannya?", "Pembayaran bertahap (termin) mengikuti progres pekerjaan yang sudah disetujui pengawas."],
    ["Apakah RAB bisa diubah di tengah proyek?", "RAB hanya berubah bila ada pekerjaan tambah/kurang yang disetujui tertulis kedua pihak."],
    ["Apakah menerima renovasi sebagian saja?", "Ya, kami mengerjakan renovasi parsial maupun total, termasuk perbaikan pondasi dan atap."],
    ["Apakah proyek di luar Jawa dikerjakan?", "Untuk area luar Jawa kami menerima proyek bernilai kontrak di atas Rp 1 miliar."],
  ];
  for (const [i, [question, answer]] of faqs.entries()) {
    await upsertBy("faq", { question }, { question, answer, sortOrder: i, isPublished: true });
  }
  console.log("✅ FAQ:", faqs.length);

  // 13. Keunggulan (6)
  const features = [
    ["Tepat Waktu", "Jadwal terukur dengan milestone jelas dan laporan progres mingguan.", "clock"],
    ["RAB Transparan", "Rincian biaya per item material dan upah — tanpa biaya tersembunyi.", "receipt"],
    ["Garansi Mutu", "Garansi struktur 5 tahun & finishing 1 tahun di kontrak kerja.", "shield-check"],
    ["Tim Bersertifikat", "Insinyur sipil dan arsitek berpengalaman lebih dari 10 tahun.", "award"],
    ["Kontrol Kualitas", "47 poin inspeksi mutu internal sebelum serah terima.", "clipboard-check"],
    ["Kontrak Jelas", "Lingkup kerja, termin, dan masa pemeliharaan tertulis rinci.", "file-check"],
  ];
  for (const [i, [title, description, icon]] of features.entries()) {
    await upsertBy("feature", { title }, { title, description, icon, sortOrder: i, isPublished: true });
  }
  console.log("✅ Keunggulan:", features.length);

  // 14. Langkah alur kerja (5)
  const steps = [
    ["Konsultasi & Survei", "Diskusi kebutuhan, anggaran, dan survei kondisi lokasi oleh tim teknik.", "message-circle"],
    ["Desain & RAB", "Penyusunan desain, gambar kerja, dan RAB rinci per item pekerjaan.", "drafting-compass"],
    ["Kontrak & Perizinan", "Penandatanganan kontrak kerja dan pengurusan izin yang diperlukan.", "file-signature"],
    ["Pelaksanaan", "Pekerjaan lapangan dengan pengendalian mutu dan laporan mingguan.", "hard-hat"],
    ["Serah Terima & Garansi", "Inspeksi akhir bersama, serah terima kunci, dan masa pemeliharaan.", "key-round"],
  ];
  for (const [i, [title, description, icon]] of steps.entries()) {
    await upsertBy("processStep", { title }, { title, description, icon, sortOrder: i, isPublished: true });
  }
  console.log("✅ Langkah alur:", steps.length);

  // 15. Before/After (3) — dua dikaitkan ke proyek utama
  const towerProject = await prisma.project.findUnique({ where: { slug: "perkantoran-jaya-tower" } });
  const hotelProject = await prisma.project.findUnique({ where: { slug: "renovasi-hotel-anggrek" } });
  const beforeAfter = [
    { title: "Lobby Jaya Tower", location: "Jakarta Selatan", projectId: towerProject?.id },
    { title: "Kamar Hotel Anggrek", location: "Bandung", projectId: hotelProject?.id },
    { title: "Rumah Tipe 45 Citra Residence", location: "Bogor", projectId: null },
  ];
  for (const b of beforeAfter) {
    const payload = {
      ...b,
      beforeImage: IMG(`ja-ba-${slugify(b.title)}-before`),
      afterImage: IMG(`ja-ba-${slugify(b.title)}-after`),
      isPublished: true,
    };
    await upsertBy("beforeAfter", { title: b.title }, payload);
  }
  console.log("✅ Before/After:", beforeAfter.length);

  // 16. Harga estimasi (4)
  const estimates = [
    ["RUMAH", "Rumah Tinggal (Standar)", 4500000, 6500000],
    ["RUKO", "Ruko & Usaha Kecil", 5500000, 8000000],
    ["RENOVASI", "Renovasi Ringan–Berat", 2500000, 7000000],
    ["INTERIOR", "Interior & Furniture", 3000000, 9000000],
  ];
  for (const [buildingType, label, min, max] of estimates) {
    await upsertBy("estimatePrice", { buildingType }, { buildingType, label, pricePerM2Min: min, pricePerM2Max: max, isPublished: true });
  }
  console.log("✅ Harga estimasi:", estimates.length);

  // 17. Milestone sejarah (7, 2008–2026) — idempotent via cek year+title
  const milestones = [
    [2008, "Fondasi Pertama", "Tim 8 orang menyelesaikan 3 rumah tinggal di Tangerang — tahun pertama beroperasi penuh."],
    [2012, "Masuk Sektor Komersial", "Kontrak pertama gedung komersial 2 lantai; tim berkembang menjadi 25 karyawan tetap."],
    [2015, "SBU Konstruksi Aktif", "Legalitas SBU terbit dan Jaya Abadi mulai mengikuti tender pemerintah daerah."],
    [2018, "100 Proyek Rampung", "Men-capai 100 proyek selesai; sistem kontrol mutu 47 poin internal diberlakukan."],
    [2021, "Divisi Interior", "Peluncuran divisi desain & interior untuk melayani klien ruang komersial."],
    [2024, "Ekspansi Infrastruktur", "Menang tender jembatan pertama di Sukabumi dan membangun divisi infrastruktur."],
    [2026, "Era Digital", "Pelaporan proyek berbasis web untuk semua klien — progres, RAB, dan dokumen daring."],
  ];
  for (const [i, [year, title, description]] of milestones.entries()) {
    await upsertBy("milestone", { year, title }, { year, title, description, image: IMG(`ja-milestone-${year}`), sortOrder: i, isPublished: true });
  }
  console.log("✅ Milestone:", milestones.length);

  // 18. Nilai perusahaan (5)
  const coreValues = [
    ["Integritas", "Angka di RAB adalah angka yang kami pertanggungjawabkan — tanpa biaya tersembunyi.", "scale"],
    ["Disiplin Jadwal", "Milestone mingguan ditepati karena direncanakan sejak hari pertama.", "calendar-check"],
    ["Mutu Terukur", "Setiap tahap pekerjaan lolos inspeksi terstandar sebelum dilanjutkan.", "badge-check"],
    ["Keselamatan Dulu", "APD penuh, briefing harian, dan target zero accident di setiap lokasi.", "shield-check"],
    ["Kemitraan Jangka Panjang", "90% klien kami kembali untuk proyek kedua — relasi lebih penting dari transaksi.", "handshake"],
  ];
  for (const [i, [title, description, icon]] of coreValues.entries()) {
    await upsertBy("coreValue", { title }, { title, description, icon, sortOrder: i, isPublished: true });
  }
  console.log("✅ Nilai perusahaan:", coreValues.length);

  // 19. Galeri (12) — 3 per kategori
  const gallery = [
    ["KEGIATAN", "Briefing pagi proyek Jaya Tower"],
    ["KEGIATAN", "Pelatihan K3 tim lapangan"],
    ["KEGIATAN", "Inspeksi besi tulangan kolom"],
    ["PROYEK", "Fasad Jaya Tower pasang kaca"],
    ["PROYEK", "Pembangunan jembatan Sukamaju"],
    ["PROYEK", "Unit rumah Citra Residence"],
    ["KANTOR", "Ruang rapat kantor pusat"],
    ["KANTOR", "Workshop material & gudang"],
    ["KANTOR", "Lobby kantor Jaya Abadi"],
    ["PENGHARGAAN", "Piala kontraktor terbaik 2023"],
    ["PENGHARGAAN", "Sertifikat ISO 9001 dari BSI"],
    ["PENGHARGAAN", "Pengakuan zero accident 2024"],
  ];
  for (const [i, [category, caption]] of gallery.entries()) {
    await upsertBy("galleryItem", { caption }, { image: IMG(`ja-galeri-${i}`), caption, category, sortOrder: i, isPublished: true });
  }
  console.log("✅ Galeri:", gallery.length);
}

main()
  .catch((e) => {
    console.error("❌ Seed gagal:", e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
