import { cn } from "@/lib/utils";

/**
 * Renders a report written in the plain-text format of the report assistant:
 * a short line without final punctuation is a section title, "- " lines are bullets, the rest paragraphs.
 * Text only (no HTML injection): every piece goes through React escaping.
 */
export function ReportText({ content, className }: { content: string; className?: string }) {
  const blocks = parseReport(content);

  return (
    <div className={cn("flex flex-col gap-3 text-[0.9375rem] leading-[1.65] text-foreground", className)}>
      {blocks.map((block, index) => {
        if (block.type === "title") {
          return (
            <h3 key={index} className="mt-2 font-semibold text-heading first:mt-0">
              {block.text}
            </h3>
          );
        }
        if (block.type === "list") {
          return (
            <ul key={index} className="flex list-disc flex-col gap-1 pl-5 marker:text-primary">
              {block.items.map((item, itemIndex) => (
                <li key={itemIndex}>{item}</li>
              ))}
            </ul>
          );
        }
        return <p key={index}>{block.text}</p>;
      })}
    </div>
  );
}

type Block = { type: "title"; text: string } | { type: "paragraph"; text: string } | { type: "list"; items: string[] };

export function parseReport(content: string): Block[] {
  const blocks: Block[] = [];
  const lines = content.replace(/\r\n/g, "\n").split("\n");

  for (let index = 0; index < lines.length; index++) {
    const line = lines[index].trim();
    if (!line) continue;

    const bullet = line.match(/^[-•*]\s+(.*)$/);
    if (bullet) {
      const last = blocks[blocks.length - 1];
      if (last?.type === "list") last.items.push(bullet[1]);
      else blocks.push({ type: "list", items: [bullet[1]] });
      continue;
    }

    const next = lines[index + 1]?.trim() ?? "";
    const looksLikeTitle = line.length <= 60 && !/[.!?;,]$/.test(line) && next !== "";
    if (looksLikeTitle) {
      blocks.push({ type: "title", text: line.replace(/:$/, "") });
      continue;
    }

    const last = blocks[blocks.length - 1];
    // Consecutive lines of text form one paragraph.
    if (last?.type === "paragraph" && lines[index - 1]?.trim()) last.text += ` ${line}`;
    else blocks.push({ type: "paragraph", text: line });
  }

  return blocks;
}
