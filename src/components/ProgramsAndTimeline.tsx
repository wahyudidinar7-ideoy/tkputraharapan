import React, { useState } from 'react';
import { Calendar, CheckCircle2, Clock, Pencil, Plus, Trash2, Users, X } from 'lucide-react';
import type {
  AdvantageItem,
  ProgramCode,
  SchoolInfo,
  SchoolProgram,
  TimelineStep,
} from '../data/schoolData';
import type { AdminOpenIntent } from './AdminPortalModal';

export type QuotaMap = Record<string, { capacity: number; enrolledCount: number }>;

interface ProgramsAndTimelineProps {
  schoolInfo: SchoolInfo;
  advantages: AdvantageItem[];
  programs: SchoolProgram[];
  timelineSteps: TimelineStep[];
  quotas: QuotaMap;
  onSelectProgramForPpdb: (code: ProgramCode) => void;
  isAdminUser?: boolean;
  onAdminAction?: (intent: AdminOpenIntent) => void;
}

export const ProgramsAndTimeline: React.FC<ProgramsAndTimelineProps> = ({
  schoolInfo,
  advantages,
  programs,
  timelineSteps,
  quotas,
  onSelectProgramForPpdb,
  isAdminUser = false,
  onAdminAction,
}) => {
  const [scheduleModalProgram, setScheduleModalProgram] = useState<SchoolProgram | null>(null);

  return (
    <>
      {/* SECTION 3: KENAPA PILIH TK KAMI? */}
      <section id="tentang" className="bg-white py-16 sm:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <p className="text-sm font-extrabold text-[#ea580c] tracking-wide mb-2">
              Keunggulan Sekolah Kami
            </p>
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-slate-900 text-balance mb-3">
              Kenapa Ayah &amp; Bunda Memilih {schoolInfo.name}? ✨
            </h2>
            <p className="text-slate-600 text-base sm:text-lg">
              Masa emas usia dini hanya datang sekali. Kami hadirkan lingkungan belajar yang hangat,
              aman, dan penuh tawa.
            </p>
            {isAdminUser && onAdminAction && (
              <div className="mt-4">
                <button
                  type="button"
                  onClick={() => onAdminAction({ tab: 'keunggulan', mode: 'add' })}
                  className="px-4 py-2 rounded-full bg-[#facc15] hover:bg-[#eab308] text-slate-900 font-bold text-xs inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Plus className="w-4 h-4" />
                  <span>Tambah Keunggulan</span>
                </button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {advantages.map((item) => (
              <article
                key={item.id}
                className="rounded-[24px] bg-[#fffbeb] p-7 border-2 border-amber-100 shadow-xs transition-transform duration-200 hover:-translate-y-1.5 flex flex-col justify-between"
              >
                <div>
                  <div
                    className={`w-14 h-14 rounded-2xl ${item.bgClass} border ${item.borderClass} flex items-center justify-center text-3xl mb-5`}
                    aria-hidden="true"
                  >
                    {item.emoji}
                  </div>
                  <h3 className="font-display text-xl font-bold text-slate-900 mb-2.5">
                    {item.title}
                  </h3>
                  <p className="text-slate-700 text-[15px] leading-relaxed">{item.description}</p>
                </div>

                {isAdminUser && onAdminAction && (
                  <div className="mt-5 pt-3 border-t border-amber-100 flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        onAdminAction({ tab: 'keunggulan', mode: 'edit', itemId: item.id })
                      }
                      className="px-3 py-1 rounded-full bg-[#e0f2fe] hover:bg-[#bae6fd] text-slate-900 text-xs font-bold inline-flex items-center gap-1 cursor-pointer"
                    >
                      <Pencil className="w-3 h-3" />
                      <span>Edit</span>
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        onAdminAction({ tab: 'keunggulan', mode: 'delete', itemId: item.id })
                      }
                      className="px-3 py-1 rounded-full bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold inline-flex items-center gap-1 cursor-pointer"
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

      {/* Wave into Cream Programs Section */}
      <div className="bg-white leading-none pointer-events-none" aria-hidden="true">
        <svg viewBox="0 0 1440 64" fill="none" className="w-full h-10 sm:h-14" preserveAspectRatio="none">
          <path
            d="M0 20C320 64 640 0 960 32C1180 54 1340 42 1440 16V64H0V20Z"
            fill="#fffbeb"
          />
        </svg>
      </div>

      {/* SECTION 4: PROGRAM & KELAS */}
      <section id="program" className="bg-tk-pattern py-16 sm:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <p className="text-sm font-extrabold text-[#0284c7] tracking-wide mb-2">
              Jenjang &amp; Kurikulum Merdeka PAUD
            </p>
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-slate-900 text-balance mb-3">
              Program &amp; Kelas Sesuai Usia Ananda 🎒
            </h2>
            <p className="text-slate-700 text-base sm:text-lg">
              Kuota kelas dibatasi agar setiap anak mendapat perhatian penuh. Sisa kursi diperbarui
              langsung dari database sekolah.
            </p>
            {isAdminUser && onAdminAction && (
              <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => onAdminAction({ tab: 'program', mode: 'add' })}
                  className="px-4 py-2 rounded-full bg-[#facc15] hover:bg-[#eab308] text-slate-900 font-bold text-xs inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Plus className="w-4 h-4" />
                  <span>Tambah Program Kelas</span>
                </button>
                <button
                  type="button"
                  onClick={() => onAdminAction({ tab: 'kuota', mode: 'list' })}
                  className="px-4 py-2 rounded-full bg-[#e0f2fe] hover:bg-[#bae6fd] text-slate-900 font-bold text-xs inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Pencil className="w-3.5 h-3.5" />
                  <span>Edit Kuota Kursi</span>
                </button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-7">
            {programs.map((program) => {
              const quota = quotas[program.code] ?? {
                capacity: program.maxPerClass,
                enrolledCount: program.defaultEnrolled,
              };
              const remainingSeats = Math.max(0, quota.capacity - quota.enrolledCount);
              return (
                <article
                  key={program.code}
                  className="bg-white rounded-[24px] border-2 border-amber-100 shadow-sm p-7 flex flex-col justify-between transition-transform duration-200 hover:-translate-y-1.5"
                >
                  <div>
                    <div className="flex items-center justify-between gap-3 mb-5">
                      <span
                        className={`w-14 h-14 rounded-2xl ${program.accentBg} border-2 ${program.accentBorder} flex items-center justify-center text-3xl`}
                        aria-hidden="true"
                      >
                        {program.emoji}
                      </span>
                      <span className="text-xs font-extrabold text-slate-700 tabular-nums">
                        {remainingSeats > 0
                          ? `Sisa ${remainingSeats} dari ${quota.capacity} kursi`
                          : 'Kuota Penuh (Daftar Tunggu)'}
                      </span>
                    </div>

                    <h3 className="font-display text-2xl font-bold text-slate-900 mb-1">
                      {program.name}
                    </h3>
                    <p className="text-sm font-extrabold text-[#ea580c] mb-3">{program.ageRange}</p>
                    <p className="text-slate-700 text-[15px] leading-relaxed mb-5">
                      {program.summary}
                    </p>

                    <div className="space-y-2.5 text-sm text-slate-700 bg-[#fffbeb] rounded-2xl p-4 mb-5 border border-amber-100">
                      <div className="flex items-center gap-2.5">
                        <Clock className="w-4 h-4 text-[#ea580c] shrink-0" aria-hidden="true" />
                        <span className="font-semibold">{program.scheduleHours}</span>
                      </div>
                      <div className="flex items-center gap-2.5">
                        <Users className="w-4 h-4 text-[#0284c7] shrink-0" aria-hidden="true" />
                        <span className="font-semibold tabular-nums">
                          Maksimal {quota.capacity} Anak / Kelas
                        </span>
                      </div>
                      <div className="flex items-center gap-2.5">
                        <Calendar className="w-4 h-4 text-[#16a34a] shrink-0" aria-hidden="true" />
                        <span className="font-bold text-slate-900 tabular-nums">
                          SPP {program.feeSummary}
                        </span>
                      </div>
                    </div>

                    <ul className="space-y-2 mb-7">
                      {program.highlights.map((hl, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-sm text-slate-700">
                          <CheckCircle2
                            className="w-4 h-4 text-[#16a34a] shrink-0 mt-0.5"
                            aria-hidden="true"
                          />
                          <span>{hl}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
                      <button
                        type="button"
                        onClick={() => setScheduleModalProgram(program)}
                        className="flex-1 px-4 py-3 rounded-full bg-white hover:bg-slate-50 text-slate-800 font-bold text-sm border-2 border-slate-200 transition-colors cursor-pointer whitespace-nowrap"
                      >
                        Lihat Jadwal Kelas
                      </button>
                      <button
                        type="button"
                        onClick={() => onSelectProgramForPpdb(program.code)}
                        className={`flex-1 px-4 py-3 rounded-full font-display font-bold text-sm transition-transform active:scale-95 cursor-pointer whitespace-nowrap ${program.buttonBg}`}
                      >
                        Pilih Kelas Ini
                      </button>
                    </div>

                    {isAdminUser && onAdminAction && (
                      <div className="mt-4 pt-3 border-t border-amber-100 flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            onAdminAction({ tab: 'program', mode: 'edit', itemId: program.code })
                          }
                          className="px-3 py-1 rounded-full bg-[#e0f2fe] hover:bg-[#bae6fd] text-slate-900 text-xs font-bold inline-flex items-center gap-1 cursor-pointer"
                        >
                          <Pencil className="w-3 h-3" />
                          <span>Edit Program</span>
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            onAdminAction({ tab: 'program', mode: 'delete', itemId: program.code })
                          }
                          className="px-3 py-1 rounded-full bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold inline-flex items-center gap-1 cursor-pointer"
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
        </div>
      </section>

      {/* SECTION 5: SEHARI DI TK KAMI (TIMELINE LUCU) */}
      <section className="bg-white py-16 sm:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <p className="text-sm font-extrabold text-[#16a34a] tracking-wide mb-2">
              Rutinitas Penuh Kegembiraan
            </p>
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-slate-900 text-balance mb-3">
              Sehari di {schoolInfo.name} ⏰
            </h2>
            <p className="text-slate-600 text-base sm:text-lg">
              Jadwal teratur namun fleksibel sesuai suasana hati anak, menjaga keseimbangan antara
              bermain, belajar, makan sehat, dan istirahat.
            </p>
            {isAdminUser && onAdminAction && (
              <div className="mt-4">
                <button
                  type="button"
                  onClick={() => onAdminAction({ tab: 'timeline', mode: 'add' })}
                  className="px-4 py-2 rounded-full bg-[#facc15] hover:bg-[#eab308] text-slate-900 font-bold text-xs inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Plus className="w-4 h-4" />
                  <span>Tambah Jadwal Harian</span>
                </button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {timelineSteps.map((step, index) => {
              const stepId = step.id || `step_${index}`;
              return (
                <div
                  key={stepId}
                  className="relative bg-[#fffbeb] rounded-[24px] p-6 border-2 border-amber-100 shadow-xs transition-transform duration-200 hover:-translate-y-1 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-4">
                      <span
                        className={`px-3.5 py-1.5 rounded-full font-display font-bold text-sm tabular-nums ${step.color}`}
                      >
                        {step.time} WIB
                      </span>
                      <span className="text-2xl" aria-hidden="true">
                        {step.emoji}
                      </span>
                    </div>
                    <h3 className="font-display text-lg font-bold text-slate-900 mb-1.5">
                      {String(index + 1).padStart(2, '0')}. {step.title}
                    </h3>
                    <p className="text-sm text-slate-700 leading-relaxed">{step.description}</p>
                  </div>

                  {isAdminUser && onAdminAction && (
                    <div className="mt-4 pt-3 border-t border-amber-100 flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          onAdminAction({ tab: 'timeline', mode: 'edit', itemId: stepId })
                        }
                        className="px-3 py-1 rounded-full bg-[#e0f2fe] hover:bg-[#bae6fd] text-slate-900 text-xs font-bold inline-flex items-center gap-1 cursor-pointer"
                      >
                        <Pencil className="w-3 h-3" />
                        <span>Edit</span>
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          onAdminAction({ tab: 'timeline', mode: 'delete', itemId: stepId })
                        }
                        className="px-3 py-1 rounded-full bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold inline-flex items-center gap-1 cursor-pointer"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>Hapus</span>
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Interactive Schedule Modal */}
      {scheduleModalProgram && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="schedule-modal-title"
          onClick={() => setScheduleModalProgram(null)}
        >
          <div
            className="bg-white rounded-[28px] max-w-lg w-full p-6 sm:p-8 shadow-xl border-2 border-[#fde047] max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4 mb-5">
              <div className="flex items-center gap-3">
                <span className="text-3xl" aria-hidden="true">
                  {scheduleModalProgram.emoji}
                </span>
                <div>
                  <h3
                    id="schedule-modal-title"
                    className="font-display text-2xl font-bold text-slate-900"
                  >
                    Jadwal {scheduleModalProgram.name}
                  </h3>
                  <p className="text-sm font-bold text-[#ea580c]">
                    {scheduleModalProgram.ageRange} · {scheduleModalProgram.scheduleHours}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setScheduleModalProgram(null)}
                aria-label="Tutup jadwal kelas"
                className="w-10 h-10 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-700 cursor-pointer shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 mb-6">
              {scheduleModalProgram.weeklySchedule.map((row) => (
                <div
                  key={row.day}
                  className="bg-[#fffbeb] rounded-2xl p-3.5 border border-amber-100 flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4"
                >
                  <span className="font-display font-bold text-sm text-[#ea580c] sm:w-20 shrink-0">
                    {row.day}
                  </span>
                  <span className="text-sm text-slate-800 font-medium">{row.activity}</span>
                </div>
              ))}
            </div>

            <div className="bg-[#e0f2fe] rounded-2xl p-4 mb-6 text-sm text-slate-800 space-y-1">
              <p className="font-bold">Rincian Biaya:</p>
              <p>{scheduleModalProgram.registrationFee}</p>
              <p>{scheduleModalProgram.monthlyFee}</p>
            </div>

            <div className="flex flex-wrap gap-3 justify-end">
              <button
                type="button"
                onClick={() => setScheduleModalProgram(null)}
                className="px-5 py-2.5 rounded-full border border-slate-300 text-slate-700 font-bold text-sm hover:bg-slate-50 cursor-pointer"
              >
                Tutup
              </button>
              <button
                type="button"
                onClick={() => {
                  const code = scheduleModalProgram.code;
                  setScheduleModalProgram(null);
                  onSelectProgramForPpdb(code);
                }}
                className="px-6 py-2.5 rounded-full bg-[#facc15] hover:bg-[#eab308] text-slate-900 font-display font-bold text-sm cursor-pointer"
              >
                Daftar Kelas Ini 🎉
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
