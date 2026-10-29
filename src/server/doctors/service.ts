import { cacheLife, cacheTag } from "next/cache";

import type { DoctorPreview } from "@/types/content";

import { findPublicDoctors } from "./repository";

export const DOCTORS_CACHE_TAG = "doctors";

// The User table has no specialty yet: every doctor account is a dermatologist.
const DEFAULT_SPECIALTY = "Dermatologist";

/**
 * Doctors shown on the public site. Cached so the home page stays static;
 * a new doctor account appears within the hour (or at once after revalidateTag(DOCTORS_CACHE_TAG)).
 */
export async function getPublicDoctors(): Promise<DoctorPreview[]> {
  "use cache";
  cacheTag(DOCTORS_CACHE_TAG);
  cacheLife("hours");

  const doctors = await findPublicDoctors();
  return doctors.map((doctor) => ({
    id: doctor.id,
    name: `Dr ${doctor.prenom} ${doctor.nom}`,
    specialty: DEFAULT_SPECIALTY,
  }));
}
