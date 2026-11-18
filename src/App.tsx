import { useCallback, useEffect, useState } from 'react';
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
import { checkAdminSession, fetchSiteData } from './lib/api';

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
  const [isAdminUser, setIsAdminUser] = useState(false);
  const [adminOpen, setAdminOpen] = useState(false);
  const [adminIntent, setAdminIntent] = useState<AdminOpenIntent | null>(null);

  const refreshSiteData = useCallback(async () => {
    try {
      const data = await fetchSiteData();
      if (data.schoolInfo) setSchoolInfo(data.schoolInfo);
      if (Array.isArray(data.advantages)) setAdvantages(data.advantages);
      if (Array.isArray(data.programs) && data.programs.length > 0) {
        setPrograms(data.programs);
        setSelectedProgram((prev) =>
          data.programs.some((p) => p.code === prev) ? prev : data.programs[0].code
        );
      } else if (Array.isArray(data.programs)) {
        setPrograms([]);
      }
      if (Array.isArray(data.timelineSteps)) setTimelineSteps(data.timelineSteps);
      if (data.quotas && typeof data.quotas === 'object') setQuotas(data.quotas);
      if (Array.isArray(data.teachers)) setTeachers(data.teachers);
      if (Array.isArray(data.galleryItems)) setGalleryItems(data.galleryItems);
      if (Array.isArray(data.testimonials)) setTestimonials(data.testimonials);
      if (Array.isArray(data.faqs)) setFaqs(data.faqs);
    } catch (err) {
      console.warn('Site data fetch warning:', err);
    }
  }, []);

  useEffect(() => {
    void refreshSiteData();
    void checkAdminSession().then((authenticated) => {
      setIsAdminUser(authenticated);
      setAuthReady(true);
    });
  }, [refreshSiteData]);

  useEffect(() => {
    document.title = `${schoolInfo.name} | ${schoolInfo.shortTagline}`;
  }, [schoolInfo.name, schoolInfo.shortTagline]);

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
            onRegistered={() => void refreshSiteData()}
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
          isAdminUser={isAdminUser}
          onAuthChange={setIsAdminUser}
          onDataChanged={refreshSiteData}
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
