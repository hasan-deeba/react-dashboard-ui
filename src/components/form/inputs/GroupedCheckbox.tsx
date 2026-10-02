import { useMemo, useState } from "react";
import { Check, ChevronDown, Layers, Minus, Search } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { toOptions, type OptionKeys } from "@/services/resources";
import { cn } from "@/utils/cn";
import type { SelectOption } from "@/components/form/types";

export interface CheckboxGroup {
  /** Group heading. */
  label: string;
  /** Options inside the group — value is always the submitted identifier. */
  items: SelectOption[];
}

/**
 * Normalise a grouped payload of (almost) any shape into `CheckboxGroup[]`.
 *
 * Supported group keys : group | label | name | title | key
 * Supported item keys  : permissions | items | options | children | values
 *
 * Items themselves are mapped with `toOptions`, so `optionKeys`
 * (e.g. { value: "id", label: "name" }) decides what gets submitted.
 */
export function normalizeGroups(raw: unknown, optionKeys?: OptionKeys): CheckboxGroup[] {
  if (!Array.isArray(raw)) return [];

  return raw
    .map((entry): CheckboxGroup | null => {
      if (!entry || typeof entry !== "object") return null;
      const obj = entry as Record<string, unknown>;

      const label = String(obj.group ?? obj.label ?? obj.name ?? obj.title ?? obj.key ?? "");
      const rawItems =
        obj.permissions ?? obj.items ?? obj.options ?? obj.children ?? obj.values ?? [];
      const items = toOptions(rawItems, optionKeys);

      if (!label && items.length === 0) return null;
      return { label: label || "general", items };
    })
    .filter((group): group is CheckboxGroup => group !== null && group.items.length > 0);
}

interface GroupedCheckboxProps {
  groups: CheckboxGroup[];
  /** Selected option values (always strings — e.g. permission ids). */
  value: string[];
  onChange: (value: string[]) => void;
  disabled?: boolean;
  /** Strip the group prefix from item labels ("users.create" → "create"). */
  stripPrefix?: boolean;
}

/**
 * Grouped checkbox matrix — a reusable control for any "pick many, arranged
 * in groups" case: permissions, feature flags, categories, notification
 * channels… Each group has a tri-state master checkbox.
 */
export function GroupedCheckbox({
  groups,
  value,
  onChange,
  disabled,
  stripPrefix = true,
}: GroupedCheckboxProps) {
  const { t } = useLanguage();
  const [query, setQuery] = useState("");
  const [collapsed, setCollapsed] = useState<ReadonlySet<string>>(() => new Set());

  const selected = useMemo(() => new Set(value.map(String)), [value]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return groups;
    return groups
      .map((group) => ({
        ...group,
        items: group.items.filter(
          (item) => item.label.toLowerCase().includes(q) || group.label.toLowerCase().includes(q),
        ),
      }))
      .filter((group) => group.items.length > 0);
  }, [groups, query]);

  const totalCount = useMemo(
    () => groups.reduce((sum, group) => sum + group.items.length, 0),
    [groups],
  );

  const toggleOne = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    onChange([...next]);
  };

  const toggleGroup = (group: CheckboxGroup) => {
    const ids = group.items.map((item) => item.value);
    const allSelected = ids.every((id) => selected.has(id));
    const next = new Set(selected);
    ids.forEach((id) => (allSelected ? next.delete(id) : next.add(id)));
    onChange([...next]);
  };

  const toggleAll = () => {
    const allIds = groups.flatMap((g) => g.items.map((item) => item.value));
    onChange(allIds.every((id) => selected.has(id)) ? [] : allIds);
  };

  const toggleCollapse = (label: string) =>
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(label)) next.delete(label);
      else next.add(label);
      return next;
    });

  if (groups.length === 0) {
    return (
      <p className="rounded-control border border-dashed border-slate-200 px-4 py-8 text-center text-xs text-slate-400 dark:border-slate-700">
        {t("form.grouped.empty")}
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-0 flex-1 sm:max-w-xs">
          <Search className="pointer-events-none absolute start-3 top-1/2 size-3.5 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("form.grouped.search")}
            className="w-full rounded-control border border-slate-200 bg-slate-50/80 py-2 pe-3 ps-9 text-sm outline-none transition-all focus:border-brand-500/60 focus:bg-white dark:focus:bg-slate-900 focus:ring-4 focus:ring-brand-500/10 dark:border-slate-700 dark:bg-slate-800/60 dark:text-white"
          />
        </div>
        <span className="rounded-full bg-brand-500/10 px-2.5 py-1 text-[11px] font-bold text-brand-600 dark:text-brand-400">
          {t("form.grouped.selected", { count: selected.size, total: totalCount })}
        </span>
        <button
          type="button"
          onClick={toggleAll}
          disabled={disabled}
          className="rounded-control border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          {t("form.grouped.toggleAll")}
        </button>
      </div>

      {/* Groups */}
      <div className="grid gap-3 lg:grid-cols-2">
        {filtered.map((group) => {
          const ids = group.items.map((item) => item.value);
          const selectedInGroup = ids.filter((id) => selected.has(id)).length;
          const all = selectedInGroup === ids.length && ids.length > 0;
          const some = selectedInGroup > 0 && !all;
          const isCollapsed = collapsed.has(group.label);

          return (
            <div
              key={group.label}
              className={cn(
                "overflow-hidden rounded-control border transition-colors",
                all || some
                  ? "border-brand-500/40 bg-brand-500/[0.03]"
                  : "border-slate-200 dark:border-slate-700",
              )}
            >
              <div className="flex items-center gap-2.5 px-3 py-2.5">
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => toggleGroup(group)}
                  aria-label={group.label}
                  className={cn(
                    "grid size-[18px] shrink-0 place-items-center rounded-[5px] border transition-colors",
                    all
                      ? "border-brand-600 bg-brand-600 text-white"
                      : some
                        ? "border-brand-600 bg-brand-600/20 text-brand-600"
                        : "border-slate-300 hover:border-brand-500 dark:border-slate-600",
                  )}
                >
                  {all ? (
                    <Check className="size-3" strokeWidth={3} />
                  ) : some ? (
                    <Minus className="size-3" strokeWidth={3} />
                  ) : null}
                </button>

                <Layers className="size-3.5 shrink-0 text-slate-400" />
                <span className="min-w-0 flex-1 truncate text-sm font-bold capitalize text-slate-800 dark:text-slate-100">
                  {group.label}
                </span>
                <span className="text-[11px] font-semibold tabular-nums text-slate-400">
                  {selectedInGroup}/{ids.length}
                </span>
                <button
                  type="button"
                  onClick={() => toggleCollapse(group.label)}
                  className="grid size-6 place-items-center rounded text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                  aria-expanded={!isCollapsed}
                >
                  <ChevronDown
                    className={cn("size-4 transition-transform", isCollapsed && "-rotate-90 rtl:rotate-90")}
                  />
                </button>
              </div>

              {!isCollapsed && (
                <ul className="space-y-0.5 border-t border-slate-200/70 p-1.5 dark:border-slate-700/60">
                  {group.items.map((item) => {
                    const active = selected.has(item.value);
                    // "users.create" → "create" (the group is already the heading)
                    const text =
                      stripPrefix && item.label.includes(".")
                        ? item.label.split(".").slice(1).join(".")
                        : item.label;

                    return (
                      <li key={item.value}>
                        <button
                          type="button"
                          disabled={disabled}
                          onClick={() => toggleOne(item.value)}
                          title={item.label}
                          className={cn(
                            "flex w-full items-center gap-2.5 rounded-control px-2.5 py-1.5 text-start text-sm transition-colors",
                            active
                              ? "bg-brand-500/[0.08] font-semibold text-brand-700 dark:text-brand-300"
                              : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800",
                          )}
                        >
                          <span
                            className={cn(
                              "grid size-4 shrink-0 place-items-center rounded border transition-colors",
                              active
                                ? "border-brand-600 bg-brand-600 text-white"
                                : "border-slate-300 dark:border-slate-600",
                            )}
                          >
                            {active && <Check className="size-3" strokeWidth={3} />}
                          </span>
                          <span className="min-w-0 flex-1 truncate">{text}</span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
