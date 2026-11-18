import React, { useEffect, useState } from 'react';
import { ChevronDown, ChevronLeft, ChevronRight, Pencil, Plus, Star, Trash2 } from 'lucide-react';
import type { FaqItem, TestimonialItem } from '../data/schoolData';
import type { AdminOpenIntent } from './AdminPortalModal';

interface TestimonialsSectionProps {
  testimonials: TestimonialItem[];
  isAdminUser?: boolean;
  onAdminAction?: (intent: AdminOpenIntent) => void;
}

export const TestimonialsSection: React.FC<TestimonialsSectionProps> = ({
  testimonials,
  isAdminUser = false,
  onAdminAction,
}) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const count = testimonials.length;
  const safeIndex = count > 0 ? activeIndex % count : 0;

  // Auto-slide every 5.5s unless paused by hover/focus
  useEffect(() => {
    if (isPaused || count === 0) return;
    const timer = window.setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % count);
    }, 5500);
    return () => window.clearInterval(timer);
  }, [isPaused, count]);

  const visibleIndices =
    count === 0
      ? []
      : count <= 3
        ? testimonials.map((_, i) => i)
        : [safeIndex, (safeIndex + 1) % count, (safeIndex + 2) % count];

  return (
    <>
      {/* Wave into Cream Testimonials Section */}
      <div className="bg-white leading-none pointer-events-none" aria-hidden="true">
        <svg viewBox="0 0 1440 64" fill="none" className="w-full h-10 sm:h-14" preserveAspectRatio="none">
          <path
            d="M0 16C360 64 720 0 1080 40C1260 60 1380 40 1440 20V64H0V16Z"
            fill="#fffbeb"
          />
        </svg>
      </div>

      {/* SECTION 8: TESTIMONI ORANG TUA */}
      <section
        id="testimoni"
        className="bg-tk-pattern py-16 sm:py-20"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
            <div className="max-w-2xl">
              <p className="text-sm font-extrabold text-[#ea580c] tracking-wide mb-2">
                Kata Ayah &amp; Bunda
              </p>
              <h2 className="font-display text-3xl sm:text-4xl font-bold text-slate-900 text-balance">
                Cerita Bahagia Orang Tua Siswa 💬
              </h2>
            </div>

            <div className="flex items-center gap-2.5 self-start md:self-auto">
              {isAdminUser && onAdminAction && (
                <button
                  type="button"
                  onClick={() => onAdminAction({ tab: 'testimoni', mode: 'add' })}
                  className="px-4 py-2.5 rounded-full bg-[#facc15] hover:bg-[#eab308] text-slate-900 font-bold text-xs inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Plus className="w-4 h-4" />
                  <span>Tambah Testimoni</span>
                </button>
              )}
              <button
                type="button"
                onClick={() =>
                  count > 0 && setActiveIndex((prev) => (prev - 1 + count) % count)
                }
                aria-label="Testimoni sebelumnya"
                className="w-11 h-11 rounded-full bg-white hover:bg-[#facc15] border-2 border-amber-200 flex items-center justify-center text-slate-800 shadow-xs transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                type="button"
                onClick={() => count > 0 && setActiveIndex((prev) => (prev + 1) % count)}
                aria-label="Testimoni berikutnya"
                className="w-11 h-11 rounded-full bg-white hover:bg-[#facc15] border-2 border-amber-200 flex items-center justify-center text-slate-800 shadow-xs transition-colors cursor-pointer"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* 3-Card Responsive View */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {visibleIndices.map((idx, position) => {
              const item = testimonials[idx];
              if (!item) return null;
              return (
                <article
                  key={`${item.id}-${position}`}
                  className="bg-white rounded-[24px] p-7 border-2 border-amber-100 shadow-xs flex flex-col justify-between transition-transform duration-200 hover:-translate-y-1"
                >
                  <div>
                    <div
                      className="flex items-center gap-1 mb-4"
                      aria-label={`Rating ${item.rating} dari 5 bintang`}
                    >
                      {Array.from({ length: item.rating }).map((_, starIdx) => (
                        <Star
                          key={starIdx}
                          className="w-4 h-4 text-[#f59e0b] fill-[#facc15]"
                          aria-hidden="true"
                        />
                      ))}
                    </div>
                    <p className="text-slate-700 text-[15px] leading-relaxed mb-6">
                      &ldquo;{item.quote}&rdquo;
                    </p>
                  </div>

                  <div>
                    <div className="flex items-center gap-3.5 pt-4 border-t border-amber-100">
                      <div
                        className={`w-11 h-11 rounded-full ${item.avatarColor} flex items-center justify-center font-display font-bold text-slate-900 text-sm shrink-0`}
                        aria-hidden="true"
                      >
                        {item.initials}
                      </div>
                      <div>
                        <p className="font-display font-bold text-slate-900 text-base">
                          {item.parentName}
                        </p>
                        <p className="text-xs font-bold text-slate-500">{item.childInfo}</p>
                      </div>
                    </div>
                    {isAdminUser && onAdminAction && (
                      <div className="mt-3 pt-2.5 border-t border-amber-100 flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            onAdminAction({ tab: 'testimoni', mode: 'edit', itemId: item.id })
                          }
                          className="px-3 py-1 rounded-full bg-[#e0f2fe] text-slate-900 text-xs font-bold inline-flex items-center gap-1 cursor-pointer"
                        >
                          <Pencil className="w-3 h-3" />
                          <span>Edit</span>
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            onAdminAction({ tab: 'testimoni', mode: 'delete', itemId: item.id })
                          }
                          className="px-3 py-1 rounded-full bg-rose-50 text-rose-700 text-xs font-bold inline-flex items-center gap-1 cursor-pointer"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>Hapus</span>
                        </button>
                      </div>
                    )}
                  </div>
                </article>
              );
            })}
          </div>

          {/* Dots */}
          <div className="flex items-center justify-center gap-2 mt-8" role="tablist" aria-label="Pilih testimoni">
            {testimonials.map((item, idx) => (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={idx === safeIndex}
                aria-label={`Testimoni ${idx + 1}: ${item.parentName}`}
                onClick={() => setActiveIndex(idx)}
                className={`h-3 rounded-full transition-all cursor-pointer ${
                  idx === safeIndex ? 'w-8 bg-[#fb923c]' : 'w-3 bg-amber-200 hover:bg-amber-300'
                }`}
              />
            ))}
          </div>
        </div>
      </section>
    </>
  );
};

interface FaqSectionProps {
  faqs: FaqItem[];
  isAdminUser?: boolean;
  onAdminAction?: (intent: AdminOpenIntent) => void;
}

export const FaqSection: React.FC<FaqSectionProps> = ({
  faqs,
  isAdminUser = false,
  onAdminAction,
}) => {
  const [openId, setOpenId] = useState<string | null>(faqs[0]?.id ?? null);

  return (
    <section id="faq" className="bg-white py-16 sm:py-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <p className="text-sm font-extrabold text-[#0284c7] tracking-wide mb-2">
            Pertanyaan yang Sering Diajukan
          </p>
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-slate-900 text-balance mb-3">
            Tanya Jawab Seputar TK &amp; PPDB ❓
          </h2>
          <p className="text-slate-600 text-base">
            Masih ragu atau punya pertanyaan khusus tentang ananda? Simak jawaban lengkapnya di sini.
          </p>
          {isAdminUser && onAdminAction && (
            <div className="mt-4">
              <button
                type="button"
                onClick={() => onAdminAction({ tab: 'faq', mode: 'add' })}
                className="px-4 py-2 rounded-full bg-[#facc15] hover:bg-[#eab308] text-slate-900 font-bold text-xs inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Plus className="w-4 h-4" />
                <span>Tambah FAQ</span>
              </button>
            </div>
          )}
        </div>

        <div className="space-y-3.5">
          {faqs.map((faq) => {
            const isOpen = openId === faq.id;
            return (
              <div
                key={faq.id}
                className={`rounded-[24px] border-2 transition-colors ${
                  isOpen
                    ? 'bg-[#fffbeb] border-[#facc15]'
                    : 'bg-white border-amber-100 hover:border-amber-200'
                }`}
              >
                <button
                  type="button"
                  aria-expanded={isOpen}
                  onClick={() => setOpenId(isOpen ? null : faq.id)}
                  className="w-full px-6 py-4 sm:py-5 text-left flex items-center justify-between gap-4 cursor-pointer"
                >
                  <span className="font-display font-bold text-base sm:text-lg text-slate-900">
                    {faq.question}
                  </span>
                  <span
                    className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition-transform duration-200 ${
                      isOpen ? 'bg-[#facc15] rotate-180' : 'bg-amber-50'
                    }`}
                  >
                    <ChevronDown className="w-5 h-5 text-slate-800" aria-hidden="true" />
                  </span>
                </button>

                {isOpen && (
                  <div className="px-6 pb-5 text-slate-700 text-[15px] leading-relaxed">
                    <p>{faq.answer}</p>
                    {isAdminUser && onAdminAction && (
                      <div className="mt-3 pt-2.5 border-t border-amber-200 flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            onAdminAction({ tab: 'faq', mode: 'edit', itemId: faq.id })
                          }
                          className="px-3 py-1 rounded-full bg-[#e0f2fe] text-slate-900 text-xs font-bold inline-flex items-center gap-1 cursor-pointer"
                        >
                          <Pencil className="w-3 h-3" />
                          <span>Edit</span>
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            onAdminAction({ tab: 'faq', mode: 'delete', itemId: faq.id })
                          }
                          className="px-3 py-1 rounded-full bg-rose-50 text-rose-700 text-xs font-bold inline-flex items-center gap-1 cursor-pointer"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>Hapus</span>
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
