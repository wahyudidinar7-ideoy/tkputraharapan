import type {
  AdvantageItem,
  FaqItem,
  GalleryItem,
  ProgramCode,
  SchoolInfo,
  SchoolProgram,
  TeacherProfile,
  TestimonialItem,
  TimelineStep,
} from '../data/schoolData';

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
  createdAt?: string | null;
}

export interface SiteDataResponse {
  schoolInfo: SchoolInfo;
  advantages: AdvantageItem[];
  programs: SchoolProgram[];
  timelineSteps: TimelineStep[];
  quotas: Record<string, { capacity: number; enrolledCount: number }>;
  teachers: TeacherProfile[];
  galleryItems: GalleryItem[];
  testimonials: TestimonialItem[];
  faqs: FaqItem[];
}

export const PPDB_VALIDATION = {
  registrationCodePattern: /^PPDB-[0-9]{4}-[A-Z0-9]{4,8}$/,
  birthDatePattern: /^[0-9]{4}-[0-9]{2}-[0-9]{2}$/,
  whatsappPattern: /^[0-9+\-\s]{9,18}$/,
  childNameMin: 2,
  childNameMax: 100,
  parentNameMin: 2,
  parentNameMax: 100,
  addressMin: 5,
  addressMax: 300,
  previousSchoolMax: 120,
  notesMax: 400,
  trialDateMax: 40,
  adminNotesMax: 300,
} as const;

const ADMIN_TOKEN_KEY = 'tk_ceria_admin_token_v1';

export function getAdminToken(): string {
  try {
    return window.localStorage.getItem(ADMIN_TOKEN_KEY) || '';
  } catch {
    return '';
  }
}

export function setAdminToken(token: string): void {
  try {
    window.localStorage.setItem(ADMIN_TOKEN_KEY, token);
  } catch {
    // Ignore storage errors
  }
}

export function clearAdminToken(): void {
  try {
    window.localStorage.removeItem(ADMIN_TOKEN_KEY);
  } catch {
    // Ignore storage errors
  }
}

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function requestJson<T>(url: string, options: RequestInit = {}): Promise<T> {
  const token = getAdminToken();
  const headers = new Headers(options.headers || {});
  if (!headers.has('Content-Type') && options.body) {
    headers.set('Content-Type', 'application/json');
  }
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const res = await fetch(url, {
    ...options,
    headers,
  });

  const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  if (!res.ok) {
    if (res.status === 401 && url.startsWith('/api/admin/') && !url.endsWith('/login')) {
      clearAdminToken();
    }
    throw new ApiError(
      typeof data.error === 'string' ? data.error : 'Terjadi kendala saat menghubungi server.',
      res.status
    );
  }
  return data as T;
}

export async function fetchSiteData(): Promise<SiteDataResponse> {
  return requestJson<SiteDataResponse>('/api/site');
}

export async function submitPpdbRegistration(payload: {
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
}): Promise<{ registrationCode: string; registration: PpdbRegistrationRecord }> {
  return requestJson('/api/ppdb', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function fetchAdminSessionStatus(): Promise<{
  authenticated: boolean;
  pinRequired: boolean;
}> {
  try {
    const res = await requestJson<{ authenticated: boolean; pinRequired?: boolean }>(
      '/api/admin/session'
    );
    if (!res.authenticated && getAdminToken()) {
      clearAdminToken();
    }
    return {
      authenticated: Boolean(res.authenticated),
      pinRequired: Boolean(res.pinRequired),
    };
  } catch {
    return { authenticated: false, pinRequired: false };
  }
}

export async function checkAdminSession(): Promise<boolean> {
  const status = await fetchAdminSessionStatus();
  return status.authenticated;
}

export async function loginAdmin(passcode = ''): Promise<{ token: string; pinRequired: boolean }> {
  const res = await requestJson<{ token: string; pinRequired?: boolean }>('/api/admin/login', {
    method: 'POST',
    body: JSON.stringify({ passcode }),
  });
  setAdminToken(res.token);
  return { token: res.token, pinRequired: Boolean(res.pinRequired) };
}

export async function logoutAdmin(): Promise<void> {
  try {
    await requestJson('/api/admin/logout', { method: 'POST' });
  } catch {
    // Ignore logout network error
  } finally {
    clearAdminToken();
  }
}

export async function saveSchoolInfoApi(
  payload: SchoolInfo & { newAdminPasscode?: string; clearAdminPasscode?: boolean }
): Promise<{ schoolInfo: SchoolInfo; pinRequired?: boolean }> {
  return requestJson('/api/admin/school-info', {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export async function saveQuotasApi(
  quotas: Record<string, { capacity: number; enrolledCount: number }>
): Promise<void> {
  await requestJson('/api/admin/quotas', {
    method: 'PUT',
    body: JSON.stringify({ quotas }),
  });
}

export async function saveAdvantageApi(
  id: string | null,
  payload: Omit<AdvantageItem, 'id'>
): Promise<void> {
  if (id) {
    await requestJson(`/api/admin/advantages/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  } else {
    await requestJson('/api/admin/advantages', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }
}

export async function deleteAdvantageApi(id: string): Promise<void> {
  await requestJson(`/api/admin/advantages/${encodeURIComponent(id)}`, { method: 'DELETE' });
}

export async function saveProgramApi(
  editingCode: string | null,
  payload: SchoolProgram
): Promise<void> {
  if (editingCode) {
    await requestJson(`/api/admin/programs/${encodeURIComponent(editingCode)}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  } else {
    await requestJson('/api/admin/programs', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }
}

export async function deleteProgramApi(code: string): Promise<void> {
  await requestJson(`/api/admin/programs/${encodeURIComponent(code)}`, { method: 'DELETE' });
}

export async function saveTimelineApi(
  id: string | null,
  payload: Omit<TimelineStep, 'id'>
): Promise<void> {
  if (id) {
    await requestJson(`/api/admin/timeline/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  } else {
    await requestJson('/api/admin/timeline', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }
}

export async function deleteTimelineApi(id: string): Promise<void> {
  await requestJson(`/api/admin/timeline/${encodeURIComponent(id)}`, { method: 'DELETE' });
}

export async function saveTeacherApi(
  id: string | null,
  payload: Omit<TeacherProfile, 'id'>
): Promise<void> {
  if (id) {
    await requestJson(`/api/admin/teachers/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  } else {
    await requestJson('/api/admin/teachers', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }
}

export async function deleteTeacherApi(id: string): Promise<void> {
  await requestJson(`/api/admin/teachers/${encodeURIComponent(id)}`, { method: 'DELETE' });
}

export async function saveGalleryApi(
  id: string | null,
  payload: Omit<GalleryItem, 'id'>
): Promise<void> {
  if (id) {
    await requestJson(`/api/admin/gallery/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  } else {
    await requestJson('/api/admin/gallery', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }
}

export async function deleteGalleryApi(id: string): Promise<void> {
  await requestJson(`/api/admin/gallery/${encodeURIComponent(id)}`, { method: 'DELETE' });
}

export async function saveTestimonialApi(
  id: string | null,
  payload: Omit<TestimonialItem, 'id'>
): Promise<void> {
  if (id) {
    await requestJson(`/api/admin/testimonials/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  } else {
    await requestJson('/api/admin/testimonials', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }
}

export async function deleteTestimonialApi(id: string): Promise<void> {
  await requestJson(`/api/admin/testimonials/${encodeURIComponent(id)}`, { method: 'DELETE' });
}

export async function saveFaqApi(id: string | null, payload: Omit<FaqItem, 'id'>): Promise<void> {
  if (id) {
    await requestJson(`/api/admin/faqs/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  } else {
    await requestJson('/api/admin/faqs', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }
}

export async function deleteFaqApi(id: string): Promise<void> {
  await requestJson(`/api/admin/faqs/${encodeURIComponent(id)}`, { method: 'DELETE' });
}

export async function fetchRegistrationsApi(): Promise<PpdbRegistrationRecord[]> {
  const res = await requestJson<{ registrations: PpdbRegistrationRecord[] }>(
    '/api/admin/registrations'
  );
  return res.registrations || [];
}

export async function saveRegistrationApi(
  id: string | null,
  payload: Record<string, unknown>
): Promise<void> {
  if (id) {
    await requestJson(`/api/admin/registrations/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  } else {
    await requestJson('/api/admin/registrations', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }
}

export async function deleteRegistrationApi(id: string): Promise<void> {
  await requestJson(`/api/admin/registrations/${encodeURIComponent(id)}`, { method: 'DELETE' });
}
