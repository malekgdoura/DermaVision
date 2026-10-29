/**
 * Word-level diff between two texts (longest common subsequence). Pure, used to show what changed
 * between two report versions. Whitespace is kept attached to tokens so the output reads naturally.
 */
export type DiffPart = { type: "same" | "added" | "removed"; text: string };

// Reports are a few hundred words; above this the table would get large, so fall back to a full replace.
const MAX_TOKENS = 3000;

export function diffWords(before: string, after: string): DiffPart[] {
  const a = tokenize(before);
  const b = tokenize(after);

  if (a.length * b.length > MAX_TOKENS * MAX_TOKENS) {
    return merge([
      ...(before ? [{ type: "removed" as const, text: before }] : []),
      ...(after ? [{ type: "added" as const, text: after }] : []),
    ]);
  }

  // lcs[i][j] = length of the LCS of a[i..] and b[j..]
  const lcs: number[][] = Array.from({ length: a.length + 1 }, () => new Array<number>(b.length + 1).fill(0));
  for (let i = a.length - 1; i >= 0; i--) {
    for (let j = b.length - 1; j >= 0; j--) {
      lcs[i][j] = a[i] === b[j] ? lcs[i + 1][j + 1] + 1 : Math.max(lcs[i + 1][j], lcs[i][j + 1]);
    }
  }

  const parts: DiffPart[] = [];
  let i = 0;
  let j = 0;
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) {
      parts.push({ type: "same", text: a[i] });
      i++;
      j++;
    } else if (lcs[i + 1][j] >= lcs[i][j + 1]) {
      parts.push({ type: "removed", text: a[i++] });
    } else {
      parts.push({ type: "added", text: b[j++] });
    }
  }
  while (i < a.length) parts.push({ type: "removed", text: a[i++] });
  while (j < b.length) parts.push({ type: "added", text: b[j++] });

  return merge(parts);
}

// Each token is a word followed by its whitespace, e.g. "skin " or "dry.\n".
function tokenize(text: string): string[] {
  return text.match(/\S+\s*|\s+/g) ?? [];
}

function merge(parts: DiffPart[]): DiffPart[] {
  const merged: DiffPart[] = [];
  for (const part of parts) {
    const last = merged[merged.length - 1];
    if (last && last.type === part.type) last.text += part.text;
    else merged.push({ ...part });
  }
  return merged;
}
