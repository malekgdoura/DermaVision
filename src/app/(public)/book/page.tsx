import type { Metadata } from "next";

import { ComingSoon } from "@/features/home/coming-soon";

export const metadata: Metadata = { title: "Book a consultation" };

export default function BookPage() {
  return (
    <ComingSoon
      overline="Appointments"
      title="Book a consultation"
      description="Online booking for in-clinic visits and video consultations is on its way."
    />
  );
}
