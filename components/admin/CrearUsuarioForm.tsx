"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, UserPlus, X } from "lucide-react";

export function CrearUsuarioForm({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [cedula, setCedula] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

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
        setSuccess(true);
        setTimeout(() => {
          onClose();
          router.refresh();
        }, 1500);
      }
    } catch {
      setError("Error de conexión");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-lg border border-border bg-surface p-4 space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium flex items-center gap-2">
          <UserPlus className="h-4 w-4 text-primary" />
          Nuevo usuario
        </p>
        <button onClick={onClose}>
          <X className="h-4 w-4 text-muted-foreground" />
        </button>
      </div>

      {success ? (
        <div className="rounded-md bg-success/10 p-3 text-sm text-success">
          Usuario creado correctamente. Sus credenciales son:
          <br />
          <strong>Email:</strong> {email}
          <br />
          <strong>Contraseña:</strong> {cedula} (cédula)
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-2">
            <Label>Nombre</Label>
            <Input
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Nombre del usuario"
            />
          </div>

          <div className="space-y-2">
            <Label>Correo electrónico</Label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="usuario@email.com"
            />
          </div>

          <div className="space-y-2">
            <Label>Cédula (será la contraseña inicial)</Label>
            <Input
              value={cedula}
              onChange={(e) => setCedula(e.target.value)}
              placeholder="12345678"
            />
            <p className="text-xs text-muted-foreground">
              El usuario podrá cambiar su contraseña después
            </p>
          </div>

          {error && (
            <div className="rounded-md bg-error/10 p-2 text-sm text-error">
              {error}
            </div>
          )}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <UserPlus className="h-4 w-4 mr-2" />
            )}
            Crear usuario
          </Button>
        </form>
      )}
    </div>
  );
}
