import { RouterProvider } from "react-router-dom";
import { MotionConfig } from "framer-motion";
import { ThemeProvider } from "@/context/ThemeContext";
import { LanguageProvider } from "@/context/LanguageContext";
import { BrandThemeProvider } from "@/context/BrandThemeContext";
import { AuthProvider } from "@/context/AuthContext";
import { ToastProvider } from "@/components/ui/Toast";
import { router } from "@/routes/router";

/**
 * App composition root — providers + router, nothing else.
 * Layout chrome lives in `AppLayout`; routes in `src/routes`.
 *
 * Provider ORDER matters:
 *   Language (t, locale, RTL) → MotionConfig (reduced-motion) → BrandTheme
 *   (tokens) → Theme (light/dark) → Toast (uses language) → Auth (uses toast
 *   for session-expiry) → Router.
 */
export default function App() {
  return (
    <LanguageProvider>
      <MotionConfig reducedMotion="user">
        <BrandThemeProvider>
          <ThemeProvider>
            <ToastProvider>
              <AuthProvider>
                <RouterProvider router={router} />
              </AuthProvider>
            </ToastProvider>
          </ThemeProvider>
        </BrandThemeProvider>
      </MotionConfig>
    </LanguageProvider>
  );
}
