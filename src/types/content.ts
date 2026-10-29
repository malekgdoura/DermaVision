export type NavLink = {
  label: string;
  href: string;
};

export type TreatmentCategory = "acne" | "pigmentation" | "texture" | "rejuvenation";

export type Treatment = {
  id: string;
  name: string;
  category: TreatmentCategory;
  /** One short, neutral sentence. No claims, prices or guarantees. */
  description: string;
};

export type DoctorPreview = {
  id: string;
  /** Display name, e.g. "Dr Amel Ben Salah". */
  name: string;
  specialty: string;
};

export type Testimonial = {
  id: string;
  quote: string;
  /** Initials only, with the patient's consent. */
  initials: string;
  context?: string;
};

export type Step = {
  title: string;
  description: string;
};
