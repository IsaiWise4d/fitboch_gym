import Link from "next/link";
import { UserCog } from "lucide-react";
import { BottomNav } from "@/components/shared/BottomNav";
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
    .select("rol, perfil_completo")
    .eq("id", user.id)
    .single();

  // Los admins siempre van a su panel, no al de usuarios
  if (profile?.rol === "admin") redirect("/admin");

  // Si el perfil no está completo, solo permitir acceso a /perfil
  const perfilCompleto = profile?.perfil_completo ?? false;

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <header className="sticky top-0 z-40 border-b border-border bg-background/85 pt-[env(safe-area-inset-top)] backdrop-blur-md">
        <div className="mx-auto flex h-12 max-w-2xl items-center justify-between px-4">
          <Link
            href="/dashboard"
            className="-mx-2 rounded-md px-2 py-1.5 text-sm font-bold tracking-tight text-primary transition-opacity hover:opacity-80"
          >
            FitBoch
          </Link>
        </div>
      </header>
      <main className="mx-auto w-full max-w-2xl flex-1 pb-[calc(5rem+env(safe-area-inset-bottom))]">
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
      <Link
        href="/perfil"
        className="mx-4 mt-4 flex items-start gap-3 rounded-xl border border-warning/30 bg-warning/10 p-3 transition-colors hover:bg-warning/15 active:scale-[0.99]"
      >
        <UserCog className="mt-0.5 h-5 w-5 shrink-0 text-warning" aria-hidden="true" />
        <div>
          <p className="text-sm font-medium text-warning">Completa tu perfil</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Para acceder a todas las funciones, completa tu información personal.{" "}
            <span className="font-medium text-primary underline underline-offset-2">
              Ir a mi perfil
            </span>
          </p>
        </div>
      </Link>
      {children}
    </div>
  );
}
