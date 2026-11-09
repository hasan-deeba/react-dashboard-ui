/**
 * Safe Markdown rendering for the legal-text previews.
 *
 * PURPOSE : turn Markdown into sanitized HTML for the settings preview.
 *           Markdown is parsed with `marked` (GFM line breaks preserved),
 *           then DOMPurify strips anything active before the preview inserts
 *           it — raw HTML in the source can never execute, and the only
 *           clickable link schemes left are http/https (plus in-page/local
 *           anchors).
 * EXPORTS : renderMarkdownPreview(markdown) → sanitized HTML string.
 * EDIT    : never render API content without DOMPurify; the backend also
 *           rejects active HTML (script/iframe/object/embed/style/form/
 *           input/button), so the preview must not be weaker than that.
 */

import { marked } from "marked";
import DOMPurify from "dompurify";

// `breaks` keeps single newlines visible — legal text is written by
// non-technical editors, so blank lines and soft wraps must survive.
marked.use({ breaks: true, gfm: true });

/** Tags the backend rejects outright — belt-and-braces with DOMPurify's profile. */
const FORBID_TAGS = ["script", "iframe", "object", "embed", "style", "form", "input", "button"];

export function renderMarkdownPreview(markdown: string): string {
  const html = marked.parse(markdown, { async: false });
  return DOMPurify.sanitize(html, {
    FORBID_TAGS,
    // The editor writes colour/font-family via inline span styles — allow
    // the attribute (DOMPurify still strips dangerous CSS from it).
    ADD_ATTR: ["style"],
    // Clickable schemes stay limited to http(s) (+ pure-local anchors/paths).
    ALLOWED_URI_REGEXP: /^(?:(?:https?):\/\/|#|\/)/i,
  });
}
