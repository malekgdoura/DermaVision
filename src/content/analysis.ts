/** Copy for the skin analysis upload page (/analysis/new). */

export const analysisUpload = {
  overline: "Skin analysis",
  title: "A clear look at your skin, in one photo",
  description:
    "Share a front-facing photo. Our AI prepares a pre-analysis, then a dermatologist reviews it before you see any result.",
  guidelines: [
    { title: "Face the camera", text: "Look straight ahead, hair away from your face, no glasses." },
    { title: "Soft, even light", text: "Daylight near a window works best. Avoid flash and strong shadows." },
    { title: "Bare skin", text: "No makeup or filter, so the analysis sees your skin as it is." },
  ],
  privacy: "Your photo is stored privately and only seen by you and your dermatologist.",
  requirements: "JPEG only · 2 MB max",

  dropPrompt: "Drop your photo here",
  dropActive: "Release to place your photo",
  choosePhoto: "Choose photo",
  changePhoto: "Change photo",
  analyze: "Analyze skin",
  analyzing: "Analyzing…",
  tryAgain: "Try again",
  newAnalysis: "Start a new analysis",

  stageLabel: "Skin scanner",
  previewAlt: "Your selected photo",

  status: {
    empty: "Awaiting photo",
    ready: "Photo ready",
    scanning: "Scanning skin",
    done: "Sent for review",
    error: "Not analyzed",
  },

  errors: {
    type: "Please choose a JPEG photo (.jpg or .jpeg).",
    size: "This photo is larger than 2 MB. Please choose a smaller one.",
    multiple: "Please choose a single photo.",
    unexpected: "Something went wrong. Please try again.",
  },

  success: {
    title: "Your photo has been analyzed",
    text: "Your AI pre-analysis is ready. A dermatologist will review it.",
    cta: "View your pre-analysis",
  },

  notPatient: {
    title: "Skin analysis is for patients",
    text: "This space lets patients submit a photo for analysis. Doctors and administrators will review analyses from their own dashboard.",
    cta: "Back to your account",
  },
} as const;

/** Copy for the analysis result page (/analysis/[id]). */
export const analysisResult = {
  overline: "Skin analysis",
  title: "Your skin pre-analysis",
  analyzedOn: "Analyzed on",
  photoAlt: "The photo used for this analysis",
  photoCaption: "Analyzed photo",

  disclaimer: {
    title: "AI pre-analysis, not a medical diagnosis",
    text: "These observations come from an automated analysis of your photo. Only your dermatologist can interpret them and recommend a treatment.",
  },

  status: {
    PROCESSING: "Analysis in progress",
    AI_DONE: "Awaiting dermatologist review",
    IN_REVIEW: "Being reviewed by a dermatologist",
    FAILED: "Analysis failed",
    VALIDATED: "Reviewed by your dermatologist",
  },

  skinType: {
    overline: "Skin type",
    confidence: "AI confidence",
    breakdown: "How the AI weighed each skin type",
    closeCall: "The AI hesitated between two skin types. Your dermatologist will confirm.",
  },

  signs: {
    overline: "Observations",
    title: "Signs the AI noticed",
    none: "The AI did not notice any of the signs it looks for.",
    confidence: "AI confidence",
    lowConfidence: "Low confidence",
    notDetectedTitle: "Not noticed",
  },

  categories: {
    inflammation: "Inflammation",
    pigmentation: "Pigmentation",
    texture: "Texture",
    wrinkles: "Lines",
    "eye-area": "Eye area",
    "skin-type": "Skin type",
  },

  zones: {
    forehead: "Forehead",
    "left-cheek": "Left cheek",
    "right-cheek": "Right cheek",
    jaw: "Jaw",
    eyes: "Eyes",
    "between-brows": "Between the brows",
    "nose-to-mouth": "Nose to mouth",
  },

  next: {
    title: "What happens next",
    text: "A dermatologist reviews every pre-analysis. You can also book a consultation to talk about your skin in person or by video.",
    book: "Book a consultation",
    newAnalysis: "New analysis",
  },

  unavailable: {
    PROCESSING: "Your photo is still being analyzed. Come back in a moment.",
    FAILED: "We could not analyze this photo. You can try again with a new one.",
    missing: "No result is available for this analysis.",
  },
} as const;

/** Copy for the analysis history page (/analysis). */
export const analysisHistory = {
  overline: "Skin analysis",
  title: "Your analysis history",
  description: "Every photo you have shared, from the most recent. Each pre-analysis is reviewed by a dermatologist.",
  count: (n: number) => (n === 1 ? "1 analysis" : `${n} analyses`),
  newAnalysis: "New analysis",
  view: "View analysis",
  photoAlt: (date: string) => `Photo analyzed on ${date}`,
  noSigns: "No sign noticed",
  moreSigns: (n: number) => `+${n} more`,
  pending: {
    PROCESSING: "Your photo is still being analyzed.",
    FAILED: "This photo could not be analyzed.",
  },
  empty: {
    title: "No analysis yet",
    text: "Share a front-facing photo to receive your first AI pre-analysis, reviewed by a dermatologist.",
    cta: "Start your first analysis",
  },
  notPatient: {
    title: "Analysis history is for patients",
    text: "Doctors and administrators will find analyses in their own dashboard.",
    cta: "Back to your account",
  },
} as const;

/** Copy for the progress tracking page (/analysis/compare). */
export const analysisCompare = {
  overline: "Progress tracking",
  title: "Compare two scans",
  description: "Put two of your pre-analyses side by side to see what the AI noticed in each one.",
  disclaimer: {
    title: "A side-by-side view, not a diagnosis",
    text: "This page only compares what the AI noticed on two photos. Differences can come from lighting, angle or camera. Only your dermatologist can interpret how your skin has changed.",
  },
  picker: {
    first: "First scan",
    second: "Second scan",
    submit: "Compare",
  },
  sameScan: "Please choose two different scans.",
  photoAlt: (label: string, date: string) => `${label}, photo analyzed on ${date}`,
  skinType: {
    overline: "Skin type",
    same: "The AI reported the same skin type on both scans.",
    different: "The AI reported a different skin type on each scan.",
  },
  groups: {
    common: {
      title: "Noticed on both scans",
      empty: "No sign was noticed on both scans.",
    },
    appeared: {
      title: "Noticed on the second scan only",
      empty: "No sign was noticed only on the second scan.",
    },
    notDetected: {
      title: "Not noticed on the second scan",
      empty: "Every sign noticed on the first scan was noticed again.",
    },
  },
  confidence: "AI confidence",
  notNoticed: "Not noticed",
  viewScan: "View scan",
  empty: {
    title: "Two scans are needed",
    text: "Progress tracking compares two analyses with a result. Take a new photo to start comparing.",
    cta: "New analysis",
  },
  backToHistory: "Back to analyses",
  notPatient: {
    title: "Progress tracking is for patients",
    text: "Doctors and administrators will compare analyses from their own dashboard.",
    cta: "Back to your account",
  },
} as const;
