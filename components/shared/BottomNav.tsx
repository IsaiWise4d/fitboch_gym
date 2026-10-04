"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
// En Base UI 1.2 el Drawer se publica como "preview"; revisar al actualizar @base-ui/react
import { DrawerPreview as Drawer } from "@base-ui/react/drawer";
import {
  ChevronRight,
  CircleUserRound,
  ClipboardList,
  Dumbbell,
  Flame,
  House,
  LayoutGrid,
  Salad,
  Zap,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { LogoutButton } from "@/components/shared/LogoutButton";

// Accesos de uso diario: siempre visibles en la barra
const navPrincipal = [
  { href: "/dashboard", label: "Inicio", icon: House },
  { href: "/rutina", label: "Rutina", icon: ClipboardList },
  { href: "/ejercicios", label: "Ejercicios", icon: Dumbbell },
  { href: "/racha", label: "Racha", icon: Flame },
];

// Accesos secundarios: viven en el panel "Más"
const navSecundario = [
  {
    href: "/calentamientos",
    label: "Calentamientos",
    descripcion: "Activa el cuerpo antes de entrenar",
    icon: Zap,
    colorIcono: "bg-orange-500/15 text-orange-400",
  },
  {
    href: "/plan-nutricional",
    label: "Dieta",
    descripcion: "Tu plan de alimentación",
    icon: Salad,
    colorIcono: "bg-success/15 text-success",
  },
  {
    href: "/perfil",
    label: "Perfil",
    descripcion: "Datos y membresía",
    icon: CircleUserRound,
    colorIcono: "bg-white/10 text-foreground",
  },
];

const tabClassName =
  "group relative flex min-h-14 flex-col items-center justify-center gap-1 px-1 py-2 text-[11px] font-medium transition-colors";

function TabContenido({ icon: Icon, label, isActive }: { icon: LucideIcon; label: string; isActive: boolean }) {
  return (
    <>
      {/* Indicador de la pestaña activa */}
      <span
        aria-hidden="true"
        className={`absolute top-0 h-0.5 w-8 rounded-full bg-primary transition-all duration-300 ${
          isActive ? "opacity-100" : "scale-x-0 opacity-0"
        }`}
      />
      <span
        className={`flex h-7 w-11 items-center justify-center rounded-full transition-all duration-200 group-active:scale-90 ${
          isActive ? "bg-primary/15" : ""
        }`}
      >
        {/* Trazo más grueso en la pestaña activa para reforzar dónde estás */}
        <Icon
          className="h-5 w-5 transition-[stroke-width]"
          strokeWidth={isActive ? 2.25 : 1.75}
          aria-hidden="true"
        />
      </span>
      <span className="leading-none">{label}</span>
    </>
  );
}

export function BottomNav() {
  const pathname = usePathname();
  const [abierto, setAbierto] = useState(false);

  const masActivo = navSecundario.some((item) => pathname.startsWith(item.href));

  return (
    <nav
      aria-label="Navegación principal"
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md"
    >
      <div className="mx-auto grid max-w-md grid-cols-5">
        {navPrincipal.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive ? "page" : undefined}
              className={`${tabClassName} ${
                isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <TabContenido icon={item.icon} label={item.label} isActive={isActive} />
            </Link>
          );
        })}

        <Drawer.Root open={abierto} onOpenChange={setAbierto}>
          <Drawer.Trigger
            aria-label="Más opciones"
            className={`${tabClassName} ${
              masActivo || abierto ? "text-primary" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <TabContenido icon={LayoutGrid} label="Más" isActive={masActivo} />
          </Drawer.Trigger>

          <Drawer.Portal>
            <Drawer.Backdrop className="fixed inset-0 z-[60] bg-black opacity-[calc(0.6*(1-var(--drawer-swipe-progress)))] transition-opacity duration-300 ease-out data-[ending-style]:opacity-0 data-[starting-style]:opacity-0 data-[swiping]:duration-0" />
            <Drawer.Viewport className="fixed inset-0 z-[60] flex items-end justify-center">
              <Drawer.Popup className="w-full max-w-md rounded-t-2xl border-t border-border bg-surface px-4 pt-3 pb-[calc(1rem+env(safe-area-inset-bottom))] shadow-[0_-16px_48px_rgb(0_0_0/0.4)] outline-none transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] [transform:translateY(var(--drawer-swipe-movement-y))] data-[ending-style]:[transform:translateY(100%)] data-[starting-style]:[transform:translateY(100%)] data-[swiping]:select-none">
                <div aria-hidden="true" className="mx-auto mb-3 h-1 w-10 rounded-full bg-white/20" />
                <Drawer.Title className="mb-2 px-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Más opciones
                </Drawer.Title>

                <ul className="space-y-1">
                  {navSecundario.map((item) => {
                    const isActive = pathname.startsWith(item.href);
                    const Icon = item.icon;
                    return (
                      <li key={item.href}>
                        <Link
                          href={item.href}
                          onClick={() => setAbierto(false)}
                          aria-current={isActive ? "page" : undefined}
                          className={`flex min-h-14 items-center gap-3 rounded-xl px-2 py-2 transition-all hover:bg-surface-hover active:scale-[0.98] ${
                            isActive ? "bg-primary/10" : ""
                          }`}
                        >
                          <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${item.colorIcono}`}>
                            <Icon className="h-4.5 w-4.5" aria-hidden="true" />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className={`block text-sm font-semibold ${isActive ? "text-primary" : ""}`}>
                              {item.label}
                            </span>
                            <span className="block text-xs text-muted-foreground">{item.descripcion}</span>
                          </span>
                          <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                        </Link>
                      </li>
                    );
                  })}
                </ul>

                <div className="mt-2 border-t border-border/60 pt-2">
                  <LogoutButton />
                </div>
              </Drawer.Popup>
            </Drawer.Viewport>
          </Drawer.Portal>
        </Drawer.Root>
      </div>
    </nav>
  );
}
