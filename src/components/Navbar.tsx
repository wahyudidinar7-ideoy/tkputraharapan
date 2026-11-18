import React, { useState } from 'react';
import { Menu, X } from 'lucide-react';
import type { SchoolInfo } from '../data/schoolData';

interface NavbarProps {
  schoolInfo: SchoolInfo;
  onNavigate: (sectionId: string) => void;
  onOpenAdmin: () => void;
  isAdminUser?: boolean;
}

const NAV_LINKS = [
  { id: 'beranda', label: 'Beranda' },
  { id: 'tentang', label: 'Tentang Kami' },
  { id: 'program', label: 'Program' },
  { id: 'guru', label: 'Guru' },
  { id: 'galeri', label: 'Galeri Ceria' },
  { id: 'testimoni', label: 'Testimoni' },
  { id: 'ppdb', label: 'PPDB' },
];

export const Navbar: React.FC<NavbarProps> = ({
  schoolInfo,
  onNavigate,
  onOpenAdmin,
  isAdminUser = false,
}) => {
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleNavClick = (id: string) => {
    setMobileOpen(false);
    onNavigate(id);
  };

  return (
    <header className="sticky top-0 z-40 bg-[#fffbeb]/95 backdrop-blur-md border-b border-amber-200/80 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-[72px] flex items-center justify-between gap-4 lg:gap-8">
        {/* Zone 1: Brand Lockup (single line) */}
        <a
          href="#beranda"
          onClick={(e) => {
            e.preventDefault();
            handleNavClick('beranda');
          }}
          className="flex items-center gap-2.5 whitespace-nowrap shrink-0 group"
        >
          <span
            className="w-10 h-10 rounded-full bg-[#facc15] border-2 border-[#fb923c] flex items-center justify-center shadow-xs transition-transform duration-200 group-hover:scale-105"
            aria-hidden="true"
          >
            <svg viewBox="0 0 36 36" className="w-6 h-6" fill="none">
              <circle cx="18" cy="18" r="8" fill="#fb923c" />
              <path
                d="M18 4V7M18 29V32M4 18H7M29 18H32M8.1 8.1L10.2 10.2M25.8 25.8L27.9 27.9M27.9 8.1L25.8 10.2M10.2 25.8L8.1 27.9"
                stroke="#b45309"
                strokeWidth="2.4"
                strokeLinecap="round"
              />
              <circle cx="15.5" cy="17" r="1.2" fill="#fff" />
              <circle cx="20.5" cy="17" r="1.2" fill="#fff" />
              <path
                d="M15 20.5C16 21.8 20 21.8 21 20.5"
                stroke="#fff"
                strokeWidth="1.6"
                strokeLinecap="round"
              />
            </svg>
          </span>
          <span className="font-display text-xl sm:text-[22px] font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0">
            {schoolInfo.name}
          </span>
        </a>

        {/* Zone 2: Clean single-line text navigation links */}
        <nav aria-label="Navigasi Utama" className="hidden lg:flex items-center gap-6">
          {NAV_LINKS.map((link) => (
            <a
              key={link.id}
              href={`#${link.id}`}
              onClick={(e) => {
                e.preventDefault();
                handleNavClick(link.id);
              }}
              className="text-[15px] font-bold text-slate-700 hover:text-[#ea580c] underline-offset-4 hover:underline decoration-2 decoration-[#fb923c] transition-colors whitespace-nowrap shrink-0 py-1"
            >
              {link.label}
            </a>
          ))}
        </nav>

        {/* Zone 3: Always-visible Primary CTA + Admin Button + Mobile Toggle */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onOpenAdmin}
            className="inline-flex items-center px-2.5 sm:px-3.5 py-2 sm:py-2.5 rounded-full bg-white hover:bg-amber-50 text-slate-800 font-bold text-xs sm:text-sm border-2 border-amber-300 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            {isAdminUser ? '⚙️ Kelola Admin' : '🔐 Admin'}
          </button>

          <button
            type="button"
            onClick={() => handleNavClick('ppdb')}
            className="px-4 sm:px-5 py-2.5 rounded-full bg-[#facc15] hover:bg-[#eab308] text-slate-900 font-display font-bold text-sm sm:text-[15px] shadow-sm border-2 border-amber-400 transition-transform duration-150 hover:scale-[1.03] active:scale-95 whitespace-nowrap shrink-0 cursor-pointer"
          >
            🎉 Daftar Sekarang
          </button>

          <button
            type="button"
            onClick={() => setMobileOpen((prev) => !prev)}
            aria-label={mobileOpen ? 'Tutup menu' : 'Buka menu'}
            aria-expanded={mobileOpen}
            className="lg:hidden w-11 h-11 rounded-full bg-white border border-amber-200 flex items-center justify-center text-slate-800 hover:bg-amber-50 transition-colors cursor-pointer"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Dropdown Navigation */}
      {mobileOpen && (
        <nav
          aria-label="Navigasi Mobile"
          className="lg:hidden bg-white border-b border-amber-200 px-4 py-4 shadow-md"
        >
          <div className="grid grid-cols-2 gap-2">
            {NAV_LINKS.map((link) => (
              <a
                key={link.id}
                href={`#${link.id}`}
                onClick={(e) => {
                  e.preventDefault();
                  handleNavClick(link.id);
                }}
                className="px-4 py-3 rounded-2xl text-sm font-bold text-slate-800 bg-[#fffbeb] hover:bg-[#fef08a] transition-colors flex items-center justify-between"
              >
                <span>{link.label}</span>
              </a>
            ))}
            <button
              type="button"
              onClick={() => {
                setMobileOpen(false);
                onOpenAdmin();
              }}
              className="px-4 py-3 rounded-2xl text-sm font-bold text-slate-900 bg-[#fef9c3] border border-amber-300 text-left cursor-pointer"
            >
              {isAdminUser ? '⚙️ Kelola Admin' : '🔐 Admin'}
            </button>
          </div>
        </nav>
      )}
    </header>
  );
};
