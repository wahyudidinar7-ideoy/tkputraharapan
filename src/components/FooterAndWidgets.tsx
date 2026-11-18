import React, { useEffect, useState } from 'react';
import {
  ArrowUp,
  Clock,
  Facebook,
  Instagram,
  Mail,
  MapPin,
  MessageCircle,
  Pencil,
  Phone,
  X,
  Youtube,
} from 'lucide-react';
import { buildWhatsappLink, type SchoolInfo } from '../data/schoolData';
import type { AdminOpenIntent } from './AdminPortalModal';

interface FooterAndWidgetsProps {
  schoolInfo: SchoolInfo;
  onNavigate: (sectionId: string) => void;
  onStartTrialFromPopup: () => void;
  onOpenAdmin: () => void;
  onAdminAction?: (intent: AdminOpenIntent) => void;
  isAdminUser?: boolean;
}

const WELCOME_POPUP_DISMISSED_KEY = 'tk_ceria_welcome_dismissed_v1';

export const FooterAndWidgets: React.FC<FooterAndWidgetsProps> = ({
  schoolInfo,
  onNavigate,
  onStartTrialFromPopup,
  onOpenAdmin,
  onAdminAction,
  isAdminUser = false,
}) => {
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [showWelcomePopup, setShowWelcomePopup] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 450);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Welcome Trial Popup: appears gently after 10s dwell, once per browser
  useEffect(() => {
    try {
      if (window.localStorage.getItem(WELCOME_POPUP_DISMISSED_KEY) === '1') {
        return;
      }
    } catch {
      // Ignore storage failures
    }

    const timer = window.setTimeout(() => {
      setShowWelcomePopup(true);
    }, 10000);

    return () => window.clearTimeout(timer);
  }, []);

  const dismissPopup = () => {
    setShowWelcomePopup(false);
    try {
      window.localStorage.setItem(WELCOME_POPUP_DISMISSED_KEY, '1');
    } catch {
      // Ignore
    }
  };

  const handleAcceptTrial = () => {
    dismissPopup();
    onStartTrialFromPopup();
  };

  return (
    <>
      {/* SECTION 11: KONTAK, LOKASI & FOOTER */}
      <section id="kontak" className="bg-[#fffbeb] pt-16 pb-12 border-t border-amber-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <p className="text-sm font-extrabold text-[#ea580c] tracking-wide mb-2">
              Kunjungi Sekolah Kami
            </p>
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-slate-900 text-balance mb-3">
              Kontak &amp; Lokasi {schoolInfo.name} 📍
            </h2>
            <p className="text-slate-700 text-base">
              Ayah &amp; Bunda dipersilakan berkunjung langsung untuk melihat ruang kelas dan taman
              bermain kami.
            </p>
            {isAdminUser && onAdminAction && (
              <div className="mt-4">
                <button
                  type="button"
                  onClick={() => onAdminAction({ tab: 'identitas', mode: 'edit' })}
                  className="px-4 py-2 rounded-full bg-[#e0f2fe] hover:bg-[#bae6fd] text-slate-900 font-bold text-xs inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Pencil className="w-3.5 h-3.5" />
                  <span>Edit Kontak, Alamat &amp; Peta</span>
                </button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch mb-14">
            {/* Info Kontak */}
            <div className="lg:col-span-5 bg-white rounded-[28px] p-7 border-2 border-amber-100 shadow-xs flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <div className="flex items-start gap-3.5">
                  <span className="w-10 h-10 rounded-2xl bg-[#fef9c3] flex items-center justify-center shrink-0">
                    <MapPin className="w-5 h-5 text-[#ea580c]" aria-hidden="true" />
                  </span>
                  <div>
                    <p className="font-bold text-sm text-slate-900">Alamat Sekolah</p>
                    <p className="text-sm text-slate-700 leading-relaxed">{schoolInfo.address}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3.5">
                  <span className="w-10 h-10 rounded-2xl bg-[#dcfce7] flex items-center justify-center shrink-0">
                    <Phone className="w-5 h-5 text-[#16a34a]" aria-hidden="true" />
                  </span>
                  <div>
                    <p className="font-bold text-sm text-slate-900">WhatsApp Panitia PPDB</p>
                    <a
                      href={buildWhatsappLink(undefined, schoolInfo)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-bold text-[#16a34a] hover:underline tabular-nums"
                    >
                      {schoolInfo.whatsappDisplay}
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-3.5">
                  <span className="w-10 h-10 rounded-2xl bg-[#e0f2fe] flex items-center justify-center shrink-0">
                    <Mail className="w-5 h-5 text-[#0284c7]" aria-hidden="true" />
                  </span>
                  <div>
                    <p className="font-bold text-sm text-slate-900">Email Resmi</p>
                    <a
                      href={`mailto:${schoolInfo.email}`}
                      className="text-sm font-semibold text-slate-700 hover:underline"
                    >
                      {schoolInfo.email}
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-3.5">
                  <span className="w-10 h-10 rounded-2xl bg-[#fce7f3] flex items-center justify-center shrink-0">
                    <Clock className="w-5 h-5 text-[#db2777]" aria-hidden="true" />
                  </span>
                  <div>
                    <p className="font-bold text-sm text-slate-900">Jam Layanan Orang Tua</p>
                    <p className="text-sm text-slate-700">{schoolInfo.serviceHours}</p>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-amber-100">
                <p className="text-xs font-extrabold text-slate-500 mb-3">Media Sosial Resmi</p>
                <div className="flex flex-wrap gap-2.5">
                  <a
                    href={`https://instagram.com/${schoolInfo.instagramHandle.replace('@', '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3.5 py-2 rounded-full bg-[#fce7f3] hover:bg-[#fbcfe8] text-slate-900 text-xs font-bold inline-flex items-center gap-1.5"
                  >
                    <Instagram className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>{schoolInfo.instagramHandle}</span>
                  </a>
                  <a
                    href="https://facebook.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3.5 py-2 rounded-full bg-[#e0f2fe] hover:bg-[#bae6fd] text-slate-900 text-xs font-bold inline-flex items-center gap-1.5"
                  >
                    <Facebook className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>{schoolInfo.facebookName}</span>
                  </a>
                  <a
                    href="https://youtube.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3.5 py-2 rounded-full bg-[#fef9c3] hover:bg-[#fde047] text-slate-900 text-xs font-bold inline-flex items-center gap-1.5"
                  >
                    <Youtube className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>{schoolInfo.youtubeName}</span>
                  </a>
                </div>
              </div>
            </div>

            {/* Google Maps Responsive Iframe */}
            <div className="lg:col-span-7 bg-white rounded-[28px] p-2.5 border-2 border-amber-100 shadow-xs min-h-[320px]">
              <iframe
                title={`Peta Lokasi ${schoolInfo.name}`}
                src={schoolInfo.mapsEmbedUrl}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="w-full h-full min-h-[300px] rounded-[20px] border-0"
                allowFullScreen
              />
            </div>
          </div>

          {/* 3-Column Footer */}
          <footer className="bg-white rounded-[28px] p-8 sm:p-10 border-2 border-[#fde047] shadow-xs">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pb-8 border-b border-amber-100">
              <div>
                <h3 className="font-display text-xl font-bold text-slate-900 mb-2">
                  {schoolInfo.name}
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed mb-3">
                  {schoolInfo.shortTagline}. Membantu anak usia dini tumbuh percaya diri, ceria,
                  mandiri, dan berakhlak mulia sejak {schoolInfo.foundedYear}.
                </p>
                <p className="text-xs font-bold text-slate-500">
                  NPSN: {schoolInfo.npsn} · {schoolInfo.accreditation}
                </p>
              </div>

              <div>
                <h4 className="font-display text-lg font-bold text-slate-900 mb-3">Menu Cepat</h4>
                <ul className="grid grid-cols-2 gap-2 text-sm font-bold text-slate-700">
                  {[
                    { id: 'beranda', label: 'Beranda' },
                    { id: 'tentang', label: 'Keunggulan' },
                    { id: 'program', label: 'Program Kelas' },
                    { id: 'guru', label: 'Profil Guru' },
                    { id: 'galeri', label: 'Galeri Ceria' },
                    { id: 'testimoni', label: 'Testimoni' },
                    { id: 'ppdb', label: 'Daftar PPDB' },
                    { id: 'faq', label: 'Tanya Jawab' },
                  ].map((item) => (
                    <li key={item.id}>
                      <a
                        href={`#${item.id}`}
                        onClick={(e) => {
                          e.preventDefault();
                          onNavigate(item.id);
                        }}
                        className="hover:text-[#ea580c] transition-colors"
                      >
                        {item.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h4 className="font-display text-lg font-bold text-slate-900 mb-3">
                  Jam Belajar Siswa
                </h4>
                <p className="text-sm text-slate-700 mb-1.5">{schoolInfo.schoolHoursA}</p>
                <p className="text-sm text-slate-700 mb-4">{schoolInfo.schoolHoursB}</p>
                <button
                  type="button"
                  onClick={() => onNavigate('ppdb')}
                  className="px-5 py-2.5 rounded-full bg-[#facc15] hover:bg-[#eab308] text-slate-900 font-display font-bold text-sm cursor-pointer"
                >
                  🎉 Daftar PPDB 2026/2027
                </button>
              </div>
            </div>

            <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs sm:text-sm text-slate-600 font-semibold">
              <p>© 2026 {schoolInfo.name}. Dibuat dengan ❤️ untuk Anak Indonesia.</p>
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={onOpenAdmin}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-slate-900 hover:bg-slate-800 text-white font-bold cursor-pointer"
                >
                  <span>{isAdminUser ? '⚙️ Kelola Admin' : '🔐 Admin'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#fffbeb] hover:bg-[#fef08a] text-slate-800 border border-amber-200 font-bold cursor-pointer"
                >
                  <ArrowUp className="w-4 h-4" aria-hidden="true" />
                  <span>Kembali ke Atas</span>
                </button>
              </div>
            </div>
          </footer>
        </div>
      </section>

      {/* FLOATING WHATSAPP BUTTON ("Tanya Bunda Guru") */}
      <a
        href={buildWhatsappLink(undefined, schoolInfo)}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Tanya Bunda Guru via WhatsApp"
        className="fixed bottom-4 right-4 z-30 flex items-center gap-2 px-4 py-3 rounded-full bg-[#16a34a] hover:bg-[#15803d] text-white font-display font-bold text-sm shadow-lg border-2 border-white transition-transform duration-150 hover:scale-105 active:scale-95"
      >
        <MessageCircle className="w-5 h-5 shrink-0" aria-hidden="true" />
        <span className="hidden sm:inline whitespace-nowrap">Tanya Bunda Guru</span>
      </a>

      {/* FLOATING BACK TO TOP BUTTON */}
      {showBackToTop && (
        <button
          type="button"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          aria-label="Kembali ke atas halaman"
          className="fixed bottom-4 left-4 z-30 w-11 h-11 rounded-full bg-white hover:bg-[#facc15] text-slate-800 border-2 border-amber-300 shadow-md flex items-center justify-center transition-transform duration-150 hover:scale-105 cursor-pointer"
        >
          <ArrowUp className="w-5 h-5" />
        </button>
      )}

      {/* WELCOME POPUP (Muncul 1x setelah 10 detik) */}
      {showWelcomePopup && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/45 backdrop-blur-xs flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="welcome-popup-title"
          onClick={dismissPopup}
        >
          <div
            className="relative bg-white rounded-[28px] max-w-md w-full p-7 shadow-2xl border-2 border-[#facc15] text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={dismissPopup}
              aria-label="Tutup pop-up sambutan"
              className="absolute top-3.5 right-3.5 w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-700 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="text-5xl mb-3" aria-hidden="true">🎁</div>
            <h3
              id="welcome-popup-title"
              className="font-display text-2xl font-bold text-slate-900 mb-2"
            >
              Halo Bunda! Mau Trial Gratis 1 Hari? Yuk Daftar!
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed mb-6">
              Ajak ananda bermain dan belajar langsung di kelas {schoolInfo.name} selama 1 hari
              penuh tanpa biaya apa pun.
            </p>

            <div className="flex flex-col sm:flex-row gap-2.5">
              <button
                type="button"
                onClick={handleAcceptTrial}
                className="flex-1 px-5 py-3 rounded-full bg-[#facc15] hover:bg-[#eab308] text-slate-900 font-display font-bold text-sm shadow-sm cursor-pointer"
              >
                🎉 Daftar Trial
              </button>
              <button
                type="button"
                onClick={dismissPopup}
                className="flex-1 px-5 py-3 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm cursor-pointer"
              >
                Nanti Dulu
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
