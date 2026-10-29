import Link from "next/link";

import { Container } from "@/components/layout/container";
import { buttonVariants } from "@/components/ui/button";
import { doctorsSection, routes } from "@/content/home";
import { DoctorsRow } from "@/features/doctors/doctors-row";
import { getPublicDoctors } from "@/server/doctors/service";

import { SectionHeading } from "./section-heading";

/** Doctor accounts of the clinic, read from the database (cached, see server/doctors). */
export async function DoctorsSection() {
  const doctors = await getPublicDoctors();

  return (
    <section id="doctors" aria-labelledby="doctors-title" className="scroll-mt-24 bg-surface py-20 lg:py-28">
      <Container>
        <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <SectionHeading
            id="doctors-title"
            overline={doctorsSection.overline}
            title={doctorsSection.title}
            description={doctors.length > 0 ? doctorsSection.description : doctorsSection.empty}
          />
          <Link href={routes.book} className={buttonVariants({ variant: "secondary" })}>
            Book a consultation
          </Link>
        </div>
        {doctors.length > 0 ? (
          <div className="mt-12">
            <DoctorsRow doctors={doctors} />
          </div>
        ) : null}
      </Container>
    </section>
  );
}
