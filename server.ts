import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import express, { type NextFunction, type Request, type Response } from 'express';
import {
  DAILY_TIMELINE,
  FAQS,
  GALLERY_ITEMS,
  HERO_IMAGES,
  PROGRAMS,
  SCHOOL_INFO,
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
} from './src/data/schoolData.ts';

export interface QuotaEntry {
  capacity: number;
  enrolledCount: number;
}

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
  createdAt: string;
  updatedAt: string;
}

interface AdminSession {
  token: string;
  createdAt: number;
}

interface SchoolDatabase {
  schoolInfo: SchoolInfo;
  advantages: AdvantageItem[];
  programs: SchoolProgram[];
  timelineSteps: TimelineStep[];
  quotas: Record<string, QuotaEntry>;
  teachers: TeacherProfile[];
  galleryItems: GalleryItem[];
  testimonials: TestimonialItem[];
  faqs: FaqItem[];
  registrations: PpdbRegistrationRecord[];
  adminPasscode: string;
  sessions: AdminSession[];
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'school-db.json');
const MAX_SESSION_AGE_MS = 1000 * 60 * 60 * 24 * 30; // 30 days

function createInitialDb(): SchoolDatabase {
  const quotas: Record<string, QuotaEntry> = {};
  PROGRAMS.forEach((p) => {
    quotas[p.code] = {
      capacity: p.maxPerClass,
      enrolledCount: p.defaultEnrolled,
    };
  });

  return {
    schoolInfo: { ...SCHOOL_INFO },
    advantages: WHY_CHOOSE_US.map((a) => ({ ...a })),
    programs: PROGRAMS.map((p) => ({
      ...p,
      highlights: [...p.highlights],
      weeklySchedule: p.weeklySchedule.map((w) => ({ ...w })),
    })),
    timelineSteps: DAILY_TIMELINE.map((s) => ({ ...s })),
    quotas,
    teachers: TEACHERS.map((t) => ({ ...t })),
    galleryItems: GALLERY_ITEMS.map((g) => ({ ...g })),
    testimonials: TESTIMONIALS.map((t) => ({ ...t })),
    faqs: FAQS.map((f) => ({ ...f })),
    registrations: [],
    adminPasscode: process.env.ADMIN_PIN || 'admin123',
    sessions: [],
  };
}

function loadDb(): SchoolDatabase {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(DB_FILE)) {
    const initial = createInitialDb();
    saveDb(initial);
    return initial;
  }
  try {
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    const parsed = JSON.parse(raw) as Partial<SchoolDatabase>;
    const defaults = createInitialDb();
    return {
      schoolInfo: { ...defaults.schoolInfo, ...(parsed.schoolInfo || {}) },
      advantages: Array.isArray(parsed.advantages) ? parsed.advantages : defaults.advantages,
      programs: Array.isArray(parsed.programs) ? parsed.programs : defaults.programs,
      timelineSteps: Array.isArray(parsed.timelineSteps)
        ? parsed.timelineSteps
        : defaults.timelineSteps,
      quotas: parsed.quotas && typeof parsed.quotas === 'object' ? parsed.quotas : defaults.quotas,
      teachers: Array.isArray(parsed.teachers) ? parsed.teachers : defaults.teachers,
      galleryItems: Array.isArray(parsed.galleryItems)
        ? parsed.galleryItems
        : defaults.galleryItems,
      testimonials: Array.isArray(parsed.testimonials)
        ? parsed.testimonials
        : defaults.testimonials,
      faqs: Array.isArray(parsed.faqs) ? parsed.faqs : defaults.faqs,
      registrations: Array.isArray(parsed.registrations) ? parsed.registrations : [],
      adminPasscode:
        typeof parsed.adminPasscode === 'string' && parsed.adminPasscode.trim().length >= 3
          ? parsed.adminPasscode
          : defaults.adminPasscode,
      sessions: Array.isArray(parsed.sessions) ? parsed.sessions : [],
    };
  } catch (err) {
    console.warn('Resetting corrupted school-db.json:', err);
    const initial = createInitialDb();
    saveDb(initial);
    return initial;
  }
}

function saveDb(db: SchoolDatabase): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  const tmpFile = `${DB_FILE}.tmp`;
  fs.writeFileSync(tmpFile, JSON.stringify(db, null, 2), 'utf-8');
  fs.renameSync(tmpFile, DB_FILE);
}

function makeDocId(prefix: string): string {
  const rand = crypto.randomBytes(4).toString('hex');
  return `${prefix}_${Date.now()}_${rand}`;
}

function generateRegistrationCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let suffix = '';
  for (let i = 0; i < 5; i += 1) {
    suffix += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `PPDB-2026-${suffix}`;
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

function extractBearerToken(req: Request): string {
  const header = req.headers.authorization || '';
  if (header.startsWith('Bearer ')) {
    return header.slice(7).trim();
  }
  return '';
}

function isTokenValid(db: SchoolDatabase, token: string): boolean {
  if (!token) return false;
  const now = Date.now();
  const validSessions = db.sessions.filter((s) => now - s.createdAt < MAX_SESSION_AGE_MS);
  if (validSessions.length !== db.sessions.length) {
    db.sessions = validSessions;
    saveDb(db);
  }
  return validSessions.some((s) => s.token === token);
}

function getPublicSitePayload(db: SchoolDatabase) {
  return {
    schoolInfo: db.schoolInfo,
    advantages: db.advantages,
    programs: db.programs,
    timelineSteps: db.timelineSteps,
    quotas: db.quotas,
    teachers: db.teachers,
    galleryItems: db.galleryItems,
    testimonials: db.testimonials,
    faqs: db.faqs,
  };
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '2mb' }));

  const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
    const db = loadDb();
    const token = extractBearerToken(req);
    if (!isTokenValid(db, token)) {
      res.status(401).json({ error: 'Sesi admin belum aktif atau telah berakhir.' });
      return;
    }
    next();
  };

  // Healthcheck
  app.get('/api/health', (_req, res) => {
    res.json({ ok: true });
  });

  // Public site payload (non-PII)
  app.get('/api/site', (_req, res) => {
    const db = loadDb();
    res.json(getPublicSitePayload(db));
  });

  // Public PPDB registration
  app.post('/api/ppdb', (req, res) => {
    const body = req.body || {};
    const childName = String(body.childName || '').trim();
    const birthDate = String(body.birthDate || '').trim();
    const gender = body.gender === 'Perempuan' ? 'Perempuan' : 'Laki-laki';
    const programCode = String(body.programCode || '').trim();
    const fatherName = String(body.fatherName || '').trim();
    const motherName = String(body.motherName || '').trim();
    const parentWhatsapp = String(body.parentWhatsapp || '').trim();
    const address = String(body.address || '').trim();
    const previousSchool = String(body.previousSchool || '').trim().slice(0, 120);
    const notes = String(body.notes || '').trim().slice(0, 400);
    const wantsTrial = Boolean(body.wantsTrial);

    if (
      childName.length < 2 ||
      childName.length > 100 ||
      !/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(birthDate) ||
      fatherName.length < 2 ||
      fatherName.length > 100 ||
      motherName.length < 2 ||
      motherName.length > 100 ||
      !/^[0-9+\-\s]{9,18}$/.test(parentWhatsapp) ||
      address.length < 5 ||
      address.length > 300 ||
      !programCode
    ) {
      res.status(400).json({ error: 'Mohon lengkapi semua data wajib dengan format yang benar.' });
      return;
    }

    const db = loadDb();
    const nowIso = new Date().toISOString();
    const registrationCode = generateRegistrationCode();
    const record: PpdbRegistrationRecord = {
      id: makeDocId('reg'),
      registrationCode,
      childName,
      birthDate,
      gender,
      programCode,
      fatherName,
      motherName,
      parentWhatsapp,
      address,
      previousSchool: previousSchool || undefined,
      notes: notes || undefined,
      wantsTrial,
      status: 'menunggu',
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    db.registrations.unshift(record);
    const quota = db.quotas[programCode];
    if (quota && quota.enrolledCount < quota.capacity) {
      quota.enrolledCount += 1;
    }
    saveDb(db);

    res.status(201).json({ registrationCode, registration: record });
  });

  // Admin auth
  app.get('/api/admin/session', (req, res) => {
    const db = loadDb();
    const token = extractBearerToken(req);
    res.json({ authenticated: isTokenValid(db, token) });
  });

  app.post('/api/admin/login', (req, res) => {
    const passcode = String(req.body?.passcode || '').trim();
    const db = loadDb();
    if (!passcode || passcode !== db.adminPasscode) {
      res.status(401).json({ error: 'PIN Admin tidak sesuai. Silakan periksa kembali.' });
      return;
    }
    const token = crypto.randomBytes(24).toString('hex');
    db.sessions.push({ token, createdAt: Date.now() });
    if (db.sessions.length > 25) {
      db.sessions = db.sessions.slice(-25);
    }
    saveDb(db);
    res.json({ token });
  });

  app.post('/api/admin/logout', (req, res) => {
    const token = extractBearerToken(req);
    if (token) {
      const db = loadDb();
      db.sessions = db.sessions.filter((s) => s.token !== token);
      saveDb(db);
    }
    res.json({ ok: true });
  });

  // Admin: School Info (Identity, Hero, Principal, Video, Contacts, Maps, optional Passcode update)
  app.put('/api/admin/school-info', requireAdmin, (req, res) => {
    const info = req.body || {};
    const name = String(info.name || '').trim().slice(0, 100);
    const shortTagline = String(info.shortTagline || '').trim().slice(0, 140);
    const npsn = String(info.npsn || '').trim().slice(0, 30);
    const principalName = String(info.principalName || '').trim().slice(0, 100);
    const principalQuote = String(info.principalQuote || '').trim().slice(0, 600);
    const address = String(info.address || '').trim().slice(0, 300);

    if (
      name.length < 2 ||
      shortTagline.length < 2 ||
      npsn.length < 2 ||
      principalName.length < 2 ||
      principalQuote.length < 5 ||
      address.length < 5
    ) {
      res.status(400).json({
        error: 'Nama TK, tagline, NPSN, nama kepala sekolah, sambutan, dan alamat wajib diisi.',
      });
      return;
    }

    const db = loadDb();
    const cleanYear = Math.min(2100, Math.max(1900, Math.round(Number(info.foundedYear) || 2016)));
    const cleanWaRaw = String(info.whatsappRaw || '').replace(/[^0-9]/g, '').slice(0, 20);
    const safeWaRaw = cleanWaRaw.length >= 8 ? cleanWaRaw : db.schoolInfo.whatsappRaw;
    const cleanWaDisplay = String(info.whatsappDisplay || '').trim().slice(0, 25);

    db.schoolInfo = {
      ...db.schoolInfo,
      name,
      shortTagline,
      npsn,
      accreditation: String(info.accreditation || '').trim().slice(0, 60) || 'A',
      curriculum: String(info.curriculum || '').trim().slice(0, 80) || 'Kurikulum Merdeka PAUD',
      foundedYear: cleanYear,
      experienceYears: String(info.experienceYears || '').trim().slice(0, 40) || '1 Tahun',
      studentCount: String(info.studentCount || '').trim().slice(0, 40) || '100 Anak',
      teacherCount: String(info.teacherCount || '').trim().slice(0, 40) || '10 Guru',
      ratioText: String(info.ratioText || '').trim().slice(0, 30) || '1 : 10',
      principalName,
      principalQuote,
      principalPhoto: String(info.principalPhoto || '').trim().slice(0, 400) || undefined,
      address,
      whatsappRaw: safeWaRaw,
      whatsappDisplay: cleanWaDisplay.length >= 8 ? cleanWaDisplay : safeWaRaw,
      instagramHandle: String(info.instagramHandle || '').trim().slice(0, 60),
      facebookName: String(info.facebookName || '').trim().slice(0, 80),
      youtubeName: String(info.youtubeName || '').trim().slice(0, 80),
      email: String(info.email || '').trim().slice(0, 120),
      schoolHoursA: String(info.schoolHoursA || '').trim().slice(0, 120),
      schoolHoursB: String(info.schoolHoursB || '').trim().slice(0, 120),
      serviceHours: String(info.serviceHours || '').trim().slice(0, 140),
      ppdbDeadlineIso: String(info.ppdbDeadlineIso || '').trim().slice(0, 40),
      youtubeVideoId: String(info.youtubeVideoId || '').trim().slice(0, 60),
      videoThumbnail: String(info.videoThumbnail || '').trim().slice(0, 400) || undefined,
      mapsEmbedUrl: String(info.mapsEmbedUrl || '').trim().slice(0, 500),
      heroBadge: String(info.heroBadge || '').trim().slice(0, 120) || undefined,
      heroTitle: String(info.heroTitle || '').trim().slice(0, 160) || undefined,
      heroSubtitle: String(info.heroSubtitle || '').trim().slice(0, 400) || undefined,
      heroImage: String(info.heroImage || '').trim().slice(0, 400) || undefined,
    };

    const newPasscode = String(info.newAdminPasscode || '').trim();
    if (newPasscode.length >= 4) {
      db.adminPasscode = newPasscode;
    }

    // Sync principal profile in teachers list
    const principalIdx = db.teachers.findIndex(
      (t) => t.id === 'kepala' || t.role.toLowerCase().includes('kepala sekolah')
    );
    if (principalIdx >= 0) {
      db.teachers[principalIdx] = {
        ...db.teachers[principalIdx],
        name: principalName,
        ...(db.schoolInfo.principalPhoto ? { photo: db.schoolInfo.principalPhoto } : {}),
      };
    }

    saveDb(db);
    res.json({ schoolInfo: db.schoolInfo });
  });

  // Admin: Quotas
  app.put('/api/admin/quotas', requireAdmin, (req, res) => {
    const incoming = req.body?.quotas || req.body || {};
    const db = loadDb();
    Object.keys(incoming).forEach((code) => {
      const entry = incoming[code];
      if (!entry || typeof entry !== 'object') return;
      const cap = Math.min(100, Math.max(1, Math.round(Number(entry.capacity) || 20)));
      const enr = Math.min(cap, Math.max(0, Math.round(Number(entry.enrolledCount) || 0)));
      db.quotas[code] = { capacity: cap, enrolledCount: enr };
    });
    saveDb(db);
    res.json({ quotas: db.quotas });
  });

  // Admin: Advantages CRUD
  app.post('/api/admin/advantages', requireAdmin, (req, res) => {
    const b = req.body || {};
    const title = String(b.title || '').trim().slice(0, 100);
    const description = String(b.description || '').trim().slice(0, 400);
    if (title.length < 2 || description.length < 5) {
      res.status(400).json({ error: 'Judul dan deskripsi keunggulan wajib diisi.' });
      return;
    }
    const db = loadDb();
    const item: AdvantageItem = {
      id: makeDocId('adv'),
      emoji: String(b.emoji || '✨').trim().slice(0, 16) || '✨',
      title,
      description,
      bgClass: String(b.bgClass || 'bg-[#fef9c3]').trim(),
      borderClass: String(b.borderClass || 'border-[#fde047]').trim(),
    };
    db.advantages.push(item);
    saveDb(db);
    res.status(201).json({ item });
  });

  app.put('/api/admin/advantages/:id', requireAdmin, (req, res) => {
    const { id } = req.params;
    const b = req.body || {};
    const db = loadDb();
    const idx = db.advantages.findIndex((a) => a.id === id);
    if (idx < 0) {
      res.status(404).json({ error: 'Kartu keunggulan tidak ditemukan.' });
      return;
    }
    const title = String(b.title || '').trim().slice(0, 100);
    const description = String(b.description || '').trim().slice(0, 400);
    if (title.length < 2 || description.length < 5) {
      res.status(400).json({ error: 'Judul dan deskripsi keunggulan wajib diisi.' });
      return;
    }
    db.advantages[idx] = {
      id,
      emoji: String(b.emoji || '✨').trim().slice(0, 16) || '✨',
      title,
      description,
      bgClass: String(b.bgClass || 'bg-[#fef9c3]').trim(),
      borderClass: String(b.borderClass || 'border-[#fde047]').trim(),
    };
    saveDb(db);
    res.json({ item: db.advantages[idx] });
  });

  app.delete('/api/admin/advantages/:id', requireAdmin, (req, res) => {
    const db = loadDb();
    db.advantages = db.advantages.filter((a) => a.id !== req.params.id);
    saveDb(db);
    res.json({ ok: true });
  });

  // Admin: Programs CRUD
  app.post('/api/admin/programs', requireAdmin, (req, res) => {
    const b = req.body || {};
    const name = String(b.name || '').trim().slice(0, 100);
    const ageRange = String(b.ageRange || '').trim().slice(0, 60);
    const summary = String(b.summary || '').trim().slice(0, 400);
    if (name.length < 2 || ageRange.length < 2 || summary.length < 5) {
      res.status(400).json({ error: 'Nama program, rentang usia, dan deskripsi wajib diisi.' });
      return;
    }
    const db = loadDb();
    let code = makeProgramCode(String(b.code || name));
    if (db.programs.some((p) => p.code === code)) {
      code = `${code}_${Date.now().toString(36).slice(-4)}`;
    }
    const maxPerClass = Math.min(100, Math.max(1, Math.round(Number(b.maxPerClass) || 20)));
    const defaultEnrolled = Math.min(
      maxPerClass,
      Math.max(0, Math.round(Number(b.defaultEnrolled) || 0))
    );
    const highlights = Array.isArray(b.highlights)
      ? b.highlights.map((h: unknown) => String(h || '').trim()).filter(Boolean).slice(0, 10)
      : ['Belajar sambil bermain'];
    const weeklySchedule = Array.isArray(b.weeklySchedule)
      ? b.weeklySchedule
          .map((w: { day?: unknown; activity?: unknown }) => ({
            day: String(w?.day || '').trim().slice(0, 30),
            activity: String(w?.activity || '').trim().slice(0, 200),
          }))
          .filter((w: { day: string; activity: string }) => w.day && w.activity)
          .slice(0, 7)
      : [{ day: 'Senin', activity: 'Belajar Sambil Bermain' }];

    const program: SchoolProgram = {
      code,
      name,
      ageRange,
      scheduleHours: String(b.scheduleHours || 'Senin - Jumat').trim().slice(0, 100),
      maxPerClass,
      defaultEnrolled,
      feeSummary: String(b.feeSummary || 'Hubungi Kami').trim().slice(0, 80),
      registrationFee: String(b.registrationFee || 'Gratis Formulir').trim().slice(0, 140),
      monthlyFee: String(b.monthlyFee || 'Hubungi Kami').trim().slice(0, 140),
      accentBg: String(b.accentBg || 'bg-[#fef9c3]').trim(),
      accentBorder: String(b.accentBorder || 'border-[#facc15]').trim(),
      buttonBg: String(b.buttonBg || 'bg-[#facc15] hover:bg-[#eab308] text-slate-900').trim(),
      emoji: String(b.emoji || '🎒').trim().slice(0, 16) || '🎒',
      summary,
      highlights: highlights.length > 0 ? highlights : ['Belajar sambil bermain'],
      weeklySchedule:
        weeklySchedule.length > 0
          ? weeklySchedule
          : [{ day: 'Senin', activity: 'Belajar Sambil Bermain' }],
    };

    db.programs.push(program);
    db.quotas[code] = { capacity: maxPerClass, enrolledCount: defaultEnrolled };
    saveDb(db);
    res.status(201).json({ item: program });
  });

  app.put('/api/admin/programs/:code', requireAdmin, (req, res) => {
    const { code } = req.params;
    const b = req.body || {};
    const db = loadDb();
    const idx = db.programs.findIndex((p) => p.code === code);
    if (idx < 0) {
      res.status(404).json({ error: 'Program tidak ditemukan.' });
      return;
    }
    const name = String(b.name || '').trim().slice(0, 100);
    const ageRange = String(b.ageRange || '').trim().slice(0, 60);
    const summary = String(b.summary || '').trim().slice(0, 400);
    if (name.length < 2 || ageRange.length < 2 || summary.length < 5) {
      res.status(400).json({ error: 'Nama program, rentang usia, dan deskripsi wajib diisi.' });
      return;
    }
    const maxPerClass = Math.min(100, Math.max(1, Math.round(Number(b.maxPerClass) || 20)));
    const defaultEnrolled = Math.min(
      maxPerClass,
      Math.max(0, Math.round(Number(b.defaultEnrolled) || 0))
    );
    const highlights = Array.isArray(b.highlights)
      ? b.highlights.map((h: unknown) => String(h || '').trim()).filter(Boolean).slice(0, 10)
      : db.programs[idx].highlights;
    const weeklySchedule = Array.isArray(b.weeklySchedule)
      ? b.weeklySchedule
          .map((w: { day?: unknown; activity?: unknown }) => ({
            day: String(w?.day || '').trim().slice(0, 30),
            activity: String(w?.activity || '').trim().slice(0, 200),
          }))
          .filter((w: { day: string; activity: string }) => w.day && w.activity)
          .slice(0, 7)
      : db.programs[idx].weeklySchedule;

    db.programs[idx] = {
      code,
      name,
      ageRange,
      scheduleHours: String(b.scheduleHours || 'Senin - Jumat').trim().slice(0, 100),
      maxPerClass,
      defaultEnrolled,
      feeSummary: String(b.feeSummary || 'Hubungi Kami').trim().slice(0, 80),
      registrationFee: String(b.registrationFee || 'Gratis Formulir').trim().slice(0, 140),
      monthlyFee: String(b.monthlyFee || 'Hubungi Kami').trim().slice(0, 140),
      accentBg: String(b.accentBg || db.programs[idx].accentBg).trim(),
      accentBorder: String(b.accentBorder || db.programs[idx].accentBorder).trim(),
      buttonBg: String(b.buttonBg || db.programs[idx].buttonBg).trim(),
      emoji: String(b.emoji || '🎒').trim().slice(0, 16) || '🎒',
      summary,
      highlights: highlights.length > 0 ? highlights : ['Belajar sambil bermain'],
      weeklySchedule:
        weeklySchedule.length > 0
          ? weeklySchedule
          : [{ day: 'Senin', activity: 'Belajar Sambil Bermain' }],
    };

    const existingQuota = db.quotas[code];
    db.quotas[code] = {
      capacity: maxPerClass,
      enrolledCount: Math.min(
        maxPerClass,
        existingQuota ? existingQuota.enrolledCount : defaultEnrolled
      ),
    };
    saveDb(db);
    res.json({ item: db.programs[idx] });
  });

  app.delete('/api/admin/programs/:code', requireAdmin, (req, res) => {
    const { code } = req.params;
    const db = loadDb();
    db.programs = db.programs.filter((p) => p.code !== code);
    delete db.quotas[code];
    saveDb(db);
    res.json({ ok: true });
  });

  // Admin: Timeline CRUD
  app.post('/api/admin/timeline', requireAdmin, (req, res) => {
    const b = req.body || {};
    const time = String(b.time || '').trim().slice(0, 20);
    const title = String(b.title || '').trim().slice(0, 100);
    const description = String(b.description || '').trim().slice(0, 300);
    if (time.length < 2 || title.length < 2 || description.length < 5) {
      res.status(400).json({ error: 'Jam, judul, dan deskripsi aktivitas wajib diisi.' });
      return;
    }
    const db = loadDb();
    const item: TimelineStep = {
      id: makeDocId('step'),
      time,
      emoji: String(b.emoji || '🌟').trim().slice(0, 16) || '🌟',
      title,
      description,
      color: String(b.color || 'bg-[#fef08a] text-slate-900').trim(),
    };
    db.timelineSteps.push(item);
    saveDb(db);
    res.status(201).json({ item });
  });

  app.put('/api/admin/timeline/:id', requireAdmin, (req, res) => {
    const { id } = req.params;
    const b = req.body || {};
    const db = loadDb();
    const idx = db.timelineSteps.findIndex((s, i) => (s.id || `step_${i}`) === id);
    if (idx < 0) {
      res.status(404).json({ error: 'Aktivitas harian tidak ditemukan.' });
      return;
    }
    const time = String(b.time || '').trim().slice(0, 20);
    const title = String(b.title || '').trim().slice(0, 100);
    const description = String(b.description || '').trim().slice(0, 300);
    if (time.length < 2 || title.length < 2 || description.length < 5) {
      res.status(400).json({ error: 'Jam, judul, dan deskripsi aktivitas wajib diisi.' });
      return;
    }
    db.timelineSteps[idx] = {
      id: db.timelineSteps[idx].id || id,
      time,
      emoji: String(b.emoji || '🌟').trim().slice(0, 16) || '🌟',
      title,
      description,
      color: String(b.color || 'bg-[#fef08a] text-slate-900').trim(),
    };
    saveDb(db);
    res.json({ item: db.timelineSteps[idx] });
  });

  app.delete('/api/admin/timeline/:id', requireAdmin, (req, res) => {
    const { id } = req.params;
    const db = loadDb();
    db.timelineSteps = db.timelineSteps.filter((s, i) => (s.id || `step_${i}`) !== id);
    saveDb(db);
    res.json({ ok: true });
  });

  // Admin: Teachers CRUD
  app.post('/api/admin/teachers', requireAdmin, (req, res) => {
    const b = req.body || {};
    const name = String(b.name || '').trim().slice(0, 100);
    const role = String(b.role || '').trim().slice(0, 80);
    if (name.length < 2 || role.length < 2) {
      res.status(400).json({ error: 'Nama dan jabatan guru wajib diisi.' });
      return;
    }
    const db = loadDb();
    const initials =
      String(b.initials || '').trim() ||
      name
        .split(' ')
        .slice(0, 2)
        .map((w) => w[0]?.toUpperCase() || '')
        .join('') ||
      'TK';
    const item: TeacherProfile = {
      id: makeDocId('guru'),
      name,
      role,
      slogan: String(b.slogan || '"Mendidik dengan penuh cinta."').trim().slice(0, 200),
      experience: String(b.experience || 'Pengajar PAUD').trim().slice(0, 80),
      photo: String(b.photo || HERO_IMAGES.team).trim().slice(0, 400) || HERO_IMAGES.team,
      badgeColor: String(b.badgeColor || 'bg-[#fef08a]').trim(),
      initials: initials.slice(0, 4),
    };
    db.teachers.push(item);
    saveDb(db);
    res.status(201).json({ item });
  });

  app.put('/api/admin/teachers/:id', requireAdmin, (req, res) => {
    const { id } = req.params;
    const b = req.body || {};
    const db = loadDb();
    const idx = db.teachers.findIndex((t) => t.id === id);
    if (idx < 0) {
      res.status(404).json({ error: 'Data guru tidak ditemukan.' });
      return;
    }
    const name = String(b.name || '').trim().slice(0, 100);
    const role = String(b.role || '').trim().slice(0, 80);
    if (name.length < 2 || role.length < 2) {
      res.status(400).json({ error: 'Nama dan jabatan guru wajib diisi.' });
      return;
    }
    const photo = String(b.photo || HERO_IMAGES.team).trim().slice(0, 400) || HERO_IMAGES.team;
    const initials =
      String(b.initials || '').trim() ||
      name
        .split(' ')
        .slice(0, 2)
        .map((w) => w[0]?.toUpperCase() || '')
        .join('') ||
      'TK';

    db.teachers[idx] = {
      id,
      name,
      role,
      slogan: String(b.slogan || '"Mendidik dengan penuh cinta."').trim().slice(0, 200),
      experience: String(b.experience || 'Pengajar PAUD').trim().slice(0, 80),
      photo,
      badgeColor: String(b.badgeColor || db.teachers[idx].badgeColor).trim(),
      initials: initials.slice(0, 4),
    };

    if (id === 'kepala' || role.toLowerCase().includes('kepala sekolah')) {
      db.schoolInfo = {
        ...db.schoolInfo,
        principalName: name,
        principalPhoto: photo,
      };
    }

    saveDb(db);
    res.json({ item: db.teachers[idx] });
  });

  app.delete('/api/admin/teachers/:id', requireAdmin, (req, res) => {
    const db = loadDb();
    db.teachers = db.teachers.filter((t) => t.id !== req.params.id);
    saveDb(db);
    res.json({ ok: true });
  });

  // Admin: Gallery CRUD
  app.post('/api/admin/gallery', requireAdmin, (req, res) => {
    const b = req.body || {};
    const title = String(b.title || '').trim().slice(0, 120);
    const description = String(b.description || '').trim().slice(0, 300);
    if (title.length < 2 || description.length < 2) {
      res.status(400).json({ error: 'Judul dan deskripsi foto wajib diisi.' });
      return;
    }
    const db = loadDb();
    const validCategories: GalleryItem['category'][] = [
      'Belajar',
      'Bermain',
      'Mengaji',
      'Pentas Seni',
      'Field Trip',
    ];
    const category = validCategories.includes(b.category) ? b.category : 'Belajar';
    const item: GalleryItem = {
      id: makeDocId('gal'),
      title,
      category,
      description,
      image: String(b.image || HERO_IMAGES.main).trim().slice(0, 400) || HERO_IMAGES.main,
      alt: String(b.alt || '').trim().slice(0, 200) || title,
    };
    db.galleryItems.push(item);
    saveDb(db);
    res.status(201).json({ item });
  });

  app.put('/api/admin/gallery/:id', requireAdmin, (req, res) => {
    const { id } = req.params;
    const b = req.body || {};
    const db = loadDb();
    const idx = db.galleryItems.findIndex((g) => g.id === id);
    if (idx < 0) {
      res.status(404).json({ error: 'Foto galeri tidak ditemukan.' });
      return;
    }
    const title = String(b.title || '').trim().slice(0, 120);
    const description = String(b.description || '').trim().slice(0, 300);
    if (title.length < 2 || description.length < 2) {
      res.status(400).json({ error: 'Judul dan deskripsi foto wajib diisi.' });
      return;
    }
    const validCategories: GalleryItem['category'][] = [
      'Belajar',
      'Bermain',
      'Mengaji',
      'Pentas Seni',
      'Field Trip',
    ];
    const category = validCategories.includes(b.category) ? b.category : 'Belajar';
    db.galleryItems[idx] = {
      id,
      title,
      category,
      description,
      image: String(b.image || HERO_IMAGES.main).trim().slice(0, 400) || HERO_IMAGES.main,
      alt: String(b.alt || '').trim().slice(0, 200) || title,
    };
    saveDb(db);
    res.json({ item: db.galleryItems[idx] });
  });

  app.delete('/api/admin/gallery/:id', requireAdmin, (req, res) => {
    const db = loadDb();
    db.galleryItems = db.galleryItems.filter((g) => g.id !== req.params.id);
    saveDb(db);
    res.json({ ok: true });
  });

  // Admin: Testimonials CRUD
  app.post('/api/admin/testimonials', requireAdmin, (req, res) => {
    const b = req.body || {};
    const parentName = String(b.parentName || '').trim().slice(0, 80);
    const quote = String(b.quote || '').trim().slice(0, 400);
    if (parentName.length < 2 || quote.length < 5) {
      res.status(400).json({ error: 'Nama orang tua dan isi testimoni wajib diisi.' });
      return;
    }
    const db = loadDb();
    const initials =
      String(b.initials || '').trim() ||
      parentName
        .split(' ')
        .slice(0, 2)
        .map((w) => w[0]?.toUpperCase() || '')
        .join('') ||
      'OT';
    const item: TestimonialItem = {
      id: makeDocId('testi'),
      parentName,
      childInfo: String(b.childInfo || 'Orang Tua Siswa').trim().slice(0, 80),
      rating: Math.min(5, Math.max(1, Math.round(Number(b.rating) || 5))),
      quote,
      avatarColor: String(b.avatarColor || 'bg-[#fef08a]').trim(),
      initials: initials.slice(0, 4),
    };
    db.testimonials.push(item);
    saveDb(db);
    res.status(201).json({ item });
  });

  app.put('/api/admin/testimonials/:id', requireAdmin, (req, res) => {
    const { id } = req.params;
    const b = req.body || {};
    const db = loadDb();
    const idx = db.testimonials.findIndex((t) => t.id === id);
    if (idx < 0) {
      res.status(404).json({ error: 'Testimoni tidak ditemukan.' });
      return;
    }
    const parentName = String(b.parentName || '').trim().slice(0, 80);
    const quote = String(b.quote || '').trim().slice(0, 400);
    if (parentName.length < 2 || quote.length < 5) {
      res.status(400).json({ error: 'Nama orang tua dan isi testimoni wajib diisi.' });
      return;
    }
    const initials =
      String(b.initials || '').trim() ||
      parentName
        .split(' ')
        .slice(0, 2)
        .map((w) => w[0]?.toUpperCase() || '')
        .join('') ||
      'OT';
    db.testimonials[idx] = {
      id,
      parentName,
      childInfo: String(b.childInfo || 'Orang Tua Siswa').trim().slice(0, 80),
      rating: Math.min(5, Math.max(1, Math.round(Number(b.rating) || 5))),
      quote,
      avatarColor: String(b.avatarColor || db.testimonials[idx].avatarColor).trim(),
      initials: initials.slice(0, 4),
    };
    saveDb(db);
    res.json({ item: db.testimonials[idx] });
  });

  app.delete('/api/admin/testimonials/:id', requireAdmin, (req, res) => {
    const db = loadDb();
    db.testimonials = db.testimonials.filter((t) => t.id !== req.params.id);
    saveDb(db);
    res.json({ ok: true });
  });

  // Admin: FAQs CRUD
  app.post('/api/admin/faqs', requireAdmin, (req, res) => {
    const b = req.body || {};
    const question = String(b.question || '').trim().slice(0, 200);
    const answer = String(b.answer || '').trim().slice(0, 600);
    if (question.length < 5 || answer.length < 5) {
      res.status(400).json({ error: 'Pertanyaan dan jawaban minimal 5 karakter.' });
      return;
    }
    const db = loadDb();
    const item: FaqItem = {
      id: makeDocId('faq'),
      question,
      answer,
    };
    db.faqs.push(item);
    saveDb(db);
    res.status(201).json({ item });
  });

  app.put('/api/admin/faqs/:id', requireAdmin, (req, res) => {
    const { id } = req.params;
    const b = req.body || {};
    const db = loadDb();
    const idx = db.faqs.findIndex((f) => f.id === id);
    if (idx < 0) {
      res.status(404).json({ error: 'FAQ tidak ditemukan.' });
      return;
    }
    const question = String(b.question || '').trim().slice(0, 200);
    const answer = String(b.answer || '').trim().slice(0, 600);
    if (question.length < 5 || answer.length < 5) {
      res.status(400).json({ error: 'Pertanyaan dan jawaban minimal 5 karakter.' });
      return;
    }
    db.faqs[idx] = { id, question, answer };
    saveDb(db);
    res.json({ item: db.faqs[idx] });
  });

  app.delete('/api/admin/faqs/:id', requireAdmin, (req, res) => {
    const db = loadDb();
    db.faqs = db.faqs.filter((f) => f.id !== req.params.id);
    saveDb(db);
    res.json({ ok: true });
  });

  // Admin: PPDB Registrations CRUD
  app.get('/api/admin/registrations', requireAdmin, (_req, res) => {
    const db = loadDb();
    res.json({ registrations: db.registrations });
  });

  app.post('/api/admin/registrations', requireAdmin, (req, res) => {
    const b = req.body || {};
    const childName = String(b.childName || '').trim().slice(0, 100);
    const birthDate = String(b.birthDate || '').trim();
    const fatherName = String(b.fatherName || '').trim().slice(0, 100);
    const motherName = String(b.motherName || '').trim().slice(0, 100);
    const parentWhatsapp = String(b.parentWhatsapp || '').trim().slice(0, 18);
    const address = String(b.address || '').trim().slice(0, 300);

    if (
      childName.length < 2 ||
      !/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(birthDate) ||
      fatherName.length < 2 ||
      motherName.length < 2 ||
      !/^[0-9+\-\s]{9,18}$/.test(parentWhatsapp) ||
      address.length < 5
    ) {
      res.status(400).json({ error: 'Mohon lengkapi semua field wajib dengan format yang benar.' });
      return;
    }

    const db = loadDb();
    const nowIso = new Date().toISOString();
    const record: PpdbRegistrationRecord = {
      id: makeDocId('reg'),
      registrationCode: generateRegistrationCode(),
      childName,
      birthDate,
      gender: b.gender === 'Perempuan' ? 'Perempuan' : 'Laki-laki',
      programCode: String(b.programCode || db.programs[0]?.code || 'kelompok_a'),
      fatherName,
      motherName,
      parentWhatsapp,
      address,
      previousSchool: String(b.previousSchool || '').trim().slice(0, 120) || undefined,
      notes: String(b.notes || '').trim().slice(0, 400) || undefined,
      wantsTrial: Boolean(b.wantsTrial),
      status: ['menunggu', 'jadwal_trial', 'diterima', 'batal'].includes(b.status)
        ? b.status
        : 'menunggu',
      trialDate: String(b.trialDate || '').trim().slice(0, 40) || undefined,
      adminNotes: String(b.adminNotes || '').trim().slice(0, 300) || undefined,
      createdAt: nowIso,
      updatedAt: nowIso,
    };
    db.registrations.unshift(record);
    saveDb(db);
    res.status(201).json({ item: record });
  });

  app.put('/api/admin/registrations/:id', requireAdmin, (req, res) => {
    const { id } = req.params;
    const b = req.body || {};
    const db = loadDb();
    const idx = db.registrations.findIndex((r) => r.id === id);
    if (idx < 0) {
      res.status(404).json({ error: 'Data pendaftar tidak ditemukan.' });
      return;
    }
    const existing = db.registrations[idx];
    const childName = String(b.childName || '').trim().slice(0, 100);
    const birthDate = String(b.birthDate || '').trim();
    const fatherName = String(b.fatherName || '').trim().slice(0, 100);
    const motherName = String(b.motherName || '').trim().slice(0, 100);
    const parentWhatsapp = String(b.parentWhatsapp || '').trim().slice(0, 18);
    const address = String(b.address || '').trim().slice(0, 300);

    if (
      childName.length < 2 ||
      !/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(birthDate) ||
      fatherName.length < 2 ||
      motherName.length < 2 ||
      !/^[0-9+\-\s]{9,18}$/.test(parentWhatsapp) ||
      address.length < 5
    ) {
      res.status(400).json({ error: 'Mohon lengkapi semua field wajib dengan format yang benar.' });
      return;
    }

    db.registrations[idx] = {
      ...existing,
      childName,
      birthDate,
      gender: b.gender === 'Perempuan' ? 'Perempuan' : 'Laki-laki',
      programCode: String(b.programCode || existing.programCode),
      fatherName,
      motherName,
      parentWhatsapp,
      address,
      previousSchool: String(b.previousSchool || '').trim().slice(0, 120) || undefined,
      notes: String(b.notes || '').trim().slice(0, 400) || undefined,
      wantsTrial: Boolean(b.wantsTrial),
      status: ['menunggu', 'jadwal_trial', 'diterima', 'batal'].includes(b.status)
        ? b.status
        : existing.status,
      trialDate: String(b.trialDate || '').trim().slice(0, 40) || undefined,
      adminNotes: String(b.adminNotes || '').trim().slice(0, 300) || undefined,
      updatedAt: new Date().toISOString(),
    };
    saveDb(db);
    res.json({ item: db.registrations[idx] });
  });

  app.delete('/api/admin/registrations/:id', requireAdmin, (req, res) => {
    const db = loadDb();
    db.registrations = db.registrations.filter((r) => r.id !== req.params.id);
    saveDb(db);
    res.json({ ok: true });
  });

  // Mount Vite middleware in dev, or serve dist/ in production
  const distDir = path.resolve(process.cwd(), 'dist');
  const isDevLifecycle =
    process.env.npm_lifecycle_event === 'dev' || process.env.NODE_ENV === 'development';
  const isProduction =
    !isDevLifecycle &&
    (process.env.NODE_ENV === 'production' || fs.existsSync(path.join(distDir, 'index.html')));

  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  const port = Number(process.env.PORT) || 3000;
  app.listen(port, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${port}`);
  });
}

void startServer();
