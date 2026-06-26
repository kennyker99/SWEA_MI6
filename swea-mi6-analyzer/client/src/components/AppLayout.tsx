// SWEA MI6 Signal Analyzer — App Layout with Sidebar Navigation
// Design: Dark trading terminal, fixed left sidebar, main content area

import { useState } from "react";
import { Link, useLocation } from "wouter";
import {
  BarChart2,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Clock,
  Menu,
  X,
  Calculator,
} from "lucide-react";

const LOGO_URL = "/logo.svg";

const NAV_ITEMS = [
  {
    path: "/",
    label: "信号分析",
    labelEn: "Analyzer",
    icon: BarChart2,
  },
  {
    path: "/history",
    label: "历史记录",
    labelEn: "History",
    icon: Clock,
  },
  {
    path: "/reference",
    label: "指标说明",
    labelEn: "Reference",
    icon: BookOpen,
  },
  {
    path: "/quant",
    label: "量化分析",
    labelEn: "Quant",
    icon: Calculator,
  },
];

interface AppLayoutProps {
  children: React.ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const [location] = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen flex bg-background terminal-grid">
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 h-full z-50 flex flex-col
          bg-sidebar border-r border-sidebar-border
          transition-all duration-300 ease-out
          ${collapsed ? "w-16" : "w-60"}
          ${mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        `}
      >
        {/* Logo */}
        <div
          className={`flex items-center gap-3 px-4 py-5 border-b border-sidebar-border ${
            collapsed ? "justify-center px-2" : ""
          }`}
        >
          <img
            src={LOGO_URL}
            alt="SWEA MI6"
            className="w-10 h-10 flex-shrink-0"
          />
          {!collapsed && (
            <div className="min-w-0">
              <div
                className="text-sm font-bold text-foreground leading-tight"
                style={{ fontFamily: "'Sora', sans-serif" }}
              >
                SWEA MI6
              </div>
              <div className="text-xs text-muted-foreground leading-tight">
                Signal Analyzer
              </div>
            </div>
          )}
        </div>

        {/* Nav Items */}
        <nav className="flex-1 py-4 space-y-1 px-2">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = location === item.path;
            return (
              <Link key={item.path} href={item.path}>
                <div
                  className={`
                    flex items-center gap-3 px-3 py-2.5 rounded-md
                    transition-all duration-150 ease-out group
                    ${collapsed ? "justify-center px-2" : ""}
                    ${
                      isActive
                        ? "bg-primary/15 text-primary border border-primary/20"
                        : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                    }
                  `}
                  onClick={() => setMobileOpen(false)}
                >
                  <Icon
                    size={18}
                    className={`flex-shrink-0 ${isActive ? "text-primary" : ""}`}
                  />
                  {!collapsed && (
                    <div className="min-w-0">
                      <div className="text-sm font-medium leading-tight">
                        {item.label}
                      </div>
                      <div className="text-xs text-muted-foreground leading-tight">
                        {item.labelEn}
                      </div>
                    </div>
                  )}
                </div>
              </Link>
            );
          })}
        </nav>

        {/* Collapse toggle (desktop) */}
        <div className="p-3 border-t border-sidebar-border hidden lg:block">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className={`
              w-full flex items-center gap-2 px-3 py-2 rounded-md
              text-muted-foreground hover:text-foreground hover:bg-sidebar-accent
              transition-all duration-150 text-xs
              ${collapsed ? "justify-center" : ""}
            `}
          >
            {collapsed ? (
              <ChevronRight size={16} />
            ) : (
              <>
                <ChevronLeft size={16} />
                <span>收起侧边栏</span>
              </>
            )}
          </button>
        </div>

        {/* Version */}
        {!collapsed && (
          <div className="px-4 pb-4 text-xs text-muted-foreground/50">
            v1.0 · Traderpreneur
          </div>
        )}
      </aside>

      {/* Mobile top bar */}
      <div className="fixed top-0 left-0 right-0 h-14 bg-sidebar border-b border-sidebar-border z-30 flex items-center px-4 gap-3 lg:hidden">
        <button
          onClick={() => setMobileOpen(true)}
          className="text-foreground p-1"
        >
          <Menu size={20} />
        </button>
        <img src={LOGO_URL} alt="SWEA MI6" className="w-7 h-7" />
        <span
          className="text-sm font-bold text-foreground"
          style={{ fontFamily: "'Sora', sans-serif" }}
        >
          SWEA MI6 Analyzer
        </span>
        {mobileOpen && (
          <button
            onClick={() => setMobileOpen(false)}
            className="ml-auto text-foreground p-1"
          >
            <X size={20} />
          </button>
        )}
      </div>

      {/* Main content */}
      <main
        className={`
          flex-1 min-h-screen overflow-auto
          transition-all duration-300 ease-out
          pt-14 lg:pt-0
          ${collapsed ? "lg:ml-16" : "lg:ml-60"}
        `}
      >
        {children}
      </main>
    </div>
  );
}
