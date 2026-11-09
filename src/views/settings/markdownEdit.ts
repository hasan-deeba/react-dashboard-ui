/**
 * Pure Markdown edit transforms for the legal-text editor toolbar.
 *
 * PURPOSE : given the current value + selection, produce the next value and
 *           the selection/cursor to restore afterwards. The wire format
 *           stays Markdown; visual-only styling (colour, font family) is
 *           expressed as inline `<span style="…">…</span>`, which is legal
 *           inside Markdown (only ACTIVE tags are banned server-side).
 * EXPORTS : TextSelection, EditResult, wrapSelection(), toggleLinePrefix(),
 *           applyOrderedList(), applyLink(), toggleSpanStyle(),
 *           handleEnter(), indentLines(), selectionMarks().
 * EDIT    : keep these functions pure and DOM-free — they are exercised by
 *           the node smoke suite.
 */

export interface TextSelection {
  start: number;
  end: number;
}

export interface EditResult {
  value: string;
  selStart: number;
  selEnd: number;
}

const escapeRe = (s: string): string => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/**
 * Wrap the selection with an inline marker (`**bold**`, `*i*`, `` `code` ``),
 * or unwrap it when the markers already hug the selection.
 */
export function wrapSelection(
  value: string,
  { start, end }: TextSelection,
  marker: string,
  placeholder = "text",
): EditResult {
  const selected = value.slice(start, end);
  const before = value.slice(0, start);
  const after = value.slice(end);

  if (before.endsWith(marker) && after.startsWith(marker)) {
    // Toggle off — the markers sit immediately around the selection.
    const next = before.slice(0, -marker.length) + selected + after.slice(marker.length);
    return { value: next, selStart: start - marker.length, selEnd: start - marker.length + selected.length };
  }

  const inner = selected || placeholder;
  const next = before + marker + inner + marker + after;
  return { value: next, selStart: start + marker.length, selEnd: start + marker.length + inner.length };
}

/**
 * Toggle a per-line prefix ("# ", "> ", "- ") on every line the selection
 * touches. When every affected line already carries it, strip it instead.
 */
export function toggleLinePrefix(
  value: string,
  { start, end }: TextSelection,
  prefix: string,
): EditResult {
  const lineStart = value.lastIndexOf("\n", Math.max(0, start - 1)) + 1;
  const nl = value.indexOf("\n", end);
  const lineEnd = nl === -1 ? value.length : nl;

  const block = value.slice(lineStart, lineEnd);
  const lines = block.split("\n");
  const allPrefixed = lines.every((line) => line.trim() === "" || line.startsWith(prefix));

  const nextLines = allPrefixed
    ? lines.map((line) => (line.startsWith(prefix) ? line.slice(prefix.length) : line))
    : lines.map((line) =>
        // Skip empty lines AND lines already prefixed — never double up.
        line.trim() === "" || line.startsWith(prefix) ? line : prefix + line,
      );

  const nextBlock = nextLines.join("\n");
  const next = value.slice(0, lineStart) + nextBlock + value.slice(lineEnd);
  return { value: next, selStart: lineStart, selEnd: lineStart + nextBlock.length };
}

/** "1. " ordered list — sequential numbering across the selected lines. */
export function applyOrderedList(value: string, sel: TextSelection): EditResult {
  const lineStart = value.lastIndexOf("\n", Math.max(0, sel.start - 1)) + 1;
  const nl = value.indexOf("\n", sel.end);
  const lineEnd = nl === -1 ? value.length : nl;

  const block = value.slice(lineStart, lineEnd);
  const lines = block.split("\n");
  const ORDERED_RE = /^\d+[.)]\s/;
  const allOrdered = lines.every((line) => line.trim() === "" || ORDERED_RE.test(line));

  if (allOrdered) {
    const nextBlock = lines.map((line) => line.replace(ORDERED_RE, "")).join("\n");
    const next = value.slice(0, lineStart) + nextBlock + value.slice(lineEnd);
    return { value: next, selStart: lineStart, selEnd: lineStart + nextBlock.length };
  }

  // Renumber from scratch — strip existing markers so they never double.
  let n = 0;
  const nextBlock = lines
    .map((line) => {
      if (line.trim() === "") return line;
      n += 1;
      return `${n}. ${line.replace(ORDERED_RE, "")}`;
    })
    .join("\n");
  const next = value.slice(0, lineStart) + nextBlock + value.slice(lineEnd);
  return { value: next, selStart: lineStart, selEnd: lineStart + nextBlock.length };
}

/** Insert a link around the selection; the URL placeholder ends up selected. */
export function applyLink(value: string, { start, end }: TextSelection): EditResult {
  const selected = value.slice(start, end) || "link text";
  const before = value.slice(0, start);
  const after = value.slice(end);
  const url = "https://";
  const next = `${before}[${selected}](${url})${after}`;

  const urlStart = before.length + selected.length + 3; // after "[text]("
  return { value: next, selStart: urlStart, selEnd: urlStart + url.length };
}

/**
 * Toggle an inline style span, e.g. `<span style="color:#e11d48">…</span>`.
 * Handles the three ways a selection can relate to a span of this property:
 *   1. the selection IS the whole span (tags included),
 *   2. the span HUGS the selection (cursor landed inside it),
 *   3. no span nearby → wrap the selection.
 * Same value on 1/2 toggles OFF; a different value RECOLORS the same span
 * (never nests — the inner span would win the cascade otherwise).
 * cssValue = null is the "Default" action: remove the span.
 */
export function toggleSpanStyle(
  value: string,
  { start, end }: TextSelection,
  property: "color" | "font-family",
  cssValue: string | null,
  placeholder = "text",
): EditResult {
  const selected = value.slice(start, end);
  const before = value.slice(0, start);
  const after = value.slice(end);
  const CLOSE = "</span>";
  const openFor = (css: string) => `<span style="${property}:${css}">`;
  const sameValueRe =
    cssValue === null
      ? null
      : new RegExp(`^${escapeRe(openFor(cssValue))}([\\s\\S]*?)</span>$`);
  const anyValueRe = new RegExp(`^<span style="${property}:[^"]+">([\\s\\S]*?)</span>$`);

  const rewrap = (inner: string, at: number, dropTags: number): EditResult => {
    if (cssValue === null) {
      // "Default" — drop the span entirely.
      const next = before.slice(0, -dropTags) + inner + after.slice(CLOSE.length);
      return { value: next, selStart: at, selEnd: at + inner.length };
    }
    const open = openFor(cssValue);
    const next = before.slice(0, -dropTags) + open + inner + CLOSE + after.slice(CLOSE.length);
    return { value: next, selStart: at + open.length, selEnd: at + open.length + inner.length };
  };

  // 1) The selection is the complete span.
  const fullSame = selected.match(sameValueRe ?? anyValueRe);
  const fullAny = selected.match(anyValueRe);
  if (fullAny) {
    if (cssValue === null || (fullSame && cssValue !== null)) {
      const inner = fullAny[1];
      const next = before + inner + after;
      return { value: next, selStart: start, selEnd: start + inner.length };
    }
    return rewrap(fullAny[1], start, 0);
  }

  // 2) A span of this property hugs the selection.
  const hugOpen = before.match(new RegExp(`<span style="${property}:[^"]+">$`))?.[0];
  if (hugOpen && after.startsWith(CLOSE)) {
    const hugInnerStart = start - hugOpen.length;
    const sameTag = cssValue !== null && hugOpen === openFor(cssValue);
    if (cssValue === null || sameTag) {
      const next = before.slice(0, -hugOpen.length) + selected + after.slice(CLOSE.length);
      return {
        value: next,
        selStart: hugInnerStart,
        selEnd: hugInnerStart + selected.length,
      };
    }
    return rewrap(selected, hugInnerStart, hugOpen.length);
  }

  if (cssValue === null) {
    // Nothing to clear — no span of this property around the selection.
    return { value, selStart: start, selEnd: end };
  }

  // 3) Wrap the selection in a fresh span.
  const inner = selected || placeholder;
  const open = openFor(cssValue);
  const next = before + open + inner + CLOSE + after;
  return { value: next, selStart: start + open.length, selEnd: start + open.length + inner.length };
}

/* ------------------------- writing ergonomics ------------------------- */

const BULLET_RE = /^(\s*)([-*+])(\s+)/;
const ORDERED_FULL_RE = /^(\s*)(\d+)([.)])(\s+)/;
const QUOTE_RE = /^(\s*>+)(\s*)/;

/** The full line containing an offset. */
function lineAt(value: string, offset: number): { lineStart: number; lineEnd: number; line: string } {
  const lineStart = value.lastIndexOf("\n", Math.max(0, offset - 1)) + 1;
  const nl = value.indexOf("\n", lineStart);
  const lineEnd = nl === -1 ? value.length : nl;
  return { lineStart, lineEnd, line: value.slice(lineStart, lineEnd) };
}

/**
 * Enter-key behaviour for list/quote lines (returns null for plain lines so
 * the browser inserts a normal newline):
 *   - inside a list item / quote  → continue the prefix on the next line,
 *     incrementing ordered numbers, splitting the line at the cursor;
 *   - on an EMPTY item            → drop the marker (second Enter exits).
 */
export function handleEnter(value: string, { start, end }: TextSelection): EditResult | null {
  if (start !== end) return null;

  const { lineStart, lineEnd, line } = lineAt(value, start);
  let continuation: string | null = null;

  const ordered = line.match(ORDERED_FULL_RE);
  const bullet = line.match(BULLET_RE);
  const quote = line.match(QUOTE_RE);
  let prefixLen = 0;

  if (ordered) {
    continuation = `${ordered[1]}${Number(ordered[2]) + 1}${ordered[3]}${ordered[4]}`;
    prefixLen = ordered[0].length;
  } else if (bullet) {
    continuation = bullet[0];
    prefixLen = bullet[0].length;
  } else if (quote) {
    continuation = quote[2] ? quote[0] : `${quote[1]} `;
    prefixLen = quote[0].length;
  }

  if (continuation === null) return null;

  // Enter on an empty item strips the marker instead of spawning a new one.
  if (line.slice(prefixLen).trim() === "") {
    const next = value.slice(0, lineStart) + value.slice(lineEnd);
    return { value: next, selStart: lineStart, selEnd: lineStart };
  }

  // Split at the cursor: text after it moves into the new prefixed line.
  const next = value.slice(0, start) + "\n" + continuation + value.slice(start);
  const cursor = start + 1 + continuation.length;
  return { value: next, selStart: cursor, selEnd: cursor };
}

/**
 * Tab / Shift+Tab: indent or outdent every touched line by two spaces
 * (one tab counts as one level). Empty lines are left untouched.
 */
export function indentLines(
  value: string,
  { start, end }: TextSelection,
  direction: 1 | -1,
): EditResult {
  const lineStart = value.lastIndexOf("\n", Math.max(0, start - 1)) + 1;
  const nl = value.indexOf("\n", end);
  const lineEnd = nl === -1 ? value.length : nl;

  const lines = value.slice(lineStart, lineEnd).split("\n");
  const nextLines = lines.map((line) => {
    if (line.trim() === "") return line;
    if (direction === 1) return "  " + line;
    if (line.startsWith("\t")) return line.slice(1);
    return line.replace(/^ {1,2}/, "");
  });

  const nextBlock = nextLines.join("\n");
  const next = value.slice(0, lineStart) + nextBlock + value.slice(lineEnd);
  return { value: next, selStart: lineStart, selEnd: lineStart + nextBlock.length };
}

/** Which inline markers currently hug the selection/cursor — toolbar state. */
export function selectionMarks(
  value: string,
  { start, end }: TextSelection,
): { bold: boolean; italic: boolean; code: boolean; strike: boolean } {
  const before = value.slice(0, start);
  const after = value.slice(end);
  const hugs = (marker: string) => before.endsWith(marker) && after.startsWith(marker);

  const bold = hugs("**") || hugs("__");
  const italic = (hugs("*") || hugs("_")) && !bold;
  const code = hugs("`");
  const strike = hugs("~~");
  return { bold, italic, code, strike };
}
