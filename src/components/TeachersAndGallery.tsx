import React, { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Pencil, Play, Plus, Search, Trash2, X } from 'lucide-react';
import {
  type GalleryItem,
  HERO_IMAGES,
  type SchoolInfo,
  type TeacherProfile,
} from '../data/schoolData';
import type { AdminOpenIntent } from './AdminPortalModal';

const GALLERY_CATEGORIES: Array<'Semua' | GalleryItem['category']> = [
  'Semua',
  'Belajar',
  'Bermain',
  'Mengaji',
  'Pentas Seni',
  'Field Trip',
];

interface TeachersAndGalleryProps {
  schoolInfo: SchoolInfo;
  teachers: TeacherProfile[];
  galleryItems: GalleryItem[];
  isAdminUser?: boolean;
  onAdminAction?: (intent: AdminOpenIntent) => void;
}

export const TeachersAndGallery: React.FC<TeachersAndGalleryProps> = ({
  schoolInfo,
  teachers,
  galleryItems,
  isAdminUser = false,
  onAdminAction,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<'Semua' | GalleryItem['category']>('Semua');
  const [searchQuery, setSearchQuery] = useState('');
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [videoPlaying, setVideoPlaying] = useState(false);
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});

  const filteredGallery = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return galleryItems.filter((item) => {
      const matchCategory = selectedCategory === 'Semua' || item.category === selectedCategory;
      const matchQuery =
        !q ||
        item.title.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q);
      return matchCategory && matchQuery;
    });
  }, [galleryItems, selectedCategory, searchQuery]);

  // Keyboard navigation for Lightbox
  useEffect(() => {
    if (lightboxIndex === null) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setLightboxIndex(null);
      } else if (e.key === 'ArrowRight') {
        setLightboxIndex((prev) =>
          prev === null ? null : (prev + 1) % filteredGallery.length
        );
      } else if (e.key === 'ArrowLeft') {
        setLightboxIndex((prev) =>
          prev === null ? null : (prev - 1 + filteredGallery.length) % filteredGallery.length
        );
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [lightboxIndex, filteredGallery.length]);

  const activeLightboxItem =
    lightboxIndex !== null && filteredGallery[lightboxIndex]
      ? filteredGallery[lightboxIndex]
      : null;

  return (
    <>
      {/* Wave into Cream Teachers Section */}
      <div className="bg-white leading-none pointer-events-none" aria-hidden="true">
        <svg viewBox="0 0 1440 64" fill="none" className="w-full h-10 sm:h-14" preserveAspectRatio="none">
          <path
            d="M0 32C280 0 560 64 840 32C1120 0 1300 48 1440 24V64H0V32Z"
            fill="#fffbeb"
          />
        </svg>
      </div>

      {/* SECTION 6: GURU KAMI & SAMBUTAN KEPALA SEKOLAH */}
      <section id="guru" className="bg-tk-pattern py-16 sm:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <p className="text-sm font-extrabold text-[#ea580c] tracking-wide mb-2">
              Pendidik Penuh Kasih
            </p>
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-slate-900 text-balance mb-3">
              Kenalan dengan Bunda &amp; Miss Guru Kami 👩‍🏫
            </h2>
            <p className="text-slate-700 text-base sm:text-lg">
              Tim pendidik berlatar belakang PAUD yang sabar, kreatif, dan siap menjadi sahabat
              tumbuh kembang ananda.
            </p>
            {isAdminUser && onAdminAction && (
              <div className="mt-4">
                <button
                  type="button"
                  onClick={() => onAdminAction({ tab: 'guru', mode: 'add' })}
                  className="px-4 py-2 rounded-full bg-[#facc15] hover:bg-[#eab308] text-slate-900 font-bold text-xs inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Plus className="w-4 h-4" />
                  <span>Tambah Guru</span>
                </button>
              </div>
            )}
          </div>

          {/* Sambutan Kepala Sekolah */}
          <div className="bg-white rounded-[28px] p-6 sm:p-10 border-2 border-[#fde047] shadow-sm mb-12">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
              <div className="md:col-span-4 flex justify-center">
                <div className="w-52 h-52 sm:w-60 sm:h-60 rounded-full p-2 bg-[#fef08a] border-4 border-[#fb923c] shadow-sm overflow-hidden">
                  {!failedImages['principal'] ? (
                    <img
                      src={schoolInfo.principalPhoto || HERO_IMAGES.principal}
                      alt={schoolInfo.principalName}
                      loading="lazy"
                      referrerPolicy="no-referrer"
                      onError={() => setFailedImages((p) => ({ ...p, principal: true }))}
                      className="w-full h-full object-cover rounded-full"
                    />
                  ) : (
                    <div className="w-full h-full rounded-full bg-[#fde047] flex items-center justify-center font-display text-4xl font-bold text-slate-800">
                      {schoolInfo.principalName
                        .split(' ')
                        .slice(0, 2)
                        .map((w) => w[0]?.toUpperCase() || '')
                        .join('') || 'KS'}
                    </div>
                  )}
                </div>
              </div>
              <div className="md:col-span-8">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                  <p className="text-sm font-extrabold text-[#ea580c]">
                    Sambutan Kepala Sekolah
                  </p>
                  {isAdminUser && onAdminAction && (
                    <button
                      type="button"
                      onClick={() => onAdminAction({ tab: 'identitas', mode: 'edit' })}
                      className="px-3 py-1.5 rounded-full bg-[#e0f2fe] hover:bg-[#bae6fd] text-slate-900 text-xs font-bold inline-flex items-center gap-1 cursor-pointer"
                    >
                      <Pencil className="w-3 h-3" />
                      <span>Edit Identitas &amp; Kepala</span>
                    </button>
                  )}
                </div>
                <h3 className="font-display text-2xl sm:text-3xl font-bold text-slate-900 mb-3">
                  {schoolInfo.principalName}
                </h3>
                <blockquote className="text-slate-700 text-base sm:text-lg leading-relaxed mb-4">
                  &ldquo;{schoolInfo.principalQuote}&rdquo;
                </blockquote>
                <p className="text-sm font-bold text-slate-500">
                  {schoolInfo.name} · {schoolInfo.accreditation}
                </p>
              </div>
            </div>
          </div>

          {/* Grid Guru */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {teachers.map((teacher) => (
              <article
                key={teacher.id}
                className="bg-white rounded-[24px] p-6 border-2 border-amber-100 shadow-xs text-center flex flex-col items-center justify-between transition-transform duration-200 hover:-translate-y-1"
              >
                <div className="flex flex-col items-center">
                  <div
                    className={`w-32 h-32 rounded-full p-1.5 ${teacher.badgeColor} border-2 border-amber-200 mb-4 overflow-hidden`}
                  >
                    {!failedImages[teacher.id] ? (
                      <img
                        src={teacher.photo}
                        alt={teacher.name}
                        loading="lazy"
                        referrerPolicy="no-referrer"
                        onError={() =>
                          setFailedImages((prev) => ({ ...prev, [teacher.id]: true }))
                        }
                        className="w-full h-full object-cover rounded-full"
                      />
                    ) : (
                      <div className="w-full h-full rounded-full bg-white flex items-center justify-center font-display text-2xl font-bold text-slate-800">
                        {teacher.initials}
                      </div>
                    )}
                  </div>
                  <h3 className="font-display text-lg font-bold text-slate-900 mb-1">
                    {teacher.name}
                  </h3>
                  <p className="text-sm font-extrabold text-[#ea580c] mb-2">{teacher.role}</p>
                  <p className="text-xs font-bold text-slate-500 mb-3">{teacher.experience}</p>
                  <p className="text-sm text-slate-700 italic leading-relaxed">{teacher.slogan}</p>
                </div>

                {isAdminUser && onAdminAction && (
                  <div className="mt-4 pt-3 border-t border-amber-100 w-full flex items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        onAdminAction({ tab: 'guru', mode: 'edit', itemId: teacher.id })
                      }
                      className="px-3 py-1.5 rounded-full bg-[#e0f2fe] hover:bg-[#bae6fd] text-slate-900 text-xs font-bold inline-flex items-center gap-1 cursor-pointer"
                    >
                      <Pencil className="w-3 h-3" />
                      <span>Edit</span>
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        onAdminAction({ tab: 'guru', mode: 'delete', itemId: teacher.id })
                      }
                      className="px-3 py-1.5 rounded-full bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold inline-flex items-center gap-1 cursor-pointer"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Hapus</span>
                    </button>
                  </div>
                )}
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 7: GALERI CERIA & VIDEO */}
      <section id="galeri" className="bg-white py-16 sm:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <p className="text-sm font-extrabold text-[#0284c7] tracking-wide mb-2">
              Momen Bahagia Setiap Hari
            </p>
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-slate-900 text-balance mb-3">
              Galeri Ceria &amp; Video Kegiatan 📸
            </h2>
            <p className="text-slate-600 text-base sm:text-lg">
              Lihat keseruan anak-anak saat melukis, bermain di taman, mengaji pagi, hingga cooking
              class bersama teman-teman.
            </p>
            {isAdminUser && onAdminAction && (
              <div className="mt-4">
                <button
                  type="button"
                  onClick={() => onAdminAction({ tab: 'galeri', mode: 'add' })}
                  className="px-4 py-2 rounded-full bg-[#facc15] hover:bg-[#eab308] text-slate-900 font-bold text-xs inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Plus className="w-4 h-4" />
                  <span>Tambah Foto Galeri</span>
                </button>
              </div>
            )}
          </div>

          {/* Filter Kategori & Search Bar */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 mb-8">
            <div
              className="flex flex-wrap items-center gap-2"
              role="tablist"
              aria-label="Filter kategori galeri"
            >
              {GALLERY_CATEGORIES.map((category) => {
                const isActive = selectedCategory === category;
                return (
                  <button
                    key={category}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    onClick={() => {
                      setSelectedCategory(category);
                      setLightboxIndex(null);
                    }}
                    className={`px-4 py-2 rounded-full text-sm font-bold transition-colors whitespace-nowrap cursor-pointer ${
                      isActive
                        ? 'bg-[#facc15] text-slate-900 shadow-xs border-2 border-amber-400'
                        : 'bg-[#fffbeb] text-slate-700 hover:bg-amber-100 border border-amber-200'
                    }`}
                  >
                    {category}
                  </button>
                );
              })}
            </div>

            <div className="relative md:w-72">
              <Search
                className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                aria-hidden="true"
              />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari kegiatan (misal: melukis)..."
                aria-label="Cari foto di galeri"
                className="w-full pl-10 pr-4 py-2.5 rounded-full bg-[#fffbeb] border-2 border-amber-200 text-sm text-slate-800 placeholder:text-slate-500 focus:border-[#fb923c] focus:outline-none"
              />
            </div>
          </div>

          {/* Grid Galeri */}
          {filteredGallery.length === 0 ? (
            <div className="rounded-[24px] bg-[#fffbeb] border-2 border-amber-100 p-10 text-center">
              <p className="font-display text-xl font-bold text-slate-800 mb-2">
                Foto tidak ditemukan
              </p>
              <p className="text-sm text-slate-600 mb-4">
                Coba pilih kategori &ldquo;Semua&rdquo; atau hapus kata kunci pencarian.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSelectedCategory('Semua');
                  setSearchQuery('');
                }}
                className="px-5 py-2.5 rounded-full bg-[#facc15] text-slate-900 font-bold text-sm cursor-pointer"
              >
                Tampilkan Semua Foto
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-14">
              {filteredGallery.map((item, idx) => (
                <div
                  key={item.id}
                  className="group bg-[#fffbeb] rounded-[24px] overflow-hidden border-2 border-amber-100 shadow-xs transition-transform duration-200 hover:-translate-y-1 flex flex-col justify-between"
                >
                  <button
                    type="button"
                    onClick={() => setLightboxIndex(idx)}
                    className="text-left w-full cursor-pointer focus-visible:ring-2"
                  >
                    <div className="aspect-[4/3] w-full overflow-hidden bg-amber-50">
                      {!failedImages[item.id] ? (
                        <img
                          src={item.image}
                          alt={item.alt}
                          loading="lazy"
                          referrerPolicy="no-referrer"
                          onError={() =>
                            setFailedImages((prev) => ({ ...prev, [item.id]: true }))
                          }
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#fef9c3] to-[#e0f2fe] p-4 text-center">
                          <span className="font-display font-bold text-slate-700 text-sm">
                            {item.title}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <p className="text-xs font-extrabold text-[#ea580c] mb-1">
                        {item.category}
                      </p>
                      <h3 className="font-display text-base font-bold text-slate-900 line-clamp-1">
                        {item.title}
                      </h3>
                    </div>
                  </button>

                  {isAdminUser && onAdminAction && (
                    <div className="px-4 pb-3 pt-2 border-t border-amber-100 flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          onAdminAction({ tab: 'galeri', mode: 'edit', itemId: item.id })
                        }
                        className="px-3 py-1 rounded-full bg-[#e0f2fe] text-slate-900 text-xs font-bold inline-flex items-center gap-1 cursor-pointer"
                      >
                        <Pencil className="w-3 h-3" />
                        <span>Edit</span>
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          onAdminAction({ tab: 'galeri', mode: 'delete', itemId: item.id })
                        }
                        className="px-3 py-1 rounded-full bg-rose-50 text-rose-700 text-xs font-bold inline-flex items-center gap-1 cursor-pointer"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>Hapus</span>
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Video Kegiatan TK (Thumbnail-first for fast performance) */}
          <div className="bg-[#fffbeb] rounded-[28px] p-6 sm:p-8 border-2 border-[#7dd3fc] shadow-sm">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-5">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                  <p className="text-sm font-extrabold text-[#0284c7]">
                    Video Profil &amp; Suasana Kelas
                  </p>
                  {isAdminUser && onAdminAction && (
                    <button
                      type="button"
                      onClick={() => onAdminAction({ tab: 'identitas', mode: 'edit' })}
                      className="px-3 py-1 rounded-full bg-[#e0f2fe] hover:bg-[#bae6fd] text-slate-900 text-xs font-bold inline-flex items-center gap-1 cursor-pointer"
                    >
                      <Pencil className="w-3 h-3" />
                      <span>Edit Video</span>
                    </button>
                  )}
                </div>
                <h3 className="font-display text-2xl sm:text-3xl font-bold text-slate-900 mb-3">
                  Intip Keseruan Anak-Anak di {schoolInfo.name} 🎬
                </h3>
                <p className="text-slate-700 text-[15px] leading-relaxed mb-4">
                  Klik tombol putar untuk melihat video aktivitas pagi, interaksi hangat bersama
                  guru, dan suasana taman bermain kami. Video dimuat hanya saat diklik agar website
                  tetap cepat dibuka di ponsel.
                </p>
                {!videoPlaying && (
                  <button
                    type="button"
                    onClick={() => setVideoPlaying(true)}
                    className="px-6 py-3 rounded-full bg-[#7dd3fc] hover:bg-[#38bdf8] text-slate-900 font-display font-bold text-sm inline-flex items-center gap-2 transition-transform active:scale-95 cursor-pointer"
                  >
                    <Play className="w-4 h-4 fill-slate-900" aria-hidden="true" />
                    <span>Putar Video Kegiatan</span>
                  </button>
                )}
              </div>

              <div className="lg:col-span-7">
                <div className="relative aspect-video w-full rounded-[20px] overflow-hidden bg-slate-900 border-2 border-white shadow-md">
                  {!videoPlaying ? (
                    <button
                      type="button"
                      onClick={() => setVideoPlaying(true)}
                      aria-label={`Putar video profil ${schoolInfo.name}`}
                      className="relative w-full h-full group cursor-pointer block"
                    >
                      <img
                        src={schoolInfo.videoThumbnail || HERO_IMAGES.team}
                        alt={`Thumbnail video kegiatan ${schoolInfo.name}`}
                        loading="lazy"
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover opacity-90 transition-transform duration-300 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-900/65 via-slate-900/20 to-transparent flex items-center justify-center">
                        <span className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-[#facc15] text-slate-900 flex items-center justify-center shadow-lg border-4 border-white transition-transform duration-200 group-hover:scale-110">
                          <Play className="w-7 h-7 sm:w-8 sm:h-8 fill-slate-900 ml-1" />
                        </span>
                      </div>
                      <span className="absolute bottom-4 left-4 right-4 text-left text-white font-display font-bold text-sm sm:text-base drop-shadow">
                        ▶ Video Kegiatan Harian {schoolInfo.name} (Klik untuk Memutar)
                      </span>
                    </button>
                  ) : (
                    <iframe
                      className="w-full h-full"
                      src={`https://www.youtube-nocookie.com/embed/${schoolInfo.youtubeVideoId}?autoplay=1&rel=0`}
                      title={`Video Kegiatan ${schoolInfo.name}`}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Lightbox Modal */}
      {activeLightboxItem && lightboxIndex !== null && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-xs flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-label={activeLightboxItem.title}
          onClick={() => setLightboxIndex(null)}
        >
          <div
            className="relative max-w-4xl w-full bg-white rounded-[28px] overflow-hidden shadow-2xl border-2 border-[#fde047]"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setLightboxIndex(null)}
              aria-label="Tutup galeri"
              className="absolute top-3 right-3 z-10 w-10 h-10 rounded-full bg-white/95 hover:bg-[#facc15] text-slate-900 flex items-center justify-center shadow-md cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="relative bg-slate-900 aspect-[4/3] max-h-[65vh] w-full flex items-center justify-center">
              <img
                src={activeLightboxItem.image}
                alt={activeLightboxItem.alt}
                referrerPolicy="no-referrer"
                className="w-full h-full object-contain"
              />

              {filteredGallery.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={() =>
                      setLightboxIndex(
                        (lightboxIndex - 1 + filteredGallery.length) % filteredGallery.length
                      )
                    }
                    aria-label="Foto sebelumnya"
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/90 hover:bg-[#facc15] text-slate-900 flex items-center justify-center shadow-md cursor-pointer"
                  >
                    <ChevronLeft className="w-6 h-6" />
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setLightboxIndex((lightboxIndex + 1) % filteredGallery.length)
                    }
                    aria-label="Foto berikutnya"
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/90 hover:bg-[#facc15] text-slate-900 flex items-center justify-center shadow-md cursor-pointer"
                  >
                    <ChevronRight className="w-6 h-6" />
                  </button>
                </>
              )}
            </div>

            <div className="p-5 sm:p-6 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <p className="text-xs font-extrabold text-[#ea580c]">
                  {activeLightboxItem.category} · Foto {lightboxIndex + 1} /{' '}
                  {filteredGallery.length}
                </p>
                <h3 className="font-display text-xl font-bold text-slate-900">
                  {activeLightboxItem.title}
                </h3>
                <p className="text-sm text-slate-600 mt-0.5">
                  {activeLightboxItem.description}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
