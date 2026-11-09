/**
 * Rich text ↔ Markdown boundary for the legal-text WYSIWYG editor.
 *
 * PURPOSE : the WYSIWYG editor (TipTap) works on an HTML document model,
 *           while the backend contract stores Markdown. This module is the
 *           ONLY place where the two formats meet:
 *             - markdownToEditorHtml(): storage → editor content
 *               (marked + DOMPurify, identical rules to the Preview tab);
 *             - htmlToMarkdown(): editor document → storage
 *               (Turndown + GFM: **bold**, *italic*, ~~strike~~, #-headings,
 *               lists, links, fenced code).
 *           Text carrying colour / font-family is kept as inline
 *           `<span style="…">…</span>` — legal inline Markdown, accepted by
 *           the backend ban list (active tags only) and re-parsed by the
 *           editor as TextStyle marks, so round-trips lose nothing.
 * EXPORTS : markdownToEditorHtml(), htmlToMarkdown().
 * EDIT    : keep both directions deterministic — htmlToMarkdown output is
 *           compared against the prop value to detect external changes, so
 *           never seed it with environment-dependent behaviour (Date, etc.).
 */

import TurndownService from "turndown";
import { gfm } from "turndown-plugin-gfm";
import { renderMarkdownPreview } from "@/utils/markdown";

/** Storage → editor: same sanitized pipeline the Preview tab renders. */
export function markdownToEditorHtml(markdown: string): string {
  return renderMarkdownPreview(markdown);
}

const turndown = new TurndownService({
  headingStyle: "atx",
  hr: "---",
  bulletListMarker: "-",
  codeBlockStyle: "fenced",
  emDelimiter: "*",
  strongDelimiter: "**",
  linkStyle: "inlined",
});
turndown.use(gfm);

/**
 * The GFM plugin emits single-tilde `~strike~`, which `marked` does NOT
 * render as strikethrough (it needs `~~`). This rule is added AFTER the
 * plugin, so it wins (Turndown prepends rules — last added matches first).
 */
turndown.addRule("doubleStrikethrough", {
  filter: ["del", "s", "strike"] as string[] as TurndownService.Filter,
  replacement: (content) => `~~${content}~~`,
});

/**
 * Spans carrying a style attribute (the colour / font-family the toolbar
 * writes) have no Markdown syntax — re-emit the tag as inline HTML while
 * letting CHILDREN convert normally (`<strong>` → `**bold**` inside the
 * span). Unstyled spans unwrap to their content via the default rule.
 */
turndown.addRule("styledSpan", {
  filter: (node) => node.nodeName === "SPAN" && node.hasAttribute("style"),
  replacement: (content, node) =>
    `<span style="${(node as HTMLElement).getAttribute("style")}">${content}</span>`,
});

/** Editor document → storage Markdown. */
export function htmlToMarkdown(html: string): string {
  return turndown
    .turndown(html)
    .replace(/\u00a0/g, " ") // nbsp artefacts from contenteditable
    .trim();
}
