/**
 * Homepage content (English). Edit here; the database replaces the lists later.
 *
 * Content rules:
 * - Doctors come from the database (MEDECIN accounts, see server/doctors). Never add
 *   credentials, experience or availability that is not real.
 * - Treatments stay generic: no prices, results, success rates or guarantees.
 * - Testimonials stay empty until real, consented patient quotes exist.
 *   The section is hidden while this list is empty.
 */
import type {
  NavLink,
  Step,
  Testimonial,
  Treatment,
  TreatmentCategory,
} from "@/types/content";

export const routes = {
  home: "/",
  analysis: "/analysis/new",
  book: "/book",
  login: "/login",
  register: "/register",
  dashboard: "/tableau-de-bord",
  reviews: "/reviews",
  recommendations: "/recommendations",
} as const;

/** Header links for a signed-in patient (replace the homepage section links). */
export const memberNavLinks: NavLink[] = [
  { label: "Dashboard", href: routes.dashboard },
  { label: "My analyses", href: "/analysis" },
  { label: "New analysis", href: routes.analysis },
  { label: "Doctors", href: "/#doctors" },
  { label: "Pre-consultations", href: "/preconsultation" },
];

/** Header links for a signed-in doctor. */
export const doctorNavLinks: NavLink[] = [
  { label: "Dashboard", href: routes.dashboard },
  { label: "Review queue", href: routes.reviews },
  { label: "Pre-consultations", href: "/reviews/preconsultation" },
  { label: "Recommendations", href: routes.recommendations },
];

export const navLinks: NavLink[] = [
  { label: "Treatments", href: "#treatments" },
  { label: "Skin analysis", href: "#skin-analysis" },
  { label: "Doctors", href: "#doctors" },
  { label: "How it works", href: "#how-it-works" },
];

export const hero = {
  overline: "AI-assisted skin analysis",
  titleLines: ["Your skin,", "carefully", "understood."],
  /** Index of the line rendered in italic. */
  italicLine: 2,
  description:
    "Share a photo of your skin. Our AI prepares a pre-analysis, and a dermatologist reviews every result before you see it.",
  primaryCta: { label: "Analyze my skin", href: routes.analysis },
  secondaryCta: { label: "Book a consultation", href: routes.book },
  reviewChip: "Reviewed by a dermatologist",
  previewTitle: "Analysis preview",
  previewNote: "Illustration",
};

export const trustFacts: string[] = [
  "Every AI result is reviewed by a dermatologist",
  "Your photos stay private",
  "Consult in clinic or by video",
];

export const howItWorks = {
  overline: "How it works",
  title: "Three calm steps",
  steps: [
    {
      title: "Share a photo",
      description: "Take or upload one clear photo of your face, in natural light.",
    },
    {
      title: "AI pre-analysis",
      description: "Our AI highlights areas to look at, such as spots, redness or texture.",
    },
    {
      title: "Doctor review",
      description:
        "A dermatologist checks the result and suggests next steps, in clinic or by video.",
    },
  ] satisfies Step[],
};

export const aiShowcase = {
  overline: "Skin analysis",
  title: "Technology that prepares, a doctor who decides",
  steps: [
    {
      title: "A guided photo",
      description:
        "A simple guide helps you take a clear, well-lit photo. Your image is stored privately and only shared with your doctor.",
    },
    {
      title: "An AI pre-analysis",
      description:
        "The AI marks areas worth a closer look and groups them by type. It is a starting point, not a diagnosis.",
    },
    {
      title: "Reviewed by a dermatologist",
      description:
        "A doctor confirms or adjusts every finding before you see your report, then suggests treatments and a consultation if needed.",
    },
  ] satisfies Step[],
  findings: [
    { id: 1, label: "Pigmentation", tone: "orange" },
    { id: 2, label: "Redness", tone: "rose" },
    { id: 3, label: "Texture", tone: "blue" },
  ] as const,
};

export const treatmentCategories: { id: TreatmentCategory; label: string }[] = [
  { id: "acne", label: "Acne care" },
  { id: "pigmentation", label: "Pigmentation care" },
  { id: "texture", label: "Skin texture" },
  { id: "rejuvenation", label: "Skin rejuvenation" },
];

export const treatments: Treatment[] = [
  {
    id: "chemical-peel",
    name: "Chemical peel",
    category: "pigmentation",
    description: "A gentle exfoliating treatment applied to the skin's surface.",
  },
  {
    id: "acne-treatment",
    name: "Acne treatment",
    category: "acne",
    description: "A care plan adapted to your skin, discussed with your doctor.",
  },
  {
    id: "microneedling",
    name: "Microneedling",
    category: "texture",
    description: "A procedure using fine needles, performed in the clinic.",
  },
  {
    id: "laser-treatment",
    name: "Laser treatment",
    category: "rejuvenation",
    description: "A light-based treatment chosen after a consultation.",
  },
];

export const treatmentsSection = {
  overline: "Treatments",
  title: "Care chosen with your doctor",
  description: "Every treatment starts with a consultation. Your doctor recommends what suits your skin.",
};

export const doctorsSection = {
  overline: "Our doctors",
  title: "The people behind every review",
  description: "The dermatologists who review every pre-analysis and sign every report.",
  empty: "Doctor profiles will be published here.",
};

export const testimonialsSection = {
  overline: "Patient stories",
  title: "In their words",
};

/** Keep empty until real, consented patient testimonials are provided. */
export const testimonials: Testimonial[] = [];

export const closingCta = {
  title: "Begin with a photo, continue with a doctor.",
  description: "Start your skin analysis or book a consultation with our team.",
  primaryCta: { label: "Analyze my skin", href: routes.analysis },
  secondaryCta: { label: "Book a consultation", href: routes.book },
};

export const footer = {
  tagline: "Aesthetic dermatology, guided by doctors.",
  /** Placeholders until the clinic provides its details. */
  address: "Clinic address to be provided",
  hours: "Opening hours to be provided",
  columns: [
    {
      title: "Explore",
      links: [
        { label: "Treatments", href: "/#treatments" },
        { label: "Skin analysis", href: "/#skin-analysis" },
        { label: "Doctors", href: "/#doctors" },
      ],
    },
    {
      title: "Patients",
      links: [
        { label: "Book a consultation", href: routes.book },
        { label: "Log in", href: routes.login },
      ],
    },
  ] satisfies { title: string; links: NavLink[] }[],
  legal: "Information on this site does not replace a medical consultation.",
};

export const photoPlaceholderLabel = "Photo to be provided";
