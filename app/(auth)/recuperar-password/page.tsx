import { RecuperarPasswordForm } from "@/components/auth/RecuperarPasswordForm";

export default function RecuperarPasswordPage() {
  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold text-foreground">Recuperar Contraseña</h1>
        <p className="text-muted-foreground text-sm">
          Ingresa tu email y te enviaremos un enlace para restablecer tu contraseña
        </p>
      </div>
      <RecuperarPasswordForm />
    </div>
  );
}
