"use client";

import { useState } from "react";
import { UserPlus } from "lucide-react";

import { CrearUsuarioForm } from "@/components/admin/CrearUsuarioForm";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

/** Botón "Nuevo usuario" + diálogo con el formulario de alta. */
export function DialogoNuevoUsuario({ variante = "default" }: { variante?: "default" | "outline" }) {
  const [abierto, setAbierto] = useState(false);

  return (
    <Dialog open={abierto} onOpenChange={setAbierto}>
      <DialogTrigger render={<Button variant={variante} />}>
        <UserPlus aria-hidden="true" />
        Nuevo usuario
      </DialogTrigger>
      <DialogContent className="bg-surface p-5 sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">Nuevo usuario</DialogTitle>
          <DialogDescription>
            Se crea con el email confirmado; la cédula queda como contraseña inicial.
          </DialogDescription>
        </DialogHeader>
        {/* Montado solo mientras está abierto: cada apertura empieza limpia. */}
        {abierto && <CrearUsuarioForm onCerrar={() => setAbierto(false)} />}
      </DialogContent>
    </Dialog>
  );
}
