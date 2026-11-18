import React, { useEffect, useMemo, useState } from 'react';
import {
  CheckCircle2,
  Database,
  ExternalLink,
  FileText,
  Lock,
  MessageCircle,
  Pencil,
} from 'lucide-react';
import { doc, getDoc, serverTimestamp, setDoc, writeBatch } from 'firebase/firestore';
import { db, PPDB_VALIDATION } from '../lib/firebase';
import {
  buildWhatsappLink,
  type ProgramCode,
  type SchoolInfo,
  type SchoolProgram,
} from '../data/schoolData';
import type { AdminOpenIntent } from './AdminPortalModal';
import type { QuotaMap } from './ProgramsAndTimeline';

interface PpdbSectionProps {
  schoolInfo: SchoolInfo;
  programs: SchoolProgram[];
  quotas: QuotaMap;
  selectedProgram: ProgramCode;
  onChangeProgram: (code: ProgramCode) => void;
  wantsTrialSignal: number;
  onOpenAdmin: () => void;
  onAdminAction?: (intent: AdminOpenIntent) => void;
  isAdminUser?: boolean;
}

function generateRegistrationCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let suffix = '';
  for (let i = 0; i < 5; i += 1) {
    suffix += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `PPDB-2026-${suffix}`;
}

function generateDocId(): string {
  const rand = Math.random().toString(36).slice(2, 8).replace(/[^a-z0-9]/g, 'x');
  return `reg_${Date.now()}_${rand}`;
}

export const PpdbSection: React.FC<PpdbSectionProps> = ({
  schoolInfo,
  programs,
  quotas,
  selectedProgram,
  onChangeProgram,
  wantsTrialSignal,
  onOpenAdmin,
  onAdminAction,
  isAdminUser = false,
}) => {
  const getProgramLabel = (code: ProgramCode): string => {
    return programs.find((p) => p.code === code)?.name ?? code;
  };
  // Countdown state
  const [countdown, setCountdown] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const targetDate = new Date(schoolInfo.ppdbDeadlineIso).getTime();
    const fallbackTarget = Date.now() + 21 * 24 * 60 * 60 * 1000;
    const effectiveTarget = targetDate > Date.now() ? targetDate : fallbackTarget;

    const updateTimer = () => {
      const diff = Math.max(0, effectiveTarget - Date.now());
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((diff / (1000 * 60)) % 60);
      const seconds = Math.floor((diff / 1000) % 60);
      setCountdown({ days, hours, minutes, seconds });
    };

    updateTimer();
    const interval = window.setInterval(updateTimer, 1000);
    return () => window.clearInterval(interval);
  }, [schoolInfo.ppdbDeadlineIso]);

  // Form states
  const [childName, setChildName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [gender, setGender] = useState<'Laki-laki' | 'Perempuan'>('Laki-laki');
  const [fatherName, setFatherName] = useState('');
  const [motherName, setMotherName] = useState('');
  const [parentWhatsapp, setParentWhatsapp] = useState('');
  const [address, setAddress] = useState('');
  const [previousSchool, setPreviousSchool] = useState('');
  const [notes, setNotes] = useState('');
  const [wantsTrial, setWantsTrial] = useState(true);

  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [submittedRecord, setSubmittedRecord] = useState<{
    registrationCode: string;
    childName: string;
    programName: string;
    parentWhatsapp: string;
    wantsTrial: boolean;
  } | null>(null);

  useEffect(() => {
    if (wantsTrialSignal > 0) {
      setWantsTrial(true);
    }
  }, [wantsTrialSignal]);

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const trimmedChild = childName.trim();
    const trimmedFather = fatherName.trim();
    const trimmedMother = motherName.trim();
    const trimmedWa = parentWhatsapp.trim();
    const trimmedAddress = address.trim();
    const trimmedPrevSchool = previousSchool.trim();
    const trimmedNotes = notes.trim();

    if (
      trimmedChild.length < PPDB_VALIDATION.childNameMin ||
      trimmedChild.length > PPDB_VALIDATION.childNameMax
    ) {
      setFormError('Nama lengkap anak harus antara 2 sampai 100 karakter.');
      return;
    }
    if (!PPDB_VALIDATION.birthDatePattern.test(birthDate)) {
      setFormError('Mohon pilih tanggal lahir anak yang valid.');
      return;
    }
    if (
      trimmedFather.length < PPDB_VALIDATION.parentNameMin ||
      trimmedFather.length > PPDB_VALIDATION.parentNameMax
    ) {
      setFormError('Nama Ayah harus antara 2 sampai 100 karakter.');
      return;
    }
    if (
      trimmedMother.length < PPDB_VALIDATION.parentNameMin ||
      trimmedMother.length > PPDB_VALIDATION.parentNameMax
    ) {
      setFormError('Nama Ibu harus antara 2 sampai 100 karakter.');
      return;
    }
    if (!PPDB_VALIDATION.whatsappPattern.test(trimmedWa)) {
      setFormError('Nomor HP / WhatsApp tidak valid (gunakan 9-18 digit angka).');
      return;
    }
    if (
      trimmedAddress.length < PPDB_VALIDATION.addressMin ||
      trimmedAddress.length > PPDB_VALIDATION.addressMax
    ) {
      setFormError('Alamat lengkap minimal 5 karakter (maksimal 300 karakter).');
      return;
    }
    if (trimmedPrevSchool.length > PPDB_VALIDATION.previousSchoolMax) {
      setFormError('Asal sekolah sebelumnya maksimal 120 karakter.');
      return;
    }
    if (trimmedNotes.length > PPDB_VALIDATION.notesMax) {
      setFormError('Catatan tambahan maksimal 400 karakter.');
      return;
    }

    setSubmitting(true);
    const registrationId = generateDocId();
    const registrationCode = generateRegistrationCode();

    const payload: Record<string, unknown> = {
      registrationCode,
      childName: trimmedChild,
      birthDate,
      gender,
      programCode: selectedProgram,
      fatherName: trimmedFather,
      motherName: trimmedMother,
      parentWhatsapp: trimmedWa,
      address: trimmedAddress,
      wantsTrial,
      status: 'menunggu',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    if (trimmedPrevSchool.length > 0) {
      payload.previousSchool = trimmedPrevSchool;
    }
    if (trimmedNotes.length > 0) {
      payload.notes = trimmedNotes;
    }

    try {
      const quotaRef = doc(db, 'ppdb_stats', selectedProgram);
      const quotaSnap = await getDoc(quotaRef);

      if (quotaSnap.exists()) {
        const qData = quotaSnap.data();
        const currentEnrolled = Number(qData.enrolledCount || 0);
        const cap = Number(qData.capacity || 20);

        if (currentEnrolled < cap) {
          const batch = writeBatch(db);
          batch.set(doc(db, 'ppdb_registrations', registrationId), payload);
          batch.update(quotaRef, {
            enrolledCount: currentEnrolled + 1,
            lastRegistrationId: registrationId,
            updatedAt: serverTimestamp(),
          });
          await batch.commit();
        } else {
          await setDoc(doc(db, 'ppdb_registrations', registrationId), payload);
        }
      } else {
        await setDoc(doc(db, 'ppdb_registrations', registrationId), payload);
      }

      setSubmittedRecord({
        registrationCode,
        childName: trimmedChild,
        programName: getProgramLabel(selectedProgram),
        parentWhatsapp: trimmedWa,
        wantsTrial,
      });

      // Reset inputs
      setChildName('');
      setBirthDate('');
      setFatherName('');
      setMotherName('');
      setParentWhatsapp('');
      setAddress('');
      setPreviousSchool('');
      setNotes('');
    } catch (err) {
      console.error('PPDB Submit Error:', err);
      setFormError(
        'Maaf Bunda, gagal menyimpan ke database sekolah saat ini. Silakan periksa koneksi atau coba lagi.'
      );
    } finally {
      setSubmitting(false);
    }
  };



  const waConfirmationHref = useMemo(() => {
    if (!submittedRecord) return buildWhatsappLink(undefined, schoolInfo);
    const msg =
      `Assalamu'alaikum / Halo Panitia PPDB ${schoolInfo.name},\n\n` +
      `Saya baru saja mengisi formulir PPDB Online:\n` +
      `• Kode Daftar: ${submittedRecord.registrationCode}\n` +
      `• Nama Anak: ${submittedRecord.childName}\n` +
      `• Kelompok: ${submittedRecord.programName}\n` +
      `• No. WA: ${submittedRecord.parentWhatsapp}\n` +
      `• Trial Gratis 1 Hari: ${submittedRecord.wantsTrial ? 'Ya, berminat ikut Trial' : 'Langsung daftar'}\n\n` +
      `Mohon konfirmasi jadwal kedatangannya ya Bunda Guru. Terima kasih!`;
    return buildWhatsappLink(msg, schoolInfo);
  }, [submittedRecord, schoolInfo]);

  return (
    <>
      {/* Wave into Cream PPDB Section */}
      <div className="bg-white leading-none pointer-events-none" aria-hidden="true">
        <svg viewBox="0 0 1440 64" fill="none" className="w-full h-10 sm:h-14" preserveAspectRatio="none">
          <path
            d="M0 40C320 0 640 64 960 24C1200 -4 1340 24 1440 40V64H0V40Z"
            fill="#fffbeb"
          />
        </svg>
      </div>

      {/* SECTION 9: PPDB ONLINE - TERINTEGRASI DATABASE SEKOLAH */}
      <section id="ppdb" className="bg-tk-pattern py-16 sm:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header + Countdown */}
          <div className="text-center max-w-3xl mx-auto mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#fb923c] text-white font-display font-bold text-xs sm:text-sm shadow-xs mb-4">
              <span>🔥 Kuota Terbatas — Gelombang 1 Tahun Ajaran 2026/2027</span>
            </div>
            <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 text-balance mb-4">
              Yuk, Daftarkan Buah Hati Bunda ke {schoolInfo.name}! 🎉
            </h2>
            <p className="text-slate-700 text-base sm:text-lg mb-8">
              Formulir terhubung langsung dengan database sekolah. Dapatkan{' '}
              <strong>Trial Gratis 1 Hari</strong> sebelum memutuskan mendaftar resmi.
            </p>

            {/* Hitung Mundur PPDB */}
            <div className="bg-white rounded-[24px] p-5 sm:p-6 border-2 border-[#fde047] shadow-sm inline-block w-full max-w-xl">
              <p className="text-xs sm:text-sm font-extrabold text-[#ea580c] mb-3">
                Pendaftaran Gelombang Awal Ditutup Dalam:
              </p>
              <div className="grid grid-cols-4 gap-2.5 sm:gap-4">
                {[
                  { val: countdown.days, label: 'Hari' },
                  { val: countdown.hours, label: 'Jam' },
                  { val: countdown.minutes, label: 'Menit' },
                  { val: countdown.seconds, label: 'Detik' },
                ].map((unit) => (
                  <div
                    key={unit.label}
                    className="bg-[#fffbeb] rounded-2xl py-3 px-2 border border-amber-200"
                  >
                    <div className="font-display text-2xl sm:text-3xl font-bold text-slate-900 tabular-nums">
                      {String(unit.val).padStart(2, '0')}
                    </div>
                    <div className="text-xs font-bold text-slate-600">{unit.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Info Column: Alur, Kuota Real-Time, Syarat */}
            <div className="lg:col-span-5 space-y-6">
              {/* Kuota Sisa Kursi */}
              <div className="bg-white rounded-[24px] p-6 border-2 border-[#7dd3fc] shadow-xs">
                <div className="flex items-center justify-between gap-2 mb-4">
                  <h3 className="font-display text-xl font-bold text-slate-900">
                    Sisa Kuota Kelas Saat Ini
                  </h3>
                  <div className="flex items-center gap-2">
                    {isAdminUser && onAdminAction && (
                      <button
                        type="button"
                        onClick={() => onAdminAction({ tab: 'kuota', mode: 'list' })}
                        className="px-3 py-1 rounded-full bg-[#e0f2fe] hover:bg-[#bae6fd] text-slate-900 text-xs font-bold inline-flex items-center gap-1 cursor-pointer"
                      >
                        <Pencil className="w-3 h-3" />
                        <span>Edit Kuota</span>
                      </button>
                    )}
                    <Database className="w-5 h-5 text-[#0284c7]" aria-hidden="true" />
                  </div>
                </div>
                <div className="space-y-3">
                  {programs.map((prog) => {
                    const q = quotas[prog.code] ?? {
                      capacity: prog.maxPerClass,
                      enrolledCount: prog.defaultEnrolled,
                    };
                    const rem = Math.max(0, q.capacity - q.enrolledCount);
                    const pct = Math.min(100, Math.round((q.enrolledCount / Math.max(1, q.capacity)) * 100));
                    return (
                      <div key={prog.code} className="bg-[#fffbeb] rounded-2xl p-3.5 border border-amber-100">
                        <div className="flex items-center justify-between text-sm font-bold mb-1.5">
                          <span className="text-slate-900">
                            {prog.emoji} {prog.name}
                          </span>
                          <span className="text-[#ea580c] tabular-nums">
                            {rem > 0 ? `Sisa ${rem} kursi!` : 'Waiting List'}
                          </span>
                        </div>
                        <div className="w-full h-2.5 rounded-full bg-amber-100 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-[#fb923c] transition-all duration-300"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Alur 4 Langkah */}
              <div className="bg-white rounded-[24px] p-6 border-2 border-amber-100 shadow-xs">
                <h3 className="font-display text-xl font-bold text-slate-900 mb-4">
                  Alur Pendaftaran (4 Langkah Mudah)
                </h3>
                <ol className="space-y-3.5">
                  {[
                    {
                      step: '01',
                      title: 'Isi Formulir Online',
                      desc: 'Lengkapi data ananda & orang tua di formulir sebelah ini (2 menit).',
                    },
                    {
                      step: '02',
                      title: 'Konfirmasi WhatsApp',
                      desc: 'Klik tombol WhatsApp setelah kirim untuk memilih hari kedatangan.',
                    },
                    {
                      step: '03',
                      title: 'Trial 1 Hari Gratis',
                      desc: 'Ananda mencoba bermain & belajar di kelas bersama teman sebaya.',
                    },
                    {
                      step: '04',
                      title: 'Resmi Jadi Siswa',
                      desc: 'Lengkapi berkas administrasi & seragam saat anak sudah nyaman.',
                    },
                  ].map((item) => (
                    <li key={item.step} className="flex items-start gap-3">
                      <span className="w-8 h-8 rounded-full bg-[#facc15] text-slate-900 font-display font-bold text-xs flex items-center justify-center shrink-0 mt-0.5 tabular-nums">
                        {item.step}
                      </span>
                      <div>
                        <p className="font-bold text-sm text-slate-900">{item.title}</p>
                        <p className="text-xs sm:text-sm text-slate-600">{item.desc}</p>
                      </div>
                    </li>
                  ))}
                </ol>
              </div>

              {/* Syarat & Biaya */}
              <div className="bg-white rounded-[24px] p-6 border-2 border-[#86efac] shadow-xs">
                <h3 className="font-display text-xl font-bold text-slate-900 mb-3">
                  Syarat Berkas &amp; Biaya Pendaftaran
                </h3>
                <ul className="space-y-2 text-sm text-slate-700 mb-4">
                  <li className="flex items-start gap-2">
                    <FileText className="w-4 h-4 text-[#16a34a] shrink-0 mt-0.5" aria-hidden="true" />
                    <span>Usia minimal: 2 tahun (KB), 4 tahun (TK A), 5 tahun (TK B).</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <FileText className="w-4 h-4 text-[#16a34a] shrink-0 mt-0.5" aria-hidden="true" />
                    <span>Fotokopi Kartu Keluarga (KK), Akta Lahir, dan KTP Orang Tua.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <FileText className="w-4 h-4 text-[#16a34a] shrink-0 mt-0.5" aria-hidden="true" />
                    <span>Pas foto berwarna ukuran 3x4 (2 lembar) saat daftar ulang.</span>
                  </li>
                </ul>
                <div className="bg-[#dcfce7] rounded-2xl p-3.5 text-sm font-bold text-emerald-950">
                  Biaya Formulir &amp; Trial 1 Hari: GRATIS (Rp 0)
                </div>

                {/* Portal Admin Trigger */}
                <div className="mt-5 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs text-slate-500 font-semibold">
                    Khusus Admin / Guru Sekolah:
                  </span>
                  <div className="flex flex-wrap items-center gap-2">
                    {isAdminUser && onAdminAction && (
                      <button
                        type="button"
                        onClick={() => onAdminAction({ tab: 'identitas', mode: 'edit' })}
                        className="inline-flex items-center gap-1 px-3 py-2 rounded-full bg-[#e0f2fe] hover:bg-[#bae6fd] text-slate-900 text-xs font-bold cursor-pointer"
                      >
                        <Pencil className="w-3 h-3" />
                        <span>Edit Deadline PPDB</span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={onOpenAdmin}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-colors cursor-pointer"
                    >
                      <Lock className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>{isAdminUser ? 'Kelola Data (Edit / Tambah / Hapus)' : 'Login Admin'}</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Form Column */}
            <div className="lg:col-span-7 bg-white rounded-[28px] p-6 sm:p-9 border-2 border-[#fde047] shadow-md">
              {submittedRecord ? (
                <div className="py-6 text-center">
                  <div className="w-16 h-16 rounded-full bg-[#dcfce7] text-[#16a34a] flex items-center justify-center mx-auto mb-5">
                    <CheckCircle2 className="w-10 h-10" aria-hidden="true" />
                  </div>
                  <h3 className="font-display text-2xl sm:text-3xl font-bold text-slate-900 mb-3">
                    Yeay! Formulir Berhasil Dikirim 🎉
                  </h3>
                  <p className="text-slate-700 text-base max-w-lg mx-auto mb-6 leading-relaxed">
                    Data pendaftaran ananda <strong>{submittedRecord.childName}</strong> telah
                    tersimpan aman di database {schoolInfo.name}. Bunda akan segera dihubungi via
                    WhatsApp untuk jadwal Trial Gratis.
                  </p>

                  <div className="bg-[#fffbeb] rounded-2xl p-5 border-2 border-[#fde047] max-w-md mx-auto mb-7 text-left space-y-2 text-sm">
                    <div className="flex justify-between gap-2">
                      <span className="text-slate-600 font-semibold">Kode Registrasi:</span>
                      <span className="font-display font-bold text-[#ea580c] tabular-nums">
                        {submittedRecord.registrationCode}
                      </span>
                    </div>
                    <div className="flex justify-between gap-2">
                      <span className="text-slate-600 font-semibold">Nama Anak:</span>
                      <span className="font-bold text-slate-900">{submittedRecord.childName}</span>
                    </div>
                    <div className="flex justify-between gap-2">
                      <span className="text-slate-600 font-semibold">Kelompok:</span>
                      <span className="font-bold text-slate-900">
                        {submittedRecord.programName}
                      </span>
                    </div>
                    <div className="flex justify-between gap-2">
                      <span className="text-slate-600 font-semibold">No. WhatsApp:</span>
                      <span className="font-bold text-slate-900 tabular-nums">
                        {submittedRecord.parentWhatsapp}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                    <a
                      href={waConfirmationHref}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full sm:w-auto px-7 py-4 rounded-full bg-[#16a34a] hover:bg-[#15803d] text-white font-display font-bold text-base inline-flex items-center justify-center gap-2 shadow-md transition-transform active:scale-95"
                    >
                      <MessageCircle className="w-5 h-5" aria-hidden="true" />
                      <span>Konfirmasi via WhatsApp</span>
                      <ExternalLink className="w-4 h-4" aria-hidden="true" />
                    </a>

                    <button
                      type="button"
                      onClick={() => setSubmittedRecord(null)}
                      className="w-full sm:w-auto px-6 py-4 rounded-full bg-amber-50 hover:bg-amber-100 text-slate-800 font-bold text-sm cursor-pointer"
                    >
                      Daftarkan Anak Lain
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmitForm} noValidate className="space-y-5">
                  <div>
                    <h3 className="font-display text-2xl font-bold text-slate-900">
                      Formulir Pendaftaran Siswa Baru
                    </h3>
                    <p className="text-sm text-slate-600 mt-1">
                      Lengkapi data di bawah ini. Tanda (<span className="text-rose-600">*</span>)
                      wajib diisi.
                    </p>
                  </div>

                  {formError && (
                    <div
                      role="alert"
                      className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-sm font-bold"
                    >
                      {formError}
                    </div>
                  )}

                  {/* Kelompok Pilihan */}
                  <div>
                    <label className="block text-sm font-extrabold text-slate-800 mb-2">
                      Kelompok yang Dituju <span className="text-rose-600">*</span>
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      {programs.map((prog) => {
                        const active = selectedProgram === prog.code;
                        return (
                          <button
                            key={prog.code}
                            type="button"
                            onClick={() => onChangeProgram(prog.code)}
                            className={`p-3 rounded-2xl border-2 text-left transition-all cursor-pointer ${
                              active
                                ? 'bg-[#fef9c3] border-[#fb923c] shadow-xs'
                                : 'bg-[#fffbeb] border-amber-100 hover:border-amber-300'
                            }`}
                          >
                            <div className="font-display font-bold text-sm text-slate-900">
                              {prog.emoji} {prog.name}
                            </div>
                            <div className="text-xs font-semibold text-slate-600">
                              {prog.ageRange}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Nama Anak & Tanggal Lahir */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label
                        htmlFor="ppdb-childName"
                        className="block text-sm font-bold text-slate-800 mb-1.5"
                      >
                        Nama Lengkap Anak <span className="text-rose-600">*</span>
                      </label>
                      <input
                        id="ppdb-childName"
                        type="text"
                        required
                        maxLength={PPDB_VALIDATION.childNameMax}
                        value={childName}
                        onChange={(e) => setChildName(e.target.value)}
                        placeholder="Contoh: Muhammad Kenzie Pratama"
                        className="w-full px-4 py-3 rounded-2xl bg-[#fffbeb] border-2 border-amber-200 text-sm text-slate-900 focus:border-[#fb923c] focus:bg-white focus:outline-none"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="ppdb-birthDate"
                        className="block text-sm font-bold text-slate-800 mb-1.5"
                      >
                        Tanggal Lahir Anak <span className="text-rose-600">*</span>
                      </label>
                      <input
                        id="ppdb-birthDate"
                        type="date"
                        required
                        value={birthDate}
                        onChange={(e) => setBirthDate(e.target.value)}
                        className="w-full px-4 py-3 rounded-2xl bg-[#fffbeb] border-2 border-amber-200 text-sm text-slate-900 focus:border-[#fb923c] focus:bg-white focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Jenis Kelamin & No WA */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-bold text-slate-800 mb-1.5">
                        Jenis Kelamin <span className="text-rose-600">*</span>
                      </label>
                      <div className="grid grid-cols-2 gap-2.5">
                        {(['Laki-laki', 'Perempuan'] as const).map((g) => (
                          <button
                            key={g}
                            type="button"
                            onClick={() => setGender(g)}
                            className={`py-3 px-3 rounded-2xl border-2 text-sm font-bold transition-colors cursor-pointer ${
                              gender === g
                                ? 'bg-[#e0f2fe] border-[#0284c7] text-slate-900'
                                : 'bg-[#fffbeb] border-amber-200 text-slate-700'
                            }`}
                          >
                            {g}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label
                        htmlFor="ppdb-whatsapp"
                        className="block text-sm font-bold text-slate-800 mb-1.5"
                      >
                        No. HP / WhatsApp Ortu <span className="text-rose-600">*</span>
                      </label>
                      <input
                        id="ppdb-whatsapp"
                        type="tel"
                        required
                        maxLength={18}
                        value={parentWhatsapp}
                        onChange={(e) => setParentWhatsapp(e.target.value)}
                        placeholder="Contoh: 081234567890"
                        className="w-full px-4 py-3 rounded-2xl bg-[#fffbeb] border-2 border-amber-200 text-sm text-slate-900 focus:border-[#fb923c] focus:bg-white focus:outline-none tabular-nums"
                      />
                    </div>
                  </div>

                  {/* Nama Ayah & Ibu */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label
                        htmlFor="ppdb-fatherName"
                        className="block text-sm font-bold text-slate-800 mb-1.5"
                      >
                        Nama Ayah <span className="text-rose-600">*</span>
                      </label>
                      <input
                        id="ppdb-fatherName"
                        type="text"
                        required
                        maxLength={PPDB_VALIDATION.parentNameMax}
                        value={fatherName}
                        onChange={(e) => setFatherName(e.target.value)}
                        placeholder="Nama lengkap Ayah"
                        className="w-full px-4 py-3 rounded-2xl bg-[#fffbeb] border-2 border-amber-200 text-sm text-slate-900 focus:border-[#fb923c] focus:bg-white focus:outline-none"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="ppdb-motherName"
                        className="block text-sm font-bold text-slate-800 mb-1.5"
                      >
                        Nama Ibu <span className="text-rose-600">*</span>
                      </label>
                      <input
                        id="ppdb-motherName"
                        type="text"
                        required
                        maxLength={PPDB_VALIDATION.parentNameMax}
                        value={motherName}
                        onChange={(e) => setMotherName(e.target.value)}
                        placeholder="Nama lengkap Ibu"
                        className="w-full px-4 py-3 rounded-2xl bg-[#fffbeb] border-2 border-amber-200 text-sm text-slate-900 focus:border-[#fb923c] focus:bg-white focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Alamat */}
                  <div>
                    <label
                      htmlFor="ppdb-address"
                      className="block text-sm font-bold text-slate-800 mb-1.5"
                    >
                      Alamat Lengkap Tempat Tinggal <span className="text-rose-600">*</span>
                    </label>
                    <textarea
                      id="ppdb-address"
                      rows={2}
                      required
                      maxLength={PPDB_VALIDATION.addressMax}
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="Nama jalan, nomor rumah, RT/RW, Desa/Kelurahan, Kecamatan"
                      className="w-full px-4 py-3 rounded-2xl bg-[#fffbeb] border-2 border-amber-200 text-sm text-slate-900 focus:border-[#fb923c] focus:bg-white focus:outline-none"
                    />
                  </div>

                  {/* Asal Sekolah & Catatan */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label
                        htmlFor="ppdb-prevSchool"
                        className="block text-sm font-bold text-slate-800 mb-1.5"
                      >
                        Asal Sekolah Sebelumnya (Opsional)
                      </label>
                      <input
                        id="ppdb-prevSchool"
                        type="text"
                        maxLength={PPDB_VALIDATION.previousSchoolMax}
                        value={previousSchool}
                        onChange={(e) => setPreviousSchool(e.target.value)}
                        placeholder="Kosongkan jika belum pernah sekolah"
                        className="w-full px-4 py-3 rounded-2xl bg-[#fffbeb] border-2 border-amber-200 text-sm text-slate-900 focus:border-[#fb923c] focus:bg-white focus:outline-none"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="ppdb-notes"
                        className="block text-sm font-bold text-slate-800 mb-1.5"
                      >
                        Pertanyaan / Alergi Anak (Opsional)
                      </label>
                      <input
                        id="ppdb-notes"
                        type="text"
                        maxLength={PPDB_VALIDATION.notesMax}
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Contoh: Alergi kacang / tanya antar jemput"
                        className="w-full px-4 py-3 rounded-2xl bg-[#fffbeb] border-2 border-amber-200 text-sm text-slate-900 focus:border-[#fb923c] focus:bg-white focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Trial Gratis Checkbox */}
                  <label className="flex items-center gap-3 p-4 rounded-2xl bg-[#fef9c3] border-2 border-[#fde047] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={wantsTrial}
                      onChange={(e) => setWantsTrial(e.target.checked)}
                      className="w-5 h-5 accent-[#ea580c] rounded cursor-pointer"
                    />
                    <span className="text-sm font-bold text-slate-900">
                      🎁 Ya, saya ingin menjadwalkan <strong>Trial Gratis 1 Hari</strong> bersama
                      ananda terlebih dahulu!
                    </span>
                  </label>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-4 px-6 rounded-full bg-[#facc15] hover:bg-[#eab308] disabled:opacity-60 text-slate-900 font-display font-bold text-lg shadow-md border-2 border-amber-400 transition-all hover:scale-[1.01] active:scale-95 cursor-pointer"
                  >
                    {submitting
                      ? 'Menyimpan Pendaftaran ke Database...'
                      : '🎉 Kirim Formulir Pendaftaran Sekarang'}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>
    </>
  );
};
