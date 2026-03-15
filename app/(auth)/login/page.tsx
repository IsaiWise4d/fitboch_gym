import { Suspense } from "react";
import { LoginForm } from "@/components/auth/LoginForm";

export default function LoginPage() {
  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold text-foreground">FitBoch</h1>
        <p className="text-muted-foreground text-sm">
          Inicia sesión para acceder a tu cuenta
        </p>
      </div>
      <Suspense fallback={<p className="text-sm text-muted-foreground">Cargando formulario...</p>}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
