import { PhotoPlaceholder } from "@/components/ui/photo-placeholder";
import type { DoctorPreview } from "@/types/content";

/** Doctor preview card. Shows only what the clinic provides: no invented credentials or availability. */
export function DoctorCard({ doctor }: { doctor: DoctorPreview }) {
  return (
    <article className="group flex h-full flex-col">
      <div className="overflow-hidden rounded-lg">
        <div className="transition-transform duration-[600ms] ease-out-soft group-hover:scale-[1.04]">
          <PhotoPlaceholder alt={`Portrait of ${doctor.name}`} className="aspect-[4/5] w-full" />
        </div>
      </div>
      <div className="flex flex-col gap-1 pt-4">
        <h3 className="text-xl font-semibold">{doctor.name}</h3>
        <p className="text-muted-foreground">{doctor.specialty}</p>
      </div>
    </article>
  );
}
