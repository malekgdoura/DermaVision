/** Copy for the recommendation library (/recommendations) and its panel on the review screen. */

export const recommendationLibrary = {
  overline: "Medical review",
  title: "Recommendations",
  description:
    "Care advice written and validated by the doctors. Link each one to skin signs: it is suggested on the review screen when a patient has them.",
  newRecommendation: "New recommendation",
  count: (n: number) => (n === 0 ? "No recommendation" : n === 1 ? "1 recommendation" : `${n} recommendations`),

  filters: {
    search: "Search",
    searchPlaceholder: "Title or text",
    category: "Category",
    language: "Language",
    any: "All",
    status: "Show",
    active: "Active",
    archived: "Archived",
    apply: "Filter",
    reset: "Reset",
  },

  categories: {
    general: "General",
    inflammation: "Inflammation",
    pigmentation: "Pigmentation",
    texture: "Texture",
    wrinkles: "Lines",
    "eye-area": "Eye area",
    "skin-type": "Skin type",
  },
  languages: { en: "English", fr: "French" },

  linkedTo: "Suggested for",
  noSigns: "Not linked to a sign (general advice)",
  by: (name: string) => `by Dr ${name}`,
  updated: "Updated",
  yours: "Yours",

  edit: "Edit",
  archive: "Archive",
  restore: "Restore",
  archiveConfirm: "Archive this recommendation? It will no longer be suggested. You can restore it later.",

  saved: {
    created: "Recommendation created.",
    updated: "Recommendation updated.",
  },

  empty: {
    title: "No recommendation yet",
    text: "Write your first piece of advice and link it to the signs it answers, for example Acne or Oily skin.",
    filtered: "No recommendation matches these filters.",
    archived: "No archived recommendation.",
  },

  notDoctor: {
    title: "The recommendation library is for doctors",
    text: "Patients receive the advice inside their reviewed reports.",
    cta: "Back to your account",
  },

  form: {
    newTitle: "New recommendation",
    editTitle: "Edit recommendation",
    back: "Back to recommendations",
    title: "Title",
    titleHint: "Short, for doctors only. Example: Gentle cleansing",
    content: "Advice",
    contentHint: "The text that goes into the report, written for the patient.",
    category: "Category",
    language: "Language",
    signs: "Suggested when the patient has",
    signsHint: "Tick the signs this advice answers. Leave empty for general advice.",
    save: "Save",
    saving: "Saving…",
    cancel: "Cancel",
    notAuthor: "Only the doctor who wrote this recommendation can edit it.",
  },
} as const;

export const recommendationPicker = {
  title: "Recommendations from the library",
  description: "Tick the advice to use. It is sent to the report assistant, or you can insert it into the text yourself.",
  suggested: "Suggested for this patient",
  others: "Other recommendations",
  matches: "Matches",
  none: "No recommendation in this language yet.",
  manage: "Manage the library",
  insert: "Insert into the report",
  insertHeading: { en: "What you can do", fr: "Ce que vous pouvez faire" },
  selected: (n: number) => (n === 1 ? "1 selected" : `${n} selected`),
} as const;
