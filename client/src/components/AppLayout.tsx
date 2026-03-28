import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import {
  BookOpen, LayoutDashboard, PlusCircle, Settings, LogOut,
  AlertCircle, Menu, X
} from "lucide-react";
import { useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";

interface AppLayoutProps {
  children: React.ReactNode;
}

const navItems = [
  { icon: LayoutDashboard, label: "My Books", href: "/dashboard" },
  { icon: PlusCircle, label: "New Book", href: "/books/new" },
  { icon: Settings, label: "Settings", href: "/settings" },
];

export default function AppLayout({ children }: AppLayoutProps) {
  const { user, isAuthenticated, loading, logout } = useAuth();
  const [location, navigate] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { data: settings } = trpc.settings.get.useQuery(undefined, { enabled: isAuthenticated });

  // Close drawer on route change
  useEffect(() => { setMobileOpen(false); }, [location]);

  // Prevent body scroll when drawer is open
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  if (loading) {
    return (
      /* FIX: Use dvh with vh fallback for mobile */
      <div className="bg-background flex items-center justify-center" style={{ minHeight: '100dvh' }}>
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    window.location.href = getLoginUrl();
    return null;
  }

  const SidebarContent = () => (
    <>
      {/* Logo */}
      <div className="p-5 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg btn-glow flex items-center justify-center flex-shrink-0">
            <BookOpen className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-sidebar-foreground leading-tight">AI Book Writer</h1>
            <p className="text-xs text-muted-foreground">Personal Studio</p>
          </div>
        </div>
      </div>

      {/* API Key Warning — provider-aware */}
      {settings && (
        (settings.apiProvider === "openrouter" && !settings.hasOpenRouterKey) ||
        (settings.apiProvider !== "openrouter" && !settings.hasApiKey)
      ) && (
        <div className="mx-3 mt-3 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-yellow-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs text-yellow-400 font-medium">
                {settings?.apiProvider === "openrouter" ? "OpenRouter Key Required" : "OpenAI Key Required"}
              </p>
              <button
                onClick={() => navigate("/settings")}
                className="text-xs text-yellow-300 underline mt-0.5"
              >
                Add in Settings →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Nav — FIX: Increased touch targets */}
      <nav className="flex-1 p-3 space-y-1 mt-2">
        {navItems.map((item) => {
          const isActive = location === item.href || (item.href !== "/" && location.startsWith(item.href));
          return (
            <button
              key={item.href}
              onClick={() => navigate(item.href)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-all min-h-[44px]",
                isActive
                  ? "bg-primary/15 text-primary border border-primary/20"
                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground active:bg-sidebar-accent/80"
              )}
            >
              <item.icon className="w-4 h-4 flex-shrink-0" />
              {item.label}
            </button>
          );
        })}
      </nav>

      {/* User */}
      <div className="p-3 border-t border-sidebar-border">
        <div className="flex items-center gap-3 px-2 py-2">
          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
            <span className="text-xs font-bold text-primary">
              {user?.name?.charAt(0)?.toUpperCase() || "U"}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-sidebar-foreground truncate">{user?.name || "User"}</p>
            <p className="text-xs text-muted-foreground truncate">{user?.email || ""}</p>
          </div>
          <button
            onClick={() => logout()}
            className="text-muted-foreground hover:text-foreground transition-colors p-2 min-w-[36px] min-h-[36px] flex items-center justify-center"
            title="Sign out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </>
  );

  return (
    /* FIX: Use dvh for proper mobile viewport */
    <div className="bg-background flex" style={{ minHeight: '100dvh' }}>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 bg-sidebar border-r border-sidebar-border flex-col fixed h-full z-20">
        <SidebarContent />
      </aside>

      {/* Mobile: Top Header Bar — FIX: Increased touch target for menu button */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-30 bg-sidebar border-b border-sidebar-border flex items-center justify-between px-4 h-14">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg btn-glow flex items-center justify-center">
            <BookOpen className="w-4 h-4 text-white" />
          </div>
          <span className="text-sm font-bold text-sidebar-foreground">AI Book Writer</span>
        </div>
        <button
          onClick={() => setMobileOpen(true)}
          className="text-sidebar-foreground p-2 rounded-lg hover:bg-sidebar-accent active:bg-sidebar-accent/80 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5" />
        </button>
      </div>

      {/* Mobile Drawer Overlay */}
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile Drawer */}
      <aside
        className={cn(
          "md:hidden fixed top-0 left-0 h-full w-72 bg-sidebar border-r border-sidebar-border flex flex-col z-50 transition-transform duration-300",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <button
          onClick={() => setMobileOpen(false)}
          className="absolute top-4 right-4 text-muted-foreground hover:text-foreground p-2 rounded-lg min-w-[40px] min-h-[40px] flex items-center justify-center"
          aria-label="Close menu"
        >
          <X className="w-5 h-5" />
        </button>
        <SidebarContent />
      </aside>

      {/* Main Content */}
      <main className="flex-1 md:ml-64 pt-14 md:pt-0" style={{ minHeight: '100dvh' }}>
        {children}
      </main>
    </div>
  );
}
