"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { UserPlus } from "lucide-react";
import { CrearUsuarioForm } from "./CrearUsuarioForm";

export function UsuariosHeader() {
  const [showForm, setShowForm] = useState(false);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Usuarios</h1>
        <Button size="sm" onClick={() => setShowForm(!showForm)}>
          <UserPlus className="h-4 w-4 mr-2" />
          Nuevo
        </Button>
      </div>
      {showForm && <CrearUsuarioForm onClose={() => setShowForm(false)} />}
    </div>
  );
}
