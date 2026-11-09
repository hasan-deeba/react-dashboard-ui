/**
 * Type shim — turndown-plugin-gfm ships no declarations.
 */
declare module "turndown-plugin-gfm" {
  import type TurndownService from "turndown";

  /** Installs all GFM rules (strikethrough, tables, task lists, …). */
  export const gfm: TurndownService.Plugin;
  export const strikethrough: TurndownService.Plugin;
  export const tables: TurndownService.Plugin;
  export const taskListItems: TurndownService.Plugin;
  export const highlightedCodeBlock: TurndownService.Plugin;
}
