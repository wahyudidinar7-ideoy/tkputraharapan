import React, { useState } from 'react';
import { ArrowRight, Award, BookOpenCheck, Pencil, ShieldCheck, Sparkles, Users } from 'lucide-react';
import { HERO_IMAGES, SCHOOL_INFO, type SchoolInfo } from '../data/schoolData';
import type { AdminOpenIntent } from './AdminPortalModal';

interface HeroSectionProps {
  schoolInfo: SchoolInfo;
  onNavigate: (sectionId: string) => void;
  isAdminUser?: boolean;
  onAdminAction?: (intent: AdminOpenIntent) => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  schoolInfo,
  onNavigate,
  isAdminUser = false,
  onAdminAction,
}) => {
  const [imgError, setImgError] = useState(false);
  const customHeroTitle = schoolInfo.heroTitle?.trim();
  const isDefaultHeroTitle = !customHeroTitle || customHeroTitle === SCHOOL_INFO.heroTitle;

  return (
    <section
      id="beranda"
      className="relative overflow-hidden bg-tk-pattern pt-8 pb-20 sm:pt-12 sm:pb-24"
    >
      {/* Subtle decorative pastel clouds & stars (non-intrusive) */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        <svg
          className="absolute -top-6 -left-10 w-44 h-44 text-[#7dd3fc]/25 animate-float-slow"
          viewBox="0 0 200 120"
          fill="currentColor"
        >
          <path d="M40 95h115a25 25 0 0 0 4-49.7A38 38 0 0 0 85 35a30 30 0 0 0-48 22A22 22 0 0 0 40 95Z" />
        </svg>
        <svg
          className="absolute top-14 right-8 w-16 h-16 text-[#facc15]/40 animate-sway-gentle"
          viewBox="0 0 64 64"
          fill="currentColor"
        >
          <path d="M32 4l7.6 15.8L57 22.3 44.5 34.4l3 17.3L32 43.4l-15.5 8.3 3-17.3L7 22.3l17.4-2.5L32 4z" />
        </svg>
        <svg
          className="hidden md:block absolute bottom-28 left-1/3 w-12 h-12 text-[#f9a8d4]/40 animate-float-slow"
          viewBox="0 0 64 64"
          fill="currentColor"
        >
          <circle cx="32" cy="32" r="24" />
        </svg>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* 2-Column Hero Split */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-stretch">
          {/* Left Copy Column */}
          <div className="lg:col-span-6 flex flex-col justify-center">
            <div className="flex flex-wrap items-center gap-2 mb-5">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border-2 border-[#fde047] shadow-xs">
                <Sparkles className="w-4 h-4 text-[#ea580c]" aria-hidden="true" />
                <span className="text-xs sm:text-sm font-extrabold text-slate-800">
                  {schoolInfo.heroBadge || 'PPDB 2026/2027 Dibuka — Kuota Terbatas!'}
                </span>
              </div>
              {isAdminUser && onAdminAction && (
                <button
                  type="button"
                  onClick={() => onAdminAction({ tab: 'identitas', mode: 'edit' })}
                  className="px-3.5 py-2 rounded-full bg-[#e0f2fe] hover:bg-[#bae6fd] text-slate-900 font-bold text-xs inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Pencil className="w-3.5 h-3.5" />
                  <span>Edit Hero &amp; Identitas</span>
                </button>
              )}
            </div>

            {isDefaultHeroTitle ? (
              <h1 className="font-display text-[clamp(2.2rem,4.2vw,3.45rem)] font-bold leading-[1.12] tracking-tight text-slate-900 text-balance mb-5">
                Tempat Anak Tumbuh{' '}
                <span className="text-[#ea580c] underline decoration-[#facc15] decoration-4 underline-offset-4">
                  Ceria, Berani
                </span>
                , dan Berakhlak Mulia 🌈
              </h1>
            ) : (
              <h1 className="font-display text-[clamp(2.2rem,4.2vw,3.45rem)] font-bold leading-[1.12] tracking-tight text-slate-900 text-balance mb-5">
                {customHeroTitle}
              </h1>
            )}

            <p className="text-base sm:text-lg text-slate-700 leading-relaxed max-w-xl mb-7 font-medium">
              Di <strong>{schoolInfo.name}</strong>,{' '}
              {schoolInfo.heroSubtitle ||
                'anak belajar sambil bermain tanpa tekanan. Mengenal huruf, berhitung, mengaji, bernyanyi, dan berkarya — tanpa takut, tanpa bosan.'}
            </p>

            {/* Primary & Secondary Action Buttons */}
            <div className="flex flex-wrap items-center gap-3.5 mb-8">
              <button
                type="button"
                onClick={() => onNavigate('ppdb')}
                className="px-7 py-4 rounded-full bg-[#facc15] hover:bg-[#eab308] text-slate-900 font-display font-bold text-base sm:text-lg shadow-md border-2 border-amber-400 transition-all duration-150 hover:scale-[1.03] active:scale-95 flex items-center gap-2 whitespace-nowrap cursor-pointer"
              >
                <span>🎉 Daftar PPDB Sekarang</span>
                <ArrowRight className="w-5 h-5" aria-hidden="true" />
              </button>

              <button
                type="button"
                onClick={() => onNavigate('program')}
                className="px-6 py-4 rounded-full bg-white hover:bg-[#e0f2fe] text-slate-800 font-display font-bold text-base border-2 border-[#7dd3fc] shadow-xs transition-all duration-150 hover:scale-[1.02] active:scale-95 whitespace-nowrap cursor-pointer"
              >
                👀 Lihat Kelas Kami
              </button>
            </div>

            {/* Trust Elements (Akreditasi, Kurikulum, NPSN) */}
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2.5 text-sm font-bold text-slate-700 pt-4 border-t border-amber-200/80">
              <span className="inline-flex items-center gap-1.5">
                <Award className="w-4 h-4 text-[#ea580c]" aria-hidden="true" />
                {schoolInfo.accreditation}
              </span>
              <span className="text-amber-400" aria-hidden="true">·</span>
              <span className="inline-flex items-center gap-1.5">
                <BookOpenCheck className="w-4 h-4 text-[#0284c7]" aria-hidden="true" />
                {schoolInfo.curriculum}
              </span>
              <span className="text-amber-400" aria-hidden="true">·</span>
              <span className="inline-flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-[#16a34a]" aria-hidden="true" />
                NPSN {schoolInfo.npsn}
              </span>
            </div>
          </div>

          {/* Right Media Column */}
          <div className="lg:col-span-6 relative flex items-center">
            <div className="relative w-full h-full min-h-[300px] sm:min-h-[380px] rounded-[28px] bg-white p-3 shadow-lg border-2 border-[#fde047]">
              {!imgError ? (
                <img
                  src={schoolInfo.heroImage || HERO_IMAGES.main}
                  alt={`Anak-anak ${schoolInfo.name} sedang bermain balok kayu dan melukis bersama ibu guru`}
                  referrerPolicy="no-referrer"
                  onError={() => setImgError(true)}
                  className="w-full h-full object-cover rounded-[20px] aspect-[4/3] lg:aspect-auto"
                />
              ) : (
                <div className="w-full h-full min-h-[320px] rounded-[20px] bg-gradient-to-br from-[#fef9c3] via-[#e0f2fe] to-[#fce7f3] flex flex-col items-center justify-center p-8 text-center">
                  <Users className="w-12 h-12 text-[#ea580c] mb-3" />
                  <p className="font-display text-xl font-bold text-slate-800">
                    Suasana Kelas Ceria {schoolInfo.name}
                  </p>
                </div>
              )}

              {/* Cheerful Corner Sticker 1 */}
              <div className="absolute -top-4 -right-2 sm:right-4 px-4 py-2 rounded-full bg-[#fb923c] text-white font-display font-bold text-xs sm:text-sm shadow-md border-2 border-white rotate-2">
                🎁 Gratis Trial 1 Hari!
              </div>

              {/* Cheerful Corner Sticker 2 */}
              <div className="absolute -bottom-4 left-4 sm:left-6 px-4 py-2 rounded-full bg-[#86efac] text-slate-900 font-display font-bold text-xs sm:text-sm shadow-md border-2 border-white -rotate-1">
                🚌 Antar Jemput Aman
              </div>
            </div>
          </div>
        </div>

        {/* Full-Width 4-Column Fun Stats Bar Below Hero Split */}
        <div className="mt-14 grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <div className="bg-white rounded-[24px] p-5 border-2 border-[#fde047] shadow-xs flex flex-col items-center text-center transition-transform duration-200 hover:-translate-y-1">
            <span className="text-2xl mb-1" aria-hidden="true">🧒</span>
            <span className="font-display text-2xl sm:text-3xl font-bold text-slate-900 tabular-nums">
              {schoolInfo.studentCount}
            </span>
            <span className="text-sm font-semibold text-slate-600">Anak Ceria Aktif</span>
          </div>

          <div className="bg-white rounded-[24px] p-5 border-2 border-[#7dd3fc] shadow-xs flex flex-col items-center text-center transition-transform duration-200 hover:-translate-y-1">
            <span className="text-2xl mb-1" aria-hidden="true">👩‍🏫</span>
            <span className="font-display text-2xl sm:text-3xl font-bold text-slate-900 tabular-nums">
              {schoolInfo.teacherCount}
            </span>
            <span className="text-sm font-semibold text-slate-600">Guru Sayang Anak</span>
          </div>

          <div className="bg-white rounded-[24px] p-5 border-2 border-[#f9a8d4] shadow-xs flex flex-col items-center text-center transition-transform duration-200 hover:-translate-y-1">
            <span className="text-2xl mb-1" aria-hidden="true">🤝</span>
            <span className="font-display text-2xl sm:text-3xl font-bold text-slate-900 tabular-nums">
              {schoolInfo.ratioText}
            </span>
            <span className="text-sm font-semibold text-slate-600">Rasio Guru &amp; Anak</span>
          </div>

          <div className="bg-white rounded-[24px] p-5 border-2 border-[#86efac] shadow-xs flex flex-col items-center text-center transition-transform duration-200 hover:-translate-y-1">
            <span className="text-2xl mb-1" aria-hidden="true">🏆</span>
            <span className="font-display text-2xl sm:text-3xl font-bold text-slate-900 tabular-nums">
              {schoolInfo.experienceYears}
            </span>
            <span className="text-sm font-semibold text-slate-600">
              Berdiri Sejak {schoolInfo.foundedYear}
            </span>
          </div>
        </div>
      </div>

      {/* Organic Wave Divider */}
      <div className="absolute bottom-0 left-0 right-0 leading-none pointer-events-none" aria-hidden="true">
        <svg viewBox="0 0 1440 72" fill="none" className="w-full h-10 sm:h-14" preserveAspectRatio="none">
          <path
            d="M0 36C240 72 480 0 720 36C960 72 1200 0 1440 36V72H0V36Z"
            fill="#ffffff"
          />
        </svg>
      </div>
    </section>
  );
};
