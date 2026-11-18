// ============================================================================
// IDENTITAS & KONTEN TK — Ganti dengan data asli sekolah Anda di file ini
// ============================================================================

export type ProgramCode = string;

export interface SchoolProgram {
  code: ProgramCode;
  name: string;
  ageRange: string;
  scheduleHours: string;
  maxPerClass: number;
  defaultEnrolled: number;
  feeSummary: string;
  registrationFee: string;
  monthlyFee: string;
  accentBg: string;
  accentBorder: string;
  buttonBg: string;
  emoji: string;
  summary: string;
  highlights: string[];
  weeklySchedule: { day: string; activity: string }[];
}

export interface AdvantageItem {
  id: string;
  emoji: string;
  title: string;
  description: string;
  bgClass: string;
  borderClass: string;
}

export interface TimelineStep {
  id?: string;
  time: string;
  emoji: string;
  title: string;
  description: string;
  color: string;
}

export interface GalleryItem {
  id: string;
  title: string;
  category: 'Belajar' | 'Bermain' | 'Mengaji' | 'Pentas Seni' | 'Field Trip';
  description: string;
  image: string;
  alt: string;
}

export interface TeacherProfile {
  id: string;
  name: string;
  role: string;
  slogan: string;
  experience: string;
  photo: string;
  badgeColor: string;
  initials: string;
}

export interface TestimonialItem {
  id: string;
  parentName: string;
  childInfo: string;
  rating: number;
  quote: string;
  avatarColor: string;
  initials: string;
}

export interface FaqItem {
  id: string;
  question: string;
  answer: string;
}

export interface SchoolInfo {
  name: string;
  shortTagline: string;
  npsn: string;
  accreditation: string;
  curriculum: string;
  foundedYear: number;
  experienceYears: string;
  studentCount: string;
  teacherCount: string;
  ratioText: string;
  principalName: string;
  principalQuote: string;
  principalPhoto?: string;
  address: string;
  whatsappRaw: string;
  whatsappDisplay: string;
  instagramHandle: string;
  facebookName: string;
  youtubeName: string;
  email: string;
  schoolHoursA: string;
  schoolHoursB: string;
  serviceHours: string;
  ppdbDeadlineIso: string;
  youtubeVideoId: string;
  videoThumbnail?: string;
  mapsEmbedUrl: string;
  heroBadge?: string;
  heroTitle?: string;
  heroSubtitle?: string;
  heroImage?: string;
}

export const SCHOOL_INFO: SchoolInfo = {
  // Ganti dengan data asli TK
  name: 'TK Ceria Bangsa',
  shortTagline: 'PAUD & Taman Kanak-Kanak Ramah Anak',
  npsn: '20409812',
  accreditation: 'Akreditasi A (BAN-PDM)',
  curriculum: 'Kurikulum Merdeka PAUD',
  foundedYear: 2016,
  experienceYears: '10 Tahun',
  studentCount: '120 Anak',
  teacherCount: '10 Guru',
  ratioText: '1 : 10',
  principalName: 'Bunda Siti Rahmawati, S.Pd.AUD',
  principalQuote:
    'Setiap anak terlahir istimewa dengan rasa ingin tahu yang luar biasa. Di TK Ceria Bangsa, kami mendampingi langkah kecil mereka dengan penuh kasih sayang, kesabaran, dan kegembiraan agar mereka berani bermimpi serta tumbuh berakhlak mulia.',
  address: 'Jl. Melati Indah No. 18, Desa Sukamaju, Kecamatan Cibiru, Kabupaten Bandung 40615',
  // Format internasional tanpa tanda + untuk link wa.me
  whatsappRaw: '6281234567890',
  whatsappDisplay: '0812-3456-7890',
  instagramHandle: '@tkceriabangsa',
  facebookName: 'TK Ceria Bangsa Official',
  youtubeName: 'TK Ceria Bangsa TV',
  email: 'halo@tkceriabangsa.sch.id',
  schoolHoursA: 'Senin - Jumat, 07.30 - 10.30 WIB (Kelompok A & KB)',
  schoolHoursB: 'Senin - Jumat, 07.30 - 11.00 WIB (Kelompok B)',
  serviceHours: 'Senin - Jumat (07.00 - 14.00 WIB) & Sabtu (08.00 - 12.00 WIB)',
  // Target penutupan PPDB gelombang 1 (otomatis 28 hari ke depan jika sudah lewat, atau tanggal pasti)
  ppdbDeadlineIso: '2026-12-20T23:59:59+07:00',
  // Ganti dengan YouTube Video ID sekolah asli jika tersedia
  youtubeVideoId: 'M7lc1UVf-VE',
  videoThumbnail: '/src/assets/images/teacher_team_group_1794969029377.jpg',
  // Ganti koordinat/embed Google Maps sekolah asli
  mapsEmbedUrl:
    'https://www.google.com/maps?q=-6.917464,107.619123&z=15&output=embed',
  heroBadge: 'PPDB 2026/2027 Dibuka — Kuota Terbatas!',
  heroTitle: 'Tempat Anak Tumbuh Ceria, Berani, dan Berakhlak Mulia 🌈',
  heroSubtitle:
    'Anak belajar sambil bermain tanpa tekanan. Mengenal huruf, berhitung, mengaji, bernyanyi, dan berkarya — tanpa takut, tanpa bosan.',
  heroImage: '/src/assets/images/hero_tk_children_1794969016306.jpg',
};

export const HERO_IMAGES = {
  // Ganti foto ini dengan foto TK asli
  main: '/src/assets/images/hero_tk_children_1794969016306.jpg',
  principal: '/src/assets/images/teacher_kepala_sekolah_1794969014532.jpg',
  team: '/src/assets/images/teacher_team_group_1794969029377.jpg',
};

export const LOCAL_SCHOOL_PHOTOS = [
  { label: 'Kelas Bermain Balok', path: '/src/assets/images/hero_tk_children_1794969016306.jpg' },
  { label: 'Kelas Melukis Pelangi', path: '/src/assets/images/gallery_painting_class_1794969012790.jpg' },
  { label: 'Taman Bermain Outdoor', path: '/src/assets/images/gallery_outdoor_play_1794969013019.jpg' },
  { label: 'Mengaji & Cerita Pagi', path: '/src/assets/images/gallery_tahfidz_story_1794969013430.jpg' },
  { label: 'Cooking Class Cupcake', path: '/src/assets/images/gallery_cooking_class_1794969013884.jpg' },
  { label: 'Kepala Sekolah di Pojok Baca', path: '/src/assets/images/teacher_kepala_sekolah_1794969014532.jpg' },
  { label: 'Tim Guru Ceria', path: '/src/assets/images/teacher_team_group_1794969029377.jpg' },
];

export const WHY_CHOOSE_US: AdvantageItem[] = [
  {
    id: 'play',
    emoji: '🌱',
    title: 'Belajar Sambil Bermain',
    description:
      'Tanpa paksaan calistung kaku. Anak mengenal huruf, angka, dan logika melalui permainan sensori, lagu ceria, dan eksperimen seru.',
    bgClass: 'bg-[#fef9c3]',
    borderClass: 'border-[#fde047]',
  },
  {
    id: 'character',
    emoji: '🕌',
    title: 'Karakter & Akhlak Mulia',
    description:
      'Pembiasaan doa harian, praktik sholat dhuha ceria, sikap jujur, berbagi dengan teman, dan kemandirian sejak dini.',
    bgClass: 'bg-[#dcfce7]',
    borderClass: 'border-[#86efac]',
  },
  {
    id: 'teachers',
    emoji: '👩‍🏫',
    title: 'Guru Sabar & Bersertifikat',
    description:
      'Didampingi guru lulusan PAUD yang hangat dan telaten dengan rasio maksimal 1 guru untuk 10 anak agar perhatian merata.',
    bgClass: 'bg-[#fce7f3]',
    borderClass: 'border-[#f9a8d4]',
  },
  {
    id: 'safe-class',
    emoji: '🏫',
    title: 'Kelas Aman & Nyaman',
    description:
      'Ruang kelas ber-AC, mainan edukatif kayu berstandar aman, pantauan CCTV, pagar pengaman ganda, dan ruang UKS bersih.',
    bgClass: 'bg-[#e0f2fe]',
    borderClass: 'border-[#7dd3fc]',
  },
  {
    id: 'daily-report',
    emoji: '📱',
    title: 'Laporan Harian ke Orang Tua',
    description:
      'Bunda dan Ayah menerima dokumentasi foto kegiatan serta catatan perkembangan ananda setiap hari langsung via WhatsApp.',
    bgClass: 'bg-[#ffedd5]',
    borderClass: 'border-[#fdba74]',
  },
  {
    id: 'activities',
    emoji: '🎨',
    title: 'Banyak Kegiatan Seru',
    description:
      'Melukis jari, menari daerah, cooking class, field trip edukatif, manasik haji cilik, hingga pentas seni akhir tahun.',
    bgClass: 'bg-[#ede9fe]',
    borderClass: 'border-[#c4b5fd]',
  },
];

export const PROGRAMS: SchoolProgram[] = [
  {
    code: 'kb',
    name: 'Kelompok Bermain (KB)',
    ageRange: 'Usia 2 - 3 Tahun',
    scheduleHours: 'Senin - Jumat, 08.00 - 10.00 WIB',
    maxPerClass: 15,
    defaultEnrolled: 11,
    feeSummary: 'Rp 250.000 / bulan',
    registrationFee: 'Gratis Formulir (Trial 1 Hari Gratis)',
    monthlyFee: 'SPP Rp 250.000/bulan (termasuk snack sehat mingguan)',
    accentBg: 'bg-[#fef9c3]',
    accentBorder: 'border-[#facc15]',
    buttonBg: 'bg-[#facc15] hover:bg-[#eab308] text-slate-900',
    emoji: '🧸',
    summary:
      'Langkah pertama ananda bersosialisasi dengan penuh rasa aman melalui stimulasi sensori, motorik kasar-halus, dan pembiasaan mandiri.',
    highlights: [
      'Permainan sensori & eksplorasi warna',
      'Pendampingan toilet training penuh kasih',
      'Bernyanyi, gerak lagu, dan mendongeng',
      'Pembiasaan salam, antre, dan berbagi mainan',
    ],
    weeklySchedule: [
      { day: 'Senin', activity: 'Senam Ceria, Bermain Balok Kayu & Pengenalan Warna' },
      { day: 'Selasa', activity: 'Eksplorasi Sensori (Pasir Kinetik / Air) & Cerita Bergambar' },
      { day: 'Rabu', activity: 'Gerak & Lagu, Melatih Motorik Halus (Meronce / Stempel)' },
      { day: 'Kamis', activity: 'Doa Harian Ceria, Makan Bersama & Toilet Training' },
      { day: 'Jumat', activity: 'Bermain di Taman Outdoor & Mini Berkebun' },
    ],
  },
  {
    code: 'kelompok_a',
    name: 'Kelompok A (TK A)',
    ageRange: 'Usia 4 - 5 Tahun',
    scheduleHours: 'Senin - Jumat, 07.30 - 10.30 WIB',
    maxPerClass: 20,
    defaultEnrolled: 15,
    feeSummary: 'Rp 300.000 / bulan',
    registrationFee: 'Gratis Formulir (Trial 1 Hari Gratis)',
    monthlyFee: 'SPP Rp 300.000/bulan (termasuk modul kreativitas)',
    accentBg: 'bg-[#e0f2fe]',
    accentBorder: 'border-[#7dd3fc]',
    buttonBg: 'bg-[#7dd3fc] hover:bg-[#38bdf8] text-slate-900',
    emoji: '🌈',
    summary:
      'Membangun rasa percaya diri anak mengenal huruf, angka, bentuk, doa harian, serta keberanian bercerita dan berkarya di kelas.',
    highlights: [
      'Mengenal huruf, angka, dan konsep sains sederhana',
      'Hafalan doa harian & surat pendek pilihan',
      'Melukis, kolase, dan proyek kerajinan tangan',
      'Latihan kemandirian merapikan perlengkapan sendiri',
    ],
    weeklySchedule: [
      { day: 'Senin', activity: 'Apel Pagi Ceria, Mengenal Huruf & Permainan Kartu Kata' },
      { day: 'Selasa', activity: 'Sains Sederhana, Berhitung Benda Nyata & Menggambar' },
      { day: 'Rabu', activity: 'Praktik Doa Harian, Wudhu Ceria & Kisah Teladan' },
      { day: 'Kamis', activity: 'Seni Tari, Musik Perkusi Anak & Proyek Kolase' },
      { day: 'Jumat', activity: 'Sholat Dhuha Bersama, Senam Irama & Cooking Class Bulanan' },
    ],
  },
  {
    code: 'kelompok_b',
    name: 'Kelompok B (TK B)',
    ageRange: 'Usia 5 - 6 Tahun',
    scheduleHours: 'Senin - Jumat, 07.30 - 11.00 WIB',
    maxPerClass: 20,
    defaultEnrolled: 17,
    feeSummary: 'Rp 325.000 / bulan',
    registrationFee: 'Gratis Formulir (Trial 1 Hari Gratis)',
    monthlyFee: 'SPP Rp 325.000/bulan (termasuk persiapan SD & tahfidz)',
    accentBg: 'bg-[#fce7f3]',
    accentBorder: 'border-[#f9a8d4]',
    buttonBg: 'bg-[#f9a8d4] hover:bg-[#f472b6] text-slate-900',
    emoji: '🚀',
    summary:
      'Bekal matang menuju Sekolah Dasar dengan pendekatan menyenangkan: literasi dini, numerasi kontekstual, tahfidz Juz 30, dan keberanian tampil.',
    highlights: [
      'Persiapan SD: membaca & berhitung tanpa stres',
      'Program Tahfidz Juz 30 & Adab Islami',
      'Kemandirian penuh & kepemimpinan kelompok',
      'Tampil percaya diri dalam Pentas Seni & Outbound',
    ],
    weeklySchedule: [
      { day: 'Senin', activity: 'Literasi Menyenangkan, Membaca Cerita & Menulis Kreatif' },
      { day: 'Selasa', activity: 'Logika Matematika, Puzzle Pola & Eksperimen Alam' },
      { day: 'Rabu', activity: 'Tahfidz Juz 30, Bahasa Inggris Dasar & Roleplay Profesi' },
      { day: 'Kamis', activity: 'Karya Seni 3D, Latihan Pentas Seni & Kerjasama Tim' },
      { day: 'Jumat', activity: 'Sholat Dhuha, Zikir Pagi, Outbound Mini & Evaluasi Bintang' },
    ],
  },
];

export const DAILY_TIMELINE: TimelineStep[] = [
  {
    id: 'step_01',
    time: '07.30',
    emoji: '👋',
    title: 'Datang & Salam Ceria',
    description: 'Bunda guru menyambut hangat di gerbang dengan senyum, sapa, dan cek suhu ceria.',
    color: 'bg-[#fef08a] text-slate-900',
  },
  {
    id: 'step_02',
    time: '07.45',
    emoji: '🤸',
    title: 'Senam & Zikir Pagi',
    description: 'Pemanasan ceria di halaman, doa pagi, dan pembiasaan surat pendek bersama teman.',
    color: 'bg-[#fed7aa] text-slate-900',
  },
  {
    id: 'step_03',
    time: '08.00',
    emoji: '🧩',
    title: 'Belajar Sambil Bermain',
    description: 'Sentra balok, mengenal huruf-angka lewat permainan, dan cerita interaktif.',
    color: 'bg-[#bae6fd] text-slate-900',
  },
  {
    id: 'step_04',
    time: '09.00',
    emoji: '🍎',
    title: 'Snack Time & Cuci Tangan',
    description: 'Antre cuci tangan dengan tertib, membaca doa makan, dan menikmati bekal sehat.',
    color: 'bg-[#bbf7d0] text-slate-900',
  },
  {
    id: 'step_05',
    time: '09.30',
    emoji: '🎨',
    title: 'Berkarya, Melukis & Mengaji',
    description: 'Mengasah imajinasi lewat melukis, melipat kertas, atau bimbingan mengaji privat.',
    color: 'bg-[#fbcfe8] text-slate-900',
  },
  {
    id: 'step_06',
    time: '10.15',
    emoji: '🛝',
    title: 'Bermain di Luar & Istirahat',
    description: 'Bermain perosotan, ayunan, dan melatih keseimbangan di taman bermain aman.',
    color: 'bg-[#ddd6fe] text-slate-900',
  },
  {
    id: 'step_07',
    time: '10.45',
    emoji: '🌟',
    title: 'Refleksi & Doa Pulang',
    description: 'Anak bercerita hal seru hari ini, merapikan tas, lalu berdoa penutup bersama.',
    color: 'bg-[#fde68a] text-slate-900',
  },
  {
    id: 'step_08',
    time: '11.00',
    emoji: '🏡',
    title: 'Pulang & Salam Guru',
    description: 'Penjemputan tertib bersama orang tua dengan laporan singkat keceriaan hari ini.',
    color: 'bg-[#a7f3d0] text-slate-900',
  },
];

export const TEACHERS: TeacherProfile[] = [
  {
    id: 'kepala',
    name: 'Bunda Siti Rahmawati, S.Pd.AUD',
    role: 'Kepala Sekolah',
    slogan: '"Mendidik dengan hati, menemani tumbuh kembang dengan senyum."',
    experience: '14 Tahun Pengalaman PAUD',
    // Ganti foto ini dengan foto TK asli
    photo: '/src/assets/images/teacher_kepala_sekolah_1794969014532.jpg',
    badgeColor: 'bg-[#fef08a]',
    initials: 'SR',
  },
  {
    id: 'guru-a',
    name: 'Bu Guru Rina Lestari, S.Pd',
    role: 'Wali Kelas Kelompok A',
    slogan: '"Bu Rina suka mendongeng pakai boneka tangan lucu!"',
    experience: '8 Tahun Pengalaman PAUD',
    photo: '/src/assets/images/teacher_team_group_1794969029377.jpg',
    badgeColor: 'bg-[#bae6fd]',
    initials: 'RL',
  },
  {
    id: 'guru-b',
    name: 'Miss Dina Kartika, S.Pd',
    role: 'Wali Kelas Kelompok B & Musik',
    slogan: '"Miss Dina senang mengajak anak bernyanyi & eksperimen sains."',
    experience: '7 Tahun Pengalaman PAUD',
    photo: '/src/assets/images/gallery_cooking_class_1794969013884.jpg',
    badgeColor: 'bg-[#fbcfe8]',
    initials: 'DK',
  },
  {
    id: 'guru-tahfidz',
    name: 'Ustadzah Aisyah Nur, S.Ag',
    role: 'Guru Tahfidz & Karakter',
    slogan: '"Belajar doa harian dan hafalan surat pendek jadi seru dan lembut."',
    experience: '6 Tahun Pengalaman Tahfidz Anak',
    photo: '/src/assets/images/gallery_tahfidz_story_1794969013430.jpg',
    badgeColor: 'bg-[#bbf7d0]',
    initials: 'AN',
  },
];

export const GALLERY_ITEMS: GalleryItem[] = [
  {
    id: 'g1',
    title: 'Sentra Balok & Finger Painting',
    category: 'Belajar',
    description: 'Anak-anak Kelompok A berkolaborasi membangun menara kayu warna-warni bersama Bunda guru.',
    // Ganti foto ini dengan foto TK asli
    image: '/src/assets/images/hero_tk_children_1794969016306.jpg',
    alt: 'Anak TK Ceria Bangsa bermain balok kayu bersama guru di kelas yang terang',
  },
  {
    id: 'g2',
    title: 'Melukis Pelangi Ceria',
    category: 'Pentas Seni',
    description: 'Kreativitas tanpa batas saat kelas melukis cat air di meja kayu ruang seni TK Ceria Bangsa.',
    image: '/src/assets/images/gallery_painting_class_1794969012790.jpg',
    alt: 'Anak-anak melukis pelangi dengan cat air bersama teman-teman',
  },
  {
    id: 'g3',
    title: 'Taman Bermain Pagi Yang Aman',
    category: 'Bermain',
    description: 'Bermain perosotan dan batu pijakan warna-warni untuk melatih motorik kasar di bawah pohon rindang.',
    image: '/src/assets/images/gallery_outdoor_play_1794969013019.jpg',
    alt: 'Anak-anak bermain perosotan di taman bermain sekolah yang asri',
  },
  {
    id: 'g4',
    title: 'Cerita Teladan & Mengaji Pagi',
    category: 'Mengaji',
    description: 'Sesi lingkaran hangat mendengarkan cerita hikmah, doa harian, dan hafalan surat pendek.',
    image: '/src/assets/images/gallery_tahfidz_story_1794969013430.jpg',
    alt: 'Ibu guru membacakan buku cerita sambil anak-anak duduk melingkar ceria',
  },
  {
    id: 'g5',
    title: 'Cooking Class: Menghias Cupcake',
    category: 'Field Trip',
    description: 'Kegiatan akhir bulan menjadi koki cilik! Anak belajar tekstur, warna, dan berbagi kue.',
    image: '/src/assets/images/gallery_cooking_class_1794969013884.jpg',
    alt: 'Anak-anak memakai topi koki menghias cupcake warna-warni bersama guru',
  },
  {
    id: 'g6',
    title: 'Tim Guru Sahabat Anak',
    category: 'Belajar',
    description: 'Guru-guru ramah siap menyambut dan mendampingi tumbuh kembang ananda setiap pagi.',
    image: '/src/assets/images/teacher_team_group_1794969029377.jpg',
    alt: 'Tiga guru TK Ceria Bangsa tersenyum ramah di ruang kelas penuh karya anak',
  },
  {
    id: 'g7',
    title: 'Pojok Baca & Literasi Dini',
    category: 'Belajar',
    description: 'Sudut baca nyaman dengan ratusan buku bergambar pilihan untuk menumbuhkan minat baca sejak dini.',
    image: '/src/assets/images/teacher_kepala_sekolah_1794969014532.jpg',
    alt: 'Kepala sekolah berdiri di sudut baca TK Ceria Bangsa yang penuh buku cerita anak',
  },
  {
    id: 'g8',
    title: 'Karya Seni Menyambut Pentas',
    category: 'Pentas Seni',
    description: 'Hasil karya lukisan anak-anak dipajang rapi di dinding kelas sebagai apresiasi rasa percaya diri.',
    image: '/src/assets/images/gallery_painting_class_1794969012790.jpg',
    alt: 'Hasil lukisan pelangi karya anak TK B yang dipajang di kelas',
  },
];

export const TESTIMONIALS: TestimonialItem[] = [
  {
    id: 't1',
    parentName: 'Bunda Dewi Anggraini',
    childInfo: 'Ibunda Kenzie · Kelompok B',
    rating: 5,
    quote:
      'Baru satu bulan di TK Ceria Bangsa, Kenzie yang dulunya pemalu sekarang sudah berani tampil cerita di depan kelas, hafal doa harian, dan setiap pagi selalu semangat bangun sekolah!',
    avatarColor: 'bg-[#fef08a]',
    initials: 'DA',
  },
  {
    id: 't2',
    parentName: 'Ayah Hendra Wijaya',
    childInfo: 'Ayahanda Zahra · Kelompok A',
    rating: 5,
    quote:
      'Yang paling kami sukai adalah laporan foto harian dari Bu Guru lewat WhatsApp. Kami yang bekerja tetap merasa dekat dan tenang melihat Zahra belajar sambil tertawa ceria.',
    avatarColor: 'bg-[#bae6fd]',
    initials: 'HW',
  },
  {
    id: 't3',
    parentName: 'Mama Nadia Kusuma',
    childInfo: 'Ibunda Arka · Kelompok Bermain',
    rating: 5,
    quote:
      'Awalnya Arka masih menangis saat ditinggal dan belum lulus toilet training. Berkat kesabaran para Bunda guru, dalam tiga minggu Arka sudah mandiri dan sangat sayang gurunya.',
    avatarColor: 'bg-[#fbcfe8]',
    initials: 'NK',
  },
  {
    id: 't4',
    parentName: 'Bunda Ratna Sari',
    childInfo: 'Ibunda Fathan · Alumni 2025 (SD Kelas 1)',
    rating: 5,
    quote:
      'Tidak ada paksaan calistung, tapi saat masuk SD Fathan sudah lancar membaca, percaya diri, dan sopan santunnya selalu dipuji guru barunya. Bekal terbaik dari TK Ceria Bangsa.',
    avatarColor: 'bg-[#bbf7d0]',
    initials: 'RS',
  },
  {
    id: 't5',
    parentName: 'Ayah Dimas Pratama',
    childInfo: 'Ayahanda Alesha · Kelompok B',
    rating: 5,
    quote:
      'Lingkungan sekolah bersih, gerbang aman dijaga, dan kegiatan cooking class serta field trip-nya bikin Alesha selalu antusias bercerita panjang lebar sepulang sekolah.',
    avatarColor: 'bg-[#ddd6fe]',
    initials: 'DP',
  },
  {
    id: 't6',
    parentName: 'Bunda Mira Puspita',
    childInfo: 'Ibunda Rayyan · Kelompok A',
    rating: 5,
    quote:
      'Ikut Trial Gratis 1 Hari langsung jatuh hati! Guru-gurunya hangat seperti keluarga sendiri dan tidak membanding-bandingkan kemampuan anak. Sangat direkomendasikan!',
    avatarColor: 'bg-[#fed7aa]',
    initials: 'MP',
  },
];

export const FAQS: FaqItem[] = [
  {
    id: 'faq1',
    question: 'Apakah anak yang belum bisa toilet training boleh mendaftar?',
    answer:
      'Boleh sekali, Bunda! Khususnya untuk Kelompok Bermain (usia 2–3 tahun), kami memiliki program pendampingan toilet training bertahap dengan penuh kesabaran bekerja sama dengan orang tua di rumah.',
  },
  {
    id: 'faq2',
    question: 'Apakah tersedia layanan antar jemput anak?',
    answer:
      'Tersedia layanan antar jemput khusus area Desa Sukamaju dan Kecamatan Cibiru sekitarnya dengan kendaraan ber-AC serta pendampingan Bunda pengasuh dari gerbang rumah hingga masuk kelas.',
  },
  {
    id: 'faq3',
    question: 'Apakah anak dipaksa bisa baca, tulis, dan hitung (calistung)?',
    answer:
      'Tidak sama sekali. Sesuai prinsip Kurikulum Merdeka PAUD, kami mengenalkan literasi dan numerasi melalui permainan, buku cerita, balok, dan aktivitas menyenangkan tanpa tekanan.',
  },
  {
    id: 'faq4',
    question: 'Bagaimana jika anak menangis atau takut di hari pertama sekolah?',
    answer:
      'Sangat wajar di masa adaptasi! Selama 1–2 minggu pertama, Bunda atau Ayah diperbolehkan mendampingi di area tunggu yang terlihat anak hingga ananda merasa aman bersama guru pendampingnya.',
  },
  {
    id: 'faq5',
    question: 'Apakah orang tua mendapatkan laporan perkembangan anak?',
    answer:
      'Ya! Setiap hari orang tua mendapatkan foto kegiatan dan ringkasan suasana hati anak via WhatsApp kelas, serta buku rapor perkembangan lengkap setiap akhir semester.',
  },
  {
    id: 'faq6',
    question: 'Apakah tersedia program beasiswa atau keringanan biaya?',
    answer:
      'Kami menyediakan potongan uang pangkal bagi pendaftar Gelombang Awal, diskon saudara kandung (sibling discount), serta program subsidi silang/beasiswa bagi keluarga yang membutuhkan.',
  },
];

export function buildWhatsappLink(
  customMessage?: string,
  schoolInfo: SchoolInfo = SCHOOL_INFO
): string {
  const defaultMsg =
    `Assalamu'alaikum / Halo Bunda Guru ${schoolInfo.name}, saya ingin bertanya informasi PPDB & Trial Gratis 1 Hari.`;
  const text = encodeURIComponent(customMessage || defaultMsg);
  return `https://wa.me/${schoolInfo.whatsappRaw}?text=${text}`;
}
