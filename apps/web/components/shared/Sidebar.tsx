"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users, PieChart, Sparkles, Send, Command } from "lucide-react";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "./ThemeToggle";

const navItems = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Customers", href: "/customers", icon: Users },
  { name: "Segments (AI)", href: "/segments", icon: Sparkles },
  { name: "Campaigns", href: "/campaigns/new", icon: Send },
  { name: "Analytics", href: "/analytics", icon: PieChart },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <>
      <aside className="hidden md:flex w-64 border-r border-border bg-card flex-col h-full z-10 relative text-sm">
        {/* Premium Gradient Top Border effect */}
        <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-foreground/5 to-transparent" />

        <div className="h-16 flex items-center px-6 border-b border-border justify-between">
          <div className="flex items-center gap-2.5 cursor-default">
            <div className="w-6 h-6 bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center rounded-[6px] shadow-[0_0_15px_rgba(0,0,0,0.1)]">
              <span className="text-primary-foreground font-bold text-[11px] font-sans">X</span>
            </div>
            <span className="font-semibold text-foreground tracking-tight text-[15px]">Xeno CRM</span>
          </div>
          <ThemeToggle />
        </div>

        <nav className="flex-1 px-4 py-6 space-y-1">
          <div className="px-2 mb-3">
            <span className="text-[11px] font-medium uppercase tracking-[0.15em] text-muted-foreground">Menu</span>
          </div>
          {navItems.map((item) => {
            const isActive = pathname === item.href || (pathname.startsWith(item.href) && item.href !== "/");
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "group relative flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-medium transition-all duration-300",
                  isActive 
                    ? "bg-secondary text-foreground shadow-[0_0_0_1px_rgba(0,0,0,0.05)]" 
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                )}
              >
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-primary rounded-r-full shadow-[0_0_10px_rgba(0,0,0,0.1)]" />
                )}
                <item.icon className={cn("w-4 h-4 transition-colors duration-300", isActive ? "text-foreground" : "text-muted-foreground group-hover:text-foreground")} />
                <span className="tracking-wide">{item.name}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-border bg-gradient-to-t from-foreground/[0.01] to-transparent">
          <div className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-secondary/50 transition-colors cursor-pointer border border-transparent hover:border-border">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-secondary to-muted flex items-center justify-center border border-border shadow-inner">
              <span className="text-[11px] font-medium text-foreground tracking-wider">MA</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[13px] font-medium text-foreground leading-tight">Marketing Admin</span>
              <span className="text-[11px] text-muted-foreground mt-0.5">Xeno Engineering</span>
            </div>
            <Command className="w-3.5 h-3.5 ml-auto text-muted-foreground/50" />
          </div>
        </div>
      </aside>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-card border-t border-border z-50 flex items-center justify-around px-2 pb-safe shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (pathname.startsWith(item.href) && item.href !== "/");
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-1 p-2 w-16 transition-colors",
                isActive ? "text-foreground" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <item.icon className={cn("w-5 h-5", isActive ? "drop-shadow-[0_0_8px_rgba(0,0,0,0.1)]" : "")} />
              <span className="text-[9px] font-medium tracking-wide truncate w-full text-center">{item.name.replace(' (AI)', '')}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
