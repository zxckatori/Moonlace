import type { Metadata } from "next";
import "@/styles/globals.css";
import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import { RightSidebar } from "@/components/layout/RightSidebar";
import { BottomNav } from "@/components/layout/BottomNav";
import { AuthProvider } from "@/components/providers/AuthProvider";

export const metadata: Metadata = {
  title: "Moonlace — Signal Archive",
  description: "Форум и лента активности в эстетике Synthwave / Darkwave",
  openGraph: {
    title: "Moonlace",
    description: "Transmission from the void",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <body className="scanlines">
        <a href="#main" className="skip-link">
          Перейти к контенту
        </a>
        <AuthProvider>
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
            Moonlace · transmission from the void · {new Date().getFullYear()}
          </footer>
          <BottomNav />
        </AuthProvider>
      </body>
    </html>
  );
}
