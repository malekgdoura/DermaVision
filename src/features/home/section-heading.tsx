import { Reveal } from "@/components/motion";
import { cn } from "@/lib/utils";

type SectionHeadingProps = {
  id: string;
  overline: string;
  title: string;
  description?: string;
  align?: "left" | "center";
  className?: string;
};

/** Overline + Cormorant H2 + optional intro, revealed on scroll. */
export function SectionHeading({ id, overline, title, description, align = "left", className }: SectionHeadingProps) {
  return (
    <Reveal className={cn("flex max-w-2xl flex-col gap-4", align === "center" && "mx-auto items-center text-center", className)}>
      <p className="overline-text">{overline}</p>
      <h2 id={id} className="font-display text-[2rem] leading-[1.1] sm:text-[2.5rem] lg:text-[2.75rem]">
        {title}
      </h2>
      {description && <p className="text-lg leading-[1.65] text-foreground">{description}</p>}
    </Reveal>
  );
}
