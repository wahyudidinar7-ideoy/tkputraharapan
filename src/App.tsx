import { useCallback, useEffect, useState } from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { collection, doc, getDoc, onSnapshot, orderBy, query } from 'firebase/firestore';
import { AdminPortalModal, type AdminOpenIntent } from './components/AdminPortalModal';
import { ErrorBoundary } from './components/ErrorBoundary';
import { FooterAndWidgets } from './components/FooterAndWidgets';
import { HeroSection } from './components/HeroSection';
import { Navbar } from './components/Navbar';
import { PpdbSection } from './components/PpdbSection';
import { ProgramsAndTimeline, type QuotaMap } from './components/ProgramsAndTimeline';
import { TeachersAndGallery } from './components/TeachersAndGallery';
import { FaqSection, TestimonialsSection } from './components/TestimonialsAndFaq';
import {
  DAILY_TIMELINE,
  FAQS,
  GALLERY_ITEMS,
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
} from './data/schoolData';
import { auth, db, handleFirestoreError, OperationType, SCHOOL_ADMIN_EMAIL } from './lib/firebase';

const DEFAULT_QUOTAS: QuotaMap = PROGRAMS.reduce<QuotaMap>((acc, p) => {
  acc[p.code] = {
    capacity: p.maxPerClass,
    enrolledCount: p.defaultEnrolled,
  };
  return acc;
}, {});

export default function App() {
  const [schoolInfo, setSchoolInfo] = useState<SchoolInfo>(SCHOOL_INFO);
  const [advantages, setAdvantages] = useState<AdvantageItem[]>(WHY_CHOOSE_US);
  const [programs, setPrograms] = useState<SchoolProgram[]>(PROGRAMS);
  const [timelineSteps, setTimelineSteps] = useState<TimelineStep[]>(DAILY_TIMELINE);
  const [quotas, setQuotas] = useState<QuotaMap>(DEFAULT_QUOTAS);
  const [teachers, setTeachers] = useState<TeacherProfile[]>(TEACHERS);
  const [galleryItems, setGalleryItems] = useState<GalleryItem[]>(GALLERY_ITEMS);
  const [testimonials, setTestimonials] = useState<TestimonialItem[]>(TESTIMONIALS);
  const [faqs, setFaqs] = useState<FaqItem[]>(FAQS);

  const [selectedProgram, setSelectedProgram] = useState<ProgramCode>('kelompok_a');
  const [wantsTrialSignal, setWantsTrialSignal] = useState(0);

  // Admin state & modal controls
  const [authReady, setAuthReady] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAdminUser, setIsAdminUser] = useState(false);
  const [adminOpen, setAdminOpen] = useState(false);
  const [adminIntent, setAdminIntent] = useState<AdminOpenIntent | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user && user.emailVerified) {
        if (user.email === SCHOOL_ADMIN_EMAIL) {
          setIsAdminUser(true);
        } else {
          try {
            const adminDoc = await getDoc(doc(db, 'admins', user.uid));
            setIsAdminUser(adminDoc.exists());
          } catch {
            setIsAdminUser(false);
          }
        }
      } else {
        setIsAdminUser(false);
      }
      setAuthReady(true);
    });
    return () => unsub();
  }, []);

  // Real-time public non-PII quota listener
  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, 'ppdb_stats'),
      (snapshot) => {
        if (snapshot.empty) return;
        setQuotas((prev) => {
          const next = { ...prev };
          snapshot.docs.forEach((docSnap) => {
            const data = docSnap.data();
            const code = docSnap.id as ProgramCode;
            const prevEntry = prev[code];
            const capacity = Number(data.capacity) || prevEntry?.capacity || 20;
            const rawEnrolled = Number(data.enrolledCount);
            const enrolledCount = Number.isFinite(rawEnrolled)
              ? rawEnrolled
              : prevEntry?.enrolledCount ?? 0;
            next[code] = { capacity, enrolledCount };
          });
          return next;
        });
      },
      (error) => {
        console.warn('Quota sync warning:', error);
        if (error?.code === 'permission-denied') {
          handleFirestoreError(error, OperationType.LIST, 'ppdb_stats');
        }
      }
    );

    return () => unsub();
  }, []);

  // Real-time listener for school identity & principal settings
  useEffect(() => {
    const unsubSchool = onSnapshot(
      doc(db, 'site_settings', 'school_info'),
      (snapshot) => {
        if (!snapshot.exists()) {
          setSchoolInfo(SCHOOL_INFO);
          return;
        }
        const d = snapshot.data();
        setSchoolInfo({
          name: String(d.name || SCHOOL_INFO.name),
          shortTagline: String(d.shortTagline || SCHOOL_INFO.shortTagline),
          npsn: String(d.npsn || SCHOOL_INFO.npsn),
          accreditation: String(d.accreditation || SCHOOL_INFO.accreditation),
          curriculum: String(d.curriculum || SCHOOL_INFO.curriculum),
          foundedYear: Number(d.foundedYear) || SCHOOL_INFO.foundedYear,
          experienceYears: String(d.experienceYears || SCHOOL_INFO.experienceYears),
          studentCount: String(d.studentCount || SCHOOL_INFO.studentCount),
          teacherCount: String(d.teacherCount || SCHOOL_INFO.teacherCount),
          ratioText: String(d.ratioText || SCHOOL_INFO.ratioText),
          principalName: String(d.principalName || SCHOOL_INFO.principalName),
          principalQuote: String(d.principalQuote || SCHOOL_INFO.principalQuote),
          principalPhoto: d.principalPhoto ? String(d.principalPhoto) : undefined,
          address: String(d.address || SCHOOL_INFO.address),
          whatsappRaw: String(d.whatsappRaw || SCHOOL_INFO.whatsappRaw),
          whatsappDisplay: String(d.whatsappDisplay || SCHOOL_INFO.whatsappDisplay),
          instagramHandle: String(d.instagramHandle || SCHOOL_INFO.instagramHandle),
          facebookName: String(d.facebookName || SCHOOL_INFO.facebookName),
          youtubeName: String(d.youtubeName || SCHOOL_INFO.youtubeName),
          email: String(d.email || SCHOOL_INFO.email),
          schoolHoursA: String(d.schoolHoursA || SCHOOL_INFO.schoolHoursA),
          schoolHoursB: String(d.schoolHoursB || SCHOOL_INFO.schoolHoursB),
          serviceHours: String(d.serviceHours || SCHOOL_INFO.serviceHours),
          ppdbDeadlineIso: String(d.ppdbDeadlineIso || SCHOOL_INFO.ppdbDeadlineIso),
          youtubeVideoId: String(d.youtubeVideoId || SCHOOL_INFO.youtubeVideoId),
          videoThumbnail: d.videoThumbnail
            ? String(d.videoThumbnail)
            : SCHOOL_INFO.videoThumbnail,
          mapsEmbedUrl: String(d.mapsEmbedUrl || SCHOOL_INFO.mapsEmbedUrl),
          heroBadge: d.heroBadge ? String(d.heroBadge) : SCHOOL_INFO.heroBadge,
          heroTitle: d.heroTitle ? String(d.heroTitle) : SCHOOL_INFO.heroTitle,
          heroSubtitle: d.heroSubtitle ? String(d.heroSubtitle) : SCHOOL_INFO.heroSubtitle,
          heroImage: d.heroImage ? String(d.heroImage) : SCHOOL_INFO.heroImage,
        });
      },
      (error) => {
        console.warn('School info sync warning:', error);
      }
    );

    return () => unsubSchool();
  }, []);

  useEffect(() => {
    document.title = `${schoolInfo.name} | ${schoolInfo.shortTagline}`;
  }, [schoolInfo.name, schoolInfo.shortTagline]);

  // Real-time listeners for admin-editable school content (fallback to defaults when empty)
  useEffect(() => {
    const unsubAdvantages = onSnapshot(
      query(collection(db, 'site_advantages'), orderBy('sortOrder', 'asc')),
      (snapshot) => {
        if (snapshot.empty) {
          setAdvantages(WHY_CHOOSE_US);
          return;
        }
        setAdvantages(
          snapshot.docs.map((d) => {
            const data = d.data();
            return {
              id: d.id,
              emoji: String(data.emoji || '✨'),
              title: String(data.title || ''),
              description: String(data.description || ''),
              bgClass: String(data.bgClass || 'bg-[#fef9c3]'),
              borderClass: String(data.borderClass || 'border-[#fde047]'),
            };
          })
        );
      },
      (error) => {
        console.warn('Advantages sync warning:', error);
      }
    );

    const unsubPrograms = onSnapshot(
      query(collection(db, 'site_programs'), orderBy('sortOrder', 'asc')),
      (snapshot) => {
        if (snapshot.empty) {
          setPrograms(PROGRAMS);
          return;
        }
        const parsedPrograms: SchoolProgram[] = snapshot.docs.map((d) => {
          const data = d.data();
          const rawHighlights = Array.isArray(data.highlights) ? data.highlights : [];
          const highlights = rawHighlights
            .map((h) => String(h || '').trim())
            .filter(Boolean);
          const rawSchedule = Array.isArray(data.weeklySchedule) ? data.weeklySchedule : [];
          const weeklySchedule = rawSchedule
            .map((item) => ({
              day: String(item?.day || '').trim(),
              activity: String(item?.activity || '').trim(),
            }))
            .filter((item) => item.day && item.activity);

          const maxPerClass = Number(data.maxPerClass) || 20;
          const rawDefaultEnrolled = Number(data.defaultEnrolled);
          const defaultEnrolled = Number.isFinite(rawDefaultEnrolled)
            ? Math.min(maxPerClass, Math.max(0, rawDefaultEnrolled))
            : 0;

          return {
            code: String(data.code || d.id),
            name: String(data.name || ''),
            ageRange: String(data.ageRange || ''),
            scheduleHours: String(data.scheduleHours || ''),
            maxPerClass,
            defaultEnrolled,
            feeSummary: String(data.feeSummary || ''),
            registrationFee: String(data.registrationFee || ''),
            monthlyFee: String(data.monthlyFee || ''),
            accentBg: String(data.accentBg || 'bg-[#fef9c3]'),
            accentBorder: String(data.accentBorder || 'border-[#facc15]'),
            buttonBg: String(data.buttonBg || 'bg-[#facc15] hover:bg-[#eab308] text-slate-900'),
            emoji: String(data.emoji || '🎒'),
            summary: String(data.summary || ''),
            highlights: highlights.length > 0 ? highlights : ['Belajar sambil bermain'],
            weeklySchedule:
              weeklySchedule.length > 0
                ? weeklySchedule
                : [{ day: 'Senin - Jumat', activity: 'Kegiatan belajar sambil bermain' }],
          };
        });

        setPrograms(parsedPrograms);
        setSelectedProgram((prev) =>
          parsedPrograms.some((p) => p.code === prev)
            ? prev
            : parsedPrograms[0]?.code ?? 'kelompok_a'
        );
        setQuotas((prev) => {
          const next = { ...prev };
          parsedPrograms.forEach((p) => {
            if (!next[p.code]) {
              next[p.code] = {
                capacity: p.maxPerClass,
                enrolledCount: p.defaultEnrolled,
              };
            }
          });
          return next;
        });
      },
      (error) => {
        console.warn('Programs sync warning:', error);
      }
    );

    const unsubTimeline = onSnapshot(
      query(collection(db, 'site_timeline'), orderBy('sortOrder', 'asc')),
      (snapshot) => {
        if (snapshot.empty) {
          setTimelineSteps(DAILY_TIMELINE);
          return;
        }
        setTimelineSteps(
          snapshot.docs.map((d) => {
            const data = d.data();
            return {
              id: d.id,
              time: String(data.time || ''),
              emoji: String(data.emoji || '🌟'),
              title: String(data.title || ''),
              description: String(data.description || ''),
              color: String(data.color || 'bg-[#fef08a] text-slate-900'),
            };
          })
        );
      },
      (error) => {
        console.warn('Timeline sync warning:', error);
      }
    );

    const unsubTeachers = onSnapshot(
      query(collection(db, 'site_teachers'), orderBy('sortOrder', 'asc')),
      (snapshot) => {
        if (snapshot.empty) {
          setTeachers(TEACHERS);
          return;
        }
        setTeachers(
          snapshot.docs.map((d) => {
            const data = d.data();
            return {
              id: d.id,
              name: String(data.name || ''),
              role: String(data.role || ''),
              slogan: String(data.slogan || ''),
              experience: String(data.experience || ''),
              photo: String(data.photo || ''),
              badgeColor: String(data.badgeColor || 'bg-[#fef08a]'),
              initials: String(data.initials || 'TK'),
            };
          })
        );
      },
      (error) => {
        console.warn('Teachers sync warning:', error);
      }
    );

    const unsubGallery = onSnapshot(
      query(collection(db, 'site_gallery'), orderBy('sortOrder', 'asc')),
      (snapshot) => {
        if (snapshot.empty) {
          setGalleryItems(GALLERY_ITEMS);
          return;
        }
        setGalleryItems(
          snapshot.docs.map((d) => {
            const data = d.data();
            return {
              id: d.id,
              title: String(data.title || ''),
              category: data.category as GalleryItem['category'],
              description: String(data.description || ''),
              image: String(data.image || ''),
              alt: String(data.alt || ''),
            };
          })
        );
      },
      (error) => {
        console.warn('Gallery sync warning:', error);
      }
    );

    const unsubTestimonials = onSnapshot(
      query(collection(db, 'site_testimonials'), orderBy('sortOrder', 'asc')),
      (snapshot) => {
        if (snapshot.empty) {
          setTestimonials(TESTIMONIALS);
          return;
        }
        setTestimonials(
          snapshot.docs.map((d) => {
            const data = d.data();
            return {
              id: d.id,
              parentName: String(data.parentName || ''),
              childInfo: String(data.childInfo || ''),
              rating: Number(data.rating || 5),
              quote: String(data.quote || ''),
              avatarColor: String(data.avatarColor || 'bg-[#fef08a]'),
              initials: String(data.initials || 'OT'),
            };
          })
        );
      },
      (error) => {
        console.warn('Testimonials sync warning:', error);
      }
    );

    const unsubFaqs = onSnapshot(
      query(collection(db, 'site_faqs'), orderBy('sortOrder', 'asc')),
      (snapshot) => {
        if (snapshot.empty) {
          setFaqs(FAQS);
          return;
        }
        setFaqs(
          snapshot.docs.map((d) => {
            const data = d.data();
            return {
              id: d.id,
              question: String(data.question || ''),
              answer: String(data.answer || ''),
            };
          })
        );
      },
      (error) => {
        console.warn('FAQs sync warning:', error);
      }
    );

    return () => {
      unsubAdvantages();
      unsubPrograms();
      unsubTimeline();
      unsubTeachers();
      unsubGallery();
      unsubTestimonials();
      unsubFaqs();
    };
  }, []);

  const scrollToSection = useCallback((sectionId: string) => {
    const el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, []);

  const handleSelectProgramForPpdb = useCallback(
    (code: ProgramCode) => {
      setSelectedProgram(code);
      scrollToSection('ppdb');
    },
    [scrollToSection]
  );

  const handleStartTrialFromPopup = useCallback(() => {
    setWantsTrialSignal((n) => n + 1);
    scrollToSection('ppdb');
  }, [scrollToSection]);

  const openAdmin = useCallback((intent?: AdminOpenIntent) => {
    setAdminIntent(intent ?? { tab: 'pendaftar', mode: 'list' });
    setAdminOpen(true);
  }, []);

  return (
    <ErrorBoundary>
      <div className="min-h-screen flex flex-col bg-[#fffbeb] text-slate-800">
        <Navbar
          schoolInfo={schoolInfo}
          onNavigate={scrollToSection}
          onOpenAdmin={() => openAdmin()}
          isAdminUser={isAdminUser}
        />

        <main className="flex-1">
          <HeroSection
            schoolInfo={schoolInfo}
            onNavigate={scrollToSection}
            isAdminUser={isAdminUser}
            onAdminAction={(intent) => openAdmin(intent)}
          />

          <ProgramsAndTimeline
            schoolInfo={schoolInfo}
            advantages={advantages}
            programs={programs}
            timelineSteps={timelineSteps}
            quotas={quotas}
            onSelectProgramForPpdb={handleSelectProgramForPpdb}
            isAdminUser={isAdminUser}
            onAdminAction={(intent) => openAdmin(intent)}
          />

          <TeachersAndGallery
            schoolInfo={schoolInfo}
            teachers={teachers}
            galleryItems={galleryItems}
            isAdminUser={isAdminUser}
            onAdminAction={(intent) => openAdmin(intent)}
          />

          <TestimonialsSection
            testimonials={testimonials}
            isAdminUser={isAdminUser}
            onAdminAction={(intent) => openAdmin(intent)}
          />

          <PpdbSection
            schoolInfo={schoolInfo}
            programs={programs}
            quotas={quotas}
            selectedProgram={selectedProgram}
            onChangeProgram={setSelectedProgram}
            wantsTrialSignal={wantsTrialSignal}
            onOpenAdmin={() => openAdmin({ tab: 'pendaftar', mode: 'list' })}
            onAdminAction={(intent) => openAdmin(intent)}
            isAdminUser={isAdminUser}
          />

          <FaqSection
            faqs={faqs}
            isAdminUser={isAdminUser}
            onAdminAction={(intent) => openAdmin(intent)}
          />
        </main>

        <FooterAndWidgets
          schoolInfo={schoolInfo}
          onNavigate={scrollToSection}
          onStartTrialFromPopup={handleStartTrialFromPopup}
          onOpenAdmin={() => openAdmin()}
          onAdminAction={(intent) => openAdmin(intent)}
          isAdminUser={isAdminUser}
        />

        <AdminPortalModal
          isOpen={adminOpen}
          onClose={() => setAdminOpen(false)}
          authReady={authReady}
          currentUser={currentUser}
          isAdminUser={isAdminUser}
          schoolInfo={schoolInfo}
          advantages={advantages}
          programs={programs}
          timelineSteps={timelineSteps}
          quotas={quotas}
          teachers={teachers}
          galleryItems={galleryItems}
          testimonials={testimonials}
          faqs={faqs}
          intent={adminIntent}
        />
      </div>
    </ErrorBoundary>
  );
}
