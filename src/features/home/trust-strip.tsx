import { Container } from "@/components/layout/container";
import { Stagger, StaggerItem } from "@/components/motion";
import { trustFacts } from "@/content/home";

export function TrustStrip() {
  return (
    <section aria-label="Why DermaVision" className="border-y border-border bg-surface">
      <Container>
        <Stagger className="grid divide-y divide-border sm:grid-cols-3 sm:divide-x sm:divide-y-0">
          {trustFacts.map((fact) => (
            <StaggerItem key={fact} className="flex items-center gap-3 py-6 sm:justify-center sm:px-6 sm:py-8 sm:text-center">
              <span aria-hidden="true" className="size-1.5 shrink-0 rounded-full bg-primary" />
              <p className="text-[0.9375rem] font-medium text-heading">{fact}</p>
            </StaggerItem>
          ))}
        </Stagger>
      </Container>
    </section>
  );
}
