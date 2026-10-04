"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  Dumbbell,
  FileSpreadsheet,
  LayoutDashboard,
  Users,
  Zap,
} from "lucide-react";

import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandShortcut,
} from "@/components/ui/command";
import { EstadoBadge } from "@/components/admin/ui/EstadoBadge";
import { AvatarIniciales } from "@/components/admin/ui/varios";
import type { EstadoUsuarioClave } from "@/lib/membresias/estado";
import { normalizarTexto } from "@/lib/utils/texto";

export interface UsuarioBusqueda {
  id: string;
  nombre: string;
  email: string;
  estado: EstadoUsuarioClave;
}

const ACCESOS = [
  { href: "/admin", etiqueta: "Ir al dashboard", icono: LayoutDashboard },
  { href: "/admin/usuarios", etiqueta: "Ver todos los usuarios", icono: Users },
  { href: "/admin/usuarios?estado=por_vencer", etiqueta: "Membresías por vencer", icono: AlertTriangle },
  { href: "/admin/reportes", etiqueta: "Abrir reporte del mes", icono: FileSpreadsheet },
  { href: "/admin/ejercicios", etiqueta: "Gestionar ejercicios", icono: Dumbbell },
  { href: "/admin/calentamientos", etiqueta: "Gestionar calentamientos", icono: Zap },
];

/** Coincidencia sin tildes ni mayúsculas (cmdk usa un puntaje difuso por defecto). */
function filtrar(valor: string, busqueda: string): number {
  return normalizarTexto(valor).includes(normalizarTexto(busqueda.trim())) ? 1 : 0;
}

const CLASE_ITEM = "gap-3 px-3 py-2 data-selected:bg-white/[0.07]";

/**
 * Buscador global (Ctrl/⌘ + K): salta a la ficha de cualquier usuario o a
 * una sección del panel sin pasar por la lista.
 */
export function PaletaBusqueda({
  abierta,
  onCambio,
  usuarios,
}: {
  abierta: boolean;
  onCambio: (abierta: boolean) => void;
  usuarios: UsuarioBusqueda[];
}) {
  const router = useRouter();

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        onCambio(!abierta);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [abierta, onCambio]);

  function ir(href: string) {
    onCambio(false);
    router.push(href);
  }

  return (
    <CommandDialog
      open={abierta}
      onOpenChange={onCambio}
      title="Buscar en el panel"
      description="Busca un usuario por nombre o email, o salta a una sección."
      className="sm:max-w-xl"
    >
      <Command filter={filtrar} className="bg-surface">
        <CommandInput placeholder="Buscar usuario por nombre o email…" />
        <CommandList className="max-h-[min(60vh,26rem)] p-1">
          <CommandEmpty className="py-8 text-center text-sm text-muted-foreground">
            Ningún usuario ni sección coincide.
          </CommandEmpty>
          <CommandGroup heading="Usuarios">
            {usuarios.map((u) => (
              <CommandItem
                key={u.id}
                value={`${u.nombre} ${u.email}`}
                onSelect={() => ir(`/admin/usuarios/${u.id}`)}
                className={CLASE_ITEM}
              >
                <AvatarIniciales nombre={u.nombre} className="size-7 text-[10px]" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm text-foreground">{u.nombre}</span>
                  <span className="block truncate text-xs text-muted-foreground">{u.email}</span>
                </span>
                <EstadoBadge estado={u.estado} className="h-5 px-2 text-[11px]" />
              </CommandItem>
            ))}
          </CommandGroup>
          <CommandGroup heading="Ir a">
            {ACCESOS.map((a) => {
              const Icono = a.icono;
              return (
                <CommandItem
                  key={a.href}
                  value={a.etiqueta}
                  onSelect={() => ir(a.href)}
                  className={CLASE_ITEM}
                >
                  <Icono className="text-muted-foreground" aria-hidden="true" />
                  {a.etiqueta}
                  <CommandShortcut className="tracking-normal">↵</CommandShortcut>
                </CommandItem>
              );
            })}
          </CommandGroup>
        </CommandList>
      </Command>
    </CommandDialog>
  );
}
