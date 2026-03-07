import { BottomNav } from "@/components/shared/BottomNav";
import { LogoutButton } from "@/components/shared/LogoutButton";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function UsuarioLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("perfil_completo")
    .eq("id", user.id)
    .single();

  // Si el perfil no está completo, solo permitir acceso a /perfil
  const perfilCompleto = profile?.perfil_completo ?? false;

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="flex items-center justify-between px-4 py-3 border-b border-border">
        <span className="text-sm font-bold text-primary">FitBoch</span>
        <LogoutButton />
      </header>
      <main className="flex-1 pb-20">
        {!perfilCompleto ? (
          <CompletarPerfilBanner>{children}</CompletarPerfilBanner>
        ) : (
          children
        )}
      </main>
      <BottomNav />
    </div>
  );
}

function CompletarPerfilBanner({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <div className="mx-4 mt-4 rounded-lg bg-warning/10 border border-warning/30 p-3">
        <p className="text-sm font-medium text-warning">
          Completa tu perfil
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          Para acceder a todas las funciones, ve a tu{" "}
          <a href="/perfil" className="text-primary underline">
            perfil
          </a>{" "}
          y completa tu información personal.
        </p>
      </div>
      {children}
    </div>
  );
}
