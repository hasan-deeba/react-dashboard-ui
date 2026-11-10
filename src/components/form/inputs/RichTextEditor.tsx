/**
 * GLOBAL rich-text editor input (`components/inputs`) — use anywhere.
 *
 * PURPOSE : a formatted-text editor (TipTap) behind one consistent field
 *           chrome (label/hint/error). Bold renders BOLD while you type,
 *           headings look like headings, the colour palette paints the
 *           actual text — no Markdown syntax is ever visible. The value
 *           contract is MARKDOWN (in and out): conversion lives entirely in
 *           `components/inputs/richText.ts` (colour / font family survive
 *           as inline `<span style>` inside the Markdown — legal inline
 *           HTML that the preview sanitizer allows).
 *           Native shortcuts work: Ctrl/Cmd+B/I/E, Mod-Shift-S strike,
 *           Mod-Alt-1..3 headings, Mod-K link prompt.
 * EXPORTS : RichTextEditor.
 * EDIT    : formatting semantics belong to richText.ts / utils/markdown.ts.
 *           Pass `label`/`hint`/`error` for the full field treatment, or
 *           render your own chrome and use only `hasError` + `describedBy`.
 */

import { useEffect, useId, useRef, useState } from "react";
import { EditorContent, useEditor, useEditorState, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import TextStyle from "@tiptap/extension-text-style";
import Color from "@tiptap/extension-color";
import FontFamily from "@tiptap/extension-font-family";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
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
  Strikethrough,
  Type,
  type LucideIcon,
} from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { useClickOutside } from "@/hooks/useClickOutside";
import {
  describedBy,
  errorId,
  FieldError,
  FieldHint,
  FieldLabel,
  hintId,
} from "@/components/form/inputs/FieldFrame";
import { htmlToMarkdown, markdownToEditorHtml } from "@/components/form/inputs/richText";
import { cn } from "@/utils/cn";

/** Preset swatches — CONTENT colours stored inside the document. */
const TEXT_COLORS = ["#0f172a", "#dc2626", "#b45309", "#047857", "#1d4ed8", "#7c3aed"];

const FONT_STACKS = [
  { id: "sans", css: "system-ui, -apple-system, sans-serif", labelKey: "inputs.editor.toolbar.fontSans" },
  { id: "serif", css: "'Georgia', 'Times New Roman', serif", labelKey: "inputs.editor.toolbar.fontSerif" },
  { id: "mono", css: "ui-monospace, 'Menlo', monospace", labelKey: "inputs.editor.toolbar.fontMono" },
] as const;

export interface RichTextEditorProps {
  /** DOM id for the editable surface (label htmlFor / focus targets). */
  id?: string;
  label?: string;
  hint?: string;
  error?: string;
  required?: boolean;
  /** Markdown in / Markdown out. */
  value: string;
  onChange: (markdown: string) => void;
  /** Writing direction of the content — matches the stored language. */
  dir?: "ltr" | "rtl";
  placeholder?: string;
  disabled?: boolean;
  /** Border-only error styling when error chrome is rendered outside. */
  hasError?: boolean;
  /** aria-describedby override when hint/error ids are managed outside. */
  describedBy?: string;
  /** Recreate the document when this changes (e.g. a language tab key). */
  documentKey?: string;
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
  active = false,
  shortcut,
}: {
  icon: LucideIcon;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  active?: boolean;
  shortcut?: string;
}) {
  const title = shortcut ? `${label} (${shortcut})` : label;
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      aria-pressed={active}
      disabled={disabled}
      onMouseDown={(event) => event.preventDefault() /* keep editor focus */}
      onClick={onClick}
      className={cn(
        "grid size-7 place-items-center rounded-control transition-colors",
        active
          ? "bg-brand-500/15 text-brand-600 dark:bg-brand-400/10 dark:text-brand-300"
          : "text-slate-500 hover:bg-slate-200/80 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-slate-200",
        "disabled:cursor-not-allowed disabled:opacity-40",
      )}
    >
      <Icon className="size-3.5" />
    </button>
  );
}

export function RichTextEditor({
  id,
  label,
  hint,
  error,
  required = false,
  value,
  onChange,
  dir = "ltr",
  placeholder,
  disabled,
  hasError,
  describedBy: describedByProp,
  documentKey,
}: RichTextEditorProps) {
  const { t } = useLanguage();
  const generatedId = useId();
  const editorId = id ?? generatedId;
  const [openMenu, setOpenMenu] = useState<"color" | "font" | null>(null);
  const menuRef = useClickOutside<HTMLDivElement>(() => setOpenMenu(null));
  const editorRef = useRef<Editor | null>(null);

  const invalid = hasError ?? Boolean(error);
  const described =
    describedByProp ??
    describedBy(error ? errorId(editorId) : undefined, hint ? hintId(editorId) : undefined);

  const promptLink = () => {
    const editor = editorRef.current;
    if (!editor) return;
    const previous = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt(t("inputs.editor.toolbar.linkUrl"), previous ?? "https://");
    if (url === null) return;
    const href = url.trim();
    if (!href) {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href }).run();
  };

  // Recreated when documentKey changes — e.g. one document per language tab.
  const editor = useEditor(
    {
      extensions: [
        StarterKit.configure({ heading: { levels: [1, 2, 3] } }),
        TextStyle,
        Color,
        FontFamily,
        Link.configure({ openOnClick: false, autolink: true }),
        Placeholder.configure({
          placeholder: placeholder ?? t("inputs.editor.placeholder"),
        }),
      ],
      content: markdownToEditorHtml(value),
      editable: !disabled,
      editorProps: {
        attributes: {
          id: editorId,
          dir,
          "aria-describedby": described ?? "",
          "aria-invalid": invalid ? "true" : "false",
          class:
            "settings-md min-h-56 px-3.5 py-2.5 text-[13px] leading-relaxed outline-none",
        },
        handleKeyDown: (_view, event) => {
          if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
            event.preventDefault();
            promptLink();
            return true;
          }
          return false;
        },
      },
      onUpdate: ({ editor: ed }) => {
        onChange(htmlToMarkdown(ed.getHTML()));
      },
    },
    [documentKey ?? dir],
  );
  editorRef.current = editor;

  /** Toolbar active states — reactive selection/format snapshot. */
  const active = useEditorState({
    editor,
    selector: ({ editor: ed }) => ({
      bold: ed?.isActive("bold") ?? false,
      italic: ed?.isActive("italic") ?? false,
      strike: ed?.isActive("strike") ?? false,
      code: ed?.isActive("code") ?? false,
      h1: ed?.isActive("heading", { level: 1 }) ?? false,
      h2: ed?.isActive("heading", { level: 2 }) ?? false,
      h3: ed?.isActive("heading", { level: 3 }) ?? false,
      bullet: ed?.isActive("bulletList") ?? false,
      ordered: ed?.isActive("orderedList") ?? false,
      quote: ed?.isActive("blockquote") ?? false,
      link: ed?.isActive("link") ?? false,
      color: (ed?.getAttributes("textStyle").color as string | undefined) ?? null,
    }),
  });

  /** External value changes (refetch after save) — adopt without feedback loop. */
  useEffect(() => {
    if (!editor) return;
    if (htmlToMarkdown(editor.getHTML()) !== value) {
      editor.commands.setContent(markdownToEditorHtml(value), false);
    }
  }, [editor, value]);

  useEffect(() => {
    editor?.setEditable(!disabled);
  }, [editor, disabled]);

  const run = (command: (chain: ReturnType<Editor["chain"]>) => ReturnType<Editor["chain"]>) => {
    if (!editor || disabled) return;
    command(editor.chain().focus()).run();
  };

  return (
    <div className="space-y-1.5">
      {label && (
        <FieldLabel htmlFor={editorId} required={required}>
          {label}
        </FieldLabel>
      )}

      <div
        className={cn(
          "overflow-hidden rounded-control border bg-slate-50/80 text-slate-800 transition-colors",
          "focus-within:bg-white dark:bg-slate-800/60 dark:text-white dark:focus-within:bg-slate-900",
          invalid ? "border-rose-400 dark:border-rose-500/60" : "border-slate-200 dark:border-slate-700",
        )}
      >
        {/* Toolbar */}
        <div
          role="toolbar"
          aria-label={t("inputs.editor.toolbar.label")}
          className="flex flex-wrap items-center gap-0.5 border-b border-slate-200/80 px-1.5 py-1 dark:border-slate-700/70"
        >
          <ToolButton disabled={disabled} active={active?.bold} shortcut="Ctrl+B" icon={Bold} label={t("inputs.editor.toolbar.bold")} onClick={() => run((c) => c.toggleBold())} />
          <ToolButton disabled={disabled} active={active?.italic} shortcut="Ctrl+I" icon={Italic} label={t("inputs.editor.toolbar.italic")} onClick={() => run((c) => c.toggleItalic())} />
          <ToolButton disabled={disabled} active={active?.strike} shortcut="Ctrl+⇧S" icon={Strikethrough} label={t("inputs.editor.toolbar.strike")} onClick={() => run((c) => c.toggleStrike())} />
          <ToolButton disabled={disabled} active={active?.code} shortcut="Ctrl+E" icon={Code} label={t("inputs.editor.toolbar.code")} onClick={() => run((c) => c.toggleCode())} />
          <Divider />
          <ToolButton disabled={disabled} active={active?.h1} icon={Heading1} label={t("inputs.editor.toolbar.heading1")} onClick={() => run((c) => c.toggleHeading({ level: 1 }))} />
          <ToolButton disabled={disabled} active={active?.h2} icon={Heading2} label={t("inputs.editor.toolbar.heading2")} onClick={() => run((c) => c.toggleHeading({ level: 2 }))} />
          <ToolButton disabled={disabled} active={active?.h3} icon={Heading3} label={t("inputs.editor.toolbar.heading3")} onClick={() => run((c) => c.toggleHeading({ level: 3 }))} />
          <Divider />
          <ToolButton disabled={disabled} active={active?.bullet} icon={List} label={t("inputs.editor.toolbar.bullets")} onClick={() => run((c) => c.toggleBulletList())} />
          <ToolButton disabled={disabled} active={active?.ordered} icon={ListOrdered} label={t("inputs.editor.toolbar.ordered")} onClick={() => run((c) => c.toggleOrderedList())} />
          <ToolButton disabled={disabled} active={active?.quote} icon={Quote} label={t("inputs.editor.toolbar.quote")} onClick={() => run((c) => c.toggleBlockquote())} />
          <Divider />
          <ToolButton disabled={disabled} active={active?.link} shortcut="Ctrl+K" icon={Link2} label={t("inputs.editor.toolbar.link")} onClick={promptLink} />

          {/* Text colour */}
          <div className="relative" ref={openMenu === "color" ? menuRef : undefined}>
            <ToolButton
              disabled={disabled}
              icon={Palette}
              label={t("inputs.editor.toolbar.color")}
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
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => {
                      setOpenMenu(null);
                      run((c) => c.setColor(hex));
                    }}
                    className={cn(
                      "size-5 rounded-full border border-slate-200 transition-transform hover:scale-110 dark:border-slate-600",
                      active?.color === hex && "ring-2 ring-brand-500",
                    )}
                    style={{ backgroundColor: hex }}
                  />
                ))}
                <button
                  type="button"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => {
                    setOpenMenu(null);
                    run((c) => c.unsetColor());
                  }}
                  className="px-1.5 text-[11px] font-semibold text-slate-500 hover:text-slate-700 dark:hover:text-slate-200"
                >
                  {t("inputs.editor.toolbar.default")}
                </button>
              </div>
            )}
          </div>

          {/* Font family */}
          <div className="relative" ref={openMenu === "font" ? menuRef : undefined}>
            <ToolButton
              disabled={disabled}
              icon={Type}
              label={t("inputs.editor.toolbar.font")}
              onClick={() => setOpenMenu(openMenu === "font" ? null : "font")}
            />
            {openMenu === "font" && (
              <div className="absolute start-0 top-full z-20 mt-1 min-w-36 rounded-control border border-slate-200 bg-white p-1 shadow-xl dark:border-slate-700 dark:bg-slate-900">
                <button
                  type="button"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => {
                    setOpenMenu(null);
                    run((c) => c.unsetFontFamily());
                  }}
                  className="block w-full rounded-control px-2.5 py-1.5 text-start text-xs text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  {t("inputs.editor.toolbar.default")}
                </button>
                {FONT_STACKS.map((font) => (
                  <button
                    key={font.id}
                    type="button"
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => {
                      setOpenMenu(null);
                      run((c) => c.setFontFamily(font.css));
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

        {/* Formatted editing surface — what you see is what gets saved */}
        <EditorContent editor={editor} />
      </div>

      {error ? (
        <FieldError id={errorId(editorId)} message={error} />
      ) : (
        <FieldHint id={hintId(editorId)}>{hint}</FieldHint>
      )}
    </div>
  );
}
