/**
 * Resource URL conventions.
 *
 * PURPOSE : one place that knows how CRUD routes are shaped, so pages,
 *           tables and show views never hardcode a URL string.
 * EXPORTS : ResourcePaths, resourcePaths(resource).
 * EDIT    : every resource follows the same scheme —
 *             /{resource}            list
 *             /{resource}/create     create
 *             /{resource}/{id}       show
 *             /{resource}/{id}/edit  edit
 *             /{resource}/{id}/logs  activity
 *           Keep it uniform: breadcrumbs link each URL segment, so a list at
 *           a non-standard path (e.g. /users/all) would break the trail.
 */

export interface ResourcePaths {
  index: string;
  create: string;
  show: (id: string | number) => string;
  edit: (id: string | number) => string;
  /** Activity log of a single record: `/{resource}/{id}/logs`. */
  logs: (id: string | number) => string;
}

export function resourcePaths(resource: string): ResourcePaths {
  return {
    index: `/${resource}`,
    create: `/${resource}/create`,
    show: (id) => `/${resource}/${id}`,
    edit: (id) => `/${resource}/${id}/edit`,
    logs: (id) => `/${resource}/${id}/logs`,
  };
}
