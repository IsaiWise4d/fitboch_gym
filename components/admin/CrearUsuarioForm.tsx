"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CheckCircle2, Loader2, UserPlus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface CrearUsuarioFormProps {
  /** Se llama tras crear el usuario (antes de mostrar sus credenciales). */
  onCreado?: (usuarioId: string) => void;
  onCerrar?: () => void;
}

/** Formulario de alta: nombre, email y cédula (contraseña inicial). */
export function CrearUsuarioForm({ onCreado, onCerrar }: CrearUsuarioFormProps) {
  const router = useRouter();
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [cedula, setCedula] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [creado, setCreado] = useState<{ id: string; email: string; cedula: string } | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!nombre.trim() || !email.trim() || !cedula.trim()) {
      setError("Todos los campos son obligatorios");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/admin/crear-usuario", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: nombre.trim(),
          email: email.trim().toLowerCase(),
          password: cedula.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Error al crear el usuario");
      } else {
        setCreado({ id: data.usuario_id, email: email.trim().toLowerCase(), cedula: cedula.trim() });
        onCreado?.(data.usuario_id);
        router.refresh();
      }
    } catch {
      setError("Error de conexión");
    } finally {
      setLoading(false);
    }
  }

  function crearOtro() {
    setNombre("");
    setEmail("");
    setCedula("");
    setCreado(null);
  }

  if (creado) {
    return (
      <div className="space-y-4">
        <div className="flex gap-3 rounded-lg bg-success/10 p-3 text-sm">
          <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" aria-hidden="true" />
          <div className="space-y-1">
            <p className="font-medium text-success">Usuario creado. Comparte sus credenciales:</p>
            <p className="text-foreground/90">
              <span className="text-muted-foreground">Email:</span> {creado.email}
            </p>
            <p className="text-foreground/90">
              <span className="text-muted-foreground">Contraseña:</span> {creado.cedula} (cédula)
            </p>
          </div>
        </div>
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button variant="outline" onClick={crearOtro}>
            Crear otro
          </Button>
          <Button
            nativeButton={false}
            render={<Link href={`/admin/usuarios/${creado.id}?renovar=1`} onClick={onCerrar} />}
          >
            Asignar membresía
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="nuevo-nombre">Nombre</Label>
        <Input
          id="nuevo-nombre"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          placeholder="Nombre del usuario"
          autoComplete="off"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="nuevo-email">Correo electrónico</Label>
        <Input
          id="nuevo-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="usuario@email.com"
          autoComplete="off"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="nuevo-cedula">Cédula (será la contraseña inicial)</Label>
        <Input
          id="nuevo-cedula"
          value={cedula}
          onChange={(e) => setCedula(e.target.value)}
          placeholder="12345678"
          inputMode="numeric"
          autoComplete="off"
        />
        <p className="text-xs text-muted-foreground">El usuario podrá cambiar su contraseña después.</p>
      </div>

      {error && (
        <p role="alert" className="rounded-lg bg-error/10 px-3 py-2 text-sm text-error">
          {error}
        </p>
      )}

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? <Loader2 className="animate-spin" /> : <UserPlus />}
        Crear usuario
      </Button>
    </form>
  );
}
