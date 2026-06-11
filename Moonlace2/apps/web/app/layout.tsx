import type { Metadata } from "next";
import "@/styles/globals.css";
import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import { RightSidebar } from "@/components/layout/RightSidebar";
import { BottomNav } from "@/components/layout/BottomNav";
import { AuthProvider } from "@/components/providers/AuthProvider";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { ThemeScript } from "@/components/providers/ThemeScript";
import { ToastProvider } from "@/components/providers/ToastProvider";
import { UserThemeApplier } from "@/components/providers/UserThemeApplier";

export const metadata: Metadata = {
  title: "Moonlace — Signal Archive",
  description: "Форум и лента активности в эстетике Synthwave / Darkwave",
  openGraph: {
    title: "Moonlace",
    description: "Сигнал из пустоты",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru" data-theme="synthwave">
      <head>
        <ThemeScript />
      </head>
      <body className="scanlines">
        <a href="#main" className="skip-link">
          Перейти к контенту
        </a>
        <ThemeProvider>
          <ToastProvider>
          <AuthProvider>
          <UserThemeApplier />
          <Header />
          <div
            className="main-layout"
            style={{
              display: "grid",
              gridTemplateColumns: "220px 1fr 260px",
              minHeight: "calc(100vh - 60px)",
              maxWidth: "1400px",
              margin: "0 auto",
            }}
          >
            <div className="desktop-sidebars">
              <Sidebar />
            </div>
            <main id="main" style={{ padding: "var(--space-4)", overflow: "hidden" }}>
              {children}
            </main>
            <div className="desktop-sidebars">
              <RightSidebar />
            </div>
          </div>
          <footer
            style={{
              textAlign: "center",
              padding: "var(--space-4)",
              borderTop: "1px solid var(--border)",
              color: "var(--text-muted)",
              fontFamily: "var(--font-terminal)",
              fontSize: "14px",
            }}
          >
            Moonlace · сигнал из пустоты · {new Date().getFullYear()}
          </footer>
          <BottomNav />
          </AuthProvider>
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
