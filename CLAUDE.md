# HeroDash — AI Agent Guide

Read this file **before editing anything**. It describes the architecture, the
conventions, and the exact recipes for common tasks. Following it prevents the
mistakes that break this codebase.

---

## 1. Stack

| Concern | Choice |
|---|---|
| Framework | React 19 + TypeScript (strict, `noUnusedLocals`) |
| Build | Vite 7 (single-file output) |
| Styling | Tailwind CSS v4 (`@theme inline` tokens, no config file) |
| Routing | react-router-dom (data router) |
| Animation | framer-motion |
| Icons | lucide-react |
| Charts | recharts |
| Backend | Laravel API (`VITE_API_BASE_URL`, e.g. `http://127.0.0.1:8000/cms`) |

**Imports always use the `@/` alias** (`@/components/...`), never `../`.
The only exception is `import.meta.glob("../locales/*/*.json")` in
`src/i18n/locales.ts`, which is a build-time path, not a module import.

---

## 2. Golden rules

1. **Never hardcode a colour.** Use design tokens (`brand-*`, `accent-*`,
   `rounded-card`, `rounded-control`, `rounded-icon`, `surface-card`) or a
   semantic tone from `@/lib/tones`.
2. **Never hardcode user-facing text.** Every string is a key in
   `src/locales/{en,ar}/*.json`, read through `t("namespace.key")`.
   Add to **both** locales or the key shows raw.
3. **Never hardcode a URL.** Use `resourcePaths(resource)` from `@/lib/paths`.
4. **Never hardcode a permission string.** Use `resourcePermissions(resource)`
   from `@/lib/permissions`.
5. **Never format dates.** The backend sends them display-ready; render as-is.
6. **Never write RTL-breaking CSS.** Use logical properties: `ps/pe`, `ms/me`,
   `start/end`, `text-start/end` — not `pl/pr`, `left/right`.
7. **Prefer declaration over markup.** New list/form/detail pages should be
   column/field/section declarations fed to `DataTable` / `DynamicForm` /
   `DynamicShow`, not hand-rolled JSX.
8. **Run the build** after changes. Strict TS catches most mistakes.

---

## 3. Directory map

```
src/
  config/DashboardConfig.ts   ← per-deployment identity (logo, preset, requireAuth)
  context/                    AuthContext, LanguageContext, ThemeContext, BrandThemeContext
  i18n/locales.ts             auto-discovers src/locales/<lang>/<namespace>.json
  locales/{en,ar}/*.json      one file = one namespace (filename is the prefix)
  lib/                        tones, paths, permissions, format   (pure, no React)
  services/                   api (transport), resources (CRUD), auth (session)
  theme/                      applyTheme (hex→CSS vars), presets, types
  types/models.ts             API models + refName()/refId() helpers
  routes/                     routes.tsx (metadata), router.tsx (build), guards.tsx
  hooks/                      useClickOutside, useCountUp, useNotifications
  data/navigation.ts          sidebar menu (ids, paths, permissions)
  components/
    table/                    DataTable engine  (see §6)
    form/                     DynamicForm engine (see §7)
    show/                     DynamicShow engine (see §8)
    ui/                       Toast, Loading, ErrorBoundary, ConfirmModal, FormField,
                              IconButton, InitialsAvatar
    layout/                   AppLayout + header/* + sidebar/*
    pages/                    NotFound, Forbidden, ComingSoon, ThemeStudio
    auth/Can.tsx              <Can permission="..."> gate
    dashboard/                demo widgets (stats, charts, activity)
  views/                      route pages: auth/, users/, roles/, profile/
```

---

## 4. Backend contract (Laravel `CrudService`)

All responses use `ResultService`: `{ valid, code, message, item }`.
`src/services/resources.ts` unwraps `item` / `data` automatically — callers
never see the envelope. A `valid: false` body with `code >= 400` is thrown as
an `ApiError` even when the HTTP status is 200.

| Endpoint | Returns |
|---|---|
| `GET {resource}` | `item: { items: [...], pageResponse: <paginator> }` |
| `GET {resource}/builder` | `item: { roles: [...], grouped: [...], ... }` (any keys) |
| `GET    {resource}/{id}` | `item: { ...record }` |
| `POST/PUT/DELETE` | `item: { ...record }` |
| `PUT    {resource}/{id}/toggle-active` | CrudService::toggleActiveStatus |
| `GET    {resource}/export` | binary .xlsx (same filters as the table) |
| `POST   {resource}/reorder` | `{ data: [{ id, sort_order }] }` |

**Singleton resources** (settings): `GET {resource}` + `POST {resource}` — no id.
**Notifications**: `GET notifications`, `POST notifications/{id}/read`,
`POST notifications/read-all`, `DELETE notifications/{id}`.

### Index query string (built by `buildIndexParams`)

```
page=1
per_page=10
search=foo
sort=name & direction=asc
advanceSearchFilter[0][key]=roles        ← column (must be in allowedAdvanceSearchColumns)
advanceSearchFilter[0][value][]=3        ← array for multiple-select
advanceSearchFilter[0][type]=multiple-select   ← FilterType enum
advanceSearchFilter[0][strategy]=eq            ← FilterStrategy enum
```

`FilterType`: `normal` (default) · `text` · `number` · `date` · `multiple-select`.
If the DTO key names ever change, edit the constants at the top of
`buildIndexParams` — that is the only place the query string is composed.

---

## 5. Cross-cutting systems

| System | Module | Usage |
|---|---|---|
| Tones | `@/lib/tones` | `default · primary · secondary · success · warning · danger · info`. Maps: `TONE_CLASS` (badges), `ACTION_TONE_CLASS` (icon actions), `BULK_ACTION_TONE_CLASS` (bulk bar). |
| URLs | `@/lib/paths` | `resourcePaths("users")` → `{ index, create, show(id), edit(id) }`. Non-standard index routes live in `INDEX_ROUTE_EXCEPTIONS`. |
| Permissions | `@/lib/permissions` + `useAuth()` | `resourcePermissions("users").edit` → `"users.edit"`. Check with `can(p)`, `canAny([])`, `canAll([])`. Super admins bypass everything. |
| i18n | `useLanguage()` | `t("general.nav.users")`, `exists(key)`, `locale`, `isRtl`. Filename = namespace. |
| Model i18n | `useModelTranslation(ns)` | One namespace per resource. `m.singular` · `m.plural` · `m.field("email")` · `m.action("delete")` · `m.createTitle` · `m.emptyTitle`. Titles compose from `general.crud.*`. |
| Toast | `useToast()` | `.success(msg)` `.error(msg)` `.info(msg, { description })`. |
| Loading | `@/components/ui/Loading` | `Spinner` · `LoadingPanel` · `LoadingSection` · `LoadingScreen` · `Skeleton`. Never write a bespoke spinner. |
| Delete flow | `@/hooks/useResourceTable` | `requestDelete` / `requestBulkDelete` / `toggleActive` / `confirmDialog` / `refreshKey` — never hand-roll confirm state in a list page. |
| Excel export | `<DataTable exportMode="server">` | calls `GET {resource}/export` with the live filters; default `"client"` builds a CSV locally. |
| Singleton form | `<DynamicForm singleton>` | `GET`/`POST {resource}` with no id — used by Settings. |
| Session expiry | `AUTH_UNAUTHORIZED_EVENT` | api.ts dispatches on an authed 401; AuthContext clears the session + toasts; guards redirect to /login. |
| Crash guard | `@/components/ui/ErrorBoundary` | wraps routed pages in AppLayout, keyed by pathname (resets on navigation). |
| Reduced motion | `MotionConfig` in App | `reducedMotion="user"` — respects the OS setting globally. |
| Theming | `@/context/BrandThemeContext` | Tokens resolve: preset → `DashboardConfig.themeOverrides` → user overrides. |

---

## 6. DataTable (`@/components/table`)

Client mode uses `data`; **server mode** uses `resource` and fetches
index + builder itself.

```tsx
<DataTable<User>
  resource="users"                      // server mode
  columns={columns}
  filters={filters}
  getRowId={(row) => String(row.id)}
  refreshKey={refreshKey}               // bump to refetch after a mutation
  rowActions={[...]} bulkActions={[...]} primaryAction={{...}}
/>
```

Columns are built fluently; the builder decides rendering:

```ts
column.text<User>("name").labelKey("...").sortable().searchable()
column.badge<User>("status").tones({ active: "success", banned: "danger" })
column.avatar<User>("name").description((r) => r.email)
column.custom<User>("roles").render((r) => <Chips items={r.roles} />)
```

Types: `text · badge · currency · number · date · avatar · boolean · custom`.
Modifiers: `.label/.labelKey · .accessor · .sortable · .searchable · .align ·
.width · .hideBelow · .toggleable · .description · .tones · .formatValue ·
.image · .sortFn · .render · .cellClass`.

Filters declare the **backend column** as `key`; options come from the builder:

```ts
{ key: "roles", builderKey: "roles", filterType: "multiple-select",
  multiple: true, accessor: (r) => refId(r.roles?.[0]) }
```

Actions accept `permission` and are filtered automatically — a user without
`users.delete` never sees the delete icon.

---

## 7. DynamicForm (`@/components/form`)

```tsx
<DynamicForm resource="users" recordId={id} fields={fields}
  transform={(v) => payload} redirectTo="/users/all" />
```

`recordId` present ⇒ edit mode: fetches the record, PUTs on submit, and
switches to `FormData` + `_method=PUT` automatically when a File is present.
Laravel 422 errors map onto the matching fields.

```ts
field.text("name").icon(User).required()
field.email("email").email().required()
field.password("password").min(8).only("create")
field.multiselect("roles").builderKey("roles").optionKeys({ value: "id", label: "name" })
field.groupedCheckbox("permissions").builderKey("grouped").optionKeys({ value: "id", label: "name" })
field.switch("is_active").default(true)
field.image("image")
```

**Option values are always ids.** `optionKeys` maps whatever shape the builder
returns (`{id,name}`, `{id,product_name}`, `{price,name}`…). Labels arrive
already translated from Laravel — never translate them in the front end.

---

## 8. DynamicShow (`@/components/show`)

```tsx
<DynamicShow<Role>
  resource="roles" recordId={id} sections={sections}
  header={(r) => ({ title: r.name, subtitle: "...", icon: ShieldCheck })}
  aside={(r) => <RelatedUsersPanel users={r.users} />}
/>
```

Provides fetching, `LoadingPanel`, **404 page when the record is missing**,
default Back/Edit URLs, an Edit button gated by `{resource}.edit`, and a
created/updated footer. With `aside`, the layout becomes 2/3 + 1/3.

---

## 9. Recipe — add a resource (e.g. `products`)

1. **Model** → add to `src/types/models.ts`.
2. **Locales** → `src/locales/{en,ar}/products.json` — ONE file per model with
   `singular`, `plural`, `description`, `fields.*`, `hints.*`, `actions.*`.
   Page titles ("Create Product") come free from `general.crud.*`.
   ⚠️ The namespace must equal the URL segment (`products` → `/products`) —
   that is how the sidebar and breadcrumbs resolve labels automatically.
3. **Fields** → `src/views/products/Fields.ts` exporting
   `buildProductFields(m)` and `buildProductShowSections(m)`, where `m` is
   `useModelTranslation("products")`.
4. **Pages** → `ProductsList.tsx` (DataTable + ConfirmModal + toasts +
   `refreshKey`), `ProductForm.tsx`, `ProductShow.tsx`.
5. **Routes** → add to `src/routes/routes.tsx` with `permission:` on each.
6. **Nav** → add to `src/data/navigation.ts` with `permission` and
   `labelKey: "products.plural"` (reuses the model name, never redefines it).
7. If the index route isn't `/products`, register it in
   `INDEX_ROUTE_EXCEPTIONS` in `@/lib/paths`.

Copy `views/roles/*` as the reference implementation — it exercises every
feature (server table, builder filters, grouped checkbox, aside panel).

---

## 10. Common mistakes

- ❌ Editing `components/layout/headers/` — the folder is **`header/`** (singular).
- ❌ Importing `@/config/dashboardConfig` — the file is **`DashboardConfig.ts`**.
- ❌ Using colour-named tones (`"green"`, `"rose"`) — they are semantic now.
- ❌ Adding a key to `en` only — always mirror in `ar`.
- ❌ Calling `formatDate()` on API data — it is already formatted.
- ❌ Adding a spinner div — use `@/components/ui/Loading`.
- ❌ Forgetting `refreshKey` after a delete — the table will look stale.
- ❌ Hand-rolling delete-confirm state in a list page — use `useResourceTable`.
- ❌ Leaving unused imports — `noUnusedLocals` fails the build.

---

## 11. Storage keys

| Key | Owner |
|---|---|
| `token` | `services/api.ts` (localStorage or sessionStorage) |
| `user-key` | `context/AuthContext.tsx` |
| `lang` | `context/LanguageContext.tsx` (+ pre-paint script in `index.html`) |
| `theme-mode` | `context/ThemeContext.tsx` (+ pre-paint script in `index.html`) |
| `pulse-brand-theme` | `context/BrandThemeContext.tsx` |

⚠️ `index.html` contains a pre-paint script that reads `lang` and `theme-mode`
directly to avoid a flash of wrong theme/direction. **If you rename either key,
update `index.html` too.**

---

## 12. Comment style

Every file opens with a block stating its purpose, exports and edit rules:

```ts
/**
 * <One-line summary.>
 *
 * PURPOSE : why this file exists / where it sits in the flow
 * EXPORTS : the public surface other modules rely on
 * EDIT    : the rule a future change must respect
 */
```

Inline comments only mark **non-obvious** decisions (protocol quirks,
workarounds, ordering constraints). Do not narrate obvious code.
