/** Copy for the doctor's review module (/reviews) and the published report on the patient side. */

export const reviewQueue = {
  overline: "Medical review",
  title: "Review queue",
  description: "AI pre-analyses waiting for a dermatologist, oldest first. Nothing reaches the patient before you publish it.",
  count: (n: number) => (n === 0 ? "No analysis waiting" : n === 1 ? "1 analysis to review" : `${n} analyses to review`),
  columns: { patient: "Patient", received: "Received", ai: "AI result", progress: "Progress" },
  signs: (n: number) => (n === 0 ? "No sign noticed" : n === 1 ? "1 sign noticed" : `${n} signs noticed`),
  progress: {
    waiting: "Not started",
    indicators: "Indicators validated",
    drafts: (n: number) => (n === 1 ? "1 report version" : `${n} report versions`),
  },
  assignedTo: (name: string) => `Taken by Dr ${name}`,
  you: "Taken by you",
  open: "Review",
  view: "View",
  empty: {
    title: "The queue is empty",
    text: "New analyses appear here as soon as the AI pre-analysis is ready.",
  },
  notDoctor: {
    title: "The review queue is for doctors",
    text: "Patients find their reviewed reports on each analysis page.",
    cta: "Back to your account",
  },
} as const;

export const reviewWorkspace = {
  overline: "Medical review",
  title: (name: string) => `Review for ${name}`,
  backToQueue: "Back to the queue",
  receivedOn: "Received on",
  photoAlt: "Photo submitted by the patient",
  photoCaption: "Patient photo",

  readOnly: {
    assigned: (name: string) => `Dr ${name} is reviewing this analysis. You can read it but not change it.`,
    published: "This report is published. It is kept read-only, with its full history.",
  },

  steps: {
    indicators: "1. Indicators",
    report: "2. Report",
    publish: "3. Publish",
  },

  patient: {
    title: "Patient",
    email: "Email",
    phone: "Phone",
    memberSince: "Patient since",
    analyses: "Analyses",
    noPhone: "Not provided",
  },

  indicators: {
    title: "Check the AI indicators",
    description:
      "Tick every sign you confirm on the photo, untick the ones you do not. Changes are marked so the report and the patient know what you corrected.",
    skinType: "Skin type",
    aiSuggested: "AI",
    aiConfidence: "AI confidence",
    present: "Present",
    corrected: "Corrected",
    notes: "Clinical notes for the report",
    notesHint: "Optional. Used by the report assistant; never shown to the patient as is.",
    submit: "Validate indicators",
    resubmit: "Update indicators",
    validatedOn: "Validated on",
    corrections: (n: number) => (n === 0 ? "No correction to the AI result" : n === 1 ? "1 correction to the AI result" : `${n} corrections to the AI result`),
  },

  comparison: {
    title: "Compared with the previous review",
    reviewedOn: "Previous review published on",
    appeared: "New since last review",
    resolved: "No longer present",
    persistent: "Still present",
    skinType: (from: string, to: string) => `Skin type: ${from} → ${to}`,
    noChange: "No change in the validated indicators.",
    none: "First reviewed analysis for this patient.",
    previousReport: "Read the previous report",
  },

  report: {
    title: "Report",
    locked: "Validate the indicators first. The report assistant only uses findings you have confirmed.",
    style: "Style",
    styles: { SHORT: "Short", DETAILED: "Detailed", PATIENT_FRIENDLY: "Patient-friendly" },
    language: "Language",
    languages: { en: "English", fr: "French" },
    generate: "Generate AI draft",
    regenerate: "Generate a new draft",
    generating: "Writing the draft…",
    generateHint: "Only the validated findings and your notes are sent to the assistant: no name, email or photo.",
    unsavedWarning: "Generating a new draft will replace the text in the editor. Save your changes first?",
    editorLabel: "Report text",
    editorHint: "You stay responsible for the report: read and adapt the draft before publishing.",
    empty: "Generate a draft or write the report yourself.",
    aiDraftBadge: "Unedited AI draft",
    blockers: {
      empty: "Write the report before publishing.",
      uneditedDraft:
        "This is still the AI draft word for word. Edit it (correct, complete or adapt it to the patient) to unlock publishing.",
      confirm: "Tick the confirmation above to publish.",
    },
    save: "Save version",
    saving: "Saving…",
    unsaved: "Unsaved changes",
    confirm: "I have reviewed this report and take medical responsibility for it.",
    publish: "Publish to patient",
    publishing: "Publishing…",
    retry: "Try again",
    chars: (n: number) => `${n} characters`,
  },

  history: {
    title: "Version history",
    empty: "No version yet.",
    kinds: { AI_DRAFT: "AI draft", DOCTOR_EDIT: "Doctor edit", PUBLISHED: "Published" },
    by: (name: string) => `by Dr ${name}`,
    show: "Show",
    hide: "Hide",
    compare: "Changes since the previous version",
    first: "First version",
    useInEditor: "Load in editor",
  },
} as const;

export const patientReport = {
  overline: "Dermatologist report",
  title: "Your reviewed report",
  reviewedBy: (name: string) => `Reviewed and signed by Dr ${name}`,
  publishedOn: "Published on",
  disclaimer: {
    title: "Reviewed by your dermatologist",
    text: "The findings below were checked and corrected by your dermatologist. Contact them for any question about this report.",
  },
  correctedBadge: "Corrected by your dermatologist",
  signsTitle: "Signs confirmed by your dermatologist",
} as const;

export const doctorDashboard = {
  overline: "Your DermaVision",
  welcome: "Welcome, Dr",
  description: "AI pre-analyses waiting for your review, and the reports you published.",
  stats: {
    waiting: "Waiting for review",
    inReview: "In review",
    published: "Published by you",
  },
  openQueue: "Open the review queue",
  recentTitle: "Recently published",
  recentEmpty: "You have not published a report yet.",
} as const;
