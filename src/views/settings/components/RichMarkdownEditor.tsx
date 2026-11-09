/**
 * Rich Markdown editor for the legal-text fields.
 *
 * PURPOSE : a toolbar-driven editor (bold, italic, headings, lists, quote,
 *           code, link, text colour, font family) in front of a plain
 *           textarea. The stored value stays Markdown — block/inline actions
 *           insert Markdown syntax, and colour/font-family use inline
 *           `<span style="…">…</span>` (legal inside Markdown; only ACTIVE
 *           tags are banned server-side). The preview sanitizer
 *           (`views/settings/markdown.ts`) allows exactly `style` on spans.
 * EXPORTS : RichMarkdownEditor.
 * EDIT    : toolbar transforms are pure functions in
 *           `views/settings/markdownEdit.ts` — change formatting there.
 *           Keep this storage format Markdown; do NOT switch to HTML
 *           contenteditable output (the backend contract is Markdown).
 */

import { useRef, useState } from "react";
import {
  Bold,
  Code,
  Heading1,
  Heading2,
  Heading3,
  Italic,
  Link2,
  List,
  ListOrdered,
  Palette,
  Quote,
  Type,
  type LucideIcon,
} from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { useClickOutside } from "@/hooks/useClickOutside";
import type { LangCode } from "@/views/settings/settingsState";
import {
  applyLink,
  applyOrderedList,
  toggleLinePrefix,
  toggleSpanStyle,
  wrapSelection,
  type EditResult,
} from "@/views/settings/markdownEdit";
import { cn } from "@/utils/cn";

/** Preset swatches — these are CONTENT colours stored in the document. */
const TEXT_COLORS = ["#0f172a", "#dc2626", "#b45309", "#047857", "#1d4ed8", "#7c3aed"];

const FONT_STACKS = [
  { id: "sans", css: "system-ui, -apple-system, sans-serif", labelKey: "settings.editor.toolbar.fontSans" },
  { id: "serif", css: "'Georgia', 'Times New Roman', serif", labelKey: "settings.editor.toolbar.fontSerif" },
  { id: "mono", css: "ui-monospace, 'Menlo', monospace", labelKey: "settings.editor.toolbar.fontMono" },
] as const;

export interface RichMarkdownEditorProps {
  id: string;
  value: string;
  onChange: (next: string) => void;
  lang: LangCode;
  maxLength?: number;
  disabled?: boolean;
  hasError?: boolean;
  describedBy?: string;
}

const Divider = () => (
  <span aria-hidden className="mx-0.5 h-4 w-px bg-slate-200 dark:bg-slate-700" />
);

/** Toolbar button — hoisted so re-renders don't remount it (focus-safe). */
function ToolButton({
  icon: Icon,
  label,
  onClick,
  disabled,
}: {
  icon: LucideIcon;
  label: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      disabled={disabled}
      onMouseDown={(event) => event.preventDefault() /* keep the textarea selection */}
      onClick={onClick}
      className={cn(
        "grid size-7 place-items-center rounded-control text-slate-500 transition-colors",
        "hover:bg-slate-200/80 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-40",
        "dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-slate-200",
      )}
    >
      <Icon className="size-3.5" />
    </button>
  );
}

export function RichMarkdownEditor({
  id,
  value,
  onChange,
  lang,
  maxLength,
  disabled,
  hasError,
  describedBy,
}: RichMarkdownEditorProps) {
  const { t } = useLanguage();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [openMenu, setOpenMenu] = useState<"color" | "font" | null>(null);
  const menuRef = useClickOutside<HTMLDivElement>(() => setOpenMenu(null));

  /** Apply a pure transform and restore focus + the intended selection. */
  const apply = (produce: (current: string, sel: { start: number; end: number }) => EditResult) => {
    const ta = textareaRef.current;
    if (!ta || disabled) return;
    const sel = { start: ta.selectionStart, end: ta.selectionEnd };
    const result = produce(ta.value, sel);
    onChange(result.value);
    window.setTimeout(() => {
      ta.focus();
      ta.setSelectionRange(result.selStart, result.selEnd);
    }, 0);
  };

  return (
    <div
      className={cn(
        "overflow-hidden rounded-control border bg-slate-50/80 transition-colors",
        "focus-within:bg-white dark:bg-slate-800/60 dark:focus-within:bg-slate-900",
        hasError ? "border-rose-400 dark:border-rose-500/60" : "border-slate-200 dark:border-slate-700",
      )}
    >
      {/* Toolbar */}
      <div
        role="toolbar"
        aria-label={t("settings.editor.toolbar.label")}
        className="flex flex-wrap items-center gap-0.5 border-b border-slate-200/80 px-1.5 py-1 dark:border-slate-700/70"
      >
        <ToolButton disabled={disabled} icon={Bold} label={t("settings.editor.toolbar.bold")} onClick={() => apply((v, s) => wrapSelection(v, s, "**"))} />
        <ToolButton disabled={disabled} icon={Italic} label={t("settings.editor.toolbar.italic")} onClick={() => apply((v, s) => wrapSelection(v, s, "*"))} />
        <ToolButton disabled={disabled} icon={Code} label={t("settings.editor.toolbar.code")} onClick={() => apply((v, s) => wrapSelection(v, s, "`"))} />
        <Divider />
        <ToolButton disabled={disabled} icon={Heading1} label={t("settings.editor.toolbar.heading1")} onClick={() => apply((v, s) => toggleLinePrefix(v, s, "# "))} />
        <ToolButton disabled={disabled} icon={Heading2} label={t("settings.editor.toolbar.heading2")} onClick={() => apply((v, s) => toggleLinePrefix(v, s, "## "))} />
        <ToolButton disabled={disabled} icon={Heading3} label={t("settings.editor.toolbar.heading3")} onClick={() => apply((v, s) => toggleLinePrefix(v, s, "### "))} />
        <Divider />
        <ToolButton disabled={disabled} icon={List} label={t("settings.editor.toolbar.bullets")} onClick={() => apply((v, s) => toggleLinePrefix(v, s, "- "))} />
        <ToolButton disabled={disabled} icon={ListOrdered} label={t("settings.editor.toolbar.ordered")} onClick={() => apply(applyOrderedList)} />
        <ToolButton disabled={disabled} icon={Quote} label={t("settings.editor.toolbar.quote")} onClick={() => apply((v, s) => toggleLinePrefix(v, s, "> "))} />
        <Divider />
        <ToolButton disabled={disabled} icon={Link2} label={t("settings.editor.toolbar.link")} onClick={() => apply(applyLink)} />

        {/* Text colour */}
        <div className="relative" ref={openMenu === "color" ? menuRef : undefined}>
          <ToolButton
            disabled={disabled}
            icon={Palette}
            label={t("settings.editor.toolbar.color")}
            onClick={() => setOpenMenu(openMenu === "color" ? null : "color")}
          />
          {openMenu === "color" && (
            <div className="absolute start-0 top-full z-20 mt-1 flex items-center gap-1 rounded-control border border-slate-200 bg-white p-1.5 shadow-xl dark:border-slate-700 dark:bg-slate-900">
              {TEXT_COLORS.map((hex) => (
                <button
                  key={hex}
                  type="button"
                  title={hex}
                  aria-label={hex}
                  onMouseDown={(event) => event.preventDefault() /* keep selection */}
                  onClick={() => {
                    setOpenMenu(null);
                    apply((v, s) => toggleSpanStyle(v, s, "color", hex));
                  }}
                  className="size-5 rounded-full border border-slate-200 transition-transform hover:scale-110 dark:border-slate-600"
                  style={{ backgroundColor: hex }}
                />
              ))}
              <button
                type="button"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => {
                  setOpenMenu(null);
                  apply((v, s) => toggleSpanStyle(v, s, "color", null));
                }}
                className="px-1.5 text-[11px] font-semibold text-slate-500 hover:text-slate-700 dark:hover:text-slate-200"
              >
                {t("settings.editor.toolbar.default")}
              </button>
            </div>
          )}
        </div>

        {/* Font family */}
        <div className="relative" ref={openMenu === "font" ? menuRef : undefined}>
          <ToolButton
            disabled={disabled}
            icon={Type}
            label={t("settings.editor.toolbar.font")}
            onClick={() => setOpenMenu(openMenu === "font" ? null : "font")}
          />
          {openMenu === "font" && (
            <div className="absolute start-0 top-full z-20 mt-1 min-w-36 rounded-control border border-slate-200 bg-white p-1 shadow-xl dark:border-slate-700 dark:bg-slate-900">
              <button
                type="button"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => {
                  setOpenMenu(null);
                  apply((v, s) => toggleSpanStyle(v, s, "font-family", null));
                }}
                className="block w-full rounded-control px-2.5 py-1.5 text-start text-xs text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                {t("settings.editor.toolbar.default")}
              </button>
              {FONT_STACKS.map((font) => (
                <button
                  key={font.id}
                  type="button"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => {
                    setOpenMenu(null);
                    apply((v, s) => toggleSpanStyle(v, s, "font-family", font.css));
                  }}
                  className="block w-full rounded-control px-2.5 py-1.5 text-start text-xs text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                  style={{ fontFamily: font.css }}
                >
                  {t(font.labelKey)}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Editing surface — plain textarea so Markdown survives byte-exact */}
      <textarea
        ref={textareaRef}
        id={id}
        rows={10}
        dir={lang === "ar" ? "rtl" : "ltr"}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        maxLength={maxLength}
        disabled={disabled}
        aria-invalid={hasError}
        aria-describedby={describedBy}
        spellCheck={lang !== "ar"}
        className="w-full resize-y bg-transparent px-3.5 py-2.5 font-mono text-xs leading-relaxed text-slate-800 outline-none disabled:cursor-not-allowed disabled:opacity-60 dark:text-white"
      />
    </div>
  );
}
