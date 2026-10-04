"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, Users, Dumbbell, Zap, FileSpreadsheet, LogOut, Menu, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const sidebarItems = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/usuarios", label: "Usuarios", icon: Users },
  { href: "/admin/ejercicios", label: "Ejercicios", icon: Dumbbell },
  { href: "/admin/calentamientos", label: "Calentamientos", icon: Zap },
  { href: "/admin/reportes", label: "Reportes", icon: FileSpreadsheet },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  const navContent = (
    <div className="flex h-full flex-col">
      <div className="hidden lg:block p-6">
        <Link href="/admin" className="text-lg font-bold text-primary hover:opacity-80 transition-opacity">FitBoch Admin</Link>
      </div>

      <nav className="flex-1 space-y-1 px-3" aria-label="Administración">
        {sidebarItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/admin" && pathname.startsWith(item.href));
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              aria-current={isActive ? "page" : undefined}
              className={`flex items-center gap-3 rounded-md px-3 py-2.5 text-sm transition-colors active:scale-[0.98] ${
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-surface-hover hover:text-foreground"
              }`}
            >
              <Icon className="h-4 w-4" aria-hidden="true" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-3">
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-surface-hover hover:text-foreground"
        >
          <LogOut className="h-4 w-4" aria-hidden="true" />
          Cerrar Sesión
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Navbar móvil */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex h-14 items-center justify-between border-b border-border bg-surface/95 px-4 backdrop-blur lg:hidden">
        <Link href="/admin" className="text-lg font-bold text-primary hover:opacity-80 transition-opacity">FitBoch</Link>
        <button
          onClick={() => setOpen(!open)}
          aria-label={open ? "Cerrar menú" : "Abrir menú"}
          aria-expanded={open}
          className="-mr-2 inline-flex h-11 w-11 items-center justify-center rounded-md transition-colors hover:bg-white/10 active:scale-95"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </nav>

      {/* Overlay móvil */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/60 animate-in fade-in-0 lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Sidebar móvil */}
      <aside
        className={`fixed left-0 top-14 z-50 h-[calc(100dvh-3.5rem)] w-64 border-r border-border bg-surface pb-[env(safe-area-inset-bottom)] transition-transform duration-200 ease-out lg:hidden ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {navContent}
      </aside>

      {/* Sidebar desktop */}
      <aside className="fixed left-0 top-0 z-40 hidden h-screen w-64 border-r border-border bg-surface lg:block">
        {navContent}
      </aside>
    </>
  );
}
