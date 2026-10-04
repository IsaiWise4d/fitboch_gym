"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Dumbbell,
  FileSpreadsheet,
  LayoutDashboard,
  LogOut,
  Menu,
  Search,
  Users,
  X,
  Zap,
} from "lucide-react";

import { PaletaBusqueda, type UsuarioBusqueda } from "@/components/admin/shell/PaletaBusqueda";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

const GRUPOS = [
  {
    titulo: "General",
    items: [
      { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
      { href: "/admin/reportes", label: "Reportes", icon: FileSpreadsheet },
    ],
  },
  {
    titulo: "Gestión",
    items: [
      { href: "/admin/usuarios", label: "Usuarios", icon: Users },
      { href: "/admin/ejercicios", label: "Ejercicios", icon: Dumbbell },
      { href: "/admin/calentamientos", label: "Calentamientos", icon: Zap },
    ],
  },
];

interface AdminSidebarProps {
  nombreAdmin: string;
  /** Membresías por vencer + vencidas recientes (badge de Usuarios). */
  alertasMembresia: number;
  usuarios: UsuarioBusqueda[];
}

export function AdminSidebar({ nombreAdmin, alertasMembresia, usuarios }: AdminSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [buscando, setBuscando] = useState(false);

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  function abrirBusqueda() {
    setOpen(false);
    setBuscando(true);
  }

  const navContent = (
    <div className="flex h-full flex-col">
      <div className="hidden items-baseline gap-2 px-5 pt-6 pb-5 lg:flex">
        <Link href="/admin" className="text-lg font-bold tracking-tight text-primary transition-opacity hover:opacity-80">
          FitBoch
        </Link>
        <span className="text-xs font-medium text-muted-foreground">Admin</span>
      </div>

      <div className="px-3 pt-3 lg:pt-0">
        <button
          type="button"
          onClick={abrirBusqueda}
          className="flex h-9 w-full items-center gap-2 rounded-lg border border-border bg-background/60 px-3 text-sm text-muted-foreground transition-colors duration-150 hover:border-white/15 hover:text-foreground"
        >
          <Search className="size-4" aria-hidden="true" />
          <span className="flex-1 text-left">Buscar usuario…</span>
          <kbd className="hidden rounded border border-border px-1.5 font-sans text-[10px] text-muted-foreground lg:inline">
            Ctrl K
          </kbd>
        </button>
      </div>

      <nav className="flex-1 space-y-5 overflow-y-auto px-3 pt-5" aria-label="Administración">
        {GRUPOS.map((grupo) => (
          <div key={grupo.titulo} className="space-y-1">
            <p className="px-3 pb-1 text-[11px] font-medium text-muted-foreground/70">{grupo.titulo}</p>
            {grupo.items.map((item) => {
              const isActive =
                pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href));
              const Icon = item.icon;
              const conAlerta = item.href === "/admin/usuarios" && alertasMembresia > 0;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  aria-current={isActive ? "page" : undefined}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors duration-150 active:scale-[0.98]",
                    isActive
                      ? "bg-primary/10 font-medium text-primary"
                      : "text-muted-foreground hover:bg-white/[0.04] hover:text-foreground"
                  )}
                >
                  <Icon className="size-4" aria-hidden="true" />
                  <span className="flex-1">{item.label}</span>
                  {conAlerta && (
                    <span
                      className="min-w-5 rounded-full bg-estado-por-vencer/15 px-1.5 text-center text-[11px] font-semibold tabular-nums text-warning"
                      title={`${alertasMembresia} membresía${alertasMembresia === 1 ? "" : "s"} por vencer o vencida${alertasMembresia === 1 ? "" : "s"} recientemente`}
                    >
                      {alertasMembresia}
                      <span className="sr-only"> membresías requieren atención</span>
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      <div className="border-t border-border p-3">
        <div className="flex items-center gap-3 rounded-lg px-3 py-2">
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-foreground">{nombreAdmin}</p>
            <p className="text-xs text-muted-foreground">Administrador</p>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            title="Cerrar sesión"
            aria-label="Cerrar sesión"
            className="inline-flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors duration-150 hover:bg-white/[0.06] hover:text-foreground"
          >
            <LogOut className="size-4" aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Barra superior móvil */}
      <nav className="fixed top-0 right-0 left-0 z-50 flex h-14 items-center justify-between border-b border-border bg-sidebar/95 px-4 backdrop-blur lg:hidden">
        <Link href="/admin" className="text-lg font-bold text-primary transition-opacity hover:opacity-80">
          FitBoch
        </Link>
        <div className="-mr-2 flex items-center">
          <button
            type="button"
            onClick={abrirBusqueda}
            aria-label="Buscar usuario"
            className="inline-flex size-11 items-center justify-center rounded-md transition-colors hover:bg-white/10 active:scale-95"
          >
            <Search className="size-5" />
          </button>
          <button
            type="button"
            onClick={() => setOpen(!open)}
            aria-label={open ? "Cerrar menú" : "Abrir menú"}
            aria-expanded={open}
            className="relative inline-flex size-11 items-center justify-center rounded-md transition-colors hover:bg-white/10 active:scale-95"
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
            {!open && alertasMembresia > 0 && (
              <span aria-hidden="true" className="absolute top-2.5 right-2.5 size-2 rounded-full bg-warning" />
            )}
          </button>
        </div>
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
        className={cn(
          "fixed top-14 left-0 z-50 h-[calc(100dvh-3.5rem)] w-64 border-r border-border bg-sidebar pb-[env(safe-area-inset-bottom)] transition-transform duration-200 ease-out lg:hidden",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {navContent}
      </aside>

      {/* Sidebar escritorio */}
      <aside className="fixed top-0 left-0 z-40 hidden h-screen w-64 border-r border-border bg-sidebar lg:block">
        {navContent}
      </aside>

      <PaletaBusqueda abierta={buscando} onCambio={setBuscando} usuarios={usuarios} />
    </>
  );
}
