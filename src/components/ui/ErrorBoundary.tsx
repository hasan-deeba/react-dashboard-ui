/**
 * Global crash guard.
 *
 * PURPOSE : keeps a single failing widget from white-screening the whole app.
 *           Rendered around the routed page content, keyed by pathname, so a
 *           crash is contained to the page and navigating away resets it.
 * EXPORTS : ErrorBoundary.
 * EDIT    : the class is intentionally dumb; labels come from i18n via the
 *           function wrapper so it works in every locale.
 */

import { Component, type ErrorInfo, type ReactNode } from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

interface BoundaryProps {
  children: ReactNode;
  labels: { title: string; body: string; retry: string };
}

class Boundary extends Component<BoundaryProps, { error: Error | null }> {
  state: { error: Error | null } = { error: null };

  static getDerivedStateFromError(error: Error): { error: Error } {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    if (import.meta.env.DEV) {
      console.error("[ErrorBoundary]", error, info.componentStack);
    }
  }

  render() {
    if (!this.state.error) return this.props.children;
    const { title, body, retry } = this.props.labels;

    return (
      <div className="surface-card flex min-h-[60vh] flex-col items-center justify-center gap-3 p-10 text-center">
        <span className="grid size-14 place-items-center rounded-icon bg-rose-500/10 text-rose-500">
          <AlertTriangle className="size-6" />
        </span>
        <h2 className="font-display text-xl font-bold text-slate-900 dark:text-white">{title}</h2>
        <p dir="auto" className="max-w-md text-sm text-slate-500 dark:text-slate-400">
          {this.state.error.message || body}
        </p>
        <button
          type="button"
          onClick={() => this.setState({ error: null })}
          className="mt-2 flex items-center gap-2 rounded-control bg-gradient-to-r from-brand-600 to-accent-600 px-4 py-2 text-xs font-bold text-white shadow-lg shadow-brand-600/25 transition-transform hover:scale-[1.03]"
        >
          <RotateCcw className="size-3.5" />
          {retry}
        </button>
      </div>
    );
  }
}

export function ErrorBoundary({ children }: { children: ReactNode }) {
  const { t } = useLanguage();
  return (
    <Boundary
      labels={{ title: t("errors.title"), body: t("errors.body"), retry: t("errors.retry") }}
    >
      {children}
    </Boundary>
  );
}
