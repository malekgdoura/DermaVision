/** Authentication pages content (English). */
export const authContent = {
  login: {
    overline: "Patient and doctor access",
    title: "Welcome back",
    description: "Log in to follow your skin analyses, reports and appointments.",
    submit: "Log in",
    loading: "Logging in…",
    switchPrompt: "New to DermaVision?",
    switchLink: "Create an account",
  },
  register: {
    overline: "Create your account",
    title: "Begin with care",
    description: "Create your patient account to start a skin analysis and book consultations.",
    submit: "Create my account",
    loading: "Creating your account…",
    switchPrompt: "Already have an account?",
    switchLink: "Log in",
    passwordHint: "At least 8 characters.",
  },
  panel: {
    title: "A doctor reviews every result.",
    points: [
      "Every AI pre-analysis is checked by a dermatologist",
      "Your photos and records stay private",
      "Consult in clinic or by video",
    ],
  },
  patientDashboard: {
    overline: "Your DermaVision",
    welcome: "Welcome,",
    description: "Everything for your skin in one place. Every AI pre-analysis is reviewed by a dermatologist.",
    modulesTitle: "DermaVision modules",
    comingSoonBadge: "Coming soon",
    modules: {
      skinAnalysis: {
        title: "Skin analysis",
        text: "Share a front-facing photo and receive an AI pre-analysis.",
        cta: "Start a scan",
      },
      myAnalyses: {
        title: "My analyses",
        text: "Every photo you have shared, from the most recent.",
        cta: "Open",
        count: (n: number) => (n === 0 ? "No analysis yet" : n === 1 ? "1 analysis" : `${n} analyses`),
      },
      compare: {
        title: "Compare scans",
        text: "Put two pre-analyses side by side.",
        cta: "Compare",
        locked: "Available after two analyses with a result",
      },
      doctorReview: {
        title: "Doctor reports",
        text: "Your dermatologist's reviewed report on each pre-analysis.",
        cta: "Open",
        count: (n: number) => (n === 0 ? "No report yet" : n === 1 ? "1 reviewed report" : `${n} reviewed reports`),
      },
      appointments: {
        title: "Appointments",
        text: "Book and join consultations, in clinic or by video.",
      },
      products: {
        title: "Products & ingredients",
        text: "Check your skincare products against your skin profile.",
      },
      documents: {
        title: "Documents & treatment safety",
        text: "Import prescriptions and see treatment precautions.",
      },
    },
  },
  dashboard: {
    overline: "Your account",
    description: "Your personal space is being prepared. Analyses, reports and appointments will appear here.",
    signOut: "Sign out",
  },
} as const;
