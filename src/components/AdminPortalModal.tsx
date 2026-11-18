import React, { useEffect, useMemo, useState } from 'react';
import {
  ClipboardCheck,
  Download,
  LogOut,
  MessageCircle,
  Pencil,
  Plus,
  Search,
  Trash2,
  UserCheck,
  X,
} from 'lucide-react';
import { signInWithPopup, signOut, type User } from 'firebase/auth';
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
  writeBatch,
} from 'firebase/firestore';
import {
  auth,
  db,
  googleProvider,
  handleFirestoreError,
  OperationType,
  PPDB_VALIDATION,
} from '../lib/firebase';
import {
  DAILY_TIMELINE,
  FAQS,
  GALLERY_ITEMS,
  HERO_IMAGES,
  LOCAL_SCHOOL_PHOTOS,
  PROGRAMS,
  TEACHERS,
  TESTIMONIALS,
  WHY_CHOOSE_US,
  type AdvantageItem,
  type FaqItem,
  type GalleryItem,
  type ProgramCode,
  type SchoolInfo,
  type SchoolProgram,
  type TeacherProfile,
  type TestimonialItem,
  type TimelineStep,
} from '../data/schoolData';
import type { QuotaMap } from './ProgramsAndTimeline';

export type RegistrationStatus = 'menunggu' | 'jadwal_trial' | 'diterima' | 'batal';

export interface PpdbRegistrationRecord {
  id: string;
  registrationCode: string;
  childName: string;
  birthDate: string;
  gender: 'Laki-laki' | 'Perempuan';
  programCode: ProgramCode;
  fatherName: string;
  motherName: string;
  parentWhatsapp: string;
  address: string;
  previousSchool?: string;
  notes?: string;
  wantsTrial: boolean;
  status: RegistrationStatus;
  trialDate?: string;
  adminNotes?: string;
  createdAt?: Timestamp | null;
}

export type AdminTab =
  | 'identitas'
  | 'keunggulan'
  | 'program'
  | 'timeline'
  | 'kuota'
  | 'guru'
  | 'galeri'
  | 'testimoni'
  | 'faq'
  | 'pendaftar';

export interface AdminOpenIntent {
  tab: AdminTab;
  mode?: 'list' | 'add' | 'edit' | 'delete';
  itemId?: string;
}

interface AdminPortalModalProps {
  isOpen: boolean;
  onClose: () => void;
  authReady: boolean;
  currentUser: User | null;
  isAdminUser: boolean;
  schoolInfo: SchoolInfo;
  advantages: AdvantageItem[];
  programs: SchoolProgram[];
  timelineSteps: TimelineStep[];
  quotas: QuotaMap;
  teachers: TeacherProfile[];
  galleryItems: GalleryItem[];
  testimonials: TestimonialItem[];
  faqs: FaqItem[];
  intent: AdminOpenIntent | null;
}

const ADVANTAGE_THEMES = [
  { label: 'Kuning Ceria', bgClass: 'bg-[#fef9c3]', borderClass: 'border-[#fde047]' },
  { label: 'Hijau Segar', bgClass: 'bg-[#dcfce7]', borderClass: 'border-[#86efac]' },
  { label: 'Pink Lembut', bgClass: 'bg-[#fce7f3]', borderClass: 'border-[#f9a8d4]' },
  { label: 'Biru Langit', bgClass: 'bg-[#e0f2fe]', borderClass: 'border-[#7dd3fc]' },
  { label: 'Oranye Hangat', bgClass: 'bg-[#ffedd5]', borderClass: 'border-[#fdba74]' },
  { label: 'Ungu Pastel', bgClass: 'bg-[#ede9fe]', borderClass: 'border-[#c4b5fd]' },
];

const PROGRAM_THEMES = [
  {
    label: 'Kuning Cerah',
    accentBg: 'bg-[#fef9c3]',
    accentBorder: 'border-[#facc15]',
    buttonBg: 'bg-[#facc15] hover:bg-[#eab308] text-slate-900',
  },
  {
    label: 'Biru Langit',
    accentBg: 'bg-[#e0f2fe]',
    accentBorder: 'border-[#7dd3fc]',
    buttonBg: 'bg-[#7dd3fc] hover:bg-[#38bdf8] text-slate-900',
  },
  {
    label: 'Pink Ceria',
    accentBg: 'bg-[#fce7f3]',
    accentBorder: 'border-[#f9a8d4]',
    buttonBg: 'bg-[#f9a8d4] hover:bg-[#f472b6] text-slate-900',
  },
  {
    label: 'Hijau Mint',
    accentBg: 'bg-[#dcfce7]',
    accentBorder: 'border-[#86efac]',
    buttonBg: 'bg-[#86efac] hover:bg-[#4ade80] text-slate-900',
  },
  {
    label: 'Ungu Pastel',
    accentBg: 'bg-[#ede9fe]',
    accentBorder: 'border-[#c4b5fd]',
    buttonBg: 'bg-[#c4b5fd] hover:bg-[#a78bfa] text-slate-900',
  },
];

const TIMELINE_COLORS = [
  { label: 'Kuning Cerah', color: 'bg-[#fef08a] text-slate-900' },
  { label: 'Oranye Pastel', color: 'bg-[#fed7aa] text-slate-900' },
  { label: 'Biru Langit', color: 'bg-[#bae6fd] text-slate-900' },
  { label: 'Hijau Mint', color: 'bg-[#bbf7d0] text-slate-900' },
  { label: 'Pink Muda', color: 'bg-[#fbcfe8] text-slate-900' },
  { label: 'Ungu Pastel', color: 'bg-[#ddd6fe] text-slate-900' },
];

function getProgramLabel(code: ProgramCode, programList: SchoolProgram[] = PROGRAMS): string {
  return programList.find((p) => p.code === code)?.name ?? code;
}

function getStatusBadge(status: RegistrationStatus) {
  switch (status) {
    case 'diterima':
      return { label: 'Diterima', cls: 'bg-[#dcfce7] text-emerald-900 border-[#86efac]' };
    case 'jadwal_trial':
      return { label: 'Jadwal Trial', cls: 'bg-[#e0f2fe] text-sky-900 border-[#7dd3fc]' };
    case 'batal':
      return { label: 'Batal', cls: 'bg-rose-50 text-rose-800 border-rose-200' };
    default:
      return { label: 'Menunggu Konfirmasi', cls: 'bg-[#fef9c3] text-amber-900 border-[#fde047]' };
  }
}

function generateRegistrationCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let suffix = '';
  for (let i = 0; i < 5; i += 1) {
    suffix += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `PPDB-2026-${suffix}`;
}

function makeDocId(prefix: string): string {
  const rand = Math.random().toString(36).slice(2, 8).replace(/[^a-z0-9]/g, 'x');
  return `${prefix}_${Date.now()}_${rand}`;
}

function makeProgramCode(input: string): string {
  const cleaned = input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 32);
  if (cleaned.length >= 2) return cleaned;
  return `prog_${Date.now().toString(36)}`;
}

function buildSchoolInfoPayload(info: SchoolInfo) {
  const cleanYear = Math.min(2100, Math.max(1900, Math.round(Number(info.foundedYear) || 2016)));
  const cleanWaRaw = info.whatsappRaw.replace(/[^0-9]/g, '').slice(0, 20);
  const payload: Record<string, unknown> = {
    name: info.name.trim().slice(0, 100),
    shortTagline: info.shortTagline.trim().slice(0, 140),
    npsn: info.npsn.trim().slice(0, 30),
    accreditation: info.accreditation.trim().slice(0, 60),
    curriculum: info.curriculum.trim().slice(0, 80),
    foundedYear: cleanYear,
    experienceYears: info.experienceYears.trim().slice(0, 40),
    studentCount: info.studentCount.trim().slice(0, 40),
    teacherCount: info.teacherCount.trim().slice(0, 40),
    ratioText: info.ratioText.trim().slice(0, 30),
    principalName: info.principalName.trim().slice(0, 100),
    principalQuote: info.principalQuote.trim().slice(0, 600),
    address: info.address.trim().slice(0, 300),
    whatsappRaw: cleanWaRaw.length >= 8 ? cleanWaRaw : '6281234567890',
    whatsappDisplay: info.whatsappDisplay.trim().slice(0, 25),
    instagramHandle: info.instagramHandle.trim().slice(0, 60),
    facebookName: info.facebookName.trim().slice(0, 80),
    youtubeName: info.youtubeName.trim().slice(0, 80),
    email: info.email.trim().slice(0, 120),
    schoolHoursA: info.schoolHoursA.trim().slice(0, 120),
    schoolHoursB: info.schoolHoursB.trim().slice(0, 120),
    serviceHours: info.serviceHours.trim().slice(0, 140),
    ppdbDeadlineIso: info.ppdbDeadlineIso.trim().slice(0, 40),
    youtubeVideoId: info.youtubeVideoId.trim().slice(0, 60),
    mapsEmbedUrl: info.mapsEmbedUrl.trim().slice(0, 500),
    updatedAt: serverTimestamp(),
  };
  if (info.principalPhoto && info.principalPhoto.trim().length > 0) {
    payload.principalPhoto = info.principalPhoto.trim().slice(0, 400);
  }
  if (info.videoThumbnail && info.videoThumbnail.trim().length > 0) {
    payload.videoThumbnail = info.videoThumbnail.trim().slice(0, 400);
  }
  if (info.heroBadge && info.heroBadge.trim().length > 0) {
    payload.heroBadge = info.heroBadge.trim().slice(0, 120);
  }
  if (info.heroTitle && info.heroTitle.trim().length > 0) {
    payload.heroTitle = info.heroTitle.trim().slice(0, 160);
  }
  if (info.heroSubtitle && info.heroSubtitle.trim().length > 0) {
    payload.heroSubtitle = info.heroSubtitle.trim().slice(0, 400);
  }
  if (info.heroImage && info.heroImage.trim().length > 0) {
    payload.heroImage = info.heroImage.trim().slice(0, 400);
  }
  return payload;
}

export const AdminPortalModal: React.FC<AdminPortalModalProps> = ({
  isOpen,
  onClose,
  authReady,
  currentUser,
  isAdminUser,
  schoolInfo,
  advantages,
  programs,
  timelineSteps,
  quotas,
  teachers,
  galleryItems,
  testimonials,
  faqs,
  intent,
}) => {
  const [activeTab, setActiveTab] = useState<AdminTab>('pendaftar');
  const [authError, setAuthError] = useState<string | null>(null);
  const [actionMsg, setActionMsg] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // School Identity & Principal form state
  const [schoolForm, setSchoolForm] = useState<SchoolInfo>(schoolInfo);
  useEffect(() => {
    setSchoolForm(schoolInfo);
  }, [schoolInfo]);

  // Confirm delete ID
  const [confirmDeleteKey, setConfirmDeleteKey] = useState<string | null>(null);

  // Advantages add/edit form
  const [advantageFormMode, setAdvantageFormMode] = useState<'closed' | 'add' | 'edit'>('closed');
  const [editingAdvantageId, setEditingAdvantageId] = useState<string | null>(null);
  const [advantageForm, setAdvantageForm] = useState({
    emoji: '✨',
    title: '',
    description: '',
    bgClass: 'bg-[#fef9c3]',
    borderClass: 'border-[#fde047]',
  });

  // Program add/edit form
  const [programFormMode, setProgramFormMode] = useState<'closed' | 'add' | 'edit'>('closed');
  const [editingProgramCode, setEditingProgramCode] = useState<string | null>(null);
  const [programForm, setProgramForm] = useState({
    code: '',
    name: '',
    emoji: '🎒',
    ageRange: '',
    scheduleHours: 'Senin - Jumat, 08.00 - 10.30 WIB',
    maxPerClass: 20,
    defaultEnrolled: 0,
    feeSummary: 'Rp 300.000 / bulan',
    registrationFee: 'Gratis Formulir (Trial 1 Hari Gratis)',
    monthlyFee: 'SPP Rp 300.000/bulan',
    summary: '',
    themeIndex: 0,
    highlightsText: 'Belajar sambil bermain\nMengaji & pembiasaan karakter',
    scheduleRows: [
      { day: 'Senin', activity: 'Apel Pagi & Pengenalan Huruf Ceria' },
      { day: 'Selasa', activity: 'Bermain Angka & Sains Sederhana' },
      { day: 'Rabu', activity: 'Doa Harian, Tahfidz & Cerita Teladan' },
      { day: 'Kamis', activity: 'Melukis, Musik & Motorik Halus' },
      { day: 'Jumat', activity: 'Sholat Dhuha, Senam & Bermain Outdoor' },
    ],
  });

  // Timeline add/edit form
  const [timelineFormMode, setTimelineFormMode] = useState<'closed' | 'add' | 'edit'>('closed');
  const [editingTimelineId, setEditingTimelineId] = useState<string | null>(null);
  const [timelineForm, setTimelineForm] = useState({
    time: '08.00',
    emoji: '🧩',
    title: '',
    description: '',
    color: 'bg-[#fef08a] text-slate-900',
  });

  // PPDB registrations state
  const [registrations, setRegistrations] = useState<PpdbRegistrationRecord[]>([]);
  const [regLoading, setRegLoading] = useState(false);
  const [regError, setRegError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<'all' | RegistrationStatus>('all');
  const [filterProgram, setFilterProgram] = useState<'all' | ProgramCode>('all');
  const [regSearch, setRegSearch] = useState('');

  // PPDB add/edit form
  const [regFormMode, setRegFormMode] = useState<'closed' | 'add' | 'edit'>('closed');
  const [editingRegId, setEditingRegId] = useState<string | null>(null);
  const [regForm, setRegForm] = useState({
    childName: '',
    birthDate: '2021-05-15',
    gender: 'Laki-laki' as 'Laki-laki' | 'Perempuan',
    programCode: 'kelompok_a' as ProgramCode,
    fatherName: '',
    motherName: '',
    parentWhatsapp: '',
    address: '',
    previousSchool: '',
    notes: '',
    wantsTrial: true,
    status: 'menunggu' as RegistrationStatus,
    trialDate: '',
    adminNotes: '',
  });

  // Quota edit form
  const [quotaDraft, setQuotaDraft] = useState<QuotaMap>(quotas);
  useEffect(() => {
    setQuotaDraft(quotas);
  }, [quotas]);

  // Teacher add/edit form
  const [teacherFormMode, setTeacherFormMode] = useState<'closed' | 'add' | 'edit'>('closed');
  const [editingTeacherId, setEditingTeacherId] = useState<string | null>(null);
  const [teacherForm, setTeacherForm] = useState({
    name: '',
    role: '',
    slogan: '',
    experience: '',
    photo: HERO_IMAGES.team,
    badgeColor: 'bg-[#fef08a]',
    initials: '',
  });

  // Gallery add/edit form
  const [galleryFormMode, setGalleryFormMode] = useState<'closed' | 'add' | 'edit'>('closed');
  const [editingGalleryId, setEditingGalleryId] = useState<string | null>(null);
  const [galleryForm, setGalleryForm] = useState({
    title: '',
    category: 'Belajar' as GalleryItem['category'],
    description: '',
    image: HERO_IMAGES.main,
    alt: '',
  });

  // Testimonial add/edit form
  const [testimonialFormMode, setTestimonialFormMode] = useState<'closed' | 'add' | 'edit'>('closed');
  const [editingTestimonialId, setEditingTestimonialId] = useState<string | null>(null);
  const [testimonialForm, setTestimonialForm] = useState({
    parentName: '',
    childInfo: '',
    rating: 5,
    quote: '',
    avatarColor: 'bg-[#fef08a]',
    initials: '',
  });

  // FAQ add/edit form
  const [faqFormMode, setFaqFormMode] = useState<'closed' | 'add' | 'edit'>('closed');
  const [editingFaqId, setEditingFaqId] = useState<string | null>(null);
  const [faqForm, setFaqForm] = useState({
    question: '',
    answer: '',
  });

  // Sync intent from page inline Admin buttons
  useEffect(() => {
    if (!isOpen || !intent) return;
    setActiveTab(intent.tab);
    setActionMsg(null);
    setConfirmDeleteKey(null);
    setAdvantageFormMode('closed');
    setProgramFormMode('closed');
    setTimelineFormMode('closed');
    setTeacherFormMode('closed');
    setGalleryFormMode('closed');
    setTestimonialFormMode('closed');
    setFaqFormMode('closed');

    if (intent.tab === 'keunggulan') {
      if (intent.mode === 'add') {
        openAddAdvantage();
      } else if (intent.mode === 'edit' && intent.itemId) {
        const found = advantages.find((a) => a.id === intent.itemId);
        if (found) openEditAdvantage(found);
      } else if (intent.mode === 'delete' && intent.itemId) {
        setConfirmDeleteKey(`adv:${intent.itemId}`);
      }
    } else if (intent.tab === 'program') {
      if (intent.mode === 'add') {
        openAddProgram();
      } else if (intent.mode === 'edit' && intent.itemId) {
        const found = programs.find((p) => p.code === intent.itemId);
        if (found) openEditProgram(found);
      } else if (intent.mode === 'delete' && intent.itemId) {
        setConfirmDeleteKey(`prog:${intent.itemId}`);
      }
    } else if (intent.tab === 'timeline') {
      if (intent.mode === 'add') {
        openAddTimeline();
      } else if (intent.mode === 'edit' && intent.itemId) {
        const found = timelineSteps.find((s, idx) => (s.id || `step_${idx}`) === intent.itemId);
        if (found) openEditTimeline(found, intent.itemId);
      } else if (intent.mode === 'delete' && intent.itemId) {
        setConfirmDeleteKey(`time:${intent.itemId}`);
      }
    } else if (intent.tab === 'guru') {
      if (intent.mode === 'add') {
        openAddTeacher();
      } else if (intent.mode === 'edit' && intent.itemId) {
        const found = teachers.find((t) => t.id === intent.itemId);
        if (found) openEditTeacher(found);
      } else if (intent.mode === 'delete' && intent.itemId) {
        setConfirmDeleteKey(`guru:${intent.itemId}`);
      }
    } else if (intent.tab === 'galeri') {
      if (intent.mode === 'add') {
        openAddGallery();
      } else if (intent.mode === 'edit' && intent.itemId) {
        const found = galleryItems.find((g) => g.id === intent.itemId);
        if (found) openEditGallery(found);
      } else if (intent.mode === 'delete' && intent.itemId) {
        setConfirmDeleteKey(`gal:${intent.itemId}`);
      }
    } else if (intent.tab === 'testimoni') {
      if (intent.mode === 'add') {
        openAddTestimonial();
      } else if (intent.mode === 'edit' && intent.itemId) {
        const found = testimonials.find((t) => t.id === intent.itemId);
        if (found) openEditTestimonial(found);
      } else if (intent.mode === 'delete' && intent.itemId) {
        setConfirmDeleteKey(`testi:${intent.itemId}`);
      }
    } else if (intent.tab === 'faq') {
      if (intent.mode === 'add') {
        openAddFaq();
      } else if (intent.mode === 'edit' && intent.itemId) {
        const found = faqs.find((f) => f.id === intent.itemId);
        if (found) openEditFaq(found);
      } else if (intent.mode === 'delete' && intent.itemId) {
        setConfirmDeleteKey(`faq:${intent.itemId}`);
      }
    }
  }, [isOpen, intent]);

  // Real-time subscription to ppdb_registrations when authenticated as admin
  useEffect(() => {
    if (!isOpen || !authReady || !currentUser || !isAdminUser) {
      setRegistrations([]);
      return;
    }

    setRegLoading(true);
    setRegError(null);

    const q = query(collection(db, 'ppdb_registrations'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(
      q,
      (snapshot) => {
        const list: PpdbRegistrationRecord[] = snapshot.docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            registrationCode: data.registrationCode,
            childName: data.childName,
            birthDate: data.birthDate,
            gender: data.gender,
            programCode: data.programCode,
            fatherName: data.fatherName,
            motherName: data.motherName,
            parentWhatsapp: data.parentWhatsapp,
            address: data.address,
            previousSchool: data.previousSchool,
            notes: data.notes,
            wantsTrial: Boolean(data.wantsTrial),
            status: data.status as RegistrationStatus,
            trialDate: data.trialDate,
            adminNotes: data.adminNotes,
            createdAt: data.createdAt ?? null,
          };
        });
        setRegistrations(list);
        setRegLoading(false);
      },
      (error) => {
        setRegLoading(false);
        setRegError('Gagal memuat data pendaftaran dari database.');
        handleFirestoreError(error, OperationType.LIST, 'ppdb_registrations');
      }
    );

    return () => unsub();
  }, [isOpen, authReady, currentUser, isAdminUser]);

  // Seed helper for public collections if empty in Firestore
  const ensureCollectionSeeded = async (
    colName:
      | 'site_advantages'
      | 'site_programs'
      | 'site_timeline'
      | 'site_teachers'
      | 'site_gallery'
      | 'site_testimonials'
      | 'site_faqs'
  ) => {
    const snap = await getDocs(collection(db, colName));
    if (!snap.empty) return;
    const batch = writeBatch(db);
    if (colName === 'site_advantages') {
      WHY_CHOOSE_US.forEach((a, idx) => {
        batch.set(doc(db, 'site_advantages', a.id), {
          emoji: a.emoji,
          title: a.title,
          description: a.description,
          bgClass: a.bgClass,
          borderClass: a.borderClass,
          sortOrder: idx,
          updatedAt: serverTimestamp(),
        });
      });
    } else if (colName === 'site_programs') {
      PROGRAMS.forEach((p, idx) => {
        batch.set(doc(db, 'site_programs', p.code), {
          code: p.code,
          name: p.name,
          ageRange: p.ageRange,
          scheduleHours: p.scheduleHours,
          maxPerClass: p.maxPerClass,
          defaultEnrolled: p.defaultEnrolled,
          feeSummary: p.feeSummary,
          registrationFee: p.registrationFee,
          monthlyFee: p.monthlyFee,
          accentBg: p.accentBg,
          accentBorder: p.accentBorder,
          buttonBg: p.buttonBg,
          emoji: p.emoji,
          summary: p.summary,
          highlights: p.highlights,
          weeklySchedule: p.weeklySchedule,
          sortOrder: idx,
          updatedAt: serverTimestamp(),
        });
      });
    } else if (colName === 'site_timeline') {
      DAILY_TIMELINE.forEach((s, idx) => {
        const docId = s.id || `step_0${idx + 1}`;
        batch.set(doc(db, 'site_timeline', docId), {
          time: s.time,
          emoji: s.emoji,
          title: s.title,
          description: s.description,
          color: s.color,
          sortOrder: idx,
          updatedAt: serverTimestamp(),
        });
      });
    } else if (colName === 'site_teachers') {
      TEACHERS.forEach((t, idx) => {
        batch.set(doc(db, 'site_teachers', t.id), {
          name: t.name,
          role: t.role,
          slogan: t.slogan,
          experience: t.experience,
          photo: t.photo,
          badgeColor: t.badgeColor,
          initials: t.initials,
          sortOrder: idx,
          updatedAt: serverTimestamp(),
        });
      });
    } else if (colName === 'site_gallery') {
      GALLERY_ITEMS.forEach((g, idx) => {
        batch.set(doc(db, 'site_gallery', g.id), {
          title: g.title,
          category: g.category,
          description: g.description,
          image: g.image,
          alt: g.alt,
          sortOrder: idx,
          updatedAt: serverTimestamp(),
        });
      });
    } else if (colName === 'site_testimonials') {
      TESTIMONIALS.forEach((t, idx) => {
        batch.set(doc(db, 'site_testimonials', t.id), {
          parentName: t.parentName,
          childInfo: t.childInfo,
          rating: t.rating,
          quote: t.quote,
          avatarColor: t.avatarColor,
          initials: t.initials,
          sortOrder: idx,
          updatedAt: serverTimestamp(),
        });
      });
    } else if (colName === 'site_faqs') {
      FAQS.forEach((f, idx) => {
        batch.set(doc(db, 'site_faqs', f.id), {
          question: f.question,
          answer: f.answer,
          sortOrder: idx,
          updatedAt: serverTimestamp(),
        });
      });
    }
    await batch.commit();
  };

  // Sign in / out
  const handleAdminSignIn = async () => {
    setAuthError(null);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : 'Gagal masuk dengan akun Google.');
    }
  };

  // PPDB CRUD
  const openAddReg = () => {
    setRegFormMode('add');
    setEditingRegId(null);
    setRegForm({
      childName: '',
      birthDate: '2021-05-15',
      gender: 'Laki-laki',
      programCode: programs[0]?.code || 'kelompok_a',
      fatherName: '',
      motherName: '',
      parentWhatsapp: '',
      address: '',
      previousSchool: '',
      notes: '',
      wantsTrial: true,
      status: 'menunggu',
      trialDate: '',
      adminNotes: '',
    });
    setActionMsg(null);
  };

  const openEditReg = (reg: PpdbRegistrationRecord) => {
    setRegFormMode('edit');
    setEditingRegId(reg.id);
    setRegForm({
      childName: reg.childName,
      birthDate: reg.birthDate,
      gender: reg.gender,
      programCode: reg.programCode,
      fatherName: reg.fatherName,
      motherName: reg.motherName,
      parentWhatsapp: reg.parentWhatsapp,
      address: reg.address,
      previousSchool: reg.previousSchool || '',
      notes: reg.notes || '',
      wantsTrial: reg.wantsTrial,
      status: reg.status,
      trialDate: reg.trialDate || '',
      adminNotes: reg.adminNotes || '',
    });
    setActionMsg(null);
  };

  const handleSaveReg = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionMsg(null);
    const trimmedChild = regForm.childName.trim();
    const trimmedFather = regForm.fatherName.trim();
    const trimmedMother = regForm.motherName.trim();
    const trimmedWa = regForm.parentWhatsapp.trim();
    const trimmedAddress = regForm.address.trim();

    if (
      trimmedChild.length < 2 ||
      !PPDB_VALIDATION.birthDatePattern.test(regForm.birthDate) ||
      trimmedFather.length < 2 ||
      trimmedMother.length < 2 ||
      !PPDB_VALIDATION.whatsappPattern.test(trimmedWa) ||
      trimmedAddress.length < 5
    ) {
      setActionMsg('Mohon lengkapi semua field wajib dengan format yang benar.');
      return;
    }

    setSaving(true);
    try {
      const payload: Record<string, unknown> = {
        childName: trimmedChild.slice(0, PPDB_VALIDATION.childNameMax),
        birthDate: regForm.birthDate,
        gender: regForm.gender,
        programCode: regForm.programCode,
        fatherName: trimmedFather.slice(0, PPDB_VALIDATION.parentNameMax),
        motherName: trimmedMother.slice(0, PPDB_VALIDATION.parentNameMax),
        parentWhatsapp: trimmedWa.slice(0, 18),
        address: trimmedAddress.slice(0, PPDB_VALIDATION.addressMax),
        wantsTrial: regForm.wantsTrial,
        status: regForm.status,
        updatedAt: serverTimestamp(),
      };
      if (regForm.previousSchool.trim()) {
        payload.previousSchool = regForm.previousSchool.trim().slice(0, PPDB_VALIDATION.previousSchoolMax);
      }
      if (regForm.notes.trim()) {
        payload.notes = regForm.notes.trim().slice(0, PPDB_VALIDATION.notesMax);
      }
      if (regForm.trialDate.trim()) {
        payload.trialDate = regForm.trialDate.trim().slice(0, PPDB_VALIDATION.trialDateMax);
      }
      if (regForm.adminNotes.trim()) {
        payload.adminNotes = regForm.adminNotes.trim().slice(0, PPDB_VALIDATION.adminNotesMax);
      }

      if (regFormMode === 'add') {
        const newId = makeDocId('reg');
        await setDoc(doc(db, 'ppdb_registrations', newId), {
          ...payload,
          registrationCode: generateRegistrationCode(),
          createdAt: serverTimestamp(),
        });
        setActionMsg('Data pendaftar berhasil ditambahkan.');
      } else if (regFormMode === 'edit' && editingRegId) {
        await updateDoc(doc(db, 'ppdb_registrations', editingRegId), payload);
        setActionMsg('Perubahan data pendaftar berhasil disimpan.');
      }
      setRegFormMode('closed');
      setEditingRegId(null);
    } catch (err) {
      handleFirestoreError(
        err,
        regFormMode === 'add' ? OperationType.CREATE : OperationType.UPDATE,
        'ppdb_registrations'
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteReg = async (id: string) => {
    setSaving(true);
    try {
      await deleteDoc(doc(db, 'ppdb_registrations', id));
      setConfirmDeleteKey(null);
      setActionMsg('Data pendaftar berhasil dihapus.');
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `ppdb_registrations/${id}`);
    } finally {
      setSaving(false);
    }
  };

  // Quota save
  const handleSaveQuotas = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setActionMsg(null);
    try {
      const batch = writeBatch(db);
      programs.forEach((prog) => {
        const entry = quotaDraft[prog.code] ?? {
          capacity: prog.maxPerClass,
          enrolledCount: prog.defaultEnrolled,
        };
        const cap = Math.min(100, Math.max(1, Math.round(entry.capacity)));
        const enr = Math.min(cap, Math.max(0, Math.round(entry.enrolledCount)));
        batch.set(doc(db, 'ppdb_stats', prog.code), {
          programCode: prog.code,
          capacity: cap,
          enrolledCount: enr,
          updatedAt: serverTimestamp(),
        });
      });
      await batch.commit();
      setActionMsg('Kuota kelas berhasil diperbarui.');
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'ppdb_stats');
    } finally {
      setSaving(false);
    }
  };

  // Save School Identity & Principal
  const handleSaveSchoolInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionMsg(null);

    if (
      schoolForm.name.trim().length < 2 ||
      schoolForm.shortTagline.trim().length < 2 ||
      schoolForm.npsn.trim().length < 2 ||
      schoolForm.principalName.trim().length < 2 ||
      schoolForm.principalQuote.trim().length < 5 ||
      schoolForm.address.trim().length < 5
    ) {
      setActionMsg(
        'Nama TK, tagline, NPSN, nama kepala sekolah, sambutan, dan alamat wajib diisi lengkap.'
      );
      return;
    }

    setSaving(true);
    try {
      const payload = buildSchoolInfoPayload(schoolForm);
      await setDoc(doc(db, 'site_settings', 'school_info'), payload);

      // Sinkronkan juga profil Kepala Sekolah di koleksi guru agar konsisten
      const principalTeacher =
        teachers.find((t) => t.id === 'kepala') ||
        teachers.find((t) => t.role.toLowerCase().includes('kepala sekolah'));
      if (principalTeacher) {
        await ensureCollectionSeeded('site_teachers');
        const cleanedPrincipal = schoolForm.principalName.trim().slice(0, 100);
        const teacherUpdates: Record<string, unknown> = {
          name: cleanedPrincipal,
          updatedAt: serverTimestamp(),
        };
        if (schoolForm.principalPhoto && schoolForm.principalPhoto.trim().length > 0) {
          teacherUpdates.photo = schoolForm.principalPhoto.trim().slice(0, 400);
        }
        await updateDoc(doc(db, 'site_teachers', principalTeacher.id), teacherUpdates);
      }

      setActionMsg('Identitas TK & Kepala Sekolah berhasil diperbarui ke seluruh website!');
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'site_settings/school_info');
    } finally {
      setSaving(false);
    }
  };

  // Teacher CRUD
  const openAddTeacher = () => {
    setTeacherFormMode('add');
    setEditingTeacherId(null);
    setTeacherForm({
      name: '',
      role: '',
      slogan: '',
      experience: '5 Tahun Pengalaman PAUD',
      photo: HERO_IMAGES.team,
      badgeColor: 'bg-[#fef08a]',
      initials: 'BG',
    });
  };

  const openEditTeacher = (t: TeacherProfile) => {
    setTeacherFormMode('edit');
    setEditingTeacherId(t.id);
    setTeacherForm({
      name: t.name,
      role: t.role,
      slogan: t.slogan,
      experience: t.experience,
      photo: t.photo,
      badgeColor: t.badgeColor,
      initials: t.initials,
    });
  };

  const handleSaveTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (teacherForm.name.trim().length < 2 || teacherForm.role.trim().length < 2) {
      setActionMsg('Nama dan jabatan guru wajib diisi.');
      return;
    }
    setSaving(true);
    setActionMsg(null);
    try {
      await ensureCollectionSeeded('site_teachers');
      const id = teacherFormMode === 'edit' && editingTeacherId ? editingTeacherId : makeDocId('guru');
      const cleanedName = teacherForm.name.trim().slice(0, 100);
      const cleanedRole = teacherForm.role.trim().slice(0, 80);
      const cleanedPhoto = teacherForm.photo.trim().slice(0, 400) || HERO_IMAGES.team;
      const initials =
        teacherForm.initials.trim() ||
        cleanedName
          .split(' ')
          .slice(0, 2)
          .map((w) => w[0]?.toUpperCase() || '')
          .join('') ||
        'TK';

      await setDoc(doc(db, 'site_teachers', id), {
        name: cleanedName,
        role: cleanedRole,
        slogan: teacherForm.slogan.trim().slice(0, 200) || '"Mendidik dengan penuh cinta."',
        experience: teacherForm.experience.trim().slice(0, 80) || 'Pengajar PAUD',
        photo: cleanedPhoto,
        badgeColor: teacherForm.badgeColor || 'bg-[#fef08a]',
        initials: initials.slice(0, 4),
        sortOrder:
          teacherFormMode === 'edit'
            ? Math.max(0, teachers.findIndex((t) => t.id === id))
            : teachers.length,
        updatedAt: serverTimestamp(),
      });

      // Jika yang diedit adalah Kepala Sekolah, sinkronkan ke site_settings/school_info
      if (id === 'kepala' || cleanedRole.toLowerCase().includes('kepala sekolah')) {
        const syncedPayload = buildSchoolInfoPayload({
          ...schoolInfo,
          principalName: cleanedName,
          principalPhoto: cleanedPhoto,
        });
        await setDoc(doc(db, 'site_settings', 'school_info'), syncedPayload);
      }

      setTeacherFormMode('closed');
      setEditingTeacherId(null);
      setActionMsg('Data guru berhasil disimpan.');
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'site_teachers');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteTeacher = async (id: string) => {
    setSaving(true);
    try {
      await ensureCollectionSeeded('site_teachers');
      await deleteDoc(doc(db, 'site_teachers', id));
      setConfirmDeleteKey(null);
      setActionMsg('Data guru berhasil dihapus.');
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `site_teachers/${id}`);
    } finally {
      setSaving(false);
    }
  };

  // Gallery CRUD
  const openAddGallery = () => {
    setGalleryFormMode('add');
    setEditingGalleryId(null);
    setGalleryForm({
      title: '',
      category: 'Belajar',
      description: '',
      image: HERO_IMAGES.main,
      alt: '',
    });
  };

  const openEditGallery = (g: GalleryItem) => {
    setGalleryFormMode('edit');
    setEditingGalleryId(g.id);
    setGalleryForm({
      title: g.title,
      category: g.category,
      description: g.description,
      image: g.image,
      alt: g.alt,
    });
  };

  const handleSaveGallery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (galleryForm.title.trim().length < 2 || galleryForm.description.trim().length < 2) {
      setActionMsg('Judul dan deskripsi foto wajib diisi.');
      return;
    }
    setSaving(true);
    setActionMsg(null);
    try {
      await ensureCollectionSeeded('site_gallery');
      const id = galleryFormMode === 'edit' && editingGalleryId ? editingGalleryId : makeDocId('gal');
      await setDoc(doc(db, 'site_gallery', id), {
        title: galleryForm.title.trim().slice(0, 120),
        category: galleryForm.category,
        description: galleryForm.description.trim().slice(0, 300),
        image: galleryForm.image.trim().slice(0, 400) || HERO_IMAGES.main,
        alt: galleryForm.alt.trim().slice(0, 200) || galleryForm.title.trim().slice(0, 120),
        sortOrder:
          galleryFormMode === 'edit'
            ? Math.max(0, galleryItems.findIndex((g) => g.id === id))
            : galleryItems.length,
        updatedAt: serverTimestamp(),
      });
      setGalleryFormMode('closed');
      setEditingGalleryId(null);
      setActionMsg('Foto galeri berhasil disimpan.');
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'site_gallery');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteGallery = async (id: string) => {
    setSaving(true);
    try {
      await ensureCollectionSeeded('site_gallery');
      await deleteDoc(doc(db, 'site_gallery', id));
      setConfirmDeleteKey(null);
      setActionMsg('Foto galeri berhasil dihapus.');
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `site_gallery/${id}`);
    } finally {
      setSaving(false);
    }
  };

  // Testimonial CRUD
  const openAddTestimonial = () => {
    setTestimonialFormMode('add');
    setEditingTestimonialId(null);
    setTestimonialForm({
      parentName: '',
      childInfo: '',
      rating: 5,
      quote: '',
      avatarColor: 'bg-[#fef08a]',
      initials: '',
    });
  };

  const openEditTestimonial = (t: TestimonialItem) => {
    setTestimonialFormMode('edit');
    setEditingTestimonialId(t.id);
    setTestimonialForm({
      parentName: t.parentName,
      childInfo: t.childInfo,
      rating: t.rating,
      quote: t.quote,
      avatarColor: t.avatarColor,
      initials: t.initials,
    });
  };

  const handleSaveTestimonial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (testimonialForm.parentName.trim().length < 2 || testimonialForm.quote.trim().length < 5) {
      setActionMsg('Nama orang tua dan isi testimoni wajib diisi.');
      return;
    }
    setSaving(true);
    setActionMsg(null);
    try {
      await ensureCollectionSeeded('site_testimonials');
      const id =
        testimonialFormMode === 'edit' && editingTestimonialId
          ? editingTestimonialId
          : makeDocId('testi');
      const initials =
        testimonialForm.initials.trim() ||
        testimonialForm.parentName
          .trim()
          .split(' ')
          .slice(0, 2)
          .map((w) => w[0]?.toUpperCase() || '')
          .join('') ||
        'OT';

      await setDoc(doc(db, 'site_testimonials', id), {
        parentName: testimonialForm.parentName.trim().slice(0, 80),
        childInfo: testimonialForm.childInfo.trim().slice(0, 80) || 'Orang Tua Siswa',
        rating: Math.min(5, Math.max(1, Math.round(testimonialForm.rating))),
        quote: testimonialForm.quote.trim().slice(0, 400),
        avatarColor: testimonialForm.avatarColor || 'bg-[#fef08a]',
        initials: initials.slice(0, 4),
        sortOrder:
          testimonialFormMode === 'edit'
            ? Math.max(0, testimonials.findIndex((t) => t.id === id))
            : testimonials.length,
        updatedAt: serverTimestamp(),
      });
      setTestimonialFormMode('closed');
      setEditingTestimonialId(null);
      setActionMsg('Testimoni berhasil disimpan.');
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'site_testimonials');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteTestimonial = async (id: string) => {
    setSaving(true);
    try {
      await ensureCollectionSeeded('site_testimonials');
      await deleteDoc(doc(db, 'site_testimonials', id));
      setConfirmDeleteKey(null);
      setActionMsg('Testimoni berhasil dihapus.');
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `site_testimonials/${id}`);
    } finally {
      setSaving(false);
    }
  };

  // FAQ CRUD
  const openAddFaq = () => {
    setFaqFormMode('add');
    setEditingFaqId(null);
    setFaqForm({ question: '', answer: '' });
  };

  const openEditFaq = (f: FaqItem) => {
    setFaqFormMode('edit');
    setEditingFaqId(f.id);
    setFaqForm({ question: f.question, answer: f.answer });
  };

  const handleSaveFaq = async (e: React.FormEvent) => {
    e.preventDefault();
    if (faqForm.question.trim().length < 5 || faqForm.answer.trim().length < 5) {
      setActionMsg('Pertanyaan dan jawaban minimal 5 karakter.');
      return;
    }
    setSaving(true);
    setActionMsg(null);
    try {
      await ensureCollectionSeeded('site_faqs');
      const id = faqFormMode === 'edit' && editingFaqId ? editingFaqId : makeDocId('faq');
      await setDoc(doc(db, 'site_faqs', id), {
        question: faqForm.question.trim().slice(0, 200),
        answer: faqForm.answer.trim().slice(0, 600),
        sortOrder:
          faqFormMode === 'edit'
            ? Math.max(0, faqs.findIndex((f) => f.id === id))
            : faqs.length,
        updatedAt: serverTimestamp(),
      });
      setFaqFormMode('closed');
      setEditingFaqId(null);
      setActionMsg('FAQ berhasil disimpan.');
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'site_faqs');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteFaq = async (id: string) => {
    setSaving(true);
    try {
      await ensureCollectionSeeded('site_faqs');
      await deleteDoc(doc(db, 'site_faqs', id));
      setConfirmDeleteKey(null);
      setActionMsg('FAQ berhasil dihapus.');
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `site_faqs/${id}`);
    } finally {
      setSaving(false);
    }
  };

  // Advantage (Keunggulan) CRUD
  const openAddAdvantage = () => {
    setAdvantageFormMode('add');
    setEditingAdvantageId(null);
    setAdvantageForm({
      emoji: '✨',
      title: '',
      description: '',
      bgClass: 'bg-[#fef9c3]',
      borderClass: 'border-[#fde047]',
    });
  };

  const openEditAdvantage = (a: AdvantageItem) => {
    setAdvantageFormMode('edit');
    setEditingAdvantageId(a.id);
    setAdvantageForm({
      emoji: a.emoji,
      title: a.title,
      description: a.description,
      bgClass: a.bgClass,
      borderClass: a.borderClass,
    });
  };

  const handleSaveAdvantage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (advantageForm.title.trim().length < 2 || advantageForm.description.trim().length < 5) {
      setActionMsg('Judul dan deskripsi keunggulan minimal 2 & 5 karakter.');
      return;
    }
    setSaving(true);
    setActionMsg(null);
    try {
      await ensureCollectionSeeded('site_advantages');
      const id =
        advantageFormMode === 'edit' && editingAdvantageId
          ? editingAdvantageId
          : makeDocId('adv');
      await setDoc(doc(db, 'site_advantages', id), {
        emoji: advantageForm.emoji.trim().slice(0, 16) || '✨',
        title: advantageForm.title.trim().slice(0, 100),
        description: advantageForm.description.trim().slice(0, 400),
        bgClass: advantageForm.bgClass || 'bg-[#fef9c3]',
        borderClass: advantageForm.borderClass || 'border-[#fde047]',
        sortOrder:
          advantageFormMode === 'edit'
            ? Math.max(0, advantages.findIndex((a) => a.id === id))
            : advantages.length,
        updatedAt: serverTimestamp(),
      });
      setAdvantageFormMode('closed');
      setEditingAdvantageId(null);
      setActionMsg('Kartu keunggulan berhasil disimpan.');
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'site_advantages');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAdvantage = async (id: string) => {
    setSaving(true);
    try {
      await ensureCollectionSeeded('site_advantages');
      await deleteDoc(doc(db, 'site_advantages', id));
      setConfirmDeleteKey(null);
      setActionMsg('Kartu keunggulan berhasil dihapus.');
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `site_advantages/${id}`);
    } finally {
      setSaving(false);
    }
  };

  // Program & Kelas CRUD
  const openAddProgram = () => {
    setProgramFormMode('add');
    setEditingProgramCode(null);
    setProgramForm({
      code: '',
      name: '',
      emoji: '🎒',
      ageRange: 'Usia 3 - 4 Tahun',
      scheduleHours: 'Senin - Jumat, 08.00 - 10.30 WIB',
      maxPerClass: 20,
      defaultEnrolled: 0,
      feeSummary: 'Rp 300.000 / bulan',
      registrationFee: 'Gratis Formulir (Trial 1 Hari Gratis)',
      monthlyFee: 'SPP Rp 300.000/bulan',
      summary: '',
      themeIndex: 0,
      highlightsText: 'Belajar sambil bermain tanpa tekanan\nMengenal huruf, angka, dan doa harian',
      scheduleRows: [
        { day: 'Senin', activity: 'Apel Pagi & Pengenalan Huruf Ceria' },
        { day: 'Selasa', activity: 'Bermain Angka & Sains Sederhana' },
        { day: 'Rabu', activity: 'Doa Harian, Tahfidz & Cerita Teladan' },
        { day: 'Kamis', activity: 'Melukis, Musik & Motorik Halus' },
        { day: 'Jumat', activity: 'Sholat Dhuha, Senam & Bermain Outdoor' },
      ],
    });
  };

  const openEditProgram = (p: SchoolProgram) => {
    setProgramFormMode('edit');
    setEditingProgramCode(p.code);
    const themeIdx = Math.max(
      0,
      PROGRAM_THEMES.findIndex((t) => t.accentBg === p.accentBg)
    );
    setProgramForm({
      code: p.code,
      name: p.name,
      emoji: p.emoji,
      ageRange: p.ageRange,
      scheduleHours: p.scheduleHours,
      maxPerClass: p.maxPerClass,
      defaultEnrolled: p.defaultEnrolled,
      feeSummary: p.feeSummary,
      registrationFee: p.registrationFee,
      monthlyFee: p.monthlyFee,
      summary: p.summary,
      themeIndex: themeIdx,
      highlightsText: p.highlights.join('\n'),
      scheduleRows:
        p.weeklySchedule.length > 0
          ? p.weeklySchedule.map((w) => ({ ...w }))
          : [{ day: 'Senin', activity: 'Belajar Sambil Bermain' }],
    });
  };

  const handleSaveProgram = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      programForm.name.trim().length < 2 ||
      programForm.ageRange.trim().length < 2 ||
      programForm.summary.trim().length < 5
    ) {
      setActionMsg('Nama program, rentang usia, dan deskripsi ringkas wajib diisi.');
      return;
    }

    const highlights = programForm.highlightsText
      .split('\n')
      .map((line) => line.trim().slice(0, 160))
      .filter(Boolean)
      .slice(0, 10);
    if (highlights.length === 0) {
      setActionMsg('Tambahkan minimal 1 poin keunggulan program.');
      return;
    }

    const weeklySchedule = programForm.scheduleRows
      .map((row) => ({
        day: row.day.trim().slice(0, 30),
        activity: row.activity.trim().slice(0, 200),
      }))
      .filter((row) => row.day.length > 0 && row.activity.length > 0)
      .slice(0, 7);
    if (weeklySchedule.length === 0) {
      setActionMsg('Tambahkan minimal 1 baris jadwal mingguan.');
      return;
    }

    setSaving(true);
    setActionMsg(null);
    try {
      await ensureCollectionSeeded('site_programs');
      const code =
        programFormMode === 'edit' && editingProgramCode
          ? editingProgramCode
          : makeProgramCode(programForm.code || programForm.name);
      const maxPerClass = Math.min(100, Math.max(1, Math.round(Number(programForm.maxPerClass) || 20)));
      const defaultEnrolled = Math.min(
        maxPerClass,
        Math.max(0, Math.round(Number(programForm.defaultEnrolled) || 0))
      );
      const theme = PROGRAM_THEMES[programForm.themeIndex] || PROGRAM_THEMES[0];

      await setDoc(doc(db, 'site_programs', code), {
        code,
        name: programForm.name.trim().slice(0, 100),
        ageRange: programForm.ageRange.trim().slice(0, 60),
        scheduleHours: programForm.scheduleHours.trim().slice(0, 100) || 'Senin - Jumat',
        maxPerClass,
        defaultEnrolled,
        feeSummary: programForm.feeSummary.trim().slice(0, 80) || 'Hubungi Kami',
        registrationFee:
          programForm.registrationFee.trim().slice(0, 140) || 'Gratis Formulir',
        monthlyFee: programForm.monthlyFee.trim().slice(0, 140) || 'Hubungi Kami',
        accentBg: theme.accentBg,
        accentBorder: theme.accentBorder,
        buttonBg: theme.buttonBg,
        emoji: programForm.emoji.trim().slice(0, 16) || '🎒',
        summary: programForm.summary.trim().slice(0, 400),
        highlights,
        weeklySchedule,
        sortOrder:
          programFormMode === 'edit'
            ? Math.max(0, programs.findIndex((p) => p.code === code))
            : programs.length,
        updatedAt: serverTimestamp(),
      });

      // Sinkronkan juga kuota awal/kapasitas pada ppdb_stats
      const currentQuota = quotas[code];
      const nextEnrolled = Math.min(
        maxPerClass,
        currentQuota ? currentQuota.enrolledCount : defaultEnrolled
      );
      await setDoc(doc(db, 'ppdb_stats', code), {
        programCode: code,
        capacity: maxPerClass,
        enrolledCount: nextEnrolled,
        updatedAt: serverTimestamp(),
      });

      setProgramFormMode('closed');
      setEditingProgramCode(null);
      setActionMsg('Program & kelas berhasil disimpan.');
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'site_programs');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteProgram = async (code: string) => {
    setSaving(true);
    try {
      await ensureCollectionSeeded('site_programs');
      await deleteDoc(doc(db, 'site_programs', code));
      try {
        await deleteDoc(doc(db, 'ppdb_stats', code));
      } catch {
        // Ignore if stats document did not exist
      }
      setConfirmDeleteKey(null);
      setActionMsg('Program berhasil dihapus.');
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `site_programs/${code}`);
    } finally {
      setSaving(false);
    }
  };

  // Timeline (Sehari di TK Kami) CRUD
  const openAddTimeline = () => {
    setTimelineFormMode('add');
    setEditingTimelineId(null);
    setTimelineForm({
      time: '08.30',
      emoji: '🎨',
      title: '',
      description: '',
      color: 'bg-[#fef08a] text-slate-900',
    });
  };

  const openEditTimeline = (s: TimelineStep, fallbackId?: string) => {
    setTimelineFormMode('edit');
    setEditingTimelineId(s.id || fallbackId || null);
    setTimelineForm({
      time: s.time,
      emoji: s.emoji,
      title: s.title,
      description: s.description,
      color: s.color,
    });
  };

  const handleSaveTimeline = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      timelineForm.time.trim().length < 2 ||
      timelineForm.title.trim().length < 2 ||
      timelineForm.description.trim().length < 5
    ) {
      setActionMsg('Jam, judul aktivitas, dan deskripsi wajib diisi.');
      return;
    }
    setSaving(true);
    setActionMsg(null);
    try {
      await ensureCollectionSeeded('site_timeline');
      const id =
        timelineFormMode === 'edit' && editingTimelineId
          ? editingTimelineId
          : makeDocId('step');
      const existingIdx = timelineSteps.findIndex((s, idx) => (s.id || `step_${idx}`) === id);
      await setDoc(doc(db, 'site_timeline', id), {
        time: timelineForm.time.trim().slice(0, 20),
        emoji: timelineForm.emoji.trim().slice(0, 16) || '🌟',
        title: timelineForm.title.trim().slice(0, 100),
        description: timelineForm.description.trim().slice(0, 300),
        color: timelineForm.color || 'bg-[#fef08a] text-slate-900',
        sortOrder:
          timelineFormMode === 'edit' && existingIdx >= 0
            ? existingIdx
            : timelineSteps.length,
        updatedAt: serverTimestamp(),
      });
      setTimelineFormMode('closed');
      setEditingTimelineId(null);
      setActionMsg('Jadwal aktivitas harian berhasil disimpan.');
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'site_timeline');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteTimeline = async (id: string) => {
    setSaving(true);
    try {
      await ensureCollectionSeeded('site_timeline');
      await deleteDoc(doc(db, 'site_timeline', id));
      setConfirmDeleteKey(null);
      setActionMsg('Langkah aktivitas harian berhasil dihapus.');
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `site_timeline/${id}`);
    } finally {
      setSaving(false);
    }
  };

  const filteredRegistrations = useMemo(() => {
    const q = regSearch.trim().toLowerCase();
    return registrations.filter((r) => {
      const matchStatus = filterStatus === 'all' || r.status === filterStatus;
      const matchProg = filterProgram === 'all' || r.programCode === filterProgram;
      const matchQuery =
        !q ||
        r.childName.toLowerCase().includes(q) ||
        r.registrationCode.toLowerCase().includes(q) ||
        r.parentWhatsapp.toLowerCase().includes(q) ||
        r.motherName.toLowerCase().includes(q);
      return matchStatus && matchProg && matchQuery;
    });
  }, [registrations, filterStatus, filterProgram, regSearch]);

  const handleExportCsv = () => {
    const headers = [
      'Kode Registrasi',
      'Nama Anak',
      'Tanggal Lahir',
      'Jenis Kelamin',
      'Kelompok',
      'Nama Ayah',
      'Nama Ibu',
      'WhatsApp Ortu',
      'Alamat',
      'Trial 1 Hari',
      'Status',
      'Jadwal Trial',
    ];
    const rows = filteredRegistrations.map((r) => [
      r.registrationCode,
      r.childName,
      r.birthDate,
      r.gender,
      getProgramLabel(r.programCode, programs),
      r.fatherName,
      r.motherName,
      r.parentWhatsapp,
      r.address.replace(/\n/g, ' '),
      r.wantsTrial ? 'Ya' : 'Tidak',
      r.status,
      r.trialDate || '-',
    ]);
    const csv = [headers, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const slug = schoolInfo.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
    link.download = `data-ppdb-${slug || 'sekolah-tk'}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label="Panel Admin Sekolah"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-[28px] max-w-5xl w-full max-h-[90vh] flex flex-col shadow-2xl border-2 border-[#fde047] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 bg-[#fffbeb] border-b border-amber-200 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <ClipboardCheck className="w-6 h-6 text-[#ea580c]" aria-hidden="true" />
            <div>
              <h3 className="font-display text-xl font-bold text-slate-900">
                Panel Admin Sekolah (Tambah · Edit · Hapus)
              </h3>
              <p className="text-xs font-semibold text-slate-600">
                Kelola Pendaftar PPDB, Kuota Kelas, Guru, Galeri, Testimoni, dan FAQ di Firestore
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup panel admin"
            className="w-10 h-10 rounded-full bg-white border border-amber-200 flex items-center justify-center text-slate-700 hover:bg-amber-50 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1">
          {!authReady ? (
            <p className="text-center py-12 text-slate-600 font-semibold">
              Memeriksa sesi autentikasi...
            </p>
          ) : !currentUser ? (
            <div className="max-w-md mx-auto py-10 text-center">
              <div className="w-14 h-14 rounded-full bg-[#fef9c3] text-[#ea580c] flex items-center justify-center mx-auto mb-4">
                <UserCheck className="w-7 h-7" />
              </div>
              <h4 className="font-display text-2xl font-bold text-slate-900 mb-2">
                Masuk Sebagai Admin Sekolah
              </h4>
              <p className="text-sm text-slate-600 mb-6 leading-relaxed">
                Silakan masuk dengan akun Google admin resmi sekolah untuk menambah, mengedit, atau
                menghapus data PPDB dan konten website.
              </p>
              {authError && <p className="text-xs font-bold text-rose-600 mb-4">{authError}</p>}
              <button
                type="button"
                onClick={handleAdminSignIn}
                className="px-6 py-3.5 rounded-full bg-[#facc15] hover:bg-[#eab308] text-slate-900 font-display font-bold text-sm shadow-sm cursor-pointer"
              >
                Masuk dengan Google Admin
              </button>
            </div>
          ) : !isAdminUser ? (
            <div className="max-w-md mx-auto py-10 text-center">
              <h4 className="font-display text-xl font-bold text-slate-900 mb-2">Akses Terbatas</h4>
              <p className="text-sm text-slate-600 mb-4">
                Akun <strong>{currentUser.email}</strong> tidak terdaftar sebagai Admin resmi{' '}
                {schoolInfo.name}.
              </p>
              <button
                type="button"
                onClick={() => signOut(auth)}
                className="px-5 py-2.5 rounded-full bg-slate-900 text-white text-sm font-bold inline-flex items-center gap-2 cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>Keluar &amp; Ganti Akun</span>
              </button>
            </div>
          ) : (
            <div className="space-y-5">
              {/* Top Bar Admin Info */}
              <div className="flex flex-wrap items-center justify-between gap-3 bg-[#fffbeb] p-3.5 rounded-2xl border border-amber-200">
                <div className="text-sm">
                  <span className="text-slate-600">Login Admin: </span>
                  <strong className="text-slate-900">{currentUser.email}</strong>
                </div>
                <button
                  type="button"
                  onClick={() => signOut(auth)}
                  className="px-4 py-2 rounded-full bg-white border border-slate-300 text-slate-700 font-bold text-xs inline-flex items-center gap-1.5 hover:bg-slate-50 cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Keluar</span>
                </button>
              </div>

              {/* Navigation Tabs */}
              <div className="flex flex-wrap gap-2 border-b border-amber-100 pb-3" role="tablist">
                {(
                  [
                    { id: 'identitas', label: 'Identitas, Hero & Kontak' },
                    { id: 'keunggulan', label: 'Keunggulan' },
                    { id: 'program', label: 'Program & Kelas' },
                    { id: 'timeline', label: 'Jadwal Harian' },
                    { id: 'kuota', label: 'Kuota Kelas' },
                    { id: 'guru', label: 'Guru' },
                    { id: 'galeri', label: 'Galeri' },
                    { id: 'testimoni', label: 'Testimoni' },
                    { id: 'faq', label: 'FAQ' },
                    { id: 'pendaftar', label: 'Pendaftar PPDB' },
                  ] as const
                ).map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    role="tab"
                    aria-selected={activeTab === tab.id}
                    onClick={() => {
                      setActiveTab(tab.id);
                      setActionMsg(null);
                      setConfirmDeleteKey(null);
                    }}
                    className={`px-3.5 py-2 rounded-full text-xs sm:text-sm font-bold transition-colors cursor-pointer whitespace-nowrap ${
                      activeTab === tab.id
                        ? 'bg-[#facc15] text-slate-900 border-2 border-amber-400'
                        : 'bg-[#fffbeb] text-slate-700 border border-amber-200 hover:bg-amber-100'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {actionMsg && (
                <div className="p-3.5 rounded-2xl bg-[#dcfce7] border border-[#86efac] text-emerald-950 text-sm font-bold">
                  {actionMsg}
                </div>
              )}

              {confirmDeleteKey && (
                <div className="p-3.5 rounded-2xl bg-rose-50 border-2 border-rose-300 flex flex-wrap items-center justify-between gap-3">
                  <p className="text-sm font-bold text-rose-900">
                    Konfirmasi penghapusan item terpilih — tindakan ini permanen.
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={saving}
                      onClick={() => {
                        const colonIdx = confirmDeleteKey.indexOf(':');
                        if (colonIdx === -1) return;
                        const prefix = confirmDeleteKey.slice(0, colonIdx);
                        const itemId = confirmDeleteKey.slice(colonIdx + 1);
                        if (prefix === 'adv') void handleDeleteAdvantage(itemId);
                        else if (prefix === 'prog') void handleDeleteProgram(itemId);
                        else if (prefix === 'time') void handleDeleteTimeline(itemId);
                        else if (prefix === 'guru') void handleDeleteTeacher(itemId);
                        else if (prefix === 'gal') void handleDeleteGallery(itemId);
                        else if (prefix === 'testi') void handleDeleteTestimonial(itemId);
                        else if (prefix === 'faq') void handleDeleteFaq(itemId);
                        else if (prefix === 'reg') void handleDeleteReg(itemId);
                      }}
                      className="px-4 py-1.5 rounded-full bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold cursor-pointer"
                    >
                      {saving ? 'Menghapus...' : 'Ya, Hapus Sekarang'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmDeleteKey(null)}
                      className="px-4 py-1.5 rounded-full bg-white border border-rose-200 text-slate-800 text-xs font-bold cursor-pointer"
                    >
                      Batal
                    </button>
                  </div>
                </div>
              )}

              {/* TAB 0: IDENTITAS TK, HERO, VIDEO, PPDB & KEPALA SEKOLAH */}
              {activeTab === 'identitas' && (
                <form onSubmit={handleSaveSchoolInfo} className="space-y-5">
                  <p className="text-sm text-slate-600">
                    Ubah teks &amp; foto Hero depan, nama TK, identitas resmi, sambutan Kepala
                    Sekolah, video profil, deadline PPDB, kontak, dan peta Google Maps. Perubahan
                    langsung sinkron ke seluruh website.
                  </p>

                  {/* Hero Depan */}
                  <div className="p-4 rounded-2xl bg-[#fffbeb] border border-amber-200 space-y-3">
                    <h4 className="font-display font-bold text-slate-900">
                      Hero / Banner Utama Halaman Depan
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Badge Atas Hero (PPDB)
                        </label>
                        <input
                          type="text"
                          maxLength={120}
                          value={schoolForm.heroBadge || ''}
                          onChange={(e) =>
                            setSchoolForm((p) => ({ ...p, heroBadge: e.target.value }))
                          }
                          placeholder="PPDB 2026/2027 Dibuka — Kuota Terbatas!"
                          className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-amber-200 text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Judul Utama Hero
                        </label>
                        <input
                          type="text"
                          maxLength={160}
                          value={schoolForm.heroTitle || ''}
                          onChange={(e) =>
                            setSchoolForm((p) => ({ ...p, heroTitle: e.target.value }))
                          }
                          className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-amber-200 text-sm"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Subjudul / Deskripsi Singkat Hero
                      </label>
                      <textarea
                        rows={2}
                        maxLength={400}
                        value={schoolForm.heroSubtitle || ''}
                        onChange={(e) =>
                          setSchoolForm((p) => ({ ...p, heroSubtitle: e.target.value }))
                        }
                        className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-amber-200 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        URL / Path Foto Hero
                      </label>
                      <div className="flex items-center gap-3">
                        <img
                          src={schoolForm.heroImage || HERO_IMAGES.main}
                          alt="Preview Hero"
                          className="w-16 h-12 rounded-xl object-cover border border-amber-200 shrink-0 bg-white"
                        />
                        <input
                          type="text"
                          maxLength={400}
                          value={schoolForm.heroImage || ''}
                          onChange={(e) =>
                            setSchoolForm((p) => ({ ...p, heroImage: e.target.value }))
                          }
                          placeholder={HERO_IMAGES.main}
                          className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-amber-200 text-sm"
                        />
                      </div>
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {LOCAL_SCHOOL_PHOTOS.map((preset) => (
                          <button
                            key={`hero-${preset.path}`}
                            type="button"
                            onClick={() =>
                              setSchoolForm((p) => ({ ...p, heroImage: preset.path }))
                            }
                            className="px-2.5 py-1 rounded-full bg-white hover:bg-amber-100 border border-amber-200 text-[11px] font-bold text-slate-700 cursor-pointer"
                          >
                            {preset.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-[#fffbeb] border border-amber-200 space-y-3">
                    <h4 className="font-display font-bold text-slate-900">Identitas Utama TK</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Nama Sekolah TK *
                        </label>
                        <input
                          type="text"
                          required
                          maxLength={100}
                          value={schoolForm.name}
                          onChange={(e) => setSchoolForm((p) => ({ ...p, name: e.target.value }))}
                          className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-amber-200 text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Tagline Singkat *
                        </label>
                        <input
                          type="text"
                          required
                          maxLength={140}
                          value={schoolForm.shortTagline}
                          onChange={(e) =>
                            setSchoolForm((p) => ({ ...p, shortTagline: e.target.value }))
                          }
                          className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-amber-200 text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">NPSN *</label>
                        <input
                          type="text"
                          required
                          maxLength={30}
                          value={schoolForm.npsn}
                          onChange={(e) => setSchoolForm((p) => ({ ...p, npsn: e.target.value }))}
                          className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-amber-200 text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Akreditasi *
                        </label>
                        <input
                          type="text"
                          required
                          maxLength={60}
                          value={schoolForm.accreditation}
                          onChange={(e) =>
                            setSchoolForm((p) => ({ ...p, accreditation: e.target.value }))
                          }
                          className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-amber-200 text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Kurikulum *
                        </label>
                        <input
                          type="text"
                          required
                          maxLength={80}
                          value={schoolForm.curriculum}
                          onChange={(e) =>
                            setSchoolForm((p) => ({ ...p, curriculum: e.target.value }))
                          }
                          className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-amber-200 text-sm"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">
                            Tahun Berdiri *
                          </label>
                          <input
                            type="number"
                            min={1900}
                            max={2100}
                            required
                            value={schoolForm.foundedYear}
                            onChange={(e) =>
                              setSchoolForm((p) => ({ ...p, foundedYear: Number(e.target.value) }))
                            }
                            className="w-full px-3 py-2.5 rounded-xl bg-white border border-amber-200 text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">
                            Pengalaman *
                          </label>
                          <input
                            type="text"
                            required
                            maxLength={40}
                            value={schoolForm.experienceYears}
                            onChange={(e) =>
                              setSchoolForm((p) => ({ ...p, experienceYears: e.target.value }))
                            }
                            className="w-full px-3 py-2.5 rounded-xl bg-white border border-amber-200 text-sm"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Statistik Anak Aktif *
                        </label>
                        <input
                          type="text"
                          required
                          maxLength={40}
                          value={schoolForm.studentCount}
                          onChange={(e) =>
                            setSchoolForm((p) => ({ ...p, studentCount: e.target.value }))
                          }
                          className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-amber-200 text-sm"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">
                            Jumlah Guru *
                          </label>
                          <input
                            type="text"
                            required
                            maxLength={40}
                            value={schoolForm.teacherCount}
                            onChange={(e) =>
                              setSchoolForm((p) => ({ ...p, teacherCount: e.target.value }))
                            }
                            className="w-full px-3 py-2.5 rounded-xl bg-white border border-amber-200 text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">
                            Rasio *
                          </label>
                          <input
                            type="text"
                            required
                            maxLength={30}
                            value={schoolForm.ratioText}
                            onChange={(e) =>
                              setSchoolForm((p) => ({ ...p, ratioText: e.target.value }))
                            }
                            className="w-full px-3 py-2.5 rounded-xl bg-white border border-amber-200 text-sm"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-[#fffbeb] border border-amber-200 space-y-3">
                    <h4 className="font-display font-bold text-slate-900">Kepala Sekolah</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Nama Kepala Sekolah &amp; Gelar *
                        </label>
                        <input
                          type="text"
                          required
                          maxLength={100}
                          value={schoolForm.principalName}
                          onChange={(e) =>
                            setSchoolForm((p) => ({ ...p, principalName: e.target.value }))
                          }
                          className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-amber-200 text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          URL Foto Kepala Sekolah (opsional)
                        </label>
                        <div className="flex items-center gap-2">
                          <img
                            src={schoolForm.principalPhoto || HERO_IMAGES.principal}
                            alt="Preview Kepala"
                            className="w-10 h-10 rounded-full object-cover border border-amber-200 shrink-0 bg-white"
                          />
                          <input
                            type="text"
                            maxLength={400}
                            placeholder={HERO_IMAGES.principal}
                            value={schoolForm.principalPhoto || ''}
                            onChange={(e) =>
                              setSchoolForm((p) => ({ ...p, principalPhoto: e.target.value }))
                            }
                            className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-amber-200 text-sm"
                          />
                        </div>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Sambutan Kepala Sekolah *
                      </label>
                      <textarea
                        rows={3}
                        required
                        maxLength={600}
                        value={schoolForm.principalQuote}
                        onChange={(e) =>
                          setSchoolForm((p) => ({ ...p, principalQuote: e.target.value }))
                        }
                        className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-amber-200 text-sm"
                      />
                    </div>
                  </div>

                  {/* Video Profil, PPDB Deadline & Peta */}
                  <div className="p-4 rounded-2xl bg-[#fffbeb] border border-amber-200 space-y-3">
                    <h4 className="font-display font-bold text-slate-900">
                      Video Profil, Batas Waktu PPDB &amp; Peta Lokasi
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          YouTube Video ID (misal: M7lc1UVf-VE)
                        </label>
                        <input
                          type="text"
                          maxLength={60}
                          value={schoolForm.youtubeVideoId}
                          onChange={(e) =>
                            setSchoolForm((p) => ({ ...p, youtubeVideoId: e.target.value }))
                          }
                          className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-amber-200 text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Batas Akhir Gelombang PPDB (ISO Date)
                        </label>
                        <input
                          type="text"
                          maxLength={40}
                          value={schoolForm.ppdbDeadlineIso}
                          onChange={(e) =>
                            setSchoolForm((p) => ({ ...p, ppdbDeadlineIso: e.target.value }))
                          }
                          placeholder="2026-12-20T23:59:59+07:00"
                          className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-amber-200 text-sm"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        URL / Path Gambar Thumbnail Video Profil
                      </label>
                      <div className="flex items-center gap-3">
                        <img
                          src={schoolForm.videoThumbnail || HERO_IMAGES.team}
                          alt="Preview Video Thumbnail"
                          className="w-16 h-12 rounded-xl object-cover border border-amber-200 shrink-0 bg-white"
                        />
                        <input
                          type="text"
                          maxLength={400}
                          value={schoolForm.videoThumbnail || ''}
                          onChange={(e) =>
                            setSchoolForm((p) => ({ ...p, videoThumbnail: e.target.value }))
                          }
                          placeholder={HERO_IMAGES.team}
                          className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-amber-200 text-sm"
                        />
                      </div>
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {LOCAL_SCHOOL_PHOTOS.map((preset) => (
                          <button
                            key={`vid-${preset.path}`}
                            type="button"
                            onClick={() =>
                              setSchoolForm((p) => ({ ...p, videoThumbnail: preset.path }))
                            }
                            className="px-2.5 py-1 rounded-full bg-white hover:bg-amber-100 border border-amber-200 text-[11px] font-bold text-slate-700 cursor-pointer"
                          >
                            {preset.label}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        URL Embed Google Maps (iframe src)
                      </label>
                      <input
                        type="text"
                        maxLength={500}
                        value={schoolForm.mapsEmbedUrl}
                        onChange={(e) =>
                          setSchoolForm((p) => ({ ...p, mapsEmbedUrl: e.target.value }))
                        }
                        className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-amber-200 text-sm"
                      />
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-[#fffbeb] border border-amber-200 space-y-3">
                    <h4 className="font-display font-bold text-slate-900">
                      Alamat, Kontak &amp; Jam Sekolah
                    </h4>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Alamat Lengkap Sekolah *
                      </label>
                      <textarea
                        rows={2}
                        required
                        maxLength={300}
                        value={schoolForm.address}
                        onChange={(e) => setSchoolForm((p) => ({ ...p, address: e.target.value }))}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-amber-200 text-sm"
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          No. WA (format 628...) *
                        </label>
                        <input
                          type="text"
                          required
                          maxLength={20}
                          value={schoolForm.whatsappRaw}
                          onChange={(e) =>
                            setSchoolForm((p) => ({ ...p, whatsappRaw: e.target.value }))
                          }
                          className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-amber-200 text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          No. WA Tampilan *
                        </label>
                        <input
                          type="text"
                          required
                          maxLength={25}
                          value={schoolForm.whatsappDisplay}
                          onChange={(e) =>
                            setSchoolForm((p) => ({ ...p, whatsappDisplay: e.target.value }))
                          }
                          className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-amber-200 text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Email</label>
                        <input
                          type="email"
                          maxLength={120}
                          value={schoolForm.email}
                          onChange={(e) => setSchoolForm((p) => ({ ...p, email: e.target.value }))}
                          className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-amber-200 text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Instagram
                        </label>
                        <input
                          type="text"
                          maxLength={60}
                          value={schoolForm.instagramHandle}
                          onChange={(e) =>
                            setSchoolForm((p) => ({ ...p, instagramHandle: e.target.value }))
                          }
                          className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-amber-200 text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Facebook
                        </label>
                        <input
                          type="text"
                          maxLength={80}
                          value={schoolForm.facebookName}
                          onChange={(e) =>
                            setSchoolForm((p) => ({ ...p, facebookName: e.target.value }))
                          }
                          className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-amber-200 text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          YouTube
                        </label>
                        <input
                          type="text"
                          maxLength={80}
                          value={schoolForm.youtubeName}
                          onChange={(e) =>
                            setSchoolForm((p) => ({ ...p, youtubeName: e.target.value }))
                          }
                          className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-amber-200 text-sm"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Jam Belajar Kelompok A &amp; KB
                        </label>
                        <input
                          type="text"
                          maxLength={120}
                          value={schoolForm.schoolHoursA}
                          onChange={(e) =>
                            setSchoolForm((p) => ({ ...p, schoolHoursA: e.target.value }))
                          }
                          className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-amber-200 text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Jam Belajar Kelompok B
                        </label>
                        <input
                          type="text"
                          maxLength={120}
                          value={schoolForm.schoolHoursB}
                          onChange={(e) =>
                            setSchoolForm((p) => ({ ...p, schoolHoursB: e.target.value }))
                          }
                          className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-amber-200 text-sm"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Jam Layanan Orang Tua
                      </label>
                      <input
                        type="text"
                        maxLength={140}
                        value={schoolForm.serviceHours}
                        onChange={(e) =>
                          setSchoolForm((p) => ({ ...p, serviceHours: e.target.value }))
                        }
                        className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-amber-200 text-sm"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={saving}
                      className="px-6 py-2.5 rounded-full bg-[#facc15] hover:bg-[#eab308] text-slate-900 font-bold text-sm cursor-pointer"
                    >
                      {saving ? 'Menyimpan...' : 'Simpan Semua Identitas, Hero & Kontak'}
                    </button>
                  </div>
                </form>
              )}

              {/* TAB: KEUNGGULAN */}
              {activeTab === 'keunggulan' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm text-slate-600">
                      Kelola kartu Keunggulan (Kenapa Pilih Sekolah Kami).
                    </p>
                    <button
                      type="button"
                      onClick={openAddAdvantage}
                      className="px-4 py-2.5 rounded-full bg-[#facc15] hover:bg-[#eab308] text-slate-900 font-bold text-xs sm:text-sm inline-flex items-center gap-1.5 cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Tambah Keunggulan</span>
                    </button>
                  </div>

                  {advantageFormMode !== 'closed' && (
                    <form
                      onSubmit={handleSaveAdvantage}
                      className="p-4 rounded-2xl bg-[#fffbeb] border-2 border-[#facc15] space-y-3"
                    >
                      <h4 className="font-display font-bold text-slate-900">
                        {advantageFormMode === 'add' ? 'Tambah Kartu Keunggulan' : 'Edit Keunggulan'}
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <input
                          type="text"
                          required
                          maxLength={16}
                          placeholder="Emoji (misal: 🌱)"
                          value={advantageForm.emoji}
                          onChange={(e) =>
                            setAdvantageForm((p) => ({ ...p, emoji: e.target.value }))
                          }
                          className="px-3.5 py-2.5 rounded-xl bg-white border border-amber-200 text-sm"
                        />
                        <input
                          type="text"
                          required
                          maxLength={100}
                          placeholder="Judul Keunggulan *"
                          value={advantageForm.title}
                          onChange={(e) =>
                            setAdvantageForm((p) => ({ ...p, title: e.target.value }))
                          }
                          className="sm:col-span-2 px-3.5 py-2.5 rounded-xl bg-white border border-amber-200 text-sm"
                        />
                      </div>
                      <textarea
                        rows={2}
                        required
                        maxLength={400}
                        placeholder="Deskripsi keunggulan *"
                        value={advantageForm.description}
                        onChange={(e) =>
                          setAdvantageForm((p) => ({ ...p, description: e.target.value }))
                        }
                        className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-amber-200 text-sm"
                      />
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5">
                          Warna Ikon Kartu
                        </label>
                        <div className="flex flex-wrap gap-2">
                          {ADVANTAGE_THEMES.map((theme) => (
                            <button
                              key={theme.label}
                              type="button"
                              onClick={() =>
                                setAdvantageForm((p) => ({
                                  ...p,
                                  bgClass: theme.bgClass,
                                  borderClass: theme.borderClass,
                                }))
                              }
                              className={`px-3 py-1.5 rounded-full text-xs font-bold border ${theme.bgClass} ${
                                advantageForm.bgClass === theme.bgClass
                                  ? 'ring-2 ring-slate-900 border-slate-900'
                                  : theme.borderClass
                              } cursor-pointer`}
                            >
                              {theme.label}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setAdvantageFormMode('closed')}
                          className="px-4 py-2 rounded-full bg-white border border-slate-300 text-xs font-bold cursor-pointer"
                        >
                          Batal
                        </button>
                        <button
                          type="submit"
                          disabled={saving}
                          className="px-5 py-2 rounded-full bg-[#facc15] text-slate-900 text-xs font-bold cursor-pointer"
                        >
                          {saving ? 'Menyimpan...' : 'Simpan Keunggulan'}
                        </button>
                      </div>
                    </form>
                  )}

                  <div className="space-y-2.5">
                    {advantages.map((a) => {
                      const delKey = `adv:${a.id}`;
                      return (
                        <div
                          key={a.id}
                          className="p-4 rounded-2xl border border-slate-200 flex flex-wrap items-center justify-between gap-3"
                        >
                          <div className="max-w-xl">
                            <p className="font-display font-bold text-slate-900">
                              {a.emoji} {a.title}
                            </p>
                            <p className="text-xs text-slate-600 mt-0.5">{a.description}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => openEditAdvantage(a)}
                              className="px-3.5 py-1.5 rounded-full bg-[#e0f2fe] text-slate-900 text-xs font-bold inline-flex items-center gap-1 cursor-pointer"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                              <span>Edit</span>
                            </button>
                            {confirmDeleteKey === delKey ? (
                              <span className="inline-flex gap-1.5">
                                <button
                                  type="button"
                                  disabled={saving}
                                  onClick={() => handleDeleteAdvantage(a.id)}
                                  className="px-3 py-1.5 rounded-full bg-rose-600 text-white text-xs font-bold cursor-pointer"
                                >
                                  Ya, Hapus
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setConfirmDeleteKey(null)}
                                  className="px-3 py-1.5 rounded-full bg-slate-200 text-slate-800 text-xs font-bold cursor-pointer"
                                >
                                  Batal
                                </button>
                              </span>
                            ) : (
                              <button
                                type="button"
                                onClick={() => setConfirmDeleteKey(delKey)}
                                className="px-3.5 py-1.5 rounded-full bg-rose-50 text-rose-700 text-xs font-bold inline-flex items-center gap-1 cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>Hapus</span>
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* TAB: PROGRAM & KELAS */}
              {activeTab === 'program' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm text-slate-600">
                      Kelola daftar Program &amp; Kelas, biaya, poin kegiatan, dan jadwal mingguan.
                    </p>
                    <button
                      type="button"
                      onClick={openAddProgram}
                      className="px-4 py-2.5 rounded-full bg-[#facc15] hover:bg-[#eab308] text-slate-900 font-bold text-xs sm:text-sm inline-flex items-center gap-1.5 cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Tambah Program</span>
                    </button>
                  </div>

                  {programFormMode !== 'closed' && (
                    <form
                      onSubmit={handleSaveProgram}
                      className="p-4 rounded-2xl bg-[#fffbeb] border-2 border-[#facc15] space-y-3"
                    >
                      <h4 className="font-display font-bold text-slate-900">
                        {programFormMode === 'add'
                          ? 'Tambah Program & Kelas Baru'
                          : 'Edit Program & Kelas'}
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <input
                          type="text"
                          required
                          maxLength={16}
                          placeholder="Emoji (misal: 🧸)"
                          value={programForm.emoji}
                          onChange={(e) =>
                            setProgramForm((p) => ({ ...p, emoji: e.target.value }))
                          }
                          className="px-3.5 py-2.5 rounded-xl bg-white border border-amber-200 text-sm"
                        />
                        <input
                          type="text"
                          required
                          maxLength={100}
                          placeholder="Nama Program (misal: Kelompok A) *"
                          value={programForm.name}
                          onChange={(e) =>
                            setProgramForm((p) => ({ ...p, name: e.target.value }))
                          }
                          className="sm:col-span-2 px-3.5 py-2.5 rounded-xl bg-white border border-amber-200 text-sm"
                        />
                        <input
                          type="text"
                          disabled={programFormMode === 'edit'}
                          maxLength={40}
                          placeholder="Kode unik (misal: kelompok_c, opsional)"
                          value={programForm.code}
                          onChange={(e) =>
                            setProgramForm((p) => ({ ...p, code: e.target.value }))
                          }
                          className="px-3.5 py-2.5 rounded-xl bg-white disabled:bg-slate-100 border border-amber-200 text-sm"
                        />
                        <input
                          type="text"
                          required
                          maxLength={60}
                          placeholder="Rentang Usia (misal: Usia 4 - 5 Tahun) *"
                          value={programForm.ageRange}
                          onChange={(e) =>
                            setProgramForm((p) => ({ ...p, ageRange: e.target.value }))
                          }
                          className="px-3.5 py-2.5 rounded-xl bg-white border border-amber-200 text-sm"
                        />
                        <input
                          type="text"
                          required
                          maxLength={100}
                          placeholder="Jam Belajar *"
                          value={programForm.scheduleHours}
                          onChange={(e) =>
                            setProgramForm((p) => ({ ...p, scheduleHours: e.target.value }))
                          }
                          className="px-3.5 py-2.5 rounded-xl bg-white border border-amber-200 text-sm"
                        />
                        <input
                          type="text"
                          required
                          maxLength={80}
                          placeholder="Ringkasan Biaya (misal: Rp 300.000 / bulan)"
                          value={programForm.feeSummary}
                          onChange={(e) =>
                            setProgramForm((p) => ({ ...p, feeSummary: e.target.value }))
                          }
                          className="px-3.5 py-2.5 rounded-xl bg-white border border-amber-200 text-sm"
                        />
                        <input
                          type="text"
                          maxLength={140}
                          placeholder="Info Pendaftaran"
                          value={programForm.registrationFee}
                          onChange={(e) =>
                            setProgramForm((p) => ({ ...p, registrationFee: e.target.value }))
                          }
                          className="px-3.5 py-2.5 rounded-xl bg-white border border-amber-200 text-sm"
                        />
                        <input
                          type="text"
                          maxLength={140}
                          placeholder="Rincian SPP Bulanan"
                          value={programForm.monthlyFee}
                          onChange={(e) =>
                            setProgramForm((p) => ({ ...p, monthlyFee: e.target.value }))
                          }
                          className="px-3.5 py-2.5 rounded-xl bg-white border border-amber-200 text-sm"
                        />
                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 mb-1">
                            Kapasitas Maksimal / Kelas
                          </label>
                          <input
                            type="number"
                            min={1}
                            max={100}
                            required
                            value={programForm.maxPerClass}
                            onChange={(e) =>
                              setProgramForm((p) => ({
                                ...p,
                                maxPerClass: Number(e.target.value),
                              }))
                            }
                            className="w-full px-3 py-2 rounded-xl bg-white border border-amber-200 text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 mb-1">
                            Kursi Terisi Awal
                          </label>
                          <input
                            type="number"
                            min={0}
                            max={programForm.maxPerClass}
                            value={programForm.defaultEnrolled}
                            onChange={(e) =>
                              setProgramForm((p) => ({
                                ...p,
                                defaultEnrolled: Number(e.target.value),
                              }))
                            }
                            className="w-full px-3 py-2 rounded-xl bg-white border border-amber-200 text-sm"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Tema Warna Kartu Program
                        </label>
                        <div className="flex flex-wrap gap-2">
                          {PROGRAM_THEMES.map((t, idx) => (
                            <button
                              key={t.label}
                              type="button"
                              onClick={() =>
                                setProgramForm((p) => ({ ...p, themeIndex: idx }))
                              }
                              className={`px-3 py-1.5 rounded-full text-xs font-bold border ${t.accentBg} ${
                                programForm.themeIndex === idx
                                  ? 'ring-2 ring-slate-900 border-slate-900'
                                  : t.accentBorder
                              } cursor-pointer`}
                            >
                              {t.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      <textarea
                        rows={2}
                        required
                        maxLength={400}
                        placeholder="Deskripsi singkat program *"
                        value={programForm.summary}
                        onChange={(e) =>
                          setProgramForm((p) => ({ ...p, summary: e.target.value }))
                        }
                        className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-amber-200 text-sm"
                      />

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Poin Fokus Pembelajaran (1 baris = 1 poin, maks 10 baris)
                        </label>
                        <textarea
                          rows={3}
                          value={programForm.highlightsText}
                          onChange={(e) =>
                            setProgramForm((p) => ({ ...p, highlightsText: e.target.value }))
                          }
                          className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-amber-200 text-sm"
                        />
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-bold text-slate-700">
                            Jadwal Mingguan (Tombol &ldquo;Lihat Jadwal Kelas&rdquo;)
                          </label>
                          {programForm.scheduleRows.length < 7 && (
                            <button
                              type="button"
                              onClick={() =>
                                setProgramForm((p) => ({
                                  ...p,
                                  scheduleRows: [
                                    ...p.scheduleRows,
                                    { day: 'Sabtu', activity: 'Ekstrakurikuler Pilihan' },
                                  ],
                                }))
                              }
                              className="px-2.5 py-1 rounded-full bg-white border border-amber-300 text-xs font-bold text-slate-700 cursor-pointer"
                            >
                              + Tambah Hari
                            </button>
                          )}
                        </div>
                        {programForm.scheduleRows.map((row, idx) => (
                          <div key={idx} className="flex items-center gap-2">
                            <input
                              type="text"
                              maxLength={30}
                              placeholder="Hari"
                              value={row.day}
                              onChange={(e) => {
                                const val = e.target.value;
                                setProgramForm((p) => ({
                                  ...p,
                                  scheduleRows: p.scheduleRows.map((r, i) =>
                                    i === idx ? { ...r, day: val } : r
                                  ),
                                }));
                              }}
                              className="w-28 px-3 py-2 rounded-xl bg-white border border-amber-200 text-xs font-bold"
                            />
                            <input
                              type="text"
                              maxLength={200}
                              placeholder="Aktivitas belajar..."
                              value={row.activity}
                              onChange={(e) => {
                                const val = e.target.value;
                                setProgramForm((p) => ({
                                  ...p,
                                  scheduleRows: p.scheduleRows.map((r, i) =>
                                    i === idx ? { ...r, activity: val } : r
                                  ),
                                }));
                              }}
                              className="flex-1 px-3 py-2 rounded-xl bg-white border border-amber-200 text-xs"
                            />
                            {programForm.scheduleRows.length > 1 && (
                              <button
                                type="button"
                                onClick={() =>
                                  setProgramForm((p) => ({
                                    ...p,
                                    scheduleRows: p.scheduleRows.filter((_, i) => i !== idx),
                                  }))
                                }
                                className="px-2.5 py-2 rounded-xl bg-rose-50 text-rose-700 text-xs font-bold cursor-pointer"
                              >
                                Hapus
                              </button>
                            )}
                          </div>
                        ))}
                      </div>

                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setProgramFormMode('closed')}
                          className="px-4 py-2 rounded-full bg-white border border-slate-300 text-xs font-bold cursor-pointer"
                        >
                          Batal
                        </button>
                        <button
                          type="submit"
                          disabled={saving}
                          className="px-5 py-2 rounded-full bg-[#facc15] text-slate-900 text-xs font-bold cursor-pointer"
                        >
                          {saving ? 'Menyimpan...' : 'Simpan Program'}
                        </button>
                      </div>
                    </form>
                  )}

                  <div className="space-y-2.5">
                    {programs.map((p) => {
                      const delKey = `prog:${p.code}`;
                      return (
                        <div
                          key={p.code}
                          className="p-4 rounded-2xl border border-slate-200 flex flex-wrap items-center justify-between gap-3"
                        >
                          <div className="max-w-xl">
                            <p className="font-display font-bold text-slate-900">
                              {p.emoji} {p.name}{' '}
                              <span className="text-xs font-semibold text-slate-500">
                                ({p.ageRange} · {p.feeSummary})
                              </span>
                            </p>
                            <p className="text-xs text-slate-600 mt-0.5">
                              {p.scheduleHours} · Maks {p.maxPerClass} anak/kelas
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => openEditProgram(p)}
                              className="px-3.5 py-1.5 rounded-full bg-[#e0f2fe] text-slate-900 text-xs font-bold inline-flex items-center gap-1 cursor-pointer"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                              <span>Edit</span>
                            </button>
                            {confirmDeleteKey === delKey ? (
                              <span className="inline-flex gap-1.5">
                                <button
                                  type="button"
                                  disabled={saving}
                                  onClick={() => handleDeleteProgram(p.code)}
                                  className="px-3 py-1.5 rounded-full bg-rose-600 text-white text-xs font-bold cursor-pointer"
                                >
                                  Ya, Hapus
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setConfirmDeleteKey(null)}
                                  className="px-3 py-1.5 rounded-full bg-slate-200 text-slate-800 text-xs font-bold cursor-pointer"
                                >
                                  Batal
                                </button>
                              </span>
                            ) : (
                              <button
                                type="button"
                                onClick={() => setConfirmDeleteKey(delKey)}
                                className="px-3.5 py-1.5 rounded-full bg-rose-50 text-rose-700 text-xs font-bold inline-flex items-center gap-1 cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>Hapus</span>
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* TAB: JADWAL HARIAN (TIMELINE) */}
              {activeTab === 'timeline' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm text-slate-600">
                      Kelola alur kegiatan &ldquo;Sehari di TK Kami&rdquo;.
                    </p>
                    <button
                      type="button"
                      onClick={openAddTimeline}
                      className="px-4 py-2.5 rounded-full bg-[#facc15] hover:bg-[#eab308] text-slate-900 font-bold text-xs sm:text-sm inline-flex items-center gap-1.5 cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Tambah Aktivitas</span>
                    </button>
                  </div>

                  {timelineFormMode !== 'closed' && (
                    <form
                      onSubmit={handleSaveTimeline}
                      className="p-4 rounded-2xl bg-[#fffbeb] border-2 border-[#facc15] space-y-3"
                    >
                      <h4 className="font-display font-bold text-slate-900">
                        {timelineFormMode === 'add'
                          ? 'Tambah Aktivitas Harian'
                          : 'Edit Aktivitas Harian'}
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                        <input
                          type="text"
                          required
                          maxLength={20}
                          placeholder="Jam (misal: 08.00) *"
                          value={timelineForm.time}
                          onChange={(e) =>
                            setTimelineForm((p) => ({ ...p, time: e.target.value }))
                          }
                          className="px-3.5 py-2.5 rounded-xl bg-white border border-amber-200 text-sm"
                        />
                        <input
                          type="text"
                          required
                          maxLength={16}
                          placeholder="Emoji (misal: 🧩)"
                          value={timelineForm.emoji}
                          onChange={(e) =>
                            setTimelineForm((p) => ({ ...p, emoji: e.target.value }))
                          }
                          className="px-3.5 py-2.5 rounded-xl bg-white border border-amber-200 text-sm"
                        />
                        <input
                          type="text"
                          required
                          maxLength={100}
                          placeholder="Judul Aktivitas *"
                          value={timelineForm.title}
                          onChange={(e) =>
                            setTimelineForm((p) => ({ ...p, title: e.target.value }))
                          }
                          className="sm:col-span-2 px-3.5 py-2.5 rounded-xl bg-white border border-amber-200 text-sm"
                        />
                      </div>
                      <textarea
                        rows={2}
                        required
                        maxLength={300}
                        placeholder="Deskripsi singkat aktivitas *"
                        value={timelineForm.description}
                        onChange={(e) =>
                          setTimelineForm((p) => ({ ...p, description: e.target.value }))
                        }
                        className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-amber-200 text-sm"
                      />
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5">
                          Warna Badge Jam
                        </label>
                        <div className="flex flex-wrap gap-2">
                          {TIMELINE_COLORS.map((tc) => (
                            <button
                              key={tc.label}
                              type="button"
                              onClick={() => setTimelineForm((p) => ({ ...p, color: tc.color }))}
                              className={`px-3 py-1.5 rounded-full text-xs font-bold border ${tc.color} ${
                                timelineForm.color === tc.color
                                  ? 'ring-2 ring-slate-900 border-slate-900'
                                  : 'border-amber-200'
                              } cursor-pointer`}
                            >
                              {tc.label}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setTimelineFormMode('closed')}
                          className="px-4 py-2 rounded-full bg-white border border-slate-300 text-xs font-bold cursor-pointer"
                        >
                          Batal
                        </button>
                        <button
                          type="submit"
                          disabled={saving}
                          className="px-5 py-2 rounded-full bg-[#facc15] text-slate-900 text-xs font-bold cursor-pointer"
                        >
                          {saving ? 'Menyimpan...' : 'Simpan Aktivitas'}
                        </button>
                      </div>
                    </form>
                  )}

                  <div className="space-y-2.5">
                    {timelineSteps.map((s, idx) => {
                      const stepId = s.id || `step_${idx}`;
                      const delKey = `time:${stepId}`;
                      return (
                        <div
                          key={stepId}
                          className="p-4 rounded-2xl border border-slate-200 flex flex-wrap items-center justify-between gap-3"
                        >
                          <div className="max-w-xl">
                            <p className="font-display font-bold text-slate-900">
                              <span className="tabular-nums">{s.time}</span> · {s.emoji} {s.title}
                            </p>
                            <p className="text-xs text-slate-600 mt-0.5">{s.description}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => openEditTimeline(s, stepId)}
                              className="px-3.5 py-1.5 rounded-full bg-[#e0f2fe] text-slate-900 text-xs font-bold inline-flex items-center gap-1 cursor-pointer"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                              <span>Edit</span>
                            </button>
                            {confirmDeleteKey === delKey ? (
                              <span className="inline-flex gap-1.5">
                                <button
                                  type="button"
                                  disabled={saving}
                                  onClick={() => handleDeleteTimeline(stepId)}
                                  className="px-3 py-1.5 rounded-full bg-rose-600 text-white text-xs font-bold cursor-pointer"
                                >
                                  Ya, Hapus
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setConfirmDeleteKey(null)}
                                  className="px-3 py-1.5 rounded-full bg-slate-200 text-slate-800 text-xs font-bold cursor-pointer"
                                >
                                  Batal
                                </button>
                              </span>
                            ) : (
                              <button
                                type="button"
                                onClick={() => setConfirmDeleteKey(delKey)}
                                className="px-3.5 py-1.5 rounded-full bg-rose-50 text-rose-700 text-xs font-bold inline-flex items-center gap-1 cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>Hapus</span>
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* TAB 1: PENDAFTAR PPDB */}
              {activeTab === 'pendaftar' && (
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={openAddReg}
                        className="px-4 py-2.5 rounded-full bg-[#facc15] hover:bg-[#eab308] text-slate-900 font-bold text-xs sm:text-sm inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Tambah Pendaftar</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleExportCsv}
                        disabled={filteredRegistrations.length === 0}
                        className="px-4 py-2.5 rounded-full bg-[#86efac] hover:bg-[#4ade80] disabled:opacity-50 text-slate-900 font-bold text-xs sm:text-sm inline-flex items-center gap-1.5 cursor-pointer"
                      >
                        <Download className="w-4 h-4" />
                        <span>Unduh CSV</span>
                      </button>
                    </div>

                    <span className="text-xs font-bold text-slate-600 tabular-nums">
                      Total: {registrations.length} Pendaftar
                    </span>
                  </div>

                  {/* Form Tambah / Edit Pendaftar */}
                  {regFormMode !== 'closed' && (
                    <form
                      onSubmit={handleSaveReg}
                      className="p-5 rounded-2xl bg-[#fffbeb] border-2 border-[#facc15] space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <h4 className="font-display text-lg font-bold text-slate-900">
                          {regFormMode === 'add' ? 'Tambah Pendaftar Baru' : 'Edit Data Pendaftar'}
                        </h4>
                        <button
                          type="button"
                          onClick={() => setRegFormMode('closed')}
                          className="text-xs font-bold text-slate-600 hover:text-slate-900 cursor-pointer"
                        >
                          Tutup Form
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <input
                          type="text"
                          required
                          placeholder="Nama Lengkap Anak *"
                          value={regForm.childName}
                          onChange={(e) => setRegForm((p) => ({ ...p, childName: e.target.value }))}
                          className="px-3.5 py-2.5 rounded-xl bg-white border border-amber-200 text-sm"
                        />
                        <input
                          type="date"
                          required
                          value={regForm.birthDate}
                          onChange={(e) => setRegForm((p) => ({ ...p, birthDate: e.target.value }))}
                          className="px-3.5 py-2.5 rounded-xl bg-white border border-amber-200 text-sm"
                        />
                        <select
                          value={regForm.gender}
                          onChange={(e) =>
                            setRegForm((p) => ({
                              ...p,
                              gender: e.target.value as 'Laki-laki' | 'Perempuan',
                            }))
                          }
                          className="px-3.5 py-2.5 rounded-xl bg-white border border-amber-200 text-sm"
                        >
                          <option value="Laki-laki">Laki-laki</option>
                          <option value="Perempuan">Perempuan</option>
                        </select>
                        <select
                          value={regForm.programCode}
                          onChange={(e) =>
                            setRegForm((p) => ({
                              ...p,
                              programCode: e.target.value as ProgramCode,
                            }))
                          }
                          className="px-3.5 py-2.5 rounded-xl bg-white border border-amber-200 text-sm"
                        >
                          {programs.map((prog) => (
                            <option key={prog.code} value={prog.code}>
                              {prog.name}
                            </option>
                          ))}
                        </select>
                        <input
                          type="text"
                          required
                          placeholder="Nama Ayah *"
                          value={regForm.fatherName}
                          onChange={(e) => setRegForm((p) => ({ ...p, fatherName: e.target.value }))}
                          className="px-3.5 py-2.5 rounded-xl bg-white border border-amber-200 text-sm"
                        />
                        <input
                          type="text"
                          required
                          placeholder="Nama Ibu *"
                          value={regForm.motherName}
                          onChange={(e) => setRegForm((p) => ({ ...p, motherName: e.target.value }))}
                          className="px-3.5 py-2.5 rounded-xl bg-white border border-amber-200 text-sm"
                        />
                        <input
                          type="tel"
                          required
                          placeholder="No. WhatsApp Ortu *"
                          value={regForm.parentWhatsapp}
                          onChange={(e) =>
                            setRegForm((p) => ({ ...p, parentWhatsapp: e.target.value }))
                          }
                          className="px-3.5 py-2.5 rounded-xl bg-white border border-amber-200 text-sm"
                        />
                        <select
                          value={regForm.status}
                          onChange={(e) =>
                            setRegForm((p) => ({
                              ...p,
                              status: e.target.value as RegistrationStatus,
                            }))
                          }
                          className="px-3.5 py-2.5 rounded-xl bg-white border border-amber-200 text-sm"
                        >
                          <option value="menunggu">Menunggu Konfirmasi</option>
                          <option value="jadwal_trial">Jadwal Trial</option>
                          <option value="diterima">Diterima</option>
                          <option value="batal">Batal</option>
                        </select>
                        <input
                          type="text"
                          placeholder="Jadwal Trial (opsional)"
                          value={regForm.trialDate}
                          onChange={(e) => setRegForm((p) => ({ ...p, trialDate: e.target.value }))}
                          className="px-3.5 py-2.5 rounded-xl bg-white border border-amber-200 text-sm"
                        />
                      </div>

                      <input
                        type="text"
                        required
                        placeholder="Alamat Lengkap *"
                        value={regForm.address}
                        onChange={(e) => setRegForm((p) => ({ ...p, address: e.target.value }))}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-amber-200 text-sm"
                      />

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <input
                          type="text"
                          placeholder="Catatan / Alergi Anak (opsional)"
                          value={regForm.notes}
                          onChange={(e) => setRegForm((p) => ({ ...p, notes: e.target.value }))}
                          className="px-3.5 py-2.5 rounded-xl bg-white border border-amber-200 text-sm"
                        />
                        <input
                          type="text"
                          placeholder="Catatan Admin Panitia (opsional)"
                          value={regForm.adminNotes}
                          onChange={(e) => setRegForm((p) => ({ ...p, adminNotes: e.target.value }))}
                          className="px-3.5 py-2.5 rounded-xl bg-white border border-amber-200 text-sm"
                        />
                      </div>

                      <div className="flex items-center justify-between pt-2">
                        <label className="inline-flex items-center gap-2 text-xs font-bold text-slate-800 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={regForm.wantsTrial}
                            onChange={(e) =>
                              setRegForm((p) => ({ ...p, wantsTrial: e.target.checked }))
                            }
                            className="w-4 h-4 accent-[#ea580c]"
                          />
                          <span>Ikut Trial Gratis 1 Hari</span>
                        </label>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => setRegFormMode('closed')}
                            className="px-4 py-2 rounded-full bg-white border border-slate-300 text-xs font-bold cursor-pointer"
                          >
                            Batal
                          </button>
                          <button
                            type="submit"
                            disabled={saving}
                            className="px-5 py-2 rounded-full bg-[#facc15] hover:bg-[#eab308] text-slate-900 text-xs font-bold cursor-pointer"
                          >
                            {saving ? 'Menyimpan...' : 'Simpan Data'}
                          </button>
                        </div>
                      </div>
                    </form>
                  )}

                  {/* Filter Controls */}
                  <div className="flex flex-col sm:flex-row gap-2.5">
                    <div className="relative flex-1">
                      <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="search"
                        value={regSearch}
                        onChange={(e) => setRegSearch(e.target.value)}
                        placeholder="Cari nama anak, kode daftar, atau nomor WA..."
                        className="w-full pl-9 pr-4 py-2.5 rounded-full border border-slate-200 text-sm focus:border-[#fb923c] focus:outline-none"
                      />
                    </div>
                    <select
                      value={filterProgram}
                      onChange={(e) =>
                        setFilterProgram(e.target.value as 'all' | ProgramCode)
                      }
                      className="px-4 py-2.5 rounded-full border border-slate-200 text-sm font-semibold bg-white"
                    >
                      <option value="all">Semua Kelompok</option>
                      {programs.map((prog) => (
                        <option key={prog.code} value={prog.code}>
                          {prog.name}
                        </option>
                      ))}
                    </select>
                    <select
                      value={filterStatus}
                      onChange={(e) =>
                        setFilterStatus(e.target.value as 'all' | RegistrationStatus)
                      }
                      className="px-4 py-2.5 rounded-full border border-slate-200 text-sm font-semibold bg-white"
                    >
                      <option value="all">Semua Status</option>
                      <option value="menunggu">Menunggu Konfirmasi</option>
                      <option value="jadwal_trial">Jadwal Trial</option>
                      <option value="diterima">Diterima</option>
                      <option value="batal">Batal</option>
                    </select>
                  </div>

                  {/* Registration List */}
                  {regLoading ? (
                    <p className="text-center py-8 text-sm text-slate-600">
                      Memuat daftar pendaftar...
                    </p>
                  ) : regError ? (
                    <p className="text-center py-8 text-sm font-bold text-rose-600">{regError}</p>
                  ) : filteredRegistrations.length === 0 ? (
                    <div className="text-center py-10 bg-[#fffbeb] rounded-2xl border border-amber-100">
                      <p className="font-display text-lg font-bold text-slate-800">
                        Belum ada data pendaftar
                      </p>
                      <p className="text-xs text-slate-600 mt-1">
                        Klik &ldquo;Tambah Pendaftar&rdquo; untuk menambahkan manual atau tunggu
                        pendaftar dari formulir website.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {filteredRegistrations.map((reg) => {
                        const badge = getStatusBadge(reg.status);
                        const delKey = `reg:${reg.id}`;
                        return (
                          <div
                            key={reg.id}
                            className="p-4 rounded-2xl border border-slate-200 bg-white space-y-2.5"
                          >
                            <div className="flex flex-wrap items-start justify-between gap-2">
                              <div>
                                <span className="font-display font-bold text-lg text-slate-900">
                                  {reg.childName}
                                </span>{' '}
                                <span className="text-xs font-bold text-slate-500 tabular-nums">
                                  · {reg.registrationCode}
                                </span>
                                <p className="text-xs sm:text-sm text-slate-600 font-semibold">
                                  {getProgramLabel(reg.programCode, programs)} · {reg.gender} · Lahir{' '}
                                  <span className="tabular-nums">{reg.birthDate}</span>
                                </p>
                              </div>
                              <span
                                className={`px-3 py-1 rounded-full text-xs font-bold border ${badge.cls}`}
                              >
                                {badge.label}
                              </span>
                            </div>

                            <div className="text-xs sm:text-sm text-slate-700 bg-[#fffbeb] p-3 rounded-xl grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                              <p>
                                <strong>Ortu:</strong> {reg.fatherName} &amp; {reg.motherName}
                              </p>
                              <p className="tabular-nums">
                                <strong>WA:</strong> {reg.parentWhatsapp}
                              </p>
                              <p className="sm:col-span-2">
                                <strong>Alamat:</strong> {reg.address}
                              </p>
                            </div>

                            <div className="flex flex-wrap items-center justify-end gap-2">
                              <a
                                href={`https://wa.me/${reg.parentWhatsapp.replace(/[^0-9]/g, '').replace(/^0/, '62')}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-3.5 py-1.5 rounded-full bg-[#dcfce7] hover:bg-[#bbf7d0] text-emerald-950 font-bold text-xs inline-flex items-center gap-1"
                              >
                                <MessageCircle className="w-3.5 h-3.5" />
                                <span>WA Ortu</span>
                              </a>
                              <button
                                type="button"
                                onClick={() => openEditReg(reg)}
                                className="px-3.5 py-1.5 rounded-full bg-[#e0f2fe] hover:bg-[#bae6fd] text-slate-900 font-bold text-xs inline-flex items-center gap-1 cursor-pointer"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                                <span>Edit</span>
                              </button>
                              {confirmDeleteKey === delKey ? (
                                <span className="inline-flex items-center gap-1.5">
                                  <button
                                    type="button"
                                    disabled={saving}
                                    onClick={() => handleDeleteReg(reg.id)}
                                    className="px-3 py-1.5 rounded-full bg-rose-600 text-white font-bold text-xs cursor-pointer"
                                  >
                                    Ya, Hapus
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setConfirmDeleteKey(null)}
                                    className="px-3 py-1.5 rounded-full bg-slate-200 text-slate-800 font-bold text-xs cursor-pointer"
                                  >
                                    Batal
                                  </button>
                                </span>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => setConfirmDeleteKey(delKey)}
                                  className="px-3.5 py-1.5 rounded-full bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs inline-flex items-center gap-1 cursor-pointer"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                  <span>Hapus</span>
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: KUOTA KELAS */}
              {activeTab === 'kuota' && (
                <form onSubmit={handleSaveQuotas} className="space-y-4">
                  <p className="text-sm text-slate-600">
                    Ubah kapasitas maksimal dan jumlah kursi terisi yang tampil secara real-time di
                    halaman depan.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {programs.map((prog) => {
                      const entry = quotaDraft[prog.code] ?? {
                        capacity: prog.maxPerClass,
                        enrolledCount: prog.defaultEnrolled,
                      };
                      return (
                        <div
                          key={prog.code}
                          className="p-4 rounded-2xl bg-[#fffbeb] border border-amber-200 space-y-3"
                        >
                          <h4 className="font-display font-bold text-slate-900">
                            {prog.emoji} {prog.name}
                          </h4>
                          <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">
                              Kapasitas Kursi
                            </label>
                            <input
                              type="number"
                              min={1}
                              max={100}
                              value={entry.capacity}
                              onChange={(e) =>
                                setQuotaDraft((prev) => ({
                                  ...prev,
                                  [prog.code]: {
                                    capacity: Number(e.target.value),
                                    enrolledCount: entry.enrolledCount,
                                  },
                                }))
                              }
                              className="w-full px-3 py-2 rounded-xl bg-white border border-amber-200 text-sm tabular-nums"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">
                              Jumlah Terisi
                            </label>
                            <input
                              type="number"
                              min={0}
                              max={entry.capacity}
                              value={entry.enrolledCount}
                              onChange={(e) =>
                                setQuotaDraft((prev) => ({
                                  ...prev,
                                  [prog.code]: {
                                    capacity: entry.capacity,
                                    enrolledCount: Number(e.target.value),
                                  },
                                }))
                              }
                              className="w-full px-3 py-2 rounded-xl bg-white border border-amber-200 text-sm tabular-nums"
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={saving}
                      className="px-6 py-2.5 rounded-full bg-[#facc15] hover:bg-[#eab308] text-slate-900 font-bold text-sm cursor-pointer"
                    >
                      {saving ? 'Menyimpan...' : 'Simpan Kuota Kelas'}
                    </button>
                  </div>
                </form>
              )}

              {/* TAB 3: GURU */}
              {activeTab === 'guru' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-slate-600">Kelola daftar guru yang tampil di website.</p>
                    <button
                      type="button"
                      onClick={openAddTeacher}
                      className="px-4 py-2.5 rounded-full bg-[#facc15] hover:bg-[#eab308] text-slate-900 font-bold text-xs sm:text-sm inline-flex items-center gap-1.5 cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Tambah Guru</span>
                    </button>
                  </div>

                  {teacherFormMode !== 'closed' && (
                    <form
                      onSubmit={handleSaveTeacher}
                      className="p-4 rounded-2xl bg-[#fffbeb] border-2 border-[#facc15] space-y-3"
                    >
                      <h4 className="font-display font-bold text-slate-900">
                        {teacherFormMode === 'add' ? 'Tambah Guru Baru' : 'Edit Profil Guru'}
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <input
                          type="text"
                          required
                          placeholder="Nama Lengkap & Gelar *"
                          value={teacherForm.name}
                          onChange={(e) => setTeacherForm((p) => ({ ...p, name: e.target.value }))}
                          className="px-3.5 py-2.5 rounded-xl bg-white border border-amber-200 text-sm"
                        />
                        <input
                          type="text"
                          required
                          placeholder="Jabatan (misal: Wali Kelas Kelompok A) *"
                          value={teacherForm.role}
                          onChange={(e) => setTeacherForm((p) => ({ ...p, role: e.target.value }))}
                          className="px-3.5 py-2.5 rounded-xl bg-white border border-amber-200 text-sm"
                        />
                        <input
                          type="text"
                          placeholder="Pengalaman (misal: 8 Tahun Pengalaman PAUD)"
                          value={teacherForm.experience}
                          onChange={(e) =>
                            setTeacherForm((p) => ({ ...p, experience: e.target.value }))
                          }
                          className="px-3.5 py-2.5 rounded-xl bg-white border border-amber-200 text-sm"
                        />
                        <div className="flex items-center gap-2">
                          <img
                            src={teacherForm.photo || HERO_IMAGES.team}
                            alt="Preview Guru"
                            className="w-10 h-10 rounded-full object-cover border border-amber-200 shrink-0 bg-white"
                          />
                          <input
                            type="text"
                            placeholder="URL Foto (opsional)"
                            value={teacherForm.photo}
                            onChange={(e) => setTeacherForm((p) => ({ ...p, photo: e.target.value }))}
                            className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-amber-200 text-sm"
                          />
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {LOCAL_SCHOOL_PHOTOS.map((preset) => (
                          <button
                            key={`guru-${preset.path}`}
                            type="button"
                            onClick={() =>
                              setTeacherForm((p) => ({ ...p, photo: preset.path }))
                            }
                            className="px-2.5 py-1 rounded-full bg-white hover:bg-amber-100 border border-amber-200 text-[11px] font-bold text-slate-700 cursor-pointer"
                          >
                            {preset.label}
                          </button>
                        ))}
                      </div>
                      <input
                        type="text"
                        placeholder="Slogan / Kutipan Hangat"
                        value={teacherForm.slogan}
                        onChange={(e) => setTeacherForm((p) => ({ ...p, slogan: e.target.value }))}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-amber-200 text-sm"
                      />
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setTeacherFormMode('closed')}
                          className="px-4 py-2 rounded-full bg-white border border-slate-300 text-xs font-bold cursor-pointer"
                        >
                          Batal
                        </button>
                        <button
                          type="submit"
                          disabled={saving}
                          className="px-5 py-2 rounded-full bg-[#facc15] text-slate-900 text-xs font-bold cursor-pointer"
                        >
                          {saving ? 'Menyimpan...' : 'Simpan Guru'}
                        </button>
                      </div>
                    </form>
                  )}

                  <div className="space-y-2.5">
                    {teachers.map((t) => {
                      const delKey = `guru:${t.id}`;
                      return (
                        <div
                          key={t.id}
                          className="p-4 rounded-2xl border border-slate-200 flex flex-wrap items-center justify-between gap-3"
                        >
                          <div>
                            <p className="font-display font-bold text-slate-900">{t.name}</p>
                            <p className="text-xs font-semibold text-slate-600">
                              {t.role} · {t.experience}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => openEditTeacher(t)}
                              className="px-3.5 py-1.5 rounded-full bg-[#e0f2fe] text-slate-900 text-xs font-bold inline-flex items-center gap-1 cursor-pointer"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                              <span>Edit</span>
                            </button>
                            {confirmDeleteKey === delKey ? (
                              <span className="inline-flex gap-1.5">
                                <button
                                  type="button"
                                  disabled={saving}
                                  onClick={() => handleDeleteTeacher(t.id)}
                                  className="px-3 py-1.5 rounded-full bg-rose-600 text-white text-xs font-bold cursor-pointer"
                                >
                                  Ya, Hapus
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setConfirmDeleteKey(null)}
                                  className="px-3 py-1.5 rounded-full bg-slate-200 text-slate-800 text-xs font-bold cursor-pointer"
                                >
                                  Batal
                                </button>
                              </span>
                            ) : (
                              <button
                                type="button"
                                onClick={() => setConfirmDeleteKey(delKey)}
                                className="px-3.5 py-1.5 rounded-full bg-rose-50 text-rose-700 text-xs font-bold inline-flex items-center gap-1 cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>Hapus</span>
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* TAB 4: GALERI */}
              {activeTab === 'galeri' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-slate-600">Kelola foto-foto pada Galeri Ceria.</p>
                    <button
                      type="button"
                      onClick={openAddGallery}
                      className="px-4 py-2.5 rounded-full bg-[#facc15] hover:bg-[#eab308] text-slate-900 font-bold text-xs sm:text-sm inline-flex items-center gap-1.5 cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Tambah Foto</span>
                    </button>
                  </div>

                  {galleryFormMode !== 'closed' && (
                    <form
                      onSubmit={handleSaveGallery}
                      className="p-4 rounded-2xl bg-[#fffbeb] border-2 border-[#facc15] space-y-3"
                    >
                      <h4 className="font-display font-bold text-slate-900">
                        {galleryFormMode === 'add' ? 'Tambah Foto Galeri' : 'Edit Foto Galeri'}
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <input
                          type="text"
                          required
                          placeholder="Judul Kegiatan *"
                          value={galleryForm.title}
                          onChange={(e) => setGalleryForm((p) => ({ ...p, title: e.target.value }))}
                          className="px-3.5 py-2.5 rounded-xl bg-white border border-amber-200 text-sm"
                        />
                        <select
                          value={galleryForm.category}
                          onChange={(e) =>
                            setGalleryForm((p) => ({
                              ...p,
                              category: e.target.value as GalleryItem['category'],
                            }))
                          }
                          className="px-3.5 py-2.5 rounded-xl bg-white border border-amber-200 text-sm"
                        >
                          <option value="Belajar">Belajar</option>
                          <option value="Bermain">Bermain</option>
                          <option value="Mengaji">Mengaji</option>
                          <option value="Pentas Seni">Pentas Seni</option>
                          <option value="Field Trip">Field Trip</option>
                        </select>
                      </div>
                      <input
                        type="text"
                        required
                        placeholder="Deskripsi singkat kegiatan *"
                        value={galleryForm.description}
                        onChange={(e) =>
                          setGalleryForm((p) => ({ ...p, description: e.target.value }))
                        }
                        className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-amber-200 text-sm"
                      />
                      <div className="flex items-center gap-3">
                        <img
                          src={galleryForm.image || HERO_IMAGES.main}
                          alt="Preview Galeri"
                          className="w-16 h-12 rounded-xl object-cover border border-amber-200 shrink-0 bg-white"
                        />
                        <input
                          type="text"
                          placeholder="Path / URL Gambar"
                          value={galleryForm.image}
                          onChange={(e) => setGalleryForm((p) => ({ ...p, image: e.target.value }))}
                          className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-amber-200 text-sm"
                        />
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {LOCAL_SCHOOL_PHOTOS.map((preset) => (
                          <button
                            key={`gal-${preset.path}`}
                            type="button"
                            onClick={() =>
                              setGalleryForm((p) => ({ ...p, image: preset.path }))
                            }
                            className="px-2.5 py-1 rounded-full bg-white hover:bg-amber-100 border border-amber-200 text-[11px] font-bold text-slate-700 cursor-pointer"
                          >
                            {preset.label}
                          </button>
                        ))}
                      </div>
                      <input
                        type="text"
                        maxLength={200}
                        placeholder="Teks alternatif gambar (opsional, untuk aksesibilitas)"
                        value={galleryForm.alt}
                        onChange={(e) => setGalleryForm((p) => ({ ...p, alt: e.target.value }))}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-amber-200 text-sm"
                      />
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setGalleryFormMode('closed')}
                          className="px-4 py-2 rounded-full bg-white border border-slate-300 text-xs font-bold cursor-pointer"
                        >
                          Batal
                        </button>
                        <button
                          type="submit"
                          disabled={saving}
                          className="px-5 py-2 rounded-full bg-[#facc15] text-slate-900 text-xs font-bold cursor-pointer"
                        >
                          {saving ? 'Menyimpan...' : 'Simpan Foto'}
                        </button>
                      </div>
                    </form>
                  )}

                  <div className="space-y-2.5">
                    {galleryItems.map((g) => {
                      const delKey = `gal:${g.id}`;
                      return (
                        <div
                          key={g.id}
                          className="p-4 rounded-2xl border border-slate-200 flex flex-wrap items-center justify-between gap-3"
                        >
                          <div>
                            <p className="font-display font-bold text-slate-900">{g.title}</p>
                            <p className="text-xs font-semibold text-slate-600">
                              {g.category} · {g.description}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => openEditGallery(g)}
                              className="px-3.5 py-1.5 rounded-full bg-[#e0f2fe] text-slate-900 text-xs font-bold inline-flex items-center gap-1 cursor-pointer"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                              <span>Edit</span>
                            </button>
                            {confirmDeleteKey === delKey ? (
                              <span className="inline-flex gap-1.5">
                                <button
                                  type="button"
                                  disabled={saving}
                                  onClick={() => handleDeleteGallery(g.id)}
                                  className="px-3 py-1.5 rounded-full bg-rose-600 text-white text-xs font-bold cursor-pointer"
                                >
                                  Ya, Hapus
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setConfirmDeleteKey(null)}
                                  className="px-3 py-1.5 rounded-full bg-slate-200 text-slate-800 text-xs font-bold cursor-pointer"
                                >
                                  Batal
                                </button>
                              </span>
                            ) : (
                              <button
                                type="button"
                                onClick={() => setConfirmDeleteKey(delKey)}
                                className="px-3.5 py-1.5 rounded-full bg-rose-50 text-rose-700 text-xs font-bold inline-flex items-center gap-1 cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>Hapus</span>
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* TAB 5: TESTIMONI */}
              {activeTab === 'testimoni' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-slate-600">Kelola testimoni orang tua siswa.</p>
                    <button
                      type="button"
                      onClick={openAddTestimonial}
                      className="px-4 py-2.5 rounded-full bg-[#facc15] hover:bg-[#eab308] text-slate-900 font-bold text-xs sm:text-sm inline-flex items-center gap-1.5 cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Tambah Testimoni</span>
                    </button>
                  </div>

                  {testimonialFormMode !== 'closed' && (
                    <form
                      onSubmit={handleSaveTestimonial}
                      className="p-4 rounded-2xl bg-[#fffbeb] border-2 border-[#facc15] space-y-3"
                    >
                      <h4 className="font-display font-bold text-slate-900">
                        {testimonialFormMode === 'add' ? 'Tambah Testimoni' : 'Edit Testimoni'}
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <input
                          type="text"
                          required
                          placeholder="Nama Orang Tua *"
                          value={testimonialForm.parentName}
                          onChange={(e) =>
                            setTestimonialForm((p) => ({ ...p, parentName: e.target.value }))
                          }
                          className="px-3.5 py-2.5 rounded-xl bg-white border border-amber-200 text-sm"
                        />
                        <input
                          type="text"
                          placeholder="Info Anak & Kelas"
                          value={testimonialForm.childInfo}
                          onChange={(e) =>
                            setTestimonialForm((p) => ({ ...p, childInfo: e.target.value }))
                          }
                          className="px-3.5 py-2.5 rounded-xl bg-white border border-amber-200 text-sm"
                        />
                        <select
                          value={testimonialForm.rating}
                          onChange={(e) =>
                            setTestimonialForm((p) => ({ ...p, rating: Number(e.target.value) }))
                          }
                          className="px-3.5 py-2.5 rounded-xl bg-white border border-amber-200 text-sm"
                        >
                          <option value={5}>5 Bintang</option>
                          <option value={4}>4 Bintang</option>
                          <option value={3}>3 Bintang</option>
                        </select>
                      </div>
                      <textarea
                        rows={2}
                        required
                        placeholder="Isi testimoni *"
                        value={testimonialForm.quote}
                        onChange={(e) =>
                          setTestimonialForm((p) => ({ ...p, quote: e.target.value }))
                        }
                        className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-amber-200 text-sm"
                      />
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setTestimonialFormMode('closed')}
                          className="px-4 py-2 rounded-full bg-white border border-slate-300 text-xs font-bold cursor-pointer"
                        >
                          Batal
                        </button>
                        <button
                          type="submit"
                          disabled={saving}
                          className="px-5 py-2 rounded-full bg-[#facc15] text-slate-900 text-xs font-bold cursor-pointer"
                        >
                          {saving ? 'Menyimpan...' : 'Simpan Testimoni'}
                        </button>
                      </div>
                    </form>
                  )}

                  <div className="space-y-2.5">
                    {testimonials.map((t) => {
                      const delKey = `testi:${t.id}`;
                      return (
                        <div
                          key={t.id}
                          className="p-4 rounded-2xl border border-slate-200 flex flex-wrap items-center justify-between gap-3"
                        >
                          <div className="max-w-xl">
                            <p className="font-display font-bold text-slate-900">
                              {t.parentName} · <span className="text-xs font-semibold text-slate-500">{t.childInfo}</span>
                            </p>
                            <p className="text-xs text-slate-700 mt-0.5">&ldquo;{t.quote}&rdquo;</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => openEditTestimonial(t)}
                              className="px-3.5 py-1.5 rounded-full bg-[#e0f2fe] text-slate-900 text-xs font-bold inline-flex items-center gap-1 cursor-pointer"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                              <span>Edit</span>
                            </button>
                            {confirmDeleteKey === delKey ? (
                              <span className="inline-flex gap-1.5">
                                <button
                                  type="button"
                                  disabled={saving}
                                  onClick={() => handleDeleteTestimonial(t.id)}
                                  className="px-3 py-1.5 rounded-full bg-rose-600 text-white text-xs font-bold cursor-pointer"
                                >
                                  Ya, Hapus
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setConfirmDeleteKey(null)}
                                  className="px-3 py-1.5 rounded-full bg-slate-200 text-slate-800 text-xs font-bold cursor-pointer"
                                >
                                  Batal
                                </button>
                              </span>
                            ) : (
                              <button
                                type="button"
                                onClick={() => setConfirmDeleteKey(delKey)}
                                className="px-3.5 py-1.5 rounded-full bg-rose-50 text-rose-700 text-xs font-bold inline-flex items-center gap-1 cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>Hapus</span>
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* TAB 6: FAQ */}
              {activeTab === 'faq' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-slate-600">Kelola daftar Tanya Jawab (FAQ).</p>
                    <button
                      type="button"
                      onClick={openAddFaq}
                      className="px-4 py-2.5 rounded-full bg-[#facc15] hover:bg-[#eab308] text-slate-900 font-bold text-xs sm:text-sm inline-flex items-center gap-1.5 cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Tambah FAQ</span>
                    </button>
                  </div>

                  {faqFormMode !== 'closed' && (
                    <form
                      onSubmit={handleSaveFaq}
                      className="p-4 rounded-2xl bg-[#fffbeb] border-2 border-[#facc15] space-y-3"
                    >
                      <h4 className="font-display font-bold text-slate-900">
                        {faqFormMode === 'add' ? 'Tambah Pertanyaan FAQ' : 'Edit FAQ'}
                      </h4>
                      <input
                        type="text"
                        required
                        placeholder="Pertanyaan *"
                        value={faqForm.question}
                        onChange={(e) => setFaqForm((p) => ({ ...p, question: e.target.value }))}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-amber-200 text-sm"
                      />
                      <textarea
                        rows={2}
                        required
                        placeholder="Jawaban *"
                        value={faqForm.answer}
                        onChange={(e) => setFaqForm((p) => ({ ...p, answer: e.target.value }))}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-amber-200 text-sm"
                      />
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setFaqFormMode('closed')}
                          className="px-4 py-2 rounded-full bg-white border border-slate-300 text-xs font-bold cursor-pointer"
                        >
                          Batal
                        </button>
                        <button
                          type="submit"
                          disabled={saving}
                          className="px-5 py-2 rounded-full bg-[#facc15] text-slate-900 text-xs font-bold cursor-pointer"
                        >
                          {saving ? 'Menyimpan...' : 'Simpan FAQ'}
                        </button>
                      </div>
                    </form>
                  )}

                  <div className="space-y-2.5">
                    {faqs.map((f) => {
                      const delKey = `faq:${f.id}`;
                      return (
                        <div
                          key={f.id}
                          className="p-4 rounded-2xl border border-slate-200 flex flex-wrap items-center justify-between gap-3"
                        >
                          <div className="max-w-xl">
                            <p className="font-display font-bold text-slate-900">{f.question}</p>
                            <p className="text-xs text-slate-600 mt-0.5">{f.answer}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => openEditFaq(f)}
                              className="px-3.5 py-1.5 rounded-full bg-[#e0f2fe] text-slate-900 text-xs font-bold inline-flex items-center gap-1 cursor-pointer"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                              <span>Edit</span>
                            </button>
                            {confirmDeleteKey === delKey ? (
                              <span className="inline-flex gap-1.5">
                                <button
                                  type="button"
                                  disabled={saving}
                                  onClick={() => handleDeleteFaq(f.id)}
                                  className="px-3 py-1.5 rounded-full bg-rose-600 text-white text-xs font-bold cursor-pointer"
                                >
                                  Ya, Hapus
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setConfirmDeleteKey(null)}
                                  className="px-3 py-1.5 rounded-full bg-slate-200 text-slate-800 text-xs font-bold cursor-pointer"
                                >
                                  Batal
                                </button>
                              </span>
                            ) : (
                              <button
                                type="button"
                                onClick={() => setConfirmDeleteKey(delKey)}
                                className="px-3.5 py-1.5 rounded-full bg-rose-50 text-rose-700 text-xs font-bold inline-flex items-center gap-1 cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>Hapus</span>
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
