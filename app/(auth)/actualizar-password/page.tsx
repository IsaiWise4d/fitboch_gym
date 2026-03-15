import { ActualizarPasswordForm } from "@/components/auth/ActualizarPasswordForm";

export default function ActualizarPasswordPage() {
  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold text-foreground">Actualizar Contraseña</h1>
        <p className="text-muted-foreground text-sm">
          Ingresa tu nueva contraseña para acceder a tu cuenta
        </p>
      </div>
      <ActualizarPasswordForm />
    </div>
  );
}