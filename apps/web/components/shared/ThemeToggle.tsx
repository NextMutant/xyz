"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/components/theme-context";
import { useEffect, useState } from "react";

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="w-8 h-8 rounded-lg border border-border bg-card flex items-center justify-center opacity-0">
        <div className="w-4 h-4" />
      </div>
    );
  }

  return (
    <button
      onClick={toggleTheme}
      className="w-8 h-8 rounded-lg border border-border bg-card hover:bg-secondary flex items-center justify-center transition-colors cursor-pointer group"
      aria-label="Toggle theme"
    >
      {theme === "light" ? (
        <Moon className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
      ) : (
        <Sun className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
      )}
    </button>
  );
}
