import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import api, { AUTH_UNAUTHORIZED_EVENT } from "@/services/api";
import { hasPermission } from "@/lib/permissions";
import { useLanguage } from "@/context/LanguageContext";
import { useToast } from "@/components/ui/Toast";
import {
  fetchProfile,
  login as loginRequest,
  logout as logoutRequest,
  register as registerRequest,
  type AuthUser,
  type Credentials,
  type RegisterPayload,
} from "@/services/auth";

const USER_KEY = "user-key";

interface AuthContextValue {
  user: AuthUser | null;
  /** True until the cached session has been restored/verified. */
  initializing: boolean;
  isAuthenticated: boolean;
  login: (credentials: Credentials, remember?: boolean) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => Promise<void>;
  /** Merge fresh fields into the cached user (after a profile save). */
  setUser: (user: AuthUser) => void;
  /** Roles come from the backend (Spatie). */
  hasRole: (role: string) => boolean;
  hasAnyRole: (roles: string[]) => boolean;
  /** True when the user is a super admin (bypasses every check). */
  isSuperAdmin: boolean;
  /** Permission check — `undefined` means "no permission required". */
  can: (permission?: string) => boolean;
  canAny: (permissions: string[]) => boolean;
  canAll: (permissions: string[]) => boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function readCachedUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem(USER_KEY) ?? sessionStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as AuthUser) : null;
  } catch {
    return null;
  }
}

function cacheUser(user: AuthUser | null, remember = true): void {
  if (user) (remember ? localStorage : sessionStorage).setItem(USER_KEY, JSON.stringify(user));
  else {
    localStorage.removeItem(USER_KEY);
    sessionStorage.removeItem(USER_KEY);
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const { t } = useLanguage();
  const toast = useToast();
  const [user, setUserState] = useState<AuthUser | null>(readCachedUser);
  const [initializing, setInitializing] = useState(true);

  /** Revalidate a cached session against the API on boot. */
  useEffect(() => {
    const token = localStorage.getItem("token") ?? sessionStorage.getItem("token");
    if (!token) {
      cacheUser(null);
      setUserState(null);
      setInitializing(false);
      return;
    }

    let cancelled = false;
    fetchProfile()
      .then((fresh) => {
        if (cancelled) return;
        setUserState(fresh);
        cacheUser(fresh);
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        // Expired/invalid token → force a fresh sign-in.
        const status = (error as { status?: number })?.status;
        if (status === 401 || status === 403) {
          api.clearAuth();
          cacheUser(null);
          setUserState(null);
        }
      })
      .finally(() => {
        if (!cancelled) setInitializing(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  /**
   * Session expiry — the transport emits AUTH_UNAUTHORIZED_EVENT when an
   * authenticated request returns 401. Clear the session once (parallel
   * failures are deduped) and let RequireAuth redirect to /login.
   */
  const expiryHandled = useRef(false);
  useEffect(() => {
    const handleExpired = () => {
      if (expiryHandled.current) return;
      expiryHandled.current = true;
      window.setTimeout(() => {
        expiryHandled.current = false;
      }, 2000);

      api.clearAuth();
      cacheUser(null);
      setUserState(null);
      toast.error(t("auth.errors.sessionExpired"));
    };

    window.addEventListener(AUTH_UNAUTHORIZED_EVENT, handleExpired);
    return () => window.removeEventListener(AUTH_UNAUTHORIZED_EVENT, handleExpired);
  }, [t, toast]);

  const setUser = useCallback((next: AuthUser) => {
    setUserState(next);
    cacheUser(next);
  }, []);

  const login = useCallback(async (credentials: Credentials, remember = true) => {
    const { token, user: authUser } = await loginRequest(credentials);
    if (token) api.setToken(token, remember);
    setUserState(authUser);
    cacheUser(authUser, remember);
  }, []);

  const register = useCallback(async (payload: RegisterPayload) => {
    const { token, user: authUser } = await registerRequest(payload);
    if (token) api.setToken(token, true);
    setUserState(authUser);
    cacheUser(authUser);
  }, []);

  const logout = useCallback(async () => {
    try {
      await logoutRequest();
    } catch {
      /* Always clear locally, even if the API call fails. */
    }
    api.clearAuth();
    cacheUser(null);
    setUserState(null);
  }, []);

  const hasRole = useCallback(
    (role: string) => Boolean(user?.roles?.includes(role)),
    [user],
  );

  const hasAnyRole = useCallback(
    (roles: string[]) => roles.some((role) => Boolean(user?.roles?.includes(role))),
    [user],
  );

  /* ------------------------------ permissions ----------------------------- */
  const isSuperAdmin = Boolean(user?.is_super_admin);

  const can = useCallback(
    (permission?: string) =>
      hasPermission(user?.permissions ?? [], permission, Boolean(user?.is_super_admin)),
    [user],
  );

  const canAny = useCallback(
    (permissions: string[]) =>
      permissions.length === 0 || permissions.some((permission) => can(permission)),
    [can],
  );

  const canAll = useCallback(
    (permissions: string[]) => permissions.every((permission) => can(permission)),
    [can],
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      initializing,
      isAuthenticated: Boolean(user),
      login,
      register,
      logout,
      setUser,
      hasRole,
      hasAnyRole,
      isSuperAdmin,
      can,
      canAny,
      canAll,
    }),
    [
      user,
      initializing,
      login,
      register,
      logout,
      setUser,
      hasRole,
      hasAnyRole,
      isSuperAdmin,
      can,
      canAny,
      canAll,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
