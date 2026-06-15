import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/shared/Sidebar";
import { ThemeProvider } from "@/components/theme-context";
import { ThemeToggle } from "@/components/shared/ThemeToggle";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Xeno AI CRM",
  description: "AI-native Mini CRM",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} antialiased flex h-screen overflow-hidden bg-background text-foreground selection:bg-black/10`}>
        <ThemeProvider>
          <Sidebar />
          <div className="flex-1 flex flex-col h-full overflow-hidden">
            {/* Mobile Top Header */}
            <header className="md:hidden h-14 border-b border-border bg-card flex items-center justify-between px-4 shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 bg-primary flex items-center justify-center rounded-[4px]">
                  <span className="text-primary-foreground font-bold text-[9px]">X</span>
                </div>
                <span className="font-semibold text-[14px]">Xeno CRM</span>
              </div>
              <ThemeToggle />
            </header>
            
            <main className="flex-1 overflow-y-auto pb-16 md:pb-0 relative">
              {children}
            </main>
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
